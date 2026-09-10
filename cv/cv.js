/* ==========================================================================
   Plantilla de CV de jugador — HRK Sports.
   Lee window.CV_DATA (declarado en el HTML de cada jugador) y arma el DOM.
   No tiene nada específico de un jugador: sumar uno nuevo es copiar el
   HTML y cambiar su bloque de datos, no tocar este archivo.
   ========================================================================== */
(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function normalizePosition(str) {
    return String(str || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim();
  }

  // Cancha horizontal, arco propio a la izquierda: x 0–150 (largo), y 0–100
  // (ancho). "Izquierda"/"derecha" de cada posición son las del jugador
  // mirando hacia el arco rival (a la derecha del dibujo) — por eso un
  // lateral izquierdo queda arriba del gráfico, no abajo.
  const POSITION_COORDS = {
    'arquero': { x: 10, y: 50, zone: 'bajo el arco propio' },
    'defensor central': { x: 24, y: 50, zone: 'el centro del último tercio' },
    'central': { x: 24, y: 50, zone: 'el centro del último tercio' },
    'lateral derecho': { x: 30, y: 82, zone: 'la banda derecha del último tercio' },
    'lateral izquierdo': { x: 30, y: 18, zone: 'la banda izquierda del último tercio' },
    'carrilero derecho': { x: 55, y: 85, zone: 'la banda derecha, cerca del mediocampo' },
    'carrilero izquierdo': { x: 55, y: 15, zone: 'la banda izquierda, cerca del mediocampo' },
    'volante defensivo': { x: 55, y: 50, zone: 'el centro, delante de la defensa' },
    'mediocampista defensivo': { x: 55, y: 50, zone: 'el centro, delante de la defensa' },
    'volante central': { x: 75, y: 50, zone: 'el centro de la cancha' },
    'mediocampista central': { x: 75, y: 50, zone: 'el centro de la cancha' },
    'volante por derecha': { x: 75, y: 80, zone: 'la banda derecha, en la mitad de la cancha' },
    'volante por izquierda': { x: 75, y: 20, zone: 'la banda izquierda, en la mitad de la cancha' },
    'interior derecho': { x: 75, y: 78, zone: 'la banda derecha, en la mitad de la cancha' },
    'interior izquierdo': { x: 75, y: 22, zone: 'la banda izquierda, en la mitad de la cancha' },
    'mediapunta': { x: 100, y: 50, zone: 'el centro del último tercio ofensivo' },
    'enganche': { x: 100, y: 50, zone: 'el centro del último tercio ofensivo' },
    'extremo derecho': { x: 118, y: 85, zone: 'la banda derecha del último tercio ofensivo' },
    'extremo izquierdo': { x: 118, y: 15, zone: 'la banda izquierda del último tercio ofensivo' },
    'delantero centro': { x: 132, y: 50, zone: 'el centro del último tercio ofensivo' },
    'centrodelantero': { x: 132, y: 50, zone: 'el centro del último tercio ofensivo' },
    'delantero': { x: 132, y: 50, zone: 'el centro del último tercio ofensivo' },
  };
  const FALLBACK_COORDS = { x: 75, y: 50, zone: 'el centro de la cancha' };

  function coordsFor(position) {
    const key = normalizePosition(position);
    if (POSITION_COORDS[key]) return POSITION_COORDS[key];
    console.warn(`cv.js: la posición "${position}" no tiene coordenadas definidas en POSITION_COORDS; se usa el centro de la cancha por defecto.`);
    return FALLBACK_COORDS;
  }

  function pitchDescription(data, coords) {
    return `Cancha de fútbol vista desde arriba, en forma horizontal, con el arco propio hacia la izquierda y el arco rival hacia la derecha. Un círculo con el número ${data.number} marca la posición de ${data.name} en ${coords.zone}: ${data.position}.`;
  }

  function renderPhoto(data) {
    const zone = document.querySelector('[data-cv="photo"]');
    if (!zone || !data.photo) return;
    const img = document.createElement('img');
    img.src = data.photo.src;
    img.alt = data.photo.alt || '';
    zone.appendChild(img);

    const cap = document.createElement('div');
    cap.className = 'photo-cap';
    cap.innerHTML = `
      <span class="photo-cap__num">${escapeHtml(String(data.number))}</span>
      <span class="photo-cap__name">${escapeHtml(data.name)}</span>
      <span class="photo-cap__club">${escapeHtml((data.club && data.club.name) || '')}</span>
    `;
    zone.appendChild(cap);
  }

  function renderFacts(data) {
    const list = document.querySelector('[data-cv="facts"]');
    if (!list) return;

    const rows = [
      { k: 'Club', v: data.club && data.club.name },
      { k: 'Posición', v: data.position },
      { k: 'Trayectoria', v: (data.career || []).join(' · ') || null },
      { k: 'Nacionalidad', v: data.nationality },
      { k: 'Fecha de nacimiento', v: data.birth },
      { k: 'Pie hábil', v: data.foot },
      { k: 'Altura', v: data.height },
    ];

    const pendingLabels = [];

    rows.forEach((row) => {
      const isPending = row.v === null || row.v === undefined || row.v === '';
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="facts__k">${escapeHtml(row.k)}</span>
        <span class="facts__v${isPending ? ' facts__v--pending' : ''}">${isPending ? '—' : escapeHtml(row.v)}</span>
      `;
      list.appendChild(li);
      if (isPending) pendingLabels.push(row.k);
    });

    if (data.instagram && data.instagram.url && data.instagram.handle) {
      const li = document.createElement('li');
      const k = document.createElement('span');
      k.className = 'facts__k';
      k.textContent = 'Instagram';
      const a = document.createElement('a');
      a.className = 'facts__ig';
      a.href = data.instagram.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = data.instagram.handle;
      a.setAttribute('aria-label', `Ver a ${data.name} en Instagram (abre en una pestaña nueva)`);
      li.appendChild(k);
      li.appendChild(a);
      list.appendChild(li);
    }

    if (pendingLabels.length) {
      const note = document.createElement('li');
      note.className = 'facts__note';
      const plural = pendingLabels.length > 1;
      note.textContent = `Dato${plural ? 's' : ''} pendiente${plural ? 's' : ''} de confirmar: ${pendingLabels.join(', ')}.`;
      list.appendChild(note);
    }
  }

  function renderPitch(data) {
    const pitchEl = document.querySelector('[data-cv="pitch"]');
    const descEl = document.querySelector('[data-cv="pitch-desc"]');
    if (!pitchEl) return;

    const coords = coordsFor(data.position);

    pitchEl.innerHTML = `
      <svg viewBox="0 0 150 100" aria-hidden="true" focusable="false">
        <rect class="pitch__turf" x="0" y="0" width="150" height="100" rx="3"/>
        <rect class="pitch__line" fill="none" x="3" y="3" width="144" height="94"/>
        <line class="pitch__line" x1="75" y1="3" x2="75" y2="97"/>
        <circle class="pitch__line" fill="none" cx="75" cy="50" r="13"/>
        <rect class="pitch__line" fill="none" x="3" y="24" width="18" height="52"/>
        <rect class="pitch__line" fill="none" x="129" y="24" width="18" height="52"/>
        <circle class="pitch__marker" cx="${coords.x}" cy="${coords.y}" r="9"/>
        <text class="pitch__number" x="${coords.x}" y="${coords.y}" text-anchor="middle" dominant-baseline="central">${escapeHtml(String(data.number))}</text>
      </svg>
    `;
    if (descEl) descEl.textContent = pitchDescription(data, coords);
  }

  function renderVideo(data) {
    const zone = document.querySelector('[data-cv="video"]');
    if (!zone) return;
    if (data.video && data.video.src) {
      const video = document.createElement('video');
      video.src = data.video.src;
      if (data.video.poster) video.poster = data.video.poster;
      video.controls = true;
      video.setAttribute('aria-label', data.video.alt || `Highlights de ${data.name}`);
      zone.appendChild(video);
    } else {
      zone.classList.add('zone--pending');
      zone.setAttribute('role', 'img');
      zone.setAttribute('aria-label', 'Espacio reservado para el video de highlights, todavía sin publicar');
      zone.innerHTML = `
        <svg class="pending__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
        <p class="pending__label">Highlights — próximamente</p>
      `;
    }
  }

  function applyClubTheme(data) {
    const theme = data.club && data.club.theme;
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--club-${key}`, value);
    });
  }

  // ---------- Entrada "el nombre que se arma" ----------
  // El texto que vuela es una copia exacta del nombre real (mismo texto,
  // misma clase que .photo-cap__name, así hereda su tipografía sin
  // copiar nada a mano) para que el aterrizaje sea posible sin salto: el
  // clon arranca grande y centrado y termina en transform:none, que cae
  // exactamente sobre el rect medido del elemento real — no hay que
  // "acertar" una posición a mano. Atrás, una marca de agua gigante con
  // solo el apellido (CV_DATA.lastName) da la idea de "arma el nombre"
  // sin tener que igualar su tipografía a nada. El contenido real (foto,
  // ficha, cancha, video) ya se renderizó antes de llamar a esto y no
  // depende en nada de que esta función corra: si algo acá falla, el CV
  // de abajo queda intacto.
  function initIntro(data) {
    if (!data.lastName) {
      console.warn('cv.js: falta CV_DATA.lastName — no se muestra la entrada "el nombre que se arma".');
      return;
    }

    const STORAGE_KEY = 'hrk_cv_intro_seen::' + location.pathname;
    let alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem(STORAGE_KEY) === '1'; } catch (err) {}
    if (alreadySeen) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targetEl = document.querySelector('.photo-cap__name');
    if (!targetEl) return;

    // Sin Web Animations API no hay forma confiable de saber cuándo
    // terminó la animación para sacar el overlay: mejor no mostrar la
    // entrada que arriesgarse a taparle el CV a alguien para siempre.
    if (typeof document.body.animate !== 'function') return;

    function markSeen() {
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (err) {}
    }

    const overlay = document.createElement('div');
    overlay.className = 'cv-intro';
    overlay.setAttribute('aria-hidden', 'true');

    const watermark = document.createElement('div');
    watermark.className = 'cv-intro__watermark';
    watermark.textContent = data.lastName;

    const flying = document.createElement('span');
    flying.className = 'photo-cap__name cv-intro__name';
    flying.textContent = targetEl.textContent;

    overlay.appendChild(watermark);
    overlay.appendChild(flying);
    document.body.appendChild(overlay);
    const shownAt = performance.now();

    let done = false;
    let anims = [];

    function finish() {
      if (done) return;
      done = true;
      window.removeEventListener('pointerdown', finish, true);
      window.removeEventListener('keydown', finish, true);
      anims.forEach((a) => { try { a.cancel(); } catch (err) {} });
      overlay.remove();
      markSeen();
      // Sin console.log a propósito (no ensuciar la consola de un usuario
      // real); el dato queda accesible para pruebas/depuración vía esta
      // propiedad, no vía texto impreso.
      window.__hrkCvIntroLastVisibleMs = performance.now() - shownAt;
    }

    window.addEventListener('pointerdown', finish, true);
    window.addEventListener('keydown', finish, true);

    function start(DURATION) {
      if (done) return; // se saltó mientras esperábamos las fuentes

      const rect = targetEl.getBoundingClientRect();
      flying.style.left = rect.left + 'px';
      flying.style.top = rect.top + 'px';
      flying.style.width = rect.width + 'px';
      flying.style.height = rect.height + 'px';

      // .photo-cap__name es un item de un flex column: su caja se
      // estira a lo ancho del contenedor, pero el texto queda alineado
      // a la izquierda adentro — el CENTRO DE LA CAJA no es el centro
      // VISUAL del texto. Si escalamos/centramos sobre el centro de la
      // caja, el nombre grande queda pegado a la izquierda en vez de
      // centrado en pantalla. Medimos el texto real (Range) y fijamos
      // ahí el transform-origin, en px relativos a la propia caja, para
      // que el scale() y el translate() giren alrededor de las letras y
      // no del hueco vacío a la derecha. Esto no afecta el aterrizaje:
      // a transform:none el transform-origin no cambia nada.
      const textRange = document.createRange();
      textRange.selectNodeContents(targetEl);
      const textRect = textRange.getBoundingClientRect();
      const originX = (textRect.left - rect.left) + textRect.width / 2;
      const originY = (textRect.top - rect.top) + textRect.height / 2;
      flying.style.transformOrigin = `${originX}px ${originY}px`;

      const cx = textRect.left + textRect.width / 2;
      const cy = textRect.top + textRect.height / 2;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dxCenter = (vw / 2) - cx;
      const dyCenter = (vh / 2) - cy;
      const dyBelow = dyCenter + vh * 0.7;

      // El "grande y centrado" tiene que entrar en la pantalla tanto en
      // alto como en ancho — un nombre largo no puede escalarse solo en
      // base a la altura de fuente o se va de los bordes (le pasaba a
      // "Ezequiel Neira": mucho más ancho que "Neira" solo).
      const realFontSize = parseFloat(getComputedStyle(targetEl).fontSize) || rect.height;
      const heightScale = (Math.min(vw, vh) * 0.16) / realFontSize;
      const widthScale = (vw * 0.86) / textRect.width;
      const scale = Math.max(1, Math.min(heightScale, widthScale));

      const EASE = 'cubic-bezier(.22,1,.36,1)';

      // Importante: la curva de aceleración va puesta en CADA keyframe
      // (easing = de ese keyframe al siguiente), no como opción general
      // de .animate(). Una easing general no suaviza cada tramo por
      // separado: deforma la LÍNEA DE TIEMPO completa antes de ubicar
      // los offsets, así que con una curva ease-out el "offset .45" deja
      // de caer a mitad de duración real — pasa mucho antes, arrastrando
      // con él el encogido/aterrizaje que dependía de esos offsets.
      try {
        anims.push(overlay.animate([
          { opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.55 },
          { opacity: 0, offset: 1 },
        ], { duration: DURATION, easing: 'linear', fill: 'forwards' }));

        anims.push(watermark.animate([
          { transform: 'translate(-50%,-50%) scale(.55)', opacity: 0, offset: 0, easing: EASE },
          { transform: 'translate(-50%,-50%) scale(1)', opacity: .16, offset: .45, easing: 'linear' },
          { transform: 'translate(-50%,-50%) scale(1.05)', opacity: .12, offset: .6, easing: EASE },
          { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 0, offset: 1 },
        ], { duration: DURATION, fill: 'forwards' }));

        anims.push(flying.animate([
          { transform: `translate(${dxCenter}px, ${dyBelow}px) scale(${scale})`, opacity: 0, offset: 0, easing: 'ease-out' },
          { transform: `translate(${dxCenter}px, ${dyBelow}px) scale(${scale})`, opacity: 1, offset: .08, easing: EASE },
          { transform: `translate(${dxCenter}px, ${dyCenter}px) scale(${scale})`, opacity: 1, offset: .45, easing: 'linear' },
          { transform: `translate(${dxCenter}px, ${dyCenter}px) scale(${scale})`, opacity: 1, offset: .58, easing: EASE },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 1 },
        ], { duration: DURATION, fill: 'forwards' }));
      } catch (err) {
        finish();
        return;
      }

      Promise.all(anims.map((a) => a.finished)).then(finish).catch(finish);
    }

    // La medición del texto real (arriba, en start()) sólo es exacta con
    // la tipografía final ya cargada: medir antes, con la fuente de
    // reemplazo del navegador, hace que el clon aterrice mal (se mide un
    // ancho de texto que después cambia). Por eso esperamos document.fonts
    // .ready ANTES de medir — pero con un techo: si tarda más de
    // FONT_WAIT_CEILING (una red muy lenta, o la fuente no carga),
    // preferimos no mostrar nada a mostrar una entrada con la posición
    // mal calculada. El presupuesto total (espera + animación) se ajusta
    // para no acercarse nunca al máximo de 1,5s pedido.
    const introRequestedAt = (window.performance && performance.now) ? performance.now() : Date.now();
    const TOTAL_BUDGET = 1350; // ms — deja margen real bajo el máximo de 1500ms
    const FONT_WAIT_CEILING = 900; // ms

    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    const fontsOutcome = Promise.race([
      fontsReady.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), FONT_WAIT_CEILING)),
    ]);

    fontsOutcome.then((fontsOk) => {
      if (!fontsOk) { finish(); return; } // muy lento: mejor no mostrar nada a mostrarlo mal
      const now = (window.performance && performance.now) ? performance.now() : Date.now();
      const elapsed = now - introRequestedAt;
      const duration = Math.max(500, Math.min(1000, TOTAL_BUDGET - elapsed));
      start(duration);
    }, finish);
  }

  function init() {
    const data = window.CV_DATA;
    if (!data) {
      console.error('cv.js: no se encontró window.CV_DATA. Revisá el bloque de datos del jugador en el <head>.');
      return;
    }
    applyClubTheme(data);
    renderPhoto(data);
    renderFacts(data);
    renderPitch(data);
    renderVideo(data);
    initIntro(data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
