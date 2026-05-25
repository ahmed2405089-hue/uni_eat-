
/* ===== OWNER ACCOUNTS SYSTEM (Temporary - JavaScript Only) ===== */
const OWNER_ACCOUNTS = {
    'cinnabon@unieats.com': { password: 'pass123', restaurantId: 1, restaurantName: 'Cinnabon' },
    'conitta@unieats.com': { password: 'pass123', restaurantId: 2, restaurantName: 'Conitta' },
    'gyro@unieats.com': { password: 'pass123', restaurantId: 3, restaurantName: 'Gyro' },
    'mycorner@unieats.com': { password: 'pass123', restaurantId: 4, restaurantName: 'My Corner' },
    'tbs@unieats.com': { password: 'pass123', restaurantId: 5, restaurantName: 'TBS' }
};

function authenticateOwner(username, password) {
    const account = OWNER_ACCOUNTS[username];
    if (account && account.password === password) {
        localStorage.setItem('ownerUsername', username);
        localStorage.setItem('userRole', 'owner');
        localStorage.setItem('userEmail', username);
        localStorage.setItem('ownerRestaurants', JSON.stringify([account.restaurantId]));
        return true;
    }}
    return false;
    
/* ============================================
   SHARED UTILITIES
   ============================================ */
function confirmLogout(event) {
    if (event) event.preventDefault();
    window.location.href = 'logout-confirm.html';
}

/* ===== STORAGE ===== */
function get(key){
    return JSON.parse(localStorage.getItem(key)) || [];
}

function getCurrentOwner() {
    const username = localStorage.getItem('ownerUsername');
    if (!username || !OWNER_ACCOUNTS[username]) return null;
    return {
        username: username,
        ...OWNER_ACCOUNTS[username],
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

/* ===== STORAGE ===== */
function get(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getRestaurantMenus() {
    return JSON.parse(localStorage.getItem("restaurantMenus")) || {};
}

function setRestaurantMenus(data) {
    localStorage.setItem("restaurantMenus", JSON.stringify(data));
}

function getCurrentRestaurantId() {
    const owner = getCurrentOwner();
    if (!owner) return null;
    return owner.restaurantId;
}

function getCurrentUser() {
    const owner = getCurrentOwner();
    if (!owner) {
        return {
            role: localStorage.getItem('userRole') || null,
            email: localStorage.getItem('userEmail') || null
        };
    }
    return {
        role: 'owner',
        email: owner.username
    };
}

function getOwnerAllowedRestaurantIds() {
    const owner = getCurrentOwner();
    if (!owner) return null;
    return [owner.restaurantId];
}

function getRestaurantMenu(restaurantId) {
    const menus = getRestaurantMenus();
    if (menus[restaurantId]) {
        return menus[restaurantId];
    }

    if (window.restaurants) {
        const restaurant = window.restaurants.find(r => r.id === restaurantId);
        if (restaurant) {
            const items = [];
            restaurant.categories.forEach((category, categoryIndex) => {
                category.items.forEach((item, itemIndex) => {
                    items.push({
                        id: `${restaurantId}-${categoryIndex}-${itemIndex}`,
                        name: item.name,
                        price: item.price.toFixed ? item.price.toFixed(2) : item.price,
                        category: category.name || 'Uncategorized',
                        image: item.image || null
                    });
                });
            });
            menus[restaurantId] = items;
            setRestaurantMenus(menus);
            return items;
        }
    }

    return [];
}

function saveRestaurantMenu(restaurantId, menu) {
    const menus = getRestaurantMenus();
    menus[restaurantId] = menu;
    setRestaurantMenus(menus);
}

function displayRestaurantOptions() {
    const restaurantNameEl = document.getElementById("restaurantName");
    const owner = getCurrentOwner();

    if (!restaurantNameEl) return;
    if (!owner) {
        restaurantNameEl.textContent = "Please login first";
        restaurantNameEl.style.color = "var(--text-secondary)";
        return;
    }

    restaurantNameEl.textContent = owner.restaurantName;
    restaurantNameEl.style.color = "var(--text)";

    if (document.getElementById("menuList")) {
        displayMenu();
    }
}

/* ===== ITEM MANAGEMENT ===== */
function addItem() {
    const name = document.getElementById("itemName")?.value?.trim();
    const price = document.getElementById("itemPrice")?.value?.trim();
    const category = document.getElementById("itemCategory")?.value?.trim();
    const imageInput = document.getElementById("itemImage");
    const restaurantId = getCurrentRestaurantId();

    if (!name || !price || !restaurantId) {
        alert('Please fill in all required fields (Name, Price)');
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

    const menu = getRestaurantMenu(restaurantId);
    const newId = Date.now().toString();
    
    let imageData = null;
    if (imageInput && imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageData = e.target.result;
            const newItem = {
                id: newId,
                name: name,
                price: parseFloat(price).toFixed(2),
                category: category || 'Uncategorized',
                image: imageData,
                createdAt: new Date().toISOString()
            };
            menu.push(newItem);
            saveRestaurantMenu(restaurantId, menu);
            
            // Clear form
            document.getElementById("itemName").value = "";
            document.getElementById("itemPrice").value = "";
            document.getElementById("itemCategory").value = "";
            document.getElementById("itemImage").value = "";
            document.getElementById("imagePreview").style.backgroundImage = "";
            document.getElementById("imagePreview").classList.remove("has-image");
            
            displayMenu();
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        const newItem = {
            id: newId,
            name: name,
            price: parseFloat(price).toFixed(2),
            category: category || 'Uncategorized',
            image: null,
            createdAt: new Date().toISOString()
        };
        menu.push(newItem);
        saveRestaurantMenu(restaurantId, menu);
        
        // Clear form
        document.getElementById("itemName").value = "";
        document.getElementById("itemPrice").value = "";
        document.getElementById("itemCategory").value = "";
        document.getElementById("itemImage").value = "";
        document.getElementById("imagePreview").style.backgroundImage = "";
        document.getElementById("imagePreview").classList.remove("has-image");
        
        displayMenu();
    }
}

function editItem(id) {
    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId || !isOwnerAuthenticated()) return;

    const menu = getRestaurantMenu(restaurantId);
    const item = menu.find(i => i.id == id);
    if (!item) return;

    const name = prompt("Edit item name:", item.name);
    if (name === null || name.trim() === "") return;
    
    const price = prompt("Edit item price:", item.price);
    if (price === null || price === "") return;
    
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        alert('Please enter a valid price');
        return;
    }

    const category = prompt("Edit category:", item.category || 'Uncategorized');

    item.name = name.trim();
    item.price = parseFloat(price).toFixed(2);
    item.category = category || 'Uncategorized';
    item.updatedAt = new Date().toISOString();
    
    saveRestaurantMenu(restaurantId, menu);
    displayMenu();
}

function updateItemImage(id) {
    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId || !isOwnerAuthenticated()) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const menu = getRestaurantMenu(restaurantId);
                const item = menu.find(i => i.id == id);
                if (item) {
                    item.image = event.target.result;
                    item.updatedAt = new Date().toISOString();
                    saveRestaurantMenu(restaurantId, menu);
                    displayMenu();
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

function displayMenu() {
    const list = document.getElementById("menuList");
    if (!list) return;

    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId) {
        list.innerHTML = '<li style="text-align: center; color: var(--text-secondary);">Please select a restaurant</li>';
        return;
    }

    let menu = getRestaurantMenu(restaurantId);
    if (!menu || menu.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: var(--text-secondary);">No items in menu yet. Add your first item!</li>';
        return;
    }

    list.innerHTML = "";
    menu.forEach(item => {
        const itemHTML = `
            <li>
                <div class="item-info">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : `<div class="item-image" style="background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">📸</div>`}
                    <div class="item-details">
                        <div class="item-name">${escapeHtml(item.name)}</div>
                        <div class="item-meta">${escapeHtml(item.category || 'Uncategorized')}</div>
                    </div>
                </div>
                <div class="item-price">EGP ${parseFloat(item.price).toFixed(2)}</div>
                <div class="actions">
                    <button class="edit" onclick="editItem('${item.id}')">Edit</button>
                    <button class="edit" onclick="updateItemImage('${item.id}')">📷 Image</button>
                    <button class="delete" onclick="removeItem('${item.id}')">Delete</button>
                </div>
            </li>
        `;
        list.innerHTML += itemHTML;
    });
}

function removeItem(id) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId || !isOwnerAuthenticated()) return;

    let menu = getRestaurantMenu(restaurantId);
    menu = menu.filter(i => i.id != id);
    saveRestaurantMenu(restaurantId, menu);
    displayMenu();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/* ===== IMAGE UPLOAD PREVIEW ===== */
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById("itemImage");
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const preview = document.getElementById("imagePreview");
            if (preview && this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.style.backgroundImage = `url('${e.target.result}')`;
                    preview.classList.add("has-image");
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
});

/* ===== ORDERS ===== */
function addOrder(item) {
    let orders = get("orders");

    orders.push({
        id: Date.now(),
        item,
        status: "Pending",
        createdAt: new Date().toISOString(),
        restaurantId: getCurrentRestaurantId()
    });

    set("orders", orders);
    displayOrders();
    updateDashboard();
}

function acceptOrder(id) {
    let orders = get("orders");
    const restaurantId = getCurrentRestaurantId();
    const order = orders.find(o => o.id == id && o.restaurantId === restaurantId);
    if (!order) return;
    order.status = "Preparing";
    order.acceptedAt = new Date().toISOString();
    set("orders", orders);
    displayOrders();
    updateDashboard();
}

function completeOrder(id) {
    let orders = get("orders");
    const restaurantId = getCurrentRestaurantId();
    const order = orders.find(o => o.id == id && o.restaurantId === restaurantId);
    if (!order) return;
    order.status = "Ready";
    order.completedAt = new Date().toISOString();
    set("orders", orders);
    displayOrders();
    updateDashboard();
}

function displayOrders() {
    let list = document.getElementById("ordersList");
    if (!list) return;

    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId) {
        list.innerHTML = '<li style="text-align: center; color: var(--text-secondary); padding: 24px;">Please login as an owner to see your orders.</li>';
        return;
    }

    let orders = get("orders").filter(o => o.restaurantId === restaurantId);

    if (!orders || orders.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: var(--text-secondary); padding: 24px;">No orders yet</li>';
        return;
    }

    list.innerHTML = "";

    orders.forEach(o => {
        const orderDescription = o.items 
            ? o.items.map(item => `${item.name} x${item.quantity || item.qty || 1}`).join(", ") 
            : o.item;
        
        let actionButton = "";
        let statusClass = "";
        
        if (o.status === "Pending") {
            statusClass = "pending";
            actionButton = `<button onclick="acceptOrder('${o.id}')">Accept Order</button>`;
        } else if (o.status === "Preparing") {
            statusClass = "preparing";
            actionButton = `<button onclick="completeOrder('${o.id}')">Mark Ready</button>`;
        } else if (o.status === "Ready") {
            statusClass = "ready";
            actionButton = `<span class="order-status ${statusClass}">Ready for Pickup</span>`;
        } else {
            statusClass = o.status.toLowerCase();
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
}

/* ===== DASHBOARD ===== */
function updateDashboard() {
    let orders = get("orders");
    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId) return;

    let ownerOrders = orders.filter(o => o.restaurantId === restaurantId);
    let total = ownerOrders.length;
    let pending = ownerOrders.filter(o => o.status === "Pending").length;
    let preparing = ownerOrders.filter(o => o.status === "Preparing").length;
    let ready = ownerOrders.filter(o => o.status === "Ready").length;

    if (document.getElementById("totalOrders"))
        document.getElementById("totalOrders").innerText = total;

    if (document.getElementById("pendingOrders"))
        document.getElementById("pendingOrders").innerText = pending;

    if (document.getElementById("completedOrders"))
        document.getElementById("completedOrders").innerText = ready;
}

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', function() {
    displayRestaurantOptions();
    displayMenu();
    displayOrders();
    updateDashboard();
});