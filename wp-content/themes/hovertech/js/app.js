(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

  /* ---------- menu ---------- */
  var burger = $('#burger'), nav = $('#nav');
  if (burger && nav) {
    var zamknij = function () { nav.classList.remove('otwarte'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); };
    burger.addEventListener('click', function () {
      var otw = !nav.classList.contains('otwarte');
      nav.classList.toggle('otwarte', otw);
      burger.setAttribute('aria-expanded', String(otw));
      burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('otwarte')) { zamknij(); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1100) zamknij(); });
    nav.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a && a.hash && a.pathname === location.pathname) zamknij(); });
  }
  $$('.pod-przel').forEach(function (b) {
    b.addEventListener('click', function () {
      var sub = b.parentNode.querySelector('.sub-menu'); if (!sub) return;
      var otw = !sub.classList.contains('otwarte');
      sub.classList.toggle('otwarte', otw); b.setAttribute('aria-expanded', String(otw));
    });
  });

  /* ---------- pierwszy ekran: pokaz zdjęć ---------- */
  var hero = $('[data-slider]');
  if (hero && hero.querySelectorAll('.slide').length > 1) {
    var wszystkie = $$('.slide', hero), wszDots = $$('.hero-kropki button', hero), slides, dots;
    var zestaw = function () {
      var mob = window.matchMedia('(max-width:760px)').matches; /* 1.2: bez odczytu układu przy starcie */
      slides = wszystkie.filter(function (s) { return mob || !s.classList.contains('tylko-mob'); });
      dots = wszDots.filter(function (d) { return mob || !d.classList.contains('tylko-mob'); });
    };
    zestaw();
    var cur = 0, timer = null;
    var laduj = function (i) {
      var src = slides[i].querySelector('source');
      if (src && src.dataset.srcset) { src.srcset = src.dataset.srcset; delete src.dataset.srcset; }
      var img = slides[i].querySelector('img');
      if (img && img.dataset.src) { img.srcset = img.dataset.srcset; img.src = img.dataset.src; delete img.dataset.src; }
    };
    var pokaz = function (i) {
      i = (i + slides.length) % slides.length;
      if (cur >= slides.length) cur = 0;
      laduj(i); laduj((i + 1) % slides.length);
      slides[cur].classList.remove('on'); if (dots[cur]) dots[cur].classList.remove('on');
      cur = i;
      slides[cur].classList.add('on'); if (dots[cur]) dots[cur].classList.add('on');
    };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    var start = function () { if (reduce) return; stop(); timer = setInterval(function () { pokaz(cur + 1); }, 6000); };
    wszDots.forEach(function (d) { d.addEventListener('click', function () { pokaz(dots.indexOf(d)); start(); }); });
    window.addEventListener('resize', function () {
      var przed = slides.length; zestaw();
      if (slides.length !== przed) { wszystkie.forEach(function (s) { s.classList.remove('on'); }); wszDots.forEach(function (d) { d.classList.remove('on'); }); cur = 0; slides[0].classList.add('on'); dots[0].classList.add('on'); }
    });
    var sx = null, sy = 0;
    hero.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; });
    hero.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { pokaz(cur + (dx < 0 ? 1 : -1)); start(); }
    });
    hero.addEventListener('pointercancel', function () { sx = null; });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    window.addEventListener('load', function () { setTimeout(function () { laduj(1); }, 2500); start(); }); /* 1.2: drugie zdjęcie po chwili, nie w trakcie ładowania pierwszego ekranu */
  }

  /* ---------- karuzele: palec, mysz, strzałki, licznik ---------- */
  var strz = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  $$('[data-car]').forEach(function (car) {
    var tor = car.querySelector('.car-tor'), el = tor.children, n = el.length;
    if (n < 2) return;
    tor.setAttribute('tabindex', '0');
    tor.setAttribute('role', 'group');
    tor.setAttribute('aria-label', 'Zdjęcia: ' + n + ', przewiń w bok');
    var nr = document.createElement('span'); nr.className = 'car-nr'; car.appendChild(nr);
    var l = document.createElement('button'); l.type = 'button'; l.className = 'car-btn l'; l.innerHTML = strz; l.setAttribute('aria-label', 'Poprzednie zdjęcie');
    var p = document.createElement('button'); p.type = 'button'; p.className = 'car-btn p'; p.innerHTML = strz.replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7'); p.setAttribute('aria-label', 'Następne zdjęcie');
    car.appendChild(l); car.appendChild(p);
    var krok = function () { return el[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(el[0]).marginRight) || 0); };
    var odswiez = function () {
      var i = Math.round(tor.scrollLeft / krok());
      nr.textContent = (Math.min(i, n - 1) + 1) + ' / ' + n;
      l.disabled = tor.scrollLeft < 4;
      p.disabled = tor.scrollLeft > tor.scrollWidth - tor.clientWidth - 4;
    };
    var idz = function (d) { tor.scrollBy({ left: d * krok(), behavior: reduce ? 'auto' : 'smooth' }); };
    l.addEventListener('click', function () { idz(-1); });
    p.addEventListener('click', function () { idz(1); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(odswiez); }, { passive: true });
    tor.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); } });
    var st = null, sl = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      st = e.clientX; sl = tor.scrollLeft; ruch = false; tor.setPointerCapture(e.pointerId);
    });
    tor.addEventListener('pointermove', function (e) {
      if (st === null) return;
      var dx = e.clientX - st;
      if (Math.abs(dx) > 4) { ruch = true; car.classList.add('ciag'); }
      if (ruch) tor.scrollLeft = sl - dx;
    });
    var koniec = function () {
      if (st === null) return;
      st = null;
      if (ruch) { var k = krok(); car.classList.remove('ciag'); tor.scrollTo({ left: Math.round(tor.scrollLeft / k) * k, behavior: reduce ? 'auto' : 'smooth' }); }
    };
    tor.addEventListener('pointerup', koniec);
    tor.addEventListener('pointercancel', koniec);
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); ruch = false; } }, true);
    window.addEventListener('resize', odswiez);
    window.requestAnimationFrame(function () { setTimeout(odswiez, 0); }); /* 1.2: licznik po pierwszym malowaniu, bez wymuszonego przeliczenia układu */
  });

  /* ---------- filmy: YouTube dopiero po kliknięciu ---------- */
  $$('.film[data-yt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.dataset.yt) + '?autoplay=1&rel=0';
      f.title = b.getAttribute('aria-label');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      var w = document.createElement('div'); w.className = 'film'; w.appendChild(f);
      b.replaceWith(w);
    });
  });

  /* ---------- formularz ---------- */
  var form = $('#formularz'), info = $('#form-info');
  if (form) {
    var q = new URLSearchParams(location.search), sel = form.querySelector('[name="temat"]'), ta = form.querySelector('[name="tresc"]');
    if (q.get('temat') && sel && sel.querySelector('option[value="' + q.get('temat').replace(/[^\w-]/g, '') + '"]')) sel.value = q.get('temat').replace(/[^\w-]/g, '');
    if (q.get('wersja') && ta && !ta.value) ta.value = 'Wersja: ' + q.get('wersja').slice(0, 60) + '\n';
    var komunikat = function (ok, t) { info.className = 'form-info ' + (ok ? 'ok' : 'blad'); info.textContent = t; };
    form.addEventListener('submit', function (e) {
      var nazwa = form.nazwa.value.trim(), tel = form.tel.value.replace(/\D/g, ''), mail = form.email.value.trim();
      if (!nazwa || (!mail && tel.length < 9)) { e.preventDefault(); komunikat(false, 'Podaj imię lub nazwę jednostki oraz telefon albo e-mail.'); return; }
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { e.preventDefault(); komunikat(false, 'Sprawdź adres e-mail.'); return; }
      e.preventDefault();
      if (form.dataset.tryb === 'pokaz') { komunikat(true, 'Dziękujemy. To wersja testowa strony: po uruchomieniu wiadomość trafi od razu na adres firmy.'); form.reset(); return; }
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'fetch' }, credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (j) { komunikat(!!j.ok, j.wiadomosc || ''); if (j.ok) form.reset(); })
        .catch(function () { form.submit(); })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- dolny pasek na telefonie ---------- */
  var pasek = $('#mob-pasek'), cta = $('#hero-cta'), kontakt = $('#kontakt');
  if (pasek && 'IntersectionObserver' in window) {
    var zaCta = false, wKontakcie = false;
    var ustaw = function () {
      var w = zaCta && !wKontakcie;
      pasek.classList.toggle('widac', w);
      pasek.setAttribute('aria-hidden', String(!w));
      $$('a', pasek).forEach(function (a) { a.tabIndex = w ? 0 : -1; });
    };
    if (cta) {
      new IntersectionObserver(function (en) { zaCta = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; ustaw(); }).observe(cta);
    } else {
      window.addEventListener('scroll', function () { var z = window.scrollY > 500; if (z !== zaCta) { zaCta = z; ustaw(); } }, { passive: true });
    }
    if (kontakt) new IntersectionObserver(function (en) { wKontakcie = en[0].isIntersecting; ustaw(); }, { threshold: 0.05 }).observe(kontakt);
  }

  /* ---------- zgoda na cookies (12 miesięcy) i mapa Google ---------- */
  var KLUCZ = 'ht_zgoda', DNI = 365, ck = $('#ck');
  var czytaj = function () {
    var m = document.cookie.match(/(?:^|; )ht_zgoda=([^;]+)/);
    if (!m) return null;
    var a = decodeURIComponent(m[1]).split('|');
    return { mapy: a[0] === '1', stat: a[1] === '1' };
  };
  var ZG = czytaj();
  var mapy = $$('[data-mapa]');
  var pokazMape = function (el) {
    if (el.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = el.getAttribute('data-mapa'); f.title = el.getAttribute('data-tytul') || 'Mapa';
    f.loading = 'lazy'; f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade'); f.setAttribute('allowfullscreen', '');
    el.innerHTML = ''; el.appendChild(f);
  };
  var zastosuj = function () {
    if (ZG && ZG.mapy) mapy.forEach(pokazMape);
    var g = ck && ck.getAttribute('data-ga4');
    if (ZG && ZG.stat && g && !window.gtag) {
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(g); document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date()); window.gtag('config', g, { anonymize_ip: true });
    }
  };
  var zapisz = function (z) {
    ZG = z;
    document.cookie = KLUCZ + '=' + encodeURIComponent((z.mapy ? '1' : '0') + '|' + (z.stat ? '1' : '0') + '|' + Date.now()) + '; max-age=' + (DNI * 86400) + '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    zastosuj();
  };
  var banerPokaz = function (ust) {
    if (!ck) return;
    ck.hidden = false;
    var m = $('#ck-mapy'), s = $('#ck-stat');
    if (m) m.checked = !!(ZG && ZG.mapy); if (s) s.checked = !!(ZG && ZG.stat);
    $('#ck-ust').hidden = !ust;
    $('[data-ck="zapisz"]', ck).hidden = !ust;
    $('[data-ck="ustawienia"]', ck).hidden = !!ust;
    $('[data-ck="ustawienia"]', ck).setAttribute('aria-expanded', String(!!ust));
  };
  var banerZamknij = function () { if (ck) ck.hidden = true; };
  if (ck) {
    ck.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (!b) return;
      var a = b.getAttribute('data-ck');
      if (a === 'wszystkie') { zapisz({ mapy: true, stat: true }); banerZamknij(); }
      else if (a === 'niezbedne') { zapisz({ mapy: false, stat: false }); banerZamknij(); }
      else if (a === 'ustawienia') banerPokaz(true);
      else if (a === 'zapisz') { var s = $('#ck-stat'); zapisz({ mapy: $('#ck-mapy').checked, stat: s ? s.checked : false }); banerZamknij(); }
    });
    if (!ZG) banerPokaz(false);
  }
  $$('[data-cookies-ustaw]').forEach(function (b) { b.addEventListener('click', function () { banerPokaz(true); }); });
  mapy.forEach(function (el) {
    var b = el.querySelector('.mz-pokaz');
    if (b) b.addEventListener('click', function () { zapisz({ mapy: true, stat: !!(ZG && ZG.stat) }); banerZamknij(); });
  });
  zastosuj();
})();
