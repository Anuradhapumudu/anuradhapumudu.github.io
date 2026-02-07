
import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";

// Configuration for themes
const themes = {
    dark: {
        colors: ["#f967fb", "#53bc28", "#6958d5"],
        lights: {
            intensity: 200,
            colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
        }
    },
    light: {
        colors: ["#3b82f6", "#8b5cf6", "#ec4899"], // Blue, Purple, Pink
        lights: {
            intensity: 150,
            colors: ["#60a5fa", "#a78bfa", "#f472b6", "#3b82f6"]
        }
    }
};

// Initialize Cursor
function initCursor() {
    const canvas = document.getElementById('tubes-canvas');
    if (!canvas) return;

    // Determine current theme
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const themeConfig = themes[currentTheme] || themes.dark;

    const cursorApp = TubesCursor(canvas, {
        tubes: {
            colors: themeConfig.colors,
            lights: themeConfig.lights
        }
    });

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                const newTheme = document.documentElement.getAttribute('data-theme');
                const newConfig = themes[newTheme] || themes.dark;

                // Update colors
                if (cursorApp && cursorApp.tubes) {
                    cursorApp.tubes.setColors(newConfig.colors);
                    cursorApp.tubes.setLightsColors(newConfig.lights.colors);
                }
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCursor);
} else {
    initCursor();
}
