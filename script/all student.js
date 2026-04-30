window.restaurants = [
    {
        id: 1,
        name: "Gyro",
        categories: [
            {
                name: "Main Dishes",
                items: [
                    { name: "Crispy Chicken Sandwich", price: 6.5 },
                    { name: "Greek Shawerma", price: 7 },
                    { name: "Shawerma Meal", price: 8 }
                ]
            },
            {
                name: "Sides",
                items: [
                    { name: "Greek Salad", price: 5 },
                    { name: "Gyro Fries", price: 4 }
                ]
            }
        ]
    },

    {
        id: 2,
        name: "TBS",
        categories: [
            {
                name: "Beverages",
                items: [
                    { name: "Latte", price: 3 },
                    { name: "Mocha", price: 3.5 },
                    { name: "Hot Chocolate", price: 3 }
                ]
            },
            {
                name: "Sandwiches",
                items: [
                    { name: "Grilled Chicken Sandwich", price: 6 }
                ]
            }
        ]
    },

    {
        id: 3,
        name: "Cinnabon",
        categories: [
            {
                name: "Baked Goods",
                items: [
                    { name: "Cinnabon Classic", price: 4 },
                    { name: "Chocobon", price: 4.5 },
                    { name: "Caramel Roll", price: 4.5 }
                ]
            }
        ]
    },

    {
        id: 4,
        name: "My Corner",
        categories: [
            {
                name: "Sandwiches",
                items: [
                    { name: "Cottage Cheese Sandwich", price: 4 },
                    { name: "Crispy Chicken Crepe", price: 5 },
                    { name: "Foul Sandwich", price: 3 }
                ]
            }
        ]
    },

    {
        id: 5,
        name: "Conitta",
        categories: [
            {
                name: "Desserts",
                items: [
                    { name: "Brownie", price: 3 },
                    { name: "Cookie", price: 2 },
                    { name: "Soft Ice Cream", price: 2.5 }
                ]
            }
        ]
    }
];

/* =========================
   RESTAURANTS PAGE
========================= */
let restDiv = document.getElementById("restaurants");
let searchInput = document.getElementById("restaurant-search");
let searchButton = document.getElementById("search-button");

function renderRestaurants(list) {
    if (!restDiv) return;
    restDiv.innerHTML = "";

    if (list.length === 0) {
        restDiv.innerHTML = "<p class='no-results'>No restaurants or items found.</p>";
        return;
    }

    list.forEach(r => {
        let logoExt = r.name === "Cinnabon" ? "jpeg" : (r.name === "Conitta" ? "png" : "jpg");
        let div = document.createElement("div");
        div.className = "restaurant-card";

        div.innerHTML = `
            <div class="restaurant-image" style="background-image: url('../assets/${r.name.toLowerCase().replace(' ', '')}/logo.${logoExt}'); background-size: cover; background-position: center;"></div>
            <div class="restaurant-info">
                <h3>${r.name}</h3>
                <p class="tags">Delicious food</p>
                <div class="card-meta">
                    <span class="rating">⭐ 4.5</span>
                    <span class="time">🕒 15 mins</span>
                </div>
            </div>
        `;
        div.onclick = () => {
            window.location.href = `resturant-detalis.html?id=${r.id}`;
        };

        restDiv.appendChild(div);
    });
}

function searchRestaurants() {
    if (!searchInput || !restDiv) return;
    const term = searchInput.value.trim().toLowerCase();
    if (!term) {
        renderRestaurants(restaurants);
        return;
    }

    const filtered = restaurants.filter(r => {
        const inName = r.name.toLowerCase().includes(term);
        const inItems = r.categories.some(category =>
            category.items.some(item => item.name.toLowerCase().includes(term))
        );
        return inName || inItems;
    });

    renderRestaurants(filtered);
}

if (restDiv) {
    renderRestaurants(restaurants);
} else {
    console.log("All menu div not found");
}

if (searchButton) {
    searchButton.addEventListener("click", searchRestaurants);
}

if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            searchRestaurants();
        }
    });
}

function getRestaurantMenus() {
    return JSON.parse(localStorage.getItem("restaurantMenus")) || {};
}

function getRestaurantMenu(restaurantId) {
    const menus = getRestaurantMenus();
    return menus[restaurantId] || [];
}

/* =========================
   RESTAURANT DETAILS PAGE
========================= */
let menuDiv = document.getElementById("menu");

if (menuDiv) {
    let id = new URLSearchParams(window.location.search).get("id");
    let restaurant = restaurants.find(r => r.id == id);

    if (restaurant) {
        document.getElementById("rest-name").textContent = restaurant.name;

        function getItemImagePath(restaurant, category, item) {
            const basePath = `../assets/${restaurant.name.toLowerCase().replace(/ /g, '')}/`;
            const itemName = item.name;

            if (restaurant.name === "Cinnabon") {
                const cinnabonMap = {
                    "Cinnabon Classic": "cinnabon-classic-roll.jpg",
                    "Chocobon": "chocobon.jpg",
                    "Caramel Roll": "caramel-roll.jpg"
                };
                return `${basePath}baked goods/${cinnabonMap[itemName] || itemName.toLowerCase().replace(/ /g, '-') + '.jpg'}`;
            }

            if (restaurant.name === "TBS") {
                const tbsMap = {
                    "Latte": "beverages/cold/matcha spanish latte.jpg",
                    "Mocha": "beverages/cold/chocolate peanutbutter frappe.jpg",
                    "Hot Chocolate": "beverages/cold/caramel latte frappe.jpg",
                    "Grilled Chicken Sandwich": "sandwiches/grilled chicken sandwich.jpg"
                };
                if (tbsMap[itemName]) {
                    return `${basePath}${tbsMap[itemName]}`;
                }
                if (category && category.name === "Beverages") {
                    return `${basePath}beverages/cold/${itemName.toLowerCase().replace(/ /g, ' ')}.jpg`;
                }
                return `${basePath}sandwiches/${itemName.toLowerCase().replace(/ /g, ' ')}.jpg`;
            }

            if (restaurant.name === "Gyro") {
                const gyroMap = {
                    "Crispy Chicken Sandwich": "crispy chicken sandwich.jpg",
                    "Greek Shawerma": "greek shawerma.webp",
                    "Shawerma Meal": "shawerma meal.webp",
                    "Greek Salad": "greek salad.webp",
                    "Gyro Fries": "gyro fires.jpg"
                };
                return `${basePath}${gyroMap[itemName] || itemName.toLowerCase().replace(/ /g, ' ') + '.jpg'}`;
            }

            if (restaurant.name === "My Corner") {
                const myCornerMap = {
                    "Cottage Cheese Sandwich": "cottage cheese sandwich.jpg",
                    "Crispy Chicken Crepe": "crispy chicken crepe.jpg",
                    "Foul Sandwich": "foul with olive oil.jpg"
                };
                return `${basePath}${myCornerMap[itemName] || itemName.toLowerCase().replace(/ /g, ' ') + '.jpg'}`;
            }

            if (restaurant.name === "Conitta") {
                const conittaMap = {
                    "Brownie": "Brownie.webp",
                    "Cookie": "Cookie.webp",
                    "Soft Ice Cream": "Soft_Ice_Cream.webp"
                };
                return `${basePath}${conittaMap[itemName] || itemName.replace(/ /g, '_') + '.webp'}`;
            }

            return `${basePath}${itemName.toLowerCase().replace(/ /g, ' ')}.jpg`;
        }

        const dynamicMenu = getRestaurantMenu(restaurant.id);
        const categoriesToRender = dynamicMenu.length
            ? [{ name: "Available Menu", items: dynamicMenu, isCustom: true }]
            : restaurant.categories;

        categoriesToRender.forEach(category => {
            let catDiv = document.createElement("div");
            catDiv.className = "menu-category";
            catDiv.innerHTML = `<h4>${category.name}</h4>`;

            category.items.forEach(item => {
                let itemDiv = document.createElement("div");
                itemDiv.className = "menu-item";

                const imagePath = getItemImagePath(restaurant, category, item);
                const price = parseFloat(item.price || 0).toFixed(2);

                itemDiv.innerHTML = `
                    <div class="item-info">
                        <img src="${imagePath}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; margin-bottom: 10px;" onerror="this.src='../assets/Gemini_Generated_Image_40czvt40czvt40cz.png'">
                        <h4>${item.name}</h4>
                        <p class="price">$${price}</p>
                    </div>
                    <button class="add-to-cart-btn" onclick="addToCart('${item.name}', ${price})">Add</button>
                `;

                catDiv.appendChild(itemDiv);
            });
            menuDiv.appendChild(catDiv);
        });
    } else {
        document.getElementById("rest-name").textContent = "Restaurant Not Found";
        menuDiv.innerHTML = "<p>Please select a valid restaurant.</p>";
    }
}

/* =========================
   CART SYSTEM
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
cart = cart.map(item => ({
    ...item,
    quantity: item.quantity ?? item.qty ?? 1
}));

function createToastContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type = "success") {
    const container = createToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 250);
    }, 2500);
}

function addToCart(name, price) {
    let existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name, price: parseFloat(price), quantity: 1 });
    }
    saveCart();
    showToast("Added to cart ✅", "success");
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* =========================
   LOAD CART PAGE
========================= */
function loadCart() {
    const cartDiv = document.getElementById("cart-items");
    if (!cartDiv) return;

    cartDiv.innerHTML = "";

    let subtotal = 0;

    cart.forEach((item, index) => {
        subtotal += item.price * item.quantity;

        let div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)}</p>
            </div>
            <div class="item-quantity">
                <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
            </div>
            <div class="item-total">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
            <button class="remove-btn" onclick="removeItem(${index})">X</button>
        `;

        cartDiv.appendChild(div);
    });

    updateSummary(subtotal);
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    loadCart();
}

function changeQty(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
    loadCart();
}

function updateSummary(subtotal) {
    let tax = subtotal * 0.05;
    let total = subtotal + tax;

    if (document.getElementById("subtotal"))
        document.getElementById("subtotal").textContent = `$${subtotal.toFixed(2)}`;

    if (document.getElementById("tax"))
        document.getElementById("tax").textContent = `$${tax.toFixed(2)}`;

    if (document.getElementById("total"))
        document.getElementById("total").textContent = `$${total.toFixed(2)}`;
}

/* =========================
   PLACE ORDER
========================= */
function placeOrder() {
    localStorage.setItem("status", "Preparing");
    localStorage.removeItem("cart");

    showToast("Order Placed 🎉", "success");
    setTimeout(() => window.location.href = "order-tracking.html", 900);
}

/* =========================
   ORDER TRACKING
========================= */
window.onload = () => {
    loadCart();

    let status = document.getElementById("status");

    if (status) {
        status.innerText = localStorage.getItem("status") || "No Order";

        setTimeout(() => {
            status.innerText = "Ready for Pickup ✅";
        }, 3000);

        setTimeout(() => {
            status.innerText = "Picked Up";
        }, 6000);
    }

    loadProfile();
};

/* =========================
   PROFILE
========================= */
function saveProfile() {
    let name = document.getElementById("name");
    let email = document.getElementById("email");

    if (!name || !email) return;

    localStorage.setItem("name", name.value);
    localStorage.setItem("email", email.value);

    showToast("Saved ✅", "success");
}

function loadProfile() {
    let name = document.getElementById("name");
    let email = document.getElementById("email");

    if (name) name.value = localStorage.getItem("name") || "";
    if (email) email.value = localStorage.getItem("email") || "";
}

/* =========================
   SEARCH
========================= */
const searchForm = document.getElementById("search-form");

if (searchForm) {
    searchForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const query = document.getElementById("search-input").value.toLowerCase();

        document.querySelectorAll(".restaurant-card").forEach(card => {
            let name = card.querySelector("h3").innerText.toLowerCase();

            card.style.display = name.includes(query) ? "block" : "none";
        });
    });
}