// #region === Vendors Management Initialization ===
/**
 * Vendors Management Initialization Module
 *
 * Responsibilities:
 * - Initialize vendors management system
 * - Load and process vendor data from localStorage
 * - Set up event listeners and UI components
 */

// Global variables
let vendorsData = {};
let productsData = {};
let filteredVendors = [];
let currentPage = 1;
let vendorsPerPage = 10;
let currentSort = { field: "name", direction: "asc" };
let selectedVendors = new Set();
let editingVendorId = null;

// Initialize the vendors management system

initializeVendorsManagement();

/**
 * Main initialization function
 */
function initializeVendorsManagement() {
  loadVendorsData();
  setupEventListeners();
  updateVendorsStatistics();
  renderVendorsTable();
  populateCityFilter();
  setupFormValidation();
}

/**
 * Load vendors data from localStorage
 */
function loadVendorsData() {
  try {
    // Load users data to get sellers
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      const usersData = JSON.parse(storedUsers);
      vendorsData = usersData.sellers || {};
    } else {
      vendorsData = {};
    }

    // Load products data
    const storedProducts = localStorage.getItem("oldProducts");
    if (storedProducts) {
      productsData = JSON.parse(storedProducts);
    } else {
      productsData = {};
    }

    // Process and flatten vendors data for easier management
    processVendorsData();
  } catch (error) {
    console.error("Error loading vendors data:", error);
    showAlert("Error loading vendors data", "danger");
    vendorsData = {};
    productsData = {};
  }
}

/**
 * Process vendors data into a flat array for easier manipulation
 */
function processVendorsData() {
  filteredVendors = [];

  // Process sellers as vendors
  if (vendorsData) {
    Object.entries(vendorsData).forEach(([id, vendor]) => {
      // البحث عن منتجات البائع في هيكل oldProducts
      let vendorProducts = {};

      // المحاولة الأولى: البحث بالمفتاح المباشر (id)
      if (productsData[id]) {
        vendorProducts = productsData[id];
      }
      // المحاولة الثانية: البحث بمفتاح "SellerX" حيث X هو معرف البائع
      else {
        const sellerKey = `Seller${id}`;
        if (productsData[sellerKey]) {
          vendorProducts = productsData[sellerKey];
        }
        // المحاولة الثالثة: البحث في جميع المنتجات عن تلك التي تنتمي لهذا البائع
        else {
          for (const [key, value] of Object.entries(productsData)) {
            if (value && typeof value === "object") {
              // إذا كان المنتج يحتوي على حقل sellerId يتطابق مع id
              if (value.sellerId === id) {
                vendorProducts[key] = value;
              }
              // أو إذا كان المفتاح يحتوي على معرف البائع
              else if (key.includes(id)) {
                vendorProducts[key] = value;
              }
            }
          }
        }
      }

      const productsCount = Object.keys(vendorProducts).length;

      filteredVendors.push({
        id: id,
        ...vendor,
        productsCount: productsCount,
        createdAt: vendor.createdAt || new Date().toISOString(),
        lastActivity: vendor.lastActivity || new Date().toISOString(),
      });
    });
  }
}
// #endregion === Vendors Management Initialization ===

// #region === Event Listeners Setup ===
/**
 * Event Listeners Setup Module
 *
 * Responsibilities:
 * - Set up all event listeners for vendor interactions
 * - Handle form submissions and button clicks
 */

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Add vendor button
  document
    .getElementById("addVendorBtn")
    .addEventListener("click", openAddVendorModal);

  // Search and filter controls
  document
    .getElementById("searchInput")
    .addEventListener("input", debounce(handleSearch, 300));
  document
    .getElementById("statusFilter")
    .addEventListener("change", handleFilter);
  document
    .getElementById("cityFilter")
    .addEventListener("change", handleFilter);
  document.getElementById("sortBy").addEventListener("change", handleSort);

  // Filter buttons
  document
    .getElementById("clearFiltersBtn")
    .addEventListener("click", clearFilters);
  document
    .getElementById("applyFiltersBtn")
    .addEventListener("click", applyFilters);

  // Table controls
  document
    .getElementById("selectAllVendors")
    .addEventListener("change", handleSelectAll);
  document
    .getElementById("exportVendorsBtn")
    .addEventListener("click", exportVendors);
  document
    .getElementById("refreshVendorsBtn")
    .addEventListener("click", refreshVendors);

  // Vendor form
  document
    .getElementById("vendorForm")
    .addEventListener("submit", handleVendorFormSubmit);

  // Bulk actions
  document
    .getElementById("bulkApproveBtn")
    .addEventListener("click", () => handleBulkAction("approve"));
  document
    .getElementById("bulkSuspendBtn")
    .addEventListener("click", () => handleBulkAction("suspend"));
  document
    .getElementById("bulkDeleteBtn")
    .addEventListener("click", () => handleBulkAction("delete"));
  document
    .getElementById("vendorsTableBodyDesktop")
    .addEventListener("click", function (e) {
      const row = e.target.closest("tr");
      if (!row) return;

      const sellerId = row.getAttribute("data-vendor-id");
      if (!sellerId) return;

      if (e.target.closest(".btn-view")) {
        viewVendor(sellerId);
      } else if (e.target.closest(".btn-edit")) {
        editVendor(sellerId);
      } else if (e.target.closest(".btn-delete")) {
        deleteVendor(sellerId);
      } else if (e.target.closest(".btn-products")) {
        viewVendorProducts(sellerId);
      }
    });
}

/**
 * Debounce function to limit API calls
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
// #endregion === Event Listeners Setup ===

// #region === Statistics and UI Updates ===
/**
 * Statistics and UI Updates Module
 *
 * Responsibilities:
 * - Calculate and display vendor statistics
 * - Update UI elements with current data
 */

/**
 * Update vendors statistics cards
 */
function updateVendorsStatistics() {
  const stats = calculateVendorsStatistics();

  document.getElementById("totalVendorsCount").textContent = stats.total;
  document.getElementById("activeVendorsCount").textContent = stats.active;
  document.getElementById("pendingVendorsCount").textContent = stats.pending;
  document.getElementById("mainVendorsCount").textContent = stats.main;
}

/**
 * Calculate vendors statistics
 */
function calculateVendorsStatistics() {
  const stats = {
    total: filteredVendors.length,
    active: 0,
    pending: 0,
    main: 0,
  };

  filteredVendors.forEach((vendor) => {
    // Count by status
    switch (vendor.status) {
      case "active":
        stats.active++;
        break;
      case "pending":
        stats.pending++;
        break;
      default:
        stats.active++; // Default to active if status is undefined
    }

    // Count main vendors
    if (vendor.isMainSeller) {
      stats.main++;
    }
  });

  return stats;
}

/**
 * Update pagination info
 */
function updatePaginationInfo() {
  const totalVendors = filteredVendors.length;
  const startIndex = (currentPage - 1) * vendorsPerPage + 1;
  const endIndex = Math.min(currentPage * vendorsPerPage, totalVendors);

  document.getElementById("showingStart").textContent =
    totalVendors > 0 ? startIndex : 0;
  document.getElementById("showingEnd").textContent = endIndex;
  document.getElementById("totalVendors").textContent = totalVendors;
}

/**
 * Populate city filter dropdown
 */
/**
 * Populate city filter dropdown
 */
function populateCityFilter() {
  // Extract cities from address object if exists
  const cities = [
    ...new Set(
      filteredVendors
        .map((vendor) => (vendor.address && vendor.address.city) ? vendor.address.city : vendor.city)
        .filter((city) => city)
    ),
  ];
  const cityFilter = document.getElementById("cityFilter");

  // Clear existing options except "All Cities"
  cityFilter.innerHTML = '<option value="">All Cities</option>';

  // Add city options
  cities.sort().forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    cityFilter.appendChild(option);
  });
}
// #endregion === Statistics and UI Updates ===

// #region === Search and Filter Functions ===
/**
 * Search and Filter Functions Module
 *
 * Responsibilities:
 * - Handle search functionality
 * - Apply filters to vendor data
 * - Sort vendors based on criteria
 */

/**
 * Handle search input
 */
function handleSearch() {
  applyFilters();
}

/**
 * Handle filter changes
 */
function handleFilter() {
  applyFilters();
}

/**
 * Handle sort changes
 */
function handleSort() {
  const sortBy = document.getElementById("sortBy").value;
  currentSort.field = sortBy;
  applyFilters();
}

/**
 * Apply all filters and search
 */
function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;
  const cityFilter = document.getElementById("cityFilter").value;

  // Start with all vendors
  processVendorsData();

  // Apply search filter
  if (searchTerm) {
    filteredVendors = filteredVendors.filter(
      (vendor) =>
        vendor.name?.toLowerCase().includes(searchTerm) ||
        vendor.email?.toLowerCase().includes(searchTerm) ||
        vendor.city?.toLowerCase().includes(searchTerm) ||
        vendor.id?.toString().toLowerCase().includes(searchTerm)
    );
  }

  // Apply status filter
  if (statusFilter) {
    filteredVendors = filteredVendors.filter(
      (vendor) => vendor.status === statusFilter
    );
  }

  // Apply city filter
  if (cityFilter) {
    filteredVendors = filteredVendors.filter(
      (vendor) => vendor.city === cityFilter
    );
  }

  // Apply sorting
  sortVendors();

  // Reset to first page
  currentPage = 1;

  // Update UI
  updateVendorsStatistics();
  renderVendorsTable();
}

/**
 * Clear all filters
 */
function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("statusFilter").value = "";
  document.getElementById("cityFilter").value = "";
  document.getElementById("sortBy").value = "name";

  currentSort = { field: "name", direction: "asc" };
  applyFilters();
}

/**
 * Sort vendors based on current sort criteria
 */
function sortVendors() {
  filteredVendors.sort((a, b) => {
    let aValue = a[currentSort.field] || "";
    let bValue = b[currentSort.field] || "";

    // Handle different data types
    if (
      currentSort.field === "createdAt" ||
      currentSort.field === "lastActivity"
    ) {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (currentSort.field === "productsCount") {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else {
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();
    }

    if (aValue < bValue) return currentSort.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return currentSort.direction === "asc" ? 1 : -1;
    return 0;
  });
}
// #endregion === Search and Filter Functions ===

// #region === Table Rendering ===
/**
 * Table Rendering Module
 *
 * Responsibilities:
 * - Render vendors table with data
 * - Handle pagination
 * - Generate table rows and controls
 */

/**
 * Render the vendors table
 */
function renderVendorsTable() {
  const tableBodyDesktop = document.getElementById("vendorsTableBodyDesktop");
  const tableBodyMobile = document.getElementById("vendorsTableBodyMobile");
  const startIndex = (currentPage - 1) * vendorsPerPage;
  const endIndex = startIndex + vendorsPerPage;
  const pageVendors = filteredVendors.slice(startIndex, endIndex);

  if (pageVendors.length === 0) {
    const noVendorsHtml = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fa-solid fa-store fa-3x mb-3"></i>
                        <p class="mb-0">No vendors found</p>
                    </div>
                </td>
            </tr>
        `;
    tableBodyDesktop.innerHTML = noVendorsHtml;
    tableBodyMobile.innerHTML = `
            <div class="text-center py-4">
                <div class="text-muted">
                    <i class="fa-solid fa-store fa-3x mb-3"></i>
                    <p class="mb-0">No vendors found</p>
                </div>
            </div>
        `;
  } else {
    tableBodyDesktop.innerHTML = pageVendors
      .map((vendor) => createVendorRowDesktop(vendor))
      .join("");
    tableBodyMobile.innerHTML = pageVendors
      .map((vendor) => createVendorCardMobile(vendor))
      .join("");
  }

  updatePaginationInfo();
  renderPagination();
  updateSelectAllCheckbox();
}

/**
 * Create a table row for a vendor
 */
function createVendorRowDesktop(vendor) {
  const avatar = vendor.name ? vendor.name.charAt(0).toUpperCase() : "V";
  const statusClass = getStatusClass(vendor.status);
  const isMainVendor = vendor.isMainSeller;
  const city = vendor.address && vendor.address.city ? vendor.address.city : "";
  const street =
    vendor.address && vendor.address.street ? vendor.address.street : "";
  const zipCode =
    vendor.address && vendor.address.zipCode ? vendor.address.zipCode : "";

  return `
        <tr>
            <td>
                <input type="checkbox" class="form-check-input vendor-checkbox" 
                      value="${vendor.id}" ${
    selectedVendors.has(vendor.id) ? "checked" : ""
  }>
            </td>
            <td>
                <div class="vendor-info">
                    <div class="vendor-avatar ${
                      isMainVendor ? "main-vendor-indicator" : ""
                    }">${avatar}</div>
                    <div class="vendor-details">
                        <h6 class="mb-0">${vendor.name || "Unknown"}</h6>
                        <small class="text-muted">${
                          vendor.email || "No email"
                        }</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="location-info">
                    <div class="location-icon">
                        <i class="fa-solid fa-map-marker-alt"></i>
                    </div>
                    <div class="location-details">
                        <h6 class="mb-0">${city || "Unknown"}</h6>
                        <small class="text-muted">${
                          street || "No address"
                        }</small>
                    </div>
                </div>
            </td>
            <td>
                <span class="status-badge status-${statusClass}">${
    vendor.status || "active"
  }</span>
            </td>
            <td>
                <span class="type-badge type-${
                  isMainVendor ? "main" : "regular"
                }">
                    ${isMainVendor ? "Main Vendor" : "Regular"}
                </span>
            </td>
            <td>
                <div class="products-count">
                    <i class="fa-solid fa-box"></i>
                    <span>${vendor.productsCount || 0}</span>
                </div>
            </td>
            <td>
                <small class="text-muted">${formatDate(
                  vendor.createdAt
                )}</small>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-view" onclick="viewVendor('${
                      vendor.id
                    }')" title="View Details">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn btn-products" onclick="viewVendorProducts('${
                      vendor.id
                    }')" title="View Products">
                        <i class="fa-solid fa-box"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="editVendor('${
                      vendor.id
                    }')" title="Edit Vendor">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteVendor('${
                      vendor.id
                    }')" title="Delete Vendor">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Get CSS class for vendor status
 */
function getStatusClass(status) {
  switch (status) {
    case "active":
      return "active";
    case "inactive":
      return "inactive";
    case "pending":
      return "pending";
    default:
      return "active";
  }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
}

/**
 * Render pagination controls
 */
function renderPagination() {
  const totalPages = Math.ceil(filteredVendors.length / vendorsPerPage);
  const pagination = document.getElementById("vendorsPagination");

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let paginationHTML = "";

  // Previous button
  paginationHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${
              currentPage - 1
            })">
                <i class="fa-solid fa-chevron-left"></i>
            </a>
        </li>
    `;

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1)">1</a></li>`;
    if (startPage > 2) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
  }

  // Next button
  paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="changePage(${
              currentPage + 1
            })">
                <i class="fa-solid fa-chevron-right"></i>
            </a>
        </li>
    `;

  pagination.innerHTML = paginationHTML;
}

/**
 * Change current page
 */
function changePage(page) {
  const totalPages = Math.ceil(filteredVendors.length / vendorsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderVendorsTable();
  }
}
// #endregion === Table Rendering ===

// #region === Vendor Selection Management ===
/**
 * Vendor Selection Management Module
 *
 * Responsibilities:
 * - Handle vendor selection for bulk operations
 * - Manage select all functionality
 */

/**
 * Handle select all checkbox
 */
function handleSelectAll() {
  const selectAllCheckbox = document.getElementById("selectAllVendors");
  const vendorCheckboxes = document.querySelectorAll(".vendor-checkbox");

  if (selectAllCheckbox.checked) {
    vendorCheckboxes.forEach((checkbox) => {
      checkbox.checked = true;
      selectedVendors.add(checkbox.value);
    });
  } else {
    vendorCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
      selectedVendors.delete(checkbox.value);
    });
  }

  updateBulkActionsButton();
}

/**
 * Update select all checkbox state
 */
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById("selectAllVendors");
  const vendorCheckboxes = document.querySelectorAll(".vendor-checkbox");
  const checkedCheckboxes = document.querySelectorAll(
    ".vendor-checkbox:checked"
  );

  if (vendorCheckboxes.length === 0) {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = false;
  } else if (checkedCheckboxes.length === vendorCheckboxes.length) {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = true;
  } else if (checkedCheckboxes.length > 0) {
    selectAllCheckbox.indeterminate = true;
    selectAllCheckbox.checked = false;
  } else {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = false;
  }

  // Update selected vendors set
  selectedVendors.clear();
  checkedCheckboxes.forEach((checkbox) => {
    selectedVendors.add(checkbox.value);
  });

  updateBulkActionsButton();
}

/**
 * Update bulk actions button visibility
 */
function updateBulkActionsButton() {
  const selectedCount = selectedVendors.size;
  document.getElementById("selectedVendorsCount").textContent = selectedCount;

  // Show/hide bulk actions modal trigger (you can add a button for this)
  if (selectedCount > 0) {
    document.getElementById("exportVendorsBtn").classList.remove("d-none");
  } else {
    document.getElementById("exportVendorsBtn").classList.add("d-none");
  }
}

// Add event listener for individual checkboxes (delegated)
document.addEventListener("change", function (e) {
  if (e.target.classList.contains("vendor-checkbox")) {
    updateSelectAllCheckbox();
  }
});
// #endregion === Vendor Selection Management ===

// #region === Vendor CRUD Operations ===
/**
 * Vendor CRUD Operations Module
 *
 * Responsibilities:
 * - Handle vendor creation, reading, updating, and deletion
 * - Manage vendor modals and forms
 */

/**
 * Open add vendor modal
 */
/**
 * Open add vendor modal
 */
function openAddVendorModal() {
  editingVendorId = null;
  document.getElementById("vendorModalTitle").textContent = "Add New Vendor";
  document.getElementById("saveVendorBtn").textContent = "Save Vendor";

  // Reset form
  document.getElementById("vendorForm").reset();

  // Show password fields for new vendors
  const passwordFields = document.querySelectorAll(".password-field");
  passwordFields.forEach((field) => (field.style.display = "block"));

  // جعل حقلي كلمة المرور مطلوبة
  document.getElementById("vendorPassword").required = true;
  document.getElementById("vendorPasswordConfirm").required = true;

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("vendorModal"));
  modal.show();
}
/**
 * Edit vendor
 */
/**
 * Edit vendor
 */
function editVendor(vendorId) {
  const vendor = vendorsData[vendorId];

  if (!vendor) {
    showAlert("Vendor not found", "danger");
    return;
  }

  editingVendorId = vendorId;
  document.getElementById("vendorModalTitle").textContent = "Edit Vendor";
  document.getElementById("saveVendorBtn").textContent = "Update Vendor";

  // Extract address information from address object if exists
  const city = vendor.address && vendor.address.city ? vendor.address.city : "";
  const street =
    vendor.address && vendor.address.street ? vendor.address.street : "";
  const zipCode =
    vendor.address && vendor.address.zipCode ? vendor.address.zipCode : "";

  // Populate form
  document.getElementById("vendorName").value = vendor.name || "";
  document.getElementById("vendorEmail").value = vendor.email || "";
  document.getElementById("vendorPhone").value = vendor.phone || "";
  document.getElementById("vendorStatus").value = vendor.status || "active";
  document.getElementById("vendorCity").value = city;
  document.getElementById("vendorStreet").value = street;
  document.getElementById("vendorZipCode").value = zipCode;
  document.getElementById("vendorDescription").value = vendor.description || "";
  document.getElementById("isMainVendor").checked =
    vendor.isMainSeller || false;

  // Hide password fields for existing vendors\
  const passwordFields = document.querySelectorAll(".password-field");
  passwordFields.forEach((field) => (field.style.display = "none"));
  // إزالة السمة required من حقلي كلمة المرور
  document.getElementById("vendorPassword").required = false;
  document.getElementById("vendorPasswordConfirm").required = false;

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("vendorModal"));
  modal.show();
}
/**
 * View vendor details
 */
function viewVendor(vendorId) {
  const vendor = findVendorById(vendorId);
  const city = vendor.address && vendor.address.city ? vendor.address.city : "";
  const street =
    vendor.address && vendor.address.street ? vendor.address.street : "";
  const zipCode =
    vendor.address && vendor.address.zipCode ? vendor.address.zipCode : "";

  if (!vendor) {
    showAlert("Vendor not found", "danger");
    return;
  }

  const vendorDetailsContent = document.getElementById("vendorDetailsContent");
  vendorDetailsContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="vendor-detail-section">
                    <h6>Basic Information</h6>
                    <div class="detail-item">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${
                          vendor.name || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${
                          vendor.email || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${
                          vendor.phone || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="status-badge status-${getStatusClass(
                              vendor.status
                            )}">${vendor.status || "active"}</span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">
                            <span class="type-badge type-${
                              vendor.isMainSeller ? "main" : "regular"
                            }">
                                ${
                                  vendor.isMainSeller
                                    ? "Main Vendor"
                                    : "Regular Vendor"
                                }
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="vendor-detail-section">
                    <h6>Location & Business</h6>
                    <div class="detail-item">
                        <span class="detail-label">City:</span>
                        <span class="detail-value">${
                          city || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Street:</span>
                        <span class="detail-value">${
                          street || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Zip Code:</span>
                        <span class="detail-value">${
                          zipCode || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Products:</span>
                        <span class="detail-value">${
                          vendor.productsCount || 0
                        } items</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Joined:</span>
                        <span class="detail-value">${formatDate(
                          vendor.createdAt
                        )}</span>
                    </div>
                </div>
            </div>
            ${
              vendor.description
                ? `
                <div class="col-12">
                    <div class="vendor-detail-section">
                        <h6>Business Description</h6>
                        <p class="text-muted">${vendor.description}</p>
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `;

  const modal = new bootstrap.Modal(
    document.getElementById("vendorDetailsModal")
  );
  modal.show();
}

/**
 * View vendor details
 */
function viewVendor(vendorId) {
  const vendor = vendorsData[vendorId]; // البحث مباشرة في vendorsData
  const city = vendor.address && vendor.address.city ? vendor.address.city : "";
  const street =
    vendor.address && vendor.address.street ? vendor.address.street : "";
  const zipCode =
    vendor.address && vendor.address.zipCode ? vendor.address.zipCode : "";

  if (!vendor) {
    showAlert("Vendor not found", "danger");
    return;
  }

  const vendorDetailsContent = document.getElementById("vendorDetailsContent");
  vendorDetailsContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="vendor-detail-section">
                    <h6>Basic Information</h6>
                    <div class="detail-item">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${
                          vendor.name || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${
                          vendor.email || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${
                          vendor.phone || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="status-badge status-${getStatusClass(
                              vendor.status
                            )}">${vendor.status || "active"}</span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">
                            <span class="type-badge type-${
                              vendor.isMainSeller ? "main" : "regular"
                            }">
                                ${
                                  vendor.isMainSeller
                                    ? "Main Vendor"
                                    : "Regular Vendor"
                                }
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="vendor-detail-section">
                    <h6>Location & Business</h6>
                    <div class="detail-item">
                        <span class="detail-label">City:</span>
                        <span class="detail-value">${
                          city || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Street:</span>
                        <span class="detail-value">${
                          street || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Zip Code:</span>
                        <span class="detail-value">${
                          zipCode || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Products:</span>
                        <span class="detail-value">${
                          vendor.productsCount || 0
                        } items</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Joined:</span>
                        <span class="detail-value">${formatDate(
                          vendor.createdAt
                        )}</span>
                    </div>
                </div>
            </div>
            ${
              vendor.description
                ? `
                <div class="col-12">
                    <div class="vendor-detail-section">
                        <h6>Business Description</h6>
                        <p class="text-muted">${vendor.description}</p>
                    </div>
                </div>
            `
                : ""
            }
        </div>
    `;

  const modal = new bootstrap.Modal(
    document.getElementById("vendorDetailsModal")
  );
  modal.show();
}
/**
 * View vendor products
 */
/**
 * View vendor products
 */
function viewVendorProducts(vendorId) {
  const vendor = vendorsData[vendorId];

  if (!vendor) {
    showAlert("Vendor not found", "danger");
    return;
  }

  // البحث عن منتجات البائع
  let vendorProducts = {};

  if (productsData[vendorId]) {
    vendorProducts = productsData[vendorId];
  } else {
    const sellerKey = `Seller${vendorId}`;
    if (productsData[sellerKey]) {
      vendorProducts = productsData[sellerKey];
    } else {
      for (const [key, value] of Object.entries(productsData)) {
        if (value && typeof value === "object") {
          if (value.sellerId === vendorId) {
            vendorProducts[key] = value;
          } else if (key.includes(vendorId)) {
            vendorProducts[key] = value;
          }
        }
      }
    }
  }

  const products = Object.entries(vendorProducts);

  document.getElementById(
    "vendorProductsModalTitle"
  ).textContent = `${vendor.name}'s Products (${products.length})`;

  const vendorProductsContent = document.getElementById(
    "vendorProductsContent"
  );

  if (products.length === 0) {
    vendorProductsContent.innerHTML = `
      <div class="text-center py-4">
        <i class="fa-solid fa-box-open fa-3x text-muted mb-3"></i>
        <p class="text-muted mb-0">This vendor has no products yet.</p>
      </div>
    `;
  } else {
    vendorProductsContent.innerHTML = `
      <div class="table-responsive">
        <table class="table products-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map(([productId, product]) => {
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
                const hasSingleImage = product.image; // دعم للحقل القديم "image"
                
                // Generate product image HTML
                const productImageHTML = hasImage 
                  ? `<img src="${product.images[0]}" alt="${product.name}" class="product-image">`
                  : hasSingleImage
                    ? `<img src="${product.image}" alt="${product.name}" class="product-image">`
                    : `<div class="product-image-placeholder">
                         <i class="fa-solid fa-image"></i>
                         <span class="product-category-badge">${product.category || "Uncategorized"}</span>
                       </div>`;

                // Generate stars for rating
                const generateStars = (rating) => {
                  const stars = Math.round(parseFloat(rating) || 0);
                  let starsHTML = '';
                  for (let i = 1; i <= 5; i++) {
                    if (i <= stars) {
                      starsHTML += '<i class="fa-solid fa-star"></i>';
                    } else {
                      starsHTML += '<i class="fa-regular fa-star"></i>';
                    }
                  }
                  return starsHTML;
                };

                // Get stock status class
                const getStockClass = (stock) => {
                  const numStock = parseInt(stock) || 0;
                  if (numStock === 0) return 'out';
                  if (numStock < 10) return 'low';
                  return 'high';
                };

                return `
                  <tr>
                    <td data-label="Product">
                      <div class="product-info">
                        <div class="product-image-container">
                          ${productImageHTML}
                        </div>
                        <div class="product-details">
                          <h6>${product.name || "Unnamed Product"}</h6>
                          <small>${
                            product.description
                              ? product.description.substring(0, 50) + "..."
                              : "No description"
                          }</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Category">
                      <span class="category-badge">${
                        product.mainCategory || "Uncategorized"
                      }</span>
                    </td>
                    <td data-label="Price" class="fw-bold">$${safePrice}</td>
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
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  const modal = new bootstrap.Modal(
    document.getElementById("vendorProductsModal")
  );
  modal.show();
}
/**
 * Delete vendor
 */
function deleteVendor(vendorId) {
  const vendor = vendorsData[vendorId]; // البحث مباشرة في vendorsData

  if (!vendor) {
    showAlert("Vendor not found", "danger");
    return;
  }

  if (
    confirm(
      `Are you sure you want to delete vendor "${vendor.name}"? This action cannot be undone and will also delete all their products.`
    )
  ) {
    // Remove vendor from data structure
    delete vendorsData[vendorId];

    // Also remove their products
    delete productsData[vendorId];

    // Save to localStorage
    saveVendorsData();

    // Refresh UI
    loadVendorsData();
    updateVendorsStatistics();
    renderVendorsTable();
    populateCityFilter();

    showAlert(
      `Vendor "${vendor.name}" has been deleted successfully`,
      "success"
    );
  }
}

/**
 * Find vendor by ID
 */
function findVendorById(vendorId) {
  // البحث في vendorsData بدلاً من filteredVendors
  return vendorsData[vendorId]
    ? { id: vendorId, ...vendorsData[vendorId] }
    : null;
}

/**
 * Handle vendor form submission
 */
/**
 * Handle vendor form submission
 */
function handleVendorFormSubmit(e) {
  e.preventDefault();

  const vendorData = {
    name: document.getElementById("vendorName").value.trim(),
    email: document.getElementById("vendorEmail").value.trim(),
    phone: document.getElementById("vendorPhone").value.trim(),
    status: document.getElementById("vendorStatus").value,
    city: document.getElementById("vendorCity").value.trim(),
    street: document.getElementById("vendorStreet").value.trim(),
    zipCode: document.getElementById("vendorZipCode").value.trim(),
    description: document.getElementById("vendorDescription").value.trim(),
    isMainSeller: document.getElementById("isMainVendor").checked,
  };

  // Only include password for new vendors
  if (!editingVendorId) {
    vendorData.password = document.getElementById("vendorPassword").value;
    vendorData.passwordConfirm = document.getElementById("vendorPasswordConfirm").value;
  }

  // Validate form
  if (!validateVendorForm(vendorData)) {
    return;
  }

  // Remove password confirmation from data
  if (vendorData.passwordConfirm) {
    delete vendorData.passwordConfirm;
  }

  // Save vendor
  saveVendor(vendorData);
}
/**
 * Validate vendor form
 */
/**
 * Validate vendor form
 */
function validateVendorForm(vendorData) {
  // Check required fields
  if (!vendorData.name) {
    showAlert("Vendor name is required", "danger");
    return false;
  }

  if (!vendorData.email) {
    showAlert("Email is required", "danger");
    return false;
  }

  if (!vendorData.city) {
    showAlert("City is required", "danger");
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(vendorData.email)) {
    showAlert("Please enter a valid email address", "danger");
    return false;
  }

  // Check password only for new vendors
  if (!editingVendorId) {
    if (!vendorData.password) {
      showAlert("Password is required", "danger");
      return false;
    }

    if (vendorData.password !== vendorData.passwordConfirm) {
      showAlert("Passwords do not match", "danger");
      return false;
    }

    if (vendorData.password.length < 6) {
      showAlert("Password must be at least 6 characters long", "danger");
      return false;
    }
  }

  // Check for duplicate email (excluding current vendor if editing)
  const existingVendor = Object.values(vendorsData).find((vendor) => {
    // إذا كنا في وضع التعديل، نتجاهل البائع الحالي
    if (editingVendorId && vendor.id === editingVendorId) {
      return false;
    }
    return vendor.email === vendorData.email;
  });

  if (existingVendor) {
    showAlert("A vendor with this email already exists", "danger");
    return false;
  }

  return true;
}
/**
 * Save vendor data
 */
function saveVendor(vendorData) {
  try {
    let vendorId;

    if (editingVendorId) {
      // Update existing vendor
      vendorId = editingVendorId;
      const existingVendor = findVendorById(vendorId);
      if (existingVendor) {
        // Preserve existing data structure including address object
        vendorData.address = {
          city: vendorData.city,
          street: vendorData.street,
          zipCode: vendorData.zipCode
        };
        
        // Preserve creation date and other existing fields
        vendorData.createdAt = existingVendor.createdAt;
        vendorData.id = existingVendor.id;
        vendorData.role = existingVendor.role || "seller";
        
        // Preserve sales data if exists
        if (existingVendor.sales) {
          vendorData.sales = existingVendor.sales;
        }
        
        // Preserve tabs if exists
        if (existingVendor.tabs) {
          vendorData.tabs = existingVendor.tabs;
        }
      }
    } else {
      // Create new vendor
      vendorId = generateVendorId();
      
      // Create address object
      vendorData.address = {
        city: vendorData.city,
        street: vendorData.street,
        zipCode: vendorData.zipCode
      };
      
      // Set default values for new vendor
      vendorData.id = vendorId;
      vendorData.role = "seller";
      vendorData.createdAt = new Date().toISOString();
      vendorData.sales = { totalSales: 0 };
      vendorData.tabs = [
        { icon: "fa-regular fa-chart-bar", pageName: "Dashboard", fileName: "dashboard" },
        { icon: "fa-solid fa-box", pageName: "Products", fileName: "products" },
        { icon: "fa-solid fa-cart-shopping", pageName: "Orders", fileName: "orders" },
        { icon: "fa-solid fa-gear", pageName: "Settings", fileName: "settings" }
        // Add other default tabs as needed
      ];
    }

    // Remove individual address fields to avoid duplication
    delete vendorData.city;
    delete vendorData.street;
    delete vendorData.zipCode;

    // Add last activity timestamp
    vendorData.lastActivity = new Date().toISOString();

    // Save to vendors data
    vendorsData[vendorId] = vendorData;

    // Save to localStorage
    saveVendorsData();

    // Refresh UI
    loadVendorsData();
    updateVendorsStatistics();
    renderVendorsTable();
    populateCityFilter();

    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("vendorModal")
    );
    modal.hide();

    // Show success message
    const action = editingVendorId ? "updated" : "created";
    showAlert(
      `Vendor "${vendorData.name}" has been ${action} successfully`,
      "success"
    );
    
    // Reset editing ID
    editingVendorId = null;
  } catch (error) {
    console.error("Error saving vendor:", error);
    showAlert("Error saving vendor. Please try again.", "danger");
  }
}
/**
 * Generate unique vendor ID that follows the existing numeric sequence
 */
function generateVendorId() {
  // Get all existing vendor IDs
  const existingIds = Object.keys(vendorsData)
    .map(id => parseInt(id))
    .filter(id => !isNaN(id))
    .sort((a, b) => a - b);
  
  // If there are existing IDs, find the next sequential ID
  if (existingIds.length > 0) {
    const maxId = Math.max(...existingIds);
    return maxId + 1;
  }
  
  // If no existing vendors, start from 4 (based on your example data)
  return 4;
}
/**
 * Save vendors data to localStorage
 */
function saveVendorsData() {
  try {
    // Update users data with sellers
    const storedUsers = localStorage.getItem("users");
    let usersData = storedUsers
      ? JSON.parse(storedUsers)
      : { admins: {}, sellers: {}, customers: {} };

    usersData.sellers = vendorsData;
    localStorage.setItem("users", JSON.stringify(usersData));

    // Also save products data
    localStorage.setItem("oldProducts", JSON.stringify(productsData));
  } catch (error) {
    console.error("Error saving vendors data:", error);
    showAlert("Error saving data to storage", "danger");
  }
}
// #endregion === Vendor CRUD Operations ===

// #region === Bulk Operations ===
/**
 * Bulk Operations Module
 *
 * Responsibilities:
 * - Handle bulk vendor operations
 * - Process multiple vendors at once
 */

/**
 * Handle bulk actions
 */
function handleBulkAction(action) {
  if (selectedVendors.size === 0) {
    showAlert("Please select vendors to perform bulk action", "warning");
    return;
  }

  const selectedVendorsList = Array.from(selectedVendors);
  let actionText = "";

  switch (action) {
    case "approve":
      actionText = "approve";
      break;
    case "suspend":
      actionText = "suspend";
      break;
    case "delete":
      actionText = "delete";
      break;
  }

  if (
    confirm(
      `Are you sure you want to ${actionText} ${selectedVendorsList.length} selected vendors?`
    )
  ) {
    processBulkAction(action, selectedVendorsList);
  }
}

/**
 * Process bulk action on selected vendors
 */
function processBulkAction(action, vendorIds) {
  let successCount = 0;

  vendorIds.forEach((vendorId) => {
    const vendor = vendorsData[vendorId]; // البحث مباشرة في vendorsData
    if (vendor) {
      switch (action) {
        case "approve":
          vendorsData[vendorId].status = "active";
          successCount++;
          break;
        case "suspend":
          vendorsData[vendorId].status = "suspended";
          successCount++;
          break;
        case "delete":
          delete vendorsData[vendorId];
          delete productsData[vendorId];
          successCount++;
          break;
      }
    }
  });

  // Save changes
  saveVendorsData();

  // Clear selection
  selectedVendors.clear();

  // Refresh UI
  loadVendorsData();
  updateVendorsStatistics();
  renderVendorsTable();
  populateCityFilter();

  // Close modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("bulkActionsModal")
  );
  if (modal) modal.hide();

  // Show success message
  showAlert(`Successfully ${action}d ${successCount} vendors`, "success");
}
// #endregion === Bulk Operations ===

// #region === Utility Functions ===
/**
 * Utility Functions Module
 *
 * Responsibilities:
 * - Provide common utility functions
 * - Handle alerts and notifications
 * - Export and refresh functionality
 */

/**
 * Show alert message
 */
function showAlert(message, type = "info") {
  const alertContainer = document.getElementById("alertContainer");
  const alertId = "alert_" + Date.now();

  const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

  alertContainer.insertAdjacentHTML("beforeend", alertHTML);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
      const alert = bootstrap.Alert.getInstance(alertElement);
      if (alert) alert.close();
    }
  }, 5000);
}

/**
 * Export vendors data
 */
function exportVendors() {
  try {
    const exportData = filteredVendors.map((vendor) => ({
      ID: vendor.id,
      Name: vendor.name,
      Email: vendor.email,
      Phone: vendor.phone,
      City: vendor.city,
      Street: vendor.street,
      "Zip Code": vendor.zipCode,
      Status: vendor.status,
      "Main Vendor": vendor.isMainSeller ? "Yes" : "No",
      "Products Count": vendor.productsCount,
      "Created Date": formatDate(vendor.createdAt),
      "Last Activity": formatDate(vendor.lastActivity),
    }));

    const csv = convertToCSV(exportData);
    downloadCSV(csv, "vendors_export.csv");

    showAlert("Vendors data exported successfully", "success");
  } catch (error) {
    console.error("Error exporting vendors:", error);
    showAlert("Error exporting vendors data", "danger");
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header] || "";
        return `"${value.toString().replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Download CSV file
 */
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  window.URL.revokeObjectURL(url);
}

/**
 * Refresh vendors data
 */
function refreshVendors() {
  loadVendorsData();
  updateVendorsStatistics();
  renderVendorsTable();
  populateCityFilter();
  showAlert("Vendors data refreshed", "info");
}

/**
 * Setup form validation
 */
function setupFormValidation() {
  // Add real-time validation if needed
  const form = document.getElementById("vendorForm");
  const inputs = form.querySelectorAll("input, select, textarea");

  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this);
    });
  });
}

/**
 * Validate individual form field
 */
function validateField(field) {
  // Add field-specific validation logic here
  field.classList.remove("is-invalid");

  if (field.hasAttribute("required") && !field.value.trim()) {
    field.classList.add("is-invalid");
    return false;
  }

  if (field.type === "email" && field.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value)) {
      field.classList.add("is-invalid");
      return false;
    }
  }

  return true;
}
// #endregion === Utility Functions ===

/**
 * Create a card for a vendor for mobile view
 */
function createVendorCardMobile(vendor) {
  const avatar = vendor.name ? vendor.name.charAt(0).toUpperCase() : "V";
  const statusClass = getStatusClass(vendor.status);
  const isMainVendor = vendor.isMainSeller;
 const city =
   vendor.address && vendor.address.city ? vendor.address.city : "Unknown";
  return `
        <div class="vendor-card-mobile card mb-3">
            <div class="card-body">
                <div class="d-flex align-items-center mb-3">
                    <input type="checkbox" class="form-check-input vendor-checkbox me-3" 
                           value="${vendor.id}" ${
    selectedVendors.has(vendor.id) ? "checked" : ""
  }>
                    <div class="vendor-info flex-grow-1">
                        <div class="vendor-avatar ${
                          isMainVendor ? "main-vendor-indicator" : ""
                        }">${avatar}</div>
                        <div class="vendor-details">
                            <h6 class="mb-0">${vendor.name || "Unknown"}</h6>
                            <small class="text-muted">${
                              vendor.email || "No email"
                            }</small>
                        </div>
                    </div>
                </div>
                <div class="row g-2 myd">
                    <div class="col-6">
                        <div class="detail-item">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">${
                              city|| "Unknown"
                            }</span>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="status-badge status-${statusClass}">${
    vendor.status || "active"
  }</span>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="detail-item">
                            <span class="detail-label">Type:</span>
                            <span class="type-badge type-${
                              isMainVendor ? "main" : "regular"
                            }">
                                ${isMainVendor ? "Main Vendor" : "Regular"}
                            </span>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="detail-item">
                            <span class="detail-label">Products:</span>
                            <span class="products-count">${
                              vendor.productsCount || 0
                            }</span>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="detail-item">
                            <span class="detail-label">Joined:</span>
                            <small class="text-muted">${formatDate(
                              vendor.createdAt
                            )}</small>
                        </div>
                    </div>
                </div>
                <div class="action-buttons mt-3 justify-content-end">
                    <button class="action-btn btn-view" onclick="viewVendor('${
                      vendor.id
                    }')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="editVendor('${
                      vendor.id
                    }')">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="action-btn btn-products" onclick="viewVendorProducts('${
                      vendor.id
                    }')">
                        <i class="fa-solid fa-box"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteVendor('${
                      vendor.id
                    }')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}
