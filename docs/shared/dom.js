export function qs(root, selector) {
  return root.querySelector(selector);
}

export function qsa(root, selector) {
  return Array.from(root.querySelectorAll(selector));
}

export function setText(root, selector, value) {
  const element = qs(root, selector);
  if (element) {
    element.textContent = value ?? '';
  }
}

export function setValue(root, selector, value) {
  const element = qs(root, selector);
  if (element) {
    element.value = value ?? '';
  }
}

export function setHidden(root, selector, hidden) {
  const element = qs(root, selector);
  if (element) {
    element.hidden = Boolean(hidden);
  }
}

export function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
