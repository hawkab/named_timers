import { createFromTemplate } from '../../shared/component-loader.js';
import { clearNode, setText, setValue } from '../../shared/dom.js';
import { formatDuration, formatDurationLong } from '../../shared/time.js';
import { createBlankStage } from '../../app/state/store.js';
import { durationLabels } from '../../app/i18n/i18n.js';
import { renderDurationInput } from '../duration-input/duration-input.js';
import { renderStageEditor } from '../stage-editor/stage-editor.js';
import { renderSoundSettings } from '../sound-settings/sound-settings.js';

const templateUrl = new URL('./process-editor.html', import.meta.url);
const styleUrl = new URL('./process-editor.css', import.meta.url);

export async function renderProcessEditor({ process, t, onAutosave, onRerender, onDeleteProcess, onStartRun, onToast }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  setText(element, '[data-role="title"]', t('editor'));
  setText(element, '[data-role="process-name-label"]', t('processName'));
  setText(element, '[data-role="process-description-label"]', t('processDescription'));
  setText(element, '[data-role="process-duration-label"]', t('processDuration'));
  setText(element, '[data-action="start-run"]', t('startRun'));
  setText(element, '[data-action="delete-process"]', t('deleteProcess'));
  setText(element, '[data-role="used-label"]', t('used'));
  setText(element, '[data-role="remaining-label"]', t('remaining'));
  setText(element, '[data-role="total-label"]', t('total'));
  setText(element, '[data-role="stages-title"]', t('stages'));
  setText(element, '[data-role="stages-hint"]', t('stagesHint'));
  setText(element, '[data-action="add-stage"]', t('addStage'));
  setValue(element, '[data-role="process-name"]', process.name);
  setValue(element, '[data-role="process-description"]', process.description);

  const updateMetrics = () => updateCapacityMetrics(element, process, t);
  updateMetrics();

  element.querySelector('[data-role="process-name"]').addEventListener('input', (event) => {
    process.name = event.target.value;
    onAutosave();
  });
  element.querySelector('[data-role="process-description"]').addEventListener('input', (event) => {
    process.description = event.target.value;
    onAutosave();
  });
  element.querySelector('[data-action="delete-process"]').addEventListener('click', () => onDeleteProcess(process.id));
  element.querySelector('[data-action="start-run"]').addEventListener('click', () => {
    if (!canRun(process)) {
      onToast(t('runUnavailable'), 'danger');
      return;
    }
    onStartRun(process.id);
  });

  element.querySelector('[data-slot="process-duration"]').appendChild(await renderDurationInput({
    seconds: process.durationSeconds,
    t,
    onChange: (seconds) => {
      const used = usedByStages(process);
      const clamped = Math.max(used, seconds, 1);
      if (clamped !== seconds) {
        onToast(t('processDurationClamped'), 'danger');
      }
      process.durationSeconds = clamped;
      onAutosave();
      onRerender();
    },
  }));

  element.querySelector('[data-slot="sound-settings"]').appendChild(await renderSoundSettings({
    process,
    t,
    onChange: () => {
      onAutosave();
      updateMetrics();
    },
    onToast,
  }));

  const stagesSlot = element.querySelector('[data-slot="stages"]');
  await renderStages(stagesSlot, process, t, onAutosave, onRerender, onToast);
  installStageDrag(element, process, onAutosave, onRerender);

  element.querySelector('[data-action="add-stage"]').addEventListener('click', () => {
    const remaining = remainingCapacity(process);
    if (remaining <= 0) {
      onToast(t('noCapacity'), 'danger');
      return;
    }
    process.stages.push(createBlankStage(t, Math.min(remaining, 5 * 60)));
    onAutosave();
    onRerender();
  });

  return element;
}

async function renderStages(stagesSlot, process, t, onAutosave, onRerender, onToast) {
  clearNode(stagesSlot);
  for (const [index, stage] of process.stages.entries()) {
    stagesSlot.appendChild(await renderStageEditor({
      stage,
      index,
      t,
      onChange: () => onAutosave(),
      onDurationChange: (stageId, seconds) => {
        const target = process.stages.find((item) => item.id === stageId);
        if (!target) return;
        const usedWithoutStage = usedByStages(process) - target.durationSeconds;
        const available = Math.max(1, process.durationSeconds - usedWithoutStage);
        const clamped = Math.max(1, Math.min(seconds, available));
        if (clamped !== seconds) {
          onToast(t('capacityClamped'), 'danger');
        }
        target.durationSeconds = clamped;
        onAutosave();
        onRerender();
      },
      onDelete: (stageId) => {
        process.stages = process.stages.filter((item) => item.id !== stageId);
        onAutosave();
        onRerender();
      },
    }));
  }
  if (process.stages.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = t('noStages');
    stagesSlot.appendChild(empty);
  }
}

function updateCapacityMetrics(element, process, t) {
  const used = usedByStages(process);
  const remaining = remainingCapacity(process);
  setText(element, '[data-role="used-value"]', formatDuration(used));
  setText(element, '[data-role="remaining-value"]', formatDuration(Math.max(0, remaining)));
  setText(element, '[data-role="total-value"]', formatDuration(process.durationSeconds));
  const status = element.querySelector('[data-role="capacity-status"]');
  if (status) {
    status.textContent = remaining >= 0 ? t('validCapacity') : t('invalidCapacity');
    status.className = remaining >= 0 ? 'success-text' : 'danger-text';
  }
  const start = element.querySelector('[data-action="start-run"]');
  if (start) {
    start.disabled = !canRun(process);
  }
}

function usedByStages(process) {
  return process.stages.reduce((sum, stage) => sum + Math.max(0, Number(stage.durationSeconds) || 0), 0);
}

function remainingCapacity(process) {
  return process.durationSeconds - usedByStages(process);
}

function canRun(process) {
  return process.durationSeconds > 0
    && process.stages.length > 0
    && remainingCapacity(process) >= 0
    && process.stages.every((stage) => Number(stage.durationSeconds) > 0);
}

function installStageDrag(root, process, onAutosave, onRerender) {
  const list = root.querySelector('#stagesList');
  if (!list) return;
  let pointerDrag = null;
  let dragId = null;
  let originalOrder = null;
  let suppressClick = false;
  const abortController = new AbortController();
  const signal = abortController.signal;

  list.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const card = event.target.closest('.stage-editor');
    if (!card) return;
    if (event.target.closest('button,a,input,select,textarea,label,[contenteditable="true"]')) return;
    pointerDrag = {
      id: card.dataset.stageId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
  }, { signal });

  window.addEventListener('pointermove', onPointerMove, { signal });
  window.addEventListener('pointerup', onPointerUp, { signal });
  window.addEventListener('keydown', onKeyDown, { signal });

  function onPointerMove(event) {
    if (cleanupIfDisconnected()) return;
    if (!pointerDrag) return;
    const dx = event.clientX - pointerDrag.startX;
    const dy = event.clientY - pointerDrag.startY;
    if (!pointerDrag.dragging) {
      if (Math.hypot(dx, dy) < 7) return;
      pointerDrag.dragging = true;
      dragId = pointerDrag.id;
      originalOrder = process.stages.map((stage) => stage.id);
      const source = cardById(dragId);
      if (source) source.classList.add('dragging');
      document.body.classList.add('stage-dragging');
    }
    event.preventDefault();
    const rawTarget = rawCardAtPointer(event);
    const target = rawTarget && rawTarget.dataset.stageId !== dragId ? rawTarget : null;
    list.querySelectorAll('.stage-editor').forEach((card) => card.classList.toggle('drag-over', target === card));
    if (target) {
      previewSwap(dragId, target.dataset.stageId);
      return;
    }
    if (rawTarget || isPointerInsideList(event)) return;
    resetPreview();
  }

  function onPointerUp(event) {
    if (cleanupIfDisconnected()) return;
    if (!pointerDrag) return;
    const wasDragging = Boolean(pointerDrag.dragging);
    if (wasDragging) {
      suppressClick = true;
      window.setTimeout(() => { suppressClick = false; }, 250);
      if (isPointerInsideList(event)) {
        onAutosave();
        onRerender();
      } else if (Array.isArray(originalOrder)) {
        restoreOrder(originalOrder);
        onRerender();
      }
    }
    clearDragState();
  }

  function onKeyDown(event) {
    if (cleanupIfDisconnected()) return;
    if (event.key !== 'Escape' || !pointerDrag) return;
    if (Array.isArray(originalOrder)) {
      restoreOrder(originalOrder);
      onRerender();
    }
    clearDragState();
  }

  root.addEventListener('click', (event) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true, signal });

  function cleanupIfDisconnected() {
    if (root.isConnected) return false;
    abortController.abort();
    return true;
  }

  function cardById(stageId) {
    return Array.from(list.querySelectorAll('.stage-editor')).find((card) => card.dataset.stageId === stageId) || null;
  }

  function rawCardAtPointer(event) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    return element?.closest?.('.stage-editor') || null;
  }

  function isPointerInsideList(event) {
    const rect = list.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  }

  function restoreOrder(ids) {
    const byId = new Map(process.stages.map((stage) => [stage.id, stage]));
    const restored = ids.map((id) => byId.get(id)).filter(Boolean);
    const rest = process.stages.filter((stage) => !ids.includes(stage.id));
    process.stages = restored.concat(rest);
  }

  function swapStages(fromId, toId) {
    const fromIndex = process.stages.findIndex((stage) => stage.id === fromId);
    const toIndex = process.stages.findIndex((stage) => stage.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return false;
    const [item] = process.stages.splice(fromIndex, 1);
    process.stages.splice(toIndex, 0, item);
    return true;
  }

  function previewSwap(fromId, toId) {
    if (!Array.isArray(originalOrder)) return;
    restoreOrder(originalOrder);
    swapStages(fromId, toId);
    syncDomOrder();
    const source = cardById(fromId);
    if (source) source.classList.add('dragging');
  }

  function resetPreview() {
    if (!Array.isArray(originalOrder)) return;
    restoreOrder(originalOrder);
    syncDomOrder();
    const source = cardById(dragId);
    if (source) source.classList.add('dragging');
  }

  function syncDomOrder() {
    process.stages.forEach((stage) => {
      const card = cardById(stage.id);
      if (card) list.appendChild(card);
    });
  }

  function clearDragState() {
    document.body.classList.remove('stage-dragging');
    list.querySelectorAll('.stage-editor').forEach((card) => card.classList.remove('dragging', 'drag-over'));
    pointerDrag = null;
    dragId = null;
    originalOrder = null;
  }
}
