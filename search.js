export const ENGINES = [
  { id: 'google', label: 'Google', command: 'g', build: query => `https://www.google.com/search?q=${encodeURIComponent(query)}` },
  { id: 'github', label: 'GitHub', command: 'gh', build: query => `https://github.com/search?q=${encodeURIComponent(query)}` },
  { id: 'npm', label: 'npm', command: 'npm', build: query => `https://www.npmjs.com/search?q=${encodeURIComponent(query)}` },
  { id: 'mdn', label: 'MDN', command: 'mdn', build: query => `https://developer.mozilla.org/pt-BR/search?q=${encodeURIComponent(query)}` },
  { id: 'stackoverflow', label: 'Stack Overflow', command: 'so', build: query => `https://stackoverflow.com/search?q=${encodeURIComponent(query)}` },
  { id: 'chatgpt', label: 'ChatGPT', command: 'ai', build: query => `https://chatgpt.com/?q=${encodeURIComponent(query)}` },
  { id: 'youtube', label: 'YouTube', command: 'yt', build: query => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` },
];

const ENGINE_MAP = new Map(ENGINES.map(engine => [engine.id, engine]));
const COMMAND_MAP = new Map(ENGINES.flatMap(engine => [
  [engine.command, engine],
  [engine.id, engine],
]));

const URL_PATTERN = /^(?:localhost(?::\d+)?|(?:[\w-]+\.)+[a-z]{2,})(?:[/:?#]\S*)?$/i;

export function detectCommand(value) {
  const match = value.trimStart().match(/^(\S+)\s+(.+)$/);
  if (!match) return null;

  const engine = COMMAND_MAP.get(match[1].toLowerCase());
  if (!engine) return null;

  return { engine, query: match[2].trim() };
}

export function resolveTarget(value, selectedEngine = 'google') {
  const input = value.trim();
  if (!input) return null;

  if (/^https?:\/\//i.test(input)) return input;
  if (URL_PATTERN.test(input)) {
    return `${input.toLowerCase().startsWith('localhost') ? 'http' : 'https'}://${input}`;
  }

  const command = detectCommand(input);
  if (command?.query) return command.engine.build(command.query);

  const engine = ENGINE_MAP.get(selectedEngine) ?? ENGINE_MAP.get('google');
  return engine.build(input);
}

export function getEngine(id) {
  return ENGINE_MAP.get(id) ?? ENGINE_MAP.get('google');
}
