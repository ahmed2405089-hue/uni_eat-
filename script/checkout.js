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
    return `$${parseFloat(value).toFixed(2)}`;
}

function renderCart() {
    const orderList = document.getElementById("orderList");
    const totalElement = document.getElementById("total");
    const cart = getCart();
    let total = 0;

    if (!orderList || !totalElement) return;

    orderList.innerHTML = "";

    if (cart.length === 0) {
        orderList.innerHTML = "<li>Your cart is empty.</li>";
        totalElement.textContent = "$0.00";
        return;
    }

    cart.forEach(item => {
        const quantity = item.quantity || item.qty || 1;
        const lineTotal = parseFloat(item.price) * quantity;
        total += lineTotal;
        orderList.innerHTML += `<li>${item.name} x${quantity} - ${formatPrice(lineTotal)}</li>`;
    });

    totalElement.textContent = formatPrice(total);
}

function placeOrder() {
    const cart = getCart();
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const total = cart.reduce((sum, item) => {
        const quantity = item.quantity || item.qty || 1;
        return sum + parseFloat(item.price) * quantity;
    }, 0);

    const orders = get("orders");
    const order = {
        id: Date.now(),
        items: cart,
        total: parseFloat(total).toFixed(2),
        status: "Pending",
        createdAt: new Date().toISOString()
    };

    orders.push(order);
    set("orders", orders);
    localStorage.setItem("lastOrderId", order.id);
    clearCart();
    alert("Order placed successfully! The owner will prepare it now.");
    window.location.href = "order-tracking.html";
}

window.addEventListener("DOMContentLoaded", () => {
    renderCart();
});