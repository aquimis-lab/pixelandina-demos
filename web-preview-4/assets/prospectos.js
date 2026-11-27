/* PixelAndina · Vista interna de prospectos (PRODUCCIÓN).
   Acceso con Firebase Auth (correo y contraseña del
   administrador único: Anthony). Lee en vivo la colección
   «prospectos» de Firestore, que llena el formulario de
   ventas (ventas.html). La seguridad la imponen
   firestore.rules: sin sesión de administrador no se lee nada. */
(function(){
  "use strict";

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  var lock = document.getElementById("lockBox");
  var admin = document.getElementById("adminView");
  var lockForm = document.getElementById("lockForm");
  var lockErr = document.getElementById("lockErr");

  function showErr(msg){ if(lockErr){ lockErr.textContent = msg; lockErr.classList.add("show"); } }
  function hideErr(){ if(lockErr){ lockErr.textContent = ""; lockErr.classList.remove("show"); } }

  if(!window.PA_FIREBASE || !window.PA_FIREBASE.auth || !window.PA_FIREBASE.db){
    if(lockForm) lockForm.style.display = "none";
    showErr("La conexión con la base de datos no está configurada todavía. Revisa el bloque CONFIG_FIREBASE en assets/firebase-config.js (ver SETUP.md).");
    return;
  }
  var auth = window.PA_FIREBASE.auth;
  var db = window.PA_FIREBASE.db;

  var prospectos = []; /* [{ docId, datos }] en orden de llegada */
  var unsubscribe = null;

  function todayStr(){ return new Date().toLocaleDateString("es-EC", { timeZone:"America/Guayaquil" }); }

  function render(){
    var arr = prospectos;
    document.getElementById("stTotal").textContent = arr.length;
    document.getElementById("stHoy").textContent = arr.filter(function(p){ try{ return new Date(p.fechaISO).toLocaleDateString("es-EC", { timeZone:"America/Guayaquil" }) === todayStr(); }catch(e){ return false; } }).length;
    document.getElementById("stMovil").textContent = arr.filter(function(p){ return p.origen && /Móvil/.test(p.origen.dispositivo); }).length;
    document.getElementById("stNuevos").textContent = arr.filter(function(p){ return (p.estado || "Nuevo") === "Nuevo"; }).length;
    var tbody = document.getElementById("prospBody");
    var empty = document.getElementById("emptyBox");
    var tableWrap = document.getElementById("tblWrap");
    tbody.innerHTML = "";
    if(!arr.length){ empty.style.display = "block"; tableWrap.style.display = "none"; return; }
    empty.style.display = "none"; tableWrap.style.display = "block";
    arr.forEach(function(p){
      var o = p.origen || {};
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td><b>" + esc(p.nombre) + "</b><span class='sub'>" + esc(p.negocio) + "</span><span class='sub'>" + esc(p.contacto) + "</span></td>" +
        "<td>" + esc(p.necesidad) + "<span class='sub'>Presupuesto: " + esc(p.presupuesto) + "</span></td>" +
        "<td class='msg'>" + esc(p.mensaje) + "</td>" +
        "<td>" + esc(o.pagina || "—") + "<span class='sub'>" + esc(o.utm || "") + "</span><span class='sub'>" + esc(o.referrer || "") + "</span></td>" +
        "<td>" + esc(p.fecha) + "<span class='sub'>" + esc(o.dispositivo || "") + "</span></td>" +
        "<td><span class='badge " + ((p.estado || "Nuevo") === "Nuevo" ? "live" : "") + "'>" + esc(p.estado || "Nuevo") + "</span>" +
        ((p.estado || "Nuevo") === "Nuevo" ? "<br><button type='button' class='btn btn-ghost btn-sm' data-contact='" + esc(p.docId) + "' style='margin-top:8px'>Marcar contactado</button>" : "") + "</td>";
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("[data-contact]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-contact");
        btn.disabled = true;
        db.collection("prospectos").doc(id).update({ estado: "Contactado" }).catch(function(){
          btn.disabled = false;
        });
      });
    });
  }

  function startListening(){
    if(unsubscribe) return;
    unsubscribe = db.collection("prospectos").orderBy("fechaISO", "desc").onSnapshot(function(snap){
      prospectos = snap.docs.map(function(d){
        var datos = d.data() || {};
        datos.docId = d.id;
        return datos;
      });
      render();
    }, function(){
      showErr("No se pudieron cargar los prospectos. Revisa tu conexión e inténtalo de nuevo.");
    });
  }
  function stopListening(){
    if(unsubscribe){ unsubscribe(); unsubscribe = null; }
    prospectos = [];
  }

  function showAdmin(){
    if(lock) lock.style.display = "none";
    if(admin) admin.style.display = "block";
    startListening();
  }
  function showLock(){
    stopListening();
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

  var exp = document.getElementById("btnCsv");
  if(exp) exp.addEventListener("click", function(){
    var arr = prospectos; if(!arr.length) return;
    var rows = [["Fecha","Nombre","Negocio","Necesidad","Presupuesto","Contacto","Mensaje","Página de origen","Referrer","UTM","Dispositivo","Estado"]];
    arr.forEach(function(p){ var o = p.origen || {}; rows.push([p.fecha, p.nombre, p.negocio, p.necesidad, p.presupuesto, p.contacto, p.mensaje, o.pagina || "", o.referrer || "", o.utm || "", o.dispositivo || "", p.estado || "Nuevo"]); });
    var csv = rows.map(function(r){ return r.map(function(c){ return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type:"text/csv;charset=utf-8" }));
    a.download = "prospectos-pixelandina.csv"; a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 800);
  });

  var logout = document.getElementById("btnLogout");
  if(logout) logout.addEventListener("click", function(){
    auth.signOut();
  });
})();
