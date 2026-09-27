/*!
 * presets.v1.js - static data: fonts, icons, shapes, decorations, design templates
 *
 * Adding things:
 *   - a font:       add an entry to FONTS (weights must exist on Google Fonts, or the whole import fails).
 *                   The "pc" entry is special: its family is the name the user typed.
 *   - a shape:      add a label here and a path function in shapes.v1.js (BarShapes.PATHS)
 *   - a decoration: add an entry to DECO_TYPES and a CSS function in css.v1.js (BarCss.DECOS)
 *   - a design:     add an entry to DESIGNS; it is merged over BASE_LOOK
 */
(function () {
  "use strict";

  const SANS = '"Microsoft JhengHei UI","Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
  const SERIF = '"Noto Serif TC","Source Han Serif TC","PMingLiU","Songti TC",serif';

  // weights: verified against fonts.google.com/metadata/fonts + fonts.googleapis.com/css2 (2026-09-21).
  // Only families carrying the chinese-traditional subset are listed as CJK fonts; null = installed font, no import.
  const FONTS = {
    notosans: { label: "Noto Sans TC 思源黑體", family: "Noto Sans TC", weights: [400, 500, 700, 800, 900], stack: SANS },
    chironhei: { label: "Chiron Hei HK 昭源黑體", family: "Chiron Hei HK", weights: [400, 500, 700, 800, 900], stack: SANS },
    goround: { label: "Chiron GoRound TC 昭源圓體（圓體）", family: "Chiron GoRound TC", weights: [400, 500, 700, 800, 900], stack: SANS },
    huninn: { label: "Huninn 粉圓體（圓體）", family: "Huninn", weights: [400], stack: SANS },
    bpmfhuninn: { label: "Bpmf Huninn 注音粉圓（含注音）", family: "Bpmf Huninn", weights: [400], stack: SANS },
    chocolate: { label: "Chocolate Classical Sans 巧克力黑體", family: "Chocolate Classical Sans", weights: [400], stack: SANS },
    lubrifont: { label: "WDXL Lubrifont TC 潤方體（極粗）", family: "WDXL Lubrifont TC", weights: [400], stack: SANS },
    markergothic: { label: "LXGW Marker Gothic 霞鶩漫黑（手寫）", family: "LXGW Marker Gothic", weights: [400], stack: SANS },
    iansui: { label: "Iansui 芫荽（手寫）", family: "Iansui", weights: [400], stack: SANS },
    bpmfiansui: { label: "Bpmf Iansui 注音芫荽（含注音）", family: "Bpmf Iansui", weights: [400], stack: SANS },
    notoserif: { label: "Noto Serif TC 思源宋體（明體）", family: "Noto Serif TC", weights: [400, 500, 600, 700, 800, 900], stack: SERIF },
    cactus: { label: "Cactus Classical Serif 仙人掌明體（古典）", family: "Cactus Classical Serif", weights: [400], stack: SERIF },
    uoqmun: { label: "UoqMunThenKhung 倚天中文（古典）", family: "UoqMunThenKhung", weights: [400], stack: SERIF },
    wenkai: { label: "LXGW WenKai TC 霞鶩文楷（楷體）", family: "LXGW WenKai TC", weights: [300, 400, 700], stack: SERIF },
    wenkaimono: { label: "LXGW WenKai Mono TC 霞鶩文楷等寬", family: "LXGW WenKai Mono TC", weights: [300, 400, 700], stack: SERIF },
    zihikai: { label: "Bpmf Zihi Kai Std 注音字嗨楷體（含注音）", family: "Bpmf Zihi Kai Std", weights: [400], stack: SERIF },
    orbitron: { label: "Orbitron（英數・科幻）", family: "Orbitron", weights: [400, 500, 700, 800, 900], stack: SANS },
    rajdhani: { label: "Rajdhani（英數・細體）", family: "Rajdhani", weights: [400, 500, 600, 700], stack: SANS },
    oswald: { label: "Oswald（英數・窄長）", family: "Oswald", weights: [400, 500, 600, 700], stack: SANS },
    sharetech: { label: "Share Tech Mono（英數・等寬）", family: "Share Tech Mono", weights: [400], stack: SANS },
    chakra: { label: "Chakra Petch（英數・稜角）", family: "Chakra Petch", weights: [400, 500, 600, 700], stack: SANS },
    teko: { label: "Teko（英數・窄長）", family: "Teko", weights: [400, 500, 600, 700], stack: SANS },
    bebas: { label: "Bebas Neue（英數・標題）", family: "Bebas Neue", weights: [400], stack: SANS },
    russo: { label: "Russo One（英數・粗體）", family: "Russo One", weights: [400], stack: SANS },
    pressstart: { label: "Press Start 2P（英數・點陣）", family: "Press Start 2P", weights: [400], stack: SANS },
    silkscreen: { label: "Silkscreen（英數・點陣）", family: "Silkscreen", weights: [400, 700], stack: SANS },
    vt323: { label: "VT323（英數・終端機）", family: "VT323", weights: [400], stack: SANS },
    cinzel: { label: "Cinzel（英數・碑文）", family: "Cinzel", weights: [400, 500, 600, 700, 800, 900], stack: SERIF },
    cormorant: { label: "Cormorant Garamond（英數・古典）", family: "Cormorant Garamond", weights: [400, 500, 600, 700], stack: SERIF },
    barlowcond: { label: "Barlow Condensed（英數・細體）", family: "Barlow Condensed", weights: [400, 500, 600, 700, 800, 900], stack: SANS },
    jhenghei: { label: "微軟正黑體（本機字型）", family: "Microsoft JhengHei", weights: null, stack: SANS },
    mingliu: { label: "新細明體（本機字型）", family: "PMingLiU", weights: null, stack: SERIF },
    kaiti: { label: "標楷體（本機字型）", family: "DFKai-SB", weights: null, stack: SERIF },
    // family comes from the typed name (text.labelFontName etc.)
    pc: { label: "自行輸入名稱（本機字型）", family: "", weights: null, stack: SANS },
  };

  const WEIGHTS = [[400, "標準"], [500, "稍粗"], [600, "中粗"], [700, "粗體"], [800, "極粗"], [900, "最粗"]];

  const ICONS = [
    ["none", "無"], ["heart", "愛心"], ["drop", "水滴"], ["star", "星星"], ["sparkle", "閃光"],
    ["eye", "眼睛"], ["moon", "月亮"], ["bolt", "閃電"], ["shield", "盾牌"], ["cross", "十字"],
    ["clover", "幸運草"], ["skull", "骷髏"], ["flame", "火焰"], ["dot", "圓點"],
  ];

  const SHAPES = [
    ["rect", "方形（圓角）"], ["pill", "膠囊"], ["slant", "平行四邊形"],
    ["chamfer", "切角"], ["arrow", "箭頭"], ["tag", "單邊斜切"],
  ];

  const FILLS = [
    ["flat", "單色"], ["vgrad", "漸層（垂直）"], ["hgrad", "漸層（水平）"],
    ["gloss", "光澤（上下兩段）"], ["stripes", "斜紋"], ["neon", "霓虹（中央較亮）"],
  ];

  const TRACKS = [["dark", "深色底"], ["tint", "底色混入狀態條的顏色"], ["none", "無（透明）"]];

  const TEXT_LAYOUTS = [
    ["overlay", "疊在條上"], ["above", "放在條的上方"], ["below", "放在條的下方"],
    ["side", "左右排列（標籤｜條｜數值）"], ["labelSide", "只有標籤在外（標籤｜數值在條內）"],
  ];

  const ALIGNS = [["split", "標籤靠左・數值靠右"], ["valueCenter", "標籤靠左・數值置中"], ["center", "只有數值置中"]];

  const VALUE_MODES = [["both", "目前值 / 最大值"], ["current", "只顯示目前值"], ["none", "不顯示"]];

  const OUTLINES = [["shadow", "柔和陰影"], ["stroke", "描邊"], ["glow", "發光"], ["none", "無"]];

  const NAME_POS = [
    ["top", "最上方"], ["barsTop", "狀態條上方（頭像旁）"], ["bottom", "最下方"],
    ["left", "左側"], ["avatar", "疊在頭像上"], ["none", "不顯示"],
  ];

  const NAME_STYLES = [
    ["plate", "名牌（與狀態條同框）"], ["text", "只有文字"], ["underline", "底線"],
    ["sidebar", "左側色條"], ["tab", "標題頁籤"], ["badge", "圓角標籤"],
  ];

  // controls: [key, label, type, min, max, step, fmt]  type: range | color | check | select(options in min)
  const DECO_TYPES = {
    panel: {
      label: "背景面板", desc: "在整體後方鋪一塊底板。直播畫面較亮時也能看得清楚。",
      defaults: { on: false, color: "#0e1016", alpha: 0.85, radius: 10, borderW: 1, borderColor: "#ffffff", borderAlpha: 0.12, pad: 10, accentLine: false, texture: "none" },
      controls: [
        ["color", "顏色", "color"], ["alpha", "不透明度", "range", 0, 1, 0.01, "pct"],
        ["radius", "圓角", "range", 0, 40, 1], ["pad", "內側留白", "range", 0, 40, 1],
        ["borderW", "外框粗細", "range", 0, 6, 1], ["borderColor", "外框顏色", "color"], ["borderAlpha", "外框濃度", "range", 0, 1, 0.01, "pct"],
        ["accentLine", "左側加上角色顏色的線", "check"],
        ["texture", "質感", "select", [["none", "無"], ["paper", "泛黃紙張"], ["grain", "顆粒"]]],
      ],
    },
    frame: {
      label: "整體外框", desc: "把名稱、頭像、狀態條一起框起來。可以搭配背景面板，也可以只用外框。",
      defaults: { on: false, style: "solid", width: 2, color: "#ffffff", alpha: 0.8, useCharColor: false, offset: 6, radius: 8, len: 16 },
      controls: [
        ["style", "線條種類", "select", [["solid", "單線"], ["double", "雙線"], ["dashed", "虛線"], ["glow", "發光線"], ["corners", "只有四角"], ["lineCorners", "細線＋四角"]]],
        ["width", "粗細", "range", 1, 8, 1],
        ["useCharColor", "使用角色的顏色", "check"],
        ["color", "顏色", "color", null, null, null, null, "decos.frame.useCharColor=false"],
        ["alpha", "濃度", "range", 0.05, 1, 0.05, "pct"],
        ["offset", "與內容的距離", "range", -12, 24, 1],
        ["radius", "圓角", "range", 0, 40, 1, null, "decos.frame.style=solid|double|dashed|glow"],
        ["len", "四角的長度", "range", 4, 60, 1, null, "decos.frame.style=corners|lineCorners"],
      ],
    },
    gloss: {
      label: "光澤", desc: "在狀態條上半部加上一層光。",
      defaults: { on: false, alpha: 0.3 },
      controls: [["alpha", "強度", "range", 0.05, 1, 0.05, "pct"]],
    },
    glow: {
      label: "外緣光暈", desc: "讓狀態條周圍依各自的顏色發光。",
      defaults: { on: false, size: 6, alpha: 0.6 },
      controls: [["size", "擴散範圍", "range", 1, 20, 1], ["alpha", "強度", "range", 0.05, 1, 0.05, "pct"]],
    },
    tip: {
      label: "前端亮線", desc: "在減少的位置（狀態條前端）加上一條亮線。",
      defaults: { on: false, alpha: 0.85 },
      controls: [["alpha", "強度", "range", 0.1, 1, 0.05, "pct"]],
    },
    sheen: {
      label: "流動光線", desc: "光帶會不時掃過狀態條。",
      defaults: { on: false, alpha: 0.35, duration: 4 },
      controls: [["alpha", "強度", "range", 0.05, 1, 0.05, "pct"], ["duration", "間隔（秒）", "range", 1, 12, 0.5]],
    },
    scanlines: {
      label: "掃描線", desc: "疊上橫紋，做出螢幕的效果。",
      defaults: { on: false, alpha: 0.25, gap: 3 },
      controls: [["alpha", "濃度", "range", 0.05, 1, 0.05, "pct"], ["gap", "間隔", "range", 2, 8, 1]],
    },
    ticks: {
      label: "刻度", desc: "在狀態條下方加上等距的刻度。",
      defaults: { on: false, div: 10, alpha: 0.5, color: "#ffffff" },
      controls: [["div", "分割數", "range", 2, 20, 1], ["color", "顏色", "color"], ["alpha", "濃度", "range", 0.05, 1, 0.05, "pct"]],
    },
    grain: {
      label: "顆粒感", desc: "在狀態條上加入細微雜訊，做出老舊的質感。",
      defaults: { on: false, alpha: 0.3 },
      controls: [["alpha", "濃度", "range", 0.05, 1, 0.05, "pct"]],
    },
    brackets: {
      label: "邊角括號", desc: "為每一條在四角加上 HUD 風格的括號。",
      defaults: { on: false, color: "#6ff3ff", alpha: 0.9, len: 8, width: 2, offset: 4 },
      controls: [
        ["color", "顏色", "color"], ["alpha", "濃度", "range", 0.05, 1, 0.05, "pct"],
        ["len", "長度", "range", 3, 24, 1], ["width", "粗細", "range", 1, 4, 1], ["offset", "與狀態條的距離", "range", 0, 12, 1],
      ],
    },
  };

  const BAR_COLORS = [
    ["#e0563f", "#a51f22", "heart"], ["#4fa3e3", "#1f4f9c", "sparkle"], ["#b487e8", "#5f3a9c", "eye"],
    ["#e8c65a", "#a07c1f", "clover"], ["#5fcf8a", "#23804a", "bolt"], ["#f08fb4", "#a8406a", "shield"],
    ["#7fd6d6", "#2a8080", "moon"], ["#c9c9c9", "#6b6b6b", "dot"],
  ];

  // The look of the default design ("標準"). Other designs are patches over this.
  const BASE_LOOK = {
    layout: { direction: "column", columns: 2, width: 320, height: 34, gap: 6, textLayout: "overlay", align: "split",
      labelW: 52, valueW: 86, textGap: 4, pad: 10, outer: 10 },
    avatar: { show: false, pos: "left", w: 88, h: 88, radius: 6, borderW: 1, borderColor: "#ffffff", borderAlpha: 0.6,
      useCharColor: false, fit: "top", gap: 8, bg: "#000000", bgAlpha: 0.5 },
    initiative: { show: false, size: 24, color: "#1b1b1f", bg: "#f2efe6", corner: "tr" },
    bar: { shape: "rect", radius: 6, cut: 10, slant: 12, borderW: 1, borderColor: "#ffffff", borderAlpha: 0.28, double: false,
      track: "dark", trackColor: "#080a0e", trackAlpha: 0.78, tint: 0.25,
      fill: "vgrad", flow: false, segments: 0, segGap: 2, speed: 0.25, shadow: 0.45 },
    colors: BAR_COLORS.map(([c1, c2, icon]) => ({ c1, c2, icon })),
    icons: { show: false, size: 20, gap: 6 },
    text: { labelFont: "notosans", valueFont: "notosans", labelFontName: "", valueFontName: "",
      weight: 700, labelSize: 17, valueSize: 18, maxSize: 12, spacing: 0.04, color: "#f2efe6", subColor: "#f2efe6", subAlpha: 0.7, labelByBar: false,
      outline: "shadow", outlineColor: "#000000", outlineAlpha: 0.9, outlineW: 2, showLabel: true, valueMode: "both" },
    name: { pos: "top", style: "plate", font: "notosans", fontName: "", weight: 700, size: 17, color: "#f2efe6", bg: "#080a0e", bgAlpha: 0.88,
      accent: "#c8a45c", useCharColor: false, align: "left", vertical: false, fitHeight: true, overflow: "ellipsis", gap: 6 },
    alert: { red80: true, redColor: "#ff5b5b", redBlink: false,
      lowOn: true, lowAt: 25, lowColor: "#ff3b3b", lowFill: false, lowPulse: true, lowBlink: false, lowShake: false, lowText: true,
      zeroOn: true, zeroGray: true, zeroBlink: false },
    decos: Object.fromEntries(Object.entries(DECO_TYPES).map(([k, t]) => [k, Object.assign({}, t.defaults)])),
  };

  const on = (fields) => Object.assign({ on: true }, fields);
  const colors = list => list.map(([c1, c2, icon]) => ({ c1, c2, icon }));

  const DESIGNS = {
    standard: {
      label: "標準（黑底＋紅藍紫）", desc: "黑色底加上紅、藍、紫。適合任何團的基本款。",
    },
    minimal: {
      label: "極簡", desc: "細線狀態條，數字放在上方。不干擾畫面的低調樣式。",
      layout: { width: 260, height: 7, gap: 10, textLayout: "above", textGap: 3 },
      bar: { shape: "pill", borderW: 0, track: "tint", trackColor: "#ffffff", trackAlpha: 0.18, tint: 0.3, fill: "flat", shadow: 0 },
      text: { labelFont: "chironhei", valueFont: "chironhei", weight: 500, labelSize: 13, valueSize: 17, maxSize: 11, subAlpha: 0.6, outline: "shadow", outlineAlpha: 0.7 },
      name: { style: "text", font: "chironhei", weight: 700, size: 18, gap: 8 },
      alert: { lowPulse: false, lowText: true },
    },
    hud: {
      label: "科幻・HUD", desc: "斜向狀態條加上分段、掃描線與邊角括號。適合科幻或現代動作題材。",
      layout: { width: 330, height: 20, gap: 12, textLayout: "side", labelW: 44, valueW: 80, textGap: 8 },
      bar: { shape: "slant", slant: 9, borderW: 1, borderColor: "#6ff3ff", borderAlpha: 0.7, track: "dark", trackColor: "#031018", trackAlpha: 0.8,
        fill: "vgrad", segments: 16, segGap: 2, shadow: 0 },
      colors: colors([["#ff5a78", "#b3123a", "heart"], ["#3fdcff", "#0a6c9c", "bolt"], ["#c792ff", "#6a2bd1", "eye"], ["#ffd84a", "#a88400", "star"],
        ["#63ffa8", "#0f8f4d", "shield"], ["#ff9f43", "#b35a00", "flame"], ["#8af0ff", "#2a8a9c", "moon"], ["#d0d8e0", "#6b7580", "dot"]]),
      text: { labelFont: "orbitron", valueFont: "rajdhani", weight: 700, labelSize: 14, valueSize: 22, maxSize: 14, spacing: 0.08,
        color: "#dffbff", subColor: "#8fd9e8", subAlpha: 0.9, outline: "glow", outlineColor: "#00c8ff", outlineAlpha: 0.55 },
      name: { style: "sidebar", font: "chakra", weight: 700, size: 17, color: "#dffbff", bg: "#031018", bgAlpha: 0.75, accent: "#6ff3ff", gap: 10 },
      alert: { lowColor: "#ff2a4a", lowPulse: true, lowBlink: true, redColor: "#ff6b81" },
      decos: { scanlines: on({ alpha: 0.3, gap: 3 }), brackets: on({ color: "#6ff3ff", alpha: 0.85, len: 7, width: 2, offset: 4 }), tip: on({ alpha: 0.9 }) },
    },
    archive: {
      label: "古書（克蘇魯）", desc: "泛黃紙張配上墨色文字。明體與切角狀態條，營造調查記錄的氛圍。",
      layout: { width: 300, height: 14, gap: 9, textLayout: "side", labelW: 48, valueW: 78, textGap: 8 },
      bar: { shape: "chamfer", cut: 4, borderW: 1, borderColor: "#3b2a18", borderAlpha: 0.85, track: "dark", trackColor: "#3b2a18", trackAlpha: 0.15,
        fill: "flat", shadow: 0 },
      colors: colors([["#9c2a22", "#6d1a14", "heart"], ["#2e4a6e", "#1c2f48", "star"], ["#5a3f73", "#2f2240", "eye"], ["#8a6a2a", "#5c4518", "clover"],
        ["#3f6a3a", "#233d20", "bolt"], ["#7a3a52", "#4a1f30", "shield"], ["#3a6a6a", "#1f3d3d", "moon"], ["#5a5048", "#332d28", "dot"]]),
      text: { labelFont: "notoserif", valueFont: "notoserif", weight: 700, labelSize: 16, valueSize: 19, maxSize: 13, spacing: 0.02,
        color: "#2b2118", subColor: "#2b2118", subAlpha: 0.65, outline: "none" },
      name: { style: "underline", font: "notoserif", weight: 800, size: 21, color: "#2b2118", accent: "#7a1f1a", gap: 8 },
      alert: { redColor: "#8a1a1a", lowColor: "#7a0f0f", lowPulse: false, lowBlink: true, lowText: true },
      decos: { panel: on({ color: "#e6d8b8", alpha: 0.96, radius: 2, borderW: 1, borderColor: "#5a4326", borderAlpha: 0.8, pad: 14, texture: "paper" }),
        frame: on({ style: "lineCorners", width: 2, color: "#5a4326", alpha: 0.85, offset: -6, len: 18 }),
        grain: on({ alpha: 0.35 }) },
    },
    wafu: {
      label: "和風", desc: "墨色底板配金色雙線。楷體直書名稱配朱、藍、紫的狀態條，適合和風團。",
      layout: { width: 250, height: 24, gap: 7, textLayout: "overlay", pad: 9 },
      bar: { shape: "rect", radius: 0, borderW: 1, borderColor: "#c9a64a", borderAlpha: 0.95, double: true, track: "dark", trackColor: "#0a0807", trackAlpha: 0.7,
        fill: "vgrad", shadow: 0 },
      colors: colors([["#d0452f", "#8e2416", "flame"], ["#3d5f9e", "#1f3563", "drop"], ["#8a5aa8", "#4d2d66", "moon"], ["#c9a64a", "#7a6020", "clover"],
        ["#4f8a5a", "#28502f", "bolt"], ["#c25b7c", "#7a3048", "sparkle"], ["#5a9a9a", "#2f5a5a", "eye"], ["#9a9086", "#5a524a", "dot"]]),
      text: { labelFont: "wenkai", valueFont: "wenkai", weight: 700, labelSize: 15, valueSize: 18, maxSize: 12, color: "#f1e6cc", subColor: "#f1e6cc" },
      name: { pos: "left", style: "text", vertical: true, font: "wenkai", weight: 900, size: 22, color: "#f1e6cc", gap: 12 },
      alert: { lowColor: "#ff4a2a", redColor: "#ff7a5a" },
      decos: { panel: on({ color: "#14110f", alpha: 0.86, radius: 0, borderW: 1, borderColor: "#c9a64a", borderAlpha: 0.7, pad: 12 }),
        frame: on({ style: "double", width: 1, color: "#c9a64a", alpha: 0.85, offset: 5, radius: 0 }) },
    },
    pop: {
      label: "活潑", desc: "白邊膠囊加上流動斜紋。搭配圓體，熱鬧又鮮明。",
      layout: { width: 290, height: 28, gap: 8, textLayout: "overlay", pad: 12 },
      bar: { shape: "pill", borderW: 3, borderColor: "#ffffff", borderAlpha: 1, track: "tint", trackColor: "#ffffff", trackAlpha: 0.75, tint: 0.22,
        fill: "stripes", flow: true, shadow: 0.3 },
      colors: colors([["#ff8a9a", "#ff6680", "heart"], ["#7cd0ff", "#4db4f7", "star"], ["#c3a6ff", "#a07ef7", "sparkle"], ["#ffd66b", "#ffbf2e", "clover"],
        ["#7fe0a8", "#4fcc85", "bolt"], ["#ffab7a", "#ff8a4d", "flame"], ["#8ee6e0", "#55cfc6", "drop"], ["#d6d6e0", "#b3b3c2", "dot"]]),
      icons: { show: true, size: 24, gap: 6 },
      text: { labelFont: "goround", valueFont: "goround", weight: 800, labelSize: 15, valueSize: 18, maxSize: 12, spacing: 0.02,
        color: "#ffffff", subColor: "#ffffff", subAlpha: 0.9, outline: "stroke", outlineColor: "#4a3a66", outlineAlpha: 1, outlineW: 2 },
      name: { style: "badge", font: "goround", weight: 800, size: 17, color: "#ffffff", useCharColor: true, accent: "#ff7fa0", gap: 8 },
      alert: { lowPulse: false, lowShake: true, lowText: false, red80: false },
      decos: { gloss: on({ alpha: 0.35 }) },
    },
    horror: {
      label: "恐怖", desc: "暗紅色、手寫字與顆粒感。瀕危時會震動。",
      layout: { width: 300, height: 24, gap: 8, textLayout: "overlay", pad: 12 },
      bar: { shape: "tag", cut: 8, borderW: 1, borderColor: "#6a0f0f", borderAlpha: 0.9, track: "dark", trackColor: "#0a0506", trackAlpha: 0.85,
        fill: "vgrad", shadow: 0.6 },
      colors: colors([["#b3141b", "#5c0509", "heart"], ["#3b4a6b", "#1b2233", "drop"], ["#6a2d80", "#2a1033", "eye"], ["#8a7a3a", "#3d3410", "clover"],
        ["#3a6a3a", "#152a15", "bolt"], ["#7a2a4a", "#33101f", "skull"], ["#2a5a5a", "#0f2626", "moon"], ["#5a5050", "#262020", "dot"]]),
      text: { labelFont: "cactus", valueFont: "cactus", weight: 400, labelSize: 16, valueSize: 19, maxSize: 13,
        color: "#eadad6", subColor: "#c9b3ad", subAlpha: 0.85, outline: "glow", outlineColor: "#4a0000", outlineAlpha: 1 },
      name: { style: "text", font: "iansui", weight: 400, size: 23, color: "#e0cbc5", gap: 6 },
      alert: { lowColor: "#ff1e1e", lowPulse: true, lowShake: true, redColor: "#ff4a4a" },
      decos: { grain: on({ alpha: 0.4 }), glow: on({ size: 7, alpha: 0.45 }) },
    },
    retro: {
      label: "復古遊戲", desc: "等寬字與分段狀態條。仿早期 RPG 的狀態畫面。",
      layout: { width: 300, height: 14, gap: 8, textLayout: "side", labelW: 42, valueW: 92, textGap: 8 },
      bar: { shape: "rect", radius: 0, borderW: 2, borderColor: "#ffffff", borderAlpha: 1, track: "dark", trackColor: "#000000", trackAlpha: 1,
        fill: "flat", segments: 12, segGap: 2, speed: 0.15, shadow: 0 },
      colors: colors([["#3ddc5a", "#1f8f36", "heart"], ["#3da5ff", "#1f5fa8", "star"], ["#ffcc33", "#a88400", "eye"], ["#ff8c3d", "#a84f10", "clover"],
        ["#e05ae0", "#8a2a8a", "bolt"], ["#5ae0e0", "#2a8a8a", "shield"], ["#f0f0f0", "#9a9a9a", "moon"], ["#a0a0a0", "#5a5a5a", "dot"]]),
      text: { labelFont: "wenkaimono", valueFont: "wenkaimono", weight: 400, labelSize: 16, valueSize: 18, maxSize: 14, spacing: 0.04,
        color: "#ffffff", subColor: "#ffffff", subAlpha: 0.75, outline: "none" },
      name: { style: "text", font: "wenkaimono", weight: 400, size: 18, color: "#ffffff", gap: 8 },
      alert: { lowFill: true, lowColor: "#ff3030", lowPulse: false, lowBlink: true, lowText: true, redColor: "#ffd23a" },
      decos: { panel: on({ color: "#000000", alpha: 0.88, radius: 0, borderW: 2, borderColor: "#ffffff", borderAlpha: 1, pad: 12 }) },
    },
    card: {
      label: "卡片（含頭像）", desc: "把角色頭像、名稱與狀態條整合成一張卡片，並顯示先攻值。",
      layout: { width: 220, height: 22, gap: 5, textLayout: "overlay", pad: 8 },
      avatar: { show: true, pos: "left", w: 92, h: 92, radius: 8, borderW: 2, useCharColor: true, fit: "top", gap: 10 },
      initiative: { show: true, size: 24, corner: "tl" },
      bar: { radius: 5 },
      text: { labelSize: 14, valueSize: 16, maxSize: 11 },
      name: { pos: "barsTop", style: "text", size: 17, gap: 6 },
      decos: { panel: on({ color: "#0e1016", alpha: 0.86, radius: 12, borderW: 1, borderColor: "#ffffff", borderAlpha: 0.12, pad: 10, accentLine: true }),
        gloss: on({ alpha: 0.22 }) },
    },
  };

  const SAMPLE_STATUS = [["HP", 10, 12], ["MP", 11, 14], ["SAN", 52, 65], ["幸運", 60, 99], ["耐久", 5, 10], ["氣力", 3, 8], ["信仰", 40, 50], ["金錢", 120, 300]];

  const CHAR_COLORS = ["#e0563f", "#4fa3e3", "#8fd16a", "#e8c65a", "#b487e8", "#f08fb4", "#5fcfcf", "#f0a05a"];

  window.BarPresets = {
    FONTS, WEIGHTS, ICONS, SHAPES, FILLS, TRACKS, TEXT_LAYOUTS, ALIGNS, VALUE_MODES, OUTLINES,
    NAME_POS, NAME_STYLES, DECO_TYPES, BASE_LOOK, DESIGNS, SAMPLE_STATUS, CHAR_COLORS,
  };
})();
