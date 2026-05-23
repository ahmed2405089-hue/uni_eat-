document.addEventListener('DOMContentLoaded', loadDashboard);

function getCurrentUser(){
    return {
        role: localStorage.getItem('userRole') || null,
        email: localStorage.getItem('userEmail') || null
    };
}

function get(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function loadDashboard() {
    // Assuming restaurants are defined in window.restaurants from all student.js
    const resCount = 5;
    const userCount = 0; // Hardcoded for now, as users are not stored
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

/* ===== OWNER-RESTAURANT MAPPINGS ===== */
function getOwnerMappings(){
    return JSON.parse(localStorage.getItem('ownerRestaurants') || '{}');
}

function saveOwnerMappings(m){
    localStorage.setItem('ownerRestaurants', JSON.stringify(m));
}

function populateRestaurantsSelect(){
    const sel = document.getElementById('restaurantsSelect');
    if(!sel) return;
    sel.innerHTML = '';
    if(!window.restaurants) return;
    window.restaurants.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = `${r.name} (ID:${r.id})`;
        sel.appendChild(opt);
    });
}

function renderOwnerMappings(){
    const table = document.querySelector('#ownerMappingsTable tbody');
    if(!table) return;
    const map = getOwnerMappings();
    table.innerHTML = '';
    const query = (document.getElementById('ownerSearch') && document.getElementById('ownerSearch').value.trim().toLowerCase()) || '';
    for(const [email, ids] of Object.entries(map)){
        if(query && !email.toLowerCase().includes(query)) continue;
        const tr = document.createElement('tr');
        const idsText = Array.isArray(ids) ? ids.join(', ') : ids;
        tr.innerHTML = `<td>${email}</td><td>${idsText}</td><td><button onclick="editOwner('${email}')">Edit</button> <button onclick="removeOwner('${email}')">Remove</button></td>`;
        table.appendChild(tr);
    }
}

function assignOwner(){
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { alert('Only admins can assign owners to restaurants.'); return; }
    const emailEl = document.getElementById('ownerEmail');
    const sel = document.getElementById('restaurantsSelect');
    if(!emailEl || !sel) return;
    const email = emailEl.value.trim().toLowerCase();
    if(!email) { alert('Enter owner email'); return; }
    const selected = Array.from(sel.selectedOptions).map(o => Number(o.value));
    if(selected.length === 0) { alert('Select at least one restaurant'); return; }

    const map = getOwnerMappings();
    // if editing existing owner, overwrite; otherwise create
    map[email] = selected;
    saveOwnerMappings(map);
    renderOwnerMappings();
    emailEl.value = '';
    sel.selectedIndex = -1;
    // reset assign button text if it was changed
    const btn = document.querySelector('button[onclick="assignOwner()"]');
    if(btn) btn.textContent = 'Assign';
    editingOwnerEmail = null;
    alert('Assigned successfully');
}

function removeOwner(email){
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { alert('Only admins can remove assignments.'); return; }
    const map = getOwnerMappings();
    delete map[email];
    saveOwnerMappings(map);
    renderOwnerMappings();
}

let editingOwnerEmail = null;

function editOwner(email){
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { alert('Only admins can edit assignments.'); return; }
    const map = getOwnerMappings();
    if(!map[email]) return;
    const ids = Array.isArray(map[email]) ? map[email].map(Number) : [Number(map[email])];
    const emailEl = document.getElementById('ownerEmail');
    const sel = document.getElementById('restaurantsSelect');
    if(!emailEl || !sel) return;
    emailEl.value = email;
    // select options
    Array.from(sel.options).forEach(o => {
        o.selected = ids.includes(Number(o.value));
    });
    // change button to Save
    const btn = document.querySelector('button[onclick="assignOwner()"]');
    if(btn) btn.textContent = 'Save';
    editingOwnerEmail = email;
}

// wire search input
document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('ownerSearch');
    if(search){
        search.addEventListener('input', () => renderOwnerMappings());
    }
});

document.addEventListener('DOMContentLoaded', () => {
    populateRestaurantsSelect();
    renderOwnerMappings();
});

// Enforce admin-only visibility for mapping UI
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        const assignSection = document.querySelector('#restaurantsSelect');
        if (assignSection) {
            // hide parent card
            let card = assignSection.closest('.card');
            if (card) card.style.display = 'none';
        }
        const ownerEmail = document.getElementById('ownerEmail');
        if (ownerEmail) ownerEmail.disabled = true;
        const assignBtn = document.querySelector('button[onclick="assignOwner()"]');
        if (assignBtn) { assignBtn.disabled = true; assignBtn.textContent = 'Admins only'; }
    }
});

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