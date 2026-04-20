let menu = JSON.parse(localStorage.getItem("menuItems")) || [];

function addItem() {
  let name = document.getElementById("itemName").value;
  let price = document.getElementById("itemPrice").value;

  if (!name || !price) return alert("Enter name & price");

  menu.push({ name, price });
  localStorage.setItem("menuItems", JSON.stringify(menu));

  displayMenu();

  document.getElementById("itemName").value = "";
  document.getElementById("itemPrice").value = "";
}

function displayMenu() {
  let list = document.getElementById("menuList");
  list.innerHTML = "";
  menu.forEach(item => {
    let li = document.createElement("li");
    li.innerText = `${item.name} - $${item.price}`;
    list.appendChild(li);
  });
}


displayMenu();
