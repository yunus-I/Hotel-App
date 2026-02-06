import { cartService } from '../js/cart-service.js';
import HotelService from '../js/hotel-service.js';
import { showToast } from '../js/ui-renderer.js';

export async function renderMenuSection(hotelId) {
    const hotelService = new HotelService(hotelId);
    
    try {
        // Get menu categories
        const categories = await hotelService.getMenuCategories();
        const menuItems = await hotelService.getMenuItems();
        
        return `
            <section class="menu-section animate-fade-in">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-800">Room Service</h1>
                    <div class="relative">
                        <button onclick="toggleCartModal()" class="p-2 rounded-full hover:bg-gray-100 transition">
                            <i data-lucide="shopping-cart" class="w-6 h-6"></i>
                            <span id="cart-count" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">${cartService.getItemCount()}</span>
                        </button>
                    </div>
                </div>
                
                <!-- Categories -->
                <div class="flex space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                    <button class="category-filter category-active px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium whitespace-nowrap" data-category="all">
                        All Items
                    </button>
                    ${categories.map(cat => `
                        <button class="category-filter px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium whitespace-nowrap hover:bg-gray-200 transition" data-category="${cat.id}">
                            ${cat.name}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Menu Items Grid -->
                <div id="menu-items-container" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${menuItems.map(item => renderMenuItem(item)).join('')}
                </div>
                
                <!-- No Items Message -->
                ${menuItems.length === 0 ? `
                    <div class="text-center py-12">
                        <i data-lucide="coffee" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                        <p class="text-gray-500">Menu items coming soon</p>
                    </div>
                ` : ''}
            </section>
        `;
        
    } catch (error) {
        console.error('Error rendering menu:', error);
        return `
            <section class="menu-section">
                <div class="text-center py-12 text-red-600">
                    <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-4"></i>
                    <p>Failed to load menu. Please try again.</p>
                </div>
            </section>
        `;
    }
}

function renderMenuItem(item) {
    return `
        <div class="menu-item bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow" data-category="${item.category}">
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-gray-800">${item.name}</h3>
                    <span class="text-blue-600 font-bold">$${item.price.toFixed(2)}</span>
                </div>
                
                <p class="text-sm text-gray-600 mb-3">${item.description || 'Delicious selection'}</p>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center text-sm text-gray-500">
                        <i data-lucide="clock" class="w-4 h-4 mr-1"></i>
                        <span>${item.prepTime || 15} min</span>
                    </div>
                    
                    <button class="add-to-cart-btn px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center" data-item-id="${item.id}">
                        <i data-lucide="plus" class="w-4 h-4 mr-1"></i>
                        Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Add event listeners after rendering
export function initMenuSectionEvents() {
    // Category filtering
    document.querySelectorAll('.category-filter').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Update active state
            document.querySelectorAll('.category-filter').forEach(btn => {
                btn.classList.remove('category-active', 'bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-100', 'text-gray-700');
            });
            
            this.classList.add('category-active', 'bg-blue-600', 'text-white');
            this.classList.remove('bg-gray-100', 'text-gray-700');
            
            // Filter items
            filterMenuItems(category);
        });
    });
    
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.dataset.itemId;
            // In real app, you would fetch item details
            const item = {
                id: itemId,
                name: this.closest('.menu-item').querySelector('h3').textContent,
                price: parseFloat(this.closest('.menu-item').querySelector('span').textContent.replace('$', ''))
            };
            
            cartService.addItem(item);
        });
    });
}

function filterMenuItems(category) {
    const items = document.querySelectorAll('.menu-item');
    
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}