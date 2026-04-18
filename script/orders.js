
let menu = JSON.parse(localStorage.getItem("menuItems")) || [];

let orders = JSON.parse(localStorage.getItem("orders")) || [];


function displayMenuForOrder() {
  let menuUl = document.getElementById("menuForOrder");
  menuUl.innerHTML = "";
  menu.forEach((item, index) => {
    let li = document.createElement("li");
    li.innerHTML = `${item.name} - $${item.price} 
      <button onclick="addOrder('${item.name}')">Order</button>`;
    menuUl.appendChild(li);
  });
}


function addOrder(itemName) {
  let newOrder = {
    id: orders.length + 1,
    item: itemName,
    status: "Pending"
  };
  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders));
  displayOrders();
}


function displayOrders() {
  let ordersUl = document.getElementById("ordersList");
  ordersUl.innerHTML = "";
  orders.forEach(order => {
    let li = document.createElement("li");
    li.innerHTML = `#${order.id} - ${order.item} - ${order.status} 
      <button onclick="completeOrder(${order.id})">Complete</button>`;
    ordersUl.appendChild(li);
  });
}


function completeOrder(id) {
  orders = orders.map(order => {
    if (order.id === id) order.status = "Completed";
    return order;
  });
  localStorage.setItem("orders", JSON.stringify(orders));
  displayOrders();
}


displayMenuForOrder();
displayOrders();
