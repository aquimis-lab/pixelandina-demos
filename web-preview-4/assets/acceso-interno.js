/* PixelAndina · Acceso interno (acceso-interno.html).
   Puerta única interna: solo Firebase Auth (sin Firestore).
   Si el correo de la sesión es el del administrador, muestra las
   dos puertas (Prospectos y Clientes); otro correo ve el aviso de
   zona restringida; sin sesión, solo el formulario de ingreso. */
(function(){
  "use strict";

  var ADMIN_EMAIL = "tonnylve2@gmail.com";

  var lock = document.getElementById("lockBox");
  var admin = document.getElementById("adminView");
  var denied = document.getElementById("deniedView");
  var lockForm = document.getElementById("lockForm");
  var lockErr = document.getElementById("lockErr");

  function showErr(msg){ if(lockErr){ lockErr.textContent = msg; lockErr.classList.add("show"); } }
  function hideErr(){ if(lockErr){ lockErr.textContent = ""; lockErr.classList.remove("show"); } }

  function show(el){
    [lock, admin, denied].forEach(function(v){ if(v) v.style.display = "none"; });
    if(el) el.style.display = "block";
  }

  if(!window.PA_FIREBASE || !window.PA_FIREBASE.auth){
    if(lockForm) lockForm.style.display = "none";
    showErr("La conexión con el acceso no está configurada todavía. Revisa assets/firebase-config.js.");
    return;
  }
  var auth = window.PA_FIREBASE.auth;

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
    if(!user){ show(lock); return; }
    if((user.email || "").toLowerCase() === ADMIN_EMAIL){
      var who = document.getElementById("adminEmail");
      if(who) who.textContent = user.email;
      show(admin);
    } else {
      show(denied);
    }
  });

  ["btnLogout", "btnLogout2"].forEach(function(id){
    var b = document.getElementById(id);
    if(b) b.addEventListener("click", function(){ auth.signOut(); });
  });
})();
