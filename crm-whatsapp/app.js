/* PixelAndina — Demo interactiva: CRM WhatsApp por rubros
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    var STAGES = ["Nuevo", "Contactado", "Interesado", "Cotizado/Agendado", "Cerrado"];

    var TEMPLATE_KEYS = ["saludo", "cotizacion", "recordatorio"];
    var TEMPLATE_LABELS = {
      saludo: "1 · Saludo / seguimiento",
      cotizacion: "2 · Enviar cotización",
      recordatorio: "3 · Recordar cita / visita"
    };

    function msg(from, text, time) { return { from: from, text: text, time: time }; }

    var RUBRO_DATA = {

      /* ---------------- Clínica dental ---------------- */
      clinica: {
        key: "clinica",
        label: "Clínica dental",
        business: "Clínica Dental Sonríe",
        templates: {
          saludo: "Hola {nombre}, te saluda Clínica Dental Sonríe 😊 Gracias por escribirnos. Cuéntanos: ¿en qué te ayudamos hoy con tu sonrisa?",
          cotizacion: "Hola {nombre}, te comparto la cotización de {servicio}. Tenemos facilidades de pago y esta semana la valoración es sin costo. ¿Te agendo una cita?",
          recordatorio: "Hola {nombre}, te recordamos tu cita en Clínica Dental Sonríe para {servicio}. Por favor confírmame tu asistencia respondiendo a este mensaje. ¡Te esperamos!"
        },
        clients: [
          { id: "c1", name: "Carmen Ruiz", phone: "099 555 0101", interest: "Blanqueamiento dental", amount: 120, stage: "Nuevo",
            messages: [ msg("cliente", "Hola, vi su anuncio en Instagram. ¿Cuánto cuesta el blanqueamiento dental?", "09:02") ] },
          { id: "c2", name: "Diego Fernández", phone: "098 555 0102", interest: "Limpieza dental", amount: 25, stage: "Nuevo",
            messages: [ msg("cliente", "Buenas tardes, ¿tienen citas disponibles para este sábado en la mañana?", "10:15") ] },
          { id: "c3", name: "Paola Mendoza", phone: "097 555 0103", interest: "Ortodoncia (brackets)", amount: 900, stage: "Contactado",
            messages: [
              msg("cliente", "Hola, quiero información sobre brackets para mi hija de 14 años.", "Ayer"),
              msg("negocio", "Hola Paola, con gusto. La ortodoncia inicia con una valoración y radiografía. ¿Te envío los detalles?", "Ayer"),
              msg("cliente", "Sí, por favor. ¿Y se puede pagar en cuotas?", "Ayer")
            ] },
          { id: "c4", name: "Andrés Salazar", phone: "099 555 0104", interest: "Implante dental", amount: 650, stage: "Interesado",
            messages: [
              msg("cliente", "Perdí una muela y me hablaron del implante. ¿Es muy costoso?", "Ayer"),
              msg("negocio", "Hola Andrés, el implante completo cuesta $650 e incluye la corona. También lo puedes pagar en 3 cuotas.", "Ayer"),
              msg("cliente", "Me interesa. ¿Qué estudios necesito antes?", "Ayer")
            ] },
          { id: "c5", name: "Lucía Herrera", phone: "098 555 0105", interest: "Diseño de sonrisa", amount: 450, stage: "Cotizado/Agendado",
            messages: [
              msg("cliente", "Quiero hacerme el diseño de sonrisa antes de mi boda 🙏", "Lunes"),
              msg("negocio", "¡Felicidades, Lucía! Te agendé la valoración para el jueves a las 16:00. El diseño completo cuesta $450.", "Lunes"),
              msg("cliente", "Perfecto, el jueves estoy ahí.", "Lunes")
            ] },
          { id: "c6", name: "Jorge Cedeño", phone: "097 555 0106", interest: "Endodoncia", amount: 180, stage: "Cotizado/Agendado",
            messages: [
              msg("cliente", "Tengo un dolor fuerte en una muela desde anoche.", "Lunes"),
              msg("negocio", "Hola Jorge, te agendamos hoy a las 18:30 para revisarte. La endodoncia, si hace falta, cuesta $180.", "Lunes")
            ] },
          { id: "c7", name: "María José Vera", phone: "099 555 0107", interest: "Corona dental", amount: 280, stage: "Cerrado",
            messages: [
              msg("cliente", "Doctora, ya me siento perfecta con la corona. ¡Muchas gracias!", "La semana pasada"),
              msg("negocio", "Qué alegría, María José. Recuerda tu control gratuito en 6 meses. 😊", "La semana pasada")
            ] },
          { id: "c8", name: "Kevin Torres", phone: "098 555 0108", interest: "Limpieza + blanqueamiento", amount: 145, stage: "Cerrado",
            messages: [
              msg("cliente", "Listo, ya hice la transferencia del paquete. Nos vemos el sábado.", "La semana pasada"),
              msg("negocio", "Pago confirmado, Kevin. Tu cita quedó agendada para el sábado a las 10:00.", "La semana pasada")
            ] }
        ],
        reminders: [
          { id: "r1", clientId: "c4", reason: "Enviar plan de financiamiento del implante", date: "Hoy", done: false },
          { id: "r2", clientId: "c5", reason: "Confirmar cita de valoración del jueves 16:00", date: "Mañana", done: false },
          { id: "r3", clientId: "c3", reason: "Responder la duda de cuotas de la ortodoncia", date: "Viernes", done: false }
        ]
      },

      /* ---------------- Tienda de ropa ---------------- */
      tienda: {
        key: "tienda",
        label: "Tienda de ropa",
        business: "Boutique La Percha",
        templates: {
          saludo: "Hola {nombre}, bienvenida a Boutique La Percha 💛 ¿Buscas algo para una ocasión especial o para el día a día?",
          cotizacion: "Hola {nombre}, esto es lo que preparamos para ti: {servicio}. Esta semana, desde 2 prendas tienes 10% de descuento. ¿Te lo reservo?",
          recordatorio: "Hola {nombre}, te guardamos lo que pediste ({servicio}) por 24 horas más. Escríbenos para coordinar el pago y la entrega antes de que se libere."
        },
        clients: [
          { id: "c1", name: "Valeria Castro", phone: "099 555 0201", interest: "Vestido de fiesta", amount: 85, stage: "Nuevo",
            messages: [ msg("cliente", "Holaaa, ¿el vestido rojo de la foto sigue disponible en talla M?", "09:40") ] },
          { id: "c2", name: "Fernanda Ríos", phone: "098 555 0202", interest: "Conjunto para oficina", amount: 110, stage: "Nuevo",
            messages: [ msg("cliente", "Buenas, busco un conjunto formal para una entrevista de trabajo. ¿Qué me recomiendan?", "11:05") ] },
          { id: "c3", name: "Gabriela Pinto", phone: "097 555 0203", interest: "Pedido mayorista · 50 blusas", amount: 600, stage: "Contactado",
            messages: [
              msg("cliente", "Hola, tengo una tiendita y quiero comprar blusas al por mayor.", "Ayer"),
              msg("negocio", "Hola Gabriela, claro que sí. Desde 24 unidades ya es precio mayorista. ¿De qué tallas necesitas?", "Ayer"),
              msg("cliente", "Serían 50 en total, surtidas S, M y L.", "Ayer")
            ] },
          { id: "c4", name: "Daniela Bravo", phone: "099 555 0204", interest: "Traje a medida", amount: 180, stage: "Interesado",
            messages: [
              msg("cliente", "¿Hacen trajes a medida? Es para la graduación de mi esposo.", "Ayer"),
              msg("negocio", "Hola Daniela, sí, trabajamos a medida. El traje completo cuesta $180 e incluye dos pruebas.", "Ayer"),
              msg("cliente", "¿Y en cuánto tiempo lo tienen listo?", "Ayer")
            ] },
          { id: "c5", name: "Nicole Andrade", phone: "098 555 0205", interest: "Vestido de graduación", amount: 95, stage: "Cotizado/Agendado",
            messages: [
              msg("cliente", "Me encantó el vestido verde esmeralda 😍 ¿Me lo pueden apartar?", "Lunes"),
              msg("negocio", "Hola Nicole, te envié la cotización: $95 con ajuste de bastas incluido. Te lo apartamos con el 30%.", "Lunes"),
              msg("cliente", "Sí, mañana paso por la tienda a medírmelo.", "Lunes")
            ] },
          { id: "c6", name: "Camila Ortiz", phone: "097 555 0206", interest: "Renovación de clóset (6 prendas)", amount: 240, stage: "Cotizado/Agendado",
            messages: [
              msg("cliente", "Quiero renovar mi clóset completo, ¿me arman opciones con mi presupuesto de $240?", "Lunes"),
              msg("negocio", "Hola Camila, te armé 3 combinaciones con 6 prendas dentro de tu presupuesto. Te las envié por foto.", "Lunes")
            ] },
          { id: "c7", name: "Stefany Loor", phone: "099 555 0207", interest: "Conjunto deportivo ×3", amount: 75, stage: "Cerrado",
            messages: [
              msg("cliente", "Ya recibí los 3 conjuntos, ¡me quedaron perfectos! Gracias 💛", "La semana pasada"),
              msg("negocio", "Qué bueno, Stefany. Cuando quieras, la nueva colección llega el viernes.", "La semana pasada")
            ] },
          { id: "c8", name: "Andrea Molina", phone: "098 555 0208", interest: "Pedido mayorista · 30 vestidos", amount: 540, stage: "Cerrado",
            messages: [
              msg("cliente", "Confirmado el pedido de los 30 vestidos. Ya hice la transferencia.", "La semana pasada"),
              msg("negocio", "Recibido, Andrea. Tu pedido sale mañana con la guía de envío. ¡Gracias por tu compra!", "La semana pasada")
            ] }
        ],
        reminders: [
          { id: "r1", clientId: "c5", reason: "Enviar fotos de las telas del vestido de graduación", date: "Hoy", done: false },
          { id: "r2", clientId: "c3", reason: "Confirmar el pedido mayorista de 50 blusas", date: "Mañana", done: false },
          { id: "r3", clientId: "c4", reason: "Avisar que llegó la nueva colección para el traje", date: "Viernes", done: false }
        ]
      },

      /* ---------------- Inmobiliaria ---------------- */
      inmobiliaria: {
        key: "inmobiliaria",
        label: "Inmobiliaria",
        business: "Andina Propiedades",
        templates: {
          saludo: "Hola {nombre}, te saluda Andina Propiedades. Gracias por tu interés 🏠 ¿Buscas para vivir o como inversión?",
          cotizacion: "Hola {nombre}, te comparto la ficha completa de {servicio}: fotos, ubicación exacta y opciones de financiamiento bancario. ¿Coordinamos una visita?",
          recordatorio: "Hola {nombre}, te recordamos la visita programada para ver {servicio}. ¿Me confirmas por aquí si sigue en pie? ¡Gracias!"
        },
        clients: [
          { id: "c1", name: "Ricardo Mendoza", phone: "099 555 0301", interest: "Departamento 2 habitaciones", amount: 68000, stage: "Nuevo",
            messages: [ msg("cliente", "Hola, vi el departamento de $68.000 en el portal. ¿Sigue disponible?", "08:50") ] },
          { id: "c2", name: "Carolina Suárez", phone: "098 555 0302", interest: "Casa 3 habitaciones", amount: 95000, stage: "Nuevo",
            messages: [ msg("cliente", "Buenas tardes, buscamos una casa con patio para mudarnos en familia. ¿Tienen opciones?", "10:32") ] },
          { id: "c3", name: "Pablo Guerrero", phone: "097 555 0303", interest: "Terreno en la costa", amount: 35000, stage: "Contactado",
            messages: [
              msg("cliente", "Me interesa el terreno cerca de la playa para construir después.", "Ayer"),
              msg("negocio", "Hola Pablo, es un terreno de 400 m² con escrituras al día. ¿Quieres que te envíe la ubicación y más fotos?", "Ayer"),
              msg("cliente", "Sí, por favor. ¿Y aceptan financiamiento directo?", "Ayer")
            ] },
          { id: "c4", name: "Verónica León", phone: "099 555 0304", interest: "Departamento 3 habitaciones", amount: 82000, stage: "Interesado",
            messages: [
              msg("cliente", "El departamento me gusta, pero necesito vender el mío primero. ¿Cómo sería el proceso?", "Ayer"),
              msg("negocio", "Hola Verónica, te ayudamos con ambas cosas: publicamos el tuyo y reservamos este con una señal.", "Ayer"),
              msg("cliente", "Suena bien. ¿Me envías los requisitos del crédito hipotecario?", "Ayer")
            ] },
          { id: "c5", name: "Martín Aguilar", phone: "098 555 0305", interest: "Casa con jardín", amount: 110000, stage: "Cotizado/Agendado",
            messages: [
              msg("cliente", "La casa con jardín es justo lo que buscamos. ¿Podemos verla el sábado?", "Lunes"),
              msg("negocio", "Hola Martín, visita agendada para el sábado a las 11:00. Te envié la ficha con el precio final: $110.000.", "Lunes"),
              msg("cliente", "Perfecto, ahí estaremos con mi esposa.", "Lunes")
            ] },
          { id: "c6", name: "Sofía Delgado", phone: "097 555 0306", interest: "Oficina en alquiler", amount: 450, stage: "Cotizado/Agendado",
            messages: [
              msg("cliente", "Necesito una oficina pequeña para mi estudio contable. ¿Qué incluye el alquiler?", "Lunes"),
              msg("negocio", "Hola Sofía, son $450 al mes, incluye alícuota y un parqueo. La visita quedó para el miércoles 15:00.", "Lunes")
            ] },
          { id: "c7", name: "Javier Ortiz", phone: "099 555 0307", interest: "Departamento 1 habitación", amount: 52000, stage: "Cerrado",
            messages: [
              msg("cliente", "¡Ya firmamos escrituras! Gracias por todo el acompañamiento.", "La semana pasada"),
              msg("negocio", "Felicidades, Javier. Quedamos atentos para la entrega de llaves el viernes. 🔑", "La semana pasada")
            ] },
          { id: "c8", name: "Elena Vargas", phone: "098 555 0308", interest: "Casa en urbanización", amount: 98000, stage: "Cerrado",
            messages: [
              msg("cliente", "Ya nos mudamos y estamos felices con la casa. ¡Recomendadísimos!", "La semana pasada"),
              msg("negocio", "Qué alegría, Elena. Bienvenidos al barrio. Cualquier cosa, aquí estamos.", "La semana pasada")
            ] }
        ],
        reminders: [
          { id: "r1", clientId: "c5", reason: "Confirmar la visita del sábado a las 11:00", date: "Hoy", done: false },
          { id: "r2", clientId: "c4", reason: "Enviar opciones de financiamiento bancario", date: "Mañana", done: false },
          { id: "r3", clientId: "c3", reason: "Enviar fotos y ubicación exacta del terreno", date: "Viernes", done: false }
        ]
      }
    };

    function deepCopy(o) { return JSON.parse(JSON.stringify(o)); }

    function rubroKeys() { return Object.keys(RUBRO_DATA); }

    function freshState(rubroKey) {
      var d = RUBRO_DATA[rubroKey] || RUBRO_DATA.clinica;
      return {
        rubro: d.key,
        label: d.label,
        business: d.business,
        templates: deepCopy(d.templates),
        clients: deepCopy(d.clients),
        reminders: deepCopy(d.reminders)
      };
    }

    function clientById(state, id) {
      return state.clients.filter(function (c) { return c.id === id; })[0] || null;
    }

    function reminderById(state, id) {
      return state.reminders.filter(function (r) { return r.id === id; })[0] || null;
    }

    function stageIndex(stage) { return STAGES.indexOf(stage); }

    function firstName(name) {
      return String(name || "").trim().split(/\s+/)[0] || "";
    }

    function initials(name) {
      var parts = String(name || "").trim().split(/\s+/);
      var a = parts[0] ? parts[0].charAt(0) : "";
      var b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
      return (a + b).toUpperCase();
    }

    /* Mueve un cliente a una etapa exacta del embudo. */
    function setStage(state, id, stage) {
      var c = clientById(state, id);
      if (!c) return { ok: false, error: "Ese cliente ya no existe." };
      if (STAGES.indexOf(stage) === -1) return { ok: false, error: "Etapa no válida: «" + stage + "»." };
      var from = c.stage;
      c.stage = stage;
      return { ok: true, client: c, from: from, to: stage, changed: from !== stage };
    }

    /* Mueve un cliente una etapa hacia adelante (delta=1) o atrás (delta=-1). */
    function moveStage(state, id, delta) {
      var c = clientById(state, id);
      if (!c) return { ok: false, error: "Ese cliente ya no existe." };
      var idx = stageIndex(c.stage) + (delta > 0 ? 1 : -1);
      if (idx < 0) return { ok: false, error: "«" + c.name + "» ya está en la primera etapa." };
      if (idx >= STAGES.length) return { ok: false, error: "«" + c.name + "» ya está en la última etapa." };
      return setStage(state, id, STAGES[idx]);
    }

    /* Reemplaza {nombre} y {servicio} en una plantilla. */
    function applyTemplate(text, client) {
      return String(text || "")
        .replace(/\{nombre\}/g, firstName(client.name))
        .replace(/\{servicio\}/g, client.interest);
    }

    /* Envía un mensaje del negocio al chat del cliente.
       Si el cliente estaba en «Nuevo», pasa solo a «Contactado». */
    function sendMessage(state, clientId, text) {
      var c = clientById(state, clientId);
      if (!c) return { ok: false, error: "Elige primero una conversación." };
      text = String(text || "").trim();
      if (!text) return { ok: false, error: "Escribe un mensaje o elige una plantilla antes de enviar." };
      var message = { from: "negocio", text: text, time: "Ahora" };
      c.messages.push(message);
      var moved = false;
      if (c.stage === "Nuevo") { c.stage = "Contactado"; moved = true; }
      return { ok: true, client: c, message: message, moved: moved };
    }

    /* Marca un recordatorio como completado. */
    function completeReminder(state, reminderId) {
      var r = reminderById(state, reminderId);
      if (!r) return { ok: false, error: "Ese recordatorio ya no existe." };
      if (r.done) return { ok: false, error: "Ese recordatorio ya estaba completado." };
      r.done = true;
      return { ok: true, reminder: r, client: clientById(state, r.clientId) };
    }

    function pendingReminders(state) {
      return state.reminders.filter(function (r) { return !r.done; });
    }

    /* Clientes con recordatorio pendiente (para el punto en la lista). */
    function clientsWithPendingReminder(state) {
      var map = {};
      state.reminders.forEach(function (r) { if (!r.done) map[r.clientId] = true; });
      return map;
    }

    /* Conteos y montos por etapa, en el orden del embudo. */
    function stageTotals(state) {
      return STAGES.map(function (stage) {
        var list = state.clients.filter(function (c) { return c.stage === stage; });
        return {
          stage: stage,
          count: list.length,
          amount: list.reduce(function (s, c) { return s + c.amount; }, 0)
        };
      });
    }

    function computeKpis(state) {
      var total = state.clients.length;
      var follow = state.clients.filter(function (c) {
        var i = stageIndex(c.stage);
        return i >= 1 && i <= 3; /* Contactado, Interesado, Cotizado/Agendado */
      }).length;
      var closed = state.clients.filter(function (c) { return c.stage === "Cerrado"; }).length;
      var rate = total > 0 ? Math.round((closed / total) * 100) : 0;
      return { total: total, follow: follow, closed: closed, rate: rate };
    }

    return {
      STAGES: STAGES,
      TEMPLATE_KEYS: TEMPLATE_KEYS,
      TEMPLATE_LABELS: TEMPLATE_LABELS,
      rubroKeys: rubroKeys,
      freshState: freshState,
      clientById: clientById,
      reminderById: reminderById,
      stageIndex: stageIndex,
      firstName: firstName,
      initials: initials,
      setStage: setStage,
      moveStage: moveStage,
      applyTemplate: applyTemplate,
      sendMessage: sendMessage,
      completeReminder: completeReminder,
      pendingReminders: pendingReminders,
      clientsWithPendingReminder: clientsWithPendingReminder,
      stageTotals: stageTotals,
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
  var state = DemoCore.freshState("clinica");
  var selectedId = state.clients.length ? state.clients[0].id : null;

  var businessNameEl = document.getElementById("businessName");
  var kpiTotal = document.getElementById("kpiTotal");
  var kpiFollow = document.getElementById("kpiFollow");
  var kpiClosed = document.getElementById("kpiClosed");
  var kpiRate = document.getElementById("kpiRate");
  var pipelineEl = document.getElementById("pipeline");
  var convListEl = document.getElementById("convList");
  var chatAvatar = document.getElementById("chatAvatar");
  var chatName = document.getElementById("chatName");
  var chatMeta = document.getElementById("chatMeta");
  var chatStage = document.getElementById("chatStage");
  var chatBody = document.getElementById("chatBody");
  var freeText = document.getElementById("freeText");
  var templatesEl = document.getElementById("templates");
  var reminderList = document.getElementById("reminderList");
  var activityList = document.getElementById("activityList");
  var sendErrorEl = document.getElementById("sendError");

  var STAGE_BADGE = {
    "Nuevo": "st-nuevo",
    "Contactado": "st-contactado",
    "Interesado": "st-interesado",
    "Cotizado/Agendado": "st-cotizado",
    "Cerrado": "st-cerrado"
  };

  function money(n) {
    return "$" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showError(msg) {
    sendErrorEl.textContent = msg || "";
    sendErrorEl.classList.toggle("show", !!msg);
  }

  function logActivity(text) {
    var li = document.createElement("li");
    li.textContent = text;
    activityList.insertBefore(li, activityList.firstChild);
    while (activityList.children.length > 6) {
      activityList.removeChild(activityList.lastChild);
    }
  }

  function selectedClient() {
    return selectedId ? DemoCore.clientById(state, selectedId) : null;
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var k = DemoCore.computeKpis(state);
    kpiTotal.textContent = k.total;
    kpiFollow.textContent = k.follow;
    kpiClosed.textContent = k.closed;
    kpiRate.textContent = k.rate + "%";
  }

  /* ---------- Embudo ---------- */
  function renderPipeline() {
    var totals = DemoCore.stageTotals(state);
    pipelineEl.innerHTML = "";
    totals.forEach(function (t) {
      var col = document.createElement("div");
      col.className = "pipe-col";
      col.setAttribute("data-stage", t.stage);
      var head = document.createElement("div");
      head.className = "pipe-head";
      head.innerHTML =
        '<span class="pipe-stage">' + escapeHtml(t.stage) + "</span>" +
        '<span class="pipe-meta">' + t.count + (t.count === 1 ? " cliente · " : " clientes · ") +
        "<strong>" + money(t.amount) + "</strong></span>";
      col.appendChild(head);

      var cards = document.createElement("div");
      cards.className = "pipe-cards";
      var list = state.clients.filter(function (c) { return c.stage === t.stage; });
      if (list.length === 0) {
        var empty = document.createElement("p");
        empty.className = "pipe-empty";
        empty.textContent = "Sin clientes aquí";
        cards.appendChild(empty);
      }
      list.forEach(function (c) {
        var card = document.createElement("div");
        card.className = "pipe-card" + (c.id === selectedId ? " selected" : "");
        var idx = DemoCore.stageIndex(c.stage);
        card.innerHTML =
          '<span class="pc-name">' + escapeHtml(c.name) + "</span>" +
          '<span class="pc-interest">' + escapeHtml(c.interest) + "</span>" +
          '<span class="pc-foot"><span class="pc-amount">' + money(c.amount) + "</span></span>";
        var foot = card.querySelector(".pc-foot");
        var moveBox = document.createElement("span");
        moveBox.className = "pc-move";
        var btnBack = document.createElement("button");
        btnBack.type = "button";
        btnBack.className = "btn-move";
        btnBack.textContent = "◀";
        btnBack.title = "Mover a la etapa anterior";
        btnBack.disabled = idx === 0;
        btnBack.addEventListener("click", function (ev) { ev.stopPropagation(); moveClient(c.id, -1); });
        var btnFwd = document.createElement("button");
        btnFwd.type = "button";
        btnFwd.className = "btn-move";
        btnFwd.textContent = "▶";
        btnFwd.title = "Mover a la siguiente etapa";
        btnFwd.disabled = idx === DemoCore.STAGES.length - 1;
        btnFwd.addEventListener("click", function (ev) { ev.stopPropagation(); moveClient(c.id, 1); });
        moveBox.appendChild(btnBack);
        moveBox.appendChild(btnFwd);
        foot.appendChild(moveBox);
        card.addEventListener("click", function () { selectClient(c.id, true); });
        cards.appendChild(card);
      });
      col.appendChild(cards);
      pipelineEl.appendChild(col);
    });
  }

  function moveClient(id, delta) {
    var res = DemoCore.moveStage(state, id, delta);
    if (!res.ok) return;
    logActivity("🔀 " + res.client.name + " pasó de «" + res.from + "» a «" + res.to + "» en el embudo.");
    selectedId = id;
    renderAll();
  }

  /* ---------- Conversaciones ---------- */
  function lastMessagePreview(c) {
    if (!c.messages.length) return "Sin mensajes todavía";
    var m = c.messages[c.messages.length - 1];
    return (m.from === "negocio" ? "Tú: " : "") + m.text;
  }

  function renderConvList() {
    var pending = DemoCore.clientsWithPendingReminder(state);
    convListEl.innerHTML = "";
    state.clients.forEach(function (c) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "conv-item" + (c.id === selectedId ? " selected" : "");
      btn.innerHTML =
        '<span class="conv-avatar" aria-hidden="true">' + escapeHtml(DemoCore.initials(c.name)) + "</span>" +
        '<span class="conv-info">' +
          '<span class="conv-top"><span class="conv-name">' + escapeHtml(c.name) + "</span>" +
          '<span class="badge ' + STAGE_BADGE[c.stage] + '">' + escapeHtml(c.stage) + "</span></span>" +
          '<span class="conv-preview">' + escapeHtml(lastMessagePreview(c)) + "</span>" +
        "</span>" +
        '<span class="conv-dot" title="Tiene un recordatorio pendiente"' + (pending[c.id] ? "" : " hidden") + "></span>";
      btn.addEventListener("click", function () { selectClient(c.id, false); });
      li.appendChild(btn);
      convListEl.appendChild(li);
    });
  }

  function renderChat() {
    var c = selectedClient();
    chatBody.innerHTML = "";
    if (!c) {
      chatAvatar.textContent = "–";
      chatName.textContent = "Sin conversación";
      chatMeta.textContent = "Elige un cliente de la lista";
      chatStage.textContent = "";
      var empty = document.createElement("p");
      empty.className = "chat-empty";
      empty.textContent = "Elige un cliente para ver su conversación de WhatsApp.";
      chatBody.appendChild(empty);
      return;
    }
    chatAvatar.textContent = DemoCore.initials(c.name);
    chatName.textContent = c.name;
    chatMeta.textContent = c.phone + " · " + c.interest + " · " + money(c.amount);
    chatStage.textContent = c.stage;
    c.messages.forEach(function (m) {
      var div = document.createElement("div");
      div.className = "msg " + (m.from === "negocio" ? "out" : "in");
      div.innerHTML = escapeHtml(m.text) + '<span class="time">' + escapeHtml(m.time) + "</span>";
      chatBody.appendChild(div);
    });
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function selectClient(id, scrollToChat) {
    selectedId = id;
    showError("");
    renderAll();
    if (scrollToChat) {
      var box = document.querySelector(".chat-box");
      if (box && box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  /* ---------- Envío de mensajes ---------- */
  function doSend(text) {
    var c = selectedClient();
    var res = DemoCore.sendMessage(state, c ? c.id : null, text);
    if (!res.ok) { showError(res.error); return false; }
    showError("");
    if (res.moved) {
      logActivity("💬 Primer mensaje enviado a " + res.client.name + ": pasó solo de «Nuevo» a «Contactado».");
    } else {
      logActivity("💬 Mensaje enviado a " + res.client.name + " por WhatsApp.");
    }
    renderAll();
    return true;
  }

  document.getElementById("btnSendFree").addEventListener("click", function () {
    if (doSend(freeText.value)) freeText.value = "";
  });
  freeText.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      if (doSend(freeText.value)) freeText.value = "";
    }
  });

  /* ---------- Plantillas ---------- */
  function renderTemplates() {
    templatesEl.innerHTML = "";
    DemoCore.TEMPLATE_KEYS.forEach(function (key) {
      var box = document.createElement("div");
      box.className = "template-box";
      var label = document.createElement("label");
      label.textContent = DemoCore.TEMPLATE_LABELS[key];
      label.setAttribute("for", "tpl-" + key);
      var ta = document.createElement("textarea");
      ta.id = "tpl-" + key;
      ta.value = state.templates[key];
      ta.setAttribute("aria-label", DemoCore.TEMPLATE_LABELS[key]);
      ta.addEventListener("input", function () { state.templates[key] = ta.value; });
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-small";
      btn.textContent = "Enviar al cliente";
      btn.addEventListener("click", function () {
        var c = selectedClient();
        if (!c) { showError("Elige primero una conversación."); return; }
        var finalText = DemoCore.applyTemplate(ta.value, c);
        if (doSend(finalText)) {
          logActivity("📋 Plantilla «" + DemoCore.TEMPLATE_LABELS[key].split("·")[1].trim() + "» enviada a " + c.name + ".");
        }
      });
      box.appendChild(label);
      box.appendChild(ta);
      box.appendChild(btn);
      templatesEl.appendChild(box);
    });
  }

  /* ---------- Recordatorios ---------- */
  function renderReminders() {
    reminderList.innerHTML = "";
    if (state.reminders.length === 0) {
      var liE = document.createElement("li");
      liE.className = "reminders-empty";
      liE.textContent = "No hay recordatorios en este rubro.";
      reminderList.appendChild(liE);
      return;
    }
    var ordered = state.reminders.slice().sort(function (a, b) {
      return (a.done ? 1 : 0) - (b.done ? 1 : 0);
    });
    ordered.forEach(function (r) {
      var c = DemoCore.clientById(state, r.clientId);
      var li = document.createElement("li");
      if (r.done) li.className = "done";
      var footHtml = r.done
        ? '<span class="rem-done-tag">✓ Completado</span>'
        : "";
      li.innerHTML =
        '<span class="rem-reason">' + escapeHtml(r.reason) + "</span>" +
        '<span class="rem-meta">' + escapeHtml(c ? c.name : "") + " · " + escapeHtml(r.date) + "</span>" +
        '<span class="rem-foot"><span class="rem-meta">' + escapeHtml(c ? c.interest : "") + "</span>" + footHtml + "</span>";
      if (!r.done) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn-small";
        btn.textContent = "✓ Completar";
        btn.addEventListener("click", function () { completeReminder(r.id); });
        li.querySelector(".rem-foot").appendChild(btn);
      }
      li.addEventListener("click", function (ev) {
        if (ev.target.tagName !== "BUTTON" && c) selectClient(c.id, true);
      });
      reminderList.appendChild(li);
    });
  }

  function completeReminder(id) {
    var res = DemoCore.completeReminder(state, id);
    if (!res.ok) return;
    logActivity("🔔 Recordatorio completado: «" + res.reminder.reason + "» (" + (res.client ? res.client.name : "") + ").");
    renderAll();
  }

  /* ---------- Selector de rubro ---------- */
  document.querySelectorAll(".rubro-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-rubro");
      if (key === state.rubro) return;
      document.querySelectorAll(".rubro-tab").forEach(function (t) {
        t.classList.toggle("active", t === tab);
      });
      state = DemoCore.freshState(key);
      selectedId = state.clients.length ? state.clients[0].id : null;
      freeText.value = "";
      showError("");
      activityList.innerHTML = "<li>🟢 Cambiaste al rubro «" + state.label + "»: se cargaron los clientes, conversaciones y plantillas de " + state.business + ".</li>";
      renderAll();
    });
  });

  /* ---------- Render general ---------- */
  function renderAll() {
    businessNameEl.textContent = state.business;
    renderKpis();
    renderPipeline();
    renderConvList();
    renderChat();
    renderTemplates();
    renderReminders();
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = DemoCore.freshState(state.rubro);
    selectedId = state.clients.length ? state.clients[0].id : null;
    freeText.value = "";
    showError("");
    activityList.innerHTML = "<li>🟢 El CRM está activo: cada mensaje y cada movimiento queda registrado.</li>";
    renderAll();
  });

  /* ---------- Arranque ---------- */
  renderAll();
})();
