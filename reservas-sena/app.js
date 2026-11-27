/* PixelAndina — Demo interactiva: Reservas con Seña (anti-ausencias)
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   El pago de la seña es 100% simulado y está rotulado «Simulación».
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    var BUSINESS = "Barbería & Spa El Corte";

    var SERVICES = [
      { id: "corte",      name: "Corte de cabello",        minutes: 30, price: 10, depositType: "pct",   depositValue: 30, icon: "✂️", desc: "Corte clásico o moderno, con lavado y peinado." },
      { id: "corte-barba", name: "Corte + barba",          minutes: 60, price: 18, depositType: "pct",   depositValue: 30, icon: "💈", desc: "Corte completo y arreglo de barba con toalla caliente." },
      { id: "tinte",      name: "Tinte y color",           minutes: 90, price: 40, depositType: "fixed", depositValue: 15, icon: "🎨", desc: "Color completo con productos profesionales." },
      { id: "spa-manos",  name: "Manicura y pedicura spa", minutes: 60, price: 25, depositType: "pct",   depositValue: 30, icon: "💅", desc: "Spa completo para manos y pies, con hidratación." },
      { id: "masaje",     name: "Masaje relajante",        minutes: 60, price: 30, depositType: "pct",   depositValue: 50, icon: "🧖", desc: "Masaje de cuerpo completo para soltar el estrés." }
    ];

    var PROFESSIONALS = [
      { id: "marco",  name: "Marco Delgado", role: "Barbero",            icon: "🧔" },
      { id: "lucia",  name: "Lucía Vera",    role: "Estilista y color",  icon: "💇‍♀️" },
      { id: "andres", name: "Andrés Paz",    role: "Spa y masajes",      icon: "🙌" }
    ];

    var TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

    var STATUS_LABELS = {
      pendiente:  "Pendiente de seña",
      confirmada: "Confirmada",
      completada: "Completada",
      noshow:     "No se presentó"
    };

    /* ---------- Fechas ---------- */
    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function isoOf(d) {
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }

    function todayISO() { return isoOf(new Date()); }

    function nextDays(count) {
      var out = [];
      var base = new Date();
      for (var i = 0; i < count; i++) {
        var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
        var label;
        try {
          label = d.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" });
        } catch (e) {
          label = isoOf(d);
        }
        out.push({ iso: isoOf(d), label: (i === 0 ? "Hoy · " : "") + label });
      }
      return out;
    }

    function dateLabel(iso) {
      var parts = String(iso || "").split("-");
      if (parts.length !== 3) return String(iso || "");
      var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      try {
        return d.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
      } catch (e) {
        return iso;
      }
    }

    /* ---------- Dinero y seña ---------- */
    function round2(n) { return Math.round(n * 100) / 100; }
    function money(n) { return "$" + round2(n).toFixed(2); }

    /* La seña de un servicio: porcentaje del precio o monto fijo. */
    function depositFor(service) {
      if (!service) return 0;
      if (service.depositType === "fixed") return round2(service.depositValue);
      return round2(service.price * service.depositValue / 100);
    }

    function depositLabel(service) {
      if (!service) return "";
      if (service.depositType === "fixed") return "Seña fija de " + money(service.depositValue);
      return "Seña del " + service.depositValue + "% (" + money(depositFor(service)) + ")";
    }

    /* Lo que el cliente paga al llegar: el total menos la seña ya pagada. */
    function balanceDue(booking) {
      if (!booking) return 0;
      return round2(booking.price - (booking.depositPaid ? booking.deposit : 0));
    }

    /* ---------- Catálogos ---------- */
    function serviceById(id) { return SERVICES.filter(function (s) { return s.id === id; })[0] || null; }
    function profById(id) { return PROFESSIONALS.filter(function (p) { return p.id === id; })[0] || null; }
    function bookingById(state, id) { return state.bookings.filter(function (b) { return b.id === id; })[0] || null; }

    function firstName(name) {
      return String(name || "").trim().split(/\s+/)[0] || "";
    }

    /* ---------- Estado inicial (reservas semilla de hoy) ---------- */
    function seedBookings() {
      var t = todayISO();
      return [
        { id: "B-1", code: "RES-001", client: "Diego Ramírez",  phone: "099 111 2233", serviceId: "corte",       profId: "marco",  date: t, time: "09:00", price: 10, deposit: 3,    depositPaid: true,  status: "confirmada" },
        { id: "B-2", code: "RES-002", client: "Carmen Salazar", phone: "098 444 5566", serviceId: "tinte",       profId: "lucia",  date: t, time: "10:00", price: 40, deposit: 15,   depositPaid: true,  status: "confirmada" },
        { id: "B-3", code: "RES-003", client: "Jorge Medina",   phone: "097 777 8899", serviceId: "masaje",      profId: "andres", date: t, time: "11:00", price: 30, deposit: 15,   depositPaid: false, status: "pendiente" },
        { id: "B-4", code: "RES-004", client: "Kevin Torres",   phone: "096 222 3344", serviceId: "corte-barba", profId: "marco",  date: t, time: "14:00", price: 18, deposit: 5.40, depositPaid: true,  status: "completada" },
        { id: "B-5", code: "RES-005", client: "Rosa Jiménez",   phone: "095 555 6677", serviceId: "spa-manos",   profId: "lucia",  date: t, time: "15:00", price: 25, deposit: 7.50, depositPaid: true,  status: "noshow" }
      ];
    }

    function freshState() {
      return { bookings: seedBookings(), nextCode: 6, sessionBookings: 0 };
    }

    /* ---------- Horarios ----------
       "ocupado": una reserva confirmada (o ya atendida / no-show) bloquea el horario.
       "apartado": hay una reserva pendiente de seña; el horario NO está bloqueado
                   definitivamente: si la seña no se paga, se libera. */
    function slotStatus(state, date, profId, time) {
      var held = false;
      for (var i = 0; i < state.bookings.length; i++) {
        var b = state.bookings[i];
        if (b.date === date && b.profId === profId && b.time === time) {
          if (b.status === "confirmada" || b.status === "completada" || b.status === "noshow") return "ocupado";
          if (b.status === "pendiente") held = true;
        }
      }
      return held ? "apartado" : "libre";
    }

    function isBlocked(state, date, profId, time) {
      return slotStatus(state, date, profId, time) === "ocupado";
    }

    /* ---------- Crear reserva (nace «Pendiente de seña») ---------- */
    function createBooking(state, data) {
      var svc = serviceById(data.serviceId);
      var prof = profById(data.profId);
      if (!svc || !prof) return { ok: false, error: "Elige un servicio y un profesional válidos." };
      var client = String(data.client || "").trim();
      var phone = String(data.phone || "").trim();
      if (client.length < 3) return { ok: false, error: "Escribe tu nombre completo para poder registrar la reserva." };
      if (phone.replace(/\D/g, "").length < 7) return { ok: false, error: "Escribe un teléfono válido (mínimo 7 dígitos) para enviarte el recordatorio." };
      var st = slotStatus(state, data.date, data.profId, data.time);
      if (st === "ocupado") return { ok: false, error: "Ese horario ya está confirmado por otro cliente. Elige otra hora." };
      if (st === "apartado") return { ok: false, error: "Ese horario está apartado por un cliente que aún no paga su seña. Elige otra hora por ahora." };

      var code = "RES-" + ("00" + state.nextCode).slice(-3);
      var booking = {
        id: "B-" + state.nextCode,
        code: code,
        client: client,
        phone: phone,
        serviceId: svc.id,
        profId: prof.id,
        date: data.date,
        time: data.time,
        price: svc.price,
        deposit: depositFor(svc),
        depositPaid: false,
        status: "pendiente"
      };
      state.nextCode += 1;
      state.sessionBookings += 1;
      state.bookings.push(booking);
      return { ok: true, booking: booking };
    }

    /* ---------- Pagar la seña (simulado): confirma y bloquea ---------- */
    function payDeposit(state, id) {
      var b = bookingById(state, id);
      if (!b) return { ok: false, error: "Esa reserva ya no existe." };
      if (b.depositPaid) return { ok: false, error: "La seña de esta reserva ya está pagada." };
      if (b.status !== "pendiente") return { ok: false, error: "Esta reserva ya no admite el pago de la seña." };
      b.depositPaid = true;
      b.status = "confirmada";
      return { ok: true, booking: b };
    }

    /* ---------- Cierre del día: asistió / no se presentó ---------- */
    function completeBooking(state, id) {
      var b = bookingById(state, id);
      if (!b) return { ok: false, error: "Esa reserva ya no existe." };
      if (b.status !== "confirmada") return { ok: false, error: "Solo una reserva confirmada puede marcarse como completada." };
      b.status = "completada";
      return { ok: true, booking: b };
    }

    function markNoShow(state, id) {
      var b = bookingById(state, id);
      if (!b) return { ok: false, error: "Esa reserva ya no existe." };
      if (b.status !== "confirmada") return { ok: false, error: "Solo una reserva confirmada puede marcarse como «no se presentó»." };
      b.status = "noshow";
      return { ok: true, booking: b };
    }

    /* ---------- KPIs del negocio (sobre las reservas de hoy) ---------- */
    function computeKpis(state, today) {
      var todays = state.bookings.filter(function (b) { return b.date === today; });
      var depositsCollected = 0, protectedAmount = 0;
      var completed = 0, noShow = 0, pending = 0;
      todays.forEach(function (b) {
        if (b.depositPaid) depositsCollected += b.deposit;
        if (b.status === "completada") completed += 1;
        if (b.status === "noshow") {
          noShow += 1;
          if (b.depositPaid) protectedAmount += b.deposit; /* la seña del que no llegó se queda en el negocio */
        }
        if (b.status === "pendiente") pending += 1;
      });
      var resolved = completed + noShow;
      return {
        todayCount: todays.length,
        depositsCollected: round2(depositsCollected),
        attendanceRate: resolved > 0 ? Math.round(completed / resolved * 1000) / 10 : null,
        protectedAmount: round2(protectedAmount),
        pendingCount: pending,
        completedCount: completed,
        noShowCount: noShow
      };
    }

    /* ---------- Recordatorio por WhatsApp (texto simulado) ---------- */
    function reminderMessage(state, booking) {
      var svc = serviceById(booking.serviceId);
      var prof = profById(booking.profId);
      var head = "Hola, " + firstName(booking.client) + " 👋 Te escribimos de " + BUSINESS + ".";
      var detail = "Tu cita: " + svc.name + " con " + prof.name + ", el " + dateLabel(booking.date) +
        " a las " + booking.time + " (" + svc.minutes + " min).";
      if (booking.depositPaid) {
        return head + "\n" + detail +
          "\n✅ Tu seña de " + money(booking.deposit) + " ya está pagada y se descuenta del total: al llegar solo pagas " +
          money(balanceDue(booking)) + "." +
          "\nSi no puedes venir, avísanos con 3 horas de anticipación y reprogramamos sin que pierdas tu seña. ¡Te esperamos!";
      }
      return head + "\n" + detail +
        "\n⏳ Tu horario está apartado, pero tu reserva aún NO está confirmada: falta pagar la seña de " +
        money(booking.deposit) + ". Si la seña no se paga, el horario se libera para otro cliente. ¡Gracias!";
    }

    return {
      BUSINESS: BUSINESS,
      SERVICES: SERVICES,
      PROFESSIONALS: PROFESSIONALS,
      TIMES: TIMES,
      STATUS_LABELS: STATUS_LABELS,
      todayISO: todayISO,
      nextDays: nextDays,
      dateLabel: dateLabel,
      money: money,
      round2: round2,
      depositFor: depositFor,
      depositLabel: depositLabel,
      balanceDue: balanceDue,
      serviceById: serviceById,
      profById: profById,
      bookingById: bookingById,
      freshState: freshState,
      slotStatus: slotStatus,
      isBlocked: isBlocked,
      createBooking: createBooking,
      payDeposit: payDeposit,
      completeBooking: completeBooking,
      markNoShow: markNoShow,
      computeKpis: computeKpis,
      reminderMessage: reminderMessage
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
  var C = DemoCore;
  var state = C.freshState();
  var flow = { step: 1, service: null, professional: null, date: null, time: null, bookingId: null, paidNow: false };

  var body = document.getElementById("bookingBody");
  var stepsBar = document.getElementById("stepsBar");
  var agendaBody = document.getElementById("agendaBody");
  var kpiToday = document.getElementById("kpiToday");
  var kpiDeposits = document.getElementById("kpiDeposits");
  var kpiAttendance = document.getElementById("kpiAttendance");
  var kpiProtected = document.getElementById("kpiProtected");
  var activityList = document.getElementById("activityList");
  var reminderBox = document.getElementById("reminderBox");
  var reminderBubble = document.getElementById("reminderBubble");
  var reminderMeta = document.getElementById("reminderMeta");

  function money(n) { return C.money(n); }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- Barra de pasos ---------- */
  function renderSteps() {
    stepsBar.querySelectorAll("li").forEach(function (li) {
      var n = parseInt(li.getAttribute("data-step"), 10);
      li.classList.toggle("active", n === flow.step);
      li.classList.toggle("done", n < flow.step);
    });
  }

  /* ---------- Panel del negocio ---------- */
  function statusBadge(b) {
    var cls = { pendiente: "badge pending", confirmada: "badge", completada: "badge done", noshow: "badge noshow" }[b.status];
    return '<span class="' + cls + '">' + C.STATUS_LABELS[b.status] + "</span>";
  }

  function renderPanel(highlightCode) {
    var t = C.todayISO();
    var todays = state.bookings
      .filter(function (b) { return b.date === t; })
      .slice()
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; });

    agendaBody.innerHTML = "";
    if (todays.length === 0) {
      var trE = document.createElement("tr");
      trE.className = "empty-row";
      trE.innerHTML = '<td colspan="7">No hay reservas para hoy todavía.</td>';
      agendaBody.appendChild(trE);
    }
    todays.forEach(function (b) {
      var svc = C.serviceById(b.serviceId);
      var prof = C.profById(b.profId);
      var tr = document.createElement("tr");
      if (highlightCode && b.code === highlightCode) tr.className = "new-row";
      var cells = [
        b.time,
        b.client,
        svc.name,
        prof.name,
        b.depositPaid ? "Pagada · " + money(b.deposit) : "Falta · " + money(b.deposit)
      ];
      cells.forEach(function (c) {
        var td = document.createElement("td");
        td.textContent = c;
        tr.appendChild(td);
      });
      var tdState = document.createElement("td");
      tdState.innerHTML = statusBadge(b);
      tr.appendChild(tdState);

      var tdAct = document.createElement("td");
      tdAct.className = "row-actions";
      var acts = [];
      if (b.status === "pendiente") acts.push({ a: "pay", label: "💵 Registrar seña" });
      if (b.status === "confirmada") {
        acts.push({ a: "complete", label: "✓ Completar" });
        acts.push({ a: "noshow", label: "✕ No se presentó" });
      }
      if (b.status === "confirmada" || b.status === "pendiente") acts.push({ a: "reminder", label: "💬 Recordatorio" });
      if (acts.length === 0) {
        tdAct.textContent = "—";
      } else {
        acts.forEach(function (x) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "mini-btn";
          btn.textContent = x.label;
          btn.setAttribute("data-action", x.a);
          btn.setAttribute("data-id", b.id);
          tdAct.appendChild(btn);
        });
      }
      tr.appendChild(tdAct);
      agendaBody.appendChild(tr);
    });

    var k = C.computeKpis(state, t);
    kpiToday.textContent = k.todayCount;
    kpiDeposits.textContent = money(k.depositsCollected);
    kpiAttendance.textContent = k.attendanceRate === null ? "—" : (k.attendanceRate + "%");
    kpiProtected.textContent = money(k.protectedAmount);
  }

  agendaBody.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-action]");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var action = btn.getAttribute("data-action");
    var b = C.bookingById(state, id);
    if (!b) return;
    var svc = C.serviceById(b.serviceId);

    if (action === "pay") {
      var r1 = C.payDeposit(state, id);
      if (!r1.ok) { logActivity("⚠️ " + r1.error); return; }
      logActivity("💵 Seña registrada: " + b.client + " pagó " + money(b.deposit) + " por " + svc.name +
        ". La reserva " + b.code + " quedó CONFIRMADA y el horario bloqueado.");
      renderPanel(b.code);
      showReminder(b);
    } else if (action === "complete") {
      var r2 = C.completeBooking(state, id);
      if (!r2.ok) { logActivity("⚠️ " + r2.error); return; }
      logActivity("✓ " + b.client + " asistió a su " + svc.name + ": pagó el saldo de " + money(C.balanceDue(b)) +
        " en el local (la seña de " + money(b.deposit) + " ya estaba pagada). Reserva " + b.code + " completada.");
      renderPanel(b.code);
    } else if (action === "noshow") {
      var r3 = C.markNoShow(state, id);
      if (!r3.ok) { logActivity("⚠️ " + r3.error); return; }
      logActivity("✕ " + b.client + " no se presentó a su " + svc.name + ". Como pagó su seña, el negocio retiene " +
        money(b.deposit) + ": la hora perdida no quedó del todo perdida.");
      renderPanel(b.code);
    } else if (action === "reminder") {
      showReminder(b);
    }
  });

  function showReminder(b) {
    reminderBubble.textContent = C.reminderMessage(state, b);
    reminderMeta.textContent = "Vista previa del WhatsApp que recibe " + b.client + " (" + b.phone + ") — envío simulado.";
    reminderBox.hidden = false;
    reminderBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function logActivity(text) {
    var li = document.createElement("li");
    li.textContent = text;
    activityList.insertBefore(li, activityList.firstChild);
    while (activityList.children.length > 6) {
      activityList.removeChild(activityList.lastChild);
    }
  }

  /* ---------- Pasos de la reserva ---------- */
  function header(title, sub) {
    return "<h3>" + title + "</h3>" + (sub ? '<p class="step-sub">' + sub + "</p>" : "");
  }

  function backButton(step) {
    return '<button type="button" class="btn-back" data-back="' + step + '">← Volver</button>';
  }

  function bindBack() {
    var btn = body.querySelector("[data-back]");
    if (btn) {
      btn.addEventListener("click", function () {
        flow.step = parseInt(btn.getAttribute("data-back"), 10);
        showStep();
      });
    }
  }

  function policyBox(compact) {
    return '<div class="policy-box">' +
      "<strong>🛡️ Política anti-ausencias, clara y amable</strong>" +
      "<p>Tu cita se confirma con una pequeña seña. La seña <strong>se descuenta del total</strong> cuando vienes: no pagas de más, solo aseguras tu horario.</p>" +
      (compact ? "" : "<p>Si no te presentas y no avisas, la seña no se devuelve: cubre el horario que quedó vacío. ¿Necesitas cambiar? Avisando con <strong>3 horas de anticipación</strong>, reprogramas y tu seña queda intacta.</p>") +
      "</div>";
  }

  function summaryBox(b) {
    var svc = C.serviceById(b.serviceId);
    var prof = C.profById(b.profId);
    var html = '<div class="summary-box">' +
      "<p><span>Cliente</span><span>" + escapeHtml(b.client) + "</span></p>" +
      "<p><span>Servicio</span><span>" + escapeHtml(svc.name) + "</span></p>" +
      "<p><span>Profesional</span><span>" + escapeHtml(prof.name) + "</span></p>" +
      "<p><span>Fecha</span><span>" + escapeHtml(C.dateLabel(b.date)) + "</span></p>" +
      "<p><span>Hora</span><span>" + b.time + " (" + svc.minutes + " min)</span></p>" +
      '<p class="deposit-row"><span>Seña para confirmar</span><span>' + money(b.deposit) + (b.depositPaid ? " · pagada ✅" : " · por pagar") + "</span></p>" +
      '<p class="total"><span>' + (b.depositPaid ? "Saldo al llegar" : "Total del servicio") + "</span><span>" + money(C.balanceDue(b)) + "</span></p>" +
      "</div>";
    return html;
  }

  function showStep() {
    renderSteps();
    if (flow.step === 1) return stepService();
    if (flow.step === 2) return stepProfessional();
    if (flow.step === 3) return stepDateTime();
    if (flow.step === 4) return stepData();
    if (flow.step === 5) return stepDeposit();
    return stepDone();
  }

  function stepService() {
    var html = header("¿Qué servicio quieres reservar?", "Cada servicio pide una pequeña seña para confirmar: así tu horario queda protegido.") +
      policyBox(true);
    C.SERVICES.forEach(function (s) {
      html += '<button type="button" class="option-card" data-service="' + s.id + '">' +
        '<span class="icon" aria-hidden="true">' + s.icon + "</span>" +
        '<span class="opt-main"><span class="opt-title">' + s.name + '</span>' +
        '<span class="opt-desc">' + s.desc + "</span>" +
        '<span class="opt-deposit">Seña: ' + money(C.depositFor(s)) + " para confirmar</span></span>" +
        '<span class="opt-meta">' + s.minutes + " min</span>" +
        '<span class="opt-price">' + money(s.price) + "</span></button>";
    });
    body.innerHTML = html;
    body.querySelectorAll("[data-service]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        flow.service = C.serviceById(btn.getAttribute("data-service"));
        flow.step = 2;
        showStep();
      });
    });
  }

  function stepProfessional() {
    var html = backButton(1) +
      header("Elige al profesional", "Servicio: " + flow.service.name + " · " + flow.service.minutes + " min · " + money(flow.service.price) +
        " · seña de " + money(C.depositFor(flow.service)));
    C.PROFESSIONALS.forEach(function (p) {
      html += '<button type="button" class="option-card" data-prof="' + p.id + '">' +
        '<span class="icon" aria-hidden="true">' + p.icon + "</span>" +
        '<span class="opt-main"><span class="opt-title">' + p.name + '</span>' +
        '<span class="opt-desc">' + p.role + "</span></span></button>";
    });
    body.innerHTML = html;
    bindBack();
    body.querySelectorAll("[data-prof]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        flow.professional = C.profById(btn.getAttribute("data-prof"));
        flow.date = null;
        flow.time = null;
        flow.step = 3;
        showStep();
      });
    });
  }

  function stepDateTime() {
    var days = C.nextDays(5);
    if (!flow.date) flow.date = days[0].iso;
    var html = backButton(2) +
      header("Fecha y hora", "Con " + flow.professional.name + ". Verde: libre · Ámbar: apartado sin seña (aún no bloquea) · Tachado: confirmado por otro cliente.");
    html += '<div class="chip-row" id="dateChips">';
    days.forEach(function (d) {
      html += '<button type="button" class="chip' + (d.iso === flow.date ? " selected" : "") +
        '" data-date="' + d.iso + '">' + d.label + "</button>";
    });
    html += '</div><div class="slot-grid" id="slotGrid"></div>' +
      '<p class="slot-note">Toca un horario libre para continuar.</p>';
    body.innerHTML = html;
    bindBack();
    body.querySelectorAll("[data-date]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        flow.date = chip.getAttribute("data-date");
        flow.time = null;
        stepDateTime();
      });
    });
    renderSlots();
  }

  function renderSlots() {
    var grid = document.getElementById("slotGrid");
    grid.innerHTML = "";
    C.TIMES.forEach(function (t) {
      var st = C.slotStatus(state, flow.date, flow.professional.id, t);
      var btn = document.createElement("button");
      btn.type = "button";
      if (st === "libre") {
        btn.className = "slot";
        btn.textContent = t;
        btn.addEventListener("click", function () {
          flow.time = t;
          flow.step = 4;
          showStep();
        });
      } else if (st === "apartado") {
        btn.className = "slot held";
        btn.disabled = true;
        btn.innerHTML = t + '<span class="slot-tag">apartado</span>';
        btn.title = "Apartado por un cliente que aún no paga su seña: si no paga, el horario se libera.";
      } else {
        btn.className = "slot busy";
        btn.disabled = true;
        btn.textContent = t;
        btn.title = "Horario confirmado por otro cliente";
      }
      grid.appendChild(btn);
    });
  }

  function stepData() {
    var svc = flow.service;
    var dateLabel = C.nextDays(5).filter(function (d) { return d.iso === flow.date; })[0];
    var html = backButton(3) +
      header("Tus datos", "Solo tu nombre y tu teléfono, para enviarte el recordatorio y el enlace de la seña.") +
      '<div class="summary-box">' +
      "<p><span>Servicio</span><span>" + escapeHtml(svc.name) + "</span></p>" +
      "<p><span>Profesional</span><span>" + escapeHtml(flow.professional.name) + "</span></p>" +
      "<p><span>Fecha</span><span>" + escapeHtml(dateLabel ? dateLabel.label : flow.date) + "</span></p>" +
      "<p><span>Hora</span><span>" + flow.time + " (" + svc.minutes + " min)</span></p>" +
      '<p class="deposit-row"><span>Seña para confirmar</span><span>' + money(C.depositFor(svc)) + "</span></p>" +
      '<p class="total"><span>Total del servicio</span><span>' + money(svc.price) + "</span></p>" +
      "</div>" +
      '<div class="form-error" id="formError"></div>' +
      '<form id="dataForm" novalidate>' +
      '<div class="field"><label for="fName">Nombre completo</label>' +
      '<input id="fName" type="text" placeholder="Ej.: Ana María Torres" autocomplete="name"></div>' +
      '<div class="field"><label for="fPhone">Teléfono (WhatsApp)</label>' +
      '<input id="fPhone" type="tel" placeholder="Ej.: 099 123 4567" autocomplete="tel"></div>' +
      '<button type="submit" class="btn-primary btn-amber">Apartar y continuar a la seña →</button></form>' +
      '<p class="slot-note">Al continuar, tu horario queda <strong>apartado</strong>. Solo se confirma cuando pagas la seña en el siguiente paso.</p>';
    body.innerHTML = html;
    bindBack();
    document.getElementById("dataForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var res = C.createBooking(state, {
        client: document.getElementById("fName").value,
        phone: document.getElementById("fPhone").value,
        serviceId: flow.service.id,
        profId: flow.professional.id,
        date: flow.date,
        time: flow.time
      });
      var err = document.getElementById("formError");
      if (!res.ok) {
        err.textContent = res.error;
        err.classList.add("show");
        return;
      }
      flow.bookingId = res.booking.id;
      flow.paidNow = false;
      flow.step = 5;
      renderPanel(res.booking.date === C.todayISO() ? res.booking.code : null);
      logActivity("📌 " + res.booking.code + ": " + res.booking.client + " apartó " + svc.name + " con " +
        flow.professional.name + " (" + res.booking.time + "). Estado: PENDIENTE DE SEÑA — el horario aún no está bloqueado.");
      showStep();
    });
  }

  function stepDeposit() {
    var b = C.bookingById(state, flow.bookingId);
    var html = header("Confirma tu reserva con la seña", "Tu horario está apartado. Paga la seña y queda confirmado y bloqueado solo para ti.") +
      summaryBox(b) +
      policyBox(false) +
      '<div class="pay-box">' +
      '<p class="pay-amount">Seña a pagar ahora: <strong>' + money(b.deposit) + "</strong></p>" +
      '<button type="button" class="btn-primary btn-amber" id="btnPay">💳 Pagar seña de ' + money(b.deposit) + "</button>" +
      '<p class="pay-note">Pago 100% simulado para esta demo — no se cobra dinero real. <span class="sim-tag">Simulación</span></p>' +
      '<button type="button" class="btn-link" id="btnLater">Pagar la seña después</button>' +
      "</div>";
    body.innerHTML = html;

    document.getElementById("btnPay").addEventListener("click", function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = "Procesando pago simulado…";
      setTimeout(function () {
        var res = C.payDeposit(state, b.id);
        if (!res.ok) {
          btn.disabled = false;
          btn.textContent = "💳 Pagar seña de " + money(b.deposit);
          logActivity("⚠️ " + res.error);
          return;
        }
        flow.paidNow = true;
        flow.step = 6;
        renderPanel(b.date === C.todayISO() ? b.code : null);
        logActivity("✅ " + b.code + ": " + b.client + " pagó la seña de " + money(b.deposit) +
          " (simulación). Reserva CONFIRMADA: el horario " + b.time + " quedó bloqueado.");
        showReminder(b);
        showStep();
      }, 900);
    });

    document.getElementById("btnLater").addEventListener("click", function () {
      flow.paidNow = false;
      flow.step = 6;
      logActivity("⏳ " + b.code + ": " + b.client + " dejó la seña para después. La reserva sigue PENDIENTE y el horario puede liberarse.");
      showStep();
    });
  }

  function stepDone() {
    var b = C.bookingById(state, flow.bookingId);
    var confirmed = b.status === "confirmada";
    var html = '<div class="confirm-wrap">' +
      '<div class="confirm-check' + (confirmed ? "" : " warn") + '" aria-hidden="true">' + (confirmed ? "✓" : "⏳") + "</div>" +
      (confirmed
        ? "<h3>¡Tu reserva está confirmada!</h3><p>Pagaste tu seña (simulación) y el horario quedó bloqueado para ti. Muestra este código al llegar:</p>"
        : "<h3>Tu horario quedó apartado</h3><p>Ojo: tu reserva aún <strong>no está confirmada</strong>. Falta pagar la seña de " + money(b.deposit) +
          "; si no se paga, el horario se libera. Puedes registrar el pago desde el panel del negocio en esta misma demo.</p>") +
      '<span class="confirm-code">' + b.code + "</span>" +
      summaryBox(b) +
      '<h4 class="wa-title">Así llega el recordatorio a tu WhatsApp</h4>' +
      '<div class="wa-bubble">' + escapeHtml(C.reminderMessage(state, b)) + "</div>" +
      '<button type="button" class="btn-primary" id="btnAnother">Hacer otra reserva</button></div>';
    body.innerHTML = html;
    document.getElementById("btnAnother").addEventListener("click", function () {
      flow = { step: 1, service: null, professional: null, date: null, time: null, bookingId: null, paidNow: false };
      showStep();
    });
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = C.freshState();
    flow = { step: 1, service: null, professional: null, date: null, time: null, bookingId: null, paidNow: false };
    activityList.innerHTML = "<li>🟢 El sistema de reservas con seña está activo: cada reserva pide su anticipo para confirmar.</li>";
    reminderBox.hidden = true;
    renderPanel(null);
    showStep();
  });

  /* ---------- Arranque ---------- */
  renderPanel(null);
  showStep();
})();
