// References to form, input field, and habit list
const form = document.getElementById("habit-form");
const input = document.getElementById("habit-input");
const list = document.getElementById("habit-list");

// Listen for form submission to add a new habit
form.addEventListener("submit", function (e) {
  e.preventDefault(); // prevent page refresh

  const habitName = input.value.trim();
  if (habitName === "") return; // ignore empty input

  // Create a new list item for the habit
  const li = document.createElement("li");

  // Span to display the habit name
  const span = document.createElement("span");
  span.textContent = habitName;

  // Button to mark the habit as done
  const doneButton = document.createElement("button");
  doneButton.textContent = "Mark as done";

  doneButton.addEventListener("click", function () {
    li.classList.toggle("done"); // toggle done state

    // Update button text based on state
    if (li.classList.contains("done")) {
      doneButton.textContent = "Done";
    } else {
      doneButton.textContent = "Mark as done";
    }
  });

  // Button to delete the habit
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", function () {
    li.remove(); // remove the habit from the list
  });

  // Append span and buttons to the list item
  li.appendChild(span);
  li.appendChild(doneButton);
  li.appendChild(deleteButton);

  // Add the list item to the habit list 
  list.appendChild(li);

  // Clear the input field
  input.value = "";
});
