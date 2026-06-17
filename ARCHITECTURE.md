# WAKA:Named timers architecture

The project is static and GitHub Pages compatible. Runtime is browser-only: HTML templates, CSS, JavaScript ES modules, `localStorage`, Service Worker, Notification API and Web Audio API.

## Layers

```text
docs/index.html               Minimal host page only.
docs/styles.css               Global design tokens, base layout primitives and reusable utility classes.
docs/app                      Application composition, state orchestration and i18n.
docs/shared                   Framework-free utilities: DOM, time, IDs, file import/export, sound, notifications.
docs/components               Isolated UI components. Every component owns its HTML, CSS and JS.
docs/assets                   Static icons and media.
docs/manifest.webmanifest     PWA metadata.
docs/sw.js                    Offline cache and notification click handling.
```

## Component boundaries

- `app-shell`: global layout slots: sidebar, workspace, floating controls, toast stack.
- `sidebar`: saved process list and import/export area.
- `process-card`: reusable sidebar list item with fixed-size delete action.
- `file-actions`: reusable JSON import/export controls.
- `process-editor`: process form, capacity validation, stage list orchestration and drag-and-drop wiring.
- `duration-input`: reusable hours/minutes/seconds editor.
- `stage-editor`: reusable stage form card.
- `sound-settings`: timer sound mode, custom audio import and test action.
- `runner`: active countdown screen, progress bar, previous/next stage controls and timeline.
- `progress-bar`: reusable progress component.
- `floating-controls`: theme/language capsule.
- `toast`: local toast stack.
- `empty-state`: empty application state.

## Persistence

- Processes: `waka.namedTimers.processes.v1`
- Settings: `waka.namedTimers.settings.v1`
- Legacy migration reads old `process-timer-studio.*` keys once when present.

## Data model

```text
Process
  id
  name
  description
  durationSeconds
  soundMode: default | custom | silent
  soundFileName
  soundFileDataUrl
  stages[]

Stage
  id
  name
  description
  durationSeconds
```

## PWA behavior

The Service Worker caches the whole static app shell. PWA installation works on HTTPS, including GitHub Pages, and on `localhost` for development.
