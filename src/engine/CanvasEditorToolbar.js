/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  CanvasEditorToolbar.js — Professional Floating Editor Widget v3.0      ║
 * ║  Cyber-Canvas Studio  —  PRODUCTION BUILD                               ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Nuevo en v3.0:                                                          ║
 * ║  · Ventana FLOTANTE siempre visible (no desaparece)                      ║
 * ║  · Selector de TEMA completo (Cyber, Hacker, Minimal, Red Team, etc.)   ║
 * ║  · Selector de COLOR libre (cualquier color para cualquier elemento)     ║
 * ║  · Panel de propiedades expandido con font-size, line-height, radius     ║
 * ║  · Toolbar inicializa automáticamente al cargar la app                   ║
 * ║  · Se mantiene siempre encima del canvas (z-index 10000)                ║
 * ║  · Sincronización total con BrandingSystem y CanvasRenderer              ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  FIX BUGS v2 preservados:                                               ║
 * ║  · Guard _inToolbarCallback → sin loops onChange                         ║
 * ║  · _commitChange/_commitPropChange no llaman editor.onChange             ║
 * ║  · _restoreHistory tiene guard anti re-push                              ║
 * ║  · _toHex acepta null/undefined/objeto sin crashear                      ║
 * ║  · Keyboard listener usa capture phase, se limpia en destroy()           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

class CanvasEditorToolbar {

    // ─── CONSTRUCTOR ──────────────────────────────────────────────────────
    constructor(container, canvasEditor, options = {}) {
        this.container = container;
        this.editor = canvasEditor;
        this.options = options;
        this.mode = options.mode || 'studio';

        // ── History ──────────────────────────────────────────────────────
        this._history = [];
        this._historyIdx = -1;
        this._MAX_HISTORY = 60;

        // ── Clipboard ────────────────────────────────────────────────────
        this._clipboard = null;

        // ── DOM refs ─────────────────────────────────────────────────────
        this._widget = null;  // main floating widget
        this._propPanel = null;  // properties flyout
        this._themePanel = null;  // theme selector flyout
        this._colorPanel = null;  // advanced color picker flyout
        this._iconPicker = null;
        this._ctxMenu = null;

        // ── Active theme (syncs with BrandingSystem) ─────────────────────
        this._activeTheme = options.initialTheme || 'cyber';

        // ── Re-entry guard ───────────────────────────────────────────────
        this._inToolbarCallback = false;

        // ── Keyboard ─────────────────────────────────────────────────────
        this._boundKeyDown = (e) => this._onGlobalKeyDown(e);
        document.addEventListener('keydown', this._boundKeyDown, true);

        // ── Context menu from canvas ─────────────────────────────────────
        this._boundCtxMenu = (e) => this._onEditorContextMenu(e);
        container.addEventListener('editor-contextmenu', this._boundCtxMenu);

        this._injectStyles();
        this._buildWidget();
        this._buildPropPanel();
        this._buildThemePanel();
        this._buildColorPanel();
        this._buildIconPicker();
        this._buildContextMenu();

        // MUST be called AFTER all panels are built — _initWidgetLogic runs
        // during _buildWidget when _propPanel/_themePanel/_colorPanel are still null!
        this._attachExternalPanelListeners();

        // ── Hook editor.onChange ─────────────────────────────────────────
        this.editor.onChange = (graph) => {
            if (this._inToolbarCallback) return;
            this._inToolbarCallback = true;
            try {
                this._pushHistory(graph);
                this._updateSelectionUI();
                this._updatePropPanel();
                if (options.onSceneChange) options.onSceneChange(graph);
            } finally {
                this._inToolbarCallback = false;
            }
        };

        // ── Auto-show the widget immediately ────────────────────────────
        this._setStatus('LISTO', false);
    }

    // ═════════════════════════════════════════════════════════════════════
    // STYLES
    // ═════════════════════════════════════════════════════════════════════
    _injectStyles() {
        if (document.getElementById('cet-styles-v3')) return;
        const s = document.createElement('style');
        s.id = 'cet-styles-v3';
        s.textContent = `
/* ── FONT IMPORTS (if not already loaded) ─────────────────────────── */
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

/* ── WIDGET CORE ──────────────────────────────────────────────────── */
.cet-widget {
    position: fixed;
    top: 80px;
    right: 20px;
    width: 56px;
    background: rgba(8, 8, 12, 0.97);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(0, 217, 255, 0.15);
    border-radius: 16px;
    box-shadow: 0 16px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0 12px;
    user-select: none;
    transition: box-shadow 0.3s ease;
}

.cet-widget:hover {
    box-shadow: 0 16px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,217,255,0.1) inset, 0 0 20px rgba(0,217,255,0.05);
}

/* Drag handle */
.cet-drag-handle {
    width: 28px;
    height: 3px;
    background: rgba(255,255,255,0.12);
    border-radius: 2px;
    margin-bottom: 10px;
    cursor: grab;
    transition: background 0.2s;
}
.cet-drag-handle:hover { background: rgba(0,217,255,0.4); }
.cet-drag-handle:active { cursor: grabbing; background: #00D9FF; }

/* Separator */
.cet-sep {
    width: 32px;
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 4px 0;
}

/* Slide navigation */
.cet-nav-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    margin-bottom: 4px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    width: 100%;
}
.cet-counter {
    font-size: 9px;
    color: #00D9FF;
    font-weight: 900;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    letter-spacing: 0.5px;
}

/* ── BUTTONS ──────────────────────────────────────────────────────── */
.cet-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: transparent;
    border: 1px solid transparent;
    color: rgba(255,255,255,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    margin: 2px 0;
    position: relative;
    outline: none;
    -webkit-tap-highlight-color: transparent;
}
.cet-btn:hover {
    background: rgba(0, 217, 255, 0.08);
    color: #00D9FF;
    border-color: rgba(0, 217, 255, 0.2);
    transform: scale(1.05);
}
.cet-btn.active {
    background: rgba(0, 217, 255, 0.15);
    color: #00D9FF;
    border-color: rgba(0, 217, 255, 0.4);
    box-shadow: 0 0 12px rgba(0,217,255,0.2);
}
.cet-btn:disabled {
    opacity: 0.2;
    cursor: not-allowed;
    transform: none !important;
}
.cet-btn .material-icons { font-size: 20px; }

/* Danger button variant */
.cet-btn.danger:hover { color: #FF3366; border-color: rgba(255,51,102,0.3); background: rgba(255,51,102,0.08); }

/* ── TOOLTIPS ─────────────────────────────────────────────────────── */
[data-tip]::after {
    content: attr(data-tip);
    position: absolute;
    right: calc(100% + 14px);
    top: 50%;
    transform: translateY(-50%);
    background: rgba(10,10,15,0.98);
    color: #e0e0e0;
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 11px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s, right 0.2s;
    box-shadow: 0 4px 16px rgba(0,0,0,0.7);
    border: 1px solid rgba(255,255,255,0.08);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.5px;
    z-index: 10010;
}
.cet-btn:hover::after {
    opacity: 1;
    right: calc(100% + 10px);
}

/* ── STATUS DOT ───────────────────────────────────────────────────── */
.cet-status-wrap {
    padding: 6px 0 0;
    margin-top: 4px;
    border-top: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}
.cet-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #1e2a1e;
    transition: all 0.3s;
}
.cet-dot.active {
    background: #00FF88;
    box-shadow: 0 0 12px #00FF88;
    animation: cet-pulse 2s ease-in-out infinite;
}
@keyframes cet-pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 12px #00FF88; }
    50% { opacity: 0.6; box-shadow: 0 0 6px #00FF88; }
}

/* ── FLYOUT PANELS ────────────────────────────────────────────────── */
.cet-flyout {
    position: fixed;
    right: 84px;
    background: rgba(10, 10, 16, 0.99);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    box-shadow: -8px 8px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,217,255,0.05) inset;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0;
    pointer-events: none;
    transform: translateX(12px) scale(0.96);
    transition: all 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.2);
    z-index: 10001;
    min-width: 160px;
}
.cet-flyout.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0) scale(1);
}

/* Row inside flyout */
.cet-flyout-row {
    display: flex;
    gap: 4px;
    flex-wrap: nowrap;
    justify-content: center;
}

/* ── PROPERTIES PANEL ─────────────────────────────────────────────── */
.cet-prop-panel {
    position: fixed;
    right: 84px;
    background: rgba(10, 10, 16, 0.99);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    box-shadow: -8px 8px 48px rgba(0,0,0,0.8);
    padding: 14px;
    width: 280px;
    max-height: 80vh;
    overflow-y: auto;
    overflow-x: hidden;
    opacity: 0;
    pointer-events: none;
    transform: translateX(12px) scale(0.96);
    transition: all 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.2);
    z-index: 10001;
    scrollbar-width: thin;
    scrollbar-color: #1a1a2a transparent;
}
.cet-prop-panel.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0) scale(1);
}
.cet-prop-panel::-webkit-scrollbar { width: 4px; }
.cet-prop-panel::-webkit-scrollbar-thumb { background: #1a1a2a; border-radius: 4px; }

.cet-prop-section {
    font-size: 9px;
    font-weight: 900;
    color: #333;
    letter-spacing: 2px;
    font-family: 'JetBrains Mono', monospace;
    margin: 8px 0 4px;
    text-transform: uppercase;
    border-bottom: 1px solid #111;
    padding-bottom: 4px;
}
.cet-prop-section:first-child { margin-top: 0; }

.cet-prop-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
}
.cet-prop-label {
    font-size: 9px;
    color: #444;
    min-width: 48px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    flex-shrink: 0;
}
.cet-prop-input {
    background: rgba(255,255,255,0.03);
    border: 1px solid #1a1a2a;
    color: #c0c0c0;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
}
.cet-prop-input:focus { border-color: rgba(0,217,255,0.4); color: #fff; }
.cet-prop-input[type="number"] { -moz-appearance: textfield; width: 64px; }
.cet-prop-input[type="number"]::-webkit-inner-spin-button { display: none; }

.cet-prop-select {
    background: rgba(255,255,255,0.03);
    border: 1px solid #1a1a2a;
    color: #c0c0c0;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    width: 100%;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
}
.cet-prop-select:focus { border-color: rgba(0,217,255,0.4); color: #fff; }
.cet-prop-select option { background: #0a0a0f; }

.cet-prop-color-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
}
.cet-color-swatch {
    width: 22px;
    height: 22px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.15);
    cursor: pointer;
    flex-shrink: 0;
    transition: transform 0.15s;
}
.cet-color-swatch:hover { transform: scale(1.15); }
input[type="color"].cet-color-native {
    opacity: 0;
    position: absolute;
    width: 22px;
    height: 22px;
    cursor: pointer;
    border: none;
    padding: 0;
}

/* Prop buttons (mini) */
.cet-prop-btn-row {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 2px;
}
.cet-prop-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid #1a1a2a;
    color: #555;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    outline: none;
}
.cet-prop-btn:hover { background: rgba(0,217,255,0.1); color: #00D9FF; border-color: rgba(0,217,255,0.3); }
.cet-prop-btn .material-icons { font-size: 16px; }

/* Type label */
.cet-type-label {
    font-size: 9px;
    color: #1e1e1e;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 1px;
    margin-top: 8px;
    word-break: break-all;
}

/* Range input */
input[type="range"].cet-range {
    flex: 1;
    accent-color: #00D9FF;
    height: 4px;
    cursor: pointer;
}
.cet-range-val {
    font-size: 10px;
    color: #555;
    width: 36px;
    text-align: right;
    font-family: 'JetBrains Mono', monospace;
    flex-shrink: 0;
}

/* ── THEME PANEL ──────────────────────────────────────────────────── */
.cet-theme-panel {
    position: fixed;
    right: 84px;
    background: rgba(10, 10, 16, 0.99);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    box-shadow: -8px 8px 48px rgba(0,0,0,0.8);
    padding: 14px;
    width: 260px;
    opacity: 0;
    pointer-events: none;
    transform: translateX(12px) scale(0.96);
    transition: all 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.2);
    z-index: 10001;
}
.cet-theme-panel.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0) scale(1);
}
.cet-theme-title {
    font-size: 9px;
    font-weight: 900;
    color: #444;
    letter-spacing: 2px;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 10px;
    text-transform: uppercase;
}
.cet-theme-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}
.cet-theme-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 8px 6px;
    border-radius: 8px;
    border: 1px solid #1a1a2a;
    background: rgba(255,255,255,0.02);
    cursor: pointer;
    transition: all 0.2s;
    outline: none;
}
.cet-theme-btn:hover { border-color: rgba(0,217,255,0.3); background: rgba(0,217,255,0.05); }
.cet-theme-btn.selected { border-color: #00D9FF; background: rgba(0,217,255,0.1); }
.cet-theme-dots {
    display: flex;
    gap: 3px;
}
.cet-theme-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}
.cet-theme-name {
    font-size: 9px;
    font-weight: 700;
    color: #666;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    text-align: center;
}
.cet-theme-btn.selected .cet-theme-name { color: #00D9FF; }
.cet-theme-divider {
    height: 1px;
    background: rgba(255,255,255,0.07);
    margin: 10px 0 4px;
}
.cet-custom-colors-grid { display:flex; flex-direction:column; gap:5px; margin:4px 0; }
.cet-custom-color-row   { display:flex; align-items:center; gap:5px; }
.cet-custom-label {
    font-size: 9px; color: #555;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 1px; min-width: 46px; text-transform: uppercase;
}
.cet-custom-swatch {
    width: 20px; height: 20px; border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.15);
    cursor: pointer; flex-shrink: 0; transition: transform 0.1s;
}
.cet-custom-swatch:hover { transform: scale(1.15); border-color: rgba(255,255,255,0.4); }
.cet-custom-hex {
    flex: 1; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;
    color: #ccc; font-family: 'JetBrains Mono', monospace; font-size: 10px;
    padding: 3px 5px; min-width: 0;
}
.cet-custom-hex:focus { outline:none; border-color:rgba(0,217,255,0.4); color:#fff; }

/* ── ADVANCED COLOR PANEL ─────────────────────────────────────────── */
.cet-color-panel {
    position: fixed;
    right: 84px;
    background: rgba(10, 10, 16, 0.99);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    box-shadow: -8px 8px 48px rgba(0,0,0,0.8);
    padding: 14px;
    width: 230px;
    opacity: 0;
    pointer-events: none;
    transform: translateX(12px) scale(0.96);
    transition: all 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.2);
    z-index: 10001;
}
.cet-color-panel.visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(0) scale(1);
}
.cet-color-big-swatch {
    width: 100%;
    height: 48px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 10px;
    cursor: pointer;
    transition: transform 0.2s;
}
.cet-color-big-swatch:hover { transform: scale(1.02); }
.cet-color-native-big {
    width: 100%;
    height: 48px;
    border: none;
    border-radius: 8px;
    padding: 0;
    cursor: pointer;
    background: none;
    display: block;
    margin-bottom: 10px;
}
.cet-color-presets {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 5px;
    margin-bottom: 10px;
}
.cet-color-preset {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
    transition: transform 0.15s, border-color 0.15s;
}
.cet-color-preset:hover { transform: scale(1.2); border-color: #fff; }
.cet-color-hex-input {
    background: rgba(255,255,255,0.03);
    border: 1px solid #1a1a2a;
    color: #c0c0c0;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    width: 100%;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
    margin-bottom: 8px;
}
.cet-color-hex-input:focus { border-color: rgba(0,217,255,0.4); color: #fff; }

.cet-color-target-row {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 6px;
}
.cet-color-target-btn {
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(255,255,255,0.03);
    border: 1px solid #1a1a2a;
    color: #555;
    font-size: 9px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    outline: none;
}
.cet-color-target-btn:hover,
.cet-color-target-btn.active { background: rgba(0,217,255,0.1); color: #00D9FF; border-color: rgba(0,217,255,0.3); }

.cet-apply-btn {
    width: 100%;
    padding: 8px;
    border-radius: 8px;
    background: rgba(0,217,255,0.15);
    border: 1px solid rgba(0,217,255,0.4);
    color: #00D9FF;
    font-size: 11px;
    font-weight: 900;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.2s;
    outline: none;
    text-transform: uppercase;
}
.cet-apply-btn:hover { background: rgba(0,217,255,0.25); box-shadow: 0 0 16px rgba(0,217,255,0.2); }

/* ── ICON PICKER ──────────────────────────────────────────────────── */
.cet-icon-picker {
    position: fixed;
    z-index: 11000;
    background: rgba(10, 10, 15, 0.99);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 14px;
    display: none;
    flex-direction: column;
    gap: 10px;
    width: 320px;
    max-height: 400px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.9);
}
.cet-icon-picker.visible { display: flex; }
.cet-icon-search {
    background: rgba(255,255,255,0.03);
    border: 1px solid #1a1a2a;
    color: #c0c0c0;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    outline: none;
    width: 100%;
    box-sizing: border-box;
}
.cet-icon-search:focus { border-color: rgba(0,217,255,0.4); }
.cet-icon-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    overflow-y: auto;
    max-height: 320px;
    scrollbar-width: thin;
    scrollbar-color: #1a1a2a transparent;
}
.cet-icon-item {
    cursor: pointer;
    color: #555;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
    border: 1px solid transparent;
    transition: all 0.2s;
}
.cet-icon-item:hover {
    color: #00D9FF;
    background: rgba(0,217,255,0.08);
    border-color: rgba(0,217,255,0.2);
}
.cet-icon-item .material-icons { font-size: 18px; }

/* ── CONTEXT MENU ─────────────────────────────────────────────────── */
.cet-ctx-menu {
    position: fixed;
    z-index: 12000;
    background: rgba(10, 10, 16, 0.99);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 6px;
    min-width: 180px;
    display: none;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.9);
}
.cet-ctx-menu.visible { display: flex; }
.cet-ctx-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    color: #888;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    transition: all 0.15s;
}
.cet-ctx-item:hover { background: rgba(0,217,255,0.08); color: #00D9FF; }
.cet-ctx-item.danger:hover { background: rgba(255,51,102,0.08); color: #FF3366; }
.cet-ctx-item .material-icons { font-size: 16px; }
.cet-ctx-sep {
    height: 1px;
    background: rgba(255,255,255,0.05);
    margin: 3px 0;
}

/* ── SPIN ANIMATION ───────────────────────────────────────────────── */
@keyframes cet-spin { to { transform: rotate(360deg); } }
.cet-spin { animation: cet-spin 0.8s linear infinite; display: inline-block; }
        `;
        document.head.appendChild(s);
    }

    // ═════════════════════════════════════════════════════════════════════
    // BUILD MAIN WIDGET
    // ═════════════════════════════════════════════════════════════════════
    _buildWidget() {
        const div = document.createElement('div');
        div.className = 'cet-widget';
        div.id = 'cet-widget-' + this.mode;

        div.innerHTML = `
            <div class="cet-drag-handle" id="cet-drag-${this.mode}"></div>

            ${this.mode === 'studio' || this.mode === 'ebook' || this.mode === 'thumbnail' ? `
            <div class="cet-nav-row">
                <button class="cet-btn" id="cet-prev-${this.mode}" data-tip="Slide Anterior (←)">
                    <span class="material-icons">chevron_left</span>
                </button>
                <div class="cet-counter" id="cet-counter-${this.mode}">1/1</div>
                <button class="cet-btn" id="cet-next-${this.mode}" data-tip="Slide Siguiente (→)">
                    <span class="material-icons">chevron_right</span>
                </button>
            </div>
            ` : ''}

            <!-- CORE ACTIONS -->
            <button class="cet-btn" id="cet-trg-history-${this.mode}" data-tip="Historial Ctrl+Z/Y">
                <span class="material-icons">history</span>
            </button>
            <button class="cet-btn" id="cet-trg-add-${this.mode}" data-tip="Agregar Elementos">
                <span class="material-icons">add_box</span>
            </button>
            <button class="cet-btn" id="cet-trg-edit-${this.mode}" data-tip="Editar / Portapapeles">
                <span class="material-icons">edit_note</span>
            </button>

            <div class="cet-sep"></div>

            <!-- VISUAL -->
            <button class="cet-btn" id="cet-trg-props-${this.mode}" data-tip="Propiedades">
                <span class="material-icons">tune</span>
            </button>
            <button class="cet-btn" id="cet-trg-color-${this.mode}" data-tip="Selector de Color">
                <span class="material-icons">palette</span>
            </button>
            <button class="cet-btn" id="cet-trg-theme-${this.mode}" data-tip="Cambiar Tema">
                <span class="material-icons">style</span>
            </button>

            <div class="cet-sep"></div>

            <!-- LAYERS -->
            <button class="cet-btn" id="cet-trg-layers-${this.mode}" data-tip="Orden de Capas">
                <span class="material-icons">layers</span>
            </button>
            <button class="cet-btn" id="cet-trg-align-${this.mode}" data-tip="Alinear Elementos">
                <span class="material-icons">grid_view</span>
            </button>
            <button class="cet-btn" id="cet-trg-zoom-${this.mode}" data-tip="Zoom">
                <span class="material-icons">zoom_in</span>
            </button>

            <!-- STATUS -->
            <div class="cet-status-wrap">
                <div class="cet-dot" id="cet-dot-${this.mode}"></div>
            </div>

            <!-- FLYOUT PANELS (injected inside widget for DOM containment) -->

            <!-- History flyout -->
            <div class="cet-flyout" id="cet-fly-history-${this.mode}">
                <div class="cet-flyout-row">
                    <button class="cet-btn" id="cet-undo-${this.mode}" data-tip="Deshacer" disabled>
                        <span class="material-icons">undo</span>
                    </button>
                    <button class="cet-btn" id="cet-redo-${this.mode}" data-tip="Rehacer" disabled>
                        <span class="material-icons">redo</span>
                    </button>
                </div>
            </div>

            <!-- Add flyout -->
            <div class="cet-flyout" id="cet-fly-add-${this.mode}">
                <div class="cet-flyout-row">
                    <button class="cet-btn" id="cet-add-text-${this.mode}" data-tip="Texto (T)">
                        <span class="material-icons">title</span>
                    </button>
                    <button class="cet-btn" id="cet-add-image-${this.mode}" data-tip="Imagen">
                        <span class="material-icons">image</span>
                    </button>
                    <button class="cet-btn" id="cet-add-icon-${this.mode}" data-tip="Icono">
                        <span class="material-icons">category</span>
                    </button>
                </div>
                <div class="cet-flyout-row">
                    <button class="cet-btn" id="cet-add-rect-${this.mode}" data-tip="Recuadro">
                        <span class="material-icons">crop_square</span>
                    </button>
                    <button class="cet-btn" id="cet-add-div-${this.mode}" data-tip="Divisor">
                        <span class="material-icons">horizontal_rule</span>
                    </button>
                    <button class="cet-btn" id="cet-add-terminal-${this.mode}" data-tip="Terminal">
                        <span class="material-icons">terminal</span>
                    </button>
                </div>
                <input type="file" id="cet-img-file-${this.mode}" style="display:none;" accept="image/*">
            </div>

            <!-- Edit flyout -->
            <div class="cet-flyout" id="cet-fly-edit-${this.mode}">
                <div class="cet-flyout-row">
                    <button class="cet-btn" id="cet-copy-${this.mode}" data-tip="Copiar Ctrl+C">
                        <span class="material-icons">content_copy</span>
                    </button>
                    <button class="cet-btn" id="cet-paste-${this.mode}" data-tip="Pegar Ctrl+V">
                        <span class="material-icons">content_paste</span>
                    </button>
                    <button class="cet-btn" id="cet-dup-${this.mode}" data-tip="Duplicar Ctrl+D">
                        <span class="material-icons">copy_all</span>
                    </button>
                    <button class="cet-btn danger" id="cet-del-${this.mode}" data-tip="Eliminar Del">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>

            <!-- Layers flyout -->
            <div class="cet-flyout" id="cet-fly-layers-${this.mode}">
                <div class="cet-flyout-row">
                    <button class="cet-btn" id="cet-lyr-front-${this.mode}" data-tip="Traer al Frente">
                        <span class="material-icons">flip_to_front</span>
                    </button>
                    <button class="cet-btn" id="cet-lyr-fwd-${this.mode}" data-tip="Subir Capa">
                        <span class="material-icons">arrow_upward</span>
                    </button>
                    <button class="cet-btn" id="cet-lyr-bwd-${this.mode}" data-tip="Bajar Capa">
                        <span class="material-icons">arrow_downward</span>
                    </button>
                    <button class="cet-btn" id="cet-lyr-back-${this.mode}" data-tip="Enviar al Fondo">
                        <span class="material-icons">flip_to_back</span>
                    </button>
                </div>
                <div class="cet-flyout-row">
                    <button class="cet-btn" id="cet-lyr-lock-${this.mode}" data-tip="Bloquear">
                        <span class="material-icons">lock</span>
                    </button>
                    <button class="cet-btn" id="cet-lyr-hide-${this.mode}" data-tip="Ocultar">
                        <span class="material-icons">visibility_off</span>
                    </button>
                </div>
            </div>

            <!-- Align flyout -->
            <div class="cet-flyout" id="cet-fly-align-${this.mode}">
                <div class="cet-flyout-row">
                    <button class="cet-btn" id="cet-al-left-${this.mode}" data-tip="Alinear Izquierda">
                        <span class="material-icons">align_horizontal_left</span>
                    </button>
                    <button class="cet-btn" id="cet-al-center-${this.mode}" data-tip="Centrar Horizontal">
                        <span class="material-icons">align_horizontal_center</span>
                    </button>
                    <button class="cet-btn" id="cet-al-right-${this.mode}" data-tip="Alinear Derecha">
                        <span class="material-icons">align_horizontal_right</span>
                    </button>
                </div>
                <div class="cet-flyout-row">
                    <button class="cet-btn" id="cet-al-top-${this.mode}" data-tip="Alinear Arriba">
                        <span class="material-icons">align_vertical_top</span>
                    </button>
                    <button class="cet-btn" id="cet-al-mid-${this.mode}" data-tip="Centrar Vertical">
                        <span class="material-icons">align_vertical_center</span>
                    </button>
                    <button class="cet-btn" id="cet-al-bot-${this.mode}" data-tip="Alinear Abajo">
                        <span class="material-icons">align_vertical_bottom</span>
                    </button>
                </div>
            </div>

            <!-- Zoom flyout -->
            <div class="cet-flyout" id="cet-fly-zoom-${this.mode}">
                <div class="cet-flyout-row">
                    <button class="cet-btn" id="cet-zm-out-${this.mode}" data-tip="Alejar (-)">
                        <span class="material-icons">remove</span>
                    </button>
                    <button class="cet-btn" id="cet-zm-fit-${this.mode}" data-tip="Ajustar (0)">
                        <span class="material-icons">fullscreen</span>
                    </button>
                    <button class="cet-btn" id="cet-zm-in-${this.mode}" data-tip="Acercar (+)">
                        <span class="material-icons">add</span>
                    </button>
                </div>
            </div>
        `;

        // Append to body so it's always on top and not clipped by container overflow
        document.body.appendChild(div);
        this._widget = div;

        this._initWidgetLogic();
        this._initDrag();
    }

    _q(id) { return this._widget ? this._widget.querySelector('#' + id) : null; }

    _initWidgetLogic() {
        const m = this.mode;

        // Register trigger → flyout pairs
        const triggers = {
            [`cet-trg-history-${m}`]: `cet-fly-history-${m}`,
            [`cet-trg-add-${m}`]: `cet-fly-add-${m}`,
            [`cet-trg-edit-${m}`]: `cet-fly-edit-${m}`,
            [`cet-trg-layers-${m}`]: `cet-fly-layers-${m}`,
            [`cet-trg-align-${m}`]: `cet-fly-align-${m}`,
            [`cet-trg-zoom-${m}`]: `cet-fly-zoom-${m}`,
        };

        const allFlyouts = () => this._widget.querySelectorAll('.cet-flyout');
        const allBtns = () => this._widget.querySelectorAll('.cet-btn');

        const closeAll = () => {
            allFlyouts().forEach(f => f.classList.remove('visible'));
            allBtns().forEach(b => b.classList.remove('active'));
            [this._propPanel, this._themePanel, this._colorPanel].forEach(p => {
                if (p) p.classList.remove('visible');
            });
        };

        // Flyout toggles
        Object.entries(triggers).forEach(([btnId, flyId]) => {
            const btn = this._q(btnId);
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const flyout = this._q(flyId);
                const wasActive = btn.classList.contains('active');
                closeAll();
                if (!wasActive && flyout) {
                    btn.classList.add('active');
                    flyout.classList.add('visible');
                    this._positionFlyout(flyout, btn);
                }
            });
        });

        // NOTE: Props/Theme/Color panel listeners are attached in
        // _attachExternalPanelListeners() called AFTER panels are built.

        // Global close on outside click
        document.addEventListener('click', (e) => {
            if (this._widget?.contains(e.target)) return;
            if (this._propPanel?.contains(e.target)) return;
            if (this._themePanel?.contains(e.target)) return;
            if (this._colorPanel?.contains(e.target)) return;
            if (this._iconPicker?.contains(e.target)) return;
            this._closeAllPanels();
        });

        this._attachWidgetListeners();
    }

    /**
     * Close all flyouts and external panels.
     * Shared by _initWidgetLogic and _attachExternalPanelListeners.
     */
    _closeAllPanels() {
        if (this._widget) {
            this._widget.querySelectorAll('.cet-flyout').forEach(f => f.classList.remove('visible'));
            this._widget.querySelectorAll('.cet-btn').forEach(b => b.classList.remove('active'));
        }
        [this._propPanel, this._themePanel, this._colorPanel].forEach(p => {
            if (p) p.classList.remove('visible');
        });
    }

    /**
     * Attach click listeners for Props/Theme/Color panel toggles.
     * Called from constructor AFTER _buildPropPanel/_buildThemePanel/_buildColorPanel.
     */
    _attachExternalPanelListeners() {
        const m = this.mode;

        // Props panel toggle
        const propBtn = this._q(`cet-trg-props-${m}`);
        if (propBtn && this._propPanel) {
            propBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasActive = propBtn.classList.contains('active');
                this._closeAllPanels();
                if (!wasActive) {
                    propBtn.classList.add('active');
                    this._propPanel.classList.add('visible');
                    this._positionFlyout(this._propPanel, propBtn);
                    this._updatePropPanel();
                }
            });
        }

        // Theme panel toggle
        const themeBtn = this._q(`cet-trg-theme-${m}`);
        if (themeBtn && this._themePanel) {
            themeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasActive = themeBtn.classList.contains('active');
                this._closeAllPanels();
                if (!wasActive) {
                    themeBtn.classList.add('active');
                    this._themePanel.classList.add('visible');
                    this._positionFlyout(this._themePanel, themeBtn);
                    this._highlightActiveTheme();
                }
            });
        }

        // Color panel toggle
        const colorBtn = this._q(`cet-trg-color-${m}`);
        if (colorBtn && this._colorPanel) {
            colorBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasActive = colorBtn.classList.contains('active');
                this._closeAllPanels();
                if (!wasActive) {
                    colorBtn.classList.add('active');
                    this._colorPanel.classList.add('visible');
                    this._positionFlyout(this._colorPanel, colorBtn);
                    this._syncColorPanelToSelection();
                }
            });
        }
    }

    _positionFlyout(panel, referenceBtn) {
        if (!panel || !referenceBtn) return;
        const r = referenceBtn.getBoundingClientRect();
        const midY = r.top + r.height / 2;
        const panelH = panel.offsetHeight || 200;
        let topY = midY - panelH / 2;
        topY = Math.max(10, Math.min(window.innerHeight - panelH - 10, topY));
        panel.style.top = topY + 'px';
        panel.style.right = '84px';
        panel.style.bottom = 'auto';
        panel.style.transform = 'none';
    }

    _initDrag() {
        const handle = this._widget?.querySelector(`#cet-drag-${this.mode}`);
        if (!handle) return;

        let dragging = false, startX, startY, startRight, startTop;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const style = window.getComputedStyle(this._widget);
            startRight = parseInt(style.right) || 20;
            startTop = parseInt(style.top) || 80;
            document.body.style.userSelect = 'none';
        });

        const onMove = (e) => {
            if (!dragging) return;
            const dx = startX - e.clientX;
            const dy = e.clientY - startY;
            const newRight = Math.max(0, Math.min(window.innerWidth - 60, startRight + dx));
            const newTop = Math.max(0, Math.min(window.innerHeight - 100, startTop + dy));
            this._widget.style.right = newRight + 'px';
            this._widget.style.top = newTop + 'px';
            // Sync open panels
            const openFlyout = this._widget.querySelector('.cet-flyout.visible');
            const openBtn = this._widget.querySelector('.cet-btn.active');
            if (openFlyout && openBtn) this._positionFlyout(openFlyout, openBtn);
            [this._propPanel, this._themePanel, this._colorPanel].forEach(panel => {
                if (panel?.classList.contains('visible') && openBtn)
                    this._positionFlyout(panel, openBtn);
            });
        };

        const onUp = () => {
            dragging = false;
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        this._dragCleanup = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }

    // ═════════════════════════════════════════════════════════════════════
    // WIDGET LISTENERS
    // ═════════════════════════════════════════════════════════════════════
    _attachWidgetListeners() {
        const m = this.mode;
        const qw = (id) => this._q(id);
        const on = (id, ev, fn) => { const el = qw(id); if (el) el.addEventListener(ev, fn); };
        const clk = (id, fn) => on(id, 'click', fn);

        // Navigation
        clk(`cet-prev-${m}`, () => this.options.onPrev?.());
        clk(`cet-next-${m}`, () => this.options.onNext?.());

        // History
        clk(`cet-undo-${m}`, () => this.undo());
        clk(`cet-redo-${m}`, () => this.redo());

        // Add elements
        clk(`cet-add-text-${m}`, () => this._addTextLayer());
        clk(`cet-add-image-${m}`, () => qw(`cet-img-file-${m}`)?.click());
        on(`cet-img-file-${m}`, 'change', (e) => {
            if (e.target.files[0]) this._addImageLayer(e.target.files[0]);
            e.target.value = '';
        });
        clk(`cet-add-icon-${m}`, (e) => {
            e.stopPropagation();
            if (!this._iconPicker) return;
            const isVis = this._iconPicker.classList.contains('visible');
            this._iconPicker.classList.toggle('visible', !isVis);
            if (!isVis) {
                const r = qw(`cet-add-icon-${m}`)?.getBoundingClientRect();
                if (r) {
                    this._iconPicker.style.right = '84px';
                    this._iconPicker.style.top = Math.max(10, r.top - 60) + 'px';
                }
            }
        });
        clk(`cet-add-rect-${m}`, () => this._addRectLayer());
        clk(`cet-add-div-${m}`, () => this._addDividerLayer());
        clk(`cet-add-terminal-${m}`, () => this._addTerminalLayer());

        // Clipboard
        clk(`cet-copy-${m}`, () => this.copySelected());
        clk(`cet-paste-${m}`, () => this.pasteClipboard());
        clk(`cet-dup-${m}`, () => this.duplicateSelected());
        clk(`cet-del-${m}`, () => this.deleteSelected());

        // Layers
        clk(`cet-lyr-front-${m}`, () => { this.editor.bringToFront?.(); this._afterExternalAction(); });
        clk(`cet-lyr-fwd-${m}`, () => { this.editor.bringForward?.(); this._afterExternalAction(); });
        clk(`cet-lyr-bwd-${m}`, () => { this.editor.sendBackward?.(); this._afterExternalAction(); });
        clk(`cet-lyr-back-${m}`, () => { this.editor.sendToBack?.(); this._afterExternalAction(); });
        clk(`cet-lyr-lock-${m}`, () => { this.editor.toggleLock?.(); this._afterExternalAction(); });
        clk(`cet-lyr-hide-${m}`, () => { this.editor.toggleVisible?.(); this._afterExternalAction(); });

        // Align
        clk(`cet-al-left-${m}`, () => { this.editor.alignLayers?.('left'); this._afterExternalAction(); });
        clk(`cet-al-center-${m}`, () => { this.editor.alignLayers?.('center'); this._afterExternalAction(); });
        clk(`cet-al-right-${m}`, () => { this.editor.alignLayers?.('right'); this._afterExternalAction(); });
        clk(`cet-al-top-${m}`, () => { this.editor.alignLayers?.('top'); this._afterExternalAction(); });
        clk(`cet-al-mid-${m}`, () => { this.editor.alignLayers?.('middle'); this._afterExternalAction(); });
        clk(`cet-al-bot-${m}`, () => { this.editor.alignLayers?.('bottom'); this._afterExternalAction(); });

        // Zoom
        clk(`cet-zm-out-${m}`, () => this._zoom(-0.15));
        clk(`cet-zm-fit-${m}`, () => this._zoomFit());
        clk(`cet-zm-in-${m}`, () => this._zoom(0.15));
    }

    _afterExternalAction() {
        this._pushHistory(this.editor.sceneGraph);
        this._updateSelectionUI();
        this._updatePropPanel();
        if (this.options.onSceneChange) this.options.onSceneChange(this.editor.sceneGraph);
    }

    // ═════════════════════════════════════════════════════════════════════
    // PROPERTIES PANEL
    // ═════════════════════════════════════════════════════════════════════
    _buildPropPanel() {
        const panel = document.createElement('div');
        panel.className = 'cet-prop-panel';
        panel.id = 'cet-prop-panel-' + this.mode;

        panel.innerHTML = `
            <div class="cet-prop-section">Posición y Tamaño</div>
            <div class="cet-prop-row">
                <span class="cet-prop-label">X</span>
                <input type="number" class="cet-prop-input" id="cpp-x" style="width:64px;">
                <span class="cet-prop-label">Y</span>
                <input type="number" class="cet-prop-input" id="cpp-y" style="width:64px;">
            </div>
            <div class="cet-prop-row">
                <span class="cet-prop-label">W</span>
                <input type="number" class="cet-prop-input" id="cpp-w" style="width:64px;">
                <span class="cet-prop-label">H</span>
                <input type="number" class="cet-prop-input" id="cpp-h" style="width:64px;">
            </div>
            <div class="cet-prop-row">
                <span class="cet-prop-label">Opacidad</span>
                <input type="range" class="cet-range" id="cpp-opacity" min="0" max="1" step="0.01" value="1">
                <span class="cet-range-val" id="cpp-opacity-val">100%</span>
            </div>
            <div class="cet-prop-row">
                <span class="cet-prop-label">Rotación</span>
                <input type="number" class="cet-prop-input" id="cpp-rotation" placeholder="0" style="width:64px;">
                <span style="font-size:10px;color:#333;font-family:monospace;"> °</span>
            </div>

            <!-- TEXT section -->
            <div id="cpp-text-section" style="display:none;">
                <div class="cet-prop-section" style="margin-top:10px;">Texto</div>
                <div class="cet-prop-row">
                    <span class="cet-prop-label">Color</span>
                    <div class="cet-prop-color-wrap">
                        <div class="cet-color-swatch" id="cpp-color-swatch" style="background:#ffffff;"></div>
                        <input type="color" class="cet-color-native" id="cpp-color-native" value="#ffffff">
                    </div>
                    <input type="text" class="cet-prop-input" id="cpp-color-hex" placeholder="#ffffff" style="width:80px;font-family:monospace;">
                </div>
                <div class="cet-prop-row">
                    <span class="cet-prop-label">Fuente</span>
                    <select class="cet-prop-select" id="cpp-font">
                        <option value="BlackOpsOne">BlackOpsOne</option>
                        <option value="MPLUS Code Latin">MPLUS Code Latin</option>
                        <option value="CODE Bold">CODE Bold</option>
                        <option value="JetBrains Mono">JetBrains Mono</option>
                        <option value="NewComicTitle">NewComicTitle</option>
                    </select>
                </div>
                <div class="cet-prop-row">
                    <span class="cet-prop-label">Tamaño</span>
                    <input type="number" class="cet-prop-input" id="cpp-fontsize" placeholder="80" style="width:64px;">
                    <span class="cet-prop-label">Peso</span>
                    <select class="cet-prop-select" id="cpp-weight" style="width:90px;">
                        <option value="400">Regular</option>
                        <option value="500">Medium</option>
                        <option value="600">SemiBold</option>
                        <option value="700">Bold</option>
                        <option value="800">ExtraBold</option>
                        <option value="900">Black</option>
                    </select>
                </div>
                <div class="cet-prop-row">
                    <span class="cet-prop-label">Alineación</span>
                    <button class="cet-prop-btn" id="cpp-align-left" title="Izquierda"><span class="material-icons">format_align_left</span></button>
                    <button class="cet-prop-btn" id="cpp-align-center" title="Centro"><span class="material-icons">format_align_center</span></button>
                    <button class="cet-prop-btn" id="cpp-align-right" title="Derecha"><span class="material-icons">format_align_right</span></button>
                    <button class="cet-prop-btn" id="cpp-align-justify" title="Justificar"><span class="material-icons">format_align_justify</span></button>
                </div>
                <div class="cet-prop-row">
                    <span class="cet-prop-label">Interlinea</span>
                    <input type="number" class="cet-prop-input" id="cpp-lineheight" placeholder="1.5" step="0.1" style="width:64px;">
                </div>
            </div>

            <!-- ELEMENT COLOR section -->
            <div id="cpp-el-color-section" style="display:none;">
                <div class="cet-prop-section" style="margin-top:10px;">Color Elemento</div>
                <div class="cet-prop-row">
                    <span class="cet-prop-label">Relleno</span>
                    <div class="cet-prop-color-wrap">
                        <div class="cet-color-swatch" id="cpp-fill-swatch" style="background:#0a0a0c;"></div>
                        <input type="color" class="cet-color-native" id="cpp-fill-native" value="#0a0a0c">
                    </div>
                    <input type="text" class="cet-prop-input" id="cpp-fill-hex" placeholder="#0a0a0c" style="width:80px;font-family:monospace;">
                </div>
                <div class="cet-prop-row">
                    <span class="cet-prop-label">Acento</span>
                    <div class="cet-prop-color-wrap">
                        <div class="cet-color-swatch" id="cpp-accent-swatch" style="background:#00D9FF;"></div>
                        <input type="color" class="cet-color-native" id="cpp-accent-native" value="#00D9FF">
                    </div>
                    <input type="text" class="cet-prop-input" id="cpp-accent-hex" placeholder="#00D9FF" style="width:80px;font-family:monospace;">
                </div>
                <div class="cet-prop-row">
                    <span class="cet-prop-label">Radio</span>
                    <input type="number" class="cet-prop-input" id="cpp-radius" placeholder="16" style="width:64px;">
                </div>
            </div>

            <!-- LAYER ACTIONS -->
            <div class="cet-prop-section" style="margin-top:10px;">Capa</div>
            <div class="cet-prop-btn-row">
                <button class="cet-prop-btn" id="cpp-front" title="Frente"><span class="material-icons">flip_to_front</span></button>
                <button class="cet-prop-btn" id="cpp-fwd" title="Subir"><span class="material-icons">keyboard_arrow_up</span></button>
                <button class="cet-prop-btn" id="cpp-bwd" title="Bajar"><span class="material-icons">keyboard_arrow_down</span></button>
                <button class="cet-prop-btn" id="cpp-back" title="Fondo"><span class="material-icons">flip_to_back</span></button>
                <button class="cet-prop-btn" id="cpp-lock" title="Bloquear"><span class="material-icons">lock</span></button>
                <button class="cet-prop-btn" id="cpp-hide" title="Ocultar"><span class="material-icons">visibility_off</span></button>
                <button class="cet-prop-btn" id="cpp-del" title="Eliminar" style="color:#FF3366;"><span class="material-icons">delete</span></button>
            </div>

            <div class="cet-type-label" id="cpp-type-label">— ningún elemento —</div>
        `;

        document.body.appendChild(panel);
        this._propPanel = panel;
        this._attachPropListeners();
    }

    _attachPropListeners() {
        const pp = this._propPanel;
        const q = (id) => pp.querySelector('#' + id);
        const on = (id, ev, fn) => { const el = q(id); if (el) el.addEventListener(ev, fn); };
        const clk = (id, fn) => on(id, 'click', fn);

        // Position
        const applyPos = () => {
            const layer = this._getSelectedLayer(); if (!layer) return;
            const x = parseInt(q('cpp-x').value), y = parseInt(q('cpp-y').value);
            if (!isNaN(x)) layer.x = x;
            if (!isNaN(y)) layer.y = y;
            layer._freeMove = true;
            this._commitPropChange();
        };
        on('cpp-x', 'change', applyPos);
        on('cpp-y', 'change', applyPos);

        // Size
        const applySize = () => {
            const layer = this._getSelectedLayer(); if (!layer) return;
            const w = parseInt(q('cpp-w').value), h = parseInt(q('cpp-h').value);
            if (!isNaN(w) && w > 0) layer.width = w;
            if (!isNaN(h) && h > 0) layer.height = h;
            layer._userResized = true;
            layer._freeMove = true;
            this._commitPropChange();
        };
        on('cpp-w', 'change', applySize);
        on('cpp-h', 'change', applySize);

        // Opacity
        on('cpp-opacity', 'input', (e) => {
            const layer = this._getSelectedLayer(); if (!layer) return;
            layer.opacity = parseFloat(e.target.value);
            q('cpp-opacity-val').textContent = Math.round(layer.opacity * 100) + '%';
            this._commitPropChange();
        });

        // Rotation
        on('cpp-rotation', 'change', (e) => {
            const layer = this._getSelectedLayer(); if (!layer) return;
            layer._rotation = parseFloat(e.target.value) || 0;
            layer._freeMove = true;
            this._commitPropChange();
        });

        // Text color (native picker)
        on('cpp-color-native', 'input', (e) => {
            q('cpp-color-swatch').style.background = e.target.value;
            q('cpp-color-hex').value = e.target.value;
            const layer = this._getSelectedLayer();
            if (layer) { layer.color = e.target.value; this._commitPropChange(); }
        });

        // Text color (hex input)
        on('cpp-color-hex', 'change', (e) => {
            const v = this._normalizeHex(e.target.value);
            if (!v) return;
            q('cpp-color-swatch').style.background = v;
            try { q('cpp-color-native').value = v; } catch (_) { }
            const layer = this._getSelectedLayer();
            if (layer) { layer.color = v; this._commitPropChange(); }
        });

        // Text color swatch click → open native picker
        clk('cpp-color-swatch', () => q('cpp-color-native')?.click());

        // Font family
        on('cpp-font', 'change', (e) => {
            const layer = this._getSelectedLayer();
            if (!layer) return;
            if (!layer.font) layer.font = {};
            layer.font.family = e.target.value;
            this._commitPropChange();
        });

        // Font size
        on('cpp-fontsize', 'change', (e) => {
            const layer = this._getSelectedLayer();
            if (!layer || !layer.font) return;
            const sz = parseInt(e.target.value);
            if (!isNaN(sz) && sz > 0) layer.font.size = Math.max(8, Math.min(500, sz));
            this._commitPropChange();
        });

        // Font weight
        on('cpp-weight', 'change', (e) => {
            const layer = this._getSelectedLayer();
            if (!layer?.font) return;
            layer.font.weight = parseInt(e.target.value);
            this._commitPropChange();
        });

        // Text align
        ['left', 'center', 'right', 'justify'].forEach(align => {
            clk(`cpp-align-${align}`, () => {
                const layer = this._getSelectedLayer();
                if (layer && layer.type === 'text') { layer.align = align; this._commitPropChange(); }
            });
        });

        // Line height
        on('cpp-lineheight', 'change', (e) => {
            const layer = this._getSelectedLayer();
            if (!layer) return;
            const lh = parseFloat(e.target.value);
            if (!isNaN(lh) && lh > 0) layer.lineHeight = lh;
            this._commitPropChange();
        });

        // Fill color (native)
        on('cpp-fill-native', 'input', (e) => {
            q('cpp-fill-swatch').style.background = e.target.value;
            q('cpp-fill-hex').value = e.target.value;
            const layer = this._getSelectedLayer();
            if (layer) { layer.fill = e.target.value; this._commitPropChange(); }
        });

        // Fill color (hex)
        on('cpp-fill-hex', 'change', (e) => {
            const v = this._normalizeHex(e.target.value);
            if (!v) return;
            q('cpp-fill-swatch').style.background = v;
            try { q('cpp-fill-native').value = v; } catch (_) { }
            const layer = this._getSelectedLayer();
            if (layer) { layer.fill = v; this._commitPropChange(); }
        });
        clk('cpp-fill-swatch', () => q('cpp-fill-native')?.click());

        // Accent color (native)
        on('cpp-accent-native', 'input', (e) => {
            q('cpp-accent-swatch').style.background = e.target.value;
            q('cpp-accent-hex').value = e.target.value;
            const layer = this._getSelectedLayer();
            if (layer) { layer.accentColor = e.target.value; this._commitPropChange(); }
        });

        // Accent color (hex)
        on('cpp-accent-hex', 'change', (e) => {
            const v = this._normalizeHex(e.target.value);
            if (!v) return;
            q('cpp-accent-swatch').style.background = v;
            try { q('cpp-accent-native').value = v; } catch (_) { }
            const layer = this._getSelectedLayer();
            if (layer) { layer.accentColor = v; this._commitPropChange(); }
        });
        clk('cpp-accent-swatch', () => q('cpp-accent-native')?.click());

        // Border radius
        on('cpp-radius', 'change', (e) => {
            const layer = this._getSelectedLayer(); if (!layer) return;
            const r = parseInt(e.target.value);
            if (!isNaN(r)) layer.radius = Math.max(0, r);
            this._commitPropChange();
        });

        // Layer actions
        clk('cpp-front', () => { this.editor.bringToFront?.(); this._updatePropPanel(); });
        clk('cpp-fwd', () => { this.editor.bringForward?.(); this._updatePropPanel(); });
        clk('cpp-bwd', () => { this.editor.sendBackward?.(); this._updatePropPanel(); });
        clk('cpp-back', () => { this.editor.sendToBack?.(); this._updatePropPanel(); });
        clk('cpp-lock', () => { this.editor.toggleLock?.(); this._updatePropPanel(); });
        clk('cpp-hide', () => { this.editor.toggleVisible?.(); this._updatePropPanel(); });
        clk('cpp-del', () => this.deleteSelected());
    }

    _updatePropPanel() {
        const pp = this._propPanel;
        if (!pp || !pp.classList.contains('visible')) return;
        const q = (id) => pp.querySelector('#' + id);

        const layer = this._getSelectedLayer();
        if (!layer) {
            q('cpp-type-label').textContent = '— ningún elemento seleccionado —';
            q('cpp-text-section').style.display = 'none';
            q('cpp-el-color-section').style.display = 'none';
            return;
        }

        q('cpp-type-label').textContent = `TYPE: ${(layer.type || '?').toUpperCase()}  ${layer.id ? '| ID: ' + layer.id : ''}`;

        // Position / Size from bounding box if available
        const box = this.editor.editableLayers?.[this.editor.selectedIdx];
        if (box) {
            const setIfBlur = (id, v) => { const el = q(id); if (el && document.activeElement !== el) el.value = Math.round(v); };
            setIfBlur('cpp-x', box.x ?? layer.x ?? 0);
            setIfBlur('cpp-y', box.y ?? layer.y ?? 0);
            setIfBlur('cpp-w', box.width ?? layer.width ?? 0);
            setIfBlur('cpp-h', box.height ?? layer.height ?? 0);
        }

        // Opacity
        const op = layer.opacity !== undefined ? layer.opacity : 1;
        q('cpp-opacity').value = op;
        q('cpp-opacity-val').textContent = Math.round(op * 100) + '%';

        // Rotation
        const rotEl = q('cpp-rotation');
        if (rotEl && document.activeElement !== rotEl)
            rotEl.value = Math.round(layer._rotation || 0);

        // Text section
        const isText = layer.type === 'text';
        q('cpp-text-section').style.display = isText ? 'block' : 'none';
        if (isText) {
            const hex = this._toHex(layer.color);
            q('cpp-color-swatch').style.background = hex;
            try { q('cpp-color-native').value = hex; } catch (_) { }
            if (document.activeElement !== q('cpp-color-hex')) q('cpp-color-hex').value = hex;

            const fontEl = q('cpp-font');
            if (fontEl && layer.font?.family) {
                const opt = fontEl.querySelector(`option[value="${layer.font.family}"]`);
                if (opt) fontEl.value = layer.font.family;
            }
            if (layer.font?.size && document.activeElement !== q('cpp-fontsize'))
                q('cpp-fontsize').value = layer.font.size;
            if (layer.font?.weight && document.activeElement !== q('cpp-weight'))
                q('cpp-weight').value = String(layer.font.weight);

            if (layer.lineHeight && document.activeElement !== q('cpp-lineheight'))
                q('cpp-lineheight').value = layer.lineHeight;
        }

        // Element color section
        const hasColor = !isText && (layer.fill !== undefined || layer.accentColor !== undefined || layer.color !== undefined);
        q('cpp-el-color-section').style.display = hasColor ? 'block' : 'none';
        if (hasColor) {
            const fillHex = this._toHex(layer.fill || '#0a0a0c');
            const accentHex = this._toHex(layer.accentColor || layer.color || '#00D9FF');
            q('cpp-fill-swatch').style.background = fillHex;
            q('cpp-accent-swatch').style.background = accentHex;
            if (document.activeElement !== q('cpp-fill-hex')) q('cpp-fill-hex').value = layer.fill || '';
            if (document.activeElement !== q('cpp-accent-hex')) q('cpp-accent-hex').value = layer.accentColor || layer.color || '';
            try { q('cpp-fill-native').value = fillHex; q('cpp-accent-native').value = accentHex; } catch (_) { }
            if (layer.radius !== undefined && document.activeElement !== q('cpp-radius'))
                q('cpp-radius').value = layer.radius;
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // THEME PANEL
    // ═════════════════════════════════════════════════════════════════════
    _buildThemePanel() {
        const THEMES = [
            { id: 'cyber', name: '⚡ Cyber', colors: ['#00D9FF', '#A855F7', '#030303'] },
            { id: 'hacker', name: '💚 Hacker', colors: ['#00FF41', '#FF00FF', '#000000'] },
            { id: 'minimal', name: '🔵 Minimal', colors: ['#3B82F6', '#8B5CF6', '#111111'] },
            { id: 'RED_TEAM', name: '🔴 Red Team', colors: ['#FF0000', '#FF6600', '#030303'] },
            { id: 'BLUE_TEAM', name: '💙 Blue Team', colors: ['#0088FF', '#00CCFF', '#030308'] },
            { id: 'OSINT', name: '🟣 OSINT', colors: ['#D946EF', '#A855F7', '#030303'] },
        ];

        // Custom colors start as copies of the active theme
        this._customColors = {
            primary: '#00D9FF',
            accent: '#A855F7',
            bg: '#030303',
        };

        const panel = document.createElement('div');
        panel.className = 'cet-theme-panel';
        panel.id = 'cet-theme-panel-' + this.mode;

        const dotsHTML = (colors) => colors.map(c =>
            `<div class="cet-theme-dot" style="background:${c};"></div>`
        ).join('');

        panel.innerHTML = `
            <div class="cet-theme-title">Tema Visual</div>
            <div class="cet-theme-grid">
                ${THEMES.map(t => `
                    <button class="cet-theme-btn" data-theme="${t.id}" id="cet-theme-${t.id}-${this.mode}">
                        <div class="cet-theme-dots">${dotsHTML(t.colors)}</div>
                        <span class="cet-theme-name">${t.name}</span>
                    </button>
                `).join('')}
            </div>

            <div class="cet-theme-divider"></div>
            <div class="cet-theme-title" style="margin-top:8px;">🎨 Colores Personalizados</div>
            <div class="cet-custom-colors-grid">
                <div class="cet-custom-color-row">
                    <label class="cet-custom-label">Primario</label>
                    <div class="cet-custom-swatch" id="cet-custom-primary-swatch-${this.mode}" style="background:#00D9FF;"></div>
                    <input type="color" class="cet-color-native" id="cet-custom-primary-${this.mode}" value="#00D9FF">
                    <input type="text" class="cet-custom-hex" id="cet-custom-primary-hex-${this.mode}" value="#00D9FF" placeholder="#00D9FF">
                </div>
                <div class="cet-custom-color-row">
                    <label class="cet-custom-label">Acento</label>
                    <div class="cet-custom-swatch" id="cet-custom-accent-swatch-${this.mode}" style="background:#A855F7;"></div>
                    <input type="color" class="cet-color-native" id="cet-custom-accent-${this.mode}" value="#A855F7">
                    <input type="text" class="cet-custom-hex" id="cet-custom-accent-hex-${this.mode}" value="#A855F7" placeholder="#A855F7">
                </div>
                <div class="cet-custom-color-row">
                    <label class="cet-custom-label">Fondo</label>
                    <div class="cet-custom-swatch" id="cet-custom-bg-swatch-${this.mode}" style="background:#030303;"></div>
                    <input type="color" class="cet-color-native" id="cet-custom-bg-${this.mode}" value="#030303">
                    <input type="text" class="cet-custom-hex" id="cet-custom-bg-hex-${this.mode}" value="#030303" placeholder="#030303">
                </div>
            </div>
            <button class="cet-apply-btn" id="cet-custom-apply-${this.mode}" style="margin-top:8px;">✓ APLICAR COLORES CUSTOM</button>
        `;

        document.body.appendChild(panel);
        this._themePanel = panel;
        this._themeList = THEMES;

        // ── Preset theme buttons ──────────────────────────────────────────
        THEMES.forEach(t => {
            const btn = panel.querySelector(`#cet-theme-${t.id}-${this.mode}`);
            if (!btn) return;
            btn.addEventListener('click', () => {
                this._applyTheme(t.id);
                this._highlightActiveTheme();
                // Sync custom color pickers to this theme's colors
                const [p, a, b] = t.colors;
                this._setCustomColorUI('primary', p);
                this._setCustomColorUI('accent', a);
                this._setCustomColorUI('bg', b);
                panel.classList.remove('visible');
                this._widget?.querySelectorAll('.cet-btn').forEach(b => b.classList.remove('active'));
            });
        });

        // ── Custom color pickers ─────────────────────────────────────────
        const bindColorPicker = (key) => {
            const nativeEl = panel.querySelector(`#cet-custom-${key}-${this.mode}`);
            const hexEl = panel.querySelector(`#cet-custom-${key}-hex-${this.mode}`);
            const swatchEl = panel.querySelector(`#cet-custom-${key}-swatch-${this.mode}`);
            if (!nativeEl || !hexEl || !swatchEl) return;

            swatchEl.addEventListener('click', () => nativeEl.click());

            nativeEl.addEventListener('input', (e) => {
                const c = e.target.value;
                this._customColors[key] = c;
                swatchEl.style.background = c;
                hexEl.value = c;
            });

            hexEl.addEventListener('change', (e) => {
                const c = this._normalizeHex(e.target.value);
                if (!c) return;
                this._customColors[key] = c;
                swatchEl.style.background = c;
                try { nativeEl.value = c; } catch (_) { }
            });
        };

        bindColorPicker('primary');
        bindColorPicker('accent');
        bindColorPicker('bg');

        // ── Apply custom colors button ────────────────────────────────────
        const applyBtn = panel.querySelector(`#cet-custom-apply-${this.mode}`);
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this._applyCustomColors(
                    this._customColors.primary,
                    this._customColors.accent,
                    this._customColors.bg
                );
                panel.classList.remove('visible');
                this._widget?.querySelectorAll('.cet-btn').forEach(b => b.classList.remove('active'));
            });
        }
    }

    /**
     * Update a custom color picker's UI (swatch + hex + native).
     */
    _setCustomColorUI(key, color) {
        if (!this._themePanel) return;
        const m = this.mode;
        const swatchEl = this._themePanel.querySelector(`#cet-custom-${key}-swatch-${m}`);
        const hexEl = this._themePanel.querySelector(`#cet-custom-${key}-hex-${m}`);
        const nativeEl = this._themePanel.querySelector(`#cet-custom-${key}-${m}`);
        if (swatchEl) swatchEl.style.background = color;
        if (hexEl) hexEl.value = color;
        try { if (nativeEl) nativeEl.value = color; } catch (_) { }
        if (this._customColors) this._customColors[key] = color;
    }

    /**
     * Apply fully custom primary/accent/bg colors to the current sceneGraph.
     * Walks all layers and replaces theme colors.
     */
    _applyCustomColors(primary, accent, bg) {
        if (!this.editor?.sceneGraph) return;
        const sg = this.editor.sceneGraph;

        // Mark as custom theme
        this._activeTheme = 'custom';
        sg.theme = 'custom';

        // Register the custom theme in BrandingSystem so _getThemeColor() uses it
        const customTheme = {
            name: 'Custom',
            colors: {
                primary: primary,
                accent: accent,
                warning: '#FFD700',
                success: '#00FF88',
                danger: '#FF3366',
                bg: bg,
                cardBg: bg,
                text: '#f0f0f0',
                textMuted: '#94a3b8'
            },
            fonts: { title: 'BlackOpsOne', body: 'MPLUS Code Latin', mono: 'JetBrains Mono' },
            background: { fill: bg, pattern: null, opacity: 1.0 },
            brand: { name: 'KR-CLIDN', logo: './assets/kr-clidn-logo.png', badge: 'CUSTOM' }
        };

        if (window.brandingInstance) {
            window.brandingInstance.registerTheme('custom', customTheme);
            window.brandingInstance.setTheme('custom');
        }
        if (this.editor?.renderer) {
            this.editor.renderer._activeThemeName = 'custom';
            if (this.editor.renderer.brandingSystem) {
                this.editor.renderer.brandingSystem.registerTheme('custom', customTheme);
                this.editor.renderer.brandingSystem.setTheme('custom');
            }
        }

        // Walk layers and replace colors
        const replaceLayers = (layers) => {
            if (!Array.isArray(layers)) return;
            layers.forEach(layer => {
                if (!layer) return;
                // Background layer
                if (layer.type === 'background' && bg) {
                    layer.fill = bg;
                }
                // Primary color properties
                if (layer.accentColor) layer.accentColor = primary;
                if (layer.color && layer.type !== 'background') {
                    // Only replace if it was a "theme" color (not white/black text)
                    const isThemeColor = [
                        '#00D9FF', '#00FF41', '#3B82F6', '#FF0000', '#0088FF', '#D946EF',
                        '#A855F7', '#FF00FF', '#8B5CF6', '#FF6600', '#00CCFF',
                    ].some(tc => layer.color?.toLowerCase() === tc.toLowerCase());
                    if (isThemeColor) layer.color = primary;
                }
                // Border / accent colors
                if (layer.border?.color) layer.border.color = primary + '66';
                if (layer.data?.color) layer.data.color = primary;
                // Nested layers
                if (layer.layers) replaceLayers(layer.layers);
            });
        };

        replaceLayers(sg.layers);

        // Apply bg to background layer specifically
        const bgLayer = sg.layers?.find(l => l.type === 'background');
        if (bgLayer && bg) bgLayer.fill = bg;

        this._commitChange();
        this._setStatus(`CUSTOM: ${primary}`, true);
        setTimeout(() => this._setStatus('LISTO', false), 2000);
    }

    _highlightActiveTheme() {
        if (!this._themePanel) return;
        this._themePanel.querySelectorAll('.cet-theme-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.theme === this._activeTheme);
        });
    }

    _applyTheme(themeId) {
        this._activeTheme = themeId;

        // 1. Set theme on BrandingSystem singleton
        if (window.brandingInstance?.setTheme) {
            window.brandingInstance.setTheme(themeId);
        }

        // 2. Set theme on the renderer directly (_activeThemeName is what render() reads)
        if (this.editor?.renderer) {
            this.editor.renderer._activeThemeName = themeId;
            if (this.editor.renderer.brandingSystem?.setTheme) {
                this.editor.renderer.brandingSystem.setTheme(themeId);
            }
        }

        // 3. Delegate to app.handleThemeChange for full multi-slide theme application
        //    This replaces var(--primary) tokens AND re-renders all slides
        if (window.app?.handleThemeChange) {
            window.app.handleThemeChange(themeId);
        } else {
            // Fallback: manual apply if app.handleThemeChange not available
            if (this.options.onThemeChange) {
                this.options.onThemeChange(themeId);
            }
            if (this.editor?.sceneGraph) {
                this.editor.sceneGraph.theme = themeId;
                this._commitChange();
            }
        }

        this._setStatus(`TEMA: ${themeId.toUpperCase()}`, true);
        setTimeout(() => this._setStatus('LISTO', false), 2000);
    }

    // ═════════════════════════════════════════════════════════════════════
    // ADVANCED COLOR PANEL
    // ═════════════════════════════════════════════════════════════════════
    _buildColorPanel() {
        // Preset palette — covers all theme colors + common web colors
        const PRESETS = [
            '#00D9FF', '#A855F7', '#00FF88', '#FF3366', '#FF9500', '#FFD700',
            '#00FF41', '#FF00FF', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444',
            '#FF0000', '#FF6600', '#0088FF', '#00CCFF', '#D946EF', '#F59E0B',
            '#ffffff', '#f0f0f0', '#94a3b8', '#444444', '#1a1a2a', '#0a0a0c',
            '#030303', '#000000', '#ffff00', '#00ffff', '#ff00ff', '#cc0000',
        ];

        const panel = document.createElement('div');
        panel.className = 'cet-color-panel';
        panel.id = 'cet-color-panel-' + this.mode;

        panel.innerHTML = `
            <div class="cet-theme-title" style="margin-bottom:8px;">Selector de Color</div>

            <!-- Native big picker -->
            <input type="color" class="cet-color-native-big" id="ccp-native" value="#00D9FF">

            <!-- Hex input -->
            <input type="text" class="cet-color-hex-input" id="ccp-hex" placeholder="#00D9FF">

            <!-- Preset colors -->
            <div class="cet-color-presets" id="ccp-presets">
                ${PRESETS.map(c =>
            `<div class="cet-color-preset" data-color="${c}" style="background:${c};" title="${c}"></div>`
        ).join('')}
            </div>

            <!-- Target selector (which property to apply to) -->
            <div style="font-size:9px;color:#333;font-family:monospace;letter-spacing:1px;margin-bottom:6px;">APLICAR EN:</div>
            <div class="cet-color-target-row">
                <button class="cet-color-target-btn active" data-target="auto">AUTO</button>
                <button class="cet-color-target-btn" data-target="color">COLOR</button>
                <button class="cet-color-target-btn" data-target="fill">RELLENO</button>
                <button class="cet-color-target-btn" data-target="accentColor">ACENTO</button>
                <button class="cet-color-target-btn" data-target="background">BG</button>
            </div>

            <button class="cet-apply-btn" id="ccp-apply">✓ APLICAR COLOR</button>
        `;

        document.body.appendChild(panel);
        this._colorPanel = panel;
        this._colorTarget = 'auto';
        this._colorCurrent = '#00D9FF';

        const q = (id) => panel.querySelector('#' + id);
        const on = (id, ev, fn) => { const el = q(id); if (el) el.addEventListener(ev, fn); };

        // Native picker change
        on('ccp-native', 'input', (e) => {
            this._colorCurrent = e.target.value;
            q('ccp-hex').value = e.target.value;
        });

        // Hex input change
        on('ccp-hex', 'change', (e) => {
            const v = this._normalizeHex(e.target.value);
            if (!v) return;
            this._colorCurrent = v;
            try { q('ccp-native').value = v; } catch (_) { }
        });

        // Preset clicks
        panel.querySelectorAll('.cet-color-preset').forEach(el => {
            el.addEventListener('click', () => {
                const c = el.dataset.color;
                this._colorCurrent = c;
                q('ccp-hex').value = c;
                try { q('ccp-native').value = c; } catch (_) { }
            });
        });

        // Target buttons
        panel.querySelectorAll('.cet-color-target-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                panel.querySelectorAll('.cet-color-target-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._colorTarget = btn.dataset.target;
            });
        });

        // Apply button
        on('ccp-apply', 'click', () => {
            this._applyColorToLayer(this._colorCurrent, this._colorTarget);
        });
    }

    _syncColorPanelToSelection() {
        const layer = this._getSelectedLayer();
        if (!layer || !this._colorPanel) return;
        const q = (id) => this._colorPanel.querySelector('#' + id);

        // Pre-fill with layer's primary color
        let currentColor = '#00D9FF';
        if (layer.color) currentColor = this._toHex(layer.color);
        else if (layer.fill) currentColor = this._toHex(layer.fill);
        else if (layer.accentColor) currentColor = this._toHex(layer.accentColor);

        this._colorCurrent = currentColor;
        try { q('ccp-native').value = currentColor; } catch (_) { }
        q('ccp-hex').value = currentColor;
    }

    _applyColorToLayer(color, target) {
        if (!color) return;

        const hex = this._normalizeHex(color) || color;
        const t = target || 'auto';

        // Background target works without layer selection
        if (t === 'background') {
            if (this.editor?.sceneGraph) {
                const bgLayer = this.editor.sceneGraph.layers?.find(l => l.type === 'background');
                if (bgLayer) bgLayer.fill = hex;
            }
            this._commitPropChange();
            this._updatePropPanel();
            this._setStatus('Fondo aplicado', true);
            setTimeout(() => this._setStatus('LISTO', false), 1500);
            return;
        }

        // All other targets require a selected layer
        const layer = this._getSelectedLayer();
        if (!layer) {
            this._setStatus('Selecciona un elemento primero', true);
            setTimeout(() => this._setStatus('LISTO', false), 1500);
            return;
        }

        if (t === 'auto') {
            // Smart: apply to the most relevant property
            if (layer.type === 'text') layer.color = hex;
            else if (layer.fill !== undefined) layer.fill = hex;
            else if (layer.accentColor !== undefined) layer.accentColor = hex;
            else if (layer.color !== undefined) layer.color = hex;
        } else {
            layer[t] = hex;
        }

        this._commitPropChange();
        // Sync prop panel swatch if visible
        this._updatePropPanel();
        this._setStatus('Color aplicado', true);
        setTimeout(() => this._setStatus('LISTO', false), 1500);
    }

    // ═════════════════════════════════════════════════════════════════════
    // ICON PICKER
    // ═════════════════════════════════════════════════════════════════════
    _buildIconPicker() {
        const ICONS = [
            'security', 'lock', 'vpn_key', 'shield', 'bug_report', 'warning', 'error',
            'computer', 'dns', 'router', 'storage', 'cloud', 'cloud_upload', 'cloud_download',
            'terminal', 'code', 'data_object', 'api', 'settings', 'build', 'construction',
            'search', 'explore', 'visibility', 'visibility_off', 'wifi', 'bluetooth',
            'network_check', 'lan', 'hub', 'devices', 'smartphone', 'laptop', 'desktop_windows',
            'person', 'group', 'admin_panel_settings', 'manage_accounts', 'badge',
            'fingerprint', 'face', 'supervised_user_circle', 'account_circle',
            'send', 'email', 'message', 'chat', 'forum', 'notifications', 'inbox',
            'public', 'language', 'map', 'location_on', 'place', 'travel_explore', 'gps_fixed',
            'analytics', 'bar_chart', 'pie_chart', 'show_chart', 'trending_up', 'insights',
            'attach_money', 'payments', 'account_balance', 'credit_card', 'receipt',
            'school', 'library_books', 'science', 'biotech', 'psychology', 'memory',
            'flash_on', 'bolt', 'power', 'battery_full', 'speed', 'timer',
            'check_circle', 'cancel', 'info', 'help', 'report_problem', 'new_releases',
            'star', 'favorite', 'bookmark', 'thumb_up', 'celebration', 'emoji_events',
            'download', 'upload', 'sync', 'refresh', 'cached', 'autorenew',
            'edit', 'create', 'delete', 'content_copy', 'content_paste', 'undo',
            'add', 'remove', 'close', 'menu', 'more_vert', 'more_horiz',
            'arrow_forward', 'arrow_back', 'arrow_upward', 'arrow_downward',
            'home', 'dashboard', 'apps', 'grid_view', 'view_list', 'view_module',
            'image', 'photo', 'camera', 'movie', 'music_note', 'mic',
            'folder', 'folder_open', 'file_present', 'description', 'article',
            'schedule', 'access_time', 'calendar_today', 'event', 'history',
            'dark_mode', 'light_mode', 'palette', 'design_services', 'auto_awesome',
            'rocket_launch', 'satellite', 'sensors', 'radar',
            'lock_open', 'no_encryption', 'policy', 'verified_user', 'gpp_maybe',
            'key', 'password', 'token', 'encrypted',
            'cloud_sync', 'https', 'vpn_lock', 'firewall', 'security_update',
            'psychology', 'biotech', 'science', 'engineering', 'precision_manufacturing',
        ];

        const picker = document.createElement('div');
        picker.className = 'cet-icon-picker';
        picker.id = 'cet-icon-picker-' + this.mode;
        picker.innerHTML = `
            <input type="text" class="cet-icon-search" id="cet-icon-search-${this.mode}"
                placeholder="Buscar icono... (ej: lock, cloud, code)">
            <div class="cet-icon-grid" id="cet-icon-grid-${this.mode}"></div>
        `;

        document.body.appendChild(picker);
        this._iconPicker = picker;

        const searchEl = picker.querySelector(`#cet-icon-search-${this.mode}`);
        const gridEl = picker.querySelector(`#cet-icon-grid-${this.mode}`);

        const renderIcons = (filter = '') => {
            const list = filter
                ? ICONS.filter(ic => ic.includes(filter.toLowerCase()))
                : ICONS;
            gridEl.innerHTML = list.map(ic =>
                `<div class="cet-icon-item" data-icon="${ic}" title="${ic}">
                    <span class="material-icons">${ic}</span>
                </div>`
            ).join('');
            gridEl.querySelectorAll('.cet-icon-item').forEach(item => {
                item.onclick = () => {
                    this._addIconLayer(item.dataset.icon);
                    picker.classList.remove('visible');
                };
            });
        };

        renderIcons();
        searchEl.addEventListener('input', (e) => renderIcons(e.target.value));

        document.addEventListener('mousedown', (e) => {
            if (!picker.contains(e.target) && !e.target.closest(`#cet-add-icon-${this.mode}`))
                picker.classList.remove('visible');
        });
    }

    // ═════════════════════════════════════════════════════════════════════
    // CONTEXT MENU
    // ═════════════════════════════════════════════════════════════════════
    _buildContextMenu() {
        const menu = document.createElement('div');
        menu.className = 'cet-ctx-menu';
        menu.id = 'cet-ctx-' + this.mode;
        menu.innerHTML = `
            <div class="cet-ctx-item" id="cet-ctx-copy">
                <span class="material-icons">content_copy</span>Copiar
            </div>
            <div class="cet-ctx-item" id="cet-ctx-paste">
                <span class="material-icons">content_paste</span>Pegar aquí
            </div>
            <div class="cet-ctx-item" id="cet-ctx-dup">
                <span class="material-icons">copy_all</span>Duplicar
            </div>
            <div class="cet-ctx-sep"></div>
            <div class="cet-ctx-item" id="cet-ctx-front">
                <span class="material-icons">flip_to_front</span>Traer al frente
            </div>
            <div class="cet-ctx-item" id="cet-ctx-back">
                <span class="material-icons">flip_to_back</span>Enviar al fondo
            </div>
            <div class="cet-ctx-sep"></div>
            <div class="cet-ctx-item" id="cet-ctx-lock">
                <span class="material-icons">lock</span>Bloquear
            </div>
            <div class="cet-ctx-item" id="cet-ctx-hide">
                <span class="material-icons">visibility_off</span>Ocultar
            </div>
            <div class="cet-ctx-sep"></div>
            <div class="cet-ctx-item danger" id="cet-ctx-del">
                <span class="material-icons">delete</span>Eliminar
            </div>
        `;

        document.body.appendChild(menu);
        this._ctxMenu = menu;

        const b = (id, fn) => {
            const el = menu.querySelector('#' + id);
            if (el) el.onclick = fn;
        };
        b('cet-ctx-copy', () => { this.copySelected(); this._hideCtxMenu(); });
        b('cet-ctx-paste', () => { this._pasteAtCtxPos(); this._hideCtxMenu(); });
        b('cet-ctx-dup', () => { this.duplicateSelected(); this._hideCtxMenu(); });
        b('cet-ctx-front', () => { this.editor.bringToFront?.(); this._hideCtxMenu(); });
        b('cet-ctx-back', () => { this.editor.sendToBack?.(); this._hideCtxMenu(); });
        b('cet-ctx-lock', () => { this.editor.toggleLock?.(); this._hideCtxMenu(); });
        b('cet-ctx-hide', () => { this.editor.toggleVisible?.(); this._hideCtxMenu(); });
        b('cet-ctx-del', () => { this.deleteSelected(); this._hideCtxMenu(); });

        document.addEventListener('mousedown', (e) => {
            if (!menu.contains(e.target)) this._hideCtxMenu();
        });
    }

    _onEditorContextMenu(e) {
        const { clientX, clientY, layerIdx } = e.detail;
        if (typeof layerIdx === 'number' && layerIdx >= 0) {
            this.editor.selectedIdx = layerIdx;
            this.editor._drawOverlay?.();
        }
        this._ctxLastX = e.detail.canvasX;
        this._ctxLastY = e.detail.canvasY;
        const menu = this._ctxMenu;
        if (!menu) return;
        menu.style.left = clientX + 'px';
        menu.style.top = clientY + 'px';
        menu.classList.add('visible');
        requestAnimationFrame(() => {
            const r = menu.getBoundingClientRect();
            if (r.right > window.innerWidth) menu.style.left = (clientX - r.width) + 'px';
            if (r.bottom > window.innerHeight) menu.style.top = (clientY - r.height) + 'px';
        });
    }

    _hideCtxMenu() { this._ctxMenu?.classList.remove('visible'); }

    _pasteAtCtxPos() {
        if (!this._clipboard || !this.editor.sceneGraph) return;
        const clone = JSON.parse(JSON.stringify(this._clipboard));
        clone.id = 'layer_' + Math.random().toString(36).substr(2, 9);
        if (this._ctxLastX !== undefined) {
            clone.x = Math.round(this._ctxLastX - (clone.width || 200) / 2);
            clone.y = Math.round(this._ctxLastY - (clone.height || 80) / 2);
        } else {
            clone.x = (clone.x || 0) + 40;
            clone.y = (clone.y || 0) + 40;
        }
        clone._freeMove = true;
        this.editor.sceneGraph.layers.push(clone);
        this._commitChange();
    }

    // ═════════════════════════════════════════════════════════════════════
    // SELECTION UI
    // ═════════════════════════════════════════════════════════════════════
    _updateSelectionUI() {
        if (!this._widget) return;
        const hasSelected = this.editor.selectedIdx >= 0;

        const selectionDeps = [
            `cet-copy-${this.mode}`, `cet-dup-${this.mode}`, `cet-del-${this.mode}`,
            `cet-lyr-front-${this.mode}`, `cet-lyr-fwd-${this.mode}`,
            `cet-lyr-bwd-${this.mode}`, `cet-lyr-back-${this.mode}`,
            `cet-lyr-lock-${this.mode}`, `cet-lyr-hide-${this.mode}`,
            `cet-al-left-${this.mode}`, `cet-al-center-${this.mode}`,
            `cet-al-right-${this.mode}`, `cet-al-top-${this.mode}`,
            `cet-al-mid-${this.mode}`, `cet-al-bot-${this.mode}`,
        ];

        selectionDeps.forEach(id => {
            const btn = this._q(id);
            if (btn) btn.disabled = !hasSelected;
        });

        const pasteBtn = this._q(`cet-paste-${this.mode}`);
        if (pasteBtn) pasteBtn.disabled = !this._clipboard;

        // Sync prop panel if open
        if (this._propPanel?.classList.contains('visible')) {
            this._updatePropPanel();
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // HISTORY
    // ═════════════════════════════════════════════════════════════════════
    pushHistory(sceneGraph) {
        if (!sceneGraph) return;
        const snap = JSON.stringify(sceneGraph);
        if (this._historyIdx >= 0 && this._history[this._historyIdx] === snap) return;
        this._history = this._history.slice(0, this._historyIdx + 1);
        this._history.push(snap);
        if (this._history.length > this._MAX_HISTORY) this._history.shift();
        this._historyIdx = this._history.length - 1;
        this._syncHistoryButtons();
    }

    _pushHistory(sceneGraph) { this.pushHistory(sceneGraph); }

    undo() {
        if (this._historyIdx <= 0) return;
        this._historyIdx--;
        this._restoreHistory();
    }

    redo() {
        if (this._historyIdx >= this._history.length - 1) return;
        this._historyIdx++;
        this._restoreHistory();
    }

    async _restoreHistory() {
        if (this._historyIdx < 0 || this._historyIdx >= this._history.length) return;
        const snapshot = JSON.parse(this._history[this._historyIdx]);
        this._inToolbarCallback = true;
        try {
            await this.editor.load(snapshot);
            this._syncHistoryButtons();
            this._updateSelectionUI();
            this._updatePropPanel();
            if (this.options.onSceneChange) this.options.onSceneChange(snapshot);
        } finally {
            this._inToolbarCallback = false;
        }
    }

    _syncHistoryButtons() {
        const u = this._q(`cet-undo-${this.mode}`);
        const r = this._q(`cet-redo-${this.mode}`);
        if (u) u.disabled = this._historyIdx <= 0;
        if (r) r.disabled = this._historyIdx >= this._history.length - 1;
        if (this.options.onHistoryChange)
            this.options.onHistoryChange(this._historyIdx > 0, this._historyIdx < this._history.length - 1);
    }

    // ═════════════════════════════════════════════════════════════════════
    // CLIPBOARD
    // ═════════════════════════════════════════════════════════════════════
    copySelected() {
        const layer = this._getSelectedLayer(); if (!layer) return;
        this._clipboard = JSON.parse(JSON.stringify(layer));
        const pb = this._q(`cet-paste-${this.mode}`);
        if (pb) pb.disabled = false;
    }

    pasteClipboard() {
        if (!this._clipboard || !this.editor.sceneGraph) return;
        const clone = JSON.parse(JSON.stringify(this._clipboard));
        clone.id = 'layer_' + Math.random().toString(36).substr(2, 9);
        clone.x = (clone.x || 0) + 40;
        clone.y = (clone.y || 0) + 40;
        clone._freeMove = true;
        this.editor.sceneGraph.layers.push(clone);
        this._commitChange();
    }

    duplicateSelected() {
        const layer = this._getSelectedLayer();
        if (!layer || !this.editor.sceneGraph) return;
        const clone = JSON.parse(JSON.stringify(layer));
        clone.id = 'layer_' + Math.random().toString(36).substr(2, 9);
        clone.x = (clone.x || 0) + 40;
        clone.y = (clone.y || 0) + 40;
        clone._freeMove = true;
        this.editor.sceneGraph.layers.push(clone);
        this._commitChange();
    }

    deleteSelected() {
        if (this.editor.selectedIdx < 0 || !this.editor.sceneGraph) return;
        const box = this.editor.editableLayers?.[this.editor.selectedIdx];
        if (!box) return;
        // Protect system layers
        if (['brand', 'swipe', 'page_number', 'background'].includes(box.type || box.layer?.type)) return;
        if (box.locked || box.layer?.locked) return;
        const layerIndex = box.layerIndex ?? this.editor.sceneGraph.layers.indexOf(box.layer);
        if (layerIndex < 0) return;
        this.editor.sceneGraph.layers.splice(layerIndex, 1);
        this.editor.selectedIdx = -1;
        this.editor.selectedIdxs = [];
        this._commitChange();
    }

    // ═════════════════════════════════════════════════════════════════════
    // ADD LAYERS
    // ═════════════════════════════════════════════════════════════════════
    _uid() { return 'layer_' + Math.random().toString(36).substr(2, 9); }

    _canvasSize() {
        return {
            W: this.editor?.renderer?.width || 1080,
            H: this.editor?.renderer?.height || 1920,
        };
    }

    _addTextLayer() {
        if (!this.editor.sceneGraph) return;
        const { W, H } = this._canvasSize();
        const id = this._uid();
        const newLayer = {
            id, type: 'text',
            content: 'Nuevo Texto',
            x: Math.round(W * 0.1), y: Math.round(H * 0.45),
            width: Math.round(W * 0.8),
            font: { family: 'BlackOpsOne', size: 80, weight: 900 },
            color: '#ffffff', align: 'center', _freeMove: true,
        };
        this.editor.sceneGraph.layers.push(newLayer);
        this._commitChange(() => {
            const newIdx = this.editor.editableLayers?.findIndex(b => b.layer?.id === id);
            if (newIdx >= 0) { this.editor.selectedIdx = newIdx; this.editor._drawOverlay?.(); }
        });
    }

    _addRectLayer() {
        if (!this.editor.sceneGraph) return;
        const { W, H } = this._canvasSize();
        this.editor.sceneGraph.layers.push({
            id: this._uid(), type: 'rect',
            x: Math.round(W * 0.1), y: Math.round(H * 0.3),
            width: Math.round(W * 0.8), height: 200,
            fill: '#0a0a0c', border: { color: '#00D9FF44', width: 2 },
            radius: 16, accentColor: '#00D9FF',
            _freeMove: true, _userResized: true,
        });
        this._commitChange();
    }

    _addDividerLayer() {
        if (!this.editor.sceneGraph) return;
        const { W, H } = this._canvasSize();
        this.editor.sceneGraph.layers.push({
            id: this._uid(), type: 'divider',
            x: Math.round(W * 0.05), y: Math.round(H * 0.5),
            width: Math.round(W * 0.9),
            _freeMove: true, _userResized: true,
        });
        this._commitChange();
    }

    _addTerminalLayer() {
        if (!this.editor.sceneGraph) return;
        const { W, H } = this._canvasSize();
        this.editor.sceneGraph.layers.push({
            id: this._uid(), type: 'terminal',
            x: Math.round(W * 0.05), y: Math.round(H * 0.4),
            width: Math.round(W * 0.9),
            command: 'nmap -sV -sC target.example.com',
            output: 'PORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http',
            _freeMove: true,
        });
        this._commitChange();
    }

    _addImageLayer(file) {
        if (!this.editor.sceneGraph) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const { W, H } = this._canvasSize();
            const img = new Image();
            img.onload = () => {
                const aspect = img.width / img.height;
                const w = Math.round(W * 0.8);
                const h = Math.round(w / aspect);
                this.editor.sceneGraph.layers.push({
                    id: this._uid(), type: 'image',
                    src: e.target.result,
                    x: Math.round(W * 0.1), y: Math.round((H - h) / 2),
                    width: w, height: h, opacity: 1,
                    _freeMove: true, _userResized: true,
                });
                this._commitChange();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    _addIconLayer(iconName) {
        if (!this.editor.sceneGraph) return;
        const { W, H } = this._canvasSize();
        this.editor.sceneGraph.layers.push({
            id: this._uid(), type: 'icon',
            icon: iconName,
            x: Math.round(W / 2 - 80), y: Math.round(H / 2 - 80),
            size: 160, color: '#00D9FF',
            _freeMove: true, _userResized: true,
        });
        this._commitChange();
    }

    // ═════════════════════════════════════════════════════════════════════
    // COMMIT
    // ═════════════════════════════════════════════════════════════════════
    async _commitChange(afterRender) {
        if (!this.editor?.sceneGraph) return;
        this._inToolbarCallback = true;
        try {
            // Use load() to re-render — this is the real CanvasEditor API
            if (typeof this.editor.load === 'function') {
                await this.editor.load(this.editor.sceneGraph);
            } else if (typeof this.editor._reRender === 'function') {
                await this.editor._reRender();
            }
            this._pushHistory(this.editor.sceneGraph);
            this._updateSelectionUI();
            this._updatePropPanel();
            if (this.options.onSceneChange) this.options.onSceneChange(this.editor.sceneGraph);
            if (afterRender) afterRender();
        } finally {
            this._inToolbarCallback = false;
        }
    }

    _commitPropChange() {
        if (!this.editor?.sceneGraph) return;
        clearTimeout(this._propDebounce);
        this._propDebounce = setTimeout(async () => {
            this._inToolbarCallback = true;
            try {
                if (typeof this.editor.load === 'function') {
                    await this.editor.load(this.editor.sceneGraph);
                } else if (typeof this.editor._reRender === 'function') {
                    await this.editor._reRender();
                }
                this._pushHistory(this.editor.sceneGraph);
                this._updateSelectionUI();
                this._updatePropPanel();
                if (this.options.onSceneChange) this.options.onSceneChange(this.editor.sceneGraph);
            } finally {
                this._inToolbarCallback = false;
            }
        }, 80);
    }

    // ═════════════════════════════════════════════════════════════════════
    // ZOOM
    // ═════════════════════════════════════════════════════════════════════
    _zoom(delta) {
        if (!this.editor.wrapper) return;
        const cur = this.editor.displayScale || 1;
        const next = Math.max(0.1, Math.min(4, cur + delta));
        this.editor.displayScale = next;
        this.editor.scale = 1 / next;
        this.editor.wrapper.style.transform = `scale(${next})`;
        this.editor.wrapper.style.transformOrigin = 'top left';
        const { W: cW, H: cH } = this._canvasSize();
        const rect = this.editor.container?.getBoundingClientRect();
        if (rect) {
            this.editor.wrapper.style.left = Math.max(0, (rect.width - cW * next) / 2) + 'px';
            this.editor.wrapper.style.top = Math.max(0, (rect.height - cH * next) / 2) + 'px';
        }
    }

    _zoomFit() {
        this.editor._fitToContainer?.();
    }

    // ═════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═════════════════════════════════════════════════════════════════════
    updateSlideCounter(current, total) {
        const el = this._q(`cet-counter-${this.mode}`);
        if (el) el.textContent = `${current}/${total}`;
    }

    /** @deprecated use updateSlideCounter */
    updateNavCounter(current, total) { this.updateSlideCounter(current, total); }

    setStatus(text, active = false) { this._setStatus(text, active); }

    _setStatus(text, active = false) {
        const dot = this._q(`cet-dot-${this.mode}`);
        if (dot) dot.classList.toggle('active', active);
        if (this.options.onStatusChange) this.options.onStatusChange(text, active);
    }

    // ═════════════════════════════════════════════════════════════════════
    // KEYBOARD
    // ═════════════════════════════════════════════════════════════════════
    _onGlobalKeyDown(e) {
        const tag = document.activeElement?.tagName?.toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
        const isTextEditor = document.activeElement?.classList?.contains('canvas-text-editor');
        if (isInput && !isTextEditor) return;

        const ctrl = e.ctrlKey || e.metaKey;

        if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); return; }
        if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); this.redo(); return; }
        if (ctrl && e.key === 'c') { e.preventDefault(); this.copySelected(); return; }
        if (ctrl && e.key === 'v') { e.preventDefault(); this.pasteClipboard(); return; }
        if (ctrl && e.key === 'd') { e.preventDefault(); this.duplicateSelected(); return; }
        if (!ctrl && e.key === 't' && !isInput) { e.preventDefault(); this._addTextLayer(); return; }
        if (!ctrl && e.key === '0' && !isInput) { e.preventDefault(); this._zoomFit(); return; }
        if (!ctrl && e.key === '=' && !isInput) { e.preventDefault(); this._zoom(0.15); return; }
        if (!ctrl && e.key === '-' && !isInput) { e.preventDefault(); this._zoom(-0.15); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (!isInput) { e.preventDefault(); this.deleteSelected(); return; }
        }
        if (e.key === 'Escape') {
            this._hideCtxMenu();
            this._iconPicker?.classList.remove('visible');
            this._widget?.querySelectorAll('.cet-flyout').forEach(f => f.classList.remove('visible'));
            [this._propPanel, this._themePanel, this._colorPanel].forEach(p => p?.classList.remove('visible'));
            this._widget?.querySelectorAll('.cet-btn').forEach(b => b.classList.remove('active'));
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    // UTILS
    // ═════════════════════════════════════════════════════════════════════
    _getSelectedLayer() {
        if (this.editor.selectedIdx < 0) return null;
        return this.editor.editableLayers?.[this.editor.selectedIdx]?.layer || null;
    }

    /**
     * Safely convert any CSS color string to #rrggbb.
     * Handles: #rgb, #rrggbb, #rrggbbaa, rgba(...), rgb(...), named colors, null/undefined.
     */
    _toHex(color) {
        if (!color || typeof color !== 'string') return '#ffffff';
        const s = color.trim();
        if (/^#[0-9a-fA-F]{6,8}$/.test(s)) return s.substring(0, 7);
        if (/^#[0-9a-fA-F]{3}$/.test(s)) {
            return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
        }
        const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
        try {
            const ctx = document.createElement('canvas').getContext('2d');
            ctx.fillStyle = s;
            const c = ctx.fillStyle;
            if (c && c.startsWith('#')) return c.substring(0, 7);
        } catch (_) { }
        return '#00D9FF';
    }

    /**
     * Normalize a color value to #rrggbb or null if invalid.
     */
    _normalizeHex(val) {
        if (!val) return null;
        const s = val.trim();
        const fullHex = s.startsWith('#') ? s : '#' + s;
        if (/^#[0-9a-fA-F]{6}$/.test(fullHex)) return fullHex;
        if (/^#[0-9a-fA-F]{3}$/.test(fullHex)) {
            return '#' + fullHex[1] + fullHex[1] + fullHex[2] + fullHex[2] + fullHex[3] + fullHex[3];
        }
        return null;
    }

    // ═════════════════════════════════════════════════════════════════════
    // DESTROY
    // ═════════════════════════════════════════════════════════════════════
    destroy() {
        clearTimeout(this._propDebounce);
        document.removeEventListener('keydown', this._boundKeyDown, true);
        this.container?.removeEventListener('editor-contextmenu', this._boundCtxMenu);
        this._dragCleanup?.();
        this._widget?.remove();
        this._propPanel?.remove();
        this._themePanel?.remove();
        this._colorPanel?.remove();
        this._iconPicker?.remove();
        this._ctxMenu?.remove();
        this._widget = null;
        this._propPanel = null;
        this._themePanel = null;
        this._colorPanel = null;
        this._iconPicker = null;
        this._ctxMenu = null;
    }
}

if (typeof module !== 'undefined') module.exports = CanvasEditorToolbar;
else window.CanvasEditorToolbar = CanvasEditorToolbar;
