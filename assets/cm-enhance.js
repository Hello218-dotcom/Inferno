(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // ---------- Preloader (logo + spinner) ----------
  function mountPreloader(){
    if ($('.cm-preloader')) return;
    const overlay = document.createElement('div');
    overlay.className = 'cm-preloader';
    const wrap = document.createElement('div');
    wrap.className = 'cm-preloader__wrap';

    const logoBox = document.createElement('div');
    logoBox.className = 'cm-preloader__logo';

    const logoImg =
      $('.brand img') || $('.logo img') || $('header img') || $('nav img') || $('img[alt*="logo" i]');
    if (logoImg && logoImg.getAttribute('src')) {
      const img = document.createElement('img');
      img.src = logoImg.getAttribute('src');
      img.alt = 'Logo';
      logoBox.appendChild(img);
    } else {
      const txt = document.createElement('div');
      txt.style.fontWeight = '900';
      txt.style.letterSpacing = '.08em';
      txt.style.fontSize = '16px';
      txt.textContent = 'LOGO';
      logoBox.appendChild(txt);
    }

    const spinner = document.createElement('div');
    spinner.className = 'cm-spinner';

    const mark = document.createElement('div');
    mark.className = 'cm-preloader__mark';
    mark.textContent = 'Loading';

    wrap.appendChild(logoBox);
    wrap.appendChild(spinner);
    wrap.appendChild(mark);
    overlay.appendChild(wrap);
    document.body.appendChild(overlay);

    // Hide on full load
    window.addEventListener('load', () => {
      overlay.classList.add('cm-hide');
      setTimeout(() => overlay.remove(), 900);
    }, { once: true });
  }

  // ---------- Scrollcards + indicator tabs ----------
  function makeScrollCards(container){
    if (!container || container.dataset.cmReady === '1') return;
    const cards = $$('.card', container);
    if (cards.length < 3) return;

    container.dataset.cmReady = '1';
    container.classList.add('cm-scrollcards');

    // add subtle 3D only if not already heavy
    container.classList.add('cm-3d');

    // Build tabbar
    const tabbar = document.createElement('div');
    tabbar.className = 'cm-tabbar';
    const labels = cards.map((c, i) => {
      const t = c.getAttribute('data-title') ||
        (c.querySelector('h3,h4') ? c.querySelector('h3,h4').textContent : `Card ${i+1}`);
      return (t || '').trim() || `Card ${i+1}`;
    });

    const tabs = labels.map((label, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cm-tab' + (i === 0 ? ' is-active' : '');
      b.innerHTML = `<span class="cm-tab__line"></span><span class="cm-tab__label"></span>`;
      b.querySelector('.cm-tab__label').textContent = label;
      b.addEventListener('click', () => {
        const card = cards[i];
        if (!card) return;
        const left = card.offsetLeft - 2;
        container.scrollTo({ left, behavior: 'smooth' });
      });
      tabbar.appendChild(b);
      return b;
    });

    // Insert tabbar before container (but keep layout safe)
    container.parentNode?.insertBefore(tabbar, container);

    // Active tab tracking on scroll (mobile & desktop)
    const setActive = (idx) => {
      tabs.forEach((t, k) => t.classList.toggle('is-active', k === idx));
    };

    let raf = null;
    container.addEventListener('scroll', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Determine active card by nearest left edge
        const scrollLeft = container.scrollLeft;
        let bestIdx = 0, bestDist = Infinity;
        cards.forEach((c, i) => {
          const d = Math.abs((c.offsetLeft) - scrollLeft);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        });
        setActive(bestIdx);
      });
    }, { passive: true });
  }

  function initScrollCards(){
    // Heuristic targets (keeps your content; only enhances)
    const candidates = [
      ...$$('div.features'),
      ...$$('.features'),
      ...$$('.card-grid'),
      ...$$('.cards'),
      ...$$('.grid'),
      ...$$('.tiles')
    ].filter((el, idx, arr) => arr.indexOf(el) === idx);

    candidates.forEach(makeScrollCards);
  }

  // ---------- Run ----------
  document.addEventListener('DOMContentLoaded', () => {
    mountPreloader();
    initScrollCards();
  });
})();
