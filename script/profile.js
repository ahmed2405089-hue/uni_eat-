function save(){
    localStorage.setItem("name",name.value);
    localStorage.setItem("email",email.value);
    alert("Saved");
}

window.onload=()=>{
    name.value=localStorage.getItem("name")||"";
    email.value=localStorage.getItem("email")||"";
}
