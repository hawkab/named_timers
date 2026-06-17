import { createFromTemplate } from '../../shared/component-loader.js';
import { setText } from '../../shared/dom.js';
import { partsFromSeconds, secondsFromParts } from '../../shared/time.js';

const templateUrl = new URL('./duration-input.html', import.meta.url);
const styleUrl = new URL('./duration-input.css', import.meta.url);

export async function renderDurationInput({ seconds, t, onChange }) {
  const element = await createFromTemplate(templateUrl, styleUrl);
  const parts = partsFromSeconds(seconds);
  const hours = element.querySelector('[data-role="hours"]');
  const minutes = element.querySelector('[data-role="minutes"]');
  const secs = element.querySelector('[data-role="seconds"]');
  setText(element, '[data-role="hours-label"]', t('hours'));
  setText(element, '[data-role="minutes-label"]', t('minutes'));
  setText(element, '[data-role="seconds-label"]', t('seconds'));
  hours.value = parts.hours;
  minutes.value = parts.minutes;
  secs.value = parts.seconds;
  const emit = () => onChange(secondsFromParts(hours.value, minutes.value, secs.value));
  [hours, minutes, secs].forEach((input) => input.addEventListener('input', emit));
  return element;
}
