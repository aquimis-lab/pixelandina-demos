/* PixelAndina · Panel de clientes (PRODUCCIÓN).
   clientes.html: ingreso con Firebase Auth (correo y contraseña
   que PixelAndina entrega al cliente al empezar su proyecto) y,
   con la sesión abierta, lectura EN VIVO de Firestore:
   · colección «proyectos» donde clienteEmail == correo del cliente
     (su proyecto, la barra de pasos y los avances para revisar);
   · colección «soporte» con el hilo de mensajes de ese cliente.
   La seguridad la imponen firestore.rules: cada cliente solo puede
   leer lo suyo; sin sesión no se ve nada. Sin localStorage para
   los datos del proyecto: todo sale de Firestore en vivo. */
(function(){
  "use strict";

  var ESTADOS = ["Recibido", "En diseño", "En desarrollo", "En revisión", "Entregado"];

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function msDe(d){
    if(!d) return 0;
    if(d.creadoEn && typeof d.creadoEn.toDate === "function"){ try{ return d.creadoEn.toDate().getTime(); }catch(e){} }
    if(d.fechaISO){ var t = Date.parse(d.fechaISO); if(!isNaN(t)) return t; }
    return 0;
  }
  function fechaLegible(d){
    var ms = msDe(d);
    if(ms) return new Date(ms).toLocaleString("es-EC", { timeZone:"America/Guayaquil", dateStyle:"medium", timeStyle:"short" });
    return d && d.fecha ? d.fecha : "";
  }

  var lock = document.getElementById("lockBox");
  var view = document.getElementById("clientView");
  var lockForm = document.getElementById("lockForm");
  var lockErr = document.getElementById("lockErr");

  function showErr(msg){ if(lockErr){ lockErr.textContent = msg; lockErr.classList.add("show"); } }
  function hideErr(){ if(lockErr){ lockErr.textContent = ""; lockErr.classList.remove("show"); } }

  if(!window.PA_FIREBASE || !window.PA_FIREBASE.auth || !window.PA_FIREBASE.db){
    if(lockForm) lockForm.style.display = "none";
    showErr("La conexión con el panel no está disponible todavía. Escríbenos por WhatsApp y te ayudamos enseguida.");
    return;
  }
  var auth = window.PA_FIREBASE.auth;
  var db = window.PA_FIREBASE.db;

  var miEmail = "";
  var proyectos = [];   /* [{ docId, ...datos }] */
  var mensajes = [];    /* [{ docId, ...datos }] ordenados por fecha */
  var unsubProy = null, unsubSop = null;

  /* ---------- Render del proyecto y los avances ---------- */
  function pasosHTML(estado){
    var idx = ESTADOS.indexOf(estado || "Recibido");
    if(idx < 0) idx = 0;
    var out = "<div class='psteps' aria-label='Estado del proyecto'>";
    ESTADOS.forEach(function(e, i){
      var cls = "pstep" + (i < idx ? " done" : (i === idx ? (idx === ESTADOS.length - 1 ? " done" : " now") : ""));
      out += "<div class='" + cls + "'>" + esc(e) + "</div>";
    });
    return out + "</div>";
  }

  function renderProyectos(){
    var wrap = document.getElementById("proyWrap");
    if(!wrap) return;
    if(!proyectos.length){
      wrap.innerHTML = "<div class='empty-box'><p style='font-size:16px;color:var(--sub);margin-bottom:8px'>Tu proyecto se está preparando.</p>" +
        "<p>Ya tienes tu acceso al panel. Apenas tu proyecto esté creado, aquí verás su estado paso a paso y los avances para revisar. Te avisamos por WhatsApp en cuanto esté listo.</p></div>";
      return;
    }
    wrap.innerHTML = "";
    proyectos.forEach(function(p){
      var card = document.createElement("div");
      card.className = "card";
      card.style.marginBottom = "22px";
      var avances = Array.isArray(p.avances) ? p.avances.slice() : [];
      avances.sort(function(a, b){ return msDe(b) - msDe(a); });
      var avHTML = "";
      if(avances.length){
        avHTML = "<h4 style='font-size:15px;margin:20px 0 10px'>Avances para revisar</h4><div class='av-list'>" + avances.map(function(a){
          return "<div class='av-item'><h4>" + esc(a.titulo) + "</h4><p>" + esc(a.detalle) + "</p>" +
            "<div class='av-meta'><span class='small'>" + esc(fechaLegible(a)) + "</span>" +
            (a.enlace ? "<a class='btn btn-white btn-sm' href='" + esc(a.enlace) + "' target='_blank' rel='noopener'>Ver avance</a>" : "") +
            "</div></div>";
        }).join("") + "</div>";
      } else {
        avHTML = "<p class='small' style='margin-top:18px'>Todavía no hay avances para revisar. Cuando publiquemos el primero, aparecerá aquí y te avisamos por WhatsApp.</p>";
      }
      card.innerHTML = "<div class='body'>" +
        "<div><span class='badge live'>" + esc(p.estado || "Recibido") + "</span> <span class='badge'>" + esc(p.negocio || "") + "</span></div>" +
        "<h3 style='font-size:23px'>" + esc(p.proyecto || "Mi proyecto") + "</h3>" +
        pasosHTML(p.estado) +
        (p.descripcion ? "<p style='margin-top:14px'><b style='color:var(--txt)'>Última novedad:</b> " + esc(p.descripcion) + "</p>" : "") +
        avHTML +
        "</div>";
      wrap.appendChild(card);
    });
  }

  /* ---------- Render del hilo de soporte ---------- */
  function renderSoporte(){
    var hilo = document.getElementById("hilo");
    if(!hilo) return;
    if(!mensajes.length){
      hilo.innerHTML = "<p class='small'>Aún no hay mensajes. Escríbenos tu primera duda aquí abajo y te respondemos en este mismo hilo.</p>";
      return;
    }
    hilo.innerHTML = mensajes.map(function(m){
      var mio = m.de === "cliente";
      return "<div class='msg " + (mio ? "user" : "bot") + "'><b style='font-size:12px'>" + (mio ? "Tú" : "PixelAndina") + "</b><br>" +
        esc(m.mensaje) + "<span class='mf'>" + esc(fechaLegible(m)) + "</span></div>";
    }).join("");
    hilo.scrollTop = hilo.scrollHeight;
  }

  /* ---------- Suscripciones en vivo ---------- */
  function startListening(email){
    stopListening();
    unsubProy = db.collection("proyectos").where("clienteEmail", "==", email).onSnapshot(function(snap){
      proyectos = snap.docs.map(function(d){ var datos = d.data() || {}; datos.docId = d.id; return datos; });
      var nombre = document.getElementById("cliNombre");
      if(nombre && proyectos.length && proyectos[0].clienteNombre) nombre.textContent = proyectos[0].clienteNombre;
      renderProyectos();
    }, function(){
      var wrap = document.getElementById("proyWrap");
      if(wrap) wrap.innerHTML = "<div class='empty-box'><p>No pudimos cargar tu proyecto en este momento. Revisa tu conexión e inténtalo de nuevo; si sigue así, escríbenos por WhatsApp.</p></div>";
    });
    unsubSop = db.collection("soporte").where("clienteEmail", "==", email).onSnapshot(function(snap){
      mensajes = snap.docs.map(function(d){ var datos = d.data() || {}; datos.docId = d.id; return datos; });
      mensajes.sort(function(a, b){ return msDe(a) - msDe(b); });
      renderSoporte();
    }, function(){ /* el hilo simplemente queda como está */ });
  }
  function stopListening(){
    if(unsubProy){ unsubProy(); unsubProy = null; }
    if(unsubSop){ unsubSop(); unsubSop = null; }
    proyectos = []; mensajes = [];
  }

  /* ---------- Vistas ---------- */
  function showClient(user){
    miEmail = (user.email || "").toLowerCase();
    var em = document.getElementById("cliEmail");
    if(em) em.textContent = user.email || "";
    var nombre = document.getElementById("cliNombre");
    if(nombre) nombre.textContent = (user.email || "").split("@")[0] || "cliente";
    if(lock) lock.style.display = "none";
    if(view) view.style.display = "block";
    startListening(miEmail);
  }
  function showLock(){
    stopListening();
    miEmail = "";
    if(view) view.style.display = "none";
    if(lock) lock.style.display = "block";
  }

  /* ---------- Ingreso ---------- */
  var AUTH_ERRORS = {
    "auth/invalid-credential": "Correo o contraseña incorrectos. Revisa los datos que te entregamos por WhatsApp e inténtalo de nuevo.",
    "auth/wrong-password": "Correo o contraseña incorrectos. Revisa los datos que te entregamos por WhatsApp e inténtalo de nuevo.",
    "auth/user-not-found": "Correo o contraseña incorrectos. Revisa los datos que te entregamos por WhatsApp e inténtalo de nuevo.",
    "auth/invalid-email": "Escribe un correo válido.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    "auth/network-request-failed": "Sin conexión. Revisa tu internet e inténtalo de nuevo."
  };
  if(lockForm){
    lockForm.addEventListener("submit", function(e){
      e.preventDefault();
      hideErr();
      var email = (document.getElementById("loginEmail").value || "").trim().toLowerCase();
      var pass = document.getElementById("loginPass").value || "";
      if(!email || !pass){ showErr("Escribe tu correo y tu contraseña."); return; }
      var btn = lockForm.querySelector("button[type='submit']");
      if(btn){ btn.disabled = true; btn.textContent = "Entrando…"; }
      auth.signInWithEmailAndPassword(email, pass).catch(function(err){
        showErr(AUTH_ERRORS[err && err.code] || "No se pudo iniciar sesión. Inténtalo de nuevo.");
      }).then(function(){
        if(btn){ btn.disabled = false; btn.textContent = "Entrar a mi panel"; }
      });
    });
  }

  auth.onAuthStateChanged(function(user){
    if(user) showClient(user);
    else showLock();
  });

  /* ---------- Enviar mensaje de soporte ---------- */
  var supForm = document.getElementById("supForm");
  if(supForm){
    supForm.addEventListener("submit", function(e){
      e.preventDefault();
      var err = document.getElementById("supErr");
      function fail(msg){ if(err){ err.textContent = msg; err.classList.add("show"); } }
      if(err) err.classList.remove("show");
      var texto = (document.getElementById("supMsg").value || "").trim();
      if(!texto) return fail("Escribe tu mensaje antes de enviarlo.");
      if(!miEmail) return fail("Tu sesión expiró. Vuelve a entrar a tu panel.");
      var btn = supForm.querySelector("button[type='submit']");
      if(btn){ btn.disabled = true; btn.textContent = "Enviando…"; }
      db.collection("soporte").add({
        clienteEmail: miEmail,
        de: "cliente",
        mensaje: texto,
        fechaISO: new Date().toISOString(),
        creadoEn: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function(){
        document.getElementById("supMsg").value = "";
      }).catch(function(){
        fail("No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.");
      }).then(function(){
        if(btn){ btn.disabled = false; btn.textContent = "Enviar mensaje"; }
      });
    });
  }

  var logout = document.getElementById("btnLogout");
  if(logout) logout.addEventListener("click", function(){
    auth.signOut();
  });
})();
