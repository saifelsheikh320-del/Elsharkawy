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

            const totalItems = (order.items || []).length;

            const pm = String(order.paymentMethod || '').toLowerCase();
            // Boolean logic for COD: include variations and exclude obvious prepaid methods
            const isCOD = pm === 'cod' || pm.includes('cash') || pm.includes('عند الاستلام') || (pm !== 'vodafone' && pm !== 'instapay' && pm !== 'prepaid');

            const totalVal = Math.round(Number(order.total)) || 0;
            const allowInsp = !!order.allowInspection;

            const isLarge = totalItems >= 4;
            const packageSize = isLarge ? 'صندوق كبير' : 'صندوق صغير';
            const weight = order.totalWeight || (isLarge ? 1.5 : 0.5);

            const payload = {
                type: 10,
                specs: {
                    packageDetails: {
                        description: `طلب #${order.id} - ${packageSize}`,
                        itemsCount: totalItems,
                        packaging: "Box",
                        size: isLarge ? "LARGE" : "SMALL",
                        dimensions: isLarge ? { width: 40, height: 40, length: 40 } : { width: 15, height: 15, length: 15 },
                        weight: weight,
                        value: totalVal,
                        declaredValue: totalVal
                    },
                    allowOpening: allowInsp,
                    isAllowOpening: allowInsp
                },
                cod: isCOD ? totalVal : 0,
                cashOnDelivery: isCOD ? totalVal : 0,
                amount: totalVal,
                value: totalVal,
                allowOpening: allowInsp,
                isAllowOpening: allowInsp,
                businessReference: order.id,
                dropOffAddress: {
                    city: provinceCode,
                    district: provinceName,
                    firstLine: firstLine.substring(0, 160),
                    buildingNumber: '1', floor: 'G', apartment: '1'
                },
                receiver: {
                    firstName: (receiverName).split(' ')[0],
                    lastName: (receiverName).split(' ').slice(1).join(' ') || '.',
                    phone: (cust.phone || '').toString().replace(/\D/g, '').replace(/^2/, '')
                },
                notes: (order.notes || 'يرجى الاتصال قبل الوصول') + ` (${packageSize})`
            };

            const response = await fetch(`${this.config.baseUrl}/api/v2/deliveries`, {
                method: 'POST',
                headers: { 'Authorization': this.config.apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
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
                if (result.message && result.message.includes('already exists')) return { success: true, alreadyExists: true };
                return { success: false, message: result.message || `Status ${response.status}` };
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
console.log("Bosta V28.0 FIXED READY.");
