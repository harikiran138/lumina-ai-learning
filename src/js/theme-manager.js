/**
 * LUMINA THEME MANAGER
 * Handles theme switching between Education and Productivity modes
 * Also manages dark/light mode
 */

class ThemeManager {
    constructor() {
        this.THEMES = {
            EDUCATION: 'education',
            PRODUCTIVITY: 'productivity'
        };

        this.MODES = {
            LIGHT: 'light',
            DARK: 'dark'
        };

        this.STORAGE_KEYS = {
            THEME: 'lumina_theme',
            MODE: 'lumina_color_mode'
        };

        this.currentTheme = this.THEMES.EDUCATION;
        this.currentMode = this.MODES.LIGHT;

        this.init();
    }

    /**
     * Initialize theme system
     */
    init() {
        // Load saved preferences or use defaults
        this.loadPreferences();

        // Apply initial theme
        this.applyTheme();
        this.applyMode();

        // Listen for system theme changes
        this.watchSystemTheme();

        // Dispatch init event
        this.dispatchEvent('theme-init', {
            theme: this.currentTheme,
            mode: this.currentMode
        });
    }

    /**
     * Load theme preferences from localStorage
     */
    loadPreferences() {
        // Load theme (education/productivity)
        const savedTheme = localStorage.getItem(this.STORAGE_KEYS.THEME);
        if (savedTheme && Object.values(this.THEMES).includes(savedTheme)) {
            this.currentTheme = savedTheme;
        }

        // Load color mode (light/dark)
        const savedMode = localStorage.getItem(this.STORAGE_KEYS.MODE);
        if (savedMode && Object.values(this.MODES).includes(savedMode)) {
            this.currentMode = savedMode;
        } else {
            // Check system preference
            this.currentMode = this.getSystemTheme();
        }
    }

    /**
     * Get system theme preference
     */
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? this.MODES.DARK
            : this.MODES.LIGHT;
    }

    /**
     * Watch for system theme changes
     */
    watchSystemTheme() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't set a manual preference
            if (!localStorage.getItem(this.STORAGE_KEYS.MODE)) {
                this.setMode(e.matches ? this.MODES.DARK : this.MODES.LIGHT, false);
            }
        });
    }

    /**
     * Set theme (education/productivity)
     * @param {string} theme - Theme name
     * @param {boolean} save - Whether to save to localStorage
     */
    setTheme(theme, save = true) {
        if (!Object.values(this.THEMES).includes(theme)) {
            console.error(`Invalid theme: ${theme}`);
            return;
        }

        this.currentTheme = theme;
        this.applyTheme();

        if (save) {
            localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
        }

        this.dispatchEvent('theme-change', { theme });
    }

    /**
     * Set color mode (light/dark)
     * @param {string} mode - Color mode
     * @param {boolean} save - Whether to save to localStorage
     */
    setMode(mode, save = true) {
        if (!Object.values(this.MODES).includes(mode)) {
            console.error(`Invalid mode: ${mode}`);
            return;
        }

        this.currentMode = mode;
        this.applyMode();

        if (save) {
            localStorage.setItem(this.STORAGE_KEYS.MODE, mode);
        }

        this.dispatchEvent('mode-change', { mode });
    }

    /**
     * Toggle between light and dark mode
     */
    toggleMode() {
        const newMode = this.currentMode === this.MODES.DARK
            ? this.MODES.LIGHT
            : this.MODES.DARK;
        this.setMode(newMode);
    }

    /**
     * Toggle between education and productivity themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === this.THEMES.EDUCATION
            ? this.THEMES.PRODUCTIVITY
            : this.THEMES.EDUCATION;
        this.setTheme(newTheme);
    }

    /**
     * Apply current theme to document
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor();
    }

    /**
     * Apply current color mode to document
     */
    applyMode() {
        if (this.currentMode === this.MODES.DARK) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Update meta theme-color
        this.updateMetaThemeColor();
    }

    /**
     * Update meta theme-color for mobile browser chrome
     */
    updateMetaThemeColor() {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        // Set color based on current theme and mode
        let color;
        if (this.currentMode === this.MODES.DARK) {
            color = '#000000';
        } else {
            color = this.currentTheme === this.THEMES.EDUCATION
                ? '#f59e0b' // Amber
                : '#3b82f6'; // Blue
        }

        metaThemeColor.content = color;
    }

    /**
     * Get current theme
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Get current mode
     */
    getMode() {
        return this.currentMode;
    }

    /**
     * Check if current theme is education
     */
    isEducationTheme() {
        return this.currentTheme === this.THEMES.EDUCATION;
    }

    /**
     * Check if current theme is productivity
     */
    isProductivityTheme() {
        return this.currentTheme === this.THEMES.PRODUCTIVITY;
    }

    /**
     * Check if dark mode is active
     */
    isDarkMode() {
        return this.currentMode === this.MODES.DARK;
    }

    /**
     * Get theme colors for current theme
     */
    getThemeColors() {
        const isEducation = this.isEducationTheme();
        return {
            primary: isEducation ? '#f59e0b' : '#3b82f6',
            primaryLight: isEducation ? '#fbbf24' : '#60a5fa',
            primaryDark: isEducation ? '#d97706' : '#2563eb',
            secondary: isEducation ? '#fb923c' : '#06b6d4',
            accent: isEducation ? '#fdba74' : '#8b5cf6'
        };
    }

    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    /**
     * Create theme toggle button
     * @param {HTMLElement} container - Container element
     * @returns {HTMLElement} Toggle button
     */
    createModeToggle(container) {
        const button = document.createElement('button');
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle dark mode');
        button.innerHTML = `
      <svg class="theme-icon theme-icon-light" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      <svg class="theme-icon theme-icon-dark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    `;

        button.addEventListener('click', () => this.toggleMode());

        if (container) {
            container.appendChild(button);
        }

        return button;
    }

    /**
     * Create theme switcher (Education/Productivity)
     * @param {HTMLElement} container - Container element
     * @returns {HTMLElement} Switcher element
     */
    createThemeSwitcher(container) {
        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
      <button class="theme-option ${this.isEducationTheme() ? 'active' : ''}" data-theme="education">
        <span class="theme-icon">📚</span>
        <span class="theme-label">Education</span>
      </button>
      <button class="theme-option ${this.isProductivityTheme() ? 'active' : ''}" data-theme="productivity">
        <span class="theme-icon">🚀</span>
        <span class="theme-label">Productivity</span>
      </button>
    `;

        switcher.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.setTheme(theme);

                // Update active state
                switcher.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        if (container) {
            container.appendChild(switcher);
        }

        return switcher;
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}

// Expose globally
window.ThemeManager = ThemeManager;
window.themeManager = themeManager;

// Add CSS for theme toggle icons
const style = document.createElement('style');
style.textContent = `
  .theme-toggle-btn {
    position: relative;
    width: 40px;
    height: 40px;
    border: none;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border-radius: var(--border-radius-full);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-base) var(--ease-out);
    color: var(--text-primary);
  }
  
  .theme-toggle-btn:hover {
    background: var(--bg-card);
    transform: scale(1.05);
  }
  
  .theme-icon {
    position: absolute;
    transition: all var(--transition-base) var(--ease-out);
  }
  
  html:not(.dark) .theme-icon-dark,
  html.dark .theme-icon-light {
    opacity: 0;
    transform: rotate(180deg) scale(0);
  }
  
  html:not(.dark) .theme-icon-light,
  html.dark .theme-icon-dark {
    opacity: 1;
    transform: rotate(0) scale(1);
  }
  
  .theme-switcher {
    display: flex;
    gap: var(--space-sm);
    padding: var(--space-xs);
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--glass-border);
  }
  
  .theme-option {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border: none;
    background: transparent;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: all var(--transition-fast) var(--ease-out);
    color: var(--text-secondary);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
  }
  
  .theme-option:hover {
    background: var(--bg-card);
    color: var(--text-primary);
  }
  
  .theme-option.active {
    background: var(--primary);
    color: white;
    box-shadow: var(--shadow-primary);
  }
  
  .theme-icon {
    font-size: 18px;
  }
`;
document.head.appendChild(style);

console.log('🎨 Lumina Theme Manager initialized');
