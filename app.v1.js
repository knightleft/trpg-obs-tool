/*!
 * app.v1.js - 狀態條產生器 (UI)
 *
 * The whole project is one plain JSON object (`state`), so undo, autosave and
 * project files are all snapshots of it.
 *
 * Controls are wired declaratively from the HTML:
 *   data-bind="bar.radius"        read/write that path (array indexes allowed: "bars.2.c1")
 *   data-out="..." data-fmt="px"  shows the value next to a slider
 *   data-show="a=x|y&b!=z"        visible only while the condition holds
 *   data-options="SHAPES"         select filled from BarPresets
 *   data-nohistory                changes don't create an undo step (preview values)
 */
(function () {
  "use strict";

  const P = window.BarPresets, M = window.BarModel, C = window.BarCss, K = window.BarMock;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  const SAVE_KEY = "ccf-statusbar-maker.state";
  const TAB_KEY = "ccf-statusbar-maker.tab";
  const TOP_TAB_KEY = "ccf-statusbar-maker.toptab";
  const PROBE_NAME = "探索者的名字共十個字";

  let state = M.defaultState();
  let previewAvatar = null;
  let frameDoc = null;
  let lastSize = { w: 0, h: 0 };
  const history = { undo: [], redo: [], last: null };

  // ---------------------------------------------------------------- paths

  function resolveTarget(path) {
    const parts = path.split(".");
    let obj = state;
    for (let i = 0; i < parts.length - 1 && obj != null; i++) obj = obj[parts[i]];
    return obj == null ? null : { obj, key: parts[parts.length - 1] };
  }

  function getPath(path) {
    const t = resolveTarget(path);
    return t ? t.obj[t.key] : undefined;
  }

  function setPath(path, value) {
    const t = resolveTarget(path);
    if (t) t.obj[t.key] = value;
  }

  function status(message, isError) {
    const el = $("#status");
    el.textContent = message;
    el.classList.toggle("error", !!isError);
  }

  // ---------------------------------------------------------------- controls

  function readInput(el) {
    if (el.type === "checkbox") return el.checked;
    if (el.type === "range" || el.type === "number" || el.hasAttribute("data-number")) return Number(el.value);
    return el.value;
  }

  function labelFor(el) {
    if (el.getAttribute("aria-label")) return;
    const label = el.closest(".row")?.querySelector(":scope > label");
    if (label && label.textContent.trim()) el.setAttribute("aria-label", label.textContent.trim());
  }

  // dragging: a slider is still being dragged. Chromium drops the drag when rows around the slider
  // appear, disappear or get rebuilt, so those updates wait for the "change" event on release.
  function afterChange(path, dragging) {
    if (dragging) {
      updateOutputs();
      return;
    }
    if (path === "layout.count") {
      renderBarList();
      renderTester();
    } else if (/^preview\.statuses\.\d+\.2$/.test(path)) {
      const i = Number(path.split(".")[2]);
      const range = $(`[data-bind="preview.statuses.${i}.1"]`);
      if (range) range.max = String(Math.max(1, state.preview.statuses[i][2]));
    } else if (path.startsWith("characters.")) {
      updateCharNotes();
      fillPreviewSelect();
    }
    updateVisibility();
    updateOutputs();
  }

  function bindControls(root) {
    for (const el of root.querySelectorAll("[data-bind]")) {
      if (el.dataset.bound) continue;
      el.dataset.bound = "1";
      labelFor(el);
      const noHistory = el.hasAttribute("data-nohistory");
      const apply = commitAfter => () => {
        const value = readInput(el);
        if (typeof value === "number" && !Number.isFinite(value)) return;
        setPath(el.dataset.bind, value);
        afterChange(el.dataset.bind, el.type === "range" && !commitAfter);
        if (commitAfter) noHistory ? scheduleSave() : commit();
        // Overview fields don't affect any character's CSS or box size, so they skip the
        // CSS-preview render/measure pipeline entirely instead of just piggybacking on it.
        if (el.dataset.bind.startsWith("overview.")) renderOverview();
        else requestRender();
      };
      if (el.type !== "number") el.addEventListener("input", apply(false));
      el.addEventListener("change", apply(true));
    }
  }

  function formatValue(value, fmt) {
    const r = Math.round(value * 100) / 100;
    switch (fmt) {
      case "pct": return Math.round(value * 100) + "%";
      case "px": return r + "px";
      case "sec": return value > 0 ? r + " 秒" : "無";
      case "em": return r.toFixed(2);
      case "bars": return value + " 條";
      case "seg": return value > 1 ? value + " 段" : "無";
      case "under": return "低於 " + value + "%";
      default: return String(r);
    }
  }

  function updateOutputs() {
    for (const out of $$("output[data-out]")) {
      const value = getPath(out.dataset.out);
      if (typeof value === "number") out.textContent = formatValue(value, out.dataset.fmt);
    }
  }

  // "a=x|y" : a is x or y.  "a!=x" : a is not x.  Joined with "&".
  // A "|" right after a value may also start a new clause: "name.style=plate|name.pos=avatar".
  function evalCondition(cond) {
    return cond.split("&").every(part => {
      const clauses = [];
      for (const piece of part.split("|")) {
        if (/^[\w.]+!?=/.test(piece)) clauses.push({ raw: piece, values: [] });
        else if (clauses.length) clauses[clauses.length - 1].values.push(piece);
      }
      return clauses.some(clause => {
        const m = clause.raw.match(/^([\w.]+)(!?=)(.*)$/);
        const hit = [m[3], ...clause.values].includes(String(getPath(m[1])));
        return m[2] === "=" ? hit : !hit;
      });
    });
  }

  function updateVisibility() {
    for (const el of $$("[data-show]")) el.hidden = !evalCondition(el.dataset.show);
  }

  function syncControls() {
    for (const el of $$("[data-bind]")) {
      const typing = el === document.activeElement && el.type === "text";
      if (typing) continue;
      const value = getPath(el.dataset.bind);
      if (value === undefined) continue;
      if (el.type === "checkbox") el.checked = !!value;
      else el.value = value;
    }
    for (const btn of $$("#bgSeg button")) btn.setAttribute("aria-pressed", String(btn.dataset.bg === state.preview.bg));
    $("#stage").className = "stage bg-" + state.preview.bg;
    $("#testInit").value = state.preview.initiative;
    updateVisibility();
    updateOutputs();
    updateHistoryButtons();
  }

  // ---------------------------------------------------------------- generated lists

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function optionsHtml(list) {
    return list.map(([value, text]) => `<option value="${esc(value)}">${esc(text)}</option>`).join("");
  }

  function renderBarList() {
    const box = $("#barList");
    box.innerHTML = state.bars.slice(0, state.layout.count).map((b, i) => `
      <div class="bar-item">
        <span class="num">${i + 1}</span>
        <input type="text" data-bind="bars.${i}.label" placeholder="${esc(state.preview.statuses[i][0])}" aria-label="第 ${i + 1} 條的顯示名稱">
        <input type="color" data-bind="bars.${i}.c1" aria-label="第 ${i + 1} 條的色1">
        <input type="color" data-bind="bars.${i}.c2" aria-label="第 ${i + 1} 條的色2">
        <select data-bind="bars.${i}.icon" aria-label="第 ${i + 1} 條的圖示">${optionsHtml(P.ICONS)}</select>
        <input type="checkbox" data-bind="bars.${i}.low" aria-label="第 ${i + 1} 條套用瀕危效果">
      </div>`).join("");
    bindControls(box);
    syncControls();
  }

  function renderTester() {
    const box = $("#testRows");
    box.innerHTML = state.preview.statuses.slice(0, state.layout.count).map((s, i) => `
      <div class="test-row">
        <input type="text" data-bind="preview.statuses.${i}.0" data-nohistory aria-label="第 ${i + 1} 條的標籤">
        <input type="range" data-bind="preview.statuses.${i}.1" data-nohistory min="0" max="${Math.max(1, s[2])}" step="1" aria-label="第 ${i + 1} 條的目前值">
        <output data-out="preview.statuses.${i}.1"></output>
        <input type="number" data-bind="preview.statuses.${i}.2" data-nohistory min="1" max="9999" aria-label="第 ${i + 1} 條的最大值">
      </div>`).join("");
    bindControls(box);
    syncControls();
  }

  // spec: [prop, label, type, min | options, max, step, fmt, showCondition]
  function decoControl(key, spec) {
    const [prop, label, type, min, max, step, fmt, show] = spec;
    const path = `decos.${key}.${prop}`;
    const row = `<div class="row"${show ? ` data-show="${esc(show)}"` : ""}>`;
    if (type === "check") return `${row}<label></label><label class="check"><input type="checkbox" data-bind="${path}"> ${esc(label)}</label></div>`;
    if (type === "color") return `${row}<label>${esc(label)}</label><input type="color" data-bind="${path}"></div>`;
    if (type === "select") return `${row}<label>${esc(label)}</label><select data-bind="${path}">${optionsHtml(min)}</select></div>`;
    return `${row}<label>${esc(label)}</label><span class="with-value"><input type="range" data-bind="${path}" min="${min}" max="${max}" step="${step}">`
      + `<output data-out="${path}"${fmt ? ` data-fmt="${fmt}"` : ""}></output></span></div>`;
  }

  function renderDecoList() {
    $("#decoList").innerHTML = Object.entries(P.DECO_TYPES).map(([key, T]) => `
      <div class="deco">
        <label class="deco-head"><input type="checkbox" data-bind="decos.${key}.on"> ${esc(T.label)} <small>${esc(T.desc)}</small></label>
        <div data-show="decos.${key}.on=true">${T.controls.map(c => decoControl(key, c)).join("")}</div>
      </div>`).join("");
  }

  // ---------------------------------------------------------------- characters

  function renderCharList() {
    const box = $("#charList");
    box.innerHTML = state.characters.list.map((c, i) => `
      <div class="char" data-char="${esc(c.id)}">
        <div class="char-top">
          <input type="text" data-bind="characters.list.${i}.name" placeholder="名稱（例：林曉嵐）" aria-label="第 ${i + 1} 位角色的名稱">
          <input type="color" data-bind="characters.list.${i}.color" aria-label="第 ${i + 1} 位角色的顏色">
          <button type="button" class="small danger" data-char-action="delete">刪除</button>
        </div>
        <input type="text" data-bind="characters.list.${i}.url" placeholder="角色 ID，或棋子的網址" aria-label="第 ${i + 1} 位角色的角色 ID">
        <div class="btns">
          <button type="button" data-char-action="css">複製 CSS</button>
          <button type="button" data-char-action="url">複製網址</button>
          <button type="button" data-char-action="preview">預覽</button>
        </div>
        <span class="warn" data-char-note></span>
      </div>`).join("");
    bindControls(box);
    syncControls();
    updateCharNotes();
    renderOverview();
  }

  function updateCharNotes() {
    const room = M.parseRoom(state.characters.room);
    for (const el of $$("[data-char]")) {
      const c = state.characters.list.find(x => x.id === el.dataset.char);
      if (!c) continue;
      const hasRoomInUrl = /rooms\//.test(c.url);
      let note = "";
      if (!M.parseCharacter(c.url)) note = "填入角色 ID 後就能產生網址。";
      else if (!room && !hasRoomInUrl) note = "填入房間網址後就能產生網址。";
      else if (!c.name.trim()) note = "名稱是空的，因此不會顯示名稱。";
      el.querySelector("[data-char-note]").textContent = note;
    }
  }

  // Every character shares the same design, so they all measure to the same box size;
  // positions are built from that real measured size, not a guessed formula.
  function overviewRows() {
    const { direction, gap } = state.overview;
    const axisSize = direction === "column" ? lastSize.h : lastSize.w;
    const crossSize = direction === "column" ? lastSize.w : lastSize.h;
    return state.characters.list.map((c, i) => {
      const pos = Math.round(i * (axisSize + gap));
      return {
        c,
        x: direction === "column" ? 0 : pos,
        y: direction === "column" ? pos : 0,
        w: Math.round(direction === "column" ? crossSize : axisSize),
        h: Math.round(direction === "column" ? axisSize : crossSize),
      };
    });
  }

  function renderOverview() {
    const box = $("#overviewList");
    const note = $("#overviewNote");
    const rows = overviewRows();
    const n = rows.length;
    if (!n) {
      box.innerHTML = "";
      note.textContent = "請先在「角色・儲存」分頁新增角色，這裡才能算出版位。";
      renderOverviewStage(rows);
      return;
    }
    const { direction, total, gap } = state.overview;
    const axisSize = direction === "column" ? lastSize.h : lastSize.w;
    const axisLabel = direction === "column" ? "高度" : "寬度";
    const actualTotal = Math.round(n * axisSize + (n - 1) * gap);
    const suggested = Math.round((total - (n - 1) * gap) / n);
    box.innerHTML = `<div class="overview-row overview-head"><span>#</span><span>名稱</span><span>X</span><span>Y</span><span>寬</span><span>高</span><span></span></div>`
      + rows.map((r, i) => `
      <div class="overview-row">
        <span class="num">${i + 1}</span>
        <span>${esc(r.c.name.trim() || "（未命名）")}</span>
        <span>${r.x}</span><span>${r.y}</span><span>${r.w}</span><span>${r.h}</span>
        <button type="button" class="small" data-overview-copy="${i}">複製</button>
      </div>`).join("");
    note.textContent = `目前每人版面${axisLabel}約 ${Math.round(axisSize)}px，${n} 人排列後總${axisLabel}約 ${actualTotal}px。若要符合目標總${axisLabel} ${total}px（含間隔 ${gap}px），每人${axisLabel}建議調整到約 ${suggested}px（可調整左側「單條寬度」等設定接近這個數字）。`;
    renderOverviewStage(rows);
  }

  // ---------------------------------------------------------------- overview preview

  let ovFrames = [];

  function overviewFrameData(c) {
    return {
      css: cssFor(c, null),
      statuses: state.preview.statuses.slice(0, state.layout.count),
      initiative: state.preview.initiative,
      avatar: previewAvatar,
    };
  }

  function renderOverviewStage(rows) {
    const canvas = $("#ovCanvas");
    const stage = $("#ovStage");
    const n = rows.length;

    while (ovFrames.length > n) ovFrames.pop().iframe.remove();
    while (ovFrames.length < n) {
      const iframe = document.createElement("iframe");
      iframe.tabIndex = -1;
      iframe.title = "整合預覽";
      const entry = { iframe, doc: null };
      iframe.addEventListener("load", () => {
        entry.doc = iframe.contentDocument;
        const i = ovFrames.indexOf(entry);
        if (i >= 0 && rows[i]) K.update(entry.doc, overviewFrameData(rows[i].c));
      });
      iframe.srcdoc = K.documentHtml();
      canvas.append(iframe);
      ovFrames.push(entry);
    }

    $("#ovEmpty").hidden = n > 0;
    $("#ovBox").style.display = n > 0 ? "block" : "none";
    if (!n) {
      $("#ovStageInfo").textContent = "";
      return;
    }

    const totalW = Math.max(...rows.map(r => r.x + r.w));
    const totalH = Math.max(...rows.map(r => r.y + r.h));
    rows.forEach((r, i) => {
      const entry = ovFrames[i];
      Object.assign(entry.iframe.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
      if (entry.doc) K.update(entry.doc, overviewFrameData(r.c));
    });
    canvas.style.width = totalW + "px";
    canvas.style.height = totalH + "px";

    const avail = Math.max(120, stage.clientWidth - 32);
    const k = Math.min(1, avail / totalW, 420 / totalH);
    $("#ovBox").style.width = Math.round(totalW * k) + "px";
    $("#ovBox").style.height = Math.round(totalH * k) + "px";
    canvas.style.transform = `scale(${k})`;
    $("#ovStageInfo").textContent = `顯示 ${Math.round(k * 100)}%　整體畫布約 ${totalW} × ${totalH}px　粉紅虛線 = 各角色瀏覽器來源的範圍`;
  }

  function copyOverviewRow(i) {
    const r = overviewRows()[i];
    if (!r) return;
    copyText(`X=${r.x}, Y=${r.y}, 寬=${r.w}, 高=${r.h}`)
      .then(ok => status(ok ? `已複製「${r.c.name || "未命名"}」的版位。` : "複製失敗。", !ok));
  }

  function copyOverviewAll() {
    const rows = overviewRows();
    if (!rows.length) { status("目前沒有角色可以複製。", true); return; }
    const text = rows.map((r, i) => `${i + 1}. ${r.c.name.trim() || "未命名"}　X=${r.x} Y=${r.y} 寬=${r.w} 高=${r.h}`).join("\n");
    copyText(text).then(ok => status(ok ? "已複製所有版位。" : "複製失敗。", !ok));
  }

  function fillPreviewSelect() {
    const select = $("#previewChar");
    const current = state.preview.character;
    select.innerHTML = "";
    select.add(new Option("範例（探索者名稱）", ""));
    for (const c of state.characters.list) select.add(new Option(c.name.trim() || "（未命名）", c.id));
    if (!state.characters.list.some(c => c.id === current)) state.preview.character = "";
    select.value = state.preview.character;
  }

  function currentChar() {
    return state.characters.list.find(c => c.id === state.preview.character) || null;
  }

  function charUrl(c) {
    return c ? M.characterUrl(state.characters.room, c.url) : "";
  }

  function onCharAction(ev) {
    const btn = ev.target.closest("[data-char-action]");
    if (!btn) return;
    const id = btn.closest("[data-char]").dataset.char;
    const index = state.characters.list.findIndex(c => c.id === id);
    const c = state.characters.list[index];
    if (!c) return;
    const action = btn.dataset.charAction;
    if (action === "delete") {
      state.characters.list.splice(index, 1);
      commit();
      renderCharList();
      fillPreviewSelect();
      requestRender();
    } else if (action === "url") {
      const url = charUrl(c);
      if (!url) { status("需要同時填入房間網址與角色 ID。", true); return; }
      copyText(url).then(ok => status(ok ? `已複製「${c.name || "未命名"}」的網址。` : "複製失敗。", !ok));
    } else if (action === "css" || action === "preview") {
      state.preview.character = c.id;
      fillPreviewSelect();
      renderNow();
      if (action === "css") copyCurrentCss();
    }
  }

  // ---------------------------------------------------------------- preview

  let renderQueued = false;

  function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderNow();
    });
  }

  function cssFor(c, size) {
    const sizeNote = size && !c ? `名稱在 ${PROBE_NAME.length} 個字以內時可容納的尺寸` : "";
    return C.build(state, { name: c ? c.name : null, color: c ? c.color : null, url: charUrl(c), size, sizeNote });
  }

  function previewData(css) {
    return {
      css,
      statuses: state.preview.statuses.slice(0, state.layout.count),
      initiative: state.preview.initiative,
      avatar: previewAvatar,
    };
  }

  function renderNow() {
    if (!frameDoc) return;
    K.update(frameDoc, previewData(cssFor(currentChar(), null)));
    measureAndApply();
    // Web fonts change the size once they arrive.
    frameDoc.fonts.ready.then(measureAndApply);
  }

  // A registered character is sized for its own name. The sample is sized for a name of up to
  // PROBE_NAME's length, since people paste the sample CSS and write their own name into it.
  function measureAndApply() {
    let size = K.measure(frameDoc);
    if (!currentChar()) {
      const real = frameDoc.getElementById("obs-custom").textContent;
      K.update(frameDoc, previewData(C.build(state, { name: PROBE_NAME })));
      const probe = K.measure(frameDoc);
      K.update(frameDoc, previewData(real));
      size = { w: Math.max(size.w, probe.w), h: Math.max(size.h, probe.h) };
    }
    applySize(size);
  }

  function applySize(size, force) {
    const changed = size.w !== lastSize.w || size.h !== lastSize.h;
    lastSize = size;
    const stage = $("#stage");
    const avail = Math.max(120, stage.clientWidth - 32);
    const k = Math.min(2, avail / size.w, 560 / size.h);
    if (changed || force) {
      const frame = $("#preview");
      frame.style.width = size.w + "px";
      frame.style.height = size.h + "px";
    }
    $("#frameBox").style.width = Math.round(size.w * k) + "px";
    $("#frameBox").style.height = Math.round(size.h * k) + "px";
    $("#preview").style.transform = `scale(${k})`;
    $("#stageInfo").textContent = `顯示 ${Math.round(k * 100)}%　粉紅虛線 = 瀏覽器來源的範圍`;
    const hint = currentChar() ? "" : `<small style="color: var(--muted)">（名稱最多 ${PROBE_NAME.length} 個字）</small>`;
    $("#sizeNote").innerHTML = `瀏覽器來源尺寸　寬 <b>${size.w}</b> × 高 <b>${size.h}</b>${hint}`;
    $("#cssOut").value = cssFor(currentChar(), size);
    renderOverview();
  }

  function setupFrame() {
    const frame = $("#preview");
    frame.style.width = "1200px";
    frame.style.height = "900px";
    frame.addEventListener("load", () => {
      frameDoc = frame.contentDocument;
      renderNow();
    });
    frame.srcdoc = K.documentHtml();
    new ResizeObserver(() => { if (frameDoc) applySize(lastSize, true); }).observe($("#stage"));
    new ResizeObserver(() => renderOverviewStage(overviewRows())).observe($("#ovStage"));
  }

  function testAction(kind) {
    const count = state.layout.count, at = state.alert.lowAt;
    state.preview.statuses.slice(0, count).forEach(s => {
      const max = Math.max(1, s[2]);
      if (kind === "-3") s[1] = Math.max(0, s[1] - 3);
      else if (kind === "+3") s[1] = Math.min(max, s[1] + 3);
      else if (kind === "half") s[1] = Math.round(max / 2);
      else if (kind === "low") s[1] = Math.max(0, Math.ceil(max * at / 100) - 1);
      else if (kind === "zero") s[1] = 0;
      else if (kind === "full") s[1] = max;
    });
    syncControls();
    scheduleSave();
    requestRender();
  }

  // ---------------------------------------------------------------- output

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    }
  }

  function copyCurrentCss() {
    const c = currentChar();
    const css = cssFor(c, lastSize);
    copyText(css).then(ok => {
      if (!ok) { status("複製失敗。請從下方的「檢視輸出的 CSS」自行選取複製。", true); return; }
      const who = c ? `「${c.name || "未命名"}」的` : "範例的";
      status(`已複製${who} CSS。請貼到 OBS 瀏覽器來源（寬 ${lastSize.w} × 高 ${lastSize.h}）的自訂 CSS 欄位。`);
    });
  }

  function baseName() {
    return String(state.fileBase || "").replace(/[\\/:*?"<>|]/g, "_").trim() || "statusbar";
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function downloadCss() {
    const c = currentChar();
    const suffix = c && c.name.trim() ? "_" + c.name.trim().replace(/[\\/:*?"<>|\s]/g, "_") : "";
    const name = `${baseName()}${suffix}.css`;
    download(new Blob([cssFor(c, lastSize)], { type: "text/css" }), name);
    status(`已儲存 ${name}。`);
  }

  // ---------------------------------------------------------------- history & saving

  function updateHistoryButtons() {
    $("#undo").disabled = !history.undo.length;
    $("#redo").disabled = !history.redo.length;
  }

  function commit() {
    const snap = JSON.stringify(state);
    if (snap === history.last) return;
    if (history.last !== null) {
      history.undo.push(history.last);
      if (history.undo.length > 150) history.undo.shift();
    }
    history.redo.length = 0;
    history.last = snap;
    updateHistoryButtons();
    scheduleSave();
  }

  // Preview values and the previewed character are not part of the design; keep them across undo.
  function restore(snap) {
    const preview = state.preview;
    state = JSON.parse(snap);
    state.preview = preview;
    history.last = snap;
    syncAll();
    scheduleSave();
  }

  function undo() {
    if (!history.undo.length) return;
    history.redo.push(history.last);
    restore(history.undo.pop());
  }

  function redo() {
    if (!history.redo.length) return;
    history.undo.push(history.last);
    restore(history.redo.pop());
  }

  let saveTimer = 0;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (err) { /* storage may be blocked */ }
    }, 400);
  }

  function loadSaved() {
    try {
      const text = localStorage.getItem(SAVE_KEY);
      return text ? M.normalize(JSON.parse(text)) : null;
    } catch (err) {
      return null;
    }
  }

  function loadState(next) {
    state = next;
    history.undo.length = 0;
    history.redo.length = 0;
    history.last = JSON.stringify(state);
    syncAll();
    scheduleSave();
  }

  function saveProject() {
    const data = { app: "ccf-statusbar-maker", version: 1, state };
    download(new Blob([JSON.stringify(data, null, 1)], { type: "application/json" }), baseName() + ".statusbar.json");
    status("已儲存專案。");
  }

  async function openProjectFile(file) {
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.app !== "ccf-statusbar-maker" || !data.state) throw new Error("這不是本工具的專案檔。");
      loadState(M.normalize(data.state));
      status(`已開啟「${file.name}」。`);
    } catch (err) {
      status(err instanceof SyntaxError ? "無法讀取檔案。" : err.message, true);
    }
  }

  function syncAll() {
    $("#design").value = P.DESIGNS[state.design] ? state.design : "standard";
    showDesignDesc();
    renderBarList();
    renderTester();
    renderCharList();
    fillPreviewSelect();
    syncControls();
    requestRender();
  }

  // ---------------------------------------------------------------- setup

  function switchTab(name) {
    for (const btn of $$("[data-tab]")) btn.setAttribute("aria-selected", String(btn.dataset.tab === name));
    for (const panel of $$("[data-tab-panel]")) panel.hidden = panel.dataset.tabPanel !== name;
    try { localStorage.setItem(TAB_KEY, name); } catch (err) { /* storage may be blocked */ }
  }

  function switchTopTab(name) {
    for (const btn of $$("[data-toptab]")) btn.setAttribute("aria-selected", String(btn.dataset.toptab === name));
    for (const panel of $$("[data-top-panel]")) panel.hidden = panel.dataset.topPanel !== name;
    try { localStorage.setItem(TOP_TAB_KEY, name); } catch (err) { /* storage may be blocked */ }
    // The stage measures 0 while its tab is hidden, so its layout needs redoing once it's shown.
    if (name === "overview") renderOverviewStage(overviewRows());
  }

  function showDesignDesc() {
    const d = P.DESIGNS[$("#design").value];
    $("#designDesc").textContent = d ? d.desc + "（形狀、顏色、文字、名稱與效果會一起被取代。狀態數量、顯示名稱與角色清單維持不變）" : "";
  }

  function buildStaticUI() {
    const design = $("#design");
    design.innerHTML = optionsHtml(Object.entries(P.DESIGNS).map(([key, d]) => [key, d.label]));
    for (const select of $$("select[data-options]")) {
      const source = P[select.dataset.options];
      const list = Array.isArray(source) ? source : Object.entries(source).map(([key, v]) => [key, v.label]);
      select.innerHTML = optionsHtml(list);
    }
    renderDecoList();
    bindControls(document);
  }

  function wireEvents() {
    for (const btn of $$("[data-tab]")) btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    for (const btn of $$("[data-toptab]")) btn.addEventListener("click", () => switchTopTab(btn.dataset.toptab));
    $("#design").addEventListener("change", showDesignDesc);
    $("#applyDesign").addEventListener("click", () => {
      const key = $("#design").value;
      M.applyDesign(state, key);
      commit();
      syncAll();
      status(`已套用「${P.DESIGNS[key].label}」。`);
    });
    $("#undo").addEventListener("click", undo);
    $("#redo").addEventListener("click", redo);
    document.addEventListener("keydown", ev => {
      if (!(ev.ctrlKey || ev.metaKey) || ev.target.matches("input[type=text], textarea")) return;
      const key = ev.key.toLowerCase();
      if (key === "z" && !ev.shiftKey) { ev.preventDefault(); undo(); }
      else if (key === "y" || (key === "z" && ev.shiftKey)) { ev.preventDefault(); redo(); }
    });

    for (const btn of $$("#bgSeg button")) {
      btn.addEventListener("click", () => {
        state.preview.bg = btn.dataset.bg;
        syncControls();
        scheduleSave();
      });
    }
    $("#previewChar").addEventListener("change", ev => {
      state.preview.character = ev.target.value;
      scheduleSave();
      requestRender();
    });
    for (const btn of $$("[data-test]")) btn.addEventListener("click", () => testAction(btn.dataset.test));
    $("#testInit").addEventListener("input", ev => {
      const v = Math.max(0, Math.min(99, Math.round(Number(ev.target.value)) || 0));
      state.preview.initiative = v;
      scheduleSave();
      requestRender();
    });
    $("#pickAvatar").addEventListener("click", () => { $("#avatarFile").value = ""; $("#avatarFile").click(); });
    $("#avatarFile").addEventListener("change", ev => {
      const file = ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        previewAvatar = reader.result;
        requestRender();
        status("已更換預覽用的頭像圖片（不會被儲存）。");
      };
      reader.readAsDataURL(file);
    });

    $("#copyCss").addEventListener("click", copyCurrentCss);
    $("#downloadCss").addEventListener("click", downloadCss);
    $("#addChar").addEventListener("click", () => {
      state.characters.list.push(M.newCharacter(state.characters.list.length));
      commit();
      renderCharList();
      fillPreviewSelect();
      const inputs = $$("#charList [data-bind$='.name']");
      if (inputs.length) inputs[inputs.length - 1].focus();
    });
    $("#charList").addEventListener("click", onCharAction);
    $("#overviewList").addEventListener("click", ev => {
      const btn = ev.target.closest("[data-overview-copy]");
      if (btn) copyOverviewRow(Number(btn.dataset.overviewCopy));
    });
    $("#copyOverviewAll").addEventListener("click", copyOverviewAll);

    $("#saveProject").addEventListener("click", saveProject);
    $("#openProject").addEventListener("click", () => { $("#projectFile").value = ""; $("#projectFile").click(); });
    $("#projectFile").addEventListener("change", ev => { if (ev.target.files[0]) openProjectFile(ev.target.files[0]); });
    $("#resetAll").addEventListener("click", () => {
      if (!confirm("將清除目前的編輯內容，回到初始狀態。確定要繼續嗎？")) return;
      previewAvatar = null;
      loadState(M.defaultState());
      status("已回到初始狀態。");
    });
  }

  function init() {
    buildStaticUI();
    wireEvents();
    let tab = "layout";
    try { tab = localStorage.getItem(TAB_KEY) || tab; } catch (err) { /* storage may be blocked */ }
    switchTab($$("[data-tab]").some(b => b.dataset.tab === tab) ? tab : "layout");
    let topTab = "maker";
    try { topTab = localStorage.getItem(TOP_TAB_KEY) || topTab; } catch (err) { /* storage may be blocked */ }
    switchTopTab($$("[data-toptab]").some(b => b.dataset.toptab === topTab) ? topTab : "maker");
    loadState(loadSaved() || M.defaultState());
    setupFrame();
    status("已就緒。在左側選擇形狀或顏色，右側預覽會立即更新。");
  }

  init();
})();
