let cart=JSON.parse(localStorage.getItem("cart"))||[];
let list=document.getElementById("orderList");
let total=0;

cart.forEach(i=>{
    let li=document.createElement("li");
    li.innerText=i.name+" "+i.price;
    list.appendChild(li);
    total+=i.price;
});

document.getElementById("total").innerText=total;

function placeOrder(){
    localStorage.setItem("status","Preparing");
    alert("Order Placed 🎉");
    window.location.href="order-tracking.html";
}
