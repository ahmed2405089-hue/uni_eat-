
function getOrders() {
  return JSON.parse(localStorage.getItem("orders")) || [];
}


function updateDashboard() {
  let orders = getOrders();

  let total = orders.length;
  let pending = orders.filter(o => o.status === "Pending").length;
  let completed = orders.filter(o => o.status === "Completed").length;

  document.getElementById("totalOrders").textContent = total;
  document.getElementById("pendingOrders").textContent = pending;
  document.getElementById("completedOrders").textContent = completed;

  displayAllOrders(orders);
}


function displayAllOrders(orders) {
  let ul = document.getElementById("allOrders");
  ul.innerHTML = "";

  orders.forEach(order => {
    let li = document.createElement("li");
    li.innerHTML = `
      #${order.id} - ${order.item} - ${order.status} 
      <button onclick="completeOrder(${order.id})">Complete</button>
    `;
    ul.appendChild(li);
  });
}


function completeOrder(id) {
  let orders = getOrders();
  orders = orders.map(order => {
    if (order.id === id) order.status = "Completed";
    return order;
  });
  localStorage.setItem("orders", JSON.stringify(orders));
  updateDashboard();
}


setInterval(updateDashboard, 1000);


updateDashboard();