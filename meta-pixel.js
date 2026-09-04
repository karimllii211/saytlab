/* Meta (Facebook) Pixel — bütün səhifələrdə PageView izləməsi.
   Meta-nın standart snippet-i; CSP-ni sərt saxlamaq üçün (script-src 'unsafe-inline'
   OLMASIN) ayrıca fayldadır. Pixel ID: 4331233943803470

   FƏRQ (performans): fbevents.js ~406 KB-dır və özündən sonra daha ~320 KB config
   çəkir. Əvvəl bu, səhifə ilə eyni anda yüklənirdi və ilk render üçün lazım olan
   şəbəkə/CPU-nu yeyirdi (xüsusilə Safari-də, JS parse/exec daha bahalıdır).
   İndi fbq() dərhal təyin olunur və çağırışlar növbəyə (n.queue) yığılır — heç bir
   hadisə itmir — kitabxananın özü isə yalnız `load`-dan sonra, boş vaxtda (və ya
   istifadəçi ilk dəfə toxunanda/klikləyəndə, hansı əvvəl olsa) yüklənir. Kitabxana
   qalxan kimi növbədəki init + PageView avtomatik göndərilir. */
!function (f, b, e, v) {
  if (f.fbq) return;
  var n = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];

  var injected = false;
  function inject() {
    if (injected) return;
    injected = true;
    var t = b.createElement(e); t.async = !0; t.src = v;
    var s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }

  function schedule() {
    if (f.requestIdleCallback) f.requestIdleCallback(inject, { timeout: 2500 });
    else setTimeout(inject, 1200);
  }

  if (b.readyState === 'complete') schedule();
  else f.addEventListener('load', schedule, { once: true });

  /* İstifadəçi tez qarşılıqlı əlaqəyə girsə (və ya tabı dəyişsə) gözləmə —
     pixel dərhal qalxsın ki, hadisə itməsin. */
  ['pointerdown', 'keydown', 'touchstart', 'visibilitychange'].forEach(function (ev) {
    f.addEventListener(ev, inject, { once: true, passive: true });
  });
}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', '4331233943803470');
fbq('track', 'PageView');
