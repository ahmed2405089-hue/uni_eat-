const API_ROOT = '/api';

const OWNER_EMAIL_ACCOUNTS = {
    'cinnabon@unieats.com': { password: 'pass123', restaurantId: 1, restaurantName: 'Cinnabon' },
    'conitta@unieats.com': { password: 'pass123', restaurantId: 2, restaurantName: 'Conitta' },
    'gyro@unieats.com': { password: 'pass123', restaurantId: 3, restaurantName: 'Gyro' },
    'mycorner@unieats.com': { password: 'pass123', restaurantId: 4, restaurantName: 'My Corner' },
    'tbs@unieats.com': { password: 'pass123', restaurantId: 5, restaurantName: 'TBS' }
};

function confirmLogout(event) {
    if (event) event.preventDefault();
    window.location.href = 'logout-confirm.html';
}

function get(key){
    return JSON.parse(localStorage.getItem(key)) || [];
}

function set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getCurrentOwner() {
    const username = localStorage.getItem('ownerUsername');
    if (!username || !OWNER_EMAIL_ACCOUNTS[username]) return null;
    return {
        username: username,
        ...OWNER_EMAIL_ACCOUNTS[username],
        isAuthenticated: true
    };
}

function logoutOwner() {
    localStorage.removeItem('ownerUsername');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('ownerRestaurants');
}

function isOwnerAuthenticated() {
    return getCurrentOwner() !== null;
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

async function apiPut(path, body) {
    const response = await fetch(`${API_ROOT}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `PUT ${path} failed`);
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

async function getCurrentRestaurantId() {
    const owner = getCurrentOwner();
    if (!owner) return null;

    const ownerMappings = await apiGet('/owner-mappings').catch(() => ({}));
    const mapped = ownerMappings[owner.username.toLowerCase()];
    if (mapped && mapped.length) {
        return Number(Array.isArray(mapped) ? mapped[0] : mapped);
    }

    if (localStorage.getItem('ownerRestaurants')) {
        const restaurantIds = JSON.parse(localStorage.getItem('ownerRestaurants'));
        if (Array.isArray(restaurantIds) && restaurantIds.length) {
            return Number(restaurantIds[0]);
        }
    }

    return owner.restaurantId || null;
}

async function getRestaurantData(restaurantId) {
    if (!restaurantId) return null;
    return await apiGet(`/restaurants/${restaurantId}`);
}

function flattenMenu(restaurant) {
    if (!restaurant || !Array.isArray(restaurant.categories)) return [];
    return restaurant.categories.flatMap(category =>
        (category.items || []).map(item => ({
            ...item,
            category: category.name || 'Uncategorized'
        }))
    );
}

async function displayRestaurantOptions() {
    const restaurantNameEl = document.getElementById('restaurantName');
    const owner = getCurrentOwner();

    if (!restaurantNameEl) return;
    if (!owner) {
        restaurantNameEl.textContent = 'Please login first';
        restaurantNameEl.style.color = 'var(--text-secondary)';
        return;
    }

    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId) {
        restaurantNameEl.textContent = 'Restaurant not assigned';
        restaurantNameEl.style.color = 'var(--text-secondary)';
        return;
    }

    try {
        const restaurant = await getRestaurantData(restaurantId);
        restaurantNameEl.textContent = restaurant.name || owner.restaurantName;
        restaurantNameEl.style.color = 'var(--text)';
    } catch (error) {
        console.error('Could not load restaurant data.', error);
        restaurantNameEl.textContent = owner.restaurantName || 'Restaurant';
    }
}

function encodeItemId(category, name) {
    return encodeURIComponent(category || 'Uncategorized') + '|' + encodeURIComponent(name);
}

function decodeItemId(itemId) {
    const [category, name] = itemId.split('|').map(part => decodeURIComponent(part));
    return { category, name };
}

async function addItem() {
    const name = document.getElementById('itemName')?.value?.trim();
    const price = document.getElementById('itemPrice')?.value?.trim();
    const category = document.getElementById('itemCategory')?.value?.trim() || 'Uncategorized';
    const imageInput = document.getElementById('itemImage');
    const restaurantId = await getCurrentRestaurantId();

    if (!name || !price || !restaurantId) {
        alert('Please fill in all required fields (Name, Price) and ensure your restaurant is assigned.');
        return;
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        alert('Please enter a valid price');
        return;
    }

    if (!isOwnerAuthenticated()) {
        alert('You must be logged in as an owner');
        return;
    }

    let imageData = null;
    if (imageInput && imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        imageData = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    const payload = {
        category,
        name,
        price: parseFloat(price),
        image: imageData
    };

    try {
        await apiPost(`/restaurants/${restaurantId}/items`, payload);
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemCategory').value = '';
        if (document.getElementById('itemImage')) document.getElementById('itemImage').value = '';
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.style.backgroundImage = '';
            preview.classList.remove('has-image');
        }
        await displayMenu();
    } catch (error) {
        console.error('Could not create menu item.', error);
        alert(error.message || 'Failed to add item.');
    }
}

async function editItem(itemId) {
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId || !isOwnerAuthenticated()) return;
    const { category, name } = decodeItemId(itemId);
    const newName = prompt('Edit item name:', name);
    if (newName === null || newName.trim() === '') return;

    const newPrice = prompt('Edit item price:', '');
    if (newPrice === null || newPrice.trim() === '') return;
    if (isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0) {
        alert('Please enter a valid price');
        return;
    }

    const newCategory = prompt('Edit category:', category || 'Uncategorized');

    try {
        await apiPut(`/restaurants/${restaurantId}/items`, {
            category,
            originalName: name,
            name: newName.trim(),
            price: parseFloat(newPrice),
            category: newCategory || 'Uncategorized'
        });
        await displayMenu();
    } catch (error) {
        console.error('Could not edit item.', error);
        alert(error.message || 'Failed to update item.');
    }
}

async function updateItemImage(itemId) {
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId || !isOwnerAuthenticated()) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const { category, name } = decodeItemId(itemId);
        const imageData = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });

        try {
            await apiPut(`/restaurants/${restaurantId}/items`, {
                category,
                originalName: name,
                name,
                price: null,
                image: imageData
            });
            await displayMenu();
        } catch (error) {
            console.error('Could not update item image.', error);
            alert(error.message || 'Failed to update item image.');
        }
    };

    input.click();
}

async function displayMenu() {
    const list = document.getElementById('menuList');
    if (!list) return;

    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId) {
        list.innerHTML = '<li style="text-align: center; color: var(--text-secondary);">Please login as an owner or assign a restaurant.</li>';
        return;
    }

    try {
        const restaurant = await getRestaurantData(restaurantId);
        const menu = flattenMenu(restaurant);
        if (!menu || menu.length === 0) {
            list.innerHTML = '<li style="text-align: center; color: var(--text-secondary);">No items in menu yet. Add your first item!</li>';
            return;
        }

        list.innerHTML = '';
        menu.forEach(item => {
            const itemId = encodeItemId(item.category, item.name);
            const imageHtml = item.image ? `<img src="${item.image}" alt="${escapeHtml(item.name)}" class="item-image">` : `<div class="item-image" style="background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">??</div>`;
            const itemHTML = `
                <li>
                    <div class="item-info">
                        ${imageHtml}
                        <div class="item-details">
                            <div class="item-name">${escapeHtml(item.name)}</div>
                            <div class="item-meta">${escapeHtml(item.category || 'Uncategorized')}</div>
                        </div>
                    </div>
                    <div class="item-price">EGP ${parseFloat(item.price || 0).toFixed(2)}</div>
                    <div class="actions">
                        <button class="edit" onclick="editItem('${itemId}')">Edit</button>
                        <button class="edit" onclick="updateItemImage('${itemId}')">?? Image</button>
                        <button class="delete" onclick="removeItem('${itemId}')">Delete</button>
                    </div>
                </li>
            `;
            list.innerHTML += itemHTML;
        });
    } catch (error) {
        console.error('Could not load menu.', error);
        list.innerHTML = '<li style="text-align: center; color: var(--text-secondary);">Unable to load menu.</li>';
    }
}

async function removeItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId || !isOwnerAuthenticated()) return;
    const { category, name } = decodeItemId(itemId);

    try {
        await apiDelete(`/restaurants/${restaurantId}/items`, { category, name });
        await displayMenu();
    } catch (error) {
        console.error('Could not remove item.', error);
        alert('Failed to remove item.');
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function setupImagePreview() {
    const imageInput = document.getElementById('itemImage');
    if (!imageInput) return;
    imageInput.addEventListener('change', function() {
        const preview = document.getElementById('imagePreview');
        if (preview && this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.style.backgroundImage = `url('${e.target.result}')`;
                preview.classList.add('has-image');
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
}

async function displayOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;

    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId) {
        list.innerHTML = '<li style="text-align: center; color: var(--text-secondary); padding: 24px;">Please login as an owner to see your orders.</li>';
        return;
    }

    try {
        const orders = await apiGet(`/orders?restaurantId=${restaurantId}`);
        if (!orders.length) {
            list.innerHTML = '<li style="text-align: center; color: var(--text-secondary); padding: 24px;">No orders yet</li>';
            return;
        }

        list.innerHTML = '';
        orders.forEach(o => {
            const orderDescription = Array.isArray(o.items)
                ? o.items.map(item => `${item.name} x${item.quantity || item.qty || 1}`).join(', ')
                : '';

            let actionButton = '';
            let statusClass = '';
            if (o.status === 'Pending') {
                statusClass = 'pending';
                actionButton = `<button onclick="acceptOrder(${o.id})">Accept Order</button>`;
            } else if (o.status === 'Preparing') {
                statusClass = 'preparing';
                actionButton = `<button onclick="completeOrder(${o.id})">Mark Ready</button>`;
            } else {
                statusClass = 'ready';
                actionButton = `<span class="order-status ${statusClass}">${o.status}</span>`;
            }

            const orderHTML = `
                <li>
                    <div class="order-header">Order #${o.id}</div>
                    <div style="margin-bottom: 12px; color: var(--text-secondary);">${escapeHtml(orderDescription)}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <span class="order-status ${statusClass}">${o.status}</span>
                        ${actionButton}
                    </div>
                </li>
            `;
            list.innerHTML += orderHTML;
        });
    } catch (error) {
        console.error('Could not load owner orders.', error);
        list.innerHTML = '<li style="text-align: center; color: var(--text-secondary); padding: 24px;">Unable to load orders.</li>';
    }
}

async function acceptOrder(id) {
    try {
        await apiPatch(`/orders/${id}`, { status: 'Preparing' });
        await displayOrders();
        await updateDashboard();
    } catch (error) {
        console.error('Could not update order.', error);
        alert('Failed to accept order.');
    }
}

async function completeOrder(id) {
    try {
        await apiPatch(`/orders/${id}`, { status: 'Ready' });
        await displayOrders();
        await updateDashboard();
    } catch (error) {
        console.error('Could not update order.', error);
        alert('Failed to complete order.');
    }
}

async function updateDashboard() {
    const restaurantId = await getCurrentRestaurantId();
    if (!restaurantId) return;

    try {
        const orders = await apiGet(`/orders?restaurantId=${restaurantId}`);
        const total = orders.length;
        const pending = orders.filter(o => o.status === 'Pending').length;
        const ready = orders.filter(o => o.status === 'Ready').length;

        if (document.getElementById('totalOrders')) document.getElementById('totalOrders').innerText = total;
        if (document.getElementById('pendingOrders')) document.getElementById('pendingOrders').innerText = pending;
        if (document.getElementById('completedOrders')) document.getElementById('completedOrders').innerText = ready;
    } catch (error) {
        console.error('Could not update owner dashboard.', error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    setupImagePreview();
    await displayRestaurantOptions();
    await displayMenu();
    await displayOrders();
    await updateDashboard();
});
