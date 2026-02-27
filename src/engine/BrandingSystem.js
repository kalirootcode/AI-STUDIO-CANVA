/**
 * BrandingSystem.js — Visual Branding Manager
 * 
 * Centralized control for logo, colors, fonts, and brand
 * identity across all generated images.
 */

class BrandingSystem {
    constructor() {
        this.themes = {};
        this.activeTheme = 'cyber';
    }

    /**
     * Register a theme.
     */
    registerTheme(name, theme) {
        this.themes[name] = theme;
    }

    /**
     * Get the active theme config.
     */
    getTheme(name) {
        return this.themes[name || this.activeTheme] || this.themes['cyber'];
    }

    /**
     * Set the active theme.
     */
    setTheme(name) {
        if (this.themes[name]) {
            this.activeTheme = name;
        }
    }

    /**
     * Apply theme colors/fonts to a scene graph.
     * Replaces theme tokens like "var(--primary)" with actual colors.
     */
    applyTheme(sceneGraph, themeName) {
        const theme = this.getTheme(themeName || sceneGraph.theme);
        if (!theme) return sceneGraph;

        const json = JSON.stringify(sceneGraph);
        const resolved = json
            .replace(/var\(--primary\)/g, theme.colors.primary)
            .replace(/var\(--accent\)/g, theme.colors.accent)
            .replace(/var\(--warning\)/g, theme.colors.warning)
            .replace(/var\(--success\)/g, theme.colors.success)
            .replace(/var\(--danger\)/g, theme.colors.danger)
            .replace(/var\(--bg\)/g, theme.colors.bg)
            .replace(/var\(--text\)/g, theme.colors.text)
            .replace(/var\(--text-muted\)/g, theme.colors.textMuted);

        return JSON.parse(resolved);
    }

    /**
     * Generate a brand layer from the active theme.
     */
    getBrandLayer(position = 'top') {
        const theme = this.getTheme();
        return {
            type: 'brand',
            logo: theme.brand.logo,
            text: theme.brand.name,
            badge: theme.brand.badge,
            position
        };
    }

    /**
     * Generate a default background layer from the active theme.
     */
    getBackgroundLayer() {
        const theme = this.getTheme();
        return {
            type: 'background',
            fill: theme.background.fill,
            pattern: theme.background.pattern,
            opacity: theme.background.opacity
        };
    }
}


// =============================================
// DEFAULT THEMES
// =============================================

const THEME_CYBER = {
    name: 'Cyber',
    colors: {
        primary: '#00D9FF',
        accent: '#A855F7',
        warning: '#FF9500',
        success: '#00FF88',
        danger: '#FF3366',
        bg: '#030303',
        cardBg: '#0a0a0c',
        text: '#f0f0f0',
        textMuted: '#94a3b8'
    },
    fonts: {
        title: 'NewComicTitle',
        body: 'CODE Bold',
        mono: 'JetBrains Mono'
    },
    background: {
        fill: '#030303',
        pattern: null,
        opacity: 1.0
    },
    brand: {
        name: 'KR-CLIDN',
        logo: './assets/kr-clidn-logo.png',
        badge: 'EDICIÓN PREMIUM'
    }
};

const THEME_HACKER = {
    name: 'Hacker',
    colors: {
        primary: '#00FF41',
        accent: '#FF00FF',
        warning: '#FFD700',
        success: '#00FF41',
        danger: '#FF0040',
        bg: '#000000',
        cardBg: '#0a0f0a',
        text: '#e0ffe0',
        textMuted: '#5a8a5a'
    },
    fonts: {
        title: 'NewComicTitle',
        body: 'CODE Bold',
        mono: 'JetBrains Mono'
    },
    background: {
        fill: '#000000',
        pattern: null,
        opacity: 1.0
    },
    brand: {
        name: 'KR-CLIDN',
        logo: './assets/kr-clidn-logo.png',
        badge: 'HACKER EDITION'
    }
};

const THEME_MINIMAL = {
    name: 'Minimal',
    colors: {
        primary: '#3B82F6',
        accent: '#8B5CF6',
        warning: '#F59E0B',
        success: '#10B981',
        danger: '#EF4444',
        bg: '#111111',
        cardBg: '#1a1a1a',
        text: '#ffffff',
        textMuted: '#9ca3af'
    },
    fonts: {
        title: 'NewComicTitle',
        body: 'CODE Bold',
        mono: 'JetBrains Mono'
    },
    background: {
        fill: '#111111',
        pattern: null,
        opacity: 1.0
    },
    brand: {
        name: 'KR-CLIDN',
        logo: './assets/kr-clidn-logo.png',
        badge: 'PRO EDITION'
    }
};


const THEME_RED_TEAM = {
    name: 'Red Team',
    colors: {
        primary: '#FF0000',
        accent: '#FF6600',
        warning: '#FFD700',
        success: '#FF4444',
        danger: '#FF0040',
        bg: '#030303',
        cardBg: '#0c0606',
        text: '#f0f0f0',
        textMuted: '#a38888'
    },
    fonts: { title: 'BlackOpsOne', body: 'MPLUS Code Latin', mono: 'JetBrains Mono' },
    background: { fill: '#030303', pattern: null, opacity: 1.0 },
    brand: { name: 'KR-CLIDN', logo: './assets/kr-clidn-logo.png', badge: 'RED TEAM' }
};

const THEME_BLUE_TEAM = {
    name: 'Blue Team',
    colors: {
        primary: '#0088FF',
        accent: '#00CCFF',
        warning: '#FF9500',
        success: '#00FF88',
        danger: '#FF3366',
        bg: '#030308',
        cardBg: '#060610',
        text: '#f0f0f0',
        textMuted: '#8888a3'
    },
    fonts: { title: 'BlackOpsOne', body: 'MPLUS Code Latin', mono: 'JetBrains Mono' },
    background: { fill: '#030308', pattern: null, opacity: 1.0 },
    brand: { name: 'KR-CLIDN', logo: './assets/kr-clidn-logo.png', badge: 'BLUE TEAM' }
};

const THEME_OSINT = {
    name: 'OSINT',
    colors: {
        primary: '#D946EF',
        accent: '#A855F7',
        warning: '#F59E0B',
        success: '#10B981',
        danger: '#EF4444',
        bg: '#030303',
        cardBg: '#0a060c',
        text: '#f0f0f0',
        textMuted: '#a388a3'
    },
    fonts: { title: 'BlackOpsOne', body: 'MPLUS Code Latin', mono: 'JetBrains Mono' },
    background: { fill: '#030303', pattern: null, opacity: 1.0 },
    brand: { name: 'KR-CLIDN', logo: './assets/kr-clidn-logo.png', badge: 'OSINT EDITION' }
};

// Create singleton with default themes
const brandingInstance = new BrandingSystem();
brandingInstance.registerTheme('cyber', THEME_CYBER);
brandingInstance.registerTheme('CYBER', THEME_CYBER);
brandingInstance.registerTheme('hacker', THEME_HACKER);
brandingInstance.registerTheme('minimal', THEME_MINIMAL);
brandingInstance.registerTheme('RED_TEAM', THEME_RED_TEAM);
brandingInstance.registerTheme('BLUE_TEAM', THEME_BLUE_TEAM);
brandingInstance.registerTheme('OSINT', THEME_OSINT);

if (typeof module !== 'undefined') module.exports = { BrandingSystem, brandingInstance, THEME_CYBER, THEME_HACKER, THEME_MINIMAL };
else {
    window.BrandingSystem = BrandingSystem;
    window.brandingInstance = brandingInstance;
}
