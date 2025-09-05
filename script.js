/* =========================
    Habit Tracker - Script
    Author: Yasara Samaraweera
============================ */

// ======================
// DOM References
// ======================
const form = document.getElementById("habit-form");
const input = document.getElementById("habit-input");
const list = document.getElementById("habit-list");

// ======================
// State
// ======================
let habits = [];    // stores all habit objects

// ======================
// Date Helper
// ======================

// Format today's date as YYYY-MM-DD
function todayKey() {
    return new Date().toISOString().split("T")[0];
}

// Get the previous day's key from a given date string
function prevDayKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    return dt.toISOString().split("T")[0];
}

// ======================
// Habit Progress Helpers
// ======================

// Computer current streak of consecutive days completed
function computeStreak(habit) {
    let streak = 0;
    let date = todayKey();
    while (habit.doneDates && habit.doneDates[date]) {
        streak++;
        date = prevDayKey(date);
    }
    return streak;
}

// Count how many days were completed in the last N days 
function countLastNDays(habit, n = 7) {
    let count = 0;
    let date = todayKey();
    for (let i = 0; i < n; i++) {
        if (habit.doneDates && habit.doneDates[date]) count++;
        date = prevDayKey(date);
    }
    return count;
}

// ======================
// UI Rendering
// ======================

// Create DOM elements for a habit item
function createHabitDOM(habit) {
  const li = document.createElement("li");

  // --- Habit name
  const span = document.createElement("span");
  span.textContent = habit.name;
  span.className = "habit-name";

  // --- Done button 
  const doneButton = document.createElement("button");
  const today = todayKey();
  const isDoneToday = habit.doneDates && habit.doneDates[today];
  doneButton.textContent = isDoneToday ? "Done" : "Mark as done";
  if (isDoneToday) li.classList.add("done");

  doneButton.addEventListener("click", function () {
    const date = todayKey();
    if (!habit.doneDates) habit.doneDates = {};

    if (habit.doneDates[date]) {
        // unmark today's habit
        delete habit.doneDates[date];
        li.classList.remove("done");
        doneButton.textContent = "Mark as done";
    } else {
        // Mark today's habit as done
        habit.doneDates[date] = true;
        li.classList.add("done");
        doneButton.textContent = "Done";
    }

    saveHabits();

    // Update streak and progress bar 
    streakSpan.textContent = `Streak: ${computeStreak(habit)}`;
    const last7 = countLastNDays(habit, 7);
    bar.style.width = Math.round((last7 / 7) * 100) + "%";
    progressLabel.textContent = `${last7}/7`;
  });

  // --- Delete button
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", function () {
    li.remove();
    habits = habits.filter((h) => h !== habit);
    saveHabits();
  });
  
  // --- Meta info (streak + 7-day progress)
  const meta = document.createElement("div");
  meta.className = "meta";

  // Streak display 
  const streakCount = computeStreak(habit);
  const streakSpan = document.createElement("span");
  streakSpan.className = "streak";
  streakSpan.textContent = `Streak: ${streakCount}`;

  // Progress display 
  const last7Count = countLastNDays(habit, 7);
  const progressWrap = document.createElement("div");
  progressWrap.className = "progress";

  const bar = document.createElement("div");
  bar.className = "bar";
  const pct = Math.round((last7Count / 7) * 100);
  bar.style.width = pct + "%";

  const progressLabel = document.createElement("span");
  progressLabel.className = "progress-label";
  progressLabel.textContent = `${last7Count}/7`;

  progressWrap.appendChild(bar);
  meta.append(streakSpan, progressWrap, progressLabel);

  // --- Append everything
  li.appendChild(span);
  li.appendChild(doneButton);
  li.appendChild(deleteButton);
  li.appendChild(meta);

  list.appendChild(li);
}

// ======================
// Persistence
// ======================

// Load habits from localStorage
function loadHabits() {
  const stored = localStorage.getItem("habits");
  if (stored) {
    habits = JSON.parse(stored);
    // Render each habit in the DOM
    habits.forEach((habit) => {
      createHabitDOM(habit);
    });
  }
}

// Save habits array into localStorage
function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

// ======================
// Event Listeners
// ======================

// Handle new habit submission
form.addEventListener("submit", function (e) {
  e.preventDefault(); 

  const habitName = input.value.trim();
  if (habitName === "") return; 

  const habit = {
    name: habitName,
    doneDates: {}    
  };

  habits.push(habit);
  saveHabits();
  createHabitDOM(habit);

  input.value = ""; // clear input field
});
// ======================
// Initialize app
// ======================
loadHabits();