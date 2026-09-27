/*!
 * css.v1.js - state -> custom CSS for an OBS browser source (no UI)
 *
 * Target page: https://ccfolia.com/rooms/{room}/characters/{character}
 * DOM, read from CCFOLIA's bundle (2026-09-14):
 *
 *   #root > div(padding 8px) > div(flex)
 *     span.MuiBadge-root > div.MuiAvatar-root > div > div.MuiAvatar-root > img.MuiAvatar-img
 *                        + span.MuiBadge-badge            (initiative; .MuiBadge-invisible when 0)
 *     div > div[variant="bar"]                             (the first 8 statuses)
 *       div                                                one status ("row")
 *         div(absolute)  > p.MuiTypography-body2 (label) + p.MuiTypography-body2 (<span color>value</span>/max)
 *         div(16px)      > div (track, opacity .38) + div (fill, style="width: N%")
 *
 * span[color="secondary"] is set when value / max <= 0.8.
 * The fill's style attribute serializes as "width: 83.3333%;", so remaining-ratio
 * thresholds are matched with [style^="width: 8"] style selectors.
 *
 * Every declaration gets !important (the page adds its own styles after OBS
 * injects ours), except properties that decorations animate: an !important
 * declaration would override the animation.
 */
(function () {
  "use strict";

  const P = window.BarPresets, S = window.BarShapes;

  const SEL = {
    root: "#root",
    wrap: "#root > div",
    item: "#root > div > div",
    badge: ".MuiBadge-root",
    avatar: ".MuiBadge-root > .MuiAvatar-root",
    initiative: ".MuiBadge-root > .MuiBadge-badge",
    side: ".MuiBadge-root + div",
    bars: '[variant="bar"]',
    row: '[variant="bar"] > div',
  };

  const PART = {
    text: " > div:nth-child(1)",
    label: " > div:nth-child(1) > :nth-child(1)",
    value: " > div:nth-child(1) > :nth-child(2)",
    current: " > div:nth-child(1) > :nth-child(2) > span",
    box: " > div:nth-child(2)",
    track: " > div:nth-child(2) > div:nth-child(1)",
    fill: " > div:nth-child(2) > div:nth-child(2)",
  };

  const row = i => (i ? `${SEL.row}:nth-child(${i})` : SEL.row);

  // ---------------------------------------------------------------- values

  const round = (v, k) => Math.round(v * (k || 100)) / (k || 100);
  const px = v => `${round(v, 10)}px`;

  function hexToRgb(hex) {
    let h = String(hex || "#000").replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    const v = parseInt(h.slice(0, 6), 16) || 0;
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }

  function rgba(hex, alpha) {
    const a = Math.max(0, Math.min(1, alpha == null ? 1 : alpha));
    return a >= 1 ? String(hex).toLowerCase() : `rgba(${hexToRgb(hex).join(", ")}, ${round(a)})`;
  }

  function cssString(text) {
    return '"' + String(text).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\A ") + '"';
  }

  const safeComment = text => String(text).replace(/\*\//g, "* /");

  // ---------------------------------------------------------------- fonts

  const font = key => P.FONTS[key] || P.FONTS.notosans;

  function weightOf(key, wanted) {
    const list = font(key).weights;
    if (!list) return wanted;
    return list.reduce((best, w) => (Math.abs(w - wanted) < Math.abs(best - wanted) ? w : best), list[0]);
  }

  // name: the typed family for the "pc" font (a font installed on the PC; no import).
  function family(key, name) {
    const f = font(key);
    if (key !== "pc") return `"${f.family}", ${f.stack}`;
    const typed = pcName(name);
    return typed ? `${cssString(typed)}, ${f.stack}` : f.stack;
  }

  const pcName = name => String(name || "").replace(/[\r\n]+/g, " ").trim();

  // uses: [key, weight, typedName]. A PC font shows up only if OBS's PC has it too.
  function pcFontNote(uses) {
    const names = [...new Set(uses.filter(([key]) => key === "pc").map(([, , name]) => pcName(name)).filter(Boolean))];
    if (!names.length) return [];
    return ["   ■ 本機字型（執行 OBS 的電腦也要安裝）", `       ${safeComment(names.join(" / "))}`];
  }

  function fontImports(uses) {
    const map = new Map();
    for (const [key, weight] of uses) {
      const f = font(key);
      if (!f.weights) continue;
      if (!map.has(f.family)) map.set(f.family, new Set());
      map.get(f.family).add(weightOf(key, weight));
    }
    return [...map].map(([name, set]) => {
      const weights = [...set].sort((a, b) => a - b).join(";");
      return `@import url("https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:wght@${weights}&display=swap");`;
    });
  }

  function textShadow(t) {
    const c = rgba(t.outlineColor, t.outlineAlpha);
    if (t.outline === "shadow") return `0 0 3px ${c}, 0 1px 2px ${c}, 1px 0 2px ${c}, -1px 0 2px ${c}`;
    if (t.outline === "glow") return `0 0 4px ${c}, 0 0 10px ${c}, 0 0 18px ${c}`;
    if (t.outline === "stroke") {
      const steps = t.outlineW <= 1 ? 8 : 16, list = [];
      for (let i = 0; i < steps; i++) {
        const a = Math.PI * 2 * i / steps;
        list.push(`${px(Math.cos(a) * t.outlineW)} ${px(Math.sin(a) * t.outlineW)} 0 ${c}`);
      }
      return list.join(", ");
    }
    return "none";
  }

  // ---------------------------------------------------------------- writer

  function Writer() {
    this.out = [];
  }
  Writer.prototype.add = function (selectors, decls, soft) {
    const keep = new Set(soft || []);
    const lines = Object.entries(decls)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `  ${k}: ${v}${keep.has(k) ? "" : " !important"};`);
    if (!lines.length) return;
    const sel = Array.isArray(selectors) ? selectors.join(",\n") : selectors;
    this.out.push(`${sel} {\n${lines.join("\n")}\n}`);
  };
  Writer.prototype.comment = function (text) {
    this.out.push(`\n/* ---------- ${safeComment(text)} ---------- */`);
  };
  Writer.prototype.raw = function (text) {
    this.out.push(text);
  };

  // ---------------------------------------------------------------- geometry

  function geometry(st) {
    const L = st.layout, T = st.text, A = st.avatar;
    const count = Math.min(8, Math.max(1, L.count));
    const iconCol = st.icons.show ? st.icons.size + st.icons.gap : 0;
    let qW = L.width - iconCol;
    if (L.textLayout === "side") qW -= L.labelW + L.valueW + L.textGap * 2;
    if (L.textLayout === "labelSide") qW -= L.labelW + L.textGap;
    qW = Math.max(16, qW);
    const textH = Math.ceil(Math.max(T.showLabel ? T.labelSize : 0, T.valueMode !== "none" ? T.valueSize : 0) * 1.15);
    const stacked = L.textLayout === "above" || L.textLayout === "below";
    const rowH = stacked ? textH + L.textGap + L.height : L.textLayout === "overlay" ? L.height : Math.max(L.height, textH);
    let barsW = L.width, barsH = count * rowH + (count - 1) * L.gap;
    if (L.direction === "row") {
      barsW = count * L.width + (count - 1) * L.gap;
      barsH = rowH;
    }
    if (L.direction === "grid") {
      const cols = Math.min(L.columns, count), rows = Math.ceil(count / cols);
      barsW = cols * L.width + (cols - 1) * L.gap;
      barsH = rows * rowH + (rows - 1) * L.gap;
    }
    const itemW = !A.show ? barsW : A.pos === "top" ? Math.max(A.w, barsW) : A.w + A.gap + barsW;
    const itemH = !A.show ? barsH : A.pos === "top" ? A.h + A.gap + barsH : Math.max(A.h, barsH);
    return { count, iconCol, qW, textH, rowH, barsW, barsH, itemW, itemH };
  }

  function rowTemplate(st, g) {
    const L = st.layout, icon = g.iconCol > 0;
    const H = px(L.height), gap = px(L.textGap), ic = icon ? px(g.iconCol) + " " : "";
    const a = text => `"${icon ? "i " : ""}${text}"`;
    switch (L.textLayout) {
      case "above": return { areas: `${a("l n")} ${a(". .")} ${a("q q")}`, cols: `${ic}minmax(0, 1fr) auto`, rows: `auto ${gap} ${H}` };
      case "below": return { areas: `${a("q q")} ${a(". .")} ${a("l n")}`, cols: `${ic}minmax(0, 1fr) auto`, rows: `${H} ${gap} auto` };
      case "side": return { areas: a("l . q . n"), cols: `${ic}${px(L.labelW)} ${gap} ${px(g.qW)} ${gap} ${px(L.valueW)}`, rows: `minmax(${H}, auto)` };
      case "labelSide": return { areas: a("l . q"), cols: `${ic}${px(L.labelW)} ${gap} ${px(g.qW)}`, rows: `minmax(${H}, auto)` };
      default: return { areas: a("q"), cols: `${ic}${px(g.qW)}`, rows: H };
    }
  }

  function trackBackground(B) {
    if (B.track === "none") return "transparent";
    const dark = rgba(B.trackColor, B.trackAlpha);
    if (B.track !== "tint") return dark;
    const mix = `color-mix(in srgb, var(--c1) ${Math.round(B.tint * 100)}%, transparent)`;
    return `linear-gradient(${mix}, ${mix}), ${dark}`;
  }

  // Longhands, so background-position can stay animatable.
  function fillBackground(B, g) {
    const img = (image, size, repeat) => ({ "background-color": "var(--c1)", "background-image": image, "background-size": size || "100% 100%", "background-repeat": repeat || "no-repeat", "background-position": "0 0" });
    switch (B.fill) {
      case "flat": return img("none");
      case "hgrad": return img("linear-gradient(90deg, var(--c2), var(--c1))", `${px(g.qW)} 100%`);
      case "gloss": return img("linear-gradient(180deg, color-mix(in srgb, var(--c1) 60%, #fff) 0%, var(--c1) 49%, var(--c2) 51%, var(--c2) 100%)");
      case "stripes": return img("linear-gradient(45deg, var(--c1) 25%, var(--c2) 25% 50%, var(--c1) 50% 75%, var(--c2) 75%)", "24px 24px", "repeat");
      case "neon": return img("linear-gradient(180deg, var(--c2) 0%, var(--c1) 30%, color-mix(in srgb, var(--c1) 35%, #fff) 50%, var(--c1) 70%, var(--c2) 100%)");
      default: return img("linear-gradient(180deg, var(--c1), var(--c2))");
    }
  }

  // ---------------------------------------------------------------- name

  function nameRules(ctx, w) {
    const { st, g } = ctx, N = st.name, T = st.text, B = st.bar, A = st.avatar;
    // #root's own pseudo-elements are left free for decorations (the frame).
    const host = { top: `${SEL.wrap}::before`, bottom: `${SEL.wrap}::after`, left: `${SEL.wrap}::before`, barsTop: `${SEL.side}::before`, avatar: `${SEL.badge}::after` }[N.pos];
    const width = { top: g.itemW, bottom: g.itemW, barsTop: g.barsW, avatar: A.w }[N.pos];
    const accent = N.useCharColor ? "var(--pc)" : N.accent;
    const auto = N.style === "tab" || N.style === "badge";
    const decls = {
      content: "var(--name)", display: "block", margin: "0", "box-sizing": "border-box",
      "font-family": family(N.font, N.fontName), "font-size": px(N.size), "font-weight": weightOf(N.font, N.weight),
      color: N.color, "line-height": "1.3", "letter-spacing": "0.04em", "font-feature-settings": '"palt"', "text-align": N.align,
      "text-shadow": N.style === "text" || N.style === "underline" ? textShadow(T) : T.outline === "none" ? "none" : "0 1px 2px rgba(0, 0, 0, 0.55)",
    };
    Object.assign(decls, {
      plate: { padding: "0.4em 0.7em", background: rgba(N.bg, N.bgAlpha), border: B.borderW > 0 ? `${px(B.borderW)} solid ${rgba(B.borderColor, B.borderAlpha)}` : "none", "border-radius": px(B.shape === "pill" ? 999 : Math.min(B.radius, 12)) },
      text: { padding: "0", background: "none", border: "none" },
      underline: { padding: "0 0.1em 0.25em", background: "none", border: "none", "border-bottom": `2px solid ${accent}` },
      sidebar: { padding: "0.35em 0.7em", background: rgba(N.bg, N.bgAlpha), border: "none", "border-left": `4px solid ${accent}` },
      tab: { padding: "0.3em 0.9em", background: accent, border: "none", "border-radius": "0.45em 0.45em 0 0" },
      badge: { padding: "0.25em 0.9em", background: accent, border: "none", "border-radius": "999px" },
    }[N.style] || {});

    if (N.pos === "left") {
      Object.assign(decls, { "white-space": "nowrap" });
      if (N.vertical) {
        decls["writing-mode"] = "vertical-rl";
        // A long vertical name wraps into a second column instead of growing taller than the bars.
        if (N.fitHeight) Object.assign(decls, { "white-space": "normal", "max-height": px(Math.max(g.itemH, N.size * 3)) });
      }
    } else if (N.overflow === "wrap") {
      Object.assign(decls, { width: auto ? "auto" : px(width), "max-width": px(width), "white-space": "normal", "overflow-wrap": "anywhere" });
    } else if (N.overflow === "ellipsis") {
      Object.assign(decls, { width: auto ? "auto" : px(width), "max-width": px(width), "white-space": "nowrap", overflow: "hidden", "text-overflow": "ellipsis" });
    } else {
      Object.assign(decls, { width: "auto", "min-width": auto ? "0" : px(width), "white-space": "nowrap" });
    }
    if (auto && N.pos !== "avatar") decls["align-self"] = { left: "flex-start", center: "center", right: "flex-end" }[N.align];
    if (N.pos === "avatar") {
      Object.assign(decls, { position: "absolute", left: "0", right: "0", bottom: "0", width: "auto", "max-width": "none", "z-index": "1", "text-align": "center",
        "border-radius": `0 0 ${px(Math.max(0, A.radius - A.borderW))} ${px(Math.max(0, A.radius - A.borderW))}` });
      if (N.style === "text" || N.style === "underline") {
        Object.assign(decls, { padding: "0.9em 0.3em 0.35em", background: `linear-gradient(transparent, ${rgba(N.bg, Math.max(N.bgAlpha, 0.6))})` });
      }
    }
    w.comment("名稱");
    w.add(host, decls);
  }

  // ---------------------------------------------------------------- build

  function build(st, opts) {
    opts = opts || {};
    const g = geometry(st);
    const L = st.layout, B = st.bar, T = st.text, N = st.name, A = st.avatar, I = st.initiative;
    const d = S.path(B.shape, g.qW, L.height, B);
    const clip = `path("${d}")`;
    const nameText = opts.name == null ? "探索者名稱" : String(opts.name);
    const showName = N.pos !== "none" && nameText.trim() !== "" && !(N.pos === "avatar" && !A.show);

    const extra = new Writer();
    const ctx = {
      st, g, d, clip, SEL, PART, row, rgba, px, round, cssString, textShadow, S,
      w: extra, boxLayers: [], boxFilters: [], rootDecls: {}, fillAnimations: [], keyframes: new Map(), baseFilter: "none",
    };
    ctx.keyframe = (name, body) => ctx.keyframes.set(name, body);

    // On CCFOLIA #root fills the page height; size it to its content so a panel ends with the bars.
    Object.assign(ctx.rootDecls, {
      display: "block", width: "max-content", height: "auto", "min-height": "0", "max-height": "none",
      "align-self": "flex-start", padding: "0", position: "relative",
    });
    ctx.rootExtent = 0;

    if (window.BarDeco) window.BarDeco.decorate(ctx);
    ctx.rootDecls.margin = px(L.outer + Math.max(0, ctx.rootExtent));
    const filters = [];
    if (B.shadow > 0) filters.push(`drop-shadow(0 2px 5px rgba(0, 0, 0, ${round(B.shadow)}))`);
    filters.push(...ctx.boxFilters);
    ctx.baseFilter = filters.length ? filters.join(" ") : "none";
    if (B.fill === "stripes" && B.flow) {
      ctx.fillAnimations.push("sb-stripes 0.9s linear infinite");
      ctx.keyframe("sb-stripes", "to { background-position: 24px 0; }");
    }

    const uses = [];
    if (T.showLabel) uses.push([T.labelFont, T.weight, T.labelFontName]);
    if (T.valueMode !== "none" || I.show) uses.push([T.valueFont, T.weight, T.valueFontName]);
    if (showName) uses.push([N.font, N.weight, N.fontName]);

    const w = new Writer();
    const design = P.DESIGNS[st.design];
    w.raw([
      "/* ==========================================================================",
      "   CCFOLIA → OBS  狀態條",
      `   由狀態條產生器製作${design ? `（設計範本：${safeComment(design.label)}）` : ""}`,
      "   --------------------------------------------------------------------------",
      "   ■ 瀏覽器來源的網址",
      `       ${safeComment(opts.url || "https://ccfolia.com/rooms/{房間ID}/characters/{角色ID}")}`,
      ...(opts.size ? ["   ■ 瀏覽器來源尺寸", `       寬 ${opts.size.w} / 高 ${opts.size.h}${opts.sizeNote ? `（${safeComment(opts.sizeNote)}）` : ""}`] : []),
      "   ■ CCFOLIA 端",
      "       角色「狀態」的排列順序，會對應由上而下第 1 條、第 2 條…的顏色。",
      ...pcFontNote(uses),
      "   ========================================================================== */",
    ].join("\n"));

    const imports = fontImports(uses);
    if (imports.length) w.raw(imports.join("\n"));

    w.raw(`\n/* ★每個角色只需要改這裡★ */\n:root {\n  --name: ${cssString(nameText)};  /* 名稱。雙引號請勿刪除 */\n  --pc: ${opts.color || N.accent};  /* 角色的顏色 */\n}`);

    w.comment("背景透明化，移除多餘的元素");
    w.add("html, body", { background: "transparent", margin: "0", padding: "0", overflow: "hidden" });
    w.add("::-webkit-scrollbar", { display: "none" });
    w.add(".MuiSnackbar-root", { display: "none" });

    w.comment("整體排版");
    w.add(SEL.root, ctx.rootDecls);
    const nameSide = showName && N.pos === "left";
    w.add(SEL.wrap, {
      display: "flex", "flex-direction": nameSide ? "row" : "column", "align-items": nameSide ? "center" : "flex-start",
      gap: showName && ["top", "bottom", "left"].includes(N.pos) ? px(N.gap) : "0", margin: "0", padding: "0",
    });
    w.add(SEL.item, {
      display: "flex", "flex-direction": A.show ? { left: "row", right: "row-reverse", top: "column" }[A.pos] : "row",
      "align-items": A.show && A.pos !== "top" ? "center" : "flex-start", gap: A.show ? px(A.gap) : "0", margin: "0", padding: "0",
    });

    w.comment("角色頭像 / 先攻值");
    if (A.show) {
      w.add(SEL.badge, { display: "inline-flex", flex: "none", margin: "0", position: "relative", overflow: "visible", "vertical-align": "top" });
      w.add(SEL.avatar, {
        width: px(A.w), height: px(A.h), margin: "0", "box-sizing": "border-box", "border-radius": px(A.radius),
        border: A.borderW > 0 ? `${px(A.borderW)} solid ${A.useCharColor ? "var(--pc)" : rgba(A.borderColor, A.borderAlpha)}` : "none",
        background: rgba(A.bg, A.bgAlpha),
      });
      w.add(`${SEL.avatar} > *`, { display: "block", width: "100%", height: "100%" });
      w.add(`${SEL.badge} .MuiAvatar-root .MuiAvatar-root`, { width: "100%", height: "100%", "border-radius": "0", background: "transparent" });
      w.add(`${SEL.badge} .MuiAvatar-img`, { "object-fit": A.fit === "contain" ? "contain" : "cover", "object-position": A.fit === "top" ? "center top" : "center" });
    } else {
      w.add(SEL.badge, { display: "none" });
    }
    if (A.show && I.show) {
      const off = px(-I.size * 0.3);
      const corner = { tl: { top: off, left: off, right: "auto", bottom: "auto" }, tr: { top: off, right: off, left: "auto", bottom: "auto" },
        bl: { bottom: off, left: off, top: "auto", right: "auto" }, br: { bottom: off, right: off, top: "auto", left: "auto" } }[I.corner];
      w.add(SEL.initiative, Object.assign({
        display: "flex", "min-width": px(I.size), height: px(I.size), padding: `0 ${px(I.size * 0.25)}`, "border-radius": px(I.size / 2),
        "font-family": family(T.valueFont, T.valueFontName), "font-size": px(I.size * 0.58), "font-weight": weightOf(T.valueFont, T.weight), "line-height": "1",
        color: I.color, background: I.bg, transform: "none", "z-index": "2", "box-shadow": "0 1px 3px rgba(0, 0, 0, 0.5)",
      }, corner));
      w.add(`${SEL.badge} > .MuiBadge-invisible`, { display: "none" });
    } else {
      w.add(SEL.initiative, { display: "none" });
    }

    w.comment("狀態條排列");
    w.add(SEL.side, { flex: "none", display: "flex", "flex-direction": "column", gap: showName && N.pos === "barsTop" ? px(N.gap) : "0", margin: "0", padding: "0" });
    const barsDecl = { margin: "0", padding: "0", "max-width": "none", gap: px(L.gap) };
    if (L.direction === "grid") Object.assign(barsDecl, { display: "grid", "grid-template-columns": `repeat(${Math.min(L.columns, g.count)}, ${px(L.width)})` });
    else Object.assign(barsDecl, { display: "flex", "flex-direction": L.direction === "row" ? "row" : "column", "flex-wrap": "nowrap" });
    w.add(SEL.bars, barsDecl);

    w.comment("逐條顏色（由上而下第 1 條、第 2 條…）");
    st.bars.forEach((b, i) => {
      const vars = { "--c1": b.c1, "--c2": b.c2 };
      if (st.icons.show) vars["--icon"] = S.iconUrl(b.icon);
      w.add(row(i + 1), vars);
    });
    if (L.hideExtra) w.add(`${SEL.row}:nth-child(n+${g.count + 1})`, { display: "none" });

    w.comment("單一狀態條的容器");
    const tpl = rowTemplate(st, g);
    w.add(SEL.row, {
      display: "grid", "grid-template-areas": tpl.areas, "grid-template-columns": tpl.cols, "grid-template-rows": tpl.rows,
      gap: "0", "align-items": "center", width: px(L.width), height: "auto", margin: "0", padding: "0", "box-sizing": "border-box",
      position: "relative", cursor: "default",
    });
    w.add(SEL.row + PART.text, { display: "contents" });

    w.comment("標籤與數值");
    w.add([SEL.row + PART.label, SEL.row + PART.value], {
      position: "relative", "z-index": "2", display: "block", margin: "0", padding: "0", overflow: "visible",
      "white-space": "nowrap", "line-height": "1", "letter-spacing": `${T.spacing}em`, "text-shadow": textShadow(T),
    });
    const labelHidden = !T.showLabel || (L.textLayout === "overlay" && L.align === "center");
    const labelPlace = {
      overlay: { "grid-area": "q", "justify-self": "start", "padding-left": px(L.pad) },
      above: { "grid-area": "l", "justify-self": "start", "align-self": "end" },
      below: { "grid-area": "l", "justify-self": "start", "align-self": "start" },
      side: { "grid-area": "l", "justify-self": "start" },
      labelSide: { "grid-area": "l", "justify-self": "start" },
    }[L.textLayout];
    if (labelHidden) {
      w.add(SEL.row + PART.label, { display: "none" });
    } else {
      w.add(SEL.row + PART.label, Object.assign({
        "font-family": family(T.labelFont, T.labelFontName), "font-size": px(T.labelSize), "font-weight": weightOf(T.labelFont, T.weight),
        color: T.labelByBar ? "var(--c1)" : T.color,
      }, labelPlace));
      st.bars.slice(0, g.count).forEach((b, i) => {
        if (!b.label) return;
        w.add(row(i + 1) + PART.label, { "font-size": "0" });
        w.add(row(i + 1) + PART.label + "::before", { content: cssString(b.label), "font-size": px(T.labelSize) });
      });
    }
    const valuePlace = {
      overlay: L.align === "split" ? { "grid-area": "q", "justify-self": "end", "padding-right": px(L.pad) } : { "grid-area": "q", "justify-self": "center" },
      above: { "grid-area": "n", "justify-self": "end", "align-self": "end" },
      below: { "grid-area": "n", "justify-self": "end", "align-self": "start" },
      side: { "grid-area": "n", "justify-self": "end" },
      labelSide: { "grid-area": "q", "justify-self": "end", "padding-right": px(L.pad) },
    }[L.textLayout];
    if (T.valueMode === "none") {
      w.add(SEL.row + PART.value, { display: "none" });
    } else {
      w.add(SEL.row + PART.value, Object.assign({
        "font-family": family(T.valueFont, T.valueFontName), "font-size": T.valueMode === "both" ? px(T.maxSize) : "0", "font-weight": weightOf(T.valueFont, T.weight),
        color: rgba(T.subColor, T.subAlpha), "font-variant-numeric": "tabular-nums",
      }, valuePlace));
      w.add(SEL.row + PART.current, {
        "font-size": px(T.valueSize), color: T.color, "margin-right": T.valueMode === "both" ? "0.12em" : "0", "letter-spacing": `${T.spacing}em`,
      }, ["color"]);
    }

    w.comment("狀態條本體（底色與伸縮的部分）");
    w.add(SEL.row + PART.box, {
      "grid-area": "q", position: "relative", width: px(g.qW), height: px(L.height), margin: "0", padding: "0",
      "box-sizing": "border-box", "align-self": "center", "z-index": "1", filter: ctx.baseFilter,
    }, ["filter"]);
    const mask = B.segments > 1 ? (() => {
      const step = (g.qW + B.segGap) / B.segments, solid = px(step - B.segGap);
      const image = `repeating-linear-gradient(90deg, #000 0 ${solid}, transparent ${solid} ${px(step)})`;
      return { "-webkit-mask-image": image, "mask-image": image };
    })() : {};
    w.add(SEL.row + PART.track, Object.assign({
      position: "absolute", left: "0", top: "0", width: "100%", height: "100%", margin: "0", padding: "0",
      opacity: "1", "border-radius": "0", background: trackBackground(B), "clip-path": clip,
    }, mask));
    w.add(SEL.row + PART.fill, Object.assign({
      position: "absolute", left: "0", top: "0", height: "100%", margin: "0", padding: "0", opacity: "1",
      "border-radius": "0", overflow: "hidden", "clip-path": clip,
      transition: B.speed > 0 ? `width ${round(B.speed)}s ease-out` : "none",
      animation: ctx.fillAnimations.length ? ctx.fillAnimations.join(", ") : "none",
    }, fillBackground(B, g), mask), ["opacity", "background-position"]);

    const layers = [];
    if (B.borderW > 0) {
      layers.push({ image: S.borderUrl(d, g.qW, L.height, { width: B.borderW, color: B.borderColor, alpha: B.borderAlpha, double: B.double }), size: "100% 100%", position: "0 0", repeat: "no-repeat" });
    }
    layers.push(...ctx.boxLayers);
    if (layers.length) {
      w.add(SEL.row + PART.box + "::after", {
        content: '""', position: "absolute", left: "0", top: "0", width: "100%", height: "100%", "pointer-events": "none", "z-index": "2",
        "clip-path": clip, "background-image": layers.map(l => l.image).join(", "),
        "background-size": layers.map(l => l.size).join(", "), "background-position": layers.map(l => l.position).join(", "),
        "background-repeat": layers.map(l => l.repeat).join(", "),
      });
    }

    if (st.icons.show) {
      w.comment("圖示");
      w.add(SEL.row + "::before", {
        content: '""', "grid-area": "i", display: "block", width: px(st.icons.size), height: px(st.icons.size), "align-self": "center",
        "justify-self": "start", "background-color": "var(--c1)",
        "-webkit-mask": "var(--icon) center / contain no-repeat", mask: "var(--icon) center / contain no-repeat",
      });
      st.bars.forEach((b, i) => { if (b.icon === "none") w.add(row(i + 1) + "::before", { visibility: "hidden" }); });
    }

    if (showName) nameRules(ctx, w);

    if (extra.out.length) {
      w.comment("裝飾");
      w.out.push(...extra.out);
    }
    ctx.w = w;
    if (window.BarDeco) window.BarDeco.alerts(ctx);

    for (const [name, body] of ctx.keyframes) w.raw(`@keyframes ${name} { ${body} }`);
    return w.out.join("\n") + "\n";
  }

  window.BarCss = { build, geometry, SEL, PART, rgba, weightOf, family };
})();
