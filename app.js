const STORAGE_KEY = "lifeos_data_v1";

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  tasks: [],
  events: [],
  money: [],
  products: [],
  habits: []
};

let currentType = "";
let editingId = null;

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function money(value) {
  return "$" + Number(value || 0).toFixed(2);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function toast(message) {
  const element = document.getElementById("toast");
  element.textContent = message;
  element.classList.add("show");

  setTimeout(() => element.classList.remove("show"), 2500);
}

function createId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function page(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item[data-page]").forEach(b => b.classList.remove("active"));

  document.getElementById(name).classList.add("active");

  const button = document.querySelector(`[data-page="${name}"]`);
  if (button) button.classList.add("active");

  const titles = {
    dashboard: "Mi espacio",
    tasks: "Mis tareas",
    calendar: "Calendario",
    money: "Finanzas",
    shopping: "Lista de compras",
    habits: "Mis hábitos",
    stats: "Estadísticas"
  };

  document.getElementById("pageTitle").textContent = titles[name];
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => page(button.dataset.page));
});

document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => page(button.dataset.goto));
});

function openModal(type, id = null) {
  currentType = type;
  editingId = id;

  const titles = {
    task: "Nueva tarea",
    event: "Nuevo evento",
    money: "Nuevo movimiento",
    product: "Nuevo producto",
    habit: "Nuevo hábito"
  };

  document.getElementById("modalTitle").textContent =
    id ? "Editar elemento" : titles[type];

  const fields = {
    task: `
      <div class="field">
        <label>Nombre de la tarea</label>
        <input name="title" required placeholder="Ej. Terminar tarea de programación">
      </div>
      <div class="field">
        <label>Fecha de entrega</label>
        <input name="date" type="date" required>
      </div>
      <div class="field">
        <label>Hora del recordatorio</label>
        <input name="time" type="time" value="08:00">
      </div>
      <div class="field">
        <label>Prioridad</label>
        <select name="priority">
          <option value="Normal">Normal</option>
          <option value="Alta">Alta</option>
          <option value="Baja">Baja</option>
        </select>
      </div>
    `,
    event: `
      <div class="field">
        <label>Nombre del evento</label>
        <input name="title" required placeholder="Ej. Examen">
      </div>
      <div class="field">
        <label>Fecha</label>
        <input name="date" type="date" required>
      </div>
      <div class="field">
        <label>Hora del recordatorio</label>
        <input name="time" type="time" value="08:00">
      </div>
    `,
    money: `
      <div class="field">
        <label>Descripción</label>
        <input name="title" required placeholder="Ej. Ahorro">
      </div>
      <div class="field">
        <label>Cantidad</label>
        <input name="amount" type="number" min="0" step="0.01" required>
      </div>
      <div class="field">
        <label>Tipo</label>
        <select name="kind">
          <option value="income">Ingreso</option>
          <option value="expense">Gasto</option>
        </select>
      </div>
    `,
    product: `
      <div class="field">
        <label>Producto</label>
        <input name="title" required placeholder="Ej. Cuaderno">
      </div>
      <div class="field">
        <label>Cantidad</label>
        <input name="amount" type="number" min="1" value="1" required>
      </div>
    `,
    habit: `
      <div class="field">
        <label>Nombre del hábito</label>
        <input name="title" required placeholder="Ej. Leer 20 minutos">
      </div>
    `
  };

  document.getElementById("formFields").innerHTML = fields[type];

  if (id) {
    const item = data[
      type === "product" ? "products" :
      type === "habit" ? "habits" :
      type === "money" ? "money" :
      type === "event" ? "events" : "tasks"
    ].find(x => x.id === id);

    if (item) {
      Object.keys(item).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) input.value = item[key];
      });
    }
  }

  document.getElementById("modal").classList.add("show");
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
}

document.getElementById("closeModal").addEventListener("click", closeModal);

// BOTONES PARA AGREGAR ELEMENTOS EN CADA SECCIÓN
document.querySelectorAll("[data-add]").forEach(button => {
  button.addEventListener("click", () => openModal(button.dataset.add));
});

document.getElementById("itemForm").addEventListener("submit", event => {
  event.preventDefault();

  const form = new FormData(event.target);
  const item = Object.fromEntries(form.entries());

  const keys = {
    task: "tasks",
    event: "events",
    money: "money",
    product: "products",
    habit: "habits"
  };

  const list = data[keys[currentType]];

  if (editingId) {
    const index = list.findIndex(x => x.id === editingId);
    if (index !== -1) list[index] = {...list[index], ...item};
  } else {
    item.id = createId();
    item.done = false;
    item.notified = false;
    list.push(item);
  }

  saveData();
  closeModal();
  event.target.reset();
  renderAll();
  toast("Guardado correctamente");
});

function removeItem(type, id) {
  const keys = {
    task: "tasks",
    event: "events",
    money: "money",
    product: "products",
    habit: "habits"
  };

  if (!confirm("¿Deseas eliminar este elemento?")) return;

  data[keys[type]] = data[keys[type]].filter(x => x.id !== id);
  saveData();
  renderAll();
}

function editItem(type, id) {
  openModal(type, id);
}

function toggleItem(type, id) {
  const keys = {
    task: "tasks",
    product: "products",
    habit: "habits"
  };

  const item = data[keys[type]].find(x => x.id === id);

  if (item) {
    item.done = !item.done;
    if (type === "habit") item.doneToday = item.done;
    saveData();
    renderAll();
  }
}

function row(title, subtitle, actions = "") {
  return `
    <div class="item-row">
      <div class="item-info">
        <strong>${escapeHTML(title)}</strong>
        <small>${escapeHTML(subtitle)}</small>
      </div>
      <div class="item-actions">${actions}</div>
    </div>
  `;
}

function renderTasks() {
  const list = document.getElementById("taskList");
  const tasks = [...data.tasks].sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

  if (!tasks.length) {
    list.innerHTML = '<p class="empty">Todavía no tienes tareas. ¡Agrega una!</p>';
  } else {
    list.innerHTML = tasks.map(item => `
      <div class="item-row ${item.done ? "completed" : ""}">
        <input type="checkbox" ${item.done ? "checked" : ""} onchange="toggleItem('task', ${item.id})">
        <div class="item-info">
          <strong>${escapeHTML(item.title)}</strong>
          <small>Entrega: ${escapeHTML(item.date || "Sin fecha")} · ${escapeHTML(item.time || "Sin hora")} · ${escapeHTML(item.priority || "Normal")}</small>
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="editItem('task', ${item.id})">✎</button>
          <button class="icon-btn" onclick="removeItem('task', ${item.id})">×</button>
        </div>
      </div>
    `).join("");
  }
}

function renderEvents() {
  const list = document.getElementById("eventList");
  const events = [...data.events].sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

  list.innerHTML = events.length ? events.map(item => `
    <div class="item-row">
      <div class="item-info">
        <strong>${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(item.date)} · ${escapeHTML(item.time || "Sin hora")}</small>
      </div>
      <div class="item-actions">
        <button class="icon-btn" onclick="editItem('event', ${item.id})">✎</button>
        <button class="icon-btn" onclick="removeItem('event', ${item.id})">×</button>
      </div>
    </div>
  `).join("") : '<p class="empty">No tienes eventos todavía.</p>';
}

function renderMoney() {
  const list = document.getElementById("moneyList");

  const income = data.money
    .filter(x => x.kind === "income")
    .reduce((a, b) => a + Number(b.amount), 0);

  const expenses = data.money
    .filter(x => x.kind === "expense")
    .reduce((a, b) => a + Number(b.amount), 0);

  document.getElementById("income").textContent = money(income);
  document.getElementById("expenses").textContent = money(expenses);
  document.getElementById("balance").textContent = money(income - expenses);

  list.innerHTML = data.money.length ? data.money.map(item => `
    <div class="item-row">
      <div class="item-info">
        <strong>${escapeHTML(item.title)}</strong>
        <small>${item.kind === "income" ? "Ingreso" : "Gasto"}</small>
      </div>
      <strong>${money(item.amount)}</strong>
      <button class="icon-btn" onclick="removeItem('money', ${item.id})">×</button>
    </div>
  `).join("") : '<p class="empty">No tienes movimientos.</p>';
}

function renderShopping() {
  const list = document.getElementById("shoppingList");

  list.innerHTML = data.products.length ? data.products.map(item => `
    <div class="item-row ${item.done ? "completed" : ""}">
      <input type="checkbox" ${item.done ? "checked" : ""} onchange="toggleItem('product', ${item.id})">
      <div class="item-info">
        <strong>${escapeHTML(item.title)}</strong>
        <small>Cantidad: ${escapeHTML(item.amount || 1)}</small>
      </div>
      <button class="icon-btn" onclick="removeItem('product', ${item.id})">×</button>
    </div>
  `).join("") : '<p class="empty">Tu lista está vacía.</p>';
}

function renderHabits() {
  const list = document.getElementById("habitList");

  list.innerHTML = data.habits.length ? data.habits.map(item => `
    <div class="item-row">
      <input type="checkbox" ${item.done ? "checked" : ""} onchange="toggleItem('habit', ${item.id})">
      <div class="item-info">
        <strong>${escapeHTML(item.title)}</strong>
        <small>${item.done ? "Completado hoy" : "Pendiente hoy"}</small>
      </div>
      <button class="icon-btn" onclick="removeItem('habit', ${item.id})">×</button>
    </div>
  `).join("") : '<p class="empty">Agrega tu primer hábito.</p>';
}

function renderDashboard() {
  const pending = data.tasks.filter(x => !x.done);
  const completed = data.tasks.filter(x => x.done);

  document.getElementById("pendingCount").textContent = pending.length;
  document.getElementById("completedCount").textContent = completed.length;
  document.getElementById("eventCount").textContent = data.events.length;
  document.getElementById("habitCount").textContent = data.habits.length;

  document.getElementById("dashboardTasks").innerHTML =
    pending.length
      ? pending.slice(0, 5).map(x =>
          row(x.title, "Entrega: " + (x.date || "Sin fecha"))
        ).join("")
      : '<p class="empty">¡No tienes tareas pendientes!</p>';

  document.getElementById("dashboardEvents").innerHTML =
    data.events.length
      ? data.events.slice(0, 5).map(x => row(x.title, x.date)).join("")
      : '<p class="empty">No tienes eventos próximos.</p>';
}

function renderStats() {
  const total = data.tasks.length;
  const done = data.tasks.filter(x => x.done).length;
  const percent = total ? Math.round(done / total * 100) : 0;

  document.getElementById("totalStats").textContent = total;
  document.getElementById("doneStats").textContent = done;
  document.getElementById("percentStats").textContent = percent + "%";
  document.getElementById("progressBar").style.width = percent + "%";
}

function renderAll() {
  renderTasks();
  renderEvents();
  renderMoney();
  renderShopping();
  renderHabits();
  renderDashboard();
  renderStats();
}

function updateClock() {
  const now = new Date();

  document.getElementById("clock").textContent =
    now.toLocaleTimeString("es-SV");

  document.getElementById("currentDate").textContent =
    now.toLocaleDateString("es-SV", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
}

// TEMA OSCURO POR DEFECTO
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");

  const theme = document.body.classList.contains("light") ? "light" : "dark";
  localStorage.setItem("lifeos_theme", theme);
});

if (localStorage.getItem("lifeos_theme") === "light") {
  document.body.classList.add("light");
}

// NOTIFICACIONES
async function activateNotifications() {
  if (!("Notification" in window)) {
    toast("Tu navegador no admite notificaciones");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    toast("¡Notificaciones activadas!");

    new Notification("LifeOS", {
      body: "Ya puedes recibir recordatorios de tus tareas."
    });
  } else {
    toast("No se concedió el permiso");
  }
}

document.getElementById("notificationButton")
  .addEventListener("click", activateNotifications);

function checkReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();

  ["tasks", "events"].forEach(type => {
    data[type].forEach(item => {
      if (item.done || item.notified || !item.date) return;

      const reminderTime = item.time || "08:00";
      const reminderDate = new Date(item.date + "T" + reminderTime);

      const difference = reminderDate.getTime() - now.getTime();

      if (difference <= 0 && difference > -60000) {
        const title = type === "tasks" ? "Tarea pendiente" : "Evento próximo";

        new Notification(title, {
          body: item.title + " · " + item.date + " " + reminderTime,
          tag: type + "-" + item.id
        });

        item.notified = true;
        saveData();
      }
    });
  });
}

// REGISTRAR SERVICE WORKER
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("Service Worker registrado"))
      .catch(error => console.log("Error en Service Worker:", error));
  });
}

renderAll();
updateClock();

setInterval(updateClock, 1000);
setInterval(checkReminders, 15000);