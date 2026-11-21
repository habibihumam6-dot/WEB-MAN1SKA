// ===== Pencarian =====
// Menambah ikon cari di navbar. Kalau diklik, panel pencarian turun di bawah navbar.
// Bahan pencarian dibaca otomatis dari kartu di index.html dan halaman arsip (portal/), tanpa daftar manual,
// jadi berita, program, atau divisi baru yang kamu tambahkan di HTML ikut bisa dicari.
// Dimuat oleh script.js. Butuh dibuka lewat server (Live Server / hosting), bukan dobel-klik file.
(() => {
  const navbar = document.querySelector('.navbar');
  const me = document.currentScript;
  if (!navbar || !me) return;
  const base = new URL('.', me.src);

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('search.css', base).href;
  document.head.append(css);

  // Halaman yang dibaca untuk bahan pencarian (alamat dari folder utama)
  const PAGES = ['index.html', 'portal/semua-berita.html', 'portal/galeri-video.html', 'portal/galeri-instagram.html'];
  // Halaman biasa yang bukan berupa kartu
  const STATIC = [
    { t: 'Tentang kami', d: 'MAN1SKA TV adalah wadah siswa untuk berkarya lewat video, liputan, dan siaran.', k: 'Halaman', u: 'index.html#about' },
    { t: 'Kontak', d: 'Alamat, email, Instagram, peta, dan formulir pesan untuk MAN1SKA TV.', k: 'Halaman', u: 'index.html#contact' },
    { t: 'Berita selengkapnya', d: 'Arsip semua tulisan dan foto liputan MAN1SKA TV.', k: 'Halaman', u: 'portal/semua-berita.html' },
    { t: 'Galeri video', d: 'Video liputan, vlog, dan dokumentasi MAN1SKA TV.', k: 'Halaman', u: 'portal/galeri-video.html' },
    { t: 'Galeri Instagram', d: 'Reels dan postingan terbaru dari @man1skatv.', k: 'Halaman', u: 'portal/galeri-instagram.html' },
  ];

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const txt = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent.replace(/\s+/g, ' ').trim() : ''; };

  // Mengambil judul, ringkasan, jenis, tanggal, dan alamat dari kartu-kartu di sebuah halaman
  const parse = (doc, pageUrl) => {
    const out = [];
    const link = (el) => new URL(el.getAttribute('href') || '', pageUrl).href;
    doc.querySelectorAll('.news-card').forEach((c) => out.push({ t: txt(c, 'h3'), d: txt(c, '.desc'), k: txt(c, '.kind') || 'Berita', date: txt(c, 'time'), u: link(c) }));
    doc.querySelectorAll('.program-card').forEach((c) => out.push({ t: txt(c, 'h3'), d: txt(c, '.program-body > p'), k: 'Program', date: txt(c, 'time'), u: link(c) }));
    doc.querySelectorAll('.role-row').forEach((c) => out.push({ t: txt(c, 'h3'), d: txt(c, 'p'), k: 'Divisi', u: link(c) }));
    doc.querySelectorAll('.video-card').forEach((c) => out.push({ t: txt(c, 'h3'), d: `Video ${txt(c, '.kind').toLowerCase()}`, k: 'Video', date: txt(c, 'time'), u: new URL(pageUrl).href }));
    doc.querySelectorAll('.ig-tile').forEach((c) => out.push({ t: txt(c, '.ig-cap'), d: 'Postingan Instagram @man1skatv', k: 'Instagram', u: link(c), ext: true }));
    return out.filter((x) => x.t);
  };

  let ready;
  const load = () => ready || (ready = Promise.all(PAGES.map((p) => {
    const url = new URL(p, base);
    return fetch(url)
      .then((r) => (r.ok ? r.text() : ''))
      .then((h) => (h ? parse(new DOMParser().parseFromString(h, 'text/html'), url) : []))
      .catch(() => []);
  })).then((lists) => {
    const all = [...STATIC.map((s) => ({ ...s, u: new URL(s.u, base).href })), ...lists.flat(), ...parse(document, location.href)];
    const seen = new Set(); // judul yang sama hanya dipakai sekali (yang pertama = dari index.html)
    return all.filter((x) => { const key = `${norm(x.t)}|${x.k}`; if (seen.has(key)) return false; seen.add(key); return true; });
  }));

  // Semua kata yang diketik harus ada; kata di judul bernilai paling tinggi
  const find = (items, q) => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return items.map((it) => {
      const t = norm(it.t), d = norm(it.d || ''), k = norm(it.k);
      let score = 0;
      for (const w of terms) {
        if (t.includes(w)) score += t.startsWith(w) || t.includes(` ${w}`) ? 6 : 4;
        else if (k.includes(w)) score += 3;
        else if (d.includes(w)) score += 1;
        else return null;
      }
      return { it, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8).map((r) => r.it);
  };

  const mark = (s, q) => {
    const words = q.trim().split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return esc(s);
    return s.split(new RegExp(`(${words.join('|')})`, 'gi')).map((p, i) => (i % 2 ? `<mark>${esc(p)}</mark>` : esc(p))).join('');
  };

  // ----- Tampilan -----
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-search';
  btn.setAttribute('aria-label', 'Cari');
  btn.setAttribute('aria-expanded', 'false');
  btn.title = 'Cari (tekan /)';
  btn.innerHTML = ICON;
  const burger = document.querySelector('#hamburger-menu');
  const anchor = burger || navbar.querySelector('.back-btn');
  if (anchor) anchor.before(btn); else navbar.append(btn);

  const backdrop = document.createElement('div');
  backdrop.className = 'search-backdrop';
  backdrop.hidden = true;
  const panel = document.createElement('div');
  panel.className = 'search-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'search');
  panel.innerHTML = `<div class="search-box"><label class="search-field">${ICON}<input type="search" placeholder="Cari berita, program, atau divisi..." aria-label="Cari di MAN1SKA TV" autocomplete="off"></label><div class="search-body" aria-live="polite"></div></div>`;
  navbar.append(backdrop, panel);
  const input = panel.querySelector('input');
  const body = panel.querySelector('.search-body');

  let active = -1;
  const setActive = (i) => {
    const els = body.querySelectorAll('.search-item');
    els.forEach((e, j) => e.classList.toggle('is-active', j === i));
    active = i;
    if (els[i]) els[i].scrollIntoView({ block: 'nearest' });
  };

  const render = async () => {
    const q = input.value.trim();
    active = -1;
    if (!q) {
      body.innerHTML = `<p class="search-hint">Ketik untuk mencari berita, program, divisi, atau halaman.</p><div class="search-chips">${['Berita', 'Vlog', 'Dokumentasi', 'Program', 'Divisi'].map((w) => `<button type="button">${w}</button>`).join('')}</div>`;
      return;
    }
    body.innerHTML = '<p class="search-hint">Mencari...</p>';
    const items = await load();
    if (input.value.trim() !== q) return; // sudah mengetik lagi, hasil lama dibuang
    const found = find(items, q);
    if (!found.length) {
      body.innerHTML = `<p class="search-hint">Tidak ada hasil untuk “${esc(q)}”. Coba kata lain, misalnya nama divisi atau judul berita.</p>`;
      return;
    }
    body.innerHTML = `<p class="search-count">${found.length} hasil</p><ul class="search-results" role="listbox">${found.map((r) => `<li role="presentation"><a class="search-item" role="option" href="${esc(r.u)}"${r.ext ? ' target="_blank" rel="noopener"' : ''}><span class="m"><span class="kind">${esc(r.k)}</span>${r.date ? `<span>${esc(r.date)}</span>` : ''}</span><span class="t">${mark(r.t, q)}</span><span class="d">${mark(r.d || '', q)}</span></a></li>`).join('')}</ul>`;
    setActive(0);
  };

  const closeMenu = () => {
    const menu = document.querySelector('#menu');
    if (menu) menu.classList.remove('active');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    closeMenu(); // menu HP dan pencarian tidak dibuka bersamaan
    panel.hidden = false;
    backdrop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    render();
    input.focus();
    load(); // mulai memuat bahan pencarian selagi pengguna mengetik
  };
  const close = () => {
    panel.hidden = true;
    backdrop.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => (panel.hidden ? open() : close()));
  backdrop.addEventListener('click', close);
  if (burger) burger.addEventListener('click', close);
  input.addEventListener('input', render);

  input.addEventListener('keydown', (e) => {
    const n = body.querySelectorAll('.search-item').length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); setActive((active + 1) % n); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); setActive((active - 1 + n) % n); }
    else if (e.key === 'Enter') {
      const a = body.querySelectorAll('.search-item')[Math.max(active, 0)];
      if (a) { e.preventDefault(); a.click(); }
    }
  });

  body.addEventListener('click', (e) => {
    const chip = e.target.closest('.search-chips button');
    if (chip) { input.value = chip.textContent; render(); input.focus(); return; }
    const a = e.target.closest('.search-item');
    if (a && a.target !== '_blank') close(); // halaman yang sama (lompat ke bagian) tidak memuat ulang, jadi panel ditutup di sini
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); return; }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === '/' && panel.hidden && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); }
  });
})();