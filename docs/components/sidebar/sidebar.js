import { createFromTemplate } from '../../shared/component-loader.js';
import { clearNode, setText } from '../../shared/dom.js';
import { renderProcessCard } from '../process-card/process-card.js';
import { renderFileActions } from '../file-actions/file-actions.js';

const templateUrl = new URL('./sidebar.html', import.meta.url);
const styleUrl = new URL('./sidebar.css', import.meta.url);

export async function renderSidebar({ processes, selectedProcessId, t, onNew, onSelect, onDelete, onExport, onImportFile }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  setText(element, '[data-role="title"]', t('savedProcesses'));
  setText(element, '[data-role="hint"]', t('savedProcessesHint'));
  setText(element, '[data-action="new-process"]', t('newProcess'));
  element.querySelector('[data-action="new-process"]').addEventListener('click', onNew);

  const fileActionsSlot = element.querySelector('[data-slot="file-actions"]');
  fileActionsSlot.appendChild(await renderFileActions({ t, onExport, onImportFile }));

  const list = element.querySelector('[data-slot="process-list"]');
  clearNode(list);
  for (const process of processes) {
    list.appendChild(await renderProcessCard({
      process,
      active: process.id === selectedProcessId,
      t,
      onSelect,
      onDelete,
    }));
  }
  return element;
}
