
// 1. Select the HTML elements
const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

// 2. Store users fetched from the API
let users = [];

// 3. Render any list of users
function renderUsers(list) {
    usersList.replaceChildren();

    list.forEach((user) => {
        const listItem = document.createElement("li");

        const name = document.createElement("h3");
        name.textContent = user.name;

        const email = document.createElement("p");
        email.textContent = `Email: ${user.email}`;

        const city = document.createElement("p");
        city.textContent = `City: ${user.address.city}`;

        const company = document.createElement("p");
        company.textContent = `Company: ${user.company.name}`;

        listItem.append(name, email, city, company);
        usersList.appendChild(listItem);
    });
}

// 4. Fetch users from the API
async function loadUsers() {
    loadButton.disabled = true;
    statusMessage.textContent = "Loading users...";

    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users"
        );

        // Check whether the request succeeded
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        // Convert the response to JavaScript data
        const data = await response.json();

        // Save users in the array
        users = data;

        // Render users according to the current filter
        filterUsers();

        statusMessage.textContent =
            `Successfully loaded ${users.length} users.`;
    } catch (error) {
        users = [];
        usersList.replaceChildren();

        statusMessage.textContent =
            "Unable to load users. Please check your connection and try again.";

        console.error("Error loading users:", error);
    } finally {
        // Always enable the button again
        loadButton.disabled = false;
    }
}

// 5. Filter the stored users by name
function filterUsers() {
    const searchTerm = filterInput.value.trim().toLowerCase();

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm)
    );

    renderUsers(filteredUsers);

    if (users.length > 0 && filteredUsers.length === 0) {
        statusMessage.textContent = "No users match your filter.";
    } else if (users.length > 0) {
        statusMessage.textContent =
            `Showing ${filteredUsers.length} of ${users.length} users.`;
    }
}

// 6. Load users when the button is clicked
loadButton.addEventListener("click", loadUsers);

// 7. Filter without fetching again
filterInput.addEventListener("input", filterUsers);