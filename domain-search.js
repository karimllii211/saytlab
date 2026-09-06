/* =========================================================================
   SAYTLAB — domain-search.js
   "Domen axtar" bölməsi (#domain): istifadəçi domen adı + uzantı seçir,
   sistem domenin SƏRBƏST olub-olmadığını göstərir və WhatsApp-a yönləndirir.

   VACİB — NƏ EDİR, NƏ ETMİR:
   • Bu vasitə YALNIZ MÖVCUDLUĞU (tutulub / tutulmayıb) göstərir.
   • QİYMƏT GÖSTƏRMİR və qiymətə istinad etmir — qiymət WhatsApp-da danışılır.
   • Backend/server YOXDUR: sorğu birbaşa brauzerdən (client-side) gedir.

   PROVAYDER HAQQINDA (gələcəkdə dəyişdirmək lazım olarsa oxu):
   • İstifadə olunan servis — domainee.dev (pulsuz, API açarı tələb etmir,
     CORS açıqdır). Bu RƏSMİ və ya ZƏMANƏTLİ bir provayder DEYİL:
     "best-effort" ictimai servisdir, uptime zəmanəti yoxdur və limiti var
     (təxminən IP başına 30 sorğu/dəqiqə, 500/gün).
   • Buna görə FALLBACK MÜTLƏQDİR: servis cavab verməsə, limit dolsa və ya
     nəticə qeyri-müəyyən olsa, istifadəçiyə xəta göstərilmir — birbaşa
     WhatsApp-a yönləndirilir.
   • Provayderi əvəz etmək üçün yalnız aşağıdakı PROVIDER obyektini dəyişmək
     kifayətdir (URL + parse məntiqi bir yerdədir, kodun içinə səpilməyib).
   ========================================================================= */

(() => {
  'use strict';

  /* ---------- 1. Provayder (tək dəyişdirmə nöqtəsi) ---------- */
  const PROVIDER = {
    /* GET https://api.domainee.dev/v1/tools/domain-availability-checker?name=<ad>&tlds=<uzanti>
       Cavab: { ok: true, data: { name, results: [ { tld, fqdn, available, method, registrarHint } ] } }
       `available`: true = sərbəst, false = tutulub, null = müəyyən edilə bilmədi. */
    endpoint: 'https://api.domainee.dev/v1/tools/domain-availability-checker',

    buildUrl(label, tld) {
      const q = new URLSearchParams({ name: label, tlds: tld });
      return `${this.endpoint}?${q.toString()}`;
    },

    /* Cavabı bizim üç vəziyyətə çevirir: true / false / null (bilinmir). */
    parse(json, fqdn) {
      if (!json || json.ok !== true || !json.data || !Array.isArray(json.data.results)) return null;
      const row = json.data.results.find(r => String(r.fqdn).toLowerCase() === fqdn) || json.data.results[0];
      if (!row) return null;
      return typeof row.available === 'boolean' ? row.available : null;
    },
  };

  /* Avtomatik yoxlanmayan uzantılar: .az üçün pulsuz/açarsız RDAP və ya
     CORS-a icazə verən WHOIS servisi yoxdur (AZNIC açıq API vermir).
     Ona görə .az seçiləndə heç bir sorğu getmir — birbaşa WhatsApp. */
  const MANUAL_TLDS = ['.az'];

  /* ===================================================================
     TIMEOUT — NİYƏ TLD-YƏ GÖRƏ FƏRQLİDİR

     ARXA PLAN: domen mövcudluğu son nəticədə hər uzantının öz registrisindən
     soruşulur və cavab sürətini BİZ deyil, həmin registri müəyyən edir.
     ICANN ölçmələrinə görə (OCTO-024) gTLD registriləri orta ~0.77 san,
     ccTLD registriləri isə orta ~1.5+ san cavab verir. Bu səbəbdən .io/.co
     kimi ccTLD-lərə daha geniş vaxt ayırırıq.

     ⚠ ÖLÇÜLMÜŞ REALLIQ (2026-09, bu rəqəmləri dəyişməzdən əvvəl OXU):
     Biz registriyə BİRBAŞA getmirik — arada domainee.dev vasitəçisi var və
     onun ÖZ daxili limiti təxminən 8.3–8.5 san-dır. Yəni:
       • Uğurlu cavab adətən ~0.5–1.2 san gəlir.
       • Uğursuz halda vasitəçi ~8.4 san-də HTTP 200 + `available: null`
         qaytarır (bizim timeout işə düşmür, sorğu kəsilmir).
       • 12 ölçmədə ən uzun cavab 8460 ms olub — yəni PRAKTİKADA nə 10 san,
         nə də 16 san həddi işə düşmür; onlar yalnız TƏHLÜKƏSİZLİK PAYIDIR.
     Nəticə: aşağıdakı rəqəmləri artırmaq mövcud vasitəçi ilə uğursuzluq
     faizini AZALTMIR — vasitəçi onsuz da bizdən əvvəl əl çəkir. Bu hədlər
     provayder dəyişdirildikdə (birbaşa RDAP və ya başqa servis) məna kəsb
     edəcək; həqiqi yaxşılaşma üçün ya nəticəsiz cavabda təkrar sorğu, ya da
     ikinci provayder lazımdır — ikisi də ayrıca qərar tələb edir.

     Qeyd: .io və .co üçün vasitəçi RDAP yox, DNS delegasiya yoxlaması edir
     (".io publishes no RDAP service" — cavabdakı registrarHint), ona görə
     onlarda RDAP gecikməsi arqumenti birbaşa tətbiq olunmur.

     .az bu məntiqə daxil deyil — o, MANUAL_TLDS-dədir, sorğu heç getmir.
     =================================================================== */
  const SLOW_TLDS = ['.io', '.co'];

  const TIMEOUT_MS      = 10000;   // gTLD — .com .net .org .info
  const TIMEOUT_SLOW_MS = 16000;   // ccTLD — .io .co

  /* Təkrar cəhd YALNIZ sorğu TEZ uğursuz olanda edilir (şəbəkə kəsintisi,
     429 limit, CSP blok — bunlar dərhal qayıdır). Əgər sorğu artıq uzun
     müddət yeyibsə, ikinci cəhd gözləməni ikiqat artırardı — bu, istifadəçi
     üçün fallback mesajından daha pisdir, ona görə birbaşa fallback göstəririk.
     Yavaş TLD-lərdə ümumi timeout böyüdüyü üçün bu hədd də mütənasib böyüyür.
     (Qeyd: vasitəçinin ~8.4 san-lik cavabı hər iki həddi keçdiyinə görə
     tipik uğursuzluqda retry İŞƏ DÜŞMÜR — retry əsasən şəbəkə/limit
     xətaları üçündür.) */
  const RETRY_IF_FAILED_WITHIN_MS      = 3000;   // gTLD
  const RETRY_IF_FAILED_WITHIN_SLOW_MS = 5000;   // ccTLD
  const RETRY_DELAY_MS = 400;

  const isSlowTld       = (tld) => SLOW_TLDS.includes(tld);
  const timeoutFor      = (tld) => (isSlowTld(tld) ? TIMEOUT_SLOW_MS : TIMEOUT_MS);
  const retryWindowFor  = (tld) => (isSlowTld(tld) ? RETRY_IF_FAILED_WITHIN_SLOW_MS : RETRY_IF_FAILED_WITHIN_MS);

  /* ---------- 2. DOM ---------- */
  const section = document.getElementById('domain');
  if (!section) return;

  const form       = document.getElementById('domainForm');
  const input      = document.getElementById('domainInput');
  const submitBtn  = document.getElementById('domainSubmit');
  const suffixEl   = document.getElementById('domainSuffix');
  const resultEl   = document.getElementById('domainResult');
  const tldButtons = Array.from(section.querySelectorAll('.domain-tld'));
  if (!form || !input || !resultEl || !tldButtons.length) return;

  let activeTld = tldButtons.find(b => b.classList.contains('is-active'))?.dataset.tld || '.com';
  let busy = false;
  /* Sorğu jetonu: uzantı dəyişdirilsə, uçuşda olan köhnə cavab nəticəni
     üzərinə yazmasın (əks halda ekranda .io yazır, cavab isə .com-undur). */
  let reqId = 0;

  /* ---------- 3. Köməkçilər ---------- */

  const KNOWN_TLDS = tldButtons.map(b => b.dataset.tld);

  /* İstifadəçi "https://www.menimbrendim.com/haqqinda" kimi də yaza bilər —
     yalnız domen adını çıxarırıq. Sonda tanıdığımız uzantı varsa, onu seçirik. */
  function normalize(raw) {
    let v = String(raw || '').trim().toLowerCase();
    v = v.replace(/^[a-z]+:\/\//, '');   // protokol
    v = v.split(/[/?#]/)[0];             // yol / query
    v = v.replace(/^www\./, '');
    v = v.replace(/\.+$/, '');

    let tld = null;
    for (const t of KNOWN_TLDS) {
      if (v.endsWith(t) && v.length > t.length) { tld = t; v = v.slice(0, -t.length); break; }
    }
    return { label: v, tld };
  }

  /* Yalnız LDH (hərf-rəqəm-defis) qəbul edilir — beynəlxalq (ə, ö, ğ...) hərflər
     punycode tələb edir, onu client-side etmirik. */
  const LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

  function setTld(tld) {
    activeTld = tld;
    tldButtons.forEach(b => {
      const on = b.dataset.tld === tld;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (suffixEl) suffixEl.textContent = tld;
  }

  function waLink(text) {
    const num = window.SAYTLAB_WA_NUMBER;
    const base = num ? `https://wa.me/${num}` : 'https://wa.me/';
    return `${base}?text=${encodeURIComponent(text)}`;
  }

  /* Nəticə kartını qurur. Mətn həmişə textContent ilə yazılır (istifadəçi girişi). */
  function render({ state, title, note, waText, waLabel }) {
    resultEl.className = `domain-result is-visible is-${state}`;
    resultEl.replaceChildren();

    const h = document.createElement('p');
    h.className = 'domain-result-title';
    h.textContent = title;
    resultEl.appendChild(h);

    if (note) {
      const p = document.createElement('p');
      p.className = 'domain-result-note';
      p.textContent = note;
      resultEl.appendChild(p);
    }

    if (waText) {
      const a = document.createElement('a');
      a.className = 'btn btn-solid domain-wa';
      a.href = waLink(waText);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = waLabel || 'WhatsApp-dan yazın';
      resultEl.appendChild(a);
    }
  }

  function renderLoading(fqdn) {
    resultEl.className = 'domain-result is-visible is-loading';
    resultEl.replaceChildren();
    const span = document.createElement('span');
    span.className = 'domain-spinner';
    span.setAttribute('aria-hidden', 'true');
    const p = document.createElement('p');
    p.className = 'domain-result-title';
    p.textContent = `${fqdn} yoxlanılır…`;
    resultEl.append(span, p);
  }

  function setBusy(on) {
    busy = on;
    if (submitBtn) {
      submitBtn.disabled = on;
      submitBtn.classList.toggle('is-busy', on);
    }
  }

  /* Servis cavab vermədi / limit doldu / nəticə qeyri-müəyyən — istifadəçiyə
     texniki xəta göstərmirik, sadəcə WhatsApp-a yönləndiririk. */
  function renderFallback(fqdn) {
    render({
      state: 'manual',
      title: 'Avtomatik yoxlama hazırda mümkün olmadı',
      note: `${fqdn} domenini biz sizin üçün yoxlayaq — WhatsApp-dan yazın, qısa müddətdə cavab verək.`,
      waText: `Salam! ${fqdn} domeninin boş olub-olmadığını yoxlaya bilərsinizmi?`,
      waLabel: 'WhatsApp-dan soruşun',
    });
  }

  /* Provayderə bir sorğu. Nəticə: true / false / null (bilinmir). Heç vaxt throw etmir. */
  async function ask(label, tld, fqdn) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutFor(tld));
    try {
      const res = await fetch(PROVIDER.buildUrl(label, tld.slice(1)), { signal: ctrl.signal });
      return res.ok ? PROVIDER.parse(await res.json(), fqdn) : null;
    } catch (_) {
      return null;                    // şəbəkə xətası / timeout / CORS / CSP → fallback
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- 4. Axtarış ---------- */
  async function search() {
    if (busy) return;

    const { label, tld } = normalize(input.value);
    if (tld) setTld(tld);

    if (!label) {
      render({ state: 'invalid', title: 'Əvvəlcə domen adını yazın', note: 'Məsələn: menimbrendim' });
      input.focus();
      return;
    }
    if (!LABEL_RE.test(label)) {
      render({
        state: 'invalid',
        title: 'Bu ad domen üçün uyğun deyil',
        note: 'Yalnız latın hərfləri (a–z), rəqəmlər və defis (-) istifadə edin. Boşluq və xüsusi simvollar olmaz.',
      });
      input.focus();
      return;
    }

    const fqdn = label + activeTld;

    /* .az — avtomatik yoxlama yoxdur, birbaşa WhatsApp. */
    if (MANUAL_TLDS.includes(activeTld)) {
      render({
        state: 'manual',
        title: `${fqdn} — bunu birlikdə yoxlayaq`,
        note: '.az domenlərinin mövcudluğunu avtomatik göstərə bilmirik. Bizə yazın, yoxlayıb dərhal cavab verək.',
        waText: `Salam! ${fqdn} domenini yoxlamaq və almaq istəyirəm.`,
        waLabel: 'WhatsApp-dan yoxlayaq',
      });
      return;
    }

    const myReq = ++reqId;
    setBusy(true);
    renderLoading(fqdn);

    const reqTld = activeTld;         // sorğu boyu sabit qalsın
    const startedAt = Date.now();
    let available = await ask(label, reqTld, fqdn);

    if (available === null && myReq === reqId && Date.now() - startedAt < retryWindowFor(reqTld)) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      available = await ask(label, reqTld, fqdn);
    }
    setBusy(false);

    if (myReq !== reqId) return;   // istifadəçi bu arada uzantını dəyişib

    if (available === true) {
      render({
        state: 'free',
        title: `${fqdn} sərbəstdir`,
        note: 'Bu domeni sizin adınıza qeydiyyatdan keçirə və üzərində sayt qura bilərik. Detalları WhatsApp-da danışaq.',
        waText: `Salam! ${fqdn} domeni sərbəst görünür. Bu domeni almaq və sayt qurdurmaq istəyirəm.`,
        waLabel: 'Bu domeni istəyirəm',
      });
    } else if (available === false) {
      /* Tutulmuş domen üçün WhatsApp düyməsi göstərmirik — məntiqli deyil. */
      render({
        state: 'taken',
        title: `${fqdn} artıq tutulub`,
        note: 'Başqa bir ad və ya uzantı sınayın — çox vaxt yaxın variantlardan biri boş olur.',
      });
    } else {
      renderFallback(fqdn);
    }
  }

  /* ---------- 5. Hadisələr ---------- */
  form.addEventListener('submit', (e) => { e.preventDefault(); search(); });

  /* Enter ilə axtarış — implicit form submit-ə güvənmirik (bəzi brauzer/
     mühitlərdə tək input olan formada işə düşmür). */
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    search();
  });

  tldButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setTld(btn.dataset.tld);
      /* Uzantı dəyişəndə köhnə nəticə (və uçuşdakı sorğu) yanlış təsəvvür yaratmasın. */
      reqId++;
      resultEl.className = 'domain-result';
      resultEl.replaceChildren();
      input.focus();
    });
  });

  /* Yazı dəyişəndə köhnə nəticəni təmizlə. */
  input.addEventListener('input', () => {
    if (!resultEl.classList.contains('is-visible')) return;
    resultEl.className = 'domain-result';
    resultEl.replaceChildren();
  });

  setTld(activeTld);
})();
