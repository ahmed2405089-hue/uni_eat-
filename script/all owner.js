/* ===== STORAGE ===== */
function get(key){
return JSON.parse(localStorage.getItem(key)) || [];
}

function set(key,data){
localStorage.setItem(key,JSON.stringify(data));
}

/* ===== MENU ===== */
function addItem(){
let name=document.getElementById("itemName").value;
let price=document.getElementById("itemPrice").value;

if(!name||!price) return;

let menu=get("menu");

menu.push({id:Date.now(),name,price});

set("menu",menu);

displayMenu();
}

function displayMenu(){
let list=document.getElementById("menuList");
if(!list) return;

let menu=get("menu");

// If menu is empty, initialize with some sample items
if(menu.length === 0){
menu = [
{id:1, name:"Burger", price:"5.99"},
{id:2, name:"Pizza", price:"8.99"},
{id:3, name:"Fries", price:"2.99"}
];
set("menu", menu);
}

list.innerHTML="";

menu.forEach(i=>{
list.innerHTML+=`
<li>
${i.name} - $${i.price}
<button onclick="removeItem(${i.id})">Remove</button>
</li>
`;
});
}

/* ===== ORDERS ===== */
function addOrder(item){
let orders=get("orders");

orders.push({
id:Date.now(),
item,
status:"Pending"
});

set("orders",orders);
displayOrders();
updateDashboard();
}

function displayOrders(){
let list=document.getElementById("ordersList");
if(!list) return;

let orders=get("orders");

list.innerHTML="";

orders.forEach(o=>{
list.innerHTML+=`
<li>
${o.item} - ${o.status}
<button onclick="complete(${o.id})">Done</button>
</li>
`;
});
}

function removeItem(id){
let menu=get("menu");

menu=menu.filter(i=>i.id!==id);

set("menu",menu);

displayMenu();
}

/* ===== DASHBOARD ===== */
function updateDashboard(){
let orders=get("orders");

let total=orders.length;
let pending=orders.filter(o=>o.status==="Pending").length;
let done=orders.filter(o=>o.status==="Completed").length;

if(document.getElementById("totalOrders"))
document.getElementById("totalOrders").innerText=total;

if(document.getElementById("pendingOrders"))
document.getElementById("pendingOrders").innerText=pending;

if(document.getElementById("completedOrders"))
document.getElementById("completedOrders").innerText=done;
}

/* ===== INIT ===== */
displayMenu();
displayOrders();
updateDashboard();