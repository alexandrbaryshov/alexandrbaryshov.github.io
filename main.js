/* Мир аквариумов — сценарий прокрутки */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Взвесь: мелкие частицы на трёх глубинах ---------- */
  function setupSilt() {
    var c = $('.silt');
    if (!c || reduce) return;
    var ctx = c.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, parts = [], lastY = window.scrollY, drift = 0;
    function resize() {
      W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
      c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
    }
    resize(); addEventListener('resize', resize);
    var count = innerWidth < 760 ? 46 : 110;
    for (var i = 0; i < count; i++) {
      var depth = Math.random();
      parts.push({
        x: Math.random(), y: Math.random(), d: depth,
        r: (0.5 + depth * 1.7), a: 0.12 + depth * 0.4,
        vx: (Math.random() - 0.5) * 0.00006, vy: -(0.00002 + Math.random() * 0.00007),
        ph: Math.random() * 6.28, bubble: Math.random() < 0.06
      });
    }
    function frame(t) {
      var sy = window.scrollY, dy = sy - lastY; lastY = sy;
      drift += dy;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx + Math.sin(t * 0.0004 + p.ph) * 0.00008 * p.d;
        p.y += p.bubble ? p.vy * 6 : p.vy;
        p.y -= dy / innerHeight * (0.15 + p.d * 0.5);
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.y > 1.02) { p.y = -0.02; p.x = Math.random(); }
        if (p.x < -0.02) p.x = 1.02; if (p.x > 1.02) p.x = -0.02;
        var x = p.x * W, y = p.y * H, r = p.r * dpr * (p.bubble ? 1.8 : 1);
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283);
        if (p.bubble) { ctx.strokeStyle = 'rgba(220,227,245,' + (p.a * 0.9) + ')'; ctx.lineWidth = dpr * 0.8; ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(220,227,245,' + p.a * 0.55 + ')'; ctx.fill(); }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Шкала глубины ---------- */
  function setupGauge() {
    var gauge = $('.gauge'), num = $('.gauge__num b');
    if (!gauge) return;
    var maxDepth = 30, ticking = false;
    function upd() {
      ticking = false;
      // глубина считается от конца hero: пока смотрим на петушка, мы у поверхности
      var hero = $('.hero'), start = hero ? hero.offsetHeight - innerHeight : 0;
      var max = document.documentElement.scrollHeight - innerHeight - start;
      var p = max > 0 ? Math.min(1, Math.max(0, (scrollY - start) / max)) : 0;
      // ось шкалы задаёт CSS: на десктопе вертикальная, на телефоне линия под шапкой
      gauge.style.setProperty('--depth', p.toFixed(4));
      num.textContent = Math.round(p * maxDepth);
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ---------- Активный пункт меню ---------- */
  function setupNav() {
    var links = $$('.top__nav a');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-here', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['zal', 'rif', 'start', 'dno'].forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- Видео рифа: играет только в кадре ---------- */
  function setupVideo() {
    var v = $('.reef__video');
    if (!v) return;
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
    }).observe(v);
  }

  /* ---------- Зал: указатель ассортимента ---------- */
  function setupHall() {
    var items = $$('.hall__list li'), imgs = $$('.hall__window img'), z = 1, cur = -1;
    function show(i) {
      if (i === cur) return;
      items.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
      imgs.forEach(function (im) { im.classList.remove('is-prev'); });
      if (cur >= 0) imgs[cur].classList.add('is-prev');
      imgs.forEach(function (im, k) { if (k !== i) im.classList.remove('is-on'); });
      var im = imgs[i]; im.style.zIndex = ++z; im.classList.remove('is-on'); void im.offsetWidth; im.classList.add('is-on');
      cur = i;
    }
    items.forEach(function (li, i) { li.addEventListener('mouseenter', function () { show(i); }); });
    show(0);
    // телефон: окно липнет сверху, список уезжает под него — пункты гаснут у нижнего края окна,
    // чтобы буквы не выглядывали из-за скруглённых углов арки
    var win = $('.hall__window'), fadeT = false;
    function fade() {
      fadeT = false;
      var mobile = innerWidth < 761, wb = win.getBoundingClientRect().bottom;
      items.forEach(function (li) {
        if (!mobile) { li.style.opacity = ''; return; }
        var r = li.getBoundingClientRect(), c = r.top + r.height / 2;
        li.style.opacity = Math.min(1, Math.max(0, (c - wb) / 48)).toFixed(2);
      });
    }
    addEventListener('scroll', function () { if (!fadeT) { fadeT = true; requestAnimationFrame(fade); } }, { passive: true });
    addEventListener('resize', fade);
    fade();
    if (!hasGsap) return;
    items.forEach(function (li, i) {
      ScrollTrigger.create({ trigger: li, start: 'top 58%', end: 'bottom 58%', onToggle: function (s) { if (s.isActive) show(i); } });
    });
  }

  // без GSAP или без анимации ленту шагов листают пальцем (см. html.no-scrub в CSS)
  if (!hasGsap || reduce) document.documentElement.classList.add('no-scrub');
  if (!hasGsap) { setupSilt(); setupGauge(); setupNav(); setupVideo(); setupHall(); return; }
  gsap.registerPlugin(ScrollTrigger);
  // на телефоне адресная строка прячется при скролле: не пересчитываем сцены на каждое такое «изменение высоты»
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- HERO: камера подплывает к особенностям петушка ----------
     Видео (24 с) — три склеенных перелёта камеры: общий план → голова → чешуя и плавник → хвост.
     Скролл перематывает видео по участкам; между перелётами камера «зависает» на крупном плане,
     и в это время всплывает подпись. p — доля прокрутки секции, t — секунда видео (из 24). */
  var HERO_SCENE = {
    map: [[0, 0], [0.10, 0], [0.34, 8], [0.44, 8], [0.62, 16], [0.72, 16], [0.88, 24], [1, 24]],
    // остановки: окно показа подписи и точка на кадре [x, y, сторона, длина линии]
    stops: [
      { show: [0.025, 0.10], at: [0.575, 0.56, 'd', 90] },  // общий план: Петушок, карточка вниз на песок
      { show: [0.345, 0.44], at: [0.452, 0.53, 'l', 140] }, // голова: дышит воздухом, пузырьки у рта
      { show: [0.625, 0.72], at: [0.55, 0.35, 'l', 130] },  // чешуя и спинной плавник: сотни окрасов
      { show: [0.885, 0.95], at: [0.745, 0.42, 'r', 56] }   // хвост: халфмун
    ],
    steps: [0.34, 0.62, 0.88],                              // границы индикатора остановок
    // на узком экране кадр обрезан по бокам: фокус следует за особенностью рыбы
    mobileFocus: [[0, 0.62], [0.10, 0.62], [0.34, 0.47], [0.44, 0.47], [0.62, 0.55], [0.72, 0.55], [0.88, 0.70], [1, 0.70]]
  };

  function lerpMap(m, p) {
    for (var i = 1; i < m.length; i++) {
      if (p <= m[i][0]) {
        var k = (p - m[i - 1][0]) / (m[i][0] - m[i - 1][0]);
        return m[i - 1][1] + (m[i][1] - m[i - 1][1]) * k;
      }
    }
    return m[m.length - 1][1];
  }
  function heroTime(p, dur) { return lerpMap(HERO_SCENE.map, p) / 24 * dur; }

  function placeHeroNotes() {
    $$('.hero__marks .note').forEach(function (n, i) {
      var a = HERO_SCENE.stops[i].at;
      n.style.setProperty('--x', a[0] * 100 + '%');
      n.style.setProperty('--y', a[1] * 100 + '%');
      n.style.setProperty('--len', a[3] + 'px');
      ['l', 'r', 'd', 'dr'].forEach(function (s) { n.classList.toggle('note--' + s, a[2] === s); });
    });
  }

  /* На телефоне карточка подписи висит под точкой: удерживаем её в пределах экрана */
  function clampNotes() {
    var mobile = innerWidth < 760;
    $$('.hero__marks .note').forEach(function (n) {
      var card = $('.note__card', n), dot = $('.note__dot', n);
      if (!mobile) { card.style.left = card.style.right = ''; return; }
      var dr = dot.getBoundingClientRect(), x = dr.left + dr.width / 2, w = card.offsetWidth || 168;
      card.style.right = 'auto';
      card.style.left = Math.min(Math.max(-60, 16 - x), innerWidth - 16 - w - x) + 'px';
    });
  }
  addEventListener('resize', function () { requestAnimationFrame(clampNotes); });
  addEventListener('load', clampNotes);

  /* Видео: подгружаем версию по ширине экрана, перематываем с мягким догоном к цели */
  function setupHeroVideo() {
    var video = $('.hero__video');
    if (!video) return null;
    var small = innerWidth < 900 || (navigator.connection && navigator.connection.saveData);
    var src = video.getAttribute(small ? 'data-src-small' : 'data-src');
    var state = { target: 0, cur: 0, ready: false, active: true };
    function attach(s) {
      video.src = s; video.load();
      // muted + playsinline: мобильные браузеры разрешают play() без касания, после него работает перемотка
      var pr = video.play(); if (pr && pr.catch) pr.catch(function () {});
    }
    // на телефоне видео скачиваем целиком: перемотка по скроллу идёт из памяти, без подгрузки кусками на каждом кадре
    if (innerWidth < 761 && window.fetch && window.URL && URL.createObjectURL) {
      fetch(src).then(function (r) { if (!r.ok) throw r; return r.blob(); })
        .then(function (b) { attach(URL.createObjectURL(b)); }, function () { attach(src); });
    } else attach(src);
    function ready() {
      if (state.ready) return;
      state.ready = true;
      video.pause(); video.currentTime = 0;
      video.classList.add('is-ready');
    }
    video.addEventListener('loadeddata', ready);
    // iOS разрешает перемотку только после первого play()
    var unlock = function () { var pr = video.play(); if (pr && pr.then) pr.then(function () { video.pause(); }, function () {}); removeEventListener('touchstart', unlock); };
    addEventListener('touchstart', unlock, { passive: true });
    (function tick() {
      if (state.ready && state.active && video.duration) {
        state.cur += (state.target - state.cur) * 0.05;   // мягкий догон
        if (Math.abs(video.currentTime - state.cur) > 0.02 && !video.seeking) video.currentTime = state.cur;
      }
      requestAnimationFrame(tick);
    })();
    state.video = video;
    return state;
  }

  function setupHero() {
    var hero = $('.hero'), frame = $('.hero__frame'), notes = $$('.hero__marks .note');
    var top = $('.top'), steps = $$('.hero__steps li'), mobile = innerWidth < 760;
    var vs = setupHeroVideo();

    placeHeroNotes();
    function syncHero(p) {
      HERO_SCENE.stops.forEach(function (s, i) {
        var on = p >= s.show[0] && p < s.show[1];
        notes[i].classList.toggle('is-shown', on);
        notes[i].classList.toggle('is-active', on);
      });
      var b = HERO_SCENE.steps, idx = p < b[0] ? 0 : p < b[1] ? 1 : p < b[2] ? 2 : 3;
      steps.forEach(function (li, i) { li.classList.toggle('is-on', i === idx); li.classList.toggle('is-done', i < idx); });
      top.classList.toggle('is-open', p > 0.93);
      document.documentElement.classList.toggle('is-hero', p < 0.93);
      if (vs) { vs.target = heroTime(p, vs.video.duration || 24); vs.active = p < 1; }
      if (innerWidth < 760) {
        document.documentElement.style.setProperty('--hx', lerpMap(HERO_SCENE.mobileFocus, p).toFixed(4));
        clampNotes();
      }
    }

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.6, onUpdate: function (s) { syncHero(s.progress); } }
    });
    // timeline длиной 100 = вся секция: позиции ниже совпадают с долями прокрутки в HERO_SCENE
    tl.fromTo('.hero__rays', { yPercent: 0 }, { yPercent: 8, duration: 100 }, 0)
      .fromTo('.hero__title .t2', { x: 0 }, { x: mobile ? -12 : -40, duration: 12 }, 0)
      .fromTo('.hero__title .t1', { x: 0 }, { x: mobile ? 14 : 30, duration: 12 }, 0)
      // заголовок и лид уходят, как только камера трогается к рыбе
      .to(['.hero__title', '.hero__lead', '.hero__cue'], { autoAlpha: 0, y: -24, duration: 5, stagger: 0.8 }, 9)
      // финал: кадр раскрывается на весь экран, адрес и индикатор уходят
      .fromTo(frame, { '--open': 0 }, { '--open': 1, duration: 6, ease: 'power2.inOut' }, 94)
      .to(['.visit', '.hero__steps'], { autoAlpha: 0, y: 20, duration: 4 }, 94);
    syncHero(0);
  }

  /* ---------- РИФ: арочное окно раскрывается в морской аквариум ---------- */
  function setupReef() {
    var mobile = innerWidth < 760;
    var from = mobile ? 'inset(21vh 14% 25vh 14% round 30vh 30vh 14px 14px)' : 'inset(13vh 37% 13vh 37% round 30vh 30vh 18px 18px)';
    var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.reef', start: 'top top', end: 'bottom bottom', scrub: 0.8 } });
    tl.fromTo('.reef__window', { clipPath: from }, { clipPath: 'inset(0vh 0% 0vh 0% round 0vh 0vh 0px 0px)', duration: 6, ease: 'power2.inOut' }, 1)
      .fromTo('.reef__video', { scale: 1.25 }, { scale: 1, duration: 7 }, 0)
      .to('.reef__title span:first-child', mobile ? { y: '-30vh', autoAlpha: 0, duration: 4 } : { x: '-32vw', autoAlpha: 0, duration: 4 }, 1.5)
      .to('.reef__title span:last-child', mobile ? { y: '30vh', autoAlpha: 0, duration: 4 } : { x: '32vw', autoAlpha: 0, duration: 4 }, 1.5)
      .to('.reef__side', { autoAlpha: 0, y: 20, duration: 2 }, 1)
      .to('.reef__window', { '--shade-reef': 1, duration: 2 }, 6)
      .fromTo('.reef__caption', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 2, ease: 'power2.out' }, 7)
      .to({}, { duration: 1.5 });
  }

  /* ---------- ПЕРВЫЙ АКВАРИУМ: горизонтальная лента шагов (и на телефоне) ---------- */
  function setupStart() {
    var track = $('.start__track');
    var dist = function () { return track.scrollWidth - innerWidth; };
    var tween = gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: '.start__pin', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true }
    });
    $$('.step').forEach(function (s) {
      gsap.fromTo($('img', s), { scale: 0.86, opacity: 0.35 }, {
        scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left 95%', end: 'left 45%', scrub: true }
      });
    });
  }

  /* ---------- Три глубины: параллакс (на телефоне кадры стоят столбиком, сдвиг вдвое мягче) ---------- */
  function setupPlaces() {
    var k = function () { return innerWidth < 761 ? 0.5 : 1; };
    $$('.place').forEach(function (el) {
      var sp = parseFloat(el.getAttribute('data-speed')) || 0;
      gsap.fromTo(el, { y: function () { return innerHeight * sp * k(); } }, {
        y: function () { return -innerHeight * sp * k(); }, ease: 'none',
        scrollTrigger: { trigger: '.places', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
      });
    });
    gsap.fromTo('.places__title', { y: function () { return 60 * k(); } }, { y: function () { return -60 * k(); }, ease: 'none',
      scrollTrigger: { trigger: '.places', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    $$('.place img').forEach(function (im) {
      gsap.fromTo(im, { clipPath: 'inset(18% 18% 18% 18% round 16px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: im, start: 'top 88%' }
      });
    });
  }

  /* ---------- ДНО ---------- */
  function setupFloor() {
    gsap.from('.floor__inner > *', {
      y: 40, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.floor__inner', start: 'top 70%' }
    });
    gsap.fromTo('.floor__bg', { yPercent: 10, scale: 1.08 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.floor', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    gsap.from('.hall__intro > *', { y: 40, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: '.hall', start: 'top 75%' } });
  }

  setupSilt(); setupGauge(); setupNav(); setupVideo(); setupHall();
  if (reduce) {
    // без анимации: статичный первый кадр и одна подпись
    placeHeroNotes();
    var first = $('.hero__marks .note');
    if (first) first.classList.add('is-shown', 'is-active');
    return;
  }
  setupHero(); setupReef(); setupStart(); setupPlaces(); setupFloor();
  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
