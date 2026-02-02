
document.addEventListener('DOMContentLoaded', () => {
    // Wait for main.js to set language first if needed, though DOMContentLoaded fires in order.
    // We can rely on renderCart being called, or call it.
    renderCart();

    window.addEventListener('cartUpdated', renderCart);
    window.addEventListener('langChange', renderCart); // Re-render on language toggle
});

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const totalContainer = document.getElementById('cart-total');
    const finalTotalContainer = document.getElementById('final-total');

    if (!cartContainer) return;

    const cart = db.getCart();
    cartContainer.innerHTML = '';

    // Get current Lang text
    const lang = localStorage.getItem('elsharkawy_lang') || 'ar';
    const t = translations[lang] || translations['ar'];

    if (cart.length === 0) {
        cartContainer.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">${t.cart_empty}</td></tr>`;
        if (totalContainer) totalContainer.innerText = '$0';
        if (finalTotalContainer) finalTotalContainer.innerText = '$0';
        return;
    }

    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        const currency = t.currency;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="${t.product_col}">
                <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0;">
                    <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                    <div>
                        <span style="font-weight: 700; color: #333; font-size: 0.95rem;">${item.name}</span>
                        <div style="font-size: 0.8rem; color: #666; margin-top: 3px;">
                            ${item.selectedColor ? `<span>${t.color}: ${item.selectedColor}</span>` : ''}
                            ${item.selectedSize ? `<span style="margin-right: 10px;">${t.size}: ${item.selectedSize}</span>` : ''}
                        </div>
                    </div>
                </div>
            </td>
            <td data-label="${t.price_col}" style="font-weight: 600;">${item.price} ${currency}</td>
            <td data-label="${t.qty_col}">
                <div style="display: flex; align-items: center; gap: 10px; background: #f5f5f5; width: fit-content; padding: 4px 10px; border-radius: 50px;">
                    <button onclick="updateQtyByIndex(${index}, ${item.quantity - 1})" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #666;">-</button>
                    <span style="font-weight: 800; min-width: 15px; text-align: center;">${item.quantity}</span>
                    <button onclick="updateQtyByIndex(${index}, ${item.quantity + 1})" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #666;">+</button>
                </div>
            </td>
            <td data-label="${t.total_col}" style="font-weight: 800; color: var(--color-primary);">${itemTotal} ${currency}</td>
            <td style="text-align: center;">
                <button onclick="removeItemByIndex(${index})" style="color: #ff4757; background: #ffeeef; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: 0.3s;">
                    <i class="fas fa-trash-alt" style="font-size: 0.8rem;"></i>
                </button>
            </td>
        `;
        cartContainer.appendChild(row);
    });

    if (totalContainer) totalContainer.innerText = total + ' ' + t.currency;
    if (finalTotalContainer) finalTotalContainer.innerText = total + ' ' + t.currency;
}

function updateQtyByIndex(index, qty) {
    db.updateCartQuantityByIndex(index, qty);
}

function removeItemByIndex(index) {
    db.removeFromCartByIndex(index);
}

// Keep old names for compatibility if needed elsewhere, though usually just here
window.updateQty = (id, qty) => db.updateCartQuantity(id, qty);
window.removeItem = (id) => db.removeFromCart(id);
window.removeItemByIndex = removeItemByIndex;

function goToCheckout() {
    localStorage.setItem('checkout_mode', 'cart');
    window.location.href = 'checkout.html';
}
window.goToCheckout = goToCheckout;

