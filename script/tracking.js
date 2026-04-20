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
    if (!statusElement) return;

    const lastOrderId = localStorage.getItem("lastOrderId");
    const orders = get("orders");
    const order = orders.find(o => o.id == lastOrderId);

    if (!order) {
        statusElement.textContent = "No recent order found.";
        return;
    }

    statusElement.textContent = formatStatus(order.status);
});