// #region //zone === Main Table Functionality ===

// #region //zone === Helper Functions ===
/**
 * Retrieves data from localStorage
 * @param {string} key - localStorage key
 * @returns {Object} Parsed data or empty object
 */
function getLocalData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || {};
    } catch (e) {
        console.error(`Error parsing ${key} from localStorage:`, e);
        return {};
    }
}
// #endregion

// #region //zone === Variables & DOM References ===
// Main table elements
const productsTable = document.getElementById("productsTable");
const tBody = productsTable.querySelector("tbody");
const addProductBtn = document.getElementById("addProductBtn");
addProductBtn.addEventListener("click", () => {
    lastTriggerButton = addProductBtn;
    document.getElementById("productId").value = '';
    productForm.reset();
});

// Application state variables
let isEditMode = false;
let originalProductData = {}; // Stores original product data for comparison during edits
const currentSeller = getLocalData("userData");; // Gets current seller data once
const Products = getLocalData("oldProducts"); // Gets old products data once

// Delete confirmation variables
let productToDelete = null;
let rowToDelete = null;
let lastTriggerButton = null;
// #endregion

// #region //zone === UI Functions ===
// Counter for displayed row numbers
let maxNumber = 0;

/**
 * Adds a new product row to the table
 * @param {Object} product - Product data to display
 */
function addProductRow(product) {
    maxNumber += 1;

    // Calculate final price with discount if applicable
    const finalPrice = product.offer > 0
        ? (product.price * (1 - product.offer / 100)).toFixed(2)
        : product.price.toFixed(2);

    // Determine CSS class based on stock level
    let statusClass = 'status-out_of_stock';
    if (product.stock > 20) {
        statusClass = 'status-in_stock';
    } else if (product.stock > 0) {
        statusClass = 'status-low_stock';
    }

    // Create and populate new table row
    const newRow = document.createElement("tr");
    newRow.setAttribute('data-product-id', product.id);
    newRow.innerHTML = `
        <td data-label="#">${maxNumber}</td>
        <td data-label="ID" class="fw-semibold text-primary">${product.id}</td>
        <td data-label="Product Name">
            <div class="d-flex align-items-center">
                ${product.images && product.images.length > 0
            ? `<img src="${product.images[0] || product.images[0].data}" alt="${product.name}" class="thumbnail-img me-2">`
            : `<div class="thumbnail-img bg-light me-2 d-flex align-items-center justify-content-center">
                            <i class="fas fa-box-open text-muted"></i>
                        </div>`}
                <span>${product.name}</span>
            </div>
        </td>
        <td data-label="Category">${product.mainCategory || product.category}</td>
        <td data-label="Price" class="text-nowrap">
            ${product.offer > 0
            ? `<span class="original-price text-muted me-1">$${product.price.toFixed(2)}</span>`
            : `<span class="fw-semibold">$${product.price.toFixed(2)}</span>`}
            
        </td>
        <td data-label="Offer">
            ${product.offer > 0
            ? `<span class="offer-badge">${product.offer}%</span>`
            : '<span class="text-muted small">No offer</span>'}
        </td>
        <td data-label="Final Price" class="final-price fw-bold text-success">$${finalPrice}</td>
        <td data-label="Stock">${product.stock}</td>
        <td data-label="Status">
            <span class="status-badge ${statusClass}">
                ${product.status || (product.stock > 20 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock')}
            </span>
        </td>
        <td class="text-center">
            <div class="d-flex justify-content-center gap-2">
                <button class="btn btn-sm btn-outline-primary action-btn edit-btn" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary action-btn toggle-btn" title="Toggle Visibility">
                    <i class="fas ${product.visibility === false ? "fa-eye-slash" : "fa-eye"}"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger action-btn delete-btn" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </td>
    `;

    // Add event listeners for row action buttons
    newRow.querySelector(".edit-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        editProduct(product.id);
    });

    newRow.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteProduct(product.id, newRow);
    });

    newRow.querySelector(".toggle-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleProductVisibility(product.id);
    });

    tBody.appendChild(newRow);
}

/**
 * Retrieves product by ID from localStorage
 * @param {string} productId - Product ID to find
 * @returns {Object|null} Product data or null if not found
 */
function getProductById(productId) {
    return Products[`Seller${currentSeller.id}`]?.[productId];
}

/**
 * Opens edit modal with product data
 * @param {string} productId - Product ID to edit
 */
function editProduct(productId) {
    const product = getProductById(productId);
    if (!product) return;

    lastTriggerButton = document.querySelector(`tr[data-product-id="${productId}"] .edit-btn`);

    isEditMode = true;
    originalProductData = { ...product };

    document.getElementById("modalTitle").textContent = "Edit Product";
    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productDesc").value = product.description;

    const categorySelect = document.getElementById("category");
    let optionExists = Array.from(categorySelect.options).some(opt => opt.value === product.category);
    if (!optionExists) {
        const newOption = new Option(product.category, product.category, true, true);
        categorySelect.add(newOption);
    }
    categorySelect.value = product.category;

    document.getElementById("price").value = product.price;
    document.getElementById("offer").value = product.offer || "";
    document.getElementById("stock").value = product.stock;
    document.getElementById("status").value = product.status;

    imagePreview.innerHTML = "";
    if (product.images && product.images.length > 0) {
        product.images.forEach(imgSrc => {
            const wrapper = document.createElement("div");
            wrapper.className = "img-wrapper d-inline-block position-relative me-2";
            wrapper.dataset.imageId = Date.now();

            const img = document.createElement("img");
            img.src = imgSrc;
            img.className = "img-thumbnail";
            img.style.maxHeight = "100px";

            const removeBtn = document.createElement("button");
            removeBtn.innerHTML = "×";
            removeBtn.type = "button";
            removeBtn.className = "btn btn-sm btn-danger position-absolute top-0 end-0";
            removeBtn.onclick = () => {
                wrapper.remove();
                validateAndTrack('image', inputs.image);
                updateSaveButtonState();
                updateImageCounter();
                if (imagePreview.querySelectorAll('.img-wrapper').length === 0) {
                    inputs.image.value = '';
                }
            };

            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            imagePreview.appendChild(wrapper);
        });
    }

    Object.keys(fieldStates).forEach(field => {
        if (field === 'image') {
            fieldStates[field] = product.images && product.images.length > 0;
        } else {
            fieldStates[field] = true;
        }
    });

    updateSaveButtonState();
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

/**
 * Opens delete confirmation modal
 * @param {string} productId - Product ID to delete
 * @param {HTMLElement} rowElement - Table row element to remove
 */
function showDeleteConfirmation(productId, rowElement) {
    productToDelete = productId;
    rowToDelete = rowElement;

    // Show the modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();
}

/**
 * Deletes a product after confirmation
 */
function confirmDelete() {
    if (!productToDelete || !rowToDelete) return;

    if (!currentSeller?.id) return;

    const sellerKey = `Seller${currentSeller.id}`;

    if (Products[sellerKey]?.[productToDelete]) {
        delete Products[sellerKey][productToDelete];
        localStorage.setItem("oldProducts", JSON.stringify(Products));
        rowToDelete.remove();
        updateRowNumbers();
        showToast("Product deleted successfully", 'success');
    }

    maxNumber--;

    // Close the modal
    const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
    deleteModal.hide();

    // Reset variables
    productToDelete = null;
    rowToDelete = null;
}

/**
 * Deletes a product after confirmation
 * @param {string} productId - Product ID to delete
 * @param {HTMLElement} rowElement - Table row element to remove
 */
function deleteProduct(productId, rowElement) {
    showDeleteConfirmation(productId, rowElement);
}

/**
 * Toggles product visibility status
 * @param {string} productId - Product ID to toggle
 */
function toggleProductVisibility(productId) {
    if (!currentSeller?.id) return;

    const sellerKey = `Seller${currentSeller.id}`;
    const product = Products[sellerKey]?.[productId];

    if (product) {
        product.visibility = !product.visibility;
        localStorage.setItem("oldProducts", JSON.stringify(Products));

        const row = tBody.querySelector(`tr[data-product-id="${productId}"]`);
        const toggleBtn = row.querySelector(".toggle-btn i");
        toggleBtn.className = product.visibility ? "fas fa-eye" : "fas fa-eye-slash";

        showToast(`Product ${productId} is now ${product.visibility ? "visible" : "hidden"}`, 'info');
    }
}

/**
 * Updates row numbering after changes
 */
function updateRowNumbers() {
    const rows = tBody.querySelectorAll("tr");
    rows.forEach((row, index) => {
        row.querySelector("td:first-child").textContent = index + 1;
    });
    maxNumber = rows.length;
}
// #endregion

// #region //zone === Initialization ===
// Load and display products on page load

if (Products && currentSeller) {
    const sellerNum = currentSeller.id;
    const sellerId = `Seller${sellerNum}`;
    if (Products[sellerId]) {
        Object.values(Products[sellerId]).forEach(prod => addProductRow(prod));
    } else {
        console.warn(`No products found for seller ID: ${sellerId}`);
    }
}

// Add event listener for delete confirmation button
document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
// #endregion

// #region //zone === Event Listeners ===
// Category filter functionality
const categoriesFilter = document.getElementById("categoriesFilter");

categoriesFilter.addEventListener("change", function () {
    const selectedCategory = this.value;
    const allRows = tBody.querySelectorAll("tr");

    allRows.forEach(function (row) {
        const rowCategory = row.querySelector("td:nth-child(4)").textContent.trim();
        row.style.display = (selectedCategory === "" || rowCategory === selectedCategory) ? "" : "none";
    });
});
// #endregion

// #endregion //zone === Main Table Functionality ===

// #region //zone === Product Form Functionality ===

// #region //zone === DOM Elements ===
// Form elements and inputs
const productForm = document.getElementById("productForm");
const inputs = {
    id: document.getElementById("productId"),
    image: document.getElementById("inputImages"),
    name: document.getElementById("productName"),
    description: document.getElementById("productDesc"),
    category: document.getElementById("category"),
    price: document.getElementById("price"),
    offer: document.getElementById("offer"),
    stock: document.getElementById("stock"),
    status: document.getElementById("status")
};
const saveBtn = document.getElementById("saveBtn");
const imagePreview = document.getElementById("imagePreview");
// #endregion

// #region //zone === Validation Setup ===
// Validation configuration
const inputValueLength = 10;
const maxPrice = 500000;
const maxStock = 500;

// Validation rules for each field
const validationRules = {
    image: value => imagePreview.querySelectorAll("img").length > 0,
    name: value => new RegExp(`^.{${inputValueLength},}$`, "u").test(value.trim()) && !isProductNameExists(value.trim(), inputs.id.value),
    description: value => value.trim().length >= inputValueLength * 2,
    category: value => /^.+$/.test(value),
    price: value => /^(?!0+(?:\.0+)?$)(?:[1-9]\d{0,5})(?:\.\d+)?$/.test(value) && parseFloat(value) <= maxPrice,
    offer: value => { if (!value || value.trim() === "") return true; return /^(100|[0-9]{1,2})?$/.test(value) },
    stock: value => /^(?:[1-9]\d?|1\d{2})$/.test(value) && parseInt(value) <= maxStock,
    status: value => /^(in stock|low stock|out of stock)$/i.test(value)
};

// Error messages for validation failures
const errorMessages = {
    image: {
        required: "Please select an image",
        invalid: "Invalid images"
    },
    name: {
        required: "Product name is required",
        invalid: `Enter a valid product name (at least ${inputValueLength} characters) and it must be unique`
    },
    description: {
        required: "Description is required",
        invalid: `Enter a valid description (at least ${inputValueLength * 2} characters)`
    },
    category: {
        required: "Please select a category",
        invalid: "Enter a valid category"
    },
    price: {
        required: "Price is required",
        invalid: `Enter a valid price (greater than 0 and less than ${maxPrice})`
    },
    offer: {
        required: "Offer value is required",
        invalid: "Enter a valid offer (between 0 and 100)"
    },
    stock: {
        required: "Stock value is required",
        invalid: `Enter a valid stock amount (between 1 and ${maxStock})`
    },
    status: {
        required: "Status is required",
        invalid: "Enter a valid status (in stock, low stock, out of stock)"
    }
};

// Tracks validation state for each field
let fieldStates = {
    image: false,
    name: false,
    description: false,
    category: false,
    price: false,
    offer: true,
    stock: false,
    status: false
};
// #endregion

// #region //zone === Helper Functions ===
/**
 * Checks if product name already exists
 * @param {string} name - Product name to check
 * @param {string} excludeId - Product ID to exclude from check
 * @returns {boolean} True if name exists
 */
function isProductNameExists(name, excludeId = '') {
    if (!currentSeller?.id) return false;
    const sellerProducts = Products[`Seller${currentSeller.id}`];
    if (!sellerProducts) return false;
    return Object.entries(sellerProducts).some(([id, product]) =>
        product.name.trim().toLowerCase() === name.trim().toLowerCase() && id !== excludeId
    );
}

/**
 * Validates a form field and displays errors
 * @param {string} fieldName - Field to validate
 * @param {any} value - Field value
 * @returns {boolean} True if valid
 */
function validateField(fieldName, value) {
    const input = inputs[fieldName];
    if (!input) return false;

    let errorElement = input.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains("error-message")) {
        errorElement = document.createElement("div");
        errorElement.classList.add("error-message", "w-100");
        errorElement.style.color = "red";
        errorElement.style.fontSize = "0.9em";
        input.parentNode.insertBefore(errorElement, input.nextSibling);
    }

    const optionalFields = ["offer"];
    const isOptional = optionalFields.includes(fieldName);

    let isValid;
    if (fieldName === "image") {
        isValid = validationRules.image(value);
    } else {
        const isEmpty = !value || (typeof value === 'string' && value.trim() === "");
        isValid = isEmpty && isOptional ? true : validationRules[fieldName](value);
    }

    fieldStates[fieldName] = isValid;
    updateSaveButtonState();

    if (!isValid) {
        input.style.boxShadow = "0 0 5px red";
        errorElement.textContent = (!value || (typeof value === 'string' && value.trim() === "")) && !isOptional
            ? errorMessages[fieldName].required
            : errorMessages[fieldName].invalid;
        return false;
    } else {
        input.style.boxShadow = "0 0 5px green";
        errorElement.textContent = "";
        return true;
    }
}

/**
 * Validates field and tracks validation state
 * @param {string} fieldName - Field name
 * @param {any} value - Field value
 */
function validateAndTrack(fieldName, value) {
    validateField(fieldName, value);
}

/**
 * Updates save button state based on validation
 */
function updateSaveButtonState() {
    const currentImages = imagePreview.querySelectorAll('.img-wrapper').length;
    const hasImages = currentImages > 0;
    fieldStates.image = hasImages;

    if (!isEditMode) {
        saveBtn.disabled = !Object.values(fieldStates).every(Boolean);
    } else {
        const hasChanges = Object.keys(fieldStates).some(field => {
            const input = inputs[field];
            let currentValue;

            if (field === "image") {
                currentValue = collectImagesFromPreview().join(",");
                const originalValue = (originalProductData.images || []).join(",");
                return currentImages > 0 && currentValue !== originalValue;
            } else {
                currentValue = input.value.trim();
                let originalValue = originalProductData[field] ?? "";
                if (["price", "stock", "offer"].includes(field)) {
                    currentValue = parseFloat(currentValue) || 0;
                    originalValue = parseFloat(originalValue) || 0;
                }
                return currentValue !== originalValue;
            }
        });

        saveBtn.disabled = !hasChanges;
    }
    updateImageCounter();
}

/**
 * Updates status field based on stock value
 * @param {string} stockValue - Stock value to evaluate
 */
function updateStatusBasedOnStock(stockValue) {
    const stockNum = parseInt(stockValue, 10);

    if (!isNaN(stockNum)) {
        if (stockNum === 0) {
            inputs.status.value = "out of stock";
        } else if (stockNum >= 1 && stockNum <= 20) {
            inputs.status.value = "low stock";
        } else if (stockNum >= 21) {
            inputs.status.value = "in stock";
        }
    } else {
        inputs.status.value = "";
    }

    const statusValue = inputs.status.value;
    fieldStates.status = !!statusValue && validationRules.status(statusValue);
    updateSaveButtonState();
}

/**
 * Generates a new product ID
 * @param {string} sellerId - Seller ID to include in product ID
 * @returns {string} Generated product ID
 */
function generateProductId(sellerId) {
    const sellerProducts = Products[`Seller${sellerId}`] || {};

    let maxId = 0;
    Object.keys(sellerProducts).forEach(id => {
        const match = id.match(/P_\d+_(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxId) maxId = num;
        }
    });

    const newIdNum = maxId + 1;
    return `P_${sellerId}_${newIdNum.toString()}`;
}

/**
 * Adds image to preview area with tracking
 * @param {string} src - Image source URL
 */
function addImageToPreview(src) {
    // Check current image count
    const currentImages = imagePreview.querySelectorAll('.img-wrapper').length;
    if (currentImages >= 5) {
        showToast('You can upload maximum 5 images', 'warning');
        return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "img-wrapper d-inline-block position-relative me-2";
    wrapper.dataset.imageId = Date.now(); // Unique ID for each image

    const img = document.createElement("img");
    img.src = src;
    img.className = "img-thumbnail";
    img.style.maxHeight = "100px";

    const removeBtn = document.createElement("button");
    removeBtn.innerHTML = "×";
    removeBtn.type = "button";
    removeBtn.className = "btn btn-sm btn-danger position-absolute top-0 end-0";
    removeBtn.onclick = () => {
        wrapper.remove();
        validateAndTrack('image', inputs.image);
        updateSaveButtonState();
        // Clear file input if no images left
        if (imagePreview.querySelectorAll('.img-wrapper').length === 0) {
            inputs.image.value = '';
        }
    };

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    imagePreview.appendChild(wrapper);
    updateImageCounter();
}

/**
 * Collects images from preview area
 * @returns {Array} Array of image URLs
 */
function collectImagesFromPreview() {
    return Array.from(imagePreview.querySelectorAll("img")).map(img => img.src);
}

/**
 * Saves product to localStorage
 * @returns {Object} Contains product ID, edit status, and product data
 */
async function saveProductToLocalStorage() {
    if (!currentSeller?.id) throw new Error("Current seller not found");
    const sellerId = currentSeller.id;
    const sellerKey = `Seller${sellerId}`;
    const sellerProducts = Products[sellerKey] || {};

    const isEdit = !!inputs.id.value;
    const productId = isEdit ? inputs.id.value : generateProductId(sellerId);

    const images = collectImagesFromPreview();
    const price = parseFloat(inputs.price.value);
    const offer = parseInt(inputs.offer.value) || 0;
    const finalPrice = offer > 0 ? (price * (1 - offer / 100)).toFixed(2) : price.toFixed(2);
    const stock = parseInt(inputs.stock.value);

    const newProduct = {
        sellerId: currentSeller.id,
        id: productId,
        images,
        name: inputs.name.value.trim(),
        description: inputs.description.value.trim(),
        category: inputs.category.value,
        price: price,
        priceAfterOffer: finalPrice,
        offer: offer,
        stock: stock,
        status: inputs.status.value,
        visibility: isEdit ? (sellerProducts[productId]?.visibility ?? true) : true,
        createdAt: isEdit ? (sellerProducts[productId]?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        totalSales: isEdit ? (sellerProducts[productId]?.totalSales || 0) : 0,
        rate: isEdit ? (sellerProducts[productId]?.rate || 0) : 0
    };

    if (isEdit) {
        Object.assign(sellerProducts[productId], newProduct);
    } else {
        sellerProducts[productId] = newProduct;
    }

    Products[sellerKey] = sellerProducts;
    localStorage.setItem("oldProducts", JSON.stringify(Products));

    return { productId, isEdit, product: sellerProducts[productId] };
}

/**
 * Refreshes table row with updated product data
 * @param {Object} product - Product data to display
 */
function refreshRow(product) {
    const row = document.querySelector(`tr[data-product-id="${product.id}"]`);
    if (!row) return;

    const finalPrice = product.offer > 0
        ? (product.price * (1 - product.offer / 100)).toFixed(2)
        : product.price.toFixed(2);

    // Update product name and image
    row.querySelector('td:nth-child(3) span').textContent = product.name;
    if (product.images?.length > 0) {
        row.querySelector('td:nth-child(3) img')?.setAttribute("src", product.images[0]);
    }

    // Update category
    row.querySelector('td:nth-child(4)').textContent = product.mainCategory || product.category;

    // Update price display
    row.querySelector('td:nth-child(5)').innerHTML =
        product.offer > 0
            ? `<span class="original-price text-muted me-1">$${product.price.toFixed(2)}</span>`
            : `<span class="fw-semibold">$${product.price.toFixed(2)}</span>`;

    // Update offer display
    row.querySelector('td:nth-child(6)').innerHTML =
        product.offer > 0
            ? `<span class="offer-badge">${product.offer}%</span>`
            : '<span class="text-muted small">No offer</span>';

    // Update final price
    row.querySelector('td:nth-child(7)').textContent = `$${finalPrice}`;

    // Update stock
    row.querySelector('td:nth-child(8)').textContent = product.stock;

    // Update status
    const statusCell = row.querySelector('td:nth-child(9) .status-badge');
    statusCell.textContent = product.status || (product.stock > 20 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock');
    statusCell.className = `status-badge ${product.stock > 20 ? 'status-in_stock' :
        product.stock > 0 ? 'status-low_stock' : 'status-out_of_stock'
        }`;
}

/**
 * Updates the image counter display showing current/max images
 * - Displays current number of images uploaded (0-5)
 * - Shows visual feedback when maximum limit is reached
 * - Updates counter element text and styling
 * Called whenever images are added/removed from preview
 */
function updateImageCounter() {
    // Get current number of previewed images
    const current = imagePreview.querySelectorAll('.img-wrapper').length;
    const counterElement = document.getElementById('imageCounter');

    // Only proceed if counter element exists in DOM
    if (counterElement) {
        // Update counter text (e.g. "3/5 images selected")
        counterElement.textContent = `${current}/5 images selected`;

        // Apply visual feedback when limit reached
        if (current >= 5) {
            counterElement.classList.add('text-danger');  // Red when full
            counterElement.classList.remove('text-muted');
        } else {
            counterElement.classList.remove('text-danger');
            counterElement.classList.add('text-muted');   // Gray when available
        }
    }
}
// #endregion

// #region //zone === Event Bindings ===
// Field mapping for event handling
const fieldMap = {
    image: { element: inputs.image, getValue: el => el.files },
    name: { element: inputs.name, getValue: el => el.value },
    description: { element: inputs.description, getValue: el => el.value },
    category: { element: inputs.category, getValue: el => el.value },
    price: { element: inputs.price, getValue: el => el.value },
    offer: { element: inputs.offer, getValue: el => el.value },
    stock: { element: inputs.stock, getValue: el => el.value },
    status: { element: inputs.status, getValue: el => el.value }
};

// Set up event listeners for form validation
for (const [fieldName, fieldInfo] of Object.entries(fieldMap)) {
    const eventType = fieldInfo.element.tagName === "SELECT" ? "change" : "input";
    fieldInfo.element.addEventListener(eventType, e => {
        const value = fieldInfo.getValue(e.target);
        if (fieldName === "stock") updateStatusBasedOnStock(value);
        validateAndTrack(fieldName, fieldName === 'image' ? e.target : value);
        if (fieldName === "stock") validateAndTrack("status", inputs.status.value);
    });
}

// Image input handling
inputs.image.addEventListener("change", function () {
    const maxFiles = parseInt(this.dataset.maxFiles) || 5;
    const currentImages = imagePreview.querySelectorAll('.img-wrapper').length;
    const remainingSlots = maxFiles - currentImages;

    if (this.files.length > remainingSlots) {
        showToast(`You can't add more than 5 image(s)`, 'danger');
        this.value = '';
        return;
    }

    let validImages = true;
    Array.from(this.files).forEach(file => {
        if (!file.type.match("image.*") || file.size > (2 * 1024 * 1024)) {
            showToast(`File "${file.name}" is invalid or exceeds size limit`, 'danger');
            validImages = false;
            return;
        }

        const reader = new FileReader();
        reader.onload = e => addImageToPreview(e.target.result);
        reader.readAsDataURL(file);
    });

    if (!validImages) this.value = '';
    validateAndTrack('image', this);
});

// Modal close handlers
document.getElementById('productModal').addEventListener('hide.bs.modal', () => {
    if (document.activeElement && document.activeElement.classList.contains('btn-close')) {
        document.activeElement.blur();
    }
});

document.getElementById('productModal').addEventListener('hidden.bs.modal', () => {
    productForm.reset();
    imagePreview.innerHTML = "";
    inputs.status.value = "";
    document.getElementById("productId").value = '';

    // Reset validation states
    Object.keys(fieldStates).forEach(field => {
        fieldStates[field] = false;
        const input = inputs[field];
        if (input) {
            input.style.boxShadow = "";
            const errorElement = input.nextElementSibling;
            if (errorElement && errorElement.classList.contains("error-message")) {
                errorElement.textContent = "";
            }
        }
    });

    isEditMode = false;
    originalProductData = {};
    document.getElementById("modalTitle").textContent = "Add New Product";
    saveBtn.disabled = true;
    if (lastTriggerButton) {
        lastTriggerButton.focus();
    }
    updateImageCounter();
});

// Form submission handler
saveBtn.disabled = true;
productForm.addEventListener("submit", async e => {
    e.preventDefault();

    try {
        const { productId, isEdit, product } = await saveProductToLocalStorage();

        if (isEdit) {
            refreshRow(product);
        } else {
            addProductRow(product);
        }

        showToast(`Product ${productId} ${isEdit ? 'updated' : 'added'} successfully!`, 'success');

        productForm.reset();
        inputs.status.value = "";
        imagePreview.innerHTML = "";
        document.getElementById("modalTitle").textContent = "Add New Product";

        isEditMode = false;
        originalProductData = {};

        document.activeElement.blur();
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
    } catch (error) {
        console.error("Error saving product:", error);
        showToast("Failed to save product. Please try again.", "danger");
    }
});
// #endregion

// #endregion //zone === Product Form Functionality ===