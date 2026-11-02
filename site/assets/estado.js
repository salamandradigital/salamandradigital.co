// Recurso "¿En qué estado está tu proyecto digital?"
// Calcula el estado en el navegador y lo envía a enviar-estado.php (mismo sitio).
// No usa cookies ni almacenamiento del navegador.
(function () {
  'use strict';
  var CAL = 'https://calendly.com/salamandrradigital/evaluacion';
  var ENDPOINT = '../enviar-estado.php';
  var FASES = [
    { k: 'inicio', n: 'Inicio', c: 'Inicio' },
    { k: 'plan', n: 'Planificación', c: 'Plan' },
    { k: 'ejec', n: 'Ejecución', c: 'Ejecución' },
    { k: 'seg', n: 'Seguimiento y control', c: 'Seguimiento' },
    { k: 'cierre', n: 'Cierre', c: 'Cierre' }
  ];
  var SCLS = { ok: 's-ok', warn: 's-warn', bad: 's-bad' };
  var SLBL = { ok: 'Bien', warn: 'Débil', bad: 'Roto' };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lines(t) { return (t || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }

  function iniciar() {
    var f = $('f');
    if (!f) return;
    function radio(name) { var el = f.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
    function setRadio(name, v) { var el = f.querySelector('input[name="' + name + '"][value="' + v + '"]'); if (el) el.checked = true; }

    $('avance').addEventListener('input', function (e) { $('avanceVal').textContent = e.target.value + '%'; });

    $('btnEjemplo').addEventListener('click', function () {
      var hoy = new Date();
      $('tipo').value = 'Web nueva o rediseño';
      $('nombre').value = 'Web nueva (ejemplo)';
      $('inicio').value = iso(addDays(hoy, -120));
      $('entrega').value = iso(addDays(hoy, -30));
      $('avance').value = 55; $('avanceVal').textContent = '55%';
      setRadio('alcance', 'medio'); setRadio('resp', 'yo'); setRadio('crono', 'medio'); setRadio('duenos', 'medio');
      $('hecho').value = 'Dominio y hosting comprados\nTextos de la página de inicio\nLogo aprobado';
      $('falta').value = 'Fotos del equipo\nPágina de servicios\nFormulario de contacto conectado';
      $('prov').value = '2';
      setRadio('rev', 'acuerdo');
      $('trabado').value = 'El diseñador no avanza porque está esperando las fotos, y el fotógrafo no tiene fecha.';
      setRadio('cierre', 'no');
      $('decisiones').value = 'Elegir entre las dos propuestas de diseño\nAprobar el presupuesto de fotos';
      $('notaEjemplo').hidden = false; $('btnLimpiar').hidden = false;
    });
    $('btnLimpiar').addEventListener('click', function () {
      f.reset(); $('avanceVal').textContent = '40%';
      $('notaEjemplo').hidden = true; $('btnLimpiar').hidden = true;
      $('resultado').hidden = true; $('resultado').innerHTML = '';
    });

    function leer() {
      return {
        tipo: $('tipo').value, nombre: $('nombre').value.trim(), inicio: $('inicio').value, entrega: $('entrega').value,
        avance: Number($('avance').value), alcance: radio('alcance'), resp: radio('resp'), crono: radio('crono'), duenos: radio('duenos'),
        hecho: lines($('hecho').value), falta: lines($('falta').value), prov: Number($('prov').value), rev: radio('rev'),
        trabado: $('trabado').value.trim(), cierre: radio('cierre'), decisiones: lines($('decisiones').value), relato: $('relato').value.trim(),
        lnombre: $('lnombre').value.trim(), lcorreo: $('lcorreo').value.trim(), lnegocio: $('lnegocio').value.trim(),
        lwhatsapp: $('lwhatsapp').value.trim(), lconsent: $('lconsent').checked, lweb: $('lweb').value
      };
    }

    function evaluar(d) {
      var st = {}, why = {};
      if (d.alcance === 'si' && d.resp === 'si') { st.inicio = 'ok'; why.inicio = 'El alcance está escrito y hay alguien que responde por el avance.'; }
      else if (d.alcance === 'no' || d.resp === 'no') {
        st.inicio = 'bad'; why.inicio = d.alcance === 'no'
          ? 'No está escrito qué incluye el proyecto. Cada persona trabaja sobre su propia idea de lo que hay que entregar.'
          : 'Nadie en concreto responde por el avance. Las tareas existen, pero nadie empuja el conjunto.';
      } else {
        st.inicio = 'warn'; why.inicio = d.resp === 'yo'
          ? 'La responsabilidad del avance recae en ti, además de todo lo demás. Cuando tu agenda se llena, el proyecto se detiene.'
          : 'El alcance existe a medias. Lo que no está escrito se vuelve a discutir en cada reunión.';
      }
      if (d.crono === 'si' && d.duenos === 'si') { st.plan = 'ok'; why.plan = 'Hay cronograma y cada tarea tiene responsable.'; }
      else if ((d.crono === 'no' && d.duenos !== 'si') || d.duenos === 'no') { st.plan = 'bad'; why.plan = 'No hay fechas por tarea o las tareas no tienen dueño. Lo que no tiene dueño ni fecha no avanza.'; }
      else {
        st.plan = 'warn'; why.plan = d.crono === 'medio'
          ? 'Solo existe la fecha final. Sin fechas intermedias, el retraso se descubre cuando ya es tarde.'
          : 'Algunas tareas tienen dueño y otras no. Las que no lo tienen son las que se quedan quietas.';
      }
      var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      var ini = d.inicio ? new Date(d.inicio + 'T00:00:00') : null;
      var ent = d.entrega ? new Date(d.entrega + 'T00:00:00') : null;
      var fe = {};
      if (ini && ent && ent > ini) {
        fe.total = Math.round((ent - ini) / 864e5);
        var trans = Math.round((hoy - ini) / 864e5);
        fe.trans = Math.max(0, trans);
        fe.tiempo = Math.max(0, Math.min(100, Math.round(trans / fe.total * 100)));
        fe.retraso = Math.round((hoy - ent) / 864e5);
        if (fe.retraso > 0 && d.avance < 100) { st.ejec = 'bad'; why.ejec = 'La fecha de entrega pasó hace ' + fe.retraso + ' días y el proyecto va en ' + d.avance + '%.'; }
        else if (d.avance >= fe.tiempo - 10) { st.ejec = 'ok'; why.ejec = 'El avance va al ritmo del tiempo consumido.'; }
        else if (d.avance >= fe.tiempo - 30) { st.ejec = 'warn'; why.ejec = 'Se ha consumido el ' + fe.tiempo + '% del tiempo y va en ' + d.avance + '% de avance.'; }
        else { st.ejec = 'bad'; why.ejec = 'Se ha consumido el ' + fe.tiempo + '% del tiempo y solo va en ' + d.avance + '%. Con este ritmo, la fecha no se cumple.'; }
      } else { st.ejec = 'warn'; why.ejec = 'Sin fecha de inicio y de entrega no se puede medir si el avance va a tiempo.'; }
      if (d.rev === 'semana') { st.seg = 'ok'; why.seg = 'El avance se revisa cada semana.'; }
      else if (d.rev === 'mes') {
        st.seg = d.prov >= 2 ? 'bad' : 'warn'; why.seg = d.prov >= 2
          ? 'Con ' + (d.prov >= 3 ? 'tres o más' : 'dos') + ' proveedores, revisar una vez al mes deja semanas sin coordinación entre ellos.'
          : 'Revisar una vez al mes deja pasar cuatro semanas antes de corregir un retraso.';
      } else { st.seg = 'bad'; why.seg = 'El avance se revisa cuando alguien se acuerda, o no se revisa. Así los retrasos se descubren cuando ya pasaron.'; }
      if (d.cierre === 'si') { st.cierre = 'ok'; why.cierre = 'Está definido qué tiene que estar listo para entregar.'; }
      else if (d.cierre === 'medio') { st.cierre = 'warn'; why.cierre = 'La entrega está definida a medias. Cada vez que se acerca, aparece algo más que hacer.'; }
      else { st.cierre = 'bad'; why.cierre = 'No está definido cómo sabrás que terminó. Un proyecto sin criterio de entrega no se cierra: se abandona.'; }

      var PASOS = {
        inicio: d.alcance !== 'si'
          ? 'Escribe en una página qué incluye el proyecto, qué no incluye y qué depende de ti. Compártela con todas las personas involucradas.'
          : 'Nombra a una persona responsable de que el proyecto avance. Si eres tú, bloquea en tu agenda el tiempo para hacerlo.',
        plan: 'Haz la lista de lo que falta y ponle a cada tarea un nombre y una fecha.',
        ejec: 'Recalcula la fecha de entrega con lo que falta de verdad y comunícala a todos, aunque no sea la que esperabas.',
        seg: d.prov >= 2
          ? 'Fija una revisión semanal de 30 minutos y pide a cada proveedor un reporte corto antes de ella: qué hizo, qué sigue, qué lo frena.'
          : 'Fija una revisión semanal de 30 minutos, el mismo día y a la misma hora: qué se hizo, qué sigue, qué está trabado.',
        cierre: 'Define por escrito qué tiene que estar listo para dar el proyecto por entregado.'
      };
      var reds = FASES.filter(function (x) { return st[x.k] === 'bad'; }).map(function (x) { return x.k; });
      var yellows = FASES.filter(function (x) { return st[x.k] === 'warn'; }).map(function (x) { return x.k; });
      var pasos = [];
      reds.forEach(function (k, i) {
        pasos.push(PASOS[k]);
        if (i === 0 && d.decisiones.length) pasos.push('Toma primero las ' + d.decisiones.length + ' decisiones que esperan por ti. Mientras no las tomes, el resto del equipo no puede avanzar.');
      });
      if (!reds.length && d.decisiones.length) pasos.push('Toma primero las decisiones que esperan por ti. Mientras no las tomes, el resto del equipo no puede avanzar.');
      yellows.forEach(function (k) { pasos.push(PASOS[k]); });
      if (!pasos.length) pasos.push('Mantén la revisión semanal y protege la fecha de entrega: el riesgo ahora es aflojar lo que ya funciona.');

      function idx(k) { for (var i = 0; i < FASES.length; i++) if (FASES[i].k === k) return i; return -1; }
      var atasco, r0 = reds[0];
      if (!r0) atasco = yellows.length
        ? 'No hay un punto roto, pero hay ' + yellows.length + (yellows.length === 1 ? ' fase débil' : ' fases débiles') + '. Lo que hoy es amarillo es lo que mañana frena la entrega.'
        : 'El proyecto tiene la estructura que necesita. El trabajo ahora es sostenerla hasta la entrega.';
      else if (idx(r0) < idx('ejec') && st.ejec !== 'ok')
        atasco = 'El problema se nota en la ejecución, pero nace en ' + FASES[idx(r0)].n.toLowerCase() + '. Empujar más la ejecución sin arreglar eso suele traer más retraso, no menos.';
      else atasco = 'El punto más débil está en ' + FASES[idx(r0)].n.toLowerCase() + '. Empieza por ahí antes de pedir más velocidad.';

      var global = reds.length === 0 ? (yellows.length ? { t: 'En camino, con fases débiles', s: 'warn' } : { t: 'En camino', s: 'ok' })
        : reds.length <= 2 ? { t: 'En riesgo', s: 'warn' } : { t: 'Atascado', s: 'bad' };
      return { st: st, why: why, pasos: pasos.slice(0, 3), atasco: atasco, fechas: fe, global: global };
    }

    function textoPlano(d, r) {
      var out = [];
      out.push('ESTADO DEL PROYECTO: ' + (d.nombre || 'Mi proyecto') + (d.tipo ? ' (' + d.tipo + ')' : ''));
      out.push('Estado general: ' + r.global.t);
      FASES.forEach(function (x) { out.push('- ' + x.n + ': ' + SLBL[r.st[x.k]] + '. ' + r.why[x.k]); });
      out.push(''); out.push('Dónde está atascado: ' + r.atasco);
      if (d.decisiones.length) { out.push(''); out.push('Decisiones que esperan por mí:'); d.decisiones.forEach(function (x) { out.push('- ' + x); }); }
      out.push(''); out.push('Siguientes pasos:'); r.pasos.forEach(function (p, i) { out.push((i + 1) + '. ' + p); });
      return out.join('\n');
    }

    function render(d, r, envio) {
      var R = $('resultado'), fe = r.fechas, h = '';
      h += '<div class="estado__card"><div class="estado__top"><div><span class="kicker">Estado de</span><h2>' + esc(d.nombre || 'tu proyecto') + '</h2></div>'
        + '<span class="estado__pill ' + SCLS[r.global.s] + '">' + r.global.t + '</span></div>';
      h += '<ol class="estado__cadena" aria-label="Estado por fase">' + FASES.map(function (x, i) {
        return '<li><span class="estado__aro ' + SCLS[r.st[x.k]] + '">' + (i + 1) + '</span>' + x.c + '</li>';
      }).join('') + '</ol>';
      h += '<div class="estado__fases">' + FASES.map(function (x) {
        return '<div class="estado__fase"><span class="estado__punto ' + SCLS[r.st[x.k]] + '"></span><div><h3>' + x.n + ' · <span class="' + SCLS[r.st[x.k]] + '">' + SLBL[r.st[x.k]] + '</span></h3><p>' + esc(r.why[x.k]) + '</p></div></div>';
      }).join('') + '</div></div>';

      if (fe.total) {
        var pasada = fe.retraso > 0;
        h += '<div class="estado__card"><h2>Fechas: lo prometido y lo real</h2><div class="estado__datosnum">'
          + '<div class="estado__dato"><span>Duración prevista</span><strong>' + fe.total + '</strong> días</div>'
          + '<div class="estado__dato"><span>Días transcurridos</span><strong>' + fe.trans + '</strong></div>'
          + '<div class="estado__dato"><span>' + (pasada ? 'Días de retraso' : 'Días para la entrega') + '</span><strong' + (pasada ? ' class="s-bad"' : '') + '>' + Math.abs(fe.retraso) + '</strong></div></div>'
          + '<div class="estado__barras"><div class="estado__barra-lbl"><span>Tiempo consumido</span><span>' + fe.tiempo + '%</span></div><div class="estado__barra estado__barra--tiempo"><i data-w="' + fe.tiempo + '"></i></div>'
          + '<div class="estado__barra-lbl"><span>Avance que estimas</span><span>' + d.avance + '%</span></div><div class="estado__barra"><i data-w="' + d.avance + '"></i></div></div></div>';
      }

      h += '<div class="estado__card"><h2>Dónde está atascado de verdad</h2><p class="estado__callout">' + esc(r.atasco) + '</p>';
      if (d.trabado) h += '<p class="note">Lo que tú ves trabado: ' + esc(d.trabado) + '</p>';
      h += '</div>';

      var sinDueno = d.duenos !== 'si' && d.falta.length;
      if (sinDueno || d.decisiones.length) {
        h += '<div class="estado__card">';
        if (d.decisiones.length) h += '<h2>Decisiones que esperan por ti</h2><ul>' + d.decisiones.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
        if (sinDueno) h += '<h3>Lo que falta y puede no tener responsable</h3><p class="note">Revisa que cada una de estas tareas tenga un nombre y una fecha.</p><ul>' + d.falta.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
        h += '</div>';
      }

      h += '<div class="estado__card"><h2>Tus 3 siguientes pasos</h2><ol>' + r.pasos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol></div>';

      h += '<div class="estado__card estado__cta"><h2>Este es el estado. Llevarlo a la entrega es otro trabajo.</h2>'
        + '<p>Si quieres revisarlo con nosotros, agenda la evaluación gratuita de 30 minutos. Llega con este estado y empezamos desde ahí.</p>'
        + '<a class="btn btn--light" href="' + CAL + '" target="_blank" rel="noopener">Agenda tu evaluación gratuita</a></div>';

      h += '<div class="estado__pie"><button type="button" class="btn btn--ghost" id="btnCopiar">Copiar mi estado</button><span class="note" id="copiado" role="status"></span></div>';
      var aviso = envio === 'ok' ? 'Te enviamos una copia a ' + esc(d.lcorreo) + '. Si no la ves en unos minutos, revisa la carpeta de spam. '
        : 'No pudimos enviar la copia a tu correo. Usa el botón Copiar para guardarla. ';
      h += '<p class="note">' + aviso + 'Este estado es orientativo y se basa solo en lo que contaste. No reemplaza una revisión del proyecto con sus responsables.</p>';

      R.innerHTML = h; R.hidden = false;
      // Anchos de las barras por CSSOM: la CSP del sitio no permite atributos style en línea
      Array.prototype.forEach.call(R.querySelectorAll('[data-w]'), function (el) { el.style.width = el.getAttribute('data-w') + '%'; });
      R.scrollIntoView({ block: 'start' });

      $('btnCopiar').addEventListener('click', function () {
        var t = textoPlano(d, r);
        function ok() { $('copiado').textContent = 'Copiado. Pégalo donde lo necesites.'; }
        function manual() {
          var ta = document.createElement('textarea'); ta.className = 'estado__copia'; ta.value = t; ta.readOnly = true;
          $('copiado').textContent = 'Selecciona el texto y cópialo:'; $('copiado').parentNode.appendChild(ta); ta.select();
        }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, manual); else manual();
      });
    }

    function enviar(d, r) {
      var payload = {
        nombre: d.lnombre, correo: d.lcorreo, negocio: d.lnegocio, whatsapp: d.lwhatsapp, autoriza: d.lconsent, sitio_web: d.lweb,
        proyecto: d.nombre, tipo: d.tipo, inicio: d.inicio, entrega: d.entrega, avance: d.avance,
        estado_general: r.global.t,
        fases: FASES.map(function (x) { return SLBL[r.st[x.k]]; }),
        atasco: r.atasco, trabado: d.trabado, decisiones: d.decisiones, hecho: d.hecho, falta: d.falta,
        proveedores: d.prov, relato: d.relato, estado_texto: textoPlano(d, r)
      };
      return fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' })
        .then(function (res) { return res.ok ? res.json() : { ok: false }; })
        .then(function (j) { return j && j.ok ? 'ok' : 'error'; }, function () { return 'error'; });
    }

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = leer(), err = $('err');
      var faltan = ['alcance', 'resp', 'crono', 'duenos', 'rev', 'cierre'].filter(function (k) { return !d[k]; });
      if (faltan.length) { err.textContent = 'Responde las preguntas de opción de las fases 01 a 05 para calcular el estado (' + faltan.length + ' sin responder).'; return; }
      if (d.inicio && d.entrega && d.entrega <= d.inicio) { err.textContent = 'La fecha de entrega tiene que ser posterior a la de inicio.'; return; }
      if (!d.lnombre) { err.textContent = 'Escribe tu nombre para enviarte el estado.'; $('lnombre').focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.lcorreo)) { err.textContent = 'Revisa tu correo: parece incompleto.'; $('lcorreo').focus(); return; }
      if (!d.lconsent) { err.textContent = 'Para enviarte el estado necesitamos tu autorización. Marca la casilla de los datos.'; return; }
      err.textContent = '';
      var r = evaluar(d), btn = $('btnEnviar');
      btn.disabled = true; btn.textContent = 'Calculando tu estado…';
      enviar(d, r).then(function (envio) {
        btn.disabled = false; btn.textContent = 'Ver el estado de mi proyecto';
        render(d, r, envio);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
