/* Saytlab — mobil header + mobil menyu (BÜTÜN səhifələrdə işləyir:
   index.html, templates.html, terms.html, privacy.html, 404.html).

   Üç iş görür:
     1) "Başlığı bağla" (×) düyməsi — istifadəçi klikləyəndə header
        .is-manually-closed alır və scroll-dan asılı olmayaraq gizlənir.
        Səhifənin başına qayıdanda (scrollY <= 24) sinif özü silinir ki,
        istifadəçi həmişəlik header-siz qalmasın. Səhifə dəyişəndə də sıfırlanır,
        çünki sinif DOM-da saxlanılmır.
     2) .is-scrolled sinfi — header fonunun qatılaşması.
     3) Mobil menyu (#menuToggle + #mobileOverlay) — aç/bağla, Escape, fokus tələsi.
        ƏVVƏL bu məntiq script.js §10-da idi və YALNIZ index.html-də yüklənirdi;
        nəticədə telefonda /templates, /terms, /privacy səhifələrində naviqasiya
        ümumiyyətlə açıla bilmirdi (@media 960px .main-nav-ı gizlədir). İndi mərkəzi
        yer buradır — script.js oradakı dublikatı window.saytlabSetMenu üzərindən çağırır.
   Lenis yalnız index.html-də var: window.lenis mövcuddursa arxa scroll onunla kilidlənir,
   digər səhifələrdə document.body.style.overflow kifayətdir.
   CSP: inline script yoxdur — bu fayl <script defer> ilə qoşulur. */
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var closeBtn = document.getElementById('headerClose');
  var TOP_RESET = 24;                 /* bu qədər yuxarıda header özü qayıdır */

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      header.classList.add('is-manually-closed');
    });
  }

  /* İş yükü iki classList çağırışıdır — rAF-a ehtiyac yoxdur və fon tabında
     rAF işləmədiyi üçün "ticking" bayrağı ilişib qalma riski də olmur. */
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    header.classList.toggle('is-scrolled', y > TOP_RESET);
    if (y <= TOP_RESET) header.classList.remove('is-manually-closed');
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ===================================================================
     Mobil menyu — tam ekran "pərdə" overlay.
     =================================================================== */
  var toggle  = document.getElementById('menuToggle');
  var overlay = document.getElementById('mobileOverlay');
  if (!toggle || !overlay) return;

  var links = [].slice.call(overlay.querySelectorAll('a[href]'));

  function setMenu(open) {
    var wasOpen = overlay.classList.contains('is-open');
    overlay.classList.toggle('is-open', open);
    toggle.classList.toggle('is-active', open);
    toggle.setAttribute('aria-expanded', String(open));
    overlay.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    /* Arxa fon scroll kilidi — index.html-də Lenis, digər səhifələrdə native. */
    if (window.lenis && typeof window.lenis.stop === 'function') {
      if (open) window.lenis.stop(); else window.lenis.start();
    }
    /* Fokus idarəsi: açılanda ilk linkə, bağlananda geri düyməyə. */
    if (open && !wasOpen && links[0]) links[0].focus();
    if (!open && wasOpen && (overlay.contains(document.activeElement) || document.activeElement === document.body)) {
      toggle.focus();
    }
  }
  /* script.js (yalnız index.html) loqo kliki / çapa linkləri / səhifə keçidində
     menyunu bağlamaq üçün bunu çağırır — məntiq təkrarlanmır. */
  window.saytlabSetMenu = setMenu;

  toggle.addEventListener('click', function () {
    setMenu(!overlay.classList.contains('is-open'));
  });
  links.forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* Escape ilə bağlanma + Tab fokusunu overlay daxilində dövr etdirmə
     (açıq menyunun arxasındakı görünməyən elementlərə düşməmək üçün). */
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setMenu(false); return; }
    if (e.key !== 'Tab' || !links.length) return;
    var first = links[0], last = links[links.length - 1];
    if (!overlay.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
