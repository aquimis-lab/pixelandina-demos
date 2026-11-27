/* PixelAndina — Demo interactiva: ReseñasQueVenden
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    /* Reseñas semilla: daysAgo permite calcular "nuevas este mes" (<= 30 días). */
    function seedReviews() {
      return [
        { id: "R-01", author: "Valeria Torres", stars: 5, service: "Blanqueamiento",
          text: "Me hice el blanqueamiento y el cambio se nota muchísimo. La doctora explica todo antes de empezar y no sentí nada de dolor.",
          dateLabel: "24 nov 2026", daysAgo: 2, responded: true,
          responseText: "¡Gracias, Valeria! Nos alegra que te haya gustado el resultado. Te esperamos en tu control de los 6 meses. — Clínica Dental Sonríe" },
        { id: "R-02", author: "Andrés Salazar", stars: 5, service: "Limpieza dental",
          text: "Limpieza rápida y sin molestias. Me atendieron a la hora exacta de la cita, que es raro en otros lados.",
          dateLabel: "21 nov 2026", daysAgo: 5, responded: true,
          responseText: "¡Gracias por tu confianza, Andrés! La puntualidad es parte de nuestro compromiso. — Clínica Dental Sonríe" },
        { id: "R-03", author: "María José Paredes", stars: 4, service: "Ortodoncia",
          text: "Voy en el tercer mes de ortodoncia y todo va bien. Solo le doy 4 estrellas porque el parqueadero del edificio se llena rápido.",
          dateLabel: "18 nov 2026", daysAgo: 8, responded: false, responseText: "" },
        { id: "R-04", author: "Kevin Chicaiza", stars: 5, service: "Implante dental",
          text: "Tenía terror al implante y al final fue mucho más tranquilo de lo que imaginé. Precio claro desde la primera consulta, sin sorpresas.",
          dateLabel: "12 nov 2026", daysAgo: 14, responded: false, responseText: "" },
        { id: "R-05", author: "Rosa Jiménez", stars: 2, service: "Consulta y diagnóstico",
          text: "La atención clínica fue buena, pero esperé casi 40 minutos pese a tener cita. Deberían avisar cuando hay atrasos.",
          dateLabel: "9 nov 2026", daysAgo: 17, responded: false, responseText: "" },
        { id: "R-06", author: "Daniela Fuentes", stars: 5, service: "Endodoncia",
          text: "Me salvaron una muela que en otro lado querían sacar. Trabajo impecable y trato muy humano.",
          dateLabel: "2 nov 2026", daysAgo: 24, responded: true,
          responseText: "¡Qué alegría leerte, Daniela! Conservar tu muela era la prioridad. Gracias por recomendarnos. — Clínica Dental Sonríe" },
        { id: "R-07", author: "Jorge Medina", stars: 5, service: "Limpieza dental",
          text: "Llevé a mis dos hijos y los atendieron con mucha paciencia. Desde ahora es la clínica de la familia.",
          dateLabel: "28 oct 2026", daysAgo: 29, responded: false, responseText: "" },
        { id: "R-08", author: "Paola Herrera", stars: 4, service: "Blanqueamiento",
          text: "Buen resultado y buen trato. Me hubiera gustado recibir el presupuesto por escrito antes del tratamiento, pero en general muy satisfecha.",
          dateLabel: "15 oct 2026", daysAgo: 42, responded: true,
          responseText: "Gracias por el comentario, Paola. Tomamos nota: desde ahora todo presupuesto se entrega por escrito antes de iniciar. — Clínica Dental Sonríe" },
        { id: "R-09", author: "Luis Fernando Mora", stars: 5, service: "Ortodoncia",
          text: "Terminamos el tratamiento de mi hija y el resultado es excelente. Cada control puntual y todo explicado con fotos del avance.",
          dateLabel: "30 sep 2026", daysAgo: 57, responded: true,
          responseText: "¡Felicidades a tu hija por su nueva sonrisa, Luis Fernando! Gracias por confiar el proceso completo en nosotros. — Clínica Dental Sonríe" }
      ];
    }

    function seedRequests() {
      return [
        { id: "S-01", client: "Carmen Ruiz", service: "Limpieza dental", status: "Enviada" },
        { id: "S-02", client: "Diego Fernández", service: "Consulta y diagnóstico", status: "Enviada" },
        { id: "S-03", client: "Valeria Torres", service: "Blanqueamiento", status: "Reseña recibida", reviewId: "R-01" }
      ];
    }

    function freshState() {
      return {
        reviews: seedReviews(),
        requests: seedRequests(),
        scans: 37,
        nextReview: 10,
        nextRequest: 4,
        conversions: 0
      };
    }

    function reviewById(state, id) {
      return state.reviews.filter(function (r) { return r.id === id; })[0] || null;
    }

    function requestById(state, id) {
      return state.requests.filter(function (s) { return s.id === id; })[0] || null;
    }

    function round1(n) { return Math.round(n * 10) / 10; }

    function averageOf(state) {
      if (state.reviews.length === 0) return 0;
      var sum = state.reviews.reduce(function (s, r) { return s + r.stars; }, 0);
      return round1(sum / state.reviews.length);
    }

    /* Plantillas de respuesta: "gracias" para reseñas positivas,
       "queja" para reseñas de 1–3 estrellas. */
    var TEMPLATES = {
      gracias: function (r) {
        return "¡Gracias por tu reseña, " + firstName(r.author) + "! Nos alegra que tu experiencia con " +
          r.service.toLowerCase() + " haya sido buena. Te esperamos en tu próxima visita. — Clínica Dental Sonríe";
      },
      queja: function (r) {
        return "Hola, " + firstName(r.author) + ". Lamentamos que tu experiencia no haya sido la esperada y te agradecemos decirlo: " +
          "así podemos mejorar. Escríbenos por WhatsApp para atender tu caso personalmente y buscar una solución. — Clínica Dental Sonríe";
      }
    };

    function firstName(name) {
      return String(name || "").trim().split(/\s+/)[0] || "";
    }

    function suggestedTemplate(r) {
      return r.stars <= 3 ? "queja" : "gracias";
    }

    /* Publica la respuesta a una reseña. */
    function respondReview(state, id, text) {
      var r = reviewById(state, id);
      if (!r) return { ok: false, error: "Esa reseña ya no existe." };
      if (r.responded) return { ok: false, error: "Esa reseña ya tiene respuesta publicada." };
      text = String(text || "").trim();
      if (text.length < 10) return { ok: false, error: "Escribe una respuesta un poco más completa antes de publicarla." };
      r.responded = true;
      r.responseText = text;
      return { ok: true, review: r };
    }

    /* Envía la solicitud de reseña por WhatsApp (simulada). */
    function sendRequest(state, client, service) {
      client = String(client || "").trim();
      service = String(service || "").trim();
      if (client.length < 3) return { ok: false, error: "Escribe el nombre del cliente al que le pedirás la reseña." };
      if (!service) return { ok: false, error: "Elige el servicio que recibió el cliente." };
      var id = "S-" + ("0" + state.nextRequest).slice(-2);
      state.nextRequest += 1;
      var req = { id: id, client: client, service: service, status: "Enviada" };
      state.requests.push(req);
      return { ok: true, request: req };
    }

    /* El cliente dejó su reseña: convierte la solicitud en reseña nueva.
       stars debe ser 4 o 5 (las solicitudes se envían a clientes satisfechos). */
    var CONVERSION_TEXTS = [
      "Llegué por la solicitud que me enviaron y confirmo: excelente atención, todo muy profesional.",
      "Me pidieron mi opinión y la doy con gusto: trato amable, precios claros y sin dolor.",
      "Muy buena experiencia de principio a fin. Recomendado."
    ];

    function convertRequest(state, id, stars) {
      var req = requestById(state, id);
      if (!req) return { ok: false, error: "Esa solicitud ya no existe." };
      if (req.status !== "Enviada") return { ok: false, error: "Esa solicitud ya se convirtió en reseña." };
      stars = parseInt(stars, 10);
      if (stars !== 4 && stars !== 5) return { ok: false, error: "La reseña simulada debe ser de 4 o 5 estrellas." };
      var rid = "R-" + ("0" + state.nextReview).slice(-2);
      state.nextReview += 1;
      var review = {
        id: rid,
        author: req.client,
        stars: stars,
        service: req.service,
        text: CONVERSION_TEXTS[state.conversions % CONVERSION_TEXTS.length],
        dateLabel: "Hoy",
        daysAgo: 0,
        responded: false,
        responseText: ""
      };
      state.conversions += 1;
      state.reviews.unshift(review);
      req.status = "Reseña recibida";
      req.reviewId = rid;
      return { ok: true, request: req, review: review };
    }

    function registerScan(state) {
      state.scans += 1;
      return { ok: true, scans: state.scans };
    }

    function computeKpis(state) {
      return {
        avg: averageOf(state),
        total: state.reviews.length,
        newMonth: state.reviews.filter(function (r) { return r.daysAgo <= 30; }).length,
        requestsSent: state.requests.length,
        pending: state.reviews.filter(function (r) { return !r.responded; }).length,
        scans: state.scans
      };
    }

    return {
      freshState: freshState,
      reviewById: reviewById,
      requestById: requestById,
      averageOf: averageOf,
      TEMPLATES: TEMPLATES,
      suggestedTemplate: suggestedTemplate,
      respondReview: respondReview,
      sendRequest: sendRequest,
      convertRequest: convertRequest,
      registerScan: registerScan,
      computeKpis: computeKpis
    };
  })();

  /* Export para la simulación en Node (en el navegador no se usa). */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = DemoCore;
  }
  if (typeof document === "undefined") return;

  /* ================================================================
     CAPA DOM
     ================================================================ */
  var state = DemoCore.freshState();

  var kpiAvg = document.getElementById("kpiAvg");
  var kpiTotal = document.getElementById("kpiTotal");
  var kpiNewMonth = document.getElementById("kpiNewMonth");
  var kpiRequests = document.getElementById("kpiRequests");
  var kpiPending = document.getElementById("kpiPending");
  var reviewsList = document.getElementById("reviewsList");
  var requestsList = document.getElementById("requestsList");
  var activityList = document.getElementById("activityList");
  var scanCount = document.getElementById("scanCount");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showError(el, msg) {
    el.textContent = msg || "";
    el.classList.toggle("show", !!msg);
  }

  function logActivity(text) {
    var li = document.createElement("li");
    li.textContent = text;
    activityList.insertBefore(li, activityList.firstChild);
    while (activityList.children.length > 6) {
      activityList.removeChild(activityList.lastChild);
    }
  }

  function starsText(n) {
    var s = "";
    for (var i = 1; i <= 5; i++) s += i <= n ? "★" : "☆";
    return s;
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var k = DemoCore.computeKpis(state);
    kpiAvg.textContent = k.avg.toFixed(1) + " ★";
    kpiTotal.textContent = k.total;
    kpiNewMonth.textContent = k.newMonth;
    kpiRequests.textContent = k.requestsSent;
    kpiPending.textContent = k.pending;
    scanCount.textContent = k.scans;
  }

  /* ---------- Reseñas ---------- */
  function renderReviews(highlightId) {
    reviewsList.innerHTML = "";
    if (state.reviews.length === 0) {
      reviewsList.innerHTML = '<p class="empty-note">Todavía no hay reseñas. Envía la primera solicitud desde el panel de la derecha.</p>';
      return;
    }
    state.reviews.forEach(function (r) {
      var card = document.createElement("article");
      card.className = "review-card" + (highlightId && r.id === highlightId ? " new-row" : "");

      var head = document.createElement("div");
      head.className = "review-head";
      head.innerHTML =
        '<span class="avatar" aria-hidden="true">' + escapeHtml(initials(r.author)) + "</span>" +
        '<div class="review-meta">' +
          "<strong>" + escapeHtml(r.author) + "</strong>" +
          '<span class="review-sub">' + escapeHtml(r.service) + " · " + escapeHtml(r.dateLabel) + " · vía reseñas de Google</span>" +
        "</div>" +
        '<span class="stars" aria-label="' + r.stars + ' de 5 estrellas">' + starsText(r.stars) + "</span>" +
        (r.responded
          ? '<span class="badge ok">Respondida</span>'
          : '<span class="badge low">Sin responder</span>');
      card.appendChild(head);

      var text = document.createElement("p");
      text.className = "review-text";
      text.textContent = r.text;
      card.appendChild(text);

      if (r.responded) {
        var resp = document.createElement("div");
        resp.className = "response-box";
        resp.innerHTML = "<strong>Respuesta del negocio:</strong> " + escapeHtml(r.responseText);
        card.appendChild(resp);
      } else {
        card.appendChild(buildRespondBox(r));
      }
      reviewsList.appendChild(card);
    });
  }

  function initials(name) {
    return String(name || "")
      .split(/\s+/)
      .slice(0, 2)
      .map(function (w) { return w.charAt(0).toUpperCase(); })
      .join("");
  }

  function buildRespondBox(r) {
    var box = document.createElement("div");
    box.className = "respond-box";

    var tplRow = document.createElement("div");
    tplRow.className = "tpl-row";
    var label = document.createElement("span");
    label.className = "tpl-label";
    label.textContent = "Plantilla:";
    tplRow.appendChild(label);

    var ta = document.createElement("textarea");
    ta.className = "respond-text";
    ta.rows = 3;
    ta.setAttribute("aria-label", "Texto de la respuesta");
    ta.value = DemoCore.TEMPLATES[DemoCore.suggestedTemplate(r)](r);

    ["gracias", "queja"].forEach(function (key) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-small" + (DemoCore.suggestedTemplate(r) === key ? " active" : "");
      btn.textContent = key === "gracias" ? "🙏 Agradecimiento" : "🤝 Respuesta a queja";
      btn.addEventListener("click", function () {
        ta.value = DemoCore.TEMPLATES[key](r);
        tplRow.querySelectorAll(".btn-small").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
      });
      tplRow.appendChild(btn);
    });
    box.appendChild(tplRow);
    box.appendChild(ta);

    var err = document.createElement("div");
    err.className = "form-error";
    box.appendChild(err);

    var pub = document.createElement("button");
    pub.type = "button";
    pub.className = "btn-primary";
    pub.textContent = "Publicar respuesta";
    pub.addEventListener("click", function () {
      var res = DemoCore.respondReview(state, r.id, ta.value);
      if (!res.ok) { showError(err, res.error); return; }
      logActivity("💬 Respondiste la reseña de " + r.author + " (" + r.stars + " ★). Responder todas las reseñas mejora tu posición en Google.");
      renderAll(null);
    });
    box.appendChild(pub);
    return box;
  }

  /* ---------- Solicitudes ---------- */
  function renderRequests(highlightId) {
    requestsList.innerHTML = "";
    if (state.requests.length === 0) {
      requestsList.innerHTML = '<li class="fine"><strong>Sin solicitudes todavía.</strong><span class="alert-meta">Envía la primera con el formulario de arriba.</span></li>';
      return;
    }
    state.requests.slice().reverse().forEach(function (req) {
      var li = document.createElement("li");
      if (highlightId && req.id === highlightId) li.className = "new-req";
      var badge = req.status === "Reseña recibida"
        ? '<span class="badge ok">Reseña recibida ✓</span>'
        : '<span class="badge low">Enviada</span>';
      li.innerHTML =
        "<strong>" + escapeHtml(req.client) + "</strong> " + badge +
        '<span class="alert-meta">' + escapeHtml(req.service) + " · solicitud " + req.id + "</span>";
      if (req.status === "Enviada") {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-small amber";
        btn.textContent = "⭐ Simular que dejó reseña";
        btn.addEventListener("click", function () { convert(req.id); });
        li.appendChild(btn);
      }
      requestsList.appendChild(li);
    });
  }

  function convert(id) {
    var stars = Math.random() < 0.75 ? 5 : 4;
    var res = DemoCore.convertRequest(state, id, stars);
    if (!res.ok) return;
    logActivity("⭐ ¡Nueva reseña! " + res.review.author + " dejó " + res.review.stars + " estrellas tras su " + res.review.service.toLowerCase() + ". El promedio se actualizó solo.");
    renderAll(res.review.id);
  }

  document.getElementById("requestForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var errEl = document.getElementById("requestError");
    var name = document.getElementById("reqName").value;
    var service = document.getElementById("reqService").value;
    var res = DemoCore.sendRequest(state, name, service);
    if (!res.ok) { showError(errEl, res.error); return; }
    showError(errEl, "");
    logActivity("📲 Solicitud enviada por WhatsApp a " + res.request.client + " (" + res.request.service + "): mensaje breve + enlace directo a reseñas.");
    document.getElementById("reqName").value = "";
    renderAll(null);
    renderRequests(res.request.id);
  });

  /* ---------- QR decorativo (patrón SVG, sin librerías) ---------- */
  function drawQr() {
    var svg = document.getElementById("qrSvg");
    var NS = "http://www.w3.org/2000/svg";
    var size = 25;
    /* Patrón determinista (decorativo): no codifica datos reales. */
    function cellOn(x, y) {
      return ((x * 7 + y * 13 + x * y * 3 + 5) % 9) < 4;
    }
    function inFinder(x, y) {
      return (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
    }
    function finderCell(x, y, ox, oy) {
      var lx = x - ox, ly = y - oy;
      if (lx === 0 || lx === 6 || ly === 0 || ly === 6) return true;
      if (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4) return true;
      return false;
    }
    for (var y = 0; y < size; y++) {
      for (var x = 0; x < size; x++) {
        var on;
        if (inFinder(x, y)) {
          var ox = x >= size - 8 ? size - 7 : 0;
          var oy = y >= size - 8 ? size - 7 : 0;
          var lx2 = x - ox, ly2 = y - oy;
          if (lx2 < 0 || lx2 > 6 || ly2 < 0 || ly2 > 6) on = false;
          else on = finderCell(x, y, ox, oy);
        } else {
          on = cellOn(x, y);
        }
        if (on) {
          var rect = document.createElementNS(NS, "rect");
          rect.setAttribute("x", x);
          rect.setAttribute("y", y);
          rect.setAttribute("width", 1);
          rect.setAttribute("height", 1);
          svg.appendChild(rect);
        }
      }
    }
  }

  document.getElementById("btnScan").addEventListener("click", function () {
    var res = DemoCore.registerScan(state);
    logActivity("🧾 Un cliente escaneó el QR del local (escaneo n.º " + res.scans + "). La tarjeta de recepción está funcionando.");
    renderKpis();
  });

  /* ---------- Render general ---------- */
  function renderAll(highlightReviewId) {
    renderKpis();
    renderReviews(highlightReviewId);
    renderRequests(null);
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = DemoCore.freshState();
    showError(document.getElementById("requestError"), "");
    document.getElementById("reqName").value = "";
    activityList.innerHTML = "<li>🟢 El panel está activo: cada solicitud, respuesta y reseña nueva se refleja al instante.</li>";
    renderAll(null);
  });

  /* ---------- Arranque ---------- */
  drawQr();
  renderAll(null);
})();
