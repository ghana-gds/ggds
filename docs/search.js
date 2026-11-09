// Documentation search. The build writes assets/search-index.json (title, headings and text of every page).
// This script searches it as you type and keeps the address up to date, so a search can be shared. Without
// JavaScript, the search page shows every page from A to Z instead.
const input = document.getElementById('search-q');
const list = document.getElementById('search-results');
const status = document.getElementById('search-status');
const all = document.getElementById('search-all');
let docs;

const load = async () => (docs ??= await (await fetch('assets/search-index.json')).json());

function score(doc, terms) {
  const title = doc.title.toLowerCase();
  const headings = doc.headings.join(' ').toLowerCase();
  const text = doc.text.toLowerCase();
  let total = 0;
  for (const t of terms) {
    const hit = (title.includes(t) ? 10 : 0) + (headings.includes(t) ? 4 : 0) + Math.min(text.split(t).length - 1, 5);
    if (!hit) return 0; // every word must appear somewhere
    total += hit;
  }
  return total;
}

/** A short piece of the page around the first match, with the matching words marked. */
function snippet(doc, terms) {
  const lower = doc.text.toLowerCase();
  const at = Math.max(0, Math.min(...terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0)) - 60);
  const piece = `${at > 0 ? '…' : ''}${doc.text.slice(at, at + 180)}…`;
  const p = document.createElement('p');
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  for (const part of piece.split(pattern)) {
    if (!part) continue;
    if (terms.includes(part.toLowerCase())) { const m = document.createElement('mark'); m.textContent = part; p.append(m); } else p.append(part);
  }
  return p;
}

async function run(query) {
  const q = query.trim();
  const url = new URL(location.href);
  if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
  history.replaceState(null, '', url);
  list.replaceChildren();
  if (!q) { list.hidden = true; all.hidden = false; status.textContent = ''; return; }
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = (await load()).map((d) => ({ d, s: score(d, terms) })).filter((r) => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 30);
  for (const { d } of results) {
    const li = document.createElement('li');
    li.className = 'docs-search__result';
    const a = document.createElement('a');
    a.href = d.url;
    a.textContent = d.title;
    const section = document.createElement('span');
    section.className = 'docs-search__section';
    section.textContent = d.section;
    const h = document.createElement('h2');
    h.className = 'docs-search__title';
    h.append(a, ' ', section);
    li.append(h, snippet(d, terms));
    list.append(li);
  }
  list.hidden = results.length === 0;
  all.hidden = true;
  status.textContent = results.length
    ? `${results.length} ${results.length === 1 ? 'result' : 'results'} for “${q}”`
    : `No results for “${q}”. Try another word, or browse the components.`;
}

let timer;
input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => run(input.value), 150); });
input.form.addEventListener('submit', (event) => { event.preventDefault(); run(input.value); });
const initial = new URLSearchParams(location.search).get('q') ?? '';
input.value = initial;
if (initial) run(initial);
