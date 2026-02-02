
/**
 * Mobile App & Security Logic for الشرقاوي Admin
 * Handles App Lock, Biometrics, and Mobile Interactions
 */

// Global State
let currentPinInput = '';
const storedPin = localStorage.getItem('app_pin') || '';
const isAppLockEnabled = localStorage.getItem('app_lock_enabled') === 'true';

// Initialize App Security on Load
document.addEventListener('DOMContentLoaded', () => {
    checkAppLock();
    setupSecuritySettingsUI();
});

// --- App Lock Logic ---

function checkAppLock() {
    // If lock is enabled and we are just loading the page
    if (isAppLockEnabled) {
        // Show the Lock Screen
        const modal = document.getElementById('app-lock-modal');
        if (modal) {
            modal.classList.add('active');

            // Try Biometrics if enabled
            if (localStorage.getItem('app_biometric_enabled') === 'true') {
                setTimeout(verifyBiometric, 500);
            }
        }
    }
}

function verifyBiometric() {
    // Check if WebAuthn is available (Simplistic simulation for PWA/Web)
    // In a real Capacitor app, this would use NativeBiometric plugin
    if (window.PublicKeyCredential) {
        // This is a placeholder for actual WebAuthn logic which requires a server challenge
        // For a static admin dashboard, we might rely on the native device capability via a plugin bridge
        // or just simulate "FaceID" if wrapped in a native container that intercepts this.

        // For now, we simulate success for demonstration if the user toggled it
        // In a real scenario, use: navigator.credentials.get({...})
        console.log('Attempting Biometric Auth...');
    }
}

// Keypad Interactions
window.appendPin = function (digit) {
    if (currentPinInput.length < 4) {
        currentPinInput += digit;
        updatePinDisplay();

        // Auto-submit if 4 digits
        if (currentPinInput.length === 4) {
            setTimeout(validatePin, 200);
        }
    }
};

window.clearPin = function () {
    currentPinInput = '';
    updatePinDisplay();
};

window.deletePin = function () {
    currentPinInput = currentPinInput.slice(0, -1);
    updatePinDisplay();
};

function updatePinDisplay() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
        if (index < currentPinInput.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

function validatePin() {
    const savedPin = localStorage.getItem('app_pin');

    if (currentPinInput === savedPin) {
        // Success
        unlockApp();
    } else {
        // Failure
        const dotsContainer = document.getElementById('pin-display');
        dotsContainer.style.animation = 'shake 0.4s ease';
        setTimeout(() => {
            dotsContainer.style.animation = '';
            clearPin();
        }, 400);

        // Provide haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(200);
    }
}

function unlockApp() {
    const modal = document.getElementById('app-lock-modal');
    modal.style.transition = 'opacity 0.3s ease';
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.classList.remove('active');
        modal.style.opacity = '1'; // Reset for next time
        clearPin();
    }, 300);
}

// --- Settings UI Integration ---

function setupSecuritySettingsUI() {
    // Find the settings form or container to inject the security section
    // We will inject it dynamically if it doesn't exist, or we assume the HTML update handled it.
    // Here we listen for changes if the elements exist.

    // We'll rely on the saveSettings logic in admin.js to read these values if we add them to the form.
    // However, since we are handling this separately, let's look for a specific save trigger or hook into the form.

    const settingsForm = document.getElementById('settings-form');

    // Populate Fields
    const enabledCb = document.getElementById('s-appLockEnabled');
    const pinInput = document.getElementById('s-appPin');
    const bioCb = document.getElementById('s-appBiometric');

    if (enabledCb) enabledCb.checked = localStorage.getItem('app_lock_enabled') === 'true';
    if (pinInput) pinInput.value = localStorage.getItem('app_pin') || '';
    if (bioCb) bioCb.checked = localStorage.getItem('app_biometric_enabled') === 'true';

    // Hook into submit
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            // The main admin.js handles the submit, but we can also piggyback
            saveSecuritySettings();
        });
    }
}

function saveSecuritySettings() {
    const enabled = document.getElementById('s-appLockEnabled')?.checked;
    const pin = document.getElementById('s-appPin')?.value;
    const biometric = document.getElementById('s-appBiometric')?.checked;

    if (enabled !== undefined) {
        if (enabled && (!pin || pin.length !== 4)) {
            if (!localStorage.getItem('app_pin')) { // Only error if no pin stored and trying to enable
                // Allow creating pin
            }
        }

        localStorage.setItem('app_lock_enabled', enabled);
        if (pin && pin.length === 4) {
            localStorage.setItem('app_pin', pin);
        }
        localStorage.setItem('app_biometric_enabled', biometric);
    }
}

// --- Notification Sound Helper (Enhancement) ---
// Note: admin.js already handles this, but we ensure the audio is preload
const notifySound = new Audio('https://www.soundjay.com/misc/sounds/cash-register-01.mp3');
notifySound.preload = 'auto';


