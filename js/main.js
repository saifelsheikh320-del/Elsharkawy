/**
 * Main Application Logic
 */

let currentLang = localStorage.getItem('elsharkawy_lang') || 'ar'; // Default Arabic

document.addEventListener('DOMContentLoaded', () => {
    // Check Maintenance Mode First
    checkMaintenanceMode();

    // Init Language
    setLanguage(currentLang);

    initAnnouncementBar();
    initScrollAnimations();
    initCartBadge();
    initWhatsApp();
    injectLoader();
    navigationHighlight();
    injectLangSwitcher();
    injectMobileNav();
    initAuth();
    applySiteSettings();

    // Track Real Visit
    if (typeof db !== 'undefined' && db.trackVisit) {
        db.trackVisit();
    }

    // Initialize Hybrid System (Cloudflare)
    if (typeof HybridSystem !== 'undefined') {
        HybridSystem.getProducts();
    }

    // Auto-Clean Cart if stock changes in cloud
    window.addEventListener('productsUpdated', () => {
        if (typeof db !== 'undefined' && db.autoCleanCart) db.autoCleanCart();
    });
});

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('elsharkawy_lang', lang);

    // Direction & Font
    if (lang === 'ar') {
        document.body.classList.add('rtl');
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
    } else {
        document.body.classList.remove('rtl');
        document.documentElement.lang = 'en';
        document.documentElement.dir = 'ltr';
    }

    // Update Text
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            // Handle HTML content if needed (e.g. hero title)
            if (el.tagName === 'P' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'SPAN' || el.tagName === 'DIV' || el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'TH' || el.tagName === 'LABEL') {
                el.innerHTML = translations[lang][key];
            } else if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                el.placeholder = translations[lang][key];
            }
        }
    });

    // Dispatch event for other scripts to re-render if needed
    window.dispatchEvent(new Event('langChange'));

    // Refresh auth link if language changes
    initAuth();
    applySiteSettings();
}

function applySiteSettings() {
    if (typeof db === 'undefined' || !db.getSettings) return;
    const settings = db.getSettings();
    const lang = currentLang;

    // Apply Hero Title
    const heroTitle = document.querySelector('[data-i18n="hero_title"]');
    if (heroTitle) {
        heroTitle.innerHTML = lang === 'ar' ? settings.heroTitleAr : settings.heroTitleEn;
    }

    // Apply Hero Desc
    const heroDesc = document.querySelector('[data-i18n="hero_desc"]');
    if (heroDesc) {
        heroDesc.innerHTML = lang === 'ar' ? settings.heroDescAr : settings.heroDescEn;
    }

    // Apply Hero Image
    const heroImg = document.querySelector('.hero-image img');
    if (heroImg) {
        heroImg.src = settings.heroImage;
    }

    // Apply Store Name to Logos
    document.querySelectorAll('.logo').forEach(el => {
        const text = el.innerText.trim().toUpperCase();
        if (text === 'FORTO STORE' || text === 'FORTO' || text === 'ELSHARKAWY STORE' || text === 'ELSHARKAWY') {
            el.innerText = settings.storeName.toUpperCase();
        }
    });


    // Apply WhatsApp Link
    const whatsappBtn = document.querySelector('.whatsapp-float');
    if (whatsappBtn && settings.whatsapp) {
        whatsappBtn.href = `https://wa.me/${settings.whatsapp}`;
    }

    // Init Timer based on new settings
    initCountdownTimer(settings);
}

function initCountdownTimer(settings) {
    // 1. Prevent Timer on Admin Dashboard
    if (window.location.href.includes('/admin/') || window.location.pathname.includes('dashboard.html')) {
        return;
    }

    // defined in settings: timerEnabled, timerTarget, timerTextAr
    const timerContainer = document.getElementById('promo-timer-container');
    if (timerContainer) timerContainer.remove(); // Clear existing if re-init

    if (!settings.timerEnabled || !settings.timerTarget) return;

    const now = Date.now();
    const target = settings.timerTarget;
    if (target <= now) return; // expired

    // Create Timer Element
    const timerDiv = document.createElement('div');
    timerDiv.id = 'promo-timer-container';
    timerDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: linear-gradient(90deg, #e74c3c, #c0392b);
        color: white;
        text-align: center;
        padding: 8px;
        z-index: 99999;
        font-weight: 700;
        font-family: 'Cairo', sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        direction: rtl;
    `;

    // Adjust Layout for Fixed Header
    const header = document.querySelector('header') || document.querySelector('.navbar') || document.querySelector('nav');
    const adjustLayout = () => {
        const height = timerDiv.offsetHeight;
        document.body.style.paddingTop = height + 'px';
        if (header && getComputedStyle(header).position === 'fixed') {
            header.style.top = height + 'px';
            header.style.transition = 'top 0.3s';
        }
    };

    // Initial adjustment
    setTimeout(adjustLayout, 50); // Small delay to ensure rendering
    window.addEventListener('resize', adjustLayout);

    // On close/destroy cleanup
    const cleanup = () => {
        timerDiv.remove();
        document.body.style.paddingTop = '0';
        if (header && getComputedStyle(header).position === 'fixed') {
            header.style.top = '0';
        }
        clearInterval(timerInterval);
        window.removeEventListener('resize', adjustLayout);
    };

    timerDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <span>${settings.timerTextAr || 'ينتهي العرض خلال:'}</span>
            <div id="promo-timer-digits" style="
                background: rgba(0,0,0,0.2); 
                padding: 2px 10px; 
                border-radius: 4px; 
                font-family: monospace; 
                font-size: 1.1rem;
                letter-spacing: 1px;">
                00:00:00
            </div>
        </div>
    `;

    document.body.prepend(timerDiv);

    // Update Function
    const updateTimer = () => {
        const current = Date.now();
        const diff = target - current;

        if (diff <= 0) {
            cleanup();
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const format = (n) => n.toString().padStart(2, '0');
        const digitsEl = document.getElementById('promo-timer-digits');
        if (digitsEl) digitsEl.innerText = `${format(hours)}:${format(minutes)}:${format(seconds)}`;
    };

    updateTimer(); // run immediately
    const timerInterval = setInterval(updateTimer, 1000);
}

function initAuth() {
    const authLinkContainer = document.getElementById('auth-link');
    if (!authLinkContainer) return;

    const lang = localStorage.getItem('elsharkawy_lang') || 'ar';
    const t = translations[lang];

    const shopLinkLi = document.querySelector('a[data-i18n="shop"]')?.parentElement;

    // Remove existing my-orders-li if any
    const existingOrdersLi = document.getElementById('my-orders-li');
    if (existingOrdersLi) existingOrdersLi.remove();

    if (db.isCustomerLoggedIn()) {
        const customer = db.getCustomer();

        // Inject "My Orders" after Shop
        if (shopLinkLi) {
            const ordersLi = document.createElement('li');
            ordersLi.id = 'my-orders-li';
            ordersLi.innerHTML = `<a href="track-orders" data-i18n="my_orders">${t.my_orders}</a>`;
            shopLinkLi.after(ordersLi);
        }

        authLinkContainer.innerHTML = `<a href="#" onclick="handleLogout(event)">${t.logout} (${customer.name})</a>`;
    } else {
        authLinkContainer.innerHTML = `<a href="login" data-i18n="login">${t.login}</a>`;
    }
}

function handleLogout(e) {
    if (e) e.preventDefault();
    const lang = localStorage.getItem('elsharkawy_lang') || 'ar';

    showConfirm(
        lang === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?',
        () => {
            db.logoutCustomer();
            showToast(
                lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully',
                'success'
            );
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    );
}

// Custom Confirm Modal System
function injectConfirmModal() {
    if (document.getElementById('custom-confirm-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'custom-confirm-modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        z-index: 100000;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // Check Direction
    const isRtl = document.documentElement.dir === 'rtl' || document.body.classList.contains('rtl');

    modal.innerHTML = `
        <div class="confirm-content" style="
            background: white;
            padding: 30px;
            border-radius: 16px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-family: 'Cairo', sans-serif;
        ">
            <div style="
                width: 60px; 
                height: 60px; 
                background: #fdf2f2; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                margin: 0 auto 20px auto;
                color: #e74c3c; 
                font-size: 1.8rem;
            ">
                <i class="fas fa-question"></i>
            </div>
            <h3 id="confirm-title" style="margin-bottom: 15px; color: #2c3e50; font-size: 1.4rem;">تأكيد الإجراء</h3>
            <p id="confirm-message" style="margin-bottom: 20px; color: #555; font-size: 1.15rem; line-height: 1.6; font-weight: 800;">Message text here</p>
            <input type="number" id="confirm-input" style="display: none; width: 100%; padding: 12px; border-radius: 8px; border: 2px solid #ddd; margin-bottom: 20px; font-family: inherit; font-size: 1rem; text-align: center; outline: none; transition: border-color 0.3s;" placeholder="...">
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="confirm-yes" style="
                    background: #2c3e50; 
                    color: white; 
                    border: none; 
                    padding: 12px 30px; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    cursor: pointer; 
                    flex: 1;
                    font-family: inherit;
                    box-shadow: 0 5px 15px rgba(44, 62, 80, 0.2);
                    transition: all 0.2s;
                ">نعم، متأكد</button>
                <button id="confirm-no" style="
                    background: transparent; 
                    color: #7f8c8d; 
                    border: 1px solid #dfe6e9; 
                    padding: 12px 30px; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    cursor: pointer; 
                    flex: 1;
                    font-family: inherit;
                    transition: all 0.2s;
                ">إلغاء</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Hover effects via JS inline
    const btnYes = modal.querySelector('#confirm-yes');
    const btnNo = modal.querySelector('#confirm-no');

    btnYes.onmouseover = () => { btnYes.style.transform = 'translateY(-2px)'; btnYes.style.boxShadow = '0 8px 20px rgba(44, 62, 80, 0.3)'; };
    btnYes.onmouseout = () => { btnYes.style.transform = 'translateY(0)'; btnYes.style.boxShadow = '0 5px 15px rgba(44, 62, 80, 0.2)'; };

    btnNo.onmouseover = () => { btnNo.style.background = '#f8f9fa'; btnNo.style.color = '#2c3e50'; };
    btnNo.onmouseout = () => { btnNo.style.background = 'transparent'; btnNo.style.color = '#7f8c8d'; };
}

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
        const t = {
            title: lang === 'ar' ? 'تأكيد الإجراء' : 'Confirm Action',
            yes: lang === 'ar' ? 'نعم، متأكد' : 'Yes, Confirm',
            no: lang === 'ar' ? 'إلغاء' : 'Cancel'
        };

        if (iconContainer) {
            iconContainer.innerHTML = '<i class="fas fa-question-circle"></i>';
            iconContainer.style.background = '#fff8e1';
            iconContainer.style.color = '#f39c12';
        }

        modal.querySelector('#confirm-title').innerText = t.title;
        btnYes.innerText = t.yes;
        btnYes.style.background = '#2c3e50';
        btnNo.innerText = t.no;
        btnNo.style.display = 'block';
        msgEl.innerText = message;

        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            content.style.transform = 'scale(1)';
        });

        const handleResponse = (result) => {
            closeConfirm();
            resolve(result);
            if (result && typeof callback === 'function') {
                callback();
            }
        };

        const newYes = btnYes.cloneNode(true);
        const newNo = btnNo.cloneNode(true);
        btnYes.parentNode.replaceChild(newYes, btnYes);
        btnNo.parentNode.replaceChild(newNo, btnNo);

        newYes.onmouseover = () => { newYes.style.transform = 'translateY(-2px)'; newYes.style.filter = 'brightness(1.1)'; };
        newYes.onmouseout = () => { newYes.style.transform = 'translateY(0)'; newYes.style.filter = 'none'; };
        newNo.onmouseover = () => { newNo.style.background = '#f1f2f6'; };
        newNo.onmouseout = () => { newNo.style.background = 'transparent'; };

        newYes.onclick = () => handleResponse(true);
        newNo.onclick = () => handleResponse(false);
        modal.onclick = (e) => { if (e.target === modal) handleResponse(false); };
    });
};

window.showAlert = function (message, type = 'info', onOk) {
    injectConfirmModal();
    const modal = document.getElementById('custom-confirm-modal');
    const content = modal.querySelector('.confirm-content');
    const msgEl = modal.querySelector('#confirm-message');
    const btnYes = modal.querySelector('#confirm-yes');
    const btnNo = modal.querySelector('#confirm-no');
    const iconContainer = modal.querySelector('.confirm-content > div:first-child');

    const lang = localStorage.getItem('elsharkawy_lang') || 'ar';
    const t = {
        title: lang === 'ar' ? 'تنبيه' : 'Alert',
        ok: lang === 'ar' ? 'موافق' : 'OK'
    };

    modal.querySelector('#confirm-title').innerText = t.title;
    btnYes.innerText = t.ok;
    btnNo.style.display = 'none'; // Hide cancel button
    msgEl.innerText = message;

    // Change icon/color based on type
    if (type === 'error') {
        iconContainer.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        iconContainer.style.background = '#fdeaea';
        iconContainer.style.color = '#e74c3c';
    } else if (type === 'success') {
        iconContainer.innerHTML = '<i class="fas fa-check-circle"></i>';
        iconContainer.style.background = '#eafaf1';
        iconContainer.style.color = '#2ecc71';
    } else {
        iconContainer.innerHTML = '<i class="fas fa-info-circle"></i>';
        iconContainer.style.background = '#eaf4fa';
        iconContainer.style.color = '#3498db';
    }

    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        content.style.transform = 'scale(1)';
    });

    const newYes = btnYes.cloneNode(true);
    btnYes.parentNode.replaceChild(newYes, btnYes);

    newYes.onclick = () => {
        closeConfirm();
        if (onOk) onOk();
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            closeConfirm();
            if (onOk) onOk();
        }
    };
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
        inputEl.style.display = 'block';
        inputEl.value = defaultValue;
        inputEl.focus();

        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            content.style.transform = 'scale(1)';
        });

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

        // Handle Enter key
        inputEl.onkeyup = (e) => {
            if (e.key === 'Enter') handleResponse(true);
        };
    });
};

function closeConfirm() {
    const modal = document.getElementById('custom-confirm-modal');
    const content = modal.querySelector('.confirm-content');
    if (modal) {
        modal.style.opacity = '0';
        content.style.transform = 'scale(0.9)';
        setTimeout(() => {
            modal.style.display = 'none';
            // Reset modal state for next use
            const btnNo = modal.querySelector('#confirm-no');
            if (btnNo) btnNo.style.display = 'block';
            const iconContainer = modal.querySelector('.confirm-content > div:first-child');
            if (iconContainer) {
                iconContainer.style.background = '#fdf2f2';
                iconContainer.style.color = '#e74c3c';
                iconContainer.innerHTML = '<i class="fas fa-question"></i>';
            }
        }, 300);
    }
}

// Toast Notification System
function showToast(message, type = 'info', title = '') {
    // Create container if not exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Icons
    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        info: '<i class="fas fa-info-circle"></i>'
    };

    // Default Titles
    if (!title) {
        if (type === 'success') title = currentLang === 'ar' ? 'تم بنجاح' : 'Success';
        if (type === 'error') title = currentLang === 'ar' ? 'خطأ' : 'Error';
        if (type === 'info') title = currentLang === 'ar' ? 'تنبيه' : 'Info';
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer; color:#999;">&times;</button>
    `;

    container.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto Remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function injectLangSwitcher() {
    const navIcons = document.querySelector('.nav-icons');
    const navLinks = document.querySelector('.nav-links');

    // 1. Desktop Switcher (next to cart)
    if (navIcons) {
        const btnDesktop = document.createElement('button');
        btnDesktop.className = 'btn btn-secondary hide-mobile';
        btnDesktop.style.padding = '5px 12px';
        btnDesktop.style.fontSize = '0.8rem';
        btnDesktop.style.marginLeft = '10px';
        btnDesktop.style.marginRight = '10px';
        btnDesktop.innerText = currentLang === 'ar' ? 'English' : 'عربي';

        btnDesktop.onclick = (e) => {
            e.preventDefault();
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            setLanguage(newLang);
            updateAllSwitcherButtons(newLang);
        };
        navIcons.insertBefore(btnDesktop, navIcons.firstChild);
    }

    // 2. Mobile Switcher (inside 3-lines menu)
    if (navLinks) {
        const li = document.createElement('li');
        li.className = 'hide-desktop';
        const btnMobile = document.createElement('button');
        btnMobile.className = 'btn btn-secondary';
        btnMobile.style.padding = '10px 20px';
        btnMobile.style.fontSize = '1rem';
        btnMobile.style.marginTop = '10px';
        btnMobile.innerText = currentLang === 'ar' ? 'English' : 'عربي';

        btnMobile.onclick = (e) => {
            e.preventDefault();
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            setLanguage(newLang);
            updateAllSwitcherButtons(newLang);
        };
        li.appendChild(btnMobile);
        navLinks.appendChild(li);
    }
}

function updateAllSwitcherButtons(lang) {
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        if (btn.innerText === 'English' || btn.innerText === 'عربي') {
            btn.innerText = lang === 'ar' ? 'English' : 'عربي';
        }
    });
}

function injectMobileNav() {
    const nav = document.querySelector('nav');
    if (nav && !document.querySelector('.mobile-menu-btn')) {
        const btn = document.createElement('button');
        btn.className = 'mobile-menu-btn';
        btn.innerHTML = '<span></span><span></span><span></span>';
        btn.style.display = 'none'; // Hidden by default, shown by CSS media query

        btn.onclick = () => {
            nav.classList.toggle('active');
            btn.classList.toggle('open');
        };

        nav.insertBefore(btn, nav.firstChild);
    }
}

// 1. Antigravity Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Once it's revealed, we don't need to observe it anymore
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal, .reveal-zoom').forEach(el => {
        observer.observe(el);
        // Fallback: If it's already in view (top of page), trigger it
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('active');
            observer.unobserve(el);
        }
    });

    // Scroll Progress
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const width = (scrolled / max) * 100;
        const bar = document.querySelector('.scroll-progress');
        if (bar) bar.style.width = width + '%';
    });
}

// 2. Cart Badge
function initCartBadge() {
    const updateCount = () => {
        const cart = db.getCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const badge = document.querySelector('.cart-count');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    };

    window.addEventListener('cartUpdated', updateCount);
    updateCount(); // Initial check
}

// 3. WhatsApp Floating Button
function initWhatsApp() {
    // Don't show on login pages or admin dashboard
    if (window.location.pathname.includes('login') || window.location.pathname.includes('/admin/')) return;

    if (!document.querySelector('.whatsapp-float')) {
        const btn = document.createElement('a');
        btn.href = "https://wa.me/201154025770"; // Updated number
        btn.target = "_blank";
        btn.className = "whatsapp-float hover-float";
        btn.innerHTML = '<i class="fab fa-whatsapp"></i>'; // FontAwesome assumed
        document.body.appendChild(btn);
    }
}

// 4. Page Loader
function injectLoader() {
    // Check if loader already exists
    if (document.querySelector('.loader-overlay')) return;

    const loader = document.createElement('div');
    loader.className = 'loader-overlay';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);

    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }, 500);
    });
}

// 5. Navigation Active State
function navigationHighlight() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        // Check if href matches current path (considering both /path and /path.html)
        const href = link.getAttribute('href');
        const path = currentPath.endsWith('/') || currentPath === '' ? '/' : currentPath.split('/').pop().replace('.html', '');
        const target = href.replace('.html', '');

        if (target === path || (path === '/' && target === '/')) {
            link.style.color = 'var(--color-blue)';
        }
    });
}

function checkMaintenanceMode() {
    // Don't apply maintenance on admin pages
    if (window.location.pathname.includes('/admin/')) return;

    const settings = db.getSettings();
    if (settings && settings.maintenanceMode) {
        const lang = localStorage.getItem('elsharkawy_lang') || 'ar';
        const msg = lang === 'ar' ? settings.maintenanceMessageAr : settings.maintenanceMessageEn;

        // Show maintenance overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#f8f9fa';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.textAlign = 'center';
        overlay.style.padding = '20px';
        overlay.style.fontFamily = "'Cairo', sans-serif";

        overlay.innerHTML = `
            <div class="reveal-zoom active">
                <i class="fas fa-tools" style="font-size: 5rem; color: #e67e22; margin-bottom: 20px;"></i>
                <h1 style="font-size: 2.5rem; color: #2c3e50; margin-bottom: 15px;">${lang === 'ar' ? 'نحن نتحسن من أجلك' : "We're Improving for You"}</h1>
                <p style="font-size: 1.2rem; color: #7f8c8d; max-width: 600px; line-height: 1.6;">${msg}</p>
                <div style="margin-top: 30px; color: #95a5a6; font-size: 0.9rem;">
                    &copy; ${new Date().getFullYear()} ${settings.storeName}
                </div>
            </div>
        `;
        document.body.innerHTML = ''; // Clear body
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    }
}

function initAnnouncementBar() {
    // Don't show in admin
    if (window.location.pathname.includes('/admin/')) return;

    const settings = db.getSettings();

    if (settings && settings.announcementEnabled) {
        const lang = localStorage.getItem('elsharkawy_lang') || 'ar';
        const text = lang === 'ar' ? settings.announcementTextAr : settings.announcementTextEn;

        if (!text) return;

        const bar = document.createElement('div');
        bar.id = 'announcement-bar';
        bar.style.cssText = `
            background: var(--color-blue);
            color: white;
            padding: 8px 40px 8px 20px;
            text-align: center;
            font-size: 0.9rem;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 10001;
            font-weight: 600;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 40px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        `;

        bar.innerHTML = `
            <span>${text}</span>
            <button onclick="closeAnnouncementBar()" style="
                position: absolute;
                right: 15px;
                background: transparent;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                line-height: 1;
                padding: 5px;
            ">&times;</button>
        `;

        document.body.prepend(bar);

        // Push page down
        document.body.style.paddingTop = '40px';

        // Adjust header position if it's fixed
        const header = document.querySelector('header');
        if (header) {
            header.style.transition = 'top 0.3s ease';
            if (window.getComputedStyle(header).position === 'fixed') {
                header.style.top = '40px';
            }
        }
    }
}

window.closeAnnouncementBar = function () {
    const bar = document.getElementById('announcement-bar');
    if (bar) {
        bar.remove();
        // Removed persistent closure to show on every refresh

        // Reset
        document.body.style.paddingTop = '0';
        const header = document.querySelector('header');
        if (header) {
            header.style.top = '0';
        }
    }
};


