/* ============================================================
   STOXGEAR CINEMA MOTION (content-driven)
   - Sequenced like the recording: heading -> text -> media -> blocks -> CTA
   - Replays every time a section re-enters the viewport
   ============================================================ */

(function(){
  const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(prefersReduce) return;

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  /* -------------------------
     Brand intro (every page)
  ------------------------- */
  function mountIntro(){
    const logo1 = $('.nx-logo');
    if(!logo1) return Promise.resolve();

    const logo2 = $('.nx-logo2');

    const intro = document.createElement('div');
    intro.className = 'sg-intro';
    intro.innerHTML = `
      <div class="sg-intro__wrap" aria-hidden="true">
        <div class="sg-intro__logos">
          <img src="${logo1.getAttribute('src')||''}" alt="" />
          ${logo2 ? `<img class="sg-partner" src="${logo2.getAttribute('src')||''}" alt="" />` : ``}
        </div>
        <div class="sg-intro__line"></div>
        <div class="sg-intro__ring"></div>
      </div>
    `;
    document.body.appendChild(intro);

    const line = $('.sg-intro__line', intro);

    // Animate line draw
    line.animate(
      [{transform:'scaleX(0)'},{transform:'scaleX(1)'}],
      {duration: 780, easing: 'cubic-bezier(.2,.9,.2,1)', fill:'forwards', delay: 140}
    );

    // Hold briefly then fade out
    return new Promise((resolve)=>{
      setTimeout(()=>{
        intro.classList.add('is-hidden');
        setTimeout(()=>{
          intro.remove();
          resolve();
        }, 520);
      }, 1150);
    });
  }

  /* -------------------------
     Content-driven selection
  ------------------------- */

  function isVisibleEl(el){
    if(!el) return false;
    const st = getComputedStyle(el);
    if(st.display === 'none' || st.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function markUnderline(el){
    if(!el) return;
    // Underline only for primary headings
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if(tag === 'h1' || tag === 'h2'){
      el.classList.add('sg-underline');
    }
  }

  function pickDirection(el, idx, mode){
    // mode changes per page type to feel "unique"
    // 0: mixed L/R + up, 1: calm up only, 2: editorial L/R
    const cls = ['sg-up','sg-left','sg-right','sg-scale'];
    if(mode === 1) return 'sg-up';
    if(mode === 2) return (idx % 2 === 0) ? 'sg-left' : 'sg-right';
    // default mixed
    const seq = ['sg-up','sg-left','sg-right','sg-up','sg-scale'];
    return seq[idx % seq.length];
  }

  function getPageMode(){
    const t = (document.title || '').toLowerCase();
    const path = (location.pathname || '').toLowerCase();

    // Education pages calmer editorial; tables minimal; home mixed
    const isHome = /stoxgear|index/.test(t) && (path.endsWith('index.html') || path === '/' || path === '');
    const isEdu = /(glossary|investor|new to trading|rule book|education|faq|order|settlement|arbitration)/.test(t+path);
    const isForms = /(forms|downloads|software|financial statements|kyc|cdd|policy)/.test(t+path);
    const isSupport = /(complaint|penal|secp|psx|cdc|niccpl)/.test(t+path);

    if(isForms || isSupport) return 1; // calm
    if(isEdu) return 2; // editorial L/R
    if(isHome) return 0;
    return 2;
  }

  function collectSequence(section){
    // Priority order: headings -> lead text -> media -> cards/blocks -> lists/tables -> cta/buttons
    const order = [];

    const headings = $$('h1,h2,h3', section).filter(isVisibleEl);
    headings.forEach(h => { markUnderline(h); order.push(h); });

    const leadText = $$('p, .lead, .subtitle, .hero p', section).filter(isVisibleEl);
    leadText.forEach(p => order.push(p));

    const media = $$('img, video, .media, .frame, .badge', section).filter(isVisibleEl);
    media.forEach(m => {
      // Prefer wrapping containers (media/frame/badge) over raw img inside them
      if(m.tagName && m.tagName.toLowerCase() === 'img'){
        const wrap = m.closest('.media,.frame,.badge');
        if(wrap && wrap !== section) { if(!order.includes(wrap)) order.push(wrap); return; }
      }
      order.push(m);
    });

    const blocks = $$(
      '.card, .step, .nx-foot-col, .nx-foot-top, .nx-foot-bottom, .nx-drop, .nx-menu, .hero-badge',
      section
    ).filter(isVisibleEl);
    blocks.forEach(b => { if(!order.includes(b)) order.push(b); });

    const listsTables = $$('ul,ol,table,thead,tbody,tr,section .table, .table', section).filter(isVisibleEl);
    listsTables.forEach(x => { if(!order.includes(x)) order.push(x); });

    const ctas = $$('a.btn, button, input[type="submit"]', section).filter(isVisibleEl);
    ctas.forEach(c => { if(!order.includes(c)) order.push(c); });

    // De-dup while preserving order
    const seen = new Set();
    return order.filter(el => {
      if(seen.has(el)) return false;
      seen.add(el);
      return true;
    }).slice(0, 30); // cap to keep it tasteful
  }

  function prepare(el, dir){
    if(el.classList.contains('sg-anim')) return;
    el.classList.add('sg-anim');
    el.classList.add(dir);
  }

  function animateIn(el, delay){
    const dur = 720;
    const easing = 'cubic-bezier(.2,.9,.2,1)';
    el.animate(
      [
        { opacity: 0, transform: getComputedStyle(el).transform, filter: 'blur(0px)' },
        { opacity: 1, transform: 'none', filter: 'blur(0px)' }
      ],
      { duration: dur, easing, delay, fill:'forwards' }
    );
    el.classList.add('sg-animated');
  }

  function animateOut(el){
    // Reset for replay (fast + subtle)
    el.classList.remove('sg-animated');
    // keep sg-anim + direction
    el.style.opacity = '';
    el.style.transform = '';
  }

  function runSection(section, mode){
    const seq = collectSequence(section);
    seq.forEach((el, i) => prepare(el, pickDirection(el, i, mode)));

    // animate in sequence
    seq.forEach((el, i) => animateIn(el, i * 90));
  }

  function resetSection(section){
    const items = $$('[class*="sg-"]', section).filter(el => el.classList.contains('sg-anim'));
    items.forEach(animateOut);
  }

  function sectionsToAnimate(){
    const candidates = [];

    // main storytelling blocks
    $$('section, main, header, footer').forEach(s => candidates.push(s));

    // containers used as sections
    $$('.container').forEach(c => {
      if(c.closest('header') || c.closest('footer')) return;
      candidates.push(c);
    });

    // de-dup and filter tiny containers
    const seen = new Set();
    return candidates.filter(s => {
      if(!s || seen.has(s)) return false;
      seen.add(s);
      const r = s.getBoundingClientRect();
      // can't rely on rect at load; use child count heuristic
      const childCount = s.children ? s.children.length : 0;
      return childCount >= 1;
    });
  }

  function initMotion(){
    const mode = getPageMode();

    const secs = sectionsToAnimate();

    const io = new IntersectionObserver((entries)=>{
      entries.forEach(ent=>{
        const sec = ent.target;
        if(ent.isIntersecting){
          runSection(sec, mode);
        }else{
          // reset when leaving so it replays
          resetSection(sec);
        }
      });
    }, { threshold: 0.18 });

    secs.forEach(s => io.observe(s));
  }

  // Navbar "scrolled" shadow helper (nice)
  (function(){
    const header = document.getElementById('nxHeader');
    if(!header) return;
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
  })();

  // Run after intro so content feels staged
  mountIntro().then(()=>{
    initMotion();
  });

})();
