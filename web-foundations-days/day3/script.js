// Starting notes
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" }
];

// 1. Search Notes
function searchNotes(word) {
  return notes.filter(note =>
    note.text.toLowerCase().includes(word.toLowerCase())
  );
}

console.log(searchNotes("javascript"));
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("pizza"));
// Expected: []

// 2. Longest Note
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];

  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }

  return longest;
}

console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

// Test empty notes array
let savedNotes = notes;
notes = [];
console.log(longestNote());
// Expected: null
notes = savedNotes;

// 3. Count By Category
function countByCategory() {
  let counts = {};

  for (let note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }

  return counts;
}

console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

// Test empty notes array
notes = [];
console.log(countByCategory());
// Expected: {}
notes = savedNotes;

// 4. Get Summary
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";

  return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

console.log(getSummary());
// Expected: 5 notes: 2 personal, 1 work, 2 study.

// Test exactly one note
notes = [savedNotes[0]];
console.log(getSummary());
// Expected: 1 note: 1 personal, 0 work, 0 study.
notes = savedNotes;

// 5. Check for Duplicate
function isDuplicate(text) {
  const normalizedText = text.trim().toLowerCase();

  return notes.some(note =>
    note.text.trim().toLowerCase() === normalizedText
  );
}

console.log(isDuplicate(" CALL MUM "));
// Expected: true

console.log(isDuplicate("Go to the gym"));
// Expected: false

// 6. Add Note
function addNote(text, category) {
  const trimmedText = text.trim();
  const validCategories = ["personal", "work", "study"];

  // Check note length
  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Note must be between 1 and 200 characters.");
    return false;
  }

  // Check duplicate
  if (isDuplicate(trimmedText)) {
    console.log("Note already exists.");
    return false;
  }

  // Check category
  if (!validCategories.includes(category)) {
    console.log("Invalid category.");
    return false;
  }

  // Generate a new ID
  const newId = notes.length === 0
    ? 1
    : Math.max(...notes.map(note => note.id)) + 1;

  // Add the new note
  notes.push({
    id: newId,
    text: trimmedText,
    category: category
  });

  return true;
}

console.log(addNote("Plan my JavaScript practice", "study"));
// Expected: true

console.log(addNote(" Call mum ", "personal"));
// Expected: false
// Expected reason: Note already exists.

console.log(addNote("Buy a new laptop", "shopping"));
// Expected: false
// Expected reason: Invalid category.

console.log(addNote("", "personal"));
// Expected: false
// Expected reason: Note must be between 1 and 200 characters.