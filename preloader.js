/* Saytlab — preloader / səhifə fade-in tetikləyicisi.
   Əvvəllər index.html-in <head>-ində inline idi; CSP-ni sərtləşdirmək
   (script-src 'unsafe-inline' olmasın) üçün ayrıca fayla çıxarıldı.
   <head>-də SİNXRON yüklənməlidir (defer/async YOX) ki, .js-reveal sinfi
   body render olunmadan əlavə olunsun — FOUC-suz. */
(function () {
  document.documentElement.classList.add('js-reveal');

  /* Şrift stylesheet-i: media="print" ilə render-blok etmədən yüklənir, hazır olanda
     media="all"-a keçir (əvvəlki inline onload="this.media='all'" əvəzi). Bu skript
     <head>-in başında işlədiyi üçün #fontCss hələ parse olunmamış ola bilər — ona görə
     DOM hazır olanda yoxlanılır. display=swap sayəsində görünməz-mətn fazası onsuz da yoxdur. */
  function swapFontMedia() {
    var fontCss = document.getElementById('fontCss');
    if (!fontCss) return;
    if (fontCss.sheet) fontCss.media = 'all';
    else fontCss.addEventListener('load', function () { this.media = 'all'; }, { once: true });
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', swapFontMedia);
  else swapFontMedia();

  /* Giriş preloader-i. page-ready YALNIZ preloader animasiyası bitəndə əlavə
     olunur (dismissPreloader) — hero-nun fade-in-i preloader sönən an başlayır. */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    document.body.classList.add('page-ready');
    // Hero giriş animasiyasını məhz indi başlat (script.js onu window-a təyin edir).
    if (typeof window.__saytlabPlayHeroReveal === 'function') {
      window.__saytlabPlayHeroReveal();
    } else {
      var heroTries = 0;
      var heroWait = setInterval(function () {
        heroTries++;
        if (typeof window.__saytlabPlayHeroReveal === 'function') {
          window.__saytlabPlayHeroReveal();
          clearInterval(heroWait);
        } else if (heroTries > 40) {
          clearInterval(heroWait);
        }
      }, 50);
    }
  }
  function dismissPreloader(fast) {
    var pre = document.getElementById('preloader');
    if (pre) {
      pre.classList.add('is-done');
      setTimeout(function () { if (pre.parentNode) pre.remove(); }, fast ? 250 : 600);
    }
    reveal();
  }
  function startPreloader() {
    var pre = document.getElementById('preloader');
    if (!pre) { reveal(); return; }
    if (reduceMotion) { setTimeout(function () { dismissPreloader(true); }, 350); return; }
    setTimeout(function () { pre.classList.add('is-breaking'); }, 780);
    setTimeout(function () { dismissPreloader(false); }, 1320);
  }

  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', startPreloader);
  else startPreloader();

  // Təhlükəsizlik klapanı: nə olursa olsun sayt görünsün.
  setTimeout(function () { dismissPreloader(true); }, 4000);

  addEventListener('pageshow', function (e) {
    // brauzer "geri" düyməsi (bfcache) — preloader-i təkrar oynatma, birbaşa aç.
    if (e.persisted) {
      document.body.classList.remove('is-leaving');
      var pre = document.getElementById('preloader');
      if (pre && pre.parentNode) pre.remove();
      document.body.classList.add('page-ready');
    }
  });
})();
