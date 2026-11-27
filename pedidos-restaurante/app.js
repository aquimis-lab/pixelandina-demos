/* PixelAndina — Demo interactiva: Pedidos para Restaurantes
   El cliente pide desde el QR de su mesa, la comanda llega a la pantalla
   de cocina con cronómetro y la caja cierra la cuenta (IVA 15%, propina).
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa.
   El reloj de la demo es virtual (state.nowSec) para poder probarlo. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    var BUSINESS = "La Brasa Andina";
    var TABLES = 8;
    var IVA_RATE = 0.15;
    var TIP_RATE = 0.10;
    var LATE_AFTER_SEC = 15 * 60; /* alerta si la comanda pasa de 15 min sin salir */

    var CATEGORIES = [
      { id: "entradas", name: "Entradas" },
      { id: "fuertes",  name: "Fuertes" },
      { id: "bebidas",  name: "Bebidas" },
      { id: "postres",  name: "Postres" }
    ];

    var MENU = [
      { id: "empanadas", cat: "entradas", name: "Empanadas de viento (3 und.)",        price: 3.50, minutes: 8,  icon: "🥟", desc: "De queso, fritas al momento, con ají de la casa." },
      { id: "locro",     cat: "entradas", name: "Locro de papa con queso",            price: 4.50, minutes: 10, icon: "🍲", desc: "Cremoso, con aguacate y queso fresco." },
      { id: "ceviche",   cat: "entradas", name: "Ceviche de camarón",                 price: 9.50, minutes: 12, icon: "🍤", desc: "Camarón, cebolla paiteña, limón y chifles." },
      { id: "seco",      cat: "fuertes",  name: "Seco de pollo",                      price: 8.50, minutes: 18, icon: "🍗", desc: "Con arroz, maduro frito y ensalada." },
      { id: "hornado",   cat: "fuertes",  name: "Hornado con mote",                   price: 9.00, minutes: 15, icon: "🐖", desc: "Cerdo horneado, mote, llapingachos y agrio." },
      { id: "menestra",  cat: "fuertes",  name: "Arroz con menestra y carne asada",   price: 8.00, minutes: 16, icon: "🥩", desc: "Menestra de lenteja, carne a la brasa y patacones." },
      { id: "encebollado", cat: "fuertes", name: "Encebollado de pescado",            price: 7.50, minutes: 14, icon: "🐟", desc: "Albacora, yuca y cebolla encurtida; con chifles." },
      { id: "limonada",  cat: "bebidas",  name: "Limonada fresca (vaso)",             price: 2.50, minutes: 3,  icon: "🍋", desc: "Recién exprimida, con hierbabuena." },
      { id: "jugo-mora", cat: "bebidas",  name: "Jugo de mora",                       price: 3.00, minutes: 4,  icon: "🫐", desc: "Mora natural, en agua o en leche." },
      { id: "gaseosa",   cat: "bebidas",  name: "Gaseosa personal",                   price: 1.50, minutes: 1,  icon: "🥤", desc: "Botella personal bien fría." },
      { id: "flan",      cat: "postres",  name: "Flan de coco",                       price: 3.50, minutes: 2,  icon: "🍮", desc: "Suave, con caramelo y coco rallado." },
      { id: "helado",    cat: "postres",  name: "Helado de paila (2 sabores)",        price: 4.00, minutes: 3,  icon: "🍨", desc: "Sabores del día, hecho en paila de bronce." }
    ];

    /* Flujo de estados, en orden estricto. «cerrado» solo se llega desde caja. */
    var STATUS_FLOW = ["recibido", "preparacion", "listo", "entregado"];
    var STATUS_LABELS = {
      recibido:    "Recibido",
      preparacion: "En preparación",
      listo:       "Listo",
      entregado:   "Entregado",
      cerrado:     "Cuenta cerrada"
    };
    var NEXT_LABELS = {
      recibido:    "🔥 Empezar a preparar",
      preparacion: "✅ Marcar listo",
      listo:       "🍽️ Entregar a la mesa"
    };

    /* ---------- Utilidades ---------- */
    function round2(n) { return Math.round(n * 100) / 100; }
    function money(n) { return "$" + round2(n).toFixed(2); }
    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function formatClock(totalSec) {
      var s = Math.max(0, Math.floor(totalSec));
      var m = Math.floor(s / 60);
      return pad(m) + ":" + pad(s % 60);
    }

    function itemById(id) { return MENU.filter(function (i) { return i.id === id; })[0] || null; }
    function categoryById(id) { return CATEGORIES.filter(function (c) { return c.id === id; })[0] || null; }
    function itemsOfCategory(catId) { return MENU.filter(function (i) { return i.cat === catId; }); }
    function orderById(state, id) { return state.orders.filter(function (o) { return o.id === id; })[0] || null; }

    /* ---------- Reloj virtual de la demo ---------- */
    function tick(state, seconds) {
      state.nowSec += Math.max(0, Math.floor(seconds || 0));
      return state.nowSec;
    }
    function elapsedSec(state, order) { return Math.max(0, state.nowSec - order.createdAtSec); }

    /* Tarde: sigue en cocina (recibido o en preparación) y pasó el límite. */
    function isOverdue(state, order) {
      return (order.status === "recibido" || order.status === "preparacion") &&
        elapsedSec(state, order) > LATE_AFTER_SEC;
    }

    /* Tiempo de preparación: de que entró a que quedó «Listo». */
    function prepSecOf(order) {
      return (order.readyAtSec === null || order.readyAtSec === undefined)
        ? null : order.readyAtSec - order.createdAtSec;
    }

    /* ---------- Estado inicial: 3 comandas vivas en cocina ---------- */
    function seedOrders(now) {
      return [
        {
          id: "P-1", code: "PED-001", table: 3, status: "preparacion",
          createdAtSec: now - 12 * 60, readyAtSec: null, closedAtSec: null, bill: null,
          items: [
            { itemId: "locro", name: "Locro de papa con queso", price: 4.50, qty: 1, note: "" },
            { itemId: "seco",  name: "Seco de pollo",           price: 8.50, qty: 2, note: "Sin cebolla en la ensalada" },
            { itemId: "limonada", name: "Limonada fresca (vaso)", price: 2.50, qty: 2, note: "" }
          ]
        },
        {
          id: "P-2", code: "PED-002", table: 5, status: "recibido",
          createdAtSec: now - 4 * 60, readyAtSec: null, closedAtSec: null, bill: null,
          items: [
            { itemId: "hornado",   name: "Hornado con mote", price: 9.00, qty: 1, note: "" },
            { itemId: "jugo-mora", name: "Jugo de mora",     price: 3.00, qty: 1, note: "En leche, por favor" }
          ]
        },
        {
          id: "P-3", code: "PED-003", table: 1, status: "listo",
          createdAtSec: now - 18 * 60, readyAtSec: now - 18 * 60 + 13 * 60, closedAtSec: null, bill: null,
          items: [
            { itemId: "ceviche", name: "Ceviche de camarón",               price: 9.50, qty: 1, note: "Picante aparte" },
            { itemId: "menestra", name: "Arroz con menestra y carne asada", price: 8.00, qty: 1, note: "" }
          ]
        }
      ];
    }

    function freshState() {
      var start = 12 * 3600; /* la demo «abre» al mediodía */
      return { orders: seedOrders(start), nextCode: 4, nowSec: start };
    }

    /* ---------- Crear pedido desde la mesa ---------- */
    function createOrder(state, data) {
      var table = parseInt(data.table, 10);
      if (!table || table < 1 || table > TABLES) {
        return { ok: false, error: "Elige tu mesa (del 1 al " + TABLES + ") para enviar el pedido." };
      }
      var rawItems = (data.items || []).filter(function (i) { return i && i.qty > 0; });
      if (rawItems.length === 0) {
        return { ok: false, error: "Tu pedido está vacío: agrega al menos un plato del menú." };
      }
      var items = [];
      for (var i = 0; i < rawItems.length; i++) {
        var dish = itemById(rawItems[i].itemId);
        if (!dish) return { ok: false, error: "Uno de los platos ya no está en el menú. Revisa tu pedido." };
        items.push({
          itemId: dish.id,
          name: dish.name,
          price: dish.price,
          qty: Math.floor(rawItems[i].qty),
          note: String(rawItems[i].note || "").trim()
        });
      }
      var code = "PED-" + ("00" + state.nextCode).slice(-3);
      var order = {
        id: "P-" + state.nextCode,
        code: code,
        table: table,
        status: "recibido",
        createdAtSec: state.nowSec,
        readyAtSec: null,
        closedAtSec: null,
        bill: null,
        items: items
      };
      state.nextCode += 1;
      state.orders.push(order);
      return { ok: true, order: order };
    }

    /* ---------- Totales y cuenta ---------- */
    function orderSubtotal(order) {
      return round2(order.items.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0));
    }

    function orderUnits(order) {
      return order.items.reduce(function (sum, i) { return sum + i.qty; }, 0);
    }

    function computeBill(order, withTip) {
      var subtotal = orderSubtotal(order);
      var iva = round2(subtotal * IVA_RATE);
      var tip = withTip ? round2(subtotal * TIP_RATE) : 0;
      return { subtotal: subtotal, iva: iva, tip: tip, total: round2(subtotal + iva + tip) };
    }

    /* ---------- Flujo de estados: solo se avanza de a un paso ---------- */
    function nextStatus(status) {
      var idx = STATUS_FLOW.indexOf(status);
      if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
      return STATUS_FLOW[idx + 1];
    }

    function transition(state, id, target) {
      var o = orderById(state, id);
      if (!o) return { ok: false, error: "Ese pedido ya no existe." };
      if (o.status === "cerrado") return { ok: false, error: "La cuenta de este pedido ya está cerrada." };
      var expected = nextStatus(o.status);
      if (!expected) return { ok: false, error: "Este pedido ya fue entregado: su cuenta se cierra en Caja." };
      if (target !== expected) {
        return { ok: false, error: "La comanda no puede saltar de «" + STATUS_LABELS[o.status] +
          "» a «" + (STATUS_LABELS[target] || target) + "»: primero debe pasar por «" + STATUS_LABELS[expected] + "»." };
      }
      o.status = target;
      if (target === "listo") o.readyAtSec = state.nowSec;
      return { ok: true, order: o };
    }

    function advanceStatus(state, id) {
      var o = orderById(state, id);
      if (!o) return { ok: false, error: "Ese pedido ya no existe." };
      var target = nextStatus(o.status);
      if (!target) {
        if (o.status === "cerrado") return { ok: false, error: "La cuenta de este pedido ya está cerrada." };
        return { ok: false, error: "Este pedido ya fue entregado: su cuenta se cierra en Caja." };
      }
      return transition(state, id, target);
    }

    /* ---------- Caja: cerrar la cuenta de una mesa entregada ---------- */
    function closeAccount(state, id, withTip) {
      var o = orderById(state, id);
      if (!o) return { ok: false, error: "Ese pedido ya no existe." };
      if (o.status === "cerrado") return { ok: false, error: "La cuenta de este pedido ya está cerrada." };
      if (o.status !== "entregado") {
        return { ok: false, error: "Solo se puede cerrar la cuenta de un pedido ya entregado a la mesa." };
      }
      o.bill = computeBill(o, !!withTip);
      o.status = "cerrado";
      o.closedAtSec = state.nowSec;
      return { ok: true, order: o, bill: o.bill };
    }

    /* ---------- KPIs del día ---------- */
    function computeKpis(state) {
      var closed = state.orders.filter(function (o) { return o.status === "cerrado"; });
      var sales = round2(closed.reduce(function (sum, o) { return sum + (o.bill ? o.bill.total : 0); }, 0));
      var prepSecs = state.orders
        .map(function (o) { return prepSecOf(o); })
        .filter(function (s) { return s !== null; });
      var avgPrepMin = null;
      if (prepSecs.length > 0) {
        var avgSec = prepSecs.reduce(function (a, b) { return a + b; }, 0) / prepSecs.length;
        avgPrepMin = Math.round(avgSec / 60 * 10) / 10;
      }
      var active = state.orders.filter(function (o) {
        return o.status === "recibido" || o.status === "preparacion" || o.status === "listo";
      }).length;
      return {
        ordersToday: state.orders.length,
        closedCount: closed.length,
        sales: sales,
        avgTicket: closed.length > 0 ? round2(sales / closed.length) : null,
        avgPrepMin: avgPrepMin,
        activeCount: active
      };
    }

    return {
      BUSINESS: BUSINESS,
      TABLES: TABLES,
      IVA_RATE: IVA_RATE,
      TIP_RATE: TIP_RATE,
      LATE_AFTER_SEC: LATE_AFTER_SEC,
      CATEGORIES: CATEGORIES,
      MENU: MENU,
      STATUS_LABELS: STATUS_LABELS,
      NEXT_LABELS: NEXT_LABELS,
      money: money,
      round2: round2,
      formatClock: formatClock,
      itemById: itemById,
      categoryById: categoryById,
      itemsOfCategory: itemsOfCategory,
      orderById: orderById,
      freshState: freshState,
      tick: tick,
      elapsedSec: elapsedSec,
      isOverdue: isOverdue,
      prepSecOf: prepSecOf,
      createOrder: createOrder,
      orderSubtotal: orderSubtotal,
      orderUnits: orderUnits,
      computeBill: computeBill,
      nextStatus: nextStatus,
      transition: transition,
      advanceStatus: advanceStatus,
      closeAccount: closeAccount,
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
  var C = DemoCore;
  var state = C.freshState();
  var ui = { table: 3, category: "entradas", cart: {} }; /* cart: itemId -> {qty, note} */
  var billPreview = {}; /* orderId -> {open: bool, tip: bool} */

  var mesaChips = document.getElementById("mesaChips");
  var catTabs = document.getElementById("catTabs");
  var menuList = document.getElementById("menuList");
  var cartList = document.getElementById("cartList");
  var cartTotal = document.getElementById("cartTotal");
  var sendError = document.getElementById("sendError");
  var sendOk = document.getElementById("sendOk");
  var kitchenList = document.getElementById("kitchenList");
  var cashList = document.getElementById("cashList");
  var closedList = document.getElementById("closedList");
  var activityList = document.getElementById("activityList");
  var kpiOrders = document.getElementById("kpiOrders");
  var kpiSales = document.getElementById("kpiSales");
  var kpiTicket = document.getElementById("kpiTicket");
  var kpiPrep = document.getElementById("kpiPrep");

  function money(n) { return C.money(n); }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function logActivity(text) {
    var li = document.createElement("li");
    li.textContent = text;
    activityList.insertBefore(li, activityList.firstChild);
    while (activityList.children.length > 6) {
      activityList.removeChild(activityList.lastChild);
    }
  }

  /* ---------- Vista cliente: mesas, menú y carrito ---------- */
  function renderMesas() {
    mesaChips.innerHTML = "";
    for (var t = 1; t <= C.TABLES; t++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mesa-chip" + (t === ui.table ? " selected" : "");
      btn.textContent = t;
      btn.setAttribute("data-table", t);
      mesaChips.appendChild(btn);
    }
  }

  mesaChips.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-table]");
    if (!btn) return;
    ui.table = parseInt(btn.getAttribute("data-table"), 10);
    renderMesas();
  });

  function renderCategories() {
    catTabs.innerHTML = "";
    C.CATEGORIES.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-tab" + (cat.id === ui.category ? " selected" : "");
      btn.textContent = cat.name;
      btn.setAttribute("data-cat", cat.id);
      catTabs.appendChild(btn);
    });
  }

  catTabs.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-cat]");
    if (!btn) return;
    ui.category = btn.getAttribute("data-cat");
    renderCategories();
    renderMenu();
  });

  function renderMenu() {
    menuList.innerHTML = "";
    C.itemsOfCategory(ui.category).forEach(function (dish) {
      var card = document.createElement("div");
      card.className = "dish-card";
      card.innerHTML =
        '<span class="icon" aria-hidden="true">' + dish.icon + "</span>" +
        '<span class="dish-main"><span class="dish-title">' + escapeHtml(dish.name) + "</span>" +
        '<span class="dish-desc">' + escapeHtml(dish.desc) + "</span>" +
        '<span class="dish-time">⏱️ aprox. ' + dish.minutes + " min</span></span>" +
        '<span class="dish-price">' + money(dish.price) + "</span>";
      var add = document.createElement("button");
      add.type = "button";
      add.className = "add-btn";
      add.textContent = "+";
      add.setAttribute("aria-label", "Agregar " + dish.name);
      add.setAttribute("data-add", dish.id);
      card.appendChild(add);
      menuList.appendChild(card);
    });
  }

  menuList.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-add]");
    if (!btn) return;
    var id = btn.getAttribute("data-add");
    if (!ui.cart[id]) ui.cart[id] = { qty: 0, note: "" };
    ui.cart[id].qty += 1;
    hideSendMessages();
    renderCart();
  });

  function cartItemsArray() {
    return Object.keys(ui.cart)
      .filter(function (id) { return ui.cart[id].qty > 0; })
      .map(function (id) { return { itemId: id, qty: ui.cart[id].qty, note: ui.cart[id].note }; });
  }

  function renderCart() {
    var items = cartItemsArray();
    cartList.innerHTML = "";
    if (items.length === 0) {
      var empty = document.createElement("p");
      empty.className = "cart-empty";
      empty.textContent = "Todavía no agregas platos. Toca el botón + del menú para armar tu pedido.";
      cartList.appendChild(empty);
    }
    var subtotal = 0;
    items.forEach(function (line) {
      var dish = C.itemById(line.itemId);
      var lineTotal = dish.price * line.qty;
      subtotal += lineTotal;
      var row = document.createElement("div");
      row.className = "cart-line";
      row.innerHTML =
        '<div class="cart-line-top">' +
        '<span class="cart-line-name">' + escapeHtml(dish.name) +
        "<small>" + money(dish.price) + " c/u</small></span>" +
        '<span class="qty-ctrl">' +
        '<button type="button" class="qty-btn" data-dec="' + dish.id + '" aria-label="Quitar uno">−</button>' +
        '<span class="qty-num">' + line.qty + "</span>" +
        '<button type="button" class="qty-btn" data-inc="' + dish.id + '" aria-label="Agregar uno">+</button>' +
        "</span>" +
        '<span class="cart-line-total">' + money(lineTotal) + "</span>" +
        "</div>";
      var note = document.createElement("input");
      note.type = "text";
      note.className = "cart-note";
      note.placeholder = "Nota para la cocina (ej.: sin cebolla)";
      note.value = ui.cart[dish.id].note || "";
      note.setAttribute("data-note", dish.id);
      note.maxLength = 80;
      row.appendChild(note);
      cartList.appendChild(row);
    });
    cartTotal.textContent = money(subtotal);
  }

  cartList.addEventListener("click", function (ev) {
    var inc = ev.target.closest("[data-inc]");
    var dec = ev.target.closest("[data-dec]");
    if (inc) {
      ui.cart[inc.getAttribute("data-inc")].qty += 1;
      renderCart();
    } else if (dec) {
      var id = dec.getAttribute("data-dec");
      ui.cart[id].qty -= 1;
      if (ui.cart[id].qty <= 0) delete ui.cart[id];
      renderCart();
    }
  });

  cartList.addEventListener("input", function (ev) {
    var input = ev.target.closest("[data-note]");
    if (!input) return;
    var id = input.getAttribute("data-note");
    if (ui.cart[id]) ui.cart[id].note = input.value;
  });

  function hideSendMessages() {
    sendError.classList.remove("show");
    sendError.textContent = "";
    sendOk.hidden = true;
    sendOk.textContent = "";
  }

  document.getElementById("btnSendOrder").addEventListener("click", function () {
    hideSendMessages();
    var res = C.createOrder(state, { table: ui.table, items: cartItemsArray() });
    if (!res.ok) {
      sendError.textContent = res.error;
      sendError.classList.add("show");
      return;
    }
    var o = res.order;
    ui.cart = {};
    renderCart();
    sendOk.textContent = "✅ ¡Pedido " + o.code + " enviado! La cocina ya lo tiene en pantalla. " +
      "Tu mesa es la " + o.table + ": en el panel derecho puedes seguir su estado.";
    sendOk.hidden = false;
    logActivity("📥 " + o.code + ": la mesa " + o.table + " pidió " + C.orderUnits(o) +
      " platos por " + money(C.orderSubtotal(o)) + " (subtotal). La comanda entró a cocina.");
    renderBusiness(o.code);
  });

  /* ---------- Panel del restaurante: KPIs ---------- */
  function renderKpis() {
    var k = C.computeKpis(state);
    kpiOrders.textContent = k.ordersToday;
    kpiSales.textContent = money(k.sales);
    kpiTicket.textContent = k.avgTicket === null ? "—" : money(k.avgTicket);
    kpiPrep.textContent = k.avgPrepMin === null ? "—" : (k.avgPrepMin + " min");
  }

  /* ---------- Pantalla de cocina ---------- */
  function statusBadge(status) {
    return '<span class="badge st-' + status + '">' + C.STATUS_LABELS[status] + "</span>";
  }

  function renderKitchen(highlightCode) {
    var active = state.orders.filter(function (o) { return o.status !== "cerrado" && o.status !== "entregado"; });
    kitchenList.innerHTML = "";
    if (active.length === 0) {
      var p = document.createElement("p");
      p.className = "kitchen-empty";
      p.textContent = "No hay comandas pendientes. Envía un pedido desde la vista del cliente.";
      kitchenList.appendChild(p);
      return;
    }
    active.slice().sort(function (a, b) { return a.createdAtSec - b.createdAtSec; }).forEach(function (o) {
      var card = document.createElement("div");
      card.className = "order-card" + (highlightCode === o.code ? " new-row" : "");
      card.setAttribute("data-card", o.id);
      var itemsHtml = o.items.map(function (i) {
        return "<li><span class=\"qty\">" + i.qty + " ×</span> " + escapeHtml(i.name) +
          (i.note ? '<span class="item-note">📝 «' + escapeHtml(i.note) + "»</span>" : "") + "</li>";
      }).join("");
      card.innerHTML =
        '<div class="order-top">' +
        '<span class="order-code">' + o.code + "</span>" +
        '<span class="mesa-badge">Mesa ' + o.table + "</span>" +
        '<span class="late-tag">¡Tarde!</span>' +
        '<span class="order-timer" data-timer-for="' + o.id + '">' + C.formatClock(C.elapsedSec(state, o)) + "</span>" +
        "</div>" +
        '<div>' + statusBadge(o.status) + "</div>" +
        '<ul class="order-items">' + itemsHtml + "</ul>";
      var actions = document.createElement("div");
      actions.className = "order-actions";
      var next = C.nextStatus(o.status);
      if (next) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "order-btn next-" + (next === "preparacion" ? "prep" : next === "listo" ? "ready" : "deliver");
        btn.textContent = C.NEXT_LABELS[o.status];
        btn.setAttribute("data-advance", o.id);
        actions.appendChild(btn);
      }
      card.appendChild(actions);
      kitchenList.appendChild(card);
    });
    refreshTimers();
  }

  kitchenList.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-advance]");
    if (!btn) return;
    var id = btn.getAttribute("data-advance");
    var before = C.orderById(state, id);
    var res = C.advanceStatus(state, id);
    if (!res.ok) { logActivity("⚠️ " + res.error); return; }
    var o = res.order;
    if (o.status === "preparacion") {
      logActivity("🔥 " + o.code + " (mesa " + o.table + "): la cocina empezó a preparar el pedido.");
    } else if (o.status === "listo") {
      logActivity("✅ " + o.code + " (mesa " + o.table + "): ¡pedido listo en " +
        C.formatClock(C.prepSecOf(o)) + "! El mesero puede llevarlo.");
    } else if (o.status === "entregado") {
      logActivity("🍽️ " + o.code + " (mesa " + o.table + "): entregado. La cuenta quedó lista para cerrar en Caja.");
    }
    if (before) renderBusiness(o.code);
  });

  /* ---------- Caja ---------- */
  function itemsSummary(o) {
    return o.items.map(function (i) { return i.qty + " × " + i.name; }).join(" · ");
  }

  function renderCash() {
    var payable = state.orders.filter(function (o) { return o.status === "entregado"; });
    var closed = state.orders.filter(function (o) { return o.status === "cerrado"; });
    cashList.innerHTML = "";
    if (payable.length === 0) {
      var p = document.createElement("p");
      p.className = "empty-note";
      p.textContent = "Ninguna mesa espera cuenta todavía. Entrega un pedido desde la cocina y aparecerá aquí.";
      cashList.appendChild(p);
    }
    payable.forEach(function (o) {
      var card = document.createElement("div");
      card.className = "cash-card";
      var head = '<div class="cash-head"><span class="order-code">' + o.code + "</span>" +
        '<span class="mesa-badge">Mesa ' + o.table + "</span>" + statusBadge(o.status) + "</div>" +
        '<p class="cash-items">' + escapeHtml(itemsSummary(o)) + "</p>";
      var preview = billPreview[o.id];
      if (preview && preview.open) {
        var bill = C.computeBill(o, preview.tip);
        head += '<div class="bill-box">' +
          "<p><span>Subtotal</span><span>" + money(bill.subtotal) + "</span></p>" +
          "<p><span>IVA (15%)</span><span>" + money(bill.iva) + "</span></p>" +
          (preview.tip
            ? "<p><span>Propina (10%)</span><span>" + money(bill.tip) + "</span></p>"
            : "<p><span>Propina</span><span>Sin propina</span></p>") +
          '<p class="bill-total"><span>Total a pagar</span><span>' + money(bill.total) + "</span></p>" +
          "</div>" +
          '<label class="tip-toggle"><input type="checkbox" data-tip="' + o.id + '"' +
          (preview.tip ? " checked" : "") + "> Agregar propina del 10% con un toque</label>" +
          '<div class="cash-actions">' +
          '<button type="button" class="mini-btn amber" data-charge="' + o.id + '">💵 Cobrar y cerrar cuenta</button>' +
          '<button type="button" class="mini-btn" data-hidebill="' + o.id + '">Ocultar cuenta</button>' +
          "</div>";
      } else {
        head += '<div class="cash-actions">' +
          '<button type="button" class="mini-btn" data-showbill="' + o.id + '">🧾 Ver cuenta y cerrar</button>' +
          "</div>";
      }
      card.innerHTML = head;
      cashList.appendChild(card);
    });

    closedList.innerHTML = "";
    if (closed.length === 0) {
      var pc = document.createElement("p");
      pc.className = "empty-note";
      pc.textContent = "Aún no se cierra ninguna cuenta en esta demo.";
      closedList.appendChild(pc);
    }
    closed.slice().sort(function (a, b) { return b.closedAtSec - a.closedAtSec; }).forEach(function (o) {
      var row = document.createElement("div");
      row.className = "closed-row";
      row.innerHTML = "<span><strong>" + o.code + "</strong> · Mesa " + o.table + " · " +
        escapeHtml(itemsSummary(o)) + "</span>" +
        '<span class="closed-total">' + money(o.bill.total) + "</span>";
      closedList.appendChild(row);
    });
  }

  cashList.addEventListener("click", function (ev) {
    var show = ev.target.closest("[data-showbill]");
    var hide = ev.target.closest("[data-hidebill]");
    var charge = ev.target.closest("[data-charge]");
    if (show) {
      billPreview[show.getAttribute("data-showbill")] = { open: true, tip: false };
      renderCash();
    } else if (hide) {
      delete billPreview[hide.getAttribute("data-hidebill")];
      renderCash();
    } else if (charge) {
      var id = charge.getAttribute("data-charge");
      var tip = billPreview[id] ? !!billPreview[id].tip : false;
      var res = C.closeAccount(state, id, tip);
      if (!res.ok) { logActivity("⚠️ " + res.error); return; }
      delete billPreview[id];
      logActivity("💵 " + res.order.code + " (mesa " + res.order.table + "): cuenta cerrada por " +
        money(res.bill.total) + " — subtotal " + money(res.bill.subtotal) + ", IVA " + money(res.bill.iva) +
        (res.bill.tip > 0 ? ", propina " + money(res.bill.tip) : ", sin propina") + ".");
      renderBusiness(res.order.code);
    }
  });

  cashList.addEventListener("change", function (ev) {
    var input = ev.target.closest("[data-tip]");
    if (!input) return;
    var id = input.getAttribute("data-tip");
    if (!billPreview[id]) billPreview[id] = { open: true, tip: false };
    billPreview[id].tip = input.checked;
    renderCash();
  });

  function renderBusiness(highlightCode) {
    renderKpis();
    renderKitchen(highlightCode || null);
    renderCash();
  }

  /* ---------- Cronómetros en vivo (reloj virtual: 1 s real = 1 s de cocina) ---------- */
  function refreshTimers() {
    kitchenList.querySelectorAll("[data-timer-for]").forEach(function (el) {
      var o = C.orderById(state, el.getAttribute("data-timer-for"));
      if (!o) return;
      el.textContent = C.formatClock(C.elapsedSec(state, o));
      var late = C.isOverdue(state, o);
      el.classList.toggle("late", late);
      var card = el.closest("[data-card]");
      if (card) card.classList.toggle("overdue", late);
    });
  }

  setInterval(function () {
    C.tick(state, 1);
    refreshTimers();
  }, 1000);

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = C.freshState();
    ui = { table: 3, category: "entradas", cart: {} };
    billPreview = {};
    activityList.innerHTML = "<li>🟢 El sistema de pedidos está activo: las comandas del QR llegan directo a la pantalla de cocina.</li>";
    hideSendMessages();
    renderMesas();
    renderCategories();
    renderMenu();
    renderCart();
    renderBusiness(null);
  });

  /* ---------- Arranque ---------- */
  renderMesas();
  renderCategories();
  renderMenu();
  renderCart();
  renderBusiness(null);
})();
