/* PixelAndina · Administración del panel de clientes (PRODUCCIÓN).
   admin-clientes.html: mismo candado que prospectos.html (Firebase
   Auth, administrador único: Anthony). Gestiona en Firestore:
   · colección «proyectos»: crear, editar y eliminar el proyecto
     que cada cliente ve en su panel (clientes.html), con su estado
     y sus avances para revisar;
   · colección «soporte»: bandeja de mensajes agrupada por cliente
     y respuestas como PixelAndina (de: "pixelandina").
   Las reglas (firestore.rules) solo permiten esto al admin. */
(function(){
  "use strict";

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function msDe(d){
    if(!d) return 0;
    if(d.actualizadoEn && typeof d.actualizadoEn.toDate === "function"){ try{ return d.actualizadoEn.toDate().getTime(); }catch(e){} }
    if(d.creadoEn && typeof d.creadoEn.toDate === "function"){ try{ return d.creadoEn.toDate().getTime(); }catch(e){} }
    if(d.fechaISO){ var t = Date.parse(d.fechaISO); if(!isNaN(t)) return t; }
    return 0;
  }
  function fechaLegible(d){
    var ms = msDe(d);
    if(ms) return new Date(ms).toLocaleString("es-EC", { timeZone:"America/Guayaquil", dateStyle:"medium", timeStyle:"short" });
    return d && d.fecha ? d.fecha : "";
  }
  function stamp(){ return firebase.firestore.FieldValue.serverTimestamp(); }

  var lock = document.getElementById("lockBox");
  var admin = document.getElementById("adminView");
  var lockForm = document.getElementById("lockForm");
  var lockErr = document.getElementById("lockErr");

  function showErr(msg){ if(lockErr){ lockErr.textContent = msg; lockErr.classList.add("show"); } }
  function hideErr(){ if(lockErr){ lockErr.textContent = ""; lockErr.classList.remove("show"); } }
  function formErr(id, msg){
    var el = document.getElementById(id);
    if(!el) return;
    if(msg){ el.textContent = msg; el.classList.add("show"); }
    else { el.textContent = ""; el.classList.remove("show"); }
  }

  if(!window.PA_FIREBASE || !window.PA_FIREBASE.auth || !window.PA_FIREBASE.db){
    if(lockForm) lockForm.style.display = "none";
    showErr("La conexión con la base de datos no está configurada todavía. Revisa el bloque CONFIG_FIREBASE en assets/firebase-config.js (ver SETUP.md).");
    return;
  }
  var auth = window.PA_FIREBASE.auth;
  var db = window.PA_FIREBASE.db;

  var proyectos = [];   /* [{ docId, ...datos }] */
  var mensajes = [];    /* [{ docId, ...datos }] de soporte */
  var unsubProy = null, unsubSop = null;
  var editingId = null; /* proyecto en edición, o null al crear */

  function proyectoPorId(id){
    for(var i = 0; i < proyectos.length; i++) if(proyectos[i].docId === id) return proyectos[i];
    return null;
  }

  /* ---------- Lista de proyectos ---------- */
  function renderProyectos(){
    var tbody = document.getElementById("proyBody");
    var empty = document.getElementById("emptyProy");
    var tableWrap = document.getElementById("tblWrap");
    tbody.innerHTML = "";
    if(!proyectos.length){ empty.style.display = "block"; tableWrap.style.display = "none"; }
    else {
      empty.style.display = "none"; tableWrap.style.display = "block";
      proyectos.forEach(function(p){
        var nAv = Array.isArray(p.avances) ? p.avances.length : 0;
        var tr = document.createElement("tr");
        tr.innerHTML =
          "<td><b>" + esc(p.clienteNombre || "—") + "</b><span class='sub'>" + esc(p.clienteEmail) + "</span><span class='sub'>" + esc(p.negocio || "") + "</span></td>" +
          "<td>" + esc(p.proyecto || "—") + "</td>" +
          "<td><span class='badge " + ((p.estado || "") === "Entregado" ? "live" : "") + "'>" + esc(p.estado || "Recibido") + "</span></td>" +
          "<td>" + nAv + "</td>" +
          "<td style='white-space:nowrap'>" +
            "<button type='button' class='btn btn-ghost btn-sm' data-edit='" + esc(p.docId) + "'>Editar</button> " +
            "<button type='button' class='btn btn-ghost btn-sm' data-avances='" + esc(p.docId) + "'>Avances</button> " +
            "<button type='button' class='btn btn-ghost btn-sm' data-del='" + esc(p.docId) + "'>Eliminar</button>" +
          "</td>";
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll("[data-edit]").forEach(function(b){
        b.addEventListener("click", function(){ cargarEdicion(b.getAttribute("data-edit")); });
      });
      tbody.querySelectorAll("[data-avances]").forEach(function(b){
        b.addEventListener("click", function(){
          var sel = document.getElementById("avProyecto");
          if(sel){ sel.value = b.getAttribute("data-avances"); renderAvances(); sel.scrollIntoView({ behavior:"smooth", block:"center" }); }
        });
      });
      tbody.querySelectorAll("[data-del]").forEach(function(b){
        b.addEventListener("click", function(){
          var p = proyectoPorId(b.getAttribute("data-del"));
          if(!p) return;
          if(!confirm("¿Eliminar el proyecto «" + (p.proyecto || "") + "» de " + (p.clienteNombre || p.clienteEmail) + "? El cliente dejará de verlo en su panel. Los mensajes de soporte se conservan.")) return;
          db.collection("proyectos").doc(p.docId).delete().catch(function(){
            alert("No se pudo eliminar el proyecto. Inténtalo de nuevo.");
          });
        });
      });
    }
    renderAvSelect();
  }

  /* ---------- Formulario de proyecto ---------- */
  function limpiarForm(){
    editingId = null;
    document.getElementById("pfForm").reset();
    document.getElementById("pfTitle").textContent = "Crear proyecto de cliente";
    document.getElementById("pfSave").textContent = "Guardar proyecto";
    document.getElementById("pfCancel").style.display = "none";
    formErr("pfErr", "");
  }
  function cargarEdicion(id){
    var p = proyectoPorId(id);
    if(!p) return;
    editingId = id;
    document.getElementById("pfEmail").value = p.clienteEmail || "";
    document.getElementById("pfNombre").value = p.clienteNombre || "";
    document.getElementById("pfNegocio").value = p.negocio || "";
    document.getElementById("pfProyecto").value = p.proyecto || "";
    document.getElementById("pfEstado").value = p.estado || "Recibido";
    document.getElementById("pfDesc").value = p.descripcion || "";
    document.getElementById("pfTitle").textContent = "Editar proyecto";
    document.getElementById("pfSave").textContent = "Guardar cambios";
    document.getElementById("pfCancel").style.display = "";
    formErr("pfErr", "");
    document.getElementById("pfForm").scrollIntoView({ behavior:"smooth", block:"center" });
  }

  var pfForm = document.getElementById("pfForm");
  if(pfForm){
    pfForm.addEventListener("submit", function(e){
      e.preventDefault();
      formErr("pfErr", "");
      var datos = {
        clienteEmail: (document.getElementById("pfEmail").value || "").trim().toLowerCase(),
        clienteNombre: (document.getElementById("pfNombre").value || "").trim(),
        negocio: (document.getElementById("pfNegocio").value || "").trim(),
        proyecto: (document.getElementById("pfProyecto").value || "").trim(),
        estado: document.getElementById("pfEstado").value,
        descripcion: (document.getElementById("pfDesc").value || "").trim(),
        actualizadoEn: stamp()
      };
      if(!datos.clienteEmail) return formErr("pfErr", "Escribe el correo del cliente: es la llave con la que verá su proyecto.");
      if(!datos.proyecto) return formErr("pfErr", "Escribe el nombre del proyecto.");
      var btn = document.getElementById("pfSave");
      btn.disabled = true;
      var op;
      if(editingId){
        op = db.collection("proyectos").doc(editingId).update(datos);
      } else {
        datos.avances = [];
        datos.creadoEn = stamp();
        op = db.collection("proyectos").add(datos);
      }
      op.then(function(){ limpiarForm(); }).catch(function(){
        formErr("pfErr", "No se pudo guardar el proyecto. Revisa tu conexión e inténtalo de nuevo.");
      }).then(function(){ btn.disabled = false; });
    });
    document.getElementById("pfCancel").addEventListener("click", limpiarForm);
  }

  /* ---------- Avances ---------- */
  function renderAvSelect(){
    var sel = document.getElementById("avProyecto");
    if(!sel) return;
    var actual = sel.value;
    sel.innerHTML = "";
    if(!proyectos.length){
      var op0 = document.createElement("option");
      op0.value = ""; op0.textContent = "— Primero crea un proyecto —";
      sel.appendChild(op0);
    }
    proyectos.forEach(function(p){
      var op = document.createElement("option");
      op.value = p.docId;
      op.textContent = (p.proyecto || "Proyecto") + " · " + (p.clienteNombre || p.clienteEmail);
      sel.appendChild(op);
    });
    if(actual && proyectoPorId(actual)) sel.value = actual;
    renderAvances();
  }

  function renderAvances(){
    var lista = document.getElementById("avList");
    var sel = document.getElementById("avProyecto");
    if(!lista || !sel) return;
    var p = proyectoPorId(sel.value);
    lista.innerHTML = "";
    if(!p){ lista.innerHTML = "<p class='small'>Sin proyecto seleccionado.</p>"; return; }
    var avances = Array.isArray(p.avances) ? p.avances : [];
    if(!avances.length){ lista.innerHTML = "<p class='small'>Este proyecto aún no tiene avances publicados.</p>"; return; }
    /* Vista ordenada por fecha (más reciente primero), conservando el índice original para borrar. */
    var ordenados = avances.map(function(a, i){ return { a: a, i: i }; });
    ordenados.sort(function(x, y){ return msDe(y.a) - msDe(x.a); });
    ordenados.forEach(function(item){
      var a = item.a;
      var row = document.createElement("div");
      row.className = "av-row";
      row.innerHTML = "<div class='grow'><h5>" + esc(a.titulo) + "</h5><p>" + esc(a.detalle) + "</p>" +
        "<p class='small'>" + esc(fechaLegible(a)) + (a.enlace ? " · <a href='" + esc(a.enlace) + "' target='_blank' rel='noopener' style='color:var(--green-xl)'>Ver enlace</a>" : "") + "</p></div>" +
        "<button type='button' class='btn btn-ghost btn-sm' data-avdel='" + item.i + "'>Eliminar</button>";
      lista.appendChild(row);
    });
    lista.querySelectorAll("[data-avdel]").forEach(function(b){
      b.addEventListener("click", function(){
        var idx = parseInt(b.getAttribute("data-avdel"), 10);
        var proy = proyectoPorId(sel.value);
        if(!proy || !Array.isArray(proy.avances)) return;
        if(!confirm("¿Eliminar este avance? El cliente dejará de verlo en su panel.")) return;
        var nuevos = proy.avances.filter(function(_, i){ return i !== idx; });
        db.collection("proyectos").doc(proy.docId).update({ avances: nuevos, actualizadoEn: stamp() }).catch(function(){
          alert("No se pudo eliminar el avance. Inténtalo de nuevo.");
        });
      });
    });
  }

  var avProyectoSel = document.getElementById("avProyecto");
  if(avProyectoSel) avProyectoSel.addEventListener("change", renderAvances);

  var avForm = document.getElementById("avForm");
  if(avForm){
    avForm.addEventListener("submit", function(e){
      e.preventDefault();
      formErr("avErr", "");
      var sel = document.getElementById("avProyecto");
      var p = proyectoPorId(sel.value);
      if(!p) return formErr("avErr", "Primero crea y selecciona un proyecto.");
      var titulo = (document.getElementById("avTitulo").value || "").trim();
      var detalle = (document.getElementById("avDetalle").value || "").trim();
      var enlace = (document.getElementById("avEnlace").value || "").trim();
      if(!titulo) return formErr("avErr", "Escribe el título del avance.");
      if(!detalle) return formErr("avErr", "Escribe el detalle del avance.");
      var now = new Date();
      var avance = {
        titulo: titulo,
        detalle: detalle,
        enlace: enlace,
        fechaISO: now.toISOString(),
        fecha: now.toLocaleString("es-EC", { timeZone:"America/Guayaquil", dateStyle:"medium", timeStyle:"short" })
      };
      var nuevos = (Array.isArray(p.avances) ? p.avances.slice() : []);
      nuevos.push(avance);
      var btn = document.getElementById("avAdd");
      btn.disabled = true;
      db.collection("proyectos").doc(p.docId).update({ avances: nuevos, actualizadoEn: stamp() }).then(function(){
        avForm.reset();
      }).catch(function(){
        formErr("avErr", "No se pudo publicar el avance. Inténtalo de nuevo.");
      }).then(function(){ btn.disabled = false; });
    });
  }

  /* ---------- Soporte: bandeja por cliente ---------- */
  function renderSoporte(){
    var wrap = document.getElementById("sopWrap");
    var empty = document.getElementById("emptySop");
    if(!wrap) return;
    wrap.innerHTML = "";
    if(!mensajes.length){ empty.style.display = "block"; return; }
    empty.style.display = "none";
    /* Agrupar por cliente y ordenar los grupos por su mensaje más reciente. */
    var grupos = {};
    mensajes.forEach(function(m){
      var k = (m.clienteEmail || "").toLowerCase();
      if(!grupos[k]) grupos[k] = [];
      grupos[k].push(m);
    });
    var claves = Object.keys(grupos);
    claves.forEach(function(k){ grupos[k].sort(function(a, b){ return msDe(a) - msDe(b); }); });
    claves.sort(function(a, b){
      return msDe(grupos[b][grupos[b].length - 1]) - msDe(grupos[a][grupos[a].length - 1]);
    });
    claves.forEach(function(email){
      var lista = grupos[email];
      var proy = null;
      proyectos.forEach(function(p){ if((p.clienteEmail || "").toLowerCase() === email) proy = p; });
      var block = document.createElement("div");
      block.className = "sop-block";
      var hilo = lista.map(function(m){
        var dePa = m.de === "pixelandina";
        return "<div class='msg " + (dePa ? "user" : "bot") + "'><b style='font-size:12px'>" + (dePa ? "PixelAndina" : "Cliente") + "</b><br>" +
          esc(m.mensaje) + "<span class='mf'>" + esc(fechaLegible(m)) + "</span></div>";
      }).join("");
      block.innerHTML = "<h4>" + esc(proy ? (proy.clienteNombre || email) : email) + "</h4>" +
        "<p class='small'>" + esc(email) + (proy ? " · " + esc(proy.negocio || "") + " · " + esc(proy.proyecto || "") : " · Sin proyecto creado todavía") + "</p>" +
        "<div class='hilo' style='margin-top:14px'>" + hilo + "</div>" +
        "<form data-reply='" + esc(email) + "' style='margin-top:12px'>" +
          "<div class='f-field' style='margin-bottom:10px'><textarea placeholder='Escribe tu respuesta como PixelAndina…' aria-label='Tu respuesta'></textarea></div>" +
          "<button type='submit' class='btn btn-green btn-sm'>Responder</button>" +
        "</form>";
      wrap.appendChild(block);
      var hiloEl = block.querySelector(".hilo");
      if(hiloEl) hiloEl.scrollTop = hiloEl.scrollHeight;
    });
    wrap.querySelectorAll("form[data-reply]").forEach(function(f){
      f.addEventListener("submit", function(e){
        e.preventDefault();
        var email = f.getAttribute("data-reply");
        var ta = f.querySelector("textarea");
        var texto = (ta.value || "").trim();
        if(!texto) return;
        var btn = f.querySelector("button[type='submit']");
        btn.disabled = true; btn.textContent = "Enviando…";
        db.collection("soporte").add({
          clienteEmail: email,
          de: "pixelandina",
          mensaje: texto,
          fechaISO: new Date().toISOString(),
          creadoEn: stamp()
        }).then(function(){ ta.value = ""; }).catch(function(){
          alert("No se pudo enviar la respuesta. Inténtalo de nuevo.");
        }).then(function(){ btn.disabled = false; btn.textContent = "Responder"; });
      });
    });
  }

  /* ---------- Suscripciones en vivo ---------- */
  function startListening(){
    if(unsubProy) return;
    unsubProy = db.collection("proyectos").onSnapshot(function(snap){
      proyectos = snap.docs.map(function(d){ var datos = d.data() || {}; datos.docId = d.id; return datos; });
      proyectos.sort(function(a, b){ return msDe(b) - msDe(a); });
      renderProyectos();
      renderSoporte();
    }, function(){
      var empty = document.getElementById("emptyProy");
      if(empty){ empty.style.display = "block"; empty.innerHTML = "<p>No se pudieron cargar los proyectos. Si entraste con una cuenta que no es la de administrador, las reglas de seguridad bloquean la lectura: cierra sesión y entra con la cuenta de Anthony.</p>"; }
    });
    unsubSop = db.collection("soporte").onSnapshot(function(snap){
      mensajes = snap.docs.map(function(d){ var datos = d.data() || {}; datos.docId = d.id; return datos; });
      renderSoporte();
    }, function(){ /* la bandeja queda como está */ });
  }
  function stopListening(){
    if(unsubProy){ unsubProy(); unsubProy = null; }
    if(unsubSop){ unsubSop(); unsubSop = null; }
    proyectos = []; mensajes = [];
  }

  /* ---------- Vistas y acceso (mismo patrón que prospectos) ---------- */
  function showAdmin(){
    if(lock) lock.style.display = "none";
    if(admin) admin.style.display = "block";
    startListening();
  }
  function showLock(){
    stopListening();
    limpiarForm();
    if(admin) admin.style.display = "none";
    if(lock) lock.style.display = "block";
  }

  var AUTH_ERRORS = {
    "auth/invalid-credential": "Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.",
    "auth/wrong-password": "Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.",
    "auth/user-not-found": "Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.",
    "auth/invalid-email": "Escribe un correo válido.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    "auth/network-request-failed": "Sin conexión. Revisa tu internet e inténtalo de nuevo."
  };
  if(lockForm){
    lockForm.addEventListener("submit", function(e){
      e.preventDefault();
      hideErr();
      var email = (document.getElementById("loginEmail").value || "").trim();
      var pass = document.getElementById("loginPass").value || "";
      if(!email || !pass){ showErr("Escribe tu correo y tu contraseña."); return; }
      var btn = lockForm.querySelector("button[type='submit']");
      if(btn){ btn.disabled = true; btn.textContent = "Entrando…"; }
      auth.signInWithEmailAndPassword(email, pass).catch(function(err){
        showErr(AUTH_ERRORS[err && err.code] || "No se pudo iniciar sesión. Inténtalo de nuevo.");
      }).then(function(){
        if(btn){ btn.disabled = false; btn.textContent = "Entrar"; }
      });
    });
  }

  auth.onAuthStateChanged(function(user){
    if(user) showAdmin();
    else showLock();
  });

  var logout = document.getElementById("btnLogout");
  if(logout) logout.addEventListener("click", function(){
    auth.signOut();
  });
})();
