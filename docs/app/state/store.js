import { makeId } from '../../shared/ids.js';
import { createDefaultProcesses } from './default-data.js';

const PROCESS_KEY = 'waka.namedTimers.processes.v1';
const SETTINGS_KEY = 'waka.namedTimers.settings.v1';
const LEGACY_PROCESS_KEY = 'process-timer-studio.processes.v1';
const LEGACY_SETTINGS_KEY = 'process-timer-studio.settings.v1';

export function loadProcesses(t) {
  const current = readJson(PROCESS_KEY);
  if (Array.isArray(current) && current.length > 0) {
    return current.map(normalizeProcess);
  }
  const legacy = readJson(LEGACY_PROCESS_KEY);
  if (Array.isArray(legacy) && legacy.length > 0) {
    const migrated = legacy.map(normalizeProcess);
    saveProcesses(migrated);
    return migrated;
  }
  const defaults = createDefaultProcesses(t);
  saveProcesses(defaults);
  return defaults;
}

export function saveProcesses(processes) {
  localStorage.setItem(PROCESS_KEY, JSON.stringify(processes));
}

export function loadSettings() {
  const current = readJson(SETTINGS_KEY) || readJson(LEGACY_SETTINGS_KEY) || {};
  return {
    theme: current.theme === 'light' ? 'light' : 'dark',
    lang: current.lang === 'en' ? 'en' : 'ru',
    selectedProcessId: typeof current.selectedProcessId === 'string' ? current.selectedProcessId : null,
  };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function createBlankProcess(t) {
  return {
    id: makeId('process'),
    name: t('newProcessName'),
    description: t('newProcessDescription'),
    durationSeconds: 30 * 60,
    soundMode: 'default',
    soundFileName: '',
    soundFileDataUrl: '',
    stages: [],
  };
}

export function createBlankStage(t, durationSeconds = 5 * 60) {
  return {
    id: makeId('stage'),
    name: t('newStageName'),
    description: t('newStageDescription'),
    durationSeconds,
  };
}

export function cloneProcessWithNewIds(process) {
  return {
    ...process,
    id: makeId('process'),
    name: `${process.name} copy`,
    stages: (process.stages || []).map((stage) => ({ ...stage, id: makeId('stage') })),
  };
}

function normalizeProcess(process) {
  const stages = Array.isArray(process.stages) ? process.stages.map(normalizeStage) : [];
  const total = stages.reduce((sum, stage) => sum + stage.durationSeconds, 0);
  return {
    id: String(process.id || makeId('process')),
    name: String(process.name || 'Process'),
    description: String(process.description || ''),
    durationSeconds: Math.max(1, Math.floor(Number(process.durationSeconds) || 1), total),
    soundMode: ['default', 'custom', 'silent'].includes(process.soundMode) ? process.soundMode : 'default',
    soundFileName: String(process.soundFileName || ''),
    soundFileDataUrl: String(process.soundFileDataUrl || ''),
    stages,
  };
}

function normalizeStage(stage) {
  return {
    id: String(stage.id || makeId('stage')),
    name: String(stage.name || 'Stage'),
    description: String(stage.description || ''),
    durationSeconds: Math.max(1, Math.floor(Number(stage.durationSeconds) || 1)),
  };
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}
