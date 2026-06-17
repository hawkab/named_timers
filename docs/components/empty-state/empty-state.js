import { createFromTemplate } from '../../shared/component-loader.js';
import { setText } from '../../shared/dom.js';

const templateUrl = new URL('./empty-state.html', import.meta.url);
const styleUrl = new URL('./empty-state.css', import.meta.url);

export async function renderEmptyState({ t, onCreate }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  setText(element, '[data-role="title"]', t('emptyTitle'));
  setText(element, '[data-role="text"]', t('emptyText'));
  setText(element, '[data-action="create-first"]', t('createFirst'));
  element.querySelector('[data-action="create-first"]').addEventListener('click', onCreate);
  return element;
}
