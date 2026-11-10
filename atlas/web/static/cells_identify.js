// Cells page, "Identify a cell" tab: upload an image, the full app ranks likely cell types with a local BiomedCLIP
// model (atlas/cell_id.py) and shows the most similar images in the atlas database. Not available on the static site.
import { api, esc, list } from './core.js';
import { credit } from './images.js';

export async function mountIdentify(host, T) {
  host.innerHTML = `<p>Upload a micrograph of a cell or a field of cells (TIFF, PNG or JPEG). The image is analysed on this computer by
    <a href="https://huggingface.co/microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224" target="_blank" rel="noopener">BiomedCLIP</a>,
    a vision-language model trained on figures from biomedical papers (<a href="https://doi.org/10.1056/AIoa2400640" target="_blank" rel="noopener">Zhang et al.</a>).
    It compares the image with descriptions of ${Object.keys(T).length || 'the'} cell types and with the labelled images in the atlas, and ranks the matches.</p>
    <div class="callout">A teaching aid, not a diagnosis: the model has not been validated on your kind of sample, stain or magnification,
    and a field with several cell types gets one blended answer. Use the features listed for each cell type to check its suggestion.</div>
    <div id="cid-state" class="small mute">Checking whether the model is available…</div>
    <div class="row" style="margin-top:12px"><div><label for="cid-file">Image</label><input type="file" id="cid-file" accept=".tif,.tiff,.png,.jpg,.jpeg,image/*"></div></div>
    <div class="two" style="margin-top:12px"><div id="cid-preview"></div><div id="cid-out"></div></div>`;
  const state = host.querySelector('#cid-state'), out = host.querySelector('#cid-out'), input = host.querySelector('#cid-file');
  if (window.ATLAS_STATIC) {
    state.innerHTML = '<span class="err">The identifier runs a machine-learning model on the server, so it needs the full app (see the README); it is not available on this static site.</span>';
    input.disabled = true; return;
  }
  const st = await api('/cells/status', { fresh: true }).catch(() => ({ available: false }));
  state.textContent = st.available ? 'Model available. The first identification loads it (up to a minute); later ones take about a second.' : 'The ML packages are not installed on this server: pip install -r requirements-ml.txt';
  input.disabled = !st.available;
  input.onchange = async () => {
    const f = input.files[0]; if (!f) return;
    host.querySelector('#cid-preview').innerHTML = /\.tiff?$/i.test(f.name) ? `<p class="small mute">${esc(f.name)}</p>` : `<img src="${URL.createObjectURL(f)}" alt="uploaded image" style="max-width:100%;border-radius:6px">`;
    out.innerHTML = '<p class="mute">Identifying…</p>';
    const fd = new FormData(); fd.append('file', f);
    try {
      const r = await fetch('api/cells/identify', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || r.statusText);
      out.innerHTML = render(j, T);
    } catch (e) { out.innerHTML = `<p class="err">${esc(e.message)}</p>`; }
  };
}

function render(j, T) {
  const name = id => T[id]?.name || id;
  const best = j.ranking[0];
  return `<h3>Best matches</h3>
    <table class="small"><tr><th>Cell type</th><th>Score</th><th>Text match</th><th>Classifier</th><th>Similar images</th></tr>${list(j.ranking, r => `<tr><td><a href="#/cells/types">${esc(name(r.id))}</a></td>
      <td><div class="bar" style="width:${Math.round(r.score * 100)}%;min-width:2px"></div>${(r.score * 100).toFixed(0)}%</td><td>${(r.zero_shot * 100).toFixed(0)}%</td><td>${((r.probe || 0) * 100).toFixed(0)}%</td><td>${(r.neighbour_votes * 100).toFixed(0)}%</td></tr>`)}</table>
    ${T[best.id]?.features ? `<p class="small"><b>Check for ${esc(name(best.id))}:</b> ${esc(T[best.id].features.join('; '))}</p>` : ''}
    <h3>Most similar images in the atlas</h3><div class="gallery compact">${list(j.neighbours, n => `<figure><a href="${esc(n.source_url)}" target="_blank" rel="noopener"><img src="${esc(n.url)}" alt="${esc(n.title)}" loading="lazy"></a>
      <figcaption><span class="tag g">${esc(name(n.cell_type))}</span> similarity ${n.similarity}<br>${esc(n.title)}<br>${credit(n)}</figcaption></figure>`)}</div>
    <p class="small mute">Score = 40% text-description match (zero-shot) + 40% a classifier trained on the atlas's labelled images + 20% similarity-weighted vote of the 6 nearest atlas images. In leave-one-out tests on 290 atlas images the right type is first about a third of the time and in the top three about 60% of the time (<a href="https://github.com/gddickinson/microscope-atlas/blob/main/docs/cell_id_eval.md" target="_blank" rel="noopener">details</a>). Model ${esc(j.model)} on ${esc(j.device)}.</p>`;
}
