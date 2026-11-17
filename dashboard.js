import { detectCommand, ENGINES, resolveTarget } from './search.js';

const STORAGE_KEY = 'artemis:preferences:v1';
const THEMES = new Set(['graphite', 'daylight', 'ocean', 'violet', 'forest', 'amber']);
const ENGINE_IDS = new Set(ENGINES.map(engine => engine.id));
const MAX_SHORTCUTS = 16;

const DEFAULT_LINKS = [
  { title: 'GitHub', subtitle: 'Repositórios', url: 'https://github.com' },
  { title: 'MDN', subtitle: 'Web Docs', url: 'https://developer.mozilla.org' },
  { title: 'Stack', subtitle: 'Overflow', url: 'https://stackoverflow.com' },
  { title: 'npm', subtitle: 'Pacotes', url: 'https://www.npmjs.com' },
  { title: 'DevDocs', subtitle: 'APIs', url: 'https://devdocs.io' },
  { title: 'ChatGPT', subtitle: 'AI', url: 'https://chatgpt.com' },
  { title: 'DeepSeek', subtitle: 'AI', url: 'https://chat.deepseek.com' },
  { title: 'YouTube', subtitle: 'Vídeos', url: 'https://www.youtube.com' },
];

const DEFAULT_STATE = {
  theme: 'graphite',
  showClock: true,
  showDate: true,
  format24: true,
  showTopSites: true,
  defaultEngine: 'google',
  links: DEFAULT_LINKS,
};

const elements = {
  root: document.documentElement,
  themeColor: document.querySelector('meta[name="theme-color"]'),
  hero: document.querySelector('.hero'),
  clock: document.querySelector('#clock'),
  date: document.querySelector('#date'),
  searchForm: document.querySelector('#search-form'),
  searchInput: document.querySelector('#search-input'),
  engine: document.querySelector('#engine'),
  commandHint: document.querySelector('#command-hint'),
  links: document.querySelector('#links'),
  topSection: document.querySelector('#top-section'),
  top: document.querySelector('#top'),
  topStatus: document.querySelector('#top-status'),
  settingsDialog: document.querySelector('#settings-dialog'),
  commandsDialog: document.querySelector('#commands-dialog'),
  commandList: document.querySelector('#command-list'),
  shortcutEditor: document.querySelector('#shortcut-editor'),
  addShortcutForm: document.querySelector('#add-shortcut-form'),
  shortcutError: document.querySelector('#shortcut-error'),
  defaultEngine: document.querySelector('#default-engine'),
  showClock: document.querySelector('#show-clock'),
  showDate: document.querySelector('#show-date'),
  format24: document.querySelector('#format-24'),
  showTopSites: document.querySelector('#show-top-sites'),
};

let state = loadState();
let topSites = [];
let topSitesLoaded = false;

function cloneDefaults() {
  return { ...DEFAULT_STATE, links: DEFAULT_LINKS.map(link => ({ ...link })) };
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeLinks(links) {
  if (!Array.isArray(links)) return cloneDefaults().links;
  return links
    .filter(link => link && typeof link.title === 'string' && typeof link.url === 'string' && isHttpUrl(link.url))
    .slice(0, MAX_SHORTCUTS)
    .map(link => ({
      title: link.title.trim().slice(0, 28) || 'Atalho',
      subtitle: String(link.subtitle ?? '').trim().slice(0, 32),
      url: link.url,
    }));
}

function loadState() {
  const defaults = cloneDefaults();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return defaults;
    return {
      theme: THEMES.has(saved.theme) ? saved.theme : defaults.theme,
      showClock: typeof saved.showClock === 'boolean' ? saved.showClock : defaults.showClock,
      showDate: typeof saved.showDate === 'boolean' ? saved.showDate : defaults.showDate,
      format24: typeof saved.format24 === 'boolean' ? saved.format24 : defaults.format24,
      showTopSites: typeof saved.showTopSites === 'boolean' ? saved.showTopSites : defaults.showTopSites,
      defaultEngine: ENGINE_IDS.has(saved.defaultEngine) ? saved.defaultEngine : defaults.defaultEngine,
      links: sanitizeLinks(saved.links),
    };
  } catch {
    return defaults;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    elements.shortcutError.textContent = 'Não foi possível salvar as preferências neste navegador.';
  }
}

function populateEngines() {
  for (const select of [elements.engine, elements.defaultEngine]) {
    select.replaceChildren();
    for (const engine of ENGINES) {
      const option = document.createElement('option');
      option.value = engine.id;
      option.textContent = engine.label;
      select.append(option);
    }
  }
}

function applyState() {
  elements.root.dataset.theme = state.theme;
  elements.themeColor.content = state.theme === 'daylight' ? '#ffffff' : '#000000';
  elements.clock.hidden = !state.showClock;
  elements.date.hidden = !state.showDate;
  elements.topSection.hidden = !state.showTopSites;
  elements.engine.value = state.defaultEngine;
  elements.defaultEngine.value = state.defaultEngine;
  elements.showClock.checked = state.showClock;
  elements.showDate.checked = state.showDate;
  elements.format24.checked = state.format24;
  elements.showTopSites.checked = state.showTopSites;

  const selectedTheme = document.querySelector(`input[name="theme"][value="${state.theme}"]`);
  if (selectedTheme) selectedTheme.checked = true;

  renderLinks();
  renderShortcutEditor();
  updateClock();
  if (state.showTopSites) loadTopSites();
}

function updateClock() {
  const now = new Date();
  elements.clock.textContent = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !state.format24,
  });
  elements.clock.dateTime = now.toISOString();

  const formattedDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  elements.date.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function renderLinks() {
  elements.links.replaceChildren();
  if (!state.links.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhum atalho. Use “Editar” para adicionar um.';
    elements.links.append(empty);
    return;
  }

  for (const link of state.links) {
    const anchor = document.createElement('a');
    const title = document.createElement('span');
    const subtitle = document.createElement('span');
    anchor.className = 'shortcut-card';
    anchor.href = link.url;
    title.className = 'shortcut-title';
    title.textContent = link.title;
    subtitle.className = 'shortcut-subtitle';
    subtitle.textContent = link.subtitle || new URL(link.url).hostname;
    anchor.append(title, subtitle);
    elements.links.append(anchor);
  }
}

function makeMiniButton(label, action, index, text, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `mini-button${action === 'remove' ? ' remove' : ''}`;
  button.dataset.action = action;
  button.dataset.index = String(index);
  button.ariaLabel = label;
  button.textContent = text;
  button.disabled = disabled;
  return button;
}

function renderShortcutEditor() {
  elements.shortcutEditor.replaceChildren();
  state.links.forEach((link, index) => {
    const row = document.createElement('div');
    const details = document.createElement('div');
    const title = document.createElement('strong');
    const url = document.createElement('small');
    const actions = document.createElement('div');
    row.className = 'shortcut-editor-row';
    title.textContent = link.title;
    url.textContent = link.url;
    actions.className = 'row-actions';
    actions.append(
      makeMiniButton(`Mover ${link.title} para cima`, 'up', index, '↑', index === 0),
      makeMiniButton(`Mover ${link.title} para baixo`, 'down', index, '↓', index === state.links.length - 1),
      makeMiniButton(`Remover ${link.title}`, 'remove', index, '×'),
    );
    details.append(title, url);
    row.append(details, actions);
    elements.shortcutEditor.append(row);
  });
}

function renderCommands() {
  elements.commandList.replaceChildren();
  for (const engine of ENGINES) {
    const button = document.createElement('button');
    const label = document.createElement('span');
    const command = document.createElement('small');
    button.type = 'button';
    button.className = 'command-item';
    button.dataset.engine = engine.id;
    label.textContent = `Pesquisar no ${engine.label}`;
    command.textContent = `${engine.command} termo`;
    button.append(label, command);
    elements.commandList.append(button);
  }
}

function renderTopSites(message = '') {
  elements.top.replaceChildren();
  for (const site of topSites.slice(0, 10)) {
    if (!isHttpUrl(site.url)) continue;
    const anchor = document.createElement('a');
    anchor.className = 'chip';
    anchor.href = site.url;
    anchor.textContent = site.title || new URL(site.url).hostname;
    elements.top.append(anchor);
  }

  elements.topStatus.hidden = elements.top.childElementCount > 0;
  elements.topStatus.textContent = message || 'Nenhum site disponível ainda.';
}

function loadTopSites() {
  if (topSitesLoaded) {
    renderTopSites();
    return;
  }

  const api = globalThis.chrome?.topSites;
  if (!api?.get) {
    topSitesLoaded = true;
    renderTopSites('Mais visitados ficam disponíveis quando a extensão está instalada.');
    return;
  }

  api.get(sites => {
    topSitesLoaded = true;
    if (globalThis.chrome?.runtime?.lastError) {
      renderTopSites('Não foi possível carregar os sites mais visitados.');
      return;
    }
    topSites = Array.isArray(sites) ? sites : [];
    renderTopSites();
  });
}

function openSettings() {
  if (!elements.settingsDialog.open) elements.settingsDialog.showModal();
}

function openCommands() {
  if (!elements.commandsDialog.open) elements.commandsDialog.showModal();
  elements.commandList.querySelector('button')?.focus();
}

function closeOnBackdrop(event) {
  if (event.target === event.currentTarget) event.currentTarget.close();
}

populateEngines();
renderCommands();
applyState();
setInterval(updateClock, 20_000);

elements.searchForm.addEventListener('submit', event => {
  event.preventDefault();
  const target = resolveTarget(elements.searchInput.value, elements.engine.value);
  if (target) location.assign(target);
});

elements.searchInput.addEventListener('input', () => {
  const command = detectCommand(elements.searchInput.value);
  elements.commandHint.textContent = command ? `Buscar com ${command.engine.label}` : '';
});

elements.engine.addEventListener('change', () => {
  state.defaultEngine = elements.engine.value;
  elements.defaultEngine.value = state.defaultEngine;
  saveState();
});

document.querySelector('#settings-button').addEventListener('click', openSettings);
document.querySelector('#edit-shortcuts').addEventListener('click', openSettings);
document.querySelector('#commands-button').addEventListener('click', openCommands);
document.querySelector('.close-dialog').addEventListener('click', () => elements.commandsDialog.close());
document.querySelector('#save-settings').addEventListener('click', () => elements.settingsDialog.close());
elements.settingsDialog.addEventListener('click', closeOnBackdrop);
elements.commandsDialog.addEventListener('click', closeOnBackdrop);

document.querySelector('#palette-grid').addEventListener('change', event => {
  if (event.target.name !== 'theme' || !THEMES.has(event.target.value)) return;
  state.theme = event.target.value;
  applyState();
  saveState();
});

for (const [element, key] of [
  [elements.showClock, 'showClock'],
  [elements.showDate, 'showDate'],
  [elements.format24, 'format24'],
  [elements.showTopSites, 'showTopSites'],
]) {
  element.addEventListener('change', () => {
    state[key] = element.checked;
    applyState();
    saveState();
  });
}

elements.defaultEngine.addEventListener('change', () => {
  state.defaultEngine = elements.defaultEngine.value;
  elements.engine.value = state.defaultEngine;
  saveState();
});

elements.shortcutEditor.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const index = Number(button.dataset.index);
  if (!Number.isInteger(index) || !state.links[index]) return;

  if (button.dataset.action === 'remove') state.links.splice(index, 1);
  if (button.dataset.action === 'up' && index > 0) [state.links[index - 1], state.links[index]] = [state.links[index], state.links[index - 1]];
  if (button.dataset.action === 'down' && index < state.links.length - 1) [state.links[index + 1], state.links[index]] = [state.links[index], state.links[index + 1]];
  renderLinks();
  renderShortcutEditor();
  saveState();
});

elements.addShortcutForm.addEventListener('submit', event => {
  event.preventDefault();
  const title = document.querySelector('#shortcut-name').value.trim();
  const subtitle = document.querySelector('#shortcut-description').value.trim();
  const url = document.querySelector('#shortcut-url').value.trim();
  elements.shortcutError.textContent = '';

  if (!title || !isHttpUrl(url)) {
    elements.shortcutError.textContent = 'Informe um nome e um endereço começando com http:// ou https://.';
    return;
  }
  if (state.links.length >= MAX_SHORTCUTS) {
    elements.shortcutError.textContent = `O limite é de ${MAX_SHORTCUTS} atalhos.`;
    return;
  }

  state.links.push({ title: title.slice(0, 28), subtitle: subtitle.slice(0, 32), url });
  elements.addShortcutForm.reset();
  renderLinks();
  renderShortcutEditor();
  saveState();
});

elements.commandList.addEventListener('click', event => {
  const button = event.target.closest('button[data-engine]');
  if (!button) return;
  elements.engine.value = button.dataset.engine;
  elements.commandsDialog.close();
  elements.searchInput.focus();
});

document.querySelector('#reset-settings').addEventListener('click', () => {
  if (!confirm('Restaurar todas as preferências e atalhos da Artemis?')) return;
  state = cloneDefaults();
  elements.shortcutError.textContent = '';
  applyState();
  saveState();
});

document.addEventListener('keydown', event => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openCommands();
    return;
  }

  if (event.key === '/' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    elements.searchInput.focus();
  }
});

queueMicrotask(() => elements.searchInput.focus({ preventScroll: true }));
