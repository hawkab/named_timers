import { createFromTemplate } from '../../shared/component-loader.js';
import { setText } from '../../shared/dom.js';

const templateUrl = new URL('./app-shell.html', import.meta.url);
const styleUrl = new URL('./app-shell.css', import.meta.url);

export async function renderAppShell({ t }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  setText(element, '[data-role="app-title"]', t('appTitle'));
  setText(element, '[data-role="app-lead"]', t('appLead'));
  setText(element, '[data-role="autosave-pill"]', t('autoSaved'));
  return element;
}
