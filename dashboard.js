const ENGINES = {
  google: q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  github: q => `https://github.com/search?q=${encodeURIComponent(q)}`,
  npm:    q => `https://www.npmjs.com/search?q=${encodeURIComponent(q)}`,
  mdn:    q => `https://developer.mozilla.org/pt-BR/search?q=${encodeURIComponent(q)}`,
  so:     q => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`,
  vercel: q => `https://vercel.com/docs/${q ? `search?q=${encodeURIComponent(q)}` : ''}`.replace('/docs/search', '/docs'),
  gpt:    q => `https://chatgpt.com/?q=${encodeURIComponent(q)}`,
};

const LINKS = [
  { t: 'Vercel',      s: 'Dashboard',   u: 'https://vercel.com/dashboard' },
  { t: 'GitHub',      s: 'Repositórios', u: 'https://github.com' },
  { t: 'MDN',         s: 'Web Docs',    u: 'https://developer.mozilla.org' },
  { t: 'Stack',       s: 'Overflow',    u: 'https://stackoverflow.com' },
  { t: 'npm',         s: 'Pacotes',     u: 'https://www.npmjs.com' },
  { t: 'DevDocs',     s: 'APIs',        u: 'https://devdocs.io' },
  { t: 'ChatGPT',     s: 'AI',          u: 'https://chatgpt.com' },
  { t: 'DeepSeek',    s: 'AI',          u: 'https://chat.deepseek.com' },
];

const q = document.getElementById('q');
const engineSel = document.getElementById('engine');

function go() {
  const v = q.value.trim();
  if (!v) return;
  let target;
  if (/^https?:\/\//.test(v) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) {
    target = /^https?:\/\//.test(v) ? v : `https://${v}`;
  } else {
    target = ENGINES[engineSel.value](v);
  }
  location.href = target;
}
q.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
engineSel.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });

document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
});

function tick() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const d = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('date').textContent = d.charAt(0).toUpperCase() + d.slice(1);
}
tick();
setInterval(tick, 1000 * 20);

const grid = document.getElementById('links');
for (const l of LINKS) {
  const a = document.createElement('a');
  a.className = 'card';
  a.href = l.u;
  a.innerHTML = `<div class="t">${l.t}</div><div class="s">${l.s}</div>`;
  grid.appendChild(a);
}

try {
  chrome.topSites.get(sites => {
    const top = document.getElementById('top');
    for (const s of (sites || []).slice(0, 10)) {
      const a = document.createElement('a');
      a.className = 'chip';
      a.href = s.url;
      a.textContent = s.title || s.url;
      top.appendChild(a);
    }
  });
} catch (e) { /* topSites indisponível */ }
