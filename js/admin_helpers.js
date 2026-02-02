
// Helper for Featured Selection
function toggleFeaturedMode() {
    const mode = document.getElementById('s-featuredMode').value;
    const manualDiv = document.getElementById('manual-featured-selector');
    if (mode === 'manual') {
        manualDiv.style.display = 'block';
        renderFeaturedSelector();
    } else {
        manualDiv.style.display = 'none';
    }
}

function renderFeaturedSelector() {
    const container = document.getElementById('featured-products-list');
    if (!container) return;
    container.innerHTML = '';
    const allProducts = db.getProducts();

    // Get currently saved IDs
    const savedIdsString = document.getElementById('s-featuredProductIds').value;
    const savedIds = savedIdsString ? savedIdsString.split(',').map(s => s.trim()) : [];

    allProducts.forEach(p => {
        const isChecked = savedIds.includes(p.id.toString()) ? 'checked' : '';
        const div = document.createElement('div');
        div.style.background = '#fff';
        div.style.padding = '8px';
        div.style.border = '1px solid #eee';
        div.style.borderRadius = '6px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '10px';

        div.innerHTML = `
            <input type="checkbox" class="featured-checkbox" value="${p.id}" ${isChecked} style="width: 18px; height: 18px;">
            <img src="${p.image}" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px;">
            <span style="font-size: 0.9rem;">${p.name}</span>
        `;
        container.appendChild(div);
    });
}

function getSelectedFeaturedIds() {
    const checkboxes = document.querySelectorAll('.featured-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Helper for Offer Selection
function toggleOfferMode() {
    const mode = document.getElementById('s-offerMode').value;
    const linkDiv = document.getElementById('link-offer-selector');
    const manualDiv = document.getElementById('manual-offer-selector');

    if (mode === 'manual') {
        manualDiv.style.display = 'block';
        linkDiv.style.display = 'none';
        renderOfferSelector();
    } else {
        manualDiv.style.display = 'none';
        linkDiv.style.display = 'block';
    }
}

function renderOfferSelector() {
    const container = document.getElementById('offer-products-list');
    if (!container) return;
    container.innerHTML = '';
    const allProducts = db.getProducts();

    // Get currently saved Product IDs
    const savedIdsString = document.getElementById('s-offerProductId').value;
    const savedIds = savedIdsString ? savedIdsString.split(',').map(s => s.trim()) : [];

    allProducts.forEach(p => {
        const isChecked = savedIds.includes(p.id.toString()) ? 'checked' : '';
        const div = document.createElement('div');
        div.style.background = '#fff';
        div.style.padding = '8px';
        div.style.border = '1px solid #eee';
        div.style.borderRadius = '6px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '10px';

        div.innerHTML = `
            <input type="checkbox" class="offer-checkbox" value="${p.id}" ${isChecked} style="width: 18px; height: 18px;">
            <img src="${p.image}" style="width: 30px; height: 30px; object-fit: cover; border-radius: 4px;">
            <span style="font-size: 0.9rem;">${p.name}</span>
        `;
        container.appendChild(div);
    });
}

function getSelectedOfferIds() {
    const checkboxes = document.querySelectorAll('.offer-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Ensure settings load correctly
function loadFeaturedSettings(settings) {
    if (settings.featuredMode) {
        document.getElementById('s-featuredMode').value = settings.featuredMode;
    }
    // Pre-fill hidden input so renderFeaturedSelector works
    if (settings.featuredProductIds) {
        document.getElementById('s-featuredProductIds').value = settings.featuredProductIds.join(',');
    }
    toggleFeaturedMode();

    // Handle Offer Settings
    if (settings.offerMode) {
        document.getElementById('s-offerMode').value = settings.offerMode;
    }
    if (settings.offerProductIds) {
        document.getElementById('s-offerProductId').value = settings.offerProductIds.join(',');
    }
    toggleOfferMode();
}

