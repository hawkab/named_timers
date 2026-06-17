import { createFromTemplate } from '../../shared/component-loader.js';
import { setText } from '../../shared/dom.js';
import { playTimerSound, readAudioFileAsDataUrl } from '../../shared/sound.js';

const templateUrl = new URL('./sound-settings.html', import.meta.url);
const styleUrl = new URL('./sound-settings.css', import.meta.url);
const SOUND_FILE_MAX_BYTES = 2 * 1024 * 1024;

export async function renderSoundSettings({ process, t, onChange, onToast }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  const mode = element.querySelector('[data-role="mode"]');
  const fileInput = element.querySelector('[data-role="file-input"]');
  setText(element, '[data-role="title"]', t('soundSettings'));
  setText(element, '[data-role="hint"]', t('soundHint'));
  setText(element, '[data-role="mode-label"]', t('soundMode'));
  setText(element, '[data-role="mode-default"]', t('soundDefault'));
  setText(element, '[data-role="mode-custom"]', t('soundCustom'));
  setText(element, '[data-role="mode-silent"]', t('soundSilent'));
  setText(element, '[data-action="test-sound"]', t('testSound'));
  setText(element, '[data-action="choose-file"]', process.soundFileName ? t('replaceSoundFile') : t('chooseSoundFile'));
  setText(element, '[data-action="clear-file"]', t('clearSound'));
  mode.value = process.soundMode || 'default';
  updateCurrentText(element, process, t);

  mode.addEventListener('change', () => {
    process.soundMode = mode.value;
    onChange();
    updateCurrentText(element, process, t);
  });

  element.querySelector('[data-action="choose-file"]').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      process.soundFileDataUrl = await readAudioFileAsDataUrl(file, SOUND_FILE_MAX_BYTES);
      process.soundFileName = file.name;
      process.soundMode = 'custom';
      mode.value = 'custom';
      onChange();
      onToast(t('soundSaved'), 'success');
      updateCurrentText(element, process, t);
      setText(element, '[data-action="choose-file"]', t('replaceSoundFile'));
    } catch (error) {
      const key = error.message || 'soundPlaybackFailed';
      onToast(t(key), 'danger');
    } finally {
      fileInput.value = '';
    }
  });

  element.querySelector('[data-action="clear-file"]').addEventListener('click', () => {
    process.soundFileDataUrl = '';
    process.soundFileName = '';
    if (process.soundMode === 'custom') {
      process.soundMode = 'default';
      mode.value = 'default';
    }
    onChange();
    onToast(t('soundCleared'), 'success');
    updateCurrentText(element, process, t);
    setText(element, '[data-action="choose-file"]', t('chooseSoundFile'));
  });

  element.querySelector('[data-action="test-sound"]').addEventListener('click', async () => {
    try {
      await playTimerSound(process);
    } catch (_) {
      onToast(t('soundPlaybackFailed'), 'danger');
    }
  });

  return element;
}

function updateCurrentText(element, process, t) {
  const current = process.soundMode === 'custom'
    ? (process.soundFileName || t('noCustomSound'))
    : process.soundMode === 'silent'
      ? t('soundSilent')
      : t('standardSoundName');
  setText(element, '[data-role="current"]', `${t('currentSound')}: ${current}`);
}
