import { createFromTemplate } from '../../shared/component-loader.js';

const templateUrl = new URL('./floating-controls.html', import.meta.url);
const styleUrl = new URL('./floating-controls.css', import.meta.url);

export async function renderFloatingControls({ theme, lang, t, onThemeToggle, onLangToggle }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  const themeButton = element.querySelector('[data-action="theme"]');
  const langButton = element.querySelector('[data-action="lang"]');
  themeButton.textContent = theme === 'light' ? '☀' : '☾';
  themeButton.title = t('themeToggle');
  themeButton.setAttribute('aria-label', t('themeToggle'));
  langButton.dataset.lang = lang;
  langButton.title = t('languageToggle');
  langButton.setAttribute('aria-label', t('languageToggle'));
  themeButton.addEventListener('click', onThemeToggle);
  langButton.addEventListener('click', onLangToggle);
  return element;
}
