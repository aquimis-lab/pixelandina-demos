/* PixelAndina — Demo interactiva: Catálogo Cotizador WhatsApp B2B
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    var IVA_RATE = 0.15;

    /* Precios mayoristas: unit = precio por unidad; packQty/packPrice =
       presentación por caja o paquete; volumeMin/volumePct = desde esa
       cantidad de unidades del producto, descuento extra sobre la línea. */
    function seedProducts() {
      return [
        { sku: "ACE-201", name: "Aceite vegetal 1 L",      category: "Aceites",   unit: 2.10, packLabel: "Caja × 12",  packQty: 12, packPrice: 22.68, volumeMin: 120, volumePct: 5 },
        { sku: "ARR-202", name: "Arroz blanco 1 kg",       category: "Granos",    unit: 1.15, packLabel: "Caja × 25",  packQty: 25, packPrice: 25.00, volumeMin: 250, volumePct: 5 },
        { sku: "AZU-203", name: "Azúcar morena 1 kg",      category: "Granos",    unit: 1.05, packLabel: "Caja × 25",  packQty: 25, packPrice: 22.50, volumeMin: 250, volumePct: 5 },
        { sku: "ATU-204", name: "Atún en lata 170 g",      category: "Enlatados", unit: 1.35, packLabel: "Caja × 48",  packQty: 48, packPrice: 57.60, volumeMin: 240, volumePct: 6 },
        { sku: "LEC-205", name: "Leche entera 1 L",        category: "Lácteos",   unit: 1.10, packLabel: "Caja × 12",  packQty: 12, packPrice: 12.00, volumeMin: 120, volumePct: 5 },
        { sku: "QUE-206", name: "Queso fresco 500 g",      category: "Lácteos",   unit: 3.20, packLabel: "Caja × 10",  packQty: 10, packPrice: 29.00, volumeMin: 100, volumePct: 5 },
        { sku: "DET-207", name: "Detergente en polvo 1 kg", category: "Limpieza", unit: 2.60, packLabel: "Caja × 12",  packQty: 12, packPrice: 28.08, volumeMin: 120, volumePct: 5 },
        { sku: "JAB-208", name: "Jabón líquido 500 ml",    category: "Limpieza",  unit: 2.10, packLabel: "Caja × 12",  packQty: 12, packPrice: 22.68, volumeMin: 120, volumePct: 5 },
        { sku: "CAF-209", name: "Café molido 250 g",       category: "Bebidas",   unit: 3.00, packLabel: "Caja × 24",  packQty: 24, packPrice: 64.80, volumeMin: 120, volumePct: 6 },
        { sku: "GAS-210", name: "Gaseosa cola 3 L",        category: "Bebidas",   unit: 2.40, packLabel: "Paquete × 6", packQty: 6,  packPrice: 12.60, volumeMin: 50,  volumePct: 5 },
        { sku: "HAR-211", name: "Harina de trigo 1 kg",    category: "Granos",    unit: 1.00, packLabel: "Caja × 25",  packQty: 25, packPrice: 21.25, volumeMin: 250, volumePct: 5 },
        { sku: "FID-212", name: "Fideos tallarín 400 g",   category: "Pastas",    unit: 0.85, packLabel: "Caja × 24",  packQty: 24, packPrice: 18.00, volumeMin: 240, volumePct: 5 }
      ];
    }

    function round2(n) { return Math.round(n * 100) / 100; }

    function productBySku(products, sku) {
      return products.filter(function (p) { return p.sku === sku; })[0] || null;
    }

    function categoriesOf(products) {
      var seen = [];
      products.forEach(function (p) {
        if (seen.indexOf(p.category) === -1) seen.push(p.category);
      });
      return seen;
    }

    /* Precio de una línea: las cajas completas van a precio de caja y el
       resto a precio unitario. Si la cantidad llega al volumen mínimo del
       producto, se descuenta el % extra sobre el bruto de la línea. */
    function priceLine(p, qty) {
      qty = parseInt(qty, 10) || 0;
      var boxes = Math.floor(qty / p.packQty);
      var singles = qty % p.packQty;
      var gross = round2(boxes * p.packPrice + singles * p.unit);
      var discount = qty >= p.volumeMin ? round2(gross * p.volumePct / 100) : 0;
      return {
        sku: p.sku, qty: qty, boxes: boxes, singles: singles,
        gross: gross, discount: discount, net: round2(gross - discount),
        volumeApplied: discount > 0
      };
    }

    /* Totales de un conjunto de líneas [{ sku, qty }]. */
    function totalsForLines(products, lines) {
      var subtotal = 0, discount = 0;
      lines.forEach(function (ln) {
        var p = productBySku(products, ln.sku);
        if (!p) return;
        var pr = priceLine(p, ln.qty);
        subtotal += pr.gross;
        discount += pr.discount;
      });
      subtotal = round2(subtotal);
      discount = round2(discount);
      var base = round2(subtotal - discount);
      var iva = round2(base * IVA_RATE);
      return { subtotal: subtotal, volumeDiscount: discount, base: base, iva: iva, total: round2(base + iva) };
    }

    function money(n) { return "$" + Number(n).toFixed(2); }

    /* Mensaje completo de la cotización, listo para WhatsApp. */
    function buildMessage(products, quote) {
      var out = [];
      out.push("*Nueva cotización " + quote.id + "*");
      out.push("Distribuidora La Sierra — Pedido mayorista");
      out.push("");
      out.push("*Detalle del pedido:*");
      quote.lines.forEach(function (ln) {
        var p = productBySku(products, ln.sku);
        var pr = priceLine(p, ln.qty);
        out.push("• " + p.name + " × " + ln.qty + " u — " + money(pr.gross));
      });
      out.push("");
      out.push("Subtotal: " + money(quote.totals.subtotal));
      if (quote.totals.volumeDiscount > 0) {
        out.push("Descuento por volumen: −" + money(quote.totals.volumeDiscount));
      }
      out.push("IVA 15%: " + money(quote.totals.iva));
      out.push("*Total: " + money(quote.totals.total) + "*");
      out.push("");
      out.push("*Datos del cliente:*");
      out.push("Negocio: " + quote.business);
      out.push("Contacto: " + quote.contact);
      out.push("Ciudad: " + quote.city);
      out.push("");
      out.push("Enviado desde el catálogo en línea de Distribuidora La Sierra.");
      return out.join("\n");
    }

    function makeQuote(products, id, client, lines, status) {
      var totals = totalsForLines(products, lines);
      var quote = {
        id: id,
        business: client.business, contact: client.contact, city: client.city,
        lines: lines.map(function (ln) { return { sku: ln.sku, qty: ln.qty }; }),
        totals: totals, status: status, message: ""
      };
      quote.message = buildMessage(products, quote);
      return quote;
    }

    function seedQuotes(products) {
      return [
        makeQuote(products, "COT-001",
          { business: "Tienda y Víveres El Ahorro", contact: "Carlos Mendoza", city: "Durán" },
          [ { sku: "ACE-201", qty: 24 }, { sku: "ARR-202", qty: 50 }, { sku: "FID-212", qty: 24 } ],
          "Atendida"),
        makeQuote(products, "COT-002",
          { business: "Comedor Doña Rosa", contact: "Rosa Delgado", city: "Guayaquil" },
          [ { sku: "LEC-205", qty: 24 }, { sku: "QUE-206", qty: 20 } ],
          "Cerrada")
      ];
    }

    function freshState() {
      var products = seedProducts();
      return { products: products, cart: {}, quotes: seedQuotes(products), nextQuote: 3 };
    }

    function quoteById(state, id) {
      return state.quotes.filter(function (q) { return q.id === id; })[0] || null;
    }

    /* ---------- Carrito ---------- */
    function addToCart(state, sku, qty) {
      qty = parseInt(qty, 10);
      if (!productBySku(state.products, sku)) return { ok: false, error: "Ese producto no existe en el catálogo." };
      if (isNaN(qty) || qty < 1) return { ok: false, error: "La cantidad debe ser de al menos 1 unidad." };
      state.cart[sku] = (state.cart[sku] || 0) + qty;
      return { ok: true, qty: state.cart[sku] };
    }

    function setCartQty(state, sku, qty) {
      qty = parseInt(qty, 10);
      if (!productBySku(state.products, sku)) return { ok: false, error: "Ese producto no existe en el catálogo." };
      if (isNaN(qty) || qty < 0) return { ok: false, error: "La cantidad no puede ser negativa." };
      if (qty === 0) delete state.cart[sku];
      else state.cart[sku] = qty;
      return { ok: true, qty: qty };
    }

    function removeFromCart(state, sku) {
      if (!state.cart[sku]) return { ok: false, error: "Ese producto no está en el carrito." };
      delete state.cart[sku];
      return { ok: true };
    }

    /* Líneas del carrito en el orden del catálogo, con su precio calculado. */
    function cartLines(state) {
      return state.products
        .filter(function (p) { return state.cart[p.sku] > 0; })
        .map(function (p) {
          var pr = priceLine(p, state.cart[p.sku]);
          pr.name = p.name;
          pr.product = p;
          return pr;
        });
    }

    function cartTotals(state) {
      var lines = Object.keys(state.cart).map(function (sku) {
        return { sku: sku, qty: state.cart[sku] };
      });
      return totalsForLines(state.products, lines);
    }

    function cartUnits(state) {
      return Object.keys(state.cart).reduce(function (s, sku) { return s + state.cart[sku]; }, 0);
    }

    /* ---------- Cotización ---------- */
    function validateClient(client) {
      if (!client.business || client.business.trim().length < 3) return "Escribe el nombre del negocio.";
      if (!client.contact || client.contact.trim().length < 3) return "Escribe el nombre de la persona de contacto.";
      if (!client.city || client.city.trim().length < 2) return "Escribe la ciudad de entrega.";
      return "";
    }

    /* Arma la cotización con el siguiente número COT-### y su mensaje,
       SIN tocar el estado: sirve para la vista previa. */
    function buildQuote(state, client) {
      client = {
        business: String((client && client.business) || "").trim(),
        contact: String((client && client.contact) || "").trim(),
        city: String((client && client.city) || "").trim()
      };
      var errClient = validateClient(client);
      if (errClient) return { ok: false, error: errClient };
      var lines = Object.keys(state.cart).map(function (sku) {
        return { sku: sku, qty: state.cart[sku] };
      });
      if (lines.length === 0) return { ok: false, error: "El carrito está vacío: agrega al menos un producto para cotizar." };

      var id = "COT-" + ("00" + state.nextQuote).slice(-3);
      return { ok: true, quote: makeQuote(state.products, id, client, lines, "Nueva") };
    }

    /* Registra la cotización: la guarda en el panel, avanza el número
       correlativo y vacía el carrito. */
    function sendQuote(state, client) {
      var res = buildQuote(state, client);
      if (!res.ok) return res;
      state.nextQuote += 1;
      state.quotes.push(res.quote);
      state.cart = {};
      return res;
    }

    var TRANSITIONS = {
      "Nueva":    ["Atendida"],
      "Atendida": ["Cerrada"],
      "Cerrada":  []
    };

    function setQuoteStatus(state, id, next) {
      var q = quoteById(state, id);
      if (!q) return { ok: false, error: "Esa cotización ya no existe." };
      var allowed = TRANSITIONS[q.status] || [];
      if (allowed.indexOf(next) === -1) {
        return { ok: false, error: "No se puede pasar una cotización «" + q.status + "» a «" + next + "»." };
      }
      q.status = next;
      return { ok: true, quote: q };
    }

    function computeKpis(state) {
      var total = state.quotes.length;
      var amount = state.quotes.reduce(function (s, q) { return s + q.totals.total; }, 0);
      var closed = state.quotes.filter(function (q) { return q.status === "Cerrada"; }).length;
      return {
        quotesReceived: total,
        quotedAmount: round2(amount),
        closed: closed,
        closeRate: total ? Math.round(closed / total * 1000) / 10 : 0
      };
    }

    return {
      IVA_RATE: IVA_RATE,
      freshState: freshState,
      productBySku: productBySku,
      categoriesOf: categoriesOf,
      priceLine: priceLine,
      totalsForLines: totalsForLines,
      buildMessage: buildMessage,
      quoteById: quoteById,
      addToCart: addToCart,
      setCartQty: setCartQty,
      removeFromCart: removeFromCart,
      cartLines: cartLines,
      cartTotals: cartTotals,
      cartUnits: cartUnits,
      buildQuote: buildQuote,
      sendQuote: sendQuote,
      setQuoteStatus: setQuoteStatus,
      computeKpis: computeKpis,
      TRANSITIONS: TRANSITIONS
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
  var pendingClient = null; /* cliente de la cotización en vista previa */

  var kpiQuotes = document.getElementById("kpiQuotes");
  var kpiAmount = document.getElementById("kpiAmount");
  var kpiClosed = document.getElementById("kpiClosed");
  var kpiRate = document.getElementById("kpiRate");
  var catalogGrid = document.getElementById("catalogGrid");
  var searchInput = document.getElementById("searchInput");
  var categoryFilter = document.getElementById("categoryFilter");
  var cartLinesBox = document.getElementById("cartLines");
  var cartEmpty = document.getElementById("cartEmpty");
  var quotesBody = document.getElementById("quotesBody");
  var activityList = document.getElementById("activityList");
  var previewPanel = document.getElementById("previewPanel");
  var previewText = document.getElementById("previewText");
  var quoteError = document.getElementById("quoteError");

  var NEXT_LABEL = { "Atendida": "▶ Atendida", "Cerrada": "✓ Cerrar venta" };

  function money(n) { return "$" + Number(n).toFixed(2); }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showError(msg) {
    quoteError.textContent = msg || "";
    quoteError.classList.toggle("show", !!msg);
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
    kpiQuotes.textContent = k.quotesReceived;
    kpiAmount.textContent = money(k.quotedAmount);
    kpiClosed.textContent = k.closed;
    kpiRate.textContent = k.closeRate + "%";
  }

  /* ---------- Catálogo ---------- */
  function fillCategoryFilter() {
    DemoCore.categoriesOf(state.products).forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      categoryFilter.appendChild(opt);
    });
  }

  function renderCatalog() {
    var q = searchInput.value.trim().toLowerCase();
    var f = categoryFilter.value;
    catalogGrid.innerHTML = "";
    var visible = state.products.filter(function (p) {
      var matchQ = !q || p.name.toLowerCase().indexOf(q) !== -1 || p.sku.toLowerCase().indexOf(q) !== -1;
      var matchF = f === "todas" || p.category === f;
      return matchQ && matchF;
    });
    if (visible.length === 0) {
      var empty = document.createElement("p");
      empty.className = "catalog-empty";
      empty.textContent = "Ningún producto coincide con la búsqueda o la categoría.";
      catalogGrid.appendChild(empty);
      return;
    }
    visible.forEach(function (p) {
      var perUnit = p.packPrice / p.packQty;
      var card = document.createElement("article");
      card.className = "product-card";
      card.innerHTML =
        '<div class="product-meta"><span class="product-sku">' + escapeHtml(p.sku) + '</span>' +
        '<span class="badge cat">' + escapeHtml(p.category) + "</span></div>" +
        "<h4>" + escapeHtml(p.name) + "</h4>" +
        '<div class="price-rows">' +
          '<span class="unit-price">' + money(p.unit) + " <small>por unidad</small></span>" +
          '<span class="pack-price">' + escapeHtml(p.packLabel) + ": <strong>" + money(p.packPrice) + "</strong> (" + money(perUnit) + " c/u)</span>" +
        "</div>" +
        '<span class="volume-chip">Desde ' + p.volumeMin + " u: −" + p.volumePct + "% extra</span>";
      var row = document.createElement("div");
      row.className = "add-row";
      var qty = document.createElement("input");
      qty.type = "number"; qty.min = "1"; qty.step = "1"; qty.value = p.packQty;
      qty.setAttribute("aria-label", "Cantidad de " + p.name);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-primary";
      btn.textContent = "＋ Agregar";
      btn.addEventListener("click", function () {
        var res = DemoCore.addToCart(state, p.sku, qty.value);
        if (!res.ok) { showError(res.error); return; }
        showError("");
        hidePreview();
        logActivity("🛒 Se agregaron " + parseInt(qty.value, 10) + " u de «" + p.name + "» al carrito (lleva " + res.qty + " u).");
        renderCart();
      });
      row.appendChild(qty);
      row.appendChild(btn);
      card.appendChild(row);
      catalogGrid.appendChild(card);
    });
  }

  /* ---------- Carrito ---------- */
  function renderCart() {
    var lines = DemoCore.cartLines(state);
    cartLinesBox.innerHTML = "";
    cartEmpty.style.display = lines.length === 0 ? "block" : "none";
    lines.forEach(function (ln) {
      var p = ln.product;
      var box = document.createElement("div");
      box.className = "cart-line";
      var breakdown = ln.boxes > 0
        ? ln.boxes + " × " + p.packLabel.toLowerCase() + (ln.singles > 0 ? " + " + ln.singles + " suelta(s)" : "")
        : ln.qty + " unidad(es) suelta(s)";
      var head =
        '<div class="cart-line-head"><strong>' + escapeHtml(p.name) + "</strong></div>" +
        '<div class="cart-line-detail">' + breakdown + " · bruto " + money(ln.gross) + "</div>" +
        (ln.volumeApplied
          ? '<div class="cart-line-disc">Descuento por volumen aplicado: −' + money(ln.discount) + "</div>"
          : '<div class="cart-line-detail">Desde ' + p.volumeMin + " u se activa −" + p.volumePct + "% en esta línea.</div>");
      box.innerHTML = head;
      var foot = document.createElement("div");
      foot.className = "cart-line-foot";
      var stepper = document.createElement("div");
      stepper.className = "qty-stepper";
      var minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "−"; minus.title = "Quitar una unidad";
      minus.addEventListener("click", function () {
        DemoCore.setCartQty(state, p.sku, ln.qty - 1);
        hidePreview();
        renderCart();
      });
      var num = document.createElement("span");
      num.className = "qty-num";
      num.textContent = ln.qty;
      var plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+"; plus.title = "Agregar una unidad";
      plus.addEventListener("click", function () {
        DemoCore.setCartQty(state, p.sku, ln.qty + 1);
        hidePreview();
        renderCart();
      });
      stepper.appendChild(minus);
      stepper.appendChild(num);
      stepper.appendChild(plus);
      var total = document.createElement("span");
      total.className = "cart-line-total";
      total.textContent = money(ln.net);
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "btn-remove-cart";
      rm.textContent = "✕";
      rm.title = "Quitar del carrito";
      rm.addEventListener("click", function () {
        DemoCore.removeFromCart(state, p.sku);
        hidePreview();
        logActivity("🗑 «" + p.name + "» salió del carrito.");
        renderCart();
      });
      foot.appendChild(stepper);
      foot.appendChild(total);
      foot.appendChild(rm);
      box.appendChild(foot);
      cartLinesBox.appendChild(box);
    });
    var t = DemoCore.cartTotals(state);
    document.getElementById("sumSubtotal").textContent = money(t.subtotal);
    document.getElementById("sumDiscount").textContent = "−" + money(t.volumeDiscount);
    document.getElementById("discountRow").classList.toggle("zero", t.volumeDiscount === 0);
    document.getElementById("sumIva").textContent = money(t.iva);
    document.getElementById("sumTotal").textContent = money(t.total);
  }

  /* ---------- Vista previa y envío ---------- */
  function readClient() {
    return {
      business: document.getElementById("clientBusiness").value,
      contact: document.getElementById("clientName").value,
      city: document.getElementById("clientCity").value
    };
  }

  function hidePreview() {
    previewPanel.hidden = true;
    pendingClient = null;
  }

  document.getElementById("btnBuildQuote").addEventListener("click", function () {
    var client = readClient();
    /* Vista previa: buildQuote arma el mensaje sin registrar nada todavía. */
    var res = DemoCore.buildQuote(state, client);
    if (!res.ok) { showError(res.error); hidePreview(); return; }
    showError("");
    pendingClient = client;
    previewText.textContent = res.quote.message;
    previewPanel.hidden = false;
    previewPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  document.getElementById("btnSendQuote").addEventListener("click", function () {
    if (!pendingClient) { hidePreview(); return; }
    var res = DemoCore.sendQuote(state, pendingClient);
    if (!res.ok) { showError(res.error); hidePreview(); return; }
    showError("");
    var qt = res.quote;
    logActivity("💬 " + qt.id + ": cotización de " + qt.business + " (" + qt.city + ") por " + money(qt.totals.total) + " enviada por WhatsApp y registrada como «Nueva».");
    if (qt.totals.volumeDiscount > 0) {
      logActivity("🏷 " + qt.id + " incluyó descuento por volumen de " + money(qt.totals.volumeDiscount) + ", aplicado solo por el sistema.");
    }
    document.getElementById("clientBusiness").value = "";
    document.getElementById("clientName").value = "";
    document.getElementById("clientCity").value = "";
    hidePreview();
    renderAll(qt.id);
  });

  document.getElementById("btnEditQuote").addEventListener("click", function () {
    hidePreview();
  });

  /* ---------- Panel del negocio ---------- */
  function quoteDetail(q) {
    return q.lines.map(function (ln) {
      var p = DemoCore.productBySku(state.products, ln.sku);
      return ln.qty + " × " + (p ? p.name : ln.sku);
    }).join(" · ");
  }

  function renderQuotes(highlightId) {
    quotesBody.innerHTML = "";
    if (state.quotes.length === 0) {
      var trE = document.createElement("tr");
      trE.className = "empty-row";
      trE.innerHTML = '<td colspan="6">Todavía no hay cotizaciones registradas.</td>';
      quotesBody.appendChild(trE);
      return;
    }
    state.quotes.slice().reverse().forEach(function (q) {
      var tr = document.createElement("tr");
      if (highlightId && q.id === highlightId) tr.className = "new-row";
      tr.innerHTML =
        "<td><strong>" + q.id + "</strong></td>" +
        '<td class="client-cell"><strong>' + escapeHtml(q.business) + "</strong>" +
        '<span class="client-sub">' + escapeHtml(q.contact) + " · " + escapeHtml(q.city) + "</span></td>" +
        '<td class="detail-cell">' + escapeHtml(quoteDetail(q)) + "</td>" +
        "<td><strong>" + money(q.totals.total) + "</strong></td>" +
        '<td><span class="badge st-' + q.status.toLowerCase() + '">' + q.status + "</span></td>";
      var tdA = document.createElement("td");
      tdA.className = "actions-cell";
      var nexts = DemoCore.TRANSITIONS[q.status] || [];
      if (nexts.length === 0) {
        tdA.innerHTML = '<span class="no-actions">—</span>';
      } else {
        nexts.forEach(function (nx) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn-small";
          btn.textContent = NEXT_LABEL[nx];
          btn.addEventListener("click", function () { advanceQuote(q.id, nx); });
          tdA.appendChild(btn);
        });
      }
      tr.appendChild(tdA);
      quotesBody.appendChild(tr);
    });
  }

  function advanceQuote(id, next) {
    var res = DemoCore.setQuoteStatus(state, id, next);
    if (!res.ok) return;
    if (next === "Cerrada") {
      logActivity("🎉 " + id + " (" + res.quote.business + ") se cerró como venta por " + money(res.quote.totals.total) + ".");
    } else {
      logActivity("📋 " + id + " (" + res.quote.business + ") pasó a «" + next + "»: la distribuidora ya la está atendiendo.");
    }
    renderAll(null);
  }

  /* ---------- Filtros ---------- */
  searchInput.addEventListener("input", renderCatalog);
  categoryFilter.addEventListener("change", renderCatalog);

  /* ---------- Render general ---------- */
  function renderAll(highlightQuoteId) {
    renderKpis();
    renderCart();
    renderQuotes(highlightQuoteId);
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = DemoCore.freshState();
    searchInput.value = "";
    categoryFilter.value = "todas";
    document.getElementById("clientBusiness").value = "";
    document.getElementById("clientName").value = "";
    document.getElementById("clientCity").value = "";
    showError("");
    hidePreview();
    activityList.innerHTML = "<li>🟢 El catálogo está activo: las cotizaciones llegan completas por WhatsApp y quedan registradas aquí.</li>";
    renderCatalog();
    renderAll(null);
  });

  /* ---------- Arranque ---------- */
  fillCategoryFilter();
  renderCatalog();
  renderAll(null);
})();
