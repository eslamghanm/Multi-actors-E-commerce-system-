// #region //zone === Users Management Initialization ===

// Initialize users management system
let usersData = {};
let filteredUsers = [];
let currentPage = 1;
let usersPerPage = 10;
let currentSort = { field: "name", direction: "asc" };
let selectedUsers = new Set();
let editingUserId = null;

// Initialize the users management system
initializeUsersManagement();

// Main initialization function
function initializeUsersManagement() {
  loadUsersData();
  setupEventListeners();
  updateUsersStatistics();
  renderUsersTable();
  setupFormValidation();
}

// Load users data from localStorage
function loadUsersData() {
  try {
    usersData = getLocalData("users");
    // تحميل بيانات المستخدمين المحذوفين
    deletedUsers = getLocalData("deletedUsers") || {};
    // Process and flatten users data for easier management
    processUsersData();
  } catch (error) {
    console.error("Error loading users data:", error);
    showToastMessage("Error loading users data", "danger");
    usersData = { customers: {} };
    deletedUsers = {};
  }
}

// Process users data into a flat array for easier manipulation
function processUsersData() {
  filteredUsers = [];

  // Process customers only
  if (usersData.customers) {
    Object.entries(usersData.customers).forEach(([id, user]) => {
      filteredUsers.push({
        id: id,
        role: "customer",
        ...user,
      });
    });
  }

  // Process deleted customers from deletedUsers
  if (deletedUsers) {
    Object.entries(deletedUsers).forEach(([key, user]) => {
      // إضافة فقط العملاء المحذوفين (role = customer)
      if (user.role === "customer") {
        filteredUsers.push({
          id: key, // استخدام المفتاح الذي يحتوي على البادئة "del_"
          role: "customer",
          ...user,
        });
      }
    });
  }
}
// #endregion

// #region //zone === Event Listeners Setup ===
// Set up all event listeners
function setupEventListeners() {
  // Add user button
  document
    .getElementById("addUserBtn")
    .addEventListener("click", openAddUserModal);

  // Search and filter controls
  document
    .getElementById("searchInput")
    .addEventListener("input", debounce(handleSearch, 300));
  document
    .getElementById("statusFilter")
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
    .getElementById("selectAllUsers")
    .addEventListener("change", handleSelectAll);
  document
    .getElementById("refreshUsersBtn")
    .addEventListener("click", refreshUsers);

  // User form
  document
    .getElementById("userForm")
    .addEventListener("submit", handleUserFormSubmit);

  // Bulk actions
  document
    .getElementById("bulkActivateBtn")
    .addEventListener("click", () => handleBulkAction("activate"));
  document
    .getElementById("bulkDeactivateBtn")
    .addEventListener("click", () => handleBulkAction("deactivate"));
  document
    .getElementById("bulkDeleteBtn")
    .addEventListener("click", () => handleBulkAction("delete"));

  // Add event delegation for action buttons
  document
    .getElementById("usersTableBody")
    .addEventListener("click", function (e) {
      const row = e.target.closest("tr");
      if (!row) return;

      const userId = row.getAttribute("data-user-id");
      if (!userId) return;

      if (e.target.closest(".btn-view")) {
        viewUser(userId);
      } else if (e.target.closest(".btn-edit")) {
        editUser(userId);
      } else if (e.target.closest(".btn-delete")) {
        deleteUser(userId);
      }
    });
}

// Debounce function to limit API calls
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
// #endregion

// #region //zone === Statistics and UI Updates ===
// Update users statistics cards
function updateUsersStatistics() {
  const stats = calculateUsersStatistics();

  document.getElementById("totalUsersCount").textContent = stats.total;
  document.getElementById("activeUsersCount").textContent = stats.active;
  document.getElementById("inactiveUsersCount").textContent = stats.inactive;
  document.getElementById("deletedUsersCount").textContent = stats.deleted;
}

// Calculate users statistics
function calculateUsersStatistics() {
  const stats = {
    total: filteredUsers.length,
    active: 0,
    inactive: 0,
    deleted: 0,
  };

  filteredUsers.forEach((user) => {
    switch (user.status) {
      case "active":
        stats.active++;
        break;
      case "inactive":
      case "suspended":
        stats.inactive++;
        break;
      case "deleted":
        stats.deleted++;
        break;
      default:
        stats.active++;
    }
  });

  return stats;
}

// Update pagination info
function updatePaginationInfo() {
  const totalUsers = filteredUsers.length;
  const startIndex = (currentPage - 1) * usersPerPage + 1;
  const endIndex = Math.min(currentPage * usersPerPage, totalUsers);

  document.getElementById("showingStart").textContent =
    totalUsers > 0 ? startIndex : 0;
  document.getElementById("showingEnd").textContent = endIndex;
  document.getElementById("totalUsers").textContent = totalUsers;
}
// #endregion

// #region //zone === Search and Filter Functions ===
// Handle search input
function handleSearch() {
  applyFilters();
}

// Handle filter changes
function handleFilter() {
  applyFilters();
}

// Handle sort changes
function handleSort() {
  const sortBy = document.getElementById("sortBy").value;
  currentSort.field = sortBy;
  applyFilters();
}

// Apply all filters and search
function applyFilters() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;

  // Start with all customers
  processUsersData();

  // Apply search filter
  if (searchTerm) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        String(user.id)?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply status filter
  if (statusFilter) {
    filteredUsers = filteredUsers.filter(
      (user) => user.status === statusFilter
    );
  }

  // Apply sorting
  sortUsers();

  // Reset to first page
  currentPage = 1;

  // Update UI
  updateUsersStatistics();
  renderUsersTable();
}

// Clear all filters
function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("statusFilter").value = "";
  document.getElementById("sortBy").value = "name";

  currentSort = { field: "name", direction: "asc" };
  applyFilters();
}

// Sort users based on current sort criteria
function sortUsers() {
  filteredUsers.sort((a, b) => {
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
// #endregion

// #region //zone === Table Rendering ===
// Render the users table
function renderUsersTable() {
  const tableBody = document.getElementById("usersTableBody");
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const pageUsers = filteredUsers.slice(startIndex, endIndex);

  if (pageUsers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4">
          <div class="text-muted">
            <i class="fa-solid fa-users fa-3x mb-3"></i>
            <p class="mb-0">No customers found</p>
          </div>
        </td>
      </tr>
    `;
  } else {
    tableBody.innerHTML = pageUsers.map((user) => createUserRow(user)).join("");
  }

  updatePaginationInfo();
  renderPagination();
  updateSelectAllCheckbox();
}

// Create a table row for a user
function createUserRow(user) {
  const avatar = user.name ? user.name.charAt(0).toUpperCase() : "U";
  const statusClass = getStatusClass(user.status);
  const roleClass = getRoleClass(user.role);

  return `
    <tr data-user-id="${user.id}">
      <td data-label="Select">
        <input type="checkbox" class="form-check-input user-checkbox" 
          value="${user.id}" ${selectedUsers.has(user.id) ? "checked" : ""}>
      </td>
      <td data-label="User">
        <div class="user-info">
          <div class="user-avatar">${avatar}</div>
          <div class="user-details">
            <h6 class="mb-0">${user.name || "Unknown"}</h6>
            <small class="text-muted">${user.email || "No email"}</small>
          </div>
        </div>
      </td>
      <td data-label="Role">
        <span class="role-badge role-${user.role}">${user.role}</span>
      </td>
      <td data-label="Status">
        <span class="status-badge status-${statusClass}">${
    user.status || "active"
  }</span>
      </td>
      <td data-label="Created Date">
        <small class="text-muted">${formatDate(user.createdAt)}</small>
      </td>
      <td data-label="Last Activity">
        <small class="text-muted">${formatDate(user.lastActivity)}</small>
      </td>
      <td data-label="Actions">
        <div class="action-buttons">
          <button class="action-btn btn-view" title="View Details">
            <i class="fa-solid fa-eye"></i>
          
          <button class="action-btn btn-delete" title="Delete User">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

// Get CSS class for user status
function getStatusClass(status) {
  switch (status) {
    case "active":
      return "active";
    case "inactive":
      return "inactive";
    case "suspended":
      return "suspended";
    case "deleted":
      return "deleted";
    default:
      return "active";
  }
}

// Get CSS class for user role
function getRoleClass(role) {
  switch (role) {
    case "admin":
      return "admin";
    case "seller":
      return "seller";
    case "customer":
      return "customer";
    default:
      return "customer";
  }
}

// Format date for display
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

// Render pagination controls
function renderPagination() {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const pagination = document.getElementById("usersPagination");

  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }

  let paginationHTML = "";

  // Previous button
  paginationHTML += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
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
      <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </a>
    </li>
  `;

  pagination.innerHTML = paginationHTML;
}

// Change current page
function changePage(page) {
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderUsersTable();
  }
}
// #endregion

// #region //zone === User Selection Management ===
// Handle select all checkbox
function handleSelectAll() {
  const selectAllCheckbox = document.getElementById("selectAllUsers");
  const userCheckboxes = document.querySelectorAll(".user-checkbox");

  if (selectAllCheckbox.checked) {
    userCheckboxes.forEach((checkbox) => {
      checkbox.checked = true;
      selectedUsers.add(checkbox.value);
    });
  } else {
    userCheckboxes.forEach((checkbox) => {
      checkbox.checked = false;
      selectedUsers.delete(checkbox.value);
    });
  }

  updateBulkActionsButton();
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById("selectAllUsers");
  const userCheckboxes = document.querySelectorAll(".user-checkbox");
  const checkedCheckboxes = document.querySelectorAll(".user-checkbox:checked");

  if (userCheckboxes.length === 0) {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = false;
  } else if (checkedCheckboxes.length === userCheckboxes.length) {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = true;
  } else if (checkedCheckboxes.length > 0) {
    selectAllCheckbox.indeterminate = true;
    selectAllCheckbox.checked = false;
  } else {
    selectAllCheckbox.indeterminate = false;
    selectAllCheckbox.checked = false;
  }

  // Update selected users set
  selectedUsers.clear();
  checkedCheckboxes.forEach((checkbox) => {
    selectedUsers.add(checkbox.value);
  });

  updateBulkActionsButton();
}

// Update bulk actions button visibility
function updateBulkActionsButton() {
  const selectedCount = selectedUsers.size;
  document.getElementById("selectedUsersCount").textContent = selectedCount;
}

// Add event listener for individual checkboxes
document.addEventListener("change", function (e) {
  if (e.target.classList.contains("user-checkbox")) {
    updateSelectAllCheckbox();
  }
});
// #endregion

// #region //zone === User CRUD Operations ===
// Open add user modal
// في دالة openAddUserModal
function openAddUserModal() {
  editingUserId = null;
  document.getElementById("userModalTitle").textContent = "Add New Customer";
  document.getElementById("saveUserBtn").textContent = "Save Customer";

  // Reset form
  document.getElementById("userForm").reset();

  // Set role to customer and hide role field - التصحيح هنا
  document.getElementById("userRole").value = "customer";
  
  // البحث عن التسمية بطريقة صحيحة
  const roleLabel = document.querySelector('label[for="userRole"]');
  if (roleLabel) {
    roleLabel.style.display = "none";
  }
  
  const roleSelect = document.getElementById("userRole");
  if (roleSelect) {
    roleSelect.style.display = "none";
  }

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("userModal"));
  modal.show();
}

// Edit user
function editUser(userId) {
  const user = findUserById(userId);
  if (!user) {
    showToastMessage("User not found", "danger");
    return;
  }

  editingUserId = userId;
  document.getElementById("userModalTitle").textContent = "Edit Customer";
  document.getElementById("saveUserBtn").textContent = "Update Customer";

  // Populate form
  document.getElementById("userName").value = user.name || "";
  document.getElementById("userEmail").value = user.email || "";
  document.getElementById("userRole").value = user.role || "";
  document.getElementById("userStatus").value = user.status || "active";

  // Hide role field for customers - التصحيح هنا
  const roleLabel = document.querySelector('label[for="userRole"]');
  if (roleLabel) {
    roleLabel.style.display = "none";
  }

  const roleSelect = document.getElementById("userRole");
  if (roleSelect) {
    roleSelect.style.display = "none";
  }

  // Show modal
  const modal = new bootstrap.Modal(document.getElementById("userModal"));
  modal.show();
}

// View user details
function viewUser(userId) {
  const user = findUserById(userId);
  if (!user) {
    showToastMessage("User not found", "danger");
    return;
  }
  const city = user.address.city || "N/A";
  const street = user.address.street || "N/A";
  const zipCode = user.address.zipCode || "N/A";
  const userDetailsContent = document.getElementById("userDetailsContent");
  userDetailsContent.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h6>Basic Information</h6>
        <table class="table table-sm">
          <tr><td><strong>Name:</strong></td><td>${user.name || "N/A"}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${
            user.email || "N/A"
          }</td></tr>
          <tr><td><strong>Role:</strong></td><td><span class="role-badge role-${
            user.role
          }">${user.role}</span></td></tr>
          <tr><td><strong>Status:</strong></td><td><span class="status-badge status-${getStatusClass(
            user.status
          )}">${user.status || "active"}</span></td></tr>
          <tr><td><strong>Created:</strong></td><td>${formatDate(
            user.createdAt
          )}</td></tr>
          <tr><td><strong>Last Activity:</strong></td><td>${formatDate(
            user.lastActivity
          )}</td></tr>
          <tr><td><strong>city:</strong></td><td>${city}</td></tr>
          <tr><td><strong>street:</strong></td><td>${street}</td></tr>
          <tr><td><strong>zipCode:</strong></td><td>${zipCode}</td></tr>
        </table>
      </div>
    </div>
  `;

  const modal = new bootstrap.Modal(
    document.getElementById("userDetailsModal")
  );
  modal.show();
}

// Delete user
function deleteUser(userId) {
  const user = findUserById(userId);
  if (!user) {
    showToastMessage("User not found", "danger");
    return;
  }

  if (
    confirm(
      `Are you sure you want to delete customer "${user.name}"? This action cannot be undone.`
    )
  ) {
    try {
      // إنشاء المعرف الجديد مع البادئة "del_"
      const deletedUserId = "del_" + userId;

      // نقل المستخدم إلى deletedUsers مع المعرف الجديد
      deletedUsers[deletedUserId] = {
        ...usersData.customers[userId],
        id: userId, // الاحتفاظ بالمعرف الأصلي داخل البيانات
        status: "deleted",
        deletedAt: new Date().toISOString(),
      };

      // حفظ deletedUsers في localStorage
      setLocalData("deletedUsers", deletedUsers);

      // Remove user from customers
      delete usersData.customers[userId];

      // Save to localStorage
      saveUsersData();

      // Refresh UI
      loadUsersData();
      updateUsersStatistics();
      renderUsersTable();

      showToastMessage(
        `Customer "${user.name}" has been moved to deleted users`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting user:", error);
      showToastMessage("Error deleting customer", "danger");
    }
  }
}

// Find user by ID
function findUserById(userId) {
  // البحث في العملاء النشطين
  if (usersData.customers && usersData.customers[userId]) {
    return {
      id: userId,
      role: "customer",
      ...usersData.customers[userId],
    };
  }

  // البحث في العملاء المحذوفين (بالبادئة "del_")
  const deletedUserId = "del_" + userId;
  if (deletedUsers && deletedUsers[deletedUserId]) {
    return {
      id: deletedUserId,
      role: "customer",
      ...deletedUsers[deletedUserId],
    };
  }

  // البحث المباشر في deletedUsers (للمفاتيح التي تحتوي على البادئة)
  if (deletedUsers && deletedUsers[userId]) {
    return {
      id: userId,
      role: "customer",
      ...deletedUsers[userId],
    };
  }

  return null;
}

// Handle user form submission
function handleUserFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const userData = {
    name: document.getElementById("userName").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    role: "customer", // Always set to customer
    status: document.getElementById("userStatus").value,
    password: document.getElementById("userPassword").value,
    passwordConfirm: document.getElementById("userPasswordConfirm").value,
  };

  // Validate form
  if (!validateUserForm(userData)) {
    return;
  }

  // Remove password confirmation from data
  delete userData.passwordConfirm;

  // Add timestamps
  if (!editingUserId) {
    userData.createdAt = new Date().toISOString();
  }
  userData.lastActivity = new Date().toISOString();

  // Save user
  saveUser(userData);
}

// Validate user form
function validateUserForm(userData) {
  // Check required fields
  if (!userData.name) {
    showToastMessage("Name is required", "danger");
    return false;
  }

  if (!userData.email) {
    showToastMessage("Email is required", "danger");
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    showToastMessage("Please enter a valid email address", "danger");
    return false;
  }

  // Check password for new users
  if (!editingUserId) {
    if (!userData.password) {
      showToastMessage("Password is required", "danger");
      return false;
    }

    if (userData.password !== userData.passwordConfirm) {
      showToastMessage("Passwords do not match", "danger");
      return false;
    }

    if (userData.password.length < 6) {
      showToastMessage("Password must be at least 6 characters long", "danger");
      return false;
    }
  }

  // Check for duplicate email (excluding current user if editing)
  const existingUser = filteredUsers.find(
    (user) => user.email === userData.email && user.id !== editingUserId
  );

  if (existingUser) {
    showToastMessage("A customer with this email already exists", "danger");
    return false;
  }

  return true;
}

// Save user data
function saveUser(userData) {
  try {
    let userId;

    if (editingUserId) {
      // Update existing user
      userId = editingUserId;
      const existingUser = findUserById(userId);
      if (existingUser) {
        // Preserve creation date
        userData.createdAt = existingUser.createdAt;
      }
    } else {
      // Create new user
      userId = generateUserId();
    }

    // Save to customers collection
    if (!usersData.customers) {
      usersData.customers = {};
    }

    usersData.customers[userId] = userData;

    // Save to localStorage
    saveUsersData();

    // Refresh UI
    loadUsersData();
    updateUsersStatistics();
    renderUsersTable();

    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("userModal")
    );
    modal.hide();

    // Show success message
    const action = editingUserId ? "updated" : "created";
    showToastMessage(
      `Customer "${userData.name}" has been ${action} successfully`,
      "success"
    );
  } catch (error) {
    console.error("Error saving user:", error);
    showToastMessage("Error saving customer. Please try again.", "danger");
  }
}

// Generate unique user ID
function generateUserId() {
  return (
    "customer_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
  );
}

// Save users data to localStorage
function saveUsersData() {
  try {
    setLocalData("users", usersData);
  } catch (error) {
    console.error("Error saving users data:", error);
    showToastMessage("Error saving data to storage", "danger");
  }
}
// #endregion

// #region //zone === Bulk Operations ===
// Handle bulk actions
function handleBulkAction(action) {
  if (selectedUsers.size === 0) {
    showToastMessage(
      "Please select customers to perform bulk action",
      "warning"
    );
    return;
  }

  const selectedUsersList = Array.from(selectedUsers);
  let actionText = "";

  switch (action) {
    case "activate":
      actionText = "activate";
      break;
    case "deactivate":
      actionText = "deactivate";
      break;
    case "delete":
      actionText = "delete";
      break;
  }

  if (
    confirm(
      `Are you sure you want to ${actionText} ${selectedUsersList.length} selected customers?`
    )
  ) {
    processBulkAction(action, selectedUsersList);
  }
}

// Process bulk action on selected users
function processBulkAction(action, userIds) {
  let successCount = 0;

  userIds.forEach((userId) => {
    const user = findUserById(userId);
    if (user) {
      switch (action) {
        case "activate":
          usersData.customers[userId].status = "active";
          successCount++;
          break;
        case "deactivate":
          usersData.customers[userId].status = "inactive";
          successCount++;
          break;
        case "delete":
          // إنشاء المعرف الجديد مع البادئة "del_"
          const deletedUserId = "del_" + userId;

          // نقل المستخدم إلى deletedUsers
          deletedUsers[deletedUserId] = {
            ...usersData.customers[userId],
            id: userId, // الاحتفاظ بالمعرف الأصلي داخل البيانات
            status: "deleted",
            deletedAt: new Date().toISOString(),
          };

          // حفظ deletedUsers في localStorage
          setLocalData("deletedUsers", deletedUsers);

          delete usersData.customers[userId];
          successCount++;
          break;
      }
    }
  });

  // Save changes
  saveUsersData();

  // Clear selection
  selectedUsers.clear();

  // Refresh UI
  loadUsersData();
  updateUsersStatistics();
  renderUsersTable();

  // Show success message
  showToastMessage(
    `Successfully ${action}d ${successCount} customers`,
    "success"
  );
}
// #endregion

// #region //zone === Utility Functions ===
// Show alert message (renamed to avoid conflict with global showToast)
function showToastMessage(message, type = "info") {
  // استخدام دالة showToast العالمية إذا كانت متوفرة
  if (typeof window.showToast === "function") {
    window.showToast(message, type);
  } else {
    // Fallback إذا لم تكن الدالة متوفرة
    alert(`${type.toUpperCase()}: ${message}`);
  }
}

// Get data from localStorage
function getLocalData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting data from localStorage:", error);
    return null;
  }
}

// Set data to localStorage
function setLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Error saving data to localStorage:", error);
    showToastMessage("Error saving data to storage", "danger");
    return false;
  }
}

// Refresh users data
function refreshUsers() {
  loadUsersData();
  updateUsersStatistics();
  renderUsersTable();
  showToastMessage("Customers data refreshed", "info");
}

// Setup form validation
function setupFormValidation() {
  // Add real-time validation if needed
  const form = document.getElementById("userForm");
  const inputs = form.querySelectorAll("input, select");

  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this);
    });
  });
}

// Validate individual form field
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
// #endregion

// #endregion //zone === Users Management Initialization ===
