/* PixelAndina — Demo interactiva: Agendamiento en línea (salud y belleza)
   Todo es simulado en el navegador, con datos ficticios. Sin backend. */
(function () {
  "use strict";

  var SERVICES = [
    { id: "limpieza",       name: "Limpieza dental",        minutes: 45, price: 25, icon: "🦷", desc: "Profilaxis completa y pulido." },
    { id: "consulta",       name: "Consulta y diagnóstico", minutes: 30, price: 15, icon: "🩺", desc: "Revisión general y plan de tratamiento." },
    { id: "blanqueamiento", name: "Blanqueamiento dental",  minutes: 60, price: 60, icon: "✨", desc: "Sesión completa de blanqueamiento." },
    { id: "ortodoncia",     name: "Valoración de ortodoncia", minutes: 40, price: 20, icon: "😁", desc: "Estudio inicial para brackets." }
  ];

  var PROFESSIONALS = [
    { id: "rios",   name: "Dra. Valeria Ríos",  role: "Odontóloga general",  icon: "👩‍⚕️" },
    { id: "cedeno", name: "Dr. Andrés Cedeño",  role: "Ortodoncista",        icon: "👨‍⚕️" },
    { id: "torres", name: "Dra. Camila Torres", role: "Estética dental",     icon: "👩‍⚕️" }
  ];

  var TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

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

  function seedBookings() {
    var t = todayISO();
    return [
      { code: null, client: "María Fernanda López", phone: "099 111 2233", serviceId: "limpieza", profId: "rios",   date: t, time: "09:00", source: "agenda" },
      { code: null, client: "Carlos Paredes",       phone: "098 444 5566", serviceId: "consulta", profId: "cedeno", date: t, time: "10:00", source: "agenda" },
      { code: null, client: "Lucía Herrera",        phone: "097 777 8899", serviceId: "blanqueamiento", profId: "torres", date: t, time: "11:00", source: "agenda" }
    ];
  }

  var state;
  function freshState() {
    return {
      step: 1,
      service: null,
      professional: null,
      date: null,
      time: null,
      nextCode: 1,
      sessionBookings: 0,
      bookings: seedBookings()
    };
  }
  state = freshState();

  var body = document.getElementById("bookingBody");
  var stepsBar = document.getElementById("stepsBar");
  var agendaBody = document.getElementById("agendaBody");
  var kpiToday = document.getElementById("kpiToday");
  var kpiIncome = document.getElementById("kpiIncome");
  var kpiTotal = document.getElementById("kpiTotal");
  var activityList = document.getElementById("activityList");

  function money(n) { return "$" + n.toFixed(2); }
  function serviceById(id) { return SERVICES.filter(function (s) { return s.id === id; })[0]; }
  function profById(id) { return PROFESSIONALS.filter(function (p) { return p.id === id; })[0]; }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isBusy(dateISO, profId, time) {
    return state.bookings.some(function (b) {
      return b.date === dateISO && b.profId === profId && b.time === time;
    });
  }

  /* ---------- Barra de pasos ---------- */
  function renderSteps() {
    var items = stepsBar.querySelectorAll("li");
    items.forEach(function (li) {
      var n = parseInt(li.getAttribute("data-step"), 10);
      li.classList.toggle("active", n === state.step);
      li.classList.toggle("done", n < state.step);
    });
  }

  /* ---------- Panel del negocio ---------- */
  function renderPanel(highlightCode) {
    var t = todayISO();
    var todays = state.bookings
      .filter(function (b) { return b.date === t; })
      .slice()
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; });

    agendaBody.innerHTML = "";
    if (todays.length === 0) {
      var trE = document.createElement("tr");
      trE.className = "empty-row";
      trE.innerHTML = '<td colspan="5">No hay citas para hoy todavía.</td>';
      agendaBody.appendChild(trE);
    }
    todays.forEach(function (b) {
      var svc = serviceById(b.serviceId);
      var prof = profById(b.profId);
      var tr = document.createElement("tr");
      if (highlightCode && b.code === highlightCode) tr.className = "new-row";
      [b.time, b.client, svc.name, prof.name].forEach(function (c) {
        var td = document.createElement("td");
        td.textContent = c;
        tr.appendChild(td);
      });
      var tdState = document.createElement("td");
      var badge = document.createElement("span");
      if (b.source === "web") {
        badge.className = "badge web";
        badge.textContent = "Nueva · web";
      } else {
        badge.className = "badge";
        badge.textContent = "Confirmada";
      }
      tdState.appendChild(badge);
      tr.appendChild(tdState);
      agendaBody.appendChild(tr);
    });

    var income = todays.reduce(function (sum, b) { return sum + serviceById(b.serviceId).price; }, 0);
    kpiToday.textContent = todays.length;
    kpiIncome.textContent = money(income);
    kpiTotal.textContent = state.sessionBookings;
  }

  function logActivity(text) {
    var li = document.createElement("li");
    li.textContent = text;
    activityList.insertBefore(li, activityList.firstChild);
    while (activityList.children.length > 5) {
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

  function summaryBox(includeTotal) {
    var svc = state.service;
    var prof = state.professional;
    var dateLabel = nextDays(5).filter(function (d) { return d.iso === state.date; })[0];
    var html = '<div class="summary-box">' +
      "<p><span>Servicio</span><span>" + escapeHtml(svc.name) + "</span></p>" +
      "<p><span>Profesional</span><span>" + escapeHtml(prof.name) + "</span></p>" +
      "<p><span>Fecha</span><span>" + escapeHtml(dateLabel ? dateLabel.label : state.date) + "</span></p>" +
      "<p><span>Hora</span><span>" + escapeHtml(state.time) + " (" + svc.minutes + " min)</span></p>";
    if (includeTotal) {
      html += '<p class="total"><span>Total a pagar en clínica</span><span>' + money(svc.price) + "</span></p>";
    }
    return html + "</div>";
  }

  function showStep() {
    renderSteps();
    if (state.step === 1) return stepService();
    if (state.step === 2) return stepProfessional();
    if (state.step === 3) return stepDateTime();
    if (state.step === 4) return stepData();
    return stepDone();
  }

  function stepService() {
    var html = header("¿Qué servicio necesitas?", "Toca un servicio para continuar. Sin registros ni contraseñas.");
    SERVICES.forEach(function (s) {
      html += '<button type="button" class="option-card" data-service="' + s.id + '">' +
        '<span class="icon" aria-hidden="true">' + s.icon + "</span>" +
        '<span class="opt-main"><span class="opt-title">' + s.name + '</span>' +
        '<span class="opt-desc">' + s.desc + "</span></span>" +
        '<span class="opt-meta">' + s.minutes + " min</span>" +
        '<span class="opt-price">' + money(s.price) + "</span></button>";
    });
    body.innerHTML = html;
    body.querySelectorAll("[data-service]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.service = serviceById(btn.getAttribute("data-service"));
        state.step = 2;
        showStep();
      });
    });
  }

  function stepProfessional() {
    var html = backButton(1) +
      header("Elige al profesional", "Servicio: " + state.service.name + " · " + state.service.minutes + " min · " + money(state.service.price));
    PROFESSIONALS.forEach(function (p) {
      html += '<button type="button" class="option-card" data-prof="' + p.id + '">' +
        '<span class="icon" aria-hidden="true">' + p.icon + "</span>" +
        '<span class="opt-main"><span class="opt-title">' + p.name + '</span>' +
        '<span class="opt-desc">' + p.role + "</span></span></button>";
    });
    body.innerHTML = html;
    bindBack();
    body.querySelectorAll("[data-prof]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.professional = profById(btn.getAttribute("data-prof"));
        state.date = null;
        state.time = null;
        state.step = 3;
        showStep();
      });
    });
  }

  function stepDateTime() {
    var days = nextDays(5);
    if (!state.date) state.date = days[0].iso;
    var html = backButton(2) +
      header("Fecha y hora", "Con " + state.professional.name + ". Los horarios tachados ya están ocupados.");
    html += '<div class="chip-row" id="dateChips">';
    days.forEach(function (d) {
      html += '<button type="button" class="chip' + (d.iso === state.date ? " selected" : "") +
        '" data-date="' + d.iso + '">' + d.label + "</button>";
    });
    html += '</div><div class="slot-grid" id="slotGrid"></div>' +
      '<p class="slot-note">Toca un horario libre para continuar.</p>';
    body.innerHTML = html;
    bindBack();
    body.querySelectorAll("[data-date]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.date = chip.getAttribute("data-date");
        state.time = null;
        stepDateTime();
      });
    });
    renderSlots();
  }

  function renderSlots() {
    var grid = document.getElementById("slotGrid");
    grid.innerHTML = "";
    TIMES.forEach(function (t) {
      var busy = isBusy(state.date, state.professional.id, t);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot" + (busy ? " busy" : "");
      btn.textContent = t;
      if (busy) {
        btn.disabled = true;
        btn.title = "Horario ocupado";
      } else {
        btn.addEventListener("click", function () {
          state.time = t;
          state.step = 4;
          showStep();
        });
      }
      grid.appendChild(btn);
    });
  }

  function stepData() {
    var html = backButton(3) +
      header("Tus datos", "Solo tu nombre y tu teléfono, para confirmar la cita y enviarte el recordatorio.") +
      summaryBox(true) +
      '<div class="form-error" id="formError"></div>' +
      '<form id="dataForm" novalidate>' +
      '<div class="field"><label for="fName">Nombre completo</label>' +
      '<input id="fName" type="text" placeholder="Ej.: Ana María Torres" autocomplete="name"></div>' +
      '<div class="field"><label for="fPhone">Teléfono (WhatsApp)</label>' +
      '<input id="fPhone" type="tel" placeholder="Ej.: 099 123 4567" autocomplete="tel"></div>' +
      '<button type="submit" class="btn-primary btn-amber">Confirmar reserva</button></form>';
    body.innerHTML = html;
    bindBack();
    document.getElementById("dataForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var phone = document.getElementById("fPhone").value.trim();
      var err = document.getElementById("formError");
      var digits = phone.replace(/\D/g, "");
      if (name.length < 3) {
        err.textContent = "Escribe tu nombre completo para poder registrar la cita.";
        err.classList.add("show");
        return;
      }
      if (digits.length < 7) {
        err.textContent = "Escribe un teléfono válido (mínimo 7 dígitos) para enviarte el recordatorio.";
        err.classList.add("show");
        return;
      }
      confirmBooking(name, phone);
    });
  }

  function confirmBooking(name, phone) {
    var code = "CITA-" + ("00" + state.nextCode).slice(-3);
    state.nextCode += 1;
    var booking = {
      code: code,
      client: name,
      phone: phone,
      serviceId: state.service.id,
      profId: state.professional.id,
      date: state.date,
      time: state.time,
      source: "web"
    };
    state.bookings.push(booking);
    state.sessionBookings += 1;
    state.lastBooking = booking;
    state.step = 5;
    renderPanel(booking.date === todayISO() ? code : null);
    var when = booking.date === todayISO() ? "hoy" : "el " + booking.date;
    logActivity("📅 " + code + ": " + name + " reservó " + state.service.name +
      " con " + state.professional.name + " para " + when + " a las " + booking.time +
      ". La agenda se actualizó sola, sin llamadas.");
    showStep();
  }

  function stepDone() {
    var b = state.lastBooking;
    var svc = serviceById(b.serviceId);
    var prof = profById(b.profId);
    var dateLabel = nextDays(5).filter(function (d) { return d.iso === b.date; })[0];
    var html = '<div class="confirm-wrap">' +
      '<div class="confirm-check" aria-hidden="true">✓</div>' +
      "<h3>¡Tu cita está confirmada!</h3>" +
      "<p>Muestra este código al llegar a la clínica:</p>" +
      '<span class="confirm-code">' + b.code + "</span>" +
      '<div class="summary-box">' +
      "<p><span>Cliente</span><span>" + escapeHtml(b.client) + "</span></p>" +
      "<p><span>Servicio</span><span>" + escapeHtml(svc.name) + "</span></p>" +
      "<p><span>Profesional</span><span>" + escapeHtml(prof.name) + "</span></p>" +
      "<p><span>Fecha</span><span>" + escapeHtml(dateLabel ? dateLabel.label : b.date) + "</span></p>" +
      "<p><span>Hora</span><span>" + b.time + " (" + svc.minutes + " min)</span></p>" +
      '<p class="total"><span>Total a pagar en clínica</span><span>' + money(svc.price) + "</span></p>" +
      "</div>" +
      '<p class="confirm-note">Te enviamos el recordatorio a tu WhatsApp ' + escapeHtml(b.phone) +
      ". Si necesitas cambiar la hora, responde ese mensaje.</p>" +
      '<button type="button" class="btn-primary" id="btnAnother">Hacer otra reserva</button></div>';
    body.innerHTML = html;
    document.getElementById("btnAnother").addEventListener("click", function () {
      state.step = 1;
      state.service = null;
      state.professional = null;
      state.date = null;
      state.time = null;
      state.lastBooking = null;
      showStep();
    });
  }

  function bindBack() {
    var btn = body.querySelector("[data-back]");
    if (btn) {
      btn.addEventListener("click", function () {
        state.step = parseInt(btn.getAttribute("data-back"), 10);
        showStep();
      });
    }
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = freshState();
    activityList.innerHTML = "<li>🟢 La agenda en línea está activa y recibiendo reservas.</li>";
    renderPanel(null);
    showStep();
  });

  /* ---------- Arranque ---------- */
  renderPanel(null);
  showStep();
})();
