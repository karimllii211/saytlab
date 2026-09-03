/* Saytlab — hüquqi səhifələr (terms.html, privacy.html) üçün <head> boot skripti.
   Əvvəllər inline idi; CSP-ni sərtləşdirmək üçün ayrıca fayla çıxarıldı.
   <head>-də SİNXRON yüklənməlidir (defer/async YOX) — .js-reveal FOUC-suz. */
(function () {
  document.documentElement.classList.add('js-reveal');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Şrift stylesheet-i: media="print" → hazır olanda media="all" (inline onload əvəzi).
  function swapFontMedia() {
    var fontCss = document.getElementById('fontCss');
    if (!fontCss) return;
    if (fontCss.sheet) fontCss.media = 'all';
    else fontCss.addEventListener('load', function () { this.media = 'all'; }, { once: true });
  }

  addEventListener('pageshow', function (e) {
    if (e.persisted) document.body.classList.remove('is-leaving');
    document.body.classList.add('page-ready');
  });

  addEventListener('DOMContentLoaded', function () {
    swapFontMedia();
    var ready = function () { document.body.classList.add('page-ready'); };
    requestAnimationFrame(ready);
    setTimeout(ready, 60);

    // Daxili keçidlərdə yumşaq fade-out, sonra yönləndir.
    document.querySelectorAll('a[href]').forEach(function (a) {
      var raw = a.getAttribute('href');
      if (!raw || raw.charAt(0) === '#' || a.target === '_blank' || /^(https?:|mailto:|tel:)/i.test(raw)) return;
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        if (reduce) { window.location.href = a.href; return; }
        document.body.classList.add('is-leaving');
        setTimeout(function () { window.location.href = a.href; }, 190);
      });
    });
  });
})();
