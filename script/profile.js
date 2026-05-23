const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect width='100%25' height='100%25' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%236b7280'%3E+%3C/text%3E%3C/svg%3E";

function saveProfile() {
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const profilePreview = document.getElementById("profilePreview");

    if (!name || !email || !profilePreview) return;

    localStorage.setItem("name", name.value);
    localStorage.setItem("email", email.value);

    if (profilePreview.src && profilePreview.src !== defaultAvatar) {
        localStorage.setItem("profilePicData", profilePreview.src);
    }

    alert("Profile saved successfully.");
}

function loadProfile() {
    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const profilePreview = document.getElementById("profilePreview");

    if (name) name.value = localStorage.getItem("name") || "";
    if (email) email.value = localStorage.getItem("email") || "";
    if (profilePreview) profilePreview.src = localStorage.getItem("profilePicData") || defaultAvatar;
}

function previewProfilePic() {
    const fileInput = document.getElementById("profilePic");
    const profilePreview = document.getElementById("profilePreview");

    if (!fileInput || !profilePreview || !fileInput.files || fileInput.files.length === 0) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        profilePreview.src = event.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
}

window.addEventListener("DOMContentLoaded", loadProfile);
