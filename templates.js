/* Saytlab — şablon vitrini (templates.html), 200 kart.
   Dörd iş görür:
     1) Kateqoriya akkordeonu — başlığa klik açır/bağlayır (aria-expanded + [hidden]).
     2) Şəkil lazy-load — IntersectionObserver (rootMargin 200px) yalnız görünüş
        sahəsinə yaxınlaşan kartın şəklini yükləyir (img[data-src] → src), yüklənəndə
        .loaded ilə fade-in. İlk yükləmədə heç bir şəkil sorğusu getmir.
     3) "Daha çox göstər" — hər kateqoriyada ilk 20 kart görünür, qalanları
        [data-extra] ilə gizlidir; düymə onları açır və observer-ə qeyd edir.
     4) Canlı axtarış — ad, dizayner və kateqoriya açar sözlərinə görə filtr;
        axtarış zamanı gizli (pagination) kartlar da nəzərə alınır, uyğun kateqoriya
        avtomatik açılır, nəticə yoxdursa mesaj görünür, sahə boşalanda hər şey
        başlanğıc vəziyyətinə (bağlı akkordeon + sıfırlanmış pagination) qayıdır.
   CSP: inline script yoxdur — bu fayl <script defer> ilə qoşulur. */
(function () {
  var root = document.getElementById('templateCategories');
  if (!root) return;

  var search = document.getElementById('templateSearch');
  var noResults = document.querySelector('.template-no-results');
  var categories = [].slice.call(root.querySelectorAll('.template-category'));

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
  }, { rootMargin: '200px 0px' }) : null;

  function observe(scope) {
    var imgs = scope.querySelectorAll('img[data-src]');
    for (var i = 0; i < imgs.length; i++) {
      if (io) io.observe(imgs[i]);
      else {                                   /* IO dəstəklənmirsə sadəcə yüklə */
        imgs[i].src = imgs[i].getAttribute('data-src');
        imgs[i].removeAttribute('data-src');
        markLoaded(imgs[i]);
      }
    }
  }

  /* ---- 1. akkordeon ---- */
  function setOpen(cat, open) {
    var toggle = cat.querySelector('.template-category-toggle');
    var grid = cat.querySelector('.template-grid');
    if (!toggle || !grid) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    grid.hidden = !open;
    var more = cat.querySelector('.template-load-more');
    if (more && more.dataset.available === 'true') more.hidden = !open || grid.classList.contains('show-extra');
    if (open) observe(grid);
  }

  categories.forEach(function (cat) {
    var toggle = cat.querySelector('.template-category-toggle');
    var more = cat.querySelector('.template-load-more');
    if (more) more.dataset.available = 'true';
    if (toggle) {
      toggle.addEventListener('click', function () {
        setOpen(cat, toggle.getAttribute('aria-expanded') !== 'true');
      });
    }
    /* ---- 3. daha çox göstər ---- */
    if (more) {
      more.addEventListener('click', function () {
        var grid = cat.querySelector('.template-grid');
        grid.classList.add('show-extra');
        more.hidden = true;
        observe(grid);
      });
    }
  });

  /* ---- 4. axtarış ---- */
  if (!search) return;

  var MAP = { 'ə': 'e', 'ı': 'i', 'ö': 'o', 'ü': 'u', 'ğ': 'g', 'ş': 's', 'ç': 'c', 'é': 'e', 'ä': 'a', 'ø': 'o', 'ć': 'c' };
  function norm(str) {
    return (str || '').toLowerCase().replace(/[əıöüğşçéäøć]/g, function (c) { return MAP[c]; });
  }

  var cards = [].slice.call(root.querySelectorAll('.template-card')).map(function (card) {
    return {
      el: card,
      cat: card.closest('.template-category'),
      hay: norm(card.getAttribute('data-name') + ' ' + (card.getAttribute('data-keywords') || ''))
    };
  });

  function reset() {
    cards.forEach(function (c) { c.el.hidden = false; });
    categories.forEach(function (cat) {
      cat.hidden = false;
      cat.querySelector('.template-grid').classList.remove('show-extra');
      var more = cat.querySelector('.template-load-more');
      if (more && more.dataset.available === 'true') more.hidden = true;
      setOpen(cat, false);
      var count = cat.querySelector('.template-count');
      if (count) count.textContent = count.getAttribute('data-total');
    });
    if (noResults) noResults.classList.remove('visible');
  }

  function applyFilter() {
    var q = norm(search.value).trim();
    if (!q) { reset(); return; }

    var found = 0;
    categories.forEach(function (cat) { cat.dataset.hits = '0'; });

    cards.forEach(function (c) {
      var hit = c.hay.indexOf(q) !== -1;
      c.el.hidden = !hit;
      if (hit) {
        found++;
        c.cat.dataset.hits = String(Number(c.cat.dataset.hits) + 1);
      }
    });

    categories.forEach(function (cat) {
      var hits = Number(cat.dataset.hits);
      cat.hidden = hits === 0;
      if (!hits) return;
      /* pagination-la gizlədilmiş kartlar da nəticəyə daxil olsun */
      cat.querySelector('.template-grid').classList.add('show-extra');
      var more = cat.querySelector('.template-load-more');
      if (more) more.hidden = true;
      var count = cat.querySelector('.template-count');
      if (count) count.textContent = hits + ' nəticə';
      setOpen(cat, true);
    });

    if (noResults) noResults.classList.toggle('visible', found === 0);
  }

  search.addEventListener('input', applyFilter);
})();
