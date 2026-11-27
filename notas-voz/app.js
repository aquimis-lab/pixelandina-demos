/* PixelAndina — Demo interactiva: Notas de Voz y Reuniones en Español
   Todo es simulado en el navegador, con datos ficticios. Sin backend.
   La lógica vive en DemoCore (pura, probada en Node) y la capa DOM la usa. */
(function () {
  "use strict";

  /* ================================================================
     NÚCLEO DE LÓGICA (sin DOM)
     ================================================================ */
  var DemoCore = (function () {

    /* Audios ficticios de «Comercial Andina — Demo».
       Cada audio trae su transcripción con marcas de tiempo (segundos),
       el resumen y los acuerdos que la IA mostraría, y las tareas
       extraídas con responsable, fecha y estado. */
    function seedAudios() {
      return [
        {
          id: "AUD-001",
          type: "Nota de voz",
          title: "Pedido urgente de la Tienda El Sol",
          speakers: "Carlos Méndez (gerente)",
          duration: 84,
          date: "Hoy, 09:12",
          transcript: [
            { t: 0,  speaker: "Carlos Méndez", text: "Buenos días, equipo. Les dejo esta nota porque la Tienda El Sol nos confirmó un pedido urgente y hay que moverlo hoy mismo." },
            { t: 14, speaker: "Carlos Méndez", text: "Pidieron cuarenta kilos de arroz, veinte litros de aceite y diez quesos frescos para mañana a primera hora, porque tienen un evento el fin de semana." },
            { t: 32, speaker: "Carlos Méndez", text: "María, por favor confirma el stock de arroz y aceite antes de las once, porque si falta algo hay que pedirlo al proveedor hoy." },
            { t: 50, speaker: "Carlos Méndez", text: "Yo me encargo de enviar la cotización actualizada con el descuento por volumen que acordamos la semana pasada." },
            { t: 66, speaker: "Carlos Méndez", text: "Y Jorge coordina la entrega para mañana a las siete, con la factura lista desde hoy en la tarde." }
          ],
          summary: [
            "La Tienda El Sol confirmó un pedido urgente: 40 kg de arroz, 20 L de aceite y 10 quesos frescos.",
            "La entrega quedó para mañana a las 07:00 por un evento del fin de semana del cliente.",
            "Si falta stock, el pedido al proveedor debe salir hoy mismo."
          ],
          agreements: [
            "Aplicar el descuento por volumen acordado la semana pasada.",
            "La factura se deja lista desde hoy en la tarde."
          ],
          tasks: [
            { id: "T-001", owner: "María Fernanda", task: "Confirmar el stock de arroz y aceite", due: "Hoy, 11:00", done: false },
            { id: "T-002", owner: "Carlos Méndez", task: "Enviar la cotización actualizada a la Tienda El Sol", due: "Hoy", done: true },
            { id: "T-003", owner: "Jorge Paredes", task: "Coordinar la entrega de mañana a las 07:00", due: "Mañana", done: false }
          ]
        },
        {
          id: "AUD-002",
          type: "Reunión",
          title: "Reunión semanal de operaciones",
          speakers: "Carlos, María, Jorge y Lucía",
          duration: 1120,
          date: "Ayer, 16:30",
          transcript: [
            { t: 0,   speaker: "Carlos Méndez", text: "Buenas tardes a todos. Empezamos la reunión semanal de operaciones: primero ventas, después bodega y cerramos con administración." },
            { t: 95,  speaker: "María Fernanda", text: "En ventas cerramos la semana con doce pedidos nuevos. La Tienda El Sol y el Restaurante Doña Rosa son los clientes que más crecieron." },
            { t: 210, speaker: "María Fernanda", text: "Doña Rosa pidió que le preparemos una propuesta de precios por volumen para los próximos tres meses. Me comprometo a tenerla el jueves." },
            { t: 330, speaker: "Jorge Paredes", text: "En bodega todo está ordenado, pero el detergente en polvo está por debajo del mínimo. Hay que reponerlo esta semana para no quedarnos cortos." },
            { t: 470, speaker: "Jorge Paredes", text: "También noté que la cámara fría hace un ruido raro desde el lunes. Creo que hay que llamar al técnico antes de que se dañe algo." },
            { t: 610, speaker: "Lucía Torres", text: "De administración: la factura del proveedor de lácteos vence el viernes. Hay que pagarla el jueves para no perder el descuento por pronto pago." },
            { t: 760, speaker: "Lucía Torres", text: "Y los precios de la leche subieron un tres por ciento. Debo actualizar la lista de precios y avisar a los clientes mayoristas." },
            { t: 920, speaker: "Carlos Méndez", text: "Perfecto. Entonces quedan claras las tareas de cada uno. El viernes revisamos avances en la reunión corta de las nueve." }
          ],
          summary: [
            "Ventas cerró la semana con 12 pedidos nuevos; Tienda El Sol y Restaurante Doña Rosa fueron los clientes que más crecieron.",
            "Bodega reporta el detergente bajo el mínimo y un ruido extraño en la cámara fría.",
            "Administración debe pagar la factura de lácteos el jueves y actualizar la lista de precios (+3 % en la leche).",
            "El viernes a las 09:00 habrá una reunión corta de seguimiento."
          ],
          agreements: [
            "Propuesta de precios por volumen para Doña Rosa por tres meses.",
            "Pagar la factura de lácteos el jueves para conservar el descuento por pronto pago.",
            "Reunión corta de seguimiento el viernes a las 09:00."
          ],
          tasks: [
            { id: "T-004", owner: "María Fernanda", task: "Preparar la propuesta de precios por volumen para Doña Rosa", due: "Jueves", done: false },
            { id: "T-005", owner: "Jorge Paredes", task: "Reponer el detergente en polvo", due: "Esta semana", done: false },
            { id: "T-006", owner: "Jorge Paredes", task: "Llamar al técnico por el ruido de la cámara fría", due: "Esta semana", done: true },
            { id: "T-007", owner: "Lucía Torres", task: "Pagar la factura del proveedor de lácteos", due: "Jueves", done: false },
            { id: "T-008", owner: "Lucía Torres", task: "Actualizar la lista de precios y avisar a mayoristas", due: "Viernes", done: false }
          ]
        },
        {
          id: "AUD-003",
          type: "Visita a cliente",
          title: "Visita al Restaurante Doña Rosa",
          speakers: "María Fernanda (ventas)",
          duration: 125,
          date: "Hoy, 11:40",
          transcript: [
            { t: 0,   speaker: "María Fernanda", text: "Salgo de la visita al Restaurante Doña Rosa. La dueña está contenta con la calidad, pero dice que el queso le llegó dos días tarde la semana pasada." },
            { t: 38,  speaker: "María Fernanda", text: "Me pidió cotización de café molido y aceite para sumar a su pedido fijo de cada semana." },
            { t: 72,  speaker: "María Fernanda", text: "Quedamos en que le envío la cotización hoy mismo y que la próxima entrega sale el lunes a las ocho, sin falta." },
            { t: 100, speaker: "María Fernanda", text: "También hay que agendar una visita de seguimiento en dos semanas para revisar cómo va el nuevo pedido." }
          ],
          summary: [
            "Doña Rosa está satisfecha con la calidad, pero reportó una entrega de queso con dos días de atraso.",
            "Pidió sumar café molido y aceite a su pedido semanal fijo.",
            "La próxima entrega quedó fijada para el lunes a las 08:00."
          ],
          agreements: [
            "Cotización de café y aceite enviada hoy.",
            "Visita de seguimiento en dos semanas."
          ],
          tasks: [
            { id: "T-009", owner: "María Fernanda", task: "Enviar la cotización de café y aceite a Doña Rosa", due: "Hoy", done: false },
            { id: "T-010", owner: "María Fernanda", task: "Agendar la visita de seguimiento en dos semanas", due: "En 2 semanas", done: false },
            { id: "T-011", owner: "Jorge Paredes", task: "Asegurar la entrega del lunes a las 08:00", due: "Lunes", done: false }
          ]
        },
        {
          id: "AUD-004",
          type: "Reunión",
          title: "Reunión con el proveedor de lácteos",
          speakers: "Carlos Méndez y Andrés Salazar (proveedor)",
          duration: 750,
          date: "Ayer, 10:00",
          transcript: [
            { t: 0,   speaker: "Carlos Méndez", text: "Gracias por venir, Andrés. Queremos revisar la lista de precios y los tiempos de entrega de los lácteos." },
            { t: 120, speaker: "Andrés Salazar", text: "Claro, Carlos. Este mes la leche sube un tres por ciento por costos de transporte, pero el queso y la mantequilla se mantienen." },
            { t: 300, speaker: "Carlos Méndez", text: "Aceptamos el ajuste de la leche si nos mantienen la entrega de los martes y viernes sin costo adicional." },
            { t: 480, speaker: "Andrés Salazar", text: "De acuerdo. Les envío la lista actualizada hoy y el primer despacho con el nuevo precio sale el martes." },
            { t: 620, speaker: "Carlos Méndez", text: "Perfecto. Entonces Lucía confirma el pedido del martes y revisamos el acuerdo en un mes." }
          ],
          summary: [
            "La leche sube 3 % por transporte; el queso y la mantequilla mantienen su precio.",
            "Se mantienen las entregas de martes y viernes sin costo adicional.",
            "El primer despacho con el nuevo precio sale el martes."
          ],
          agreements: [
            "Aceptar el ajuste de la leche a cambio de entregas sin costo adicional.",
            "Revisar el acuerdo comercial en un mes."
          ],
          tasks: [
            { id: "T-012", owner: "Andrés Salazar (proveedor)", task: "Enviar la lista de precios actualizada", due: "Hoy", done: true },
            { id: "T-013", owner: "Lucía Torres", task: "Confirmar el pedido de lácteos del martes", due: "Lunes", done: false }
          ]
        },
        {
          id: "AUD-005",
          type: "Nota de voz",
          title: "Novedades de bodega",
          speakers: "Jorge Paredes (bodega)",
          duration: 58,
          date: "Hoy, 07:45",
          transcript: [
            { t: 0,  speaker: "Jorge Paredes", text: "Buenos días. Novedades de bodega: llegó el pedido de granos y ya está acomodado en el pasillo dos." },
            { t: 22, speaker: "Jorge Paredes", text: "El detergente sigue bajo, quedan solo tres cajas, así que hay que comprarlo esta semana." },
            { t: 40, speaker: "Jorge Paredes", text: "Y dejo registrado que el montacargas quedó con la batería cargada y listo para la entrega de mañana." }
          ],
          summary: [
            "Llegó el pedido de granos y quedó acomodado en el pasillo 2.",
            "El detergente está bajo: quedan solo 3 cajas."
          ],
          agreements: [],
          tasks: [
            { id: "T-014", owner: "Jorge Paredes", task: "Comprar detergente en polvo esta semana", due: "Esta semana", done: false },
            { id: "T-015", owner: "Jorge Paredes", task: "Registrar el estado del montacargas en la bitácora", due: "Hoy", done: true }
          ]
        }
      ];
    }

    function freshState() {
      return { audios: seedAudios(), selectedId: "AUD-001", nextAudio: 6, nextTask: 16 };
    }

    function audioById(state, id) {
      return state.audios.filter(function (a) { return a.id === id; })[0] || null;
    }

    function formatTime(sec) {
      sec = Math.max(0, Math.floor(sec));
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return m + ":" + ("0" + s).slice(-2);
    }

    /* Marca o desmarca una tarea de un audio. */
    function toggleTask(state, audioId, taskId) {
      var a = audioById(state, audioId);
      if (!a) return { ok: false, error: "Ese audio ya no existe." };
      var t = a.tasks.filter(function (x) { return x.id === taskId; })[0] || null;
      if (!t) return { ok: false, error: "Esa tarea ya no existe." };
      t.done = !t.done;
      return { ok: true, task: t, audio: a };
    }

    /* ---------- Procesamiento simulado de una nota nueva ----------
       Lógica simple y transparente (en el servicio real esto lo hace
       un modelo de IA; aquí son reglas visibles):
       - El resumen son las primeras frases del texto (máx. 3).
       - Una frase es tarea si contiene «debe», «hay que», «tiene que»
         o empieza por un verbo de acción de la lista.
       - El responsable se toma de un «Nombre debe / tiene que…» al
         inicio de la frase; si no aparece, queda «Sin asignar».
       - La fecha se busca entre palabras conocidas: hoy, mañana,
         días de la semana, «esta semana», etc. */
    var ACTION_VERBS = [
      "llamar", "enviar", "revisar", "preparar", "coordinar", "comprar",
      "pagar", "agendar", "confirmar", "entregar", "visitar", "cotizar",
      "actualizar", "programar", "contactar", "solicitar", "registrar",
      "organizar", "imprimir", "archivar", "presentar", "negociar",
      "reponer", "reportar", "verificar", "elaborar", "redactar",
      "gestionar", "recoger", "despachar", "reparar", "cargar",
      "facturar", "cobrar", "instalar", "tramitar"
    ];

    var DUE_WORDS = [
      "pasado mañana", "esta semana", "esta tarde", "esta noche",
      "el lunes", "el martes", "el miércoles", "el jueves",
      "el viernes", "el sábado", "el domingo",
      "mañana", "hoy"
    ];

    function splitSentences(text) {
      var out = [];
      String(text || "").split(/\n+/).forEach(function (line) {
        line.split(/(?<=[.!?])\s+/).forEach(function (part) {
          var s = part.trim();
          if (s.length >= 8) out.push(s);
        });
      });
      return out;
    }

    function capitalize(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function findDue(sentence) {
      var low = " " + sentence.toLowerCase() + " ";
      for (var i = 0; i < DUE_WORDS.length; i++) {
        if (low.indexOf(" " + DUE_WORDS[i]) !== -1 || low.indexOf(" " + DUE_WORDS[i] + " ") !== -1) {
          return capitalize(DUE_WORDS[i]);
        }
      }
      return "Por definir";
    }

    function analyzeSentence(sentence) {
      var low = sentence.toLowerCase();
      var hasCue = /(^|\s)(debe|hay que|tiene que|toca)\b/.test(low);
      var firstWord = low.split(/\s+/)[0].replace(/[^a-záéíóúñ]/g, "");
      var startsWithVerb = ACTION_VERBS.indexOf(firstWord) !== -1;
      if (!hasCue && !startsWithVerb) return null;

      var owner = "Sin asignar";
      var m = sentence.match(/^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)\s+(debe|tiene que|va a)\b/);
      if (m) owner = m[1];

      var taskText = sentence.replace(/[.\s]+$/, "");
      return { owner: owner, task: capitalize(taskText), due: findDue(sentence) };
    }

    /* Duración estimada de una nota según sus palabras:
       se habla a unas 150 palabras por minuto. */
    function estimateDuration(text) {
      var words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
      return Math.max(15, Math.round(words / 150 * 60));
    }

    var TYPE_LABEL = {
      "Nota de voz": "Nota rápida",
      "Reunión": "Reunión",
      "Visita a cliente": "Visita a cliente"
    };

    function processNote(state, type, title, text) {
      text = String(text || "").trim();
      if (text.split(/\s+/).filter(Boolean).length < 8) {
        return { ok: false, error: "Escribe un texto un poco más completo (al menos unas 8 palabras), como si fuera la transcripción del audio." };
      }
      var sentences = splitSentences(text);
      if (sentences.length === 0) {
        return { ok: false, error: "No se pudo leer el texto. Escribe frases completas separadas por puntos." };
      }
      var summary = sentences.slice(0, 3).map(function (s) {
        return s.length > 160 ? s.slice(0, 157).trim() + "…" : s;
      });
      var found = [];
      sentences.forEach(function (s) {
        var t = analyzeSentence(s);
        if (t) found.push(t);
      });

      var id = "AUD-" + ("00" + state.nextAudio).slice(-3);
      state.nextAudio += 1;
      var tasks = found.map(function (t) {
        var task = { id: "T-" + ("00" + state.nextTask).slice(-3), owner: t.owner, task: t.task, due: t.due, done: false };
        state.nextTask += 1;
        return task;
      });

      var audio = {
        id: id,
        type: TYPE_LABEL[type] ? type : "Nota de voz",
        title: String(title || "").trim() || ((TYPE_LABEL[type] || "Nota") + " — procesada en la demo"),
        speakers: "Tú (nota simulada)",
        duration: estimateDuration(text),
        date: "Ahora mismo",
        transcript: [{ t: 0, speaker: "Transcripción pegada", text: text }],
        summary: summary,
        agreements: [],
        tasks: tasks
      };
      state.audios.push(audio);
      state.selectedId = id;
      return { ok: true, audio: audio, tasksFound: tasks.length };
    }

    function computeKpis(state) {
      var totalSec = 0, tasksTotal = 0, tasksDone = 0;
      state.audios.forEach(function (a) {
        totalSec += a.duration;
        a.tasks.forEach(function (t) {
          tasksTotal += 1;
          if (t.done) tasksDone += 1;
        });
      });
      return {
        processed: state.audios.length,
        /* Ahorro estimado: transcribir y sacar tareas a mano toma
           unas 3 veces la duración del audio. */
        minutesSaved: Math.round(totalSec / 60 * 3),
        tasksTotal: tasksTotal,
        tasksDone: tasksDone
      };
    }

    /* Texto plano del resultado, para el botón «Copiar resumen». */
    function summaryText(audio) {
      var lines = [];
      lines.push("RESUMEN — " + audio.title + " (" + audio.type + ", " + formatTime(audio.duration) + ")");
      lines.push("");
      lines.push("Resumen:");
      audio.summary.forEach(function (s) { lines.push("• " + s); });
      if (audio.agreements.length) {
        lines.push("");
        lines.push("Acuerdos:");
        audio.agreements.forEach(function (s) { lines.push("• " + s); });
      }
      if (audio.tasks.length) {
        lines.push("");
        lines.push("Tareas:");
        audio.tasks.forEach(function (t) {
          lines.push((t.done ? "☑ " : "☐ ") + t.task + " — " + t.owner + " · " + t.due);
        });
      }
      lines.push("");
      lines.push("Generado con Notas de Voz y Reuniones — PixelAndina");
      return lines.join("\n");
    }

    return {
      freshState: freshState,
      audioById: audioById,
      formatTime: formatTime,
      toggleTask: toggleTask,
      processNote: processNote,
      computeKpis: computeKpis,
      summaryText: summaryText,
      splitSentences: splitSentences,
      analyzeSentence: analyzeSentence
    };
  })();

  /* Export para la simulación en Node (en el navegador no se usa). */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = DemoCore;
  }
  if (typeof document === "undefined") return;

  /* ================================================================
     CAPA DOM
     ================================================================ */
  var state = DemoCore.freshState();

  var kpiProcessed = document.getElementById("kpiProcessed");
  var kpiMinutes = document.getElementById("kpiMinutes");
  var kpiTasks = document.getElementById("kpiTasks");
  var kpiTasksDone = document.getElementById("kpiTasksDone");
  var audioList = document.getElementById("audioList");
  var playerTitle = document.getElementById("playerTitle");
  var playerMeta = document.getElementById("playerMeta");
  var btnPlay = document.getElementById("btnPlay");
  var playIcon = document.getElementById("playIcon");
  var progressTrack = document.getElementById("progressTrack");
  var progressFill = document.getElementById("progressFill");
  var timeCurrent = document.getElementById("timeCurrent");
  var timeTotal = document.getElementById("timeTotal");
  var transcriptList = document.getElementById("transcriptList");
  var resultTitle = document.getElementById("resultTitle");
  var summaryList = document.getElementById("summaryList");
  var agreementsList = document.getElementById("agreementsList");
  var tasksList = document.getElementById("tasksList");
  var activityList = document.getElementById("activityList");

  var TYPE_ICON = { "Nota de voz": "🎙", "Reunión": "👥", "Visita a cliente": "🚶" };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showError(el, msg) {
    el.textContent = msg || "";
    el.classList.toggle("show", !!msg);
  }

  function logActivity(text) {
    var li = document.createElement("li");
    li.textContent = text;
    activityList.insertBefore(li, activityList.firstChild);
    while (activityList.children.length > 6) {
      activityList.removeChild(activityList.lastChild);
    }
  }

  function selected() { return DemoCore.audioById(state, state.selectedId); }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var k = DemoCore.computeKpis(state);
    kpiProcessed.textContent = k.processed;
    kpiMinutes.textContent = k.minutesSaved;
    kpiTasks.textContent = k.tasksTotal;
    kpiTasksDone.textContent = k.tasksDone;
  }

  /* ---------- Lista de audios ---------- */
  function renderAudioList() {
    audioList.innerHTML = "";
    state.audios.slice().reverse().forEach(function (a) {
      var doneCount = a.tasks.filter(function (t) { return t.done; }).length;
      var li = document.createElement("li");
      li.className = "audio-item" + (a.id === state.selectedId ? " selected" : "");
      li.innerHTML =
        '<span class="audio-icon" aria-hidden="true">' + (TYPE_ICON[a.type] || "🎧") + "</span>" +
        '<span class="audio-info">' +
          "<strong>" + escapeHtml(a.title) + "</strong>" +
          '<span class="audio-meta">' + escapeHtml(a.type) + " · " + escapeHtml(a.speakers) + "</span>" +
          '<span class="audio-meta">' + escapeHtml(a.date) + " · " + a.tasks.length + " tareas (" + doneCount + " listas)</span>" +
        "</span>" +
        '<span class="audio-duration">' + DemoCore.formatTime(a.duration) + "</span>";
      li.addEventListener("click", function () { selectAudio(a.id); });
      audioList.appendChild(li);
    });
  }

  /* ---------- Reproductor simulado ---------- */
  var player = { playing: false, pos: 0, timer: null };
  var SPEED = 10; /* la demo reproduce ×10 para no esperar el audio completo */

  function stopTimer() {
    if (player.timer) { clearInterval(player.timer); player.timer = null; }
    player.playing = false;
    playIcon.textContent = "▶";
  }

  function startTimer() {
    var a = selected();
    if (!a) return;
    if (player.pos >= a.duration) player.pos = 0;
    player.playing = true;
    playIcon.textContent = "⏸";
    player.timer = setInterval(function () {
      player.pos += 0.2 * SPEED;
      if (player.pos >= a.duration) {
        player.pos = a.duration;
        stopTimer();
        logActivity("▶ Terminó la reproducción de «" + a.title + "». La transcripción ya estaba lista desde el inicio: así trabaja el servicio.");
      }
      renderPlayerProgress();
    }, 200);
  }

  btnPlay.addEventListener("click", function () {
    if (player.playing) {
      stopTimer();
      renderPlayerProgress();
    } else {
      startTimer();
      renderPlayerProgress();
    }
  });

  progressTrack.addEventListener("click", function (ev) {
    var a = selected();
    if (!a) return;
    var rect = progressTrack.getBoundingClientRect();
    var frac = (ev.clientX - rect.left) / rect.width;
    player.pos = Math.min(a.duration, Math.max(0, frac * a.duration));
    renderPlayerProgress();
  });

  function activeSegmentIndex(a) {
    var idx = 0;
    a.transcript.forEach(function (seg, i) {
      if (player.pos >= seg.t) idx = i;
    });
    return idx;
  }

  function renderPlayerProgress() {
    var a = selected();
    if (!a) return;
    var pct = a.duration ? (player.pos / a.duration) * 100 : 0;
    progressFill.style.width = pct + "%";
    progressTrack.setAttribute("aria-valuenow", Math.round(pct));
    timeCurrent.textContent = DemoCore.formatTime(player.pos);
    timeTotal.textContent = DemoCore.formatTime(a.duration);
    var active = activeSegmentIndex(a);
    transcriptList.querySelectorAll(".seg").forEach(function (el, i) {
      el.classList.toggle("active", i === active);
    });
  }

  /* ---------- Transcripción ---------- */
  function renderTranscript() {
    var a = selected();
    transcriptList.innerHTML = "";
    if (!a) return;
    a.transcript.forEach(function (seg) {
      var div = document.createElement("div");
      div.className = "seg";
      div.innerHTML =
        '<button type="button" class="seg-time">' + DemoCore.formatTime(seg.t) + "</button>" +
        '<div class="seg-body"><strong>' + escapeHtml(seg.speaker) + ":</strong> " + escapeHtml(seg.text) + "</div>";
      div.querySelector(".seg-time").addEventListener("click", function () {
        player.pos = seg.t;
        if (!player.playing) startTimer();
        renderPlayerProgress();
      });
      transcriptList.appendChild(div);
    });
  }

  /* ---------- Resultado con IA ---------- */
  function renderResult() {
    var a = selected();
    if (!a) return;
    resultTitle.textContent = a.title;
    playerTitle.textContent = a.title;
    playerMeta.textContent = a.type + " · Habla: " + a.speakers + " · " + a.date + " · Duración " + DemoCore.formatTime(a.duration);

    summaryList.innerHTML = "";
    a.summary.forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s;
      summaryList.appendChild(li);
    });

    agreementsList.innerHTML = "";
    if (a.agreements.length === 0) {
      var liNone = document.createElement("li");
      liNone.className = "none";
      liNone.textContent = "Sin acuerdos registrados en este audio.";
      agreementsList.appendChild(liNone);
    }
    a.agreements.forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s;
      agreementsList.appendChild(li);
    });

    tasksList.innerHTML = "";
    if (a.tasks.length === 0) {
      var liNo = document.createElement("li");
      liNo.className = "none";
      liNo.textContent = "La IA no detectó tareas en este audio.";
      tasksList.appendChild(liNo);
    }
    a.tasks.forEach(function (t) {
      var li = document.createElement("li");
      li.className = "task-item" + (t.done ? " done" : "");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = t.done;
      cb.setAttribute("aria-label", "Marcar tarea: " + t.task);
      cb.addEventListener("change", function () {
        var res = DemoCore.toggleTask(state, a.id, t.id);
        if (!res.ok) return;
        logActivity((res.task.done ? "✅ Tarea completada: «" : "↩ Tarea reabierta: «") + res.task.task + "» (" + res.task.owner + ").");
        renderAll();
      });
      var body = document.createElement("span");
      body.className = "task-body";
      body.innerHTML = "<strong>" + escapeHtml(t.task) + "</strong>" +
        '<span class="task-meta">' + escapeHtml(t.owner) + " · " + escapeHtml(t.due) + "</span>";
      li.appendChild(cb);
      li.appendChild(body);
      tasksList.appendChild(li);
    });
  }

  /* ---------- Copiar resumen ---------- */
  document.getElementById("btnCopySummary").addEventListener("click", function () {
    var a = selected();
    if (!a) return;
    var text = DemoCore.summaryText(a);
    var done = function () {
      logActivity("📋 Resumen de «" + a.title + "» copiado: listo para pegarlo en WhatsApp, en el correo o en el acta de la reunión.");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  });

  /* ---------- Selección de audio ---------- */
  function selectAudio(id) {
    if (!DemoCore.audioById(state, id)) return;
    state.selectedId = id;
    stopTimer();
    player.pos = 0;
    renderAll();
  }

  /* ---------- Nueva nota ---------- */
  document.getElementById("noteForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var errEl = document.getElementById("noteError");
    var type = document.getElementById("noteType").value;
    var title = document.getElementById("noteTitle").value;
    var text = document.getElementById("noteText").value;
    var res = DemoCore.processNote(state, type, title, text);
    if (!res.ok) { showError(errEl, res.error); return; }
    showError(errEl, "");
    stopTimer();
    player.pos = 0;
    logActivity("✨ Nota procesada: «" + res.audio.title + "» (" + DemoCore.formatTime(res.audio.duration) + " estimados). La IA generó el resumen y extrajo " + res.tasksFound + (res.tasksFound === 1 ? " tarea." : " tareas."));
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteText").value = "";
    renderAll();
  });

  /* ---------- Render general ---------- */
  function renderAll() {
    renderKpis();
    renderAudioList();
    renderResult();
    renderTranscript();
    renderPlayerProgress();
  }

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = DemoCore.freshState();
    stopTimer();
    player.pos = 0;
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteText").value = "";
    showError(document.getElementById("noteError"), "");
    activityList.innerHTML = "<li>🟢 El servicio está activo: cada audio nuevo llega ya transcrito, con resumen y tareas.</li>";
    renderAll();
  });

  /* ---------- Arranque ---------- */
  renderAll();
})();
