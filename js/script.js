// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    setupContactForm();
    setupNavigation();
});

/**
 * Initialize floating particle effects
 */
function initParticles() {
    const particleContainer = document.getElementById('particles');
    if (!particleContainer) return;
    
    // Adjust particle count based on screen size
    const particleCount = window.innerWidth < 768 ? 15 : 30;
    
    // Create particles with random positions and animations
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.width = `${Math.random() * 3 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.animationDuration = `${Math.random() * 10 + 5}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particleContainer.appendChild(particle);
    }
}

/**
 * Setup contact form with validation and submission
 */
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

/**
 * Handle form submission process
 */
async function handleFormSubmission(form, submitButton) {
    const formData = new FormData(form);
    const data = {
        name: formData.get('name')?.trim(),
        email: formData.get('email')?.trim(),
        message: formData.get('message')?.trim()
    };

    // Validate before submission
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

/**
 * Submit data to API endpoint
 */
async function submitToAPI(data) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);
    
    try {
        const response = await fetch(API_CONFIG.CONTACT_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const result = await response.json();
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error(`Rate limit exceeded. Try again in ${result.retryAfter || 60} seconds.`);
            }
            throw new Error(result.error || `Server responded with ${response.status}`);
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

/**
 * Validate form data client-side
 */
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

/**
 * Handle and display errors
 */
function handleError(error) {
    let message = '❌ Failed to send message.\n';
    
    if (error.message.includes('Rate limit')) {
        message += error.message;
    } else if (error.message.includes('timeout')) {
        message += 'Request timed out. Please check your connection.';
    } else if (error.message.includes('Failed to fetch')) {
        message += 'Network error. Please check your internet connection.';
    } else if (error.message.includes('Server responded')) {
        message += 'Server error: ' + error.message;
    } else {
        message += 'Please try again later.';
    }
    
    showMessage(message, 'error');
}

/**
 * Display terminal-style messages
 */
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existing = document.getElementById('terminal-message');
    if (existing) existing.remove();
    
    // Create new message element
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
                <span class="text-white">:</span>
                <span class="terminal-yellow glow-text">~</span>
                <span class="text-white">$ </span>
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
    
    // Auto-remove success messages
    if (type === 'success') {
        setTimeout(() => messageDiv?.remove(), 10000);
    }
}

/**
 * Get CSS classes for message types
 */
function getMessageClasses(type) {
    const classes = {
        success: 'border-green-500/50 bg-green-500/10 text-green-300',
        error: 'border-red-500/50 bg-red-500/10 text-red-300',
        warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300'
    };
    return classes[type] || 'border-blue-500/50 bg-blue-500/10 text-blue-300';
}

/**
 * Prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Toggle button loading state
 */
function setButtonState(button, loading) {
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<span class="inline-block animate-spin mr-2">⚡</span>SENDING...';
        button.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        button.innerHTML = 'SEND_MESSAGE';
        button.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

/**
 * Setup section navigation
 */
function setupNavigation() {
    // Handle navigation link clicks
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
}

/**
 * Show/hide content sections
 */
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('section-hidden');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('section-hidden');
        
        // Trigger animation
        targetSection.classList.remove('fade-in');
        void targetSection.offsetWidth; // Force reflow
        targetSection.classList.add('fade-in');
        
        // Smooth scroll
        setTimeout(() => {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
    
    // Reset body scrolling
    document.body.style.overflow = 'auto';
}

