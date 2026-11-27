/* PixelAndina — Demo interactiva: Facturación Electrónica
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   Ningún comprobante sale de esta página ni llega al SRI.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    var IVA_RATE = 0.15;

    /* Emisor 100% ficticio. El RUC es un patrón de ejemplo, no real. */
    var EMISOR = {
      nombre: "Comercial Andina — Demo",
      ruc: "1790000000001",
      direccion: "Av. de Ejemplo 123 y Calle Demo, Guayaquil",
      estab: "001",
      ptoEmi: "001",
      ambiente: "Producción (simulado)"
    };

    /* Productos/servicios frecuentes para autorellenar el formulario. */
    function seedPresets() {
      return [
        { desc: "Diseño de página web de negocio", price: 69.00, tarifa: 15 },
        { desc: "Panel o app sencilla a medida", price: 129.00, tarifa: 15 },
        { desc: "Soporte y mantenimiento mensual", price: 5.00, tarifa: 15 },
        { desc: "Capacitación al personal (por hora)", price: 25.00, tarifa: 15 },
        { desc: "Libro contable impreso", price: 12.00, tarifa: 0 },
        { desc: "Cuaderno de apuntes A5", price: 3.50, tarifa: 0 }
      ];
    }

    function round2(n) { return Math.round(n * 100) / 100; }

    function money(n) { return "$" + Number(n).toFixed(2); }

    /* ---------- Líneas del borrador ---------- */
    function normalizeLine(line) {
      return {
        desc: String((line && line.desc) || "").trim(),
        qty: Number(line && line.qty),
        price: Number(line && line.price),
        tarifa: Number(line && line.tarifa) === 0 ? 0 : 15
      };
    }

    function validateLine(line) {
      var ln = normalizeLine(line);
      if (ln.desc.length < 3) return "Escribe la descripción del producto o servicio (mínimo 3 letras).";
      if (isNaN(ln.qty) || ln.qty <= 0) return "La cantidad debe ser mayor que cero.";
      if (isNaN(ln.price) || ln.price <= 0) return "El precio unitario debe ser mayor que cero.";
      return "";
    }

    function addLine(state, line) {
      var err = validateLine(line);
      if (err) return { ok: false, error: err };
      var ln = normalizeLine(line);
      ln.qty = round2(ln.qty);
      ln.price = round2(ln.price);
      state.draft.push(ln);
      return { ok: true, line: ln, index: state.draft.length - 1 };
    }

    function removeLine(state, index) {
      index = parseInt(index, 10);
      if (isNaN(index) || index < 0 || index >= state.draft.length) {
        return { ok: false, error: "Esa línea ya no existe." };
      }
      state.draft.splice(index, 1);
      return { ok: true };
    }

    function lineAmount(ln) { return round2(ln.qty * ln.price); }

    /* Totales de un conjunto de líneas: el IVA se calcula solo sobre la
       base de tarifa 15%; las líneas al 0% no generan impuesto. */
    function totalsForLines(lines) {
      var base15 = 0, base0 = 0;
      lines.forEach(function (ln) {
        var amt = lineAmount(ln);
        if (ln.tarifa === 0) base0 += amt; else base15 += amt;
      });
      base15 = round2(base15);
      base0 = round2(base0);
      var iva = round2(base15 * IVA_RATE);
      return {
        base15: base15, base0: base0,
        subtotal: round2(base15 + base0),
        iva: iva, total: round2(base15 + base0 + iva)
      };
    }

    function draftTotals(state) { return totalsForLines(state.draft); }

    /* ---------- Cliente ---------- */
    function normalizeClient(client) {
      return {
        nombre: String((client && client.nombre) || "").trim(),
        idTipo: String((client && client.idTipo) || "Cédula"),
        id: String((client && client.id) || "").trim(),
        correo: String((client && client.correo) || "").trim()
      };
    }

    function emailLooksValid(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }

    /* Errores de formulario: impiden crear el comprobante. La identificación
       CORTA no es error de formulario a propósito: pasa y la «autoridad»
       simulada la rechaza en el ciclo, para mostrar ese flujo completo. */
    function validateClientForm(client) {
      var c = normalizeClient(client);
      if (c.nombre.length < 3) return "Escribe el nombre o razón social del cliente.";
      if (c.id.length === 0) return "Escribe la identificación del cliente.";
      if (!emailLooksValid(c.correo)) return "Escribe un correo válido para enviar el comprobante.";
      return "";
    }

    /* Regla de autorización simulada: devuelve el motivo de rechazo o "". */
    function rechazoMotivo(client) {
      var c = normalizeClient(client);
      var digits = c.id.replace(/\D/g, "");
      if (c.idTipo === "Consumidor final") return "";
      if (digits.length < 10 && c.idTipo !== "Pasaporte") {
        return "Identificación del receptor inválida: tiene " + digits.length +
          " dígitos y el mínimo aceptado es 10. Revisa el número y vuelve a emitir.";
      }
      if (c.idTipo === "Cédula" && digits.length !== 10) {
        return "Identificación del receptor inválida: la cédula debe tener exactamente 10 dígitos y tiene " + digits.length + ".";
      }
      if (c.idTipo === "RUC" && digits.length !== 13) {
        return "Identificación del receptor inválida: el RUC debe tener exactamente 13 dígitos y tiene " + digits.length + ".";
      }
      if (c.idTipo === "Pasaporte" && c.id.length < 6) {
        return "Identificación del receptor inválida: el pasaporte es demasiado corto.";
      }
      return "";
    }

    /* ---------- Numeración y clave de acceso ---------- */
    function pad(n, len) {
      var s = String(n);
      while (s.length < len) s = "0" + s;
      return s;
    }

    function numeroComprobante(seq) {
      return EMISOR.estab + "-" + EMISOR.ptoEmi + "-" + pad(seq, 9);
    }

    /* Dígito verificador módulo 11, como el del sistema real:
       coeficientes 2..7 de derecha a izquierda sobre los 48 dígitos. */
    function digitoVerificador(base48) {
      var suma = 0, coef = 2;
      for (var i = base48.length - 1; i >= 0; i--) {
        suma += Number(base48.charAt(i)) * coef;
        coef = coef === 7 ? 2 : coef + 1;
      }
      var resto = 11 - (suma % 11);
      if (resto === 11) return "0";
      if (resto === 10) return "1";
      return String(resto);
    }

    /* Clave de acceso ficticia de 49 dígitos con la misma estructura de la
       real: fecha(8) + tipo(2) + RUC(13) + ambiente(1) + serie(6) +
       secuencial(9) + código numérico(8) + tipo de emisión(1) + dígito(1). */
    function generarClaveAcceso(fecha, seq) {
      var f = pad(fecha.getDate(), 2) + pad(fecha.getMonth() + 1, 2) + String(fecha.getFullYear());
      var codigoNumerico = pad(10000000 + ((seq * 7919) % 89999999), 8);
      var base = f + "01" + EMISOR.ruc + "1" + EMISOR.estab + EMISOR.ptoEmi +
        pad(seq, 9) + codigoNumerico + "1";
      return base + digitoVerificador(base);
    }

    function fechaTexto(fecha) {
      return pad(fecha.getDate(), 2) + "/" + pad(fecha.getMonth() + 1, 2) + "/" + fecha.getFullYear() +
        " " + pad(fecha.getHours(), 2) + ":" + pad(fecha.getMinutes(), 2);
    }

    /* ---------- Comprobantes ---------- */
    function makeComprobante(state, cliente, lines, fecha) {
      var seq = state.nextSeq;
      var totals = totalsForLines(lines);
      return {
        numero: numeroComprobante(seq),
        seq: seq,
        claveAcceso: generarClaveAcceso(fecha, seq),
        fecha: fechaTexto(fecha),
        cliente: normalizeClient(cliente),
        lines: lines.map(function (ln) {
          return { desc: ln.desc, qty: ln.qty, price: ln.price, tarifa: ln.tarifa };
        }),
        totals: totals,
        estado: "Generada",
        motivoRechazo: "",
        motivoAnulacion: "",
        enviadoCorreo: false
      };
    }

    /* Emite: crea el comprobante en estado «Generada» y limpia el borrador.
       El avance Firmada → Autorizada/Rechazada se hace con las funciones
       de abajo, en orden. */
    function emitir(state, cliente, fecha) {
      var errCli = validateClientForm(cliente);
      if (errCli) return { ok: false, error: errCli };
      if (state.draft.length === 0) {
        return { ok: false, error: "Agrega al menos un producto o servicio antes de emitir." };
      }
      var comp = makeComprobante(state, cliente, state.draft, fecha || new Date());
      state.nextSeq += 1;
      state.comprobantes.push(comp);
      state.draft = [];
      return { ok: true, comprobante: comp };
    }

    function comprobanteByNumero(state, numero) {
      return state.comprobantes.filter(function (c) { return c.numero === numero; })[0] || null;
    }

    function firmar(state, numero) {
      var comp = comprobanteByNumero(state, numero);
      if (!comp) return { ok: false, error: "Ese comprobante ya no existe." };
      if (comp.estado !== "Generada") {
        return { ok: false, error: "Solo se puede firmar un comprobante en estado «Generada» (está en «" + comp.estado + "»)." };
      }
      comp.estado = "Firmada";
      return { ok: true, comprobante: comp };
    }

    /* La autorización aplica la regla de la identificación: si falla, el
       comprobante queda «Rechazada» con su motivo; si pasa, «Autorizada». */
    function autorizar(state, numero) {
      var comp = comprobanteByNumero(state, numero);
      if (!comp) return { ok: false, error: "Ese comprobante ya no existe." };
      if (comp.estado !== "Firmada") {
        return { ok: false, error: "Solo se puede autorizar un comprobante en estado «Firmada» (está en «" + comp.estado + "»)." };
      }
      var motivo = rechazoMotivo(comp.cliente);
      if (motivo) {
        comp.estado = "Rechazada";
        comp.motivoRechazo = motivo;
      } else {
        comp.estado = "Autorizada";
      }
      return { ok: true, comprobante: comp };
    }

    function enviarPorCorreo(state, numero) {
      var comp = comprobanteByNumero(state, numero);
      if (!comp) return { ok: false, error: "Ese comprobante ya no existe." };
      if (comp.estado !== "Autorizada") {
        return { ok: false, error: "Solo se envían por correo comprobantes autorizados (está en «" + comp.estado + "»)." };
      }
      if (comp.enviadoCorreo) return { ok: false, error: "Este comprobante ya fue enviado por correo." };
      comp.enviadoCorreo = true;
      return { ok: true, comprobante: comp };
    }

    function anular(state, numero, motivo) {
      var comp = comprobanteByNumero(state, numero);
      if (!comp) return { ok: false, error: "Ese comprobante ya no existe." };
      if (comp.estado !== "Autorizada") {
        return { ok: false, error: "Solo se puede anular un comprobante autorizado (está en «" + comp.estado + "»)." };
      }
      motivo = String(motivo || "").trim();
      if (motivo.length < 5) return { ok: false, error: "Escribe el motivo de la anulación (mínimo 5 letras)." };
      comp.estado = "Anulada";
      comp.motivoAnulacion = motivo;
      return { ok: true, comprobante: comp };
    }

    function computeKpis(state) {
      var autorizadas = state.comprobantes.filter(function (c) { return c.estado === "Autorizada"; });
      var monto = autorizadas.reduce(function (s, c) { return s + c.totals.total; }, 0);
      return {
        emitidas: state.comprobantes.length,
        montoFacturado: round2(monto),
        autorizadas: autorizadas.length,
        rechazadas: state.comprobantes.filter(function (c) { return c.estado === "Rechazada"; }).length
      };
    }

    /* ---------- Estado inicial con ejemplos ---------- */
    function seedComprobantes(state) {
      var f1 = new Date(2026, 10, 27, 8, 15);
      var c1 = makeComprobante(state,
        { nombre: "María Fernanda López", idTipo: "Cédula", id: "0912345678", correo: "maria.lopez@correo.com" },
        [ { desc: "Diseño de página web de negocio", qty: 1, price: 69.00, tarifa: 15 },
          { desc: "Soporte y mantenimiento mensual", qty: 2, price: 5.00, tarifa: 15 } ], f1);
      state.nextSeq += 1;
      c1.estado = "Autorizada";
      c1.enviadoCorreo = true;

      var f2 = new Date(2026, 10, 27, 9, 40);
      var c2 = makeComprobante(state,
        { nombre: "Tienda y Víveres El Ahorro", idTipo: "RUC", id: "0991234567001", correo: "tienda.elahorro@correo.com" },
        [ { desc: "Libro contable impreso", qty: 3, price: 12.00, tarifa: 0 },
          { desc: "Capacitación al personal (por hora)", qty: 2, price: 25.00, tarifa: 15 } ], f2);
      state.nextSeq += 1;
      c2.estado = "Autorizada";

      var f3 = new Date(2026, 10, 27, 10, 5);
      var c3 = makeComprobante(state,
        { nombre: "Juan Pérez", idTipo: "Cédula", id: "09123", correo: "juan.perez@correo.com" },
        [ { desc: "Cuaderno de apuntes A5", qty: 4, price: 3.50, tarifa: 0 } ], f3);
      state.nextSeq += 1;
      c3.estado = "Rechazada";
      c3.motivoRechazo = rechazoMotivo(c3.cliente);

      return [c1, c2, c3];
    }

    function freshState() {
      var state = { draft: [], comprobantes: [], nextSeq: 1, presets: seedPresets() };
      state.comprobantes = seedComprobantes(state);
      return state;
    }

    return {
      IVA_RATE: IVA_RATE,
      EMISOR: EMISOR,
      freshState: freshState,
      round2: round2,
      money: money,
      addLine: addLine,
      removeLine: removeLine,
      lineAmount: lineAmount,
      totalsForLines: totalsForLines,
      draftTotals: draftTotals,
      validateClientForm: validateClientForm,
      rechazoMotivo: rechazoMotivo,
      numeroComprobante: numeroComprobante,
      generarClaveAcceso: generarClaveAcceso,
      digitoVerificador: digitoVerificador,
      emitir: emitir,
      firmar: firmar,
      autorizar: autorizar,
      enviarPorCorreo: enviarPorCorreo,
      anular: anular,
      comprobanteByNumero: comprobanteByNumero,
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
  var selectedNumero = null;   /* comprobante mostrado en el RIDE */
  var anulTarget = null;       /* comprobante en proceso de anulación */
  var emitting = false;        /* ciclo de autorización en curso */
  var timers = [];

  var kpiEmitidas = document.getElementById("kpiEmitidas");
  var kpiMonto = document.getElementById("kpiMonto");
  var kpiAutorizadas = document.getElementById("kpiAutorizadas");
  var kpiRechazadas = document.getElementById("kpiRechazadas");
  var emitError = document.getElementById("emitError");
  var linesBox = document.getElementById("linesBox");
  var linesEmpty = document.getElementById("linesEmpty");
  var invoicesBody = document.getElementById("invoicesBody");
  var activityList = document.getElementById("activityList");
  var rideDoc = document.getElementById("rideDoc");
  var stepsBox = document.getElementById("stepsBox");
  var cycleNote = document.getElementById("cycleNote");
  var anulBox = document.getElementById("anulBox");
  var anulInfo = document.getElementById("anulInfo");
  var anulMotivo = document.getElementById("anulMotivo");
  var anulError = document.getElementById("anulError");
  var btnEmit = document.getElementById("btnEmit");

  function money(n) { return DemoCore.money(n); }

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

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var k = DemoCore.computeKpis(state);
    kpiEmitidas.textContent = k.emitidas;
    kpiMonto.textContent = money(k.montoFacturado);
    kpiAutorizadas.textContent = k.autorizadas;
    kpiRechazadas.textContent = k.rechazadas;
  }

  /* ---------- Borrador: líneas y totales ---------- */
  function fillPresets() {
    var sel = document.getElementById("presetSelect");
    state.presets.forEach(function (p, i) {
      var opt = document.createElement("option");
      opt.value = i;
      opt.textContent = p.desc + " — " + money(p.price);
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () {
      if (sel.value === "") return;
      var p = state.presets[Number(sel.value)];
      document.getElementById("prodDesc").value = p.desc;
      document.getElementById("prodPrice").value = p.price;
      document.getElementById("prodIva").value = String(p.tarifa);
    });
  }

  function renderDraft() {
    linesBox.innerHTML = "";
    linesEmpty.style.display = state.draft.length === 0 ? "block" : "none";
    state.draft.forEach(function (ln, i) {
      var row = document.createElement("div");
      row.className = "draft-line";
      row.innerHTML =
        '<div class="draft-line-main"><strong>' + escapeHtml(ln.desc) + "</strong>" +
        '<span class="dl-sub">' + ln.qty + " × " + money(ln.price) + " · IVA " + ln.tarifa + "%</span></div>" +
        '<span class="draft-line-total">' + money(DemoCore.lineAmount(ln)) + "</span>";
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "btn-remove-line";
      rm.textContent = "✕";
      rm.title = "Quitar línea";
      rm.addEventListener("click", function () {
        DemoCore.removeLine(state, i);
        renderDraft();
      });
      row.appendChild(rm);
      linesBox.appendChild(row);
    });
    var t = DemoCore.draftTotals(state);
    document.getElementById("sumBase15").textContent = money(t.base15);
    document.getElementById("sumBase0").textContent = money(t.base0);
    document.getElementById("sumIva").textContent = money(t.iva);
    document.getElementById("sumTotal").textContent = money(t.total);
  }

  document.getElementById("btnAddLine").addEventListener("click", function () {
    var res = DemoCore.addLine(state, {
      desc: document.getElementById("prodDesc").value,
      qty: document.getElementById("prodQty").value,
      price: document.getElementById("prodPrice").value,
      tarifa: document.getElementById("prodIva").value
    });
    if (!res.ok) { showError(emitError, res.error); return; }
    showError(emitError, "");
    document.getElementById("prodDesc").value = "";
    document.getElementById("prodQty").value = "1";
    document.getElementById("prodPrice").value = "";
    document.getElementById("presetSelect").value = "";
    renderDraft();
  });

  /* ---------- Ciclo de estados (visual) ---------- */
  function renderCycle(comp) {
    var steps = stepsBox.querySelectorAll(".step");
    steps.forEach(function (s) { s.classList.remove("done", "current", "failed"); });
    var gen = stepsBox.querySelector('[data-step="generada"]');
    var fir = stepsBox.querySelector('[data-step="firmada"]');
    var fin = stepsBox.querySelector('[data-step="final"]');
    var finLabel = fin.querySelector(".step-label");
    if (!comp) {
      finLabel.textContent = "Autorizada";
      cycleNote.textContent = "Emite una factura o elige «Ver RIDE» en el panel de abajo para seguir su ciclo.";
      return;
    }
    gen.classList.add("done");
    if (comp.estado === "Generada") {
      fir.classList.add("current");
      finLabel.textContent = "Autorizada";
      cycleNote.textContent = "📝 " + comp.numero + ": comprobante generado. Firmándolo (simulado)…";
    } else if (comp.estado === "Firmada") {
      fir.classList.add("done");
      fin.classList.add("current");
      finLabel.textContent = "Autorizada";
      cycleNote.textContent = "✍️ " + comp.numero + ": firmado. Esperando la respuesta de la autorización (simulada)…";
    } else if (comp.estado === "Autorizada" || comp.estado === "Anulada") {
      fir.classList.add("done");
      fin.classList.add("done");
      finLabel.textContent = "Autorizada";
      cycleNote.textContent = comp.estado === "Autorizada"
        ? "✅ " + comp.numero + ": AUTORIZADA (simulado). Ya puedes enviarla por correo desde el panel."
        : "🚫 " + comp.numero + ": fue autorizada y luego anulada. Motivo: " + comp.motivoAnulacion;
    } else if (comp.estado === "Rechazada") {
      fir.classList.add("done");
      fin.classList.add("failed");
      finLabel.textContent = "Rechazada";
      cycleNote.textContent = "❌ " + comp.numero + ": RECHAZADA (simulado). " + comp.motivoRechazo;
    }
  }

  /* ---------- RIDE ---------- */
  function renderRide(comp) {
    if (!comp) {
      rideDoc.innerHTML = '<p class="ride-empty">Aún no hay un comprobante seleccionado. Emite una factura o pulsa «Ver RIDE» en cualquier comprobante del panel.</p>';
      renderCycle(null);
      return;
    }
    var e = DemoCore.EMISOR;
    var rows = comp.lines.map(function (ln) {
      return "<tr><td>" + escapeHtml(ln.desc) + '</td><td class="num">' + ln.qty +
        '</td><td class="num">' + money(ln.price) + '</td><td class="num">' + ln.tarifa +
        '%</td><td class="num">' + money(DemoCore.lineAmount(ln)) + "</td></tr>";
    }).join("");
    rideDoc.innerHTML =
      '<div class="ride-head">' +
        '<div class="ride-emisor"><h4>' + escapeHtml(e.nombre) + "</h4>" +
        "<p>RUC ficticio de ejemplo: " + e.ruc + "</p>" +
        "<p>" + escapeHtml(e.direccion) + "</p></div>" +
        '<div class="ride-num"><div class="ride-doc-type">Factura electrónica</div>' +
        '<div class="ride-number">N.º ' + comp.numero + "</div>" +
        "<p>Ambiente: " + escapeHtml(e.ambiente) + "</p>" +
        "<p>Fecha de emisión: " + comp.fecha + "</p></div>" +
      "</div>" +
      '<div class="ride-clave"><span class="ride-clave-label">Clave de acceso (ficticia)</span>' +
      '<div class="ride-clave-value">' + comp.claveAcceso + "</div></div>" +
      '<dl class="ride-client">' +
        "<dt>Cliente</dt><dd>" + escapeHtml(comp.cliente.nombre) + "</dd>" +
        "<dt>Identificación</dt><dd>" + escapeHtml(comp.cliente.idTipo) + ": " + escapeHtml(comp.cliente.id) + "</dd>" +
        "<dt>Correo</dt><dd>" + escapeHtml(comp.cliente.correo) + "</dd>" +
      "</dl>" +
      '<table class="ride-table"><thead><tr><th>Descripción</th><th class="num">Cant.</th>' +
      '<th class="num">P. unitario</th><th class="num">IVA</th><th class="num">Importe</th></tr></thead>' +
      "<tbody>" + rows + "</tbody></table>" +
      '<div class="ride-totals">' +
        '<div class="total-row"><span>Subtotal 15%</span><strong>' + money(comp.totals.base15) + "</strong></div>" +
        '<div class="total-row"><span>Subtotal 0%</span><strong>' + money(comp.totals.base0) + "</strong></div>" +
        '<div class="total-row"><span>IVA 15%</span><strong>' + money(comp.totals.iva) + "</strong></div>" +
        '<div class="total-row grand"><span>Total</span><strong>' + money(comp.totals.total) + "</strong></div>" +
      "</div>" +
      '<div class="ride-estado"><span>Estado:</span><span class="badge st-' + comp.estado.toLowerCase() + '">' +
        comp.estado + "</span>" +
        (comp.enviadoCorreo ? '<span class="badge sent">✉ Enviada por correo</span>' : "") +
      "</div>" +
      '<p class="ride-aviso">Documento de demostración, sin validez tributaria. Ningún comprobante sale de esta página ni llega al SRI.</p>';
    renderCycle(comp);
  }

  function selectComprobante(numero) {
    selectedNumero = numero;
    renderRide(DemoCore.comprobanteByNumero(state, numero));
  }

  /* ---------- Panel de comprobantes ---------- */
  function renderInvoices(highlightNumero) {
    invoicesBody.innerHTML = "";
    if (state.comprobantes.length === 0) {
      var trE = document.createElement("tr");
      trE.className = "empty-row";
      trE.innerHTML = '<td colspan="6">Todavía no hay comprobantes emitidos.</td>';
      invoicesBody.appendChild(trE);
      return;
    }
    state.comprobantes.slice().reverse().forEach(function (c) {
      var tr = document.createElement("tr");
      if (highlightNumero && c.numero === highlightNumero) tr.className = "new-row";
      var sub = "";
      if (c.estado === "Rechazada") sub = '<span class="estado-sub">' + escapeHtml(c.motivoRechazo) + "</span>";
      if (c.estado === "Anulada") sub = '<span class="estado-sub gray">Motivo: ' + escapeHtml(c.motivoAnulacion) + "</span>";
      tr.innerHTML =
        "<td><strong>" + c.numero + "</strong></td>" +
        '<td class="client-cell"><strong>' + escapeHtml(c.cliente.nombre) + "</strong>" +
        '<span class="client-sub">' + escapeHtml(c.cliente.idTipo) + " " + escapeHtml(c.cliente.id) + "</span></td>" +
        "<td>" + c.fecha + "</td>" +
        "<td><strong>" + money(c.totals.total) + "</strong></td>" +
        '<td class="estado-cell"><span class="badge st-' + c.estado.toLowerCase() + '">' + c.estado + "</span>" +
        (c.enviadoCorreo ? '<span class="badge sent">✉</span>' : "") + sub + "</td>";
      var tdA = document.createElement("td");
      tdA.className = "actions-cell";
      var btnRide = document.createElement("button");
      btnRide.type = "button";
      btnRide.className = "btn-small";
      btnRide.textContent = "👁 Ver RIDE";
      btnRide.addEventListener("click", function () {
        clearTimers();
        selectComprobante(c.numero);
        rideDoc.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      tdA.appendChild(btnRide);
      if (c.estado === "Autorizada" && !c.enviadoCorreo) {
        var btnMail = document.createElement("button");
        btnMail.type = "button";
        btnMail.className = "btn-small";
        btnMail.textContent = "✉ Enviar por correo";
        btnMail.addEventListener("click", function () {
          var res = DemoCore.enviarPorCorreo(state, c.numero);
          if (!res.ok) return;
          logActivity("✉ " + c.numero + ": RIDE y XML (simulados) enviados al correo " + c.cliente.correo + ".");
          renderAll(c.numero);
          selectComprobante(c.numero);
        });
        tdA.appendChild(btnMail);
      }
      if (c.estado === "Autorizada") {
        var btnAnul = document.createElement("button");
        btnAnul.type = "button";
        btnAnul.className = "btn-small danger";
        btnAnul.textContent = "🚫 Anular";
        btnAnul.addEventListener("click", function () { openAnul(c.numero); });
        tdA.appendChild(btnAnul);
      }
      if (tdA.children.length === 0) tdA.innerHTML = '<span class="no-actions">—</span>';
      tr.appendChild(tdA);
      invoicesBody.appendChild(tr);
    });
  }

  /* ---------- Anulación ---------- */
  function openAnul(numero) {
    anulTarget = numero;
    anulInfo.textContent = numero;
    anulMotivo.value = "";
    showError(anulError, "");
    anulBox.hidden = false;
    anulBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function closeAnul() {
    anulTarget = null;
    anulBox.hidden = true;
  }
  document.getElementById("btnCancelAnul").addEventListener("click", closeAnul);
  document.getElementById("btnConfirmAnul").addEventListener("click", function () {
    if (!anulTarget) { closeAnul(); return; }
    var res = DemoCore.anular(state, anulTarget, anulMotivo.value);
    if (!res.ok) { showError(anulError, res.error); return; }
    logActivity("🚫 " + res.comprobante.numero + " anulada (simulado). Motivo: " + res.comprobante.motivoAnulacion + ". Deja de contar en el monto facturado.");
    var num = anulTarget;
    closeAnul();
    renderAll(num);
    selectComprobante(num);
  });

  /* ---------- Emisión con ciclo animado ---------- */
  function readClient() {
    return {
      nombre: document.getElementById("clientName").value,
      idTipo: document.getElementById("clientIdType").value,
      id: document.getElementById("clientId").value,
      correo: document.getElementById("clientEmail").value
    };
  }

  btnEmit.addEventListener("click", function () {
    if (emitting) return;
    var res = DemoCore.emitir(state, readClient(), new Date());
    if (!res.ok) { showError(emitError, res.error); return; }
    showError(emitError, "");
    var comp = res.comprobante;
    emitting = true;
    btnEmit.disabled = true;
    btnEmit.textContent = "⏳ Procesando (simulado)…";
    logActivity("🧾 " + comp.numero + ": factura generada para " + comp.cliente.nombre + " por " + money(comp.totals.total) + ", con su clave de acceso ficticia.");
    renderAll(comp.numero);
    selectComprobante(comp.numero);

    later(function () {
      var r = DemoCore.firmar(state, comp.numero);
      if (r.ok) {
        logActivity("✍️ " + comp.numero + ": firmada electrónicamente (simulado).");
        renderAll(comp.numero);
        selectComprobante(comp.numero);
      }
    }, 800);

    later(function () {
      var r = DemoCore.autorizar(state, comp.numero);
      if (r.ok) {
        if (comp.estado === "Autorizada") {
          logActivity("✅ " + comp.numero + ": AUTORIZADA (simulado). Lista para enviar por correo.");
        } else {
          logActivity("❌ " + comp.numero + ": RECHAZADA (simulado). " + comp.motivoRechazo);
        }
        renderAll(comp.numero);
        selectComprobante(comp.numero);
      }
      emitting = false;
      btnEmit.disabled = false;
      btnEmit.textContent = "⚡ Emitir factura (simulado)";
    }, 1700);
  });

  /* ---------- Render general ---------- */
  function renderAll(highlightNumero) {
    renderKpis();
    renderDraft();
    renderInvoices(highlightNumero);
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    clearTimers();
    state = DemoCore.freshState();
    selectedNumero = null;
    emitting = false;
    btnEmit.disabled = false;
    btnEmit.textContent = "⚡ Emitir factura (simulado)";
    document.getElementById("clientName").value = "";
    document.getElementById("clientId").value = "";
    document.getElementById("clientEmail").value = "";
    document.getElementById("clientIdType").value = "Cédula";
    document.getElementById("prodDesc").value = "";
    document.getElementById("prodQty").value = "1";
    document.getElementById("prodPrice").value = "";
    document.getElementById("presetSelect").value = "";
    showError(emitError, "");
    closeAnul();
    activityList.innerHTML = "<li>🟢 El facturador está activo: emite tu primera factura de demostración en el formulario.</li>";
    renderAll(null);
    renderRide(null);
  });

  /* ---------- Arranque ---------- */
  fillPresets();
  renderAll(null);
  renderRide(null);
})();
