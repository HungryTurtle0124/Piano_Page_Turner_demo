export function $(id) {
  return document.getElementById(id);
}

export function setText(el, text) {
  el.textContent = String(text);
}

export function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

export function setEnabled(el, enabled) {
  el.disabled = !enabled;
}