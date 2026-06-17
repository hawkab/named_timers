import { createFromTemplate } from '../../shared/component-loader.js';
import { clearNode, setText } from '../../shared/dom.js';
import { formatDuration } from '../../shared/time.js';
import { renderProgressBar, setProgressBar } from '../progress-bar/progress-bar.js';

const templateUrl = new URL('./runner.html', import.meta.url);
const styleUrl = new URL('./runner.css', import.meta.url);

export async function renderRunner({ process, snapshot, t, onBackEdit, onTogglePause, onPreviousStage, onNextStage, onStop }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  const currentStage = process.stages[snapshot.stageIndex];
  setText(element, '[data-role="runner-title"]', t('runner'));
  setText(element, '[data-role="stage-name"]', currentStage.name);
  setText(element, '[data-role="stage-counter"]', `${t('stage')} ${snapshot.stageIndex + 1} / ${process.stages.length}`);
  setText(element, '[data-role="stage-description"]', currentStage.description || '—');
  setText(element, '[data-role="duration-label"]', t('fullStageDuration'));
  setText(element, '[data-role="duration-value"]', formatDuration(currentStage.durationSeconds));
  setText(element, '[data-role="remaining-label"]', t('remainingStageTime'));
  setText(element, '[data-role="elapsed-label"]', t('elapsedStageTime'));
  setText(element, '[data-action="back-edit"]', t('backToEdit'));
  setText(element, '[data-action="toggle-pause"]', snapshot.paused ? t('resume') : t('pause'));
  setText(element, '[data-action="previous-stage"]', t('previousStage'));
  setText(element, '[data-action="next-stage"]', t('nextStage'));
  setText(element, '[data-action="stop"]', t('stop'));
  element.querySelector('[data-action="previous-stage"]').disabled = snapshot.stageIndex <= 0;

  element.querySelector('[data-slot="progress"]').appendChild(await renderProgressBar({ progress: snapshot.progress }));
  renderTimeline(element.querySelector('[data-slot="timeline"]'), process, snapshot.stageIndex, t);
  updateRunnerValues(element, snapshot);

  element.querySelector('[data-action="back-edit"]').addEventListener('click', onBackEdit);
  element.querySelector('[data-action="toggle-pause"]').addEventListener('click', onTogglePause);
  element.querySelector('[data-action="previous-stage"]').addEventListener('click', onPreviousStage);
  element.querySelector('[data-action="next-stage"]').addEventListener('click', onNextStage);
  element.querySelector('[data-action="stop"]').addEventListener('click', onStop);
  return element;
}

export function updateRunnerValues(element, snapshot) {
  if (!element) return;
  setText(element, '[data-role="remaining-value"]', formatDuration(snapshot.remainingSeconds));
  setText(element, '[data-role="elapsed-value"]', formatDuration(snapshot.elapsedSeconds));
  const progress = element.querySelector('.progress-bar');
  if (progress) setProgressBar(progress, snapshot.progress);
  element.classList.toggle('is-red', snapshot.remainingSeconds <= 10);
  element.classList.toggle('is-yellow', snapshot.remainingSeconds > 10 && snapshot.progress >= 50);
  element.classList.toggle('is-green', snapshot.remainingSeconds > 10 && snapshot.progress < 50);
  const pauseButton = element.querySelector('[data-action="toggle-pause"]');
  if (pauseButton && snapshot.pauseLabel) pauseButton.textContent = snapshot.pauseLabel;
}

function renderTimeline(slot, process, activeIndex, t) {
  clearNode(slot);
  process.stages.forEach((stage, index) => {
    const status = index < activeIndex ? 'done' : index === activeIndex ? 'current' : 'upcoming';
    const item = document.createElement('article');
    item.className = `runner__timeline-item is-${status}`;
    const statusLabel = status === 'done' ? t('done') : status === 'current' ? t('current') : t('upcoming');
    item.innerHTML = `
      <span class="runner__timeline-dot">${index + 1}</span>
      <span>
        <span class="runner__timeline-title"></span>
        <span class="runner__timeline-meta"></span>
      </span>
      <span class="pill"></span>`;
    item.querySelector('.runner__timeline-title').textContent = stage.name;
    item.querySelector('.runner__timeline-meta').textContent = stage.description || '';
    item.querySelector('.pill').textContent = `${statusLabel} · ${formatDuration(stage.durationSeconds)}`;
    slot.appendChild(item);
  });
}
