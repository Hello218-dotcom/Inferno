(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // set page mood without editing content
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const mood =
    file.includes("service") ? "services" :
    (file.includes("lead") || file.includes("director") || file.includes("board") || file.includes("team") || file.includes("management")) ? "leadership" :
    (file.includes("contact") || file.includes("reach") || file.includes("address")) ? "contact" :
    (file.includes("risk") || file.includes("complaint") || file.includes("disclosure") || file.includes("policy")) ? "risk" :
    "home";
  document.body.dataset.mood = mood;

  // mark key headings for gold divider (no text change)
  const keywords = ["leadership","board","directors","management","team","services","risk","complaint","procedure","process","how it works","steps","pricing","packages","contact"];
  $$("h2,h3").forEach(h => {
    const t = (h.textContent || "").trim().toLowerCase();
    if (!t) return;
    if (keywords.some(k => t.includes(k))) h.setAttribute("data-divider","1");
  });

  // opening reveal (text/cards/sections)
  const toReveal = $$("main, section, header, .card, [class*='card'], .box, .panel, .tile, .feature, .step, .steps, .grid, .row");
  let delay = 0;
  toReveal.forEach(el => {
    if (el.classList.contains("nx-reveal")) return;
    el.classList.add("nx-reveal");
  });

  // stagger inside obvious groups
  $$(".nx-stagger, .cards, .steps, .grid, .row, .features, .cards-grid").forEach(group => {
    let d = 0;
    $$(":scope > *", group).forEach(ch => {
      ch.style.setProperty("--d", `${d}ms`);
      ch.classList.add("nx-reveal");
      d += 120;
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add("nx-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  $$(".nx-reveal").forEach(el => io.observe(el));

  // Mobile dropdown: enable tap-to-toggle for any dropdown trigger
  const isTouch = matchMedia("(hover: none)").matches;
  if (isTouch){
    // heuristic: anchors/buttons that have a sibling dropdown menu
    $$("nav a, .nav a, .navbar a, nav button, .navbar button").forEach(trigger => {
      const parent = trigger.parentElement;
      if (!parent) return;

      // find an immediate dropdown container under same parent
      const dd = parent.querySelector(".nx-dd, .dropdown, .menu-dropdown, ul, .dropdown-menu");
      if (!dd) return;

      // avoid toggling normal links without submenu
      const hasSub = dd && dd.children && dd.children.length > 0;
      if (!hasSub) return;

      // prevent duplicates
      if (trigger.dataset.nxBound) return;
      trigger.dataset.nxBound = "1";

      trigger.addEventListener("click", (ev) => {
        // if link points to a page, allow second click to navigate
        const href = trigger.getAttribute("href");
        const isHash = href && href.startsWith("#");
        const isPage = href && !isHash && href !== "javascript:void(0)" && href !== "#";

        // First click: toggle only
        ev.preventDefault();

        // close other opens at same nav level
        const sibs = parent.parentElement ? Array.from(parent.parentElement.children) : [];
        sibs.forEach(s => { if (s !== parent) s.classList.remove("nx-open","open","show","is-open"); });

        parent.classList.toggle("nx-open");
        parent.classList.toggle("open");

        // if already open and it is a page link, second tap navigates
        if (isPage && parent.classList.contains("nx-open") === false){
          location.href = href;
        }
      }, { passive:false });
    });
  }

  // index-only: inject TradingView PSX line widget if placeholder exists or auto-add near top
  if (file === "index.html"){
    const mount = document.getElementById("tv_psx") || document.getElementById("tradingview_psx");
    if (mount){
      // will be handled by your existing widget code if present
      return;
    }
  }
})();
