function get(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function clearCart() {
    localStorage.removeItem("cart");
}

function formatPrice(value) {
    return `EGP ${parseFloat(value).toFixed(2)}`;
}

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
    }, 2200);
}

function renderCart() {
    const orderList = document.getElementById("orderList");
    const totalElement = document.getElementById("total");
    const cart = getCart();
    let subtotal = 0;
    let tax = 0;
    let total = 0;

    if (!orderList || !totalElement) return;

    orderList.innerHTML = "";

    if (cart.length === 0) {
        orderList.innerHTML = "<li>Your cart is empty.</li>";
        totalElement.textContent = "EGP 0.00";
        return;
    }

    cart.forEach(item => {
        const quantity = item.quantity || item.qty || 1;
        const lineTotal = parseFloat(item.price) * quantity;
        subtotal += lineTotal;
        orderList.innerHTML += `<li>${item.name} x${quantity} - ${formatPrice(lineTotal)}</li>`;
    });

    tax = subtotal * 0.05;
    total = subtotal + tax;

    totalElement.textContent = formatPrice(total);
}

async function placeOrder() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast("Your cart is empty.", "info");
        return;
    }

    const subtotal = cart.reduce((sum, item) => {
        const quantity = item.quantity || item.qty || 1;
        return sum + parseFloat(item.price) * quantity;
    }, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const comment = document.getElementById("orderComment").value.trim();

    const restaurantId = cart.length > 0 ? cart[0].restaurantId || null : null;
    const order = {
        items: cart,
        total: parseFloat(total).toFixed(2),
        status: "Pending",
        comment: comment,
        email: localStorage.getItem('userEmail') || 'guest',
        restaurantId
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            const error = await response.json();
            showToast(error.error || 'Could not place order.', 'danger');
            return;
        }

        const createdOrder = await response.json();
        localStorage.setItem("lastOrderId", createdOrder.id);
        clearCart();
        showToast("Order placed successfully! The owner will prepare it now.", "success");
        setTimeout(() => window.location.href = "order-tracking.html", 900);
    } catch (error) {
        showToast("Network error while placing order.", "danger");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    renderCart();
});

// Back-arrow control utilities — show only when an action requests it.
(function () {
    function getBack() { return document.querySelector('.back-arrow'); }
    window.showBackArrow = function () { const b = getBack(); if (b) b.classList.add('show'); };
    window.hideBackArrow = function () { const b = getBack(); if (b) b.classList.remove('show'); };
    const b = getBack();
    if (b && (window.history.length > 1 || (window.location.search && window.location.search.includes('id=')))) {
        b.classList.add('show');
    }
})();