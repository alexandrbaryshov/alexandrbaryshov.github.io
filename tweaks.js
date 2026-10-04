/* Твики: панель настроек сайта на ходу. Выбор фото, шрифты, размеры, атмосфера.
   Открыть/закрыть: кнопка «Твики» справа внизу или клавиша T. Настройки помнятся в браузере.
   Подключается до main.js, чтобы фото и подписи стояли на месте до запуска анимаций. */
(function () {
  var root = document.documentElement;
  var IMG = 'assets/img/';

  /* Hero зафиксирован: «Лагуна» (hero-1) + видео со скролл-анимацией. Точки подписей — в main.js (HERO_SCENE). */
  var HERO = { id: 'hero-1', hx: .62 };

  /* Наборы фото для остальных блоков: слот → файл <слот>-<набор>.webp */
  var SETS = {
    hall:  { label: 'Зал ассортимента', slots: 8, names: ['Набор 1', 'Набор 2'] },
    step:  { label: 'Первый аквариум', slots: 4, names: ['Набор 1', 'Набор 2'] },
    place: { label: 'Дом, офис, частный дом', slots: 3, names: ['Набор 1', 'Набор 2'] }
  };

  var WATER = {
    deep:   { name: 'Глубина', c: ['#183B67', '#1a4272', '#152c55', '#121A36', '#0e1630'] },
    sea:    { name: 'Море',    c: ['#1f5c8f', '#22679b', '#1c4f82', '#173d6b', '#132f58'] },
    lagoon: { name: 'Лагуна',  c: ['#2e7fb3', '#2a75a8', '#23639a', '#1d5287', '#173f6e'] }
  };
  var ACCENT = {
    coral: { name: 'Коралл', c: '#FF7A3D', h: '#F6B79E' },
    peach: { name: 'Персик', c: '#F6B79E', h: '#FFD7C6' },
    aqua:  { name: 'Бирюза', c: '#5FD6E8', h: '#A5EAF3' },
    lilac: { name: 'Сирень', c: '#ADA6D6', h: '#CFCAEE' }
  };

  // по умолчанию — выбор заказчика от 04.10.2026: зал набор 2, остальное набор 1
  var DEFAULTS = {
    hall: 2, step: 1, place: 1, floor: 1,
    video: true, smooth: .16, heroLen: 560,
    hz: 1, hx: null, shade: .55, rays: .55, notes: true, inset: 28,
    fs: 1, fh: 1, wh: 300, tt: 'uppercase',
    img: 1, rad: 1, sat: 1, bri: 1,
    water: 'deep', accent: 'coral', silt: .75, gauge: true
  };
  var KEY = 'ma-tweaks-v2';
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  for (var k in DEFAULTS) if (!(k in state)) state[k] = DEFAULTS[k];
  window.MA_TWEAKS = state;   // main.js читает отсюда видео и плавность

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function setVar(n, v) { root.style.setProperty(n, v); }

  /* ---------- применение настроек ---------- */
  function applyHero() {
    setVar('--hero-img', 'url(' + IMG + HERO.id + '.webp)');
    setVar('--hx', state.hx == null ? HERO.hx : state.hx);
    if (typeof clampNotes === 'function') requestAnimationFrame(clampNotes);
  }
  /* На телефоне карточка подписи висит под точкой: удерживаем её в пределах экрана */
  function clampNotes() {
    var mobile = innerWidth < 760;
    var notes = document.querySelectorAll('.hero__marks .note');
    for (var i = 0; i < notes.length; i++) {
      var card = notes[i].querySelector('.note__card'), dot = notes[i].querySelector('.note__dot');
      if (!mobile) { card.style.left = card.style.right = ''; continue; }
      var dr = dot.getBoundingClientRect(), x = dr.left + dr.width / 2, w = card.offsetWidth || 168;
      card.style.right = 'auto';
      card.style.left = Math.min(Math.max(-60, 16 - x), innerWidth - 16 - w - x) + 'px';
    }
  }
  window.MA_clampNotes = clampNotes;
  addEventListener('resize', function () { requestAnimationFrame(clampNotes); });
  addEventListener('load', clampNotes);

  function applySets() {
    Object.keys(SETS).forEach(function (s) {
      for (var i = 0; i < SETS[s].slots; i++) {
        var el = document.querySelector('[data-slot="' + s + '-' + i + '"]');
        if (el) el.src = IMG + s + '-' + i + '-' + state[s] + '.webp';
      }
    });
    var floor = IMG + 'floor-' + state.floor + '.webp';
    setVar('--floor-img', 'url(' + floor + ')');
  }
  function applyVars() {
    setVar('--hz', state.hz); setVar('--shade', state.shade); setVar('--rays', state.rays);
    setVar('--inset-user', state.inset + 'px');
    setVar('--fs', state.fs); setVar('--fh', state.fh); setVar('--wh', state.wh); setVar('--tt', state.tt);
    setVar('--img', state.img); setVar('--rad', state.rad); setVar('--sat', state.sat); setVar('--bri', state.bri);
    setVar('--silt', state.silt);
    var w = WATER[state.water] || WATER.deep;
    w.c.forEach(function (c, i) { setVar('--bg-' + (i + 1), c); });
    var a = ACCENT[state.accent] || ACCENT.coral;
    setVar('--clown', a.c); setVar('--peach', a.h);
    root.classList.toggle('no-notes', !state.notes);
    root.classList.toggle('no-gauge', !state.gauge);
    root.classList.toggle('no-video', !state.video);
    setVar('--hero-len', state.heroLen);
  }
  var refreshT;
  function refreshScroll() {
    clearTimeout(refreshT);
    refreshT = setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 350);
  }
  function applyAll() { applyVars(); applyHero(); applySets(); }
  applyAll();

  /* ---------- панель ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  var btn = el('button', 'tw-toggle', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="6" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span>Твики</span>');
  btn.type = 'button'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'tw-panel'); btn.title = 'Настройки сайта (T)';

  var panel = el('aside', 'tw');
  panel.id = 'tw-panel'; panel.setAttribute('aria-label', 'Настройки сайта'); panel.hidden = true;

  var head = el('div', 'tw__head', '<b>Твики</b><span>Меняются сразу, запоминаются в этом браузере</span>');
  var close = el('button', 'tw__close', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>');
  close.type = 'button'; close.setAttribute('aria-label', 'Закрыть настройки');
  head.appendChild(close);
  panel.appendChild(head);
  var body = el('div', 'tw__body');
  panel.appendChild(body);

  var controls = [];   // функции, обновляющие контролы из state (для сброса)

  function section(title) { var s = el('section', 'tw__sec'); s.appendChild(el('h3', null, title)); body.appendChild(s); return s; }

  function range(sec, key, label, min, max, step, fmt, onSet) {
    var row = el('label', 'tw__row');
    var top = el('span', 'tw__label', label);
    var val = el('output', 'tw__val');
    top.appendChild(val);
    var inp = el('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step;
    row.appendChild(top); row.appendChild(inp); sec.appendChild(row);
    function cur() { return state[key] == null && onSet && onSet.fallback ? onSet.fallback() : state[key]; }
    function sync() { inp.value = cur(); val.textContent = fmt(+inp.value); }
    inp.addEventListener('input', function () {
      state[key] = +inp.value; val.textContent = fmt(state[key]);
      applyVars(); if (onSet && onSet.fn) onSet.fn(); save();
    });
    inp.addEventListener('change', refreshScroll);
    controls.push(sync); sync();
    return { sync: sync };
  }
  function seg(sec, key, label, opts, after) {
    var row = el('div', 'tw__row');
    row.appendChild(el('span', 'tw__label', label));
    var g = el('div', 'tw__seg'); g.setAttribute('role', 'radiogroup'); g.setAttribute('aria-label', label);
    var bs = opts.map(function (o) {
      var b = el('button', null, o[1]); b.type = 'button'; b.setAttribute('role', 'radio');
      b.addEventListener('click', function () { state[key] = o[0]; sync(); applyAll(); if (after) after(); save(); refreshScroll(); });
      g.appendChild(b); return b;
    });
    function sync() { bs.forEach(function (b, i) { b.setAttribute('aria-checked', opts[i][0] === state[key] ? 'true' : 'false'); }); }
    row.appendChild(g); sec.appendChild(row);
    controls.push(sync); sync();
  }
  function toggle(sec, key, label, after) {
    var row = el('label', 'tw__row tw__row--sw');
    row.appendChild(el('span', 'tw__label', label));
    var inp = el('input'); inp.type = 'checkbox'; inp.setAttribute('role', 'switch');
    inp.addEventListener('change', function () { state[key] = inp.checked; applyVars(); save(); if (after) after(); });
    row.appendChild(inp); sec.appendChild(row);
    function sync() { inp.checked = !!state[key]; }
    controls.push(sync); sync();
  }
  function setStrip(sec, key, label, count, file) {
    var row = el('div', 'tw__row');
    row.appendChild(el('span', 'tw__label', label));
    var g = el('div', 'tw__sets'); g.setAttribute('role', 'radiogroup'); g.setAttribute('aria-label', label);
    var bs = [1, 2].map(function (n) {
      var b = el('button', 'tw__set'); b.type = 'button'; b.setAttribute('role', 'radio');
      var strip = '';
      for (var i = 0; i < count; i++) strip += '<img src="' + IMG + 'thumbs/' + file(i, n) + '.webp" alt="" loading="lazy">';
      b.innerHTML = '<span class="tw__strip">' + strip + '</span><span>Набор ' + n + '</span>';
      b.addEventListener('click', function () { state[key] = n; sync(); applySets(); save(); });
      g.appendChild(b); return b;
    });
    function sync() { bs.forEach(function (b, i) { b.setAttribute('aria-checked', state[key] === i + 1 ? 'true' : 'false'); }); }
    row.appendChild(g); sec.appendChild(row);
    controls.push(sync); sync();
  }

  var pct = function (v) { return Math.round(v * 100) + '%'; };

  /* Фото */
  var sPhoto = section('Фото');
  setStrip(sPhoto, 'hall', SETS.hall.label, 8, function (i, n) { return 'hall-' + i + '-' + n; });
  setStrip(sPhoto, 'step', SETS.step.label, 4, function (i, n) { return 'step-' + i + '-' + n; });
  setStrip(sPhoto, 'place', SETS.place.label, 3, function (i, n) { return 'place-' + i + '-' + n; });
  setStrip(sPhoto, 'floor', 'Дно (контакты)', 1, function (i, n) { return 'floor-' + n; });

  /* Hero */
  var sHero = section('Hero — видео «Лагуна»');
  toggle(sHero, 'video', 'Видео при скролле (выкл — только фото)', function () { location.reload(); });
  range(sHero, 'smooth', 'Плавность перемотки', .05, .5, .01, function (v) { return v < .12 ? 'мягко' : v > .3 ? 'резко' : 'средне'; });
  range(sHero, 'heroLen', 'Длина сцены (прокрутка)', 400, 800, 10, function (v) { return Math.round(v / 100 * 10) / 10 + ' экр.'; });
  range(sHero, 'hz', 'Масштаб кадра', 1, 1.5, .01, pct);
  range(sHero, 'hx', 'Фокус по горизонтали', 0, 1, .01, pct, { fn: applyHero, fallback: function () { return HERO.hx; } });
  range(sHero, 'shade', 'Вуаль под текстом', 0, 1, .01, pct);
  range(sHero, 'rays', 'Лучи солнца', 0, 1, .01, pct);
  range(sHero, 'inset', 'Рамка вокруг кадра', 0, 56, 1, function (v) { return v + ' px'; });
  toggle(sHero, 'notes', 'Подписи к рыбе');

  /* Типографика */
  var sType = section('Шрифты');
  range(sType, 'fs', 'Размер текста', .85, 1.3, .01, pct);
  range(sType, 'fh', 'Размер заголовков', .7, 1.3, .01, pct);
  seg(sType, 'wh', 'Начертание заголовков', [[200, 'Тонкое'], [300, 'Лёгкое'], [400, 'Обычное'], [600, 'Жирное']]);
  seg(sType, 'tt', 'Регистр заголовков', [['uppercase', 'ПРОПИСНЫЕ'], ['none', 'Как в тексте']]);

  /* Картинки */
  var sImg = section('Картинки');
  range(sImg, 'img', 'Размер картинок', .7, 1.3, .01, pct);
  range(sImg, 'rad', 'Скругление углов', 0, 2, .05, pct);
  range(sImg, 'sat', 'Насыщенность', .6, 1.4, .01, pct);
  range(sImg, 'bri', 'Яркость', .8, 1.2, .01, pct);

  /* Атмосфера */
  var sAir = section('Атмосфера');
  seg(sAir, 'water', 'Цвет воды (фон)', Object.keys(WATER).map(function (k) { return [k, WATER[k].name]; }));
  seg(sAir, 'accent', 'Акцентный цвет', Object.keys(ACCENT).map(function (k) { return [k, '<i style="background:' + ACCENT[k].c + '"></i>' + ACCENT[k].name]; }));
  range(sAir, 'silt', 'Взвесь в воде', 0, 1, .01, pct);
  toggle(sAir, 'gauge', 'Шкала глубины');

  /* Низ панели */
  var foot = el('div', 'tw__foot');
  var copy = el('button', 'tw__btn tw__btn--main', 'Скопировать выбор'); copy.type = 'button';
  var reset = el('button', 'tw__btn', 'Сбросить'); reset.type = 'button';
  var note = el('p', 'tw__note', 'Скопируйте выбор и пришлите в чат: по нему зафиксирую фото и параметры.');
  foot.appendChild(copy); foot.appendChild(reset); foot.appendChild(note);
  panel.appendChild(foot);

  function summary() {
    var lines = [
      'Hero: «Лагуна» (hero-1), видео ' + (state.video ? 'вкл' : 'выкл'),
      'Зал: набор ' + state.hall + ', Первый аквариум: набор ' + state.step + ', Дом/офис: набор ' + state.place + ', Дно: ' + state.floor,
      'Настройки: ' + JSON.stringify(state)
    ];
    return lines.join('\n');
  }
  copy.addEventListener('click', function () {
    var text = summary();
    function done() { copy.textContent = 'Скопировано'; setTimeout(function () { copy.textContent = 'Скопировать выбор'; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      var ta = el('textarea'); ta.value = text; ta.className = 'tw__ta'; panel.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      setTimeout(function () { ta.remove(); }, 100);
    }
  });
  reset.addEventListener('click', function () {
    for (var k in DEFAULTS) state[k] = DEFAULTS[k];
    save(); applyAll(); controls.forEach(function (c) { c(); }); refreshScroll();
  });

  function open(v) {
    panel.hidden = !v; btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    root.classList.toggle('tw-open', v);
    if (v) close.focus();
  }
  btn.addEventListener('click', function () { open(panel.hidden); });
  close.addEventListener('click', function () { open(false); btn.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]') && e.key !== 'Escape') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus(); }
    else if (e.code === 'KeyT') open(panel.hidden);
  });

  function mount() { document.body.appendChild(btn); document.body.appendChild(panel); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
