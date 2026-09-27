/*!
 * model.v1.js - project state: defaults, design templates, loading, CCFOLIA URLs
 *
 * A design ("look") replaces layout, bar, text, name, alert and decorations.
 * The number of statuses, per-bar label overrides, the preview values and the
 * character list belong to the user and survive a design change.
 */
(function () {
  "use strict";

  const P = window.BarPresets;
  const clone = value => JSON.parse(JSON.stringify(value));
  const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
  const LOOK_KEYS = ["layout", "avatar", "initiative", "bar", "icons", "text", "name", "alert", "decos"];
  const MAX_BARS = 8;

  let counter = 0;
  function newId(prefix) {
    return prefix + Date.now().toString(36) + (counter++).toString(36);
  }

  function deepMerge(base, patch) {
    const out = clone(base);
    for (const key of Object.keys(patch || {})) {
      out[key] = isObj(out[key]) && isObj(patch[key]) ? deepMerge(out[key], patch[key]) : clone(patch[key]);
    }
    return out;
  }

  function designLook(key) {
    const d = P.DESIGNS[key] || {};
    const look = {};
    for (const k of LOOK_KEYS) look[k] = deepMerge(P.BASE_LOOK[k], d[k]);
    look.colors = clone(d.colors || P.BASE_LOOK.colors);
    return look;
  }

  function applyDesign(state, key) {
    if (!P.DESIGNS[key]) return;
    const look = designLook(key);
    look.layout.count = state.layout.count;
    look.layout.hideExtra = state.layout.hideExtra;
    for (const k of LOOK_KEYS) state[k] = look[k];
    state.bars = state.bars.map((bar, i) => Object.assign({}, bar, look.colors[i]));
    state.design = key;
  }

  function barItem(i) {
    const c = P.BASE_LOOK.colors[i];
    return { label: "", c1: c.c1, c2: c.c2, icon: c.icon, low: true };
  }

  function newCharacter(index) {
    return { id: newId("c"), name: "", url: "", color: P.CHAR_COLORS[index % P.CHAR_COLORS.length] };
  }

  function defaultState() {
    const state = {
      version: 1,
      design: "standard",
      layout: { count: 3, hideExtra: true },
      bars: Array.from({ length: MAX_BARS }, (_, i) => barItem(i)),
      preview: { bg: "checker", character: "", statuses: clone(P.SAMPLE_STATUS), initiative: 12 },
      characters: { room: "", list: [] },
      overview: { direction: "row", total: 1000, gap: 12 },
      fileBase: "statusbar",
    };
    applyDesign(state, "standard");
    return state;
  }

  // ---------------------------------------------------------------- loading

  // Fill in keys missing from older or hand-edited project files.
  function mergeDefaults(base, loaded) {
    if (base === null) return loaded === undefined ? null : loaded;
    if (Array.isArray(base) || typeof base !== "object") {
      return loaded === undefined || typeof loaded !== typeof base ? base : loaded;
    }
    if (!isObj(loaded)) return base;
    const out = {};
    for (const key of Object.keys(base)) out[key] = mergeDefaults(base[key], loaded[key]);
    for (const key of Object.keys(loaded)) if (!(key in out)) out[key] = loaded[key];
    return out;
  }

  function normalize(input) {
    const loaded = isObj(input) ? input : {};
    const base = defaultState();
    const state = mergeDefaults(base, loaded);

    const bars = Array.isArray(loaded.bars) ? loaded.bars : [];
    state.bars = base.bars.map((bar, i) => mergeDefaults(bar, bars[i]));

    const statuses = Array.isArray(loaded.preview?.statuses) ? loaded.preview.statuses : [];
    state.preview.statuses = base.preview.statuses.map((s, i) => {
      const t = statuses[i];
      return Array.isArray(t) && t.length === 3 ? [String(t[0]), Number(t[1]) || 0, Number(t[2]) || 0] : s;
    });

    const list = Array.isArray(loaded.characters?.list) ? loaded.characters.list : [];
    state.characters.list = list.filter(isObj).map((c, i) => mergeDefaults(newCharacter(i), c));

    state.layout.count = Math.min(MAX_BARS, Math.max(1, Math.round(state.layout.count) || 3));
    if (state.overview.direction !== "row" && state.overview.direction !== "column") state.overview.direction = "row";
    state.overview.total = Math.min(4000, Math.max(200, Math.round(state.overview.total) || 1000));
    state.overview.gap = Math.min(200, Math.max(0, Math.round(state.overview.gap) || 0));
    if (!P.DESIGNS[state.design]) state.design = "";
    return state;
  }

  // ---------------------------------------------------------------- CCFOLIA URLs

  const ID = /^[A-Za-z0-9_-]{4,}$/;

  function parseRoom(text) {
    const s = String(text || "").trim();
    const m = s.match(/rooms\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : ID.test(s) ? s : "";
  }

  function parseCharacter(text) {
    const s = String(text || "").trim();
    const m = s.match(/characters\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : ID.test(s) ? s : "";
  }

  // The character field may hold a whole URL (room included) or just the id.
  function characterUrl(roomText, charText) {
    const room = (String(charText || "").match(/rooms\/([A-Za-z0-9_-]+)/) || [])[1] || parseRoom(roomText);
    const char = parseCharacter(charText);
    return room && char ? `https://ccfolia.com/rooms/${room}/characters/${char}` : "";
  }

  window.BarModel = {
    MAX_BARS, defaultState, applyDesign, designLook, normalize, newCharacter, newId, clone,
    parseRoom, parseCharacter, characterUrl,
  };
})();
