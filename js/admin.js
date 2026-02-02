
// --- STABILITY UTILITIES ---
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

const debouncedRefreshProducts = debounce(() => {
    if (document.getElementById('products-table')) refreshProducts();
}, 250);

const debouncedRefreshDashboard = debounce(() => {
    if (document.getElementById('total-revenue')) refreshDashboard();
}, 250);

const debouncedRefreshOrders = debounce(() => {
    if (document.getElementById('orders-table')) refreshOrders();
}, 250);

// Toast Notification System for Admin
function showToast(message, type = 'info', title = '') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        info: '<i class="fas fa-info-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>'
    };

    if (!title) {
        const lang = localStorage.getItem('elsharkawy_lang') || 'ar';
        if (type === 'success') title = lang === 'ar' ? 'تم بنجاح' : 'Success';
        if (type === 'error') title = lang === 'ar' ? 'خطأ' : 'Error';
        if (type === 'info') title = lang === 'ar' ? 'تنبيه' : 'Info';
        if (type === 'warning') title = lang === 'ar' ? 'تحذير' : 'Warning';
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer; color:#999; margin-right:10px;">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}
window.showToast = showToast;

function injectConfirmModal() {
    if (document.getElementById('custom-confirm-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'custom-confirm-modal';
    modal.style.cssText = `
        display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(5px); z-index: 100000;
        align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease;
    `;
    modal.innerHTML = `
        <div class="confirm-content" style="
            background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 400px;
            text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); font-family: 'Cairo', sans-serif;
        ">
            <div style="width: 60px; height: 60px; background: #fdf2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; color: #e74c3c; font-size: 1.8rem;">
                <i class="fas fa-question"></i>
            </div>
            <h3 id="confirm-title" style="margin-bottom: 15px; color: #2c3e50; font-size: 1.4rem;">تأكيد</h3>
            <p id="confirm-message" style="margin-bottom: 20px; color: #555; font-size: 1.15rem; line-height: 1.6; font-weight: 800;">Message here</p>
            <input type="number" id="confirm-input" style="display: none; width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #ddd; margin-bottom: 20px; font-family: inherit; font-size: 1rem; text-align: center; outline: none; transition: border-color 0.3s;" placeholder="...">
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="confirm-yes" style="background: #2c3e50; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 1; font-family: inherit; transition: all 0.2s;">نعم</button>
                <button id="confirm-no" style="background: transparent; color: #7f8c8d; border: 1px solid #dfe6e9; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; flex: 1; font-family: inherit; transition: all 0.2s;">إلغاء</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    const content = modal?.querySelector('.confirm-content');
    if (modal && content) {
        modal.style.opacity = '0';
        content.style.transform = 'scale(0.9)';
        setTimeout(() => {
            modal.style.display = 'none';
            const btnNo = modal.querySelector('#confirm-no');
            if (btnNo) btnNo.style.display = 'block';
        }, 300);
    }
}

window.showAlert = function (message, type = 'info', onOk) {
    injectConfirmModal();
    const modal = document.getElementById('custom-confirm-modal');
    const content = modal.querySelector('.confirm-content');
    const msgEl = modal.querySelector('#confirm-message');
    const btnYes = modal.querySelector('#confirm-yes');
    const btnNo = modal.querySelector('#confirm-no');
    const iconContainer = modal.querySelector('.confirm-content > div:first-child');

    const lang = localStorage.getItem('elsharkawy_lang') || 'ar';
    const t = { title: lang === 'ar' ? 'تنبيه' : 'Alert', ok: lang === 'ar' ? 'موافق' : 'OK' };

    modal.querySelector('#confirm-title').innerText = t.title;
    btnYes.innerText = t.ok;
    btnNo.style.display = 'none';
    msgEl.innerText = message;

    if (type === 'error') {
        iconContainer.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        iconContainer.style.background = '#fdeaea'; iconContainer.style.color = '#e74c3c';
    } else if (type === 'success') {
        iconContainer.innerHTML = '<i class="fas fa-check-circle"></i>';
        iconContainer.style.background = '#eafaf1'; iconContainer.style.color = '#2ecc71';
    } else {
        iconContainer.innerHTML = '<i class="fas fa-info-circle"></i>';
        iconContainer.style.background = '#eaf4fa'; iconContainer.style.color = '#3498db';
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => { modal.style.opacity = '1'; content.style.transform = 'scale(1)'; });

    const newYes = btnYes.cloneNode(true);
    btnYes.parentNode.replaceChild(newYes, btnYes);
    newYes.onclick = () => { closeConfirm(); if (onOk) onOk(); };
    modal.onclick = (e) => { if (e.target === modal) { closeConfirm(); if (onOk) onOk(); } };
};

window.showConfirm = function (message, callback) {
    return new Promise((resolve) => {
        injectConfirmModal();
        const modal = document.getElementById('custom-confirm-modal');
        const content = modal.querySelector('.confirm-content');
        const msgEl = modal.querySelector('#confirm-message');
        const btnYes = modal.querySelector('#confirm-yes');
        const btnNo = modal.querySelector('#confirm-no');
        const iconContainer = modal.querySelector('.confirm-content > div:first-child');

        const lang = localStorage.getItem('elsharkawy_lang') || 'ar';
        const t = { title: lang === 'ar' ? 'تأكيد الإجراء' : 'Confirm', yes: lang === 'ar' ? 'نعم، متأكد' : 'Yes', no: lang === 'ar' ? 'إلغاء' : 'Cancel' };

        iconContainer.innerHTML = '<i class="fas fa-question-circle"></i>';
        iconContainer.style.background = '#fff8e1'; iconContainer.style.color = '#f39c12';

        modal.querySelector('#confirm-title').innerText = t.title;
        btnYes.innerText = t.yes; btnNo.innerText = t.no;
        btnNo.style.display = 'block'; msgEl.innerText = message;

        modal.style.display = 'flex';
        requestAnimationFrame(() => { modal.style.opacity = '1'; content.style.transform = 'scale(1)'; });

        const handleResponse = (result) => {
            closeConfirm();
            resolve(result);
            if (result && typeof callback === 'function') {
                callback();
            }
        };
        const newYes = btnYes.cloneNode(true); const newNo = btnNo.cloneNode(true);
        btnYes.parentNode.replaceChild(newYes, btnYes); btnNo.parentNode.replaceChild(newNo, btnNo);
        newYes.onclick = () => handleResponse(true); newNo.onclick = () => handleResponse(false);
        modal.onclick = (e) => { if (e.target === modal) handleResponse(false); };
    });
};

window.showPrompt = function (message, defaultValue = '') {
    return new Promise((resolve) => {
        injectConfirmModal();
        const modal = document.getElementById('custom-confirm-modal');
        const content = modal.querySelector('.confirm-content');
        const msgEl = modal.querySelector('#confirm-message');
        const inputEl = modal.querySelector('#confirm-input');
        const btnYes = modal.querySelector('#confirm-yes');
        const btnNo = modal.querySelector('#confirm-no');
        const iconContainer = modal.querySelector('.confirm-content > div:first-child');

        const lang = localStorage.getItem('elsharkawy_lang') || 'ar';
        const t = {
            title: lang === 'ar' ? 'إدخال بيانات' : 'User Input',
            yes: lang === 'ar' ? 'تأكيد' : 'Confirm',
            no: lang === 'ar' ? 'إلغاء' : 'Cancel'
        };

        if (iconContainer) {
            iconContainer.innerHTML = '<i class="fas fa-edit"></i>';
            iconContainer.style.background = '#e3f2fd';
            iconContainer.style.color = '#2196f3';
        }

        modal.querySelector('#confirm-title').innerText = t.title;
        btnYes.innerText = t.yes;
        btnYes.style.background = '#2c3e50';
        btnNo.innerText = t.no;
        btnNo.style.display = 'block';
        msgEl.innerText = message;

        // Show and setup input
        inputEl.style.display = 'block';
        inputEl.value = defaultValue;

        modal.style.display = 'flex';
        requestAnimationFrame(() => { modal.style.opacity = '1'; content.style.transform = 'scale(1)'; });

        const handleResponse = (result) => {
            const val = inputEl.value;
            inputEl.style.display = 'none';
            closeConfirm();
            resolve(result ? val : null);
        };

        const newYes = btnYes.cloneNode(true);
        const newNo = btnNo.cloneNode(true);
        btnYes.parentNode.replaceChild(newYes, btnYes);
        btnNo.parentNode.replaceChild(newNo, btnNo);

        newYes.onclick = () => handleResponse(true);
        newNo.onclick = () => handleResponse(false);
        modal.onclick = (e) => { if (e.target === modal) handleResponse(false); };

        inputEl.focus();
        inputEl.onkeyup = (e) => { if (e.key === 'Enter') handleResponse(true); };
    });
};

// Status Definitions & Helpers
const ORDER_STATUSES = [
    { id: 'Pending', label: '⏳ قيد الانتظار', color: '#f39c12', icon: 'fas fa-hourglass-start' },
    { id: 'Confirmed', label: '✅ مؤكد', color: '#3498db', icon: 'fas fa-check-circle' },
    { id: 'Shipped', label: '🚚 تم الشحن', color: '#9b59b6', icon: 'fas fa-shipping-fast' },
    { id: 'Delivered', label: '📦 تم التوصيل', color: '#27ae60', icon: 'fas fa-check-double' },
    { id: 'Archived', label: '📁 مؤرشف', color: '#95a5a6', icon: 'fas fa-archive' }
];

function getStatusInfo(statusId) {
    return ORDER_STATUSES.find(s => s.id === statusId) || ORDER_STATUSES[0];
}

function renderStatusDropdown(orderId, currentStatus, prefix = 'main') {
    const current = getStatusInfo(currentStatus);
    const uniqueId = `dropdown-${prefix}-${orderId}`;
    return `
        <div class="status-dropdown" id="${uniqueId}">
            <div class="status-trigger" onclick="toggleStatusDropdown('${orderId}', event, '${prefix}')" style="background: ${current.color};">
                <span>${current.label}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="status-menu">
                ${ORDER_STATUSES.map(s => `
                    <div class="status-option" onclick="updateStatusWithAnimation('${orderId}', '${s.id}', event, '${prefix}')">
                        <i class="${s.icon}"></i>
                        <span>${s.label.includes(' ') ? s.label.split(' ').slice(1).join(' ') : s.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function toggleStatusDropdown(orderId, event, prefix = 'main') {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const uniqueId = `dropdown-${prefix}-${orderId}`;

    // Close all other dropdowns
    document.querySelectorAll('.status-dropdown').forEach(d => {
        if (d.id !== uniqueId) d.classList.remove('active');
    });

    const dropdown = document.getElementById(uniqueId);
    if (dropdown) dropdown.classList.toggle('active');
}

async function updateStatusWithAnimation(orderId, newStatus, event, prefix = 'main') {
    if (event) event.stopPropagation();

    const uniqueId = `dropdown-${prefix}-${orderId}`;
    const dropdown = document.getElementById(uniqueId);
    if (!dropdown) return;

    dropdown.classList.remove('active');

    const trigger = dropdown.querySelector('.status-trigger');
    if (trigger) {
        trigger.style.opacity = '0.5';
        trigger.style.transform = 'scale(0.95)';
    }

    setTimeout(async () => {
        try {
            await db.updateOrderStatus(orderId, newStatus);
            showToast('تم تحديث حالة الطلب بنجاح', 'success');

            // Auto-refresh handled by database events generally, but manual refresh for speed
            const activeSection = document.querySelector('.content-section.active')?.id?.replace('section-', '');
            if (activeSection === 'dashboard') refreshDashboard();
            else if (activeSection === 'orders') refreshOrders();
        } catch (error) {
            console.error('Error updating status:', error);
            showToast('فشل في تحديث حالة الطلب', 'error');
            if (trigger) {
                trigger.style.opacity = '1';
                trigger.style.transform = 'scale(1)';
            }
        }
    }, 300);
}

// Export functions to window for onclick reachability
window.toggleStatusDropdown = toggleStatusDropdown;
window.updateStatusWithAnimation = updateStatusWithAnimation;

// Close dropdowns on click outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.status-dropdown')) {
        document.querySelectorAll('.status-dropdown.active').forEach(d => {
            d.classList.remove('active');
        });
    }
});

// --- Navigation Logic ---
function showSection(sectionId) {
    // 1. Hide all sections
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));

    // 2. Show target section
    const target = document.getElementById(`section-${sectionId}`);
    if (target) target.classList.add('active');

    // 3. Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[onclick="showSection('${sectionId}')"]`);
    if (navItem) navItem.classList.add('active');

    // 4. Close mobile sidebar if open
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        toggleSidebar();
    }

    // 5. Init section data
    if (sectionId === 'dashboard' && typeof refreshDashboard === 'function') refreshDashboard();
    if (sectionId === 'products' && typeof refreshProducts === 'function') refreshProducts();
    if (sectionId === 'orders' && typeof refreshOrders === 'function') refreshOrders();
    if (sectionId === 'customers' && typeof refreshCustomers === 'function') refreshCustomers();
    if (sectionId === 'settings' && typeof loadSettings === 'function') loadSettings();
    if (sectionId === 'staff' && typeof refreshStaffTable === 'function') refreshStaffTable();
    if (sectionId === 'reviews' && typeof refreshReviews === 'function') refreshReviews();
}

function initDashboard() {
    showSection('dashboard');
    if (typeof refreshDashboard === 'function') refreshDashboard();
    if (typeof checkNotifications === 'function') checkNotifications();
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainDetails = document.querySelector('.main-content');
    if (sidebar) sidebar.classList.toggle('active');
    if (mainDetails) mainDetails.classList.toggle('shifted');
}

// Export Navigation
window.showSection = showSection;
window.initDashboard = initDashboard;
window.toggleSidebar = toggleSidebar;

// Global Variables
let quill;
let termsEditor, shippingEditor, refundEditor, privacyEditor;
let productsCurrentPage = 1;
const productsPerPage = 15;

document.addEventListener('DOMContentLoaded', async () => {
    if (!db.isAdminLoggedIn()) {
        window.location.href = '../admin-login';
        return;
    }

    // --- Database Connection Monitoring (Diagnostic Mode) ---
    let fbStatus = "checking"; // "online", "offline", "checking", "error"
    let cfStatus = "checking";
    let fbError = "";
    let cfError = "";

    const updateConnectionUI = () => {
        const statusEl = document.getElementById('db-connection-status');
        if (!statusEl) return;

        if (window.connectionTimeout) clearTimeout(window.connectionTimeout);

        const getStatusBadge = (status, label, error) => {
            const isOnline = status === "online";
            const isChecking = status === "checking";

            const color = isOnline ? '#27ae60' : (status === "error" || status === "offline") ? '#e74c3c' : '#f39c12';
            const bg = isOnline ? '#f1fcf6' : (status === "checking" ? '#fffaf0' : '#fff5f5');
            const icon = isOnline ? 'fa-check-circle' : isChecking ? 'fa-sync fa-spin' : 'fa-times-circle';

            return `<div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                <div class="status-pill" style="display: flex; align-items: center; gap: 8px; background: ${bg}; color: ${color}; padding: 6px 14px; border-radius: 50px; font-size: 0.75rem; font-weight: 900; border: 1px solid ${color}30; box-shadow: 0 2px 5px rgba(0,0,0,0.03);">
                    <i class="fas ${icon}" style="font-size: 0.85rem;"></i>
                    <span>${label}:</span>
                    <span style="border-right: 1px solid ${color}30; height: 10px; margin: 0 4px;"></span>
                    <span>${isOnline ? 'متصل' : isChecking ? 'جارِ الفحص' : 'فشل الاتصال'}</span>
                </div>
                ${error && !isOnline ? `<div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.6rem; color: #e74c3c; padding-right: 10px;">${error}</div>` : ''}
            </div>`;
        };

        statusEl.style.display = 'flex';
        statusEl.style.gap = '10px';
        statusEl.style.flexWrap = 'wrap';
        statusEl.style.direction = 'rtl';
        statusEl.innerHTML = `
            ${getStatusBadge(fbStatus, 'الطلبات (Firebase)', fbError)}
            ${getStatusBadge(cfStatus, 'المنتجات (Cloudflare)', cfError)}
        `;
    };

    // Firebase Monitoring (Self-Healing Mode)
    const monitorFirebase = () => {
        try {
            if (typeof firebase === 'undefined') return false;

            // Ensure database is available
            if (typeof window.database === 'undefined') {
                if (typeof firebase !== 'undefined' && typeof firebase.database === 'function') {
                    if (firebase.apps.length === 0 && typeof firebaseConfig !== 'undefined') {
                        firebase.initializeApp(firebaseConfig);
                    }
                    if (firebase.apps.length > 0) {
                        window.database = firebase.database();
                    }
                }
            }

            const dbInstance = window.database || (typeof firebase !== 'undefined' && firebase.apps.length > 0 && typeof firebase.database === 'function' ? firebase.database() : null);

            if (dbInstance) {
                const connectedRef = dbInstance.ref(".info/connected");
                connectedRef.on("value", (snap) => {
                    fbStatus = snap.val() === true ? "online" : "offline";
                    fbError = snap.val() === true ? "" : "جاري البحث عن إشارة...";
                    updateConnectionUI();
                });
                return true;
            }
            return false;
        } catch (e) {
            console.error("Firebase Internal Error:", e);
            fbStatus = "error";
            fbError = "خطأ داخلي: " + e.message;
            updateConnectionUI();
            return true;
        }
    };

    if (!monitorFirebase()) {
        fbStatus = "checking";
        fbError = "جاري البدء الذكي...";
        updateConnectionUI();

        let retryCount = 0;
        const retryInterval = setInterval(() => {
            retryCount++;
            if (monitorFirebase() || retryCount > 10) {
                clearInterval(retryInterval);
                if (retryCount > 10 && fbStatus !== "online") {
                    fbStatus = "error";
                    fbError = "عطل في نظام الطلبات";
                    updateConnectionUI();
                }
            }
        }, 1000);
    }

    // Cloudflare Monitoring
    const checkCloudflareStatus = async () => {
        if (typeof HYBRID_CONFIG === 'undefined' || !HYBRID_CONFIG.enabled) {
            cfStatus = "offline";
            cfError = "نظام Hybrid معطل";
            updateConnectionUI();
            return;
        }

        try {
            // Use GET instead of HEAD for better compatibility, but limit data
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(`${HYBRID_CONFIG.workerUrl}/api/products`, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });

            clearTimeout(timeoutId);
            cfStatus = res.ok ? "online" : "offline";
            if (!res.ok) cfError = `HTTP ${res.status}`;
            else cfError = "";
        } catch (e) {
            cfStatus = "error";
            cfError = e.name === 'AbortError' ? "انتهت مهلة الطلب" : (e.message.includes('CORS') || e.message.includes('Failed to fetch')) ? "مشكلة في CORS أو الاتصال" : e.message;
        }
        updateConnectionUI();
    };

    updateConnectionUI();
    checkCloudflareStatus();
    setInterval(checkCloudflareStatus, 60000); // Check every minute
    // ----------------------------------------------------

    applyPermissions();

    // Init Hybrid Sync (Wait for data before showing UI)
    if (typeof HybridSystem !== 'undefined') {
        try {
            await HybridSystem.getProducts();
        } catch (e) {
            console.warn("Initial sync failed, using local data", e);
        }
    }

    // Determine start section
    const admin = db.getLoggedAdmin();
    const perms = admin.permissions || [];
    let startSection = 'dashboard';

    // If not super admin and no stats permission, maybe redirect to first allowed section
    if (!perms.includes('all') && !perms.includes('stats') && startSection === 'dashboard') {
        const map = {
            'products': 'products',
            'orders': 'orders',
            'customers': 'customers',
            'discounts': 'discounts',
            'settings': 'settings',
            'staff': 'settings',
            'shipping': 'settings'
        };
        for (const p of perms) {
            if (map[p]) {
                startSection = map[p];
                break;
            }
        }
    }

    showSection(startSection);
    initImageDropZone();

    // Initialize Quill Editor
    if (document.getElementById('p-desc-editor')) {
        quill = new Quill('#p-desc-editor', {
            theme: 'snow',
            placeholder: 'أدخل وصف المنتج بالتفصيل...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'direction': 'rtl' }],
                    [{ 'align': [] }],
                    ['link', 'clean']
                ]
            }
        });
        quill.format('direction', 'rtl');
        quill.format('align', 'right');
    }

    // Initialize Policy Editors
    const policyToolbar = [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'clean']
    ];

    if (document.getElementById('s-terms-editor')) {
        termsEditor = new Quill('#s-terms-editor', { theme: 'snow', modules: { toolbar: policyToolbar }, placeholder: 'الشروط والأحكام...' });
        termsEditor.format('direction', 'rtl');
        termsEditor.format('align', 'right');
    }
    if (document.getElementById('s-shipping-editor')) {
        shippingEditor = new Quill('#s-shipping-editor', { theme: 'snow', modules: { toolbar: policyToolbar }, placeholder: 'سياسة الشحن...' });
        shippingEditor.format('direction', 'rtl');
        shippingEditor.format('align', 'right');
    }
    if (document.getElementById('s-refund-editor')) {
        refundEditor = new Quill('#s-refund-editor', { theme: 'snow', modules: { toolbar: policyToolbar }, placeholder: 'سياسة الاسترجاع...' });
        refundEditor.format('direction', 'rtl');
        refundEditor.format('align', 'right');
    }
    if (document.getElementById('s-privacy-editor')) {
        privacyEditor = new Quill('#s-privacy-editor', { theme: 'snow', modules: { toolbar: policyToolbar }, placeholder: 'سياسة الخصوصية...' });
        privacyEditor.format('direction', 'rtl');
        privacyEditor.format('align', 'right');
    }


    // Initialize Product Form Handler
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const sizesStr = document.getElementById('p-sizes').value.trim();
            const sizes = sizesStr ? sizesStr.split(',').map(s => s.trim()) : [];

            const colorsStr = document.getElementById('p-color').value.trim();
            const colors = colorsStr ? colorsStr.split(',').map(c => c.trim()) : [];

            // Collect Variants
            const variants = [];
            let totalVariantQty = 0;
            let hasVariants = false;

            document.querySelectorAll('.variant-row').forEach(row => {
                const size = row.querySelector('.v-size').value.trim();
                const color = row.querySelector('.v-color').value.trim();
                const price = parseFloat(row.querySelector('.v-price').value);
                const qty = parseInt(row.querySelector('.v-qty').value) || 0;
                if ((size || color) && !isNaN(price)) {
                    variants.push({ size, color, price, quantity: qty });
                    totalVariantQty += qty;
                    hasVariants = true;
                }
            });

            const oldPriceVal = document.getElementById('p-old-price').value;
            let globalQty = parseInt(document.getElementById('p-qty').value) || 0;

            // SMART SYNC: If user explicitly set Total Qty to 0, force all variants to 0
            if (globalQty === 0 && hasVariants) {
                if (await showConfirm('هل تريد تصفير كمية جميع المقاسات لأنك جعلت الكمية الكلية 0؟')) {
                    variants.forEach(v => v.quantity = 0);
                    totalVariantQty = 0;
                } else {
                    // If they say no, revert global qty to the sum of variants
                    globalQty = totalVariantQty;
                    document.getElementById('p-qty').value = globalQty;
                    showToast('تم استعادة الكمية بناءً على مجموع المقاسات', 'info');
                    return; // Stop save to let them adjust manually
                }
            } else if (hasVariants) {
                // Otherwise normal behavior: Sum of variants overrides global field
                if (globalQty !== totalVariantQty) {
                    // Silent correction if it's not 0 (trust the sum)
                    globalQty = totalVariantQty;
                }
            }

            try {
                const nameEl = document.getElementById('p-name');
                const priceEl = document.getElementById('p-price');
                const qtyEl = document.getElementById('p-qty');
                const catEl = document.getElementById('p-category');

                if (!nameEl.value || !priceEl.value) {
                    showToast('يرجى التأكد من ملء الاسم والسعر', 'error');
                    return;
                }

                // Read isVisible value BEFORE creating the object
                const visibilityCheckbox = document.getElementById('p-visible');
                const isVisibleValue = visibilityCheckbox ? visibilityCheckbox.checked : true;

                console.log('🔍 Saving Product - isVisible checkbox value:', isVisibleValue);

                const newProduct = {
                    name: nameEl.value.trim(),
                    price: parseFloat(priceEl.value),
                    oldPrice: (oldPriceVal && !isNaN(parseFloat(oldPriceVal))) ? parseFloat(oldPriceVal) : null,
                    quantity: globalQty,
                    category: catEl.value,
                    sku: document.getElementById('p-sku').value.trim() || '', // Product Code/SKU
                    weight: 0.5, // Default Weight since UI is removed
                    color: colors,
                    size: sizes,
                    variants: variants,
                    images: currentProductImages,
                    image: currentProductImages[0] || '',
                    description: (quill && quill.root) ? quill.root.innerHTML : '',
                    isVisible: isVisibleValue,
                    archived: false
                };

                // Safety: Check Payload Size (Base64 images can be huge)
                const payloadSize = JSON.stringify(newProduct).length;
                if (payloadSize > 2000000) { // > 2MB
                    showToast('حجم بيانات المنتج كبير جداً! يقلل من عدد الصور أو جودتها.', 'error');
                    return;
                }

                if (editingProductId) {
                    newProduct.id = editingProductId;
                    const existingProduct = db.getProduct(editingProductId);
                    if (existingProduct) {
                        newProduct.archived = existingProduct.archived || false;
                        newProduct.sortOrder = existingProduct.sortOrder;
                        newProduct.lastUpdated = Date.now();
                    }
                }

                // Show loading state
                const submitBtn = e.target.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

                // Ensure timestamp is set fresh for this specific save event
                newProduct.lastUpdated = Date.now();

                // 1. Save Local & Firebase
                await db.saveProduct(newProduct, false);

                // 2. Sync to Cloudflare Hybrid System (CRITICAL - Don't close modal until this succeeds)
                if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
                    console.log('🔄 Syncing to Cloudflare...');
                    const cloudSync = await HybridSystem.saveProduct(newProduct);
                    if (!cloudSync) {
                        console.error('❌ Cloudflare sync failed!');
                        throw new Error("فشل الحفظ في السحابة. يرجى المحاولة مرة أخرى.");
                    }
                    console.log('✅ Successfully synced to Cloudflare');
                }

                closeProductModal();

                // Wait a moment before refreshing to ensure cloud sync completes
                setTimeout(() => {
                    refreshProducts();
                }, 500);

                showToast(editingProductId ? 'تم تحديث المنتج بنجاح! ✨' : 'تم إضافة المنتج بنجاح! ✨', 'success');

            } catch (error) {
                console.error('Save error:', error);
                if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
                    showToast('فشل الحفظ: ذاكرة المتصفح ممتلئة. يرجى حذف بعض المنتجات القديمة أو تقليل حجم الصور.', 'error');
                } else {
                    showToast('حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.', 'error');
                }
            } finally {
                const submitBtn = e.target.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'حفظ';
                }
            }
        });

        // ✨ NEW FEATURE: Press Enter to Save (Quick Save)
        productForm.addEventListener('keydown', (e) => {
            // Check if Enter was pressed (not Shift+Enter for new line)
            if (e.key === 'Enter' && !e.shiftKey) {
                // Get the focused element
                const activeElement = document.activeElement;

                // Don't trigger submit if we're in the Quill editor or a textarea
                if (activeElement &&
                    (activeElement.classList.contains('ql-editor') ||
                        activeElement.tagName === 'TEXTAREA')) {
                    return; // Let the editor handle Enter normally
                }

                // Trigger form submit
                e.preventDefault();
                productForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // Notification Logic
    if ("Notification" in window) {
        Notification.requestPermission();
    }

    // Track order count to detect new ones
    let lastOrderCount = db.getOrders().length;

    setInterval(() => {
        const currentOrders = db.getOrders();
        if (currentOrders.length > lastOrderCount) {
            // New Order Detected!
            const newOrdersCount = currentOrders.length - lastOrderCount;
            lastOrderCount = currentOrders.length;

            // 1. Play Sound (User's Custom 'Money' Sound)
            const audio = new Audio('../sound Efect/فلوس.mp3');
            audio.play().catch(e => {
                console.log('Audio playback waiting for interaction');
                document.addEventListener('click', () => audio.play(), { once: true });
            });

            // 2. Custom Toast for Mobile
            showToast(`🚀 طلب جديد! #${currentOrders[0].id.split('-').pop()}`, 'success');

            // 3. Browser Notification
            if (Notification.permission === "granted") {
                new Notification("متجر الشرقاوي", {
                    body: `💸 تم استقبال ${newOrdersCount} طلب جديد!`,
                    icon: '../images/logo-v2.png',
                    vibrate: [200, 100, 200]
                });
            }

            // 3. Update Badge immediately
            updateSidebarBadges();

            // 4. If current section is orders, refresh table
            const ordersSection = document.getElementById('section-orders');
            if (ordersSection && ordersSection.classList.contains('active')) {
                refreshOrders();
            }
        }
    }, 5000); // Check every 5 seconds

    // Listen for Cloud Updates (Using Debounce for Stability)
    window.addEventListener('productsUpdated', () => {
        debouncedRefreshProducts();
        debouncedRefreshDashboard();
    });

    window.addEventListener('ordersUpdated', () => {
        debouncedRefreshOrders();
        debouncedRefreshDashboard();
        updateSidebarBadges();
    });

    window.addEventListener('settingsUpdated', () => {
        if (document.getElementById('section-settings')?.classList.contains('active')) refreshSettings();
    });

    // Initialize Security (now with null checks)
    if (typeof initSecurity === 'function') initSecurity();

    // Bidirectional Sync for Main Price/Qty and First Variant
    const pPriceInput = document.getElementById('p-price');
    if (pPriceInput) {
        pPriceInput.addEventListener('input', () => {
            const firstVariantPrice = document.querySelector('#variants-container .variant-row:first-child .v-price');
            if (firstVariantPrice) firstVariantPrice.value = pPriceInput.value;
        });
    }

    const pQtyInput = document.getElementById('p-qty');
    if (pQtyInput) {
        pQtyInput.addEventListener('input', () => {
            const firstVariantQty = document.querySelector('#variants-container .variant-row:first-child .v-qty');
            if (firstVariantQty) firstVariantQty.value = pQtyInput.value;
            updateTotalQtyFromVariants();
        });
    }
});

function applyPermissions() {
    const admin = db.getLoggedAdmin();
    const perms = admin.permissions || [];
    const isSuper = perms.includes('all');

    const menuMap = {
        'products': 'products',
        'orders': 'orders',
        'customers': 'customers',
        'settings': 'settings',
        'stats': 'stats',
        'abandoned': 'orders',
        'discounts': 'discounts',
        'staff': 'settings', // Staff management requires settings permission
        'shipping': 'settings' // Shipping management requires settings permission
    };

    document.querySelectorAll('.menu-item').forEach(item => {
        const onClick = item.getAttribute('onclick');
        if (onClick) {
            const sectionMatch = onClick.match(/'([^']+)'/);
            if (!sectionMatch) return;
            const section = sectionMatch[1];
            if (section === 'dashboard') return;

            const reqPerm = menuMap[section];
            let shouldShow = isSuper || perms.includes(reqPerm);

            // استثناء: خيار "أمان التطبيق" يظهر فقط داخل تطبيق الموبايل
            if (section === 'app-security') {
                const isApp = window.self !== window.top;
                if (!isApp) shouldShow = false;
            }

            if (!shouldShow) {
                item.style.display = 'none';
            } else {
                item.style.display = 'flex';
            }
        }
    });
}

async function logout() {
    if (await showConfirm('هل أنت متأكد من تسجيل الخروج؟')) {
        db.logoutAdmin();
        window.location.href = '../admin-login';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function showSection(sectionId) {
    // Check Permission
    const admin = db.getLoggedAdmin();
    const perms = admin.permissions || [];
    const isSuper = perms.includes('all');

    const permMap = {
        'products': 'products',
        'orders': 'orders',
        'customers': 'customers',
        'settings': 'settings',
        'stats': 'stats',
        'abandoned': 'orders',
        'discounts': 'discounts',
        'staff': 'settings',
        'shipping': 'settings'
    };

    if (sectionId !== 'dashboard' && !isSuper && !perms.includes(permMap[sectionId])) {
        showAlert('ليس لديك صلاحية للوصول لهذا القسم', 'error');
        return;
    }

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const target = document.getElementById('section-' + sectionId);
    if (target) target.classList.add('active');

    // Update menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        const onClick = item.getAttribute('onclick');
        if (onClick && onClick.includes(`'${sectionId}'`)) {
            item.classList.add('active');
        }
    });

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }

    // Refresh data for the section
    if (sectionId === 'dashboard') refreshDashboard();
    if (sectionId === 'products') refreshProducts();
    if (sectionId === 'orders') refreshOrders();
    if (sectionId === 'customers') refreshCustomers();
    if (sectionId === 'settings') refreshSettings();
    if (sectionId === 'stats') refreshStats();
    if (sectionId === 'abandoned') refreshAbandonedCarts();
    if (sectionId === 'discounts') refreshDiscounts();
    if (sectionId === 'staff') refreshStaff();
    if (sectionId === 'shipping') refreshShipping();
    if (sectionId === 'moderation') refreshModeration();
    if (sectionId === 'app-security') refreshAppSecurity();
    if (sectionId === 'seo' && typeof initSEO === 'function') initSEO();

    updateSidebarBadges();
}

function updateSidebarBadges() {
    const orders = db.getOrders();
    const pendingCount = orders.filter(o => o.status === 'Pending' && !o.isRead).length;
    const badge = document.getElementById('orders-badge');

    if (badge) {
        if (pendingCount > 0) {
            badge.innerText = pendingCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function refreshDashboard() {
    const orders = db.getOrders();
    const products = db.getProducts();
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');

    // Update stats
    document.getElementById('total-orders').innerText = orders.length;
    document.getElementById('total-products').innerText = products.length;
    document.getElementById('total-customers').innerText = customers.length;

    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('total-revenue').innerText = revenue.toFixed(0) + ' ج.م';

    // Recent orders logic restored
    const recentTbody = document.getElementById('dashboard-orders-table');
    if (recentTbody) {
        recentTbody.innerHTML = '';
        const recentOrders = orders.filter(o => o.status !== 'Archived').reverse().slice(0, 5); // Latest 5 non-archived orders
        if (recentOrders.length === 0) {
            recentTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 1rem; color: #999;">لا توجد طلبات بعد</td></tr>';
        } else {
            recentOrders.forEach(o => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" disabled></td>
                    <td style="font-weight: bold;">#${o.id.split('-').pop()}</td>
                    <td>
                        <div style="font-weight: 600;">${new Date(o.date).toLocaleDateString('ar-EG')}</div>
                        <small style="color: #7f8c8d; font-size: 0.8rem; display: block; margin-top: 2px;">
                            <i class="far fa-clock" style="font-size: 0.75rem;"></i> ${new Date(o.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </small>
                    </td>
                    <td>${o.customer?.name || 'عميل مجهول'}</td>
                    <td style="font-weight: bold; color: #2c3e50;">${o.total} ج.م</td>
                    <td>${renderStatusDropdown(o.id, o.status, 'dash')}</td>
                    <td style="width: 150px; text-align: center;">
                        <div style="display: flex; gap: 5px; justify-content: center;">
                            <button onclick="viewOrder('${o.id}')" class="btn-icon btn-edit" title="عرض">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="printShippingLabel('${o.id}')" class="btn-icon btn-print" title="بوليصة الشحن">
                                <i class="fas fa-print"></i>
                            </button>
                            ${o.status !== 'Archived' ? `
                            <button onclick="adminArchiveOrder('${o.id}')" class="btn-icon btn-archive" title="أرشفة">
                                <i class="fas fa-archive"></i>
                            </button>` : ''}
                            <button onclick="adminDeleteOrder('${o.id}')" class="btn-icon btn-trash" title="حذف نهائي">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                recentTbody.appendChild(tr);
            });
        }
    }
}

function refreshProducts() {
    const products = db.getProducts();
    const tbody = document.getElementById('products-table');
    tbody.innerHTML = '';

    const searchQuery = document.getElementById('p-search')?.value.toLowerCase() || '';
    const showArchivedOnly = document.getElementById('show-archived')?.checked || false;

    // Filter
    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery) || (p.sku && p.sku.toLowerCase().includes(searchQuery));
        const isArchived = p.archived === true;
        const matchesArchive = showArchivedOnly ? isArchived : !isArchived;
        return matchesSearch && matchesArchive;
    });

    // Handle Pagination
    const totalPages = Math.ceil(filtered.length / productsPerPage);
    if (productsCurrentPage > totalPages) productsCurrentPage = Math.max(1, totalPages);

    const startIndex = (productsCurrentPage - 1) * productsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + productsPerPage);

    // Reset bulk UI
    const bulkDiv = document.getElementById('products-bulk-actions');
    if (bulkDiv) bulkDiv.style.display = 'none';
    const moveBtn = document.getElementById('move-page-btn');
    if (moveBtn) moveBtn.style.display = 'none';

    const mainCb = document.getElementById('select-all-products');
    if (mainCb) mainCb.checked = false;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #999;">${searchQuery ? 'لا توجد نتائج بحث' : (showArchivedOnly ? 'لا توجد منتجات مؤرشفة' : 'لا توجد منتجات')}</td></tr>`;
        const pagContainer = document.getElementById('products-pagination');
        if (pagContainer) pagContainer.innerHTML = '';
        return;
    }

    paginated.forEach(p => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-id', p.id); // Add data-id for SortableJS
        const productImage = (p.images && p.images.length > 0) ? p.images[0] : (p.image || 'https://via.placeholder.com/100');
        tr.innerHTML = `
            <td style="text-align: center; padding: 0;">
                <div class="reorder-handle">
                    <i class="fas fa-bars"></i>
                </div>
            </td>
            <td style="padding: 0; text-align: center;"><input type="checkbox" class="select-products" value="${p.id}" onchange="updateBulkActionsUI('products')"></td>
            <td style="padding: 2px;">
                <label for="img-upload-${p.id}" style="cursor: pointer; position: relative; display: block;" title="اضغط لتغيير الصورة">
                    <div class="product-img-wrapper" style="width: 50px; height: 50px; margin: 0 auto;">
                        <img src="${productImage}" alt="${p.name}" id="img-preview-${p.id}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">
                        <div style="position: absolute; inset:0; background:rgba(0,0,0,0.3); color:white; display:flex; justify-content:center; align-items:center; opacity:0; transition:0.3s; border-radius: 6px;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                            <i class="fas fa-camera"></i>
                        </div>
                    </div>
                    <input type="file" id="img-upload-${p.id}" hidden accept="image/*" onchange="quickUpdateImage('${p.id}', this)">
                </label>
            </td>
            <td><span class="product-name-cell">${p.name}</span></td>
            <td>
                <span class="badge badge-secondary editable-badge" 
                    contenteditable="true" 
                    data-product-id="${p.id}" 
                    data-field="sku"
                    onblur="quickUpdateProduct('${p.id}', 'sku', this.innerText)"
                    onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}"
                    style="background:#eee; color:#333; font-family:monospace; cursor: text; min-width: 60px; display: inline-block;"
                    title="اضغط للتعديل">${p.sku || '-'}</span>
            </td>
            <td>
                <span class="badge badge-price editable-badge" 
                    contenteditable="true" 
                    data-product-id="${p.id}" 
                    data-field="price"
                    onblur="quickUpdateProduct('${p.id}', 'price', this.innerText.replace(/[^0-9.]/g, ''))"
                    onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}"
                    style="cursor: text; min-width: 80px; display: inline-block;">${p.price} ج.م</span>
            </td>
            <td>
                <span class="badge badge-info editable-badge" 
                    contenteditable="true" 
                    data-product-id="${p.id}" 
                    data-field="quantity"
                    onblur="quickUpdateProduct('${p.id}', 'quantity', this.innerText.replace(/[^0-9]/g, ''))"
                    onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}"
                    style="cursor: text; min-width: 60px; display: inline-block; background-color: #3498db;">${p.quantity || 0}</span>
            </td>
            <td>
                <span class="badge badge-category editable-badge" 
                    contenteditable="true" 
                    data-product-id="${p.id}" 
                    data-field="category"
                    onblur="quickUpdateProduct('${p.id}', 'category', this.innerText.trim())"
                    onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}"
                    style="cursor: text; min-width: 100px; display: inline-block;">${p.category}</span>
            </td>
            <td>
                <div class="btn-action-group" style="gap: 4px; justify-content: center;">
                    <button onclick="moveProductToPage('${p.id}')" class="btn-icon btn-move" title="نقل إلى صفحة..." style="color: #6c5ce7; width: 28px; height: 28px; font-size: 0.85rem; padding: 0;">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                    <button onclick="openProductModal('${p.id}')" class="btn-icon btn-edit" title="تعديل" style="width: 28px; height: 28px; font-size: 0.85rem; padding: 0;">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${p.archived ? `
                    <button onclick="adminUnarchiveProduct('${p.id}')" class="btn-icon btn-archive" title="إلغاء الأرشفة" style="width: 28px; height: 28px; font-size: 0.85rem; padding: 0;">
                        <i class="fas fa-box-open"></i>
                    </button>` : `
                    <button onclick="adminArchiveProduct('${p.id}')" class="btn-icon btn-archive" title="أرشفة" style="width: 28px; height: 28px; font-size: 0.85rem; padding: 0;">
                        <i class="fas fa-box"></i>
                    </button>`}
                    <button onclick="deleteProduct('${p.id}')" class="btn-icon btn-trash" title="حذف نهائي" style="width: 28px; height: 28px; font-size: 0.85rem; padding: 0;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    initSortableProducts(); // Initialize/refresh SortableJS
    renderProductsPagination(filtered.length);
}

function initSortableProducts() {
    const tbody = document.getElementById('products-table');
    if (!tbody || !window.Sortable) return;

    // Use official Sortable.get to clean up previous instance safely
    const existingInstance = Sortable.get(tbody);
    if (existingInstance) {
        existingInstance.destroy();
    }

    // Disable sortable if filtering
    const searchQuery = document.getElementById('p-search')?.value.trim();
    const showArchivedOnly = document.getElementById('show-archived')?.checked;

    if (searchQuery || showArchivedOnly) return;

    try {
        new Sortable(tbody, {
            handle: '.reorder-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            onEnd: async function () {
                await saveProductsOrder();
            }
        });
    } catch (e) {
        console.warn("Sortable Stabilization Logic Active:", e.message);
    }
}

async function saveProductsOrder() {
    const tbody = document.getElementById('products-table');
    const newOrderIds = Array.from(tbody.querySelectorAll('tr')).map(tr => tr.getAttribute('data-id'));

    let allProducts = db.getProducts();

    // MUST sort by current sortOrder first to ensure slice matches UI
    allProducts.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // We only reorder what's visible on this page
    const startIndex = (productsCurrentPage - 1) * productsPerPage;
    const paginatedProducts = allProducts.slice(startIndex, startIndex + productsPerPage);

    // Create new array with updated items for this slice
    const reorderedInPage = newOrderIds.map(id => paginatedProducts.find(p => p.id == id)).filter(Boolean);

    // Merge back into allProducts (this changes the array indices)
    allProducts.splice(startIndex, paginatedProducts.length, ...reorderedInPage);

    // CRITICAL: Assign explicit sortOrder to ALL products based on their position in the array
    allProducts.forEach((p, idx) => {
        p.sortOrder = idx;
        p.lastUpdated = Date.now(); // Update timestamp to ensure persistence checks favor this change
    });

    try {
        // Save locally first
        localStorage.setItem('products', JSON.stringify(allProducts));

        // Sync affected products to Cloudflare
        if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
            showToast('جاري تحديث الترتيب سحابياً...', 'info');

            // Sync current page at least
            const syncPromises = reorderedInPage.map(p => HybridSystem.saveProduct(p));
            await Promise.all(syncPromises);
        }

        // Sync to Firebase as backup
        await db.updateCloud('products');

        showToast('تم حفظ الترتيب الجديد بنجاح!', 'success');
    } catch (e) {
        console.error('Order save error:', e);
        showToast('حدث خطأ أثناء مزامنة الترتيب', 'error');
    }
}

async function quickUpdateProduct(id, field, value) {
    // FORCE SYNC before quick update to ensure consistency
    if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
        try {
            await HybridSystem.getProducts();
        } catch (e) {
            console.warn("Fast sync for quick update failed", e);
        }
    }

    const products = db.getProducts();
    const product = products.find(p => p.id == id);
    if (!product) return;

    if (field === 'price') {
        const newPrice = parseFloat(value);
        product.price = newPrice;

        // Sync with first variant Price if exists
        if (product.variants && product.variants.length > 0) {
            product.variants[0].price = newPrice;
        }
    }

    if (field === 'sku') {
        const newSku = value.trim();
        product.sku = newSku;

        // Sync with first variant Size if it's being used as SKU/Identifier (Optional, but keeping consistent)
        // Usually size is different, so we only sync main fields.
    }

    if (field === 'quantity') {
        const newQty = parseInt(value) || 0;
        product.quantity = newQty;

        // Sync with first variant if exists (per user request)
        if (product.variants && product.variants.length > 0) {
            product.variants[0].quantity = newQty;

            // Recalculate total quantity just in case there are other variants
            product.quantity = product.variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        }
    }
    if (field === 'category') product.category = value;

    try {
        // 1. Save Local & Firebase
        await db.saveProduct(product);

        // 2. Sync to Cloudflare Hybrid System (Crucial for Storefront)
        if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
            // Show small loading indicator on the badge if possible, or just a toast
            showToast('جاري تحديث السعر على المتجر...', 'info');
            await HybridSystem.saveProduct(product);
        }

        showToast('تم التحديث والمزامنة بنجاح', 'success');
    } catch (e) {
        console.error('Quick update error:', e);
        showToast('فشل التحديث سحابياً، تم الحفظ محلياً فقط', 'warning');
    }
}

window.quickUpdateProduct = quickUpdateProduct;

async function quickUpdateImage(id, input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Limit size to 1MB to protect LocalStorage/Sync
        if (file.size > 1024 * 1024) {
            showAlert('حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 1 ميجابايت.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const base64Img = e.target.result;

            // Preview immediately
            const imgPreview = document.getElementById(`img-preview-${id}`);
            if (imgPreview) imgPreview.src = base64Img;

            const products = db.getProducts();
            const product = products.find(p => p.id == id);

            if (product) {
                // Update product image (overwrite first image)
                // If existing is array, replace 0
                if (Array.isArray(product.images)) {
                    product.images[0] = base64Img;
                } else {
                    product.images = [base64Img];
                    product.image = base64Img; // Legacy support
                }
                product.lastUpdated = Date.now();

                try {
                    await db.saveProduct(product);
                    if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
                        showToast('جاري رفع الصورة الجديدة...', 'info');
                        await HybridSystem.saveProduct(product);
                    }
                    showToast('تم تحديث الصورة بنجاح', 'success');
                } catch (err) {
                    console.error('Image upload error:', err);
                    showToast('فشل حفظ الصورة', 'error');
                }
            }
        };
        reader.readAsDataURL(file);
    }
}
window.quickUpdateImage = quickUpdateImage;

async function moveProductToPage(targetId = null) {
    let selectedIds = [];
    if (targetId) {
        selectedIds = [targetId.toString()];
    } else {
        selectedIds = Array.from(document.querySelectorAll('.select-products:checked')).map(cb => cb.value);
    }

    if (selectedIds.length === 0) return;

    const pageNum = await showPrompt('أدخل رقم الصفحة التي تريد نقل المنتجات إليها:');
    if (!pageNum || isNaN(pageNum)) return;

    const targetPage = parseInt(pageNum);
    const products = db.getProducts();
    const totalPages = Math.ceil(products.length / productsPerPage);

    if (targetPage < 1 || targetPage > totalPages) {
        showToast(`صفحة غير موجودة. المتاحة من 1 إلى ${totalPages}`, 'error');
        return;
    }

    // Sort by sortOrder to maintain relative order
    products.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const movingProducts = products.filter(p => selectedIds.includes(p.id.toString()));
    const remainingProducts = products.filter(p => !selectedIds.includes(p.id.toString()));

    const targetIndex = (targetPage - 1) * productsPerPage;

    // Insert at target index
    remainingProducts.splice(targetIndex, 0, ...movingProducts);

    // Update sortOrder for everyone
    remainingProducts.forEach((p, idx) => {
        p.sortOrder = idx;
        p.lastUpdated = Date.now(); // Essential for cloud sync persistence
    });

    localStorage.setItem('products', JSON.stringify(remainingProducts));

    showToast('جاري نقل المنتجات ومزامنة الترتيب...', 'info');

    try {
        if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
            await Promise.all(movingProducts.map(p => HybridSystem.saveProduct(p)));
        }
        await db.updateCloud('products');
        showToast('تم النقل بنجاح', 'success');
        productsCurrentPage = targetPage;
        refreshProducts();
    } catch (e) {
        showToast('حدث خطأ أثناء المزامنة', 'error');
    }
}

function renderProductsPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / productsPerPage);
    const container = document.getElementById('products-pagination');
    if (!container) return;

    if (totalItems === 0 || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    // First/Prev
    html += `<button class="page-btn" ${productsCurrentPage === 1 ? 'disabled' : ''} onclick="changeProductPage(1)"><i class="fas fa-angle-double-right"></i></button>`;
    html += `<button class="page-btn" ${productsCurrentPage === 1 ? 'disabled' : ''} onclick="changeProductPage(${productsCurrentPage - 1})"><i class="fas fa-angle-right"></i></button>`;

    // Page Numbers (Show window of 5)
    let start = Math.max(1, productsCurrentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end === totalPages) start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === productsCurrentPage ? 'active' : ''}" onclick="changeProductPage(${i})">${i}</button>`;
    }

    // Next/Last
    html += `<button class="page-btn" ${productsCurrentPage === totalPages ? 'disabled' : ''} onclick="changeProductPage(${productsCurrentPage + 1})"><i class="fas fa-angle-left"></i></button>`;
    html += `<button class="page-btn" ${productsCurrentPage === totalPages ? 'disabled' : ''} onclick="changeProductPage(${totalPages})"><i class="fas fa-angle-double-left"></i></button>`;

    // Info
    const startIdx = (productsCurrentPage - 1) * productsPerPage + 1;
    const endIdx = Math.min(productsCurrentPage * productsPerPage, totalItems);
    html += `<div style="margin-right: 15px; color: #666; font-size: 0.9rem;">عرض ${startIdx}-${endIdx} من ${totalItems}</div>`;

    container.innerHTML = html;
}

function changeProductPage(page) {
    productsCurrentPage = page;
    refreshProducts();
    // Scroll to top of section
    document.getElementById('section-products').scrollIntoView({ behavior: 'smooth' });
}

async function adminArchiveProduct(id) {
    if (await showConfirm('هل أنت متأكد من أرشفة هذا المنتج؟')) {
        await db.archiveProduct(id);
        refreshProducts();
        showToast('تم أرشفة المنتج بنجاح', 'success');
    }
}

async function adminUnarchiveProduct(id) {
    await db.unarchiveProduct(id);
    refreshProducts();
    showToast('تم استعادة المنتج بنجاح', 'success');
}

async function deleteProduct(id) {
    if (await showConfirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
        await db.deleteProduct(id);
        refreshProducts();
        showToast('تم حذف المنتج بنجاح', 'success');
    }
}

async function adminClearAllProducts() {
    if (await showConfirm('تحذير: هل أنت متأكد من حذف جميع المنتجات نهائياً؟ لا يمكن التراجع عن هذه الخطوة.')) {
        await db.clearAllProducts();
        refreshProducts();
        showToast('تم حذف جميع المنتجات بنجاح', 'success');
    }
}

function refreshOrders() {
    let filter = 'active';
    const activeTab = document.querySelector('.filter-tab.active');
    if (activeTab) {
        filter = activeTab.getAttribute('data-filter');
    } else {
        filter = document.getElementById('order-filter')?.value || 'active';
    }
    const searchQuery = document.getElementById('o-search')?.value.toLowerCase() || '';
    const orders = db.getOrders();
    const tbody = document.getElementById('orders-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filteredOrders = orders.filter(o => {
        const customerName = (o.customer?.name || '').toLowerCase();
        const customerPhone = (o.customer?.phone || '').toLowerCase();
        const orderId = (o.id || '').toLowerCase();

        const matchesSearch = customerName.includes(searchQuery) ||
            customerPhone.includes(searchQuery) ||
            orderId.includes(searchQuery);

        if (filter === 'archived') return o.status === 'Archived' && matchesSearch;
        return o.status !== 'Archived' && matchesSearch;
    });

    // Reset bulk UI
    const bulkDiv = document.getElementById('orders-bulk-actions');
    if (bulkDiv) bulkDiv.style.display = 'none';
    const mainCb = document.getElementById('select-all-orders');
    if (mainCb) mainCb.checked = false;

    if (filteredOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #999;">${filter === 'archived' ? 'لا توجد طلبات مؤرشفة' : 'لا توجد طلبات نشطة'}</td></tr>`;
        return;
    }

    filteredOrders.forEach(o => {
        const tr = document.createElement('tr');
        const customerName = o.customer?.name || 'عميل مجهول';

        // Render Row Content

        tr.innerHTML = `
            <td><input type="checkbox" class="select-orders" value="${o.id}" onchange="updateBulkActionsUI('orders')"></td>
            <td style="font-weight: bold;">#${o.id.split('-').pop()}</td>
            <td>
                <div style="font-weight: 600;">${new Date(o.date).toLocaleDateString('ar-EG')}</div>
                <small style="color: #7f8c8d; font-size: 0.8rem; display: block; margin-top: 2px;">
                    <i class="far fa-clock" style="font-size: 0.75rem;"></i> ${new Date(o.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </small>
            </td>
            <td>${customerName}</td>
            <td style="font-weight: bold; color: #2c3e50;">${o.total} ج.م</td>
            <td>${renderStatusDropdown(o.id, o.status, 'orders')}</td>
            <td style="width: 150px; text-align: center;">
                <div style="display: flex; gap: 5px; justify-content: center;">
                    <button onclick="viewOrder('${o.id}')" class="btn-icon btn-edit" title="عرض">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="printShippingLabel('${o.id}')" class="btn-icon btn-print" title="بوليصة الشحن">
                        <i class="fas fa-print"></i>
                    </button>
                    ${o.status !== 'Archived' ? `
                    <button onclick="adminArchiveOrder('${o.id}')" class="btn-icon btn-archive" title="أرشفة">
                        <i class="fas fa-archive"></i>
                    </button>` : ''}
                    <button onclick="adminDeleteOrder('${o.id}')" class="btn-icon btn-trash" title="حذف نهائي">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleSelectAll(type) {
    const mainCb = document.getElementById(`select-all-${type}`);
    const checkboxes = document.querySelectorAll(`.select-${type}`);
    checkboxes.forEach(cb => cb.checked = mainCb.checked);
    updateBulkActionsUI(type);
}

function updateBulkActionsUI(type) {
    const checked = document.querySelectorAll(`.select-${type}:checked`);
    const bulkDiv = document.getElementById(`${type}-bulk-actions`);
    const countSpan = document.getElementById(`${type}-selected-count`);
    const moveBtn = document.getElementById('move-page-btn');

    if (checked.length > 0) {
        bulkDiv.style.display = 'flex';
        countSpan.innerText = checked.length;
        if (type === 'products' && moveBtn) moveBtn.style.display = 'inline-flex';
    } else {
        bulkDiv.style.display = 'none';
        if (type === 'products' && moveBtn) moveBtn.style.display = 'none';
        const mainCb = document.getElementById(`select-all-${type}`);
        if (mainCb) mainCb.checked = false;
    }
}

async function bulkDelete(type) {
    const checked = document.querySelectorAll(`.select-${type}:checked`);
    if (checked.length === 0) return;

    const count = checked.length;
    const msg = type === 'products' ? `هل أنت متأكد من حذف ${count} منتج نهائياً؟` : `هل أنت متأكد من حذف ${count} طلب نهائياً؟`;

    if (await showConfirm(msg)) {
        for (const cb of checked) {
            const id = cb.value;
            if (type === 'products') {
                db.deleteProduct(id);
            } else {
                await db.deleteOrder(id);
            }
        }
        type === 'products' ? refreshProducts() : refreshOrders();
        showToast(`تم حذف ${count} عنصر بنجاح`, 'success');
    }
}

async function bulkArchive(type) {
    const checked = document.querySelectorAll(`.select-${type}:checked`);
    if (checked.length === 0) return;

    const count = checked.length;
    const msg = type === 'products' ? `هل أنت متأكد من أرشفة ${count} منتج؟` : `هل أنت متأكد من أرشفة ${count} طلب؟`;

    if (await showConfirm(msg)) {
        checked.forEach(cb => {
            const id = cb.value;
            if (type === 'products') {
                db.archiveProduct(id);
            } else {
                db.archiveOrder(id);
            }
        });
        type === 'products' ? refreshProducts() : refreshOrders();
        showToast(`تم أرشفة ${count} عنصر بنجاح`, 'success');
    }
}

async function adminArchiveOrder(id) {
    if (await showConfirm('هل أنت متأكد من أرشفة هذا الطلب؟ سيختفي من القائمة النشطة.')) {
        db.updateOrderStatus(id, 'Archived');
        refreshOrders();
        showToast('تم أرشفة الطلب بنجاح', 'success');
    }
}

async function adminDeleteOrder(id) {
    if (await showConfirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع.')) {
        await db.cancelOrder(id);
        refreshOrders();
        showToast('تم حذف الطلب نهائياً بنجاح', 'success');
    }
}

async function updateStatus(id, status) {
    await db.updateOrderStatus(id, status);
    refreshOrders(); // Refresh to update colors and badges
}

function viewOrder(id) {
    db.markOrderAsRead(id);
    updateSidebarBadges();

    const order = db.getOrders().find(o => o.id == id);
    if (order) {
        // Create modal for order details
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.zIndex = '10000';

        let items = order.items.map(item => {
            let variantInfo = '';
            if (item.selectedColor) variantInfo += ` [اللون: ${item.selectedColor}]`;
            if (item.selectedSize) variantInfo += ` [المقاس: ${item.selectedSize}]`;
            return `<li style="padding: 5px 0;">${item.name} (${item.quantity}x)${variantInfo}</li>`;
        }).join('');

        let paymentProofHTML = '';
        if (order.paymentProof && (order.paymentMethod === 'vodafone' || order.paymentMethod === 'instapay')) {
            paymentProofHTML = `
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px solid #28a745;">
                    <h4 style="color: #28a745; margin-bottom: 10px;">
                        <i class="fas fa-check-circle"></i> إثبات الدفع (Screenshot)
                    </h4>
                    <img src="${order.paymentProof}" alt="Payment Proof" 
                         style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer;"
                         onclick="window.open('${order.paymentProof}', '_blank')">
                    <p style="font-size: 0.85rem; color: #666; margin-top: 8px;">
                        <i class="fas fa-info-circle"></i> اضغط على الصورة لفتحها في نافذة جديدة
                    </p>
                </div>
            `;
        } else if (order.paymentMethod === 'vodafone' || order.paymentMethod === 'instapay') {
            paymentProofHTML = `
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border: 2px solid #ffc107;">
                    <p style="color: #856404; margin: 0;">
                        <i class="fas fa-exclamation-triangle"></i> لم يتم إرفاق إثبات دفع لهذا الطلب
                    </p>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 15px;">
                    <h3 style="margin: 0; color: #2c3e50;">
                        <i class="fas fa-receipt"></i> تفاصيل الطلب #${id}
                    </h3>
                    <button onclick="this.closest('.modal').remove()" 
                            style="background: #e74c3c; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 1.1rem;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #34495e; margin-bottom: 10px;">
                        <i class="fas fa-user"></i> بيانات العميل
                    </h4>
                    <p style="margin: 5px 0;"><strong>الاسم:</strong> ${order.customer.name}</p>
                    <p style="margin: 5px 0;"><strong>الهاتف:</strong> ${order.customer.phone}</p>
                    <p style="margin: 5px 0;"><strong>العنوان:</strong> ${order.customer.address}</p>
                    ${(order.customer.province || order.customer.governorate) ? `<p style="margin: 5px 0;"><strong>المحافظة:</strong> ${order.customer.province || order.customer.governorate}</p>` : ''}
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #34495e; margin-bottom: 10px;">
                        <i class="fas fa-shopping-cart"></i> المنتجات
                    </h4>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        ${items}
                    </ul>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="color: #34495e; margin-bottom: 10px;">
                        <i class="fas fa-money-bill-wave"></i> تفاصيل الدفع
                    </h4>
                    <p style="margin: 5px 0;"><strong>المبلغ الإجمالي:</strong> ${order.total} ج.م</p>
                    <p style="margin: 5px 0;"><strong>طريقة الدفع:</strong> ${getPaymentMethodName(order.paymentMethod)}</p>

                    <p style="margin: 5px 0;"><strong>الحالة:</strong> <span style="color: ${getStatusColor(order.status)}; font-weight: bold;">${getStatusName(order.status)}</span></p>
                </div>

                ${paymentProofHTML}

                <div style="margin-top: 20px; text-align: center; display: flex; gap: 10px; justify-content: center;">
                    <button onclick="printShippingLabel('${id}')" class="btn btn-primary" style="background: #27ae60; border-color: #27ae60;">
                        <i class="fas fa-print"></i> بوليصة الشحن
                    </button>
                    <button onclick="this.closest('.modal').remove()" class="btn btn-secondary">
                        إغلاق
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }
}

function getPaymentMethodName(method) {
    const methods = {
        'cod': 'الدفع عند الاستلام',
        'vodafone': 'فودافون كاش',
        'instapay': 'انستا باي',
        'card': 'بطاقة ائتمان'
    };
    return methods[method] || method;
}

function getStatusName(status) {
    const info = getStatusInfo(status);
    return info.label.includes(' ') ? info.label.split(' ').slice(1).join(' ') : info.label;
}

function getStatusColor(status) {
    return getStatusInfo(status).color;
}

async function adminCancelOrder(id) {
    if (await showConfirm('هل أنت متأكد من إلغاء هذا الطلب نهائياً؟')) {
        await db.cancelOrder(id);
        refreshOrders();
        showToast('تم حذف الطلب بنجاح', 'success');
    }
}

function refreshCustomers() {
    let customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const tbody = document.getElementById('customers-table');
    const searchInput = document.getElementById('customer-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    tbody.innerHTML = '';

    // Filter by search term if exists
    if (searchTerm) {
        customers = customers.filter(c =>
            (c.name || '').toLowerCase().includes(searchTerm) ||
            (c.email || '').toLowerCase().includes(searchTerm) ||
            (c.phone || '').toLowerCase().includes(searchTerm)
        );
    }

    if (customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #999;">${searchTerm ? 'لا توجد نتائج مطابقة لبحثك' : 'لا يوجد عملاء مسجلين'}</td></tr>`;
        return;
    }

    customers.forEach(c => {
        const tr = document.createElement('tr');
        // Format phone for WhatsApp (remove spaces, etc.) - assuming Egyptian numbers if no code
        let waPhone = c.phone || '';
        if (waPhone && !waPhone.startsWith('+') && !waPhone.startsWith('20')) {
            waPhone = '2' + waPhone;
        }
        waPhone = waPhone.replace(/\D/g, '');

        tr.innerHTML = `
            <td>${c.name}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td>${c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-EG') : '---'}</td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 8px; justify-content: center;">
                    ${c.phone ? `
                    <a href="https://wa.me/${waPhone}" target="_blank" class="btn-icon btn-whatsapp" title="واتساب" style="background: #25D366; color: white; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; text-decoration: none;">
                        <i class="fab fa-whatsapp"></i>
                    </a>` : ''}
                    <button onclick="adminDeleteCustomer('${c.email}')" class="btn-icon btn-trash" title="حذف العميل" style="width: 32px; height: 32px; border-radius: 8px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function adminDeleteCustomer(email) {
    showConfirm('هل أنت متأكد من حذف هذا العميل نهائياً؟', () => {
        if (db.deleteCustomer(email)) {
            showToast('تم حذف العميل بنجاح', 'success');
            refreshCustomers();
        } else {
            showToast('فشل في حذف العميل', 'error');
        }
    });
}

// --- Bulk WhatsApp State & Logic ---
let bulkWACustomers = [];
let bulkWACurrentIndex = 0;
let bulkWAMessage = '';

function openBulkWhatsAppModal() {
    const modal = document.getElementById('bulk-whatsapp-modal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('bulk-wa-setup').style.display = 'block';
        document.getElementById('bulk-wa-progress').style.display = 'none';
        document.getElementById('bulk-wa-message').value = '';
    }
}

function closeBulkWhatsAppModal() {
    const modal = document.getElementById('bulk-whatsapp-modal');
    if (modal) modal.classList.remove('active');
    bulkWACustomers = [];
    bulkWACurrentIndex = 0;
}

function startBulkWhatsApp() {
    const msg = document.getElementById('bulk-wa-message').value.trim();
    if (!msg) {
        showToast('يرجى كتابة نص الرسالة أولاً', 'error');
        return;
    }

    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    bulkWACustomers = customers.filter(c => c.phone);

    if (bulkWACustomers.length === 0) {
        showToast('لا يوجد عملاء لديهم أرقام هواتف مسجلة', 'error');
        return;
    }

    bulkWAMessage = msg;
    bulkWACurrentIndex = 0;

    document.getElementById('bulk-wa-setup').style.display = 'none';
    document.getElementById('bulk-wa-progress').style.display = 'block';
    updateBulkWAUI();
}

function sendToCurrentCustomer() {
    if (bulkWACurrentIndex >= bulkWACustomers.length) return;

    const customer = bulkWACustomers[bulkWACurrentIndex];
    let phone = (customer.phone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '2' + phone;
    else if (!phone.startsWith('2')) phone = '2' + phone;

    const personalizedMsg = bulkWAMessage.replace(/{name}/g, customer.name);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(personalizedMsg)}`;

    window.open(url, '_blank');

    // Move to next
    bulkWACurrentIndex++;
    if (bulkWACurrentIndex < bulkWACustomers.length) {
        updateBulkWAUI();
    } else {
        finishBulkWhatsApp();
    }
}

function skipCurrentCustomer() {
    bulkWACurrentIndex++;
    if (bulkWACurrentIndex < bulkWACustomers.length) {
        updateBulkWAUI();
    } else {
        finishBulkWhatsApp();
    }
}

function updateBulkWAUI() {
    if (!bulkWACustomers[bulkWACurrentIndex]) return;
    const customer = bulkWACustomers[bulkWACurrentIndex];
    document.getElementById('bulk-wa-current-name').innerText = customer.name;
    document.getElementById('bulk-wa-stats').innerText = `العميل ${bulkWACurrentIndex + 1} من ${bulkWACustomers.length}`;

    const progress = ((bulkWACurrentIndex) / bulkWACustomers.length) * 100;
    const bar = document.getElementById('bulk-wa-bar');
    if (bar) bar.style.width = progress + '%';
}

function finishBulkWhatsApp() {
    const bar = document.getElementById('bulk-wa-bar');
    if (bar) bar.style.width = '100%';
    document.getElementById('bulk-wa-current-name').innerText = 'تم الانتهاء!';
    document.getElementById('bulk-wa-stats').innerText = 'تمت مراسلة جميع العملاء بنجاح';

    showToast('تم الانتهاء من عملية الإرسال الجماعي', 'success');
}

function stopBulkWhatsApp() {
    document.getElementById('bulk-wa-setup').style.display = 'block';
    document.getElementById('bulk-wa-progress').style.display = 'none';
}

let editingProductId = null;
let currentProductImages = [];




async function openProductModal(productId = null) {
    // FORCE SYNC before editing to prevent saving stale local data over fresh cloud data
    if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
        try {
            await HybridSystem.getProducts();
        } catch (e) {
            console.warn("Sync for edit failed, using local:", e);
        }
    }

    editingProductId = productId;
    currentProductImages = [];
    const modal = document.getElementById('product-modal');
    const title = modal.querySelector('h3');
    const previewsContainer = document.getElementById('image-previews-container');
    previewsContainer.innerHTML = '';
    const variantsContainer = document.getElementById('variants-container');
    if (variantsContainer) variantsContainer.innerHTML = '';

    if (productId) {
        title.innerText = 'تعديل المنتج';
        const product = db.getProducts().find(p => p.id == productId);
        if (product) {
            document.getElementById('p-name').value = product.name;
            document.getElementById('p-price').value = product.price;
            document.getElementById('p-old-price').value = product.oldPrice || '';
            document.getElementById('p-qty').value = product.quantity !== undefined ? product.quantity : '';
            document.getElementById('p-category').value = product.category;
            document.getElementById('p-sku').value = product.sku || ''; // Load SKU
            document.getElementById('p-color').value = Array.isArray(product.color) ? product.color.join(', ') : (product.color || '');
            document.getElementById('p-sizes').value = (product.size || []).join(', ');

            // Set visibility with proper logging
            const isVisibleFromProduct = product.isVisible !== false;
            console.log('📝 Opening Product Modal - Product ID:', product.id);
            console.log('📝 Product isVisible value from database:', product.isVisible);
            console.log('📝 Calculated checkbox value:', isVisibleFromProduct);
            document.getElementById('p-visible').checked = isVisibleFromProduct;
            // Removed p-collections as per request

            if (quill) {
                quill.root.innerHTML = product.description || '';
            }

            // Load variants
            if (product.variants && Array.isArray(product.variants)) {
                product.variants.forEach(v => addVariantRow(v.size, v.price, v.quantity, v.color));
            }

            // Load images
            if (product.images && product.images.length > 0) {
                currentProductImages = [...product.images];
            } else if (product.image) {
                currentProductImages = [product.image];
            }
            renderImagePreviews();
        }
    } else {
        title.innerText = 'إضافة منتج جديد';
        document.getElementById('product-form').reset();
        document.getElementById('p-visible').checked = true;
    }

    populateCategoryDropdown();
    modal.classList.add('active');
}

// Support for dynamic categories
function populateCategoryDropdown() {
    const catSelect = document.getElementById('p-category');
    if (!catSelect) return;

    // Get current value to preserve it
    const currentVal = catSelect.value;

    // Clear and add dynamic options from site_settings.collections
    catSelect.innerHTML = '';

    const settings = db.getSettings();
    const categories = settings.collections || [];

    if (categories.length === 0) {
        // Fallback to defaults if none exist
        const defaults = ['أوكر وكوالين', 'ديكورات', 'إكسسوارات'];
        defaults.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.innerText = c;
            catSelect.appendChild(opt);
        });
    } else {
        categories.forEach(c => {
            const opt = document.createElement('option');
            const value = c.nameAr || c.nameEn;
            opt.value = value;
            opt.innerText = value;
            catSelect.appendChild(opt);
        });
    }

    // Try to restore previous value
    if (currentVal) catSelect.value = currentVal;
}

// --- Custom Category Modal Logic ---
function addNewCategoryPrompt() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        document.getElementById('category-form').reset();
        modal.classList.add('active');
        setTimeout(() => document.getElementById('new-cat-name').focus(), 100);
    }
}
window.addNewCategoryPrompt = addNewCategoryPrompt;

function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) modal.classList.remove('active');
}
window.closeCategoryModal = closeCategoryModal;

async function handleCategorySubmit(event) {
    if (event) event.preventDefault();

    const input = document.getElementById('new-cat-name');
    const name = input.value.trim();

    if (!name) return;

    const settings = db.getSettings();

    // Check if exists
    const exists = (settings.collections || []).some(c => (c.nameAr === name || c.nameEn === name));
    if (exists) {
        showToast('هذه المجموعة موجودة بالفعل', 'info');
        const pCat = document.getElementById('p-category');
        if (pCat) pCat.value = name;
        closeCategoryModal();
        return;
    }

    // Add to collections
    if (!settings.collections) settings.collections = [];
    settings.collections.push({
        id: Date.now(),
        nameAr: name,
        nameEn: name,
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400", // Default generic image
        link: "products?category=" + encodeURIComponent(name)
    });

    // Save
    db.saveSettings(settings);

    // Refresh UI
    populateCategoryDropdown();
    const pCatId = document.getElementById('p-category');
    if (pCatId) pCatId.value = name;

    closeCategoryModal();
    showToast('تمت إضافة المجموعة الجديدة بنجاح ✨', 'success');
}
window.handleCategorySubmit = handleCategorySubmit;
window.addNewCategoryPrompt = addNewCategoryPrompt;





function updateTotalQtyFromVariants() {
    const qtyInputs = document.querySelectorAll('.v-qty');
    if (qtyInputs.length === 0) return;

    let total = 0;
    qtyInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });

    const pQtyInput = document.getElementById('p-qty');
    if (pQtyInput) pQtyInput.value = total;
}

function addVariantRow(size = '', price = '', quantity = '', color = '') {
    const container = document.getElementById('variants-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'variant-row';
    row.style = 'display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 15px; align-items: end; background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.02);';

    // Check if this is the FIRST variant row
    const isFirstRow = container.children.length === 0;
    const syncQtyAttribute = isFirstRow ? 'oninput="syncFirstVariantQty(this)"' : 'oninput="updateTotalQtyFromVariants()"';
    const syncPriceAttribute = isFirstRow ? 'oninput="syncFirstVariantPrice(this)"' : '';

    row.innerHTML = `
        <div class="form-group" style="margin-bottom:0">
            <label class="small" style="font-weight:700; color:#444; margin-bottom:5px; display:block;">المقاس</label>
            <input type="text" class="form-control v-size" value="${size}" placeholder="مثال: 41" style="border-radius:8px; padding:10px;">
        </div>
        <div class="form-group" style="margin-bottom:0">
            <label class="small" style="font-weight:700; color:#444; margin-bottom:5px; display:block;">اللون</label>
            <input type="text" class="form-control v-color" value="${color}" placeholder="مثال: أسود" style="border-radius:8px; padding:10px;">
        </div>
        <div class="form-group" style="margin-bottom:0">
            <label class="small" style="font-weight:700; color:#444; margin-bottom:5px; display:block;">السعر</label>
            <input type="number" class="form-control v-price" value="${price}" placeholder="0.00" style="border-radius:8px; padding:10px;" ${syncPriceAttribute}>
        </div>
        <div class="form-group" style="margin-bottom:0">
            <label class="small" style="font-weight:700; color:#444; margin-bottom:5px; display:block;">الكمية</label>
            <input type="number" class="form-control v-qty" value="${quantity}" placeholder="0" style="border-radius:8px; padding:10px;" ${syncQtyAttribute}>
        </div>
        <button type="button" class="btn-delete" onclick="this.parentElement.remove(); updateTotalQtyFromVariants();" style="margin-bottom: 5px; height:42px; width:42px; border-radius:10px; border:none; background:#fff1f0; color:#f5222d; cursor:pointer; display:flex; align-items:center; justify-content:center;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(row);

    // Initial sync if first row and values provided
    if (isFirstRow) {
        if (quantity) {
            const pQtyInput = document.getElementById('p-qty');
            if (pQtyInput) pQtyInput.value = quantity;
        }
        if (price) {
            const pPriceInput = document.getElementById('p-price');
            if (pPriceInput) pPriceInput.value = price;
        }
    }
}

// Helper to sync specifically the first variant
function syncFirstVariantQty(input) {
    const pQtyInput = document.getElementById('p-qty');
    if (pQtyInput) pQtyInput.value = input.value;
    updateTotalQtyFromVariants(); // Also trigger total calculation fallback
}

function syncFirstVariantPrice(input) {
    const pPriceInput = document.getElementById('p-price');
    if (pPriceInput) pPriceInput.value = input.value;
}
window.syncFirstVariantQty = syncFirstVariantQty;
window.syncFirstVariantPrice = syncFirstVariantPrice;

function renderImagePreviews() {
    const container = document.getElementById('image-previews-container');
    container.innerHTML = '';
    currentProductImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <img src="${img}">
            <button type="button" class="remove-img" onclick="removeProductImage(${index})">&times;</button>
        `;
        container.appendChild(div);
    });
}

function removeProductImage(index) {
    currentProductImages.splice(index, 1);
    renderImagePreviews();
}

function initImageDropZone() {
    const dropZone = document.getElementById('image-drop-zone');
    const fileInput = document.getElementById('p-images-input');

    if (!dropZone) return;

    dropZone.onclick = () => fileInput.click();

    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    };

    dropZone.ondragleave = () => {
        dropZone.classList.remove('dragover');
    };

    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    };

    fileInput.onchange = (e) => {
        handleFiles(e.target.files);
    };
}

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentProductImages.push(e.target.result);
                renderImagePreviews();
            };
            reader.readAsDataURL(file);
        }
    });
}

function closeProductModal() {
    editingProductId = null;
    currentProductImages = [];
    document.getElementById('product-modal').classList.remove('active');
    document.getElementById('product-form').reset();
    document.getElementById('image-previews-container').innerHTML = '';

    if (quill) {
        quill.root.innerHTML = '';
    }
}

function editProduct(id) {
    openProductModal(id);
}


function refreshSettings() {
    // Initialize Editors if needed
    if (!termsEditor && document.getElementById('s-terms-editor')) {
        const toolbarOptions = [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['clean']
        ];

        try {
            termsEditor = new Quill('#s-terms-editor', { theme: 'snow', modules: { toolbar: toolbarOptions } });
            shippingEditor = new Quill('#s-shipping-editor', { theme: 'snow', modules: { toolbar: toolbarOptions } });
            refundEditor = new Quill('#s-refund-editor', { theme: 'snow', modules: { toolbar: toolbarOptions } });
            privacyEditor = new Quill('#s-privacy-editor', { theme: 'snow', modules: { toolbar: toolbarOptions } });

            // Set RTL defaults
            [termsEditor, shippingEditor, refundEditor, privacyEditor].forEach(ed => {
                ed.format('direction', 'rtl');
                ed.format('align', 'right');
            });
        } catch (e) {
            console.error('Quill Init Error:', e);
        }
    }

    const settings = db.getSettings();
    document.getElementById('s-heroTitleAr').value = settings.heroTitleAr;
    document.getElementById('s-heroTitleEn').value = settings.heroTitleEn;
    document.getElementById('s-heroDescAr').value = settings.heroDescAr;
    document.getElementById('s-heroDescEn').value = settings.heroDescEn;
    document.getElementById('s-heroImage').value = settings.heroImage;
    document.getElementById('s-storeName').value = settings.storeName;
    document.getElementById('s-instagram').value = settings.instagram || '';
    document.getElementById('s-timerEnabled').checked = settings.timerEnabled || false;
    document.getElementById('s-timerDuration').value = settings.timerDurationHours || ''; // Just for display
    document.getElementById('s-timerTextAr').value = settings.timerTextAr || 'العرض ينتهي خلال:';
    document.getElementById('s-whatsapp').value = settings.whatsapp || '201125655690';
    document.getElementById('s-featuredTitleAr').value = settings.featuredTitleAr || '';
    document.getElementById('s-featuredTitleEn').value = settings.featuredTitleEn || '';
    document.getElementById('s-featuredProductIds').value = (settings.featuredProductIds || []).join(', ');
    document.getElementById('s-fbPixelId').value = settings.fbPixelId || '';
    document.getElementById('s-abandonedMsg').value = settings.abandonedMsg || 'مرحباً {name}، لاحظنا أنك نسيت بعض المنتجات الرائعة في سلة تسوقك بمتجر الشرقاوي (إجمالي: {total} ج.م). \n\nهل يمكننا مساعدتك في إكمال طلبك؟';
    document.getElementById('s-offerTitle').value = settings.offerTitle !== undefined ? settings.offerTitle : 'تخفيضات نهاية العام';
    document.getElementById('s-offerDesc').value = settings.offerDesc !== undefined ? settings.offerDesc : 'احصل على خصم يصل إلى 40% على منتجات مختارة.';
    document.getElementById('s-offerBtn').value = settings.offerBtn !== undefined ? settings.offerBtn : 'عرض العروض';
    document.getElementById('s-offerLink').value = settings.offerLink || 'products.html';
    document.getElementById('s-offerEnabled').checked = settings.offerEnabled === undefined ? true : settings.offerEnabled;
    document.getElementById('s-offerMode').value = settings.offerMode || 'link';
    document.getElementById('s-offerProductId').value = (settings.offerProductIds || []).join(', ');
    document.getElementById('s-showFeatured').checked = settings.showFeatured !== false;
    document.getElementById('s-showCollections').checked = settings.showCollections === undefined ? true : settings.showCollections;
    document.getElementById('s-reviewsEnabled').checked = settings.reviewsEnabled === undefined ? true : settings.reviewsEnabled;
    document.getElementById('s-allowCustomerReviews').checked = settings.allowCustomerReviews === undefined ? true : settings.allowCustomerReviews;
    document.getElementById('s-maintenanceMode').checked = settings.maintenanceMode || false;
    document.getElementById('s-maintenanceMessageAr').value = settings.maintenanceMessageAr || 'الموقع تحت الصيانة حالياً.. سنعود قريباً';
    document.getElementById('s-maintenanceMessageEn').value = settings.maintenanceMessageEn || 'Site is under maintenance.. back soon';
    document.getElementById('s-announcementEnabled').checked = settings.announcementEnabled || false;
    document.getElementById('s-announcementTextEn').value = settings.announcementTextEn || '';
    document.getElementById('s-googleVerify').value = settings.googleVerify || '';

    // Policies (Rich Text)
    if (termsEditor) termsEditor.root.innerHTML = settings.termsAr || '';
    if (shippingEditor) shippingEditor.root.innerHTML = settings.shippingPolicyAr || '';
    if (refundEditor) refundEditor.root.innerHTML = settings.refundPolicyAr || '';
    if (privacyEditor) privacyEditor.root.innerHTML = settings.privacyPolicyAr || '';

    // Admin Security Info
    document.getElementById('s-adminEmail').value = settings.adminEmail || 'admin@elsharkawy.com';

    // Generate Sitemap URL
    const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/admin/'));
    document.getElementById('sitemap-url').value = baseUrl + '/sitemap.xml';

    const reviewContainer = document.getElementById('reviews-container');
    if (reviewContainer) {
        reviewContainer.innerHTML = '';
        (settings.reviews || []).forEach(rev => addReviewField(rev));
    }

    const homeCatContainer = document.getElementById('home-categories-container');
    if (homeCatContainer) {
        homeCatContainer.innerHTML = '';
        (settings.homeCategories || []).forEach(cat => addHomeCategoryField(cat));
    }

    // Load Featured Selection
    if (typeof loadFeaturedSettings === 'function') {
        loadFeaturedSettings(settings);
    }

    // Load Bosta Settings
    if (typeof loadBostaSettings === 'function') {
        loadBostaSettings();
    }
}

function addReviewField(data = null) {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'card';
    div.style.background = '#f9f9f9';
    div.style.marginBottom = '1rem';
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <strong>رأي عميل #${container.children.length + 1}</strong>
            <button type="button" class="btn-delete" onclick="this.parentElement.parentElement.remove()" style="padding: 5px 10px; border-radius: 4px; border:none; cursor:pointer;">إزالة</button>
        </div>
        <div class="stats-grid" style="grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
                <label>اسم العميل</label>
                <input type="text" class="rev-name" value="${data ? data.name : ''}" required>
            </div>
            <div class="form-group">
                <label>التقييم (1-5)</label>
                <input type="number" class="rev-rating" value="${data ? data.rating : 5}" min="1" max="5" required>
            </div>
        </div>
        <div class="form-group">
            <label>التعليق</label>
            <textarea class="rev-comment" rows="2" required>${data ? data.comment : ''}</textarea>
        </div>
        <div class="form-group">
            <label>التاريخ (YYYY-MM-DD)</label>
            <input type="date" class="rev-date" value="${data ? data.date : new Date().toISOString().split('T')[0]}" required>
        </div>
    `;
    container.appendChild(div);
}

function addHomeCategoryField(data = null) {
    const container = document.getElementById('home-categories-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'card';
    div.style.background = '#f0f4f8';
    div.style.marginBottom = '1.5rem';
    div.style.border = '1px solid #d1d9e6';

    // Get all existing product categories for the dropdown
    const products = db.getProducts();
    const categories = [...new Set(products.map(p => p.category).filter(c => c))];
    let catOptions = categories.map(c => `<option value="${c}" ${data && data.linkedCategory === c ? 'selected' : ''}>${c}</option>`).join('');

    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <strong>مجموعة #${container.children.length + 1}</strong>
            <button type="button" class="btn-delete" onclick="this.parentElement.parentElement.remove()" style="padding: 5px 10px; border-radius: 4px; border:none; cursor:pointer; background:#ff4757; color:white;">إزالة</button>
        </div>
        <div class="stats-grid" style="grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
                <label>الاسم الظاهر (عربي)</label>
                <input type="text" class="hc-nameAr form-control" value="${data ? data.nameAr : ''}" required>
            </div>
            <div class="form-group">
                <label>Display Name (English)</label>
                <input type="text" class="hc-nameEn form-control" value="${data ? data.nameEn : ''}" required>
            </div>
        </div>
        <div class="stats-grid" style="grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
                <label>رابط الصورة</label>
                <input type="url" class="hc-image form-control" value="${data ? data.image : ''}" required>
            </div>
            <div class="form-group">
                <label>الفئة المرتبطة (للفلترة)</label>
                <select class="hc-linkedCategory form-control">
                    <option value="">-- اختر الفئة --</option>
                    ${catOptions}
                </select>
            </div>
        </div>
    `;
    container.appendChild(div);
}


document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();

    try {
        const existingSettings = db.getSettings();
        const collections = existingSettings.collections || [];

        const settings = {
            heroTitleAr: document.getElementById('s-heroTitleAr').value,
            heroTitleEn: document.getElementById('s-heroTitleEn').value,
            heroDescAr: document.getElementById('s-heroDescAr').value,
            heroDescEn: document.getElementById('s-heroDescEn').value,
            heroImage: document.getElementById('s-heroImage').value,
            storeName: document.getElementById('s-storeName').value,
            whatsapp: document.getElementById('s-whatsapp').value,
            featuredTitleAr: document.getElementById('s-featuredTitleAr').value,
            featuredTitleEn: document.getElementById('s-featuredTitleEn').value,

            // New Featured Logic
            featuredMode: document.getElementById('s-featuredMode').value,
            featuredProductIds: getSelectedFeaturedIds(),
            fbPixelId: document.getElementById('s-fbPixelId').value.trim(),
            abandonedMsg: document.getElementById('s-abandonedMsg').value,

            // New fields for timer and social media
            instagram: document.getElementById('s-instagram') ? document.getElementById('s-instagram').value : '',
            timerEnabled: document.getElementById('s-timerEnabled').checked,
            timerDurationHours: parseFloat(document.getElementById('s-timerDuration').value) || 0,
            timerTextAr: document.getElementById('s-timerTextAr').value,
            timerTarget: (document.getElementById('s-timerEnabled').checked && parseFloat(document.getElementById('s-timerDuration').value) > 0)
                ? (Date.now() + (parseFloat(document.getElementById('s-timerDuration').value) * 60 * 60 * 1000))
                : (db.getSettings().timerTarget || null), // Keep existing target if not enabled or duration not set

            offerTitle: document.getElementById('s-offerTitle').value,
            offerDesc: document.getElementById('s-offerDesc').value,
            offerBtn: document.getElementById('s-offerBtn').value,
            offerLink: document.getElementById('s-offerLink').value,
            offerEnabled: document.getElementById('s-offerEnabled').checked,
            offerMode: document.getElementById('s-offerMode').value,
            offerProductIds: getSelectedOfferIds(),
            showFeatured: document.getElementById('s-showFeatured').checked,
            showCollections: document.getElementById('s-showCollections').checked,
            reviewsEnabled: document.getElementById('s-reviewsEnabled').checked,
            maintenanceMode: document.getElementById('s-maintenanceMode').checked,
            maintenanceMessageAr: document.getElementById('s-maintenanceMessageAr').value,
            maintenanceMessageEn: document.getElementById('s-maintenanceMessageEn').value,
            announcementEnabled: document.getElementById('s-announcementEnabled').checked,
            announcementTextAr: document.getElementById('s-announcementTextAr').value,
            announcementTextEn: document.getElementById('s-announcementTextEn').value,
            googleVerify: document.getElementById('s-googleVerify').value.trim(),
            allowCustomerReviews: document.getElementById('s-allowCustomerReviews').checked,
            // Policies (Rich Text)
            termsAr: termsEditor ? termsEditor.root.innerHTML : '',
            shippingPolicyAr: shippingEditor ? shippingEditor.root.innerHTML : '',
            refundPolicyAr: refundEditor ? refundEditor.root.innerHTML : '',
            privacyPolicyAr: privacyEditor ? privacyEditor.root.innerHTML : '',

            collections: collections,
            reviews: Array.from(document.querySelectorAll('#reviews-container .card')).map(card => ({
                name: card.querySelector('.rev-name').value,
                rating: parseInt(card.querySelector('.rev-rating').value),
                comment: card.querySelector('.rev-comment').value,
                date: card.querySelector('.rev-date').value,
                id: Date.now() + Math.random()
            }))
        };

        const homeCategories = [];
        document.querySelectorAll('#home-categories-container .card').forEach(card => {
            homeCategories.push({
                nameAr: card.querySelector('.hc-nameAr').value,
                nameEn: card.querySelector('.hc-nameEn').value,
                image: card.querySelector('.hc-image').value,
                linkedCategory: card.querySelector('.hc-linkedCategory').value
            });
        });
        settings.homeCategories = homeCategories;

        // Save Bosta Settings
        if (typeof saveBostaSettings === 'function') {
            saveBostaSettings();
        }

        // Handle Admin Credentials Update
        const newAdminEmail = document.getElementById('s-newAdminEmail').value;
        const newAdminPass = document.getElementById('s-newAdminPass').value;
        const confirmAdminPass = document.getElementById('s-confirmAdminPass').value;

        if (newAdminPass && newAdminPass !== confirmAdminPass) {
            showAlert('كلمات مرور الأدمن غير متطابقة', 'error');
            return;
        }

        if (newAdminEmail) settings.adminEmail = newAdminEmail;
        if (newAdminPass) settings.adminPass = newAdminPass;

        db.saveSettings(settings);
        showToast('تم حفظ كل الإعدادات بنجاح! المتجر سيعمل الآن بالتحديث الجديد.', 'success');
    } catch (err) {
        console.error('Error saving settings:', err);
        showAlert('حدث خطأ أثناء حفظ الإعدادات. يرجى مراجعة البيانات.', 'error');
    }
});

function initCustomDropdown(containerId, options, onSelect, placeholder = "اختر...", isSearchable = true) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const trigger = container.querySelector('.mo-dropdown-trigger');
    const menu = container.querySelector('.mo-dropdown-menu');
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const triggerSpan = trigger.querySelector('span');

    // Build Menu
    let menuHTML = '';
    if (isSearchable) {
        menuHTML += `
            <div class="mo-dropdown-search">
                <input type="text" placeholder="بحث...">
            </div>
        `;
    }

    menuHTML += `<div class="mo-options-list">`;
    menuHTML += options.map(opt => `
        <div class="mo-dropdown-option ${opt.disabled ? 'disabled' : ''}" data-value="${opt.value}" data-label="${opt.label || ''}">
            ${opt.html || opt.label}
        </div>
    `).join('');
    menuHTML += `</div>`;

    menu.innerHTML = menuHTML;

    const searchInput = menu.querySelector('input');
    const optionsList = menu.querySelectorAll('.mo-dropdown-option');

    // Trigger Click
    trigger.onclick = (e) => {
        e.stopPropagation();
        const isActive = container.classList.contains('active');

        // Close all other dropdowns
        document.querySelectorAll('.mo-custom-dropdown').forEach(d => d.classList.remove('active'));
        document.querySelectorAll('.mo-item-row').forEach(r => r.style.zIndex = '1');

        if (!isActive) {
            container.classList.add('active');
            // Bring the whole row to front
            const row = container.closest('.mo-item-row');
            if (row) row.style.zIndex = '2000'; // High z-index

            // Always open downwards
            menu.style.top = '100%';
            menu.style.bottom = 'auto';
            menu.style.borderBottom = `2px solid var(--primary-color)`;
            menu.style.borderTop = 'none';
            menu.style.borderRadius = '0 0 12px 12px';
            menu.style.marginTop = '8px';
            menu.style.marginBottom = '0';

            if (searchInput) searchInput.focus();
        }
    };

    // Option Click
    optionsList.forEach(opt => {
        opt.onclick = (e) => {
            e.stopPropagation();
            if (opt.classList.contains('disabled')) return;

            const val = opt.getAttribute('data-value');
            const label = opt.getAttribute('data-label') || opt.innerText.trim();

            triggerSpan.innerText = label;
            hiddenInput.value = val;
            container.classList.remove('active');

            // Highlight selected
            optionsList.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');

            if (onSelect) onSelect(val, opt);
        };
    });

    // Search Logic
    if (searchInput) {
        searchInput.oninput = () => {
            const term = searchInput.value.toLowerCase();
            optionsList.forEach(opt => {
                const text = opt.innerText.toLowerCase();
                opt.style.display = text.includes(term) ? 'flex' : 'none';
            });
        };
    }
}

// Global listener to close dropdowns and reset z-index when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.mo-custom-dropdown').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.mo-item-row').forEach(r => r.style.zIndex = '1');
});

// Manual Order Logic
function openManualOrderModal() {
    document.getElementById('manual-order-modal').classList.add('active');
    document.getElementById('mo-items-container').innerHTML = '';

    // Reset inputs
    document.getElementById('mo-governorate').value = '';
    document.querySelector('#mo-gov-dropdown .mo-dropdown-trigger span').innerText = 'اختر المحافظة...';

    // Initialize Governorate Dropdown
    const rates = db.getShippingRates();
    const govOptions = rates.map(r => ({ value: r.city, label: r.city }));

    initCustomDropdown('mo-gov-dropdown', govOptions, (val) => {
        calculateManualOrderTotal();
    });

    addOrderItemRow();
}

function closeManualOrderModal() {
    document.getElementById('manual-order-modal').classList.remove('active');
    document.getElementById('manual-order-form').reset();
}

function addOrderItemRow() {
    const container = document.getElementById('mo-items-container');
    const products = db.getProducts().filter(p => !p.archived);
    const rowId = 'row-' + Date.now();
    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'mo-item-row';
    row.style = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 15px; align-items: end; pointer-events: auto;';

    row.innerHTML = `
        <div class="form-group" style="margin-bottom:0">
            <label style="font-size:0.75rem; color:#666; font-weight:700; display:block; margin-bottom:6px;">المنتج</label>
            <div id="${rowId}-prod-drop" class="mo-custom-dropdown">
                <div class="mo-dropdown-trigger" style="padding: 10px;">
                    <span>اختر منتج...</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="mo-dropdown-menu"></div>
                <input type="hidden" class="mo-product-select">
            </div>
        </div>
        <div class="form-group" style="margin-bottom:0">
            <label style="font-size:0.75rem; color:#666; font-weight:700; display:block; margin-bottom:6px;">اللون</label>
            <div id="${rowId}-color-drop" class="mo-custom-dropdown">
                <div class="mo-dropdown-trigger" style="padding: 10px; opacity: 0.5;">
                    <span>اختياري</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="mo-dropdown-menu"></div>
                <input type="hidden" class="mo-color">
            </div>
        </div>
        <div class="form-group" style="margin-bottom:0">
            <label style="font-size:0.75rem; color:#666; font-weight:700; display:block; margin-bottom:6px;">المقاس</label>
            <div id="${rowId}-size-drop" class="mo-custom-dropdown">
                <div class="mo-dropdown-trigger" style="padding: 10px; opacity: 0.5;">
                    <span>اختياري</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="mo-dropdown-menu"></div>
                <input type="hidden" class="mo-size">
            </div>
        </div>
        <div class="form-group" style="margin-bottom:0">
            <label style="font-size:0.75rem; color:#666; font-weight:700; display:block; margin-bottom:6px;">الكمية</label>
            <input type="number" class="mo-qty" value="1" min="1" style="width:100%; padding:10px; border-radius:12px; border:2px solid #f0f0f0; outline:none; height:44px;" onchange="calculateManualOrderTotal()">
        </div>
        <button type="button" class="btn-delete" onclick="this.parentElement.remove(); calculateManualOrderTotal();" style="height:44px; width:44px; border-radius:12px; border:none; cursor:pointer; background:#fff2f2; color:#ff4757; transition:all 0.3s; display:flex; align-items:center; justify-content:center;">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(row);

    // Init Product Dropdown
    const prodOptions = products.map(p => {
        const stock = parseInt(p.quantity) || 0;
        return {
            value: p.id,
            label: p.name,
            disabled: stock <= 0,
            html: `
                <div style="display:flex; align-items:center; gap:10px; width:100%; ${stock <= 0 ? 'opacity:0.6;' : ''}">
                    <img src="${p.image || (p.images && p.images[0]) || '../assets/placeholder.png'}" style="width:35px; height:35px; border-radius:6px; object-fit:cover;">
                    <div style="flex:1">
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <div style="font-weight:700; font-size:0.85rem; color:#333; line-height:1.2;">${p.name}</div>
                            ${p.sku ? `<span style="font-family:monospace; font-size:0.7rem; background:#f0f0f0; padding:1px 5px; border-radius:4px; color:#666; font-weight:700;">${p.sku}</span>` : ''}
                        </div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                            <span style="font-size:0.8rem; color:var(--primary-color); font-weight:700;">${p.price} ج.م</span>
                            <span style="font-size:0.7rem; padding:2px 8px; border-radius:10px; ${stock > 0 ? 'background:#e6f4ea; color:#1e7e34;' : 'background:#fce8e6; color:#c5221f;'}">
                                ${stock > 0 ? `متاح: ${stock}` : 'نفذ المخزن'}
                            </span>
                        </div>
                    </div>
                </div>
            `
        };
    });

    initCustomDropdown(`${rowId}-prod-drop`, prodOptions, (val) => {
        updateRowPrice(row, val);
    });
}

function updateRowPrice(row, productId) {
    const colorDropId = row.id + '-color-drop';
    const sizeDropId = row.id + '-size-drop';

    const colorHidden = row.querySelector('.mo-color');
    const sizeHidden = row.querySelector('.mo-size');
    const qtyInput = row.querySelector('.mo-qty');
    const colorTrigger = document.querySelector(`#${colorDropId} .mo-dropdown-trigger`);
    const sizeTrigger = document.querySelector(`#${sizeDropId} .mo-dropdown-trigger`);

    const updateMaxQty = () => {
        const product = db.getProduct(productId);
        if (!product) return;

        const sizeVal = sizeHidden.value;
        const colorVal = colorHidden.value;

        let availableStock = product.quantity || 0;
        if (product.variants && product.variants.length > 0) {
            // Find most specific match
            const variant = product.variants.find(v =>
                (sizeVal ? v.size === sizeVal : true) &&
                (colorVal ? v.color === colorVal : true)
            );
            if (variant) {
                availableStock = variant.quantity || 0;
                if (variant.price) {
                    // Update price display or logic if needed
                }
            }
        }

        qtyInput.max = availableStock;
        if (parseInt(qtyInput.value) > availableStock) qtyInput.value = availableStock;
        calculateManualOrderTotal();
    };

    if (productId) {
        const product = db.getProduct(productId);
        if (product) {
            qtyInput.max = product.quantity || 0;
            if (parseInt(qtyInput.value) > parseInt(qtyInput.max)) qtyInput.value = qtyInput.max;

            // Colors
            const colors = Array.isArray(product.color) ? product.color : (product.color ? product.color.split(/[,،/|]/).map(s => s.trim()).filter(s => s) : []);
            if (colors.length > 0) {
                const colorOptions = colors.map(c => ({ value: c, label: c }));
                initCustomDropdown(colorDropId, colorOptions, () => updateMaxQty(), "اختر لون...", false);
                colorTrigger.style.opacity = '1';
                colorTrigger.querySelector('span').innerText = 'اختر لون...';
            } else {
                initCustomDropdown(colorDropId, [], null, "لا يوجد ألوان", false);
            }

            // Sizes
            const sizes = Array.isArray(product.size) ? product.size : (product.size ? product.size.split(/[,،/|]/).map(s => s.trim()).filter(s => s) : []);
            if (sizes.length > 0) {
                const sizeOptions = sizes.map(s => {
                    let isDisabled = false;
                    let vStockHTML = '';
                    if (product.variants) {
                        const v = product.variants.find(v => v.size === s);
                        if (v) {
                            const vQty = v.quantity || 0;
                            vStockHTML = vQty > 0
                                ? ` <span style="font-size:0.75rem; color:#666">(${vQty} متاح)</span>`
                                : ` <span style="font-size:0.75rem; color:#c5221f; font-weight:700;">(نفذ المخزن)</span>`;
                            isDisabled = vQty <= 0;
                        }
                    }
                    return {
                        value: s,
                        label: s,
                        disabled: isDisabled,
                        html: `<span>${s}${vStockHTML}</span>`
                    };
                });

                initCustomDropdown(sizeDropId, sizeOptions, (sizeVal) => {
                    updateMaxQty();
                }, "اختر مقاس...", false);

                sizeTrigger.style.opacity = '1';
                sizeTrigger.querySelector('span').innerText = 'اختر مقاس...';
            } else {
                initCustomDropdown(sizeDropId, [], null, "لا يوجد مقاسات", false);
            }
        }
    }
    calculateManualOrderTotal();
}

function calculateManualOrderTotal() {
    let subtotal = 0;
    document.querySelectorAll('.mo-item-row').forEach(row => {
        const productId = row.querySelector('.mo-product-select').value;
        const size = row.querySelector('.mo-size').value;
        const qty = parseInt(row.querySelector('.mo-qty').value) || 0;

        if (productId) {
            const product = db.getProduct(productId);
            if (product) {
                let currentPrice = parseFloat(product.price) || 0;

                const color = row.querySelector('.mo-color').value;

                // Check for variant specific price
                if (product.variants && product.variants.length > 0) {
                    const variant = product.variants.find(v =>
                        (size ? v.size === size : true) &&
                        (color ? v.color === color : true)
                    );
                    if (variant && variant.price) {
                        currentPrice = parseFloat(variant.price);
                    }
                }

                subtotal += currentPrice * qty;
            }
        }
    });

    // Shipping Cost based on Governorate & Weight
    const gov = document.getElementById('mo-governorate').value;
    let shippingCost = 0;
    if (gov) {
        let totalWeight = 0;
        document.querySelectorAll('.mo-item-row').forEach(row => {
            const productId = row.querySelector('.mo-product-select').value;
            const qty = parseInt(row.querySelector('.mo-qty').value) || 0;
            if (productId) {
                const product = db.getProduct(productId);
                if (product) {
                    totalWeight += (product.weight || 0.5) * qty;
                }
            }
        });

        const rates = db.getShippingRates();
        const areaRate = rates.find(r => r.city === gov) || rates.find(r => r.city === 'المحافظات الأخرى');
        if (areaRate) {
            const baseRate = areaRate.rate || 0;
            const extraFee = areaRate.extra || 0;
            // Calculate: Base Rate + (Additional KG * Extra Fee)
            // If totalWeight <= 1kg, only baseRate. If > 1kg, round up the additional weight.
            const additionalWeight = Math.max(0, totalWeight - 1);
            shippingCost = baseRate + (Math.ceil(additionalWeight) * extraFee);
        }
    }

    const shippingEl = document.getElementById('mo-shipping-cost');
    if (shippingEl) shippingEl.value = shippingCost;

    const totalEl = document.getElementById('mo-total');
    if (totalEl) totalEl.value = subtotal + shippingCost;
}

// Global function to handle manual order submission
window.submitManualOrder = async function () {
    const btn = document.querySelector('button[onclick="submitManualOrder()"]');
    const originalContent = btn ? btn.innerHTML : 'إتمام إنشاء الطلب';

    const name = document.getElementById('mo-name').value.trim();
    const phone = document.getElementById('mo-phone').value.trim();
    const address = document.getElementById('mo-address').value.trim();
    const gov = document.getElementById('mo-governorate').value;

    if (!name || !phone || !gov || !address) {
        showAlert('يرجى ملء جميع بيانات العميل (الاسم، الهاتف، المحافظة، العنوان بالتفصيل)', 'error');
        return;
    }

    const rows = document.querySelectorAll('.mo-item-row');
    const items = [];

    for (const row of rows) {
        const productId = row.querySelector('.mo-product-select').value;
        const qty = parseInt(row.querySelector('.mo-qty').value) || 0;
        const color = row.querySelector('.mo-color').value;
        const size = row.querySelector('.mo-size').value;

        if (productId && qty > 0) {
            const product = db.getProduct(productId);
            if (product) {
                // Final Stock Validation
                let availableStock = product.quantity || 0;
                if (product.variants && product.variants.length > 0) {
                    const v = product.variants.find(v =>
                        (size ? v.size === size : true) &&
                        (color ? v.color === color : true)
                    );
                    if (v) availableStock = v.quantity || 0;
                }

                if (qty > availableStock) {
                    showAlert(`الكمية المطلوبة للمنتج "${product.name}" تتجاوز المخزون المتاح (${availableStock})`, 'error');
                    return;
                }

                items.push({
                    ...product,
                    quantity: qty,
                    selectedColor: color,
                    selectedSize: size
                });
            }
        }
    }

    if (items.length === 0) {
        showAlert('يرجى إضافة منتج واحد على الأقل للطلب', 'info');
        return;
    }

    const order = {
        customer: {
            name: name,
            phone: phone,
            email: '',
            province: gov,
            address: address
        },
        items: items,
        shippingCost: parseFloat(document.getElementById('mo-shipping-cost').value) || 0,
        total: parseFloat(document.getElementById('mo-total').value),
        paymentMethod: document.getElementById('mo-payment').value,
        allowInspection: false,
        status: 'Confirmed'
    };

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-left:8px"></i> جاري الحفظ...';
        }

        await db.saveOrder(order);
        closeManualOrderModal();

        // Refresh UI
        if (typeof refreshOrders === 'function') refreshOrders();
        if (typeof refreshProducts === 'function') refreshProducts();
        if (typeof refreshDashboard === 'function') refreshDashboard();

        showToast('تم إنشاء الطلب اليدوي بنجاح! ✅', 'success');
    } catch (error) {
        console.error('Manual order failed:', error);
        showAlert('حدث خطأ أثناء حفظ الطلب: ' + error.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
};
window.closeManualOrderModal = closeManualOrderModal;
window.addOrderItemRow = addOrderItemRow;
window.updateRowPrice = updateRowPrice;
window.calculateManualOrderTotal = calculateManualOrderTotal;

// --- Redundant Logic Removed --- (Modernized version at the bottom)

function triggerImport(type) {
    const input = document.getElementById('import-input');
    input.onchange = (e) => handleImport(e.target.files[0], type);
    input.click();
}

async function handleImport(file, type) {
    if (!file) return;
    if (typeof XLSX === 'undefined') {
        showAlert('حدث خطأ في تحميل مكتبة Excel. تأكد من اتصالك بالإنترنت.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            if (type === 'products') {
                const totalRows = rows.length;
                const shouldClear = await showConfirm(`تم العثور على ${totalRows} منتج. هل تريد مسح المنتجات الحالية قبل الاستيراد لضمان عدم وجود تكرار؟`);
                if (shouldClear) {
                    await db.clearAllProducts();
                }

                showToast('بدء استيراد المنتجات... يرجى الانتظار', 'info');
                let count = 0;
                const existingProducts = db.getProducts();

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    try {
                        const productName = row.name || row['الاسم'] || row['اسم المنتج'];
                        const productPrice = row.price || row['السعر'] || row['سعر المنتج'];
                        const productSku = (row.sku || row['كود المنتج (SKU)'] || '').toString().trim();

                        if (!productName) continue;

                        // Improved Parsing for Variants
                        const parseList = (val) => {
                            if (!val) return [];
                            return val.toString().split(/[,،/|]/).map(s => s.trim()).filter(s => s);
                        };

                        const product = {
                            name: productName,
                            price: parseFloat(productPrice) || 0,
                            oldPrice: parseFloat(row.oldPrice || row['السعر السابق'] || row['السعر القديم']) || null,
                            sku: productSku, // Import SKU
                            category: row.category || row['القسم'] || row['الفئة'] || 'إكسسوارات',
                            color: parseList(row.color || row['الألوان'] || row['اللون']),
                            size: parseList(row.size || row['المقاسات'] || row['المقاس'] || row['المقاسات (للعرض)']),
                            image: row.image || row['رابط الصورة'] || row['الصورة'] || '',
                            images: parseList(row.images || row['صور إضافية'] || row['الصور']),
                            description: row.description || row['الوصف'] || '',
                            quantity: parseInt(row.quantity || row['الكمية'] || row['المخزون'] || row['الكمية الكلية']) || 0,
                            archived: false,
                            lastUpdated: Date.now()
                        };

                        // Expert Import for Variants
                        const variantsImportField = row['تفاصيل المقاسات (للاستيراد)'] || row['variants_details'];
                        if (variantsImportField) {
                            try {
                                product.variants = variantsImportField.toString().split('|').map(v => {
                                    const parts = v.trim().split(':');
                                    if (parts.length >= 1) {
                                        return {
                                            size: parts[0].trim(),
                                            price: parseFloat(parts[1]) || product.price,
                                            quantity: parseInt(parts[2]) || 0
                                        };
                                    }
                                    return null;
                                }).filter(v => v !== null);
                            } catch (e) {
                                console.warn('Error parsing variants for product:', productName, e);
                                product.variants = [];
                            }
                        }

                        if (product.images.length === 0 && product.image) {
                            product.images = [product.image];
                        }

                        // SMART DUPLICATE DETECTION
                        const rowId = row.id || row['ID'] || row['المعرف'];
                        let matchedProduct = null;

                        if (rowId) {
                            product.id = rowId.toString();
                        } else {
                            // Try to find by SKU if provided
                            if (productSku) {
                                matchedProduct = existingProducts.find(p => p.sku === productSku);
                            }
                            // If not found by SKU, try by Name
                            if (!matchedProduct) {
                                matchedProduct = existingProducts.find(p => p.name === productName);
                            }

                            if (matchedProduct) {
                                product.id = matchedProduct.id;
                            } else {
                                product.id = Date.now().toString() + i;
                            }
                        }

                        await db.saveProduct(product, true);
                        count++;
                    } catch (rowError) {
                        console.error(`Error processing row ${i}:`, rowError);
                    }
                }

                // FORCE SYNC ALL AT ONCE
                showToast('جاري مزامنة البيانات مع السحاب...', 'info');
                await db.updateCloud('products');

                refreshProducts();
                showToast(`تم استيراد ${count} منتج بنجاح! ✅`, 'success');
            }
        } catch (e) {
            console.error('Import Error:', e);
            showAlert('حدث خطأ أثناء استيراد الملف. يرجى التأكد من تنسيق الملف الصحيح ومسميات الأعمدة.', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

let salesChart = null;
let categoryChart = null;

async function refreshStats() {
    const orders = db.getOrders();
    const products = db.getProducts();
    const analytics = await db.getAnalytics();

    let startDate = document.getElementById('stats-start-date').value;
    let endDate = document.getElementById('stats-end-date').value;
    const isCompare = document.getElementById('stats-compare').checked;

    const now = new Date();
    if (!startDate) {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString().split('T')[0];
        document.getElementById('stats-start-date').value = startDate;
    }
    if (!endDate) {
        endDate = now.toISOString().split('T')[0];
        document.getElementById('stats-end-date').value = endDate;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);

    // Filter orders for primary period
    const filteredOrders = orders.filter(o => {
        const od = new Date(o.date);
        return od >= start && od <= end;
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;

    // --- REAL ANALYTICS ---
    document.getElementById('live-users').innerText = analytics.live_users;
    document.getElementById('total-visits').innerText = analytics.total_visits;

    // Derived Metrics (Approximations based on data)
    // Derived Metrics (Smart estimates base on real data)
    const totalVisits = analytics.total_visits || 1;
    const conversionRate = ((totalOrders / totalVisits) * 100).toFixed(1);
    const activeProducts = products.filter(p => !p.archived).length;

    // Average time increases slightly with more products (approx 1 min per 20 products, base 2 min)
    const calculatedAvgTime = (2 + (activeProducts / 50)).toFixed(1);
    document.getElementById('avg-time').innerText = Math.min(calculatedAvgTime, 8.0).toFixed(1);

    // Bounce rate is inverse to conversion rate (Higher conversion = Lower bounce)
    // Base 60%, minus 2x conversion rate. Min 20%, Max 80%.
    let calculatedBounce = 60 - (parseFloat(conversionRate) * 2);
    calculatedBounce = Math.max(20, Math.min(80, calculatedBounce));
    document.getElementById('bounce-rate').innerText = calculatedBounce.toFixed(1) + '%';

    // --- TRAFFIC SOURCES ---
    const sourceList = document.getElementById('traffic-sources-list');
    if (sourceList) {
        sourceList.innerHTML = '';
        const sources = analytics.traffic_sources || {};
        const total = Object.values(sources).reduce((a, b) => a + b, 0) || 1;

        Object.entries(sources).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
            const perc = ((count / total) * 100).toFixed(0);
            sourceList.innerHTML += `
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.9rem;">
                        <span>${name}</span>
                        <span style="font-weight: bold;">${count} (${perc}%)</span>
                    </div>
                    <div style="height: 8px; background: #eee; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${perc}%; height: 100%; background: #3498db;"></div>
                    </div>
                </div>
            `;
        });
        if (Object.keys(sources).length === 0) {
            sourceList.innerHTML = '<p class="text-muted" style="text-align: center;">لا توجد بيانات متاحة بعد</p>';
        }
    }

    // 2. Sales Chart
    const labels = [];
    const data = [];
    const compData = [];

    // Days between start and end
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const step = Math.max(1, Math.ceil(diffDays / 10)); // Max 10-15 points on chart

    for (let i = 0; i <= diffDays; i += step) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        labels.push(d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }));

        // Calculate sales for this day/step
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setDate(dayEnd.getDate() + step);
        dayEnd.setHours(0, 0, 0, 0);

        const daySales = filteredOrders.filter(o => {
            const od = new Date(o.date);
            return od >= dayStart && od < dayEnd;
        }).reduce((sum, o) => sum + o.total, 0);
        data.push(daySales);

        if (isCompare) {
            const compStart = new Date(start);
            compStart.setDate(compStart.getDate() - diffDays + i - step);
            const compEnd = new Date(compStart);
            compEnd.setDate(compEnd.getDate() + step);

            const prevSales = orders.filter(o => {
                const od = new Date(o.date);
                return od >= compStart && od < compEnd;
            }).reduce((sum, o) => sum + o.total, 0);
            compData.push(prevSales);
        }
    }

    if (salesChart) salesChart.destroy();
    const ctxSales = document.getElementById('salesChart').getContext('2d');

    const datasets = [{
        label: 'المبيعات الحالية (ج.م)',
        data: data,
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        fill: true,
        tension: 0.4
    }];

    if (isCompare) {
        datasets.push({
            label: 'الفترة السابقة (ج.م)',
            data: compData,
            borderColor: '#95a5a6',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4
        });
    }

    salesChart = new Chart(ctxSales, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: { legend: { display: isCompare, position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // 3. Category Distribution
    const cats = {};
    products.forEach(p => {
        cats[p.category] = (cats[p.category] || 0) + 1;
    });

    if (categoryChart) categoryChart.destroy();
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctxCat, {
        type: 'doughnut',
        data: {
            labels: Object.keys(cats),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function refreshAbandonedCarts() {
    const abandoned = db.getAbandonedCarts();
    const tbody = document.getElementById('abandoned-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (abandoned.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">لا توجد سلال متروكة حالياً</td></tr>';
        return;
    }

    // Abandoned Carts
    abandoned.forEach(item => {
        const tr = document.createElement('tr');
        const itemsList = (item.cart || []).map(i => `${i.name} (${i.quantity}x)`).join(', ');
        const total = (item.cart || []).reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const customerName = item.customer?.name || 'زائر غير مسجل';
        const customerPhone = item.customer?.phone || '';

        tr.innerHTML = `
            <td>${new Date(item.date).toLocaleString('ar-EG')}</td>
            <td>
                <div><strong>${customerName}</strong></div>
                <div style="font-size:0.8rem; color:#666">${customerPhone || 'لا يوجد رقم'}</div>
            </td>
            <td><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${itemsList}">${itemsList}</div></td>
            <td>${total} ج.م</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-icon btn-whatsapp whatsapp-btn" 
                            data-phone="${customerPhone}" 
                            data-name="${customerName}" 
                            data-total="${total}" 
                            title="تذكير واتساب">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <button onclick="deleteAbandonedCart('${item.sessionId}')" class="btn-icon btn-trash" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Add event listeners to WhatsApp buttons
    document.querySelectorAll('.whatsapp-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const phone = this.dataset.phone;
            const name = this.dataset.name;
            const total = this.dataset.total;
            sendAbandonedWhatsApp(phone, name, total);
        });
    });
}

function sendAbandonedWhatsApp(phone, name, total) {
    if (!phone) return showAlert('لا يوجد رقم هاتف متاح', 'error');

    const settings = db.getSettings();

    // رابط المتجر الأساسي
    const storeUrl = 'https://elsharkawystore.com';

    // الرسالة الافتراضية مع رابط المتجر
    let defaultTemplate = `مرحباً *{name}*! 👋

لاحظنا أنك نسيت بعض المنتجات الرائعة في سلة تسوقك 🛍️

💰 *الإجمالي: {total} ج.م*

يمكنك إكمال طلبك الآن من خلال زيارة متجرنا:
🔗 https://elsharkawystore.com

هل يمكننا مساعدتك في إكمال طلبك؟ 😊

*الشرقاوي* - التميز عنواننا ✨`;

    let template = settings.abandonedMsg || defaultTemplate;

    // استبدال المتغيرات
    let message = template
        .replace('{name}', name)
        .replace('{total}', total)
        .replace('{link}', storeUrl)
        .replace('{storeUrl}', storeUrl);

    // تنظيف رقم الهاتف وتنسيقه بشكل صحيح
    let cleanPhone = phone.replace(/\D/g, ''); // إزالة كل شيء ما عدا الأرقام

    // إضافة كود مصر إذا لم يكن موجوداً
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '2' + cleanPhone; // تحويل 010... إلى 2010...
    } else if (!cleanPhone.startsWith('2')) {
        cleanPhone = '2' + cleanPhone;
    }

    // استخدام wa.me بدلاً من api.whatsapp.com
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function deleteAbandonedCart(id) {
    if (!id) return;
    showConfirm('هل أنت متأكد من حذف هذه السلة من القائمة؟', () => {
        db.removeAbandonedCart(id);
        refreshAbandonedCarts();
        showToast('تم حذف السلة بنجاح', 'success');
    });
}

// Export functions to global scope
window.sendAbandonedWhatsApp = sendAbandonedWhatsApp;
window.deleteAbandonedCart = deleteAbandonedCart;
window.deleteAbandoned = deleteAbandonedCart; // For safety with different naming
window.refreshAbandonedCarts = refreshAbandonedCarts;

function refreshDiscounts() {
    // 1. Refresh Coupons
    const coupons = db.getCoupons();
    const tbody = document.getElementById('coupons-table');
    if (tbody) tbody.innerHTML = '';

    coupons.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.code}</strong></td>
            <td>${c.pct}%</td>
            <td>${c.expiry ? new Date(c.expiry).toLocaleDateString('ar-EG') : 'بدون انتهاء'}</td>
            <td>
                <button onclick="adminDeleteCoupon('${c.code}')" class="btn-icon btn-trash" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // 2. Refresh Special Offers
    const offers = db.getSpecialOffers();
    document.getElementById('off-shipping-threshold').value = offers.freeShippingThreshold || '';
    document.getElementById('off-global-discount').value = offers.globalDiscountPercentage || 0;
    document.getElementById('off-global-enabled').checked = offers.globalDiscountEnabled || false;
    document.getElementById('off-global-text').value = offers.globalDiscountText || '';
}

// ... existing code ...

function refreshStaff() {
    const staff = db.getStaff();
    const tbody = document.getElementById('staff-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    staff.forEach(item => {
        const tr = document.createElement('tr');
        const perms = (item.permissions || []).map(p => {
            const map = { products: 'منتجات', orders: 'طلبات', customers: 'عملاء', discounts: 'خصومات', stats: 'إحصائيات', settings: 'إعدادات', moderation: 'مراجعة التقييمات' };
            return map[p] || p;
        }).join('، ');

        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.email}</td>
            <td><small>${perms}</small></td>
            <td>
                <div style="display:flex; gap:5px;">
                    <button onclick="editStaff('${item.id}')" class="btn-icon btn-edit" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="inviteStaff('${item.email}', '${item.pass}')" class="btn-icon btn-invite" title="إرسال دعوة">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                    <button onclick="adminDeleteStaff('${item.id}')" class="btn-icon btn-trash" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ... existing code ...

function refreshShipping() {
    const rates = db.getShippingRates();
    const tbody = document.getElementById('shipping-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    rates.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${r.city}</strong></td>
            <td>
                <div>أساسي: <strong>${r.rate} ج.م</strong></div>
            </td>
            <td>
                <div style="display:flex; gap:5px;">
                    <button onclick="editShipping('${r.id}')" class="btn-icon btn-edit" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteShipping('${r.id}')" class="btn-icon btn-trash" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openShippingModal(id = null) {
    const modal = document.getElementById('shipping-modal');
    modal.classList.add('active');

    document.getElementById('sh-id').value = '';
    document.getElementById('sh-city').value = '';
    document.getElementById('sh-rate').value = '';

    if (id) {
        const rate = db.getShippingRates().find(r => r.id == id);
        if (rate) {
            document.getElementById('sh-id').value = rate.id;
            document.getElementById('sh-city').value = rate.city;
            document.getElementById('sh-rate').value = rate.rate;
        }
    }
}

function closeShippingModal() {
    document.getElementById('shipping-modal').classList.remove('active');
}

function editShipping(id) {
    openShippingModal(id);
}

function deleteShipping(id) {
    showConfirm('هل أنت متأكد من حذف هذه المنطقة؟', () => {
        db.deleteShippingArea(id);
        refreshShipping();
        showToast('تم حذف المنطقة بنجاح', 'success');
    });
}

function saveShipping(e) {
    if (e) e.preventDefault();
    const id = document.getElementById('sh-id').value;
    const city = document.getElementById('sh-city').value;
    const rate = parseFloat(document.getElementById('sh-rate').value);

    let rates = db.getShippingRates();
    if (id) {
        const index = rates.findIndex(r => r.id == id);
        if (index !== -1) rates[index] = { id: parseInt(id), city, rate };
    } else {
        rates.push({ id: Date.now(), city, rate });
    }

    db.saveShippingRates(rates);
    // Assuming 'settings' is available or passed if needed for saveShippingSettings
    // As per instruction, adding this line. If 'settings' is not defined, it will cause an error.
    // A more robust solution would be to pass settings or retrieve them within this function.
    // For now, following the instruction literally.
    // db.saveShippingSettings(settings); // This line was in the instruction's diff but 'settings' is not defined here.
    closeShippingModal();
    refreshShipping();
    showToast('تم حفظ إعدادات الشحن بنجاح', 'success');
}

// Global Event Listeners
document.addEventListener('submit', (e) => {
    if (e.target.id === 'shipping-form') {
        saveShipping(e);
    }
});


function openStaffModal() {
    const modal = document.getElementById('staff-modal');
    modal.classList.add('active');

    // Clear hidden ID for new staff (editStaff will set it if needed)
    document.getElementById('st-id').value = '';

    // Check if Select All checkbox exists, if not add it
    const permContainer = modal.querySelector('.permissions-grid');
    if (permContainer && !document.getElementById('st-all-perms')) {
        const div = document.createElement('div');
        div.style.gridColumn = "1 / -1";
        div.style.borderBottom = "1px solid #ddd";
        div.style.marginBottom = "5px";
        div.style.paddingBottom = "5px";
        div.innerHTML = `<label style="font-weight:bold; color:#2c3e50;"><input type="checkbox" id="st-all-perms" onchange="toggleAllPerms(this)"> صلاحية كاملة (Full Access)</label>`;
        permContainer.prepend(div);
    }
}

function toggleAllPerms(source) {
    const checkboxes = document.querySelectorAll('#staff-form input[type="checkbox"]:not(#st-all-perms)');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

function closeStaffModal() {
    document.getElementById('staff-modal').classList.remove('active');
    document.getElementById('staff-form').reset();
}

const staffForm = document.getElementById('staff-form');
if (staffForm) {
    staffForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const perms = [];
        document.querySelectorAll('#staff-form input[type="checkbox"]:checked').forEach(cb => {
            if (cb.id !== 'st-all-perms') { // Exclude the "Full Access" checkbox itself
                perms.push(cb.value);
            }
        });

        const member = {
            id: document.getElementById('st-id').value || Date.now(),
            name: document.getElementById('st-name').value,
            email: document.getElementById('st-email').value,
            pass: document.getElementById('st-pass').value,
            pin: document.getElementById('st-pin').value || null,
            permissions: perms
        };

        db.saveStaff(member);
        closeStaffModal();
        refreshStaff();
        // Show invitation link immediately
        inviteStaff(member.email, member.pass);
    });
}

function editStaff(id) {
    const member = db.getStaff().find(s => s.id === id);
    if (!member) return;

    openStaffModal();
    document.getElementById('st-id').value = member.id;
    document.getElementById('st-name').value = member.name;
    document.getElementById('st-email').value = member.email;
    document.getElementById('st-pass').value = member.pass;
    document.getElementById('st-pin').value = member.pin || '';

    // Set permissions
    document.querySelectorAll('#staff-form input[type="checkbox"]').forEach(cb => {
        cb.checked = (member.permissions || []).includes(cb.value);
    });
}

function inviteStaff(email, pass) {
    const modal = document.getElementById('invite-modal');
    if (!modal) return;

    const baseUrl = window.location.origin;
    const cleanUrl = baseUrl + '/admin-login';
    const inviteLink = `${cleanUrl}?email=${encodeURIComponent(email)}`;

    document.getElementById('inv-link').value = inviteLink;
    document.getElementById('inv-email').value = email;
    document.getElementById('inv-pass').value = pass;

    modal.classList.add('active');
}

function copyInvite(type) {
    let text = "";
    if (type === 'link') text = document.getElementById('inv-link').value;
    else if (type === 'email') text = document.getElementById('inv-email').value;
    else if (type === 'pass') text = document.getElementById('inv-pass').value;

    navigator.clipboard.writeText(text).then(() => {
        showToast('تم النسخ بنجاح', 'success');
    });
}

function getInviteText(email, pass) {
    const baseUrl = window.location.origin;
    const cleanUrl = baseUrl + '/admin-login';
    const inviteLink = `${cleanUrl}?email=${encodeURIComponent(email)}`;

    return `مرحباً بك في فريق الشرقاوي! 👋\n\nتم إنشاء حساب موظف لك بنجاح.\n\nبيانات الدخول:\nالبريد: ${email}\nكلمة المرور: ${pass}\n\nرابط الدخول المباشر:\n${inviteLink}`;
}

function adminDeleteStaff(id) {
    showConfirm('هل أنت متأكد من حذف هذا الموظف؟', () => {
        db.deleteStaff(id);
        refreshStaff();
        showToast('تم حذف الموظف بنجاح', 'success');
    });
}

// --- Advanced Export System ---
let currentExportType = '';
const fieldDefinitions = {
    products: [
        { id: 'id', label: 'ID' },
        { id: 'sku', label: 'كود المنتج (SKU)' },
        { id: 'name', label: 'اسم المنتج' },
        { id: 'price', label: 'السعر' },
        { id: 'category', label: 'القسم' },
        { id: 'stock', label: 'الكمية الكلية' }, // Changed label for clarity
        { id: 'variants_details', label: 'تفاصيل المقاسات (للاستيراد)' }, // New field for robust import
        { id: 'color', label: 'الألوان' },
        { id: 'size', label: 'المقاسات (للعرض)' },
        { id: 'image', label: 'رابط الصورة' },
        { id: 'description', label: 'الوصف' },
        { id: 'status', label: 'الحالة' },
        { id: 'url', label: 'رابط المنتج' }
    ],
    // ... (orders and customers remain unchanged)
    orders: [
        { id: 'id', label: 'رقم' },
        { id: 'date', label: 'التاريخ' },
        { id: 'customer', label: 'العميل' },
        { id: 'phone', label: 'الهاتف' },
        { id: 'city', label: 'المحافظة' },
        { id: 'total', label: 'المبلغ' },
        { id: 'status', label: 'الحالة' }
    ],
    customers: [
        { id: 'name', label: 'الاسم' },
        { id: 'email', label: 'الايميل' },
        { id: 'phone', label: 'الهاتف' },
        { id: 'date', label: 'التسجيل' }
    ]
};

function openExportModal(type) {
    currentExportType = type || 'orders';
    const container = document.getElementById('export-fields-container');
    const title = document.getElementById('export-modal-title');

    if (container && fieldDefinitions[currentExportType]) {
        container.innerHTML = fieldDefinitions[currentExportType].map(f => `
            <label class="export-field-card">
                <input type="checkbox" value="${f.id}" checked>
                <span>${f.label}</span>
            </label>
        `).join('');
    }

    const titles = { products: 'تصدير المنتجات', orders: 'تصدير الطلبات', customers: 'تصدير العملاء' };
    if (title) title.innerText = titles[currentExportType] || 'تصدير البيانات';

    document.getElementById('export-modal').classList.add('active');
}

// Compatibility function for old buttons
function exportCustomersToExcel() {
    openExportModal('customers');
}


function confirmExport() {
    const fields = Array.from(document.querySelectorAll('#export-fields-container input:checked')).map(cb => cb.value);
    if (fields.length === 0) return showToast('اختر حقلاً واحداً على الأقل', 'error');

    let data = [];
    let filename = `Elsharkawy_${currentExportType}`;

    if (currentExportType === 'products') {
        data = db.getProducts().map(p => {
            const row = {};
            if (fields.includes('id')) row['ID'] = p.id;
            if (fields.includes('sku')) row['كود المنتج (SKU)'] = p.sku || '';
            if (fields.includes('name')) row['اسم المنتج'] = p.name;
            if (fields.includes('price')) row['السعر'] = p.price;
            if (fields.includes('category')) row['القسم'] = p.category;
            if (fields.includes('stock')) row['الكمية الكلية'] = p.quantity !== undefined ? p.quantity : 100;

            // Expert Export for Variants
            if (fields.includes('variants_details')) {
                // Formatting: Size:Price:Qty | Size2:Price2:Qty2
                if (p.variants && p.variants.length > 0) {
                    row['تفاصيل المقاسات (للاستيراد)'] = p.variants.map(v => `${v.size}:${v.price}:${v.quantity}`).join(' | ');
                } else {
                    row['تفاصيل المقاسات (للاستيراد)'] = '';
                }
            }

            if (fields.includes('color')) row['الألوان'] = Array.isArray(p.color) ? p.color.join(', ') : (p.color || '');
            if (fields.includes('size')) row['المقاسات (للعرض)'] = (p.size || []).join(', ');
            if (fields.includes('image')) row['رابط الصورة'] = (p.images && p.images.length > 0) ? p.images[0] : (p.image || '');
            if (fields.includes('description')) row['الوصف'] = p.description || '';
            if (fields.includes('status')) row['الحالة'] = p.archived ? 'مؤرشف' : 'نشط';
            if (fields.includes('url')) {
                const baseUrl = window.location.origin;
                row['رابط المنتج'] = `${baseUrl}/product.html?id=${p.id}`;
            }
            return row;
        });
    } else if (currentExportType === 'orders') {
        data = db.getOrders().map(o => {
            const row = {};
            if (fields.includes('id')) row['رقم'] = o.id.split('-').pop();
            if (fields.includes('date')) row['التاريخ'] = new Date(o.date).toLocaleDateString('ar-EG');
            if (fields.includes('customer')) row['العميل'] = o.customer?.name || 'مجهول';
            if (fields.includes('phone')) row['الهاتف'] = o.customer?.phone || '';
            if (fields.includes('city')) row['المحافظة'] = o.customer?.city || '';
            if (fields.includes('total')) row['المبلغ'] = o.total;
            if (fields.includes('status')) row['الحالة'] = o.status;
            return row;
        });
    } else if (currentExportType === 'customers') {
        data = JSON.parse(localStorage.getItem('customers') || '[]').map(c => {
            const row = {};
            if (fields.includes('name')) row['الاسم'] = c.name;
            if (fields.includes('email')) row['الايميل'] = c.email;
            if (fields.includes('phone')) row['الهاتف'] = c.phone || '';
            if (fields.includes('date')) row['التسجيل'] = c.date || '';
            return row;
        });
    }

    if (data.length === 0) return showToast('لا توجد بيانات لتصديرها', 'info');
    downloadExcel(data, filename);
    closeExportModal();
}

function downloadExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const wscols = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length + 5, 20) }));
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('تم التحميل بنجاح ✅', 'success');
}

function closeExportModal() {
    document.getElementById('export-modal').classList.remove('active');
}

// Order Tabs Logic
function setOrderFilter(status, el) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    refreshOrders();
}

// Global Exports
window.openExportModal = openExportModal;
window.closeExportModal = closeExportModal;
window.confirmExport = confirmExport;
window.setOrderFilter = setOrderFilter;


// Export functions to global scope
window.adminArchiveProduct = adminArchiveProduct;
window.adminUnarchiveProduct = adminUnarchiveProduct;
window.adminArchiveOrder = adminArchiveOrder;
window.adminDeleteOrder = adminDeleteOrder;
window.adminCancelOrder = adminCancelOrder;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewOrder = viewOrder;
window.updateStatus = updateStatus;
window.showSection = showSection;
window.refreshProducts = refreshProducts;
window.refreshOrders = refreshOrders;
window.refreshCustomers = refreshCustomers;
window.adminDeleteCustomer = adminDeleteCustomer;
window.refreshSettings = refreshSettings;
window.refreshStats = refreshStats;
window.refreshAbandonedCarts = refreshAbandonedCarts;
window.refreshDiscounts = refreshDiscounts;
window.refreshStaff = refreshStaff;
window.refreshShipping = refreshShipping;
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.openCouponModal = openCouponModal;
window.closeCouponModal = closeCouponModal;
window.openExportModal = openExportModal;
window.closeExportModal = closeExportModal;
window.openBulkWhatsAppModal = openBulkWhatsAppModal;
window.closeBulkWhatsAppModal = closeBulkWhatsAppModal;
window.startBulkWhatsApp = startBulkWhatsApp;
window.sendToCurrentCustomer = sendToCurrentCustomer;
window.skipCurrentCustomer = skipCurrentCustomer;
window.stopBulkWhatsApp = stopBulkWhatsApp;
// performExport and triggerImport temporarily removed - functions not defined
window.openManualOrderModal = openManualOrderModal;
window.closeManualOrderModal = closeManualOrderModal;
window.addOrderItemRow = addOrderItemRow;
window.updateRowPrice = updateRowPrice;
window.calculateManualOrderTotal = calculateManualOrderTotal;
window.openStaffModal = openStaffModal;
window.closeStaffModal = closeStaffModal;
window.toggleAllPerms = toggleAllPerms;
window.inviteStaff = inviteStaff;
window.copyInvite = copyInvite;
window.getInviteText = getInviteText;
window.editStaff = editStaff;
window.adminDeleteStaff = adminDeleteStaff;
window.openShippingModal = openShippingModal;
window.closeShippingModal = closeShippingModal;
window.editShipping = editShipping;
window.deleteShipping = deleteShipping;
window.exportCustomersToExcel = exportCustomersToExcel;
if (typeof adminDeleteCoupon === 'function') window.adminDeleteCoupon = adminDeleteCoupon;
window.removeProductImage = removeProductImage;
window.initImageDropZone = initImageDropZone;
window.toggleSelectAll = toggleSelectAll;
window.updateBulkActionsUI = updateBulkActionsUI;
window.bulkDelete = bulkDelete;
window.bulkArchive = bulkArchive;
window.addCollectionField = addCollectionField;
window.adminClearAllProducts = adminClearAllProducts;
window.addReviewField = addReviewField;

function copySitemapLink() {
    const sitemapInput = document.getElementById('sitemap-url');
    sitemapInput.select();
    sitemapInput.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(sitemapInput.value).then(() => {
        showToast('تم نسخ رابط خريطة الموقع بنجاح!', 'success');
    });
}
window.copySitemapLink = copySitemapLink;

function refreshModeration() {
    const pending = db.getPendingReviews();
    const tbody = document.getElementById('moderation-table');
    if (!tbody) return;
    tbody.innerHTML = '';

    const badge = document.getElementById('pending-reviews-count');
    if (badge) {
        badge.innerText = pending.length;
        badge.style.display = pending.length > 0 ? 'inline-block' : 'none';
    }

    if (pending.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">لا توجد تقييمات في انتظار المراجعة</td></tr>';
        return;
    }

    pending.forEach(rev => {
        const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${rev.date}</td>
            <td><strong>${rev.name}</strong></td>
            <td style="color: #f1c40f;">${stars}</td>
            <td><div style="max-width: 300px; font-size: 0.9rem;">${rev.comment}</div></td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button onclick="approveReview(${rev.id})" class="btn-action" style="background: #2ecc71; color: white; border: none; padding: 5px 10px; border-radius: 4px;">
                        <i class="fas fa-check"></i> موافقة
                    </button>
                    <button onclick="declineReview(${rev.id})" class="btn-action btn-delete">
                        <i class="fas fa-times"></i> رفض
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function approveReview(id) {
    db.approveReview(id);
    refreshModeration();
    showToast('تمت الموافقة على التقييم بنجاح وسيظهر في الصفحة الرئيسية', 'success');
}

function declineReview(id) {
    showConfirm('هل أنت متأكد من رفض وحذف هذا التقييم؟', () => {
        db.deletePendingReview(id); // Changed from db.deleteReview(id) to db.deletePendingReview(id) to match original function logic
        refreshModeration();
        showToast('تم رفض وحذف التقييم بنجاح', 'success');
    });
}

window.approveReview = approveReview;
window.declineReview = declineReview;
window.refreshModeration = refreshModeration;

// Initial check for moderation badge
setTimeout(refreshModeration, 1000);

function printShippingLabel(orderId) {
    const order = db.getOrders().find(o => o.id == orderId); // Changed from orders.find to db.getOrders().find
    if (!order) {
        showAlert('الطلب غير موجود', 'error');
        return;
    }

    const settings = db.getSettings();
    const storeName = 'رويعي الشرقاوي لإكسسوار الموبيليا';
    const whatsapp = settings.whatsapp || '';

    const printWindow = window.open('', '_blank');
    const itemsHtml = order.items.map(item => {
        let variant = '';
        if (item.selectedColor) variant += ` لون: ${item.selectedColor}`;
        if (item.selectedSize) variant += ` مقاس: ${item.selectedSize}`;
        return `
            <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.name}${variant ? ' (' + variant + ')' : ''}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.price} ج.م</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.price * item.quantity} ج.م</td>
            </tr>
        `;
    }).join('');

    printWindow.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <title>بوليصة شحن - ${order.id}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Cairo', sans-serif; padding: 20px; color: #333; }
                .label-container { border: 2px solid #000; padding: 20px; max-width: 800px; margin: 0 auto; position: relative; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
                .store-name { font-size: 24px; font-weight: 900; }
                .order-id { font-size: 20px; font-weight: 700; }
                .section { margin-bottom: 20px; }
                .section-title { font-weight: 700; background: #eee; padding: 5px 10px; margin-bottom: 10px; border-radius: 4px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .info-box { border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .total-box { margin-top: 20px; text-align: left; font-size: 1.2rem; font-weight: 900; background: #f9f9f9; padding: 10px; border: 1px solid #000; }
                .footer { margin-top: 30px; text-align: center; font-size: 0.9rem; border-top: 1px dashed #ccc; padding-top: 10px; }
                @media print {
                    .no-print { display: none; }
                    body { padding: 0; }
                    .label-container { border: 2px solid #000; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="text-align: center; margin-bottom: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-family: 'Cairo', sans-serif; font-weight: bold;">اضغط للتحميل PDF أو الطباعة</button>
            </div>
            
            <div class="label-container">
                <div class="header">
                    <div class="store-name">${storeName}</div>
                    <div class="order-id">رقم الطلب: ${order.id}</div>
                </div>

                <div class="section">
                    <div class="info-grid">
                        <div class="info-box">
                            <div class="section-title">بيانات العميل</div>
                            <p><strong>الاسم:</strong> ${order.customer.name}</p>
                            <p><strong>الهاتف:</strong> ${order.customer.phone}</p>
                            <p><strong>العنوان:</strong> ${order.customer.address}</p>
                            ${(order.customer.province || order.customer.governorate) ? `<p><strong>المحافظة:</strong> ${order.customer.province || order.customer.governorate}</p>` : ''}
                        </div>
                        <div class="info-box">
                            <div class="section-title">تفاصيل الشحن</div>
                            <p><strong>التاريخ:</strong> ${new Date(order.date).toLocaleDateString('ar-EG')}</p>
                            <p><strong>طريقة الدفع:</strong> ${getPaymentMethodName(order.paymentMethod)}</p>
                            <p><strong>شركة الشحن:</strong> ............................</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">المنتجات المرسلة</div>
                    <table>
                        <thead>
                            <tr style="background: #f4f4f4;">
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right; width: 40%;">المنتج</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">الكمية</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">السعر</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr style="background: #eee; font-weight: bold;">
                                <td colspan="3" style="border: 1px solid #ddd; padding: 10px; text-align: left;">المجموع الكلي:</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #c0392b;">${order.total} ج.م</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div class="total-box">
                    إجمالي المبلغ المطلوب تحصيله: ${(order.paymentMethod === 'vodafone' || order.paymentMethod === 'instapay' || order.paymentMethod === 'Vodafone Cash' || order.paymentMethod === 'InstaPay') ? '0' : order.total} ج.م
                    ${(order.paymentMethod === 'vodafone' || order.paymentMethod === 'instapay' || order.paymentMethod === 'Vodafone Cash' || order.paymentMethod === 'InstaPay') ? '<div style="font-size: 0.9rem; color: #27ae60;">(خالص الثمن - تم الدفع إلكترونياً)</div>' : ''}
                </div>

                <div class="footer">
                    شكراً لشرائكم من ${storeName}<br>
                    ${whatsapp ? 'للتواصل عبر واتساب: ' + whatsapp : ''}
                </div>
            </div>

            <script>
                window.onload = function() {
                    // Slight delay to ensure fonts are loaded
                    setTimeout(() => {
                        // window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

window.printShippingLabel = printShippingLabel;

// --- Security & App Lock Logic ---
let currentPin = "";
function appendPin(digit) {
    if (currentPin.length < 4) {
        currentPin += digit;
        updatePinDots();
        if (currentPin.length === 4) {
            setTimeout(validatePin, 300);
        }
    }
}

function deletePin() {
    currentPin = currentPin.slice(0, -1);
    updatePinDots();
}

function clearPin() {
    currentPin = "";
    updatePinDots();
}

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, i) => {
        if (i < currentPin.length) dot.classList.add('filled');
        else dot.classList.remove('filled');
    });
}

function validatePin() {
    const admin = db.getLoggedAdmin();
    const settings = db.getSettings();

    // Check if it's Super Admin or Staff
    let targetPin = "";
    if (admin.role === 'admin') {
        targetPin = settings.adminPin || "0000";
    } else {
        // Find staff pin from DB (not just token for security sync)
        const staff = db.getStaff();
        const member = staff.find(s => s.email === admin.email);
        targetPin = member ? member.pin : "";
    }

    if (currentPin === targetPin) {
        document.getElementById('app-lock-modal').classList.remove('active');
        showToast('تم إلغاء القفل بنجاح', 'success');
        clearPin();
        // Mark as unlocked for this session
        sessionStorage.setItem('admin_unlocked', 'true');
    } else {
        showToast('رمز PIN غير صحيح', 'error');
        clearPin();
        // Shake animation
        const content = document.querySelector('.lock-screen-content');
        content.style.animation = 'shake 0.5s';
        setTimeout(() => content.style.animation = '', 500);
    }
}

// Security Section Init
function initSecurity() {
    const admin = db.getLoggedAdmin();
    const menuSecurity = document.getElementById('menu-security');

    if (!menuSecurity) return; // Element doesn't exist, skip initialization

    if (admin.role !== 'admin') {
        menuSecurity.style.display = 'none';
        return;
    }
    menuSecurity.style.display = 'flex';

    const settings = db.getSettings();
    const saEmail = document.getElementById('sa-email');
    const saPin = document.getElementById('sa-pin');

    if (saEmail) saEmail.value = settings.adminEmail || 'admin@elsharkawystore.com';
    if (saPin) saPin.value = settings.adminPin || '0000';
}

// Logic for Super Admin Form
const superAdminForm = document.getElementById('super-admin-form');
if (superAdminForm) {
    superAdminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEmail = document.getElementById('sa-new-email').value;
        const newPass = document.getElementById('sa-new-pass').value;
        const confirmPass = document.getElementById('sa-confirm-pass').value;
        const newPin = document.getElementById('sa-pin').value;

        if (newPass && newPass !== confirmPass) {
            showAlert('كلمات المرور غير متطابقة', 'error');
            return;
        }

        const settings = db.getSettings();
        if (newEmail) settings.adminEmail = newEmail;
        if (newPass) settings.adminPass = newPass;
        if (newPin) settings.adminPin = newPin;

        db.saveSettings(settings);
        showToast('تم تحديث بيانات المدير العام بنجاح', 'success');
        superAdminForm.reset();
        initSecurity();
    });
}

// Biometrics Mockup
function setupBiometrics() {
    const btn = document.getElementById('biometric-btn');
    btn.innerText = "جاري الاتصال بالمستشعر...";
    btn.disabled = true;

    setTimeout(() => {
        showToast('تم تفعيل المصادقة البيومترية بنجاح لهذا المتصفح', 'success');
        btn.innerText = "المصادقة البيومترية مفعلة ✓";
        btn.style.background = "#9b59b6";
        btn.style.color = "white";
    }, 2000);
}

// App Lock Start Check
function checkAppLock() {
    const settings = db.getSettings();
    const admin = db.getLoggedAdmin();
    const isUnlocked = sessionStorage.getItem('admin_unlocked') === 'true';

    if (settings.appLockEnabled && !isUnlocked && admin) {
        document.getElementById('app-lock-modal').classList.add('active');
        document.getElementById('lock-username').innerText = admin.name;
    }
}

// Export Security functions
window.appendPin = appendPin;
window.deletePin = deletePin;
window.clearPin = clearPin;
window.setupBiometrics = setupBiometrics;

// --- Update Settings Save ---
const settingsForm = document.getElementById('settings-form');
if (settingsForm) {
    const originalSubmit = settingsForm.onsubmit || settingsForm.addEventListener;
    // We'll hook into it at the top of admin.js too or just override/extend it.
    // Looking at admin.js, settings-form is handled by a listener.
}



// App Security Management (Mobile App)
function refreshAppSecurity() {
    const isLockOn = localStorage.getItem('app_lock_enabled') === 'true';
    const isBioOn = localStorage.getItem('app_biometric_enabled') === 'true';
    const pin = localStorage.getItem('app_pin') || "1234";

    const lockToggle = document.getElementById('app-sec-enabled');
    const bioToggle = document.getElementById('app-sec-bio');
    const pinInput = document.getElementById('app-sec-pin');
    const settingsArea = document.getElementById('pin-settings-area');

    if (lockToggle) lockToggle.checked = isLockOn;
    if (bioToggle) bioToggle.checked = isBioOn;
    if (pinInput) pinInput.value = pin;

    // Show/Hide settings based on whether lock is enabled
    if (settingsArea) {
        settingsArea.style.opacity = isLockOn ? '1' : '0.5';
        settingsArea.style.pointerEvents = isLockOn ? 'all' : 'none';
    }
}

function saveAppSecuritySettings() {
    const enabled = document.getElementById('app-sec-enabled').checked;
    const bio = document.getElementById('app-sec-bio').checked;
    const pin = document.getElementById('app-sec-pin').value;

    if (enabled && pin.length !== 4) {
        showAlert('يجب أن يتكون رمز PIN من 4 أرقام', 'error');
        return;
    }

    localStorage.setItem('app_lock_enabled', enabled);
    localStorage.setItem('app_biometric_enabled', bio);
    localStorage.setItem('app_pin', pin);

    showToast(enabled ? 'تم تفعيل حماية التطبيق بنجاح' : 'تم إلغاء قفل التطبيق بنجاح', 'success');
    refreshAppSecurity();
}

async function syncCloudData() {
    const btn = document.getElementById('sync-btn');
    if (!btn) return;

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارِ المزامنة...';

        if (typeof HybridSystem !== 'undefined') {
            const products = await HybridSystem.getProducts();

            if (products && Array.isArray(products)) {
                showToast(`تمت مزامنة ${products.length} منتج بنجاح ✅`, 'success');
            } else {
                throw new Error('Invalid products data received');
            }
        } else {
            throw new Error('HybridSystem is not defined');
        }
    } catch (e) {
        console.error('Manual Sync Error:', e);
        showToast('فشل في مزامنة البيانات: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync-alt"></i> مزامنة السحاب';
    }
}

// --- HARD RESET & FIX TOOL ---
async function hardResetAndFix() {
    showConfirm('⚠️ تحذير نهائي (Nuclear Option)!\n\nسيتم مسح قاعدة البيانات السحابية (Cloudflare & Firebase) بالكامل وحذف كل شيء.\n\nثم سيتم رفع المنتجات الموجودة أمامك الآن كأنها بداية جديدة.\n\nهل أنت متأكد؟', async () => {
        const btn = document.getElementById('reset-btn') || document.activeElement;
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-biohazard fa-spin"></i> جاري المسح الشامل...';

        try {
            const localProducts = db.getProducts(); // Backup current products

            showToast('جاري تدمير البيانات القديمة على السحاب...', 'warning');

            if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
                try {
                    const currentCloud = await HybridSystem.getProducts();
                    for (const p of currentCloud) {
                        await HybridSystem.deleteProduct(p.id);
                    }
                } catch (e) { console.log('Cleaning cloud failed, proceeding to overwrite'); }
            }

            if (typeof database !== 'undefined') {
                await database.ref('products').remove();
            }

            showToast(`تم المسح! جاري رفع ${localProducts.length} منتج من الصفر...`, 'info');

            if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
                for (const p of localProducts) {
                    p.lastUpdated = Date.now(); // Fresh timestamp
                    await HybridSystem.saveProduct(p);
                }
            }

            await db.updateCloud('products');

            showAlert('✅ تمت العملية بنجاح!\n\nتم مسح القواعد القديمة وإنشاء نسخة جديدة نظيفة تماماً.\nسيتم إعادة تحميل الصفحة الآن.', 'success', () => {
                window.location.reload(true);
            });

        } catch (e) {
            console.error("Hard Reset Failed:", e);
            showToast("فشلت العملية: " + e.message, 'error');
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });
}
window.hardResetAndFix = hardResetAndFix;




// Initial check for moderation badge
setTimeout(refreshModeration, 1000);

window.saveAppSecuritySettings = saveAppSecuritySettings;
window.refreshAppSecurity = refreshAppSecurity;
window.syncCloudData = syncCloudData;
window.addVariantRow = addVariantRow;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;

// Product Management
window.deleteProduct = deleteProduct;
window.adminArchiveProduct = adminArchiveProduct;
window.adminUnarchiveProduct = adminUnarchiveProduct;

// Order Management
window.viewOrder = viewOrder;
window.printShippingLabel = printShippingLabel;
window.adminArchiveOrder = adminArchiveOrder;
window.adminDeleteOrder = adminDeleteOrder;

// Shipping Management
window.openShippingModal = openShippingModal;
window.closeShippingModal = closeShippingModal;
window.saveShipping = saveShipping;
window.editShipping = editShipping;
window.deleteShipping = deleteShipping;
window.refreshShipping = refreshShipping;

function loadBostaRates() {
    showConfirm('هل تريد تحميل جميع أسعار محافظات مصر لعام 2024؟\nسيتم إضافة جميع المحافظات تلقائياً.', () => {
        // Explicitly clear local shipping rates to let getShippingRates return defaults
        localStorage.removeItem('shipping_rates');
        const rates = db.getShippingRates();
        db.saveShippingRates(rates);
        refreshShipping();
        showToast('تم تحميل أسعار كافة المحافظات بنجاح', 'success');
    });
}
window.loadBostaRates = loadBostaRates;


