let restaurants = [
    {
        id: 1,
        name: "Gyro",
        menu: [
            { name: "Crispy Chicken Sandwich", price: 6.5 },
            { name: "Greek Salad", price: 5 },
            { name: "Greek Shawerma", price: 7 },
            { name: "Gyro Fries", price: 4 },
            { name: "Shawerma Meal", price: 8 }
        ]
    },

    {
        id: 2,
        name: "TBS",
        menu: [
            { name: "Latte", price: 3 },
            { name: "Mocha", price: 3.5 },
            { name: "Hot Chocolate", price: 3 },
            { name: "Grilled Chicken Sandwich", price: 6 }
        ]
    },

    {
        id: 3,
        name: "Cinnabon",
        menu: [
            { name: "Cinnabon Classic", price: 4 },
            { name: "Chocobon", price: 4.5 },
            { name: "Caramel Roll", price: 4.5 }
        ]
    },

    {
        id: 4,
        name: "My Corner",
        menu: [
            { name: "Cottage Cheese Sandwich", price: 4 },
            { name: "Crispy Chicken Crepe", price: 5 },
            { name: "Foul Sandwich", price: 3 }
        ]
    },

    {
        id: 5,
        name: "Conitta",
        menu: [
            { name: "Brownie", price: 3 },
            { name: "Cookie", price: 2 },
            { name: "Soft Ice Cream", price: 2.5 }
        ]
    }
];

/* =========================
   RESTAURANTS PAGE
========================= */
let restDiv = document.getElementById("restaurants");

if (restDiv) {
    restaurants.forEach(r => {
        let div = document.createElement("div");

        div.innerHTML = `<h3>${r.name}</h3>`;
        div.onclick = () => {
            window.location.href = `menu.html?id=${r.id}`;
        };

        restDiv.appendChild(div);
    });
}

/* =========================
   MENU PAGE
========================= */
let menuDiv = document.getElementById("menu");

if (menuDiv) {
    let id = new URLSearchParams(window.location.search).get("id");

    let restaurant = restaurants.find(r => r.id == id);

    if (restaurant) {
        restaurant.menu.forEach(item => {
            let div = document.createElement("div");

            div.innerHTML = `
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)}</p>
                <button onclick="addToCart('${item.name}', ${item.price})">Add</button>
            `;

            menuDiv.appendChild(div);
        });
    }
}

/* =========================
   CART SYSTEM
========================= */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(name, price) {
    cart.push({ name, price: parseFloat(price) });
    saveCart();
    alert("Added to cart ✅");
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
        subtotal += item.price;

        let div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)}</p>
            </div>

            <button onclick="removeItem(${index})">X</button>
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

    alert("Order Placed 🎉");
    window.location.href = "order-tracking.html";
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

    alert("Saved ✅");
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