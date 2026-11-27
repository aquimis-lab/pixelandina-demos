/* PixelAndina — Demo interactiva: Organizador Familiar
   Todo es simulado en el navegador, con datos ficticios. Sin backend. */
(function () {
  "use strict";

  var MEMBERS = [
    { id: "mama", name: "Mamá", emoji: "👩", color: "#9333EA", bg: "#F3E8FF" },
    { id: "papa", name: "Papá", emoji: "👨", color: "#14532D", bg: "#DCFCE7" },
    { id: "hija", name: "Hija", emoji: "👧", color: "#D97706", bg: "#FEF3C7" },
    { id: "hijo", name: "Hijo", emoji: "👦", color: "#2563EB", bg: "#DBEAFE" }
  ];

  var DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  var STORAGE_KEY = "organizadorFamiliarDemoV1";

  function seedState() {
    return {
      filter: "todos",
      nextId: 100,
      events: [
        { id: 1,  day: 0, time: "07:00", title: "Escuela",                 member: "hija", icon: "🎒" },
        { id: 2,  day: 0, time: "07:00", title: "Escuela",                 member: "hijo", icon: "🎒" },
        { id: 3,  day: 0, time: "08:00", title: "Trabajo",                 member: "papa", icon: "💼" },
        { id: 4,  day: 0, time: "09:00", title: "Trabajo (turno mañana)",  member: "mama", icon: "💼" },
        { id: 5,  day: 1, time: "07:00", title: "Escuela",                 member: "hija", icon: "🎒" },
        { id: 6,  day: 1, time: "16:00", title: "Entrenamiento de fútbol", member: "hijo", icon: "⚽" },
        { id: 7,  day: 1, time: "18:30", title: "Clase de inglés",         member: "hija", icon: "📚" },
        { id: 8,  day: 2, time: "08:00", title: "Trabajo",                 member: "papa", icon: "💼" },
        { id: 9,  day: 2, time: "10:30", title: "Cita médica — control",   member: "mama", icon: "🩺" },
        { id: 10, day: 2, time: "15:00", title: "Dentista",                member: "hijo", icon: "🦷" },
        { id: 11, day: 3, time: "07:00", title: "Escuela",                 member: "hijo", icon: "🎒" },
        { id: 12, day: 3, time: "17:00", title: "Entrenamiento de fútbol", member: "hijo", icon: "⚽" },
        { id: 13, day: 3, time: "19:00", title: "Reunión de vecinos",      member: "papa", icon: "🏘️" },
        { id: 14, day: 4, time: "09:00", title: "Trabajo (turno mañana)",  member: "mama", icon: "💼" },
        { id: 15, day: 4, time: "16:30", title: "Clase de inglés",         member: "hija", icon: "📚" },
        { id: 16, day: 5, time: "11:00", title: "Cumpleaños de la abuela", member: "mama", icon: "🎂" },
        { id: 17, day: 5, time: "11:00", title: "Cumpleaños de la abuela", member: "papa", icon: "🎂" },
        { id: 18, day: 5, time: "17:00", title: "Partido amistoso",        member: "hijo", icon: "⚽" },
        { id: 19, day: 6, time: "10:00", title: "Mercado y compras",       member: "mama", icon: "🛒" },
        { id: 20, day: 6, time: "13:00", title: "Almuerzo en familia",     member: "hija", icon: "🍽️" }
      ],
      tasks: [
        { id: 21, title: "Lavar los platos del desayuno", member: "hijo", done: true },
        { id: 22, title: "Sacar la basura",               member: "papa", done: true },
        { id: 23, title: "Limpiar los baños",             member: "mama", done: false },
        { id: 24, title: "Ordenar los cuartos",           member: "hija", done: false },
        { id: 25, title: "Regar las plantas",             member: "hija", done: false },
        { id: 26, title: "Preparar la cena del domingo",  member: "mama", done: false },
        { id: 27, title: "Pasear al perro",               member: "hijo", done: false }
      ],
      shopping: [
        { id: 31, name: "Leche (2 litros)", done: true },
        { id: 32, name: "Pan",              done: true },
        { id: 33, name: "Huevos (12)",      done: false },
        { id: 34, name: "Arroz (2 kg)",     done: false },
        { id: 35, name: "Frutas de la semana", done: false },
        { id: 36, name: "Detergente",       done: false },
        { id: 37, name: "Pollo entero",     done: false }
      ],
      expenses: [
        { id: 41, concept: "Supermercado del mes", member: "mama", amount: 86.40 },
        { id: 42, concept: "Planilla de luz",      member: "papa", amount: 32.10 },
        { id: 43, concept: "Internet del hogar",   member: "papa", amount: 25.00 },
        { id: 44, concept: "Útiles escolares",     member: "mama", amount: 41.75 },
        { id: 45, concept: "Transporte y gasolina", member: "papa", amount: 38.50 },
        { id: 46, concept: "Materiales de arte de la Hija", member: "hija", amount: 12.30 }
      ]
    };
  }

  var state = seedState();

  /* ---------- Persistencia opcional (localStorage) ---------- */
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* sin persistencia */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && parsed.events && parsed.tasks && parsed.shopping && parsed.expenses) {
        state = parsed;
      }
    } catch (e) { /* se usa el estado inicial */ }
  }

  /* ---------- Referencias al DOM ---------- */
  var filtersEl   = document.getElementById("memberFilters");
  var weekGrid    = document.getElementById("weekGrid");
  var weekNote    = document.getElementById("weekNote");
  var taskList    = document.getElementById("taskList");
  var taskProgress = document.getElementById("taskProgress");
  var shopList    = document.getElementById("shopList");
  var shopProgress = document.getElementById("shopProgress");
  var expBody     = document.getElementById("expBody");
  var expTotal    = document.getElementById("expTotal");
  var expSplit    = document.getElementById("expSplit");

  function memberById(id) {
    for (var i = 0; i < MEMBERS.length; i++) if (MEMBERS[i].id === id) return MEMBERS[i];
    return MEMBERS[0];
  }
  function money(n) { return "$" + n.toFixed(2); }
  function nextId() { state.nextId += 1; return state.nextId; }

  /* Lunes de la semana actual, para mostrar las fechas reales */
  function mondayOfThisWeek() {
    var d = new Date();
    var dow = (d.getDay() + 6) % 7; // 0 = lunes
    d.setDate(d.getDate() - dow);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function todayIndex() { return (new Date().getDay() + 6) % 7; }

  /* ---------- Filtros por miembro ---------- */
  function renderFilters() {
    filtersEl.innerHTML = "";
    var all = [{ id: "todos", name: "Todos", emoji: "👨‍👩‍👧‍👦", color: "#14532D", bg: "#DCFCE7" }].concat(MEMBERS);
    all.forEach(function (m) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (state.filter === m.id ? " active" : "");
      btn.style.setProperty("--chip", m.color);
      btn.style.setProperty("--chip-bg", m.bg);
      var dot = document.createElement("span");
      dot.className = "dot";
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(m.emoji + " " + m.name));
      btn.addEventListener("click", function () {
        state.filter = m.id;
        save();
        renderFilters();
        renderWeek();
      });
      filtersEl.appendChild(btn);
    });
  }

  function fillMemberSelect(select) {
    select.innerHTML = "";
    MEMBERS.forEach(function (m) {
      var opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.emoji + " " + m.name;
      select.appendChild(opt);
    });
  }

  function whoBadge(memberId) {
    var m = memberById(memberId);
    var span = document.createElement("span");
    span.className = "who-badge";
    span.style.setProperty("--mcolor", m.color);
    span.style.setProperty("--mbg", m.bg);
    span.textContent = m.emoji + " " + m.name;
    return span;
  }

  /* ---------- Semana ---------- */
  function renderWeek() {
    var monday = mondayOfThisWeek();
    var today = todayIndex();
    weekGrid.innerHTML = "";

    var visible = state.events.filter(function (ev) {
      return state.filter === "todos" || ev.member === state.filter;
    });
    weekNote.textContent = state.filter === "todos"
      ? visible.length + " eventos esta semana entre todos"
      : "Viendo solo los eventos de " + memberById(state.filter).name + " (" + visible.length + ")";

    for (var day = 0; day < 7; day++) {
      var col = document.createElement("div");
      col.className = "day-col" + (day === today ? " today" : "");

      var date = new Date(monday);
      date.setDate(monday.getDate() + day);

      var head = document.createElement("div");
      head.className = "day-head";
      var name = document.createElement("span");
      name.textContent = DAY_NAMES[day].slice(0, 3) + (day === today ? " · hoy" : "");
      var dnum = document.createElement("span");
      dnum.className = "day-date";
      dnum.textContent = date.getDate() + "/" + (date.getMonth() + 1);
      head.appendChild(name);
      head.appendChild(dnum);
      col.appendChild(head);

      var body = document.createElement("div");
      body.className = "day-events";
      var dayEvents = visible
        .filter(function (ev) { return ev.day === day; })
        .sort(function (a, b) { return a.time < b.time ? -1 : (a.time > b.time ? 1 : 0); });

      if (dayEvents.length === 0) {
        var empty = document.createElement("div");
        empty.className = "day-empty";
        empty.textContent = "Sin eventos";
        body.appendChild(empty);
      }
      dayEvents.forEach(function (ev) {
        var m = memberById(ev.member);
        var card = document.createElement("div");
        card.className = "event";
        card.style.setProperty("--mcolor", m.color);
        card.style.setProperty("--mbg", m.bg);
        var t = document.createElement("span");
        t.className = "ev-time";
        t.textContent = ev.time;
        var title = document.createElement("span");
        title.className = "ev-title";
        title.textContent = (ev.icon ? ev.icon + " " : "") + ev.title;
        var who = document.createElement("span");
        who.className = "ev-who";
        who.textContent = m.emoji + " " + m.name;
        card.appendChild(t);
        card.appendChild(title);
        card.appendChild(who);
        body.appendChild(card);
      });

      col.appendChild(body);
      weekGrid.appendChild(col);
    }
  }

  /* ---------- Tareas del hogar ---------- */
  function renderTasks() {
    taskList.innerHTML = "";
    var done = 0;
    state.tasks.forEach(function (task) {
      if (task.done) done++;
      var li = document.createElement("li");
      li.className = "task-item" + (task.done ? " done" : "");
      var check = document.createElement("input");
      check.type = "checkbox";
      check.checked = task.done;
      check.setAttribute("aria-label", "Marcar tarea: " + task.title);
      check.addEventListener("change", function () {
        task.done = check.checked;
        save();
        renderTasks();
      });
      var title = document.createElement("span");
      title.className = "task-title";
      title.textContent = task.title;
      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn-del";
      del.textContent = "✕";
      del.title = "Quitar tarea";
      del.addEventListener("click", function () {
        state.tasks = state.tasks.filter(function (t) { return t.id !== task.id; });
        save();
        renderTasks();
      });
      li.appendChild(check);
      li.appendChild(title);
      li.appendChild(whoBadge(task.member));
      li.appendChild(del);
      taskList.appendChild(li);
    });
    taskProgress.textContent = done + " de " + state.tasks.length + " hechas" +
      (state.tasks.length && done === state.tasks.length ? " 🎉" : "");
  }

  /* ---------- Lista de compras ---------- */
  function renderShopping() {
    shopList.innerHTML = "";
    var done = 0;
    state.shopping.forEach(function (item) {
      if (item.done) done++;
      var li = document.createElement("li");
      li.className = "shop-item" + (item.done ? " done" : "");
      var box = document.createElement("span");
      box.className = "box";
      box.textContent = item.done ? "✓" : "";
      var name = document.createElement("span");
      name.className = "shop-name";
      name.textContent = item.name;
      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn-del";
      del.textContent = "✕";
      del.title = "Quitar de la lista";
      del.addEventListener("click", function (e) {
        e.stopPropagation();
        state.shopping = state.shopping.filter(function (s) { return s.id !== item.id; });
        save();
        renderShopping();
      });
      li.appendChild(box);
      li.appendChild(name);
      li.appendChild(del);
      li.addEventListener("click", function () {
        item.done = !item.done;
        save();
        renderShopping();
      });
      shopList.appendChild(li);
    });
    shopProgress.textContent = done + " de " + state.shopping.length + " en el carrito";
  }

  /* ---------- Gastos del mes ---------- */
  function renderExpenses() {
    expBody.innerHTML = "";
    var total = 0;
    var perMember = {};
    MEMBERS.forEach(function (m) { perMember[m.id] = 0; });

    state.expenses.forEach(function (exp) {
      total += exp.amount;
      if (perMember[exp.member] === undefined) perMember[exp.member] = 0;
      perMember[exp.member] += exp.amount;

      var tr = document.createElement("tr");
      var tdConcept = document.createElement("td");
      tdConcept.textContent = exp.concept;
      var tdWho = document.createElement("td");
      tdWho.appendChild(whoBadge(exp.member));
      var tdAmt = document.createElement("td");
      tdAmt.className = "num";
      tdAmt.textContent = money(exp.amount);
      var tdDel = document.createElement("td");
      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn-del";
      del.textContent = "✕";
      del.title = "Quitar gasto";
      del.addEventListener("click", function () {
        state.expenses = state.expenses.filter(function (x) { return x.id !== exp.id; });
        save();
        renderExpenses();
      });
      tdDel.appendChild(del);
      tr.appendChild(tdConcept);
      tr.appendChild(tdWho);
      tr.appendChild(tdAmt);
      tr.appendChild(tdDel);
      expBody.appendChild(tr);
    });

    expTotal.textContent = money(total);

    expSplit.innerHTML = "";
    var title = document.createElement("div");
    title.className = "split-title";
    title.textContent = "Reparto por persona";
    expSplit.appendChild(title);
    var max = 0;
    MEMBERS.forEach(function (m) { if (perMember[m.id] > max) max = perMember[m.id]; });
    MEMBERS.forEach(function (m) {
      var row = document.createElement("div");
      row.className = "split-row";
      var top = document.createElement("div");
      top.className = "split-top";
      var nm = document.createElement("span");
      nm.textContent = m.emoji + " " + m.name;
      var amt = document.createElement("span");
      amt.className = "split-amt";
      amt.textContent = money(perMember[m.id]) + (total > 0 ? " · " + Math.round(perMember[m.id] / total * 100) + "%" : "");
      top.appendChild(nm);
      top.appendChild(amt);
      var bar = document.createElement("div");
      bar.className = "bar";
      var fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.setProperty("--mcolor", m.color);
      fill.style.width = max > 0 ? (perMember[m.id] / max * 100) + "%" : "0%";
      bar.appendChild(fill);
      row.appendChild(top);
      row.appendChild(bar);
      expSplit.appendChild(row);
    });
  }

  /* ---------- Render completo ---------- */
  function renderAll() {
    renderFilters();
    renderWeek();
    renderTasks();
    renderShopping();
    renderExpenses();
  }

  /* ---------- Formularios ---------- */
  fillMemberSelect(document.getElementById("eventMember"));
  fillMemberSelect(document.getElementById("taskMember"));
  fillMemberSelect(document.getElementById("expMember"));

  document.getElementById("eventForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var titleInput = document.getElementById("eventTitle");
    var title = titleInput.value.trim();
    if (!title) return;
    state.events.push({
      id: nextId(),
      day: parseInt(document.getElementById("eventDay").value, 10),
      time: document.getElementById("eventTime").value || "12:00",
      title: title,
      member: document.getElementById("eventMember").value,
      icon: "📌"
    });
    titleInput.value = "";
    save();
    renderWeek();
  });

  document.getElementById("taskForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var titleInput = document.getElementById("taskTitle");
    var title = titleInput.value.trim();
    if (!title) return;
    state.tasks.push({
      id: nextId(),
      title: title,
      member: document.getElementById("taskMember").value,
      done: false
    });
    titleInput.value = "";
    save();
    renderTasks();
  });

  document.getElementById("shopForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = document.getElementById("shopTitle");
    var name = input.value.trim();
    if (!name) return;
    state.shopping.push({ id: nextId(), name: name, done: false });
    input.value = "";
    save();
    renderShopping();
  });

  document.getElementById("expForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var conceptInput = document.getElementById("expConcept");
    var amountInput = document.getElementById("expAmount");
    var concept = conceptInput.value.trim();
    var amount = parseFloat(amountInput.value);
    if (!concept || isNaN(amount) || amount <= 0) return;
    state.expenses.push({
      id: nextId(),
      concept: concept,
      member: document.getElementById("expMember").value,
      amount: Math.round(amount * 100) / 100
    });
    conceptInput.value = "";
    amountInput.value = "";
    save();
    renderExpenses();
  });

  /* ---------- Reinicio total ---------- */
  document.getElementById("btnResetAll").addEventListener("click", function () {
    state = seedState();
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* sin persistencia */ }
    renderAll();
  });

  /* ---------- Arranque ---------- */
  load();
  renderAll();
})();
