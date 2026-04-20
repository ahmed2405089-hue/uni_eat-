document.addEventListener('DOMContentLoaded', loadDashboard);

function get(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function loadDashboard() {
    // Assuming restaurants are defined in window.restaurants from all student.js
    const resCount = 5;
    const userCount = 50; // Hardcoded for now, as users are not stored
    const orderCount = get("orders").length;

    const counts = {
        resCount: resCount,
        userCount: userCount,
        orderCount: orderCount
    };

    for (const [id, value] of Object.entries(counts)) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }
}

function displayAllOrders() {
    const orders = get("orders");
    const tableBody = document.querySelector("#all-orders-table tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    orders.forEach(order => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${order.id}</td>
            <td class="status">${order.status}</td>
            <td><button onclick="updateStatus(this, 'Completed')">Mark Completed</button></td>
        `;
        tableBody.appendChild(row);
    });
}

function displayUsers() {
    // Since users are not stored, show a message or static
    const usersList = document.getElementById("users");
    if (usersList) {
        usersList.innerHTML = "<li>No users registered yet.</li>";
    }
}

function displayRestaurants() {
    if (!window.restaurants) return;
    const tableBody = document.querySelector("#restaurants-table tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    window.restaurants.forEach(restaurant => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${restaurant.name}</td>
            <td><button onclick="removeItem(this)">Delete</button></td>
        `;
        tableBody.appendChild(row);
    });
}

// Works for both user list items and table rows
function removeItem(btn) {
    const row = btn.closest('tr') || btn.closest('li');
    if (row) row.remove();
}

function updateStatus(btn, status = 'Completed') {
    const row = btn.closest('tr');
    if (!row) return;
    const statusCell = row.querySelector('.status');
    if (statusCell) statusCell.innerText = status;
}