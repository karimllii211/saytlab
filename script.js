/* =========================================================================
   SAYTLAB — script.js  (framework yoxdur, vanilla JS)

   PERFORMANS PRİNSİPLƏRİ (bax: tapşırıq — "Performans / FPS tələbləri")
   • Bütün vizual yeniləmələr TƏK bir requestAnimationFrame loop-unda edilir.
   • mousemove / scroll event-ləri yalnız dəyər yazır (bayraq), DOM-a toxunmur.
   • Bütün scroll/touch listener-ləri { passive: true }.
   • getBoundingClientRect yalnız mouseenter-də oxunur və keşlənir (scroll-da yox).
   • Yalnız transform + opacity animasiya olunur.
   • prefers-reduced-motion: loop yüngül rejimə keçir (yalnız proqres + header).
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motion = !prefersReduced;

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // JS işləyir → reveal-in gizli başlanğıc vəziyyətini aktivləşdir
  document.documentElement.classList.add('js-reveal');

  /* ===================================================================
     0. Sonsuz fon animasiyalarını yalnız öz bölmələri ekranda olarkən işlət.
        Tək IntersectionObserver bütün [data-pause-offscreen] konteynerlərini
        idarə edir; CSS: animation-play-state: var(--anim-state, running).
     =================================================================== */
  const pauseIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.style.setProperty('--anim-state', entry.isIntersecting ? 'running' : 'paused');
    }
  }, { threshold: 0, rootMargin: '200px 0px' });
  $$('[data-pause-offscreen]').forEach(el => pauseIO.observe(el));
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  /* ===================================================================
     1. Paylaşılan vəziyyət — event-lər yalnız bunu yeniləyir
     =================================================================== */
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, seen: false };
  let scrollY = window.scrollY;
  let scrollDirty = true;
  let docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  window.addEventListener('mousemove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.seen = true;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    scrollDirty = true;
  }, { passive: true });

  const recalcDoc = () => {
    docMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollDirty = true;
  };
  window.addEventListener('resize', recalcDoc, { passive: true });
  window.addEventListener('load', recalcDoc);

  /* ===================================================================
     2. Xüsusi cursor (mövqe rAF-də, ölçü CSS ::after scale-də)
     =================================================================== */
  const cursorDot = $('#cursorDot');
  const cursorRing = $('#cursorRing');
  const ringPos = { x: pointer.x, y: pointer.y };
  let cursorOn = false;

  if (finePointer && motion) {
    document.body.classList.add('custom-cursor');
    cursorOn = true;
    // hover-da ring böyüyür (CSS: .is-hover::after { transform: scale() })
    $$('a, button, .tilt, .usecase-item, .faq-q, .car-btn, .switch').forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-hover'));
    });
  }

  /* ===================================================================
     3. Maqnit düymələr — rect mouseenter-də keşlənir, transform rAF-də
     =================================================================== */
  const magnets = (finePointer && motion) ? $$('[data-magnetic]').map(el => ({
    el, rect: null, active: false, cx: 0, cy: 0
  })) : [];

  magnets.forEach(m => {
    m.el.addEventListener('mouseenter', () => { m.rect = m.el.getBoundingClientRect(); m.active = true; });
    m.el.addEventListener('mouseleave', () => { m.active = false; });
  });

  /* ===================================================================
     4. Bento / qalereya 3D tilt — rect keşli, transform rAF-də
     =================================================================== */
  const tilts = (finePointer && motion) ? $$('.tilt').map(el => ({
    el, rect: null, active: false
  })) : [];

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
     5. Parallax qatları (hero fonu) — scroll dəyəri rAF-də tətbiq olunur
     =================================================================== */
  const parallax = motion ? $$('[data-parallax]').map(el => ({
    el, speed: parseFloat(el.dataset.parallax) || 0.1
  })) : [];

  /* ===================================================================
     6. Proqres zolağı + header vəziyyəti (həmişə, amma rAF-də)
     =================================================================== */
  const progress = $('#scrollProgress');
  const header = $('.site-header');

  /* ===================================================================
     7. TƏK rAF loop
     =================================================================== */
  function frame() {
    // --- cursor ---
    if (cursorOn && pointer.seen) {
      cursorDot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      ringPos.x = lerp(ringPos.x, pointer.x, 0.2);
      ringPos.y = lerp(ringPos.y, pointer.y, 0.2);
      cursorRing.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    }

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

    // --- tilt ---
    for (let i = 0; i < tilts.length; i++) {
      const t = tilts[i];
      if (t.active && t.rect) {
        const px = clamp((pointer.x - t.rect.left) / t.rect.width, 0, 1);
        const py = clamp((pointer.y - t.rect.top) / t.rect.height, 0, 1);
        t.el.style.transform =
          `perspective(800px) rotateY(${((px - 0.5) * 8).toFixed(2)}deg) rotateX(${((0.5 - py) * 8).toFixed(2)}deg)`;
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
        // müstəqil `translate` xüsusiyyəti — CSS @keyframes (transform) ilə toqquşmur
        p.el.style.translate = `0 ${(scrollY * p.speed).toFixed(2)}px`;
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ===================================================================
     8. Scroll-reveal — IntersectionObserver, istiqamətli + stagger
     =================================================================== */
  const revealIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const group = $$('.reveal', entry.target.parentElement).filter(el => !el.classList.contains('is-visible'));
      const idx = Math.max(0, group.indexOf(entry.target));
      entry.target.style.transitionDelay = (idx * 80) + 'ms';
      entry.target.classList.add('is-visible');
      // keçid bitəndə transitionDelay-i sıfırla (yenidən hover və s. üçün)
      entry.target.addEventListener('transitionend', function h() {
        entry.target.style.transitionDelay = '';
        entry.target.removeEventListener('transitionend', h);
      });
      revealIO.unobserve(entry.target);
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  const revealEls = $$('.reveal');
  revealEls.forEach(el => revealIO.observe(el));
  // Təhlükəsizlik tələsi: nə olursa olsun 4 saniyədən sonra hamısı görünsün
  setTimeout(() => revealEls.forEach(el => el.classList.add('is-visible')), 4000);

  /* ===================================================================
     9. Sayğac animasiyası — scroll ilə görünəndə 0 → hədəf
     =================================================================== */
  const fmt = (n) => n >= 1000 ? Math.round(n / 1000) + 'K' : String(Math.round(n));
  const animateCount = (el) => {
    const target = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const dur = 1500;
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
     10. Hero giriş animasiyası — maskadan qalxan sözlər (stagger)
     =================================================================== */
  const heroEls = $$('[data-hero]').sort((a, b) => +a.dataset.hero - +b.dataset.hero);
  if (motion) {
    heroEls.forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 110 + i * 65));
  } else {
    heroEls.forEach(el => el.classList.add('is-in'));
  }

  /* ===================================================================
     11. Mobil menyu — tam ekran "pərdə" overlay
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
     12. Use-case accordion + canlı preview paneli
     =================================================================== */
  const ucData = {
    marketing: { tag: 'Marketinq', heading: 'Yaz launch kampaniyası',   text: '18 kadr · 3 kanal · brend palitrası tətbiq edildi.', c1: '#1f6b4a', c2: '#e6b866' },
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
    ucBody.classList.add('is-swapping');          // qısa fade
    setTimeout(() => {
      ucTag.textContent = d.tag;
      ucHeading.textContent = d.heading;
      ucText.textContent = d.text;
      ucVisual.style.background = `linear-gradient(135deg, ${d.c1}, ${d.c2})`;
      ucBody.classList.remove('is-swapping');
    }, 190);
  };
  ucItems.forEach(item => {
    item.addEventListener('click', () => {
      ucItems.forEach(i => i.classList.remove('is-active'));
      item.classList.add('is-active');
      setUsecase(item.dataset.uc);
    });
  });

  /* ===================================================================
     13. Pricing aylıq/illik toggle — rəqəmlərdə fade/scale keçidi
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
      el.classList.add('is-swap');               // CSS: opacity 0 + translateY + scale
      setTimeout(() => {
        el.textContent = '₼' + (yearly ? el.dataset.yearly : el.dataset.monthly);
        el.classList.remove('is-swap');
      }, 170);
    });
  };
  billingSwitch.addEventListener('click', () => setBilling(!billingSwitch.classList.contains('is-yearly')));

  /* ===================================================================
     14. FAQ accordion — bir anda yalnız biri açıq (max-height transition)
     =================================================================== */
  $$('.faq-item').forEach(item => {
    $('.faq-q', item).addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      $$('.faq-item').forEach(i => i.classList.remove('is-open'));
      if (!open) item.classList.add('is-open');
    });
  });

  /* ===================================================================
     15. Testimonials carousel — ox düymələri ilə smooth scroll
     =================================================================== */
  const track = $('#testimonialTrack');
  const stepBy = () => (track.querySelector('.t-card')?.offsetWidth || 320) + 18;
  $('#tNext').addEventListener('click', () => track.scrollBy({ left: stepBy(), behavior: 'smooth' }));
  $('#tPrev').addEventListener('click', () => track.scrollBy({ left: -stepBy(), behavior: 'smooth' }));

});
