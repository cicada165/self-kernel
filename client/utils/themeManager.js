/**
 * Theme Manager
 * Handles dark/light theme switching with persistence
 */

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'self-kernel-theme';
    this.THEME_DARK = 'dark';
    this.THEME_LIGHT = 'light';
    this.currentTheme = this.loadTheme();
    this.listeners = [];
  }

  /**
   * Initialize theme from localStorage or default to dark
   */
  loadTheme() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved || this.THEME_DARK;
  }

  /**
   * Save theme preference to localStorage
   */
  saveTheme(theme) {
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    this.saveTheme(theme);
    this.notifyListeners(theme);
  }

  /**
   * Toggle between dark and light themes
   */
  toggle() {
    const newTheme = this.currentTheme === this.THEME_DARK ? this.THEME_LIGHT : this.THEME_DARK;
    this.applyTheme(newTheme);
    return newTheme;
  }

  /**
   * Get current theme
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Check if dark mode is active
   */
  isDark() {
    return this.currentTheme === this.THEME_DARK;
  }

  /**
   * Set specific theme
   */
  setTheme(theme) {
    if (theme === this.THEME_DARK || theme === this.THEME_LIGHT) {
      this.applyTheme(theme);
    }
  }

  /**
   * Add listener for theme changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * Notify all listeners of theme change
   */
  notifyListeners(theme) {
    this.listeners.forEach(listener => listener(theme));
  }

  /**
   * Initialize theme on page load
   */
  init() {
    this.applyTheme(this.currentTheme);

    // Listen for system theme changes (optional enhancement)
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if no user preference is saved
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.applyTheme(e.matches ? this.THEME_DARK : this.THEME_LIGHT);
        }
      });
    }
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();
