/* PixelAndina — Demo interactiva: Asistente de Ventas por WhatsApp
   Todo es simulado en el navegador, con datos ficticios. Sin backend. */
(function () {
  "use strict";

  var PRODUCTS = [
    { id: "camiseta", name: "Camiseta básica de algodón", price: 12.00, emoji: "👕" },
    { id: "pantalon", name: "Pantalón jean clásico", price: 25.00, emoji: "👖" },
    { id: "zapatos",  name: "Zapatos deportivos urbanos", price: 40.00, emoji: "👟" }
  ];

  var state = {
    step: "start",
    product: null,
    qty: 0,
    nextOrder: 1001,
    ordersToday: 0,
    salesToday: 0,
    chats: 1
  };

  var chatBody = document.getElementById("chatBody");
  var quickReplies = document.getElementById("quickReplies");
  var ordersBody = document.getElementById("ordersBody");
  var kpiOrders = document.getElementById("kpiOrders");
  var kpiSales = document.getElementById("kpiSales");
  var kpiChats = document.getElementById("kpiChats");
  var activityList = document.getElementById("activityList");

  function money(n) { return "$" + n.toFixed(2); }

  function nowTime() {
    try {
      return new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function scrollChat() { chatBody.scrollTop = chatBody.scrollHeight; }

  function formatText(text) {
    // Escapa HTML y convierte *texto* (sintaxis de WhatsApp) en negrita
    var safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return safe.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
  }

  function addMsg(text, who) {
    var div = document.createElement("div");
    div.className = "msg " + who;
    var body = document.createElement("span");
    body.innerHTML = formatText(text);
    div.appendChild(body);
    var t = document.createElement("span");
    t.className = "time";
    t.textContent = nowTime() + (who === "client" ? " ✓✓" : "");
    div.appendChild(t);
    chatBody.appendChild(div);
    scrollChat();
  }

  function addSystem(text) {
    var div = document.createElement("div");
    div.className = "msg system";
    div.textContent = text;
    chatBody.appendChild(div);
    scrollChat();
  }

  function assistantSay(text, options) {
    // Indicador "escribiendo…" breve para dar sensación real
    var typing = document.createElement("div");
    typing.className = "msg assistant typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    chatBody.appendChild(typing);
    scrollChat();
    setTimeout(function () {
      typing.remove();
      addMsg(text, "assistant");
      if (options) setOptions(options);
    }, 550);
  }

  function setOptions(options) {
    quickReplies.innerHTML = "";
    var label = document.createElement("span");
    label.className = "qr-label";
    label.textContent = "Tú (el cliente) respondes:";
    quickReplies.appendChild(label);
    options.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "qr-btn" + (opt.amber ? " amber" : "");
      btn.textContent = opt.label;
      btn.addEventListener("click", function () { handleChoice(opt); });
      quickReplies.appendChild(btn);
    });
  }

  function clearOptions() { quickReplies.innerHTML = ""; }

  function logActivity(text) {
    var li = document.createElement("li");
    li.textContent = text;
    activityList.insertBefore(li, activityList.firstChild);
    while (activityList.children.length > 5) {
      activityList.removeChild(activityList.lastChild);
    }
  }

  function updateKpis() {
    kpiOrders.textContent = state.ordersToday;
    kpiSales.textContent = money(state.salesToday);
    kpiChats.textContent = state.chats;
  }

  function registerOrder(ship) {
    var total = state.product.price * state.qty + (ship || 0);
    var number = state.nextOrder++;
    state.ordersToday += 1;
    state.salesToday += total;

    var empty = document.getElementById("emptyRow");
    if (empty) empty.remove();

    var tr = document.createElement("tr");
    tr.className = "new-row";
    var cells = [
      "#" + number,
      state.product.emoji + " " + state.product.name,
      String(state.qty),
      money(total)
    ];
    cells.forEach(function (c) {
      var td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    });
    var tdState = document.createElement("td");
    var badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "Nuevo";
    tdState.appendChild(badge);
    tr.appendChild(tdState);
    ordersBody.appendChild(tr);

    updateKpis();
    logActivity("🧾 Pedido #" + number + " registrado: " + state.qty + " × " +
      state.product.name + " — " + money(total) + ". El negocio recibe el aviso al instante.");
    return { number: number, total: total };
  }

  /* ---------- Flujo de la conversación ---------- */

  function showCatalog(intro) {
    state.step = "catalog";
    var lines = PRODUCTS.map(function (p) {
      return p.emoji + " " + p.name + " — " + money(p.price);
    }).join("\n");
    assistantSay(intro + "\n\n" + lines + "\n\n¿Cuál te gustaría pedir?", PRODUCTS.map(function (p) {
      return { label: p.emoji + " " + p.name.split(" ")[0] + " · " + money(p.price), action: "product", product: p };
    }));
  }

  function startConversation() {
    state.step = "start";
    state.product = null;
    state.qty = 0;
    assistantSay(
      "¡Hola! 👋 Bienvenido a *Tienda La Esquina*. Soy el asistente virtual y estoy para ayudarte.\n\n¿En qué te ayudo hoy?",
      [
        { label: "🛍️ Ver catálogo", action: "catalog" },
        { label: "🚚 ¿Hacen entregas?", action: "delivery" },
        { label: "🕐 Horarios y ubicación", action: "hours" }
      ]
    );
  }

  function handleChoice(opt) {
    clearOptions();
    // El mensaje del "cliente" es la opción que tocó el visitante
    if (opt.echo !== false) addMsg(opt.label.replace(/^[^A-Za-zÁÉÍÓÚÑ¿¡]+/, "").trim() || opt.label, "client");

    switch (opt.action) {
      case "catalog":
        showCatalog("¡Claro! Este es nuestro catálogo de hoy:");
        break;

      case "delivery":
        assistantSay(
          "Sí 🚚 Hacemos entregas a domicilio en toda la ciudad.\n• Pedidos desde $20: entrega *gratis*.\n• Pedidos menores: $2.00 de envío.\n• Tiempo estimado: 30–45 minutos.",
          [
            { label: "🛍️ Ver catálogo", action: "catalog" },
            { label: "Eso era todo, gracias", action: "bye" }
          ]
        );
        break;

      case "hours":
        assistantSay(
          "Te esperamos en Av. Principal y Calle 10 (local de demostración).\n🕐 Lunes a sábado: 9:00–19:00.\nY por este chat atendemos las 24 horas. 😊",
          [
            { label: "🛍️ Ver catálogo", action: "catalog" },
            { label: "Eso era todo, gracias", action: "bye" }
          ]
        );
        break;

      case "product":
        state.product = opt.product;
        state.step = "qty";
        assistantSay(
          "¡Buena elección! " + opt.product.emoji + " *" + opt.product.name + "* — " + money(opt.product.price) + " c/u.\n\n¿Cuántas unidades quieres?",
          [
            { label: "1", action: "qty", qty: 1 },
            { label: "2", action: "qty", qty: 2 },
            { label: "3", action: "qty", qty: 3 }
          ]
        );
        break;

      case "qty": {
        state.qty = opt.qty;
        state.step = "confirm";
        var total = state.product.price * state.qty;
        var ship = total >= 20 ? 0 : 2;
        assistantSay(
          "Perfecto, te resumo tu pedido:\n\n" + state.product.emoji + " " + state.product.name +
          "\nCantidad: " + state.qty + "\nSubtotal: " + money(total) +
          "\nEntrega: " + (ship === 0 ? "*gratis* 🎉" : money(ship)) +
          "\n*Total a pagar: " + money(total + ship) + "*\n\n¿Confirmas el pedido?",
          [
            { label: "✅ Confirmar pedido", action: "confirm", ship: ship },
            { label: "✖ Cancelar", action: "cancel", amber: true }
          ]
        );
        break;
      }

      case "confirm": {
        // El total del pedido incluye el envío mostrado en el resumen
        var result = registerOrder(opt.ship || 0);
        state.step = "done";
        assistantSay(
          "🎉 ¡Pedido confirmado!\n\n🧾 *Pedido #" + result.number + "*\n" +
          state.product.emoji + " " + state.product.name + " × " + state.qty +
          "\n💵 Total: " + money(result.total) +
          "\n\nYa lo registré y el negocio recibió el aviso. Te escribimos por aquí cuando esté en camino. ¡Gracias por tu compra!",
          [
            { label: "🔁 Hacer otro pedido", action: "another" },
            { label: "Eso es todo, gracias", action: "bye" }
          ]
        );
        break;
      }

      case "cancel":
        state.step = "start";
        assistantSay(
          "Sin problema, cancelé ese pedido. No se hizo ningún cargo. 👍\n\n¿Quieres ver el catálogo de nuevo o necesitas algo más?",
          [
            { label: "🛍️ Ver catálogo", action: "catalog" },
            { label: "Eso es todo, gracias", action: "bye" }
          ]
        );
        break;

      case "another":
        showCatalog("¡Perfecto! Estos son los productos disponibles:");
        break;

      case "bye":
        state.step = "end";
        assistantSay(
          "¡Gracias por escribirnos! 🙌 Si necesitas algo más, este asistente está disponible las 24 horas, todos los días.",
          [ { label: "↺ Iniciar una nueva conversación", action: "restart", amber: true } ]
        );
        break;

      case "restart":
        state.chats += 1;
        updateKpis();
        logActivity("💬 Nueva conversación atendida por el asistente (sin intervención del negocio).");
        addSystem("— Nueva conversación —");
        startConversation();
        break;
    }
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = { step: "start", product: null, qty: 0, nextOrder: 1001, ordersToday: 0, salesToday: 0, chats: 1 };
    chatBody.innerHTML = "";
    ordersBody.innerHTML =
      '<tr class="empty-row" id="emptyRow"><td colspan="5">Todavía no hay pedidos. Completa una compra en el chat 👈</td></tr>';
    activityList.innerHTML = "<li>🟢 El asistente está activo y esperando clientes.</li>";
    updateKpis();
    addSystem("— Demo reiniciada —");
    startConversation();
  });

  /* ---------- Arranque ---------- */
  updateKpis();
  addSystem("Hoy · Conversación de demostración");
  startConversation();
})();
