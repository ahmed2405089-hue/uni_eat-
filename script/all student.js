let restaurants = [
    { 
        id: 1, 
        name: "Campus Grill", 
        rating: "4.5", 
        time: "15-20 mins", 
        description: "Serving the best burgers, fries, and shakes on campus. Halal options available.",
        menu: [
            { name: "Classic Beef Burger", description: "100% beef patty, lettuce, tomato, cheese, special sauce.", price: 7.50 },
            { name: "Chicken Burger", description: "Grilled chicken breast with lettuce and mayo.", price: 6.50 },
            { name: "Fries", description: "Crispy golden fries.", price: 3.00 }
        ]
    },
    { 
        id: 2, 
        name: "Healthy Bites", 
        rating: "4.8", 
        time: "10-15 mins", 
        description: "Fresh salads, wraps, and smoothies for a healthy lifestyle.",
        menu: [
            { name: "Caesar Salad", description: "Crisp romaine lettuce with Caesar dressing.", price: 5.50 },
            { name: "Chicken Wrap", description: "Grilled chicken in a whole wheat wrap.", price: 6.00 },
            { name: "Green Smoothie", description: "Blend of spinach, banana, and almond milk.", price: 4.00 }
        ]
    },
    { 
        id: 3, 
        name: "Pizza Express", 
        rating: "4.2", 
        time: "20-30 mins", 
        description: "Authentic Italian pizza and pasta made fresh daily.",
        menu: [
            { name: "Margherita Pizza", description: "Tomato sauce, mozzarella, and basil.", price: 8.00 },
            { name: "Pepperoni Pizza", description: "Classic pepperoni with cheese.", price: 9.50 },
            { name: "Pasta Carbonara", description: "Creamy pasta with bacon and parmesan.", price: 7.00 }
        ]
    }
];

let menuItems = [
    { restaurantId: 1, name: "Pasta", price: 80 },
    { id: 2, name: "Burger", price: 90 },
    { id: 3, name: "Coffee", price: 50 },
    { id: 4, name: "Roll", price: 85 }
];

let restDiv = document.getElementById("restaurants");

if (restDiv) {
    restaurants.forEach(r => {
        let d = document.createElement("div");
        d.innerHTML = `<h3>${r.name}</h3>`;
        d.onclick = () => window.location.href = `menu.html?id=${r.id}`;
        restDiv.appendChild(d);
    });
}

let menuDiv = document.getElementById("menu");

if (menuDiv) {
    let id = new URLSearchParams(window.location.search).get("id");

    menuItems.filter(i => i.restaurantId == id).forEach(item => {
        let d = document.createElement("div");
        d.innerHTML = `${item.name} - ${item.price}
        <button onclick="add('${item.name}',${item.price})">Add</button>`;
        menuDiv.appendChild(d);
    });
}

function add(name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push({ name, price });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Added ✅");
}

const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
addToCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const itemInfo = e.target.closest('.menu-item').querySelector('.item-info');
        if (itemInfo) {
            const name = itemInfo.querySelector('h5').innerText;
            const priceText = itemInfo.querySelector('.price').innerText;
            const price = parseFloat(priceText.replace('$', ''));
            add(name, price);
        }
    });
});
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let list = document.getElementById("orderList");
let total = 0;

if (list) {
    cart.forEach(i => {
        let li = document.createElement("li");
        li.innerText = i.name + " " + i.price;
        list.appendChild(li);
        total += i.price;
    });

    const totalElement = document.getElementById("total");
    if (totalElement) {
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}

function placeOrder() {
    localStorage.setItem("status", "Preparing");
    localStorage.removeItem("cart"); // Clear cart after order
    alert("Order Placed! 🎉");
    window.location.href = "order-tracking.html";
}

const statusElement = document.getElementById("status");
if (statusElement) {
    statusElement.innerText = localStorage.getItem("status") || "No Order";

    setTimeout(() => {
        statusElement.innerText = "Ready for Pickup ✅";
    }, 3000);

    setTimeout(() => {
        statusElement.innerText = "Picked Up ";
    }, 6000);
}

function save() {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    if (!nameInput || !emailInput) return;

    localStorage.setItem("name", nameInput.value);
    localStorage.setItem("email", emailInput.value);
    alert("Saved");
}

window.onload = () => {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    if (nameInput) nameInput.value = localStorage.getItem("name") || "";
    if (emailInput) emailInput.value = localStorage.getItem("email") || "";
}

// Search functionality for student-home.html
const searchForm = document.getElementById('search-form');
if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = document.getElementById('search-input').value.toLowerCase();
        const restaurantCards = document.querySelectorAll('.restaurant-card');
        
        restaurantCards.forEach(card => {
            const name = card.querySelector('h3').innerText.toLowerCase();
            const tags = card.querySelector('.tags').innerText.toLowerCase();
            if (name.includes(query) || tags.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Restaurant details page - keep hardcoded for simplicity
// Removed dynamic population to keep it simple

function addToCart(name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    // Simple add without quantity for simplicity
    cart.push({ name, price });
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Added to cart! ✅");
}

// Load cart on cart page
if (document.getElementById('cart-items')) {
    loadCart();
}

// Load order list on checkout page
if (document.getElementById('orderList')) {
    loadOrderList();
}

function loadOrderList() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const orderList = document.getElementById("orderList");
    orderList.innerHTML = '';

    let total = 0;

    cart.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.name} - $${item.price.toFixed(2)}`;
        orderList.appendChild(li);
        total += item.price;
    });

    const tax = total * 0.05;
    total += tax;

    document.getElementById("total").textContent = `$${total.toFixed(2)}`;
}

function loadCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartItemsDiv = document.getElementById('cart-items');
    cartItemsDiv.innerHTML = '';

    let subtotal = 0;

    cart.forEach((item, index) => {
        subtotal += item.price;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>Price: $${item.price.toFixed(2)}</p>
            </div>
            <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
        `;
        cartItemsDiv.appendChild(cartItem);
    });

    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}
