/**
 * LUXE MINIMAL - Premium Portfolio Script
 * Cinematic Scroll Effects & Interactions
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // Configuration
    // ═══════════════════════════════════════════════════════════════════════════
    const CONFIG = {
        THEME_KEY: 'luxe-theme',
        REVEAL_THRESHOLD: 0.15,
        SECTION_THRESHOLD: 0.5
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // DOM Ready
    // ═══════════════════════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initThemeToggle();
        initScrollProgress();
        initCinematicScroll();
        initSectionNav();
        initSkillBars();
        initTechSphere();
        initProjectCards();
        initContactForm(); // Contact form handler
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // 3D Tech Sphere
    // ═══════════════════════════════════════════════════════════════════════════
    function initTechSphere() {
        const container = document.getElementById('tech-sphere');
        if (!container) return;

        const tags = [
            'React', 'Node.js', 'Python', 'Go', 'AWS', 'Docker',
            'GraphQL', 'Next.js', 'TypeScript', 'PostgreSQL',
            'Figma', 'Kubernetes', 'Redis', 'MongoDB', 'Three.js'
        ];

        const radius = 150; // Increased radius for desktop will be handled by CSS scale if needed
        const totalTags = tags.length;

        // Fibonacci Sphere Algorithm for even distribution
        const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

        tags.forEach((tag, i) => {
            const y = 1 - (i / (totalTags - 1)) * 2; // y goes from 1 to -1
            const radiusAtY = Math.sqrt(1 - y * y); // radius at y

            const theta = phi * i; // golden angle increment

            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;

            // Create element
            const el = document.createElement('div');
            el.className = 'tech-tag';
            el.textContent = tag;

            // We use transform directly on the element to position it in 3D space
            // But we need it to face forward... actually, for a simple rotating sphere
            // having them rotate WITH the container is fine.
            // To make them always face front (billboard), we'd need more complex JS loop.
            // For now, let's just position them.

            // Convert to CSS translate3d
            // Scale * radius
            const scale = 1.2; // spacing factor

            el.style.transform = `translate3d(${x * radius * scale}px, ${y * radius * scale}px, ${z * radius * scale}px)`;

            container.appendChild(el);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Cinematic Scroll Engine (Rockstar-style)
    // ═══════════════════════════════════════════════════════════════════════════
    function initCinematicScroll() {
        const sections = Array.from(document.querySelectorAll('.section-sticky'));
        const scrollContents = sections.map(sec => sec.querySelector('.scroll-content'));

        let lastScrollY = window.scrollY;

        // Initial setup
        updateScrollEffects();

        // Main Loop
        function updateScrollEffects() {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            sections.forEach((section, index) => {
                const content = scrollContents[index];
                if (!content) return;

                const nextSection = sections[index + 1];

                // If there is a next section, we want to fade/scale this one
                // as the next one covers it.
                if (nextSection) {
                    const nextRect = nextSection.getBoundingClientRect();
                    const distance = nextRect.top; // Distance from top of viewport

                    // Logic:
                    // If next section is completely below viewport (distance > windowHeight), op = 1
                    // If next section is covering (distance < windowHeight), fade out

                    let progress = 0; // 0 = not covered, 1 = fully covered

                    if (distance <= windowHeight && distance >= 0) {
                        progress = 1 - (distance / windowHeight);
                    } else if (distance < 0) {
                        progress = 1;
                    }

                    // Apply effects with parallax
                    // Opacity: 1 -> 0.2 (don't fade completely to keep depth feel)
                    const opacity = Math.max(0, 1 - progress * 1.8);

                    // Scale: 1 -> 0.85
                    const scale = 1 - (progress * 0.15);

                    // Blur: 0 -> 20px
                    const blur = progress * 15;

                    // Parallax Y: Move slightly UP as it gets covered (-100px)
                    // This creates the feeling that the incoming slide is pushing it away faster
                    const translateY = -(progress * 100);

                    content.style.opacity = opacity;
                    content.style.transform = `translateY(${translateY}px) scale(${scale})`;
                    content.style.filter = `blur(${blur}px)`;
                } else {
                    // Last section doesn't get covered
                    content.style.opacity = 1;
                    content.style.transform = 'translateY(0) scale(1)';
                    content.style.filter = 'blur(0px)';
                }

                // Inner elements reveal logic
                const rect = section.getBoundingClientRect();
                // Trigger when element is near middle (60% down viewport)
                const triggerPoint = windowHeight * 0.6;

                if (rect.top <= triggerPoint && rect.bottom >= 0) {
                    section.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
                        el.classList.add('visible');
                    });
                }
            });

            lastScrollY = scrollY;
            requestAnimationFrame(updateScrollEffects);
        }

        // Also handle non-sticky sections (like contact)
        function handleNonStickySections() {
            const contactSection = document.getElementById('contact');
            if (!contactSection) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
                            el.classList.add('visible');
                        });
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(contactSection);
        }

        handleNonStickySections();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Typing Animation
    // ═══════════════════════════════════════════════════════════════════════════
    function initTypingAnimation() {
        const element = document.getElementById('typing-name');
        if (!element) return;

        const text = 'Pumudu Anuradha.';
        let index = 0;

        function type() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                const delay = text.charAt(index - 1) === ' ' ? 150 : 80 + Math.random() * 40;
                setTimeout(type, delay);
            }
        }

        setTimeout(type, 800);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Theme Management
    // ═══════════════════════════════════════════════════════════════════════════
    function initTheme() {
        const saved = localStorage.getItem(CONFIG.THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', theme);
        updateThemeColor(theme);
    }

    function initThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem(CONFIG.THEME_KEY, next);
            updateThemeColor(next);
        });
    }

    function updateThemeColor(theme) {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = theme === 'light' ? '#fafafa' : '#0a0a0a';
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Scroll Progress Indicator
    // ═══════════════════════════════════════════════════════════════════════════
    function initScrollProgress() {
        const progressBar = document.getElementById('scroll-progress');
        if (!progressBar) return;

        function updateProgress() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = `${Math.min(progress, 100)}%`;
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Section Navigation
    // ═══════════════════════════════════════════════════════════════════════════
    function initSectionNav() {
        const navItems = document.querySelectorAll('.section-nav-item');
        const sections = document.querySelectorAll('.section');

        if (!navItems.length || !sections.length) return;

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.getAttribute('data-section');
                const section = document.getElementById(sectionId);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    navItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-section') === sectionId) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }, {
            threshold: CONFIG.SECTION_THRESHOLD
        });

        sections.forEach(section => observer.observe(section));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Animated Skill Bars
    // ═══════════════════════════════════════════════════════════════════════════
    function initSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        if (!skillBars.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    const progress = getComputedStyle(entry.target).getPropertyValue('--progress');
                    entry.target.style.width = progress;
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });

        skillBars.forEach(bar => observer.observe(bar));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Project Cards Spotlight Effect
    // ═══════════════════════════════════════════════════════════════════════════
    function initProjectCards() {
        const cards = document.querySelectorAll('.project-card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // Smooth Scroll for Anchor Links
    // ═══════════════════════════════════════════════════════════════════════════
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // Contact Form Handler
    // ═══════════════════════════════════════════════════════════════════════════
    function initContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        const submitBtn = form.querySelector('.contact-submit-btn');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoading = submitBtn?.querySelector('.btn-loading');
        const statusDiv = document.getElementById('form-status');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form data
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            // Validate
            if (!name || !email || !message) {
                showStatus('Please fill in all fields.', 'error');
                return;
            }

            // Show loading state
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';
            submitBtn.disabled = true;
            statusDiv.className = 'form-status';
            statusDiv.style.display = 'none';

            try {
                // Get API URL from config or use default
                const apiUrl = window.API_CONFIG?.CONTACT_API_URL || 'https://mycontactform-raspy-lake-183d.pumudu820.workers.dev/';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, message })
                });

                if (response.ok) {
                    showStatus('Message sent successfully! I\'ll get back to you soon.', 'success');
                    form.reset();
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to send message');
                }
            } catch (error) {
                console.error('Contact form error:', error);
                showStatus('Failed to send message. Please try emailing me directly.', 'error');
            } finally {
                // Reset button state
                if (btnText) btnText.style.display = 'inline';
                if (btnLoading) btnLoading.style.display = 'none';
                submitBtn.disabled = false;
            }
        });

        function showStatus(message, type) {
            statusDiv.textContent = message;
            statusDiv.className = `form-status ${type}`;
            statusDiv.style.display = 'block';
        }
    }

})();

