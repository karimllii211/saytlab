/* Saytlab — hüquqi səhifələrdə scroll-reveal (index.html-dəki .reveal sistemi ilə eyni).
   Bu səhifələr script.js-i yükləmir, ona görə kiçik müstəqil observer.
   Əvvəllər body sonunda inline idi; CSP üçün ayrıca fayla çıxarıldı.
   <body> sonunda yüklənir — parse demək olar ki bitib, plain <script> kifayətdir. */
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.setAttribute('data-visible', ''); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.setAttribute('data-visible', '');
      else entry.target.removeAttribute('data-visible');
    });
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  els.forEach(function (el, i) {
    el.style.transitionDelay = (i * 55) + 'ms';
    io.observe(el);
  });
})();
