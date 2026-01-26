// Bosta Integration for Automated Shipping
// API Documentation: https://docs.bosta.co/api

const BostaIntegration = {
    // Configuration
    config: {
        enabled: localStorage.getItem('bosta_enabled') === 'true',
        apiKey: localStorage.getItem('bosta_api_key') || '',
        baseUrl: 'https://api.bosta.co',
        pickupAddress: JSON.parse(localStorage.getItem('bosta_pickup_address') || '{}'),
        businessName: localStorage.getItem('bosta_business_name') || 'متجر الشرقاوي',
        businessPhone: localStorage.getItem('bosta_business_phone') || ''
    },

    // Save Settings
    saveSettings(settings) {
        this.config.enabled = settings.enabled || false;
        this.config.apiKey = settings.apiKey || '';
        this.config.businessName = settings.businessName || 'متجر الشرقاوي';
        this.config.businessPhone = settings.businessPhone || '';
        this.config.pickupAddress = settings.pickupAddress || {};

        localStorage.setItem('bosta_enabled', this.config.enabled);
        localStorage.setItem('bosta_api_key', this.config.apiKey);
        localStorage.setItem('bosta_business_name', this.config.businessName);
        localStorage.setItem('bosta_business_phone', this.config.businessPhone);
        localStorage.setItem('bosta_pickup_address', JSON.stringify(this.config.pickupAddress));
    },

    // Get Settings
    getSettings() {
        return {
            enabled: this.config.enabled,
            apiKey: this.config.apiKey,
            businessName: this.config.businessName,
            businessPhone: this.config.businessPhone,
            pickupAddress: this.config.pickupAddress
        };
    },

    // Check if Bosta is configured
    isConfigured() {
        return this.config.apiKey && this.config.apiKey.length > 0;
    },

    // Create Delivery
    async createDelivery(order) {
        if (!this.isConfigured()) {
            throw new Error('Bosta API غير مفعل. يرجى إضافة API Key في الإعدادات');
        }

        try {
            // Calculate COD Amount based on payment method
            const cod = this.calculateCOD(order);

            // Prepare delivery data
            const deliveryData = {
                type: 10, // Forward delivery
                specs: {
                    packageDetails: {
                        description: `طلب #${order.id}`
                    }
                },
                cod: cod,
                dropOffAddress: {
                    city: this.getCityCode(order.address?.city || 'القاهرة'),
                    firstLine: order.address?.street || order.address?.address || 'العنوان غير متوفر',
                    buildingNumber: order.address?.building || '',
                    floor: order.address?.floor || '',
                    apartment: order.address?.apartment || ''
                },
                receiver: {
                    firstName: order.customer?.name?.split(' ')[0] || 'العميل',
                    lastName: order.customer?.name?.split(' ').slice(1).join(' ') || '',
                    phone: order.customer?.phone || order.phone || ''
                }
            };

            // Make API Call
            const response = await fetch(`${this.config.baseUrl}/api/v2/deliveries`, {
                method: 'POST',
                headers: {
                    'Authorization': this.config.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deliveryData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Bosta API Error: ${response.status}`);
            }

            const result = await response.json();

            // Return tracking information
            return {
                success: true,
                deliveryId: result._id,
                trackingNumber: result.trackingNumber,
                state: result.state,
                message: 'تم إنشاء الشحنة بنجاح في بوسطة'
            };

        } catch (error) {
            console.error('Bosta API Error:', error);
            throw error;
        }
    },

    // Calculate COD (Cash on Delivery) amount
    calculateCOD(order) {
        const paymentMethod = order.paymentMethod || order.payment?.method || 'cash';

        // If payment is "Cash on Delivery" → COD = Total Amount
        if (paymentMethod === 'cash' || paymentMethod === 'cod' || paymentMethod === 'الدفع عند الاستلام') {
            return parseFloat(order.total) || 0;
        }

        // If payment is "Vodafone Cash" or "InstaPay" → COD = 0
        if (paymentMethod === 'vodafone' || paymentMethod === 'instapay' ||
            paymentMethod === 'فودافون كاش' || paymentMethod === 'إنستاباي') {
            return 0;
        }

        // Default: COD = Total Amount (for safety)
        return parseFloat(order.total) || 0;
    },

    // Get City Code (Egypt Cities)
    getCityCode(cityName) {
        const cityMap = {
            'القاهرة': 'EG-01',
            'الجيزة': 'EG-02',
            'الإسكندرية': 'EG-03',
            'الدقهلية': 'EG-04',
            'البحر الأحمر': 'EG-05',
            'البحيرة': 'EG-06',
            'الفيوم': 'EG-07',
            'الغربية': 'EG-08',
            'الإسماعيلية': 'EG-09',
            'المنوفية': 'EG-10',
            'المنيا': 'EG-11',
            'القليوبية': 'EG-12',
            'الوادي الجديد': 'EG-13',
            'السويس': 'EG-14',
            'أسوان': 'EG-15',
            'أسيوط': 'EG-16',
            'بني سويف': 'EG-17',
            'بورسعيد': 'EG-18',
            'دمياط': 'EG-19',
            'الشرقية': 'EG-20',
            'جنوب سيناء': 'EG-21',
            'كفر الشيخ': 'EG-22',
            'مطروح': 'EG-23',
            'الأقصر': 'EG-24',
            'قنا': 'EG-25',
            'شمال سيناء': 'EG-26',
            'سوهاج': 'EG-27'
        };

        return cityMap[cityName] || 'EG-01'; // Default to Cairo
    },

    // Get Cities List for Dropdown
    getCitiesList() {
        return [
            'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
            'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
            'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس', 'أسوان',
            'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
            'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا',
            'شمال سيناء', 'سوهاج'
        ];
    },

    // Test API Connection
    async testConnection() {
        if (!this.isConfigured()) {
            throw new Error('API Key غير موجود');
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/api/v2/cities`, {
                method: 'GET',
                headers: {
                    'Authorization': this.config.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`فشل الاتصال: ${response.status}`);
            }

            return { success: true, message: 'تم الاتصال بنجاح ✓' };
        } catch (error) {
            throw new Error(`فشل الاتصال: ${error.message}`);
        }
    }
};

// Export to window
window.BostaIntegration = BostaIntegration;
