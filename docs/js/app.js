// Global state - DON'T USE MODULE IMPORTS FOR GLOBALS
let currentHotelId = null;
let cart = [];
let telegram = null;
let db = null;

// Initialize app - SIMPLIFIED
async function initApp() {
    try {
        console.log("Starting app initialization...");
        
        // 1. Initialize Telegram
        telegram = await initTelegram();
        console.log("Telegram initialized");
        
        // 2. Get hotel ID from URL
        currentHotelId = getHotelIdFromURL();
        if (!currentHotelId) {
            showError("No hotel ID found. Please scan a valid QR code.");
            return;
        }
        console.log("Hotel ID:", currentHotelId);
        
        // 3. Initialize Firebase modules
        const firebaseModule = await import('./firebase-config.js');
        db = firebaseModule.db;
        console.log("Firebase initialized");
        
        // 4. Load hotel data
        await loadHotelData(currentHotelId);
        console.log("Hotel data loaded");
        
        // 5. Initialize UI
        initUI();
        console.log("UI initialized");
        
        // 6. Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app-container').classList.remove('hidden');
            showToast('Hotel portal loaded!', 'success');
        }, 500);
        
    } catch (error) {
        console.error("App initialization failed:", error);
        showError("Failed to load app. Please try again.");
    }
}

// Get hotel ID from URL
function getHotelIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get('hotel_id') || urlParams.get('hotel') || 'hotel_001';
    
    // Validate format
    if (!/^[a-zA-Z0-9_-]+$/.test(hotelId)) {
        return 'hotel_001'; // Default fallback
    }
    
    return hotelId;
}

// Load hotel data
async function loadHotelData(hotelId) {
    try {
        if (!db) {
            const firebaseModule = await import('./firebase-config.js');
            db = firebaseModule.db;
        }
        
        console.log("Fetching hotel:", hotelId);
        
        const hotelDoc = await db.collection('hotels').doc(hotelId).get();
        
        if (!hotelDoc.exists) {
            console.warn("Hotel not found, creating default...");
            // Create default hotel if doesn't exist
            return createDefaultHotel();
        }
        
        const hotelData = hotelDoc.data();
        console.log("Hotel data:", hotelData);
        
        // Update UI with hotel info
        document.getElementById('app-header').innerHTML = `
            <div class="hotel-info">
                <h1>${hotelData.name || 'Hotel'}</h1>
                <p>${hotelData.location || 'Welcome!'}</p>
            </div>
        `;
        
        // Load menu
        await loadMenu(hotelId);
        
        return hotelData;
        
    } catch (error) {
        console.error("Error loading hotel:", error);
        // Fallback to default data
        return createDefaultHotel();
    }
}

// Create default hotel data for testing
function createDefaultHotel() {
    const defaultHotel = {
        name: "Grand Hotel",
        location: "Demo Hotel - Add to Firebase"
    };
    
    document.getElementById('app-header').innerHTML = `
        <div class="hotel-info">
            <h1>${defaultHotel.name}</h1>
            <p>${defaultHotel.location}</p>
        </div>
    `;
    
    // Show demo menu
    showDemoMenu();
    
    return defaultHotel;
}

// Show demo menu (when Firebase isn't set up)
function showDemoMenu() {
    const demoItems = [
        { id: '1', name: 'Club Sandwich', price: 12.99, description: 'Turkey, bacon, lettuce, tomato' },
        { id: '2', name: 'Caesar Salad', price: 9.99, description: 'Fresh romaine, croutons, parmesan' },
        { id: '3', name: 'French Fries', price: 5.99, description: 'Crispy golden fries' },
        { id: '4', name: 'Orange Juice', price: 3.99, description: 'Freshly squeezed' },
        { id: '5', name: 'Chocolate Cake', price: 7.99, description: 'Rich chocolate dessert' }
    ];
    
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
        <section class="menu-section">
            <div class="section-header">
                <h2>Room Service</h2>
                <p class="demo-note">Demo mode - Add your menu in Firebase</p>
            </div>
            <div class="menu-grid">
                ${demoItems.map(item => `
                    <div class="menu-item" onclick="addToCart('${item.id}', '${item.name}', ${item.price})">
                        <h3>${item.name}</h3>
                        <p class="price">$${item.price.toFixed(2)}</p>
                        <p class="description">${item.description}</p>
                        <button class="add-btn">Add to Cart</button>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

// Load menu from Firebase
async function loadMenu(hotelId) {
    try {
        if (!db) {
            const firebaseModule = await import('./firebase-config.js');
            db = firebaseModule.db;
        }
        
        const menuSnapshot = await db.collection('hotels').doc(hotelId)
            .collection('menu_items')
            .where('available', '==', true)
            .get();
        
        if (menuSnapshot.empty) {
            console.log("No menu items found, showing demo");
            showDemoMenu();
            return;
        }
        
        const menuItems = menuSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderMenu(menuItems);
        
    } catch (error) {
        console.error("Error loading menu:", error);
        showDemoMenu();
    }
}

// Render menu
function renderMenu(items) {
    const content = document.getElementById('app-content');
    
    content.innerHTML = `
        <section class="menu-section">
            <div class="section-header">
                <h2>Room Service</h2>
                <p>${items.length} items available</p>
            </div>
            <div class="menu-grid">
                ${items.map(item => `
                    <div class="menu-item" onclick="addToCart('${item.id}', '${item.name}', ${item.price})">
                        <h3>${item.name}</h3>
                        <p class="price">$${Number(item.price).toFixed(2)}</p>
                        ${item.description ? `<p class="description">${item.description}</p>` : ''}
                        <button class="add-btn">Add to Cart</button>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

// Cart functions
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            id, 
            name, 
            price: Number(price), 
            quantity: 1 
        });
    }
    
    updateCartUI();
    showToast(`${name} added to cart`, 'success');
    
    // Haptic feedback in Telegram
    if (telegram && telegram.HapticFeedback) {
        telegram.HapticFeedback.impactOccurred('medium');
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    // Update cart modal if open
    const cartModal = document.getElementById('cart-modal');
    if (!cartModal.classList.contains('hidden')) {
        renderCartItems();
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
        if (totalElement) totalElement.textContent = '$0.00';
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
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
}

function updateQuantity(itemId, change) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
            showToast('Item removed', 'info');
        }
        
        renderCartItems();
        updateCartUI();
    }
}

async function checkout() {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (telegram && telegram.showConfirm) {
        // Telegram Web App mode
        telegram.showConfirm(`Place order for $${total.toFixed(2)}?`, (confirmed) => {
            if (confirmed) {
                // Send order to Telegram bot
                const orderText = `🛎️ New Order\n\n` +
                    cart.map(item => 
                        `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
                    ).join('\n') +
                    `\n\nTotal: $${total.toFixed(2)}`;
                
                if (telegram.sendData) {
                    telegram.sendData(orderText);
                }
                
                // Save to Firebase if we have hotel ID
                if (currentHotelId && db) {
                    saveOrderToFirebase(currentHotelId);
                }
                
                cart = [];
                toggleCart();
                updateCartUI();
                showToast('Order placed successfully!', 'success');
            }
        });
    } else {
        // Browser mode
        if (confirm(`Place order for $${total.toFixed(2)}?`)) {
            // Save to Firebase if we have hotel ID
            if (currentHotelId && db) {
                await saveOrderToFirebase(currentHotelId);
            }
            
            cart = [];
            toggleCart();
            updateCartUI();
            showToast('Order placed successfully! (Browser mode)', 'success');
        }
    }
}

// Save order to Firebase
async function saveOrderToFirebase(hotelId) {
    try {
        const orderData = {
            items: cart,
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending',
            hotelId: hotelId,
            createdAt: new Date().toISOString(),
            guestName: telegram?.initDataUnsafe?.user?.first_name || 'Guest'
        };
        
        await db.collection('hotels').doc(hotelId)
            .collection('orders')
            .add(orderData);
            
        console.log("Order saved to Firebase");
        
    } catch (error) {
        console.error("Error saving order to Firebase:", error);
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
                <span id="cart-count" class="cart-badge">0</span>
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
    
    // For now, we only have menu
    if (section === 'services') {
        document.getElementById('app-content').innerHTML = `
            <section class="services-section">
                <h2>Hotel Services</h2>
                <div class="services-grid">
                    <div class="service-card" onclick="requestService('Room Cleaning')">
                        <i data-lucide="broom"></i>
                        <h4>Room Cleaning</h4>
                        <p>Request cleaning service</p>
                    </div>
                    <div class="service-card" onclick="requestService('Fresh Towels')">
                        <i data-lucide="droplets"></i>
                        <h4>Fresh Towels</h4>
                        <p>Extra towels</p>
                    </div>
                    <div class="service-card" onclick="requestService('Wake-up Call')">
                        <i data-lucide="alarm-clock"></i>
                        <h4>Wake-up Call</h4>
                        <p>Morning alarm service</p>
                    </div>
                    <div class="service-card" onclick="requestService('Late Checkout')">
                        <i data-lucide="clock"></i>
                        <h4>Late Checkout</h4>
                        <p>Extend your stay</p>
                    </div>
                </div>
            </section>
        `;
        lucide.createIcons();
    }
}

function requestService(serviceName) {
    showToast(`${serviceName} requested!`, 'success');
    
    if (telegram && telegram.sendData) {
        telegram.sendData(`Service: ${serviceName}`);
    }
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
    
    if (window.lucide && lucide.createIcons) {
        lucide.createIcons();
    }
}

// Initialize Telegram - SIMPLIFIED VERSION
async function initTelegram() {
    return new Promise((resolve) => {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            
            // Expand to full screen
            tg.expand();
            tg.ready();
            
            console.log("Telegram Web App initialized");
            resolve(tg);
        } else {
            // Mock for browser testing
            console.log("Browser mode - no Telegram");
            resolve({
                expand: () => {},
                ready: () => {},
                showConfirm: (msg, cb) => {
                    if (confirm(msg)) cb(true);
                    else cb(false);
                },
                sendData: (data) => console.log("Telegram data:", data),
                HapticFeedback: {
                    impactOccurred: () => {}
                },
                initDataUnsafe: {
                    user: { first_name: 'Guest' }
                }
            });
        }
    });
}

// Make functions available globally
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.updateQuantity = updateQuantity;
window.checkout = checkout;
window.showSection = showSection;
window.requestService = requestService;

// Start app when page loads
document.addEventListener('DOMContentLoaded', initApp);