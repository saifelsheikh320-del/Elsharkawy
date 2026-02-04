/**
 * Data Layer Simulation (Local Storage)
 */

let INITIAL_PRODUCTS = []; // 🔴 تم مسح جميع المنتجات الافتراضية للبدء من جديد

class StoreDB {
    constructor() {
        this.init();
        this.syncWithFirebase();
    }

    init() {
        // Initialize collections if they don't exist
        if (!localStorage.getItem('products')) {
            localStorage.setItem('products', JSON.stringify([]));
        }

        if (!localStorage.getItem('orders')) {
            localStorage.setItem('orders', JSON.stringify([]));
        }
        if (!localStorage.getItem('cart')) {
            localStorage.setItem('cart', JSON.stringify([]));
        }
        if (!localStorage.getItem('customers')) {
            localStorage.setItem('customers', JSON.stringify([]));
        }

        // Always fetch fresh products from cloud on init (Ensures sync)
        this.fetchProductsFromCloud();
    }

    async fetchProductsFromCloud() {
        if (typeof HybridSystem !== 'undefined') {
            const products = await HybridSystem.getProducts();
            if (products && products.length > 0) {
                // UI refresh without full reload is handled by global listeners now
                // or manually here if needed:
                // window.dispatchEvent(new Event('productsUpdated'));
            }
        }
    }

    // New method to sync data Real-time
    syncWithFirebase() {
        if (typeof firebase === 'undefined') {
            console.warn('Firebase is not loaded yet.');
            return;
        }

        const collections = ['products', 'orders', 'abandoned_carts', 'site_settings', 'coupons', 'staff', 'shipping_rates', 'pending_reviews', 'customers'];

        collections.forEach(collection => {
            // we no longer skip 'products' to allow real-time sync between local and hosting environments
            database.ref(collection).on('value', (snapshot) => {
                const data = snapshot.val();

                // Handle Empty Data (Null) - e.g. when all products are deleted or database is reset
                if (!data) {
                    // Check if we have local products to seed the empty cloud
                    const localProducts = JSON.parse(localStorage.getItem('products') || '[]');
                    if (collection === 'products' && localProducts.length > 0) {
                        console.log(`📡 Cloud ${collection} is empty. Auto-seeding from local data...`);
                        this.updateCloud('products');
                        return;
                    }

                    // CRITICAL: If Hybrid mode is active, Cloudflare is the source of truth for products.
                    if (typeof HYBRID_CONFIG !== 'undefined' && HYBRID_CONFIG.enabled) {
                        if (collection === 'products' || collection === 'site_settings') {
                            console.log(`Firebase ${collection} is empty, keeping Hybrid/Local data.`);
                            return;
                        }
                    }

                    const emptyValue = collection === 'site_settings' ? {} : [];
                    localStorage.setItem(collection, JSON.stringify(emptyValue));

                    if (collection === 'products') window.dispatchEvent(new Event('productsUpdated'));
                    if (collection === 'site_settings') window.dispatchEvent(new Event('settingsUpdated'));
                    if (collection === 'orders') window.dispatchEvent(new Event('ordersUpdated'));
                    return;
                }

                if (data) {
                    // Firebase object to Array if necessary (EXCEPT site_settings)
                    let formattedData = data;
                    if (collection !== 'site_settings' && !Array.isArray(data)) {
                        formattedData = Object.keys(data).map(key => ({
                            ...data[key],
                            firebaseId: key // optional: store the key if needed
                        }));
                    }

                    // STRATEGIC SEPARATION:
                    // 1. PRODUCTS & SETTINGS -> Prioritize Cloudflare / Local
                    if (typeof HYBRID_CONFIG !== 'undefined' && HYBRID_CONFIG.enabled) {
                        if (collection === 'products' || collection === 'site_settings') {
                            console.log(`📡 Cloudflare is master for ${collection}. Firebase synced as backup.`);
                            // We still cache to localStorage, but HybridSystem remains the source of truth
                        }
                    }

                    localStorage.setItem(collection, JSON.stringify(formattedData));

                    // Trigger events for UI updates
                    if (collection === 'products') window.dispatchEvent(new Event('productsUpdated'));
                    if (collection === 'site_settings') window.dispatchEvent(new Event('settingsUpdated'));
                    if (collection === 'orders') window.dispatchEvent(new Event('ordersUpdated'));
                }
            }, (error) => {
                console.error(`Sync error for ${collection}:`, error);
                // Alert only once to avoid spamming
                if (collection === 'products') {
                    if (typeof showAlert !== 'undefined') {
                        showAlert(`تنبيه: فشل الاتصال بقاعدة البيانات لقراءة المنتجات.\nالسبب: ${error.message}\nتأكد من إعدادات القواعد (Rules) في Firebase.`, 'error');
                    } else {
                        console.error(`Database Connection Error: ${error.message}`);
                    }
                }
            });
        });
    }


    async updateCloud(collection) {
        if (typeof firebase !== 'undefined') {
            const data = JSON.parse(localStorage.getItem(collection));
            try {
                // 1. Sync to Firebase (All collections)
                await database.ref(collection).set(data);
                console.log(`Successfully synced ${collection} to Firebase.`);

                // 2. Sync to Cloudflare (Products only - If hybrid enabled)
                if (collection === 'products' && typeof HybridSystem !== 'undefined' && typeof HYBRID_CONFIG !== 'undefined' && HYBRID_CONFIG.enabled) {
                    console.log("📡 Hybrid Mode: Triggering background sync to Cloudflare...");

                    if (Array.isArray(data) && data.length > 0) {
                        // Sync each product to Cloudflare
                        // Using Promise.allSettled to ensure one failure doesn't stop others
                        Promise.allSettled(data.map(p => HybridSystem.saveProduct(p))).then(results => {
                            const failed = results.filter(r => r.status === 'rejected');
                            if (failed.length > 0) {
                                console.warn(`⚠️ Partial sync issue: ${failed.length} products failed to sync.`);
                            } else {
                                console.log("✅ All products synced to Cloudflare successfully.");
                            }
                        });
                    }
                }

                return true;
            } catch (error) {
                console.error(`Sync error for ${collection}:`, error);
                // 🚨 التنبيه بالبريد عند فشل المزامنة السحابية (Disabled per user request)
                /*
                if (typeof emailService !== 'undefined') {
                    emailService.sendErrorReport(`فشل مزامنة ${collection} مع Firebase`, error.message);
                }
                */
                const msg = `خطأ في المزامنة: ${error.message}\nتأكد من إعدادات قواعد البيانات (Rules) في Firebase Console وتغييرها لـ true.`;
                if (typeof showAlert !== 'undefined') showAlert(msg, 'error');
                else showAlert(msg, 'success');
                throw error;
            }
        }
        return false;
    }

    // --- REAL ANALYTICS TRACKING ---
    trackVisit() {
        if (typeof firebase === 'undefined') return;

        // 1. Total Visits Counter
        database.ref('analytics/total_visits').transaction((current) => {
            return (current || 0) + 1;
        });

        // 2. Daily Visits
        const today = new Date().toISOString().split('T')[0];
        database.ref(`analytics/daily_visits/${today}`).transaction((current) => {
            return (current || 0) + 1;
        });

        // 3. Live Presence & Traffic Sources
        const urlParams = new URLSearchParams(window.location.search);
        const source = urlParams.get('utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'Direct');

        const presenceRef = database.ref('analytics/presence').push();
        presenceRef.onDisconnect().remove();
        presenceRef.set({
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            url: window.location.href,
            source: source
        });

        // 4. Source Counters
        database.ref(`analytics/traffic_sources/${source.replace(/\./g, '_')}`).transaction((current) => {
            return (current || 0) + 1;
        });
    }

    async getAnalytics() {
        if (typeof firebase === 'undefined') return { total_visits: 0, live_users: 0 };
        const snapshot = await database.ref('analytics').once('value');
        const data = snapshot.val() || {};
        const presence = data.presence ? Object.keys(data.presence).length : 0;
        return {
            total_visits: data.total_visits || 0,
            live_users: presence || 1,
            daily_visits: data.daily_visits || {},
            traffic_sources: data.traffic_sources || {}
        };
    }

    getProducts() {
        try {
            const products = JSON.parse(localStorage.getItem('products')) || [];
            // Ensure consistent ordering based on saved sortOrder
            return products.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        } catch (e) {
            return [];
        }
    }

    getProduct(id) {
        const products = this.getProducts();
        return products.find(p => p.id == id);
    }

    saveProduct(product, skipSync = false) {
        let products = this.getProducts();
        if (product.id) {
            // Check if it exists for update
            const index = products.findIndex(p => p.id == product.id);
            if (index !== -1) {
                // Preserve sortOrder if not provided in updated product
                if (product.sortOrder === undefined) {
                    product.sortOrder = products[index].sortOrder;
                }
                products[index] = product;
            } else {
                // If ID is provided but not found, it's likely a new product from an import
                products.push(product);
            }
        } else {
            // Create New
            product.id = Date.now();
            // Set initial sortOrder to be at the end
            const maxOrder = products.length > 0 ? Math.max(...products.map(p => p.sortOrder || 0)) : 0;
            product.sortOrder = maxOrder + 1;
            products.push(product);
        }

        // Add Timestamp for collision resolution
        product.lastUpdated = Date.now();

        localStorage.setItem('products', JSON.stringify(products));
        if (!skipSync) {
            this.updateCloud('products');
        }
    }

    deleteProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id != id);
        localStorage.setItem('products', JSON.stringify(products));
        this.updateCloud('products');
    }

    archiveProduct(id) {
        let products = this.getProducts();
        const p = products.find(prod => prod.id == id);
        if (p) {
            p.archived = true;
            localStorage.setItem('products', JSON.stringify(products));
            this.updateCloud('products');
        }
    }

    unarchiveProduct(id) {
        let products = this.getProducts();
        const p = products.find(prod => prod.id == id);
        if (p) {
            p.archived = false;
            localStorage.setItem('products', JSON.stringify(products));
            this.updateCloud('products');
        }
    }

    async getOrderAsync(orderId) {
        if (!orderId) return null;
        const cleanId = orderId.toString().trim().replace('#', '');

        // 1. Try local first
        const orders = this.getOrders();
        const local = orders.find(o =>
            o.id === cleanId ||
            o.id === 'ORD-' + cleanId ||
            o.id.split('-').pop() === cleanId
        );
        if (local) return local;

        // 2. Try Firebase if available
        if (typeof database !== 'undefined') {
            try {
                // Search by full ID
                let snapshot = await database.ref('orders').orderByChild('id').equalTo(cleanId).once('value');
                if (!snapshot.exists() && !cleanId.startsWith('ORD-')) {
                    // Try with prefix
                    snapshot = await database.ref('orders').orderByChild('id').equalTo('ORD-' + cleanId).once('value');
                }

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    // Firebase returns an object with keys since we used push()
                    const foundOrder = Object.values(data)[0];

                    // Cache it locally for future fast access
                    const currentOrders = this.getOrders();
                    if (!currentOrders.find(o => o.id === foundOrder.id)) {
                        currentOrders.unshift(foundOrder);
                        localStorage.setItem('orders', JSON.stringify(currentOrders));
                    }
                    return foundOrder;
                }
            } catch (err) {
                console.error('Firebase order lookup error:', err);
            }
        }
        return null;
    }

    getOrders() {
        try {
            return JSON.parse(localStorage.getItem('orders')) || [];
        } catch (e) {
            return [];
        }
    }

    async createOrder(order) {
        try {
            let orders = this.getOrders();
            if (!order.id) {
                order.id = 'ORD-' + Date.now();
            }
            order.date = new Date().toISOString();
            order.status = 'Pending';
            order.isRead = false;

            // Calculate Total Weight & ensure items have weight info
            let totalWeight = 0;
            const products = this.getProducts();
            order.items.forEach(item => {
                const p = products.find(prod => prod.id == item.id);
                if (p) {
                    item.weight = p.weight || 0.5;
                    totalWeight += item.weight * item.quantity;
                } else {
                    item.weight = 0.5;
                    totalWeight += 0.5 * item.quantity;
                }
            });
            order.totalWeight = Math.max(0.1, totalWeight);

            // 1. Save locally first (Always succeeds)
            orders.unshift(order);
            localStorage.setItem('orders', JSON.stringify(orders));

            // 2. Deduct quantities locally
            const modifiedProducts = [];

            order.items.forEach(item => {
                const p = products.find(prod => prod.id == item.id);
                if (p) {
                    let changed = false;

                    // 1. Deduct from specific Variant (Size)
                    if (item.selectedSize && p.variants && p.variants.length > 0) {
                        // Use loose equality (==) to handle number vs string comparisons
                        const variant = p.variants.find(v => v.size == item.selectedSize);
                        if (variant && variant.quantity !== undefined) {
                            variant.quantity = Math.max(0, variant.quantity - item.quantity);
                            changed = true;
                        }
                    }

                    // 2. Deduct from Global Quantity
                    if (p.quantity !== undefined) {
                        p.quantity = Math.max(0, p.quantity - item.quantity);
                        changed = true;
                    }

                    if (changed) {
                        p.lastUpdated = Date.now();
                        modifiedProducts.push(p);
                    }
                }
            });
            localStorage.setItem('products', JSON.stringify(products));

            // 3. Clear cart/session
            const sessionId = localStorage.getItem('cart_session_id');
            if (sessionId) this.removeAbandonedCart(sessionId);
            this.clearCart();

            // 4. Cloud Sync - CRITICAL: Must await stock deduction before redirecting
            if (typeof firebase !== 'undefined') {
                try {
                    // A. Await Order Data Push
                    await database.ref('orders').push(order);

                    // B. Await Inventory Sync
                    // 1. Sync entire products list to Firebase
                    await this.updateCloud('products');

                    // 2. Sync specific modified products to Cloudflare (Protected Sync)
                    if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled && modifiedProducts.length > 0) {
                        for (const p of modifiedProducts) {
                            await HybridSystem.saveProduct(p);
                        }
                        console.log('✅ Stock changes synced to Cloudflare (Sequential)');
                    }
                } catch (syncErr) {
                    console.error('Cloud Sync failed:', syncErr);
                }
            }

            return order;
        } catch (e) {
            console.error('CRITICAL: createOrder failed', e);
            throw e;
        }
    }

    saveOrder(order) {
        return this.createOrder(order);
    }

    // Abandoned Carts Logic
    saveAbandonedCart(cart, customerInfo = null) {
        if (!cart || cart.length === 0) return;
        let abandoned = this.getAbandonedCarts();
        let sessionId = localStorage.getItem('cart_session_id');
        if (!sessionId) {
            sessionId = 'S-' + Date.now();
            localStorage.setItem('cart_session_id', sessionId);
        }

        const existingIndex = abandoned.findIndex(a => a.sessionId === sessionId);
        const newEntry = {
            sessionId,
            date: new Date().toISOString(),
            cart,
            customer: customerInfo,
            id: existingIndex !== -1 ? abandoned[existingIndex].id : 'ABC-' + Date.now()
        };

        if (existingIndex !== -1) {
            abandoned[existingIndex] = newEntry;
        } else {
            abandoned.unshift(newEntry);
        }
        localStorage.setItem('abandoned_carts', JSON.stringify(abandoned));
        this.updateCloud('abandoned_carts');
    }

    getAbandonedCarts() {
        try {
            return JSON.parse(localStorage.getItem('abandoned_carts')) || [];
        } catch (e) {
            return [];
        }
    }

    removeAbandonedCart(sessionId) {
        let abandoned = this.getAbandonedCarts();
        abandoned = abandoned.filter(a => a.sessionId !== sessionId);
        localStorage.setItem('abandoned_carts', JSON.stringify(abandoned));
        this.updateCloud('abandoned_carts');
    }

    async updateOrderStatus(orderId, status) {
        let orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const oldStatus = order.status;
            order.status = status;

            // Auto-create Bosta delivery when status changes to "Confirmed"
            if (status === 'Confirmed' && oldStatus !== 'Confirmed') {
                try {
                    if (typeof BostaIntegration !== 'undefined' && BostaIntegration.config.enabled && BostaIntegration.isConfigured()) {
                        if (!order.bostaDeliveryId) {
                            const result = await BostaIntegration.createDelivery(order);
                            if (result.success) {
                                order.bostaDeliveryId = result.deliveryId;
                                order.bostaTrackingNumber = result.trackingNumber;
                                order.bostaStatus = 'Confirmed';
                                order.bostaCreatedAt = Date.now();
                                console.log('✅ Bosta Delivery Created:', result.trackingNumber);

                                // NEW: Auto-request Pickup immediately
                                try {
                                    const pResult = await BostaIntegration.createPickup([result.deliveryId]);
                                    if (pResult.success) {
                                        if (pResult.alreadyScheduled) {
                                            showToast(`تم إنشاء البوليصة وتحديث جدول الاستلام المجدول مسبقاً لهذا اليوم`, 'success', 'شحنة مؤكدة');
                                        } else {
                                            showToast(`تم إرسال الطلب لبوسطة وطلب المندوب بنجاح`, 'success', 'شحنة مؤكدة');
                                        }
                                    } else if (!pResult.success && typeof showToast === 'function') {
                                        showToast(`تم إنشاء البوليصة ولكن فشل طلب المندوب: ${pResult.message}`, 'warning', 'تنبيه الاستلام');
                                    }
                                } catch (pError) {
                                    console.warn('Pickup scheduling failed:', pError);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Bosta Integration Error:', error);
                    if (typeof showToast === 'function') {
                        let msg = error.message;
                        if (msg.includes('Invalid authorization') || msg.includes('API key')) {
                            msg = 'مفتاح الربط (API Key) غير صحيح أو منتهي الصلاحية. يرجى التحقق من الإعدادات.';
                        }
                        showToast(`تنبيه بوسطة: ${msg}`, 'warning');
                    }
                }
            }

            // Auto-cancel Bosta delivery if status changes back to "Pending" or "Cancelled"
            if ((status === 'Pending' || status === 'Cancelled') && order.bostaDeliveryId) {
                try {
                    if (typeof BostaIntegration !== 'undefined') {
                        const cancelResult = await BostaIntegration.cancelDelivery(order.bostaDeliveryId);
                        if (cancelResult.success) {
                            console.log('🗑️ Bosta Delivery Cancelled:', order.bostaTrackingNumber);
                            const oldNum = order.bostaTrackingNumber;
                            // Clear Bosta info from order
                            delete order.bostaDeliveryId;
                            delete order.bostaTrackingNumber;
                            delete order.bostaStatus;
                            delete order.bostaCreatedAt;

                            if (typeof showToast === 'function') {
                                showToast(`تم إلغاء شحنة بوسطة (${oldNum}) بنجاح`, 'info');
                            }
                        } else {
                            if (typeof showToast === 'function') {
                                showToast(`تنبيه: فشل إلغاء الشحنة في بوسطة: ${cancelResult.message || 'خطأ غير معروف'}`, 'warning');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Bosta Cancel Error:', error);
                    if (typeof showToast === 'function') {
                        showToast(`خطأ أثناء محاولة إلغاء شحنة بوسطة: ${error.message}`, 'error');
                    }
                }
            }

            localStorage.setItem('orders', JSON.stringify(orders));
            this.updateCloud('orders');
        }
    }

    markOrderAsRead(orderId) {
        let orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);
        if (order && !order.isRead) {
            order.isRead = true;
            localStorage.setItem('orders', JSON.stringify(orders));
            this.updateCloud('orders');
        }
    }

    async deleteOrder(orderId) {
        let orders = this.getOrders();
        const order = orders.find(o => o.id === orderId);

        // Cancel in Bosta if exists
        if (order && order.bostaDeliveryId) {
            try {
                if (typeof BostaIntegration !== 'undefined') {
                    await BostaIntegration.cancelDelivery(order.bostaDeliveryId);
                    console.log('🗑️ Bosta Delivery Cancelled due to order deletion');
                }
            } catch (error) {
                console.error('Bosta Cancel Error during deletion:', error);
            }
        }

        orders = orders.filter(o => o.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
        this.updateCloud('orders');
        return true;
    }

    async cancelOrder(orderId) {
        return await this.deleteOrder(orderId);
    }

    getCart() {
        return JSON.parse(localStorage.getItem('cart'));
    }

    addToCart(product, selectedColor = null, selectedSize = null, quantity = 1) {
        let cart = this.getCart();
        const existing = cart.find(item =>
            item.id == product.id &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
        );
        if (existing) {
            existing.quantity += quantity;
            existing.addedBy = 'manual'; // Upgrade to manual if they clicked
        } else {
            cart.push({
                ...product,
                quantity: quantity,
                selectedColor,
                selectedSize,
                addedBy: 'manual'
            });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
    }

    syncProductToCart(product, selectedColor = null, selectedSize = null, quantity = 1) {
        let cart = this.getCart();
        const existingIndex = cart.findIndex(item => item.id == product.id);

        // If it was already manually added, don't downgrade it
        const wasManual = existingIndex !== -1 && cart[existingIndex].addedBy === 'manual';

        const cartItem = {
            ...product,
            quantity: quantity,
            selectedColor,
            selectedSize,
            addedBy: wasManual ? 'manual' : 'auto',
            lastSynced: Date.now()
        };
        if (existingIndex !== -1) {
            cart[existingIndex] = cartItem;
        } else {
            cart.push(cartItem);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
    }

    autoCleanCart() {
        let cart = this.getCart();
        if (cart.length === 0) return;

        const products = this.getProducts();
        let changed = false;

        const originalCount = cart.length;

        // 1. Remove ONLY auto-added items that are now out of stock
        cart = cart.filter(item => {
            const p = products.find(prod => prod.id == item.id);
            if (!p || p.archived) return item.addedBy === 'manual';

            let isOutOfStock = false;
            if (item.selectedSize && p.variants && p.variants.length > 0) {
                const variant = p.variants.find(v => v.size === item.selectedSize);
                if (variant && variant.quantity <= 0) isOutOfStock = true;
            } else if (p.quantity <= 0) {
                isOutOfStock = true;
            }

            if (isOutOfStock && item.addedBy === 'auto') return false;
            return true;
        });

        if (cart.length !== originalCount) changed = true;

        if (changed) {
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated'));
            console.log('🧹 Cart self-cleaned (Out of stock items removed)');
        }
    }

    removeFromCart(id) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id != id);
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
    }

    removeFromCartByIndex(index) {
        let cart = this.getCart();
        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated'));
        }
    }

    updateCartQuantity(id, qty) {
        let cart = this.getCart();
        const item = cart.find(i => i.id == id);
        if (item) {
            item.quantity = qty;
            if (item.quantity <= 0) {
                this.removeFromCart(id);
                return;
            }
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
    }

    updateCartQuantityByIndex(index, qty) {
        let cart = this.getCart();
        if (index >= 0 && index < cart.length) {
            const item = cart[index];
            const products = this.getProducts();
            const product = products.find(p => p.id == item.id);

            // Determine Max Limit (Stock Availability)
            let maxLimit = 999;
            if (product) {
                // If variant (Size) is selected, check variant quantity
                if (item.selectedSize && product.variants) {
                    // Use loose equality to match string/number types if needed
                    const variant = product.variants.find(v => v.size == item.selectedSize);
                    if (variant) maxLimit = variant.quantity;
                } else {
                    // Fallback to main product quantity
                    maxLimit = product.quantity;
                }
            }

            // Check if requested quantity exceeds stock
            if (qty > maxLimit) {
                if (typeof showAlert !== 'undefined') {
                    showAlert('عذراً، هذه هي أقصى كمية متوفرة حالياً', 'info');
                } else {
                    alert('عذراً، هذه هي أقصى كمية متوفرة حالياً');
                }
                // Halt update to prevent exceeding stock
                return;
            }

            cart[index].quantity = qty;
            if (cart[index].quantity <= 0) {
                this.removeFromCartByIndex(index);
                return;
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            window.dispatchEvent(new Event('cartUpdated'));
        }
    }

    clearCart() {
        localStorage.setItem('cart', JSON.stringify([]));
        window.dispatchEvent(new Event('cartUpdated'));
    }

    // Admin Auth
    loginAdmin(email, password) {
        // 1. Check Custom Super Admin Credentials
        const settings = this.getSettings();
        const masterEmail = 'admin@elsharkawy.com';
        const oldMasterEmail = 'admin@elsherkaystore.com';
        const masterPass = settings.adminPass || 'adminsaifelsheikh320@';

        if ((email === masterEmail || email === oldMasterEmail || email === settings.adminEmail) && password === masterPass) {
            const adminData = {
                name: 'Super Admin',
                email: masterEmail,
                role: 'admin',
                permissions: ['all']
            };
            localStorage.setItem('admin_token', JSON.stringify(adminData));
            return { success: true };
        }

        // 2. Check Staff
        const staff = this.getStaff();
        const member = staff.find(s => s.email === email && s.pass === password);
        if (member) {
            const adminData = {
                name: member.name,
                email: member.email,
                role: 'staff',
                permissions: member.permissions || [],
                pin: member.pin // Track pin for lock screen
            };
            localStorage.setItem('admin_token', JSON.stringify(adminData));
            return { success: true };
        }

        return { success: false, message: 'بيانات الدخول غير صحيحة' };
    }

    isAdminLoggedIn() {
        return !!localStorage.getItem('admin_token');
    }

    getLoggedAdmin() {
        const token = localStorage.getItem('admin_token');
        if (!token) return null;
        try {
            const parsed = JSON.parse(token);
            if (typeof parsed === 'object' && parsed !== null) return parsed;
            // Handle old boolean-like tokens
            return { name: 'Admin', email: 'admin@elsherkaystore.com', role: 'admin', permissions: ['all'] };
        } catch (e) {
            return { name: 'Admin', email: 'admin@elsherkaystore.com', role: 'admin', permissions: ['all'] };
        }
    }

    logoutAdmin() {
        localStorage.removeItem('admin_token');
    }

    // Customer Auth
    registerCustomer(name, email, password, phone) {
        let customers = JSON.parse(localStorage.getItem('customers') || '[]');

        // Check if email exists
        if (customers.find(c => c.email === email)) {
            return { success: false, message: 'البريد الإلكتروني مسجل مسبقاً' };
        }

        const customer = {
            id: Date.now(),
            name,
            email,
            password, // In real app, hash this!
            phone,
            createdAt: new Date().toISOString()
        };

        customers.push(customer);
        localStorage.setItem('customers', JSON.stringify(customers));
        this.updateCloud('customers');
        return { success: true, message: 'تم التسجيل بنجاح' };
    }

    loginCustomer(identifier, password) {
        let customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const customer = customers.find(c => (c.email === identifier || c.phone === identifier) && c.password === password);

        if (customer) {
            localStorage.setItem('customer_token', JSON.stringify({
                id: customer.id,
                name: customer.name,
                email: customer.email
            }));
            return { success: true, customer };
        }
        return { success: false, message: 'بيانات الدخول غير صحيحة' };
    }

    isCustomerLoggedIn() {
        return !!localStorage.getItem('customer_token');
    }

    getCustomer() {
        return JSON.parse(localStorage.getItem('customer_token'));
    }

    logoutCustomer() {
        localStorage.removeItem('customer_token');
    }

    getCustomerOrders(email) {
        const orders = this.getOrders() || [];
        return orders.filter(o => o.customer.email === email);
    }

    deleteCustomer(email) {
        let customers = JSON.parse(localStorage.getItem('customers') || '[]');
        customers = customers.filter(c => c.email !== email);
        localStorage.setItem('customers', JSON.stringify(customers));
        this.updateCloud('customers');
        return true;
    }

    // Site Settings
    getSettings() {
        const defaultSettings = {
            heroTitleAr: "أناقة منزلك<br><span style='color: var(--color-primary);'>اختيارك يميز أثاثك</span>",
            heroTitleEn: "Your Home Elegance<br><span style='color: var(--color-primary);'>Starts Here</span>",
            heroDescAr: "اكتشف أجود أنواع إكسسوارات الموبيليا من أوكر وكوالين وديكورات فاخرة لمنزل عصري.",
            heroDescEn: "Discover the finest furniture accessories including tassels, trims, and luxury decorations for a modern home.",
            heroImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
            storeName: "الشرقاوي",
            featuredProductIds: [1, 2, 3],
            collections: [
                { id: 1, nameAr: "أوكر وكوالين", nameEn: "Tassels & Trims", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400", link: "products?category=Tassels" },
                { id: 2, nameAr: "ديكورات", nameEn: "Decorations", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400", link: "products?category=Decorations" },
                { id: 3, nameAr: "إكسسوارات", nameEn: "Accessories", image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400", link: "products?category=Accessories" }
            ],
            featuredTitleAr: "الأكثر رواجاً",
            featuredTitleEn: "Trending Now",
            whatsapp: "201154025770",
            offerTitle: "تخفيضات نهاية العام",
            offerDesc: "احصل على خصم يصل إلى 40% على منتجات مختارة.",
            offerBtn: "عرض العروض",
            offerEnabled: true,
            fbPixelId: "2734165686928707",
            reviewsEnabled: true,
            reviews: [
                { id: 1, name: "منى أحمد", comment: "الأوكر والكوالين جودة ممتازة وألوان رائعة، أضافت لمسة فخامة للصالون.", rating: 5, date: "2026-01-01" },
                { id: 2, name: "سارة محمود", comment: "الخامات فاخرة جداً والتصميمات عصرية، التوصيل كان سريع ومحترم.", rating: 5, date: "2026-01-01" },
                { id: 3, name: "هدى خالد", comment: "أفضل محل إكسسوارات موبيليا، الأسعار ممتازة والجودة عالية، شكراً الشرقاوي.", rating: 5, date: "2026-01-01" }
            ],
            // Security Settings
            adminEmail: 'admin@elsharkawy.com',
            adminPass: 'adminsaifelsheikh320@',
            appLockEnabled: false,
            adminPin: '0000',
            // Policies
            termsAr: '',
            termsEn: '',
            shippingPolicyAr: '',
            shippingPolicyEn: '',
            refundPolicyAr: '',
            refundPolicyEn: '',
            privacyPolicyAr: '',
            privacyPolicyEn: ''
        };
        const saved = JSON.parse(localStorage.getItem('site_settings'));
        if (!saved) return defaultSettings;
        return { ...defaultSettings, ...saved };
    }

    saveSettings(settings) {
        localStorage.setItem('site_settings', JSON.stringify(settings));
        this.updateCloud('site_settings');
        window.dispatchEvent(new Event('settingsUpdated'));
    }

    // Coupons Logic
    getCoupons() {
        return JSON.parse(localStorage.getItem('coupons') || '[]');
    }

    saveCoupon(coupon) {
        let coupons = this.getCoupons();
        const existingIndex = coupons.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase());
        if (existingIndex !== -1) {
            coupons[existingIndex] = coupon;
        } else {
            coupons.push(coupon);
        }
        localStorage.setItem('coupons', JSON.stringify(coupons));
        this.updateCloud('coupons');
    }

    deleteCoupon(code) {
        let coupons = this.getCoupons();
        coupons = coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
        localStorage.setItem('coupons', JSON.stringify(coupons));
        this.updateCloud('coupons');
    }

    validateCoupon(code) {
        const coupons = this.getCoupons();
        const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
        if (!coupon) return { valid: false, message: 'كود خصم غير صحيح' };

        const now = new Date();
        if (coupon.expiry && new Date(coupon.expiry) < now) {
            return { valid: false, message: 'كود الخصم منتهي الصلاحية' };
        }

        return { valid: true, coupon };
    }

    // Special Offers Logic
    getSpecialOffers() {
        const defaultOffers = {
            freeShippingThreshold: null, // null means disabled
            globalDiscountPercentage: 0,
            globalDiscountEnabled: false,
            globalDiscountText: ''
        };
        return JSON.parse(localStorage.getItem('special_offers')) || defaultOffers;
    }

    saveSpecialOffers(offers) {
        localStorage.setItem('special_offers', JSON.stringify(offers));
        this.updateCloud('special_offers');
    }

    // Helper to calculate price with global discount
    getDiscountedPrice(price) {
        const offers = this.getSpecialOffers();
        if (offers && offers.globalDiscountEnabled && offers.globalDiscountPercentage > 0) {
            const discount = (price * offers.globalDiscountPercentage) / 100;
            return {
                original: price,
                final: Math.max(0, price - discount),
                percentage: offers.globalDiscountPercentage,
                text: offers.globalDiscountText || '',
                hasDiscount: true
            };
        }
        return {
            original: price,
            final: price,
            percentage: 0,
            hasDiscount: false
        };
    }

    // Staff Logic
    getStaff() {
        return JSON.parse(localStorage.getItem('staff') || '[]');
    }

    saveStaff(member) {
        let staff = this.getStaff();
        const existingIndex = staff.findIndex(s => s.email === member.email);
        if (existingIndex !== -1) {
            staff[existingIndex] = member;
        } else {
            staff.push({ ...member, id: 'STF-' + Date.now() });
        }
        localStorage.setItem('staff', JSON.stringify(staff));
        this.updateCloud('staff');
    }

    deleteStaff(id) {
        let staff = this.getStaff();
        staff = staff.filter(s => s.id !== id);
        localStorage.setItem('staff', JSON.stringify(staff));
        this.updateCloud('staff');
    }

    // Shipping Logic
    getShippingRates() {
        const defaultRates = [
            // Zone 1 (96 EGP)
            { id: 1, city: 'القاهرة', rate: 96, extra: 7 },
            { id: 2, city: 'الجيزة', rate: 96, extra: 7 },

            // Zone 2 (102 EGP)
            { id: 3, city: 'الإسكندرية', rate: 102, extra: 7 },
            { id: 4, city: 'البحيرة', rate: 102, extra: 7 },

            // Zone 3 (110 EGP)
            { id: 5, city: 'القليوبية', rate: 110, extra: 7 },
            { id: 6, city: 'المنوفية', rate: 110, extra: 7 },
            { id: 7, city: 'الشرقية', rate: 110, extra: 7 },
            { id: 8, city: 'الغربية', rate: 110, extra: 7 },
            { id: 9, city: 'الدقهلية', rate: 110, extra: 7 },
            { id: 10, city: 'دمياط', rate: 110, extra: 7 },
            { id: 11, city: 'كفر الشيخ', rate: 110, extra: 7 },
            { id: 12, city: 'بورسعيد', rate: 110, extra: 7 },
            { id: 13, city: 'الإسماعيلية', rate: 110, extra: 7 },
            { id: 14, city: 'السويس', rate: 110, extra: 7 },

            // Zone 4 (123 EGP)
            { id: 15, city: 'الفيوم', rate: 123, extra: 10 },
            { id: 16, city: 'بني سويف', rate: 123, extra: 10 },
            { id: 17, city: 'المنيا', rate: 123, extra: 10 },
            { id: 18, city: 'أسيوط', rate: 123, extra: 10 },
            { id: 19, city: 'سوهاج', rate: 123, extra: 10 },

            // Zone 5 (139 EGP)
            { id: 20, city: 'قنا', rate: 139, extra: 12 },
            { id: 21, city: 'الأقصر', rate: 139, extra: 12 },
            { id: 22, city: 'أسوان', rate: 139, extra: 12 },
            { id: 23, city: 'البحر الأحمر', rate: 139, extra: 15 },
            { id: 24, city: 'مطروح', rate: 139, extra: 15 },

            // Zone 7 (159 EGP)
            { id: 25, city: 'جنوب سيناء', rate: 159, extra: 20 },
            { id: 26, city: 'شمال سيناء', rate: 159, extra: 20 },
            { id: 27, city: 'الوادي الجديد', rate: 159, extra: 20 },

            { id: 28, city: 'المحافظات الأخرى', rate: 180, extra: 20 }
        ];
        return JSON.parse(localStorage.getItem('shipping_rates')) || defaultRates;
    }

    saveShippingRates(rates) {
        localStorage.setItem('shipping_rates', JSON.stringify(rates));
        this.updateCloud('shipping_rates');
    }

    deleteShippingArea(id) {
        let rates = this.getShippingRates();
        rates = rates.filter(r => r.id != id);
        this.saveShippingRates(rates);
    }

    // Database Maintenance
    clearAllProducts() {
        localStorage.setItem('products', JSON.stringify([]));
        this.updateCloud('products');
        window.dispatchEvent(new Event('productsUpdated'));
    }

    resetDatabase() {
        localStorage.clear();
        // Clear Firebase too if reset is called
        if (typeof firebase !== 'undefined') {
            database.ref().set({});
        }
        this.init();
        window.location.reload();
    }

    // User Reviews (Post-Purchase)
    saveUserReview(review) {
        let pending = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        review.id = Date.now();
        review.status = 'pending';
        review.date = new Date().toISOString().split('T')[0];
        pending.push(review);
        localStorage.setItem('pending_reviews', JSON.stringify(pending));
        this.updateCloud('pending_reviews');
    }

    getPendingReviews() {
        return JSON.parse(localStorage.getItem('pending_reviews') || '[]');
    }

    approveReview(id) {
        let pending = this.getPendingReviews();
        const review = pending.find(r => r.id == id);
        if (review) {
            // Add to approved reviews in settings
            const settings = this.getSettings();
            if (!settings.reviews) settings.reviews = [];
            settings.reviews.unshift({
                id: review.id,
                name: review.name,
                rating: review.rating,
                comment: review.comment,
                date: review.date
            });
            this.saveSettings(settings);

            // Remove from pending
            pending = pending.filter(r => r.id != id);
            localStorage.setItem('pending_reviews', JSON.stringify(pending));
            this.updateCloud('pending_reviews');
            return true;
        }
        return false;
    }

    deletePendingReview(id) {
        let pending = this.getPendingReviews();
        pending = pending.filter(r => r.id != id);
        localStorage.setItem('pending_reviews', JSON.stringify(pending));
        this.updateCloud('pending_reviews');
    }
}

const db = new StoreDB();

// ✅ Cloudflare Hook (Hybrid Mode - Legacy Disabled)
/*
if (typeof CloudProducts !== 'undefined') {
    // ... (logic removed to avoid conflicts with new HybridSystem)
}
*/

// Initialize HybridSystem if enabled
if (typeof HybridSystem !== 'undefined' && HYBRID_CONFIG.enabled) {
    const originalSave = db.saveProduct.bind(db);
    db.saveProduct = async function (product, skipRefresh = false) {
        console.log('💾 Starting product save:', product.name);

        // 1. Save locally immediately to be responsive
        originalSave(product, true);
        console.log('✅ Local save complete');

        // 2. Sync to Cloudflare (D1)
        try {
            const success = await HybridSystem.saveProduct(product);
            if (success) {
                console.log('☁️ Cloudflare sync complete');
            }
        } catch (e) {
            console.warn('⚠️ Cloudflare sync skipped:', e);
        }

        // 3. Sync to Firebase as a Backup (In background)
        try {
            db.updateCloud('products');
            console.log('🔥 Firebase backup initiated');
        } catch (e) {
            console.warn('⚠️ Firebase backup skipped:', e);
        }
    };

    const originalDelete = db.deleteProduct.bind(db);
    db.deleteProduct = async function (id) {
        const success = await HybridSystem.deleteProduct(id);
        if (success) {
            originalDelete(id);
        }
    };

    const originalArchive = db.archiveProduct.bind(db);
    db.archiveProduct = async function (id) {
        const p = db.getProduct(id);
        if (p) {
            p.archived = true;
            const success = await HybridSystem.saveProduct(p);
            if (success) originalArchive(id);
        }
    };

    const originalUnarchive = db.unarchiveProduct.bind(db);
    db.unarchiveProduct = async function (id) {
        const p = db.getProduct(id);
        if (p) {
            p.archived = false;
            const success = await HybridSystem.saveProduct(p);
            if (success) originalUnarchive(id);
        }
    };

    db.clearAllProducts = async function () {
        if (await showConfirm('هل أنت متأكد من مسح جميع المنتجات من السحاب والمحلي؟')) {
            // This is a special bulk operation, for simplicity we rely on manual D1 clear if needed
            // but for safety we just clear local and update cloud.
            localStorage.setItem('products', JSON.stringify([]));
            db.updateCloud('products');
            showToast('تم مسح جميع المنتجات', 'success');
        }
    };
}


