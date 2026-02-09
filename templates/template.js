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

    // 4. Custom Select Toggling
    const selectTrigger = document.querySelector('.select-trigger');
    const selectOptions = document.querySelector('.select-options');
    if (selectTrigger) {
        selectTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            selectOptions.classList.toggle('active');
        });

        const options = document.querySelectorAll('.select-option');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                selectTrigger.innerText = opt.innerText;
                selectOptions.classList.remove('active');
            });
        });
    }

    // Close select on outside click
    document.addEventListener('click', () => {
        if (selectOptions) selectOptions.classList.remove('active');
    });

    // 5. Segmented Control Switching
    const segmentedButtons = document.querySelectorAll('.segmented-control button');
    segmentedButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.parentElement;
            group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 6. File Upload Intelligence
    initFileUpload();
});

/**
 * File Upload Logic
 */
function initFileUpload() {
    const zone = document.getElementById('upload-zone');
    const queue = document.getElementById('file-queue');
    if (!zone || !queue) return;

    // Click to upload
    zone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = (e) => handleFiles(e.target.files);
        input.click();
    });

    // Drag and Drop
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // Paste to upload
    window.addEventListener('paste', (e) => {
        if (e.clipboardData.files.length > 0) {
            handleFiles(e.clipboardData.files);
        }
    });

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            addFileToQueue(file);
        });
    }

    function addFileToQueue(file) {
        const id = 'file-' + Math.random().toString(36).substr(2, 9);
        const item = document.createElement('div');
        item.className = 'file-item';
        item.id = id;
        item.innerHTML = `
            <div class="file-info">
                <span class="file-name" title="${file.name}">${file.name}</span>
                <span class="file-status">Queued</span>
            </div>
            <div class="file-progress">
                <div class="file-progress-bar"></div>
            </div>
        `;
        queue.prepend(item);

        simulateUpload(id);
    }

    function simulateUpload(id) {
        const item = document.getElementById(id);
        const bar = item.querySelector('.file-progress-bar');
        const status = item.querySelector('.file-status');
        let progress = 0;

        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                item.classList.add('complete');
                status.innerText = 'Complete';
                showToast(`Intelligence sync complete: ${item.querySelector('.file-name').innerText}`, 'success');
            } else {
                status.innerText = Math.round(progress) + '%';
            }
            bar.style.width = progress + '%';
        }, 300 + Math.random() * 500);
    }
}

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
