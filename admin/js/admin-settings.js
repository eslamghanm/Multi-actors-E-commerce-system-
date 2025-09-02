// #region === Admin Settings Initialization ===
/**
 * Admin Settings Initialization Module
 *
 * Responsibilities:
 * - Initialize admin settings management system
 * - Load and process admin data from localStorage
 * - Set up event listeners and UI components
 */

// Global variables
let adminsData = {};
let systemSettings = {};
let filteredAdmins = [];
let currentPage = 1;
let adminsPerPage = 10;
let currentSort = { field: "name", direction: "asc" };
let selectedAdmins = new Set();
let editingAdminId = null;

// Initialize the admin settings management system
initializeAdminSettings();

/**
 * Main initialization function
 */
function initializeAdminSettings() {
  loadAdminsData();
  loadSystemSettings();
  setupEventListeners();
  updateAdminsStatistics();
  renderAdminsTable();
  setupFormValidation();
  setupPermissionsToggle();
}

/**
 * Load admins data from localStorage
 */
function loadAdminsData() {
  try {
    // Load users data to get admins
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      const usersData = JSON.parse(storedUsers);
      adminsData = usersData.admins || {};
    } else {
      adminsData = {};
    }
    // Process and flatten admins data for easier management
    processAdminsData();
  } catch (error) {
    console.error("Error loading admins data:", error);
    showAlert("Error loading admins data", "danger");
    adminsData = {};
  }
}

/**
 * Load system settings from localStorage
 */
function loadSystemSettings() {
  try {
    const storedSettings = localStorage.getItem("systemSettings");
    if (storedSettings) {
      systemSettings = JSON.parse(storedSettings);
    } else {
      // Initialize with default settings
      systemSettings = {
        allowRegistration: true,
        emailNotifications: true,
        maintenanceMode: false,
        autoBackup: true,
      };
    }

    // Apply settings to UI
    applySystemSettingsToUI();
  } catch (error) {
    console.error("Error loading system settings:", error);
    showAlert("Error loading system settings", "danger");
    systemSettings = {
      allowRegistration: true,
      emailNotifications: true,
      maintenanceMode: false,
      autoBackup: true,
    };
  }
}

/**
 * Apply system settings to UI elements
 */
function applySystemSettingsToUI() {
  document.getElementById("allowRegistration").checked =
    systemSettings.allowRegistration || false;
  document.getElementById("emailNotifications").checked =
    systemSettings.emailNotifications || false;
  document.getElementById("maintenanceMode").checked =
    systemSettings.maintenanceMode || false;
  document.getElementById("autoBackup").checked =
    systemSettings.autoBackup || false;
}

/**
 * Process admins data into a flat array for easier manipulation
 */
function processAdminsData() {
  filteredAdmins = [];

  // Process admins
  if (adminsData) {
    Object.entries(adminsData).forEach(([id, admin]) => {
      filteredAdmins.push({
        id: id,
        ...admin,
        createdAt: admin.createdAt || new Date().toISOString(),
        lastActivity: admin.lastActivity || new Date().toISOString(),
        permissions: admin.permissions || [],
      });
    });
  }
}
// #endregion === Admin Settings Initialization ===

// #region === Event Listeners Setup ===
/**
 * Event Listeners Setup Module
 *
 * Responsibilities:
 * - Set up all event listeners for admin interactions
 * - Handle form submissions and button clicks
 */

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Add admin button
  document
    .getElementById("addAdminBtn")
    .addEventListener("click", openAddAdminModal);

  // System settings
  document
    .getElementById("saveSettingsBtn")
    .addEventListener("click", saveSystemSettings);

  // Search and filter controls
  document
    .getElementById("searchInput")
    .addEventListener("input", debounce(handleSearch, 300));
  document
    .getElementById("statusFilter")
    .addEventListener("change", handleFilter);
  document
    .getElementById("typeFilter")
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
    .getElementById("selectAllAdmins")
    .addEventListener("change", handleSelectAll);
  document
    .getElementById("exportAdminsBtn")
    .addEventListener("click", exportAdmins);
  document
    .getElementById("refreshAdminsBtn")
    .addEventListener("click", refreshAdmins);

  // Admin form
  document
    .getElementById("adminForm")
    .addEventListener("submit", handleAdminFormSubmit);
  document
    .getElementById("isSuperAdmin")
    .addEventListener("change", handleSuperAdminToggle);

  // Bulk actions
  document
    .getElementById("bulkActivateBtn")
    .addEventListener("click", () => handleBulkAction("activate"));
  document
    .getElementById("bulkSuspendBtn")
    .addEventListener("click", () => handleBulkAction("suspend"));
  document
    .getElementById("bulkDeleteBtn")
    .addEventListener("click", () => handleBulkAction("delete"));
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

/**
 * Setup permissions toggle functionality
 */
function setupPermissionsToggle() {
  const superAdminCheckbox = document.getElementById("isSuperAdmin");
  const permissionsSection = document.getElementById("permissionsSection");

  superAdminCheckbox.addEventListener("change", function () {
    if (this.checked) {
      permissionsSection.style.opacity = "0.5";
      permissionsSection.style.pointerEvents = "none";
      // Check all permissions
      document.querySelectorAll(".permission-checkbox").forEach((checkbox) => {
        checkbox.checked = true;
      });
    } else {
      permissionsSection.style.opacity = "1";
      permissionsSection.style.pointerEvents = "auto";
    }
  });
}
// #endregion === Event Listeners Setup ===

// #region === Statistics and UI Updates ===
/**
 * Statistics and UI Updates Module
 *
 * Responsibilities:
 * - Calculate and display admin statistics
 * - Update UI elements with current data
 */

/**
 * Update admins statistics cards
 */
function updateAdminsStatistics() {
  const stats = calculateAdminsStatistics();

  document.getElementById("totalAdminsCount").textContent = stats.total;
  document.getElementById("activeAdminsCount").textContent = stats.active;
  document.getElementById("superAdminsCount").textContent = stats.super;
  document.getElementById("recentLoginsCount").textContent = stats.recentLogins;
}

/**
 * Calculate admins statistics
 */
function calculateAdminsStatistics() {
  const stats = {
    total: filteredAdmins.length,
    active: 0,
    super: 0,
    recentLogins: 0,
  };

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  filteredAdmins.forEach((admin) => {
    // Count by status
    if (admin.status === "active" || !admin.status) {
      stats.active++;
    }

    // Count super admins
    if (admin.issuperadmin) {
      stats.super++;
    }

    // Count recent logins (within last 24 hours)
    if (admin.lastActivity) {
      const lastActivity = new Date(admin.lastActivity);
      if (lastActivity > oneDayAgo) {
        stats.recentLogins++;
      }
    }
  });

  return stats;
}

/**
 * Update pagination info
 */
function updatePaginationInfo() {
  const totalAdmins = filteredAdmins.length;
  const startIndex = (currentPage - 1) * adminsPerPage + 1;
  const endIndex = Math.min(currentPage * adminsPerPage, totalAdmins);

  document.getElementById("showingStart").textContent =
    totalAdmins > 0 ? startIndex : 0;
  document.getElementById("showingEnd").textContent = endIndex;
  document.getElementById("totalAdmins").textContent = totalAdmins;
}
// #endregion === Statistics and UI Updates ===

// #region === System Settings Management ===
/**
 * System Settings Management Module
 *
 * Responsibilities:
 * - Handle system settings changes
 * - Save and load system configuration
 */

/**
 * Save system settings
 */
function saveSystemSettings() {
  try {
    // Get current settings from UI
    systemSettings.allowRegistration =
      document.getElementById("allowRegistration").checked;
    systemSettings.emailNotifications =
      document.getElementById("emailNotifications").checked;
    systemSettings.maintenanceMode =
      document.getElementById("maintenanceMode").checked;
    systemSettings.autoBackup = document.getElementById("autoBackup").checked;

    // Save to localStorage
    localStorage.setItem("systemSettings", JSON.stringify(systemSettings));

    showAlert("System settings saved successfully", "success");
  } catch (error) {
    console.error("Error saving system settings:", error);
    showAlert("Error saving system settings", "danger");
  }
}
// #endregion === System Settings Management ===

// #region === Search and Filter Functions ===
/**
 * Search and Filter Functions Module
 *
 * Responsibilities:
 * - Handle search functionality
 * - Apply filters to admin data
 * - Sort admins based on criteria
 */

/**
 * Handle search input
 */
function handleSearch() {
  currentPage = 1;
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
  const typeFilter = document.getElementById("typeFilter").value;

  // Start with all admins
  processAdminsData();

  // Apply search filter
  if (searchTerm) {
    filteredAdmins = filteredAdmins.filter(
      (admin) =>
        admin.name?.toLowerCase().includes(searchTerm) ||
        admin.email?.toLowerCase().includes(searchTerm) ||
        admin.id?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply status filter
  if (statusFilter) {
    filteredAdmins = filteredAdmins.filter(
      (admin) => admin.status === statusFilter
    );
  }

  // Apply type filter
  if (typeFilter) {
    if (typeFilter === "super") {
      filteredAdmins = filteredAdmins.filter((admin) => admin.issuperadmin);
    } else if (typeFilter === "regular") {
      filteredAdmins = filteredAdmins.filter((admin) => !admin.issuperadmin);
    }
  }

  // Apply sorting
  sortAdmins();

  // Reset to first page
  currentPage = 1;

  // Update UI
  updateAdminsStatistics();
  renderAdminsTable();
}

/**
 * Clear all filters
 */
function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("statusFilter").value = "";
  document.getElementById("typeFilter").value = "";
  document.getElementById("sortBy").value = "name";

  currentSort = { field: "name", direction: "asc" };
  applyFilters();
}

/**
 * Sort admins based on current sort criteria
 */
function sortAdmins() {
  filteredAdmins.sort((a, b) => {
    let aValue = a[currentSort.field] || "";
    let bValue = b[currentSort.field] || "";

    // Handle different data types
    if (
      currentSort.field === "createdAt" ||
      currentSort.field === "lastActivity"
    ) {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
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
 * - Render admins table with data
 * - Handle pagination
 * - Generate table rows and controls
 */

/**
 * Render the admins table
 */
function renderAdminsTable() {
  const tableBody = document.getElementById("adminsTableBody");
  const startIndex = (currentPage - 1) * adminsPerPage;
  const endIndex = startIndex + adminsPerPage;
  const pageAdmins = filteredAdmins.slice(startIndex, endIndex);

  if (pageAdmins.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fa-solid fa-user-shield fa-3x mb-3"></i>
                        <p class="mb-0">No administrators found</p>
                    </div>
                </td>
            </tr>
        `;
  } else {
    tableBody.innerHTML = pageAdmins
      .map((admin) => createAdminRow(admin))
      .join("");
  }

  updatePaginationInfo();
  renderPagination();
  updateSelectAllCheckbox();
}

/**
 * Create a table row for an admin
 */

/**
 * Create a table row for an admin
 */
function createAdminRow(admin) {
  const avatar = admin.name ? admin.name.charAt(0).toUpperCase() : "A";
  const statusClass = getStatusClass(admin.status);
  const isSuperAdmin = admin.issuperadmin;
  const permissions = admin.permissions || [];
  const isActionDisabled = isSuperAdmin ? 'disabled style="opacity: 0.5;"' : "";
  return `
        <tr>
            <td data-label="Select">
            ${
              !isSuperAdmin
                ? `<input type="checkbox" class="form-check-input admin-checkbox" value="${
                    admin.id
                  }" ${selectedAdmins.has(admin.id) ? "checked" : ""}>`
                : ""
            }
        </td>
            <td data-label="Administrator">
                <div class="admin-info">
                    <div class="admin-avatar ${
                      isSuperAdmin ? "super-admin-indicator" : ""
                    }">${avatar}</div>
                    <div class="admin-details">
                        <h6 class="mb-0">${admin.name || "Unknown"}</h6>
                        <small class="text-muted">${
                          admin.email || "No email"
                        }</small>
                    </div>
                </div>
            </td>
            <td data-label="Type">
                <span class="type-badge type-${
                  isSuperAdmin ? "super" : "regular"
                }">
                    ${admin.role || "Unknown"}
                </span>
            </td>
            <td data-label="Status">
                <span class="status-badge status-${statusClass}">${
    admin.status || "active"
  }</span>
            </td>
            <td data-label="Permissions">
                <div class="permissions-list">
                    ${
                      isSuperAdmin
                        ? '<span class="permission-tag all-permissions">All Permissions</span>'
                        : permissions.length > 0
                        ? permissions
                            .slice(0, 2)
                            .map(
                              (perm) =>
                                `<span class="permission-tag">${perm}</span>`
                            )
                            .join("") +
                          (permissions.length > 2
                            ? `<span class="permission-tag">+${
                                permissions.length - 2
                              }</span>`
                            : "")
                        : '<span class="text-muted">No permissions</span>'
                    }
                </div>
            </td>
            <td data-label="Last Activity">
                <small class="text-muted">${formatDate(
                  admin.lastActivity
                )}</small>
            </td>
            <td data-label="Created Date">
                <small class="text-muted">${formatDate(admin.createdAt)}</small>
            </td>
             <td data-label="Actions">
            <div class="action-buttons">
                <button class="action-btn btn-view" onclick="viewAdmin('${
                  admin.id
                }')" title="View Details">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button class="action-btn btn-activity" onclick="viewAdminActivity('${
                  admin.id
                }')" title="View Activity">
                    <i class="fa-solid fa-history"></i>
                </button>
                <button class="action-btn btn-edit" onclick="editAdmin('${
                  admin.id
                }')" title="Edit Admin" ${isActionDisabled}>
                    <i class="fa-solid fa-edit"></i>
                </button>
                <button class="action-btn btn-delete" onclick="deleteAdmin('${
                  admin.id
                }')" title="Delete Admin" ${isActionDisabled}>
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </td>
        </tr>
    `;
}
/**
 * Get CSS class for admin status
 */
function getStatusClass(status) {
  switch (status) {
    case "active":
      return "active";
    case "inactive":
      return "inactive";
    case "suspended":
      return "suspended";
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
  const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);
  const pagination = document.getElementById("adminsPagination");

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
  const totalPages = Math.ceil(filteredAdmins.length / adminsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderAdminsTable();
  }
}
// #endregion === Table Rendering ===

// #region === Admin Selection Management ===
/**
 * Admin Selection Management Module
 *
 * Responsibilities:
 * - Handle admin selection for bulk operations
 * - Manage select all functionality
 */

/**
 * Handle select all checkbox
 */
function handleSelectAll() {
  const selectAllCheckbox = document.getElementById("selectAllAdmins");
  const adminCheckboxes = document.querySelectorAll(".admin-checkbox");

  if (selectAllCheckbox.checked) {
    adminCheckboxes.forEach((checkbox) => {
      checkbox.checked = true;
      selectedAdmins.add(checkbox.value);
    });
  } else {
    adminCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
      selectedAdmins.delete(checkbox.value);
    });
  }

  updateBulkActionsButton();
}

/**
 * Update select all checkbox state
 */
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById("selectAllAdmins");
  const adminCheckboxes = document.querySelectorAll(".admin-checkbox");
  const checkedCheckboxes = document.querySelectorAll(
    ".admin-checkbox:checked"
  );

  if (adminCheckboxes.length === 0) {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = false;
  } else if (checkedCheckboxes.length === adminCheckboxes.length) {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = true;
  } else if (checkedCheckboxes.length > 0) {
    selectAllCheckbox.indeterminate = true;
    selectAllCheckbox.checked = false;
  } else {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = false;
  }

  // Update selected admins set
  selectedAdmins.clear();
  checkedCheckboxes.forEach((checkbox) => {
    selectedAdmins.add(checkbox.value);
  });

  updateBulkActionsButton();
}

/**
 * Update bulk actions button visibility
 */
function updateBulkActionsButton() {
  const selectedCount = selectedAdmins.size;
  document.getElementById("selectedAdminsCount").textContent = selectedCount;

  // Show/hide bulk actions modal trigger (you can add a button for this)
  if (selectedCount > 0) {
    // Enable bulk actions
    console.log(`${selectedCount} admins selected`);
  }
}

// Add event listener for individual checkboxes (delegated)
document.addEventListener("change", function (e) {
  if (e.target.classList.contains("admin-checkbox")) {
    updateSelectAllCheckbox();
  }
});
// #endregion === Admin Selection Management ===

// #region === Admin CRUD Operations ===
/**
 * Admin CRUD Operations Module
 *
 * Responsibilities:
 * - Handle admin creation, reading, updating, and deletion
 * - Manage admin modals and forms
 */

/**
 * Open add admin modal
 */
function openAddAdminModal() {
  editingAdminId = null;
  document.getElementById("adminModalTitle").textContent =
    "Add New Administrator";
  document.getElementById("saveAdminBtn").textContent = "Save Administrator";

  // Reset form
  document.getElementById("adminForm").reset();
  document.getElementById("isSuperAdmin").checked = false;
  handleSuperAdminToggle();

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("adminModal"));
  modal.show();
}

/**
 * Edit admin
 */
function editAdmin(adminId) {
  const admin = findAdminById(adminId); // البحث مباشرة في adminsData

  if (!admin) {
    showAlert("Administrator not found", "danger");
    return;
  }
  if (admin.role === "superadmin") {
    showAlert("Cannot edit super administrator accounts", "warning");
    return;
  }
  editingAdminId = adminId;
  document.getElementById("adminModalTitle").textContent = "Edit Administrator";
  document.getElementById("saveAdminBtn").textContent = "Update Administrator";

  // Populate form
  document.getElementById("adminName").value = admin.name || "";
  document.getElementById("adminEmail").value = admin.email || "";
  document.getElementById("adminPhone").value = admin.phone || "";
  document.getElementById("adminStatus").value = admin.status || "active";
  document.getElementById("isSuperAdmin").checked = admin.issuperadmin || false;

  // Handle permissions
  const permissions = admin.permissions || [];
  document.querySelectorAll(".permission-checkbox").forEach((checkbox) => {
    checkbox.checked = permissions.includes(checkbox.value);
  });

  handleSuperAdminToggle();

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("adminModal"));
  modal.show();
}

/**
 * View admin details
 */
function viewAdmin(adminId) {
  const admin = adminsData[adminId]; // البحث مباشرة في adminsData

  if (!admin) {
    showAlert("Administrator not found", "danger");
    return;
  }

  const adminDetailsContent = document.getElementById("adminDetailsContent");
  const permissions = admin.permissions || [];

  adminDetailsContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="admin-detail-section">
                    <h6>Basic Information</h6>
                    <div class="detail-item">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${admin.name || "N/A"}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${
                          admin.email || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${
                          admin.phone || "N/A"
                        }</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="status-badge status-${getStatusClass(
                              admin.status
                            )}">${admin.status || "active"}</span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">
                            <span class="type-badge type-${
                              admin.issuperadmin ? "super" : "regular"
                            }">
                                ${
                                  admin.issuperadmin
                                    ? "Super Administrator"
                                    : "Regular Administrator"
                                }
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="admin-detail-section">
                    <h6>Account Information</h6>
                    <div class="detail-item">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${formatDate(
                          admin.createdAt
                        )}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Last Activity:</span>
                        <span class="detail-value">${formatDate(
                          admin.lastActivity
                        )}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Permissions:</span>
                        <span class="detail-value">
                            ${
                              admin.issuperadmin
                                ? '<span class="permission-tag all-permissions">All Permissions</span>'
                                : permissions.length > 0
                                ? permissions
                                    .map(
                                      (perm) =>
                                        `<span class="permission-tag">${perm}</span>`
                                    )
                                    .join(" ")
                                : '<span class="text-muted">No permissions assigned</span>'
                            }
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;

  const modal = new bootstrap.Modal(
    document.getElementById("adminDetailsModal")
  );
  modal.show();
}

/**
 * View admin activity log
 */
function viewAdminActivity(adminId) {
  const admin = adminsData[adminId]; // البحث مباشرة في adminsData

  if (!admin) {
    showAlert("Administrator not found", "danger");
    return;
  }

  document.getElementById(
    "activityLogModalTitle"
  ).textContent = `${admin.name}'s Activity Log`;

  const activityLogContent = document.getElementById("activityLogContent");

  // Generate sample activity log (in a real app, this would come from a database)
  const sampleActivities = [
    {
      timestamp: new Date().toISOString(),
      action: "Login",
      details: "Logged in from IP: 192.168.1.100",
      type: "info",
    },
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: "Updated User",
      details: "Modified user profile for John Doe",
      type: "success",
    },
    {
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      action: "System Settings",
      details: "Changed email notification settings",
      type: "warning",
    },
  ];

  if (sampleActivities.length === 0) {
    activityLogContent.innerHTML = `
            <div class="text-center py-4">
                <i class="fa-solid fa-history fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-0">No activity recorded for this administrator.</p>
            </div>
        `;
  } else {
    activityLogContent.innerHTML = sampleActivities
      .map(
        (activity) => `
            <div class="activity-log-item ${activity.type}">
                <div class="activity-timestamp">${formatDateTime(
                  activity.timestamp
                )}</div>
                <div class="activity-action">${activity.action}</div>
                <div class="activity-details">${activity.details}</div>
            </div>
        `
      )
      .join("");
  }

  const modal = new bootstrap.Modal(
    document.getElementById("activityLogModal")
  );
  modal.show();
}

/**
 * Delete admin
 */
function deleteAdmin(adminId) {
  const admin = findAdminById(adminId); // البحث مباشرة في adminsData

  if (!admin) {
    showAlert("Administrator not found", "danger");
    return;
  }
  if (admin.role === "superadmin") {
    showAlert("Cannot delete super administrator accounts", "warning");
    return;
  }
  if (
    confirm(
      `Are you sure you want to delete administrator "${admin.name}"? This action cannot be undone.`
    )
  ) {
    // Remove admin from data structure
    delete adminsData[adminId];

    // Save to localStorage
    saveAdminsData();

    // Refresh UI
    loadAdminsData();
    updateAdminsStatistics();
    renderAdminsTable();

    showAlert(
      `Administrator "${admin.name}" has been deleted successfully`,
      "success"
    );
  }
}
/**
 * Find admin by ID
 */
function findAdminById(adminId) {
  // البحث في adminsData بدلاً من filteredAdmins
  return adminsData[adminId] ? { id: adminId, ...adminsData[adminId] } : null;
}
/**
 * Handle super admin toggle
 */
function handleSuperAdminToggle() {
  const isSuperAdmin = document.getElementById("isSuperAdmin").checked;
  const permissionsSection = document.getElementById("permissionsSection");

  if (isSuperAdmin) {
    permissionsSection.style.opacity = "0.5";
    permissionsSection.style.pointerEvents = "none";
    // Check all permissions
    document.querySelectorAll(".permission-checkbox").forEach((checkbox) => {
      checkbox.checked = true;
    });
  } else {
    permissionsSection.style.opacity = "1";
    permissionsSection.style.pointerEvents = "auto";
  }
}

/**
 * Handle admin form submission
 */
function handleAdminFormSubmit(e) {
  e.preventDefault();

  const adminData = {
    name: document.getElementById("adminName").value.trim(),
    email: document.getElementById("adminEmail").value.trim(),
    phone: document.getElementById("adminPhone").value.trim(),
    status: document.getElementById("adminStatus").value,
    password: document.getElementById("adminPassword").value,
    passwordConfirm: document.getElementById("adminPasswordConfirm").value,
    issuperadmin: document.getElementById("isSuperAdmin").checked,
  };

  // Get permissions
  const permissions = [];
  document
    .querySelectorAll(".permission-checkbox:checked")
    .forEach((checkbox) => {
      permissions.push(checkbox.value);
    });
  adminData.permissions = permissions;

  // Validate form
  if (!validateAdminForm(adminData)) {
    return;
  }

  // Remove password confirmation from data
  delete adminData.passwordConfirm;

  // Add timestamps
  if (!editingAdminId) {
    adminData.createdAt = new Date().toISOString();
  }
  adminData.lastActivity = new Date().toISOString();

  // Save admin
  saveAdmin(adminData);
}

/**
 * Validate admin form
 */
function validateAdminForm(adminData) {
  // Check required fields
  if (!adminData.name) {
    showAlert("Administrator name is required", "danger");
    return false;
  }

  if (!adminData.email) {
    showAlert("Email is required", "danger");
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(adminData.email)) {
    showAlert("Please enter a valid email address", "danger");
    return false;
  }

  // Check password for new admins
  if (!editingAdminId) {
    if (!adminData.password) {
      showAlert("Password is required", "danger");
      return false;
    }

    if (adminData.password !== adminData.passwordConfirm) {
      showAlert("Passwords do not match", "danger");
      return false;
    }

    if (adminData.password.length < 6) {
      showAlert("Password must be at least 6 characters long", "danger");
      return false;
    }
  }

  // Check for duplicate email (excluding current admin if editing)
  const existingAdmin = filteredAdmins.find(
    (admin) => admin.email === adminData.email && admin.id !== editingAdminId
  );

  if (existingAdmin) {
    showAlert("An administrator with this email already exists", "danger");
    return false;
  }

  return true;
}

/**
 * Save admin data
 */
function saveAdmin(adminData) {
  try {
    let adminId;

    if (editingAdminId) {
      // Update existing admin
      adminId = editingAdminId;
      const existingAdmin = findAdminById(adminId);
      if (existingAdmin) {
        // Preserve creation date and ID
        adminData.createdAt = existingAdmin.createdAt;
        adminData.id = existingAdmin.id;
      }
    } else {
      // Create new admin
      adminId = generateAdminId();
      adminData.id = adminId;
      adminData.createdAt = new Date().toISOString();
      adminData.tabs = [
        { icon: "fa-regular fa-chart-bar", pageName: "Dashboard", fileName: "dashboard" },
        { icon: "fa-solid fa-users", pageName: "customers", fileName: "customers" },
        { icon: "fa-solid fa-store", pageName: "Sellers", fileName: "sellers" },
        { icon: "fa-solid fa-box", pageName: "Products", fileName: "products" },
        { icon: "fa-solid fa-bell-concierge", pageName: "orders", fileName: "orders" },
        // Add other default tabs as needed
      ]
    }

    // Add the required properties
    adminData.lastActivity = new Date().toISOString();
    adminData.role = adminData.issuperadmin ? "superadmin" : "admin";

    // Save to admins data
    adminsData[adminId] = adminData;

    // Save to localStorage
    saveAdminsData();

    // Refresh UI
    loadAdminsData();
    updateAdminsStatistics();
    renderAdminsTable();

    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("adminModal")
    );
    modal.hide();

    // Show success message
    const action = editingAdminId ? "updated" : "created";
    showAlert(
      `Administrator "${adminData.name}" has been ${action} successfully`,
      "success"
    );
  } catch (error) {
    console.error("Error saving administrator:", error);
    showAlert("Error saving administrator. Please try again.", "danger");
  }
}

/**
 * Generate unique admin ID
 */
function generateAdminId() {
  const ids = Object.keys(adminsData).map(Number);
  if (ids.length === 0) return 1;
  return Math.max(...ids) + 1;
}

/**
 * Save admins data to localStorage
 */
function saveAdminsData() {
  try {
    // Update users data with admins
    const storedUsers = localStorage.getItem("users");
    let usersData = storedUsers
      ? JSON.parse(storedUsers)
      : { admins: {}, sellers: {}, customers: {} };

    usersData.admins = adminsData;
    localStorage.setItem("users", JSON.stringify(usersData));
  } catch (error) {
    console.error("Error saving admins data:", error);
    showAlert("Error saving data to storage", "danger");
  }
}
// #endregion === Admin CRUD Operations ===

// #region === Bulk Operations ===
/**
 * Bulk Operations Module
 *
 * Responsibilities:
 * - Handle bulk admin operations
 * - Process multiple admins at once
 */

/**
 * Handle bulk actions
 */
function handleBulkAction(action) {
  if (selectedAdmins.size === 0) {
    showAlert("Please select administrators to perform bulk action", "warning");
    return;
  }

  const selectedAdminsList = Array.from(selectedAdmins);
  let actionText = "";

  switch (action) {
    case "activate":
      actionText = "activate";
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
      `Are you sure you want to ${actionText} ${selectedAdminsList.length} selected administrators?`
    )
  ) {
    processBulkAction(action, selectedAdminsList);
  }
}

/**
 * Process bulk action on selected admins
 */
function processBulkAction(action, adminIds) {
  let successCount = 0;

  adminIds.forEach((adminId) => {
    const admin = findAdminById(adminId);
    if (admin && admin.role !== "superadmin") {
      switch (action) {
        case "activate":
          adminsData[adminId].status = "active";
          successCount++;
          break;
        case "suspend":
          adminsData[adminId].status = "suspended";
          successCount++;
          break;
        case "delete":
          delete adminsData[adminId];
          successCount++;
          break;
      }
    }
  });

  // Save changes
  saveAdminsData();

  // Clear selection
  selectedAdmins.clear();

  // Refresh UI
  loadAdminsData();
  updateAdminsStatistics();
  renderAdminsTable();

  // Close modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("bulkActionsModal")
  );
  if (modal) modal.hide();

  // Show success message
  showAlert(
    `Successfully ${action}d ${successCount} administrators`,
    "success"
  );
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
 * Export admins data
 */
function exportAdmins() {
  try {
    const exportData = filteredAdmins.map((admin) => ({
      ID: admin.id,
      Name: admin.name,
      Email: admin.email,
      Phone: admin.phone,
      Status: admin.status,
      Type: admin.issuperadmin ? "Super Admin" : "Regular Admin",
      Permissions: admin.issuperadmin
        ? "All Permissions"
        : (admin.permissions || []).join(", "),
      "Created Date": formatDate(admin.createdAt),
      "Last Activity": formatDate(admin.lastActivity),
    }));

    const csv = convertToCSV(exportData);
    downloadCSV(csv, "administrators_export.csv");

    showAlert("Administrators data exported successfully", "success");
  } catch (error) {
    console.error("Error exporting administrators:", error);
    showAlert("Error exporting administrators data", "danger");
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
 * Refresh admins data
 */
function refreshAdmins() {
  loadAdminsData();
  updateAdminsStatistics();
  renderAdminsTable();
  showAlert("Administrators data refreshed", "info");
}

/**
 * Setup form validation
 */
function setupFormValidation() {
  // Add real-time validation if needed
  const form = document.getElementById("adminForm");
  const inputs = form.querySelectorAll("input, select");

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

/**
 * Format date and time for display
 */
function formatDateTime(dateString) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Invalid Date";
  }
}
// #endregion === Utility Functions ===
