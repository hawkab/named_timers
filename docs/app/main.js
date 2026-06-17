import { renderAppShell } from '../components/app-shell/app-shell.js';
import { renderSidebar } from '../components/sidebar/sidebar.js';
import { renderProcessEditor } from '../components/process-editor/process-editor.js';
import { renderEmptyState } from '../components/empty-state/empty-state.js';
import { renderFloatingControls } from '../components/floating-controls/floating-controls.js';
import { renderToastStack, showToast } from '../components/toast/toast.js';
import { renderRunner, updateRunnerValues } from '../components/runner/runner.js';
import { t, setLanguage } from './i18n/i18n.js';
import { createBlankProcess, loadProcesses, loadSettings, saveProcesses, saveSettings, cloneProcessWithNewIds } from './state/store.js';
import { exportProcesses, importProcessesFromFile } from '../shared/file-io.js';
import { clearNode } from '../shared/dom.js';
import { playTimerSound } from '../shared/sound.js';
import { registerServiceWorker, requestNotificationsOnce, showLocalNotification } from '../shared/notifications.js';

class WakaNamedTimersApp {
  constructor(root) {
    this.root = root;
    this.processes = [];
    this.settings = loadSettings();
    this.selectedProcessId = this.settings.selectedProcessId;
    this.mode = 'editor';
    this.runState = null;
    this.toastStack = null;
    this.slots = {};
    this.runnerElement = null;
    this.tickId = null;
    this.sidebarRenderVersion = 0;
    this.mainRenderVersion = 0;
    this.floatingRenderVersion = 0;
  }

  async init() {
    setLanguage(this.settings.lang);
    document.documentElement.dataset.theme = this.settings.theme;
    this.processes = loadProcesses(t);
    if (!this.processes.some((process) => process.id === this.selectedProcessId)) {
      this.selectedProcessId = this.processes[0]?.id || null;
    }
    this.persistSettings();
    await registerServiceWorker();
    await this.renderAll();
    this.requestNotificationsOnOpen();
    this.tickId = window.setInterval(() => this.tick(), 250);
  }

  requestNotificationsOnOpen() {
    requestNotificationsOnce().then((permission) => {
      if (permission === 'granted') {
        this.toast(t('notificationsEnabled'), 'success');
      }
    });
    window.addEventListener('pointerdown', () => {
      if ('Notification' in window && Notification.permission === 'default') {
        requestNotificationsOnce().then((permission) => {
          if (permission === 'granted') {
            this.toast(t('notificationsEnabled'), 'success');
          }
        });
      }
    }, { once: true });
  }

  async renderAll() {
    clearNode(this.root);
    const shell = await renderAppShell({ t });
    this.root.appendChild(shell);
    this.slots.sidebar = shell.querySelector('[data-slot="sidebar"]');
    this.slots.main = shell.querySelector('[data-slot="main"]');
    this.slots.floating = shell.querySelector('[data-slot="floating"]');
    this.slots.toast = shell.querySelector('[data-slot="toast"]');
    await this.renderSidebar();
    await this.renderMain();
    await this.renderFloatingControls();
    this.toastStack = await renderToastStack();
    this.slots.toast.appendChild(this.toastStack);
  }

  async renderSidebar() {
    const slot = this.slots.sidebar;
    if (!slot) return;
    const version = ++this.sidebarRenderVersion;
    const sidebar = await renderSidebar({
      processes: this.uniqueProcesses(),
      selectedProcessId: this.selectedProcessId,
      t,
      onNew: () => this.createProcess(),
      onSelect: (id) => this.selectProcess(id),
      onDelete: (id) => this.deleteProcess(id),
      onExport: () => this.exportJson(),
      onImportFile: (file) => this.importJson(file),
    });
    if (version !== this.sidebarRenderVersion || this.slots.sidebar !== slot) {
      return;
    }
    clearNode(slot);
    slot.appendChild(sidebar);
  }

  async renderMain() {
    const slot = this.slots.main;
    if (!slot) return;
    const version = ++this.mainRenderVersion;
    this.runnerElement = null;
    const process = this.getSelectedProcess();
    let nextMain;
    if (!process) {
      nextMain = await renderEmptyState({
        t,
        onCreate: () => this.createProcess(),
      });
    } else if (this.mode === 'runner' && this.runState?.active && this.runState.processId === process.id) {
      const snapshot = this.getRunSnapshot();
      nextMain = await renderRunner({
        process,
        snapshot,
        t,
        onBackEdit: () => this.stopRun(),
        onTogglePause: () => this.togglePause(),
        onPreviousStage: () => this.previousStage(),
        onNextStage: () => this.nextStage(),
        onStop: () => this.stopRun(),
      });
    } else {
      this.mode = 'editor';
      nextMain = await renderProcessEditor({
        process,
        t,
        onAutosave: () => this.autosave(),
        onRerender: () => this.saveAndRerender(),
        onDeleteProcess: (id) => this.deleteProcess(id),
        onStartRun: (id) => this.startRun(id),
        onToast: (message, tone) => this.toast(message, tone),
      });
    }
    if (version !== this.mainRenderVersion || this.slots.main !== slot) {
      return;
    }
    clearNode(slot);
    slot.appendChild(nextMain);
    this.runnerElement = this.mode === 'runner' ? nextMain : null;
  }

  async renderFloatingControls() {
    const slot = this.slots.floating;
    if (!slot) return;
    const version = ++this.floatingRenderVersion;
    const controls = await renderFloatingControls({
      theme: this.settings.theme,
      lang: this.settings.lang,
      t,
      onThemeToggle: () => this.toggleTheme(),
      onLangToggle: () => this.toggleLanguage(),
    });
    if (version !== this.floatingRenderVersion || this.slots.floating !== slot) {
      return;
    }
    clearNode(slot);
    slot.appendChild(controls);
  }

  uniqueProcesses() {
    const seen = new Set();
    this.processes = this.processes.filter((process) => {
      if (!process || seen.has(process.id)) {
        return false;
      }
      seen.add(process.id);
      return true;
    });
    return this.processes;
  }

  getSelectedProcess() {
    return this.processes.find((process) => process.id === this.selectedProcessId) || null;
  }

  async selectProcess(id) {
    this.selectedProcessId = id;
    this.mode = 'editor';
    this.runState = null;
    this.persistSettings();
    await this.renderSidebar();
    await this.renderMain();
  }

  async createProcess() {
    const process = createBlankProcess(t);
    this.processes.unshift(process);
    this.selectedProcessId = process.id;
    this.mode = 'editor';
    this.persistAll();
    await this.renderSidebar();
    await this.renderMain();
  }

  async deleteProcess(id) {
    if (!window.confirm(t('confirmDeleteProcess'))) {
      return;
    }
    this.processes = this.processes.filter((process) => process.id !== id);
    if (this.selectedProcessId === id) {
      this.selectedProcessId = this.processes[0]?.id || null;
      this.runState = null;
      this.mode = 'editor';
    }
    this.persistAll();
    this.toast(t('processDeleted'), 'success');
    await this.renderSidebar();
    await this.renderMain();
  }

  autosave() {
    this.persistAll();
    void this.renderSidebar();
  }

  async saveAndRerender() {
    this.persistAll();
    await this.renderSidebar();
    await this.renderMain();
  }

  persistAll() {
    this.persistProcesses();
    this.persistSettings();
  }

  persistProcesses() {
    try {
      saveProcesses(this.uniqueProcesses());
    } catch (error) {
      this.toast(`${t('storageSaveFailed')} ${t('storageSaveFailedHint')}`, 'danger');
    }
  }

  persistSettings() {
    this.settings.selectedProcessId = this.selectedProcessId;
    saveSettings(this.settings);
  }

  exportJson() {
    exportProcesses(this.uniqueProcesses());
    this.toast(t('exportDone'), 'success');
  }

  async importJson(file) {
    try {
      const imported = await importProcessesFromFile(file);
      const existingIds = new Set(this.processes.map((process) => process.id));
      const conflicts = imported.filter((process) => existingIds.has(process.id));
      const replaceConflicts = conflicts.length > 0 && window.confirm(t('confirmImportConflicts'));
      const byId = new Map(this.processes.map((process, index) => [process.id, index]));
      const added = [];

      for (const process of imported) {
        const index = byId.get(process.id);
        if (index === undefined) {
          this.processes.push(process);
          added.push(process);
          continue;
        }
        if (replaceConflicts) {
          this.processes[index] = process;
          added.push(process);
        } else {
          const copy = cloneProcessWithNewIds(process);
          this.processes.push(copy);
          added.push(copy);
        }
      }

      if (added.length > 0) {
        this.selectedProcessId = added[0].id;
      }
      this.mode = 'editor';
      this.persistAll();
      this.toast(conflicts.length > 0 ? t('importDone') : t('importMerged'), 'success');
      await this.renderSidebar();
      await this.renderMain();
    } catch (error) {
      this.toast(t('importFailed'), 'danger');
    }
  }

  async toggleTheme() {
    this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = this.settings.theme;
    this.persistSettings();
    await this.renderFloatingControls();
  }

  async toggleLanguage() {
    this.settings.lang = this.settings.lang === 'ru' ? 'en' : 'ru';
    setLanguage(this.settings.lang);
    this.persistSettings();
    await this.renderAll();
  }

  async startRun(processId) {
    const process = this.processes.find((item) => item.id === processId);
    if (!process || process.stages.length === 0) return;
    this.selectedProcessId = processId;
    this.mode = 'runner';
    this.runState = {
      active: true,
      processId,
      stageIndex: 0,
      stageStartedAt: performance.now(),
      elapsedBeforePause: 0,
      paused: false,
    };
    this.persistSettings();
    await this.renderSidebar();
    await this.renderMain();
    this.announceCurrentStage();
  }

  stopRun() {
    this.mode = 'editor';
    this.runState = null;
    void this.renderMain();
  }

  togglePause() {
    if (!this.runState?.active) return;
    if (this.runState.paused) {
      this.runState.stageStartedAt = performance.now();
      this.runState.paused = false;
    } else {
      this.runState.elapsedBeforePause = this.currentElapsedSeconds();
      this.runState.paused = true;
    }
    void this.renderMain();
  }

  async previousStage() {
    if (!this.runState?.active || this.runState.stageIndex <= 0) return;
    this.startStage(this.runState.stageIndex - 1);
    await this.renderMain();
    this.announceCurrentStage();
  }

  async nextStage() {
    if (!this.runState?.active) return;
    const process = this.getSelectedProcess();
    if (!process) return;
    if (this.runState.stageIndex >= process.stages.length - 1) {
      await this.finishRun(process);
      return;
    }
    this.startStage(this.runState.stageIndex + 1);
    await this.renderMain();
    this.announceCurrentStage();
  }

  startStage(index) {
    if (!this.runState) return;
    this.runState.stageIndex = index;
    this.runState.stageStartedAt = performance.now();
    this.runState.elapsedBeforePause = 0;
    this.runState.paused = false;
  }

  tick() {
    if (!this.runState?.active || this.mode !== 'runner') return;
    const process = this.getSelectedProcess();
    if (!process) return;
    const stage = process.stages[this.runState.stageIndex];
    if (!stage) return;
    const elapsed = this.currentElapsedSeconds();
    if (!this.runState.paused && elapsed >= stage.durationSeconds) {
      void this.nextStage();
      return;
    }
    if (this.runnerElement) {
      updateRunnerValues(this.runnerElement, this.getRunSnapshot());
    }
  }

  currentElapsedSeconds() {
    if (!this.runState) return 0;
    if (this.runState.paused) {
      return this.runState.elapsedBeforePause;
    }
    return this.runState.elapsedBeforePause + ((performance.now() - this.runState.stageStartedAt) / 1000);
  }

  getRunSnapshot() {
    const process = this.getSelectedProcess();
    const stage = process?.stages[this.runState?.stageIndex || 0];
    const duration = Math.max(1, Number(stage?.durationSeconds) || 1);
    const elapsed = Math.max(0, Math.min(duration, this.currentElapsedSeconds()));
    const remaining = Math.max(0, duration - elapsed);
    return {
      stageIndex: this.runState?.stageIndex || 0,
      paused: Boolean(this.runState?.paused),
      elapsedSeconds: Math.floor(elapsed),
      remainingSeconds: Math.ceil(remaining),
      progress: (elapsed / duration) * 100,
      pauseLabel: this.runState?.paused ? t('resume') : t('pause'),
    };
  }

  announceCurrentStage() {
    const process = this.getSelectedProcess();
    const stage = process?.stages[this.runState?.stageIndex || 0];
    if (!process || !stage) return;
    const title = `${t('stageStarted')}: ${stage.name}`;
    this.toast(title, 'success');
    showLocalNotification(title, { body: stage.description || process.name });
    playTimerSound(process).catch(() => this.toast(t('soundPlaybackFailed'), 'danger'));
  }

  async finishRun(process) {
    this.toast(t('processFinished'), 'success');
    showLocalNotification(t('processFinished'), { body: t('processFinishedBody') });
    playTimerSound(process).catch(() => undefined);
    this.mode = 'editor';
    this.runState = null;
    await this.renderMain();
  }

  toast(message, tone = 'success') {
    showToast(this.toastStack, message, tone);
  }
}

const app = new WakaNamedTimersApp(document.getElementById('appRoot'));
app.init().catch((error) => {
  console.error(error);
  document.getElementById('appRoot').textContent = 'WAKA:Named timers failed to start.';
});
