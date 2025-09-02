const categories = [
  { name: 'Computers', icon: 'fas fa-desktop' },
  { name: 'Computer Components', icon: 'fas fa-microchip' },
  { name: 'Computer Accessories', icon: 'fas fa-keyboard' },
  { name: 'Phones', icon: 'fas fa-mobile-alt' },
  { name: 'Phone Accessories', icon: 'fas fa-headphones' },
  { name: 'Tablets', icon: 'fas fa-tablet-alt' },
  { name: 'Networking', icon: 'fas fa-network-wired' },
  { name: 'Smart Home', icon: 'fas fa-home' },
  { name: 'Wearables', icon: 'fa-solid fa-clock' },
  { name: 'Gaming', icon: 'fas fa-gamepad' }
];
// ------------------------- Main Initialization -------------------------
let userData = JSON.parse(localStorage.getItem("userData") || "{}");
// ensure required arrays exist
if (!Array.isArray(userData.likedProducts)) userData.likedProducts = [];
if (!Array.isArray(userData.cart)) userData.cart = [];


let mySwiper;
let products = [];

document.addEventListener("DOMContentLoaded", () => {
  products = getProducts();
  localStorage.setItem("products", JSON.stringify(products))
 
  displayProducts(products);
  setupEventListeners();
  updateLikeIcons();
  loadCategories();
});
let categoriesSwiper;
 // store swiper instance globally
function getProducts() {
  const raw = localStorage.getItem("oldProducts");

  if (!raw) {
    Swal.fire("No Products", "No products found in localStorage.", "info");
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    Swal.fire("Error", "Invalid product data in localStorage.", "error");
    return [];
  }

  let list = [];
  if (Array.isArray(parsed)) {
    list = parsed;
  } else if (parsed && typeof parsed === "object") {
    // flatten object-of-sellers (or any nested objects)
    list = Object.values(parsed).flatMap(seller =>
      Array.isArray(seller) ? seller : Object.values(seller || {})
    );
  }

  list = list.filter(Boolean).map(normalizeProduct);

  if (!list.length) {
    Swal.fire("No Products", "No products found in localStorage.", "info");
  }
list =list.filter(p=> p.status.trim().toLowerCase() !== 'outstock' &&  (p.hasOwnProperty('visible') ? p.visible : true) )
  // console.log("products:", list);
  return list;
  
  
}
function loadCategories() {
  const container = document.querySelector(".categories-swiper");
  if (!container) return;

  // Insert slides
  container.innerHTML = `
    <div class="swiper-slide  category card p-3 text-center active" data-cat="ALL">
      <i class="fas fa-th-large fs-3"></i>
      <p class="mt-2 mb-0">All</p>
    </div>
    ${categories.map(c => `
      <div class="swiper-slide category card p-3 text-center text-muted" data-cat="${c.name}">
        <i class="${c.icon} fs-3"></i>
        <p class="mt-2 mb-0">${c.name}</p>
      </div>
    `).join("")}
  `;

  // Click handler for filtering
  container.addEventListener("click", e => {
    const categoryElement = e.target.closest(".category");
    if (!categoryElement) return;

    const cat = categoryElement.dataset.cat;
    displayProducts(
      cat === "ALL"
        ? products
        : products.filter(p => p.mainCategory === cat || p.subCategory === cat)
    );

    document.querySelectorAll(".category").forEach(c => c.classList.remove("active"));
    categoryElement.classList.add("active");
  });

  // If swiper exists → update it, else → create new
  if (categoriesSwiper) {
    categoriesSwiper.update();
  } else {
    categoriesSwiper = new Swiper(".mySwiper", {
      spaceBetween: 15,
      speed: 600,
      loop: false,
      autoplay: {
        delay: 1000,
        disableOnInteraction: false

      },
      breakpoints: {

        320:  { slidesPerView: 2 },
        576:  { slidesPerView: 3 },
        768:  { slidesPerView: 4 },
        992:  { slidesPerView: 5 },
        1200: { slidesPerView: 6 }
      },
      navigation: {
        nextEl: ".arrow-right",
        prevEl: ".arrow-left"
      }
    });
    categoriesSwiper.el.addEventListener("mouseenter", () => categoriesSwiper.autoplay.stop());
    categoriesSwiper.el.addEventListener("mouseleave", () => categoriesSwiper.autoplay.start());
  }
}



// ------------------------- Helpers -------------------------
const normalizeId = (v) => String(v);

function normalizeProduct(p) {
  return {
    ...p,
    id: normalizeId(p?.id ?? p?.productId ?? p?.sku ?? Math.random().toString(36).slice(2)),
    name: p?.name ?? p?.title ?? "Untitled",
    images: Array.isArray(p?.images) ? p.images : (p?.image ? [p.image] : []),
    subCategory: p?.subCategory ?? p?.category ?? "Uncategorized",
    brand: p?.brand ?? "",
    status: p?.status ?? "—",
    rate: Number(p?.rate) || 0,
    price: Number(p?.price) || 0,
    offer: p?.offer ?? null, // could be number or string "10"
    stock: Number(p?.stock) || 0,
    description: p?.description ?? ""
  };
}
// ------------------------- Data Fetching ------------------------- //


function renderStars(value) {
  const r = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    '<i class="fas fa-star text-warning"></i>'.repeat(full) +
    (half ? '<i class="fas fa-star-half-alt text-warning"></i>' : '') +
    '<i class="far fa-star text-warning"></i>'.repeat(empty)
  );
}

function priceBlock(price, offer) {
  const old = Number(price) || 0;
  const pct = Number.parseInt(offer);
  if (Number.isFinite(pct) && pct > 0) {
    const newPrice = Math.round(old * (1 - pct / 100));
    return `
      <p class="card-text fw-bold text-success">
        <span class="text-decoration-line-through text-muted fw-bold">$ ${old.toFixed(2)}</span>
        <span class="ms-2 fw-bold">$ ${newPrice.toFixed(2)}</span>
      </p>`;
  }
  return `<p class="card-text fw-bold text-success">$ ${old.toFixed(2)}</p>`;
}

// ------------------------- Data Fetching -------------------------


// ------------------------- Display Logic -------------------------
function displayProducts(list) {
  const container = document.getElementById("productsContainer");
  if (!container) return;

  if (!list || !list.length) {
    container.innerHTML = `
      <div class="col-12 text-center my-5 alert alert-success">
        <h4 class="text-muted">No products found.</h4>
      </div>`;
    return;
  }

  const likedSet = new Set((userData.likedProducts || []).map(normalizeId));

  container.innerHTML = list
    .map((p) => {
      const isLiked = likedSet.has(normalizeId(p.id)) ? "text-danger" : "text-secondary";
      const imgSrc = p.images?.[0] || "assets/img/placeholder.png";

      return `
      <div class="col-md-4 mb-4">
  <div class="card shadow-sm h-100 border-0 rounded overflow-hidden">
    
    <!-- صورة المنتج (تاخد الهيدر كله) -->
    <div class="position-relative overflow-hidden" style="height: 15rem;">
      <img src="${imgSrc}" 
           class="card-img-top product-image pt-0 mt-0 w-100 h-100 object-fit-contain transition-img bg-light" 
           alt="${p.name}" 
           data-id="${p.id}" 
           style="cursor:pointer;">
      <!-- زرار لايك -->
      <button class="btn like-btn text-light position-absolute border-0 top-0 end-0 m-2" data-id="${
        p.id
      }">
        <i class="far fa-heart text-light fs-4  ${isLiked}"></i>
      </button>
    </div>

    <!-- باقي تفاصيل المنتج -->
    <div class="card-body p-3">
      <h6 class="card-title text-truncate mb-1">${p.name}</h6>
      ${priceBlock(p.price, p.offer)}

      <p class="card-text mb-1">
        <small class="text-muted">
          ${p.subCategory} <small>(${p.brand})</small>
        </small>
      </p>

      <!-- Rating + Cart -->
      <div class="d-flex justify-content-between align-items-center mt-2">
        <small class="text-muted">
          Rating: ${renderStars(p.rate)}
          <span class="ms-1">(${(Number(p.rate) || 0).toFixed(1)})</span>
        </small>
        <button class="btn btn-sm btn-success add-to-cart-btn ms-2" data-id="${
          p.id
        }">
          <i class="fas fa-cart-plus"></i>
        </button>
      </div>
    </div>
  </div>
</div>
`;
    })
    .join("");

  updateLikeIcons();
}

// ------------------------- Product Modal -------------------------
function renderStars(rate) {
  const fullStars = Math.floor(rate);
  const halfStar = rate % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  return (
    '<i class="fas fa-star text-warning"></i>'.repeat(fullStars) +
    (halfStar ? '<i class="fas fa-star-half-alt text-warning"></i>' : '') +
    '<i class="far fa-star text-warning"></i>'.repeat(emptyStars)
  );
}

function showProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return Swal.fire('Error', 'Product not found!', 'error');

  const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image];

  const slidesHTML = images.map(img => `
    <div class="swiper-slide text-center">
      <img src="${img}" alt="${product.name}" class="img-fluid rounded" style="max-height:400px; object-fit:contain;">
    </div>
  `).join('');

  let priceHTML = '';
  if (product.offer) {
    const discount = parseInt(product.offer, 10);
    const newPrice = (product.price * (1 - discount / 100)).toFixed(2);
    priceHTML = `
      <p><strong>Price:</strong>
        <span class="text-decoration-line-through text-muted">$${product.price.toFixed(2)}</span>
        <span class="text-success fw-bold fs-4 ms-2">$${newPrice}</span>
        <span class="badge bg-danger ms-2">-${discount}%</span>
      </p>`;
  } else {
    priceHTML = `<p><strong>Price:</strong> <span class="text-success fw-bold fs-4">$${product.price.toFixed(2)}</span></p>`;
  }

  document.getElementById('productModalLabel').textContent = product.name;
  document.getElementById('productModalBody').innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <div class="swiper product-images-swiper">
          <div class="swiper-wrapper">${slidesHTML}</div>
         
        </div>
      </div>
      <div class="col-md-6">
       <p><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
     
        <p><strong>Category:</strong> ${product.mainCategory || product.category || 'N/A'} (${product.subCategory || 'N/A'})</p>
        ${priceHTML}
      
        <p><strong>Description:</strong> ${product.description || 'N/A'}</p>
       
        <p><strong>Status:</strong> <span class="badge ${product.status === 'lowstock' ? 'bg-danger' : 'bg-success'}">${product.status}</span></p>
        <p><strong>Rating:</strong> ${renderStars(product.rate)} (${product.rate?.toFixed(1) || '0.0'})</p>
        <div class="d-flex align-items-center gap-2 mt-3">
          <input type="number" id="modalProductQty" value="1" min="1" max="${product.stock}" class="form-control w-25" />
          <button class="btn btn-success flex-fill" id="modalAddToCartBtn">
            <i class="fas fa-shopping-cart me-2"></i> Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;

  const modal = new bootstrap.Modal(document.getElementById('productModal'), { backdrop: 'static', keyboard: false });
  modal.show();

  // Book-style Swiper
  new Swiper('.product-images-swiper', {
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 1,
    loop: true,
    spaceBetween: 30,
    coverflowEffect: {
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    autoplay: { delay: 2500, disableOnInteraction: false },
  });

  // Add to cart button
  const btn = document.getElementById('modalAddToCartBtn');
  btn.replaceWith(btn.cloneNode(true));
  document.getElementById('modalAddToCartBtn').addEventListener('click', () => {
    const qty = parseInt(document.getElementById('modalProductQty').value, 10);
    if (qty <= 0 || qty > product.stock) return Swal.fire('Error', `Enter quantity 1-${product.stock}`, 'error');
    confirmAddToCart(product.id, qty, modal);
  });
}



// ------------------------- Like System -------------------------
function handleLikeProduct(id) {
  const key = normalizeId(id);
  const liked = Array.isArray(userData.likedProducts) ? [...userData.likedProducts.map(normalizeId)] : [];

  const idx = liked.indexOf(key);
  if (idx >= 0) liked.splice(idx, 1);
  else liked.push(key);

  userData.likedProducts = liked;
  localStorage.setItem("userData", JSON.stringify(userData));
  updateLikeIcons();
  updateWishlistCount();
}

function updateLikeIcons() {
  const likedSet = new Set((userData.likedProducts || []).map(normalizeId));
  document.querySelectorAll(".like-btn").forEach((btn) => {
    const pid = btn?.dataset?.id ? normalizeId(btn.dataset.id) : null;
    const icon = btn.querySelector("i");
    if (!pid || !icon) return;
    const isLiked = likedSet.has(pid);
       icon.classList.toggle("text-danger", isLiked);
       icon.classList.toggle("fa-solid", isLiked);
       icon.classList.toggle("text-light", !isLiked);
       icon.classList.toggle("far", !isLiked);
  });
}

// ------------------------- Cart Logic -------------------------
function confirmAddToCart(productId, quantity, modal) {
  Swal.fire({
    title: "Add to cart?",
    text: `Add ${quantity} item(s) to your cart?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "No"
  }).then((result) => {
    if (result.isConfirmed) {
      handleAddToCart(productId, quantity);
      modal?.hide?.();
    }
  });
}

function handleAddToCart(id, qty) {
  const key = normalizeId(id);
  const product = products.find((p) => normalizeId(p.id) === key);
  if (!product) return Swal.fire("Error", "Product not found!", "error");

  const cart = Array.isArray(userData.cart) ? [...userData.cart] : [];
  const existing = cart.find((i) => normalizeId(i.id) === key);

  if (existing) {
    if (existing.quantity + qty > product.stock) {
      return Swal.fire("Error", `Cannot add more than ${product.stock}`, "error");
    }
    existing.quantity += qty;
  } else {
    cart.push({ ...product, quantity: qty });
    if (cart.length > 10) {
      Swal.fire("Warning", "You can only add up to 10 unique products to the cart.", "warning");
    }
  }

  userData.cart = cart;
  localStorage.setItem("userData", JSON.stringify(userData));
  updateCartBadge();

  const cartIcon = document.querySelector("#navCartIcon");
  const cartCount = document.getElementById("cartCount");
  if (cartIcon && cartCount) {
    cartIcon.classList.add("fa-bounce");
    cartCount.classList.remove("d-none");
    cartCount.textContent = userData.cart.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    setTimeout(() => cartIcon.classList.remove("fa-bounce"), 800);
  }

  Swal.fire({
    icon: "success",
    title: "Added to Cart",
    text: `${product.name} x${qty} added!`,
    timer: 1500,
    showConfirmButton: false
  });
}


// ------------------------- UI Components (optional) -------------------------
function initSwiper() {
  if (mySwiper) mySwiper.destroy();
  mySwiper = new Swiper(".swiper", {
    loop: true,
    autoplay: { delay: 2000, disableOnInteraction: false },
    slidesPerView: 4,
    spaceBetween: 10,
    navigation: { nextEl: ".arrow-right", prevEl: ".arrow-left" },
    breakpoints: { 640: { slidesPerView: 2 }, 768: { slidesPerView: 4 }, 1024: { slidesPerView: 6 } }
  });
}

// ------------------------- Event Listeners -------------------------
function setupEventListeners() {
  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase().trim();
    const filtered = products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.mainCategory || "").toLowerCase().includes(term)
    );
    displayProducts(filtered);
  };

  document.getElementById("navSearchInput")?.addEventListener("input", handleSearch);
  document.getElementById("searchInput")?.addEventListener("input", handleSearch);

  document.getElementById("productsContainer")?.addEventListener("click", (e) => {
    const addBtn = e.target.closest(".add-to-cart-btn");
    if (addBtn) {
      const id = addBtn.dataset.id;
      handleAddToCart(id, 1);
      return;
    }
    const likeBtn = e.target.closest(".like-btn");
    if (likeBtn) {
      const id = likeBtn.dataset.id;
      handleLikeProduct(id);
      return;
    }
    const img = e.target.closest(".product-image");
    if (img) {
      const id = img.dataset.id;
      showProductModal(id);
    }
  });
}
