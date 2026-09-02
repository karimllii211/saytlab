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

/* ===================================================================
   LENIS smooth-scroll — inertial/yumşaq scroll (Framer saytlarındakı hiss).
   • Yalnız transform/scroll-position dəyişir, layout-a toxunmur.
   • prefers-reduced-motion və ya CDN yüklənməzsə → native scroll (fallback).
   • `lenis` dəyişəni fayl əhatəsindədir — DOMContentLoaded daxilində istifadə olunur
     (loqo kliki → başa qayıt, mobil menyu → arxa scroll kilidi).
   =================================================================== */
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis = null;
if (!REDUCED_MOTION && typeof window.Lenis === 'function') {
  lenis = new window.Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo ease-out
    smoothWheel: true,
  });
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

// F5-dən sonra da tam yuxarıda başla (Safari bəzən load-dan sonra köhnə mövqeyə sıçrayır)
window.addEventListener('load', () => {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = REDUCED_MOTION;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motion = !prefersReduced;

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  /* Bölmə id-si → tab başlığında görünəcək təmiz ad.
     "html", fayl adı və ya texniki heç nə YOXDUR — yalnız insan-oxunaqlı ad. */
  const SECTION_TITLES = {
    hero:     'Saytlab',
    services: 'Xidmət — Saytlab',
    about:    'Haqqımızda — Saytlab',
    benefits: 'Üstünlüklər — Saytlab',
    pricing:  'Qiymətlər — Saytlab',
    faq:      'Suallar — Saytlab',
    contact:  'Əlaqə — Saytlab',
  };
  const DEFAULT_TITLE = 'Saytlab';

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
  let lastScrollY = scrollY;
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
     4b. Hero mouse-glow — dairəvi işıq, YALNIZ hero daxilində, fine pointer-də.
         Sabit ölçü/blur/rəng, yalnız transform (translate3d) rAF-də yenilənir.
     =================================================================== */
  const heroSection = $('#hero');
  const heroGlow = $('[data-hero-glow]');
  const glow = (heroSection && heroGlow && finePointer && motion)
    ? { el: heroGlow, rect: null, active: false, x: 0, y: 0 }
    : null;
  if (glow) {
    heroSection.addEventListener('mouseenter', () => {
      glow.rect = heroSection.getBoundingClientRect();
      glow.active = true;
      glow.el.classList.add('is-active');
    });
    heroSection.addEventListener('mousemove', (e) => {
      if (!glow.rect) glow.rect = heroSection.getBoundingClientRect();
      glow.x = e.clientX - glow.rect.left;
      glow.y = e.clientY - glow.rect.top;
    });
    heroSection.addEventListener('mouseleave', () => {
      glow.active = false;
      glow.el.classList.remove('is-active');
    });
  }

  /* ===================================================================
     5. Proqres zolağı + header vəziyyəti
     =================================================================== */
  const progress = $('#scrollProgress');
  const header = $('.site-header');
  const HEADER_HIDE_AFTER = 120; // bu həddən əvvəl header həmişə görünür (yuxarıda gizlənmə olmasın)

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

    // --- hero mouse-glow (yalnız aktiv olanda) ---
    if (glow && glow.active) {
      glow.el.style.transform = `translate3d(${glow.x.toFixed(1)}px, ${glow.y.toFixed(1)}px, 0)`;
    }

    // --- scroll-driven (yalnız dəyişəndə) ---
    if (scrollDirty) {
      scrollDirty = false;
      const ratio = clamp(scrollY / docMax, 0, 1);
      progress.style.transform = `scaleX(${ratio.toFixed(4)})`;
      header.classList.toggle('is-scrolled', scrollY > 24);

      // Header: aşağı scroll → gizlən, yuxarı scroll (və ya başa yaxın) → görün.
      // Kiçik "jitter" (trackpad, mobil bounce) yanlış tetiklənməsin deyə min. fərq şərti qoyulub.
      const delta = scrollY - lastScrollY;
      if (scrollY <= HEADER_HIDE_AFTER) {
        header.classList.remove('is-hidden');
      } else if (delta > 4) {
        header.classList.add('is-hidden');
      } else if (delta < -4) {
        header.classList.remove('is-hidden');
      }
      lastScrollY = scrollY;

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
     7. Scroll-reveal — TƏKRARLANAN (Framer saytlarındakı kimi).
        Element hər dəfə view-port-a girəndə animasiya olur; çıxanda
        gizli başlanğıc vəziyyətinə (`.js-reveal .reveal` — transform/opacity/blur)
        qayıdır. Yuxarı scroll da daxil — məhdudiyyət yoxdur, unobserve YOXDUR.
        QEYD: sayğaclar (`[data-count]`) AYRI observer-dədir (aşağıda, bir dəfəlik).
     =================================================================== */
  const revealEls = $$('.reveal');
  // stagger indeksi bir dəfə hesablanır (eyni valideyn altında sıra nömrəsi)
  revealEls.forEach(el => {
    const sibs = $$('.reveal', el.parentElement);
    el.dataset.revealI = String(Math.max(0, sibs.indexOf(el)));
  });
  // keçid bitəndə GPU qatını burax (will-change yalnız animasiya müddətində qalır)
  const releaseWillChange = (el) => {
    el.addEventListener('transitionend', function h(e) {
      if (e.target !== el) return;
      el.style.willChange = '';
      el.removeEventListener('transitionend', h);
    });
  };
  const revealIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      el.style.willChange = 'transform, opacity, filter';
      if (entry.isIntersecting) {
        el.style.transitionDelay = (+el.dataset.revealI * 55) + 'ms';   // qısa stagger (giriş)
        el.setAttribute('data-visible', '');
      } else {
        el.style.transitionDelay = '0ms';                                // çıxış — gecikməsiz
        el.removeAttribute('data-visible');                              // gizli vəziyyətə qayıt
      }
      releaseWillChange(el);
    }
    // threshold/rootMargin dəyişdirilmədi — yalnız "bir dəfəlik" məntiq "təkrarlanan"a çevrildi.
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

  revealEls.forEach(el => revealIO.observe(el));

  /* ===================================================================
     7b. Tab başlığı — scroll ilə hansı bölmədə olduğunu göstərir.
         Səhifənin ÖZÜ dəyişmir, YALNIZ brauzer tabındakı yazı yenilənir.
         DOM-a yazı yalnız kəsişmə dəyişəndə olur (hər frame-də yox) — rAF strukturuna toxunmur.
     =================================================================== */
  const titleSections = Object.keys(SECTION_TITLES)
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (titleSections.length) {
    let currentTitleId = null;
    const titleIO = new IntersectionObserver((entries) => {
      // Ekranda görünən bölmələr arasından ən çox görünəni (ratio ən böyük) seç.
      let best = null;
      for (const entry of entries) {
        if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
          best = entry;
        }
      }
      if (best && best.target.id !== currentTitleId) {
        currentTitleId = best.target.id;
        document.title = SECTION_TITLES[currentTitleId] || DEFAULT_TITLE;
      }
    }, { threshold: [0.35, 0.5, 0.65] });   // bölmənin ~35–65%-i görünəndə tetiklənir
    titleSections.forEach(el => titleIO.observe(el));
  }

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
    if (lenis) { open ? lenis.stop() : lenis.start(); }   // arxa fon scroll-unu kilidlə/aç
  };
  menuToggle.addEventListener('click', () => setMenu(!overlay.classList.contains('is-open')));
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ===================================================================
     10b. Loqo klikləndə səhifə HƏMİŞƏ tam yuxarıya qayıtsın.
          #top header elementindədir, amma URL-də artıq "#top" varsa brauzer
          təkrar scroll etmir — ona görə açıq handler yazılır. Mobil menyu
          açıqdırsa bağlanır. prefers-reduced-motion-da ani, əks halda smooth.
     =================================================================== */
  $$('a.logo').forEach(logoLink => {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      setMenu(false);
      if (lenis) lenis.scrollTo(0, { duration: 1.1 });
      else window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', location.pathname + location.search);
    });
  });

  /* ===================================================================
     10b2. Daxili çapa (#) linkləri — Lenis aktivdirsə onun smooth scrollTo-su
           ilə (native "auto" jump əvəzinə). Header hündürlüyü qədər offset.
           Loqo (.logo) istisnadır — öz handler-i var.
     =================================================================== */
  $$('a[href^="#"]:not(.logo)').forEach(link => {
    const hash = link.getAttribute('href');
    if (!hash || hash.length < 2) return;
    link.addEventListener('click', (e) => {
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      if (lenis) lenis.scrollTo(target, { offset: -78, duration: 1.1 });
      else target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', hash);
    });
  });

  /* ===================================================================
     10c. Ayrı səhifələrə (Qaydalar / Məxfilik) keçiddə sürətli fade-out,
          sonra yönləndir — belə ki keçid hər iki tərəfdən hamar görünsün.
          (privacy.html / terms.html öz daxili script-i ilə fade-in edir.)
     =================================================================== */
  $$('a[href="/terms"], a[href="/privacy"]').forEach(link => {
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || link.target === '_blank') return;
      e.preventDefault();
      const url = link.href;
      if (prefersReduced) { window.location.href = url; return; }
      setMenu(false);
      document.body.classList.add('is-leaving');
      setTimeout(() => { window.location.href = url; }, 190);
    });
  });

  /* ===================================================================
     11. FAQ accordion — bir anda yalnız biri açıq (grid-template-rows)
     =================================================================== */
  $$('.faq-item').forEach(item => {
    $('.faq-q', item).addEventListener('click', () => {
      const open = item.classList.contains('is-open');
      $$('.faq-item').forEach(i => i.classList.remove('is-open'));
      if (!open) item.classList.add('is-open');
    });
  });

  /* ===================================================================
     12. Pricing "Sifariş et" — hər kart üçün plan adı + qiymətlə əvvəlcədən
         doldurulmuş WhatsApp mesajı qurulur. HTML-dəki href yalnız fallback.
     =================================================================== */
  const WA_NUMBER = '994103136941';
  $$('.price-card').forEach(card => {
    const link = $('a[data-order]', card);
    if (!link) return;
    const plan = ($('h3', card)?.textContent || '').trim();
    const price = ($('.price-tag strong', card)?.textContent || '').trim();
    if (!plan || !price) return;
    const msg = `Salam, ${plan} planını (₼${price}) sifariş etmək istəyirəm.`;
    link.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  });

});
