import { db } from './firebase-config.js';
import { showToast } from './ui-renderer.js';

class HotelService {
    constructor(hotelId) {
        this.hotelId = hotelId;
        this.cache = new Map();
        this.cacheTime = 5 * 60 * 1000; // 5 minutes cache
    }
    
    // Get hotel basic info
    async getHotelInfo() {
        const cacheKey = `hotel_${this.hotelId}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTime) {
                return cached.data;
            }
        }
        
        try {
            const doc = await db.collection('hotels').doc(this.hotelId).get();
            
            if (!doc.exists) {
                throw new Error(`Hotel ${this.hotelId} not found`);
            }
            
            const data = doc.data();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error('Error fetching hotel info:', error);
            showToast('Failed to load hotel information', 'error');
            throw error;
        }
    }
    
    // Get menu items with real-time updates
    async getMenuItems(category = 'all') {
        return new Promise((resolve, reject) => {
            const collectionRef = db
                .collection('hotels')
                .doc(this.hotelId)
                .collection('menu_items')
                .where('status', '==', 'active');
            
            if (category !== 'all') {
                collectionRef.where('category', '==', category);
            }
            
            // Real-time listener
            const unsubscribe = collectionRef.onSnapshot(
                (snapshot) => {
                    const items = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    resolve({ items, unsubscribe });
                },
                (error) => {
                    console.error('Error fetching menu:', error);
                    reject(error);
                }
            );
        });
    }
    
    // Get room types
    async getRooms() {
        try {
            const snapshot = await db
                .collection('hotels')
                .doc(this.hotelId)
                .collection('rooms')
                .where('available', '==', true)
                .orderBy('price')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching rooms:', error);
            throw error;
        }
    }
    
    // Get services
    async getServices() {
        try {
            const snapshot = await db
                .collection('hotels')
                .doc(this.hotelId)
                .collection('services')
                .where('active', '==', true)
                .orderBy('order')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching services:', error);
            throw error;
        }
    }
    
    // Submit order
    async submitOrder(orderData) {
        try {
            const orderRef = await db
                .collection('hotels')
                .doc(this.hotelId)
                .collection('orders')
                .add({
                    ...orderData,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            // Send notification to hotel
            await this.sendOrderNotification(orderRef.id, orderData);
            
            return orderRef.id;
        } catch (error) {
            console.error('Error submitting order:', error);
            throw error;
        }
    }
    
    // Send notification (simplified - in production use Firebase Cloud Messaging)
    async sendOrderNotification(orderId, orderData) {
        // This would integrate with hotel's notification system
        console.log(`Order ${orderId} placed:`, orderData);
        
        // You could add webhook call here
        // await fetch(hotelWebhookUrl, { method: 'POST', body: JSON.stringify(orderData) });
    }
}

// Export factory function
export async function loadHotelData(hotelId) {
    const service = new HotelService(hotelId);
    return await service.getHotelInfo();
}

export default HotelService;
