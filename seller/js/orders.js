// #region //zone === Orders Table Functionality ===

// #region //zone === Variables & DOM References ===
const ordersTable = document.getElementById("ordersTable");
const ordersTbody = ordersTable.querySelector("tbody");
const ordersFilter = document.getElementById("ordersFilter");

// Application state variables
let isEditMode = false;
let originalOrderData = {};
const Orders = getLocalData("oldOrders") || {}; // Initialize if doesn't exist

// Modal elements
const modalEl = document.getElementById('orderDetailsModal');
const modalTitle = document.getElementById('orderDetailsTitle');
const modalBody = document.getElementById('orderDetailsBody');
const printBtn = document.getElementById('printInvoiceBtn');
const orderModal = new bootstrap.Modal(modalEl, {
    focus: true
});

// Counter for displayed row numbers
let orderMaxNumber = 0;

// Get current seller data
const currentSeller = getLocalData("userData");
// #endregion

// #region //zone === UI Functions ===
/**
 * Adds a new order row to the table
 * @param {Object} order - Order data to display
 */
function addOrderRow(order) {
    lastTriggerButton = document.querySelector(`tr[data-order-id="${order.id}"] .view-btn`);

    orderMaxNumber += 1;

    // Format date
    const orderDate = new Date(order.orderDate);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Calculate total items in order
    const totalItems = order.products.reduce((sum, product) => sum + product.quantity, 0);

    // Create and populate new table row
    const newRow = document.createElement("tr");
    newRow.setAttribute('data-order-id', order.id);
    newRow.innerHTML = `
        <td class="fw-semibold text-primary" data-label="ID">${order.id}</td>
        <td data-label="Customer">
            <div class="d-flex align-items-center">
                <div class="avatar me-2">
                    <span class="avatar-initial rounded-circle bg-primary">${order.customerName.charAt(0)}</span>
                </div>
                <div>
                    <div class="fw-medium">${order.customerName}</div>
                    <small class="text-muted" style='text-transform: lowercase !important;'>${order.customerEmail}</small>
                </div>
            </div>
        </td>
        <td data-label="Date">${formattedDate}</td>
        <td data-label="Total Items">${totalItems}</td>
        <td data-label="Total" class="fw-bold">$${order.totalPrice.toFixed(2)}</td>
        <td data-label="Status">
            <span class="status-badge status-${order.status.toLowerCase()}">
                <i class="${getStatusIcon(order.status)} me-1"></i> ${order.status}
            </span>
        </td>
        <td data-label="Actions" class="text-center">
            <div class="d-flex justify-content-center gap-2">
                <button class="btn btn-sm btn-info action-btn view-btn" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                ${order.status === 'Delivered' ? 
                `<button class="btn btn-sm btn-secondary action-btn invoice-btn" title="Invoice">
                    <i class="fas fa-file-invoice"></i>
                </button>` : ''}
            </div>
        </td>
    `;

    // Add event listeners for row action buttons
    newRow.querySelector(".view-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        viewOrderDetails(order);
    });

    if (order.status === 'Delivered') {
        newRow.querySelector(".invoice-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            generateInvoice(order.id);
        });
    }

    ordersTbody.appendChild(newRow);
}

/**
 * Gets appropriate icon for order status
 * @param {string} status - Order status
 * @returns {string} Icon class
 */
function getStatusIcon(status) {
    switch(status.toLowerCase()) {
        case 'pending': return 'fas fa-clock';
        case 'processing': return 'fas fa-sync-alt';
        case 'shipped': return 'fas fa-truck';
        case 'delivered': return 'fas fa-check-circle';
        case 'cancelled': return 'fas fa-times-circle';
        default: return 'fas fa-question-circle';
    }
}

/**
 * Retrieves order by ID
 * @param {string} orderId - Order ID to find
 * @returns {Object|null} Order data or null if not found
 */
function getOrderById(orderId) {
    return Orders[orderId];
}

/**
 * Views order details
 * @param {Object} order - Order object to view
 */
function viewOrderDetails(order) {
    // Format the order date
    const orderDate = new Date(order.orderDate);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    modalTitle.textContent = `Order Details - ${order.id}`;
    modalBody.innerHTML = `
        <div class="order-details-container">
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5>Order Information</h5>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Date:</strong> ${formattedDate}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${order.status.toLowerCase()}">
                        ${order.status}
                    </span></p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Total:</strong> $${order.totalPrice.toFixed(2)}</p>
                </div>
                <div class="col-md-6">
                    <h5>Customer Information</h5>
                    <p><strong>Customer ID:</strong> ${order.customerId}</p>
                    <p><strong>Name:</strong> ${order.customerName}</p>
                    <p><strong>Email:</strong> ${order.customerEmail}</p>
                    <h5 class="mt-3">Shipping Address</h5>
                    <p>${order.shippingAddress?.street || '-'}<br>
                    ${order.shippingAddress?.city || '-'}<br>
                    ${order.shippingAddress?.zipCode || '-'}</p>
                </div>
            </div>
            
            <h5>Order Items</h5>
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.products.map(product => `
                            <tr>
                                <td>${product.productName}</td>
                                <td>$${product.price.toFixed(2)}</td>
                                <td>${product.quantity}</td>
                                <td>$${product.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Set focus to close button when modal opens
    orderModal._element.addEventListener('shown.bs.modal', () => {
        orderModal._element.querySelector('.btn-close').focus();
    });
    
    orderModal.show();
    
    printBtn.onclick = () => {
        generateInvoice(order.id);
        orderModal.hide();
    };
}

/**
 * Generates invoice for an order
 * @param {string} orderId - Order ID to invoice
 */
function generateInvoice(orderId) {
    const order = getOrderById(orderId);
    if (!order) return;

    // Create a new window for the invoice
    const invoiceWindow = window.open('', '_blank');
    
    // Invoice HTML
    const invoiceHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - ${order.id}</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                body { font-family: Arial, sans-serif; }
                .invoice-header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
                .invoice-title { color: #333; }
                .invoice-details { margin-top: 20px; }
                .table { width: 100%; margin-bottom: 20px; }
                .table th { background-color: #f8f9fa; }
                .text-right { text-align: right; }
                .total-row { font-weight: bold; font-size: 1.1em; }
                @media print {
                    .no-print { display: none; }
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="row invoice-header">
                    <div class="col-6">
                        <h1 class="invoice-title">INVOICE</h1>
                        <p>Seller: ${currentSeller.name}<br>
                        ${currentSeller.address?.street || '-'}, ${currentSeller.address?.city || '-'}, ${currentSeller.address?.zipCode || '-'}</p>
                    </div>
                    <div class="col-6 text-end">
                        <p><strong>Invoice #:</strong> ${order.id}<br>
                        <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
                        <strong>Status:</strong> ${order.status}</p>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <h5>Bill To:</h5>
                        <p>${order.customerName}<br>
                        ${order.customerEmail}<br>
                        ${order.shippingAddress?.street || '-'}<br>
                        ${order.shippingAddress?.city || '-'}, ${order.shippingAddress?.zipCode || '-'}</p>
                    </div>
                    <div class="col-md-6 text-end">
                        <h5>Shipping To:</h5>
                        <p>${order.shippingAddress?.street || '-'}<br>
                        ${order.shippingAddress?.city || '-'}, ${order.shippingAddress?.zipCode || '-'}</p>
                    </div>
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th class="text-right">Price</th>
                            <th class="text-right">Qty</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.products.map((product, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${product.productName}</td>
                                <td class="text-right">$${product.price.toFixed(2)}</td>
                                <td class="text-right">${product.quantity}</td>
                                <td class="text-right">$${product.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="4" class="text-right">Subtotal:</td>
                            <td class="text-right">$${order.totalPrice.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="4" class="text-right">Shipping:</td>
                            <td class="text-right">$0.00</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="4" class="text-right">Total:</td>
                            <td class="text-right">$${order.totalPrice.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="row mt-4">
                    <div class="col-12">
                        <p>Thank you for your business!</p>
                        <p class="no-print">
                            <button onclick="window.print()" class="btn btn-primary">Print Invoice</button>
                            <button onclick="window.close()" class="btn btn-secondary">Close</button>
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    // Write the HTML to the new window
    invoiceWindow.document.open();
    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
}

/**
 * Updates row numbering after changes
 */
function updateOrderRowNumbers() {
    const rows = ordersTbody.querySelectorAll("tr");
    rows.forEach((row, index) => {
        row.querySelector("td:first-child").textContent = index + 1;
    });
    orderMaxNumber = rows.length;
}

// #endregion

// #region //zone === Initialization ===
// Load and display orders on page load
function initializeOrdersTable() {
    ordersTbody.innerHTML = ""; // Clear existing rows
    orderMaxNumber = 0;

    if (!currentSeller || !currentSeller.id) {
        showToast("Seller information not found", 'error');
        return;
    }

    if (Orders && Object.keys(Orders).length > 0) {
        // Filter orders for current seller only
        const sellerOrders = Object.values(Orders).filter(order => 
            order.sellerId == currentSeller.id
        );

        if (sellerOrders.length === 0) {
            showToast("No orders found for current seller", 'warning');
            return;
        }

        // Sort orders by date (newest first)
        const sortedOrders = sellerOrders.sort((a, b) => 
            new Date(b.orderDate) - new Date(a.orderDate)
        );
        
        sortedOrders.forEach(order => addOrderRow(order));
    } else {
        showToast("No orders found", 'warning');
    }
}

// Initialize the table when the page loads
initializeOrdersTable();
// #endregion

// #region //zone === Event Listeners ===
// Order status filter functionality
ordersFilter.addEventListener("change", function() {
    const selectedStatus = this.value;
    const allRows = ordersTbody.querySelectorAll("tr");

    allRows.forEach(function(row) {
        const statusElement = row.querySelector(".status-badge");
        const rowStatus = statusElement.textContent.trim();
        
        row.style.display = (selectedStatus === "" || rowStatus === selectedStatus) ? "" : "none";
    });
});
// #endregion

// #endregion //zone === Orders Table Functionality ===