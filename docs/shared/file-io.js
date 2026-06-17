import { makeId } from './ids.js';

export function exportProcesses(processes) {
  const payload = {
    app: 'WAKA:Named timers',
    version: 1,
    exportedAt: new Date().toISOString(),
    processes,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `waka-named-timers-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function importProcessesFromFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const rawProcesses = Array.isArray(parsed) ? parsed : parsed.processes;
  if (!Array.isArray(rawProcesses)) {
    throw new Error('Invalid import format');
  }
  return rawProcesses.map(normalizeImportedProcess);
}

function normalizeImportedProcess(process) {
  const normalized = {
    id: String(process.id || makeId('process')),
    name: String(process.name || 'Imported process'),
    description: String(process.description || ''),
    durationSeconds: Math.max(1, Math.floor(Number(process.durationSeconds) || 1)),
    soundMode: ['default', 'custom', 'silent'].includes(process.soundMode) ? process.soundMode : 'default',
    soundFileName: String(process.soundFileName || ''),
    soundFileDataUrl: String(process.soundFileDataUrl || ''),
    stages: Array.isArray(process.stages) ? process.stages.map(normalizeImportedStage) : [],
  };
  const total = normalized.stages.reduce((sum, stage) => sum + stage.durationSeconds, 0);
  if (normalized.durationSeconds < total) {
    normalized.durationSeconds = total || 1;
  }
  return normalized;
}

function normalizeImportedStage(stage) {
  return {
    id: String(stage.id || makeId('stage')),
    name: String(stage.name || 'Imported stage'),
    description: String(stage.description || ''),
    durationSeconds: Math.max(1, Math.floor(Number(stage.durationSeconds) || 1)),
  };
}
