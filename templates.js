/* Saytlab — şablon vitrini (templates.html).
   Üç iş görür:
     1) Kateqoriya akkordeonu — başlığa klik açır/bağlayır (aria-expanded + [hidden]).
     2) Şəkillər yalnız kateqoriya ilk dəfə açılanda yüklənir (img[data-src] → src),
        yəni ilk yükləmədə 67 şəkil üçün heç bir sorğu getmir.
     3) Canlı axtarış — şablon adı, dizayner və kateqoriya açar sözlərinə görə filtr;
        uyğun kart olan kateqoriya avtomatik açılır.
   CSP: inline script yoxdur — bu fayl <script defer> ilə qoşulur. */
(function () {
  var root = document.getElementById('templateCategories');
  if (!root) return;

  var search = document.getElementById('templateSearch');
  var empty = document.getElementById('templateEmpty');
  var categories = [].slice.call(root.querySelectorAll('.template-category'));

  /* Azərbaycan hərflərini sadələşdirir ki, "kafe" ilə "kafé", "tehsil" ilə "təhsil" tapılsın. */
  var MAP = { 'ə': 'e', 'ı': 'i', 'ö': 'o', 'ü': 'u', 'ğ': 'g', 'ş': 's', 'ç': 'c', 'é': 'e', 'ä': 'a', 'ő': 'o' };
  function norm(str) {
    return (str || '').toLowerCase().replace(/[əıöüğşçéäő]/g, function (c) { return MAP[c]; });
  }

  function loadImages(grid) {
    var imgs = grid.querySelectorAll('img[data-src]');
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].src = imgs[i].getAttribute('data-src');
      imgs[i].removeAttribute('data-src');
    }
  }

  function setOpen(cat, open) {
    var toggle = cat.querySelector('.template-category-toggle');
    var grid = cat.querySelector('.template-grid');
    if (!toggle || !grid) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    grid.hidden = !open;
    if (open) loadImages(grid);
  }

  /* 1 + 2 — akkordeon */
  categories.forEach(function (cat) {
    var toggle = cat.querySelector('.template-category-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      setOpen(cat, toggle.getAttribute('aria-expanded') !== 'true');
    });
  });

  /* 3 — axtarış */
  if (!search) return;

  var cards = [].slice.call(root.querySelectorAll('.template-card')).map(function (card) {
    return {
      el: card,
      cat: card.closest('.template-category'),
      hay: norm(card.getAttribute('data-name') + ' ' + (card.getAttribute('data-keywords') || ''))
    };
  });

  function applyFilter() {
    var q = norm(search.value).trim();

    if (!q) {                                   /* boş sorğu → başlanğıc vəziyyət */
      cards.forEach(function (c) { c.el.hidden = false; });
      categories.forEach(function (cat) {
        cat.hidden = false;
        setOpen(cat, false);
        var count = cat.querySelector('.template-count');
        if (count) count.textContent = count.getAttribute('data-total');
      });
      if (empty) empty.hidden = true;
      return;
    }

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
      var count = cat.querySelector('.template-count');
      if (count && hits) count.textContent = hits + ' nəticə';
      if (hits) setOpen(cat, true);
    });

    if (empty) empty.hidden = found !== 0;
  }

  search.addEventListener('input', applyFilter);
})();
