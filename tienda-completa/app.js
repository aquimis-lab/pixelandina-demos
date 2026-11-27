/* PixelAndina — Demo interactiva: Tienda en Línea Completa
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    var FREE_SHIPPING_FROM = 50;
    var SHIPPING_COST = 4.50;
    var ORDER_FLOW = ["Recibido", "Preparando", "Enviado", "Entregado"];

    /* Precios con IVA incluido. offer = precio rebajado (null si no hay oferta). */
    function seedProducts() {
      return [
        { sku: "TEC-301", name: "Audífonos inalámbricos",    category: "Tecnología", price: 34.99, offer: 27.99, stock: 18, icon: "🎧", desc: "Bluetooth 5.3, 30 horas de batería y micrófono para llamadas." },
        { sku: "TEC-302", name: "Reloj inteligente",          category: "Tecnología", price: 49.99, offer: null,  stock: 12, icon: "⌚", desc: "Pantalla táctil, medición de pasos, sueño y notificaciones." },
        { sku: "TEC-303", name: "Cargador rápido USB-C 25 W", category: "Tecnología", price: 12.50, offer: null,  stock: 40, icon: "🔌", desc: "Carga rápida para celular y tablet, cable de 1,5 m incluido." },
        { sku: "HOG-304", name: "Licuadora 1,5 L",            category: "Hogar",      price: 39.90, offer: null,  stock: 9,  icon: "🥤", desc: "Vaso de vidrio, 5 velocidades y cuchillas de acero inoxidable." },
        { sku: "HOG-305", name: "Juego de sartenes × 3",      category: "Hogar",      price: 45.00, offer: 35.99, stock: 7,  icon: "🍳", desc: "Antiadherentes de 20, 24 y 28 cm, aptos para cocina de gas e inducción." },
        { sku: "HOG-306", name: "Lámpara LED de escritorio",  category: "Hogar",      price: 18.75, offer: null,  stock: 22, icon: "💡", desc: "Luz regulable en 3 tonos, brazo flexible y puerto USB." },
        { sku: "DEP-307", name: "Mochila deportiva 25 L",     category: "Deportes",   price: 29.99, offer: null,  stock: 15, icon: "🎒", desc: "Impermeable, compartimento para laptop y bolsillo antirrobo." },
        { sku: "DEP-308", name: "Colchoneta de yoga 6 mm",    category: "Deportes",   price: 16.99, offer: 12.99, stock: 26, icon: "🧘", desc: "Antideslizante, incluye correa de transporte." },
        { sku: "DEP-309", name: "Botella térmica 750 ml",     category: "Deportes",   price: 14.50, offer: null,  stock: 31, icon: "🍶", desc: "Acero inoxidable, mantiene el frío 24 h y el calor 12 h." },
        { sku: "BEL-310", name: "Set de cuidado facial",      category: "Belleza",    price: 24.99, offer: null,  stock: 14, icon: "🧴", desc: "Limpiador, tónico y crema hidratante para todo tipo de piel." },
        { sku: "BEL-311", name: "Secadora de cabello 2200 W", category: "Belleza",    price: 32.99, offer: null,  stock: 8,  icon: "💨", desc: "3 temperaturas, 2 velocidades y botón de aire frío." },
        { sku: "BEL-312", name: "Kit de brochas de maquillaje", category: "Belleza",  price: 11.99, offer: null,  stock: 20, icon: "🖌️", desc: "12 brochas de fibra suave con estuche de viaje." }
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

    /* Precio vigente: la oferta manda cuando existe. */
    function unitPrice(p) { return p.offer != null ? p.offer : p.price; }
    function hasOffer(p) { return p.offer != null; }

    /* Filtro + búsqueda + orden para la vitrina. */
    function filterProducts(products, opts) {
      opts = opts || {};
      var q = (opts.query || "").toLowerCase().trim();
      var cat = opts.category || "Todas";
      var out = products.filter(function (p) {
        var okCat = cat === "Todas" || p.category === cat;
        var okQ = !q || p.name.toLowerCase().indexOf(q) !== -1 || p.category.toLowerCase().indexOf(q) !== -1;
        return okCat && okQ;
      });
      if (opts.sort === "asc") out.sort(function (a, b) { return unitPrice(a) - unitPrice(b); });
      if (opts.sort === "desc") out.sort(function (a, b) { return unitPrice(b) - unitPrice(a); });
      return out;
    }

    /* ---- Carrito: mapa sku -> cantidad ---- */
    function cartAdd(cart, products, sku, qty) {
      var p = productBySku(products, sku);
      if (!p) return { ok: false, error: "Producto no encontrado" };
      qty = parseInt(qty, 10) || 1;
      var next = (cart[sku] || 0) + qty;
      if (next > p.stock) return { ok: false, error: "Stock insuficiente: quedan " + p.stock };
      if (next <= 0) delete cart[sku]; else cart[sku] = next;
      return { ok: true };
    }

    function cartSetQty(cart, products, sku, qty) {
      var p = productBySku(products, sku);
      if (!p) return { ok: false, error: "Producto no encontrado" };
      qty = parseInt(qty, 10) || 0;
      if (qty <= 0) { delete cart[sku]; return { ok: true }; }
      if (qty > p.stock) return { ok: false, error: "Stock insuficiente: quedan " + p.stock };
      cart[sku] = qty;
      return { ok: true };
    }

    function cartCount(cart) {
      return Object.keys(cart).reduce(function (acc, sku) { return acc + cart[sku]; }, 0);
    }

    /* Totales: subtotal con precios vigentes (oferta aplicada),
       envío gratis desde $50, si no $4,50. IVA ya incluido en precios. */
    function cartTotals(products, cart) {
      var subtotal = 0;
      Object.keys(cart).forEach(function (sku) {
        var p = productBySku(products, sku);
        if (p) subtotal += unitPrice(p) * cart[sku];
      });
      subtotal = round2(subtotal);
      var shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
      return { subtotal: subtotal, shipping: shipping, total: round2(subtotal + shipping) };
    }

    function cartLines(products, cart) {
      return Object.keys(cart).map(function (sku) {
        var p = productBySku(products, sku);
        return { sku: sku, name: p.name, qty: cart[sku], unit: unitPrice(p), amount: round2(unitPrice(p) * cart[sku]) };
      });
    }

    /* ---- Checkout y pedidos ---- */
    function validateCustomer(c) {
      if (!c || !c.name || c.name.trim().length < 3) return { ok: false, error: "Escribe el nombre completo" };
      if (!c.phone || c.phone.replace(/\D/g, "").length < 9) return { ok: false, error: "Escribe un teléfono válido" };
      if (!c.address || c.address.trim().length < 8) return { ok: false, error: "Escribe la dirección de entrega" };
      if (c.method !== "transferencia" && c.method !== "contraentrega") return { ok: false, error: "Elige el método de pago" };
      return { ok: true };
    }

    function seedOrders() {
      return [
        { id: "PED-1001", customer: "María Fernanda Ríos", phone: "099 555 0134", address: "Av. 9 de Octubre 456, Guayaquil", method: "transferencia", status: "Entregado",
          items: [ { sku: "TEC-301", name: "Audífonos inalámbricos", qty: 1, unit: 27.99 }, { sku: "DEP-309", name: "Botella térmica 750 ml", qty: 2, unit: 14.50 } ],
          subtotal: 56.99, shipping: 0, total: 56.99 },
        { id: "PED-1002", customer: "Carlos Vera", phone: "098 765 2210", address: "Calle Panamá 312, Guayaquil", method: "contraentrega", status: "Enviado",
          items: [ { sku: "HOG-305", name: "Juego de sartenes × 3", qty: 1, unit: 35.99 } ],
          subtotal: 35.99, shipping: 4.50, total: 40.49 },
        { id: "PED-1003", customer: "Lucía Andrade", phone: "097 333 9081", address: "Cdla. Kennedy, mz. 12 v. 4, Guayaquil", method: "transferencia", status: "Preparando",
          items: [ { sku: "BEL-310", name: "Set de cuidado facial", qty: 2, unit: 24.99 }, { sku: "BEL-312", name: "Kit de brochas de maquillaje", qty: 1, unit: 11.99 } ],
          subtotal: 61.97, shipping: 0, total: 61.97 }
      ];
    }

    function nextOrderNumber(orders) {
      var max = 1000;
      orders.forEach(function (o) {
        var n = parseInt(String(o.id).replace(/\D/g, ""), 10);
        if (n > max) max = n;
      });
      return "PED-" + (max + 1);
    }

    function placeOrder(state, customer) {
      var v = validateCustomer(customer);
      if (!v.ok) return v;
      if (cartCount(state.cart) === 0) return { ok: false, error: "El carrito está vacío" };
      var totals = cartTotals(state.products, state.cart);
      var order = {
        id: nextOrderNumber(state.orders),
        customer: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(),
        method: customer.method, status: "Recibido",
        items: cartLines(state.products, state.cart),
        subtotal: totals.subtotal, shipping: totals.shipping, total: totals.total
      };
      state.orders.unshift(order);
      state.cart = {};
      return { ok: true, order: order };
    }

    function advanceOrder(state, orderId) {
      var o = state.orders.filter(function (x) { return x.id === orderId; })[0];
      if (!o) return { ok: false, error: "Pedido no encontrado" };
      var i = ORDER_FLOW.indexOf(o.status);
      if (i === -1 || i === ORDER_FLOW.length - 1) return { ok: false, error: "El pedido ya está entregado" };
      o.status = ORDER_FLOW[i + 1];
      return { ok: true, order: o };
    }

    /* ---- KPIs del panel ---- */
    function kpis(state) {
      var sales = state.orders.reduce(function (a, o) { return a + o.total; }, 0);
      var qtyByName = {};
      state.orders.forEach(function (o) {
        o.items.forEach(function (it) { qtyByName[it.name] = (qtyByName[it.name] || 0) + it.qty; });
      });
      var best = null, bestQty = 0;
      Object.keys(qtyByName).forEach(function (n) { if (qtyByName[n] > bestQty) { bestQty = qtyByName[n]; best = n; } });
      return {
        orders: state.orders.length,
        sales: round2(sales),
        avgTicket: state.orders.length ? round2(sales / state.orders.length) : 0,
        bestProduct: best || "—",
        bestQty: bestQty
      };
    }

    function createState() {
      return { products: seedProducts(), orders: seedOrders(), cart: {}, activity: [] };
    }

    return {
      FREE_SHIPPING_FROM: FREE_SHIPPING_FROM, SHIPPING_COST: SHIPPING_COST, ORDER_FLOW: ORDER_FLOW,
      seedProducts: seedProducts, seedOrders: seedOrders, createState: createState,
      round2: round2, productBySku: productBySku, categoriesOf: categoriesOf,
      unitPrice: unitPrice, hasOffer: hasOffer, filterProducts: filterProducts,
      cartAdd: cartAdd, cartSetQty: cartSetQty, cartCount: cartCount,
      cartTotals: cartTotals, cartLines: cartLines,
      validateCustomer: validateCustomer, placeOrder: placeOrder, advanceOrder: advanceOrder,
      nextOrderNumber: nextOrderNumber, kpis: kpis
    };
  })();

  /* Exportar el núcleo para las pruebas en Node. */
  if (typeof module !== "undefined" && module.exports) { module.exports = DemoCore; }
  if (typeof document === "undefined") { return; }

  /* ================================================================
     CAPA DOM
     ================================================================ */
  var state = DemoCore.createState();
  var view = { query: "", category: "Todas", sort: "destacados" };
  var checkoutStep = 0; /* 0 = carrito, 1 = datos y pago, 2 = gracias */

  function $(id) { return document.getElementById(id); }
  function money(n) { return "$" + n.toFixed(2); }

  function logActivity(text) {
    state.activity.unshift(text);
    state.activity = state.activity.slice(0, 6);
    $("activityList").innerHTML = state.activity.map(function (a) { return "<li>" + a + "</li>"; }).join("");
  }

  /* ---------- Vitrina ---------- */
  function renderCategories() {
    var cats = ["Todas"].concat(DemoCore.categoriesOf(state.products));
    $("categoryChips").innerHTML = cats.map(function (c) {
      return '<button type="button" class="chip' + (view.category === c ? " active" : "") + '" data-cat="' + c + '">' + c + "</button>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (b) {
      b.addEventListener("click", function () { view.category = b.getAttribute("data-cat"); renderStore(); });
    });
  }

  function renderProducts() {
    var list = DemoCore.filterProducts(state.products, view);
    $("productGrid").innerHTML = list.length ? list.map(function (p) {
      var offer = DemoCore.hasOffer(p);
      return '<article class="product-card">' +
        '<div class="product-photo" aria-hidden="true">' + p.icon + (offer ? '<span class="offer-badge">OFERTA</span>' : "") + "</div>" +
        '<h3>' + p.name + "</h3>" +
        '<p class="product-cat">' + p.category + " · Stock: " + p.stock + "</p>" +
        '<p class="price">' + (offer ? '<span class="price-old">' + money(p.price) + "</span> " : "") + money(DemoCore.unitPrice(p)) + "</p>" +
        '<div class="product-actions">' +
          '<button type="button" class="btn ghost" data-view="' + p.sku + '">Ver</button>' +
          '<button type="button" class="btn primary" data-add="' + p.sku + '">Agregar</button>' +
        "</div></article>";
    }).join("") : '<p class="empty">No se encontraron productos con ese criterio.</p>';
    Array.prototype.forEach.call(document.querySelectorAll("[data-add]"), function (b) {
      b.addEventListener("click", function () { addToCart(b.getAttribute("data-add"), 1); });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-view]"), function (b) {
      b.addEventListener("click", function () { openQuickView(b.getAttribute("data-view")); });
    });
  }

  function addToCart(sku, qty) {
    var r = DemoCore.cartAdd(state.cart, state.products, sku, qty);
    if (!r.ok) { alert(r.error); return; }
    var p = DemoCore.productBySku(state.products, sku);
    logActivity("🛒 Se agregó «" + p.name + "» al carrito");
    checkoutStep = 0;
    renderCart();
  }

  /* ---------- Ficha rápida ---------- */
  function openQuickView(sku) {
    var p = DemoCore.productBySku(state.products, sku);
    if (!p) return;
    var offer = DemoCore.hasOffer(p);
    $("qvPhoto").textContent = p.icon;
    $("qvName").textContent = p.name;
    $("qvMeta").textContent = p.category + " · Stock disponible: " + p.stock;
    $("qvDesc").textContent = p.desc;
    $("qvPrice").innerHTML = (offer ? '<span class="price-old">' + money(p.price) + "</span> " : "") + money(DemoCore.unitPrice(p));
    $("qvQty").value = 1;
    $("qvAdd").onclick = function () { addToCart(sku, parseInt($("qvQty").value, 10) || 1); closeQuickView(); };
    $("quickView").classList.add("open");
  }
  function closeQuickView() { $("quickView").classList.remove("open"); }

  /* ---------- Carrito y checkout ---------- */
  function renderCart() {
    var lines = DemoCore.cartLines(state.products, state.cart);
    var totals = DemoCore.cartTotals(state.products, state.cart);
    $("cartCount").textContent = DemoCore.cartCount(state.cart);
    $("cartItems").innerHTML = lines.length ? lines.map(function (l) {
      return '<div class="cart-line"><div><strong>' + l.name + '</strong><br><span class="muted">' + money(l.unit) + " c/u</span></div>" +
        '<div class="qty-ctrl"><button type="button" data-dec="' + l.sku + '">−</button><span>' + l.qty + '</span><button type="button" data-inc="' + l.sku + '">+</button></div>' +
        "<strong>" + money(l.amount) + '</strong><button type="button" class="btn small danger" data-del="' + l.sku + '">Quitar</button></div>';
    }).join("") : '<p class="empty">Tu carrito está vacío. Agrega productos de la vitrina.</p>';
    Array.prototype.forEach.call(document.querySelectorAll("[data-inc]"), function (b) {
      b.addEventListener("click", function () { changeQty(b.getAttribute("data-inc"), 1); });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-dec]"), function (b) {
      b.addEventListener("click", function () { changeQty(b.getAttribute("data-dec"), -1); });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-del]"), function (b) {
      b.addEventListener("click", function () {
        DemoCore.cartSetQty(state.cart, state.products, b.getAttribute("data-del"), 0);
        renderCart();
      });
    });
    $("ctSubtotal").textContent = money(totals.subtotal);
    $("ctShipping").textContent = totals.subtotal === 0 ? money(0) : (totals.shipping === 0 ? "Gratis" : money(totals.shipping));
    $("ctTotal").textContent = money(totals.total);
    $("shipNote").textContent = totals.subtotal >= DemoCore.FREE_SHIPPING_FROM
      ? "✅ Envío gratis aplicado (compras desde $50)."
      : "Envío gratis desde $50 · te faltan " + money(DemoCore.FREE_SHIPPING_FROM - totals.subtotal) + ".";
    $("checkoutBox").style.display = checkoutStep === 1 ? "block" : "none";
    $("thanksBox").style.display = checkoutStep === 2 ? "block" : "none";
    $("btnCheckout").style.display = checkoutStep === 0 ? "block" : "none";
    $("btnCheckout").disabled = lines.length === 0;
  }

  function changeQty(sku, delta) {
    var cur = state.cart[sku] || 0;
    var r = DemoCore.cartSetQty(state.cart, state.products, sku, cur + delta);
    if (!r.ok) alert(r.error);
    renderCart();
  }

  function confirmOrder() {
    var customer = {
      name: $("coName").value, phone: $("coPhone").value, address: $("coAddress").value,
      method: document.querySelector('input[name="coMethod"]:checked') ? document.querySelector('input[name="coMethod"]:checked').value : ""
    };
    var r = DemoCore.placeOrder(state, customer);
    if (!r.ok) { $("coError").textContent = r.error; return; }
    $("coError").textContent = "";
    checkoutStep = 2;
    $("thanksText").innerHTML = "Pedido <strong>" + r.order.id + "</strong> · Estado: <strong>Pedido recibido</strong><br>" +
      r.order.items.map(function (i) { return i.qty + " × " + i.name; }).join("<br>") +
      "<br>Subtotal: " + money(r.order.subtotal) + " · Envío: " + (r.order.shipping === 0 ? "Gratis" : money(r.order.shipping)) +
      " · <strong>Total: " + money(r.order.total) + "</strong><br>Pago: " + (r.order.method === "transferencia" ? "Transferencia bancaria" : "Contraentrega") +
      "<br>Lo verás también en la pestaña «Panel del negocio».";
    logActivity("🧾 Nuevo pedido " + r.order.id + " por " + money(r.order.total) + " (" + r.order.customer + ")");
    renderCart(); renderPanel();
  }

  /* ---------- Panel del negocio ---------- */
  function renderPanel() {
    var k = DemoCore.kpis(state);
    $("kpiOrders").textContent = k.orders;
    $("kpiSales").textContent = money(k.sales);
    $("kpiAvg").textContent = money(k.avgTicket);
    $("kpiBest").textContent = k.bestProduct + (k.bestQty ? " (" + k.bestQty + ")" : "");
    $("ordersList").innerHTML = state.orders.map(function (o) {
      var last = o.status === "Entregado";
      return '<article class="order-card"><div class="order-head"><strong>' + o.id + "</strong>" +
        '<span class="status s-' + o.status + '">' + o.status + "</span></div>" +
        "<p>" + o.customer + " · " + o.address + "</p>" +
        "<p class='muted'>" + o.items.map(function (i) { return i.qty + " × " + i.name; }).join(" · ") + "</p>" +
        "<p>Total: <strong>" + money(o.total) + "</strong> · " + (o.method === "transferencia" ? "Transferencia" : "Contraentrega") + "</p>" +
        (last ? "" : '<button type="button" class="btn primary small" data-advance="' + o.id + '">Avanzar estado →</button>') +
        "</article>";
    }).join("");
    Array.prototype.forEach.call(document.querySelectorAll("[data-advance]"), function (b) {
      b.addEventListener("click", function () {
        var r = DemoCore.advanceOrder(state, b.getAttribute("data-advance"));
        if (r.ok) { logActivity("📦 Pedido " + r.order.id + " avanzó a «" + r.order.status + "»"); renderPanel(); }
      });
    });
  }

  function renderStore() { renderCategories(); renderProducts(); }

  /* ---------- Pestañas ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (t) {
    t.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".tab"), function (x) { x.classList.remove("active"); });
      t.classList.add("active");
      $("viewStore").style.display = t.getAttribute("data-tab") === "store" ? "block" : "none";
      $("viewPanel").style.display = t.getAttribute("data-tab") === "panel" ? "block" : "none";
    });
  });

  /* ---------- Eventos ---------- */
  $("searchInput").addEventListener("input", function () { view.query = this.value; renderProducts(); });
  $("sortSelect").addEventListener("change", function () { view.sort = this.value; renderProducts(); });
  $("qvClose").addEventListener("click", closeQuickView);
  $("quickView").addEventListener("click", function (e) { if (e.target === this) closeQuickView(); });
  $("btnCheckout").addEventListener("click", function () { checkoutStep = 1; renderCart(); });
  $("btnBack").addEventListener("click", function () { checkoutStep = 0; renderCart(); });
  $("btnConfirm").addEventListener("click", confirmOrder);
  $("btnNewSale").addEventListener("click", function () { checkoutStep = 0; renderCart(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("btnReset").addEventListener("click", function () {
    state = DemoCore.createState();
    view = { query: "", category: "Todas", sort: "destacados" };
    checkoutStep = 0;
    $("searchInput").value = ""; $("sortSelect").value = "destacados";
    state.activity = ["🔄 Demo reiniciada con los datos de ejemplo"];
    $("activityList").innerHTML = "<li>🔄 Demo reiniciada con los datos de ejemplo</li>";
    renderStore(); renderCart(); renderPanel();
  });

  renderStore(); renderCart(); renderPanel();
  logActivity("👋 Demo lista: vitrina, carrito, checkout y panel del negocio");
})();
