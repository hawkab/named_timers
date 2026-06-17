import { makeId } from '../../shared/ids.js';

export function createDefaultProcesses(t) {
  const processId = makeId('process');
  return [{
    id: processId,
    name: t('defaultProcessName'),
    description: t('defaultProcessDescription'),
    durationSeconds: 60 * 60,
    soundMode: 'default',
    soundFileName: '',
    soundFileDataUrl: '',
    stages: [
      stage('Проговорить функциональные требования (ФТ).', 'Зафиксировать actors, цели, основные сценарии и границы функциональности.', 5),
      stage('Проговорить нефункциональные требования (НФТ), требования по нагрузке.', 'Нагрузочный профиль, latency, availability, consistency, storage, retention, growth.', 5),
      stage('Проговорить happy path, очертить границы системы.', 'Основной сценарий, system context, внешние зависимости, кто чем владеет.', 20),
      stage('Детализировать API, схему данных, технологии и компоненты.', 'Контракты, таблицы, очереди, кеши, коммуникации между компонентами.', 10),
      stage('Exceptional path, масштабирование системы, дополнительные вопросы.', 'Отказы, ретраи, идемпотентность, деградация, bottlenecks, capacity plan.', 10),
      stage('Оставшиеся вопросы.', 'Закрыть пробелы интервьюера и спорные решения.', 5),
      stage('Время ответить на вопросы кандидата.', 'Задать вопросы о команде, процессах, ожиданиях и критериях успеха.', 5),
    ],
  }];
}

function stage(name, description, minutes) {
  return {
    id: makeId('stage'),
    name,
    description,
    durationSeconds: minutes * 60,
  };
}
