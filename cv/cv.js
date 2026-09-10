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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
