/* PixelAndina — Demo: Asistente Interno de Conocimiento
   Un asistente que responde las preguntas del equipo buscando SOLO en los
   documentos internos de la empresa (políticas, manuales, precios) y cita
   siempre la fuente: documento y sección. Si algo no está en los documentos,
   lo dice con honestidad en vez de inventar.
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    var BUSINESS = "Comercial Vega";

    /* ---------- Los documentos internos de la empresa ---------- */
    var DOCUMENTS = [
      { id: "vacaciones", icon: "🌴", name: "Manual de vacaciones y permisos", updated: "enero 2026",
        sections: ["Días de vacaciones por año", "Cómo solicitar vacaciones", "Permisos personales"] },
      { id: "viaticos", icon: "🧳", name: "Reglamento de viáticos", updated: "febrero 2026",
        sections: ["Montos diarios por ciudad", "Comprobantes y liquidación"] },
      { id: "precios", icon: "🏷️", name: "Lista de precios mayoristas 2026", updated: "noviembre 2026",
        sections: ["Precios por producto", "Descuentos por volumen"] },
      { id: "credito", icon: "💳", name: "Política de crédito a clientes", updated: "octubre 2026",
        sections: ["Requisitos para clientes nuevos", "Plazos y cupos"] },
      { id: "atencion", icon: "🤝", name: "Manual de atención al cliente", updated: "septiembre 2026",
        sections: ["Tiempos de respuesta", "Cambios y devoluciones"] },
      { id: "horarios", icon: "🕗", name: "Horarios y turnos", updated: "enero 2026",
        sections: ["Horario de oficina y bodega", "Turnos de fin de semana"] },
      { id: "devoluciones", icon: "↩️", name: "Procedimiento de devoluciones", updated: "agosto 2026",
        sections: ["Pasos para registrar una devolución", "Plazos de resolución"] },
      { id: "seguridad", icon: "🦺", name: "Guía de seguridad en bodega", updated: "julio 2026",
        sections: ["Equipo de protección obligatorio", "Reporte de incidentes"] }
    ];

    /* ---------- Base de respuestas: pregunta → respuesta + fuente ----------
       `claves` son frases (ya normalizadas, sin tildes) que disparan la
       respuesta cuando aparecen en la pregunta del usuario. */
    var QA = [
      {
        pregunta: "¿Cuántos días de vacaciones me corresponden al año?",
        claves: ["dias de vacaciones", "cuantos dias", "vacaciones me corresponden", "vacaciones al ano", "vacaciones por ano"],
        respuesta: "Te corresponden 15 días calendario de vacaciones por cada año completo de trabajo. A partir del quinto año en la empresa sumas 1 día adicional por cada año de antigüedad, hasta un máximo de 30 días.",
        docId: "vacaciones", seccion: "Días de vacaciones por año"
      },
      {
        pregunta: "¿Cómo solicito mis vacaciones?",
        claves: ["como solicito mis vacaciones", "solicitar vacaciones", "pedir vacaciones", "solicito vacaciones", "pido mis vacaciones", "como pido"],
        respuesta: "Pide tus vacaciones con al menos 15 días de anticipación: llena el formulario interno de solicitud, tu jefe directo lo aprueba en un máximo de 3 días laborables y Talento Humano confirma las fechas por correo. Sin esa confirmación, la ausencia cuenta como permiso no pagado.",
        docId: "vacaciones", seccion: "Cómo solicitar vacaciones"
      },
      {
        pregunta: "¿Cuánto es el viático diario para viajar a Quito?",
        claves: ["viatico", "quito", "viajar", "viaje"],
        respuesta: "Para viajes a Quito el viático es de $45 diarios para alimentación y transporte interno. El hospedaje se paga aparte, contra factura, hasta $60 por noche. Para otras ciudades del país el viático diario es de $35. Los viajes dentro de Guayaquil no generan viático.",
        docId: "viaticos", seccion: "Montos diarios por ciudad"
      },
      {
        pregunta: "¿Cuál es el precio mayorista del arroz premium?",
        claves: ["precio mayorista del arroz", "precio del arroz", "arroz premium", "cuanto cuesta el arroz"],
        respuesta: "El arroz premium en saco de 25 lb cuesta $14,80 al por mayor, con compra mínima de 20 sacos. El precio ya incluye el flete dentro de Guayaquil para pedidos de 50 sacos o más.",
        docId: "precios", seccion: "Precios por producto"
      },
      {
        pregunta: "¿Qué descuento hay por compras de más de 100 unidades?",
        claves: ["descuento", "mas de 100", "por volumen", "compras grandes"],
        respuesta: "Los descuentos por volumen son: de 100 a 499 unidades, 5% sobre el precio mayorista; de 500 a 999 unidades, 8%; y desde 1.000 unidades, 12%. El descuento se aplica en la misma factura y no se combina con promociones vigentes.",
        docId: "precios", seccion: "Descuentos por volumen"
      },
      {
        pregunta: "¿A qué hora abre la bodega?",
        claves: ["a que hora abre la bodega", "hora abre", "horario de la bodega", "abre la bodega", "horario bodega"],
        respuesta: "La bodega abre de 07:30 a 17:30 de lunes a viernes y los sábados de 08:00 a 13:00. La oficina administrativa atiende de 08:30 a 18:00 de lunes a viernes. Los despachos a clientes se reciben hasta 30 minutos antes del cierre.",
        docId: "horarios", seccion: "Horario de oficina y bodega"
      },
      {
        pregunta: "¿Cuál es el plazo máximo de crédito para un cliente?",
        claves: ["plazo maximo de credito", "plazo de credito", "dias de credito", "credito para un cliente", "maximo de credito"],
        respuesta: "El plazo máximo de crédito es de 45 días para clientes con más de un año de historial y pagos puntuales. Los clientes nuevos tienen un plazo máximo de 15 días durante sus primeras tres compras. Ningún crédito puede superar el cupo aprobado del cliente.",
        docId: "credito", seccion: "Plazos y cupos"
      },
      {
        pregunta: "¿Qué necesita un cliente nuevo para comprar a crédito?",
        claves: ["cliente nuevo", "requisitos para", "comprar a credito", "dar credito", "necesita un cliente"],
        respuesta: "Un cliente nuevo necesita: copia del RUC actualizado, cédula del representante legal, dos referencias comerciales verificables y su primera compra pagada de contado. Con eso, Talento Comercial aprueba un cupo inicial en máximo 2 días laborables.",
        docId: "credito", seccion: "Requisitos para clientes nuevos"
      },
      {
        pregunta: "¿En cuánto tiempo se resuelve una devolución?",
        claves: ["cuanto tiempo se resuelve una devolucion", "tiempo se resuelve", "resuelve una devolucion", "plazo de devolucion", "demora la devolucion"],
        respuesta: "Una devolución se resuelve en máximo 5 días laborables desde que el producto llega a bodega y pasa la revisión de calidad. Si el producto está en buen estado, se emite nota de crédito o reposición el mismo día de la aprobación.",
        docId: "devoluciones", seccion: "Plazos de resolución"
      },
      {
        pregunta: "¿Qué equipo de protección es obligatorio en la bodega?",
        claves: ["equipo de proteccion", "proteccion es obligatorio", "proteccion en la bodega", "epp", "seguridad en bodega"],
        respuesta: "En bodega es obligatorio usar: casco, guantes de trabajo, chaleco reflectivo y calzado con punta de acero. Para trabajo en altura se suma el arnés con línea de vida. Sin el equipo completo no se puede ingresar a la zona de carga.",
        docId: "seguridad", seccion: "Equipo de protección obligatorio"
      }
    ];

    var NOT_FOUND_TEXT = "Eso no está en los documentos internos que tengo cargados, y prefiero no inventarte una respuesta. " +
      "Te sugiero preguntar directamente a Talento Humano o a tu jefe inmediato; si me cargan el documento con ese tema, podré responderlo al instante.";

    /* ---------- Utilidades ---------- */
    function normalize(text) {
      return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function documentoPorId(id) {
      return DOCUMENTS.filter(function (d) { return d.id === id; })[0] || null;
    }

    function preguntasSugeridas() {
      return QA.map(function (q) { return q.pregunta; });
    }

    /* Puntaje de una entrada: cuántas de sus claves aparecen en la pregunta. */
    function scoreEntry(entry, normalizedQuestion) {
      var score = 0;
      entry.claves.forEach(function (c) {
        if (normalizedQuestion.indexOf(normalize(c)) !== -1) score++;
      });
      return score;
    }

    /* Busca la respuesta en la base documental. Nunca inventa: si ninguna
       clave calza, devuelve encontrada=false con el texto honesto. */
    function buscarRespuesta(pregunta) {
      var nq = normalize(pregunta);
      if (!nq) return { ok: false, error: "Escribe una pregunta primero." };
      var best = null, bestScore = 0;
      QA.forEach(function (entry) {
        var s = scoreEntry(entry, nq);
        if (s > bestScore) { bestScore = s; best = entry; }
      });
      if (!best || bestScore === 0) {
        return { ok: true, encontrada: false, respuesta: NOT_FOUND_TEXT, fuente: null, puntaje: 0 };
      }
      var doc = documentoPorId(best.docId);
      return {
        ok: true,
        encontrada: true,
        respuesta: best.respuesta,
        fuente: doc ? { docId: doc.id, documento: doc.name, seccion: best.seccion } : null,
        puntaje: bestScore
      };
    }

    /* ---------- Estado y estadísticas ---------- */
    function freshState() {
      return { history: [] };
    }

    function registrarPregunta(state, pregunta) {
      var res = buscarRespuesta(pregunta);
      if (!res.ok) return res;
      state.history.push({
        pregunta: String(pregunta || ""),
        encontrada: res.encontrada,
        docId: res.fuente ? res.fuente.docId : null,
        seccion: res.fuente ? res.fuente.seccion : null
      });
      return res;
    }

    function estadisticas(state) {
      var total = state.history.length;
      var respondidas = state.history.filter(function (h) { return h.encontrada; }).length;
      return {
        total: total,
        respondidas: respondidas,
        sinRespuesta: total - respondidas,
        tasa: total ? Math.round(respondidas / total * 100) : 0
      };
    }

    /* Documentos más citados: para saber qué consulta más el equipo. */
    function documentosCitados(state) {
      var map = {};
      state.history.forEach(function (h) {
        if (h.docId) map[h.docId] = (map[h.docId] || 0) + 1;
      });
      return map;
    }

    return {
      BUSINESS: BUSINESS,
      DOCUMENTS: DOCUMENTS,
      QA: QA,
      NOT_FOUND_TEXT: NOT_FOUND_TEXT,
      normalize: normalize,
      documentoPorId: documentoPorId,
      preguntasSugeridas: preguntasSugeridas,
      buscarRespuesta: buscarRespuesta,
      freshState: freshState,
      registrarPregunta: registrarPregunta,
      estadisticas: estadisticas,
      documentosCitados: documentosCitados
    };
  })();

  /* Export para la suite de pruebas en Node (en el navegador no se usa). */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = DemoCore;
  }
  if (typeof document === "undefined") return;

  /* ================================================================
     CAPA DOM
     ================================================================ */
  var C = DemoCore;
  var state = C.freshState();

  var chatBody = document.getElementById("chatBody");
  var chipsWrap = document.getElementById("chipsWrap");
  var chatInput = document.getElementById("chatInput");
  var btnSend = document.getElementById("btnSend");
  var docsList = document.getElementById("docsList");
  var statTotal = document.getElementById("statTotal");
  var statOk = document.getElementById("statOk");
  var statMiss = document.getElementById("statMiss");
  var btnReset = document.getElementById("btnReset");

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function scrollChat() { chatBody.scrollTop = chatBody.scrollHeight; }

  function addUserMessage(text) {
    var div = document.createElement("div");
    div.className = "msg msg-user";
    div.innerHTML = '<div class="bubble">' + escapeHtml(text) + "</div>";
    chatBody.appendChild(div);
    scrollChat();
  }

  function addBotMessage(res) {
    var div = document.createElement("div");
    div.className = "msg msg-bot";
    var html = '<div class="bubble">' + escapeHtml(res.respuesta);
    if (res.saludo) {
      /* saludo inicial: sin bloque de fuente */
    } else if (res.encontrada && res.fuente) {
      html += '<div class="source">📄 Fuente: <strong>' + escapeHtml(res.fuente.documento) +
        '</strong> — sección «' + escapeHtml(res.fuente.seccion) + "»</div>";
    } else {
      html += '<div class="source source-none">Sin fuente: este tema no está en los documentos cargados.</div>';
    }
    html += "</div>";
    div.innerHTML = html;
    chatBody.appendChild(div);
    scrollChat();
  }

  function highlightDoc(docId) {
    var items = docsList.querySelectorAll(".doc-item");
    items.forEach(function (it) {
      it.classList.toggle("cited", it.getAttribute("data-doc") === docId);
    });
  }

  function renderDocs() {
    var cited = C.documentosCitados(state);
    docsList.innerHTML = C.DOCUMENTS.map(function (d) {
      var n = cited[d.id] || 0;
      return '<li class="doc-item" data-doc="' + d.id + '">' +
        '<span class="doc-icon" aria-hidden="true">' + d.icon + "</span>" +
        '<span class="doc-info"><strong>' + escapeHtml(d.name) + "</strong>" +
        "<small>" + d.sections.length + " secciones · actualizado " + d.updated +
        (n ? ' · <span class="doc-cited-count">citado ' + n + (n === 1 ? " vez" : " veces") + "</span>" : "") +
        "</small></span></li>";
    }).join("");
  }

  function renderStats() {
    var st = C.estadisticas(state);
    statTotal.textContent = st.total;
    statOk.textContent = st.respondidas;
    statMiss.textContent = st.sinRespuesta;
  }

  function ask(text) {
    var q = String(text || "").trim();
    if (!q) return;
    addUserMessage(q);
    chatInput.value = "";
    var res = C.registrarPregunta(state, q);
    if (!res.ok) return;
    window.setTimeout(function () {
      addBotMessage(res);
      if (res.fuente) highlightDoc(res.fuente.docId);
      renderDocs();
      renderStats();
      if (res.fuente) highlightDoc(res.fuente.docId);
    }, 300);
  }

  /* Chips con las preguntas precargadas */
  chipsWrap.innerHTML = "";
  C.preguntasSugeridas().forEach(function (q) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = q;
    b.addEventListener("click", function () { ask(q); });
    chipsWrap.appendChild(b);
  });

  btnSend.addEventListener("click", function () { ask(chatInput.value); });
  chatInput.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") { ev.preventDefault(); ask(chatInput.value); }
  });

  btnReset.addEventListener("click", function () {
    state = C.freshState();
    chatBody.innerHTML = "";
    addBotMessage({
      saludo: true,
      encontrada: false,
      respuesta: "Hola, soy el asistente interno de " + C.BUSINESS + ". Pregúntame sobre políticas, manuales o precios: respondo solo con lo que está en los documentos de la empresa y te cito la fuente.",
      fuente: null
    });
    highlightDoc(null);
    renderDocs();
    renderStats();
  });

  /* Arranque */
  addBotMessage({
    saludo: true,
    encontrada: false,
    respuesta: "Hola, soy el asistente interno de " + C.BUSINESS + ". Pregúntame sobre políticas, manuales o precios: respondo solo con lo que está en los documentos de la empresa y te cito la fuente. Prueba con una de las preguntas de abajo 👇",
    fuente: null
  });
  renderDocs();
  renderStats();
})();
