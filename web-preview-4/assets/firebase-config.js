/* ============================================================
   CONFIG_FIREBASE — PixelAndina · Repositorio de prospectos
   ------------------------------------------------------------
   ÚNICO lugar donde van las claves del proyecto de Firebase.
   Reemplaza CADA valor de ejemplo por el de tu proyecto:
   Consola de Firebase → ⚙ Configuración del proyecto →
   General → Tus apps → (app web) → Configuración del SDK.
   Los pasos completos están en SETUP.md (pasos 1 a 3).
   Estos valores NO son secretos de servidor: identifican el
   proyecto; la seguridad real la dan firestore.rules y el
   inicio de sesión de Firebase Auth.
   ============================================================ */
window.PA_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDfDsT0rdBxPqPSFMp934eseXSH5S5lgn4",
  authDomain: "pixelandina-web.firebaseapp.com",
  projectId: "pixelandina-web",
  storageBucket: "pixelandina-web.firebasestorage.app",
  messagingSenderId: "478844444487",
  appId: "1:478844444487:web:00387f9a391af43dd6b662"
};

/* Inicialización (SDK compat 10.12.2, patrón de la casa).
   Expone window.PA_FIREBASE = { db, auth } o null si el SDK
   no cargó o la configuración sigue sin reemplazar. */
window.PA_FIREBASE = (function(){
  "use strict";
  try{
    if(typeof firebase === "undefined") return null;
    if(!window.PA_FIREBASE_CONFIG || window.PA_FIREBASE_CONFIG.projectId.indexOf("PEGA_AQUI") === 0) return null;
    if(!firebase.apps.length) firebase.initializeApp(window.PA_FIREBASE_CONFIG);
    return { db: firebase.firestore(), auth: firebase.auth() };
  }catch(e){
    return null;
  }
})();
