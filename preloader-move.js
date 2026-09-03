/* #preloader-i <body>-dən çıxarıb birbaşa <html>-ə köçür.
   Səbəb: .js-reveal body { opacity: 0 } (page-ready gələnə qədər) body daxilindəki
   HƏR ŞEYİ — bu overlay-i də — render səviyyəsində gizlədir; page-ready isə məhz
   preloader animasiyası bitəndə tetiklənir → dövri blokaj ("boş yaşıl ekran").
   <body>-dən kənarda preloader body-nin opacity-sindən asılı olmur.
   Bu skript #preloader div-indən dərhal sonra, SİNXRON (paint-dən əvvəl) yüklənir. */
(function () {
  var p = document.getElementById('preloader');
  if (p && p.parentNode === document.body) document.documentElement.appendChild(p);
})();
