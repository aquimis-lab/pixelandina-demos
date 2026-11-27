/* PixelAndina — Demo interactiva: Panel de Inventario y Pedidos
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    function seedProducts() {
      return [
        { sku: "ARR-001", name: "Arroz blanco 1 kg",        category: "Granos",    stock: 48, min: 20, buy: 0.85, sell: 1.25 },
        { sku: "ACE-002", name: "Aceite vegetal 1 L",       category: "Aceites",   stock: 30, min: 12, buy: 1.60, sell: 2.25 },
        { sku: "AZU-003", name: "Azúcar morena 1 kg",       category: "Granos",    stock: 8,  min: 15, buy: 0.75, sell: 1.15 },
        { sku: "HAR-004", name: "Harina de trigo 1 kg",     category: "Granos",    stock: 60, min: 25, buy: 0.70, sell: 1.10 },
        { sku: "LEN-005", name: "Lenteja 500 g",            category: "Granos",    stock: 25, min: 10, buy: 0.90, sell: 1.40 },
        { sku: "ATU-006", name: "Atún en lata 170 g",       category: "Enlatados", stock: 5,  min: 18, buy: 0.95, sell: 1.50 },
        { sku: "LEC-007", name: "Leche entera 1 L",         category: "Lácteos",   stock: 0,  min: 12, buy: 0.80, sell: 1.20 },
        { sku: "QUE-008", name: "Queso fresco 500 g",       category: "Lácteos",   stock: 14, min: 8,  buy: 2.40, sell: 3.50 },
        { sku: "DET-009", name: "Detergente en polvo 1 kg", category: "Limpieza",  stock: 22, min: 10, buy: 1.90, sell: 2.80 },
        { sku: "JAB-010", name: "Jabón líquido 500 ml",     category: "Limpieza",  stock: 3,  min: 10, buy: 1.50, sell: 2.30 },
        { sku: "CAF-011", name: "Café molido 250 g",        category: "Bebidas",   stock: 18, min: 8,  buy: 2.10, sell: 3.25 },
        { sku: "PAN-012", name: "Pan de molde",             category: "Panadería", stock: 11, min: 6,  buy: 1.10, sell: 1.75 }
      ];
    }

    function seedOrders() {
      return [
        { id: "PED-001", client: "Tienda El Sol",
          lines: [ { sku: "ARR-001", qty: 10 }, { sku: "ACE-002", qty: 5 } ],
          total: 23.75, status: "Entregado" },
        { id: "PED-002", client: "Restaurante Doña Rosa",
          lines: [ { sku: "QUE-008", qty: 4 }, { sku: "CAF-011", qty: 2 } ],
          total: 20.50, status: "Preparando" },
        { id: "PED-003", client: "María Fernanda López",
          lines: [ { sku: "JAB-010", qty: 1 }, { sku: "DET-009", qty: 1 } ],
          total: 5.10, status: "Nuevo" }
      ];
    }

    function freshState() {
      return { products: seedProducts(), orders: seedOrders(), nextOrder: 4 };
    }

    function productBySku(state, sku) {
      return state.products.filter(function (p) { return p.sku === sku; })[0] || null;
    }

    function orderById(state, id) {
      return state.orders.filter(function (o) { return o.id === id; })[0] || null;
    }

    /* Estado del stock: "agotado" | "bajo" | "ok" */
    function statusOf(p) {
      if (p.stock <= 0) return "agotado";
      if (p.stock < p.min) return "bajo";
      return "ok";
    }

    function alertsOf(state) {
      return state.products.filter(function (p) { return statusOf(p) !== "ok"; });
    }

    function round2(n) { return Math.round(n * 100) / 100; }

    /* Crea un pedido: valida, descuenta stock y calcula el total.
       lines: [{ sku, qty }] — líneas repetidas del mismo SKU se fusionan. */
    function createOrder(state, client, lines) {
      client = String(client || "").trim();
      if (client.length < 3) return { ok: false, error: "Escribe el nombre del cliente del pedido." };
      if (!lines || lines.length === 0) return { ok: false, error: "Agrega al menos un producto al pedido." };

      var merged = {};
      var orderSkus = [];
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i];
        var qty = parseInt(ln.qty, 10);
        if (!productBySku(state, ln.sku)) return { ok: false, error: "Hay un producto que no existe en el catálogo." };
        if (isNaN(qty) || qty < 1) return { ok: false, error: "Cada cantidad debe ser de al menos 1 unidad." };
        if (!merged[ln.sku]) { merged[ln.sku] = 0; orderSkus.push(ln.sku); }
        merged[ln.sku] += qty;
      }
      for (var j = 0; j < orderSkus.length; j++) {
        var p = productBySku(state, orderSkus[j]);
        if (merged[orderSkus[j]] > p.stock) {
          return { ok: false, error: "No hay stock suficiente de «" + p.name + "»: quedan " + p.stock + " y el pedido pide " + merged[orderSkus[j]] + "." };
        }
      }

      var total = 0;
      var finalLines = orderSkus.map(function (sku) {
        var prod = productBySku(state, sku);
        prod.stock -= merged[sku];
        total += prod.sell * merged[sku];
        return { sku: sku, qty: merged[sku] };
      });

      var id = "PED-" + ("00" + state.nextOrder).slice(-3);
      state.nextOrder += 1;
      var order = { id: id, client: client, lines: finalLines, total: round2(total), status: "Nuevo" };
      state.orders.push(order);
      return { ok: true, order: order };
    }

    /* Entrada de mercadería: suma unidades al stock. */
    function registerEntry(state, sku, qty) {
      var p = productBySku(state, sku);
      qty = parseInt(qty, 10);
      if (!p) return { ok: false, error: "Elige un producto válido." };
      if (isNaN(qty) || qty < 1) return { ok: false, error: "La entrada debe ser de al menos 1 unidad." };
      p.stock += qty;
      return { ok: true, product: p };
    }

    /* Ajuste de inventario: el stock queda fijo en la cantidad indicada. */
    function adjustStock(state, sku, qty) {
      var p = productBySku(state, sku);
      qty = parseInt(qty, 10);
      if (!p) return { ok: false, error: "Elige un producto válido." };
      if (isNaN(qty) || qty < 0) return { ok: false, error: "El ajuste debe ser 0 o más unidades." };
      p.stock = qty;
      return { ok: true, product: p };
    }

    var TRANSITIONS = {
      "Nuevo":      ["Preparando", "Cancelado"],
      "Preparando": ["Entregado", "Cancelado"],
      "Entregado":  [],
      "Cancelado":  []
    };

    /* Avanza el estado de un pedido. Al cancelar un pedido no entregado,
       el stock reservado vuelve al inventario. */
    function setOrderStatus(state, id, next) {
      var o = orderById(state, id);
      if (!o) return { ok: false, error: "Ese pedido ya no existe." };
      var allowed = TRANSITIONS[o.status] || [];
      if (allowed.indexOf(next) === -1) {
        return { ok: false, error: "No se puede pasar un pedido «" + o.status + "» a «" + next + "»." };
      }
      if (next === "Cancelado") {
        o.lines.forEach(function (ln) {
          var p = productBySku(state, ln.sku);
          if (p) p.stock += ln.qty;
        });
      }
      o.status = next;
      return { ok: true, order: o };
    }

    function computeKpis(state) {
      var units = state.products.reduce(function (s, p) { return s + p.stock; }, 0);
      var sales = state.orders
        .filter(function (o) { return o.status !== "Cancelado"; })
        .reduce(function (s, o) { return s + o.total; }, 0);
      return {
        catalog: state.products.length,
        units: units,
        alerts: alertsOf(state).length,
        ordersToday: state.orders.length,
        salesToday: round2(sales)
      };
    }

    return {
      freshState: freshState,
      productBySku: productBySku,
      orderById: orderById,
      statusOf: statusOf,
      alertsOf: alertsOf,
      createOrder: createOrder,
      registerEntry: registerEntry,
      adjustStock: adjustStock,
      setOrderStatus: setOrderStatus,
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

  var kpiCatalog = document.getElementById("kpiCatalog");
  var kpiUnits = document.getElementById("kpiUnits");
  var kpiAlerts = document.getElementById("kpiAlerts");
  var kpiOrders = document.getElementById("kpiOrders");
  var kpiSales = document.getElementById("kpiSales");
  var inventoryBody = document.getElementById("inventoryBody");
  var alertsList = document.getElementById("alertsList");
  var ordersBody = document.getElementById("ordersBody");
  var activityList = document.getElementById("activityList");
  var searchInput = document.getElementById("searchInput");
  var statusFilter = document.getElementById("statusFilter");
  var entryProduct = document.getElementById("entryProduct");
  var orderLinesBox = document.getElementById("orderLines");
  var orderTotalEl = document.getElementById("orderTotal");

  var STATUS_LABEL = { ok: "OK", bajo: "Stock bajo", agotado: "Agotado" };
  var NEXT_LABEL = { "Preparando": "▶ Preparando", "Entregado": "✓ Entregado", "Cancelado": "✕ Cancelar" };

  function money(n) { return "$" + Number(n).toFixed(2); }

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
    kpiCatalog.textContent = k.catalog;
    kpiUnits.textContent = k.units;
    kpiAlerts.textContent = k.alerts;
    kpiOrders.textContent = k.ordersToday;
    kpiSales.textContent = money(k.salesToday);
  }

  /* ---------- Inventario ---------- */
  function renderInventory() {
    var q = searchInput.value.trim().toLowerCase();
    var f = statusFilter.value;
    inventoryBody.innerHTML = "";
    var visible = state.products.filter(function (p) {
      var matchQ = !q || p.name.toLowerCase().indexOf(q) !== -1 || p.sku.toLowerCase().indexOf(q) !== -1;
      var st = DemoCore.statusOf(p);
      var matchF = f === "todos" || st === f;
      return matchQ && matchF;
    });
    if (visible.length === 0) {
      var trE = document.createElement("tr");
      trE.className = "empty-row";
      trE.innerHTML = '<td colspan="8">Ningún producto coincide con la búsqueda o el filtro.</td>';
      inventoryBody.appendChild(trE);
      return;
    }
    visible.forEach(function (p) {
      var st = DemoCore.statusOf(p);
      var tr = document.createElement("tr");
      if (st === "agotado") tr.className = "row-alert";
      else if (st === "bajo") tr.className = "row-low";
      tr.innerHTML =
        "<td>" + escapeHtml(p.sku) + "</td>" +
        "<td><strong>" + escapeHtml(p.name) + "</strong></td>" +
        "<td>" + escapeHtml(p.category) + "</td>" +
        '<td><span class="stock-num">' + p.stock + "</span></td>" +
        "<td>" + p.min + "</td>" +
        "<td>" + money(p.buy) + "</td>" +
        "<td>" + money(p.sell) + "</td>" +
        '<td><span class="badge ' + st + '">' + STATUS_LABEL[st] + "</span></td>";
      inventoryBody.appendChild(tr);
    });
  }

  function fillProductSelects() {
    var opts = state.products.map(function (p) {
      return '<option value="' + p.sku + '">' + escapeHtml(p.sku + " · " + p.name + " (stock: " + p.stock + ")") + "</option>";
    }).join("");
    entryProduct.innerHTML = opts;
    orderLinesBox.querySelectorAll("select.line-sku").forEach(function (sel) {
      var current = sel.value;
      sel.innerHTML = opts;
      if (current) sel.value = current;
    });
  }

  /* ---------- Alertas ---------- */
  function renderAlerts() {
    var alerts = DemoCore.alertsOf(state);
    alertsList.innerHTML = "";
    if (alerts.length === 0) {
      var liOk = document.createElement("li");
      liOk.className = "fine";
      liOk.innerHTML = "<strong>✅ Sin alertas.</strong><span class='alert-meta'>Todo el inventario está sobre el mínimo.</span>";
      alertsList.appendChild(liOk);
      return;
    }
    alerts.forEach(function (p) {
      var st = DemoCore.statusOf(p);
      var li = document.createElement("li");
      if (st === "agotado") li.className = "out";
      li.innerHTML = st === "agotado"
        ? "<strong>⛔ " + escapeHtml(p.name) + " — AGOTADO</strong>" +
          '<span class="alert-meta">Stock mínimo: ' + p.min + ". Hay que pedir al proveedor ya.</span>"
        : "<strong>⚠ " + escapeHtml(p.name) + "</strong>" +
          '<span class="alert-meta">Quedan ' + p.stock + " de un mínimo de " + p.min + ". Conviene reponer pronto.</span>";
      alertsList.appendChild(li);
    });
  }

  /* ---------- Pedidos ---------- */
  function orderDetail(o) {
    return o.lines.map(function (ln) {
      var p = DemoCore.productBySku(state, ln.sku);
      return ln.qty + " × " + (p ? p.name : ln.sku);
    }).join(" · ");
  }

  function renderOrders(highlightId) {
    ordersBody.innerHTML = "";
    if (state.orders.length === 0) {
      var trE = document.createElement("tr");
      trE.className = "empty-row";
      trE.innerHTML = '<td colspan="6">Todavía no hay pedidos hoy.</td>';
      ordersBody.appendChild(trE);
      return;
    }
    state.orders.slice().reverse().forEach(function (o) {
      var tr = document.createElement("tr");
      if (highlightId && o.id === highlightId) tr.className = "new-row";
      var badgeClass = "st-" + o.status.toLowerCase();
      var html =
        "<td><strong>" + o.id + "</strong></td>" +
        "<td>" + escapeHtml(o.client) + "</td>" +
        '<td class="detail-cell">' + escapeHtml(orderDetail(o)) + "</td>" +
        "<td><strong>" + money(o.total) + "</strong></td>" +
        '<td><span class="badge ' + badgeClass + '">' + o.status + "</span></td>";
      tr.innerHTML = html;
      var tdA = document.createElement("td");
      tdA.className = "actions-cell";
      var nexts = DemoCore.TRANSITIONS[o.status] || [];
      if (nexts.length === 0) {
        tdA.innerHTML = '<span class="no-actions">—</span>';
      } else {
        nexts.forEach(function (nx) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "btn-small" + (nx === "Cancelado" ? " danger" : "");
          btn.textContent = NEXT_LABEL[nx];
          btn.addEventListener("click", function () { advanceOrder(o.id, nx); });
          tdA.appendChild(btn);
        });
      }
      tr.appendChild(tdA);
      ordersBody.appendChild(tr);
    });
  }

  function advanceOrder(id, next) {
    var before = DemoCore.orderById(state, id);
    var prevStatus = before ? before.status : "";
    var res = DemoCore.setOrderStatus(state, id, next);
    if (!res.ok) return;
    if (next === "Cancelado") {
      logActivity("✕ " + id + " (" + res.order.client + ") fue cancelado desde «" + prevStatus + "» y el stock de sus productos volvió al inventario.");
    } else {
      logActivity("📦 " + id + " (" + res.order.client + ") pasó a «" + next + "».");
    }
    renderAll(id);
  }

  /* ---------- Nuevo pedido: líneas dinámicas ---------- */
  function addOrderLine(sku) {
    var row = document.createElement("div");
    row.className = "order-line";
    var sel = document.createElement("select");
    sel.className = "line-sku";
    sel.setAttribute("aria-label", "Producto del pedido");
    sel.innerHTML = state.products.map(function (p) {
      return '<option value="' + p.sku + '">' + escapeHtml(p.name + " — " + money(p.sell) + " (stock: " + p.stock + ")") + "</option>";
    }).join("");
    if (sku) sel.value = sku;
    var qty = document.createElement("input");
    qty.type = "number";
    qty.className = "line-qty";
    qty.min = "1"; qty.step = "1"; qty.value = "1";
    qty.setAttribute("aria-label", "Cantidad");
    var rm = document.createElement("button");
    rm.type = "button";
    rm.className = "btn-remove-line";
    rm.textContent = "✕";
    rm.title = "Quitar producto";
    rm.addEventListener("click", function () {
      row.remove();
      if (orderLinesBox.children.length === 0) addOrderLine();
      updateOrderTotal();
    });
    sel.addEventListener("change", updateOrderTotal);
    qty.addEventListener("input", updateOrderTotal);
    row.appendChild(sel);
    row.appendChild(qty);
    row.appendChild(rm);
    orderLinesBox.appendChild(row);
  }

  function readOrderLines() {
    var lines = [];
    orderLinesBox.querySelectorAll(".order-line").forEach(function (row) {
      lines.push({
        sku: row.querySelector(".line-sku").value,
        qty: parseInt(row.querySelector(".line-qty").value, 10)
      });
    });
    return lines;
  }

  function updateOrderTotal() {
    var total = 0;
    readOrderLines().forEach(function (ln) {
      var p = DemoCore.productBySku(state, ln.sku);
      if (p && ln.qty > 0) total += p.sell * ln.qty;
    });
    orderTotalEl.textContent = money(total);
  }

  document.getElementById("btnAddLine").addEventListener("click", function () {
    addOrderLine();
    updateOrderTotal();
  });

  document.getElementById("btnCreateOrder").addEventListener("click", function () {
    var errEl = document.getElementById("orderError");
    var client = document.getElementById("orderClient").value;
    var beforeAlerts = DemoCore.alertsOf(state).map(function (p) { return p.sku; });
    var res = DemoCore.createOrder(state, client, readOrderLines());
    if (!res.ok) { showError(errEl, res.error); return; }
    showError(errEl, "");
    var o = res.order;
    logActivity("🧾 " + o.id + ": nuevo pedido de " + o.client + " por " + money(o.total) + ". El stock se descontó en vivo.");
    DemoCore.alertsOf(state).forEach(function (p) {
      if (beforeAlerts.indexOf(p.sku) === -1) {
        logActivity("🚨 Alerta nueva: «" + p.name + "» cayó a " + p.stock + " unidades (mínimo " + p.min + ").");
      }
    });
    document.getElementById("orderClient").value = "";
    orderLinesBox.innerHTML = "";
    addOrderLine();
    updateOrderTotal();
    renderAll(o.id);
  });

  /* ---------- Entrada / ajuste ---------- */
  document.getElementById("entryForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var errEl = document.getElementById("entryError");
    var sku = entryProduct.value;
    var type = document.getElementById("entryType").value;
    var qty = document.getElementById("entryQty").value;
    var res = type === "entrada"
      ? DemoCore.registerEntry(state, sku, qty)
      : DemoCore.adjustStock(state, sku, qty);
    if (!res.ok) { showError(errEl, res.error); return; }
    showError(errEl, "");
    if (type === "entrada") {
      logActivity("📥 Entrada de mercadería: +" + parseInt(qty, 10) + " de «" + res.product.name + "». Stock ahora: " + res.product.stock + ".");
    } else {
      logActivity("🧮 Ajuste de inventario: «" + res.product.name + "» quedó en " + res.product.stock + " unidades tras el conteo.");
    }
    document.getElementById("entryQty").value = "";
    renderAll(null);
  });

  /* ---------- Filtros ---------- */
  searchInput.addEventListener("input", renderInventory);
  statusFilter.addEventListener("change", renderInventory);

  /* ---------- Render general ---------- */
  function renderAll(highlightOrderId) {
    renderKpis();
    renderInventory();
    renderAlerts();
    renderOrders(highlightOrderId);
    fillProductSelects();
    updateOrderTotal();
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = DemoCore.freshState();
    searchInput.value = "";
    statusFilter.value = "todos";
    document.getElementById("orderClient").value = "";
    showError(document.getElementById("orderError"), "");
    showError(document.getElementById("entryError"), "");
    orderLinesBox.innerHTML = "";
    addOrderLine();
    activityList.innerHTML = "<li>🟢 El panel está activo: el inventario se actualiza con cada movimiento.</li>";
    renderAll(null);
  });

  /* ---------- Arranque ---------- */
  addOrderLine();
  renderAll(null);
})();
