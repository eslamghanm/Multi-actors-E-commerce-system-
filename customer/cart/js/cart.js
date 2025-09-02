
let userData = JSON.parse(localStorage.getItem("userData"));
document.addEventListener('DOMContentLoaded', loadCart);

function loadCart() {
  let cart = userData.cart || [];

  let cartItems = document.getElementById('cartItems');
  let cartTotal = document.getElementById('cartDetails');
  let clearCartBtn = document.getElementById('clearCart');
  let continuingShoppingBtn = document.getElementById('continuingShoppingBtn');

  cartItems.innerHTML = '';
  let total = 0;

  // Check if cart is empty
  if (cart.length === 0) {
    cartItems.innerHTML = `<tr><td colspan="5" class="text-center  text-danger">Your cart is empty</td></tr>`;
    cartTotal.className = 'd-none';

    if (clearCartBtn) clearCartBtn.disabled = true;
    return;
  }

  // If cart has items
  cartTotal.classList.remove('d-none');
  if (clearCartBtn) clearCartBtn.disabled = false;

  cart.forEach((item, index) => {
    let subtotal = item.price * item.quantity;
    total += subtotal;

    let row = `
      <tr>
        <td>
          <div class="img-wrapper">
            <img src="${item.images[0]}" class="img-fluid cart-item-img w-100 h-100" alt="${item.name}"> 
            
            <span class="close-btn" data-index="${index}">x</span>
          </div>
        </td>
        <td>$ ${item.price.toFixed(2)}</td>
        <td>
          <input type="number" min="1" value="${item.quantity}" class="form-control quantity-input" data-index="${index}">
        </td>
        <td>$${subtotal.toFixed(2)}</td>
       
      </tr>
    `;
    cartItems.innerHTML += row;
  });

  // Example shipping: free if total > 100
  let order = userData.order || [];

  let shipping = 5 // Example shipping cost
  let finalTotal = (total + shipping).toFixed(2);

  cartTotal.innerHTML = `
    <h5 class="mb-3">Cart Total</h5>
    <div class="d-flex justify-content-between mb-2">
      <strong>Subtotal:</strong>
      <span id="cartSubtotal">$ ${total.toFixed(2)}</span>
    </div>
    <hr>
    <div class="d-flex justify-content-between mb-2">
      <strong>Shipping:</strong>
      <span id="cartShipping">${shipping > 0 ? '$' + shipping : 'Free'}</span>
    </div>
    <hr />
    <div class="d-flex justify-content-between">
      <strong>Total:</strong>
      <span id="cartTotal">$ ${finalTotal}</span>
    </div>
    <button class="btn btn-danger px-5 py-2 mt-3 mx-auto" id="checkoutBtn">Process To Checkout</button>
  `;

  // Attach checkout event (after injecting button)
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", processCheckout);

  // Event listeners for items
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', removeItem);
  });

  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', updateQuantity);
  });

  // Other buttons
  if (clearCartBtn) clearCartBtn.onclick = clearCart;
  if (continuingShoppingBtn) continuingShoppingBtn.onclick = continueShopping;
}

function removeItem(e) {
  let index = e.target.getAttribute('data-index');

  Swal.fire({
    title: 'Remove Item?',
    text: "This item will be removed from your cart.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, remove it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      userData.cart.splice(index, 1);
      localStorage.setItem('userData', JSON.stringify(userData));
      loadCart();
      Swal.fire('Removed!', 'Item has been removed.', 'success');
    }
  });
}

function clearCart() {
  Swal.fire({
    title: 'Clear Cart?',
    text: "Do you want to return all products to shop?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, clear it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      userData.cart = [];
      localStorage.setItem('userData', JSON.stringify(userData));
      loadCart();
      Swal.fire('Cleared!', 'Your cart is now empty.', 'success');
    }
  });
}

function updateQuantity(e) {
  let index = e.target.getAttribute('data-index');
  let newQuantity = parseInt(e.target.value);

  if (newQuantity < 1) {
    Swal.fire('Invalid quantity', 'Quantity must be at least 1', 'error');
    loadCart();
    return;
  }

  let cart = userData.cart || [];
  cart[index].quantity = newQuantity;
  userData.cart = cart;
  localStorage.setItem('userData', JSON.stringify(userData));
  loadCart();
}

function processCheckout() {
  let cart = userData.cart || [];
 

  if (!userData) {
    Swal.fire('Not Logged In', 'Please log in before checkout.', 'warning');
    return;
  }

  if (cart.length === 0) {
    Swal.fire('Empty Cart', 'Please add items before checkout.', 'info');
    return;
  }

  Swal.fire({
    title: 'Confirm Checkout',
    text: "Do you want to proceed to checkout?",
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, place order',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      let order = {
        orderId: Date.now(),
        customerId: userData.id,
        customerName: userData.name,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toLocaleString()
      };

      let orders = JSON.parse(sessionStorage.getItem('orders')) || [];
      orders.push(order);
      sessionStorage.setItem('orders', JSON.stringify(orders));

      Swal.fire('Order Placed!', 'Your order has been saved for this session.', 'success')
        .then(() => {
       
          window.location.href = '/customer/checkout/checkout.html';
        });
    }
  });
}

function continueShopping() {
  window.location.href = '/customer/products/products.html';
}
