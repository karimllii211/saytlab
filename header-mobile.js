/* Saytlab — mobil header davranışı (bütün səhifələrdə işləyir).
   İki iş görür:
     1) "Başlığı bağla" (×) düyməsi — istifadəçi klikləyəndə header
        .is-manually-closed alır və scroll-dan asılı olmayaraq gizlənir.
        Səhifənin başına qayıdanda (scrollY <= 24) sinif özü silinir ki,
        istifadəçi həmişəlik header-siz qalmasın. Səhifə dəyişəndə də sıfırlanır,
        çünki sinif DOM-da saxlanılmır.
     2) .is-scrolled sinfi — index.html-də bunu script.js edir, digər səhifələrdə
        (templates, terms, privacy) script.js yoxdur, ona görə burada da toggle
        olunur. Eyni şərt olduğu üçün script.js ilə toqquşmur.
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
})();
