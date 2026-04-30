function get(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function formatStatus(status) {
    switch (status) {
        case "Pending":
            return "Your order has been received by the system and will be sent to the restaurant.";
        case "Preparing":
            return "The restaurant is preparing your order now.";
        case "Ready":
            return "Your order is ready for pickup!";
        default:
            return "Order status unavailable.";
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const statusElement = document.getElementById("status");
    const detailsElement = document.getElementById("orderDetails");
    if (!statusElement || !detailsElement) return;

    const lastOrderId = localStorage.getItem("lastOrderId");
    const orders = get("orders");
    const order = orders.find(o => o.id == lastOrderId);

    if (!order) {
        statusElement.textContent = "No recent order found.";
        return;
    }

    statusElement.textContent = formatStatus(order.status);

    // Display order details
    let detailsHTML = `<h3>Order Details</h3>`;
    detailsHTML += `<p><strong>Order ID:</strong> ${order.id}</p>`;
    detailsHTML += `<p><strong>Total:</strong> $${order.total}</p>`;
    detailsHTML += `<p><strong>Items:</strong></p><ul>`;

    order.items.forEach(item => {
        const quantity = item.quantity || item.qty || 1;
        detailsHTML += `<li>${item.name} x${quantity}</li>`;
    });

    detailsHTML += `</ul>`;

    if (order.comment && order.comment.trim()) {
        detailsHTML += `<p><strong>Special Instructions:</strong> ${order.comment}</p>`;
    }

    detailsElement.innerHTML = detailsHTML;
});