// ============================
// Customer Dashboard JS — fixed with password dropdown
// ============================
let products = [];

document.addEventListener("DOMContentLoaded", () => {
  try {
    products = JSON.parse(localStorage.getItem('products')) || [];
    console.log(products);

    loadCustomerDashboard();
    setupSidebarNavigation();
    setupSidebarToggle();
    renderPaymentMethods();
  } catch (err) {
    console.error("init error:", err);
  }

  // restore last tab
const lastTab = localStorage.getItem("lastTab");
if (lastTab) {
  showSection(lastTab);
  document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
  document.querySelector(`.nav-item[data-section="${lastTab}"]`)?.classList.add("active");
} else {
  showSection("profile"); // default section
}


  // save tab on click
 document.getElementById('WishList')?.addEventListener('click', () => {
  localStorage.setItem("lastTab", "wishlist"); // lowercase to match data-section
  location.href = "/customer/dashboard/dashboard.html";
});

});



// ----------------------------
// Helpers
// ----------------------------

const read = (k, fb = "null") => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? fb);
  } catch (e) {
    console.warn("read parse failed for", k, e);
    return null;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error("localStorage write failed", e);
  }
};
const byId = (id) => document.getElementById(id) ?? null;
const setErr = (id, msg = "") => {
  const el = byId(id);
  if (el) el.innerText = msg;
};

// ----------------------------
// Load Dashboard
// ----------------------------
const userData = read("userData", "{}") || {};

function loadCustomerDashboard() {
  const user = read("userData", "{}") || {};

  if (byId("customerName")) byId("customerName").textContent = user.name || "Guest";
  renderWishlist(products);
  renderOrders();
  renderUserInfo(user);
}

// ----------------------------
// Wishlist (normalized id types)
// ----------------------------
function renderWishlist(products) {
  const wrap = byId("wishlistItems");
  if (!wrap) return;

  const liked = userData.likedProducts || [];

  if (!liked.length) {
    wrap.innerHTML = `
      <div class="col-12 text-center py-5">
        <i class="fa fa-heart-broken fa-2x text-muted mb-3"></i>
        <h5 class="text-muted">Your wishlist is empty</h5>
      </div>
    `;
    return;
  }

  wrap.innerHTML = liked
    .map((idStr) => {
    const p = (products || []).find(x => String(x?.id) === String(idStr));

      return p
        ? `
      <div class=" col-md-6 col-lg-4  mb-4 wishlistCard">
        <div class="card h-100 shadow-sm border-0">
          <img src="${
            p.images[0]
          }" class="card-img-top  w-100 rounded-5" style="height:200px; " alt="${
            p.name
          }">
          <div class="card-body d-flex flex-column">
            <h6 class="card-title text-truncate fs-6 text-muted">${p.name}</h6>
            <span class="badge bg-success mb-2">$ ${p.price.toFixed(2)}</span>
            <div class="mt-auto d-flex justify-content-between">
             <div class="btn-group mx-auto w-100">
             <button class="btn btn-outline-danger btn-sm" onclick="removeFromWishlist('${
               p.id
             }', this)">
              <i class="fa fa-heartbeat"></i> 
            </button>
              <button class="btn btn-outline-info btn-sm" onclick="viewProduct('${
                p.id
              }')">
                <i class="fa fa-eye"></i> 
              </button>
              <button class="btn btn-outline-success btn-sm" onclick="addToCart('${
                p.id
              }')">
                <i class="fa fa-shopping-cart"></i> 
              </button>
             </div>
            </div>
          </div>
        </div>
      </div>`
        : "";
    })
    .join("");

  // keep liked in userData too
  if (Object.keys(userData).length) {
    userData.likedProducts = liked;
    write("userData", userData);
  }
}

// ----------------------------
// Orders
// ----------------------------
function renderOrders() {
  const currentUser = read("userData", "{}") || {};
  const currentUserId = currentUser.id || currentUser.userId;
  
  const allOrders = JSON.parse(localStorage.getItem('oldOrders')) || {};
  const ordersArray = Object.values(allOrders);
  
  const userOrders = ordersArray.filter(order => {
    return order.customerId && (
      String(order.customerId) === String(currentUserId) ||
      String(order.customerId) === String(currentUser.customerId) ||
      (order.customerEmail && order.customerEmail === currentUser.email)
    );
  });

  const tbody = byId("ordersTableBody");
  if (!tbody) return;

  if (!userOrders.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-muted">
          <i class="fa fa-box-open fa-2x mb-2"></i><br>
          No orders found
        </td>
      </tr>
    `;
    return;
  }

  const now = Date.now();
  tbody.innerHTML = userOrders
    .map((o, i) => {
      const dateObj = new Date(o.orderDate || o.date);
      const diffDays = isNaN(+dateObj) ? Infinity : (now - +dateObj) / 86400000;
      const pending = diffDays <= 2 || o.status === 'Pending' || o.status === 'Processing';
      
      let statusClass = 'bg-warning text-dark';
      if (o.status === 'Delivered') statusClass = 'bg-success';
      if (o.status === 'Cancelled') statusClass = 'bg-danger';
      
      return `
      <tr>
        <td>${i + 1}</td>
        <td class="text-muted fs-6">${(o.products || o.items || []).map((it) => it.productName || it.name).join(", ")}</td>
        <td><span class="badge ${statusClass}">
          ${o.status || (pending ? "Pending" : "Completed")}</span>
        </td>
        <td class="text-muted">${o.orderDate || o.date}</td>
        <td class="text-muted">$ ${(o.totalPrice || o.totalPaid || 0).toFixed(2)}</td>
      </tr>`;
    })
    .join("");
}

// ----------------------------
// Payment Methods
// ----------------------------
function renderPaymentMethods() {
  const wrap = byId("paymentInfo");
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="card mb-3">
      <div class="card-body">
        <p class="card-text text-danger">Choose a method:</p>
        
        <button class="btn btn-outline-danger mb-2 m-e-5" onclick="selectPayment('card')">💳 Credit / Debit Card</button>
        <button class="btn btn-outline-success mb-2" onclick="selectPayment('paypal')">🅿️ PayPal</button>
     
      </div>
    </div>
  `;
}

function selectPayment(type) {
  let html = "";

  if (type === "card") {
    html = `
      <label>Card Number:</label>
      <input id="cardNumber" type="text" class="form-control mb-2" placeholder="Enter card number" required>
      
      <label>Expiry Date:</label>
      <input id="cardExpiry" type="month" class="form-control mb-2" required>
      
      <label>CVV:</label>
      <input id="cardCVV" type="password" class="form-control mb-2" placeholder="***" required>
    `;
  } else if (type === "paypal") {
    html = `
      <label>PayPal Email:</label>
      <input id="paypalEmail" type="email" class="form-control mb-2" placeholder="Enter PayPal email" required>
    `;
  } 

  Swal.fire({
    title: "Payment Details",
    html: html,
    showCancelButton: true,
    confirmButtonText: "Save",
    preConfirm: () => {
      if (type === "card") {
        const number = document.getElementById("cardNumber").value.trim();
        const expiry = document.getElementById("cardExpiry").value;
        const cvv = document.getElementById("cardCVV").value.trim();

        // Validate card number (basic length check)
        if (!/^\d{13,19}$/.test(number)) {
          Swal.showValidationMessage("Please enter a valid card number (13–19 digits).");
          return false;
        }

        // Validate expiry date (must be in future)
        if (!expiry) {
          Swal.showValidationMessage("Please select an expiry date.");
          return false;
        } else {
          const [year, month] = expiry.split("-").map(Number);
          const now = new Date();
          const expDate = new Date(year, month - 1);
          if (expDate < new Date(now.getFullYear(), now.getMonth())) {
            Swal.showValidationMessage("The expiry date must be in the future.");
            return false;
          }
        }

        // Validate CVV
        if (!/^\d{3,4}$/.test(cvv)) {
          Swal.showValidationMessage("Please enter a valid CVV (3 or 4 digits).");
          return false;
        }

        return { type, number, expiry, cvv };

      } else if (type === "paypal") {
        const email = document.getElementById("paypalEmail").value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          Swal.showValidationMessage("Please enter a valid PayPal email.");
          return false;
        }
        return { type, email };
      } else {
        return { type };
      }
    },
  }).then((result) => {
    if (result.isConfirmed) {
      if (!Array.isArray(userData.paymentMethods)) {
        userData.paymentMethods = [];
      }
      const exists = userData.paymentMethods.some(
        (pm) => JSON.stringify(pm) === JSON.stringify(result.value)
      );
      if (exists) {
        Swal.fire("Duplicate Found", "This payment method already exists.", "warning");
      } else {
        userData.paymentMethods.push(result.value);
        write("userData", userData);
        Swal.fire("Saved!", "Your payment method has been added.", "success");
      }
    }
  });
}


// ----------------------------
// User Info
// ----------------------------
function renderUserInfo(user) {
  const el = byId("userInfo");
  if (!el) return;

  const inputTpl = (label, id, type, value = "") => `
    <label for="${id}" class="form-label">${label} <span class="text-danger">*</span></label>
    <input type="${type}" class="form-control mb-3 border-0 bg-light p-2" id="${id}" value="${value || ""}" placeholder="${label}" required>
  `;

  const passwordTpl = (label, id, value = "") => `
    <label for="${id}" class="form-label">${label}${id === "passwordInput" ? ' <span class="text-danger">*</span>' : ""}</label>
    <div class="input-group mb-3">
      <input type="password" class="form-control border-0 bg-light p-2" id="${id}" value="${value}" placeholder="${label}">
      <button class="btn btn-outline-secondary" type="button" onclick="togglePassword('${id}', this)">
        <i class="fa-solid fa-eye"></i>
      </button>
    </div>`;

el.innerHTML = `
  <form>
    ${inputTpl("Name", "nameInput", "text", user.name)}
    <div id="nameError" class="text-danger"></div>

    ${inputTpl("Email", "emailInput", "email", user.email)}
    <div id="emailError" class="text-danger"></div>

    ${inputTpl("Phone", "phoneInput", "text", user.phone)}
    <div id="phoneError" class="text-danger"></div>

    ${inputTpl("Street", "streetInput", "text",  "")}
    <div id="streetError" class="text-danger"></div>

    ${inputTpl("City", "cityInput", "text",  "")}
    <div id="cityError" class="text-danger"></div>

    ${inputTpl("Zip Code", "zipCodeInput", "text",  "")}
    <div id="zipCodeError" class="text-danger"></div>

    ${passwordTpl("Current Password", "passwordInput", user.password || "")}
    <div id="passwordError" class="text-danger"></div>

    <button type="button" class="btn btn-link p-0 mb-2" onclick="togglePasswordFields()">Change Password</button>

    <div id="newPasswordSection" class="d-none">
      ${passwordTpl("New Password", "newPasswordInput")}
      <div id="newPasswordError" class="text-danger"></div>

      ${passwordTpl("Confirm Password", "confirmPasswordInput")}
      <div id="confirmPasswordError" class="text-danger"></div>
    </div>

    <div class="btns d-flex flex-row-reverse gap-3">
      <button type="button" class="btn btn-danger mt-3" onclick="updateUserInfo()">Save Changes</button>
      <button type="button" class="btn btn-secondary mt-3" onclick="cancelUserInfo()">Cancel</button>
    </div>
  </form>
`;

}

// ----------------------------
// Sidebar navigation + toggle
// ----------------------------
function showSection(section) {
  const dataSections = document.querySelectorAll("[data-section-id]");
  if (dataSections.length) {
    dataSections.forEach((el) => el.classList.add("d-none"));
    if (section) document.querySelectorAll(`[data-section-id="${section}"]`).forEach((el) => el.classList.remove("d-none"));
  } else {
    document.querySelectorAll(".section").forEach((el) => el.classList.add("d-none"));
    if (section) byId(section)?.classList.remove("d-none");
  }
 
}



function setupSidebarNavigation() {
document.querySelectorAll(".nav-item").forEach(item => {
  const section = item.dataset.section;
  item.addEventListener("click", () => {
    showSection(section);
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    item.classList.add("active");
    localStorage.setItem("lastTab", section); // save last opened section
  });
});

}

function setupSidebarToggle() {
  const btn = byId("sidebarToggle");
  const sidebar = byId("sidebar");
  if (!btn || !sidebar) return;
  btn.addEventListener("click", () => sidebar.classList.toggle("collapsed"));
}

// ----------------------------
// Profile utils
// ----------------------------
function updateUserInfo() {
  const v = (id) => (byId(id)?.value || "").trim();

  const fields = {
    name: v("nameInput"),
    email: v("emailInput"),
    phone: v("phoneInput"),
    street: v("streetInput"),
    city: v("cityInput"),
    zipCode: v("zipCodeInput"),
    currentPassword: v("passwordInput"),
    newPassword: v("newPasswordInput"),
    confirmPassword: v("confirmPasswordInput"),
  };

  // Clear old errors
  ["name", "email", "phone", "street", "city", "zipCode", "password", "newPassword", "confirmPassword"].forEach((x) =>
    setErr(`${x}Error`, "")
  );

  const re = {
    name: /^[a-zA-Z\s]{3,30}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[0-9]{10,15}$/,
    zipCode: /^[0-9]{4,10}$/,
    password: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/,
  };

  let ok = true;

  if (!re.name.test(fields.name)) {
    setErr("nameError", "Name must be 3–30 letters only.");
    ok = false;
  }
  if (!re.email.test(fields.email)) {
    setErr("emailError", "Enter a valid email.");
    ok = false;
  }
  if (!re.phone.test(fields.phone)) {
    setErr("phoneError", "Phone must be 10–15 digits.");
    ok = false;
  }
  if (fields.street.length < 3) {
    setErr("streetError", "Street must be at least 3 chars.");
    ok = false;
  }
  if (fields.city.length < 2) {
    setErr("cityError", "City must be at least 2 chars.");
    ok = false;
  }
  if (!re.zipCode.test(fields.zipCode)) {
    setErr("zipCodeError", "Zip Code must be 4–10 digits.");
    ok = false;
  }

  if (userData.password && fields.currentPassword && fields.currentPassword !== userData.password) {
    setErr("passwordError", "Current password is incorrect.");
    ok = false;
  }

  if (!byId("newPasswordSection").classList.contains("d-none")) {
    if (fields.newPassword) {
      if (!re.password.test(fields.newPassword)) {
        setErr("newPasswordError", "At least 6 chars, 1 uppercase, 1 number, 1 special char.");
        ok = false;
      }
      if (fields.newPassword === userData.password) {
        setErr("newPasswordError", "New password must be different from old password.");
        ok = false;
      }
      if (fields.newPassword !== fields.confirmPassword) {
        Swal.fire({
          icon: "error",
          title: "Password Mismatch",
          text: "New password and confirm password do not match.",
        });
        return;
      }
    }
  }

  if (!ok) return;

  Object.assign(userData, {
    name: fields.name,
    email: fields.email,
    phone: fields.phone,
    street: fields.street,
    city: fields.city,
    zipCode: fields.zipCode,
    ...(fields.newPassword && { password: fields.newPassword }),
  });

  write("userData", userData);
  if (byId("customerName")) byId("customerName").textContent = userData.name || "Guest";

  Swal.fire({
    icon: "success",
    title: "Profile Updated",
    text: "Your profile has been updated successfully.",
  });
}


function cancelUserInfo() {
  renderUserInfo(read("userData", "{}") || {});
}

// ----------------------------
// Wishlist actions (type-safe)
// ----------------------------
function removeFromWishlist(productId, btn) {
  Swal.fire({
    title: "Are you sure?",
    text: "This item will be removed from your wishlist.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, remove it",
  }).then((result) => {
    if (result.isConfirmed) {
      // 1- تحديث بيانات المستخدم
      userData.likedProducts = (userData.likedProducts || []).filter(
        (x) => String(x) !== String(productId)
      );
      write("userData", userData);

      // 2- حذف الكارت من الـ DOM
      const card = btn.closest(".wishlistCard"); // استخدم class بدل id
      if (card) card.remove();

      // 3- لو فاضية → اعرض رسالة "empty"
      if (!userData.likedProducts.length) {
        const wrap = byId("wishlistItems");
        wrap.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="fa fa-heart-broken fa-2x text-muted mb-3"></i>
            <h5 class="text-muted">Your wishlist is empty</h5>
          </div>
        `;
      }

      // 4- رسالة نجاح
      Swal.fire("Deleted!", "Product removed from your wishlist.", "success");
    }
  });
}



function viewProduct(productId) {
  const p = (products || []).find((x) => String(x?.id) === String(productId));
  if (!p) return;

  Swal.fire({
    title: p.name || p.title || "Unnamed Product",
    html: `
      
      <p>${p.description || "No description available."}</p> 
      <p>Category: ${p.mainCategory || "N/A"}</p>
      <p class="text-success">
        Price: $${typeof p.price === "number" ? p.price.toFixed(2) : "N/A"}
      </p>
      <p class="text-info">Status: ${p.status || "Unknown"}</p>
    `,
    showCloseButton: true,
    imageUrl: (p.images && p.images[0]) || p.image || '',
    imageWidth: 250,
    imageHeight: 200,
    imageAlt: p.name || p.title || "Product Image",
  });
}

function addToCart(productId) {
  const cart = userData.cart || [];
  const product = products.find((x) => String(x.id) === String(productId));
  if (!product) return;

  cart.push({ ...product, quantity: 1 });
  userData.cart = cart;
  write("userData", userData);
  Swal.fire({ icon: "success", title: "Added to Cart", text: `${product.title} has been added to your cart.` });
}

// ----------------------------
// Password toggle (safe)
// ----------------------------
function togglePassword(inputId, btn) {
  const input = byId(inputId);
  const icon = btn?.querySelector("i");
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  icon?.classList.toggle("fa-eye");
  icon?.classList.toggle("fa-eye-slash");
}

function togglePasswordFields() {
  const sec = byId("newPasswordSection");
  sec.classList.toggle("d-none");
}

// expose handlers explicitly
Object.assign(window, {
  loadCustomerDashboard,
  renderWishlist,
  renderOrders,
  renderUserInfo,
  showSection,
  setupSidebarNavigation,
  setupSidebarToggle,
  updateUserInfo,
  cancelUserInfo,
  removeFromWishlist,
  viewProduct,
  togglePassword,
  togglePasswordFields,

});

document.getElementById("sidebarToggle")?.addEventListener("click", () => {
  document.getElementById("sidebar")?.classList.toggle("open");
  document.getElementById("sidebarToggle")?.classList.toggle("d-none");
  document.getElementById("sidebarClose")?.classList.toggle("d-none");
});
document.getElementById("sidebarClose")?.addEventListener("click", () => {
  document.getElementById("sidebar")?.classList.toggle("open");
  document.getElementById("sidebarToggle")?.classList.toggle("d-none");
  document.getElementById("sidebarClose")?.classList.toggle("d-none");
});

