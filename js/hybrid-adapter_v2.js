
/**
 * Hybrid Cloudflare Adapter
 * Bridges the gap between Client Layouts & Cloud Infrastructure
 */
const HYBRID_CONFIG = {
    workerUrl: "https://elsharkawy-products.saifelsheikh320.workers.dev",
    enabled: true // ✅ مفعّل مع الـ Worker الجديد
};

class HybridSystem {
    // 1. READ (Optimized for Visitors - Zero Latency)
    static async getProducts() {
        if (!HYBRID_CONFIG.enabled || !HYBRID_CONFIG.workerUrl) {
            console.log("Hybrid Mode: OFF (Using Firebase/Local)");
            return JSON.parse(localStorage.getItem('products') || '[]');
        }

        try {
            // Fetch from KV Edge (via Worker) - with AGGRESSIVE cache bust
            // We use Date.now() + Math.random() to ensure Cloudflare NEVER serves a cached response
            const uniqueQuery = `?t=${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const res = await fetch(`${HYBRID_CONFIG.workerUrl}/api/products${uniqueQuery}`);
            if (!res.ok) throw new Error("KV Fetch failed");

            const cloudProducts = await res.json();
            const localProducts = JSON.parse(localStorage.getItem('products') || '[]');

            // Base the result on Cloud data, but keep track of IDs we've seen
            const cloudIds = new Set(cloudProducts.map(p => p.id.toString()));

            // OPTIMIZED MERGE: Force fetch from cloud, but trust local if it's explicitly newer
            // This prevents the "reverting" issue when cloud is slow to update

            const mergedProducts = cloudProducts.map(cloudProd => {
                const localProd = localProducts.find(p => p.id.toString() === cloudProd.id.toString());

                if (localProd) {
                    const cloudTs = Number(cloudProd.lastUpdated || 0);
                    const localTs = Number(localProd.lastUpdated || 0);

                    // If local is explicitly newer (user just edited it), KEEP IT
                    // This bridges the 1-2 second gap while cloud is processing the write
                    if (localTs > cloudTs) {
                        console.log(`🏠 Keeping local version of ${cloudProd.name} (Local is newer by ${localTs - cloudTs}ms)`);
                        return localProd;
                    }
                }
                return cloudProd;
            });

            // Sort
            mergedProducts.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            // Sync back to local storage to keep it up to date
            localStorage.setItem('products', JSON.stringify(mergedProducts));

            // UI Update
            setTimeout(() => {
                window.dispatchEvent(new Event('productsUpdated'));
            }, 0);

            return mergedProducts;
        } catch (e) {
            console.warn("Hybrid Fallback:", e);
            // Fallback to local if Edge fails
            return JSON.parse(localStorage.getItem('products') || '[]');
        }
    }

    // 2. WRITE (Admin - Source of Truth)
    static async saveProduct(product) {
        if (!HYBRID_CONFIG.enabled) {
            // Use old system
            return db ? db.saveProduct_Legacy(product) : false;
        }

        try {
            // Write to D1 (via Worker)
            const res = await fetch(`${HYBRID_CONFIG.workerUrl}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (!res.ok) {
                console.warn("Cloudflare sync failed, but local save will proceed");
                return true; // Don't block local save
            }

            console.log("✅ Product synced to Cloudflare successfully");
            return true;
        } catch (e) {
            console.error("Hybrid Write Error:", e);
            console.warn("⚠️ Cloudflare unavailable - Product saved locally only");
            // Don't show alert or block - let local save proceed
            return true;
        }
    }

    static async deleteProduct(id) {
        if (!HYBRID_CONFIG.enabled) return true;
        try {
            const res = await fetch(`${HYBRID_CONFIG.workerUrl}/api/products/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("D1 Delete Failed");
            return true;
        } catch (e) {
            console.error("Hybrid Delete Error:", e);
            return false;
        }
    }
}

// Attach to Window
window.HybridSystem = HybridSystem;
