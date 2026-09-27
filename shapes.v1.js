/*!
 * shapes.v1.js - bar outlines, icons and small SVG helpers (no UI, no state)
 *
 * A bar shape is a function (w, h, opts) -> SVG path data in pixels. The same
 * path is used for CSS clip-path (track, fill, overlays) and for the border,
 * which is the path stroked at double width and clipped by itself, so it lies
 * exactly inside any shape without offset math.
 */
(function () {
  "use strict";

  const n = v => String(Math.round(v * 100) / 100);

  function roundRect(w, h, r) {
    r = Math.max(0, Math.min(r || 0, h / 2, w / 2));
    if (!r) return `M0 0H${n(w)}V${n(h)}H0Z`;
    const a = `A${n(r)} ${n(r)} 0 0 1`;
    return `M${n(r)} 0H${n(w - r)}${a} ${n(w)} ${n(r)}V${n(h - r)}${a} ${n(w - r)} ${n(h)}`
      + `H${n(r)}${a} 0 ${n(h - r)}V${n(r)}${a} ${n(r)} 0Z`;
  }

  const PATHS = {
    rect: (w, h, o) => roundRect(w, h, o.radius),
    pill: (w, h) => roundRect(w, h, h / 2),
    slant: (w, h, o) => {
      const s = Math.min(o.slant, w / 3);
      return `M${n(s)} 0H${n(w)}L${n(w - s)} ${n(h)}H0Z`;
    },
    chamfer: (w, h, o) => {
      const c = Math.min(o.cut, h / 2, w / 4);
      return `M${n(c)} 0H${n(w - c)}L${n(w)} ${n(c)}V${n(h - c)}L${n(w - c)} ${n(h)}H${n(c)}L0 ${n(h - c)}V${n(c)}Z`;
    },
    arrow: (w, h, o) => {
      const c = Math.min(o.cut, w / 4);
      return `M${n(c)} 0H${n(w - c)}L${n(w)} ${n(h / 2)}L${n(w - c)} ${n(h)}H${n(c)}L0 ${n(h / 2)}Z`;
    },
    tag: (w, h, o) => {
      const c = Math.min(o.cut, h, w / 4);
      return `M0 0H${n(w - c)}L${n(w)} ${n(c)}V${n(h)}H${n(c)}L0 ${n(h - c)}Z`;
    },
  };

  function path(shape, w, h, opts) {
    return (PATHS[shape] || PATHS.rect)(w, h, opts || {});
  }

  // ---------------------------------------------------------------- svg helpers

  // Minimal escaping for an SVG inside url("data:..."). Attributes must use single quotes.
  function svgUrl(svg) {
    const body = svg.replace(/\s+/g, " ").replace(/%/g, "%25").replace(/#/g, "%23")
      .replace(/</g, "%3C").replace(/>/g, "%3E").replace(/"/g, "'");
    return `url("data:image/svg+xml,${body}")`;
  }

  function svgOpen(w, h) {
    return `<svg xmlns='http://www.w3.org/2000/svg' width='${n(w)}' height='${n(h)}' viewBox='0 0 ${n(w)} ${n(h)}' preserveAspectRatio='none'>`;
  }

  // Border drawn inside the shape. double: two bands, [0, width] and [2*width, 3*width].
  function borderUrl(d, w, h, o) {
    const clip = `<clipPath id='c'><path d='${d}'/></clipPath>`;
    let body;
    if (o.double) {
      const stroke = (color, k) => `<path d='${d}' fill='none' stroke='${color}' stroke-width='${n(o.width * k)}'/>`;
      body = `<mask id='m' maskUnits='userSpaceOnUse' x='0' y='0' width='${n(w)}' height='${n(h)}'>${stroke("#fff", 6)}${stroke("#000", 4)}${stroke("#fff", 2)}</mask>`
        + `<g clip-path='url(#c)'><rect width='${n(w)}' height='${n(h)}' fill='${o.color}' fill-opacity='${o.alpha}' mask='url(#m)'/></g>`;
    } else {
      body = `<path d='${d}' fill='none' stroke='${o.color}' stroke-opacity='${o.alpha}' stroke-width='${n(o.width * 2)}' clip-path='url(#c)'/>`;
    }
    return svgUrl(svgOpen(w, h) + clip + body + "</svg>");
  }

  // Dark specks. alpha 0..1
  function grainUrl(alpha, size) {
    const s = size || 140, k = n(alpha * 3);
    return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}'>`
      + `<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>`
      + `<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${k} 0 0 0 ${n(-alpha * 1.35)}'/></filter>`
      + `<rect width='100%' height='100%' filter='url(#g)'/></svg>`);
  }

  // ---------------------------------------------------------------- icons (24 x 24, used as masks)

  function starPath(cx, cy, outer, inner, points) {
    let d = "";
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? inner : outer, a = Math.PI / points * i - Math.PI / 2;
      d += (i ? "L" : "M") + n(cx + r * Math.cos(a)) + " " + n(cy + r * Math.sin(a));
    }
    return d + "Z";
  }

  const circle = (cx, cy, r) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0Z`;

  const ICON_PATHS = {
    heart: { d: "M12 21C5 15.5 2 12 2 8.2 2 5.3 4.3 3 7.1 3 9.1 3 11 4.2 12 6 13 4.2 14.9 3 16.9 3 19.7 3 22 5.3 22 8.2 22 12 19 15.5 12 21Z" },
    drop: { d: "M12 2.5C12 2.5 5 10.2 5 14.8A7 7 0 0 0 19 14.8C19 10.2 12 2.5 12 2.5Z" },
    star: { d: starPath(12, 12.8, 10.5, 4.4, 5) },
    sparkle: { d: "M12 1.5C12.9 8.2 15.8 11.1 22.5 12 15.8 12.9 12.9 15.8 12 22.5 11.1 15.8 8.2 12.9 1.5 12 8.2 11.1 11.1 8.2 12 1.5Z" },
    eye: { d: "M12 5C6.6 5 2.8 9.1 1.5 12 2.8 14.9 6.6 19 12 19S21.2 14.9 22.5 12C21.2 9.1 17.4 5 12 5Z" + circle(12, 12, 4) + circle(12, 12, 1.8), evenodd: true },
    moon: { d: "M14.8 2.6A9.6 9.6 0 1 0 21.4 15.9 7.6 7.6 0 0 1 14.8 2.6Z" },
    bolt: { d: "M13.5 1.5 4 13.5H11L9.8 22.5 20 10H13Z" },
    shield: { d: "M12 2 20.5 5.2V11.2C20.5 16.6 16.9 20.5 12 22 7.1 20.5 3.5 16.6 3.5 11.2V5.2Z" },
    cross: { d: "M9 2.5H15V9H21.5V15H15V21.5H9V15H2.5V9H9Z" },
    clover: { d: circle(8.4, 8.4, 3.9) + circle(15.6, 8.4, 3.9) + circle(8.4, 15, 3.9) + circle(15.6, 15, 3.9) + "M11.2 15H12.8L13.6 22.5H10.4Z" },
    skull: { d: "M12 2.5C6.9 2.5 3.5 6 3.5 10.6 3.5 13.4 4.8 15.5 6.8 16.7V19.8C6.8 20.8 7.5 21.5 8.4 21.5H15.6C16.5 21.5 17.2 20.8 17.2 19.8V16.7C19.2 15.5 20.5 13.4 20.5 10.6 20.5 6 17.1 2.5 12 2.5Z"
      + circle(8.6, 11.3, 2.2) + circle(15.4, 11.3, 2.2) + "M12 14.2 13.3 16.6H10.7Z", evenodd: true },
    flame: { d: "M12 1.5C13 5.8 18 8.6 18 14.3A6 6 0 0 1 6 14.3C6 11.2 7.8 9.6 8.7 7.8 9.3 9.9 10.4 10.9 11.4 11.1 10.8 8 10.9 4.8 12 1.5Z" },
    dot: { d: circle(12, 12, 7.5) },
  };

  function iconUrl(key) {
    const icon = ICON_PATHS[key];
    if (!icon) return "none";
    const rule = icon.evenodd ? " fill-rule='evenodd'" : "";
    return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path${rule} d='${icon.d}'/></svg>`);
  }

  // Plain SVG markup for UI thumbnails.
  function iconSvg(key, color) {
    const icon = ICON_PATHS[key];
    if (!icon) return "";
    const rule = icon.evenodd ? ' fill-rule="evenodd"' : "";
    return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path${rule} fill="${color}" d="${icon.d}"/></svg>`;
  }

  window.BarShapes = { PATHS, path, svgUrl, borderUrl, grainUrl, iconUrl, iconSvg, ICON_PATHS };
})();
