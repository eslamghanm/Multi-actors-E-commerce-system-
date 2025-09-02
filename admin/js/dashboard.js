// #region === Admin Dashboard Initialization ===
/**
 * Admin Dashboard Initialization Module
 *
 * Responsibilities:
 * - Load required data from local storage
 * - Initialize admin dashboard components
 * - Set up global variables and constants
 */

// Global data variables
const usersData = getLocalData("users");
const productsData = getLocalData("oldProducts");
const ordersData = getLocalData("oldOrders");
const deletedUsersData = getLocalData("deletedUsers");
const currentUserData = getLocalData("userData");

// Chart configuration constants
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const CHART_COLORS = {
  USERS: "rgba(54, 162, 235, 1)",
  SELLERS: "rgba(75, 192, 192, 1)",
  CUSTOMERS: "rgba(255, 159, 64, 1)",
  ADMINS: "rgba(153, 102, 255, 1)",
  PRODUCTS: "rgba(255, 99, 132, 1)",
  ORDERS: "rgba(255, 206, 86, 1)",
  REVENUE: "rgba(75, 192, 192, 1)",
};

// Chart instances
let systemChartInstance = null;
let usersChartInstance = null;

/**
 * Initializes the admin dashboard by:
 * 1. Updating statistics cards
 * 2. Setting up event listeners
 * 3. Loading initial charts
 * 4. Loading recent activity
 */
function initializeAdminDashboard() {
  updateAdminDashboardStats();
  setupAdminChartEventListeners();
  loadAdminInitialCharts();
  loadRecentActivity();
}

// Start the admin dashboard
initializeAdminDashboard();
// #endregion === Admin Dashboard Initialization ===

// #region === Admin Statistics Calculation ===
/**
 * Admin Statistics Calculation Module
 *
 * Responsibilities:
 * - Calculate all admin metrics and KPIs
 * - Process user, product, and order data
 * - Generate trend analysis for admin view
 */

/**
 * Main admin statistics calculation function
 * @returns {Object} Comprehensive admin dashboard statistics
 */
function calculateAdminDashboardStats() {
  // Calculate user statistics
  const totalUsers = calculateTotalUsers();
  const totalSellers = calculateTotalSellers();
  const totalCustomers = calculateTotalCustomers();
  const totalAdmins = calculateTotalAdmins();
  const activeUsers = calculateActiveUsers();

  // Calculate product and order statistics
  const totalProducts = calculateTotalProducts();
  const totalOrders = calculateTotalOrders();
  const totalRevenue = calculateTotalRevenue();
  const pendingOrders = calculatePendingOrders();

  // System health (simulated)
  const systemHealth = calculateSystemHealth();

  return {
    totalUsers,
    totalSellers,
    totalCustomers,
    totalAdmins,
    activeUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    pendingOrders,
    systemHealth,
    trends: calculateAdminTrends(),
  };
}

/**
 * Calculate total users across all roles
 * @returns {number} Total number of users
 */
function calculateTotalUsers() {
  if (!usersData) return 0;

  let total = 0;
  if (usersData.admins) total += Object.keys(usersData.admins).length;
  if (usersData.sellers) total += Object.keys(usersData.sellers).length;
  if (usersData.customers) total += Object.keys(usersData.customers).length;

  return total;
}

/**
 * Calculate total sellers
 * @returns {number} Total number of sellers
 */
function calculateTotalSellers() {
  return usersData?.sellers ? Object.keys(usersData.sellers).length : 0;
}

/**
 * Calculate total customers
 * @returns {number} Total number of customers
 */
function calculateTotalCustomers() {
  return usersData?.customers ? Object.keys(usersData.customers).length : 0;
}

/**
 * Calculate total admins
 * @returns {number} Total number of admins
 */
function calculateTotalAdmins() {
  return usersData?.admins ? Object.keys(usersData.admins).length : 0;
}

/**
 * Calculate active users (users with status 'active')
 * @returns {number} Number of active users
 */
function calculateActiveUsers() {
  if (!usersData) return 0;

  let activeCount = 0;

  // Count active admins
  if (usersData.admins) {
    activeCount += Object.values(usersData.admins).filter(
      (user) => user.status === "active"
    ).length;
  }

  // Count active sellers
  if (usersData.sellers) {
    activeCount += Object.values(usersData.sellers).filter(
      (user) => user.status === "active"
    ).length;
  }

  // Count active customers
  if (usersData.customers) {
    activeCount += Object.values(usersData.customers).filter(
      (user) => user.status === "active"
    ).length;
  }

  return activeCount;
}

/**
 * Calculate total products across all sellers
 * @returns {number} Total number of products
 */
function calculateTotalProducts() {
  if (!productsData) return 0;

  let total = 0;
  Object.values(productsData).forEach((sellerProducts) => {
    if (typeof sellerProducts === "object") {
      total += Object.keys(sellerProducts).length;
    }
  });

  return total;
}

/**
 * Calculate total orders across all sellers
 * @returns {number} Total number of orders
 */
function calculateTotalOrders() {
  return ordersData ? Object.keys(ordersData).length : 0;
}

/**
 * Calculate total revenue from all orders
 * @returns {number} Total revenue amount
 */
function calculateTotalRevenue() {
  if (!ordersData) return 0;

  return Object.values(ordersData).reduce((total, order) => {
    if (order && typeof order.totalPrice === "number") {
      return total + order.totalPrice;
    }
    return total;
  }, 0);
}

/**
 * Calculate pending orders
 * @returns {number} Number of pending orders
 */
function calculatePendingOrders() {
  if (!ordersData) return 0;

  return Object.values(ordersData).filter(
    (order) =>
      order && (order.status === "Pending" || order.status === "Processing")
  ).length;
}

/**
 * Calculate system health (simulated metric)
 * @returns {string} System health percentage
 */
function calculateSystemHealth() {
  // Simulate system health based on various factors
  const baseHealth = 95;
  const userFactor = Math.min(calculateTotalUsers() / 100, 1) * 2;
  const orderFactor = Math.min(calculateTotalOrders() / 500, 1) * 1.5;

  const health = Math.min(baseHealth + userFactor + orderFactor, 100);
  return health.toFixed(1) + "%";
}

/**
 * Updates admin dashboard statistics cards
 */
function updateAdminDashboardStats() {
  try {
    const stats = calculateAdminDashboardStats();
    renderAdminDashboardStats(stats);
  } catch (error) {
    showError("Failed to update admin dashboard stats: " + error.message);
  }
}
// #endregion === Admin Statistics Calculation ===

// #region === Admin Trend Calculations ===
/**
 * Admin Trend Calculations Module
 *
 * Responsibilities:
 * - Calculate business trends for admin view
 * - Generate trend indicators
 */

/**
 * Calculates all admin business trends
 * @returns {Object} All admin trend indicators
 */
function calculateAdminTrends() {
  return {
    users: calculateUsersTrend(),
    sellers: calculateSellersTrend(),
    customers: calculateCustomersTrend(),
    products: calculateProductsTrend(),
    orders: calculateOrdersTrend(),
    revenue: calculateRevenueTrend(),
    activeUsers: calculateActiveUsersTrend(),
    pendingOrders: calculatePendingOrdersTrend(),
  };
}

/**
 * Calculate users trend (simulated)
 * @returns {Object} Trend value and direction
 */
function calculateUsersTrend() {
  const value = Math.random() * 15 + 5; // 5-20% growth
  return {
    value: Math.round(value),
    isPositive: true,
  };
}

/**
 * Calculate sellers trend (simulated)
 * @returns {Object} Trend value and direction
 */
function calculateSellersTrend() {
  const value = Math.random() * 12 + 3; // 3-15% growth
  return {
    value: Math.round(value),
    isPositive: Math.random() > 0.2,
  };
}

/**
 * Calculate customers trend (simulated)
 * @returns {Object} Trend value and direction
 */
function calculateCustomersTrend() {
  const value = Math.random() * 18 + 7; // 7-25% growth
  return {
    value: Math.round(value),
    isPositive: Math.random() > 0.15,
  };
}

/**
 * Calculate products trend (simulated)
 * @returns {Object} Trend value and direction
 */
function calculateProductsTrend() {
  const value = Math.random() * 10 + 2; // 2-12% growth
  return {
    value: Math.round(value),
    isPositive: Math.random() > 0.25,
  };
}

/**
 * Calculate orders trend (simulated)
 * @returns {Object} Trend value and direction
 */
function calculateOrdersTrend() {
  const value = Math.random() * 20 + 5; // 5-25% growth
  return {
    value: Math.round(value),
    isPositive: Math.random() > 0.3,
  };
}

/**
 * Calculate revenue trend (simulated)
 * @returns {Object} Trend value and direction
 */
function calculateRevenueTrend() {
  const value = Math.random() * 15 + 8; // 8-23% growth
  return {
    value: Math.round(value),
    isPositive: Math.random() > 0.2,
  };
}

/**
 * Calculate active users trend (simulated)
 * @returns {Object} Trend value and direction
 */
function calculateActiveUsersTrend() {
  const value = Math.random() * 8 + 2; // 2-10% growth
  return {
    value: Math.round(value),
    isPositive: Math.random() > 0.1,
  };
}

/**
 * Calculate pending orders trend (simulated)
 * @returns {Object} Trend value and direction
 */
function calculatePendingOrdersTrend() {
  const value = Math.random() * 25 + 5; // 5-30% change
  return {
    value: Math.round(value),
    isPositive: Math.random() > 0.6, // More likely to be negative (good for pending orders)
  };
}
// #endregion === Admin Trend Calculations ===

// #region === Admin UI Rendering ===
/**
 * Admin UI Rendering Module
 *
 * Responsibilities:
 * - Update admin dashboard UI elements
 * - Format display values
 */

/**
 * Updates all admin dashboard statistics cards
 * @param {Object} stats - Statistics data
 */
function renderAdminDashboardStats(stats) {
  // Update stat cards
  updateStatCard("totalUsers", stats.totalUsers);
  updateStatCard("totalSellers", stats.totalSellers);
  updateStatCard("totalCustomers", stats.totalCustomers);
  updateStatCard("totalAdmins", stats.totalAdmins);
  updateStatCard("totalProducts", stats.totalProducts);
  updateStatCard("totalOrders", stats.totalOrders);
  updateStatCard("totalRevenue", formatCurrency(stats.totalRevenue));
  updateStatCard("activeUsers", stats.activeUsers);
  updateStatCard("pendingOrders", stats.pendingOrders);
  updateStatCard("systemHealth", stats.systemHealth);

  // Update trend badges
  updateTrendBadge("usersTrend", stats.trends.users);
  updateTrendBadge("sellersTrend", stats.trends.sellers);
  updateTrendBadge("customersTrend", stats.trends.customers);
  updateTrendBadge("productsTrend", stats.trends.products);
  updateTrendBadge("ordersTrend", stats.trends.orders);
  updateTrendBadge("revenueTrend", stats.trends.revenue);
  updateTrendBadge("activeUsersTrend", stats.trends.activeUsers);
  updateTrendBadge("pendingOrdersTrend", stats.trends.pendingOrders);
}

/**
 * Updates a single statistic card
 * @param {string} elementId - DOM element ID
 * @param {string} value - Value to display
 */
function updateStatCard(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = value;
}

/**
 * Updates a trend indicator badge
 * @param {string} elementId - DOM element ID
 * @param {Object} trend - Trend data
 */
function updateTrendBadge(elementId, trend) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = `${trend.isPositive ? "+" : "-"}${trend.value}%`;
    element.className = `badge bg-${trend.isPositive ? "success" : "danger"}`;
  }
}

/**
 * Formats currency value
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  return (
    "$" +
    parseFloat(value || 0)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
}
// #endregion === Admin UI Rendering ===

// #region === Admin Charts Management ===
/**
 * Admin Charts Management Module
 *
 * Responsibilities:
 * - Manage admin chart instances
 * - Prepare admin chart data
 * - Handle admin chart rendering
 */

/**
 * Sets up admin chart event listeners
 */
function setupAdminChartEventListeners() {
  const periodSelect = document.getElementById("systemPeriod");
  if (periodSelect) {
    periodSelect.addEventListener("change", function () {
      updateSystemChart(this.value);
    });
  }
}

/**
 * Loads initial admin charts
 */
function loadAdminInitialCharts() {
  updateSystemChart("month");
  updateUsersDistributionChart();
}

/**
 * Updates system overview chart
 * @param {string} period - Time period ('month' or 'year')
 */
function updateSystemChart(period) {
  const { labels, usersData, sellersData, customersData, ordersData } =
    prepareSystemChartData(period);

  // Destroy previous chart instance if exists
  if (systemChartInstance) systemChartInstance.destroy();

  // Create new chart
  systemChartInstance = new Chart(document.getElementById("systemChart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Total Users",
          data: usersData,
          borderColor: CHART_COLORS.USERS,
          backgroundColor: CHART_COLORS.USERS.replace("1)", "0.2)"),
          tension: 0.1,
          fill: false,
        },
        {
          label: "Sellers",
          data: sellersData,
          borderColor: CHART_COLORS.SELLERS,
          backgroundColor: CHART_COLORS.SELLERS.replace("1)", "0.2)"),
          tension: 0.1,
          fill: false,
        },
        {
          label: "Customers",
          data: customersData,
          borderColor: CHART_COLORS.CUSTOMERS,
          backgroundColor: CHART_COLORS.CUSTOMERS.replace("1)", "0.2)"),
          tension: 0.1,
          fill: false,
        },
        {
          label: "Orders",
          data: ordersData,
          borderColor: CHART_COLORS.ORDERS,
          backgroundColor: CHART_COLORS.ORDERS.replace("1)", "0.2)"),
          tension: 0.1,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
        x: {
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
      },
    },
  });
}

/**
 * Updates users distribution pie chart
 */
function updateUsersDistributionChart() {
  const stats = calculateAdminDashboardStats();

  // Destroy previous chart instance if exists
  if (usersChartInstance) usersChartInstance.destroy();

  // Create new chart
  usersChartInstance = new Chart(document.getElementById("usersChart"), {
    type: "doughnut",
    data: {
      labels: ["Customers", "Sellers", "Admins"],
      datasets: [
        {
          data: [stats.totalCustomers, stats.totalSellers, stats.totalAdmins],
          backgroundColor: [
            CHART_COLORS.CUSTOMERS,
            CHART_COLORS.SELLERS,
            CHART_COLORS.ADMINS,
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
      },
    },
  });
}

/**
 * Prepares system chart data based on period
 * @param {string} period - Time period
 * @returns {Object} Chart data
 */
function prepareSystemChartData(period) {
  let labels, usersData, sellersData, customersData, ordersData;

  if (period === "month") {
    // Generate monthly data for current year
    labels = MONTH_NAMES;
    usersData = generateMonthlyData(calculateTotalUsers(), 12);
    sellersData = generateMonthlyData(calculateTotalSellers(), 12);
    customersData = generateMonthlyData(calculateTotalCustomers(), 12);
    ordersData = generateMonthlyData(calculateTotalOrders(), 12);
  } else {
    // Generate yearly data for last 5 years
    const currentYear = new Date().getFullYear();
    labels = Array.from({ length: 5 }, (_, i) =>
      (currentYear - 4 + i).toString()
    );
    usersData = generateYearlyData(calculateTotalUsers(), 5);
    sellersData = generateYearlyData(calculateTotalSellers(), 5);
    customersData = generateYearlyData(calculateTotalCustomers(), 5);
    ordersData = generateYearlyData(calculateTotalOrders(), 5);
  }

  return { labels, usersData, sellersData, customersData, ordersData };
}

/**
 * Generates simulated monthly data
 * @param {number} total - Total value
 * @param {number} months - Number of months
 * @returns {Array} Monthly data array
 */
function generateMonthlyData(total, months) {
  const data = [];
  let accumulated = 0;

  for (let i = 0; i < months; i++) {
    const monthlyGrowth =
      Math.random() * (total / months) * 0.3 + (total / months) * 0.7;
    accumulated += monthlyGrowth;
    data.push(Math.round(accumulated));
  }

  return data;
}

/**
 * Generates simulated yearly data
 * @param {number} total - Total value
 * @param {number} years - Number of years
 * @returns {Array} Yearly data array
 */
function generateYearlyData(total, years) {
  const data = [];
  let accumulated = total * 0.3; // Start with 30% of current total

  for (let i = 0; i < years; i++) {
    const yearlyGrowth = Math.random() * (total * 0.2) + total * 0.1;
    accumulated += yearlyGrowth;
    data.push(Math.round(accumulated));
  }

  return data;
}
// #endregion === Admin Charts Management ===

// #region === Recent Activity Management ===
/**
 * Recent Activity Management Module
 *
 * Responsibilities:
 * - Load and display recent system activity
 * - Generate activity data from user actions
 */

/**
 * Loads recent activity data
 */
function loadRecentActivity() {
  const activities = generateRecentActivities();
  renderRecentActivities(activities);
}

/**
 * Generates simulated recent activities
 * @returns {Array} Array of activity objects
 */
function generateRecentActivities() {
  const activities = [];
  const activityTypes = [
    { action: "User Registration", status: "success" },
    { action: "Product Added", status: "info" },
    { action: "Order Placed", status: "warning" },
    { action: "Payment Processed", status: "success" },
    { action: "User Login", status: "info" },
    { action: "Product Updated", status: "info" },
    { action: "Order Cancelled", status: "danger" },
    { action: "Seller Approved", status: "success" },
  ];

  const users = [];
  if (usersData) {
    if (usersData.customers) users.push(...Object.values(usersData.customers));
    if (usersData.sellers) users.push(...Object.values(usersData.sellers));
    if (usersData.admins) users.push(...Object.values(usersData.admins));
  }

  // Generate 10 recent activities
  for (let i = 0; i < 10; i++) {
    const activity =
      activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const user =
      users.length > 0 ? users[Math.floor(Math.random() * users.length)] : null;
    const timeAgo = Math.floor(Math.random() * 120) + 1; // 1-120 minutes ago

    activities.push({
      time: `${timeAgo} min ago`,
      user: user ? user.name : "System User",
      action: activity.action,
      status: activity.status,
    });
  }

  return activities;
}

/**
 * Renders recent activities in the table
 * @param {Array} activities - Array of activity objects
 */
function renderRecentActivities(activities) {
  const tableBody = document.getElementById("recentActivityTable");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  activities.forEach((activity) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${activity.time}</td>
            <td>${activity.user}</td>
            <td>${activity.action}</td>
            <td><span class="status-badge status-${activity.status}">${activity.status}</span></td>
        `;
    tableBody.appendChild(row);
  });
}
// #endregion === Recent Activity Management ===

// #region === Utility Functions ===
/**
 * Utility Functions Module
 *
 * Responsibilities:
 * - Provide common utility functions
 * - Handle data retrieval and formatting
 */

/**
 * Gets data from localStorage
 * @param {string} key - Storage key
 * @returns {Object|null} Parsed data or null
 */
function getLocalData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(
      `Error getting data from localStorage for key ${key}:`,
      error
    );
    return null;
  }
}

/**
 * Shows error message
 * @param {string} message - Error message
 */
function showError(message) {
  console.error(message);
  // You can implement a toast notification system here
}
// #endregion === Utility Functions ===
