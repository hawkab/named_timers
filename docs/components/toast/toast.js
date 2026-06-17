import { createFromTemplate } from '../../shared/component-loader.js';

const templateUrl = new URL('./toast.html', import.meta.url);
const styleUrl = new URL('./toast.css', import.meta.url);

export async function renderToastStack() {
  return createFromTemplate(templateUrl, styleUrl);
}

export function showToast(stack, message, tone = 'success') {
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = `toast is-${tone}`;
  toast.textContent = message;
  stack.appendChild(toast);
  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px) scale(.98)';
    toast.style.transition = 'opacity .18s ease, transform .18s ease';
  }, 3100);
  window.setTimeout(() => toast.remove(), 3400);
}
