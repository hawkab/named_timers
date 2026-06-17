import { createFromTemplate } from '../../shared/component-loader.js';
import { setText, setValue } from '../../shared/dom.js';
import { renderDurationInput } from '../duration-input/duration-input.js';

const templateUrl = new URL('./stage-editor.html', import.meta.url);
const styleUrl = new URL('./stage-editor.css', import.meta.url);

export async function renderStageEditor({ stage, index, t, onChange, onDurationChange, onDelete }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  element.dataset.stageId = stage.id;
  element.querySelector('[data-role="drag-handle"]').title = t('dragStage');
  setText(element, '[data-role="index"]', `${t('stage')} ${index + 1}`);
  setText(element, '[data-role="name-label"]', t('stageName'));
  setText(element, '[data-role="description-label"]', t('stageDescription'));
  setText(element, '[data-role="duration-label"]', t('stageDuration'));
  setText(element, '[data-action="delete-stage"]', t('deleteStage'));
  setValue(element, '[data-role="name-input"]', stage.name);
  setValue(element, '[data-role="description-input"]', stage.description);

  element.querySelector('[data-role="name-input"]').addEventListener('input', (event) => {
    stage.name = event.target.value;
    onChange();
  });
  element.querySelector('[data-role="description-input"]').addEventListener('input', (event) => {
    stage.description = event.target.value;
    onChange();
  });
  element.querySelector('[data-action="delete-stage"]').addEventListener('click', () => onDelete(stage.id));
  element.querySelector('[data-slot="duration"]').appendChild(await renderDurationInput({
    seconds: stage.durationSeconds,
    t,
    onChange: (seconds) => onDurationChange(stage.id, seconds),
  }));
  return element;
}
