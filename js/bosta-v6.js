// Bosta Integration - VERSION 6.0 (THE ONLY ACTIVE VERSION)
const BostaIntegration = {
    config: {
        enabled: localStorage.getItem('bosta_enabled') === 'true',
        apiKey: localStorage.getItem('bosta_api_key') || '',
        baseUrl: 'https://api.bosta.co',
        pickupAddress: JSON.parse(localStorage.getItem('bosta_pickup_address') || '{}'),
        businessName: localStorage.getItem('bosta_business_name') || 'متجر الشرقاوي',
        businessPhone: localStorage.getItem('bosta_business_phone') || ''
    },

    saveSettings(s) {
        Object.assign(this.config, s);
        localStorage.setItem('bosta_enabled', s.enabled);
        localStorage.setItem('bosta_api_key', s.apiKey || '');
        localStorage.setItem('bosta_business_name', s.businessName || '');
        localStorage.setItem('bosta_business_phone', s.businessPhone || '');
        localStorage.setItem('bosta_pickup_address', JSON.stringify(s.pickupAddress || {}));
    },

    isConfigured() { return !!this.config.apiKey; },

    norm(t) {
        if (!t) return '';
        return t.toString().replace(/[إأآا]/g, 'ا').replace(/[ىي]/g, 'ي').replace(/[ةه]/g, 'ة').toLowerCase().trim();
    },

    async createDelivery(order) {
        // Obvious confirmation that the right code is running
        console.log("%c Bosta V6.0: DETECTED - FORCING GHARBIA ROUTING ", "background: #222; color: #bada55; font-size: 20px;");

        if (!this.isConfigured()) throw new Error('API Key Missing');

        try {
            const cust = order.customer || {};
            const provinceField = cust.province || '';
            const cityField = cust.city || '';
            const addressField = cust.address || '';
            const notesField = order.notes || '';

            // 1. FORCE THE CORRECT PROVINCE (The "City" in Bosta API)
            // We force Gharbia (EG-08) if keywords match, otherwise use the field
            const combinedText = this.norm(provinceField + " " + cityField + " " + addressField);
            let provinceCode = 'EG-01';

            if (combinedText.includes('زفتي') || combinedText.includes('طنطا') || combinedText.includes('غربية')) {
                provinceCode = 'EG-08'; // Gharbia
            } else {
                provinceCode = this.getManualCode(provinceField || cityField);
            }

            // 2. CLEAN AND DETAILED ADDRESS
            // Scrub all contradictory terms and rebuild cleanly
            let cleanAddress = addressField.toString()
                .replace(/كفر الشيخ/g, '')
                .replace(/kafr el sheikh/ig, '')
                .replace(/البحيرة/g, '')
                .replace(/القاهرة/g, '')
                .trim();

            // Prefix with Province-City for absolute clarity at the Bosta Hub
            if (provinceCode === 'EG-08') {
                cleanAddress = "الغربية - " + (cityField ? cityField + " - " : "") + cleanAddress;
            }

            const deliveryData = {
                type: 10,
                specs: {
                    packageDetails: {
                        description: `طلب #${order.id}`,
                        itemsCount: 1,
                        packaging: "Box"
                    },
                    allowOpening: true
                },
                cod: parseFloat(order.total) || 0,
                dropOffAddress: {
                    city: provinceCode, // The logic-based province
                    firstLine: cleanAddress.substring(0, 160),
                    buildingNumber: '1', floor: 'G', apartment: '1'
                },
                receiver: {
                    firstName: (cust.name || 'عميل').split(' ')[0],
                    lastName: (cust.name || '').split(' ').slice(1).join(' ') || '.',
                    phone: (cust.phone || '').toString().replace(/\D/g, '').replace(/^2/, '')
                },
                notes: notesField || 'يرجى الاتصال قبل الوصول'
            };

            const response = await fetch(`${this.config.baseUrl}/api/v2/deliveries`, {
                method: 'POST',
                headers: { 'Authorization': this.config.apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify(deliveryData)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Bosta Error');

            // Show a success message to confirm version
            if (typeof showToast === 'function') {
                showToast("تم الإرسال بنسخة v6.0 المحدثة بنجاح", "success");
            }

            return { success: true, trackingNumber: result.trackingNumber, deliveryId: result._id };
        } catch (e) {
            console.error('Bosta Create Error:', e);
            throw e;
        }
    },

    getManualCode(name) {
        const q = this.norm(name);
        const map = {
            'القاهرة': 'EG-01', 'الجيزة': 'EG-02', 'الاسكندرية': 'EG-03',
            'الدقهلية': 'EG-04', 'البحر الاحمر': 'EG-05', 'البحيرة': 'EG-06',
            'الفيوم': 'EG-07', 'الغربية': 'EG-08', 'الاسماعيلية': 'EG-09',
            'المنوفية': 'EG-10', 'المنيا': 'EG-11', 'القليوبية': 'EG-12',
            'الوادي الجديد': 'EG-13', 'السويس': 'EG-14', 'اسوان': 'EG-15',
            'اسيوط': 'EG-16', 'بني سويف': 'EG-17', 'بورسعيد': 'EG-18',
            'دمياط': 'EG-19', 'الشرقية': 'EG-20', 'جنوب سيناء': 'EG-21',
            'كفر الشيخ': 'EG-22', 'مطروح': 'EG-23', 'الاقصر': 'EG-24',
            'قنا': 'EG-25', 'شمال سيناء': 'EG-26', 'سوهاج': 'EG-27'
        };
        for (let key in map) if (this.norm(key) === q || q.includes(this.norm(key))) return map[key];
        return 'EG-01';
    },

    async cancelDelivery(id) {
        if (!id) return;
        await fetch(`${this.config.baseUrl}/api/v2/deliveries/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': this.config.apiKey }
        }).catch(() => { });
    },

    async testConnection() {
        const r = await fetch(`${this.config.baseUrl}/api/v2/cities`, { headers: { 'Authorization': this.config.apiKey } });
        return { success: r.ok };
    }
};

window.BostaIntegration = BostaIntegration;
console.log("%c Bosta Integration v6.0 ACTIVE ", "color: white; background: green; padding: 5px;");

