/* PixelAndina — Rediseño (vista previa) · interactividad compartida */
(function(){
  "use strict";
  var WA = "https://wa.me/593939462496?text=";
  function waLink(msg){ return WA + encodeURIComponent(msg); }

  /* ---------- Menú móvil (hamburguesa) ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var siteHead = document.querySelector(".site-head");
  if(navToggle && siteHead){
    navToggle.addEventListener("click", function(){
      var open = siteHead.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    });
    siteHead.querySelectorAll(".main-nav a, .head-cta a").forEach(function(a){
      a.addEventListener("click", function(){
        siteHead.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Abrir menú");
      });
    });
  }

  /* ---------- Reveal al scroll ---------- */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, {threshold:.12}) : null;
  document.querySelectorAll(".rv").forEach(function(el){ if(io) io.observe(el); else el.classList.add("in"); });

  /* ---------- Contadores animados ---------- */
  function animateCount(el){
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    var dur = 1300, start = null;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = prefix + v.toLocaleString("es-EC");
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var ioC = ("IntersectionObserver" in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ animateCount(e.target); ioC.unobserve(e.target); } });
  }, {threshold:.4}) : null;
  document.querySelectorAll("[data-count]").forEach(function(el){ if(ioC) ioC.observe(el); else animateCount(el); });

  /* ---------- Hero: barras y actividad ---------- */
  var bars = document.querySelectorAll(".bars i");
  if(bars.length){
    var ioB = ("IntersectionObserver" in window) ? new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          bars.forEach(function(b, i){ setTimeout(function(){ b.style.height = b.getAttribute("data-h") + "%"; }, i * 90); });
          ioB.disconnect();
        }
      });
    }, {threshold:.3}) : null;
    if(ioB) ioB.observe(bars[0].parentElement); else bars.forEach(function(b){ b.style.height = b.getAttribute("data-h") + "%"; });
  }
  var feed = document.querySelectorAll(".mock-feed li");
  feed.forEach(function(li, i){ setTimeout(function(){ li.classList.add("show"); }, 700 + i * 650); });

  /* ---------- Pestañas de herramientas (quiz / calculadora) ---------- */
  document.querySelectorAll(".toolbox").forEach(function(box){
    var tabs = box.querySelectorAll(".tool-tab");
    var panes = box.querySelectorAll(".tool-pane");
    tabs.forEach(function(tab){
      tab.addEventListener("click", function(){
        tabs.forEach(function(t){ t.setAttribute("aria-selected", "false"); });
        panes.forEach(function(p){ p.classList.remove("active"); });
        tab.setAttribute("aria-selected", "true");
        var pane = box.querySelector("#" + tab.getAttribute("data-pane"));
        if(pane) pane.classList.add("active");
      });
    });
  });

  /* ---------- Quiz «¿Qué necesitas?» ---------- */
  var QUIZ = [
    { q: "¿Qué quieres lograr primero?", opts: [
      { t: "Vender más y atender mejor a mis clientes", v: "vender" },
      { t: "Ordenar mi operación: personal, inventario o números", v: "ordenar" },
      { t: "Tener presencia profesional en internet", v: "web" },
      { t: "Que mi empresa aproveche la inteligencia artificial", v: "ia" } ] },
    { q: "¿Cómo trabajas hoy?", opts: [
      { t: "Todo por WhatsApp y mensajes sueltos", v: "whatsapp" },
      { t: "En Excel, cuadernos o de memoria", v: "excel" },
      { t: "Tengo una herramienta, pero casi no la usamos", v: "sinuso" },
      { t: "Somos un equipo grande, con varias áreas", v: "equipo" } ] },
    { q: "¿Cuánto pensabas invertir?", opts: [
      { t: "Menos de $50: algo listo para usar ya", v: "bajo" },
      { t: "Entre $50 y $200", v: "medio" },
      { t: "Entre $200 y $1.000", v: "alto" },
      { t: "Más de $1.000: un proyecto serio para mi empresa", v: "corp" } ] }
  ];
  var RESULTS = {
    kit: { title: "Empieza con un kit digital, listo hoy mismo",
      text: "Con tu presupuesto, lo más rápido es un kit de plantillas profesionales: se compra en línea, se descarga al instante y lo usas hoy. El Sistema Operativo Pyme ($39) ordena inventario, ventas y clientes; el Kit RR. HH. ($19) ordena tu personal.",
      cta: "Ver la tienda digital", href: "tienda.html", wa: "Hola PixelAndina, hice el test de su web y me recomendó empezar con un kit digital. Quiero más información." },
    whatsapp: { title: "Tu solución: Ventas por WhatsApp, desde $69",
      text: "Catálogo, respuestas rápidas y pedidos ordenados en el canal que tus clientes ya usan. Pruébalo en la demo del Asistente de Ventas por WhatsApp antes de decidir.",
      cta: "Probar la demo de WhatsApp", href: "demos.html", wa: "Hola PixelAndina, hice el test de su web y me recomendó Ventas por WhatsApp. Quiero una cotización." },
    panel: { title: "Tu solución: un tablero o app a medida, desde $129",
      text: "Un panel hecho para tu forma de trabajar: asistencia y permisos, inventario, pedidos o tus números en un solo lugar. Tenemos 17 demos en vivo para que veas el nivel antes de pagar nada.",
      cta: "Ver los demos en vivo", href: "demos.html", wa: "Hola PixelAndina, hice el test de su web y me recomendó un tablero/app a medida. Quiero una cotización." },
    web: { title: "Tu solución: una web de negocio, desde $69",
      text: "Tu sitio profesional con tus servicios, fotos, ubicación y contacto en un clic. Si solo necesitas presentar una oferta, la landing desde $29 es el punto de partida.",
      cta: "Ver servicios y precios", href: "servicios.html", wa: "Hola PixelAndina, hice el test de su web y me recomendó una web para mi negocio. Quiero una cotización." },
    corp: { title: "Para tu empresa: servicios corporativos de IA y datos",
      text: "Capacitación en IA por rol, rescate de adopción de herramientas que nadie usa, dashboards de un solo número y asistentes internos con tus documentos. Diagnóstico inicial de 30 minutos sin costo.",
      cta: "Ver servicios corporativos", href: "corporativo.html", wa: "Hola PixelAndina, hice el test de su web y me interesan los servicios corporativos. Quiero el diagnóstico sin costo." }
  };
  function quizResult(a){
    if(a[2] === "bajo") return RESULTS.kit;
    if(a[2] === "corp" || a[0] === "ia") return RESULTS.corp;
    if(a[0] === "vender") return RESULTS.whatsapp;
    if(a[0] === "web") return RESULTS.web;
    return RESULTS.panel;
  }
  document.querySelectorAll("[data-quiz]").forEach(function(root){
    var step = 0, answers = [];
    var bar = root.querySelector(".quiz-prog i");
    var body = root.querySelector(".quiz-body");
    function render(){
      bar.style.width = (step / QUIZ.length * 100) + "%";
      if(step < QUIZ.length){
        var item = QUIZ[step];
        body.innerHTML = "";
        var h = document.createElement("div"); h.className = "quiz-q";
        h.textContent = "Pregunta " + (step + 1) + " de " + QUIZ.length + " · " + item.q;
        body.appendChild(h);
        var grid = document.createElement("div"); grid.className = "quiz-opts";
        item.opts.forEach(function(o){
          var b = document.createElement("button"); b.type = "button"; b.className = "quiz-opt"; b.textContent = o.t;
          b.addEventListener("click", function(){ answers.push(o.v); step++; render(); });
          grid.appendChild(b);
        });
        body.appendChild(grid);
        if(step > 0){
          var back = document.createElement("button"); back.type = "button"; back.className = "btn btn-ghost btn-sm"; back.style.marginTop = "14px"; back.textContent = "← Volver";
          back.addEventListener("click", function(){ answers.pop(); step--; render(); });
          body.appendChild(back);
        }
      } else {
        bar.style.width = "100%";
        var r = quizResult(answers);
        body.innerHTML = "";
        var box = document.createElement("div"); box.className = "quiz-result";
        var h3 = document.createElement("h3"); h3.textContent = "Tu recomendación"; box.appendChild(h3);
        var st = document.createElement("p"); st.innerHTML = "<b></b>"; st.querySelector("b").textContent = r.title; box.appendChild(st);
        var tx = document.createElement("p"); tx.textContent = r.text; box.appendChild(tx);
        var ctas = document.createElement("div"); ctas.className = "quiz-ctas";
        var a1 = document.createElement("a"); a1.className = "btn btn-green btn-sm"; a1.href = r.href; a1.textContent = r.cta; ctas.appendChild(a1);
        var a2 = document.createElement("a"); a2.className = "btn btn-wa btn-sm"; a2.href = waLink(r.wa); a2.target = "_blank"; a2.rel = "noopener"; a2.textContent = "Pedirlo por WhatsApp"; ctas.appendChild(a2);
        var again = document.createElement("button"); again.type = "button"; again.className = "btn btn-ghost btn-sm"; again.textContent = "Repetir el test";
        again.addEventListener("click", function(){ step = 0; answers = []; render(); });
        ctas.appendChild(again);
        box.appendChild(ctas);
        body.appendChild(box);
      }
    }
    render();
  });

  /* ---------- Calculadora de precio ---------- */
  document.querySelectorAll("[data-calc]").forEach(function(root){
    var state = { base: 69, baseName: "Web de negocio", extras: {}, urgent: false, support: false };
    var out = root.querySelector(".calc-amount");
    var list = root.querySelector(".calc-list");
    var anticipo = root.querySelector(".calc-anticipo");
    var waBtn = root.querySelector(".calc-wa");
    function extrasTotal(){ var s = 0; Object.keys(state.extras).forEach(function(k){ if(state.extras[k].on) s += state.extras[k].price; }); return s; }
    function total(){ var t = state.base + extrasTotal(); if(state.urgent) t = Math.round(t * 1.3); return t; }
    function render(){
      var t = total();
      out.textContent = "$" + t + (state.support ? " + $5/mes" : "");
      anticipo.textContent = "Anticipo del 40% para empezar: $" + Math.round(t * 0.4) + " · Saldo a la entrega: $" + Math.round(t * 0.6);
      list.innerHTML = "";
      function row(name, val){ var li = document.createElement("li"); var s1 = document.createElement("span"); s1.textContent = name; var s2 = document.createElement("span"); s2.textContent = val; li.appendChild(s1); li.appendChild(s2); list.appendChild(li); }
      row(state.baseName, "$" + state.base);
      Object.keys(state.extras).forEach(function(k){ if(state.extras[k].on) row(state.extras[k].name, "+$" + state.extras[k].price); });
      if(state.urgent) row("Entrega prioritaria", "×1,3");
      if(state.support) row("Soporte mensual opcional", "$5/mes");
      var parts = ["Hola PixelAndina, usé la calculadora de su web y quiero cotizar: " + state.baseName + " (desde $" + state.base + ")"];
      var ex = Object.keys(state.extras).filter(function(k){ return state.extras[k].on; }).map(function(k){ return state.extras[k].name; });
      if(ex.length) parts.push("con extras: " + ex.join(", "));
      if(state.urgent) parts.push("con entrega prioritaria");
      if(state.support) parts.push("con soporte de $5/mes");
      parts.push("— total estimado $" + t + ". Quiero confirmar el precio cerrado.");
      waBtn.href = waLink(parts.join(" "));
    }
    root.querySelectorAll("[data-base]").forEach(function(btn){
      btn.addEventListener("click", function(){
        root.querySelectorAll("[data-base]").forEach(function(b){ b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        state.base = parseInt(btn.getAttribute("data-base"), 10);
        state.baseName = btn.getAttribute("data-name");
        render();
      });
    });
    root.querySelectorAll("[data-extra]").forEach(function(inp){
      var key = inp.getAttribute("data-extra");
      state.extras[key] = { on: inp.checked, price: parseInt(inp.getAttribute("data-price"), 10), name: inp.getAttribute("data-name") };
      inp.addEventListener("change", function(){ state.extras[key].on = inp.checked; render(); });
    });
    var urg = root.querySelector("[data-urgent]");
    if(urg) urg.addEventListener("change", function(){ state.urgent = urg.checked; render(); });
    var sup = root.querySelector("[data-support]");
    if(sup) sup.addEventListener("change", function(){ state.support = sup.checked; render(); });
    render();
  });

  /* ---------- Enlaces de WhatsApp declarativos ---------- */
  document.querySelectorAll("[data-wa]").forEach(function(a){
    a.href = waLink(a.getAttribute("data-wa"));
    a.target = "_blank"; a.rel = "noopener";
  });

  /* ---------- Vitrina de demos: filtro y modal ---------- */
  var filterBtns = document.querySelectorAll("[data-filter]");
  var demoCards = document.querySelectorAll("[data-cat]");
  filterBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      filterBtns.forEach(function(b){ b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      var f = btn.getAttribute("data-filter");
      demoCards.forEach(function(card){
        card.style.display = (f === "todas" || card.getAttribute("data-cat") === f) ? "" : "none";
      });
    });
  });
  var modal = document.getElementById("demoModal");
  if(modal){
    var frame = modal.querySelector("iframe");
    var title = modal.querySelector(".modal-title");
    var openLink = modal.querySelector(".modal-open");
    document.querySelectorAll("[data-demo]").forEach(function(btn){
      btn.addEventListener("click", function(){
        frame.src = btn.getAttribute("data-demo");
        title.textContent = btn.getAttribute("data-title") || "Demo en vivo";
        openLink.href = btn.getAttribute("data-demo");
        modal.classList.add("open");
        document.body.style.overflow = "hidden";
      });
    });
    function closeModal(){ modal.classList.remove("open"); frame.src = "about:blank"; document.body.style.overflow = ""; }
    modal.querySelector(".modal-close").addEventListener("click", closeModal);
    modal.addEventListener("click", function(e){ if(e.target === modal) closeModal(); });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape" && modal.classList.contains("open")) closeModal(); });
  }
})();

/* ============================================================
   PRODUCCIÓN · Formulario «Comunícate con ventas» + repositorio
   interno de prospectos. Cada solicitud se escribe en Firestore,
   colección «prospectos» (proyecto Firebase de PixelAndina, ver
   assets/firebase-config.js y SETUP.md). La vista interna
   prospectos.html lee esa misma colección tras el inicio de
   sesión de Anthony (Firebase Auth).
   ============================================================ */
(function(){
  "use strict";

  /* Página de entrada de la sesión (origen interno) */
  try{
    if(!sessionStorage.getItem("pa_entry_url")){
      sessionStorage.setItem("pa_entry_url", location.href);
      sessionStorage.setItem("pa_entry_page", (location.pathname.split("/").pop() || "index.html"));
    }
  }catch(e){}

  function captureOrigin(){
    var entry = "", entryPage = "", ref = document.referrer || "";
    try{ entry = sessionStorage.getItem("pa_entry_url") || location.href; entryPage = sessionStorage.getItem("pa_entry_page") || (location.pathname.split("/").pop() || "index.html"); }catch(e){ entry = location.href; entryPage = location.pathname.split("/").pop() || "index.html"; }
    var qs = "";
    try{ qs = new URL(entry).search || ""; }catch(e){ qs = location.search || ""; }
    var params = new URLSearchParams(qs);
    var utm = [];
    ["utm_source","utm_medium","utm_campaign"].forEach(function(k){ var v = params.get(k); if(v) utm.push(k.replace("utm_","") + ": " + v); });
    var ua = navigator.userAgent || "";
    var device = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "Móvil" : "PC";
    var os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iPod/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "";
    return {
      pagina: entryPage,
      paginaUrl: entry,
      referrer: ref || "Llegó directo (sin referente)",
      utm: utm.length ? utm.join(" · ") : "Sin UTM",
      dispositivo: device + (os ? " · " + os : "")
    };
  }

  function saveProspect(p){
    /* Escribe el prospecto en Firestore. Devuelve una promesa. */
    if(!window.PA_FIREBASE || !window.PA_FIREBASE.db){
      return Promise.reject(new Error("firebase-no-disponible"));
    }
    p.creadoEn = firebase.firestore.FieldValue.serverTimestamp();
    return window.PA_FIREBASE.db.collection("prospectos").add(p);
  }

  var form = document.querySelector("[data-sales-form]");
  if(!form) return;
  var selected = { need:"", budget:"" };
  form.querySelectorAll("[data-chip-group]").forEach(function(group){
    var key = group.getAttribute("data-chip-group");
    group.querySelectorAll(".f-chip").forEach(function(chip){
      chip.addEventListener("click", function(){
        group.querySelectorAll(".f-chip").forEach(function(c){ c.setAttribute("aria-pressed","false"); });
        chip.setAttribute("aria-pressed","true");
        selected[key] = chip.getAttribute("data-value") || chip.textContent.trim();
      });
    });
  });
  var errBox = form.querySelector(".f-error");
  function fail(msg){ if(errBox){ errBox.textContent = msg; errBox.classList.add("show"); errBox.scrollIntoView({behavior:"smooth", block:"center"}); } }
  var submitBtn = form.querySelector("button[type='submit']");
  var sending = false;
  form.addEventListener("submit", function(e){
    e.preventDefault();
    if(sending) return;
    var nombre = (form.querySelector("#sf-name").value || "").trim();
    var negocio = (form.querySelector("#sf-biz").value || "").trim();
    var contacto = (form.querySelector("#sf-contact").value || "").trim();
    var mensaje = (form.querySelector("#sf-msg").value || "").trim();
    if(!nombre) return fail("Cuéntanos tu nombre para poder dirigirnos a ti.");
    if(!selected.need) return fail("Elige qué necesitas: toca una de las opciones.");
    if(!contacto) return fail("Déjanos un correo o un teléfono/WhatsApp para responderte.");
    if(errBox) errBox.classList.remove("show");
    var now = new Date();
    var prospect = {
      id: "P-" + now.getTime().toString(36).toUpperCase(),
      fechaISO: now.toISOString(),
      fecha: now.toLocaleString("es-EC", { timeZone:"America/Guayaquil", dateStyle:"medium", timeStyle:"short" }),
      nombre: nombre,
      negocio: negocio || "—",
      necesidad: selected.need,
      presupuesto: selected.budget || "Aún no lo define",
      contacto: contacto,
      mensaje: mensaje || "—",
      origen: captureOrigin(),
      estado: "Nuevo"
    };
    sending = true;
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = "Enviando…"; }
    saveProspect(prospect).then(function(){
      sending = false;
      /* Confirmación que hace sentir escuchado al visitante */
      var wrap = document.getElementById("sf-form-wrap");
      var conf = document.getElementById("sf-confirm");
      if(wrap) wrap.style.display = "none";
      if(conf){
        conf.classList.add("show");
        var map = { nombre: prospect.nombre, negocio: prospect.negocio, necesidad: prospect.necesidad, presupuesto: prospect.presupuesto, contacto: prospect.contacto };
        conf.querySelectorAll("[data-cf]").forEach(function(el){ var k = el.getAttribute("data-cf"); if(map[k] != null) el.textContent = map[k]; });
        conf.scrollIntoView({ behavior:"smooth", block:"start" });
      }
    }).catch(function(){
      sending = false;
      if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = "Enviar mi solicitud"; }
      fail("No pudimos registrar tu solicitud en este momento. Inténtalo de nuevo en un momento o escríbenos directo por WhatsApp con el botón de abajo.");
    });
  });
  var again = document.getElementById("sf-again");
  if(again) again.addEventListener("click", function(){
    var conf = document.getElementById("sf-confirm");
    var wrap = document.getElementById("sf-form-wrap");
    if(conf) conf.classList.remove("show");
    if(wrap){ wrap.style.display = ""; form.reset(); form.querySelectorAll(".f-chip").forEach(function(c){ c.setAttribute("aria-pressed","false"); }); }
    if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = "Enviar mi solicitud"; }
  });
})();
