/* PixelAndina · Escenas 3D (v4): inclinación, rotadores, contadores
   propios y pasos que avanzan solos. No toca .rv / [data-count] /
   [data-h], que ya maneja assets/app.js. */
(function(){
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* --- Inclinación 3D por escena (solo puntero fino) --- */
  if(!reduce && finePointer){
    document.querySelectorAll(".esc-scene").forEach(function(scene){
      var tilt = scene.querySelector(".esc-tilt");
      if(!tilt) return;
      var raf = null;
      scene.addEventListener("mousemove", function(e){
        if(raf) return;
        raf = requestAnimationFrame(function(){
          raf = null;
          var r = scene.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - .5;
          var y = (e.clientY - r.top) / r.height - .5;
          tilt.style.transform = "rotateY(" + (x * 7).toFixed(2) + "deg) rotateX(" + (-y * 5).toFixed(2) + "deg)";
        });
      });
      scene.addEventListener("mouseleave", function(){ tilt.style.transform = "rotateY(0deg) rotateX(0deg)"; });
    });
  }

  /* --- Rotadores de notificaciones: [data-esc-rot] con .esc-rot-item --- */
  document.querySelectorAll("[data-esc-rot]").forEach(function(box){
    var items = box.querySelectorAll(".esc-rot-item");
    if(items.length < 2) return;
    items.forEach(function(it, i){ it.classList.toggle("on", i === 0); });
    if(reduce) return;
    var ms = parseInt(box.getAttribute("data-esc-rot"), 10) || 4600;
    var i = 0;
    setInterval(function(){
      items[i].classList.remove("on");
      i = (i + 1) % items.length;
      items[i].classList.add("on");
    }, ms);
  });

  /* --- Contadores propios con decimales: [data-esc-count] --- */
  function formatNum(v, dec){
    return v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function animateEscCount(el){
    var to = parseFloat(el.getAttribute("data-esc-count"));
    if(isNaN(to)) return;
    var dec = parseInt(el.getAttribute("data-esc-dec") || "0", 10);
    if(reduce){ el.textContent = formatNum(to, dec); return; }
    var t0 = null, dur = 1500;
    function step(ts){
      if(!t0) t0 = ts;
      var k = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = formatNum(to * e, dec);
      if(k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function escBars(scope){
    scope.querySelectorAll("[data-esc-w]").forEach(function(b){ b.style.width = b.getAttribute("data-esc-w") + "%"; });
  }
  var watched = document.querySelectorAll("[data-esc-count], [data-esc-w]");
  if(watched.length){
    if("IntersectionObserver" in window && !reduce){
      var done = new WeakSet();
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(!en.isIntersecting) return;
          var host = en.target.closest(".esc-scene, .esc-panel, .esc-fcard") || en.target;
          if(done.has(host)) return; done.add(host);
          host.querySelectorAll("[data-esc-count]").forEach(animateEscCount);
          escBars(host);
          io.unobserve(en.target);
        });
      }, { threshold:.3 });
      watched.forEach(function(el){ io.observe(el); });
    } else {
      document.querySelectorAll("[data-esc-count]").forEach(animateEscCount);
      escBars(document);
    }
  }

  /* --- Pasos de proyecto que avanzan solos: [data-esc-steps] --- */
  document.querySelectorAll("[data-esc-steps]").forEach(function(box){
    var steps = box.querySelectorAll(".esc-step");
    if(steps.length < 2) return;
    var idx = 0;
    function paint(){
      steps.forEach(function(s, i){
        s.classList.toggle("done", i < idx);
        s.classList.toggle("active", i === idx);
        var d = s.querySelector(".dotp");
        if(d) d.textContent = i < idx ? "✓" : String(i + 1);
      });
    }
    idx = 1; paint();
    if(reduce) return;
    setInterval(function(){
      idx = idx >= steps.length - 1 ? 0 : idx + 1;
      paint();
    }, 2300);
  });
})();
