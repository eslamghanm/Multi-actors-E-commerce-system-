// Global data variables
const productsData = getLocalData("oldProducts");
const ordersData = getLocalData("oldOrders");
const currentUserData = getLocalData("users")?.sellers[currentUser.id];

// Chart configuration constants
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CHART_COLORS = {
    SALES: 'rgba(54, 162, 235, 1)',
    ORDERS: 'rgba(75, 192, 192, 1)',
    REVENUE: 'rgba(255, 159, 64, 1)',
    INVENTORY: 'rgba(153, 102, 255, 1)'
};

// Chart instances
let salesChartInstance = null;
let categoryChartInstance = null;

/**
 * Initializes the dashboard
 */
function initializeDashboard() {
    updateDashboardStats();
    setupChartEventListeners();
    loadInitialCharts();
    
    // Set default value for period selector
    const periodSelect = document.getElementById('salesPeriod');
    if (periodSelect) {
        periodSelect.value = 'month';
    }
}

// Start the dashboard
initializeDashboard();

/**
 * Main statistics calculation function
 */
function calculateDashboardStats() {
    const sellerId = currentUserData.id;
    const sellerProducts = productsData?.[`Seller${sellerId}`] || {};
    const allSellerOrders = getSellerOrders(ordersData, sellerId);

    // Filter only delivered orders
    const deliveredOrders = allSellerOrders.filter(order => 
        order && order.status === 'Delivered' && isValidOrder(order)
    );

    // Calculate core metrics based on delivered orders only
    const totalProducts = Object.keys(sellerProducts).length;
    const inventoryValue = calculateInventoryValue(sellerProducts);
    const totalSalesValue = deliveredOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalOrders = allSellerOrders.filter(order => order && order.status !== 'Delivered').length;


    // Additional metrics based on delivered orders
    const topProduct = totalOrders > 0 ? findTopProduct(deliveredOrders, sellerProducts) : 'No sales';
    const uniqueCustomers = new Set(deliveredOrders.map(order => order.customerId).filter(Boolean));
    const { currentMonthEarnings, yearToDateEarnings } = calculateTimeBasedMetrics(deliveredOrders);
    const revenue = totalSalesValue * 0.5;
    const avgOrderValue = totalOrders > 0 ? totalSalesValue / totalOrders : 0;
    const conversionRate = calculateConversionRate(totalOrders);

    // Order status metrics
    const totalCancelledOrders = allSellerOrders.filter(o => o.status === 'Cancelled').length;
    const totalDeliveredOrders = deliveredOrders.length;

    return {
        totalProducts,
        inventoryValue,
        totalSalesValue,
        totalOrders,
        uniqueCustomers: uniqueCustomers.size,
        currentMonthEarnings,
        yearToDateEarnings,
        revenue,
        avgOrderValue,
        conversionRate,
        topProduct,
        totalCancelledOrders,
        totalDeliveredOrders,
        trends: calculateTrends(currentUserData.sales || {}, deliveredOrders, sellerProducts)
    };
}

/**
 * Validates order object structure
 */
function isValidOrder(order) {
    return order &&
        order.status !== 'Cancelled' &&
        order.status !== 'Pending' &&
        order.status !== 'Processing' &&
        order.status !== 'Shipped' &&
        typeof order.totalPrice === 'number' &&
        Array.isArray(order.products);
}

/**
 * Updates dashboard statistics cards
 */
function updateDashboardStats() {
    try {
        const stats = calculateDashboardStats();
        renderDashboardStats(stats);
    } catch (error) {
        showError("Failed to update dashboard stats: " + error.message);
    }
}

/**
 * Gets all orders for a specific seller
 */
function getSellerOrders(ordersData, sellerId) {
    if (!ordersData) return [];
    return Object.values(ordersData).filter(order => isValidOrderForSeller(order, sellerId));
}

/**
 * Checks if order belongs to specified seller
 */
function isValidOrderForSeller(order, sellerId) {
    if (!order || typeof order !== 'object') return false;
    const orderSellerId = order.sellerId || extractSellerIdFromOrderId(order);
    return orderSellerId && orderSellerId.toString() === sellerId.toString();
}

/**
 * Extracts seller ID from order ID
 */
function extractSellerIdFromOrderId(order) {
    return (order.id && order.id.split('_')[1]) ||
        (order.orderId && order.orderId.split('_')[1]);
}

/**
 * Calculates total inventory value
 */
function calculateInventoryValue(products) {
    return Object.values(products).reduce((sum, product) => {
        return sum + ((product.stock || 0) * (product.priceAfterOffer || product.price || 0));
    }, 0);
}

/**
 * Identifies top selling product
 */
function findTopProduct(orders, products) {
    if (orders.length === 0) return 'No sales';
    if (Object.keys(products).length === 0) return 'No products';

    const productSales = calculateProductSales(orders);
    return determineTopProduct(productSales, products);
}

/**
 * Calculates sales quantity per product
 */
function calculateProductSales(orders) {
    const productSales = {};
    orders.forEach(order => {
        order.products?.forEach(item => {
            if (item.productId && item.quantity) {
                productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
            }
        });
    });
    return productSales;
}

/**
 * Determines top product from sales data
 */
function determineTopProduct(productSales, products) {
    if (Object.keys(productSales).length === 0) return 'No sales';
    
    // Filter out products that don't exist in current product list
    const validProductSales = {};
    for (const productId in productSales) {
        if (products[productId]) {
            validProductSales[productId] = productSales[productId];
        }
    }
    
    if (Object.keys(validProductSales).length === 0) return 'No valid products';
    
    const topProductId = Object.keys(validProductSales).reduce((a, b) =>
        validProductSales[a] > validProductSales[b] ? a : b
    );
    return products[topProductId]?.name || `Product ID: ${topProductId}`;
}

/**
 * Calculates time-based earnings metrics
 */
function calculateTimeBasedMetrics(orders) {
    const now = new Date();
    let currentMonthEarnings = 0;
    let yearToDateEarnings = 0;

    orders.forEach(order => {
        if (!order.orderDate) return;

        const orderDate = new Date(order.orderDate);
        if (isNaN(orderDate.getTime())) return;

        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth();
        const orderPrice = order.totalPrice || 0;

        if (orderYear === now.getFullYear()) {
            yearToDateEarnings += orderPrice;
            if (orderMonth === now.getMonth()) {
                currentMonthEarnings += orderPrice;
            }
        }
    });

    return { currentMonthEarnings, yearToDateEarnings };
}

/**
 * Calculates conversion rate
 */
function calculateConversionRate(totalOrders) {
    const baseVisitors = 1000;
    return totalOrders > 0 ? Math.min((totalOrders / baseVisitors) * 100, 100).toFixed(1) : 0;
}

/**
 * Calculates all business trends
 */
function calculateTrends(salesData, orders, products) {
    return {
        sales: calculateSalesTrend(salesData),
        orders: { value: orders.length, isPositive: orders.length > 0 },
        products: { value: Object.keys(products).length, isPositive: true },
        customers: { value: new Set(orders.map(o => o.customerId)).size, isPositive: true },
        revenue: { value: orders.reduce((sum, o) => sum + o.totalPrice, 0), isPositive: true },
        aov: {
            value: orders.length > 0 ?
                orders.reduce((sum, o) => sum + o.totalPrice, 0) / orders.length : 0,
            isPositive: true
        },
        conversion: { value: calculateConversionRate(orders.length), isPositive: true }
    };
}

/**
 * Calculates yearly sales trend
 */
function calculateSalesTrend(salesData) {
    if (!salesData.yearlySales) return calculateRandomTrend();

    const years = Object.keys(salesData.yearlySales).map(Number).sort();
    if (years.length < 2) return calculateRandomTrend();

    const currentYear = years[years.length - 1];
    const previousYear = years[years.length - 2];
    const change = calculateYearlyChange(salesData, currentYear, previousYear);

    return {
        value: Math.abs(Math.round(change)),
        isPositive: change >= 0
    };
}

/**
 * Calculates yearly change percentage
 */
function calculateYearlyChange(salesData, currentYear, previousYear) {
    return ((salesData.yearlySales[currentYear] - salesData.yearlySales[previousYear]) /
        salesData.yearlySales[previousYear]) * 100;
}

/**
 * Generates random trend data (fallback)
 */
function calculateRandomTrend() {
    const value = Math.random() * 20;
    return {
        value: Math.round(value),
        isPositive: Math.random() > 0.3
    };
}

/**
 * Updates all dashboard statistics cards
 */
function renderDashboardStats(stats) {
    // Update stat cards
    updateStatCard('totalSales', formatCurrency(stats.totalSalesValue));
    updateStatCard('totalOrders', stats.totalOrders);
    updateStatCard('totalProducts', stats.totalProducts);
    updateStatCard('totalCustomers', stats.uniqueCustomers);
    updateStatCard('currentMonthEarnings', formatCurrency(stats.currentMonthEarnings));
    updateStatCard('yearToDateEarnings', formatCurrency(stats.yearToDateEarnings));
    updateStatCard('revenue', formatCurrency(stats.revenue));
    updateStatCard('avgOrderValue', formatCurrency(stats.avgOrderValue));
    updateStatCard('inventoryValue', formatCurrency(stats.inventoryValue));
    updateStatCard('topProduct', stats.topProduct);

    // Update trend badges
    updateTrendBadge('salesTrend', stats.trends.sales);
    updateTrendBadge('ordersTrend', stats.trends.orders);
    updateTrendBadge('productsTrend', stats.trends.products);
    updateTrendBadge('customersTrend', stats.trends.customers);
    updateTrendBadge('revenueTrend', stats.trends.revenue);
    updateTrendBadge('aovTrend', stats.trends.aov);
    updateTrendBadge('conversionTrend', stats.trends.conversion);
}

/**
 * Updates a single statistic card
 */
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = value;
}

/**
 * Updates a trend indicator badge
 */
function updateTrendBadge(elementId, trend) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = `${trend.isPositive ? '+' : '-'}${Number.isInteger(trend.value) ? trend.value : trend.value.toFixed(2)}%`;
        element.className = `badge bg-${trend.isPositive ? 'success' : 'danger'}`;
    }
}

/**
 * Formats currency value
 */
function formatCurrency(value) {
    return '$' + parseFloat(value || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Sets up chart event listeners
 */
function setupChartEventListeners() {
    const periodSelect = document.getElementById('salesPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', function () {
            updateSalesChart(this.value);
        });
    }
}

/**
 * Loads initial charts
 */
function loadInitialCharts() {
    updateSalesChart('month');
    updateCategoryChart();
}

/**
 * Updates sales chart with multi-stat view
 */
function updateSalesChart(period) {
    if (!currentUserData) return;

    const { labels, totalSalesData, ordersCountData, revenueData, inventoryData } =
        prepareMultiStatsChartData(period);

    // Destroy previous chart instance if exists
    if (salesChartInstance) salesChartInstance.destroy();

    // Create new chart
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Sales',
                    data: totalSalesData,
                    borderColor: CHART_COLORS.SALES,
                    backgroundColor: CHART_COLORS.SALES.replace('1)', '0.2)'),
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Orders Count',
                    data: ordersCountData,
                    borderColor: CHART_COLORS.ORDERS,
                    backgroundColor: CHART_COLORS.ORDERS.replace('1)', '0.2)'),
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Revenue',
                    data: revenueData,
                    borderColor: CHART_COLORS.REVENUE,
                    backgroundColor: CHART_COLORS.REVENUE.replace('1)', '0.2)'),
                    tension: 0.1,
                    fill: false
                },
                {
                    label: 'Inventory Value',
                    data: inventoryData,
                    borderColor: CHART_COLORS.INVENTORY,
                    backgroundColor: CHART_COLORS.INVENTORY.replace('1)', '0.2)'),
                    tension: 0.1,
                    fill: false
                }
            ]
        },
        options: getChartOptions(period)
    });
}

/**
 * Prepares multi-stat chart data for all periods based on delivered orders
 */
function prepareMultiStatsChartData(period) {
    const sellerProducts = productsData?.[`Seller${currentUserData.id}`] || {};
    const allOrders = getSellerOrders(ordersData, currentUserData.id);
    
    // Filter only delivered orders
    const deliveredOrders = allOrders.filter(order => 
        order && order.status === 'Delivered' && isValidOrder(order)
    );
    
    const now = new Date();

    let labels = [];
    let totalSalesData = [];
    let ordersCountData = [];
    let revenueData = [];
    let inventoryData = [];

    if (period === 'day') {
        // Day data (last 24 hours) from delivered orders
        labels = Array.from({length: 24}, (_, i) => {
            const hour = (i + 6) % 24; // Start from 6 AM
            return `${hour}:00`;
        });
        
        // Initialize arrays with zeros
        totalSalesData = Array(24).fill(0);
        ordersCountData = Array(24).fill(0);
        
        // Collect today's delivered orders data
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const todayDeliveredOrders = deliveredOrders.filter(o => o.orderDate?.startsWith(todayString));
        
        todayDeliveredOrders.forEach(order => {
            if (order.orderDate) {
                const orderHour = new Date(order.orderDate).getHours();
                const displayHour = (orderHour - 6 + 24) % 24; // Adjust for display
                ordersCountData[displayHour] += 1;
                totalSalesData[displayHour] += order.totalPrice || 0;
            }
        });
        
        revenueData = totalSalesData.map(amount => amount * 0.5);
        inventoryData = Array(24).fill(calculateInventoryValue(sellerProducts));
        
    } else if (period === 'week') {
        // Week data (last 7 days) from delivered orders
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels = daysOfWeek;
        
        // Initialize arrays with zeros
        totalSalesData = Array(7).fill(0);
        ordersCountData = Array(7).fill(0);
        
        // Collect this week's delivered orders data
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        deliveredOrders.forEach(order => {
            if (order.orderDate) {
                const orderDate = new Date(order.orderDate);
                if (orderDate >= startOfWeek && orderDate <= now) {
                    const dayOfWeek = orderDate.getDay(); // 0 (Sun) to 6 (Sat)
                    ordersCountData[dayOfWeek] += 1;
                    totalSalesData[dayOfWeek] += order.totalPrice || 0;
                }
            }
        });
        
        revenueData = totalSalesData.map(amount => amount * 0.5);
        inventoryData = Array(7).fill(calculateInventoryValue(sellerProducts));
        
    } else if (period === 'month') {
        // Month data (12 months) from delivered orders
        labels = MONTH_NAMES;
        for (let i = 0; i < 12; i++) {
            const monthKey = `${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
            const monthDeliveredOrders = deliveredOrders.filter(o => o.orderDate?.startsWith(monthKey));

            ordersCountData.push(monthDeliveredOrders.length);
            totalSalesData.push(monthDeliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0));
            revenueData.push(monthDeliveredOrders.reduce((sum, o) => sum + ((o.totalPrice || 0) * 0.6), 0));
            inventoryData.push(calculateInventoryValue(sellerProducts));
        }
    } else if (period === 'year') {
        // Year data from delivered orders
        let years = Object.keys(currentUserData.sales?.yearlySales || {});
        if (years.length === 0) {
            // If no yearly data, use years from delivered orders
            const yearSet = new Set();
            deliveredOrders.forEach(order => {
                if (order.orderDate) {
                    const year = new Date(order.orderDate).getFullYear();
                    yearSet.add(year);
                }
            });
            years = Array.from(yearSet).sort();
        }
        
        labels = years.map(y => y.toString());
        years.forEach(year => {
            const yearDeliveredOrders = deliveredOrders.filter(o => {
                if (o.orderDate) {
                    return new Date(o.orderDate).getFullYear().toString() === year.toString();
                }
                return false;
            });
            
            ordersCountData.push(yearDeliveredOrders.length);
            totalSalesData.push(yearDeliveredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0));
            revenueData.push(yearDeliveredOrders.reduce((sum, o) => sum + ((o.totalPrice || 0) * 0.5), 0));
            inventoryData.push(calculateInventoryValue(sellerProducts));
        });
    }

    return { labels, totalSalesData, ordersCountData, revenueData, inventoryData };
}

/**
 * Returns chart options based on period
 */
function getChartOptions(period) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 20
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return formatCurrency(value);
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: getXAxisTitle(period)
                }
            }
        }
    };
    
    return options;
}

/**
 * Returns appropriate X-axis title based on period
 */
function getXAxisTitle(period) {
    switch(period) {
        case 'day': return 'Hours of Day';
        case 'week': return 'Days of Week';
        case 'month': return 'Months of Year';
        case 'year': return 'Years';
        default: return '';
    }
}

/**
 * Updates category distribution chart
 */
function updateCategoryChart() {
    const sellerId = currentUserData.id;
    const sellerProducts = productsData?.[`Seller${sellerId}`] || {};
    const { labels, data, colors } = prepareCategoryChartData(sellerProducts);

    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // Destroy previous chart instance if exists
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    // Create new chart
    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: getDoughnutChartOptions()
    });
}

/**
 * Prepares category chart data
 */
function prepareCategoryChartData(products) {
    const categoryData = {};
    Object.values(products).forEach(product => {
        const category = product.mainCategory || 'Uncategorized';
        const value = (product.totalSales || 0) * (product.priceAfterOffer || product.price || 0);
        categoryData[category] = (categoryData[category] || 0) + value;
    });

    const labels = Object.keys(categoryData);
    return {
        labels: labels.length > 0 ? labels : ['No Categories'],
        data: labels.length > 0 ? Object.values(categoryData) : [1],
        colors: generateChartColors(Math.max(1, labels.length))
    };
}

/**
 * Generates distinct chart colors
 */
function generateChartColors(count) {
    return Array.from({ length: count }, (_, i) =>
        `hsl(${(i * 360 / Math.max(1, count))}, 70%, 60%)`
    );
}

/**
 * Returns doughnut chart options
 */
function getDoughnutChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    padding: 20
                }
            }
        },
        cutout: '70%'
    };
}

/**
 * Displays error message in UI
 */
function showError(message) {
    console.error(message);
    showToast(message, "danger");
}