let cart = JSON.parse(localStorage.getItem("cart")) || [];

let summary = document.getElementById("order-summary");
let total = 0;

cart.forEach(item => {
    let p = document.createElement("p");
    p.textContent = item.name + " - " + item.price + " EGP";
    summary.appendChild(p);

    total += item.price;
});


document.getElementById("total").textContent = total;


function placeOrder() {
    localStorage.removeItem("cart");
    window.location.href = "order-tracking.html";
}
