const templateCache = new Map();
const styleCache = new Set();

export async function loadTemplate(url) {
  const key = String(url);
  if (!templateCache.has(key)) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Component template failed: ${key}`);
    }
    templateCache.set(key, await response.text());
  }
  return templateCache.get(key);
}

export function ensureStyle(url) {
  const key = String(url);
  if (styleCache.has(key)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = key;
  link.dataset.componentStyle = key;
  document.head.appendChild(link);
  styleCache.add(key);
}

export async function createFromTemplate(templateUrl, styleUrl) {
  ensureStyle(styleUrl);
  const html = await loadTemplate(templateUrl);
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  const node = template.content.firstElementChild;
  if (!node) {
    throw new Error(`Component template is empty: ${templateUrl}`);
  }
  return node.cloneNode(true);
}
