document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const form = document.getElementById('signature-form');
    const inputs = {
        name: document.getElementById('name'),
        title: document.getElementById('title'),
        website: document.getElementById('website'),
        phone: document.getElementById('phone'),
        twitter: document.getElementById('twitter')
    };
    const clearButtons = document.querySelectorAll('.clear-input');
    const previewContainer = document.getElementById('signature-preview');
    const copyBtn = document.getElementById('copy-btn');
    const themeToggle = document.getElementById('theme-toggle');

    // Modal Elements
    const modal = document.getElementById('import-modal');
    const openModalBtn = document.getElementById('how-to-import-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const modalOverlay = document.querySelector('.modal-overlay');

    // Default Data
    const defaultData = {
        name: 'Your Name',
        title: 'Job Title & Company',
        website: 'https://example.com',
        phone: '',
        twitter: ''
    };

    // State - default to dark for terminal theme
    let currentTheme = localStorage.getItem('signature-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // --- Functions ---

    // Generate Avatar from Initials with terminal colors
    function generateAvatar(name) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const size = 64;
        canvas.width = size;
        canvas.height = size;

        // Background - terminal cyan gradient
        const gradient = context.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#1a1a3e');
        gradient.addColorStop(1, '#2d1b69');
        
        // Rounded corners
        const radius = 12;
        context.beginPath();
        context.moveTo(radius, 0);
        context.lineTo(size - radius, 0);
        context.arcTo(size, 0, size, radius, radius);
        context.lineTo(size, size - radius);
        context.arcTo(size, size, size - radius, size, radius);
        context.lineTo(radius, size);
        context.arcTo(0, size, 0, size - radius, radius);
        context.lineTo(0, radius);
        context.arcTo(0, 0, radius, 0, radius);
        context.closePath();
        context.fillStyle = gradient;
        context.fill();

        // Border glow effect
        context.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        context.lineWidth = 2;
        context.stroke();

        // Text
        context.font = 'bold 28px sans-serif';
        context.fillStyle = '#00ff88';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // Get initials (max 2)
        const initials = name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'C';

        context.fillText(initials, size / 2, size / 2 + 2);

        return canvas.toDataURL('image/png');
    }

    // Render Signature
    function renderSignature() {
        const data = {
            name: inputs.name.value.trim() || defaultData.name,
            title: inputs.title.value.trim() || defaultData.title,
            website: inputs.website.value.trim() || defaultData.website,
            phone: inputs.phone.value.trim(),
            twitter: inputs.twitter.value.trim().replace(/^@/, '')
        };

        const separator = (data.phone && data.twitter) ? ' • ' : '';
        const phoneHtml = data.phone ? `<span style="color: #666666;">${escapeHtml(data.phone)}</span>` : '';
        const twitterHtml = data.twitter ? `<span style="color: #666666;">@${escapeHtml(data.twitter)}</span>` : '';
        const contactLine = (phoneHtml || twitterHtml) ? `<div style="margin-top: 6px; font-size: 13px;">${phoneHtml}${separator}${twitterHtml}</div>` : '';

        const avatarUrl = generateAvatar(data.name);

        let websiteUrl = data.website;
        if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
            websiteUrl = 'https://' + websiteUrl;
        }

        const logoHtml = `
            <div style="margin-bottom: 12px;">
                <a href="${escapeHtml(websiteUrl)}" style="text-decoration: none; display: inline-block;">
                    <img src="${avatarUrl}" alt="Logo" width="32" height="32" style="border-radius: 6px; display: block;">
                </a>
            </div>
        `;

        const signatureHtml = `
            <div style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333;">
                ${logoHtml}
                <div style="font-weight: bold; font-size: 16px; color: #000;">${escapeHtml(data.name)}</div>
                <div style="color: #666666; font-size: 14px; margin-top: 2px;">${escapeHtml(data.title)}</div>
                ${contactLine}
            </div>
        `;

        previewContainer.innerHTML = signatureHtml;
    }

    // XSS prevention
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Copy Logic
    async function copyToClipboard() {
        if (!previewContainer.innerHTML) return;

        const btn = copyBtn;
        btn.classList.add('copied');

        try {
            const htmlContent = previewContainer.innerHTML;
            const textContent = previewContainer.innerText;

            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([htmlContent], { type: 'text/html' }),
                'text/plain': new Blob([textContent], { type: 'text/plain' })
            });

            await navigator.clipboard.write([clipboardItem]);

        } catch (err) {
            console.error('Failed to copy: ', err);
            const textarea = document.createElement('textarea');
            textarea.value = previewContainer.innerHTML;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        setTimeout(() => {
            btn.classList.remove('copied');
        }, 2000);
    }

    // Theme Toggle
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('signature-theme', currentTheme);
    }

    // Input Cleaning
    function clearInput(e) {
        const button = e.target;
        const input = button.previousElementSibling;
        if (input) {
            input.value = '';
            input.focus();
            renderSignature();
        }
    }

    // --- Event Listeners ---

    // Input changes
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', renderSignature);
        }
    });

    // Clear buttons
    clearButtons.forEach(btn => {
        btn.addEventListener('click', clearInput);
    });

    // Copy
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }

    // Theme
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Modal
    function openModal() {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }

    if (openModalBtn) {
        openModalBtn.addEventListener('click', openModal);
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
            closeModal();
        }
    });

    // Initial Render
    renderSignature();
});
