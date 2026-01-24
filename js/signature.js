/**
 * Email Signature Generator v2.0
 * Features: AI-generated avatars via Pollinations.ai, live preview, clipboard copy
 * Compatible with GitHub Pages (static hosting)
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // Configuration
    // ═══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        AI_IMAGE_SIZE: 96,
        AI_IMAGE_TIMEOUT: 15000, // 15 seconds timeout
        DEBOUNCE_DELAY: 300,
        CACHE_PREFIX: 'sig_avatar_'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM Elements
    // ═══════════════════════════════════════════════════════════════════════════
    const elements = {
        form: document.getElementById('signature-form'),
        inputs: {
            name: document.getElementById('name'),
            title: document.getElementById('title'),
            website: document.getElementById('website'),
            phone: document.getElementById('phone'),
            twitter: document.getElementById('twitter')
        },
        previewContainer: document.getElementById('signature-preview'),
        loadingOverlay: document.getElementById('loading-overlay'),
        copyBtn: document.getElementById('copy-btn'),
        themeToggle: document.getElementById('theme-toggle'),
        modal: document.getElementById('import-modal'),
        openModalBtn: document.getElementById('how-to-import-btn'),
        closeModalBtn: document.querySelector('.modal-close'),
        modalOverlay: document.querySelector('.modal-overlay'),
        clearButtons: document.querySelectorAll('.clear-btn')
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════════════════════════
    let currentTheme = localStorage.getItem('signature-theme') || 'dark';
    let currentAvatarUrl = null;
    let avatarGenerationPending = false;
    let lastAvatarKey = null;

    // ═══════════════════════════════════════════════════════════════════════════
    // Initialize
    // ═══════════════════════════════════════════════════════════════════════════
    document.documentElement.setAttribute('data-theme', currentTheme);
    init();

    function init() {
        setupEventListeners();
        renderSignature();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Event Listeners
    // ═══════════════════════════════════════════════════════════════════════════
    function setupEventListeners() {
        // Input changes - live preview with debounce
        Object.values(elements.inputs).forEach(input => {
            if (input) {
                input.addEventListener('input', debounce(handleInputChange, CONFIG.DEBOUNCE_DELAY));
            }
        });

        // Clear buttons
        elements.clearButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const input = this.parentElement.querySelector('input');
                if (input) {
                    input.value = '';
                    input.focus();
                    handleInputChange();
                }
            });
        });

        // Copy button
        if (elements.copyBtn) {
            elements.copyBtn.addEventListener('click', copySignature);
        }

        // Theme toggle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }

        // Modal controls
        if (elements.openModalBtn) {
            elements.openModalBtn.addEventListener('click', openModal);
        }
        if (elements.closeModalBtn) {
            elements.closeModalBtn.addEventListener('click', closeModal);
        }
        if (elements.modalOverlay) {
            elements.modalOverlay.addEventListener('click', closeModal);
        }

        // Escape key closes modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.modal?.getAttribute('aria-hidden') === 'false') {
                closeModal();
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Input Handler
    // ═══════════════════════════════════════════════════════════════════════════
    function handleInputChange() {
        const name = elements.inputs.name.value.trim();
        const title = elements.inputs.title.value.trim();

        // Check if we need to regenerate avatar
        const avatarKey = `${name}_${title}`;
        const needsNewAvatar = avatarKey !== lastAvatarKey && (name || title);

        if (needsNewAvatar && name.length > 1) {
            lastAvatarKey = avatarKey;
            generateAIAvatar(name, title);
        } else {
            renderSignature();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AI Avatar Generation using Pollinations.ai
    // ═══════════════════════════════════════════════════════════════════════════
    async function generateAIAvatar(name, title) {
        if (avatarGenerationPending) return;

        // Check cache first
        const cacheKey = CONFIG.CACHE_PREFIX + btoa(encodeURIComponent(`${name}_${title}`)).slice(0, 32);
        const cachedUrl = sessionStorage.getItem(cacheKey);

        if (cachedUrl) {
            currentAvatarUrl = cachedUrl;
            renderSignature();
            return;
        }

        avatarGenerationPending = true;
        showLoading(true);

        try {
            // Build a descriptive prompt for avatar generation
            const jobTitle = title || 'professional';
            const prompt = buildAvatarPrompt(name, jobTitle);

            // Pollinations.ai URL - generates image on-the-fly
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${CONFIG.AI_IMAGE_SIZE}&height=${CONFIG.AI_IMAGE_SIZE}&nologo=true&seed=${hashCode(name + title)}`;

            // Pre-load the image to verify it works
            const loaded = await preloadImage(imageUrl);

            if (loaded) {
                currentAvatarUrl = imageUrl;
                sessionStorage.setItem(cacheKey, imageUrl);
            } else {
                throw new Error('Image failed to load');
            }
        } catch (error) {
            console.warn('AI avatar generation failed, using fallback:', error);
            currentAvatarUrl = null;
        } finally {
            avatarGenerationPending = false;
            showLoading(false);
            renderSignature();
        }
    }

    function buildAvatarPrompt(name, title) {
        // Create a professional avatar prompt based on the job title
        const keywords = extractKeywords(title.toLowerCase());

        let style = 'corporate professional';
        let setting = 'office';
        let colors = 'blue and gray';

        // Customize based on job type
        if (keywords.includes('designer') || keywords.includes('creative') || keywords.includes('artist')) {
            style = 'creative artistic';
            setting = 'creative studio';
            colors = 'vibrant colorful';
        } else if (keywords.includes('developer') || keywords.includes('engineer') || keywords.includes('tech')) {
            style = 'tech professional';
            setting = 'modern tech office';
            colors = 'cool blue tones';
        } else if (keywords.includes('marketing') || keywords.includes('sales') || keywords.includes('manager')) {
            style = 'business executive';
            setting = 'corporate environment';
            colors = 'warm professional tones';
        } else if (keywords.includes('doctor') || keywords.includes('medical') || keywords.includes('health')) {
            style = 'medical professional';
            setting = 'clinical setting';
            colors = 'clean white and blue';
        }

        return `Professional minimalist avatar portrait icon, ${style}, friendly approachable expression, solid gradient background, ${colors}, high quality digital art, clean simple style, suitable for email signature`;
    }

    function extractKeywords(text) {
        return text.split(/[\s,.-]+/).filter(word => word.length > 2);
    }

    function preloadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            const timeout = setTimeout(() => {
                resolve(false);
            }, CONFIG.AI_IMAGE_TIMEOUT);

            img.onload = () => {
                clearTimeout(timeout);
                resolve(true);
            };
            img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };
            img.src = url;
        });
    }

    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Fallback Logo Generation (Canvas-based initials)
    // ═══════════════════════════════════════════════════════════════════════════
    function generateFallbackLogo(name) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = CONFIG.AI_IMAGE_SIZE;
            canvas.width = size;
            canvas.height = size;

            // Get initials
            const words = name.trim().split(/\s+/).filter(w => w.length > 0);
            let initials = '';
            if (words.length > 0) {
                initials = words.map(word => word[0]).slice(0, 2).join('').toUpperCase();
            }
            if (!initials) initials = '?';

            // Gradient background
            const gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, '#00ddff');
            gradient.addColorStop(1, '#00ff88');
            ctx.fillStyle = gradient;

            // Rounded rectangle
            const radius = size * 0.2;
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(size - radius, 0);
            ctx.quadraticCurveTo(size, 0, size, radius);
            ctx.lineTo(size, size - radius);
            ctx.quadraticCurveTo(size, size, size - radius, size);
            ctx.lineTo(radius, size);
            ctx.quadraticCurveTo(0, size, 0, size - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.fill();

            // Text
            ctx.font = `bold ${size * 0.4}px "Inter", "Helvetica", sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, size / 2, size / 2);

            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Fallback logo generation failed:', error);
            return createSVGFallback(name);
        }
    }

    function createSVGFallback(name) {
        const words = name.trim().split(/\s+/).filter(w => w.length > 0);
        const initials = words.length > 0
            ? words.map(word => word[0]).slice(0, 2).join('').toUpperCase()
            : '?';

        const svg = `
            <svg width="96" height="96" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#00ddff"/>
                        <stop offset="100%" style="stop-color:#00ff88"/>
                    </linearGradient>
                </defs>
                <rect width="96" height="96" rx="20" fill="url(#grad)"/>
                <text x="48" y="48" font-family="Inter, Helvetica, Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${escapeHtml(initials)}</text>
            </svg>
        `.trim();

        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Render Signature
    // ═══════════════════════════════════════════════════════════════════════════
    function renderSignature() {
        const data = {
            name: elements.inputs.name.value.trim() || 'Your Name',
            title: elements.inputs.title.value.trim() || 'Your Title',
            website: elements.inputs.website.value.trim(),
            phone: elements.inputs.phone.value.trim(),
            twitter: elements.inputs.twitter.value.trim().replace(/^@/, '')
        };

        // Get avatar (AI or fallback)
        const avatarUrl = currentAvatarUrl || generateFallbackLogo(data.name);

        // Process website URL
        let websiteUrl = data.website;
        if (websiteUrl && !/^https?:\/\//i.test(websiteUrl)) {
            websiteUrl = 'https://' + websiteUrl;
        }

        // Build contact line with bullet separator
        const contactParts = [];
        if (data.phone) {
            contactParts.push(`<a href="tel:${escapeHtml(data.phone.replace(/\s/g, ''))}" style="color: #666666; text-decoration: none;">${escapeHtml(data.phone)}</a>`);
        }
        if (data.twitter) {
            contactParts.push(`<a href="https://twitter.com/${escapeHtml(data.twitter)}" style="color: #666666; text-decoration: none;">@${escapeHtml(data.twitter)}</a>`);
        }
        const contactLine = contactParts.length > 0
            ? `<div style="margin-top: 8px; font-size: 13px; color: #666666;">${contactParts.join(' <span style="color: #999999;">•</span> ')}</div>`
            : '';

        // Website link for logo
        const logoHtml = websiteUrl
            ? `<a href="${escapeHtml(websiteUrl)}" target="_blank" style="text-decoration: none; display: inline-block;"><img src="${avatarUrl}" alt="${escapeHtml(data.name)}" width="64" height="64" style="border-radius: 12px; display: block; border: none;"></a>`
            : `<img src="${avatarUrl}" alt="${escapeHtml(data.name)}" width="64" height="64" style="border-radius: 12px; display: block; border: none;">`;

        // Website display link
        const websiteHtml = websiteUrl
            ? `<div style="margin-top: 8px;"><a href="${escapeHtml(websiteUrl)}" target="_blank" style="color: #0066cc; text-decoration: none; font-size: 13px;">${escapeHtml(data.website.replace(/^https?:\/\//, ''))}</a></div>`
            : '';

        // Complete signature HTML
        const signatureHtml = `
            <table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #333333;">
                <tr>
                    <td style="padding-right: 16px; vertical-align: top;">
                        ${logoHtml}
                    </td>
                    <td style="vertical-align: top;">
                        <div style="font-weight: 600; font-size: 16px; color: #000000; margin-bottom: 2px;">${escapeHtml(data.name)}</div>
                        <div style="color: #666666; font-size: 14px;">${escapeHtml(data.title)}</div>
                        ${websiteHtml}
                        ${contactLine}
                    </td>
                </tr>
            </table>
        `;

        elements.previewContainer.innerHTML = signatureHtml;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Copy Signature to Clipboard
    // ═══════════════════════════════════════════════════════════════════════════
    async function copySignature() {
        if (!elements.previewContainer.innerHTML) return;

        const btn = elements.copyBtn;
        btn.classList.add('copied');

        try {
            let htmlContent = elements.previewContainer.innerHTML;

            // Create a temp container for processing
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Process images for email client compatibility
            const images = tempDiv.querySelectorAll('img');
            images.forEach(img => {
                img.style.display = 'block';
                img.style.border = 'none';
                img.style.outline = 'none';
                img.setAttribute('border', '0');
            });

            htmlContent = tempDiv.innerHTML;
            const textContent = tempDiv.innerText || tempDiv.textContent || '';

            // Try modern clipboard API with HTML
            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                    const textBlob = new Blob([textContent], { type: 'text/plain' });

                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'text/html': htmlBlob,
                            'text/plain': textBlob
                        })
                    ]);
                } catch (clipErr) {
                    // Fallback to execCommand
                    copyUsingExecCommand(tempDiv);
                }
            } else {
                copyUsingExecCommand(tempDiv);
            }
        } catch (err) {
            console.error('Copy failed:', err);
            // Final fallback
            try {
                await navigator.clipboard.writeText(elements.previewContainer.innerText);
            } catch (fallbackErr) {
                console.error('All copy methods failed');
            }
        }

        setTimeout(() => {
            btn.classList.remove('copied');
        }, 2000);
    }

    function copyUsingExecCommand(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        selection.removeAllRanges();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Theme Toggle
    // ═══════════════════════════════════════════════════════════════════════════
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('signature-theme', currentTheme);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Modal Controls
    // ═══════════════════════════════════════════════════════════════════════════
    function openModal() {
        elements.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        elements.closeModalBtn?.focus();
    }

    function closeModal() {
        elements.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        elements.openModalBtn?.focus();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Loading State
    // ═══════════════════════════════════════════════════════════════════════════
    function showLoading(show) {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.toggle('active', show);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Utility Functions
    // ═══════════════════════════════════════════════════════════════════════════
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
})();
