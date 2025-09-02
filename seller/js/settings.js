const form = document.getElementById("settingsForm");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

// Load currentUser and users from localStorage
let usersData = JSON.parse(localStorage.getItem("users")) || {};
let sellerId = currentUser.id;
let changes = {};

// Populate fields
const fields = ["storeName", "sellerName", "sellerEmail", "city", "street", "zipCode"];
fields.forEach(id => {
    const field = document.getElementById(id);
    if (!field) return;

    if (id === "sellerName") field.value = currentUser.name || "";
    else if (id === "sellerEmail") field.value = currentUser.email || "";
    else if (id === "storeName") field.value = currentUser.storeName || "";
    else if (currentUser.address && currentUser.address[id] !== undefined) {
        field.value = currentUser.address[id];
    } else {
        field.value = currentUser[id] || "";
    }
});

// Regex Validators
const validators = {
    storeName: v => /^[a-zA-Z0-9\s]{3,}$/.test(v) || "Store name min 3 characters",
    sellerName: v => /^[a-zA-Z\s]{3,}$/.test(v) || "Full name min 3 letters",
    sellerEmail: v => /^\S+@\S+\.\S+$/.test(v) || "Invalid email format",
    city: v => /^[a-zA-Z\s]{2,}$/.test(v) || "City min 2 letters",
    street: v => /^[\w\s]{3,}$/.test(v) || "Street min 3 characters",
    zipCode: v => /^\d{5}$/.test(v) || "Zip code must be 5 digits",
    oldPassword: v => v.length === 0 || v === currentUser.password || "Old password incorrect",
    newPassword: v => !form.oldPassword.value.length || v.length >= 6 || "Password min 6 chars",
    confirmPassword: v => !form.oldPassword.value.length || v === form.newPassword.value || "Passwords must match"
};

// Input listener
form.addEventListener("input", e => {
    const id = e.target.id;
    if (!id || !(id in validators)) return;

    const val = e.target.value;
    const valid = validators[id](val);
    const feedback = e.target.nextElementSibling;

    if (valid === true) {
        e.target.classList.remove("is-invalid");
        e.target.classList.add("is-valid");
        changes[id] = val;
        if (feedback) feedback.textContent = "";
    } else {
        e.target.classList.add("is-invalid");
        e.target.classList.remove("is-valid");
        if (feedback) feedback.textContent = valid;
        delete changes[id];
    }

    toggleButtons();
});

function toggleButtons() {
    saveBtn.disabled = Object.keys(changes).length === 0;
    cancelBtn.disabled = Object.keys(changes).length === 0;
}

// Save changes
saveBtn.addEventListener("click", () => {
    if (changes.newPassword) {
        if (!form.oldPassword.value) {
            showToast("Enter old password to change password", "danger");
            return;
        }
        if (form.oldPassword.value !== currentUser.password) {
            showToast("Old password incorrect", "danger");
            return;
        }
        currentUser.password = changes.newPassword;
    }

    if (changes.sellerName) currentUser.name = changes.sellerName;
    if (changes.sellerEmail) currentUser.email = changes.sellerEmail;
    if (changes.storeName) currentUser.storeName = changes.storeName;

    if (!currentUser.address) currentUser.address = {};
    ["city", "street", "zipCode"].forEach(k => {
        if (changes[k] !== undefined) currentUser.address[k] = changes[k];
    });

    if (usersData.sellers && usersData.sellers[sellerId]) {
        Object.assign(usersData.sellers[sellerId], currentUser);
    }

    localStorage.setItem("userData", JSON.stringify(currentUser));
    localStorage.setItem("users", JSON.stringify(usersData));

    changes = {};
    toggleButtons();
    showToast("Settings saved!", "primary");

    form.querySelectorAll("input").forEach(field => field.classList.remove("is-valid"));
    form.oldPassword.value = "";
    form.newPassword.value = "";
    form.confirmPassword.value = "";
});

// Cancel changes
cancelBtn.addEventListener("click", () => {
    fields.forEach(k => {
        const field = document.getElementById(k);
        if (!field) return;

        if (k === "sellerName") field.value = currentUser.name || "";
        else if (k === "sellerEmail") field.value = currentUser.email || "";
        else if (k === "storeName") field.value = currentUser.storeName || "";
        else if (currentUser.address && currentUser.address[k] !== undefined) field.value = currentUser.address[k];
        else field.value = currentUser[k] || "";

        field.classList.remove("is-valid", "is-invalid");
    });

    changes = {};
    toggleButtons();
    form.oldPassword.value = "";
    form.newPassword.value = "";
    form.confirmPassword.value = "";
});
