/* =========================================================================
   SAYTLAB — script.js  (framework yoxdur, vanilla JS)

   ANİMASİYA FƏLSƏFƏSİ (Emil Kowalski çərçivəsi):
   • Hər animasiyanın konkret səbəbi var: feedback, state, spatial, jarring-change,
     explanation, rare/delight. "Gözəl görünür" kifayət deyil.
   • Custom cursor SİLİNDİ — məqsədsiz daimi hərəkət idi.
   • Magnetic effekt yalnız 2 əsas CTA-da (hero + CTA banner).
   • Tilt yalnız hover edilən kartda, zəif bucaqla (5°).
   • Scroll-reveal: clip-path "pərdə açılması", BİR DƏFƏ (unobserve).

   PERFORMANS:
   • Bütün vizual yeniləmələr TƏK requestAnimationFrame loop-unda.
   • mousemove / scroll yalnız dəyər yazır; DOM yazışı yalnız rAF-də.
   • Bütün scroll/pointer listener-ləri { passive: true }.
   • getBoundingClientRect yalnız mouseenter-də (scroll-da yox).
   • Yalnız transform / opacity / clip-path animasiya olunur.
   ========================================================================= */

/* Səhifə yenilənəndə (F5) HƏMİŞƏ başdan açılsın — brauzerin scroll-bərpasını söndür.
   Faylın ən başında, DOMContentLoaded-dən kənarda: mümkün qədər tez icra olunsun. */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('load', () => window.scrollTo(0, 0));  // Safari üçün ehtiyat

document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motion = !prefersReduced;

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  // (js-reveal sinfi artıq <head>-dəki inline script ilə əlavə olunub — FOUC-suz)

  /* ===================================================================
     0. Sonsuz fon animasiyalarını yalnız öz bölmələri ekranda olarkən işlət.
        Qalan sonsuz animasiyalar: hero blob-ları, marquee, 1 bento pulse.
        Tək IntersectionObserver → CSS: animation-play-state: var(--anim-state).
     =================================================================== */
  const pauseIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.style.setProperty('--anim-state', entry.isIntersecting ? 'running' : 'paused');
    }
  }, { threshold: 0, rootMargin: '200px 0px' });
  $$('[data-pause-offscreen]').forEach(el => pauseIO.observe(el));

  /* ===================================================================
     1. Paylaşılan vəziyyət — event-lər yalnız bunu yeniləyir
     =================================================================== */
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let scrollY = window.scrollY;
  let scrollDirty = true;
  let docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  if (finePointer && motion) {
    window.addEventListener('mousemove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });
  }
  window.addEventListener('scroll', () => { scrollY = window.scrollY; scrollDirty = true; }, { passive: true });

  const recalcDoc = () => {
    docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollDirty = true;
  };
  window.addEventListener('resize', recalcDoc, { passive: true });
  window.addEventListener('load', recalcDoc);

  /* ===================================================================
     2. Maqnit düymələr — YALNIZ hero + CTA banner əsas CTA-ları.
        rect mouseenter-də keşlənir, transform rAF-də tətbiq olunur.
     =================================================================== */
  const magnets = (finePointer && motion) ? $$('[data-magnetic]').map(el => ({
    el, rect: null, active: false, cx: 0, cy: 0
  })) : [];
  magnets.forEach(m => {
    m.el.addEventListener('mouseenter', () => { m.rect = m.el.getBoundingClientRect(); m.active = true; });
    m.el.addEventListener('mouseleave', () => { m.active = false; });
  });

  /* ===================================================================
     3. 3D tilt — yalnız hover edilən kartda, zəif bucaq (±5°).
     =================================================================== */
  const TILT_DEG = 5;
  const tilts = (finePointer && motion) ? $$('.tilt').map(el => ({ el, rect: null, active: false })) : [];
  tilts.forEach(t => {
    t.el.addEventListener('mouseenter', () => {
      t.rect = t.el.getBoundingClientRect();
      t.active = true;
      t.el.style.willChange = 'transform';   // yalnız hover müddətində
    });
    t.el.addEventListener('mouseleave', () => {
      t.active = false;
      t.el.style.transform = '';
      t.el.style.willChange = 'auto';
    });
  });

  /* ===================================================================
     4. Parallax — YALNIZ hero fonu.
     =================================================================== */
  const parallax = motion ? $$('.hero [data-parallax]').map(el => ({
    el, speed: parseFloat(el.dataset.parallax) || 0.1
  })) : [];

  /* ===================================================================
     5. Proqres zolağı + header vəziyyəti
     =================================================================== */
  const progress = $('#scrollProgress');
  const header = $('.site-header');

  /* ===================================================================
     6. TƏK rAF loop
     =================================================================== */
  function frame() {
    // --- maqnit düymələr ---
    for (let i = 0; i < magnets.length; i++) {
      const m = magnets[i];
      let gx = 0, gy = 0;
      if (m.active && m.rect) {
        gx = (pointer.x - m.rect.left - m.rect.width / 2) * 0.3;
        gy = (pointer.y - m.rect.top - m.rect.height / 2) * 0.3;
      }
      m.cx = lerp(m.cx, gx, 0.18);
      m.cy = lerp(m.cy, gy, 0.18);
      if (m.active || Math.abs(m.cx) > 0.05 || Math.abs(m.cy) > 0.05) {
        m.el.style.transform = `translate3d(${m.cx.toFixed(2)}px, ${m.cy.toFixed(2)}px, 0)`;
      } else if (m.el.style.transform) {
        m.el.style.transform = '';
      }
    }

    // --- tilt (yalnız hover edilən kart) ---
    for (let i = 0; i < tilts.length; i++) {
      const t = tilts[i];
      if (t.active && t.rect) {
        const px = clamp((pointer.x - t.rect.left) / t.rect.width, 0, 1);
        const py = clamp((pointer.y - t.rect.top) / t.rect.height, 0, 1);
        t.el.style.transform =
          `perspective(900px) rotateY(${((px - 0.5) * TILT_DEG).toFixed(2)}deg) rotateX(${((0.5 - py) * TILT_DEG).toFixed(2)}deg)`;
        t.el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        t.el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      }
    }

    // --- scroll-driven (yalnız dəyişəndə) ---
    if (scrollDirty) {
      scrollDirty = false;
      const ratio = clamp(scrollY / docMax, 0, 1);
      progress.style.transform = `scaleX(${ratio.toFixed(4)})`;
      header.classList.toggle('is-scrolled', scrollY > 24);
      for (let i = 0; i < parallax.length; i++) {
        const p = parallax[i];
        // müstəqil `translate` — CSS @keyframes (transform) ilə toqquşmur
        p.el.style.translate = `0 ${(scrollY * p.speed).toFixed(2)}px`;
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ===================================================================
     7. Scroll-reveal — "pərdə açılması" (clip-path), BİR DƏFƏ.
        Element ekrana girəndən 100px sonra tetiklənir, sonra unobserve.
        Yuxarı-aşağı scroll təkrar animasiya YARATMIR.
     =================================================================== */
  const revealIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const group = $$('.reveal', entry.target.parentElement).filter(el => !el.hasAttribute('data-visible'));
      const idx = Math.max(0, group.indexOf(entry.target));
      entry.target.style.transitionDelay = (idx * 60) + 'ms';   // qısa stagger (30–80ms aralığı)
      entry.target.setAttribute('data-visible', '');
      entry.target.addEventListener('transitionend', function h() {
        entry.target.style.transitionDelay = '';
        entry.target.removeEventListener('transitionend', h);
      });
      revealIO.unobserve(entry.target);   // VACİB: bir dəfə
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  const revealEls = $$('.reveal');
  revealEls.forEach(el => revealIO.observe(el));
  // Təhlükəsizlik tələsi: nə olursa olsun 4 saniyədən sonra hamısı görünsün
  setTimeout(() => revealEls.forEach(el => el.setAttribute('data-visible', '')), 4000);

  /* ===================================================================
     8. Sayğac animasiyası — scroll ilə görünəndə 0 → hədəf (bir dəfə)
     =================================================================== */
  const fmt = (n) => n >= 1000 ? Math.round(n / 1000) + 'K' : String(Math.round(n));
  const animateCount = (el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();
    let done = false;
    const finish = () => { if (!done) { done = true; el.textContent = fmt(target) + suffix; } };
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick); else finish();
    };
    if (motion) { requestAnimationFrame(tick); setTimeout(finish, dur + 400); }
    else finish();
  };
  const countIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { animateCount(entry.target); countIO.unobserve(entry.target); }
    }
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ===================================================================
     9. Hero giriş animasiyası — bir dəfəlik "delight" büdcəsi (səhifə açılışı)
     =================================================================== */
  const heroEls = $$('[data-hero]').sort((a, b) => +a.dataset.hero - +b.dataset.hero);
  if (motion) {
    // Stagger sıxlaşdırıldı (60ms -> 28ms): 11 element olsa belə son element ~370ms-də başlayır,
    // öz 0.85s transition-u ilə birlikdə hero cəmi ~1.2s-dən ~0.9s-ə enir — "gec açılır" hissini azaldır.
    heroEls.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 60 + i * 28));
  } else {
    heroEls.forEach(el => el.classList.add('is-in'));
  }

  /* ===================================================================
     10. Mobil menyu — tam ekran "pərdə" overlay
     =================================================================== */
  const menuToggle = $('#menuToggle');
  const overlay = $('#mobileOverlay');
  const setMenu = (open) => {
    overlay.classList.toggle('is-open', open);
    menuToggle.classList.toggle('is-active', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    overlay.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuToggle.addEventListener('click', () => setMenu(!overlay.classList.contains('is-open')));
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ===================================================================
     11. Use-case accordion + canlı preview paneli (state indication)
     =================================================================== */
  const ucData = {
    marketing: { tag: 'Marketinq', heading: 'Yaz launch kampaniyası',    text: '18 kadr · 3 kanal · brend palitrası tətbiq edildi.', c1: '#1f6b4a', c2: '#e6b866' },
    ecommerce: { tag: 'E-ticarət', heading: 'Kataloq standartlaşdırması', text: '420 məhsul · vahid işıq · avtomatik fon.',           c1: '#c9954a', c2: '#3a2a5c' },
    social:    { tag: 'Sosial',    heading: 'Həftəlik kontent seriyası',  text: '28 post · 4 şablon · avtomatik ölçüləndirmə.',         c1: '#3a2a5c', c2: '#f2d29a' },
    product:   { tag: 'Məhsul',    heading: 'Feature elan maketləri',     text: '9 changelog vizualı · 2 dəqiqədə hazır.',              c1: '#1f6b4a', c2: '#f2d29a' },
  };
  const ucItems = $$('.usecase-item');
  const ucBody = $('.uc-window-body');
  const ucTag = $('#ucTag'), ucHeading = $('#ucHeading'), ucText = $('#ucText'), ucVisual = $('#ucVisual');
  const setUsecase = (key) => {
    const d = ucData[key];
    if (!d) return;
    ucBody.classList.add('is-swapping');
    setTimeout(() => {
      ucTag.textContent = d.tag;
      ucHeading.textContent = d.heading;
      ucText.textContent = d.text;
      ucVisual.style.background = `linear-gradient(135deg, ${d.c1}, ${d.c2})`;
      ucBody.classList.remove('is-swapping');
    }, 170);
  };
  ucItems.forEach(item => {
    item.addEventListener('click', () => {
      ucItems.forEach(i => i.classList.remove('is-active'));
      item.classList.add('is-active');
      setUsecase(item.dataset.uc);
    });
  });

  /* ===================================================================
     12. Pricing aylıq/illik toggle — rəqəmlərdə qısa fade/scale (feedback)
     =================================================================== */
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
      el.classList.add('is-swap');
      setTimeout(() => {
        el.textContent = '₼' + (yearly ? el.dataset.yearly : el.dataset.monthly);
        el.classList.remove('is-swap');
      }, 160);
    });
  };
  billingSwitch.addEventListener('click', () => setBilling(!billingSwitch.classList.contains('is-yearly')));

  /* ===================================================================
     13. FAQ accordion — bir anda yalnız biri açıq (grid-template-rows)
     =================================================================== */
  $$('.faq-item').forEach(item => {
    $('.faq-q', item).addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      $$('.faq-item').forEach(i => i.classList.remove('is-open'));
      if (!open) item.classList.add('is-open');
    });
  });

  /* ===================================================================
     14. Testimonials carousel — ox düymələri ilə smooth scroll (spatial)
     =================================================================== */
  const track = $('#testimonialTrack');
  const stepBy = () => (track.querySelector('.t-card')?.offsetWidth || 320) + 18;
  $('#tNext').addEventListener('click', () => track.scrollBy({ left: stepBy(), behavior: 'smooth' }));
  $('#tPrev').addEventListener('click', () => track.scrollBy({ left: -stepBy(), behavior: 'smooth' }));

});
