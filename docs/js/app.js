import { initTelegram } from './telegram-integration.js';

// Global state
let currentHotelId = null;
let cart = [];
let telegram = null;

// Initialize app
async function initApp() {
    try {
        // 1. Initialize Telegram
        telegram = await initTelegram();
        
        // 2. Get hotel ID from URL
        currentHotelId = getHotelIdFromURL();
        if (!currentHotelId) {
            showError("No hotel ID found. Please scan a valid QR code.");
            return;
        }
        
        // 3. Load hotel data
        await loadHotelData(currentHotelId);
        
        // 4. Initialize UI
        initUI();
        
        // 5. Hide loading screen
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('app-container').classList.remove('hidden');
        
    } catch (error) {
        console.error("App initialization failed:", error);
        showError("Failed to load app. Please try again.");
    }
}

// Get hotel ID from URL
function getHotelIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('hotel_id');
}

// Load hotel data
async function loadHotelData(hotelId) {
    const { db } = await import('./firebase-config.js');
    
    const hotelDoc = await db.collection('hotels').doc(hotelId).get();
    if (!hotelDoc.exists) {
        throw new Error('Hotel not found');
    }
    
    const hotelData = hotelDoc.data();
    
    // Update UI with hotel info
    document.getElementById('app-header').innerHTML = `
        <div class="hotel-info">
            <h1>${hotelData.name || 'Hotel'}</h1>
            <p>${hotelData.location || ''}</p>
        </div>
    `;
    
    // Load menu
    await loadMenu(hotelId);
    
    return hotelData;
}

// Load menu items
async function loadMenu(hotelId) {
    const { db } = await import('./firebase-config.js');
    
    const menuSnapshot = await db.collection('hotels').doc(hotelId)
        .collection('menu_items').get();
    
    const menuItems = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    
    renderMenu(menuItems);
}

// Render menu
function renderMenu(items) {
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
        <section class="menu-section">
            <h2>Room Service</h2>
            <div class="menu-grid">
                ${items.map(item => `
                    <div class="menu-item" onclick="addToCart('${item.id}', '${item.name}', ${item.price})">
                        <h3>${item.name}</h3>
                        <p class="price">$${item.price.toFixed(2)}</p>
                        <p class="description">${item.description || ''}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

// Cart functions
function addToCart(id, name, price) {
    cart.push({ id, name, price, quantity: 1 });
    updateCartUI();
    showToast(`${name} added to cart`, 'success');
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
        cartCount.style.display = cart.length > 0 ? 'block' : 'none';
    }
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
    
    if (!modal.classList.contains('hidden')) {
        renderCartItems();
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        totalElement.textContent = '$0.00';
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>$${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div class="item-controls">
                <button onclick="updateQuantity('${item.id}', -1)">−</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalElement.textContent = `$${total.toFixed(2)}`;
}

function updateQuantity(itemId, change) {
    const item = cart.find(i => i.id === itemId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== itemId);
        }
        renderCartItems();
        updateCartUI();
    }
}

async function checkout() {
    if (cart.length === 0) return;
    
    if (telegram && telegram.showConfirm) {
        telegram.showConfirm("Place this order?", (confirmed) => {
            if (confirmed) {
                // Send order to Telegram bot
                const orderText = `New Order:\n${cart.map(item => 
                    `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
                ).join('\n')}`;
                
                telegram.sendData(orderText);
                cart = [];
                toggleCart();
                updateCartUI();
                showToast('Order placed successfully!', 'success');
            }
        });
    } else {
        // Fallback for browser testing
        alert('Order placed! (Browser mode)');
        cart = [];
        toggleCart();
        updateCartUI();
    }
}

// UI Functions
function initUI() {
    // Create navigation
    document.getElementById('app-navigation').innerHTML = `
        <div class="nav-container">
            <button class="nav-btn active" onclick="showSection('menu')">
                <i data-lucide="utensils"></i>
                <span>Menu</span>
            </button>
            <button class="nav-btn" onclick="showSection('services')">
                <i data-lucide="concierge-bell"></i>
                <span>Services</span>
            </button>
            <button class="nav-btn" onclick="toggleCart()">
                <i data-lucide="shopping-cart"></i>
                <span>Cart</span>
                <span id="cart-count" class="cart-badge">${cart.length}</span>
            </button>
        </div>
    `;
    
    // Initialize icons
    if (window.lucide && lucide.createIcons) {
        lucide.createIcons();
    }
}

function showSection(section) {
    // Update active button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.nav-btn').classList.add('active');
    
    // In a full app, load different sections here
    // For now, we only have menu
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showError(message) {
    document.getElementById('loading-screen').innerHTML = `
        <div class="error-screen">
            <i data-lucide="alert-circle"></i>
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()">Try Again</button>
        </div>
    `;
    lucide.createIcons();
}

// Make functions available globally
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.updateQuantity = updateQuantity;
window.checkout = checkout;
window.showSection = showSection;

// Start app when page loads
window.addEventListener('DOMContentLoaded', initApp);