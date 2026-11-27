/* PixelAndina — Asistente de ventas (adaptado del sitio actual al rediseño).
   Cambios: WhatsApp oficial Business 593939462496 (aclaración de Anthony 2026-11-27), temas nuevos (kits/Hotmart, corporativo, ideas a pedido, demos). */
(function(){
  "use strict";
  var btn = document.getElementById("chatBtn");
  var panel = document.getElementById("chatPanel");
  var msgs = document.getElementById("chatMsgs");
  var chipsBox = document.getElementById("chatChips");
  var form = document.getElementById("chatForm");
  var input = document.getElementById("chatInput");
  var closeBtn = document.getElementById("chatClose");
  if(!btn || !panel) return;
  var WA = "https://wa.me/593939462496?text=";
  var MAIL = "mailto:ventas@pixelandina.online";
  var started = false;
  var state = { need:null, reco:null, detail:"" };

  var NEEDS = {
    vender:   { label:"Quiero vender más", servicio:"Ventas por WhatsApp", precio:"desde $69",
                texto:"Te recomiendo <b>Ventas por WhatsApp</b> (desde <b>$69</b>): catálogo, respuestas rápidas y pedidos ordenados en el canal que tus clientes ya usan. Entrega estimada: <b>2 a 4 días</b>.",
                beneficio:"El beneficio concreto: ningún chat se queda sin responder y cada cliente avanza paso a paso hasta confirmar su pedido, sin que tengas que estar pegado al celular. Puedes probarlo en la <a href=\"demos.html\">demo en vivo</a>." },
    personal: { label:"Quiero ordenar a mi personal", servicio:"Talento humano digital", precio:"desde $129",
                texto:"Te recomiendo <b>Talento humano digital</b> (desde <b>$129</b>): asistencia, horarios, permisos y documentos de tu equipo en un solo panel. Entrega estimada: <b>5 a 7 días</b>.",
                beneficio:"El beneficio concreto: la asistencia se cuadra sola y los permisos se aprueban en un clic. Adiós planillas, papeles sueltos y cálculos a mano. Míralo en la <a href=\"demos.html\">demo del Panel RR. HH.</a>" },
    numeros:  { label:"Quiero ver mis números claros", servicio:"Dashboards", precio:"desde $129",
                texto:"Te recomiendo un <b>Dashboard</b> (desde <b>$129</b>): tus ventas y tu operación en un panel con indicadores y gráficos que se entienden de un vistazo. Entrega estimada: <b>5 a 7 días</b>.",
                beneficio:"El beneficio concreto: ves cómo va tu negocio en segundos, sin armar reportes a mano cada semana. Prueba la <a href=\"demos.html\">demo «Un Solo Número»</a>." },
    web:      { label:"Quiero tener mi web", servicio:"Web para tu negocio", precio:"desde $69",
                texto:"Te recomiendo una <b>Web para tu negocio</b> (desde <b>$69</b>): tu sitio profesional con servicios, fotos, ubicación y contacto en un clic. Entrega estimada: <b>3 a 5 días</b>. Y si solo necesitas presentar una oferta, la <b>landing desde $29</b> puede bastarte (2 a 3 días).",
                beneficio:"El beneficio concreto: tus clientes te encuentran, ven lo que ofreces con fotos reales y te escriben en un clic, desde el celular o la computadora." }
  };
  var MAIN_CHIPS = [
    {label:"Quiero vender más", act:"need:vender"},
    {label:"Ordenar a mi personal", act:"need:personal"},
    {label:"Ver mis números", act:"need:numeros"},
    {label:"Tener mi web", act:"need:web"},
    {label:"Kits digitales desde $15", act:"topic:kits"},
    {label:"Servicios para empresas", act:"topic:corp"},
    {label:"Ver precios", act:"topic:precios"}
  ];

  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function scrollDown(){ msgs.scrollTop = msgs.scrollHeight; }
  function botSay(html){
    var d = document.createElement("div");
    d.className = "msg bot"; d.innerHTML = html;
    msgs.appendChild(d); scrollDown();
    return d;
  }
  function userSay(text){
    var d = document.createElement("div");
    d.className = "msg user"; d.textContent = text;
    msgs.appendChild(d); scrollDown();
  }
  function setChips(list){
    chipsBox.innerHTML = "";
    (list || []).forEach(function(c){
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = c.label;
      b.setAttribute("data-act", c.act);
      b.addEventListener("click", function(){ handleAction(c.act, c.label); });
      chipsBox.appendChild(b);
    });
  }
  function waLink(){
    var parts = ["Hola PixelAndina, vengo del asistente de la web."];
    if(state.reco) parts.push("Me interesa: " + state.reco.servicio + " (" + state.reco.precio + ").");
    if(state.need) parts.push("Mi necesidad: " + state.need + ".");
    if(state.detail) parts.push(state.detail);
    parts.push("Quiero mi cotización sin costo.");
    return WA + encodeURIComponent(parts.join(" "));
  }
  function closeOffer(){
    var m = botSay("<p>Si quieres, seguimos por WhatsApp y te preparamos la <b>cotización sin costo</b>, con el precio final cerrado por escrito antes de empezar. El botón ya lleva el resumen de lo que conversamos:</p>");
    var ctas = document.createElement("div");
    ctas.className = "msg-ctas";
    var a = document.createElement("a");
    a.className = "wa"; a.target = "_blank"; a.rel = "noopener";
    a.href = waLink(); a.textContent = "Cerrar por WhatsApp";
    var b = document.createElement("a");
    b.className = "mail"; b.href = MAIL + "?subject=" + encodeURIComponent("Quiero cotizar: " + (state.reco ? state.reco.servicio : "una web o app")) + "&body=" + encodeURIComponent("Hola PixelAndina, vengo del asistente de la web.\n\nMe interesa: " + (state.reco ? state.reco.servicio + " (" + state.reco.precio + ")" : "quiero información") + "\nMi necesidad: " + (state.need || "") + "\n" + state.detail);
    b.textContent = "Escribir al correo";
    ctas.appendChild(a); ctas.appendChild(b);
    m.appendChild(ctas); scrollDown();
    setChips([
      {label:"Tengo otra duda", act:"topic:menu"},
      {label:"Ver precios", act:"topic:precios"},
      {label:"Cómo comprar", act:"topic:comprar"}
    ]);
  }
  function askSize(){
    botSay("<p>Para afinar la recomendación: <b>¿cómo es tu caso?</b></p>");
    setChips([
      {label:"Estoy empezando", act:"size:empieza"},
      {label:"Ya tengo equipo o varios locales", act:"size:equipo"},
      {label:"Lo necesito pronto", act:"size:pronto"},
      {label:"Sin apuro, quiero hacerlo bien", act:"size:calma"}
    ]);
  }
  function chooseNeed(key){
    var n = NEEDS[key]; if(!n) return;
    state.need = n.label; state.reco = n;
    botSay("<p>" + n.texto + "</p><p>" + n.beneficio + "</p>");
    askSize();
  }
  function answerSize(kind){
    var extra = {
      empieza:"Perfecto para empezar: partimos de la plantilla más cercana a tu negocio y la adaptamos con tu nombre, tus fotos y tus servicios. Sin funciones que no necesitas.",
      equipo:"Con equipo o varios locales, el panel se adapta a tu estructura: cada responsable ve lo suyo y tú ves todo de un vistazo.",
      pronto:"Entendido, la urgencia importa: trabajamos con entregas estimadas de 1 semana o menos según el servicio (landing 2 a 3 días, web 3 a 5 días, tablero/app 5 a 7 días), y al cotizar tu tiempo confirmado queda por escrito, con avances revisables sobre la marcha.",
      calma:"Perfecto: trabajamos con avances revisables, para que ajustes sobre la marcha y no al final."
    }[kind] || "";
    state.detail = {empieza:"Estoy empezando.", equipo:"Ya tengo equipo o varios locales.", pronto:"Lo necesito pronto.", calma:"No tengo apuro; quiero hacerlo bien."}[kind] || "";
    botSay("<p>" + extra + "</p><p>Recuerda: el <b>precio final se cierra por escrito antes de empezar</b>, pagas <b>40% de anticipo y 60% a la entrega</b> por transferencia, y el soporte mensual, si lo quieres, es <b>$5/mes</b>.</p>");
    closeOffer();
  }
  function topic(t){
    if(t === "precios"){
      botSay("<p>Precios de lanzamiento, claros desde el inicio:</p><p>· <b>Landing</b> desde <b>$29</b> · entrega 2 a 3 días<br>· <b>Web de negocio</b> desde <b>$69</b> · entrega 3 a 5 días<br>· <b>Ventas por WhatsApp</b> desde <b>$69</b> · entrega 2 a 4 días<br>· <b>Tablero / app simple</b> desde <b>$129</b> (talento humano, dashboards, operaciones) · entrega 5 a 7 días<br>· <b>Soporte</b> mensual <b>$5/mes</b></p><p>Y en la <a href=\"tienda.html\">tienda digital</a> hay kits listos desde <b>$15</b> que se compran en línea. Los valores “desde” son el punto de partida: tu precio final queda cerrado en una cotización sin costo, antes de decidir. El pago de servicios es por <b>transferencia bancaria</b>: <b>40% de anticipo para empezar y 60% restante a la entrega</b>.</p>");
      setChips(MAIN_CHIPS);
    } else if(t === "kits"){
      state.reco = { servicio:"Un kit digital de la tienda", precio:"desde $15" };
      botSay("<p>En la <a href=\"tienda.html\"><b>tienda digital</b></a> tienes productos listos para descargar hoy, con compra en línea en Hotmart y <b>garantía de 7 días</b>:</p><p>· <b>Kit RR. HH.</b> $19 — plantillas de asistencia, permisos y roles<br>· <b>Kit Educativo</b> $15 — plantillas para docentes<br>· <b>Kit Tesis</b> $17 — APA 7, planificador e instrumentos<br>· <b>Sistema Operativo Pyme</b> $39 — inventario, ventas, clientes y equipo<br>· <b>Kit Formalízate (RIMPE)</b> $24 — ruta y calendario de obligaciones</p><p>Y dos cursos vienen en camino. Si prefieres que lo adaptemos a tu negocio, también lo hacemos a medida.</p>");
      setChips([{label:"Ir a la tienda digital", act:"goto:tienda.html"}, {label:"Quiero algo a medida", act:"topic:menu"}, {label:"Ver precios de servicios", act:"topic:precios"}]);
    } else if(t === "corp"){
      state.reco = { servicio:"Servicios corporativos (IA y datos)", precio:"diagnóstico sin costo" };
      botSay("<p>Para empresas tenemos una línea completa en la página de <a href=\"corporativo.html\"><b>servicios corporativos</b></a>:</p><p>· <b>Capacitación en IA por rol</b> ($600–$1.200 por jornada)<br>· <b>Rescate de adopción de IA</b>: que tu equipo sí use lo que ya pagas ($1.800–$3.500)<br>· <b>Herramientas internas a medida</b> que reemplazan el Excel compartido ($2.500–$6.000)<br>· <b>Dashboard «Un Solo Número»</b>, asistente interno con tus documentos, kit de uso seguro de IA, agente de preguntas frecuentes e integraciones</p><p>Empezamos con un <b>diagnóstico de 30 minutos sin costo</b>.</p>");
      setChips([{label:"Pedir el diagnóstico sin costo", act:"close"}, {label:"Ver la página corporativa", act:"goto:corporativo.html"}, {label:"Volver al menú", act:"topic:menu"}]);
    } else if(t === "ideas"){
      botSay("<p>Además de lo que ya está listo, <b>podemos crear a pedido</b> desarrollos como: recepcionista de voz con IA 24/7, administración de condominios, sistema para veterinarias, GPS de flotas con tu marca, asistente privado con tus documentos, packs de automatización, wiki de procedimientos, organizador para iglesias/ONG y webs para operadores turísticos. Están explicados en la página <a href=\"ideas.html\"><b>«Podemos crearlo para ti»</b></a>.</p>");
      setChips([{label:"Ver las ideas a pedido", act:"goto:ideas.html"}, {label:"Cotizar una idea", act:"close"}, {label:"Volver al menú", act:"topic:menu"}]);
    } else if(t === "demos"){
      botSay("<p>Tenemos <b>17 demos en vivo</b> que puedes probar ahora mismo, sin registrarte: panel de RR. HH., ventas por WhatsApp, inventario, facturación, tienda en línea, reservas y más. Están en la página de <a href=\"demos.html\"><b>demos</b></a>, con vista previa sin salir de la web.</p>");
      setChips([{label:"Ir a los demos", act:"goto:demos.html"}, {label:"Ver precios", act:"topic:precios"}, {label:"Volver al menú", act:"topic:menu"}]);
    } else if(t === "comprar"){
      botSay("<p><b>Cómo comprar</b>, en 4 pasos:</p><p>1. Nos cuentas tu idea por WhatsApp o correo.<br>2. Recibes propuesta con diseño inicial, alcance, <b>precio cerrado y tiempo estimado por escrito</b> (cotizar no cuesta nada).<br>3. Empezamos con el <b>anticipo del 40%</b> por <b>transferencia bancaria</b> y lo construimos contigo, con avances revisables.<br>4. Entrega funcionando — estimada en <b>1 semana o menos</b> según el servicio — con capacitación corta y ajustes incluidos; a la entrega pagas el <b>60% restante</b>.</p><p>Los <b>kits digitales</b> son distintos: se compran directo en la <a href=\"tienda.html\">tienda</a> y se descargan al instante.</p>");
      setChips([{label:"Quiero cotizar", act:"close"}, {label:"Formas de pago", act:"topic:pago"}, {label:"Ver precios", act:"topic:precios"}]);
    } else if(t === "pago"){
      botSay("<p>Sobre el <b>pago</b>, sin letra pequeña: los servicios a medida se pagan por <b>transferencia bancaria</b> — los datos de la cuenta van en tu cotización — con un <b>adelanto del 40% del valor para empezar</b> y el <b>60% restante a la entrega del proyecto</b>. Los <b>kits digitales</b> se pagan en línea en la tienda (Hotmart). El pago con tarjeta para servicios está <b>en activación</b> y lo anunciaremos cuando esté activo. No te pedimos nada antes de que veas tu propuesta.</p>");
      setChips([{label:"Quiero cotizar", act:"close"}, {label:"Cómo comprar", act:"topic:comprar"}, {label:"Ver precios", act:"topic:precios"}]);
    } else if(t === "horario"){
      botSay("<p>Atendemos por WhatsApp y correo de <b>lunes a sábado, de 9:00 a 18:00</b> (hora de Ecuador). Si nos escribes fuera de ese horario, déjanos tu mensaje y te respondemos en cuanto retomemos.</p>");
      setChips(MAIN_CHIPS);
    } else if(t === "servicios"){
      botSay("<p>Esto es lo que hacemos:</p><p>· <b>Web para tu negocio</b> y <b>landings</b><br>· <b>Talento humano digital</b> (asistencia, horarios, permisos)<br>· <b>Dashboards</b> de ventas y operación<br>· <b>Ventas por WhatsApp</b> (catálogo y pedidos)<br>· <b>Tableros y apps a medida</b><br>· <a href=\"tienda.html\"><b>Kits digitales</b></a> listos para descargar<br>· <a href=\"corporativo.html\"><b>Servicios corporativos</b></a> de IA y datos<br>· <a href=\"ideas.html\"><b>Desarrollos a pedido</b></a> (voz IA, condominios, veterinarias, GPS…)</p><p>Dime qué necesita tu negocio y te recomiendo el adecuado:</p>");
      setChips(MAIN_CHIPS);
    } else if(t === "obj-precio"){
      botSay("<p>Es válido pensarlo. Dos cosas que ayudan: los precios de lanzamiento parten de <b>$29</b> (landing), <b>$69</b> (web o WhatsApp) y <b>$129</b> (tablero/app), hay kits listos desde <b>$15</b>, y <b>cotizar no cuesta nada</b>: recibes el precio final cerrado por escrito y decides con el número real en la mano, sin compromiso.</p>");
      setChips([{label:"Pedir cotización sin costo", act:"close"}, {label:"Ver precios", act:"topic:precios"}, {label:"Ver kits desde $15", act:"topic:kits"}, {label:"Seguir explorando", act:"topic:menu"}]);
    } else if(t === "obj-tiempo"){
      botSay("<p>La entrega estimada es de <b>1 semana o menos</b>, según el servicio:</p><p>· <b>Landing</b>: 2 a 3 días<br>· <b>Web de negocio</b>: 3 a 5 días<br>· <b>Ventas por WhatsApp</b>: 2 a 4 días<br>· <b>Tablero / app</b>: 5 a 7 días</p><p>Si partes de una <b>plantilla</b>, el tiempo aproximado se conoce desde el inicio, casi exacto. Un proyecto a medida depende de la solicitud: su tiempo confirmado va por escrito en tu propuesta, con avances revisables. Si tienes una fecha límite, dínosla al cotizar y te decimos con honestidad si llegamos.</p>");
      setChips([{label:"Cotizar con mi fecha", act:"close"}, {label:"Cómo comprar", act:"topic:comprar"}, {label:"Seguir explorando", act:"topic:menu"}]);
    } else if(t === "obj-confianza"){
      botSay("<p>Buena pregunta. Así trabajamos para que decidas con tranquilidad: <b>cotización escrita sin costo</b>, <b>precio cerrado antes de empezar</b>, <b>avances que revisas sobre la marcha</b> y entrega con capacitación. Ya entregamos un proyecto real — <b>El Clóset de las 3 hermanas</b>, tienda y panel en línea — y puedes probar nuestros <b>17 demos en vivo</b> antes de pagar nada. Sin promesas raras: todo queda por escrito.</p>");
      setChips([{label:"Pedir cotización", act:"close"}, {label:"Ver los demos", act:"topic:demos"}, {label:"Seguir explorando", act:"topic:menu"}]);
    } else if(t === "menu"){
      botSay("<p>Claro. ¿Qué necesita tu negocio?</p>");
      setChips(MAIN_CHIPS);
    }
  }
  function handleAction(act, label){
    if(label) userSay(label);
    if(act.indexOf("goto:") === 0){ window.location.href = act.slice(5); return; }
    var parts = act.split(":");
    if(parts[0] === "need") chooseNeed(parts[1]);
    else if(parts[0] === "size") answerSize(parts[1]);
    else if(parts[0] === "topic") topic(parts[1]);
    else if(act === "close") closeOffer();
  }
  function matchText(raw){
    var t = " " + raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + " ";
    function has(){ for(var i=0;i<arguments.length;i++){ if(t.indexOf(arguments[i]) > -1) return true; } return false; }
    if(has("caro", "carisimo", "mucho dinero", "no tengo plata", "no tengo dinero", "muy costoso")) return "topic:obj-precio";
    if(has("cuanto tarda", "cuanto demora", "cuanto tiempo", "demora", "tarda mucho", "rapido lo necesito", "urgente", "entrega", "plazo", "cuantos dias", "en cuanto tiempo", "cuando estaria listo", "cuando esta listo")) return "topic:obj-tiempo";
    if(has("confiable", "confianza", "estafa", "seguro es", "son reales", "garantia")) return "topic:obj-confianza";
    if(has("kit", "plantilla", "plantillas", "descargar", "descarga", "hotmart", "tesis", "docente", "profesor", "rimpe", "formalizar", "curso", "cursos")) return "topic:kits";
    if(has("empresa", "corporativo", "capacitacion", "copilot", "adopcion", "consultoria", "gerencia")) return "topic:corp";
    if(has("recepcionista", "condominio", "veterinaria", "gps", "flota", "iglesia", "ong", "turismo", "a pedido", "pueden crear", "se puede hacer")) return "topic:ideas";
    if(has("demo", "demos", "probar", "ejemplo en vivo", "ver funcionando")) return "topic:demos";
    if(has("precio", "cuesta", "cuestan", "costo", "cuanto vale", "cuanto cobran", "tarifa")) return "topic:precios";
    if(has("pago", "pagar", "transferencia", "tarjeta", "efectivo", "anticipo", "adelanto", "40%", "60%")) return "topic:pago";
    if(has("horario", "hora atienden", "cuando atienden", "abren", "atienden")) return "topic:horario";
    if(has("como compro", "como comprar", "como empiezo", "como es el proceso", "proceso", "pasos")) return "topic:comprar";
    if(has("dashboard", "tablero", "indicadores", "reportes", "graficos", "panel de ventas")) return "need:numeros";
    if(has("talento", "personal", "asistencia", "empleados", "recursos humanos", "rrhh", "permisos", "horarios del personal", "planilla")) return "need:personal";
    if(has("whatsapp", "catalogo", "pedidos", "vender")) return "need:vender";
    if(has("tienda", "local", "restaurante", "cafeteria", "negocio")) return "need:web";
    if(has("app", "aplicacion", "sistema")) return "need:numeros";
    if(has("web", "pagina", "sitio", "landing", "internet", "presencia")) return "need:web";
    if(has("servicio", "que hacen", "ofrecen")) return "topic:servicios";
    if(has("hola", "buenas", "buenos dias", "buenas tardes")) return "topic:menu";
    if(has("gracias")) return "gracias";
    return null;
  }
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var v = input.value.trim();
    if(!v) return;
    input.value = "";
    userSay(v);
    var m = matchText(v);
    if(m === "gracias"){
      botSay("<p>¡Con gusto! Si luego quieres tu cotización sin costo, aquí estoy o escríbenos por WhatsApp al <b>+593 93 946 2496</b>.</p>");
      setChips(MAIN_CHIPS);
    } else if(m){
      var parts = m.split(":");
      if(parts[0] === "need") chooseNeed(parts[1]);
      else topic(parts[1]);
    } else {
      botSay("<p>Esa duda puntual te la responde mejor una persona del equipo. Mientras tanto, puedo ayudarte con <b>precios, servicios, kits, demos, cómo comprar, formas de pago y horarios</b>: toca un botón o escribe una palabra como «web», «app», «dashboard», «talento», «kit» o «whatsapp».</p>");
      setChips([{label:"Hablar por WhatsApp", act:"close"}, {label:"Ver precios", act:"topic:precios"}, {label:"Ver servicios", act:"topic:servicios"}]);
    }
  });
  function openChat(){
    panel.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    if(!started){
      started = true;
      botSay("<p>¡Hola! Soy el asistente automático de <b>PixelAndina</b>. Te ayudo a encontrar la web, la app o el kit adecuado para tu negocio, con precios claros desde el inicio.</p><p>Para recomendarte bien: <b>¿qué necesita tu negocio hoy?</b></p>");
      setChips(MAIN_CHIPS);
    }
    setTimeout(function(){ input.focus(); }, 60);
  }
  function closeChat(){
    panel.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  }
  btn.addEventListener("click", function(){
    if(panel.classList.contains("open")) closeChat(); else openChat();
  });
  closeBtn.addEventListener("click", closeChat);
  document.addEventListener("keydown", function(e){ if(e.key === "Escape" && panel.classList.contains("open")) closeChat(); });
})();
