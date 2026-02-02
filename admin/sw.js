const CACHE_NAME = 'elsharkawy-admin-v2';
const ASSETS = [
    'dashboard.html',
    '../css/style.css',
    '../css/toast.css',
    '../js/admin.js',
    '../js/data.js',
    '../js/mobile-app.js',
    '../images/logo-v2.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.quilljs.com/1.3.6/quill.snow.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate & Cleanup
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// Fetch Strategy: Network First (to ensure admin data is always fresh)
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Background Sync - يتم استدعاؤه فور عودة الإنترنت
self.addEventListener('sync', (event) => {
    if (event.tag === 'check-new-orders') {
        event.waitUntil(checkOrdersAndNotify());
    }
});

// وظيفة الفحص وإرسال الإشعار
async function checkOrdersAndNotify() {
    // هذه الوظيفة تتواصل مع قاعدة البيانات حتى والتطبيق مغلق
    // في بيئة الـ PWA/APK، يقوم المتصفح بتشغيل هذا الكود في الخلفية
    console.log('Checking orders in background...');
    // محاكاة إشعار (في التطبيق الحقيقي يتم جلب البيانات من Firebase)
}

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) return clientList[0].focus();
            return clients.openWindow('mobile_app_build.html');
        })
    );
});

