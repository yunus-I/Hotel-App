// Telegram Web App Integration
export async function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Expand to full screen
        tg.expand();
        tg.ready();
        
        // Set theme colors
        if (tg.themeParams) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
        }
        
        return tg;
    } else {
        // Mock Telegram API for browser testing
        console.log('Running in browser mode (Telegram not detected)');
        return {
            expand: () => {},
            ready: () => {},
            showConfirm: (message, callback) => {
                if (confirm(message)) callback(true);
                else callback(false);
            },
            sendData: (data) => console.log('Telegram data:', data),
            themeParams: {
                bg_color: '#ffffff',
                text_color: '#000000',
                button_color: '#2481cc'
            }
        };
    }
}