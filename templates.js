/* Saytlab — şablon vitrini (templates.html), 200 kart, sidebar filtr modeli.
   Üç iş görür:
     1) Kateqoriya filtri — sidebar düymələri kartları data-category üzrə süzür,
        "Hamısı" hamısını qaytarır.
     2) Şəkil lazy-load — IntersectionObserver (rootMargin 300px). Bütün şəkillər
        açılışda observer-ə yazılır; filtrlə gizlədilən kart display:none olduğu
        üçün kəsişmir, görünən kimi avtomatik yüklənir. loading="lazy" ilə yanaşı
        data-src → src keçidi prefetch-in də qarşısını alır.
     3) Canlı axtarış — ad, dizayner və Azərbaycan dilində sahə açar sözləri üzrə
        (məs. "təsərrüfat", "əmlak", "hüquq"); axtarış başlayanda aktiv filtr
        "Hamısı"na keçir, sahə boşalanda hər şey qayıdır.
   Filtr/axtarış keçidi animasiyalıdır: gedən kartlar .is-leaving ilə sönür,
   transition bitəndən sonra .is-hidden (display: none) alır; gələnlər əks sıra
   ilə. prefers-reduced-motion: reduce halında keçid dərhal tətbiq olunur.
   CSP: inline script yoxdur — bu fayl <script defer> ilə qoşulur. */
(function () {
  var grid = document.getElementById('templateGrid');
  if (!grid) return;

  var cardsEls = [].slice.call(grid.querySelectorAll('.template-card'));
  var buttons = [].slice.call(document.querySelectorAll('.template-filter-btn'));
  var search = document.getElementById('templateSearch');
  var noResults = document.querySelector('.template-no-results');

  var DURATION = 240;                       /* CSS-dəki opacity keçidindən bir az uzun */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  [].slice.call(grid.querySelectorAll('img[data-src]')).forEach(function (img) {
    if (io) io.observe(img);
    else {                                     /* IO dəstəklənmirsə sadəcə yüklə */
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
      markLoaded(img);
    }
  });

  /* ---- ortaq: animasiyalı göstər/gizlət ---- */
  var timer = null;

  function isOut(card) {
    return card.classList.contains('is-hidden') || card.classList.contains('is-leaving');
  }

  function render(match) {
    if (timer) { clearTimeout(timer); timer = null; }

    var toShow = [], toHide = [], found = 0;
    cardsEls.forEach(function (card, i) {
      var hit = match(card, i);
      if (hit) found++;
      var out = isOut(card);
      if (hit && out) toShow.push(card);
      else if (!hit && !out) toHide.push(card);
    });

    if (noResults) noResults.classList.toggle('visible', found === 0);

    if (reduced) {
      toHide.forEach(function (c) { c.classList.remove('is-leaving'); c.classList.add('is-hidden'); });
      toShow.forEach(function (c) { c.classList.remove('is-leaving', 'is-hidden'); });
      return;
    }

    /* gedənlər: əvvəlcə sönsün, sonra layout-dan çıxsın */
    toHide.forEach(function (c) { c.classList.add('is-leaving'); });
    if (toHide.length) {
      timer = setTimeout(function () {
        timer = null;
        toHide.forEach(function (c) { c.classList.add('is-hidden'); c.classList.remove('is-leaving'); });
      }, DURATION);
    }

    /* gələnlər: əvvəlcə layout-a qayıtsın (sönük halda), sonra açılsın.
       Başlanğıc vəziyyət məcburi reflow ilə tətbiq olunur — rAF-dan asılı deyil,
       yəni fon tabında da kartlar "sönük" qalıb ilişib qalmır. */
    toShow.forEach(function (c) { c.classList.add('is-leaving'); c.classList.remove('is-hidden'); });
    if (toShow.length) {
      void grid.offsetHeight;
      toShow.forEach(function (c) { c.classList.remove('is-leaving'); });
    }
  }

  function setActive(btn) {
    buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
  }

  /* ---- 1. kateqoriya filtri ---- */
  function applyCategory(value) {
    render(function (card) {
      return value === 'all' || card.getAttribute('data-category') === value;
    });
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
    render(function (card, i) { return haystacks[i].indexOf(q) !== -1; });
  });
})();
