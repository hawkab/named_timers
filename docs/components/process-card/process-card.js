import { createFromTemplate } from '../../shared/component-loader.js';
import { setText } from '../../shared/dom.js';
import { formatDuration } from '../../shared/time.js';

const templateUrl = new URL('./process-card.html', import.meta.url);
const styleUrl = new URL('./process-card.css', import.meta.url);

export async function renderProcessCard({ process, active, t, onSelect, onDelete }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  element.dataset.processId = process.id;
  element.classList.toggle('is-active', active);
  setText(element, '[data-role="name"]', process.name);
  setText(element, '[data-role="description"]', process.description || '—');
  setText(element, '[data-role="meta"]', `${process.stages.length} · ${formatDuration(process.durationSeconds)}`);
  const deleteButton = element.querySelector('[data-action="delete-process"]');
  deleteButton.title = t('deleteProcess');
  deleteButton.setAttribute('aria-label', t('deleteProcess'));
  element.querySelector('[data-action="select-process"]').addEventListener('click', () => onSelect(process.id));
  deleteButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onDelete(process.id);
  });
  return element;
}
