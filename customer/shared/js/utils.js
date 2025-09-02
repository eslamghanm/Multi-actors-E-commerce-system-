


// On every page load → update cart badge;


// On every page load → update cart badge
document.addEventListener('DOMContentLoaded', () => {

  // If user is on Cart page → remove bounce effect
  if (window.location.pathname.includes('cart.html')) {
    const cartIcon = document.querySelector('#navCartIcon');
    if (cartIcon) cartIcon.classList.remove('fa-bounce');
    localStorage.removeItem('cartUpdated');
  }
});
// Function to update order statuses automatically

function updateOrderStatuses() {
  let oldOrders = JSON.parse(localStorage.getItem("oldOrders")) || {};

  const now = new Date();

  Object.keys(oldOrders).forEach(orderId => {
    const order = oldOrders[orderId];
    const orderDate = new Date(order.orderDate);
    const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

    if (order.status === "Pending" && daysDiff > 2) {
      order.status = "Delivered";
    }
  });

  localStorage.setItem("oldOrders", JSON.stringify(oldOrders));
}

updateOrderStatuses();
function groupProductsBySeller() {
  const raw = localStorage.getItem("products") || [];
  if (!raw) {
    Swal.fire("No Products", "No 'products' found in localStorage.", "info");
    return;
  }

  let products;
  try {
    products = JSON.parse(raw);
  } catch {
    Swal.fire("Error", "Invalid product data in localStorage.", "error");
    return;
  }

  if (!Array.isArray(products)) {
    Swal.fire("Error", "'products' should be an array.", "error");
    return;
  }

  const grouped = {};

  products.forEach(prod => {
    const sellerKey = `Seller${prod.sellerId || "Unknown"}`;
    if (!grouped[sellerKey]) grouped[sellerKey] = {};
    grouped[sellerKey][prod.id] = prod;
  });

  localStorage.setItem("oldProducts", JSON.stringify(grouped));
 
  return grouped;
}

groupProductsBySeller();


