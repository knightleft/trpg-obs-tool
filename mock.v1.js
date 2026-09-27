/*!
 * mock.v1.js - a stand-in for CCFOLIA's character status page, for the preview
 *
 * Structure and base styles copied from CCFOLIA's bundle (see css.v1.js for the
 * tree). Class names starting with "ccf-" exist only here; the generated CSS
 * must never rely on them. The base styles are kept so that a generated CSS
 * that forgets to override something looks broken here too, not only in OBS.
 */
(function () {
  "use strict";

  const FONT = "Roboto, Helvetica, Arial, sans-serif";
  const LIGHT = "#f5f5f5", DARK = "#424242";
  const outline = [
    "1px 1px 0", "-1px -1px 0", "-1px 1px 0", "1px -1px 0", "0 1px 0", "0 -1px 0", "-1px 0 0", "1px 0 0",
  ].map(s => `${s} ${LIGHT}`).join(", ");

  // Page-wide behavior seen in OBS (2026-09-14): #root fills the viewport height, and boxes
  // use content-box sizing (padding adds to a set width). Reproduced so the preview breaks the same way.
  const BASE_CSS = `
html, body, #root { height: 100%; }
body { color: rgba(0, 0, 0, 0.87); font-family: ${FONT}; font-size: 1rem; line-height: 1.5; background-color: #fff; }
.ccf-page { padding: 8px; }
.ccf-item { margin-bottom: 16px; display: flex; align-items: flex-start; }
.MuiBadge-root { position: relative; display: inline-flex; vertical-align: middle; flex-shrink: 0; }
.MuiBadge-badge { display: flex; flex-flow: row wrap; place-content: center; align-items: center; position: absolute; box-sizing: border-box;
  font-family: ${FONT}; font-weight: 500; font-size: 0.75rem; min-width: 20px; line-height: 1; padding: 0 6px; height: 20px; border-radius: 10px;
  z-index: 1; transition: transform 225ms cubic-bezier(0.4, 0, 0.2, 1); background-color: #9c27b0; color: #fff;
  top: 0; right: 0; transform: scale(1) translate(50%, -50%); transform-origin: 100% 0%; }
.ccf-badge .MuiBadge-badge { top: 4px; right: 4px; background: ${LIGHT}; color: ${DARK}; }
.MuiBadge-badge.MuiBadge-invisible { transform: scale(0) translate(50%, -50%); }
.MuiAvatar-root { position: relative; display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 40px; height: 40px;
  font-family: ${FONT}; font-size: 1.25rem; line-height: 1; border-radius: 50%; overflow: hidden; user-select: none; }
.MuiAvatar-square { border-radius: 0; }
.MuiAvatar-colorDefault { color: #fff; background-color: #bdbdbd; }
.MuiAvatar-img { width: 100%; height: 100%; text-align: center; object-fit: cover; color: transparent; text-indent: 10000px; }
.ccf-avatar { border-radius: 4px; border: 1px solid ${LIGHT}; width: 40px; height: 40px; background: rgba(0, 0, 0, 0.64); }
.ccf-avatar img { object-position: top; }
.ccf-avatar-box { display: block; overflow: hidden; }
.ccf-avatar-box img { max-width: 100%; max-height: 100%; }
.ccf-side { flex: 1; }
.ccf-bars { margin-left: 4px; max-width: 210px; display: flex; flex-wrap: wrap; }
.ccf-row { margin: 2px; width: 96px; position: relative; cursor: pointer; }
.ccf-text { padding: 1px; display: flex; justify-content: space-between; position: absolute; inset: 0; z-index: 1; }
.MuiTypography-root { margin: 0; }
.MuiTypography-body2 { font-family: ${FONT}; font-weight: 400; font-size: 0.875rem; line-height: 1.43; letter-spacing: 0.01071em; }
.MuiTypography-noWrap { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ccf-label, .ccf-value { display: block; line-height: 1; color: ${DARK}; font-weight: 800; text-shadow: ${outline}; }
.ccf-current[color="secondary"] { color: rgb(154, 0, 54); }
.ccf-box { height: 16px; padding: 0; position: relative; box-sizing: content-box; }
.ccf-track { width: 100%; height: 16px; padding: 0; position: absolute; border-radius: 1px; background: ${LIGHT}; opacity: 0.38; }
.ccf-fill { left: 0%; margin-top: 0; height: 16px; background: ${LIGHT}; position: absolute; border-radius: 1px; }
`;

  const SAMPLE_AVATAR = "data:image/svg+xml," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>"
    + "<defs><linearGradient id='b' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#5a6a8a'/><stop offset='1' stop-color='#2a3148'/></linearGradient></defs>"
    + "<rect width='200' height='200' fill='url(#b)'/>"
    + "<circle cx='100' cy='78' r='38' fill='#e8dccb'/>"
    + "<path d='M100 34c-30 0-46 20-44 48 8-16 22-24 44-24s36 8 44 24c2-28-14-48-44-48z' fill='#3a2c24'/>"
    + "<path d='M30 200c4-46 34-72 70-72s66 26 70 72z' fill='#8a3a3a'/>"
    + "<path d='M80 128l20 26 20-26' fill='#f2ede4'/></svg>");

  function documentHtml() {
    return "<!doctype html><html><head><meta charset='utf-8'>"
      + `<style id="ccf-base">${BASE_CSS}</style><style id="obs-custom"></style></head>`
      + "<body class='transparent'><div id='root'><div class='ccf-page'><div class='ccf-item'>"
      + "<span class='MuiBadge-root ccf-badge'>"
      + "<div class='MuiAvatar-root MuiAvatar-circular MuiAvatar-colorDefault ccf-avatar'><div class='ccf-avatar-box'>"
      + "<div class='MuiAvatar-root MuiAvatar-square'><img alt='' draggable='false' class='MuiAvatar-img'></div></div></div>"
      + "<span class='MuiBadge-badge MuiBadge-standard MuiBadge-anchorOriginTopRight MuiBadge-anchorOriginTopRightRectangular MuiBadge-overlapRectangular MuiBadge-colorSecondary'></span>"
      + "</span><div class='ccf-side'><div variant='bar' class='ccf-bars'></div></div>"
      + "</div></div></div></body></html>";
  }

  function makeRow(doc) {
    const rowEl = doc.createElement("div");
    rowEl.className = "ccf-row";
    const text = doc.createElement("div");
    text.className = "ccf-text";
    const label = doc.createElement("p");
    label.className = "MuiTypography-root MuiTypography-body2 MuiTypography-noWrap ccf-label";
    const value = doc.createElement("p");
    value.className = "MuiTypography-root MuiTypography-body2 MuiTypography-noWrap ccf-value";
    const current = doc.createElement("span");
    current.className = "ccf-current";
    // React renders [<span>, "/", max] as three separate nodes.
    value.append(current, doc.createTextNode("/"), doc.createTextNode(""));
    text.append(label, value);
    const box = doc.createElement("div");
    box.className = "ccf-box";
    const track = doc.createElement("div");
    track.className = "ccf-track";
    const fill = doc.createElement("div");
    fill.className = "ccf-fill";
    box.append(track, fill);
    rowEl.append(text, box);
    return rowEl;
  }

  // data: { css, statuses: [[label, value, max]], initiative, avatar }
  function update(doc, data) {
    const style = doc.getElementById("obs-custom");
    if (style.textContent !== data.css) style.textContent = data.css;

    const img = doc.querySelector(".MuiAvatar-img");
    const src = data.avatar || SAMPLE_AVATAR;
    if (img.getAttribute("src") !== src) img.setAttribute("src", src);

    const badge = doc.querySelector(".MuiBadge-badge");
    badge.textContent = String(data.initiative);
    badge.classList.toggle("MuiBadge-invisible", data.initiative === 0);

    const bars = doc.querySelector(".ccf-bars");
    const list = data.statuses.slice(0, 8);
    while (bars.children.length > list.length) bars.lastElementChild.remove();
    list.forEach((s, i) => {
      const rowEl = bars.children[i] || bars.appendChild(makeRow(doc));
      const max = Math.trunc(s[2]), value = Math.trunc(s[1]);
      rowEl.querySelector(".ccf-label").textContent = s[0];
      const v = rowEl.querySelector(".ccf-value");
      v.childNodes[0].textContent = String(value);
      v.childNodes[0].setAttribute("color", value / max <= 0.8 ? "secondary" : "default");
      v.childNodes[2].nodeValue = String(max);
      rowEl.querySelector(".ccf-fill").style.width = "".concat(100 * Math.max(Math.min(value / max, 1), 0), "%");
    });
  }

  // Size an OBS browser source needs: the #root box plus its outer margin.
  function measure(doc) {
    const root = doc.getElementById("root");
    const rect = root.getBoundingClientRect();
    const cs = doc.defaultView.getComputedStyle(root);
    return {
      w: Math.ceil(rect.right + (parseFloat(cs.marginRight) || 0)),
      h: Math.ceil(rect.bottom + (parseFloat(cs.marginBottom) || 0)),
    };
  }

  window.BarMock = { documentHtml, update, measure, SAMPLE_AVATAR };
})();
