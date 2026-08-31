/* =========================================================================
   SAYTLAB — script.js  (framework yoxdur, vanilla JS)
   Bölmələr:
   1. Yardımçılar        7. Parallax (hero fon)
   2. Xüsusi cursor      8. Maqnit düymələr
   3. Scroll progress    9. Sayğac animasiyası
   4. Header state      10. Bento tilt (3D)
   5. Mobil menyu       11. Use-case accordion + preview
   6. Scroll reveal     12. Pricing toggle / 13. FAQ / 14. Carousel / 15. Hero intro
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- 2. Xüsusi cursor ---------- */
  if (finePointer && !prefersReduced) {
    document.body.classList.add('custom-cursor');
    const dot = $('#cursorDot');
    const ring = $('#cursorRing');
    let rx = 0, ry = 0, mx = 0, my = 0;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });

    // Ring yumşaq gecikmə ilə siçanı izləyir
    const followRing = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(followRing);
    };
    followRing();

    // İnteraktiv elementlərin üstündə ring böyüyür
    $$('a, button, .tilt, .usecase-item, .faq-q').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
  }

  /* ---------- 3. Scroll progress bar ---------- */
  const progress = $('#scrollProgress');
  const updateProgress = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    progress.style.width = (scrolled * 100) + '%';
  };

  /* ---------- 4. Header scroll state ---------- */
  const header = $('.site-header');
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    updateProgress();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 5. Mobil menyu (tam ekran overlay) ---------- */
  const menuToggle = $('#menuToggle');
  const overlay = $('#mobileOverlay');
  const toggleMenu = (force) => {
    const open = force ?? !overlay.classList.contains('is-open');
    overlay.classList.toggle('is-open', open);
    menuToggle.classList.toggle('is-active', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    overlay.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuToggle.addEventListener('click', () => toggleMenu());
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- 6. Scroll reveal (istiqamətli + stagger) ---------- */
  const revealEls = $$('.reveal');
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      // Eyni valideyn altındakı elementlərə mərhələli gecikmə
      const siblings = $$('.reveal', entry.target.parentElement).filter(el => !el.classList.contains('is-visible'));
      const idx = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = Math.max(0, idx) * 90 + 'ms';
      entry.target.classList.add('is-visible');
      revealIO.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(el => revealIO.observe(el));

  /* ---------- 7. Parallax — hero fon elementləri ---------- */
  const parallaxEls = $$('[data-parallax]');
  if (!prefersReduced && parallaxEls.length) {
    let ticking = false;
    const runParallax = () => {
      const y = window.scrollY;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(runParallax); ticking = true; }
    }, { passive: true });
  }

  /* ---------- 8. Maqnit düymələr ---------- */
  if (!prefersReduced && finePointer) {
    $$('[data-magnetic]').forEach(btn => {
      const strength = 0.35;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- 9. Sayğac animasiyası ---------- */
  const counters = $$('[data-count]');
  const animateCount = (el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const dur = 1600;
    const start = performance.now();
    const fmt = (n) => n >= 1000 ? Math.round(n / 1000) + 'K' : Math.round(n);
    let done = false;
    const finish = () => { if (!done) { done = true; el.textContent = fmt(target) + suffix; } };
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else finish();
    };
    requestAnimationFrame(tick);
    // Fallback: rAF fon rejimində dayanarsa da yekun rəqəm mütləq təyin olunsun
    setTimeout(finish, dur + 400);
  };
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCount(entry.target); countIO.unobserve(entry.target); }
    });
  }, { threshold: 0.6 });
  counters.forEach(el => countIO.observe(el));

  /* ---------- 10. Bento tilt (3D) + işıq izləmə ---------- */
  if (!prefersReduced && finePointer) {
    $$('.tilt').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(800px) rotateY(${(px - 0.5) * 8}deg) rotateX(${(0.5 - py) * 8}deg)`;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- 11. Use-case accordion + canlı preview ---------- */
  const ucData = {
    marketing: { tag: 'Marketinq', heading: 'Yaz launch kampaniyası', text: '18 kadr · 3 kanal · brend palitrası tətbiq edildi.', c1: '#1f6b4a', c2: '#e6b866' },
    ecommerce: { tag: 'E-ticarət',  heading: 'Kataloq standartlaşdırması', text: '420 məhsul · vahid işıq · avtomatik fon.', c1: '#c9954a', c2: '#3a2a5c' },
    social:    { tag: 'Sosial',     heading: 'Həftəlik kontent seriyası', text: '28 post · 4 şablon · avtomatik ölçüləndirmə.', c1: '#3a2a5c', c2: '#f2d29a' },
    product:   { tag: 'Məhsul',     heading: 'Feature elan maketləri', text: '9 changelog vizualı · 2 dəqiqədə hazır.', c1: '#1f6b4a', c2: '#f2d29a' },
  };
  const ucItems = $$('.usecase-item');
  const ucBody = $('.uc-window-body');
  const ucFields = {
    tag: $('#ucTag'), heading: $('#ucHeading'), text: $('#ucText'), visual: $('#ucVisual'),
  };
  const setUsecase = (key) => {
    const d = ucData[key];
    if (!d) return;
    ucBody.classList.add('is-swapping');
    setTimeout(() => {
      ucFields.tag.textContent = d.tag;
      ucFields.heading.textContent = d.heading;
      ucFields.text.textContent = d.text;
      ucFields.visual.style.background = `linear-gradient(135deg, ${d.c1}, ${d.c2})`;
      ucBody.classList.remove('is-swapping');
    }, 220);
  };
  ucItems.forEach(item => {
    item.addEventListener('click', () => {
      ucItems.forEach(i => i.classList.remove('is-active'));
      item.classList.add('is-active');
      setUsecase(item.dataset.uc);
    });
  });

  /* ---------- 12. Pricing aylıq/illik toggle (rəqəm animasiyası) ---------- */
  const billingSwitch = $('#billingSwitch');
  const labelMonthly = $('#labelMonthly');
  const labelYearly = $('#labelYearly');
  const amounts = $$('.price .amount');
  const setBilling = (yearly) => {
    billingSwitch.classList.toggle('is-yearly', yearly);
    billingSwitch.setAttribute('aria-checked', String(yearly));
    labelMonthly.classList.toggle('is-active', !yearly);
    labelYearly.classList.toggle('is-active', yearly);
    amounts.forEach(el => {
      el.classList.add('is-swap'); // qısa fade/scale keçidi
      setTimeout(() => {
        el.textContent = '₼' + (yearly ? el.dataset.yearly : el.dataset.monthly);
        el.classList.remove('is-swap');
      }, 180);
    });
  };
  billingSwitch.addEventListener('click', () => setBilling(!billingSwitch.classList.contains('is-yearly')));

  /* ---------- 13. FAQ accordion (bir anda bir açıq) ---------- */
  $$('.faq-item').forEach(item => {
    $('.faq-q', item).addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      $$('.faq-item').forEach(i => i.classList.remove('is-open'));
      if (!open) item.classList.add('is-open');
    });
  });

  /* ---------- 14. Testimonials carousel ---------- */
  const track = $('#testimonialTrack');
  const step = () => (track.querySelector('.t-card')?.offsetWidth || 320) + 18;
  $('#tNext').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  $('#tPrev').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));

  /* ---------- 15. Hero giriş animasiyası (maskadan qalxma, stagger) ---------- */
  const heroEls = $$('[data-hero]').sort((a, b) => +a.dataset.hero - +b.dataset.hero);
  heroEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('is-in'), 120 + i * 70);
  });

});
