export function secondsFromParts(hours, minutes, seconds) {
  const h = clampInteger(hours, 0, 999);
  const m = clampInteger(minutes, 0, 59);
  const s = clampInteger(seconds, 0, 59);
  return h * 3600 + m * 60 + s;
}

export function partsFromSeconds(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return { hours, minutes, seconds };
}

export function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationLong(totalSeconds, labels) {
  const { hours, minutes, seconds } = partsFromSeconds(totalSeconds);
  const chunks = [];
  if (hours > 0) chunks.push(`${hours} ${labels.hours}`);
  if (minutes > 0) chunks.push(`${minutes} ${labels.minutes}`);
  if (seconds > 0 || chunks.length === 0) chunks.push(`${seconds} ${labels.seconds}`);
  return chunks.join(' ');
}

export function clampInteger(value, min, max) {
  const number = Number.parseInt(String(value ?? 0), 10);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}
