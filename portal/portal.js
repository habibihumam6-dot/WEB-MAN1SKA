// ===== Tampilan portal berita (berita/semua-berita.html) =====
// Kartu paling atas di daftar otomatis jadi "Sorotan", dan kartu lainnya bisa difilter per jenis.
// Cukup tambah kartu baru di paling atas daftar; sisanya diatur di sini.
const newsList = document.querySelector('#news-list');
if (newsList) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const text = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; };
  const info = (c) => {
    const img = c.querySelector('img');
    return { href: c.getAttribute('href'), src: img ? img.getAttribute('src') : '', kind: text(c, '.kind'), date: text(c, 'time'), title: text(c, 'h3'), desc: text(c, '.desc') };
  };
  const cards = [...newsList.querySelectorAll('.news-card')];

  // Sorotan = kartu pertama
  const feature = document.querySelector('#feature');
  if (feature && cards.length) {
    const d = info(cards[0]);
    feature.innerHTML = `
      <div class="feature-text">
        <span class="chip">Sorotan</span>
        <p class="meta"><span class="kind">${esc(d.kind)}</span><time>${esc(d.date)}</time></p>
        <h3 class="feature-title">${esc(d.title)}</h3>
        <p class="feature-desc">${esc(d.desc)}</p>
        <a class="btn with-icon" href="${esc(d.href)}">Baca selengkapnya<i data-feather="arrow-right"></i></a>
      </div>
      <a class="feature-img" href="${esc(d.href)}" tabindex="-1" aria-hidden="true"><img src="${esc(d.src)}" alt=""></a>`;
    cards[0].remove();
  }

  // Filter jenis (muncul kalau ada lebih dari satu jenis)
  const rest = cards.slice(1);
  const kinds = [...new Set(rest.map((c) => text(c, '.kind')).filter(Boolean))];
  const chips = document.querySelector('#chips');
  if (chips && kinds.length > 1) {
    chips.innerHTML = ['Semua', ...kinds].map((k, i) => `<button type="button" aria-pressed="${i === 0}" data-kind="${i ? esc(k) : ''}">${esc(k)}</button>`).join('');
    chips.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      rest.forEach((c) => { c.hidden = !!b.dataset.kind && text(c, '.kind') !== b.dataset.kind; });
    });
  }

  // Sidebar "Terbaru": lima berita teratas
  const rank = document.querySelector('#rank');
  if (rank) {
    rank.innerHTML = cards.slice(0, 5).map((c, i) => {
      const d = info(c);
      return `<li><a href="${esc(d.href)}"><span class="n">${i + 1}</span><span class="t">${esc(d.title)}</span><span class="d">${esc(d.date)}</span></a></li>`;
    }).join('');
  }
  if (window.feather) feather.replace(); // pasang ikon pada bagian yang baru dibuat
}