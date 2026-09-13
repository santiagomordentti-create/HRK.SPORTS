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

  // Cancha vertical, arco propio abajo: x 0–100 (ancho), y 0–150 (largo,
  // 0=arco rival arriba, 150=arco propio abajo). "Izquierda"/"derecha" de
  // cada posición siguen siendo las del jugador mirando hacia el arco
  // rival (hacia arriba del dibujo) — un lateral izquierdo queda a la
  // izquierda del gráfico, un lateral derecho a la derecha; eso no cambió
  // al pasar de horizontal a vertical, sólo cambiaron x/y. (Se obtienen
  // rotando 90° la tabla horizontal anterior: nuevo_x = viejo_y,
  // nuevo_y = 150 − viejo_x.)
  const POSITION_COORDS = {
    'arquero': { x: 50, y: 140, zone: 'bajo el arco propio' },
    'defensor central': { x: 50, y: 126, zone: 'el centro del último tercio' },
    'central': { x: 50, y: 126, zone: 'el centro del último tercio' },
    'lateral derecho': { x: 82, y: 120, zone: 'la banda derecha del último tercio' },
    'lateral izquierdo': { x: 18, y: 120, zone: 'la banda izquierda del último tercio' },
    'carrilero derecho': { x: 85, y: 95, zone: 'la banda derecha, cerca del mediocampo' },
    'carrilero izquierdo': { x: 15, y: 95, zone: 'la banda izquierda, cerca del mediocampo' },
    'volante defensivo': { x: 50, y: 95, zone: 'el centro, delante de la defensa' },
    'mediocampista defensivo': { x: 50, y: 95, zone: 'el centro, delante de la defensa' },
    'volante central': { x: 50, y: 75, zone: 'el centro de la cancha' },
    'mediocampista central': { x: 50, y: 75, zone: 'el centro de la cancha' },
    'centrocampista': { x: 50, y: 75, zone: 'el centro de la cancha' },
    'volante por derecha': { x: 80, y: 75, zone: 'la banda derecha, en la mitad de la cancha' },
    'volante por izquierda': { x: 20, y: 75, zone: 'la banda izquierda, en la mitad de la cancha' },
    'interior derecho': { x: 78, y: 75, zone: 'la banda derecha, en la mitad de la cancha' },
    'interior izquierdo': { x: 22, y: 75, zone: 'la banda izquierda, en la mitad de la cancha' },
    'mediapunta': { x: 50, y: 50, zone: 'el centro del último tercio ofensivo' },
    'enganche': { x: 50, y: 50, zone: 'el centro del último tercio ofensivo' },
    'extremo derecho': { x: 85, y: 32, zone: 'la banda derecha del último tercio ofensivo' },
    'extremo izquierdo': { x: 15, y: 32, zone: 'la banda izquierda del último tercio ofensivo' },
    'delantero centro': { x: 50, y: 18, zone: 'el centro del último tercio ofensivo' },
    'centrodelantero': { x: 50, y: 18, zone: 'el centro del último tercio ofensivo' },
    'delantero': { x: 50, y: 18, zone: 'el centro del último tercio ofensivo' },
  };
  const FALLBACK_COORDS = { x: 50, y: 75, zone: 'el centro de la cancha' };

  function coordsFor(position) {
    const key = normalizePosition(position);
    if (POSITION_COORDS[key]) return POSITION_COORDS[key];
    console.warn(`cv.js: la posición "${position}" no tiene coordenadas definidas en POSITION_COORDS; se usa el centro de la cancha por defecto.`);
    return FALLBACK_COORDS;
  }

  function pitchDescription(data, coords) {
    return `Cancha de fútbol vista desde arriba, en forma vertical, con el arco propio abajo y el arco rival arriba. Un círculo con el número ${data.number} marca la posición de ${data.name} en ${coords.zone}: ${data.position}.`;
  }

  // El nombre en grande ya vive en el encabezado de arriba de la página
  // (ver renderHeader) — el CV antes no tenía título propio.
  function renderHeader(data) {
    const nameEl = document.querySelector('[data-cv="header-name"]');
    const metaEl = document.querySelector('[data-cv="header-meta"]');
    if (nameEl) nameEl.textContent = data.name;
    if (metaEl) {
      const club = (data.club && data.club.name) || '';
      metaEl.textContent = `N.º ${data.number}${club ? ' · ' + club : ''}`;
    }
  }

  function renderPhoto(data) {
    const zone = document.querySelector('[data-cv="photo"]');
    if (!zone || !data.photo) return;
    const img = document.createElement('img');
    img.src = data.photo.src;
    img.alt = data.photo.alt || '';
    zone.appendChild(img);

    // Cuando la foto es la propia credencial (data.photo.isCredential),
    // el número, el nombre y el club ya están impresos adentro de la
    // imagen — superponerlos de nuevo no aporta nada, sólo repite lo que
    // ya se ve. Con el nombre además viviendo ahora en el encabezado de
    // arriba, no hace falta ningún texto sobre la foto en ese caso. Eze
    // es distinto: su foto no lleva texto adentro, así que conserva su
    // superposición completa (número, nombre y club). Sin
    // .photo-cap__name real, initIntro no arma nada para aterrizar ahí
    // — la entrada completa queda apagada para los jugadores con
    // credencial, no sólo la marca de agua.
    if (data.photo.isCredential) {
      // La credencial es vertical y el cuadrante ahora es más ancho que
      // alto (ver --panel-ar en cv.css): esta clase cambia el
      // object-fit a contain para que se vea entera, nunca recortada.
      zone.classList.add('zone--photo--credential');
      return;
    }

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
      { k: 'Trayectoria', v: (data.career || []).join(' · ') || null, feature: true },
      { k: 'Nacionalidad', v: data.nationality },
      { k: 'Fecha de nacimiento', v: data.birth },
      { k: 'Pie hábil', v: data.foot },
      { k: 'Altura', v: data.height },
    ];

    const pendingLabels = [];

    rows.forEach((row) => {
      const isPending = row.v === null || row.v === undefined || row.v === '';
      const li = document.createElement('li');
      if (row.feature) li.classList.add('facts__row--feature');
      li.innerHTML = `
        <span class="facts__k">${escapeHtml(row.k)}</span>
        <span class="facts__v${isPending ? ' facts__v--pending' : ''}${row.feature ? ' facts__v--feature' : ''}">${isPending ? '—' : escapeHtml(row.v)}</span>
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

    // Vertical: arco rival arriba (y chico), arco propio abajo (y
    // grande) — viewBox 100×150, girado 90° respecto del dibujo
    // horizontal anterior (ver comentario junto a POSITION_COORDS).
    pitchEl.innerHTML = `
      <svg viewBox="0 0 100 150" aria-hidden="true" focusable="false">
        <rect class="pitch__turf" x="0" y="0" width="100" height="150" rx="3"/>
        <rect class="pitch__line" fill="none" x="3" y="3" width="94" height="144"/>
        <line class="pitch__line" x1="3" y1="75" x2="97" y2="75"/>
        <circle class="pitch__line" fill="none" cx="50" cy="75" r="13"/>
        <rect class="pitch__line" fill="none" x="24" y="3" width="52" height="18"/>
        <rect class="pitch__line" fill="none" x="24" y="129" width="52" height="18"/>
        <circle class="pitch__marker" cx="${coords.x}" cy="${coords.y}" r="9"/>
        <text class="pitch__number" x="${coords.x}" y="${coords.y}" text-anchor="middle" dominant-baseline="central">${escapeHtml(String(data.number))}</text>
      </svg>
    `;
    if (descEl) descEl.textContent = pitchDescription(data, coords);
  }

  // El cuadrante de la cancha comunicaba un solo dato (la posición, que
  // encima ya está repetida en la ficha) usando el 25% de la página.
  // Las estadísticas de temporada van acá abajo para equilibrar ese
  // peso, no como un bloque nuevo. Son opcionales: si data.stats no
  // existe (todavía no hay datos de un jugador) esta función no crea
  // nada — nada de ceros ni de "sin datos" de relleno. Goles recibidos
  // y vallas invictas sólo aparecen si esos campos están presentes
  // (en la práctica, sólo un arquero los va a tener).
  function renderPitchStats(data) {
    const el = document.querySelector('[data-cv="pitch-stats"]');
    if (!el || !data.stats) return;

    const items = [
      { value: data.stats.matches, label: 'Partidos' },
      { value: data.stats.minutes, label: 'Minutos' },
    ];
    if (data.stats.goalsConceded !== undefined && data.stats.goalsConceded !== null) {
      items.push({ value: data.stats.goalsConceded, label: 'Goles recibidos' });
    }
    if (data.stats.cleanSheets !== undefined && data.stats.cleanSheets !== null) {
      items.push({ value: data.stats.cleanSheets, label: 'Vallas invictas' });
    }

    el.innerHTML = items.map((i) => `
      <div class="pitch-stats__item">
        <span class="pitch-stats__value">${escapeHtml(String(i.value))}</span>
        <span class="pitch-stats__label">${escapeHtml(i.label)}</span>
      </div>
    `).join('');
  }

  // Sin silencio no hay autoplay en ningún navegador, así que el video
  // arranca muted siempre. El botón de sonido no depende del navegador
  // para su ícono: cv.js lo dibuja según video.muted, así funciona
  // igual en los cuatro. El cuadrante NO toma su tamaño del video (ver
  // --panel-ar en cv.css: es el mismo para los cuatro paneles, no
  // depende de si el archivo ya cargó) — adentro, object-fit:contain
  // muestra el video completo sin recortarlo ni deformarlo, sea cual
  // sea su proporción real.
  function renderVideo(data) {
    const zone = document.querySelector('[data-cv="video"]');
    if (!zone) return;
    if (data.video && data.video.src) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const video = document.createElement('video');
      video.src = data.video.src;
      if (data.video.poster) video.poster = data.video.poster;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('aria-label', data.video.alt || `Highlights de ${data.name}`);
      if (!reduceMotion) video.autoplay = true;

      const soundBtn = document.createElement('button');
      soundBtn.type = 'button';
      soundBtn.className = 'video-sound';
      const ICON_MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>';
      const ICON_UNMUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a9 9 0 0 1 0 12"/></svg>';
      const updateSoundBtn = () => {
        soundBtn.setAttribute('aria-label', video.muted ? 'Activar el sonido' : 'Silenciar el video');
        soundBtn.innerHTML = video.muted ? ICON_MUTED : ICON_UNMUTED;
      };
      updateSoundBtn();
      soundBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        updateSoundBtn();
      });

      zone.appendChild(video);
      zone.appendChild(soundBtn);

      // Con movimiento reducido no arranca solo: se ve la portada y un
      // botón grande de reproducir. Ese primer play sí es un gesto del
      // usuario, pero lo dejamos igual muted — es el mismo video en los
      // dos casos, el botón de sonido de arriba es lo que lo activa.
      if (reduceMotion) {
        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'video-play';
        playBtn.setAttribute('aria-label', `Reproducir highlights de ${data.name}`);
        playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
        playBtn.addEventListener('click', () => {
          video.play();
          playBtn.remove();
        });
        zone.appendChild(playBtn);
      }
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

  // Sale entero de CV_DATA — sumar un jugador nuevo no toca esta función,
  // hereda el mismo Person automáticamente. Sólo van los campos ya
  // confirmados: nacionalidad, fecha de nacimiento, pie hábil y altura
  // quedan pendientes (null en CV_DATA) y por eso no tienen equivalente
  // en schema.org acá — no hay que inventarlos para completar el bloque.
  const SITE_ORIGIN = 'https://www.hrk-sports.com';
  function renderStructuredData(data) {
    const pageUrl = SITE_ORIGIN + location.pathname.replace(/\.html$/, '');
    const person = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: data.name,
      url: pageUrl,
    };
    if (data.photo && data.photo.src) {
      person.image = new URL(data.photo.src, SITE_ORIGIN + location.pathname).href;
    }
    if (data.position) person.jobTitle = data.position;
    if (data.club && data.club.name) {
      person.affiliation = { '@type': 'SportsTeam', name: data.club.name };
    }
    if (data.instagram && data.instagram.url) {
      person.sameAs = [data.instagram.url];
    }
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(person);
    document.head.appendChild(script);
  }

  // Número de HRK, no del jugador — vive acá (plantilla), no en
  // CV_DATA, porque es el mismo para los cuatro y para los que vengan.
  const HRK_WHATSAPP_DIGITS = '5492494577556'; // +54 9 2494 57-7556, sin signos, formato wa.me
  const HRK_WHATSAPP_DISPLAY = '+54 9 2494 57-7556';

  // La franja de contacto está pensada para quien YA vio el perfil —un
  // club o un representante— no para el jugador. El mensaje de
  // WhatsApp sale entero de CV_DATA.name, nada tipeado fijo por
  // jugador.
  function renderContact(data) {
    const lede = document.querySelector('[data-cv="contact-lede"]');
    const cta = document.querySelector('[data-cv="contact-cta"]');
    const ctaLabel = document.querySelector('[data-cv="contact-cta-label"]');
    const printText = document.querySelector('[data-cv="contact-print"]');

    if (lede) {
      lede.textContent = `¿Sos de un club o representás a un jugador y querés más información sobre ${data.name}? Escribinos.`;
    }
    if (cta) {
      const message = `Hola HRK Sports, vi el perfil de ${data.name} y quiero más información.`;
      cta.href = `https://wa.me/${HRK_WHATSAPP_DIGITS}?text=${encodeURIComponent(message)}`;
    }
    if (ctaLabel) ctaLabel.textContent = 'Hablar con HRK Sports';
    // Sólo se ve al imprimir (ver cv.css): en papel un botón no se toca,
    // así que ahí el dato de contacto tiene que quedar como texto.
    if (printText) printText.textContent = `Contacto: WhatsApp ${HRK_WHATSAPP_DISPLAY}`;
  }

  // Compartir: menú nativo del sistema en celular; copiar el enlace y
  // avisar en computadora. navigator.share por sí solo NO alcanza para
  // distinguir uno de otro: Chrome y Safari de escritorio en Mac
  // también lo implementan (abren el panel de compartir del sistema
  // operativo), así que una compu con ese navegador pasaría por acá
  // como si fuera celular. Lo que de verdad distingue "celular" es el
  // puntero: grosero (dedo, sin precisión) en celular/tablet, fino
  // (mouse o trackpad) en computadora. Si el navegador no tiene
  // navigator.share, o si copiar falla, siempre cae en copiar el
  // enlace. Descargar: imprimir del navegador, para que el usuario lo
  // guarde como PDF (ver la hoja de estilos de impresión en cv.css). El
  // contenedor ya deja lugar para sumar un tercer botón (idioma) más
  // adelante sin rehacer nada: es un flex con gap, cualquier <button>
  // nuevo entra en la fila sin tocar los que ya están.
  function renderActions(data) {
    const shareBtn = document.querySelector('[data-cv-action="share"]');
    const printBtn = document.querySelector('[data-cv-action="print"]');
    const toast = document.querySelector('[data-cv="actions-toast"]');
    let toastTimer = null;

    function showToast(text) {
      if (!toast) return;
      toast.textContent = text;
      toast.classList.add('is-visible');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.classList.remove('is-visible'); }, 2500);
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const shareData = { title: `${data.name} | HRK Sports`, url: location.href };
        const isMobileLike = window.matchMedia('(pointer: coarse)').matches;
        if (navigator.share && isMobileLike) {
          try { await navigator.share(shareData); } catch (err) { /* el usuario canceló el menú del sistema */ }
          return;
        }
        try {
          await navigator.clipboard.writeText(location.href);
          showToast('Enlace copiado');
        } catch (err) {
          if (navigator.share) {
            try { await navigator.share(shareData); } catch (err2) { /* el usuario canceló el menú del sistema */ }
            return;
          }
          showToast('No se pudo copiar el enlace');
        }
      });
    }
  }

  // ---------- Entrada "el nombre que se arma" ----------
  // El texto que vuela es una copia exacta del nombre real (mismo texto,
  // misma clase que .cv-header__name, así hereda su tipografía sin
  // copiar nada a mano) para que el aterrizaje sea posible sin salto: el
  // clon arranca grande y centrado y termina en transform:none, que cae
  // exactamente sobre el rect medido del elemento real — no hay que
  // "acertar" una posición a mano. Atrás, una marca de agua gigante con
  // solo el apellido (CV_DATA.lastName) da la idea de "arma el nombre"
  // sin tener que igualar su tipografía a nada. El contenido real (foto,
  // ficha, cancha, video) ya se renderizó antes de llamar a esto y no
  // depende en nada de que esta función corra: si algo acá falla, el CV
  // de abajo queda intacto.
  //
  // Aterriza en el encabezado (.cv-header__name), no en el nombre
  // superpuesto de la foto: antes apuntaba a .photo-cap__name, y como
  // los jugadores con la credencial como foto no tienen ese elemento
  // (se sacó para no repetir el nombre tres veces en el mismo
  // cuadrante), la entrada dejaba de mostrarse para ellos. El
  // encabezado existe siempre, en los cuatro CV.
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

    const targetEl = document.querySelector('.cv-header__name');
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
    flying.className = 'cv-header__name cv-intro__name';
    flying.textContent = targetEl.textContent;

    overlay.appendChild(watermark);
    overlay.appendChild(flying);
    document.body.appendChild(overlay);
    const shownAt = performance.now();

    // Tres tiempos fijos: llegada, reposo (el único momento en que el
    // nombre se puede leer — no puede bajar de 800ms) y viaje. Fijos
    // porque antes se repartían dentro de un presupuesto total que se
    // encogía según cuánto hubiera tardado la fuente en cargar, y eso
    // se comía justo el reposo, el tramo que más importa.
    const ENTRADA_MS = 500;
    const REPOSO_MS = 1100;
    const VIAJE_MS = 700;
    const DURATION = ENTRADA_MS + REPOSO_MS + VIAJE_MS; // 2300ms

    let done = false;
    let anims = [];

    // BUG encontrado (reporte de "a veces corre y a veces no"): finish()
    // hacía dos cosas a la vez — sacar el overlay Y marcar la sesión como
    // "ya la vio" — y se llamaba también desde la rama de "la fuente
    // tardó más que FONT_WAIT_CEILING" (más abajo), que NUNCA llega a
    // llamar a start(): ahí no se armó ninguna animación, no se vio nada,
    // y sin embargo la sesión quedaba marcada como vista para siempre.
    // Con conexión/caché de fuente variable, esa carrera contra 600ms se
    // gana o se pierde de forma inconsistente — coincide exactamente con
    // "a Razzeto nunca la vi, a Neira algunas veces sí y otras no": no es
    // que la entrada fallara al correr, es que muchas veces ni llegaba a
    // arrancar y aun así quedaba marcada como si hubiera corrido. Se
    // separa la limpieza (sacar el overlay, cancelar animaciones) de
    // marcar la sesión: eso último sólo pasa cuando la entrada realmente
    // se mostró completa o el usuario la salteó a propósito, nunca
    // cuando se descarta sin haber llegado a mostrar nada.
    function cleanup() {
      window.removeEventListener('pointerdown', finish, true);
      window.removeEventListener('keydown', finish, true);
      anims.forEach((a) => { try { a.cancel(); } catch (err) {} });
      overlay.remove();
    }

    function finish() {
      if (done) return;
      done = true;
      cleanup();
      markSeen();
      // Sin console.log a propósito (no ensuciar la consola de un usuario
      // real); el dato queda accesible para pruebas/depuración vía esta
      // propiedad, no vía texto impreso.
      window.__hrkCvIntroLastVisibleMs = performance.now() - shownAt;
    }

    // Mismo cierre que finish(), pero para cuando NO se llegó a mostrar
    // nada (la fuente no cargó a tiempo, o falló algo antes de animar):
    // no marca la sesión, para que la entrada se pueda intentar de nuevo
    // la próxima vez.
    function abort() {
      if (done) return;
      done = true;
      cleanup();
    }

    window.addEventListener('pointerdown', finish, true);
    window.addEventListener('keydown', finish, true);

    function start() {
      if (done) return; // se saltó mientras esperábamos las fuentes

      const rect = targetEl.getBoundingClientRect();
      flying.style.left = rect.left + 'px';
      flying.style.top = rect.top + 'px';
      flying.style.width = rect.width + 'px';
      flying.style.height = rect.height + 'px';

      // No asumimos que el centro de la caja del título coincide con el
      // centro visual del texto (con textos cortos en un flex baseline
      // suele coincidir, pero no es una garantía del layout). Medimos el
      // texto real (Range) y fijamos ahí el transform-origin, en px
      // relativos a la propia caja, para que el scale() y el translate()
      // giren siempre alrededor de las letras. Esto no afecta el
      // aterrizaje: a transform:none el transform-origin no cambia nada.
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

      // Curva de los dos tramos de movimiento (la subida y el viaje):
      // easeInOutCubic, simétrica — arranca despacio, acelera al medio,
      // frena despacio. Antes usaban una curva ease-out "expo" (arranque
      // en seco, cola larga) pensada para una entrada corta y snappy;
      // con tramos de 500-700ms esa curva se sentía apurada al arrancar
      // aunque el tiempo total fuera más largo — la sensación de calma
      // depende de la curva, no sólo de la duración.
      const MOVE_EASE = 'cubic-bezier(.65,0,.35,1)';

      // Tres tiempos, fijos (no se acortan según cuánto haya tardado la
      // espera de fuentes de más abajo — eso fue justamente el bug: antes
      // el reposo se comía primero cuando la fuente tardaba, y la entrada
      // terminaba pasando de largo sin dar tiempo a leer el nombre):
      //   llegada (ENTRADA_MS): sube y se arma, centrada y grande.
      //   reposo (REPOSO_MS):   queda del todo quieta — el único momento
      //                         en que el nombre se puede leer.
      //   viaje (VIAJE_MS):     se achica y viaja hasta transform:none,
      //                         que cae exacto sobre el nombre real.
      const entradaEnd = ENTRADA_MS / DURATION;
      const reposoEnd = (ENTRADA_MS + REPOSO_MS) / DURATION;

      // Importante: la curva de aceleración va puesta en CADA keyframe
      // (easing = de ese keyframe al siguiente), no como opción general
      // de .animate(). Una easing general no suaviza cada tramo por
      // separado: deforma la LÍNEA DE TIEMPO completa antes de ubicar
      // los offsets, así que con una curva ease-out el offset del final
      // de la entrada dejaba de caer donde correspondía — pasaba mucho
      // antes, arrastrando con él el reposo y el aterrizaje.
      try {
        anims.push(overlay.animate([
          { opacity: 1, offset: 0 },
          { opacity: 1, offset: reposoEnd },
          { opacity: 0, offset: 1 },
        ], { duration: DURATION, easing: 'linear', fill: 'forwards' }));

        anims.push(watermark.animate([
          { transform: 'translate(-50%,-50%) scale(.55)', opacity: 0, offset: 0, easing: MOVE_EASE },
          { transform: 'translate(-50%,-50%) scale(1)', opacity: .16, offset: entradaEnd, easing: 'linear' },
          { transform: 'translate(-50%,-50%) scale(1)', opacity: .16, offset: reposoEnd, easing: MOVE_EASE },
          { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 0, offset: 1 },
        ], { duration: DURATION, fill: 'forwards' }));

        anims.push(flying.animate([
          { transform: `translate(${dxCenter}px, ${dyBelow}px) scale(${scale})`, opacity: 0, offset: 0, easing: 'ease-out' },
          { transform: `translate(${dxCenter}px, ${dyBelow}px) scale(${scale})`, opacity: 1, offset: entradaEnd * 0.15, easing: MOVE_EASE },
          { transform: `translate(${dxCenter}px, ${dyCenter}px) scale(${scale})`, opacity: 1, offset: entradaEnd, easing: 'linear' },
          { transform: `translate(${dxCenter}px, ${dyCenter}px) scale(${scale})`, opacity: 1, offset: reposoEnd, easing: MOVE_EASE },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 1 },
        ], { duration: DURATION, fill: 'forwards' }));
      } catch (err) {
        abort();
        return;
      }

      Promise.all(anims.map((a) => a.finished)).then(finish).catch(abort);
    }

    // La medición del texto real (arriba, en start()) sólo es exacta con
    // la tipografía final ya cargada: medir antes, con la fuente de
    // reemplazo del navegador, hace que el clon aterrice mal (se mide un
    // ancho de texto que después cambia). Por eso esperamos document.fonts
    // .ready ANTES de medir — pero con un techo: si tarda más de
    // FONT_WAIT_CEILING (una red muy lenta, o la fuente no carga),
    // preferimos no mostrar nada a mostrar una entrada con la posición
    // mal calculada. Los tres tiempos de la animación son fijos (ver
    // ENTRADA_MS/REPOSO_MS/VIAJE_MS en start(), suman 2300ms) — el techo
    // de espera de fuentes deja margen real bajo el máximo de 3s incluso
    // en el peor caso (2300 + 600 = 2900ms).
    const FONT_WAIT_CEILING = 600; // ms
    const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    const fontsOutcome = Promise.race([
      fontsReady.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), FONT_WAIT_CEILING)),
    ]);

    fontsOutcome.then((fontsOk) => {
      // muy lento: no se llegó a mostrar nada, así que no se marca la
      // sesión — abort(), no finish(). Es la causa del bug de "a veces
      // corre y a veces no" (ver el comentario junto a cleanup()/finish()
      // /abort() más arriba).
      if (!fontsOk) { abort(); return; }
      start();
    }, abort);
  }

  function init() {
    const data = window.CV_DATA;
    if (!data) {
      console.error('cv.js: no se encontró window.CV_DATA. Revisá el bloque de datos del jugador en el <head>.');
      return;
    }
    applyClubTheme(data);
    renderHeader(data);
    renderPhoto(data);
    renderFacts(data);
    renderPitch(data);
    renderPitchStats(data);
    renderVideo(data);
    renderStructuredData(data);
    renderContact(data);
    renderActions(data);
    initIntro(data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
