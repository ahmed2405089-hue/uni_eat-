document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault(); 
            alert("Registration successful! Please login.");
            window.location.href = "login.html";
        });
    }
});
