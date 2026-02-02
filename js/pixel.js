
/**
 * Facebook Pixel Tracking Logic
 * Dynamically loads and handles tracking events based on Site Settings
 */

(function () {
    // 1. Get Settings from Database
    let fbId = '2734165686928707'; // User Provided ID
    if (typeof db !== 'undefined' && db.getSettings) {
        const settings = db.getSettings();
        if (settings && settings.fbPixelId) {
            fbId = settings.fbPixelId;
        }
    }

    if (!fbId) {
        console.log('FB Pixel ID not found. Tracking disabled.');
        // No-op tracker to prevent errors
        window.trackEvent = function (name, params) {
            console.log('Pixel Disabled. Event:', name, params);
        };
        return;
    }

    console.log('Initializing FB Pixel ID:', fbId);

    // 2. Standard Facebook Pixel Code
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s)
    }(window, document, 'script',
        'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', fbId);
    fbq('track', 'PageView');

    // 3. Global Tracker Function
    window.trackEvent = function (eventName, params = {}) {
        if (typeof fbq === 'function') {
            fbq('track', eventName, params);
            console.log('Pixel Event Tracked:', eventName, params);
        } else {
            console.warn('Pixel (fbq) not loaded yet.');
        }
    };
})();

