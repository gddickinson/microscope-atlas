// Side-by-side comparison of up to six systems, with a resolution chart.
import { route, api, app, esc, list } from './core.js';
import { picked } from './systems.js';

route('compare', async ([ids]) => {
  const chosen = (ids ? ids.split(',') : picked.get()).filter(Boolean);
  if (!chosen.length) {
    app().innerHTML = `<p class="kicker">Database</p><h1>Compare systems</h1>
      <p class="lead">Pick up to six systems with "+ compare" in the <a href="#/systems">systems browser</a>, then return here.</p>
      <p>Or try a ready-made comparison:</p><ul>
      <li><a href="#/compare/zeiss-lsm-980,leica-stellaris-8,nikon-ax-r,evident-fv4000">Flagship confocals</a></li>
      <li><a href="#/compare/nikon-n-sim-s,zeiss-elyra-7,abberior-facility-line,oni-nanoimager">Super-resolution platforms</a></li></ul>`;
    return;
  }
  const rows = (await Promise.all(chosen.map(id => api('/systems/' + encodeURIComponent(id)).catch(() => null)))).filter(Boolean);
  const specKeys = [...new Set(rows.flatMap(r => Object.keys(r.specs || {})))];
  const line = (label, fn) => `<tr><th>${esc(label)}</th>${list(rows, r => `<td>${fn(r)}</td>`)}</tr>`;
  app().innerHTML = `<p class="kicker">Database</p><h1>Compare ${rows.length} systems</h1>
    <p class="mute small">Numbers are as published by each source and are not always measured the same way; read the notes.</p>
    <div id="rchart"></div>
    <div class="scroll"><table class="cmp">
      ${line('System', r => `<a href="#/system/${esc(r.id)}"><b>${esc(r.name)}</b></a><br><span class="mute">${esc(r.manufacturer)}</span>`)}
      ${line('Techniques', r => esc(Object.values(r.technique_names).join(', ')))}
      ${line('Kind / status', r => `${esc(r.kind)} · ${esc(r.status)}`)}
      ${line('Year', r => r.year || '—')}
      ${line('Lateral resolution', r => r.resolution?.xy_nm != null ? r.resolution.xy_nm + ' nm' : '—')}
      ${line('Axial resolution', r => r.resolution?.z_nm != null ? r.resolution.z_nm + ' nm' : '—')}
      ${line('Resolution note', r => esc(r.resolution?.note || ''))}
      ${list(specKeys, k => line(k, r => esc((r.specs || {})[k] || '—')))}
      ${line('Summary', r => esc(r.summary))}
    </table></div>`;
  chart(document.getElementById('rchart'), rows);
});

function chart(host, rows) {
  const pts = rows.filter(r => r.resolution?.xy_nm != null);
  if (pts.length < 2) return;
  const W = 900, H = 60 + pts.length * 34, L = 230;
  const max = Math.max(...pts.map(r => Math.max(r.resolution.xy_nm, r.resolution.z_nm || 0)));
  const x = v => L + (v / max) * (W - L - 30);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}"><text class="axisl" x="${L}" y="20">resolution (nm, shorter is finer) · green lateral, magenta axial</text>`;
  pts.forEach((r, i) => {
    const y = 40 + i * 34;
    s += `<text class="axisl" x="${L - 10}" y="${y + 12}" text-anchor="end" fill="#e8f1ff">${esc(r.name)}</text>`;
    s += `<rect x="${L}" y="${y}" width="${x(r.resolution.xy_nm) - L}" height="11" fill="#3dff8f"/><text class="axisl" x="${x(r.resolution.xy_nm) + 6}" y="${y + 10}">${r.resolution.xy_nm}</text>`;
    if (r.resolution.z_nm) s += `<rect x="${L}" y="${y + 13}" width="${x(r.resolution.z_nm) - L}" height="11" fill="#ff3fa4"/><text class="axisl" x="${x(r.resolution.z_nm) + 6}" y="${y + 23}">${r.resolution.z_nm}</text>`;
  });
  host.innerHTML = s + '</svg>';
}
