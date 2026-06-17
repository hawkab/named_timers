const customAudioCache = new Map();

export async function playTimerSound(process) {
  const mode = process?.soundMode || 'default';
  if (mode === 'silent') {
    return;
  }
  if (mode === 'custom' && process?.soundFileDataUrl) {
    await playCustomSound(process.soundFileDataUrl);
    return;
  }
  await playDefaultSound();
}

async function playCustomSound(dataUrl) {
  let audio = customAudioCache.get(dataUrl);
  if (!audio) {
    audio = new Audio(dataUrl);
    audio.preload = 'auto';
    customAudioCache.set(dataUrl, audio);
  }
  audio.pause();
  audio.currentTime = 0;
  await audio.play();
}

async function playDefaultSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }
  const context = new AudioContextClass();
  if (context.state === 'suspended') {
    await context.resume();
  }
  const now = context.currentTime;
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  gain.connect(context.destination);

  const first = context.createOscillator();
  first.type = 'sine';
  first.frequency.setValueAtTime(660, now);
  first.frequency.exponentialRampToValueAtTime(880, now + 0.16);
  first.connect(gain);
  first.start(now);
  first.stop(now + 0.23);

  const second = context.createOscillator();
  second.type = 'triangle';
  second.frequency.setValueAtTime(990, now + 0.12);
  second.frequency.exponentialRampToValueAtTime(1320, now + 0.32);
  second.connect(gain);
  second.start(now + 0.12);
  second.stop(now + 0.42);

  window.setTimeout(() => context.close().catch(() => undefined), 650);
}

export function readAudioFileAsDataUrl(file, maxBytes) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('audio/')) {
      reject(new Error('audioFileRequired'));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error('soundFileTooLarge'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('fileReadFailed'));
    reader.readAsDataURL(file);
  });
}
