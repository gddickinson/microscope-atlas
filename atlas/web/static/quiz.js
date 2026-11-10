// Teaching quiz: flashcards (self-graded, Leitner boxes in localStorage) and multiple-choice questions
// generated from the atlas itself: light-path diagrams, taglines, equations, key numbers, glossary and spectra.
import { route, api, app, esc, list } from './core.js';
import { miniPath, hasDiagram } from './lightpath.js';

const KEY = 'quiz-v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n, not = []) => shuffle(a.filter(x => !not.includes(x))).slice(0, n);

async function bank() {
  const techs = await api('/techniques');
  const pages = await Promise.all(techs.filter(t => t.has_page).map(t => api('/techniques/' + t.id)));
  const fund = await api('/content/fundamentals');
  const glossary = await api('/content/glossary');
  const spectra = Object.keys(await api('/spectra'));
  const fluor = (await api('/fluorophores?limit=2000')).filter(f => spectra.includes(f.name));
  const cards = [];
  fund.forEach(s => (s.quiz || []).forEach((q, i) => cards.push({ id: `f-${s.title}-${i}`, ...q, topic: 'Fundamentals', family: 'Fundamentals' })));
  pages.forEach(p => (p.quiz || []).forEach((q, i) => cards.push({ id: `${p.id}-${i}`, ...q, topic: p.name, family: p.family, tid: p.id })));
  return { techs, pages, cards, glossary, fluor };
}

// Multiple-choice generators. Each returns {prompt (html), options [text], answer index, explain, tid?}.
function mcq(b) {
  const gens = [
    () => { // diagram -> technique
      const withD = b.techs.filter(t => hasDiagram(t.id));
      const t = pick(withD, 1)[0];
      const opts = shuffle([t, ...pick(withD, 3, [t])]);
      return { prompt: `<p>Which technique does this light path belong to?</p><div style="max-width:420px">${miniPath(t.id)}</div>`, options: opts.map(o => o.name), answer: opts.indexOf(t), explain: t.short, tid: t.id };
    },
    () => { // tagline -> technique (same family distractors when possible)
      const p = pick(b.pages, 1)[0];
      const fam = b.pages.filter(x => x.family === p.family && x.id !== p.id);
      const opts = shuffle([p, ...pick(fam.length >= 3 ? fam : b.pages, 3, [p])]);
      return { prompt: `<p>Which technique is this?</p><blockquote>${esc(p.tagline)}</blockquote>`, options: opts.map(o => o.name), answer: opts.indexOf(p), explain: p.short, tid: p.id };
    },
    () => { // equation name -> formula
      const all = b.pages.flatMap(p => (p.equations || []).map(e => ({ ...e, tid: p.id, tname: p.name })));
      const e = pick(all, 1)[0];
      const opts = shuffle([e, ...pick(all, 3, [e])]);
      return { prompt: `<p>Which formula is <b>${esc(e.name)}</b> (${esc(e.tname)})?</p>`, options: opts.map(o => o.formula), answer: opts.indexOf(e), explain: e.meaning, tid: e.tid, mono: true };
    },
    () => { // key number
      const all = b.pages.flatMap(p => (p.key_numbers || []).map(k => ({ ...k, tid: p.id, tname: p.name, fam: p.family })));
      const k = pick(all, 1)[0];
      // distractors from the same technique first, then its family, so wrong answers are plausible
      const near = all.filter(x => x.value !== k.value && x.tid === k.tid);
      const fam = all.filter(x => x.value !== k.value && x.tid !== k.tid && x.fam === k.fam);
      const opts = shuffle([k, ...[...pick(near, 3), ...pick(fam, 3)].slice(0, 3)]);
      return { prompt: `<p>${esc(k.tname)}: what is a typical value for <b>${esc(k.label)}</b>?</p>`, options: opts.map(o => o.value), answer: opts.indexOf(k), explain: `${k.label}: ${k.value}`, tid: k.tid };
    },
    () => { // glossary
      const g = pick(b.glossary, 1)[0];
      const opts = shuffle([g, ...pick(b.glossary, 3, [g])]);
      return { prompt: `<p>What does this describe?</p><blockquote>${esc(g.def)}</blockquote>`, options: opts.map(o => o.term), answer: opts.indexOf(g), explain: `${g.term}: ${g.def}`, tid: g.see };
    },
    () => { // fluorophore peaks
      const f = pick(b.fluor, 1)[0];
      const opts = shuffle([f, ...pick(b.fluor.filter(x => Math.abs(x.em - f.em) > 25), 3)]);
      return { prompt: `<p>Which fluorophore has excitation / emission peaks near <b>${f.ex} / ${f.em} nm</b>?</p>`, options: opts.map(o => o.name), answer: opts.indexOf(f), explain: `${f.name}: ${f.ex}/${f.em} nm${f.brightness ? ', brightness ' + f.brightness.toFixed(1) : ''}.` };
    },
  ];
  return gens[Math.floor(Math.random() * gens.length)]();
}

route('quiz', async (_a, query) => {
  const b = await bank();
  const fams = ['All', ...new Set(b.cards.map(c => c.family))];
  let mode = query.mode || 'mcq', score = { right: 0, total: 0, streak: 0 };
  app().innerHTML = `<p class="kicker">Learn</p><h1>Quiz</h1>
    <p class="lead">Test yourself. Multiple-choice questions are generated from the atlas (light paths, equations, key numbers, terms, fluorophores);
    flashcards hold ${b.cards.length} worked questions with model answers, scheduled so the ones you miss come back sooner.</p>
    <div class="seg" id="qmode"><button data-m="mcq">Multiple choice</button><button data-m="cards">Flashcards</button><button data-m="browse">Browse all</button></div>
    <div class="row"><div><label for="qf">Topic (flashcards and browse)</label><select id="qf">${list(fams, f => `<option>${esc(f)}</option>`)}</select></div><div id="qscore" class="mono small"></div></div>
    <div id="qbody" class="panel"></div>`;
  const body = document.getElementById('qbody');
  const showScore = () => {
    const s = store.get();
    const known = Object.values(s).filter(v => v >= 3).length;
    document.getElementById('qscore').innerHTML = `This session: <b>${score.right}/${score.total}</b> · streak ${score.streak}<br>Flashcards mastered: <b>${known}/${b.cards.length}</b>`;
  };
  const ask = () => {
    const q = mcq(b);
    body.innerHTML = `${q.prompt}<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">${list(q.options, (o, i) => `<button class="alt qopt ${q.mono ? 'mono' : ''}" data-i="${i}" style="text-transform:none;text-align:left">${esc(o)}</button>`)}</div><div id="qexp"></div>`;
    body.querySelectorAll('.qopt').forEach(btn => btn.onclick = () => {
      const i = +btn.dataset.i, ok = i === q.answer;
      score.total++; if (ok) { score.right++; score.streak++; } else score.streak = 0;
      body.querySelectorAll('.qopt').forEach((x, j) => { x.disabled = true; x.style.boxShadow = j === q.answer ? 'inset 0 0 0 2px var(--gfp)' : j === i ? 'inset 0 0 0 2px var(--bad)' : ''; });
      document.getElementById('qexp').innerHTML = `<p class="${ok ? 'ok' : 'err'}">${ok ? 'Correct.' : 'Not quite.'}</p><p>${esc(q.explain || '')}</p>
        ${q.tid ? `<p class="small"><a href="#/technique/${esc(q.tid)}">Revise this topic →</a></p>` : ''}<button id="qnext">Next question</button>`;
      document.getElementById('qnext').onclick = ask;
      showScore();
    });
  };
  const due = () => {
    const f = document.getElementById('qf').value, s = store.get();
    const pool = b.cards.filter(c => f === 'All' || c.family === f);
    const box = c => s[c.id] || 0; // Leitner box 0..5; lower boxes come up more often
    const weights = pool.map(c => 1 / (1 + box(c)) ** 2);
    let r = Math.random() * weights.reduce((a, w) => a + w, 0);
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; }
    return pool[0];
  };
  const card = () => {
    const c = due();
    if (!c) { body.innerHTML = '<p>No cards for this topic.</p>'; return; }
    body.innerHTML = `<p class="small mute">${esc(c.topic)} · box ${(store.get()[c.id] || 0)}/5</p><h2 style="margin-top:6px">${esc(c.q)}</h2>
      <p class="mute">Answer it in your head (or out loud), then reveal.</p><button id="qrev">Reveal answer</button><div id="qans"></div>`;
    document.getElementById('qrev').onclick = () => {
      document.getElementById('qans').innerHTML = `<div class="callout g"><p>${esc(c.a)}</p></div>${c.tid ? `<p class="small"><a href="#/technique/${c.tid}">Revise ${esc(c.topic)} →</a></p>` : ''}
        <button id="qgood">I knew it</button><button class="alt" id="qbad">Needs review</button>`;
      const grade = ok => { const s = store.get(); s[c.id] = ok ? Math.min(5, (s[c.id] || 0) + 1) : 0; store.set(s); score.total++; if (ok) score.right++; showScore(); card(); };
      document.getElementById('qgood').onclick = () => grade(true);
      document.getElementById('qbad').onclick = () => grade(false);
    };
  };
  const browse = () => {
    const f = document.getElementById('qf').value;
    body.innerHTML = `<div class="qa">${list(b.cards.filter(c => f === 'All' || c.family === f), c => `<details><summary>${esc(c.q)} <span class="tag">${esc(c.topic)}</span></summary><p>${esc(c.a)}</p></details>`)}</div>`;
  };
  const run = () => {
    document.querySelectorAll('#qmode button').forEach(x => x.classList.toggle('on', x.dataset.m === mode));
    ({ mcq: ask, cards: card, browse })[mode]();
  };
  document.getElementById('qmode').onclick = e => { if (e.target.dataset.m) { mode = e.target.dataset.m; run(); } };
  document.getElementById('qf').onchange = run;
  showScore();
  run();
});
