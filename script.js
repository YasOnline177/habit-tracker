/* =========================
  Habit Tracker - JavaScript
  Author: Yasara Samaraweera
============================ */

/* ----------------------
  DOM References
------------------------ */
const form = document.getElementById("habit-form");
const input = document.getElementById("habit-input");
const list = document.getElementById("habit-list");

const themeToggle = document.getElementById("theme-toggle");
const quoteText = document.getElementById("quote-text");
const newQuoteBtn = document.getElementById("new-quote");

const calendarGrid = document.getElementById("calendar-grid");
const calendarMonth = document.getElementById("calendar-month");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

/* ----------------------
  Application state 
------------------------ */
let habits = []; // Array of { name, createdAt: "YYYY-MM-DD", doneDates: {"YYYY-MM-DD": true} }
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

/* ----------------------
  Date Helpers 
------------------------ */
function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayKey() {
  return formatLocalDate(new Date());
}

function prevDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return formatLocalDate(dt);
}
function nextDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 1);
  return formatLocalDate(dt);
}

/* ---------------------- 
  Habit Logic Helpers 
------------------------ */
function computeStreak(habit) {
  let streak = 0;
  let dateKey = todayKey();
  const start = habit.createdAt || todayKey();
  while (dateKey >= start && habit.doneDates && habit.doneDates[dateKey]) {
    streak++;
    dateKey = prevDayKey(dateKey);
  }
  return streak;
}

function countLastNDays(habit, n = 7) {
  let count = 0;
  let dateKey = todayKey();
  const start = habit.createdAt || todayKey();
  for (let i = 0; i < n; i++) {
    if (dateKey < start) break;
    if (habit.doneDates && habit.doneDates[dateKey]) count++;
    dateKey = prevDayKey(dateKey);
  }
  return count;
}

function getHabitWindowDates(habit, n = 7) {
  const dates = [];
  const today = new Date();
  const start = new Date(habit.createdAt);
  let dt = start < today ? start : today;

  for (let i = 0; i < n; i++) {
    dates.push(formatLocalDate(dt));
    dt.setDate(dt.getDate() + 1); // move forward
  }
  return dates;
}

/* ----------------------
UI: Habit List Items 
------------------------ */
function createHabitDOM(habit) {
  const li = document.createElement("li");

  // Name
  const nameSpan = document.createElement("span");
  nameSpan.className = "habit-name";
  nameSpan.textContent = habit.name;

  // Buttons
  const doneBtn = document.createElement("button");
  doneBtn.className = "btn-done";
  const today = todayKey();
  const isDoneToday = habit.doneDates && habit.doneDates[today];
  doneBtn.textContent = isDoneToday ? "Done" : "Mark as done";
  if (isDoneToday) li.classList.add("done");

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-delete";
  deleteBtn.textContent = "Delete";

  // Meta (streak + progress bar)
  const meta = document.createElement("div");
  meta.className = "meta";

  const streakSpan = document.createElement("span");
  streakSpan.className = "streak";
  streakSpan.textContent = `Streak: ${computeStreak(habit)}`;

  const progressWrap = document.createElement("div");
  progressWrap.className = "progress";

  const bar = document.createElement("div");
  bar.className = "bar";
  const last7 = countLastNDays(habit, 7);
  bar.style.width = `${Math.round((last7 / 7) * 100)}%`;

  const progressLabel = document.createElement("span");
  progressLabel.className = "progress-label";
  progressLabel.textContent = `${last7}/7`;

  progressWrap.appendChild(bar);
  meta.append(streakSpan, progressWrap, progressLabel);

  // Mini 7-day calendar
  const miniCal = document.createElement("div");
  miniCal.className = "calendar";

  const windowDates = getHabitWindowDates(habit, 7);

  windowDates.forEach((d) => {
    const box = document.createElement("span");
    box.className = "day-box";

    if (d > todayKey()) {
      box.classList.add("future-day");
    } else if (d <=todayKey() && habit.doneDates && habit.doneDates[d]) {
      box.classList.add("done-day");
    }
    miniCal.appendChild(box);
  });

  /* ------- Event: Mark done/undone ------- */
  doneBtn.addEventListener("click", () => {
    const key = todayKey();
    if (!habit.doneDates) habit.doneDates = {};
    if (habit.doneDates[key]) {
      delete habit.doneDates[key];
      li.classList.remove("done");
      doneBtn.textContent = "Mark as done";
    } else {
      habit.doneDates[key] = true;
      li.classList.add("done");
      doneBtn.textContent = "Done";
    }

    saveHabits();

    // Update UI 
    streakSpan.textContent = `Streak: ${computeStreak(habit)}`;
    const lastCount = countLastNDays(habit, 7);
    bar.style.width = `${Math.round((lastCount / 7) * 100)}%`;
    progressLabel.textContent = `${lastCount}/7`;

    // Rebuild mini calendar 
    miniCal.innerHTML = "";
    const windowDates = getHabitWindowDates(habit, 7);
    
    windowDates.forEach(d => {
      const box = document.createElement("span");
      box.className = "day-box";
      
      if (d > todayKey()) {
        // future day -> mark visually distinct
        box.classList.add("future-day");
      } else if (habit.doneDates && habit.doneDates[d]) {
        // completed past/present day
        box.classList.add("done-day");
      }
      miniCal.appendChild(box);
    })

    refreshCalendar();
  });

  /* ------- Event: Delete habit ------- */
  deleteBtn.addEventListener("click", () => {
    if (li.parentNode) li.parentNode.removeChild(li);
    habits = habits.filter((h) => h !== habit);
    saveHabits();
    refreshCalendar();
  });

  // Assemble habit item
  li.appendChild(nameSpan);

  const btnRow = document.createElement("div");
  btnRow.style.marginTop = "8px";
  btnRow.appendChild(doneBtn);
  btnRow.appendChild(deleteBtn);
  li.appendChild(btnRow);

  li.appendChild(meta);
  li.appendChild(miniCal);

  list.appendChild(li);
}

/* ------------------------
  Persistence (LocalStorage) 
---------------------------- */
function loadHabits() {
  const raw = localStorage.getItem("habits");
  if (!raw) return;

  try {
    habits = JSON.parse(raw) || [];
    habits.forEach((h) => {
      if (!h.createdAt) {
        const keys = h.doneDates ? Object.keys(h.doneDates).sort() : [];
        h.createdAt = keys.length ? keys[0] : todayKey();
      }
      createHabitDOM(h);
    });
  } catch (e) {
    console.error("Failed to load habits - clearing storage", e);
    habits = [];
    localStorage.removeItem("habits");
  }
}
function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

/* ---------------------- 
  Form: Add New Habit
------------------------ */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = input.value.trim();
  if (!name) return;

  const habit = { name, createdAt: todayKey(), doneDates: {} };
  habits.push(habit);
  saveHabits();
  createHabitDOM(habit);
  refreshCalendar();
  input.value = "";
});

/* ---------------------- 
  Theme Toggle 
------------------------ */
function applyTheme(t) {
  if (t === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
  localStorage.setItem("theme", t);
}
applyTheme(localStorage.getItem("theme") || "light");
themeToggle.addEventListener("click", () => {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
  themeToggle.textContent = next === "dark" ? "☀️" : "🌙";
});

/* ---------------------- 
  Quotes (Static List) 
------------------------ */
const QUOTES = [
  "Don't wait. Start now.",
  "Small daily improvements lead to big results.",
  "Consistency is more important than intensity.",
  "Progress is progress, no matter how small.",
  "You don't have to be great to start, but you have to start to be great.",
];
function randomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
function setQuote(q) {
  if (quoteText) quoteText.textContent = q;
}
if (newQuoteBtn) newQuoteBtn.addEventListener("click", () => setQuote(randomQuote()));
setQuote(randomQuote());

/* ---------------------- 
  Monthly Calendar 
------------------------ */
function getDayStatus(dateKey) {
  const today = todayKey();
  if (dateKey > today) return "";

  let validCount = 0;
  let doneCount = 0;

  habits.forEach((h) => {
    if (!h.createdAt) return;
    if (dateKey >= h.createdAt) {
      validCount++;
      if (h.doneDates && h.doneDates[dateKey]) doneCount++;
    }
  });

  if (validCount === 0 || doneCount === 0) return "";
  if (doneCount === validCount) return "full";
  return "partial";
}

function renderCalendar(year, month) {
  calendarGrid.innerHTML = "";
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  calendarMonth.textContent = firstDay.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  // Empty cells before first day
  for (let i = 0; i < firstDay.getDay(); i++) {
    const cell = document.createElement("div");
    cell.className = "day-cell empty";
    calendarGrid.appendChild(cell);
  }

  const tooltip = document.getElementById("tooltip");
  if (!tooltip) {
    console.error("Tooltip element not found!");
    return;
  }

  // Calendar days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dt = new Date(year, month, d);
    const key = formatLocalDate(dt);
    const cell = document.createElement("div");
    cell.className = "day-cell";
    
    const status = getDayStatus(key);
    if (status) cell.classList.add(status);

    cell.textContent = d;
    calendarGrid.appendChild(cell);

    /* ------- Tooltip events ------- */
    cell.addEventListener("mouseenter", () => {
      const statusList = habits
        .filter(h => key >= h.createdAt)
        .map(h => {
          const today = todayKey();
          const done = h.doneDates && h.doneDates[key];
          if (key > today) return `${h.name}: ⏳ Future`;
          return `${h.name}: ${done ? "✅ Done" : "❌ Missed"}`;
        })
        .join("<br>");

      tooltip.innerHTML = `<strong>${dt.toDateString()}</strong><br>${statusList || "No habits"}`;
      tooltip.style.display = "block";
    });

    cell.addEventListener("mousemove", (e) => {
      tooltip.style.left = e.pageX + 12 + "px";
      tooltip.style.top = e.pageY + 12 + "px";
    });

    cell.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  }
}

/* ----------------------
  Calendar Navigation
------------------------ */
if (prevMonthBtn) prevMonthBtn.addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar(currentYear, currentMonth);
});
if (nextMonthBtn) nextMonthBtn.addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar(currentYear, currentMonth);
});

function refreshCalendar() {
  renderCalendar(currentYear, currentMonth);
}

/* ----------------
  Init 
------------------ */
loadHabits();
refreshCalendar();
