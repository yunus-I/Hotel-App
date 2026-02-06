// New file: docs/js/booking.js
export async function loadRooms(hotelId) {
    const { db } = await import('./firebase-config.js');
    
    const roomsSnapshot = await db.collection('hotels').doc(hotelId)
        .collection('rooms')
        .where('available', '==', true)
        .get();
    
    return roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

export function renderRooms(rooms) {
    return `
        <section class="rooms-section">
            <h2>Available Rooms</h2>
            <div class="rooms-grid">
                ${rooms.map(room => `
                    <div class="room-card">
                        <div class="room-image">
                            <i data-lucide="${room.icon || 'bed'}"></i>
                        </div>
                        <div class="room-info">
                            <h3>${room.type}</h3>
                            <p>${room.description}</p>
                            <div class="room-features">
                                <span>👤 ${room.guests || 2} Guests</span>
                                <span>💰 $${room.price}/night</span>
                            </div>
                            <button onclick="bookRoom('${room.id}')" class="book-btn">
                                Book Now
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

window.bookRoom = async function(roomId) {
    if (telegram && telegram.showConfirm) {
        telegram.showConfirm("Book this room?", async (confirmed) => {
            if (confirmed) {
                const { db } = await import('./firebase-config.js');
                
                await db.collection('hotels').doc(currentHotelId)
                    .collection('bookings')
                    .add({
                        roomId: roomId,
                        guestName: telegram.initDataUnsafe?.user?.first_name,
                        checkIn: new Date().toISOString(),
                        checkOut: new Date(Date.now() + 86400000).toISOString(), // +1 day
                        status: 'confirmed'
                    });
                
                showToast('Room booked successfully!', 'success');
            }
        });
    }
};