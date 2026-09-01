/* Релсата с отзивите.
 *
 * Секцията идва от `Отзиви секция.dc.html`, където бутоните викаха методи на
 * компонента през dc-runtime. Тук всяка страница си има свой компонент и не
 * може да поеме още един, затова поведението стои самостоятелно: същата
 * безкрайна релса, същите стрелки, същото „Прочети повече“.
 *
 * Атрибутите носят представка otz-, защото страниците вече търсят глобално
 * `[data-card]` за редакционните разтвори и биха хванали и картичките тук.
 */
(function () {
  'use strict';

  var VISOCHINA = '11rem';

  /* Дългият текст стои изрязан, докато човек не поиска целия. */
  function vurjiPovece(karta) {
    var but = karta.querySelector('[data-otz-more]');
    var tqlo = karta.querySelector('[data-otz-body]');
    var senka = karta.querySelector('[data-otz-fade]');
    if (!but || !tqlo || but.dataset.vurzan === '1') return;
    but.dataset.vurzan = '1';
    but.addEventListener('click', function () {
      var otvoren = tqlo.dataset.open === '1';
      tqlo.dataset.open = otvoren ? '0' : '1';
      tqlo.style.maxHeight = otvoren ? VISOCHINA : 'none';
      if (senka) senka.style.display = otvoren ? 'block' : 'none';
      but.textContent = otvoren ? 'Прочети повече' : 'Скрий текста';
    });
  }

  /* Преди dc-runtime да е свършил, същият маркъп стои два пъти: веднъж като
     суров `<x-dc>`, който ще бъде изхвърлен, и веднъж като рендната картина.
     Хванем ли първия, работата ни отива на боклука заедно с него. */
  function nameriPatq() {
    var vsichki = document.querySelectorAll('[data-otz-track]');
    for (var i = 0; i < vsichki.length; i++) {
      if (!vsichki[i].closest('x-dc')) return vsichki[i];
    }
    return null;
  }

  function pusni() {
    var patq = nameriPatq();
    if (!patq) return;
    var koren = patq.closest('section') || document;
    var relsa = koren.querySelector('[data-otz-rail]');
    if (!relsa || !patq || patq.dataset.looped === '1') return;
    patq.dataset.looped = '1';

    /* Едно копие на всички картички: на половината ширина картината е същата,
       затова прескачането назад не се вижда. */
    Array.prototype.slice.call(patq.children).forEach(function (vuzel) {
      vurjiPovece(vuzel);
      var kopie = vuzel.cloneNode(true);
      kopie.setAttribute('aria-hidden', 'true');
      vurjiPovece(kopie);
      patq.appendChild(kopie);
    });

    var tween = false;

    function obvii() {
      var polovina = patq.scrollWidth / 2;
      if (polovina <= 0) return;
      if (relsa.scrollLeft >= polovina) relsa.scrollLeft -= polovina;
      else if (relsa.scrollLeft <= 0) relsa.scrollLeft += polovina;
    }

    relsa.scrollLeft = 1;
    relsa.addEventListener('scroll', function () { if (!tween) obvii(); }, { passive: true });

    var natisnat = false, otX = 0, otLqvo = 0, izminato = 0;
    relsa.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      natisnat = true; izminato = 0;
      otX = e.clientX; otLqvo = relsa.scrollLeft;
      relsa.style.cursor = 'grabbing';
      relsa.setPointerCapture(e.pointerId);
    });
    relsa.addEventListener('pointermove', function (e) {
      if (!natisnat) return;
      var dx = e.clientX - otX;
      izminato = Math.abs(dx);
      relsa.scrollLeft = otLqvo - dx;
      obvii();
    });
    function pusni_() { natisnat = false; relsa.style.cursor = 'grab'; }
    relsa.addEventListener('pointerup', pusni_);
    relsa.addEventListener('pointercancel', pusni_);
    relsa.addEventListener('click', function (e) {
      if (izminato > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    /* Собствено плъзгане, за да може прескачането да стане в движение,
       без да се бие с плавния скрол на браузъра. */
    var raf = null;
    function stupka(posoka) {
      var karta = patq.querySelector('[data-otz-card]');
      var luft = parseFloat(getComputedStyle(patq).columnGap) || 24;
      var px = (karta ? karta.offsetWidth : 380) + luft;
      if (raf) cancelAnimationFrame(raf);
      var ot = relsa.scrollLeft, do_ = ot + posoka * px, t0 = performance.now();
      tween = true;
      (function bqgaj(sega) {
        var p = Math.min(1, (sega - t0) / 420);
        relsa.scrollLeft = ot + (do_ - ot) * (1 - Math.pow(1 - p, 3));
        if (p < 1) raf = requestAnimationFrame(bqgaj);
        else { tween = false; obvii(); }
      })(performance.now());
    }

    var nazad = koren.querySelector('[data-otz-prev]');
    var napred = koren.querySelector('[data-otz-next]');
    if (nazad) nazad.addEventListener('click', function () { stupka(-1); });
    if (napred) napred.addEventListener('click', function () { stupka(1); });
  }

  /* dc-runtime рендва страницата наново вътре в #dc-root, а това става след
     DOMContentLoaded. Пуснем ли се тогава, релсата или още я няма, или онова,
     което сме пипнали, отива на боклука заедно със стария възел. Затова се
     чака самата релса да се появи. */
  function debni() {
    if (nameriPatq()) { pusni(); return; }

    var nabljudatel = new MutationObserver(function () {
      if (!nameriPatq()) return;
      nabljudatel.disconnect();
      clearInterval(chasovnik);
      pusni();
    });
    nabljudatel.observe(document.documentElement, { childList: true, subtree: true });

    /* и колан към тирантите, ако наблюдателят пропусне: спира сам след 10 сек */
    var opiti = 0;
    var chasovnik = setInterval(function () {
      if (nameriPatq()) {
        nabljudatel.disconnect();
        clearInterval(chasovnik);
        pusni();
      } else if (++opiti > 100) {
        nabljudatel.disconnect();
        clearInterval(chasovnik);
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', debni);
  } else {
    debni();
  }
})();
