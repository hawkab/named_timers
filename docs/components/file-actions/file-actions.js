import { createFromTemplate } from '../../shared/component-loader.js';
import { setText } from '../../shared/dom.js';

const templateUrl = new URL('./file-actions.html', import.meta.url);
const styleUrl = new URL('./file-actions.css', import.meta.url);

export async function renderFileActions({ t, onExport, onImportFile }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  const input = element.querySelector('[data-role="file-input"]');
  setText(element, '[data-action="export"]', t('exportJson'));
  setText(element, '[data-action="import"]', t('importJson'));
  element.querySelector('[data-action="export"]').addEventListener('click', onExport);
  element.querySelector('[data-action="import"]').addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) onImportFile(file);
    input.value = '';
  });
  return element;
}
