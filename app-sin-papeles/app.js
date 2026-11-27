/* PixelAndina — Demo interactiva: App Interna Sin Papeles
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    var EMPLOYEES = [
      "María Fernanda López",
      "Carlos Mendoza",
      "José Ramírez",
      "Ana Lucía Torres",
      "Pedro Salazar",
      "Lucía Herrera"
    ];

    /* Cada tipo define sus campos reales y cuántas hojas de papel
       reemplazaba su versión impresa (para el KPI de papel ahorrado). */
    var FORM_TYPES = {
      permiso: {
        label: "Solicitud de permiso / vacaciones",
        icon: "📅",
        sheets: 2,
        fields: [
          { name: "tipoPermiso", label: "Tipo de permiso", type: "select", required: true,
            options: ["Vacaciones", "Permiso personal", "Cita médica", "Día de cumpleaños", "Trámite personal"] },
          { name: "fechaInicio", label: "Fecha de inicio", type: "date", required: true },
          { name: "fechaFin", label: "Fecha de fin", type: "date", required: true },
          { name: "motivo", label: "Motivo", type: "textarea", required: true,
            placeholder: "Cuéntanos brevemente el motivo…" }
        ]
      },
      novedad: {
        label: "Reporte de novedad o daño",
        icon: "⚠️",
        sheets: 1,
        fields: [
          { name: "area", label: "Área", type: "select", required: true,
            options: ["Bodega", "Local de ventas", "Reparto", "Oficina"] },
          { name: "tipoNovedad", label: "Tipo de novedad", type: "select", required: true,
            options: ["Daño de equipo", "Producto dañado", "Falla de sistema", "Problema con un cliente", "Otro"] },
          { name: "descripcion", label: "Descripción", type: "textarea", required: true,
            placeholder: "Describe qué pasó…" },
          { name: "urgencia", label: "Urgencia", type: "select", required: true,
            options: ["Baja", "Media", "Alta"] }
        ]
      },
      checklist: {
        label: "Checklist de apertura de local",
        icon: "✅",
        sheets: 3,
        fields: [
          { name: "local", label: "Local", type: "select", required: true,
            options: ["Local Centro", "Local Norte", "Local Sur"] },
          { name: "fecha", label: "Fecha de apertura", type: "date", required: true },
          { name: "puntos", label: "Puntos verificados", type: "checks", required: true,
            options: ["Luces y señalética encendidas", "Caja registradora operativa",
                      "Vitrinas y estanterías ordenadas", "Limpieza del local",
                      "Personal uniformado y presente", "Sistema de facturación activo"] },
          { name: "observaciones", label: "Observaciones (opcional)", type: "textarea", required: false,
            placeholder: "Algo que reportar…" }
        ]
      },
      materiales: {
        label: "Solicitud de materiales",
        icon: "📦",
        sheets: 2,
        fields: [
          { name: "material", label: "Material", type: "select", required: true,
            options: ["Rollos térmicos para tickets", "Fundas de empaque", "Cinta de embalaje",
                      "Etiquetas adhesivas", "Útiles de limpieza", "Uniformes"] },
          { name: "cantidad", label: "Cantidad", type: "number", required: true },
          { name: "justificacion", label: "Justificación", type: "textarea", required: true,
            placeholder: "¿Para qué se necesita?…" }
        ]
      }
    };

    function seedSubmissions() {
      return [
        { id: "FOR-001", type: "permiso", employee: "María Fernanda López", today: true,
          status: "Pendiente", reviewReason: "",
          data: { tipoPermiso: "Vacaciones", fechaInicio: "2026-12-21", fechaFin: "2026-12-31",
                  motivo: "Viaje familiar de fin de año, planificado desde octubre." } },
        { id: "FOR-002", type: "novedad", employee: "José Ramírez", today: true,
          status: "Pendiente", reviewReason: "",
          data: { area: "Bodega", tipoNovedad: "Daño de equipo",
                  descripcion: "La impresora de etiquetas de la bodega imprime a la mitad y atrasa la salida de pedidos.",
                  urgencia: "Alta" } },
        { id: "FOR-003", type: "checklist", employee: "Ana Lucía Torres", today: true,
          status: "Aprobado", reviewReason: "",
          data: { local: "Local Centro", fecha: "2026-11-26",
                  puntos: ["Luces y señalética encendidas", "Caja registradora operativa",
                           "Vitrinas y estanterías ordenadas", "Limpieza del local",
                           "Personal uniformado y presente", "Sistema de facturación activo"],
                  observaciones: "Sin novedades en la apertura." } },
        { id: "FOR-004", type: "materiales", employee: "Pedro Salazar", today: false,
          status: "Aprobado", reviewReason: "",
          data: { material: "Rollos térmicos para tickets", cantidad: 10,
                  justificacion: "Quedan solo dos rollos en el Local Norte." } },
        { id: "FOR-005", type: "permiso", employee: "Carlos Mendoza", today: false,
          status: "Rechazado",
          reviewReason: "Coincide con la semana de inventario anual; hay que reprogramarlo para la semana siguiente.",
          data: { tipoPermiso: "Permiso personal", fechaInicio: "2026-11-30", fechaFin: "2026-12-01",
                  motivo: "Trámite bancario presencial." } }
      ];
    }

    function freshState() {
      return { submissions: seedSubmissions(), nextId: 6 };
    }

    function submissionById(state, id) {
      return state.submissions.filter(function (s) { return s.id === id; })[0] || null;
    }

    /* Validación de un envío. Devuelve null si está bien o el mensaje de error. */
    function validateSubmission(typeKey, employee, data) {
      var meta = FORM_TYPES[typeKey];
      if (!meta) return "Ese tipo de formulario no existe.";
      employee = String(employee || "").trim();
      if (EMPLOYEES.indexOf(employee) === -1) return "Elige quién envía el formulario.";
      data = data || {};
      for (var i = 0; i < meta.fields.length; i++) {
        var f = meta.fields[i];
        var v = data[f.name];
        if (f.type === "checks") {
          if (f.required && (!Array.isArray(v) || v.length === 0)) {
            return "Marca al menos un punto verificado del checklist.";
          }
          continue;
        }
        if (f.required && (v === undefined || v === null || String(v).trim() === "")) {
          return "Completa el campo «" + f.label + "».";
        }
        if (f.type === "number" && f.required) {
          var n = parseInt(v, 10);
          if (isNaN(n) || n < 1) return "La cantidad debe ser de al menos 1.";
        }
      }
      if (typeKey === "permiso" && data.fechaInicio && data.fechaFin && data.fechaFin < data.fechaInicio) {
        return "La fecha de fin no puede ser anterior a la fecha de inicio.";
      }
      return null;
    }

    /* Envía un formulario: nace con estado «Pendiente» en la bandeja. */
    function submitForm(state, typeKey, employee, data) {
      var error = validateSubmission(typeKey, employee, data);
      if (error) return { ok: false, error: error };
      var meta = FORM_TYPES[typeKey];
      var clean = {};
      meta.fields.forEach(function (f) {
        var v = data[f.name];
        if (f.type === "number") v = parseInt(v, 10);
        else if (f.type === "checks") v = Array.isArray(v) ? v.slice() : [];
        else v = v === undefined || v === null ? "" : String(v).trim();
        clean[f.name] = v;
      });
      var id = "FOR-" + ("00" + state.nextId).slice(-3);
      state.nextId += 1;
      var sub = {
        id: id, type: typeKey, employee: String(employee).trim(),
        data: clean, status: "Pendiente", reviewReason: "", today: true
      };
      state.submissions.push(sub);
      return { ok: true, submission: sub };
    }

    /* Revisión del jefe: aprobar o rechazar (el rechazo exige motivo).
       Solo el rol «Jefe» puede revisar, y solo envíos «Pendiente». */
    function reviewSubmission(state, id, decision, reason, role) {
      if (role !== "Jefe") {
        return { ok: false, error: "Solo el rol Jefe puede aprobar o rechazar. Cambia el rol arriba para probar." };
      }
      var s = submissionById(state, id);
      if (!s) return { ok: false, error: "Ese formulario ya no existe." };
      if (s.status !== "Pendiente") {
        return { ok: false, error: "Ese formulario ya fue revisado: está «" + s.status + "»." };
      }
      if (decision !== "Aprobado" && decision !== "Rechazado") {
        return { ok: false, error: "La decisión debe ser aprobar o rechazar." };
      }
      reason = String(reason || "").trim();
      if (decision === "Rechazado" && reason === "") {
        return { ok: false, error: "Para rechazar hay que escribir el motivo." };
      }
      s.status = decision;
      s.reviewReason = reason;
      return { ok: true, submission: s };
    }

    /* Filtra la bandeja por tipo y/o estado ("todos" = sin filtro).
       Devuelve los más recientes primero. */
    function filterSubmissions(state, typeFilter, statusFilter) {
      return state.submissions.filter(function (s) {
        var matchT = !typeFilter || typeFilter === "todos" || s.type === typeFilter;
        var matchS = !statusFilter || statusFilter === "todos" || s.status === statusFilter;
        return matchT && matchS;
      }).slice().reverse();
    }

    function computeKpis(state) {
      var paper = state.submissions.reduce(function (sum, s) {
        return sum + (FORM_TYPES[s.type] ? FORM_TYPES[s.type].sheets : 0);
      }, 0);
      return {
        sentToday: state.submissions.filter(function (s) { return s.today; }).length,
        pending: state.submissions.filter(function (s) { return s.status === "Pendiente"; }).length,
        approvedMonth: state.submissions.filter(function (s) { return s.status === "Aprobado"; }).length,
        paperSaved: paper
      };
    }

    return {
      EMPLOYEES: EMPLOYEES,
      FORM_TYPES: FORM_TYPES,
      freshState: freshState,
      submissionById: submissionById,
      validateSubmission: validateSubmission,
      submitForm: submitForm,
      reviewSubmission: reviewSubmission,
      filterSubmissions: filterSubmissions,
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
  var role = "Empleado";
  var expandedId = null;   /* envío con el detalle abierto */
  var rejectingId = null;  /* envío con la caja de motivo de rechazo abierta */

  var kpiToday = document.getElementById("kpiToday");
  var kpiPending = document.getElementById("kpiPending");
  var kpiApproved = document.getElementById("kpiApproved");
  var kpiPaper = document.getElementById("kpiPaper");
  var roleSelect = document.getElementById("roleSelect");
  var roleHint = document.getElementById("roleHint");
  var formEmployee = document.getElementById("formEmployee");
  var formType = document.getElementById("formType");
  var formFields = document.getElementById("formFields");
  var formError = document.getElementById("formError");
  var pendingList = document.getElementById("pendingList");
  var filterType = document.getElementById("filterType");
  var filterStatus = document.getElementById("filterStatus");
  var inboxBody = document.getElementById("inboxBody");
  var activityList = document.getElementById("activityList");

  var ROLE_HINTS = {
    "Empleado": "Como empleado puedes llenar y enviar formularios. Cambia a rol Jefe para aprobarlos o rechazarlos.",
    "Jefe": "Como jefe puedes aprobar o rechazar los formularios pendientes desde la bandeja o la lista lateral."
  };

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

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var k = DemoCore.computeKpis(state);
    kpiToday.textContent = k.sentToday;
    kpiPending.textContent = k.pending;
    kpiApproved.textContent = k.approvedMonth;
    kpiPaper.textContent = k.paperSaved;
  }

  /* ---------- Formulario dinámico ---------- */
  function fillStaticSelects() {
    formEmployee.innerHTML = DemoCore.EMPLOYEES.map(function (e) {
      return '<option value="' + escapeHtml(e) + '">' + escapeHtml(e) + "</option>";
    }).join("");
    formType.innerHTML = Object.keys(DemoCore.FORM_TYPES).map(function (key) {
      var m = DemoCore.FORM_TYPES[key];
      return '<option value="' + key + '">' + m.icon + " " + escapeHtml(m.label) + "</option>";
    }).join("");
    var ft = '<option value="todos">Todos los tipos</option>' + Object.keys(DemoCore.FORM_TYPES).map(function (key) {
      var m = DemoCore.FORM_TYPES[key];
      return '<option value="' + key + '">' + escapeHtml(m.label) + "</option>";
    }).join("");
    filterType.innerHTML = ft;
  }

  function renderFormFields() {
    var meta = DemoCore.FORM_TYPES[formType.value];
    formFields.innerHTML = "";
    meta.fields.forEach(function (f) {
      var wrap = document.createElement("div");
      wrap.className = "field";
      if (f.type === "select") {
        wrap.innerHTML = '<label for="f_' + f.name + '">' + escapeHtml(f.label) + "</label>" +
          '<select id="f_' + f.name + '"><option value="">Elige…</option>' +
          f.options.map(function (o) { return '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + "</option>"; }).join("") +
          "</select>";
      } else if (f.type === "date") {
        wrap.innerHTML = '<label for="f_' + f.name + '">' + escapeHtml(f.label) + '</label>' +
          '<input type="date" id="f_' + f.name + '">';
      } else if (f.type === "number") {
        wrap.innerHTML = '<label for="f_' + f.name + '">' + escapeHtml(f.label) + '</label>' +
          '<input type="number" id="f_' + f.name + '" min="1" step="1" placeholder="1">';
      } else if (f.type === "textarea") {
        wrap.innerHTML = '<label for="f_' + f.name + '">' + escapeHtml(f.label) + '</label>' +
          '<textarea id="f_' + f.name + '" placeholder="' + escapeHtml(f.placeholder || "") + '"></textarea>';
      } else if (f.type === "checks") {
        wrap.innerHTML = '<span class="field-label">' + escapeHtml(f.label) + '</span>' +
          '<div class="checks-group">' +
          f.options.map(function (o) {
            return '<label class="check-item"><input type="checkbox" class="check-point" data-field="' + f.name +
              '" value="' + escapeHtml(o) + '"> ' + escapeHtml(o) + "</label>";
          }).join("") + "</div>";
      }
      formFields.appendChild(wrap);
    });
  }

  function readFormData() {
    var meta = DemoCore.FORM_TYPES[formType.value];
    var data = {};
    meta.fields.forEach(function (f) {
      if (f.type === "checks") {
        data[f.name] = Array.prototype.map.call(
          formFields.querySelectorAll('.check-point[data-field="' + f.name + '"]:checked'),
          function (c) { return c.value; }
        );
      } else {
        var el = document.getElementById("f_" + f.name);
        data[f.name] = el ? el.value : "";
      }
    });
    return data;
  }

  document.getElementById("paperForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var typeKey = formType.value;
    var meta = DemoCore.FORM_TYPES[typeKey];
    var res = DemoCore.submitForm(state, typeKey, formEmployee.value, readFormData());
    if (!res.ok) { showError(formError, res.error); return; }
    showError(formError, "");
    var s = res.submission;
    logActivity("📤 " + s.id + ": " + s.employee + " envió «" + meta.label + "». Quedó «Pendiente» de aprobación y ahorró " + meta.sheets + " hojas de papel.");
    expandedId = s.id;
    renderAll(s.id);
  });

  /* ---------- Lista lateral de pendientes ---------- */
  function renderPending() {
    var pending = state.submissions.filter(function (s) { return s.status === "Pendiente"; });
    pendingList.innerHTML = "";
    if (pending.length === 0) {
      var liOk = document.createElement("li");
      liOk.className = "fine";
      liOk.innerHTML = "<strong>✅ Nada pendiente.</strong><span class='pending-meta'>El jefe está al día con las aprobaciones.</span>";
      pendingList.appendChild(liOk);
      return;
    }
    pending.slice().reverse().forEach(function (s) {
      var meta = DemoCore.FORM_TYPES[s.type];
      var li = document.createElement("li");
      li.innerHTML = "<strong>" + meta.icon + " " + escapeHtml(meta.label) + "</strong>" +
        '<span class="pending-meta">' + s.id + " · " + escapeHtml(s.employee) + "</span>";
      var actions = document.createElement("div");
      actions.className = "pending-actions";
      if (role === "Jefe") {
        var bOk = document.createElement("button");
        bOk.type = "button"; bOk.className = "btn-small"; bOk.textContent = "✓ Aprobar";
        bOk.addEventListener("click", function () { doReview(s.id, "Aprobado", ""); });
        var bNo = document.createElement("button");
        bNo.type = "button"; bNo.className = "btn-small danger"; bNo.textContent = "✕ Rechazar";
        bNo.addEventListener("click", function () { openReject(s.id, true); });
        actions.appendChild(bOk);
        actions.appendChild(bNo);
      } else {
        var hint = document.createElement("span");
        hint.className = "no-actions";
        hint.textContent = "Esperando revisión del jefe";
        actions.appendChild(hint);
      }
      li.appendChild(actions);
      pendingList.appendChild(li);
    });
  }

  /* ---------- Bandeja / historial ---------- */
  function summaryOf(s) {
    var d = s.data;
    if (s.type === "permiso") return d.tipoPermiso + " · " + d.fechaInicio + " → " + d.fechaFin;
    if (s.type === "novedad") return d.area + " · " + d.tipoNovedad + " · Urgencia " + d.urgencia;
    if (s.type === "checklist") return d.local + " · " + (d.puntos ? d.puntos.length : 0) + " puntos verificados";
    if (s.type === "materiales") return d.cantidad + " × " + d.material;
    return "";
  }

  function detailHtml(s) {
    var meta = DemoCore.FORM_TYPES[s.type];
    var items = meta.fields.map(function (f) {
      var v = s.data[f.name];
      var text = Array.isArray(v) ? (v.length ? v.join("; ") : "—") : (v === "" || v === undefined ? "—" : String(v));
      return "<div><dt>" + escapeHtml(f.label) + "</dt><dd>" + escapeHtml(text) + "</dd></div>";
    }).join("");
    var html = '<dl class="detail-grid">' + items + "</dl>";
    if (s.status === "Rechazado" && s.reviewReason) {
      html += '<p class="detail-reason">✕ <strong>Motivo del rechazo:</strong> ' + escapeHtml(s.reviewReason) + "</p>";
    }
    return html;
  }

  function renderInbox(highlightId) {
    var rows = DemoCore.filterSubmissions(state, filterType.value, filterStatus.value);
    inboxBody.innerHTML = "";
    if (rows.length === 0) {
      var trE = document.createElement("tr");
      trE.className = "empty-row";
      trE.innerHTML = '<td colspan="6">Ningún formulario coincide con los filtros elegidos.</td>';
      inboxBody.appendChild(trE);
      return;
    }
    rows.forEach(function (s) {
      var meta = DemoCore.FORM_TYPES[s.type];
      var tr = document.createElement("tr");
      if (highlightId && s.id === highlightId) tr.className = "new-row";
      tr.innerHTML =
        "<td><strong>" + s.id + "</strong></td>" +
        '<td><span class="badge type-badge">' + meta.icon + " " + escapeHtml(meta.label) + "</span></td>" +
        "<td>" + escapeHtml(s.employee) + "</td>" +
        '<td class="detail-cell">' + escapeHtml(summaryOf(s)) + "</td>" +
        '<td><span class="badge st-' + s.status.toLowerCase() + '">' + s.status + "</span></td>";
      var tdA = document.createElement("td");
      tdA.className = "actions-cell";
      var bDetail = document.createElement("button");
      bDetail.type = "button"; bDetail.className = "btn-small";
      bDetail.textContent = expandedId === s.id ? "Ocultar" : "Ver detalle";
      bDetail.addEventListener("click", function () {
        expandedId = expandedId === s.id ? null : s.id;
        if (expandedId !== s.id) rejectingId = null;
        renderInbox(null);
      });
      tdA.appendChild(bDetail);
      if (s.status === "Pendiente" && role === "Jefe") {
        var bOk = document.createElement("button");
        bOk.type = "button"; bOk.className = "btn-small"; bOk.textContent = "✓ Aprobar";
        bOk.addEventListener("click", function () { doReview(s.id, "Aprobado", ""); });
        var bNo = document.createElement("button");
        bNo.type = "button"; bNo.className = "btn-small danger"; bNo.textContent = "✕ Rechazar";
        bNo.addEventListener("click", function () { openReject(s.id, false); });
        tdA.appendChild(bOk);
        tdA.appendChild(bNo);
      } else if (s.status === "Pendiente") {
        var hint = document.createElement("span");
        hint.className = "no-actions";
        hint.textContent = "En revisión";
        tdA.appendChild(hint);
      }
      tr.appendChild(tdA);
      inboxBody.appendChild(tr);

      if (expandedId === s.id) {
        var trD = document.createElement("tr");
        trD.className = "detail-row";
        var tdD = document.createElement("td");
        tdD.colSpan = 6;
        tdD.innerHTML = detailHtml(s);
        if (rejectingId === s.id && s.status === "Pendiente" && role === "Jefe") {
          var box = document.createElement("div");
          box.className = "reject-box";
          box.innerHTML = '<label>Motivo del rechazo (obligatorio)</label>' +
            '<textarea class="reject-reason" placeholder="Explica por qué se rechaza, para que el empleado lo corrija…"></textarea>';
          var bConfirm = document.createElement("button");
          bConfirm.type = "button"; bConfirm.className = "btn-small danger"; bConfirm.textContent = "Confirmar rechazo";
          bConfirm.addEventListener("click", function () {
            var reason = box.querySelector(".reject-reason").value;
            doReview(s.id, "Rechazado", reason);
          });
          box.appendChild(bConfirm);
          tdD.appendChild(box);
        }
        trD.appendChild(tdD);
        inboxBody.appendChild(trD);
      }
    });
  }

  function openReject(id, scroll) {
    expandedId = id;
    rejectingId = id;
    renderInbox(null);
    if (scroll) {
      var panel = document.querySelector(".inbox-panel");
      if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function doReview(id, decision, reason) {
    var res = DemoCore.reviewSubmission(state, id, decision, reason, role);
    if (!res.ok) { window.alert(res.error); return; }
    var s = res.submission;
    var meta = DemoCore.FORM_TYPES[s.type];
    if (decision === "Aprobado") {
      logActivity("✅ " + s.id + " («" + meta.label + "» de " + s.employee + ") fue APROBADO por el jefe.");
    } else {
      logActivity("✕ " + s.id + " («" + meta.label + "» de " + s.employee + ") fue RECHAZADO. Motivo: " + s.reviewReason);
    }
    rejectingId = null;
    renderAll(null);
  }

  /* ---------- Rol ---------- */
  roleSelect.addEventListener("change", function () {
    role = roleSelect.value;
    roleHint.textContent = ROLE_HINTS[role];
    rejectingId = null;
    logActivity(role === "Jefe"
      ? "👔 Ahora actúas como Jefe: ya puedes aprobar o rechazar los formularios pendientes."
      : "🧑‍💼 Ahora actúas como Empleado: puedes enviar formularios nuevos.");
    renderAll(null);
  });

  /* ---------- Filtros ---------- */
  filterType.addEventListener("change", function () { renderInbox(null); });
  filterStatus.addEventListener("change", function () { renderInbox(null); });
  formType.addEventListener("change", function () {
    showError(formError, "");
    renderFormFields();
  });

  /* ---------- Render general ---------- */
  function renderAll(highlightId) {
    renderKpis();
    renderPending();
    renderInbox(highlightId);
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = DemoCore.freshState();
    role = "Empleado";
    roleSelect.value = "Empleado";
    roleHint.textContent = ROLE_HINTS["Empleado"];
    expandedId = null;
    rejectingId = null;
    filterType.value = "todos";
    filterStatus.value = "todos";
    formType.value = "permiso";
    showError(formError, "");
    renderFormFields();
    activityList.innerHTML = "<li>🟢 La app está activa: cada envío y cada decisión quedan registrados al instante.</li>";
    renderAll(null);
  });

  /* ---------- Arranque ---------- */
  fillStaticSelects();
  renderFormFields();
  renderAll(null);
})();
