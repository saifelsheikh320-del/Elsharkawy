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

    // Show Webhook URL if field exists
    const webhookEl = document.getElementById('s-bostaWebhookUrl');
    if (webhookEl) webhookEl.value = settings.webhookUrl || '';
}

// Save Bosta Settings from Form
function saveBostaSettings() {
    const city = document.getElementById('s-bostaCity').value;

    const settings = {
        enabled: document.getElementById('s-bostaEnabled').checked,
        apiKey: document.getElementById('s-bostaApiKey').value.trim(),
        businessName: document.getElementById('s-bostaBusinessName').value.trim(),
        businessPhone: document.getElementById('s-bostaBusinessPhone').value.trim(),
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
async function testBostaConnection() {
    const statusEl = document.getElementById('bosta-connection-status');
    const btn = event.target;

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
    const url = document.getElementById('s-bostaWebhookUrl').value;
    if (!url) return;

    navigator.clipboard.writeText(url).then(() => {
        showToast('تم نسخ رابط الـ Webhook بنجاح', 'success');
    }).catch(err => {
        console.error('Copy failed:', err);
    });
}

// Export functions
window.loadBostaSettings = loadBostaSettings;
window.saveBostaSettings = saveBostaSettings;
window.testBostaConnection = testBostaConnection;
window.copyWebhookUrl = copyWebhookUrl;

// Auto-load settings when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other scripts to load
    setTimeout(() => {
        if (typeof BostaIntegration !== 'undefined') {
            loadBostaSettings();
        }
    }, 500);
});

