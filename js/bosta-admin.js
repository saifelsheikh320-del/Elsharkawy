// Bosta Admin Settings Management

// Load Bosta Settings into Form
function loadBostaSettings() {
    const settings = BostaIntegration.getSettings();

    document.getElementById('s-bostaEnabled').checked = settings.enabled || false;
    document.getElementById('s-bostaApiKey').value = settings.apiKey || '';
    document.getElementById('s-bostaBusinessName').value = settings.businessName || 'متجر الشرقاوي';
    document.getElementById('s-bostaBusinessPhone').value = settings.businessPhone || '';
    document.getElementById('s-bostaCity').value = settings.pickupAddress?.city || '';
    document.getElementById('s-bostaAddress').value = settings.pickupAddress?.firstLine || '';
    document.getElementById('s-bostaBuilding').value = settings.pickupAddress?.buildingNumber || '';
    document.getElementById('s-bostaFloor').value = settings.pickupAddress?.floor || '';
    document.getElementById('s-bostaApartment').value = settings.pickupAddress?.apartment || '';
    document.getElementById('s-bostaWebhookAuthName').value = settings.webhookAuthName || 'X-Bosta-Signature';
    document.getElementById('s-bostaWebhookAuthValue').value = settings.webhookAuthValue || '';
}

// Save Bosta Settings from Form
function saveBostaSettings() {
    const city = document.getElementById('s-bostaCity').value;

    const settings = {
        enabled: document.getElementById('s-bostaEnabled').checked,
        apiKey: document.getElementById('s-bostaApiKey').value.trim(),
        businessName: document.getElementById('s-bostaBusinessName').value.trim(),
        businessPhone: document.getElementById('s-bostaBusinessPhone').value.trim(),
        webhookAuthName: document.getElementById('s-bostaWebhookAuthName').value.trim(),
        webhookAuthValue: document.getElementById('s-bostaWebhookAuthValue').value.trim(),
        pickupAddress: {
            city: city,
            firstLine: document.getElementById('s-bostaAddress').value.trim(),
            buildingNumber: document.getElementById('s-bostaBuilding').value.trim(),
            floor: document.getElementById('s-bostaFloor').value.trim(),
            apartment: document.getElementById('s-bostaApartment').value.trim()
        }
    };

    BostaIntegration.saveSettings(settings);

    console.log('Bosta settings saved:', settings);
}

// Test Bosta Connection
async function testBostaConnection(event) {
    const statusEl = document.getElementById('bosta-connection-status');
    const btn = event.currentTarget;

    // Save settings first
    saveBostaSettings();

    // Show loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاختبار...';
    statusEl.innerHTML = '';

    try {
        const result = await BostaIntegration.testConnection();

        // Show success
        statusEl.innerHTML = `<span style="color: #27ae60; font-weight: bold;">
            <i class="fas fa-check-circle"></i> ${result.message}
        </span>`;

        if (typeof showToast === 'function') {
            showToast('تم الاتصال بنجاح مع Bosta API', 'success');
        }

    } catch (error) {
        // Show error
        statusEl.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">
            <i class="fas fa-times-circle"></i> ${error.message}
        </span>`;

        if (typeof showToast === 'function') {
            showToast('فشل الاتصال: ' + error.message, 'error');
        }
    } finally {
        // Restore button
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plug"></i> اختبار الاتصال';
    }
}

// Copy Webhook URL to Clipboard
function copyWebhookUrl() {
    const urlInput = document.getElementById('s-bostaWebhookUrl');
    if (!urlInput) return;

    urlInput.select();
    urlInput.setSelectionRange(0, 99999); // For mobile

    try {
        navigator.clipboard.writeText(urlInput.value).then(() => {
            if (typeof showToast === 'function') {
                showToast('تم نسخ الرابط بنجاح! ضعه الآن في حساب بوسطة.', 'success');
            }
        });
    } catch (err) {
        // Fallback
        document.execCommand('copy');
        if (typeof showToast === 'function') {
            showToast('تم نسخ الرابط بنجاح!', 'success');
        }
    }
}

// Test Webhook URL endpoint
async function testWebhookConnection(event) {
    const url = document.getElementById('s-bostaWebhookUrl').value;
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الفحص...';

    try {
        // We use a GET request just to see if the server responds at all
        const response = await fetch(url);

        // Even if it's 405 (Method Not Allowed), it means the server is UP and the URL is correct
        if (response.status !== 404) {
            showToast('الويب هوك نشط ومستعد لاستقبال البيانات ✅', 'success');
        } else {
            showToast('الرابط غير موجود (404) ❌', 'error');
        }
    } catch (error) {
        showToast('لا يمكن الوصول للرابط حالياً ❌', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Export functions
window.loadBostaSettings = loadBostaSettings;
window.saveBostaSettings = saveBostaSettings;
window.testBostaConnection = testBostaConnection;
window.copyWebhookUrl = copyWebhookUrl;
window.testWebhookConnection = testWebhookConnection;

// Auto-load settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        if (typeof BostaIntegration !== 'undefined') {
            loadBostaSettings();
        }
    }, 500);
});
