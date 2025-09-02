document.addEventListener("DOMContentLoaded", () => {
  // ---------------- 0. Init ----------------
  let userData = JSON.parse(localStorage.getItem("userData")) || {};
  let tempCheckoutInfo = JSON.parse(sessionStorage.getItem("tempCheckoutInfo")) || {};
  const allProducts = JSON.parse(localStorage.getItem("products")) || [];
  const form = document.querySelector("#checkoutForm");
  const cartContainer = document.querySelector("#cartItems");
  const promoInput = document.querySelector("#promoCode");
  const applyPromoBtn = document.querySelector("#applyPromo");

  const shippingCost = (userData.order?.length > 3 ? 10 : 0);
 
  if (!form || !cartContainer) return;

  // ----- Save Info checkbox -----
  const saveInfoCheckbox =
    form?.querySelector('input[name="saveInfo"], #saveInfo, input[name="save_user_info"], #save_user_info');

  if (saveInfoCheckbox) {
    const hasPref = typeof userData.saveInfoPref === "boolean";
    saveInfoCheckbox.checked = hasPref ? userData.saveInfoPref : !!userData.checkoutSavedData;

    saveInfoCheckbox.addEventListener("change", () => {
      userData.saveInfoPref = saveInfoCheckbox.checked;
      if (!saveInfoCheckbox.checked) {
        delete userData.checkoutSavedData;
      }
      localStorage.setItem("userData", JSON.stringify(userData));
      loadSavedData();
    });
  }

  // ---------------- 1. Render Cart ----------------
  function renderCart() {
    let cart = userData.cart || [];
    const cartContainer = document.getElementById("cartItems");
    const cartTotalDiv = document.getElementById("cartTotal");

    if (!cartContainer || !cartTotalDiv) return;

    cartContainer.innerHTML = "";
    cartTotalDiv.innerHTML = "";

    let subtotal = 0;

    if (cart.length === 0) {
      cartContainer.innerHTML = `
        <div class="text-center py-5">
          <i class="fa fa-shopping-cart fa-2x text-muted mb-3"></i>
          <h5 class="text-muted">Your cart is empty</h5>
        </div>
      `;
      cartTotalDiv.innerHTML = `
        <div class="alert alert-info text-center mb-0">
          No items in cart
        </div>
      `;
      return;
    }

    cart.forEach(item => {
      const quantity = item.quantity || 1;
      const itemTotal = item.priceAfterOffer * quantity;
      subtotal += itemTotal;

      cartContainer.innerHTML += `
        <div class="cart-item d-flex justify-content-between align-items-center border-bottom py-2">
          <div class="d-flex align-items-center gap-2">
            <img src="${item.images?.[0] || 'placeholder.png'}" alt="${item.title || item.name}" 
                 style="width:50px;height:50px;object-fit:cover;" class="rounded">
                 <strong class="text-danger">  × ${quantity}</strong>
          </div>
          <div class="fw-bold text-success">$${itemTotal.toFixed(2)}</div>
        </div>
      `;
    });

    const shippingCost = (userData.order?.length > 3 ? 10 : 0);
    const grandTotal = subtotal + shippingCost;

    cartTotalDiv.innerHTML = `
      <div class="card border-0 shadow-sm p-3 bg-light rounded-3">
        <div class="d-flex justify-content-between mb-2">
          <span class="fs-6 fw-semibold text-muted">Subtotal</span>
          <span class="fs-6 fw-bold text-success">$ ${subtotal.toFixed(2)}</span>
        </div>
      
        <div class="d-flex justify-content-between mb-2">
          <span class="fs-6 fw-semibold text-muted">Shipping</span>
          <span class="fs-6 fw-bold text-success">
            ${shippingCost === 0 ? "Free" : `$ ${shippingCost.toFixed(2)}`}
          </span>
        </div>
        <hr>
        <div class="d-flex justify-content-between">
          <span class="fs-5 fw-bold text-dark">Total</span>
          <span class="fs-6 fw-bold text-success">$ ${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    `;
  }

  // ---------------- 4. Input Validation ----------------
  const regex = {
    name: /^[a-zA-Z\s]{2,50}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-]{7,15}$/,
    address: /^[a-zA-Z0-9\s.,'-]{5,100}$/,
    city: /^[a-zA-Z\s]{2,50}$/,
    company: /^[a-zA-Z0-9\s.,'-]{2,50}$/
  };

  function showError(input, msg) {
    input.classList.add("is-invalid");
    const errEl = input.nextElementSibling;
    if (errEl && errEl.classList.contains("error-message")) {
      errEl.textContent = msg;
      errEl.classList.remove("d-none");
    }
  }

  function clearError(input) {
    input.classList.remove("is-invalid");
    const errEl = input.nextElementSibling;
    if (errEl && errEl.classList.contains("error-message")) {
      errEl.textContent = "";
      errEl.classList.add("d-none");
    }
  }

  function validateInput(input) {
    const val = input.value.trim();
    if (input.hasAttribute("required") && !val) {
      showError(input, `${input.previousElementSibling.textContent.replace('*','').trim()} is required`);
      return false;
    }
    if (!val) { clearError(input); return true; }

    switch (input.name) {
      case "name":
      case "lastName":
        if (!regex.name.test(val)) { showError(input, "Must be 2-50 letters and spaces only"); return false; }
        break;
      case "email":
        if (!regex.email.test(val)) { showError(input, "Invalid email format"); return false; }
        break;
      case "phone":
        if (!regex.phone.test(val)) { showError(input, "Invalid phone number"); return false; }
        break;
      case "address":
        if (!regex.address.test(val)) { showError(input, "Address must be 5-100 valid characters"); return false; }
        break;
      case "city":
        if (!regex.city.test(val)) { showError(input, "City must be 2-50 letters and spaces only"); return false; }
        break;
      case "company":
        if (val && !regex.company.test(val)) { showError(input, "Company name is invalid"); return false; }
        break;
    }
    clearError(input);
    return true;
  }

  function validatePayment() {
    const payment = form.querySelector('input[name="payment"]:checked');
    if (!payment) { Swal.fire("Error","Please select a payment method.","error"); return false; }
    return true;
  }

  function validateForm() {
    let valid = true;
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    inputs.forEach(input => { if (!validateInput(input)) valid = false; });
    if (!validatePayment()) valid = false;
    return valid;
  }

  form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach(input => {
    input.addEventListener('input', () => validateInput(input));
  });

  // ---------------- 5. Auto-save ----------------
  form.addEventListener("input", () => {
    let tempData = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      tempData[el.name] = (el.type === "checkbox" || el.type === "radio") ? el.checked : el.value;
    }
    sessionStorage.setItem("tempCheckoutInfo", JSON.stringify(tempData));
  });

  // ---------------- 6. Promo Code ----------------
  applyPromoBtn?.addEventListener("click", () => {
    const code = promoInput.value.trim().toLowerCase();
    const subtotal = (userData.cart || []).reduce((s,i) => s + (i.price*(i.quantity||1)), 0);
    discountAmount = 0;
    if (code === "save10") {
      discountAmount = subtotal * 0.10;
      Swal.fire("Success!","Promo code applied (10% off).","success");
    } else {
      Swal.fire("Invalid!","Promo code is not valid.","error");
    }
    renderCart();
  });

  // ---------------- 7. Save Permanent Data ----------------
  function savePermanentData() {
    if (saveInfoCheckbox?.checked) {
      const permanentData = {};
      for (const el of form.elements) {
        if (!el.name) continue;
        permanentData[el.name] =
          (el.type === "checkbox") ? el.checked :
          (el.type === "radio")    ? (el.checked ? el.value : (permanentData[el.name] ?? "")) :
                                     el.value;
      }
      userData.checkoutSavedData = permanentData;
    } else {
      delete userData.checkoutSavedData;
    }
    userData.saveInfoPref = !!saveInfoCheckbox?.checked;
    localStorage.setItem("userData", JSON.stringify(userData));
  }

  // ---------------- 8. Place Order ----------------


// Run status update on page load
updateOrderStatuses();

form.addEventListener("submit", e => {
  e.preventDefault();
  if (!validateForm()) return;

  // Check if payment method is set in userData
  if (!userData.paymentMethods) {
    Swal.fire({
      icon: "warning",
      title: "Payment Method Required",
      text: "Please set your payment method in your account before placing an order.",
      confirmButtonText: "Go to Dashboard"
    }).then(() => {
      localStorage.setItem('lastTab', 'payment');
      location.href = "/customer/dashboard/dashboard.html";
    });
    return;
  }

  const cart = userData.cart || [];
  if (cart.length === 0) {
    Swal.fire("Error", "Your cart is empty. Please add products.", "error");
    return;
  }

  Swal.fire({
    title: "Confirm Order",
    text: "Do you want to place this order?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, place it",
  }).then(result => {
    if (!result.isConfirmed) return;

    savePermanentData();

    // Group products by seller
    const ordersBySeller = {};
    cart.forEach(item => {
      const sellerId = item.sellerId || "unknown";
      if (!ordersBySeller[sellerId]) {
        ordersBySeller[sellerId] = [];
      }
      ordersBySeller[sellerId].push(item);
    });

    // Update stock for all products in cart
    cart.forEach(cartItem => {
      const product = allProducts.find(p => p.id === cartItem.id);
      if (!product) return;
      product.stock = Math.max(0, product.stock - (cartItem.quantity || 1));
      if (product.stock === 0) product.status = "Out of Stock";
      else if (product.stock < 20) product.status = "Low Stock";
      else product.status = "In Stock";
    });
    localStorage.setItem("products", JSON.stringify(allProducts));

    const firstName = form.elements["name"].value.trim();
    const lastName = form.elements["lastName"].value.trim();
    const paymentMethod = form.querySelector('input[name="payment"]:checked')?.id || "Unknown";

    // Save orders to oldOrders
    let oldOrders = JSON.parse(localStorage.getItem("oldOrders")) || {};
    const userOrders = [];

    // Create separate order for each seller
    Object.keys(ordersBySeller).forEach(sellerId => {
      const sellerProducts = ordersBySeller[sellerId];
      const sellerSubtotal = sellerProducts.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      
      // Calculate shipping cost per seller
      const sellerShippingCost = sellerSubtotal > 100 ? 0 : 10;
      const sellerTotal = sellerSubtotal + sellerShippingCost;

      // Generate unique order ID for each seller
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 5);
      const orderId = `O_${sellerId}_${timestamp}_${randomSuffix}`;

      // Save to oldOrders
      oldOrders[orderId] = {
        id: orderId,
        customerId: userData.id,
        customerName: `${firstName} ${lastName}`,
        customerEmail: userData.email,
        orderDate: new Date().toISOString(),
        paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        products: sellerProducts.map(item => ({
          productId: item.id,
          productName: item.name || item.title,
          quantity: item.quantity || 1,
          price: item.price,
          total: item.price * (item.quantity || 1)
        })),
        sellerId: sellerId,
        shippingAddress: {
          street: form.elements["address"].value.trim(),
          city: form.elements["city"].value.trim(),
          zipCode: form.elements["address2"].value.trim()
        },
        status: "Pending",
        totalPrice: sellerTotal
      };

      // Add to user orders array
      userOrders.push({
        id: orderId,
        customerId: userData.id,
        customerName: `${firstName} ${lastName}`,
        customerEmail: userData.email,
        totalPaid: sellerTotal,
        paymentMethod: paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        date: new Date().toLocaleString(),
        items: [...sellerProducts],
        shippingAddress: {
          street: form.elements["address"].value.trim(),
          city: form.elements["city"].value.trim(),
          zipCode: form.elements["address2"].value.trim()
        },
        sellerId: sellerId,
        status: "Pending"
      });
    });

    localStorage.setItem("oldOrders", JSON.stringify(oldOrders));

    // Save to user orders
    userData.order = [...(userData.order || []), ...userOrders];
    userData.cart = [];
    localStorage.setItem("userData", JSON.stringify(userData));
    sessionStorage.removeItem("tempCheckoutInfo");

    // Show order confirmation
    const ordersCount = Object.keys(ordersBySeller).length;
    Swal.fire({
      icon: "success",
      title: "Order(s) Placed!",
      html: `Thank you, <strong>${firstName} ${lastName}</strong>.<br>
            Your ${ordersCount > 1 ? ordersCount + ' orders have' : 'order has'} been received.<br>
            <strong>Number of Sellers:</strong> ${ordersCount}<br>
            <strong>Total Items:</strong> ${cart.length}<br>
            <strong>Payment Method:</strong> ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`
    }).then(() => {
      renderCart();
      form.reset();
      localStorage.setItem('lastTab', 'orders');
      location.href = "/customer/dashboard/dashboard.html";
    });
  });
});


  // ---------------- 9. Init ----------------
  renderCart();
  loadSavedData();
});

function loadSavedData() {
  const form = document.querySelector("#checkoutForm");
  if (!form) return;

  const userDataStr = localStorage.getItem("userData");
  if (!userDataStr) return;

  const userData = JSON.parse(userDataStr);
  const saveInfoCheckbox =
    form.querySelector('input[name="saveInfo"], #saveInfo, input[name="save_user_info"], #save_user_info');

  const useSaved = !!(saveInfoCheckbox?.checked && userData.checkoutSavedData);

  const fillForm = (obj = {}) => {
    for (const [key, val] of Object.entries(obj)) {
      const field = form.elements[key];
      if (!field) continue;
      if (field.type === "checkbox") {
        field.checked = !!val;
      } else if (field.type === "radio") {
        const radio = form.querySelector(`input[name="${key}"][value="${val}"]`);
        if (radio) radio.checked = true;
      } else {
        field.value = val ?? "";
      }
    }
  };

  if (useSaved) {
    fillForm(userData.checkoutSavedData);
  } else {
    const [first, ...lastParts] = (userData.name || "").split(" ");
    const profileMap = {
      name: first || "",
      lastName: lastParts.join(" ") || "",
      email: userData.email || "",
      address: userData.address?.street || "",
      city: userData.address?.city || "",
      address2: userData.address?.zipCode || ""
    };
    fillForm(profileMap);
  }
}
