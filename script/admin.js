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