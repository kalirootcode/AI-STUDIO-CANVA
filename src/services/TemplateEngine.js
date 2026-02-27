// ═══════════════════════════════════════════════════════════════════════════
// CYBER-CANVAS PRO - Template Engine v2.0 (Pack-based)
// Motor para cargar y renderizar templates desde la estructura de packs
// ═══════════════════════════════════════════════════════════════════════════

class TemplateEngine {
    constructor() {
        this.templates = [];
        this.renderFunctions = {}; // Cache de funciones de renderizado
        this.currentTemplate = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CARGA DE PACKS Y TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════

    async loadFromPacks() {
        try {
            console.log("Cargando packs desde el sistema...");

            // Cargar packs via IPC (nueva estructura)
            const rawPacks = await window.cyberCanvas.loadPacks();

            this.templates = [];
            this.renderFunctions = {};

            const packsMeta = [];

            for (const pack of rawPacks) {
                const packInfo = {
                    id: pack.id,
                    name: pack.name,
                    description: pack.description,
                    icon: pack.icon,
                    templateIds: []
                };

                for (const t of pack.templates) {
                    // Agregar metadata del template
                    this.templates.push({
                        id: t.id,
                        name: t.manifest.name,
                        category: t.manifest.category,
                        description: t.manifest.description,
                        fields: t.manifest.fields || {},
                        packId: pack.id
                    });

                    packInfo.templateIds.push(t.id);

                    // Compilar y guardar la función de renderizado
                    await this.compileRenderFunction(t.id, t.code);
                }

                packsMeta.push(packInfo);
            }

            console.log(`${this.templates.length} templates cargados de ${packsMeta.length} packs.`);
            return packsMeta;
        } catch (error) {
            console.error("Error crítico cargando packs:", error);
            return [];
        }
    }

    async compileRenderFunction(id, codeString) {
        try {
            // Importar módulo dinámico desde string via Blob URL
            const blob = new Blob([codeString], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const module = await import(url);

            if (module && typeof module.render === 'function') {
                this.renderFunctions[id] = module.render;
                console.log(`✅ Compiled template ${id}`);
            } else {
                console.warn(`Template ${id} no exporta una función 'render'.`);
            }

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(`Error compilando template ${id}:`, err);
        }
    }

    getTemplates() {
        return this.templates;
    }

    getTemplateById(id) {
        return this.templates.find(t => t.id === id);
    }

    getTemplatesByPack(packId) {
        return this.templates.filter(t => t.packId === packId);
    }

    selectTemplate(id) {
        this.currentTemplate = this.getTemplateById(id);
        return this.currentTemplate;
    }

    getThemeOverrides(theme) {
        if (!theme) return '';

        let p, s, a, w;

        // Check if theme is a HEX color
        if (theme.startsWith('#')) {
            p = theme; // Primary is the custom color

            // Derive complementary colors from the hex using HSL shifts
            const hsl = this._hexToHSL(theme);
            // Accent: complementary hue (opposite on wheel)
            a = this._hslToHex((hsl.h + 180) % 360, Math.min(hsl.s + 10, 100), Math.max(hsl.l, 50));
            // Success: shift toward green/teal
            s = this._hslToHex((hsl.h + 150) % 360, 80, 55);
            // Warning: shift toward amber/yellow
            w = this._hslToHex((hsl.h + 60) % 360, 90, 55);
        } else {
            // Preset Themes (Match with kr-clidn-01.js logic for consistency)
            const themes = {
                CYBER: { p: '#00D9FF', s: '#00FF9D', a: '#FF0055', w: '#FFB800' },
                RED_TEAM: { p: '#FF0000', s: '#32CD32', a: '#FF4500', w: '#FFFF00' },
                BLUE_TEAM: { p: '#0088FF', s: '#00FF9D', a: '#FFA500', w: '#7c3aed' },
                OSINT: { p: '#d946ef', s: '#10b981', a: '#f43f5e', w: '#f59e0b' }
            };
            const t = themes[theme] || themes.CYBER;
            p = t.p; s = t.s; a = t.a; w = t.w;
        }

        // We use !important to ensure these override any template defaults
        return `
        <style>
            :root {
                --primary-color: ${p} !important;
                --accent-color: ${a} !important;
                --success-color: ${s} !important;
                --warning-color: ${w} !important;
            }
        </style>
        `;
    }

    // ── Color Utility Helpers ──────────────────────────────────────────────

    _hexToHSL(hex) {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
            h *= 360;
        }
        return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    _hslToHex(h, s, l) {
        s /= 100; l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
        return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDERIZADO
    // ═══════════════════════════════════════════════════════════════════════

    async loadSharedAssets() {
        try {
            // Fetch cyber-base.css and cache its content for inline injection.
            // fetch() works here because Electron loads index.html via file:// protocol.
            const res = await fetch('./styles/templates/cyber-base.css');
            if (res.ok) {
                this.sharedCSS = await res.text();
                console.log('[TemplateEngine] Loaded cyber-base.css inline (' + this.sharedCSS.length + ' bytes)');
            } else {
                console.warn('[TemplateEngine] Failed to fetch cyber-base.css, status:', res.status);
                this.sharedCSS = '';
            }
        } catch (e) {
            console.error("Failed to load shared assets", e);
            this.sharedCSS = '';
        }
    }

    renderTemplate(templateId, data) {
        const renderFn = this.renderFunctions[templateId];

        if (!renderFn) {
            console.error(`Función de renderizado no encontrada para ${templateId}`);
            return this.renderFallbackTemplate(templateId, data);
        }

        try {
            console.log(`Rendering template ${templateId}`);

            // --- ContentValidator Integration ---
            // Sanitize AI data before render to enforce LayoutConstraints
            const ContentValidator = (typeof window !== 'undefined' && window.ContentValidator) ? window.ContentValidator : null;
            if (ContentValidator && data) {
                const slideObj = { templateId, content: data };
                const validated = ContentValidator.validateSlide(slideObj, 0, []);
                if (validated && validated.content) {
                    // Merge validated content back, preserving non-content fields (THEME, _overrides, etc.)
                    data = { ...data, ...validated.content };
                }
            }

            let html = renderFn(data);

            // INJECT SHARED ASSETS (inline — srcdoc iframes can't resolve relative <link> paths)
            // 1. Google Fonts (CDN URLs work fine in srcdoc)
            const fontsLink = `<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;

            // 2. Cyber Base CSS — injected inline as <style> (cached from loadSharedAssets)
            const inlineCSS = this.sharedCSS ? `<style>\n/* cyber-base.css (inline) */\n${this.sharedCSS}\n</style>` : '';

            // 3. Highlight.js & Mermaid (CDN)
            const libScripts = `
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
                <script>hljs.highlightAll(); mermaid.initialize({startOnLoad:true, theme: 'dark'});</script>
            `;

            // 4. Dynamic Theme Override (Handles Presets & Custom Hex)
            const themeOverrideCSS = this.getThemeOverrides(data.THEME);

            const injectedAssets = `${fontsLink}\n${inlineCSS}\n${themeOverrideCSS}\n${libScripts}`;

            // INJECT AT START OF HEAD (so template styles override base styles)
            if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>\n${injectedAssets}`);
            } else {
                html = `${injectedAssets}\n` + html;
            }

            // Post-process HTML to inject professional SVGs
            if (window.IconSystem) {
                return window.IconSystem.replaceIconsInHTML(html);
            }

            return html;
        } catch (err) {
            console.error(`Error renderizando ${templateId}:`, err);
            return this.renderErrorTemplate(err);
        }
    }

    renderErrorTemplate(err) {
        return `<div style="color:red; padding:20px;">Render Error: ${err.message}</div>`;
    }

    renderFallbackTemplate(id, data) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { background: #000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center; }
                h1 { color: #ff0055; margin-bottom: 10px; }
                .card { background: #111; padding: 40px; border: 1px solid #333; border-radius: 10px; max-width: 80%; }
                pre { text-align: left; background: #222; padding: 10px; overflow: auto; max-height: 300px; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>⚠️ Template Missing: ${id}</h1>
                <p>The AI selected a template that hasn't been implemented or loaded yet.</p>
                <div style="margin-top: 20px; text-align: left;">
                    <strong>Content Data:</strong>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            </div>
        </body>
        </html>`;
    }
}

// Exportar para uso global
window.TemplateEngine = TemplateEngine;
