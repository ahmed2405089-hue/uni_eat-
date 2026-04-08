  let menu = [];
    function addItem() {
      let name = document.getElementById("itemName").value;
      let price = document.getElementById("itemPrice").value;
      menu.push({ name, price });
      displayMenu();
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