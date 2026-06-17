import { createFromTemplate } from '../../shared/component-loader.js';

const templateUrl = new URL('./progress-bar.html', import.meta.url);
const styleUrl = new URL('./progress-bar.css', import.meta.url);

export async function renderProgressBar({ progress }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  setProgressBar(element, progress);
  return element;
}

export function setProgressBar(element, progress) {
  const value = Math.max(0, Math.min(100, Number(progress) || 0));
  element.setAttribute('aria-valuenow', String(Math.round(value)));
  const fill = element.querySelector('[data-role="fill"]');
  if (fill) {
    fill.style.width = `${value}%`;
  }
}
