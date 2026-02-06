import { showToast } from './ui-renderer.js';

class CartService {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('hotel_cart')) || [];
        this.hotelId = this.getCurrentHotelId();
    }
    
    getCurrentHotelId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('hotel_id');
    }
    
    // Add item to cart
    addItem(item, quantity = 1) {
        const existingItemIndex = this.cart.findIndex(
            cartItem => cartItem.id === item.id && cartItem.hotelId === this.hotelId
        );
        
        if (existingItemIndex > -1) {
            this.cart[existingItemIndex].quantity += quantity;
        } else {
            this.cart.push({
                ...item,
                hotelId: this.hotelId,
                quantity: quantity,
                addedAt: new Date().toISOString()
            });
        }
        
        this.saveCart();
        this.updateCartUI();
        
        showToast(`${item.name} added to cart`, 'success');
        return this.cart;
    }
    
    // Remove item from cart
    removeItem(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartUI();
        
        showToast('Item removed from cart', 'info');
        return this.cart;
    }
    
    // Update item quantity
    updateQuantity(itemId, newQuantity) {
        const itemIndex = this.cart.findIndex(item => item.id === itemId);
        
        if (itemIndex > -1) {
            if (newQuantity <= 0) {
                return this.removeItem(itemId);
            }
            
            this.cart[itemIndex].quantity = newQuantity;
            this.saveCart();
            this.updateCartUI();
        }
        
        return this.cart;
    }
    
    // Get cart total
    getTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }
    
    // Get cart item count
    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }
    
    // Clear cart (for current hotel only)
    clearCart() {
        this.cart = this.cart.filter(item => item.hotelId !== this.hotelId);
        this.saveCart();
        this.updateCartUI();
    }
    
    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('hotel_cart', JSON.stringify(this.cart));
        this.dispatchCartUpdate();
    }
    
    // Update cart UI
    updateCartUI() {
        const cartCount = this.getItemCount();
        const cartBadge = document.getElementById('cart-count');
        
        if (cartBadge) {
            cartBadge.textContent = cartCount;
            cartBadge.classList.toggle('hidden', cartCount === 0);
        }
    }
    
    // Dispatch custom event for cart updates
    dispatchCartUpdate() {
        const event = new CustomEvent('cartUpdated', {
            detail: {
                cart: this.cart,
                total: this.getTotal(),
                count: this.getItemCount()
            }
        });
        window.dispatchEvent(event);
    }
    
    // Get formatted cart for order submission
    getOrderData() {
        return {
            items: this.cart.filter(item => item.hotelId === this.hotelId),
            subtotal: this.getTotal(),
            tax: this.getTotal() * 0.1, // 10% tax example
            total: this.getTotal() * 1.1,
            hotelId: this.hotelId,
            timestamp: new Date().toISOString()
        };
    }
}

// Singleton instance
const cartService = new CartService();

export { cartService };
export default CartService;
