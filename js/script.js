/**
 * Portfolio Main Script
 * Version 2.0 - Theme toggle, scroll reveal animations, and interactive features
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // Configuration
    // ═══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        PARTICLE_COUNT_MOBILE: 12,
        PARTICLE_COUNT_DESKTOP: 25,
        REVEAL_THRESHOLD: 0.15,
        THEME_STORAGE_KEY: 'portfolio-theme'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // Initialize on DOM Ready
    // ═══════════════════════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initThemeToggle();
        initParticles();
        initScrollReveal();
        setupContactForm();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // Theme Toggle
    // ═══════════════════════════════════════════════════════════════════════════
    function initTheme() {
        const savedTheme = localStorage.getItem(CONFIG.THEME_STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', theme);
        updateMetaThemeColor(theme);
    }

    function initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', toggleTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(CONFIG.THEME_STORAGE_KEY, newTheme);
        updateMetaThemeColor(newTheme);
    }

    function updateMetaThemeColor(theme) {
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme === 'light' ? '#f5f7fa' : '#0a0a1a';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Particle Effects
    // ═══════════════════════════════════════════════════════════════════════════
    function initParticles() {
        const particleContainer = document.getElementById('particles');
        if (!particleContainer) return;

        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? CONFIG.PARTICLE_COUNT_MOBILE : CONFIG.PARTICLE_COUNT_DESKTOP;

        // Clear any existing particles first
        particleContainer.innerHTML = '';

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 6 + 8}s`;
            particle.style.animationDelay = `${Math.random() * 6}s`;
            particle.style.opacity = `${Math.random() * 0.5 + 0.3}`;
            particleContainer.appendChild(particle);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Scroll Reveal Animations
    // ═══════════════════════════════════════════════════════════════════════════
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');

        if (!revealElements.length || !('IntersectionObserver' in window)) {
            // Fallback: show all elements if IntersectionObserver not supported
            revealElements.forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optionally unobserve after revealing
                    // observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: CONFIG.REVEAL_THRESHOLD,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(el => observer.observe(el));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Contact Form Handler
    // ═══════════════════════════════════════════════════════════════════════════
    function setupContactForm() {
        const contactForm = document.getElementById('contact-form');
        const submitButton = contactForm?.querySelector('button[type="submit"]');

        if (contactForm && submitButton) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await handleFormSubmission(contactForm, submitButton);
            });
        }
    }

    async function handleFormSubmission(form, submitButton) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name')?.trim(),
            email: formData.get('email')?.trim(),
            message: formData.get('message')?.trim()
        };

        // Client-side validation
        const validationResult = validateFormData(data);
        if (!validationResult.isValid) {
            showMessage(validationResult.message, 'error');
            return;
        }

        // Update UI for loading state
        setButtonState(submitButton, true);

        try {
            const response = await submitToAPI(data);

            if (response.success) {
                showMessage('✅ Message sent successfully!\n📧 I\'ll get back to you soon.', 'success');
                form.reset();
            } else {
                throw new Error(response.error || 'Unknown error occurred');
            }

        } catch (error) {
            handleError(error);
        } finally {
            setButtonState(submitButton, false);
        }
    }

    async function submitToAPI(data) {
        // Check if API config exists
        if (typeof API_CONFIG === 'undefined' || !API_CONFIG.CONTACT_API_URL) {
            // Fallback: mailto link
            const mailtoLink = `mailto:hello@pumudu.online?subject=Contact from ${encodeURIComponent(data.name)}&body=${encodeURIComponent(data.message + '\n\nFrom: ' + data.email)}`;
            window.location.href = mailtoLink;
            return { success: true };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT || 10000);

        try {
            const response = await fetch(API_CONFIG.CONTACT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(`Rate limit exceeded. Try again in ${result.retryAfter || 60} seconds.`);
                }
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            return result;

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }
            throw error;
        }
    }

    function validateFormData(data) {
        if (!data.name || data.name.length < 2) {
            return { isValid: false, message: '❌ Name must be at least 2 characters.' };
        }
        if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            return { isValid: false, message: '❌ Please enter a valid email.' };
        }
        if (!data.message || data.message.length < 10) {
            return { isValid: false, message: '❌ Message must be at least 10 characters.' };
        }
        if (data.message.length > 1000) {
            return { isValid: false, message: '❌ Message too long (max 1000 characters).' };
        }
        return { isValid: true };
    }

    function handleError(error) {
        let message = '❌ Failed to send message.\n';

        if (error.message.includes('Rate limit')) {
            message += error.message;
        } else if (error.message.includes('timeout')) {
            message += 'Request timed out. Check connection.';
        } else if (error.message.includes('Failed to fetch')) {
            message += 'Network error. Check internet.';
        } else {
            message += 'Please try again later.';
        }

        showMessage(message, 'error');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Terminal Messages
    // ═══════════════════════════════════════════════════════════════════════════
    function showMessage(message, type = 'info') {
        // Remove any existing message
        const existing = document.getElementById('terminal-message');
        if (existing) existing.remove();

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.id = 'terminal-message';
        messageDiv.className = `command-output mt-4 mb-4 glass-section rounded-xl p-4 border-2 ${getMessageClasses(type)}`;

        // Format message with terminal styling
        const formattedMessage = message.split('\n').map(line =>
            `<div class="mb-1">${escapeHtml(line)}</div>`
        ).join('');

        messageDiv.innerHTML = `
            <div class="prompt-line mb-2">
                <span class="terminal-prompt-full">
                    <span class="terminal-blue glow-text font-semibold">system@contact</span>
                    <span style="color: var(--text-primary)">:</span>
                    <span class="terminal-yellow glow-text">~</span>
                    <span style="color: var(--text-primary)">$ </span>
                </span>
                <span class="terminal-prompt-mobile terminal-yellow glow-text">$ </span>
                <span class="terminal-purple">${type}</span>
            </div>
            <div class="terminal-output">${formattedMessage}</div>
        `;

        // Insert after the contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.parentNode.insertBefore(messageDiv, contactForm.nextSibling);
        }

        // Auto-remove success messages after 10 seconds
        if (type === 'success') {
            setTimeout(() => messageDiv?.remove(), 10000);
        }
    }

    function getMessageClasses(type) {
        const classes = {
            success: 'border-green-500/50 bg-green-500/10',
            error: 'border-red-500/50 bg-red-500/10',
            warning: 'border-yellow-500/50 bg-yellow-500/10'
        };
        return classes[type] || 'border-blue-500/50 bg-blue-500/10';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Utility Functions
    // ═══════════════════════════════════════════════════════════════════════════
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function setButtonState(button, loading) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<span class="inline-block animate-spin mr-2">⚡</span>SENDING...';
            button.classList.add('opacity-75');
        } else {
            button.disabled = false;
            button.innerHTML = 'SEND_MESSAGE';
            button.classList.remove('opacity-75');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Section Navigation (exposed globally)
    // ═══════════════════════════════════════════════════════════════════════════
    window.showSection = function (sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.add('section-hidden');
        });

        // Show the target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('section-hidden');

            // Re-trigger fade-in animation
            targetSection.classList.remove('fade-in');
            void targetSection.offsetWidth; // Force reflow
            targetSection.classList.add('fade-in');

            // Scroll to section
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }

        // Ensure body scrolling works
        document.body.style.overflow = 'auto';
    };

})();