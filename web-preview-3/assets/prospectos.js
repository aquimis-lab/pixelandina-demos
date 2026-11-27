/* PixelAndina v2 — Vista interna de prospectos (SOLO vista previa).
   Lee el almacén local de demostración que llena el formulario de
   ventas. En producción esta vista vive tras el acceso real de
   Anthony (patrón Firebase de la casa) y lee la base de datos real.
   Código de acceso de DEMOSTRACIÓN para la vista previa: pixelandina */
(function(){
  "use strict";
  var LS_KEY = "pa_prospects_v2";
  var DEMO_CODE = "pixelandina";
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function load(){ try{ var a = JSON.parse(localStorage.getItem(LS_KEY) || "[]"); return Array.isArray(a) ? a : []; }catch(e){ return []; } }
  function store(a){ try{ localStorage.setItem(LS_KEY, JSON.stringify(a)); }catch(e){} }

  var lock = document.getElementById("lockBox");
  var admin = document.getElementById("adminView");
  var lockForm = document.getElementById("lockForm");
  var lockErr = document.getElementById("lockErr");

  function todayStr(){ return new Date().toLocaleDateString("es-EC", { timeZone:"America/Guayaquil" }); }

  function render(){
    var arr = load();
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
    arr.forEach(function(p, idx){
      var o = p.origen || {};
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td><b>" + esc(p.nombre) + "</b><span class='sub'>" + esc(p.negocio) + "</span><span class='sub'>" + esc(p.contacto) + "</span></td>" +
        "<td>" + esc(p.necesidad) + "<span class='sub'>Presupuesto: " + esc(p.presupuesto) + "</span></td>" +
        "<td class='msg'>" + esc(p.mensaje) + "</td>" +
        "<td>" + esc(o.pagina || "—") + "<span class='sub'>" + esc(o.utm || "") + "</span><span class='sub'>" + esc(o.referrer || "") + "</span></td>" +
        "<td>" + esc(p.fecha) + "<span class='sub'>" + esc(o.dispositivo || "") + "</span></td>" +
        "<td><span class='badge " + ((p.estado || "Nuevo") === "Nuevo" ? "live" : "") + "'>" + esc(p.estado || "Nuevo") + "</span>" +
        ((p.estado || "Nuevo") === "Nuevo" ? "<br><button type='button' class='btn btn-ghost btn-sm' data-contact='" + idx + "' style='margin-top:8px'>Marcar contactado</button>" : "") + "</td>";
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll("[data-contact]").forEach(function(btn){
      btn.addEventListener("click", function(){
        var a = load(); var i = parseInt(btn.getAttribute("data-contact"), 10);
        if(a[i]){ a[i].estado = "Contactado"; store(a); render(); }
      });
    });
  }

  function unlock(){
    if(lock) lock.style.display = "none";
    if(admin) admin.style.display = "block";
    render();
  }
  if(lockForm){
    lockForm.addEventListener("submit", function(e){
      e.preventDefault();
      var v = (document.getElementById("lockCode").value || "").trim().toLowerCase();
      if(v === DEMO_CODE){ try{ sessionStorage.setItem("pa_admin", "1"); }catch(err){} unlock(); }
      else if(lockErr){ lockErr.textContent = "Código incorrecto. En esta vista previa el código de demostración es «pixelandina»."; lockErr.classList.add("show"); }
    });
  }
  try{ if(sessionStorage.getItem("pa_admin") === "1") unlock(); }catch(e){}

  var exp = document.getElementById("btnCsv");
  if(exp) exp.addEventListener("click", function(){
    var arr = load(); if(!arr.length) return;
    var rows = [["Fecha","Nombre","Negocio","Necesidad","Presupuesto","Contacto","Mensaje","Página de origen","Referrer","UTM","Dispositivo","Estado"]];
    arr.forEach(function(p){ var o = p.origen || {}; rows.push([p.fecha, p.nombre, p.negocio, p.necesidad, p.presupuesto, p.contacto, p.mensaje, o.pagina || "", o.referrer || "", o.utm || "", o.dispositivo || "", p.estado || "Nuevo"]); });
    var csv = rows.map(function(r){ return r.map(function(c){ return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type:"text/csv;charset=utf-8" }));
    a.download = "prospectos-pixelandina.csv"; a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 800);
  });
  var wipe = document.getElementById("btnWipe");
  if(wipe) wipe.addEventListener("click", function(){
    if(confirm("¿Borrar todas las solicitudes de demostración guardadas en este navegador?")){
      try{ localStorage.removeItem(LS_KEY); }catch(e){}
      render();
    }
  });
})();
