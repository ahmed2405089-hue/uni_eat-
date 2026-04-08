 let orders = [
      { id: 1, item: "Burger & Fries", status: "Pending" },
      { id: 2, item: "Pepperoni Pizza", status: "Completed" },
      { id: 3, item: "Sushi Combo & Miso Soup", status: "Completed" }
    ];

    let list = document.getElementById("ordersList");
    orders.forEach(order => {
      let li = document.createElement("li");
      li.innerHTML = `
        <span>#${order.id}</span>
        <span>${order.item}</span>
        <span class="status-${order.status.toLowerCase()}">${order.status}</span>
        <button>View</button>
      `;
      list.appendChild(li);
    });