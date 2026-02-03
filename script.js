// 1. Initialize Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// ----------------------------------------------------
// 2. FIREBASE CONFIGURATION
// ----------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyAtA5qHijKHAK8xKA4OxoQUIoTctFw5BsQ",
    authDomain: "telegram-hotel-app.firebaseapp.com",
    projectId: "telegram-hotel-app",
    storageBucket: "telegram-hotel-app.firebasestorage.app",
    messagingSenderId: "30546993827",
    appId: "1:30546993827:web:14c5d829211af4085d5516"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ----------------------------------------------------
// 3. STATE MANAGEMENT
// ----------------------------------------------------
let currentHotelId = null;
let hotelPhoneNumber = ""; 
let cart = []; 

function initApp() {
    const urlParams = new URLSearchParams(window.location.search);
    currentHotelId = urlParams.get('hotel_id');

    if (currentHotelId) {
        loadHotelData(currentHotelId);
        showSection('menu'); 
    } else {
        showError("No Hotel ID found. Please scan a valid QR code.");
    }

    const user = tg.initDataUnsafe.user;
    if (user) {
        document.getElementById("user-greeting").innerText = `Welcome, ${user.first_name}!`;
    }

    // Configure Telegram Main Button
    tg.MainButton.setParams({
        text: "VIEW ORDER",
        color: "#2481cc",
        text_color: "#ffffff"
    });
    
    tg.MainButton.onClick(() => {
        sendOrder();
    });
}

// ----------------------------------------------------
// 4. CORE FEATURES (Ordering & Services)
// ----------------------------------------------------

function addToCart(name, price) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    
    // Day 12 Polish: Haptic Feedback
    tg.HapticFeedback.impactOccurred('medium');
    updateMainButton();
}

function updateMainButton() {
    if (cart.length > 0) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        tg.MainButton.setText(`PLACE ORDER ($${total.toFixed(2)})`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

function sendOrder() {
    if (cart.length === 0) return;

    // Show a loading state on the button
    tg.MainButton.showProgress();

    let orderText = "🛎 NEW FOOD ORDER:\n\n";
    cart.forEach(item => {
        orderText += `• ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`;
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    orderText += `\nTotal: $${total.toFixed(2)}`;
    orderText += `\nGuest: ${tg.initDataUnsafe.user?.first_name || 'Guest'}`;

    // Day 12: Success feedback before closing
    tg.showConfirm("Send this order to the kitchen?", (confirmed) => {
        if (confirmed) {
            tg.sendData(orderText);
            tg.MainButton.hideProgress();
        } else {
            tg.MainButton.hideProgress();
        }
    });
}

function requestService(serviceName) {
    tg.HapticFeedback.notificationOccurred('success');
    const serviceMsg = `🛠 SERVICE REQUEST:\nType: ${serviceName}\nGuest: ${tg.initDataUnsafe.user?.first_name || 'Guest'}`;
    tg.showPopup({
        title: 'Request Service',
        message: `Would you like to request ${serviceName} for your room?`,
        buttons: [
            {id: 'ok', type: 'default', text: 'Confirm'},
            {id: 'cancel', type: 'destructive', text: 'Cancel'}
        ]
    }, (btnId) => {
        if (btnId === 'ok') {
            tg.sendData(serviceMsg);
        }
    });
}

// ----------------------------------------------------
// 5. NAVIGATION & UI
// ----------------------------------------------------

function showSection(section) {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        btn.style.background = 'var(--secondary-bg)';
        btn.style.color = 'var(--text-color)';
    });

    let btnIndex = 0;
    if (section === 'rooms') btnIndex = 1;
    if (section === 'services') btnIndex = 2;
    
    if (buttons[btnIndex]) {
        buttons[btnIndex].style.background = 'var(--primary-color)';
        buttons[btnIndex].style.color = '#ffffff';
    }

    if (section === 'menu') loadMenu(currentHotelId);
    else if (section === 'rooms') loadRooms(currentHotelId);
    else if (section === 'services') loadServices(currentHotelId);
}

// ----------------------------------------------------
// 6. DATA FETCHING
// ----------------------------------------------------

function loadHotelData(hotelId) {
    db.collection("hotels").doc(hotelId).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('hotel-name').innerText = data.name;
            document.getElementById('hotel-info').innerText = data.location;
            hotelPhoneNumber = data.phone || ""; 
            if (data.logo) document.getElementById('hotel-logo').src = data.logo;
            document.getElementById('loader').style.display = "none";
        }
    });
}

function loadMenu(hotelId) {
    const container = document.getElementById('menu-container');
    container.innerHTML = "Loading...";
    db.collection("hotels").doc(hotelId).collection("food").get().then((snap) => {
        let html = "";
        snap.forEach(doc => {
            const item = doc.data();
            html += `
                <div class="menu-item" onclick="addToCart('${item.name}', ${item.price})">
                    <div class="item-info">
                        <div class="item-name">${item.name}</div>
                        <div class="item-sub">Tap to add to order</div>
                    </div>
                    <div class="item-price">$${item.price}</div>
                </div>`;
        });
        container.innerHTML = html;
    });
}

function loadServices(hotelId) {
    const container = document.getElementById('menu-container');
    container.innerHTML = "Loading...";
    
    // Combine Manual Buttons with Firebase Services
    let html = `<div class="category-title">Quick Actions</div>
        <div class="menu-item" onclick="requestService('Room Cleaning')">
            <div class="item-info"><div class="item-name">🧹 Request Cleaning</div></div>
        </div>
        <div class="menu-item" onclick="requestService('Fresh Towels')">
            <div class="item-info"><div class="item-name">🛀 Fresh Towels</div></div>
        </div>`;

    db.collection("hotels").doc(hotelId).collection("services").get().then((snap) => {
        snap.forEach(doc => {
            const s = doc.data();
            html += `
                <div class="menu-item" onclick="requestService('${s.title}')">
                    <div class="item-info">
                        <div class="item-name">${s.icon || '🛎'} ${s.title}</div>
                        <div class="item-sub">${s.description || ''}</div>
                    </div>
                </div>`;
        });
        container.innerHTML = html;
    });
}

function loadRooms(hotelId) {
    const container = document.getElementById('menu-container');
    db.collection("hotels").doc(hotelId).collection("rooms").get().then((snap) => {
        let html = "<div class='category-title'>Our Rooms</div>";
        snap.forEach(doc => {
            const r = doc.data();
            html += `<div class="menu-item">
                <div class="item-info"><div class="item-name">${r.type}</div></div>
                <div class="item-price">$${r.price}</div>
            </div>`;
        });
        container.innerHTML = html;
    });
}

function showError(msg) {
    document.getElementById('hotel-name').innerText = "Error";
    document.getElementById('hotel-info').innerText = msg;
}

window.addEventListener('load', initApp);