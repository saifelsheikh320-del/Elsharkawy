/**
 * Hybrid Cloudflare Adapter - VERSION 3.0 (PROTECTED SYNC)
 * Bridges the gap between Client Layouts & Cloud Infrastructure
 */
const HYBRID_CONFIG = {
    workerUrl: "https://elsharkawy-products.saifelsheikh320.workers.dev",
    enabled: true
};

class HybridSystem {
    // 1. READ (Cloud-First with Local Protection)
    static async getProducts() {
        if (!HYBRID_CONFIG.enabled || !HYBRID_CONFIG.workerUrl) {
            return JSON.parse(localStorage.getItem('products') || '[]');
        }

        try {
            const uniqueQuery = `?t=${Date.now()}`;
            const res = await fetch(`${HYBRID_CONFIG.workerUrl}/api/products${uniqueQuery}`);

            if (!res.ok) throw new Error("Cloudflare Fetch Failed");

            const cloudProducts = await res.json();

            if (!Array.isArray(cloudProducts)) throw new Error("Invalid Cloud Data");

            // --- PROTECTION LOGIC ---
            const localProducts = JSON.parse(localStorage.getItem('products') || '[]');

            // We merge instead of overwrite to protect the newest data
            const mergedProducts = cloudProducts.map(cloudP => {
                const localP = localProducts.find(lp => lp.id == cloudP.id);

                if (localP && localP.lastUpdated) {
                    // 1. DIRECT TIMESTAMP COMPARISON (Priority)
                    if (cloudP.lastUpdated && localP.lastUpdated > cloudP.lastUpdated) {
                        return localP;
                    }

                    // 2. RECENT UPDATE PROTECTION (Buffer for clock drift/missing cloud timestamp)
                    if (Date.now() - localP.lastUpdated < 60000) {
                        return localP;
                    }
                }
                return cloudP;
            });

            // Update local cache
            localStorage.setItem('products', JSON.stringify(mergedProducts));

            // Trigger UI
            window.dispatchEvent(new Event('productsUpdated'));

            return mergedProducts;
        } catch (e) {
            console.error("🚨 Cloudflare Offline:", e);
            return JSON.parse(localStorage.getItem('products') || '[]');
        }
    }

    // 2. WRITE (Guaranteed Sync)
    static async saveProduct(product) {
        if (!HYBRID_CONFIG.enabled) return true;

        try {
            // Ensure product has timestamp
            product.lastUpdated = Date.now();

            console.log(`📡 Attempting to sync ${product.name} to Cloud...`);
            const res = await fetch(`${HYBRID_CONFIG.workerUrl}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || "Upload failed");
            }

            console.log(`✅ ${product.name} synced to Cloud.`);
            return true;
        } catch (e) {
            console.error("❌ CLOUD SYNC ERROR:", e);
            return false;
        }
    }

    static async deleteProduct(id) {
        if (!HYBRID_CONFIG.enabled) return true;
        try {
            const res = await fetch(`${HYBRID_CONFIG.workerUrl}/api/products/${id}`, {
                method: 'DELETE'
            });
            return res.ok;
        } catch (e) {
            console.error("Delete Error:", e);
            return false;
        }
    }
}

// Attach to Window
window.HybridSystem = HybridSystem;

