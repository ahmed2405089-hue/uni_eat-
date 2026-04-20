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
    window.restaurants.forEach(r => {
        const option = document.createElement("option");
        option.value = r.id;
        option.textContent = r.name;
        select.appendChild(option);
    });

    select.addEventListener("change", displayMenu);
}

function addItem(){
    const name = document.getElementById("itemName").value.trim();
    const price = document.getElementById("itemPrice").value.trim();
    const restaurantId = getCurrentRestaurantId();

    if (!name || !price || !restaurantId) return;

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
                ${i.name} - $${parseFloat(i.price).toFixed(2)}
                <button onclick="editItem(${i.id})">Edit</button>
                <button onclick="removeItem(${i.id})">Remove</button>
            </li>
        `;
    });
}

function removeItem(id){
    const restaurantId = getCurrentRestaurantId();
    if (!restaurantId) return;

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
    let accepted = orders.filter(o => o.status === "Accepted").length;
    let done = orders.filter(o => o.status === "Completed").length;

    if(document.getElementById("totalOrders"))
        document.getElementById("totalOrders").innerText = total;

    if(document.getElementById("pendingOrders"))
        document.getElementById("pendingOrders").innerText = pending;

    if(document.getElementById("completedOrders"))
        document.getElementById("completedOrders").innerText = done;
}

/* ===== INIT ===== */
displayRestaurantOptions();
displayMenu();
displayOrders();
updateDashboard();