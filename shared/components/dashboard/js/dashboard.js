// #region // zone ===== Initialization =====
/**
 * Main initialization when DOM is fully loaded
 * - Checks authentication
 * - Sets up UI based on user role
 * - Loads default view
 * - Sets up event listeners
 */

const currentUser = getLocalData("userData");

document.addEventListener("DOMContentLoaded", function () {
    // #region ===== Authentication Check =====
    if (!currentUser) {
        alert("User Not Found");
        window.location.href = window.location.origin + '/login/login.html';
        return;
    }
    // #endregion

    // #region ===== UI Setup =====
    setDashboardUI(currentUser);
    loadCommonAssets(currentUser.role || "seller");
    // #endregion

    // #region ===== Load Default View =====
    const lastView = localStorage.getItem('lastView');
    const defaultView = Array.isArray(currentUser.tabs) ? currentUser.tabs[0].fileName : "dashboard";
    loadView(lastView || defaultView);
    // #endregion

    // #region ===== Event Listeners =====
    setupEventListeners();
    // #endregion
});
// #endregion // zone ===== Initialization =====

// #region // zone ===== Reusable Data Functions =====
/**
 * Generic function to get and parse any data from localStorage
 * @param {string} key - The localStorage key
 * @returns {Object|null} Parsed data or null if not found/invalid
 */
function getLocalData(key) {
    const data = localStorage.getItem(key);
    if (!data) {
        console.warn(`No data found for key: ${key}`);
        return null;
    }

    try {
        const parsed = JSON.parse(data);

        // Handle empty object or empty array
        if (
            (typeof parsed === "object" && Object.keys(parsed).length === 0) ||
            (Array.isArray(parsed) && parsed.length === 0)
        ) {
            console.warn(`Data for key "${key}" is empty`);
        }

        return parsed;
    } catch (error) {
        console.error(`Failed to parse data for key: ${key}`, error);
        return null;
    }
}
// #endregion // zone ===== Reusable Data Functions =====

// #region // zone ===== UI Functions =====
/**
 * Sets up dashboard UI based on user role
 * @param {Object} currentUser - User data object
 */
function setDashboardUI(currentUser) {
    // Role badge styling
    const roleColors = {
        admin: 'bg-danger',
        seller: 'bg-warning text-dark',
        customer: 'bg-success'
    };

    const roleBadge = document.getElementById('user-role');
    roleBadge.textContent = currentUser.role;
    roleBadge.className = `badge ${roleColors[currentUser.role] || 'bg-secondary'}`;

    loadSidebarMenu();
}

/**
 * Loads sidebar menu items from user data
 */
function loadSidebarMenu() {
    const sidebarMenu = document.getElementById('sidebar-menu');
    sidebarMenu.innerHTML = '';

    const tabs = Array.isArray(currentUser.tabs) ? currentUser.tabs : [];

    if (!tabs.length) {
        sidebarMenu.innerHTML = '<li>No tabs found</li>';
        return;
    }

    // Create menu items for each tab
    tabs.forEach((tab, idx) => {
        const li = document.createElement('li');
        if (idx === 0) li.classList.add('active');

        li.innerHTML = `
            <a href="#" data-view="${tab.fileName || ''}">
                <i class="${tab.icon || 'fas fa-circle'}"></i>
                <span>${tab.pageName || 'Untitled'}</span>
            </a>
        `;
        sidebarMenu.appendChild(li);
    });

    // Add logout button
    const logoutLi = document.createElement('li');
    logoutLi.classList.add('logout-btn');
    logoutLi.innerHTML = `
        <a href="#" data-view="logout">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
        </a>
    `;
    sidebarMenu.appendChild(logoutLi);
}
// #endregion // zone ===== UI Functions =====

// #region // zone ===== Fetch System =====
/**
 * Loads common CSS/JS assets for the user's role
 * @param {string} role - User role (admin/seller/customer)
 */
function loadCommonAssets(role) {
    const commonCssPath = `/${role}/css/common.css`;
    // const commonJsPath = `/${role}/js/utils.js`;

    // 1. Load CSS with explicit error handling
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = commonCssPath;
    cssLink.dataset.assetType = 'common-css';
    console.log(`[Asset Loader] Successfully loaded common.css for ${role}`);

    cssLink.onerror = () => {
        console.warn(`[Asset Loader] Common CSS not found at: ${commonCssPath}`);
        // Optional: Load fallback CSS or apply default styles
    };

    document.head.appendChild(cssLink);

    // // 2. Load JS with enhanced error reporting
    // loadScript(commonJsPath)
    //     .then(() => {
    //         console.log(`[Asset Loader] Successfully loaded utils.js for ${role}`);
    //     })
    //     .catch((error) => {
    //         console.warn(`[Asset Loader] Failed to load utils.js for ${role}:`, error.message);
    //         // Optional: Load fallback utilities or polyfills
    //     });
}

/**
 * Loads a view and its assets
 * @param {string} viewName - Name of the view to load
 */
function loadView(viewName) {
    if (!viewName) {
        console.error('No view name provided');
        return;
    }

    updateDashboardTitle(viewName);
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
        console.error('Content area not found');
        return;
    }

    // Show loading spinner
    contentArea.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';

    if (!currentUser) {
        contentArea.innerHTML = '<div class="alert alert-danger">User data not found</div>';
        return;
    }

    const role = currentUser?.role || 'customer';
    const viewPath = `/${(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') ? 'admin' : currentUser?.role || 'customer'}/${viewName}.html`;
    const pageStylePath = `/${(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') ? 'admin' : currentUser?.role || 'customer'}/css/${viewName}.css`;
    const pageScriptPath = `/${(currentUser?.role === 'admin' || currentUser?.role === 'superadmin') ? 'admin' : currentUser?.role || 'customer'}/js/${viewName}.js`;


    fetch(viewPath)
        .then(res => {
            if (!res.ok) throw new Error('Failed to load page');
            return res.text();
        })
        .then(html => {
            contentArea.innerHTML = html;
            loadViewAssets(pageStylePath, pageScriptPath);
            updateActiveMenu(viewName);
        })
        .catch(error => {
            console.error('Error loading view:', error);
            contentArea.innerHTML = `<div class="alert alert-danger">Error loading ${viewName}: ${error.message}</div>`;
            updateActiveMenu(viewName);
        });
}

/**
 * Helper to load a script
 * @param {string} src - Script path
 * @returns {Promise} 
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.dataset.assetType = 'common-js';

        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Script load failed: ${src}`));

        document.body.appendChild(script);
    });
}

/**
 * Loads view-specific assets
 * @param {string} pageStylePath - CSS path
 * @param {string} pageScriptPath - JS path
 */
function loadViewAssets(pageStylePath, pageScriptPath) {
    // Remove old assets
    document.querySelectorAll('[data-view-asset="page"]').forEach(el => el.remove());

    // Load new CSS if exists
    if (pageStylePath) {
        const pageStyle = document.createElement('link');
        pageStyle.rel = 'stylesheet';
        pageStyle.href = pageStylePath;
        pageStyle.dataset.viewAsset = 'page';
        document.head.appendChild(pageStyle);
    }

    // Load new JS if exists
    if (pageScriptPath) {
        loadScript(pageScriptPath).catch(console.error);
    }
}

/**
 * Updates active menu item in sidebar
 * @param {string} viewName - Current view name
 */
function updateActiveMenu(viewName) {
    document.querySelectorAll('#sidebar-menu li').forEach(li => {
        li.classList.remove('active');
        const link = li.querySelector('a');
        if (link && link.dataset.view === viewName) {
            li.classList.add('active');
        }
    });
}

/**
 * Updates dashboard title based on current view
 * @param {string} viewName - Current view name
 */
function updateDashboardTitle(viewName) {
    const tabs = Array.isArray(currentUser.tabs) ? currentUser.tabs : [];
    const tab = tabs.find(t => (t.fileName || '').toLowerCase() === viewName.toLowerCase());
    document.getElementById('dashboard-title').textContent = tab ? tab.pageName : 'Dashboard';
}
// #endregion // zone ===== Fetch System =====

// #region // zone ===== Event Handlers =====
/**
 * Sets up main event listeners
 */
function setupEventListeners() {
    // Sidebar menu click handler
    document.getElementById('sidebar-menu').addEventListener('click', function (e) {
        const link = e.target.closest('a');
        if (!link) return;

        e.preventDefault();

        // Handle logout
        if (link.closest('li').classList.contains('logout-btn')) {
            localStorage.removeItem('userData');
            localStorage.removeItem('lastView');
            window.location.href = window.location.origin + '/login/login.html';
            return;
        }

        // Handle view change
        if (link.dataset.view) {
            localStorage.setItem('lastView', link.dataset.view);
            loadView(link.dataset.view);
            location.reload();
        }
    });
}
// #endregion // zone ===== Event Handlers =====

// #region // zone ===== Reusable Notification System =====
/**
 * Shows a Bootstrap toast notification
 * @param {string} message - Message to display
 * @param {string} type - Bootstrap color class (primary, danger, etc.)
 * @param {number} delay - Time in ms before auto-hiding
 */
function showToast(message, type = "primary", delay = 2000) {
    const toastEle = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');

    if (!toastEle || !toastMessage) {
        console.error('Toast elements not found!');
        return;
    }

    // Set styling and content
    toastEle.className = `toast align-items-center text-white bg-${type} border-0`;
    toastMessage.textContent = message;

    // Show the toast
    new bootstrap.Toast(toastEle, { delay, animation: true }).show();
}
// #endregion // zone ===== Reusable Notification System =====