/* Saytlab — şablon vitrini (templates.html), 200 kart, sidebar filtr modeli.
   Üç iş görür:
     1) Kateqoriya filtri — sidebar düymələri kartları data-category üzrə süzür
        (.is-hidden), "Hamısı" hamısını qaytarır.
     2) Şəkil lazy-load — IntersectionObserver (rootMargin 300px). Bütün şəkillər
        açılışda observer-ə yazılır; filtrlə gizlədilən kart display:none olduğu
        üçün kəsişmir, görünən kimi avtomatik yüklənir. loading="lazy" ilə yanaşı
        data-src → src keçidi prefetch-in də qarşısını alır.
     3) Canlı axtarış — ad, dizayner və kateqoriya açar sözləri üzrə; axtarış
        başlayanda aktiv filtr "Hamısı"na keçir, sahə boşalanda hər şey qayıdır.
   CSP: inline script yoxdur — bu fayl <script defer> ilə qoşulur. */
(function () {
  var grid = document.getElementById('templateGrid');
  if (!grid) return;

  var cardsEls = [].slice.call(grid.querySelectorAll('.template-card'));
  var buttons = [].slice.call(document.querySelectorAll('.template-filter-btn'));
  var search = document.getElementById('templateSearch');
  var noResults = document.querySelector('.template-no-results');

  /* ---- 2. şəkil observer ---- */
  function markLoaded(img) { img.classList.add('loaded'); }

  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var img = entry.target;
      io.unobserve(img);
      var src = img.getAttribute('data-src');
      if (!src) return;
      img.removeAttribute('data-src');
      img.addEventListener('load', function () { markLoaded(img); });
      img.addEventListener('error', function () { markLoaded(img); });
      img.src = src;
      if (img.complete && img.naturalWidth > 0) markLoaded(img);   /* keşdən dərhal gəldi */
    });
  }, { rootMargin: '300px 0px' }) : null;

  var imgs = [].slice.call(grid.querySelectorAll('img[data-src]'));
  imgs.forEach(function (img) {
    if (io) io.observe(img);
    else {                                     /* IO dəstəklənmirsə sadəcə yüklə */
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
      markLoaded(img);
    }
  });

  /* ---- ortaq: nəticə sayı ---- */
  function updateEmptyState() {
    if (!noResults) return;
    var any = cardsEls.some(function (c) { return !c.classList.contains('is-hidden'); });
    noResults.classList.toggle('visible', !any);
  }

  function setActive(btn) {
    buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
  }

  /* ---- 1. kateqoriya filtri ---- */
  function applyCategory(value) {
    cardsEls.forEach(function (card) {
      var hit = value === 'all' || card.getAttribute('data-category') === value;
      card.classList.toggle('is-hidden', !hit);
    });
    updateEmptyState();
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setActive(btn);
      if (search) search.value = '';           /* filtr və axtarış bir-birini əvəz edir */
      applyCategory(btn.getAttribute('data-filter'));
    });
  });

  /* ---- 3. axtarış ---- */
  if (!search) return;

  var MAP = { 'ə': 'e', 'ı': 'i', 'ö': 'o', 'ü': 'u', 'ğ': 'g', 'ş': 's', 'ç': 'c', 'é': 'e', 'ä': 'a', 'ø': 'o', 'ć': 'c' };
  function norm(str) {
    return (str || '').toLowerCase().replace(/[əıöüğşçéäøć]/g, function (c) { return MAP[c]; });
  }

  var haystacks = cardsEls.map(function (card) {
    return norm(card.getAttribute('data-name') + ' ' + (card.getAttribute('data-keywords') || ''));
  });

  var allBtn = buttons.filter(function (b) { return b.getAttribute('data-filter') === 'all'; })[0];

  search.addEventListener('input', function () {
    var q = norm(search.value).trim();
    if (allBtn) setActive(allBtn);             /* axtarış bütün kateqoriyalarda gedir */

    if (!q) { applyCategory('all'); return; }

    cardsEls.forEach(function (card, i) {
      card.classList.toggle('is-hidden', haystacks[i].indexOf(q) === -1);
    });
    updateEmptyState();
  });
})();
