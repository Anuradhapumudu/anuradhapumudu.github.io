
// Configuration
const CONFIG = {
    starCount: 300,
    zGap: 500,
    camSpeed: 2.0,
    baseSpeed: 0.5
};

// State
const state = {
    velocity: 0,
    scroll: 0,
    time: 0
};

// DOM Elements
const starField = document.getElementById('star-field');
const stars = [];

// Init Lenis
let lenis;
if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
        smooth: true,
        lerp: 0.08,
        wheelMultiplier: 1.2
    });

    lenis.on('scroll', ({ scroll, velocity }) => {
        state.velocity = velocity;
        state.scroll = scroll;

        // Update HUD
        updateHUD();
    });
} else {
    console.warn('Lenis not loaded');
}

// Update HUD
const fpsEl = document.getElementById('fps');
const velEl = document.getElementById('vel-readout');
const coordEl = document.getElementById('coord');

let lastTime = 0;

function updateHUD() {
    if (velEl) velEl.innerText = Math.abs(state.velocity).toFixed(2);
    if (coordEl) coordEl.innerText = state.scroll.toFixed(0);
}

// Init Stars
function initStars() {
    if (!starField) return;

    // Clear existing
    starField.innerHTML = '';
    stars.length = 0;

    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < CONFIG.starCount; i++) {
        const el = document.createElement('div');
        el.className = 'star';
        starField.appendChild(el);

        stars.push({
            el,
            x: (Math.random() - 0.5) * width * 2,
            y: (Math.random() - 0.5) * height * 2,
            z: Math.random() * 2000,
            speed: 1 + Math.random()
        });
    }
}

// Main Animation Loop
function animate(time) {
    if (lenis) lenis.raf(time);

    // FPS Calculation
    const delta = time - lastTime;
    if (time % 10 < 1 && delta > 0 && fpsEl) {
        fpsEl.innerText = Math.round(1000 / delta);
    }
    lastTime = time;

    // Star Animation
    if (stars.length > 0) {
        // Warp Speed Logic
        // Velocity increases the apparent speed of stars
        const warpSpeed = Math.abs(state.velocity) * 0.5;
        const totalSpeed = CONFIG.baseSpeed + warpSpeed;

        // Warp stretch effect
        const stretch = Math.max(1, Math.min(1 + warpSpeed * 0.5, 20));

        stars.forEach(star => {
            // Move star towards camera (decreasing Z)
            star.z -= totalSpeed * star.speed * 10;

            // Reset if behind camera
            if (star.z < 1) {
                star.z = 2000;
                star.x = (Math.random() - 0.5) * window.innerWidth * 2;
                star.y = (Math.random() - 0.5) * window.innerHeight * 2;
            }

            // Project 3D to 2D
            // Simple perspective projection
            const k = 500 / star.z;
            const px = star.x * k;
            const py = star.y * k;

            // Wait, standard CSS perspective is easier if we just translateZ
            // But manually calculating projection gives us more control over the "warp" feel

            // Let's use CSS transform translate3d for performance
            // We need to center 0,0
            const centerOffset = `translate(${window.innerWidth / 2}px, ${window.innerHeight / 2}px)`;

            // Determine opacity based on Z (fade in from back)
            const alpha = Math.min(1, (2000 - star.z) / 1000);

            star.el.style.opacity = alpha;
            star.el.style.transform = `
                translate3d(${window.innerWidth / 2 + px}px, ${window.innerHeight / 2 + py}px, 0)
                scale3d(${k}, ${k}, 1)
                scale3d(1, 1, ${stretch})
            `;

            // Color sync with theme if needed
            // Currently white, which works for space theme
        });
    }

    requestAnimationFrame(animate);
}

// Initialization
window.addEventListener('resize', initStars);
initStars();
requestAnimationFrame(animate);
