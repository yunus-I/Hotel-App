// Minimal ui-renderer placeholder
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `px-4 py-2 rounded shadow ${type === 'error' ? 'bg-red-600 text-white' : type === 'success' ? 'bg-green-600 text-white' : 'bg-gray-800 text-white'}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

export function renderLoading(show = true) {
    const loading = document.getElementById('loading-screen');
    const app = document.getElementById('app-container');
    if (!loading || !app) return;

    if (show) {
        loading.classList.remove('hidden');
        app.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
        app.classList.remove('hidden');
    }
}
