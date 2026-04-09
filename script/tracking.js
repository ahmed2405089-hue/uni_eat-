let s = document.getElementById("status");

s.innerText = localStorage.getItem("status") || "No Order";

setTimeout(() => {
    s.innerText = "Ready for Pickup ✅";
}, 3000);

setTimeout(() => {
    s.innerText = "Picked Up ";
}, 6000);
