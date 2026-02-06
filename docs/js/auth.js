import { db, auth } from './firebase-config.js';

// Get hotel ID from URL query parameters
export function getCurrentHotelId() {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get('hotel_id') || urlParams.get('hotel');
    
    // Validate hotel ID format
    if (!hotelId || !/^hotel_[a-zA-Z0-9]+$/.test(hotelId)) {
        console.error('Invalid hotel ID format:', hotelId);
        return null;
    }
    
    return hotelId;
}

// Initialize authentication
export async function initAuth() {
    const hotelId = getCurrentHotelId();
    
    if (!hotelId) {
        throw new Error('Hotel ID is required');
    }
    
    try {
        // For Telegram Web Apps, we use anonymous auth for each hotel
        const userCredential = await auth.signInAnonymously();
        
        // Set custom claims or metadata for multi-tenancy
        await db.collection('hotels').doc(hotelId).collection('active_sessions')
            .doc(userCredential.user.uid).set({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent,
                platform: 'telegram_web_app'
            }, { merge: true });
        
        return hotelId;
        
    } catch (error) {
        console.error('Auth initialization failed:', error);
        throw error;
    }
}

// Hotel data validation
export function validateHotelAccess(hotelId, hotelData) {
    if (!hotelData) return false;
    
    // Check if hotel is active
    if (hotelData.status !== 'active') {
        throw new Error('This hotel portal is not active');
    }
    
    // Check if hotel has required data
    if (!hotelData.name || !hotelData.timezone) {
        throw new Error('Hotel configuration is incomplete');
    }
    
    return true;
}
