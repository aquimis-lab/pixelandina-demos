/* PixelAndina — Demo: Dashboard «Un Solo Número»
   Panel ejecutivo para gerentes: UNA cifra principal (ventas del mes contra
   su meta) y solo 4–5 indicadores secundarios. Nada de pantallas llenas de
   gráficos que nadie vuelve a abrir: un número confiable y lo que lo explica.
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    var BUSINESS = "Distribuidora Pacífico";
    var MONTH_LABEL = "noviembre";
    var DAYS_IN_MONTH = 30;
    var LAST_FULL_DAY = 24;      /* hay ventas cerradas hasta el día 24 */
    var TODAY = 25;              /* «hoy» es el día 25: ahí caen las ventas simuladas */
    var META_MES = 200000;       /* la meta contra la que se mide EL número */
    var STOCK_MINIMO = 120;      /* bajo este stock salta la alerta */

    var SELLERS = [
      { id: "maria",   name: "María Fernanda Ríos" },
      { id: "carlos",  name: "Carlos Mendoza" },
      { id: "daniela", name: "Daniela Paredes" },
      { id: "jorge",   name: "Jorge Salazar" }
    ];

    var PRODUCTS = [
      { id: "arroz",      name: "Arroz premium (saco 25 lb)",        price: 14.80, stock: 320 },
      { id: "aceite",     name: "Aceite vegetal 1 L (caja x12)",     price: 16.50, stock: 540 },
      { id: "azucar",     name: "Azúcar blanca 1 kg (funda x50)",    price: 38.00, stock: 210 },
      { id: "atun",       name: "Atún en lata 170 g (caja x48)",     price: 41.00, stock: 95 },
      { id: "leche",      name: "Leche UHT 1 L (caja x12)",          price: 13.20, stock: 480 },
      { id: "detergente", name: "Detergente en polvo 1 kg (caja x20)", price: 24.00, stock: 150 }
    ];

    /* Ventas sugeridas para el botón «registrar venta de hoy»: rotan en orden. */
    var SUGGESTED = [
      { sellerId: "maria",   productId: "arroz",  units: 60 },
      { sellerId: "carlos",  productId: "atun",   units: 25 },
      { sellerId: "daniela", productId: "aceite", units: 80 },
      { sellerId: "jorge",   productId: "leche",  units: 90 },
      { sellerId: "maria",   productId: "azucar", units: 30 },
      { sellerId: "carlos",  productId: "detergente", units: 45 }
    ];

    /* ---------- Utilidades ---------- */
    function round2(n) { return Math.round(n * 100) / 100; }
    function money(n) { return "$" + round2(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function money0(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
    function pct(n) { return (Math.round(n * 10) / 10).toLocaleString("es-EC") + "%"; }

    function sellerById(id) { return SELLERS.filter(function (s) { return s.id === id; })[0] || null; }
    function productById(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0] || null; }

    /* Generador determinista (LCG): la semilla siempre produce el mismo mes. */
    function lcg(seed) {
      var s = seed % 2147483648;
      if (s <= 0) s += 2147483647;
      return function () {
        s = (s * 1103515245 + 12345) % 2147483648;
        return s / 2147483648;
      };
    }

    /* ---------- Estado inicial: las ventas del mes hasta el día 24 ---------- */
    function seedSales() {
      var rand = lcg(20261124);
      var sales = [];
      var n = 0;
      for (var day = 1; day <= LAST_FULL_DAY; day++) {
        var count = 3 + Math.floor(rand() * 3); /* 3 a 5 ventas por día */
        for (var i = 0; i < count; i++) {
          var seller = SELLERS[Math.floor(rand() * SELLERS.length)];
          var product = PRODUCTS[Math.floor(rand() * PRODUCTS.length)];
          var units = 15 + Math.floor(rand() * 106); /* 15 a 120 unidades */
          n++;
          sales.push({
            id: "V-" + n,
            day: day,
            sellerId: seller.id,
            productId: product.id,
            units: units,
            amount: round2(units * product.price)
          });
        }
      }
      return sales;
    }

    function seedStock() {
      var stock = {};
      PRODUCTS.forEach(function (p) { stock[p.id] = p.stock; });
      return stock;
    }

    function freshState() {
      return {
        sales: seedSales(),
        stock: seedStock(),
        meta: META_MES,
        suggestedIdx: 0,
        nextId: 1000
      };
    }

    /* ---------- EL número y sus indicadores ---------- */
    function totalVentas(state) {
      return round2(state.sales.reduce(function (acc, s) { return acc + s.amount; }, 0));
    }

    function numPedidos(state) { return state.sales.length; }

    function avanceMeta(state) {
      if (!state.meta) return 0;
      return round2(totalVentas(state) / state.meta * 100);
    }

    function faltaParaMeta(state) {
      return round2(Math.max(0, state.meta - totalVentas(state)));
    }

    /* Ritmo esperado: a día 24 de 30 ya debería ir el 80% de la meta. */
    function ritmoEsperado(state) {
      return round2(LAST_FULL_DAY / DAYS_IN_MONTH * 100);
    }

    function ticketPromedio(state) {
      if (!state.sales.length) return 0;
      return round2(totalVentas(state) / state.sales.length);
    }

    function ventasPorSemana(state) {
      var buckets = [
        { semana: 1, label: "Semana 1", dias: "1–7", total: 0 },
        { semana: 2, label: "Semana 2", dias: "8–14", total: 0 },
        { semana: 3, label: "Semana 3", dias: "15–21", total: 0 },
        { semana: 4, label: "Semana 4", dias: "22–30", total: 0 }
      ];
      state.sales.forEach(function (s) {
        var idx = s.day <= 7 ? 0 : s.day <= 14 ? 1 : s.day <= 21 ? 2 : 3;
        buckets[idx].total = round2(buckets[idx].total + s.amount);
      });
      return buckets;
    }

    function rankingVendedores(state) {
      var map = {};
      SELLERS.forEach(function (s) { map[s.id] = { id: s.id, name: s.name, total: 0, ventas: 0 }; });
      state.sales.forEach(function (s) {
        if (!map[s.sellerId]) return;
        map[s.sellerId].total = round2(map[s.sellerId].total + s.amount);
        map[s.sellerId].ventas++;
      });
      return Object.keys(map).map(function (k) { return map[k]; })
        .sort(function (a, b) { return b.total - a.total; });
    }

    function mejorVendedor(state) {
      var r = rankingVendedores(state);
      return r.length ? r[0] : null;
    }

    function rankingProductos(state) {
      var map = {};
      PRODUCTS.forEach(function (p) { map[p.id] = { id: p.id, name: p.name, total: 0, units: 0 }; });
      state.sales.forEach(function (s) {
        if (!map[s.productId]) return;
        map[s.productId].total = round2(map[s.productId].total + s.amount);
        map[s.productId].units += s.units;
      });
      return Object.keys(map).map(function (k) { return map[k]; })
        .sort(function (a, b) { return b.total - a.total; });
    }

    function productoTop(state) {
      var r = rankingProductos(state);
      return r.length ? r[0] : null;
    }

    function diaMasFlojo(state) {
      var byDay = {};
      state.sales.forEach(function (s) { byDay[s.day] = round2((byDay[s.day] || 0) + s.amount); });
      var worst = null;
      Object.keys(byDay).forEach(function (d) {
        if (!worst || byDay[d] < worst.total) worst = { day: parseInt(d, 10), total: byDay[d] };
      });
      return worst;
    }

    /* ---------- Alertas: solo las que importan, con su porqué ---------- */
    function alertas(state) {
      var out = [];
      var total = totalVentas(state);
      var avance = avanceMeta(state);
      var ritmo = ritmoEsperado(state);

      /* 1) Ritmo contra la meta */
      if (avance < ritmo) {
        var diasRestantes = DAYS_IN_MONTH - TODAY + 1;
        var porDia = diasRestantes > 0 ? faltaParaMeta(state) / diasRestantes : 0;
        out.push({
          nivel: "atencion",
          titulo: "Ritmo bajo contra la meta",
          texto: "Va el " + pct(avance) + " de la meta y a estas alturas debería ir el " + pct(ritmo) +
                 ". Faltan " + money0(faltaParaMeta(state)) + ": se necesitan unos " + money0(porDia) + " diarios en los días que quedan."
        });
      } else {
        out.push({
          nivel: "ok",
          titulo: "Ritmo sano contra la meta",
          texto: "El avance (" + pct(avance) + ") va por encima del ritmo esperado (" + pct(ritmo) + ") para el día " + LAST_FULL_DAY + "."
        });
      }

      /* 2) Stock bajo de cualquier producto (el top primero) */
      var top = productoTop(state);
      PRODUCTS.forEach(function (p) {
        var st = state.stock[p.id];
        if (typeof st === "number" && st < STOCK_MINIMO) {
          out.push({
            nivel: top && top.id === p.id ? "critica" : "atencion",
            titulo: "Stock bajo: " + p.name,
            texto: "Quedan " + st + " unidades en bodega" +
                   (top && top.id === p.id ? " y es el producto que más vende del mes: hay que reponer ya." : ". Conviene reponer antes de que se acabe.")
          });
        }
      });

      /* 3) El vendedor con menor venta del mes */
      var rank = rankingVendedores(state);
      if (rank.length > 1) {
        var ultimo = rank[rank.length - 1];
        var primero = rank[0];
        if (primero.total > 0 && ultimo.total < primero.total * 0.6) {
          out.push({
            nivel: "info",
            titulo: "Brecha entre vendedores",
            texto: ultimo.name + " lleva " + money0(ultimo.total) + " frente a " + money0(primero.total) +
                   " de " + primero.name + ". Puede necesitar apoyo, cartera o ruta distinta."
          });
        }
      }

      /* 4) El día más flojo del mes */
      var flojo = diaMasFlojo(state);
      if (flojo) {
        var promedioDia = total / LAST_FULL_DAY;
        if (flojo.total < promedioDia * 0.7) {
          out.push({
            nivel: "info",
            titulo: "Día flojo: el " + flojo.day + " de " + MONTH_LABEL,
            texto: "Ese día se vendieron solo " + money0(flojo.total) + " contra un promedio diario de " + money0(promedioDia) +
                   ". Vale la pena revisar qué pasó (ruta, feriado, falta de stock)."
          });
        }
      }

      return out;
    }

    /* ---------- Registrar ventas (la demo se mueve) ---------- */
    function ventaSugerida(state) {
      var sug = SUGGESTED[state.suggestedIdx % SUGGESTED.length];
      var product = productById(sug.productId);
      return {
        sellerId: sug.sellerId,
        productId: sug.productId,
        units: sug.units,
        amount: round2(sug.units * product.price)
      };
    }

    function agregarVenta(state, venta) {
      if (!venta) return { ok: false, error: "Falta la venta." };
      var seller = sellerById(venta.sellerId);
      var product = productById(venta.productId);
      if (!seller) return { ok: false, error: "Vendedor no válido." };
      if (!product) return { ok: false, error: "Producto no válido." };
      var units = parseInt(venta.units, 10);
      if (!units || units <= 0) return { ok: false, error: "Las unidades deben ser mayores que cero." };
      var amount = round2(units * product.price);
      if (amount <= 0) return { ok: false, error: "El monto debe ser mayor que cero." };
      state.nextId++;
      var rec = {
        id: "V-" + state.nextId,
        day: TODAY,
        sellerId: seller.id,
        productId: product.id,
        units: units,
        amount: amount
      };
      state.sales.push(rec);
      if (typeof state.stock[product.id] === "number") {
        state.stock[product.id] = Math.max(0, state.stock[product.id] - units);
      }
      state.suggestedIdx++;
      return { ok: true, venta: rec };
    }

    return {
      BUSINESS: BUSINESS,
      MONTH_LABEL: MONTH_LABEL,
      DAYS_IN_MONTH: DAYS_IN_MONTH,
      LAST_FULL_DAY: LAST_FULL_DAY,
      TODAY: TODAY,
      META_MES: META_MES,
      STOCK_MINIMO: STOCK_MINIMO,
      SELLERS: SELLERS,
      PRODUCTS: PRODUCTS,
      SUGGESTED: SUGGESTED,
      round2: round2,
      money: money,
      money0: money0,
      pct: pct,
      sellerById: sellerById,
      productById: productById,
      freshState: freshState,
      totalVentas: totalVentas,
      numPedidos: numPedidos,
      avanceMeta: avanceMeta,
      faltaParaMeta: faltaParaMeta,
      ritmoEsperado: ritmoEsperado,
      ticketPromedio: ticketPromedio,
      ventasPorSemana: ventasPorSemana,
      rankingVendedores: rankingVendedores,
      mejorVendedor: mejorVendedor,
      rankingProductos: rankingProductos,
      productoTop: productoTop,
      diaMasFlojo: diaMasFlojo,
      alertas: alertas,
      ventaSugerida: ventaSugerida,
      agregarVenta: agregarVenta
    };
  })();

  /* Export para la suite de pruebas en Node (en el navegador no se usa). */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = DemoCore;
  }
  if (typeof document === "undefined") return;

  /* ================================================================
     CAPA DOM
     ================================================================ */
  var C = DemoCore;
  var state = C.freshState();

  var bigNumber = document.getElementById("bigNumber");
  var metaLine = document.getElementById("metaLine");
  var progressBar = document.getElementById("progressBar");
  var ritmoLine = document.getElementById("ritmoLine");
  var weeksWrap = document.getElementById("weeksWrap");
  var ticketValue = document.getElementById("ticketValue");
  var ticketSub = document.getElementById("ticketSub");
  var sellerValue = document.getElementById("sellerValue");
  var sellerSub = document.getElementById("sellerSub");
  var productValue = document.getElementById("productValue");
  var productSub = document.getElementById("productSub");
  var alertsList = document.getElementById("alertsList");
  var activityList = document.getElementById("activityList");
  var btnAddSale = document.getElementById("btnAddSale");
  var btnReset = document.getElementById("btnReset");

  function logActivity(text) {
    var li = document.createElement("li");
    li.textContent = text;
    activityList.insertBefore(li, activityList.firstChild);
  }

  function render() {
    var total = C.totalVentas(state);
    var avance = C.avanceMeta(state);
    bigNumber.textContent = C.money0(total);
    metaLine.textContent = "Meta de " + C.MONTH_LABEL + ": " + C.money0(state.meta) + " · va el " + C.pct(avance);
    progressBar.style.width = Math.min(100, avance) + "%";
    progressBar.className = "progress-fill" + (avance >= C.ritmoEsperado(state) ? " ok" : " warn");
    ritmoLine.textContent = avance >= C.ritmoEsperado(state)
      ? "✅ Al día " + C.LAST_FULL_DAY + " el ritmo esperado era " + C.pct(C.ritmoEsperado(state)) + ": vamos por encima."
      : "⚠️ Al día " + C.LAST_FULL_DAY + " el ritmo esperado era " + C.pct(C.ritmoEsperado(state)) + ": vamos por debajo. Faltan " + C.money0(C.faltaParaMeta(state)) + ".";

    /* Ventas por semana (barras simples) */
    var weeks = C.ventasPorSemana(state);
    var max = Math.max.apply(null, weeks.map(function (w) { return w.total; }).concat([1]));
    weeksWrap.innerHTML = weeks.map(function (w) {
      var h = Math.max(4, Math.round(w.total / max * 100));
      return '<div class="week"><div class="week-bar" style="height:' + h + '%"></div>' +
        '<span class="week-total">' + C.money0(w.total) + '</span>' +
        '<span class="week-label">' + w.label + '<br><small>' + w.dias + '</small></span></div>';
    }).join("");

    /* Ticket promedio */
    ticketValue.textContent = C.money(C.ticketPromedio(state));
    ticketSub.textContent = "en " + C.numPedidos(state) + " pedidos del mes";

    /* Mejor vendedor */
    var best = C.mejorVendedor(state);
    sellerValue.textContent = best ? best.name : "—";
    sellerSub.textContent = best
      ? C.money0(best.total) + " en " + best.ventas + " ventas (" + C.pct(best.total / total * 100) + " del mes)"
      : "Sin ventas todavía";

    /* Producto top */
    var top = C.productoTop(state);
    productValue.textContent = top ? top.name : "—";
    if (top) {
      var st = state.stock[top.id];
      var low = typeof st === "number" && st < C.STOCK_MINIMO;
      productSub.innerHTML = C.money0(top.total) + " vendidos · " + top.units + " unidades · stock: " +
        '<strong class="' + (low ? "stock-low" : "") + '">' + st + (low ? " ⚠️ bajo" : "") + "</strong>";
    } else {
      productSub.textContent = "Sin ventas todavía";
    }

    /* Alertas */
    var alerts = C.alertas(state);
    alertsList.innerHTML = alerts.map(function (a) {
      return '<li class="alert alert-' + a.nivel + '"><strong>' + a.titulo + '</strong><span>' + a.texto + "</span></li>";
    }).join("");
  }

  btnAddSale.addEventListener("click", function () {
    var sug = C.ventaSugerida(state);
    var res = C.agregarVenta(state, sug);
    if (!res.ok) { logActivity("⚠️ No se pudo registrar la venta: " + res.error); return; }
    var s = C.sellerById(res.venta.sellerId);
    var p = C.productById(res.venta.productId);
    logActivity("🧾 Venta de hoy: " + s.name + " vendió " + res.venta.units + " × " + p.name +
      " por " + C.money(res.venta.amount) + ". El número se actualizó en vivo.");
    render();
  });

  btnReset.addEventListener("click", function () {
    state = C.freshState();
    activityList.innerHTML = "<li>🟢 Panel reiniciado: un solo número, actualizado con cada venta.</li>";
    render();
  });

  render();
})();
