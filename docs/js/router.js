// Simple router placeholder
export function navigateTo(route) {
    history.pushState({}, '', route);
    window.dispatchEvent(new Event('popstate'));
}

window.addEventListener('popstate', () => {
    // handle route changes
});
