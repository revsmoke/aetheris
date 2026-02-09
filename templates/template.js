/**
 * Template UI Interactions
 * Handles standard behaviors for the Aetheris design system.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Panel Toggling (Collapse/Expand)
    const panels = document.querySelectorAll('.dock-panel');
    panels.forEach(panel => {
        const header = panel.querySelector('.panel-header');
        header.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
        });
    });

    // 2. Navigation Button Active State
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 3. Layer Toggle Buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });
});

/**
 * Modal Management
 */
function openModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal');
    if (e.target.classList.contains('modal-backdrop')) {
        closeModal();
    }
});

/**
 * Toast Notifications
 * @param {string} message 
 * @param {string} type - 'success', 'error', or null
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Export for global use in template.html
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
