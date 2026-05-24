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

function set(key,data){
    localStorage.setItem(key,JSON.stringify(data));
}

function getRestaurantMenus(){
    return JSON.parse(localStorage.getItem("restaurantMenus")) || {};
}

function setRestaurantMenus(data){
    localStorage.setItem("restaurantMenus", JSON.stringify(data));
}

function getCurrentRestaurantId(){
    const select = document.getElementById("restaurantSelect");
    return select ? parseInt(select.value, 10) : null;
}

function getCurrentUser(){
    return {
        role: localStorage.getItem('userRole') || null,
        email: localStorage.getItem('userEmail') || null
    };
}

function getOwnerAllowedRestaurantIds(){
    const user = getCurrentUser();
    if (!user || user.role !== 'owner' || !user.email) return null;

    const mappings = JSON.parse(localStorage.getItem('ownerRestaurants') || '{}');
    const email = user.email.toLowerCase();

    // If explicit mapping exists, return it (array of ids)
    if (mappings[email]) return Array.isArray(mappings[email]) ? mappings[email] : [mappings[email]];

    // Fallback: try to infer from email matching restaurant name
    if (window.restaurants && window.restaurants.length) {
        const found = window.restaurants.filter(r => {
            const key = r.name.toLowerCase().replace(/\s+/g, '');
            return email.includes(key) || email.includes(r.name.toLowerCase());
        }).map(r => r.id);

        if (found.length) return found;
    }

    return [];
}

function getRestaurantMenu(restaurantId){
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
                        price: item.price.toFixed ? item.price.toFixed(2) : item.price
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

function saveRestaurantMenu(restaurantId, menu){
    const menus = getRestaurantMenus();
    menus[restaurantId] = menu;
    setRestaurantMenus(menus);
}

function displayRestaurantOptions(){
    const select = document.getElementById("restaurantSelect");
    if (!select || !window.restaurants) return;

    select.innerHTML = "";
    const user = getCurrentUser();
    let allowed = null;

    if (user && user.role === 'owner') {
        allowed = getOwnerAllowedRestaurantIds();
    }

    // If allowed is null -> not owner or no restriction, show all
    if (allowed === null) {
        window.restaurants.forEach(r => {
            const option = document.createElement("option");
            option.value = r.id;
            option.textContent = r.name;
            select.appendChild(option);
        });
    } else if (Array.isArray(allowed) && allowed.length > 0) {
        // show only allowed restaurants
        const allowedSet = new Set(allowed.map(Number));
        window.restaurants.forEach(r => {
            if (allowedSet.has(r.id)) {
                const option = document.createElement("option");
                option.value = r.id;
                option.textContent = r.name;
                select.appendChild(option);
            }
        });
    } else {
        // owner with no assigned restaurants -> show placeholder
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No assigned restaurants";
        select.appendChild(option);
        select.disabled = true;
    }

    select.addEventListener("change", displayMenu);
}

function addItem(){
    const name = document.getElementById("itemName").value.trim();
    const price = document.getElementById("itemPrice").value.trim();
    const restaurantId = getCurrentRestaurantId();

    if (!name || !price || !restaurantId) return;

    // Owner permission check
    const user = getCurrentUser();
    if (user.role === 'owner'){
        const allowed = getOwnerAllowedRestaurantIds();
        if (Array.isArray(allowed) && !allowed.map(Number).includes(Number(restaurantId))) {
            alert('You do not have permission to add items to this restaurant.');
            return;
        }
    }

    const menu = getRestaurantMenu(restaurantId);
    const newId = Date.now();
    menu.push({ id: newId, name, price: parseFloat(price).toFixed(2) });
    saveRestaurantMenu(restaurantId, menu);

    document.getElementById("itemName").value = "";
    document.getElementById("itemPrice").value = "";

    displayMenu();
}

function editItem(id){
    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId) return;

    // Owner permission check
    const user = getCurrentUser();
    if (user.role === 'owner'){
        const allowed = getOwnerAllowedRestaurantIds();
        if (Array.isArray(allowed) && !allowed.map(Number).includes(Number(restaurantId))) {
            alert('You do not have permission to edit items in this restaurant.');
            return;
        }
    }

    const menu = getRestaurantMenu(restaurantId);
    const item = menu.find(i => i.id == id);
    if (!item) return;

    const name = prompt("Edit item name:", item.name);
    if (!name) return;
    const price = prompt("Edit item price:", item.price);
    if (price === null || price === "") return;

    item.name = name.trim();
    item.price = parseFloat(price).toFixed(2);
    saveRestaurantMenu(restaurantId, menu);
    displayMenu();
}

function displayMenu(){
    const list = document.getElementById("menuList");
    if (!list) return;

    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId) return;

    let menu = getRestaurantMenu(restaurantId);
    if (!menu || menu.length === 0) {
        menu = [];
    }

    list.innerHTML = "";
    menu.forEach(i => {
        list.innerHTML += `
            <li>
                ${i.name} - EGP ${parseFloat(i.price).toFixed(2)}
                <button onclick="promptPrice('${i.id}')">Change Price</button>
                <button onclick="removeItem('${i.id}')">Remove</button>
            </li>
        `;
    });
}

function promptPrice(id){
    const newPrice = prompt("Enter new price:");
    if (newPrice === null) return;
    updatePrice(id, newPrice);
}

function updatePrice(id, newPrice){
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
        alert("Please enter a valid positive price.");
        return;
    }

    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId) return;

    // Owner permission check
    const user = getCurrentUser();
    if (user.role === 'owner'){
        const allowed = getOwnerAllowedRestaurantIds();
        if (Array.isArray(allowed) && !allowed.map(Number).includes(Number(restaurantId))) {
            alert('You do not have permission to update prices in this restaurant.');
            return;
        }
    }

    let menu = getRestaurantMenu(restaurantId);
    const item = menu.find(i => i.id == id);
    if (item) {
        item.price = price.toFixed(2);
        saveRestaurantMenu(restaurantId, menu);
        displayMenu();
    }
}

function removeItem(id){
    if (!confirm("Are you sure you want to delete this item?")) return;

    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId) return;

    // Owner permission check
    const user = getCurrentUser();
    if (user.role === 'owner'){
        const allowed = getOwnerAllowedRestaurantIds();
        if (Array.isArray(allowed) && !allowed.map(Number).includes(Number(restaurantId))) {
            alert('You do not have permission to remove items from this restaurant.');
            return;
        }
    }

    let menu = getRestaurantMenu(restaurantId);
    menu = menu.filter(i => i.id != id);
    saveRestaurantMenu(restaurantId, menu);
    displayMenu();
}

/* ===== ORDERS ===== */
function addOrder(item){
    let orders = get("orders");

    orders.push({
        id: Date.now(),
        item,
        status: "Pending"
    });

    set("orders", orders);
    displayOrders();
    updateDashboard();
}

function acceptOrder(id){
    let orders = get("orders");
    const order = orders.find(o => o.id == id);
    if (!order) return;
    order.status = "Preparing";
    set("orders", orders);
    displayOrders();
    updateDashboard();
}

function completeOrder(id){
    let orders = get("orders");
    const order = orders.find(o => o.id == id);
    if (!order) return;
    order.status = "Ready";
    set("orders", orders);
    displayOrders();
    updateDashboard();
}

function displayOrders(){
    let list = document.getElementById("ordersList");
    if(!list) return;

    let orders = get("orders");

    list.innerHTML = "";

    orders.forEach(o => {
        const orderDescription = o.items ? o.items.map(item => `${item.name} x${item.quantity || item.qty || 1}`).join(", ") : o.item;
        let actionButton = "";
        if (o.status === "Pending") {
            actionButton = `<button onclick="acceptOrder(${o.id})">Accept</button>`;
        } else if (o.status === "Preparing") {
            actionButton = `<button onclick="completeOrder(${o.id})">Mark Ready</button>`;
        } else if (o.status === "Ready") {
            actionButton = `<span class="completed-label">Ready</span>`;
        } else {
            actionButton = `<span class="completed-label">${o.status}</span>`;
        }

        list.innerHTML += `
            <li>
                <strong>Order #${o.id}</strong>: ${orderDescription} - ${o.status} ${actionButton}
            </li>
        `;
    });
}

/* ===== DASHBOARD ===== */
function updateDashboard(){
    let orders = get("orders");

    let total = orders.length;
    let pending = orders.filter(o => o.status === "Pending").length;
    let preparing = orders.filter(o => o.status === "Preparing").length;
    let ready = orders.filter(o => o.status === "Ready").length;

    if(document.getElementById("totalOrders"))
        document.getElementById("totalOrders").innerText = total;

    if(document.getElementById("pendingOrders"))
        document.getElementById("pendingOrders").innerText = pending;

    if(document.getElementById("completedOrders"))
        document.getElementById("completedOrders").innerText = ready;
}

/* ===== INIT ===== */
displayRestaurantOptions();
displayMenu();
displayOrders();
updateDashboard();