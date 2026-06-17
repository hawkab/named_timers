import { translations } from './translations.js';

let currentLang = 'ru';

export function setLanguage(lang) {
  currentLang = translations[lang] ? lang : 'ru';
  document.documentElement.lang = currentLang;
  updateDocumentMetadata();
}

function updateDocumentMetadata() {
  document.title = t('appTitle');
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute('content', t('appMetaDescription'));
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key) {
  return translations[currentLang]?.[key] || translations.ru[key] || translations.en[key] || key;
}

export function durationLabels() {
  return {
    hours: t('hours'),
    minutes: t('minutes'),
    seconds: t('seconds'),
  };
}
