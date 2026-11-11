// Lazy page loading: every route a page module registers is listed in main.js's PAGES table (or it would never load),
// and every listed route is registered by the module it points to.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../atlas/web/static/', import.meta.url);
const main = readFileSync(new URL('main.js', dir), 'utf8');
const table = main.slice(main.indexOf('const PAGES = {'), main.indexOf('};', main.indexOf('const PAGES = {')));
const PAGES = Object.fromEntries([...table.matchAll(/'([\w.]+\.js)': \[([^\]]*)\]/g)].map(m => [m[1], [...m[2].matchAll(/'([\w-]+)'/g)].map(x => x[1])]));
assert.ok(Object.keys(PAGES).length >= 20, 'PAGES table parsed');
const registered = f => [...readFileSync(new URL(f, dir), 'utf8').matchAll(/route\('([\w-]+)'/g)].map(m => m[1]);
for (const [file, names] of Object.entries(PAGES)) {
  const got = registered(file);
  for (const n of names) assert.ok(got.includes(n), `${file} registers route '${n}'`);
  for (const n of got) assert.ok(names.includes(n), `route '${n}' of ${file} is listed in main.js PAGES`);
}
const listed = new Set(Object.keys(PAGES));
for (const f of readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'main.js' && f !== 'core.js')) {
  if (registered(f).length) assert.ok(listed.has(f), `${f} registers routes but is not in main.js PAGES`);
}
assert.ok(!/^import '\.\/\w+\.js';$/m.test(main), 'main.js imports no page module eagerly');
console.log(`routes: ${Object.values(PAGES).flat().length} routes in ${listed.size} lazily loaded modules`);
