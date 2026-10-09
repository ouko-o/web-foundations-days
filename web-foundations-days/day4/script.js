
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const MAX_CHARACTERS = 200;

// Update the character and word counters.
function updateCounts() {
    const text = noteText.value;
    const characters = text.length;

    const trimmedText = text.trim();
    const words = trimmedText === ""
        ? 0
        : trimmedText.split(/\s+/).length;

    charCount.textContent =
        `${characters} / ${MAX_CHARACTERS} characters`;

    wordCount.textContent = `${words} words`;

    charCount.classList.remove("warning", "over");

    if (characters > MAX_CHARACTERS) {
        charCount.classList.add("over");
    } else if (characters > 180) {
        charCount.classList.add("warning");
    }
}

// Save the note as a draft whenever the user types.
noteText.addEventListener("input", function () {
    updateCounts();
    localStorage.setItem("savedDraft", noteText.value);
});

// Clear the note, counters and saved draft.
function clearNote() {
    noteText.value = "";
    localStorage.removeItem("savedDraft");
    updateCounts();
}

clearBtn.addEventListener("click", clearNote);

// Clear the note when Escape is pressed inside the textarea.
noteText.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        clearNote();
    }
});

// Apply the theme and update the button label.
function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);

    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

// Toggle the theme and remember the choice.
themeToggle.addEventListener("click", function () {
    const isDark = !document.body.classList.contains("dark");

    applyTheme(isDark);
    localStorage.setItem("savedTheme", isDark ? "dark" : "light");
});

// Restore the saved draft when the page loads.
const savedDraft = localStorage.getItem("savedDraft");

if (savedDraft !== null) {
    noteText.value = savedDraft;
}

// Restore the saved theme.
const savedTheme = localStorage.getItem("savedTheme");

applyTheme(savedTheme === "dark");

// Update counters for the restored draft.
updateCounts();