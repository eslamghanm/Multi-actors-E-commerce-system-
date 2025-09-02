// ============= Products Management System =============

// Global variables
let currentPage = 1;
let itemsPerPage = 10;
let totalProducts = 0;
let filteredProducts = [];
let allProducts = [];
let selectedProducts = [];
let currentEditingProduct = null;

// ============= Initialization =============
// This function runs when the DOM is fully loaded.
// Check if the 'oldProducts' key exists in localStorage for testing.
// If not, you can add sample data like this:
if (!localStorage.getItem("oldProducts")) {
  const sampleData = {
    Seller3: {
      P_3_1: {
        id: "P_3_1",
        mainCategory: "Computer Components",
        subCategory: "Power Supply",
        brand: "Samsung",
        name: "Samsung Power Supply Elite",
        offer: "",
        price: 46.67,
        priceAfterOffer: 46.67,
        rate: 3.1,
        status: "instock",
        stock: 92,
        totalSales: 83,
        visibility: true,
        createdAt: "2024-03-11T15:35:38.038Z",
      },
      P_3_2: {
        id: "P_3_2",
        mainCategory: "Smart Home",
        subCategory: "Smart Light",
        brand: "Eufy",
        name: "Eufy Smart Light",
        price: 25.0,
        rate: 4.5,
        stock: 150,
        status: "instock",
        createdAt: "2024-03-12T10:00:00.000Z",
      },
      P_3_8: {
        id: "P_3_8",
        mainCategory: "Computers",
        subCategory: "Server",
        brand: "Asus",
        name: "Asus Server X",
        price: 1200.0,
        rate: 4.8,
        stock: 30,
        status: "instock",
        createdAt: "2024-03-13T11:00:00.000Z",
      },
    },
    Seller4: {
      P_4_1: {
        id: "P_4_1",
        mainCategory: "Computer Components",
        subCategory: "HDD",
        brand: "Samsung",
        name: "Samsung HDD 1TB",
        price: 80.0,
        rate: 4.6,
        stock: 200,
        status: "instock",
        createdAt: "2024-03-14T12:00:00.000Z",
      },
    },
    Seller7: {
      P_7_1: {
        id: "P_7_1",
        mainCategory: "Wearables",
        subCategory: "Fitness Tracker",
        brand: "Garmin",
        name: "Garmin Fitness Tracker",
        price: 150.0,
        rate: 4.9,
        stock: 75,
        status: "instock",
        createdAt: "2024-03-15T13:00:00.000Z",
      },
    },
  };
  localStorage.setItem("oldProducts", JSON.stringify(sampleData));
  console.log("Sample data loaded into 'oldProducts' in localStorage.");
}

initializeProductsPage();

function initializeProductsPage() {
  console.log("Initializing Products Management Page...");
  setupEventListeners();
  loadProducts(); // This will also trigger the first render
}

// ============= Data Loading =============
function loadProducts() {
  try {
    // **Corrected to use 'oldProducts' key**
    const productsDataString = localStorage.getItem("oldProducts");

    if (!productsDataString) {
      console.warn("'oldProducts' not found in localStorage.");
      allProducts = [];
    } else {
      const productsData = JSON.parse(productsDataString);
      allProducts = [];
      // Loop through each seller
      for (const sellerKey in productsData) {
        if (Object.hasOwnProperty.call(productsData, sellerKey)) {
          const sellerProducts = productsData[sellerKey];
          // Loop through each product within the seller
          for (const productKey in sellerProducts) {
            if (Object.hasOwnProperty.call(sellerProducts, productKey)) {
              const product = sellerProducts[productKey];
              // Add vendor and category info for easier access
              product.vendorName = sellerKey;
              product.category = product.mainCategory;
              allProducts.push(product);
            }
          }
        }
      }
    }

    filteredProducts = [...allProducts];
    totalProducts = allProducts.length;

    renderProducts();
    updateStatistics();
    updatePagination();
    loadVendorsDropdown(); // Populate vendor dropdown after loading products
  } catch (error) {
    console.error("Error loading products:", error);
    showAlert("Error loading products data from 'oldProducts'", "danger");
  }
}

function loadVendorsDropdown() {
  try {
    const vendorSelect = document.getElementById("productVendor");
    if (!vendorSelect) return;

    // Get unique vendor names from the loaded products
    const vendorNames = [...new Set(allProducts.map((p) => p.vendorName))];

    vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
    vendorNames.forEach((vendorName) => {
      const option = document.createElement("option");
      option.value = vendorName;
      option.textContent = vendorName;
      vendorSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading vendors:", error);
  }
}

// ============= Event Listeners =============
function setupEventListeners() {
  // Header buttons
  document
    .getElementById("addProductBtn")
    ?.addEventListener("click", openAddProductModal);
  document
    .getElementById("refreshProductsBtn")
    ?.addEventListener("click", refreshProducts);

  // Filter buttons
  document
    .getElementById("applyFiltersBtn")
    ?.addEventListener("click", applyFilters);
  document
    .getElementById("clearFiltersBtn")
    ?.addEventListener("click", clearFilters);

  // Bulk actions
  document
    .getElementById("selectAllProducts")
    ?.addEventListener("change", toggleSelectAll);
  document
    .getElementById("selectAllProductsHeader")
    ?.addEventListener("change", toggleSelectAll);
  document
  //   .getElementById("bulkActivateBtn")
  //   ?.addEventListener("click", () => bulkAction("activate"));
  // document
  //   .getElementById("bulkDeactivateBtn")
  //   ?.addEventListener("click", () => bulkAction("deactivate"));
  // document
  //   .getElementById("bulkFeaturedBtn")
  //   ?.addEventListener("click", () => bulkAction("featured"));
  // document
  //   .getElementById("bulkDeleteBtn")
  //   ?.addEventListener("click", () => bulkAction("delete"));

  // Form submission
  document
    .getElementById("productForm")
    ?.addEventListener("submit", handleProductSubmit);

  // Sort dropdown
  document.getElementById("sortBy")?.addEventListener("change", applySorting);

  // Real-time search
  setupRealTimeSearch();

  // Event delegation for edit and delete buttons
  setupTableEventListeners();
}

function setupTableEventListeners() {
  const productsTableBody = document.getElementById("productsTableBody");
  if (productsTableBody) {
    productsTableBody.addEventListener("click", (event) => {
      const target = event.target;
      const button = target.closest(".action-btn");

      if (button) {
        const row = button.closest("tr");
        // Find the product ID from the checkbox in the same row
        const productId = row.querySelector(".product-checkbox").value;

        if (button.classList.contains("btn-edit")) {
          editProduct(productId);
        } else if (button.classList.contains("btn-delete")) {
          deleteProduct(productId);
        }
      }
    });
  }
}

function setupRealTimeSearch() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, 300); // Apply filters after 300ms of inactivity
    });
  }
}

// ============= Product Rendering =============
function renderProducts() {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  if (filteredProducts.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fa-solid fa-box-open"></i>
                        <h5>No Products Found</h5>
                        <p>No products match your current filters or 'oldProducts' is empty.</p>
                    </div>
                </td>
            </tr>`;
    updatePaginationInfo();
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageProducts = filteredProducts.slice(startIndex, endIndex);

  tbody.innerHTML = pageProducts
    .map((product) => {
      const safePrice = !isNaN(product.price)
        ? Number(product.price).toFixed(2)
        : "-";
      const safeStock = !isNaN(product.stock) ? product.stock : "-";
      const safeRating = !isNaN(product.rate) ? product.rate : "-";
      const status =
        product.status || (product.stock > 0 ? "instock" : "out_of_stock");
      const statusText = status.replace(/_/g, " ");
      
      // Check if product has images
      const hasImage = product.images && product.images.length > 0 && product.images[0];
      
      // Generate product image HTML
      const productImageHTML = hasImage 
        ? `<img src="${product.images[0]}" alt="${product.name}" class="product-image">`
        : `<div class="product-image-placeholder"><i class="fa-solid fa-image"></i></div>`;

      return `
            <tr>
                <td data-label="Select">
                    <input type="checkbox" class="form-check-input product-checkbox" value="${
                      product.id || ""
                    }" onchange="updateSelectedProducts()">
                </td>
                <td data-label="Product">
                    <div class="product-info">
                        ${productImageHTML}
                        <div class="product-details">
                            <h6>${product.name || "-"}</h6>
                            <small>ID: <span class="product-sku">${
                              product.id || "N/A"
                            }</span></small>
                        </div>
                    </div>
                </td>
                <td data-label="Category">
                    <span class="category-badge category-${(
                      product.category || "general"
                    )
                      .toLowerCase()
                      .replace(/\s/g, "-")}">
                        ${product.category || "-"}
                    </span>
                </td>
                <td data-label="Price">
                    <div class="product-price">$${safePrice}</div>
                </td>
                <td data-label="Stock">
                    <div class="stock-info">
                        <span class="stock-number">${safeStock}</span>
                        <span class="stock-indicator ${getStockClass(
                          product.stock
                        )}"></span>
                    </div>
                </td>
                <td data-label="Status">
                    <span class="status-badge status-${status.toLowerCase()}">
                        ${statusText}
                    </span>
                </td>
                <td data-label="Rating">
                    <div class="product-rating">
                        <span class="rating-stars">${generateStars(
                          safeRating
                        )}</span>
                        <span class="rating-number">${safeRating}</span>
                    </div>
                </td>
                <td data-label="Vendor">
                    <div class="vendor-info">
                        <div class="vendor-avatar">${getVendorInitials(
                          product.vendorName || "?"
                        )}</div>
                        <span class="vendor-name">${
                          product.vendorName || "-"
                        }</span>
                    </div>
                </td>
                <td data-label="Created">
                    <small>${
                      product.createdAt ? formatDate(product.createdAt) : "-"
                    }</small>
                </td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        
                        <button type="button" class="action-btn btn-edit" title="Edit" onclick="editProduct('${product.id}')"><i class="fa-solid fa-edit"></i></button>
                        <button type="button" class="action-btn btn-delete" title="Delete" onclick="deleteProduct('${product.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
    })
    .join("");

  updatePaginationInfo();
}
function removeModalBackdrop() {
  const backdrops = document.getElementsByClassName("modal-backdrop");
  if (backdrops.length > 0) {
    for (let i = 0; i < backdrops.length; i++) {
      backdrops[i].remove();
    }
  }

  // إزالة كلاس modal-open من body
  document.body.classList.remove("modal-open");
  document.body.style = "";
}

// تعديل دالة handleProductSubmit لإزالة الـ backdrop
function handleProductSubmit(event) {
  event.preventDefault();

  // ... الكود الحالي للدالة ...

  // بعد حفظ البيانات وإغلاق المودال
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("productModal")
  );
  modal.hide();

  // إزالة الـ backdrop يدويًا إذا بقي
  removeModalBackdrop();

  // تحديث البيانات
  loadProducts();
}

// إضافة مستمع حدث لـ hidden.bs.modal لإزالة الـ backdrop إذا ظهرت المشكلة
document
  .getElementById("productModal")
  .addEventListener("hidden.bs.modal", function () {
    removeModalBackdrop();
  });
// ============= Helper Functions =============
function getStockClass(stock) {
  if (stock === 0) return "stock-out";
  if (stock <= 10) return "stock-low";
  if (stock <= 50) return "stock-medium";
  return "stock-high";
}

function generateStars(rating) {
  const numRating = parseFloat(rating);
  if (isNaN(numRating)) return "N/A";
  const fullStars = Math.floor(numRating);
  const hasHalfStar = numRating % 1 >= 0.5;
  let stars = "";
  for (let i = 0; i < fullStars; i++)
    stars += '<i class="fa-solid fa-star"></i>';
  if (hasHalfStar && fullStars < 5)
    stars += '<i class="fa-solid fa-star-half-alt"></i>';
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++)
    stars += '<i class="fa-regular fa-star"></i>';
  return stars;
}

function getVendorInitials(vendorName) {
  if (!vendorName) return "?";
  return vendorName.replace("Seller", "").trim().substring(0, 2);
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "-";
  }
}

// ============= Statistics =============
function updateStatistics() {
  document.getElementById("totalProductsCount").textContent =
    allProducts.length;
  document.getElementById("activeProductsCount").textContent =
    allProducts.filter((p) => p.status === "instock").length;
  document.getElementById("lowStockCount").textContent = allProducts.filter(
    (p) => p.stock > 0 && p.stock <= 10
  ).length;
  document.getElementById("featuredProductsCount").textContent =
    allProducts.filter((p) => p.featured).length;
}

// ============= Filtering and Sorting =============
function applyFilters() {
  const searchTerm =
    document.getElementById("searchInput")?.value.toLowerCase() || "";
  const categoryFilter = document.getElementById("categoryFilter")?.value || "";
  const statusFilter = document.getElementById("statusFilter")?.value || "";

  filteredProducts = allProducts.filter((product) => {
    const matchesSearch =
      !searchTerm ||
      (product.name && product.name.toLowerCase().includes(searchTerm)) ||
      (product.id && product.id.toLowerCase().includes(searchTerm)) ||
      (product.vendorName &&
        product.vendorName.toLowerCase().includes(searchTerm));
    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  currentPage = 1;
  applySorting(); // Apply current sort order to filtered results
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("statusFilter").value = "";
  document.getElementById("sortBy").value = "name";
  filteredProducts = [...allProducts];
  currentPage = 1;
  renderProducts();
  updatePagination();
}

function applySorting() {
  const sortBy = document.getElementById("sortBy")?.value || "name";
  filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "price":
        return (a.price || 0) - (b.price || 0);
      case "stock":
        return (b.stock || 0) - (a.stock || 0);
      case "createdAt":
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case "rating":
        return (b.rate || 0) - (a.rate || 0);
      default:
        return 0;
    }
  });
  renderProducts();
}

// ============= Pagination =============
// ============= Pagination =============
function updatePagination() {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const pagination = document.getElementById("productsPagination");
  if (!pagination) return;

  let paginationHTML = "";
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    updatePaginationInfo();
    return;
  }

  // إضافة زر السابق
  paginationHTML += `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
    <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
      <i class="fa-solid fa-chevron-left"></i>
    </a>
  </li>`;

  // تحديد الصفحات التي سيتم عرضها (3 صفحات كحد أقصى)
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + 2);
  
  // التأكد من عرض 3 صفحات إن أمكن
  if (endPage - startPage < 2) {
    startPage = Math.max(1, endPage - 2);
  }

  // إضافة أرقام الصفحات
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `<li class="page-item ${i === currentPage ? "active" : ""}">
      <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
    </li>`;
  }

  // إضافة زر التالي
  paginationHTML += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
    <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
      <i class="fa-solid fa-chevron-right"></i>
    </a>
  </li>`;

  pagination.innerHTML = paginationHTML;
  updatePaginationInfo();
}

// دالة تغيير الصفحة
function changePage(page) {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderProducts();
    updatePagination();
    
    // Scroll to top of table for better user experience
    document.getElementById('productsTableBody').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}
function updatePaginationInfo() {
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    startIndex + itemsPerPage - 1,
    filteredProducts.length
  );
  document.getElementById("showingStart").textContent =
    filteredProducts.length > 0 ? startIndex : 0;
  document.getElementById("showingEnd").textContent = endIndex;
  document.getElementById("totalProducts").textContent =
    filteredProducts.length;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderProducts();
    updatePagination();
  }
}

// ============= Product Management (CRUD) =============
// Note: These functions are placeholders. Saving/deleting won't persist without backend/localStorage logic.
function openAddProductModal() {
  currentEditingProduct = null;
  document.getElementById("productModalTitle").textContent = "Add New Product";
  document.getElementById("productForm").reset();
  const modal = new bootstrap.Modal(document.getElementById("productModal"));
  modal.show();
}

function editProduct(productId) {
  currentEditingProduct = allProducts.find((p) => p.id === productId);
  if (currentEditingProduct) {
    document.getElementById("productModalTitle").textContent = "Edit Product";
    document.getElementById("productName").value =
      currentEditingProduct.name || "";
    document.getElementById("productSKU").value =
      currentEditingProduct.id || "";
    document.getElementById("productCategory").value =
      currentEditingProduct.category || "";
    document.getElementById("productVendor").value =
      currentEditingProduct.vendorName || "";
    document.getElementById("productPrice").value =
      currentEditingProduct.price || "";
    document.getElementById("productStock").value =
      currentEditingProduct.stock || "";
    document.getElementById("productStatus").value =
      currentEditingProduct.status || "instock";
    document.getElementById("productDescription").value =
      currentEditingProduct.description || "";
    document.getElementById("productImage").value =
      currentEditingProduct.images?.[0] || "";
    document.getElementById("isFeatured").checked =
      currentEditingProduct.featured || false;

    const modal = new bootstrap.Modal(document.getElementById("productModal"));
    modal.show();
  } else {
    showAlert("Product not found for editing.", "danger");
  }
}

function handleProductSubmit(event) {
  event.preventDefault();

  // لا تستخدم FormData هنا لأنه يعيد كل شيء كنص.
  // بدلاً من ذلك، احصل على القيم مباشرة من حقول الإدخال.
  const productData = {
    id: document.getElementById("productSKU").value || `P_${Date.now()}`,
    name: document.getElementById("productName").value,
    mainCategory: document.getElementById("productCategory").value,
    category: document.getElementById("productCategory").value, // للحفاظ على التوافق
    vendorName: document.getElementById("productVendor").value,
    // استخدم parseFloat و parseInt لتحويل القيم إلى أرقام
    price: parseFloat(document.getElementById("productPrice").value) || 0,
    stock: parseInt(document.getElementById("productStock").value, 10) || 0,
    status: document.getElementById("productStatus").value || "instock",
    description: document.getElementById("productDescription").value,
    images: document.getElementById("productImage").value
      ? [document.getElementById("productImage").value]
      : [],
    featured: document.getElementById("isFeatured").checked, // .checked يعيد قيمة boolean مباشرة
    // احتفظ بالبيانات الأصلية التي لا يتم تحريرها في النموذج
    createdAt: currentEditingProduct?.createdAt || new Date().toISOString(),
    rate: currentEditingProduct?.rate || 0,
    totalSales: currentEditingProduct?.totalSales || 0,
    visibility:
      currentEditingProduct?.visibility === undefined
        ? true
        : currentEditingProduct.visibility,
  };

  // تحديث مصفوفة allProducts
  if (currentEditingProduct) {
    // تعديل منتج حالي
    const index = allProducts.findIndex(
      (p) => p.id === currentEditingProduct.id
    );
    if (index !== -1) {
      // دمج البيانات القديمة مع الجديدة لضمان عدم فقدان أي حقل
      allProducts[index] = { ...allProducts[index], ...productData };
      showAlert("Product updated successfully!", "success");
    } else {
      showAlert("Error: Product not found for update.", "danger");
    }
  } else {
    // إضافة منتج جديد
    allProducts.push(productData);
    showAlert("Product added successfully!", "success");
  }

  // تحديث localStorage
  // هذا الجزء يحول مصفوفة allProducts مرة أخرى إلى الهيكل المتداخل المطلوب
  const newLocalStorageData = {};
  allProducts.forEach((p) => {
    const vendor = p.vendorName || "UnknownSeller";
    if (!newLocalStorageData[vendor]) {
      newLocalStorageData[vendor] = {};
    }
    // تأكد من عدم إضافة حقول إضافية غير مرغوب فيها إلى الكائن المحفوظ
    const { vendorName, category, ...productToSave } = p;
    newLocalStorageData[vendor][p.id] = productToSave;
  });
  localStorage.setItem("oldProducts", JSON.stringify(newLocalStorageData));

  // تحديث العرض وإغلاق النافذة
  loadProducts(); // سيعيد هذا تحميل وتصفية وعرض المنتجات
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("productModal")
  );
  modal.hide();
}

function deleteProduct(productId) {
  if (
    confirm(
      `Are you sure you want to delete product ${productId}? This action cannot be undone.`
    )
  ) {
    // Remove product from allProducts array
    allProducts = allProducts.filter((p) => p.id !== productId);

    // Update localStorage
    const newLocalStorageData = {};
    allProducts.forEach((p) => {
      const vendor = p.vendorName || "UnknownSeller";
      if (!newLocalStorageData[vendor]) {
        newLocalStorageData[vendor] = {};
      }
      newLocalStorageData[vendor][p.id] = p;
    });
    localStorage.setItem("oldProducts", JSON.stringify(newLocalStorageData));

    showAlert(`Product ${productId} deleted successfully!`, "success");
    loadProducts(); // Refresh the table
  }
}

function viewProduct(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) {
    showAlert("Product not found.", "danger");
    return;
  }
  const detailsContent = document.getElementById("productDetailsContent");
  detailsContent.innerHTML = `<pre>${JSON.stringify(product, null, 2)}</pre>`; // Simple display
  const modal = new bootstrap.Modal(
    document.getElementById("productDetailsModal")
  );
  modal.show();
}

// ============= Bulk Actions =============
function toggleSelectAll(event) {
  const isChecked = event.target.checked;
  document
    .querySelectorAll(".product-checkbox")
    .forEach((cb) => (cb.checked = isChecked));
  document.getElementById("selectAllProducts").checked = isChecked;
  document.getElementById("selectAllProductsHeader").checked = isChecked;
  updateSelectedProducts();
}

function updateSelectedProducts() {
  const checkboxes = document.querySelectorAll(".product-checkbox:checked");
  selectedProducts = Array.from(checkboxes).map((cb) => cb.value);
  // You can add logic here to show/hide a bulk actions bar
}

// function bulkAction(action) {
//   if (selectedProducts.length === 0) {
//     showAlert("Please select products first.", "warning");
//     return;
//   }
//   showAlert(
//     `Bulk action '${action}' on ${selectedProducts.length} products is not implemented.`,
//     "info"
//   );
// }

// ============= Utility Functions =============
function refreshProducts() {
  loadProducts();
  showAlert("Products refreshed successfully.", "success");
}

function showAlert(message, type = "info") {
  const alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) return;
  const alertId = "alert-" + Date.now();
  const icon =
    {
      success: "check-circle",
      danger: "exclamation-triangle",
      warning: "exclamation-triangle",
      info: "info-circle",
    }[type] || "info-circle";
  const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fa-solid fa-${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
  alertContainer.insertAdjacentHTML("beforeend", alertHTML);
  setTimeout(
    () =>
      bootstrap.Alert.getOrCreateInstance(
        document.getElementById(alertId)
      )?.close(),
    5000
  );
}

// ============= Global Functions (for onclick handlers) =============
window.changePage = changePage;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewProduct = viewProduct;
window.updateSelectedProducts = updateSelectedProducts;
window.openAddProductModal = openAddProductModal;
