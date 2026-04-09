let restaurants = [
    {id:1,name:"Conitta"},
    {id:2,name:"R2go"},
    {id:3,name:"My Corner"},
    {id:4,name:"Cinnabon"}
];

let menuItems = [
    {restaurantId:1,name:"Pasta",price:80},
    {restaurantId:2,name:"Burger",price:90},
    {restaurantId:3,name:"Coffee",price:50},
    {restaurantId:4,name:"Roll",price:85}
];

let restDiv=document.getElementById("restaurants");

if(restDiv){
    restaurants.forEach(r=>{
        let d=document.createElement("div");
        d.innerHTML=`<h3>${r.name}</h3>`;
        d.onclick=()=>window.location.href=`menu.html?id=${r.id}`;
        restDiv.appendChild(d);
    });
}

let menuDiv=document.getElementById("menu");

if(menuDiv){
    let id=new URLSearchParams(window.location.search).get("id");

    menuItems.filter(i=>i.restaurantId==id).forEach(item=>{
        let d=document.createElement("div");
        d.innerHTML=`${item.name} - ${item.price}
        <button onclick="add('${item.name}',${item.price})">Add</button>`;
        menuDiv.appendChild(d);
    });
}

function add(name,price){
    let cart=JSON.parse(localStorage.getItem("cart"))||[];
    cart.push({name,price});
    localStorage.setItem("cart",JSON.stringify(cart));
    alert("Added ✅");
}
