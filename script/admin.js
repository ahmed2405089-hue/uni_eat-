const API_ROOT = '/api';

function confirmLogout(event) {
    if (event) event.preventDefault();
    window.location.href = 'logout-confirm.html';
}

function getCurrentUser(){
    return {
        role: localStorage.getItem('userRole') || null,
        email: localStorage.getItem('userEmail') || null
    };
}

async function apiGet(path) {
    const response = await fetch(`${API_ROOT}${path}`);
    if (!response.ok) throw new Error(`GET ${path} failed`);
    return response.json();
}

async function apiPost(path, body) {
    const response = await fetch(`${API_ROOT}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `POST ${path} failed`);
    }
    return response.json();
}

async function apiDelete(path, body = null) {
    const options = { method: 'DELETE' };
    if (body) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_ROOT}${path}`, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `DELETE ${path} failed`);
    }
    return response.json();
}

async function apiPatch(path, body) {
    const response = await fetch(`${API_ROOT}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `PATCH ${path} failed`);
    }
    return response.json();
}

async function loadDashboard() {
    try {
        const [restaurants, users, orders] = await Promise.all([
            apiGet('/restaurants'),
            apiGet('/users'),
            apiGet('/orders')
        ]);

        const counts = {
            resCount: restaurants.length,
            userCount: users.length,
            orderCount: orders.length
        };

        Object.entries(counts).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value;
        });
    } catch (error) {
        console.error('Could not load dashboard data.', error);
    }
}

async function displayAllOrders() {
    const tableBody = document.querySelector('#all-orders-table tbody');
    if (!tableBody) return;

    try {
        const orders = await apiGet('/orders');
        tableBody.innerHTML = '';

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">No orders found.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            let action = '';
            if (order.status === 'Pending') {
                action = `<button onclick="updateOrderStatus(${order.id}, 'Preparing')">Mark Preparing</button>`;
            } else if (order.status === 'Preparing') {
                action = `<button onclick="updateOrderStatus(${order.id}, 'Completed')">Mark Completed</button>`;
            } else {
                action = `<span class="order-status">${order.status}</span>`;
            }

            row.innerHTML = `
                <td>${order.id}</td>
                <td class="status">${order.status}</td>
                <td>${action}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Could not load orders.', error);
    }
}

async function updateOrderStatus(id, status) {
    try {
        await apiPatch(`/orders/${id}`, { status });
        await displayAllOrders();
        await loadDashboard();
    } catch (error) {
        console.error('Could not update order status.', error);
        alert('Failed to update order status.');
    }
}

async function displayUsers() {
    const usersList = document.getElementById('users');
    if (!usersList) return;

    try {
        const users = await apiGet('/users');
        if (!users.length) {
            usersList.innerHTML = '<li>No users registered yet.</li>';
            return;
        }

        usersList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.innerHTML = `${user.name || user.email} (${user.role || 'student'}) <button onclick="deleteUser(${user.id})">Remove</button>`;
            usersList.appendChild(li);
        });
    } catch (error) {
        console.error('Could not load users.', error);
        usersList.innerHTML = '<li>Unable to load users.</li>';
    }
}

async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    try {
        await apiDelete(`/users/${id}`);
        await displayUsers();
        await loadDashboard();
    } catch (error) {
        console.error('Could not delete user.', error);
        alert('Failed to delete user.');
    }
}

async function displayRestaurants() {
    const tableBody = document.querySelector('#restaurants-table tbody');
    if (!tableBody) return;

    try {
        const restaurants = await apiGet('/restaurants');
        tableBody.innerHTML = '';

        if (!restaurants.length) {
            tableBody.innerHTML = '<tr><td colspan="3">No restaurants found.</td></tr>';
            return;
        }

        restaurants.forEach(restaurant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${restaurant.name}</td>
                <td>${restaurant.description || 'No description'}</td>
                <td><button onclick="deleteRestaurant(${restaurant.id})">Delete</button></td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Could not load restaurants.', error);
        tableBody.innerHTML = '<tr><td colspan="3">Unable to load restaurants.</td></tr>';
    }
}

async function deleteRestaurant(id) {
    if (!confirm('Delete this restaurant?')) return;
    try {
        await apiDelete(`/restaurants/${id}`);
        await displayRestaurants();
        await loadDashboard();
    } catch (error) {
        console.error('Could not delete restaurant.', error);
        alert('Failed to delete restaurant.');
    }
}

async function populateRestaurantsSelect(){
    const sel = document.getElementById('restaurantsSelect');
    if(!sel) return;
    try {
        const restaurants = await apiGet('/restaurants');
        sel.innerHTML = '';
        restaurants.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = `${r.name} (ID:${r.id})`;
            sel.appendChild(opt);
        });
    } catch (error) {
        console.error('Could not load restaurants for owner mapping.', error);
    }
}

async function getOwnerMappings(){
    try {
        return await apiGet('/owner-mappings');
    } catch (error) {
        console.error('Could not load owner mappings.', error);
        return {};
    }
}

async function renderOwnerMappings(){
    const table = document.querySelector('#ownerMappingsTable tbody');
    if(!table) return;
    const map = await getOwnerMappings();
    table.innerHTML = '';
    const query = (document.getElementById('ownerSearch') && document.getElementById('ownerSearch').value.trim().toLowerCase()) || '';
    const entries = Object.entries(map);

    if (entries.length === 0) {
        table.innerHTML = '<tr><td colspan="3">No owner mappings yet.</td></tr>';
        return;
    }

    for(const [email, ids] of entries){
        if(query && !email.toLowerCase().includes(query)) continue;
        const tr = document.createElement('tr');
        const idsText = Array.isArray(ids) ? ids.join(', ') : ids;
        tr.innerHTML = `<td>${email}</td><td>${idsText}</td><td><button onclick="editOwner('${email}')">Edit</button> <button onclick="removeOwner('${email}')">Remove</button></td>`;
        table.appendChild(tr);
    }
}

let editingOwnerEmail = null;

async function assignOwner(){
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { alert('Only admins can assign owners to restaurants.'); return; }
    const emailEl = document.getElementById('ownerEmail');
    const sel = document.getElementById('restaurantsSelect');
    if(!emailEl || !sel) return;
    const email = emailEl.value.trim().toLowerCase();
    if(!email) { alert('Enter owner email'); return; }
    const selected = Array.from(sel.selectedOptions).map(o => Number(o.value));
    if(selected.length === 0) { alert('Select at least one restaurant'); return; }

    try {
        await apiPost('/owner-mappings', { email, restaurantIds: selected });
        await renderOwnerMappings();
        emailEl.value = '';
        sel.selectedIndex = -1;
        const btn = document.querySelector('button[onclick="assignOwner()"]');
        if(btn) btn.textContent = 'Assign';
        editingOwnerEmail = null;
        alert('Assigned successfully');
    } catch (error) {
        console.error('Could not assign owner.', error);
        alert(error.message || 'Assignment failed.');
    }
}

async function removeOwner(email){
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { alert('Only admins can remove assignments.'); return; }
    if (!confirm('Remove owner mapping for ' + email + '?')) return;

    try {
        await apiDelete(`/owner-mappings/${encodeURIComponent(email)}`);
        await renderOwnerMappings();
    } catch (error) {
        console.error('Could not remove owner mapping.', error);
        alert('Failed to remove owner mapping.');
    }
}

async function editOwner(email){
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') { alert('Only admins can edit assignments.'); return; }
    try {
        const map = await getOwnerMappings();
        if(!map[email]) return;
        const ids = Array.isArray(map[email]) ? map[email] : [map[email]];
        const emailEl = document.getElementById('ownerEmail');
        const sel = document.getElementById('restaurantsSelect');
        if(!emailEl || !sel) return;
        emailEl.value = email;
        Array.from(sel.options).forEach(o => {
            o.selected = ids.includes(Number(o.value));
        });
        const btn = document.querySelector('button[onclick="assignOwner()"]');
        if(btn) btn.textContent = 'Save';
        editingOwnerEmail = email;
    } catch (error) {
        console.error('Could not load owner mapping for edit.', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    if (body.querySelector('#resCount')) loadDashboard();
    if (body.querySelector('#all-orders-table')) displayAllOrders();
    if (body.querySelector('#users')) displayUsers();
    if (body.querySelector('#restaurants-table')) displayRestaurants();
    if (body.querySelector('#restaurantsSelect')) populateRestaurantsSelect();
    if (body.querySelector('#ownerMappingsTable')) renderOwnerMappings();

    const search = document.getElementById('ownerSearch');
    if(search){
        search.addEventListener('input', () => renderOwnerMappings());
    }
});
