// ============= Orders Management System =============

// Global variables
let currentPage = 1;
let itemsPerPage = 10;
let totalOrders = 0;
let filteredOrders = [];
let allOrders = [];
let selectedOrders = [];
let currentEditingOrder = null;
let autoRefreshInterval = null;

// ============= Initialization =============
initializeOrdersPage();

function initializeOrdersPage() {
  console.log("Initializing Orders Management Page...");
  setupEventListeners();
  loadOrders();
  setupAutoRefresh();
}

// ============= Data Loading =============
function loadOrders() {
  try {
    const ordersDataString = localStorage.getItem("oldOrders");

    if (!ordersDataString) {
      console.warn("'oldOrders' not found in localStorage.");
      allOrders = [];
      // Add sample data if no orders exist
      if (allOrders.length === 0) {
        const sampleOrder = {
          id: "O_1001",
          customerId: 1001,
          customerName: "John Doe",
          customerEmail: "johndoe@example.com",
          orderDate: new Date().toISOString(),
          paymentMethod: "Credit Card",
          products: [
            {
              productId: "P_1001",
              productName: "Sample Product",
              quantity: 2,
              price: 25.99,
            },
          ],
          sellerId: 3,
          shippingAddress: {
            city: "New York",
            street: "123 Main St",
            zipCode: 10001,
          },
          status: "Pending",
          totalPrice: 51.98,
        };
        allOrders.push(sampleOrder);

        const sampleData = {};
        sampleData[sampleOrder.id] = sampleOrder;
        localStorage.setItem("oldOrders", JSON.stringify(sampleData));
      }
    } else {
      const ordersData = JSON.parse(ordersDataString);
      allOrders = [];

      // Convert the object of objects to an array
      for (const orderKey in ordersData) {
        if (Object.hasOwnProperty.call(ordersData, orderKey)) {
          const order = ordersData[orderKey];
          allOrders.push(order);
        }
      }
    }

    filteredOrders = [...allOrders];
    totalOrders = allOrders.length;

    renderOrders();
    updateStatistics();
    updatePagination();
    loadCustomersDropdown();
    loadPaymentMethodsDropdown();
  } catch (error) {
    console.error("Error loading orders:", error);
    showAlert("Error loading orders data from 'oldOrders'", "danger");
  }
}

function loadCustomersDropdown() {
  try {
    const customerSelect = document.getElementById("customerFilter");
    if (!customerSelect) return;

    // Get unique customer names from the loaded orders
    const customerNames = [...new Set(allOrders.map((o) => o.customerName))];

    customerSelect.innerHTML = '<option value="">All Customers</option>';
    customerNames.forEach((customerName) => {
      const option = document.createElement("option");
      option.value = customerName;
      option.textContent = customerName;
      customerSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading customers:", error);
  }
}

function loadPaymentMethodsDropdown() {
  try {
    const paymentSelect = document.getElementById("paymentFilter");
    if (!paymentSelect) return;

    // Get unique payment methods from the loaded orders
    const paymentMethods = [...new Set(allOrders.map((o) => o.paymentMethod))];

    paymentSelect.innerHTML = '<option value="">All Payments</option>';
    paymentMethods.forEach((paymentMethod) => {
      const option = document.createElement("option");
      option.value = paymentMethod;
      option.textContent = paymentMethod;
      paymentSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading payment methods:", error);
  }
}

// ============= Event Listeners =============
function setupEventListeners() {
  // Header buttons
  document
    .getElementById("refreshOrdersBtn")
    ?.addEventListener("click", refreshOrders);

  // Filter buttons
  document
    .getElementById("applyFiltersBtn")
    ?.addEventListener("click", applyFilters);
  document
    .getElementById("clearFiltersBtn")
    ?.addEventListener("click", clearFilters);

  // Bulk actions
  document
    .getElementById("selectAllOrdersHeader")
    ?.addEventListener("change", toggleSelectAll);

  // Form submission
  document
    .getElementById("orderStatusForm")
    ?.addEventListener("submit", handleStatusUpdate);

  // Sort dropdown
  document.getElementById("sortBy")?.addEventListener("change", applySorting);

  // Auto refresh toggle
  document
    .getElementById("autoRefreshToggle")
    ?.addEventListener("change", toggleAutoRefresh);

  // Print button
  document
    .getElementById("printOrderBtn")
    ?.addEventListener("click", printOrder);

  // Real-time search
  setupRealTimeSearch();

  // Event delegation for action buttons
  setupTableEventListeners();
}

function setupTableEventListeners() {
  const ordersTableBody = document.getElementById("ordersTableBody");
  if (ordersTableBody) {
    ordersTableBody.addEventListener("click", (event) => {
      const target = event.target;
      const button = target.closest(".action-btn");

      if (button) {
        const row = button.closest("tr");
        const orderId = row.querySelector(".order-checkbox").value;

        if (button.classList.contains("btn-view")) {
          viewOrder(orderId);
        } else if (button.classList.contains("btn-status")) {
          updateOrderStatus(orderId);
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
      searchTimeout = setTimeout(applyFilters, 300);
    });
  }
}

function setupAutoRefresh() {
  // Set up auto refresh every 30 seconds if toggle is on
  const autoRefreshToggle = document.getElementById("autoRefreshToggle");
  if (autoRefreshToggle && autoRefreshToggle.checked) {
    autoRefreshInterval = setInterval(() => {
      loadOrders();
      console.log("Orders auto-refreshed");
    }, 30000);
  }
}

function toggleAutoRefresh() {
  const autoRefreshToggle = document.getElementById("autoRefreshToggle");
  if (autoRefreshToggle) {
    if (autoRefreshToggle.checked) {
      setupAutoRefresh();
    } else {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  }
}

// ============= Order Rendering =============
function renderOrders() {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  if (filteredOrders.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fa-solid fa-shopping-cart"></i>
                        <h5>No Orders Found</h5>
                        <p>No orders match your current filters or 'oldOrders' is empty.</p>
                    </div>
                </td>
            </tr>`;
    updatePaginationInfo();
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageOrders = filteredOrders.slice(startIndex, endIndex);

  tbody.innerHTML = pageOrders
    .map((order) => {
      const safeTotal = !isNaN(order.totalPrice)
        ? Number(order.totalPrice).toFixed(2)
        : "-";
      const orderDate = order.orderDate ? formatDate(order.orderDate) : "-";
      const productCount = order.products ? order.products.length : 0;
      const paymentMethod = order.paymentMethod || "Unknown";

      return `
            <tr>
                <td data-label="Select">
                    <input type="checkbox" class="form-check-input order-checkbox" value="${
                      order.id || ""
                    }" onchange="updateSelectedOrders()">
                </td>
                <td data-label="Order ID">
                    <div class="order-id">${order.id || "-"}</div>
                </td>
                <td data-label="Customer">
                    <div class="customer-info">
                        <div class="customer-avatar">${getCustomerInitials(
                          order.customerName || "?"
                        )}</div>
                        <div class="customer-details">
                            <h6>${order.customerName || "-"}</h6>
                            <small>${order.customerEmail || ""}</small>
                        </div>
                    </div>
                </td>
                <td data-label="Date">
                    <small>${orderDate}</small>
                </td>
                <td data-label="Products">
                    <div class="products-count">${productCount} item(s)</div>
                </td>
                <td data-label="Total">
                    <div class="order-total">$${safeTotal}</div>
                </td>
                <td data-label="Payment">
                    <span class="payment-badge payment-${paymentMethod
                      .toLowerCase()
                      .replace(/\s/g, "-")}">
                        ${paymentMethod}
                    </span>
                </td>
                <td data-label="Status">
                    <span class="status-badge status-${(
                      order.status || "pending"
                    ).toLowerCase()}">
                        ${order.status || "Pending"}
                    </span>
                </td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button type="button" class="action-btn btn-view" title="View Details"><i class="fa-solid fa-eye"></i></button>
                        
                    </div>
                </td>
            </tr>`;
    })
    .join("");

  updatePaginationInfo();
}

// ============= Helper Functions =============
function getCustomerInitials(customerName) {
  if (!customerName) return "?";
  const names = customerName.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "-";
  }
}

// ============= Statistics =============
function updateStatistics() {
  document.getElementById("totalOrdersCount").textContent = allOrders.length;
  document.getElementById("completedOrdersCount").textContent =
    allOrders.filter((o) => o.status === "Delivered").length;
  document.getElementById("pendingOrdersCount").textContent = allOrders.filter(
    (o) => o.status === "Pending"
  ).length;

  const totalRevenue = allOrders.reduce(
    (sum, order) => sum + (order.totalPrice || 0),
    0
  );
  document.getElementById(
    "totalRevenue"
  ).textContent = `$${totalRevenue.toFixed(2)}`;
}

// ============= Filtering and Sorting =============
function applyFilters() {
  const searchTerm =
    document.getElementById("searchInput")?.value.toLowerCase() || "";
  const statusFilter = document.getElementById("statusFilter")?.value || "";
  const customerFilter = document.getElementById("customerFilter")?.value || "";
  const paymentFilter = document.getElementById("paymentFilter")?.value || "";

  filteredOrders = allOrders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      (order.id && order.id.toLowerCase().includes(searchTerm)) ||
      (order.customerName &&
        order.customerName.toLowerCase().includes(searchTerm)) ||
      (order.customerEmail &&
        order.customerEmail.toLowerCase().includes(searchTerm));

    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesCustomer =
      !customerFilter || order.customerName === customerFilter;
    const matchesPayment =
      !paymentFilter || order.paymentMethod === paymentFilter;

    return matchesSearch && matchesStatus && matchesCustomer && matchesPayment;
  });

  currentPage = 1;
  applySorting();
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("statusFilter").value = "";
  document.getElementById("customerFilter").value = "";
  document.getElementById("paymentFilter").value = "";
  document.getElementById("sortBy").value = "orderDate";
  filteredOrders = [...allOrders];
  currentPage = 1;
  renderOrders();
  updatePagination();
}

function applySorting() {
  const sortBy = document.getElementById("sortBy")?.value || "orderDate";
  filteredOrders.sort((a, b) => {
    switch (sortBy) {
      case "orderDate":
        return new Date(b.orderDate || 0) - new Date(a.orderDate || 0);
      case "orderDateOldest":
        return new Date(a.orderDate || 0) - new Date(b.orderDate || 0);
      case "totalPrice":
        return (b.totalPrice || 0) - (a.totalPrice || 0);
      case "totalPriceLowest":
        return (a.totalPrice || 0) - (b.totalPrice || 0);
      case "customerName":
        return (a.customerName || "").localeCompare(b.customerName || "");
      default:
        return 0;
    }
  });
  renderOrders();
}

// ============= Pagination =============
function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const pagination = document.getElementById("ordersPagination");
    if (!pagination) return;

    let paginationHTML = "";
    if (totalPages <= 1) {
        pagination.innerHTML = "";
        return;
    }

    // Always show first and last page, and up to 4 pages around current page
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 3);
    
    // Adjust if we're near the end
    if (endPage - startPage < 3) {
        startPage = Math.max(1, endPage - 3);
    }

    paginationHTML += `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
            <i class="fa-solid fa-chevron-left"></i>
        </a>
    </li>`;

    // Show first page if not in the initial range
    if (startPage > 1) {
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1)">1</a></li>`;
        if (startPage > 2) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Show page numbers (maximum 4 pages)
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<li class="page-item ${i === currentPage ? "active" : ""}">
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>`;
    }

    // Show last page if not in the current range
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
    }

    paginationHTML += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
            <i class="fa-solid fa-chevron-right"></i>
        </a>
    </li>`;

    pagination.innerHTML = paginationHTML;
    updatePaginationInfo();
}

function updatePaginationInfo() {
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(
    startIndex + itemsPerPage - 1,
    filteredOrders.length
  );
  document.getElementById("showingStart").textContent =
    filteredOrders.length > 0 ? startIndex : 0;
  document.getElementById("showingEnd").textContent = endIndex;
  document.getElementById("totalOrders").textContent = filteredOrders.length;
}

function changePage(page) {
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderOrders();
    updatePagination();
  }
}

// ============= Order Management =============
function viewOrder(orderId) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) {
    showAlert("Order not found.", "danger");
    return;
  }

  document.getElementById("orderIdTitle").textContent = order.id;

  const detailsContent = document.getElementById("orderDetailsContent");
  detailsContent.innerHTML = `
        <div class="order-detail-section">
            <h6>Order Information</h6>
            <div class="detail-item">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${order.id || "-"}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Order Date:</span>
                <span class="detail-value">${formatDate(order.orderDate)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value status-badge status-${(
                  order.status || "pending"
                ).toLowerCase()}">${order.status || "Pending"}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Total:</span>
                <span class="detail-value">$${
                  order.totalPrice
                    ? Number(order.totalPrice).toFixed(2)
                    : "0.00"
                }</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${order.paymentMethod || "-"}</span>
            </div>
        </div>
        
        <div class="order-detail-section">
            <h6>Customer Information</h6>
            <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${order.customerName || "-"}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${order.customerEmail || "-"}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Customer ID:</span>
                <span class="detail-value">${order.customerId || "-"}</span>
            </div>
        </div>
        
        <div class="order-detail-section">
            <h6>Shipping Address</h6>
            <div class="detail-item">
                <span class="detail-label">Street:</span>
                <span class="detail-value">${
                  order.shippingAddress?.street || "-"
                }</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">City:</span>
                <span class="detail-value">${
                  order.shippingAddress?.city || "-"
                }</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Zip Code:</span>
                <span class="detail-value">${
                  order.shippingAddress?.zipCode || "-"
                }</span>
            </div>
        </div>
        
        <div class="order-detail-section">
            <h6>Products (${order.products ? order.products.length : 0})</h6>
            ${
              order.products
                ? order.products
                    .map(
                      (product) => `
                <div class="detail-item">
                    <span class="detail-label">${
                      product.productName || "Unknown Product"
                    } (x${product.quantity || 1})</span>
                    <span class="detail-value">$${
                      product.price ? Number(product.price).toFixed(2) : "0.00"
                    }</span>
                </div>
            `
                    )
                    .join("")
                : "<p>No products found</p>"
            }
        </div>
    `;

  const modal = new bootstrap.Modal(
    document.getElementById("orderDetailsModal")
  );
  modal.show();
}

function updateOrderStatus(orderId) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) {
    showAlert("Order not found.", "danger");
    return;
  }

  currentEditingOrder = order;
  document.getElementById("orderIdForStatus").value = orderId;
  document.getElementById("orderStatus").value = order.status || "Pending";
  document.getElementById("statusNotes").value = "";

  const modal = new bootstrap.Modal(
    document.getElementById("orderStatusModal")
  );
  modal.show();
}

function handleStatusUpdate(event) {
  event.preventDefault();

  const orderId = document.getElementById("orderIdForStatus").value;
  const newStatus = document.getElementById("orderStatus").value;
  const statusNotes = document.getElementById("statusNotes").value;

  // Find the order in allOrders
  const orderIndex = allOrders.findIndex((o) => o.id === orderId);
  if (orderIndex === -1) {
    showAlert("Order not found for update.", "danger");
    return;
  }

  // Update the order status
  allOrders[orderIndex].status = newStatus;

  // Add status history if it doesn't exist
  if (!allOrders[orderIndex].statusHistory) {
    allOrders[orderIndex].statusHistory = [];
  }

  // Add new status to history
  allOrders[orderIndex].statusHistory.push({
    status: newStatus,
    date: new Date().toISOString(),
    notes: statusNotes,
  });

  // Update localStorage
  const newLocalStorageData = {};
  allOrders.forEach((order) => {
    newLocalStorageData[order.id] = order;
  });
  localStorage.setItem("oldOrders", JSON.stringify(newLocalStorageData));

  showAlert(`Order status updated to ${newStatus} successfully!`, "success");

  // Refresh the view
  loadOrders();

  // Close the modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("orderStatusModal")
  );
  modal.hide();
}

function printOrder() {
  const printContent = document.getElementById("orderDetailsContent").innerHTML;
  const originalContent = document.body.innerHTML;

  document.body.innerHTML = `
        <div class="container mt-4">
            <h2 class="text-center mb-4">Order Details - ${
              document.getElementById("orderIdTitle").textContent
            }</h2>
            ${printContent}
        </div>
    `;

  window.print();
  document.body.innerHTML = originalContent;
  loadOrders(); // Reload to restore functionality
}

// ============= Bulk Actions =============
function toggleSelectAll(event) {
  const isChecked = event.target.checked;
  document
    .querySelectorAll(".order-checkbox")
    .forEach((cb) => (cb.checked = isChecked));
  document.getElementById("selectAllOrdersHeader").checked = isChecked;
  updateSelectedOrders();
}

function updateSelectedOrders() {
  const checkboxes = document.querySelectorAll(".order-checkbox:checked");
  selectedOrders = Array.from(checkboxes).map((cb) => cb.value);
}

// ============= Utility Functions =============
function refreshOrders() {
  loadOrders();
  showAlert("Orders refreshed successfully.", "success");
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
window.viewOrder = viewOrder;
window.updateOrderStatus = updateOrderStatus;
window.updateSelectedOrders = updateSelectedOrders;
