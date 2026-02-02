
// --- Coupon Logic ---
if (typeof showToast !== 'function') {
    window.showToast = function (msg, type = 'info') {
        if (typeof showAlert !== 'undefined') showAlert(msg, type);
        else console.log(msg);
    };
}

function openCouponModal() {
    const modal = document.getElementById('coupon-modal');
    if (modal) {
        modal.classList.add('active');
        // Reset form
        document.getElementById('coupon-form').reset();
    }
}

function closeCouponModal() {
    const modal = document.getElementById('coupon-modal');
    if (modal) modal.classList.remove('active');
}

function saveCoupon(e) {
    e.preventDefault();
    const code = document.getElementById('c-code').value.trim().toUpperCase();
    const pct = parseInt(document.getElementById('c-pct').value);
    const expiry = document.getElementById('c-expiry').value;

    if (!code || isNaN(pct)) {
        showToast('يرجى ملء جميع البيانات المطلوبة', 'error');
        return;
    }

    // Check for duplicates manually
    const coupons = db.getCoupons();
    if (coupons.some(c => c.code === code)) {
        showToast('هذا الكود موجود بالفعل', 'error');
        return;
    }

    // Use StoreDB method to save (single coupon)
    db.saveCoupon({ code, pct, expiry });

    closeCouponModal();
    refreshDiscounts();
    showToast('تم إضافة الكوبون بنجاح', 'success');
}

async function adminDeleteCoupon(code) {
    if (await showConfirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
        // Use StoreDB method to delete
        db.deleteCoupon(code);

        refreshDiscounts();
        showToast('تم حذف الكوبون', 'success');
    }
}

// --- Special Offers Logic ---
function saveSpecialOffers(e) {
    e.preventDefault();

    const offers = {
        freeShippingThreshold: document.getElementById('off-shipping-threshold').value ? parseFloat(document.getElementById('off-shipping-threshold').value) : null,
        globalDiscountPercentage: parseFloat(document.getElementById('off-global-discount').value) || 0,
        globalDiscountEnabled: document.getElementById('off-global-enabled').checked,
        globalDiscountText: document.getElementById('off-global-text').value
    };

    db.saveSpecialOffers(offers);
    showToast('تم حفظ العروض بنجاح', 'success');
    refreshDiscounts();
}

// Ensure event listeners are attached
document.addEventListener('DOMContentLoaded', () => {
    const couponForm = document.getElementById('coupon-form');
    if (couponForm) {
        couponForm.addEventListener('submit', saveCoupon);
    }

    const offersForm = document.getElementById('special-offers-form');
    if (offersForm) {
        offersForm.addEventListener('submit', saveSpecialOffers);
    }
});

// Expose to global scope for HTML onclick attributes
window.openCouponModal = openCouponModal;
window.closeCouponModal = closeCouponModal;
window.saveCoupon = saveCoupon;
window.adminDeleteCoupon = adminDeleteCoupon;
window.saveSpecialOffers = saveSpecialOffers;

