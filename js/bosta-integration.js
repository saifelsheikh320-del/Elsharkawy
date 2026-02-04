// Bosta Integration - VERSION 28.0 (FIXED COLLECTION & INSPECTION)
const BostaIntegration = {
    config: {
        get enabled() { return localStorage.getItem('bosta_enabled') === 'true'; },
        get apiKey() { return (localStorage.getItem('bosta_api_key') || '').trim(); },
        baseUrl: 'https://api.bosta.co',
        get pickupAddress() { return JSON.parse(localStorage.getItem('bosta_pickup_address') || '{}'); },
        get businessName() { return localStorage.getItem('bosta_business_name') || 'متجر الشرقاوي'; },
        get businessPhone() { return localStorage.getItem('bosta_business_phone') || ''; },
        get webhookUrl() {
            const workerBase = "https://elsharkawy-products.saifelsheikh320.workers.dev";
            return `${workerBase}/api/bosta-webhook`;
        }
    },

    saveSettings(s) {
        localStorage.setItem('bosta_enabled', s.enabled);
        localStorage.setItem('bosta_api_key', s.apiKey || '');
        localStorage.setItem('bosta_business_name', s.businessName || '');
        localStorage.setItem('bosta_business_phone', s.businessPhone || '');
        localStorage.setItem('bosta_pickup_address', JSON.stringify(s.pickupAddress || {}));
    },

    getSettings() {
        return {
            enabled: this.config.enabled,
            apiKey: this.config.apiKey,
            businessName: this.config.businessName,
            businessPhone: this.config.businessPhone,
            pickupAddress: this.config.pickupAddress,
            webhookUrl: this.config.webhookUrl
        };
    },

    isConfigured() { return !!this.config.apiKey; },

    norm(t) {
        if (!t) return '';
        return t.toString().replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/[ةه]/g, 'ة').toLowerCase().trim();
    },

    getPackageDetails(items) {
        // Standard Bosta Sizes from User Image
        // Dimensions L*W (Height assumed 15 for boxes, 20 for bag)
        const sizes = [
            { name: 'SMALL', label: 'صندوق صغير', l: 35, w: 25, h: 10, extra: 0 },
            { name: 'MEDIUM', label: 'صندوق وسط', l: 40, w: 35, h: 15, extra: 0 },
            { name: 'LARGE', label: 'صندوق كبير', l: 50, w: 45, h: 25, extra: 5 },
            { name: 'X_LARGE', label: 'صندوق كبير جداً', l: 60, w: 50, h: 30, extra: 10 },
            { name: 'WHITE_BAG', label: 'الكيس الأبيض', l: 100, w: 50, h: 15, extra: 15 },
            { name: 'LIGHT_BULKY', label: 'شحنة خفيفة ثقيلة', l: 150, w: 100, h: 50, extra: 100 }
        ];

        let totalVolume = 0;
        let totalWeight = 0;
        let maxL = 0, maxW = 0, maxH = 0;

        items.forEach(item => {
            const dims = item.dimensions || { length: 15, width: 15, height: 10 }; // Default if missing
            const qty = item.quantity || 1;
            totalVolume += (dims.length * dims.width * dims.height) * qty;
            totalWeight += (parseFloat(item.weight) || 0.5) * qty;

            // For max dimensions, we take the largest single item
            maxL = Math.max(maxL, dims.length);
            maxW = Math.max(maxW, dims.width);
            maxH = Math.max(maxH, dims.height);
        });

        // Heuristic: If multiple items, add 10% volume for packing space
        if (items.length > 1) totalVolume *= 1.1;

        // Find smallest box that fits totalVolume and max dimensions
        let selected = sizes[sizes.length - 1]; // Default to largest
        for (const s of sizes) {
            const boxVol = s.l * s.w * s.h;
            // Check if volume fits AND if the largest item fits physically
            // (Sort dimensions to allow rotation)
            const boxDims = [s.l, s.w, s.h].sort((a, b) => b - a);
            const itemDims = [maxL, maxW, maxH].sort((a, b) => b - a);

            const fitsPhysically = itemDims[0] <= boxDims[0] && itemDims[1] <= boxDims[1] && itemDims[2] <= boxDims[2];

            if (totalVolume <= boxVol && fitsPhysically) {
                selected = s;
                break;
            }
        }

        let weightExtra = 0;
        if (totalWeight > 20) {
            weightExtra = Math.ceil(totalWeight - 20) * 5;
        }

        return {
            size: selected.name,
            label: selected.label,
            dimensions: { length: selected.l, width: selected.w, height: selected.h },
            extra: selected.extra,
            totalWeight: totalWeight,
            weightExtra: weightExtra,
            totalExtra: selected.extra + weightExtra
        };
    },

    async createDelivery(order) {
        if (!this.isConfigured()) throw new Error('يرجى ضبط API Key أولاً');
        try {
            const cust = order.customer || {};
            const provinceField = cust.province || '';
            const cityField = cust.city || '';
            const addressField = cust.address || '';

            const provinceCode = this.getManualCode(provinceField || cityField);
            const provinceName = provinceField || cityField || 'القاهرة';

            let receiverName = (cust.name || 'عميل').trim();
            const firstLine = `محافظة ${provinceName} - ${[cityField, addressField].filter(p => p && p.trim().length > 1).join(' - ') || 'العنوان بالتفصيل'}`;

            const totalItemsCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

            const pm = String(order.paymentMethod || '').toLowerCase();
            const isElectronic = pm.includes('vodafone') || pm.includes('instapay') || pm.includes('prepaid') || pm.includes('باي');
            const isCOD = !isElectronic;

            const totalVal = Math.round(Number(order.total)) || 0;
            const allowInsp = !!order.allowInspection;

            // DYNAMIC PACKAGE CALCULATION
            const pkg = this.getPackageDetails(order.items || []);
            const packageSizeLabel = pkg.label;

            // --- BOSTA FINAL FIX STRATEGY ---
            // Issue: Dashboard always showed "Small".
            // Solution: The correct field is `specs.packageType` (not just `size` or `type`).
            // Valid Values: "Small", "Medium", "Large", "Light Bulky", "Heavy Bulky".

            const storeSize = pkg.size.toUpperCase();
            let bPackageType = 'Small'; // Default
            let bDims = { length: 35, width: 25, height: 10 };
            let bWeight = 1.5;

            // Mapping Store Sizes to Bosta 'packageType'
            if (storeSize === 'MEDIUM') {
                bPackageType = 'Medium';
                bDims = { length: 40, width: 35, height: 15 };
                bWeight = 4.5;
            } else if (['LARGE', 'X_LARGE', 'VERY_LARGE'].includes(storeSize)) {
                bPackageType = 'Large';
                bDims = { length: 50, width: 45, height: 25 };
                bWeight = 10;
            } else if (['WHITE_BAG', 'LIGHT_BULKY'].includes(storeSize)) {
                bPackageType = 'Light Bulky';
                bDims = { length: 100, width: 50, height: 20 };
                bWeight = 15;
            }

            const payload = {
                type: 10, // Shipment Type: Deliver
                allowOpening: allowInsp, // Try 1
                allowToOpenPackage: allowInsp, // Try 2 (Likely correct per SDKs)
                specs: {
                    packageType: bPackageType,
                    size: bPackageType.toUpperCase(),
                    weight: bWeight,
                    dimensions: bDims,
                    allowOpening: allowInsp, // Try 3
                    packageDetails: {
                        description: `طلب #${order.id} - ${packageSizeLabel}`,
                        itemsCount: totalItemsCount,
                        allowOpening: allowInsp // Try 4
                    }
                },
                cod: isCOD ? totalVal : 0,
                businessReference: order.id,
                dropOffAddress: {
                    city: provinceCode,
                    district: provinceName,
                    firstLine: firstLine.substring(0, 160),
                    buildingNumber: '1', floor: 'G', apartment: '1'
                },
                receiver: {
                    firstName: receiverName.split(' ')[0],
                    lastName: receiverName.split(' ').slice(1).join(' ') || '.',
                    phone: (cust.phone || '').toString().replace(/\D/g, '').replace(/^2/, '')
                },
                notes: (order.notes || 'يرجى الاتصال قبل الوصول') + ` | الحجم: ${packageSizeLabel}` + (allowInsp ? ' | السماح بفتح الشحنة' : ''),
            };

            console.log('🚀 [Bosta Fixed Payload] packageType:', bPackageType);
            console.log('📦 Full Payload:', payload);

            const response = await fetch(`${this.config.baseUrl}/api/v2/deliveries`, {
                method: 'POST',
                headers: { 'Authorization': this.config.apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log('✅ Bosta Final Response:', result);
            if (!response.ok) throw new Error(result.message || 'Bosta Error');
            return { success: true, trackingNumber: result.trackingNumber, deliveryId: result._id };
        } catch (e) {
            console.error('Bosta Delivery Error:', e);
            throw e;
        }
    },

    async createPickup(deliveryIds = []) {
        if (!this.isConfigured()) return { success: false, message: 'Settings Incomplete' };
        const bizPhone = (this.config.businessPhone || '').toString().replace(/\D/g, '');
        if (!bizPhone) return { success: false, message: 'رقم تليفون المحل مطلوب في الإعدادات' };

        try {
            const now = new Date();
            if (now.getHours() >= 15) now.setDate(now.getDate() + 1);
            const dateStr = now.toISOString().split('T')[0];

            const provinceCode = this.getManualCode(this.config.pickupAddress.city);

            const pickupPayload = {
                scheduledDate: dateStr,
                scheduledSlot: "10:00 - 16:00",
                contactPerson: {
                    name: this.config.businessName || 'متجر الشرقاوي',
                    phone: bizPhone
                },
                pickupAddress: {
                    cityCode: provinceCode,
                    firstLine: this.config.pickupAddress.firstLine || 'العنوان غير مسجل',
                    buildingNumber: this.config.pickupAddress.buildingNumber || '1',
                    floor: this.config.pickupAddress.floor || '1',
                    apartment: this.config.pickupAddress.apartment || '1'
                },
                deliveryIds: deliveryIds
            };

            const response = await fetch(`${this.config.baseUrl}/api/v2/pickups`, {
                method: 'POST',
                headers: { 'Authorization': this.config.apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify(pickupPayload)
            });

            const result = await response.json();
            if (!response.ok) {
                const msg = result.message || '';
                // Case 1: Pickup already exists for these deliveries
                if (msg.includes('already exists')) return { success: true, alreadyExists: true };
                // Case 2: One pickup per district per day limit reached
                if (msg.includes('one pickup per district') || msg.includes('one pickup per day')) {
                    return { success: true, alreadyScheduled: true };
                }
                return { success: false, message: msg || `Status ${response.status}` };
            }
            return { success: true, pickupId: result._id };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    async cancelDelivery(deliveryId) {
        if (!deliveryId) return { success: false };
        try {
            const r = await fetch(`${this.config.baseUrl}/api/v2/deliveries/${deliveryId}`, {
                method: 'DELETE',
                headers: { 'Authorization': this.config.apiKey }
            });
            return { success: r.ok || r.status === 404 };
        } catch (e) { return { success: false }; }
    },

    getManualCode(name) {
        if (!name) return 'EG-01';
        const q = this.norm(name);
        const map = {
            'القاهرة': 'EG-01', 'الاسكندريه': 'EG-02', 'الاسكندرية': 'EG-02', 'الغربيه': 'EG-07', 'الغربية': 'EG-07',
            'كفر الشيخ': 'EG-08', 'بني سويف': 'EG-16', 'اسيوط': 'EG-17', 'الجيزة': 'EG-25', 'الجيزه': 'EG-25', 'الدقهلية': 'EG-05'
        };
        for (let key in map) if (this.norm(key) === q || q.includes(this.norm(key))) return map[key];
        return 'EG-01';
    },

    async testConnection() {
        if (!this.config.apiKey) return { success: false, message: 'API Key Missing' };
        const r = await fetch(`${this.config.baseUrl}/api/v2/cities`, { headers: { 'Authorization': this.config.apiKey } });
        return { success: r.ok, message: r.ok ? 'الاتصال يعمل بنجاح' : 'الـ API Key غير صحيح' };
    }
};

window.BostaIntegration = BostaIntegration;
console.log("Bosta V31.0 CLEAN-SPECS READY.");
