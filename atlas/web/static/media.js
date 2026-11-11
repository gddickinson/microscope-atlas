// Videos that cost nothing until seen: lazyVideo() renders only a poster frame (preload="none", no src); watchVideos()
// gives each one its source and plays it when it scrolls into view, and pauses it when it leaves. Used by the gallery
// sections of My Microscopy (learn.js) and the Cells image database (cells.js).
import { esc } from './core.js';

export const posterOf = i => (i.poster ? i.url.replace(/[^/]+$/, i.poster) : i.url.replace(/\.mp4$/i, '_poster.jpg'));

export function lazyVideo(i, label = i.title) {
  return `<video data-src="${esc(i.url)}" poster="${esc(posterOf(i))}" loop muted playsinline preload="none" aria-label="${esc(label || 'movie')}"></video>`;
}

export function watchVideos(root) {
  if (!('IntersectionObserver' in window)) { root.querySelectorAll('video[data-src]').forEach(v => { v.src = v.dataset.src; }); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      v.muted = true; v.play().catch(() => {});
    } else v.pause();
  }), { threshold: 0.2 });
  root.querySelectorAll('video').forEach(v => io.observe(v));
}
