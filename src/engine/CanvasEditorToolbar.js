/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CanvasEditorToolbar.js — Professional Editor Wrapper               ║
 * ║  Cyber-Canvas Studio v2                                              ║
 * ║                                                                      ║
 * ║  Wraps CanvasEditor with a full Canva-like toolbar. Does NOT modify  ║
 * ║  CanvasEditor.js — 100% additive. Works for Studio, Ebook,          ║
 * ║  Thumbnails — each mode passes its own config.                       ║
 * ║                                                                      ║
 * ║  Capabilities added:                                                 ║
 * ║  · Undo / Redo  (Ctrl+Z / Ctrl+Y, up to 60 states)                  ║
 * ║  · Copy / Paste (Ctrl+C / Ctrl+V)                                    ║
 * ║  · Duplicate    (Ctrl+D)                                             ║
 * ║  · Add Text layer                                                    ║
 * ║  · Add Image layer (file picker)                                     ║
 * ║  · Add Icon layer (Material Icons browser)                           ║
 * ║  · Contextual properties panel: color, font size, opacity, align     ║
 * ║  · Layer order panel: bring forward / send back                      ║
 * ║  · Zoom: fit / 100% / + / -                                          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * USAGE (same in all views):
 *
 *   const toolbar = new CanvasEditorToolbar(containerEl, canvasEditor, {
 *     mode: 'studio',          // 'studio' | 'ebook' | 'thumbnail'
 *     theme: 'cyber',          // active theme name
 *     onHistoryChange: (canUndo, canRedo) => { ... },
 *     onSceneChange: (graph) => { ... }   // forwarded from canvasEditor.onChange
 *   });
 *
 *   // When loading a new scene, push to history:
 *   toolbar.pushHistory(sceneGraph);
 *
 *   // When leaving the view:
 *   toolbar.destroy();
 */

class CanvasEditorToolbar {

    // ─── CONSTRUCTOR ─────────────────────────────────────────────────
    constructor(container, canvasEditor, options = {}) {
        this.container   = container;   // The view's panel-center / preview container
        this.editor      = canvasEditor;
        this.options     = options;
        this.mode        = options.mode || 'studio';

        // ── History (undo/redo) ──────────────────────────────────────
        this._history    = [];          // Array of JSON strings (deep snapshots)
        this._historyIdx = -1;
        this._MAX_HISTORY = 60;
        this._skipNextHistoryPush = false;

        // ── Clipboard ────────────────────────────────────────────────
        this._clipboard  = null;        // Deep-cloned layer object

        // ── Toolbar DOM ──────────────────────────────────────────────
        this._toolbar    = null;
        this._propPanel  = null;
        this._iconPicker = null;

        this._boundKeyDown = (e) => this._onGlobalKeyDown(e);
        document.addEventListener('keydown', this._boundKeyDown, true); // Capture phase

        this._injectStyles();
        this._buildToolbar();
        this._buildPropPanel();
        this._buildIconPicker();

        // ── Hook into editor onChange ─────────────────────────────────
        const _origOnChange = this.editor.onChange;
        this.editor.onChange = (graph) => {
            if (!this._skipNextHistoryPush) {
                this._pushHistory(graph);
            }
            this._skipNextHistoryPush = false;
            this._updatePropPanel();
            if (options.onSceneChange) options.onSceneChange(graph);
            if (_origOnChange) _origOnChange(graph);
        };
    }

    // ─── STYLES ──────────────────────────────────────────────────────
    _injectStyles() {
        if (document.getElementById('cet-styles')) return;
        const s = document.createElement('style');
        s.id = 'cet-styles';
        s.textContent = `
/* ── TOOLBAR WRAPPER ── */
.cet-toolbar {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 2px;
    background: rgba(6,6,8,0.97);
    border: 1px solid #1e1e1e;
    border-radius: 12px;
    padding: 5px 8px;
    backdrop-filter: blur(16px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
    user-select: none;
    white-space: nowrap;
    pointer-events: auto;
}

/* ── TOOLBAR BUTTONS ── */
.cet-btn {
    background: transparent;
    border: 1px solid transparent;
    color: #555;
    width: 32px;
    height: 32px;
    border-radius: 7px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    transition: all 0.15s;
    position: relative;
    flex-shrink: 0;
}
.cet-btn:hover {
    color: #fff;
    background: rgba(255,255,255,0.06);
    border-color: #2a2a2a;
}
.cet-btn.active {
    color: #00D9FF;
    background: rgba(0,217,255,0.08);
    border-color: rgba(0,217,255,0.3);
}
.cet-btn:disabled {
    opacity: 0.2;
    cursor: not-allowed;
}
.cet-btn .material-icons { font-size: 18px; line-height: 1; }

/* ── DIVIDER ── */
.cet-sep {
    width: 1px;
    height: 22px;
    background: #1e1e1e;
    margin: 0 4px;
    flex-shrink: 0;
}

/* ── TOOLTIP ── */
.cet-btn::after {
    content: attr(data-tip);
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.9);
    color: #aaa;
    font-size: 10px;
    padding: 3px 7px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 999;
    border: 1px solid #1e1e1e;
}
.cet-btn:hover::after { opacity: 1; }

/* ── COLOR SWATCH ── */
.cet-color-btn {
    width: 32px;
    height: 32px;
    border-radius: 7px;
    border: 1px solid #2a2a2a;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
    transition: border-color 0.15s;
}
.cet-color-btn:hover { border-color: #00D9FF; }
.cet-color-btn input[type=color] {
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    opacity: 0;
    cursor: pointer;
    border: none;
    padding: 0;
}
.cet-color-swatch {
    width: 100%;
    height: 100%;
    background: #00D9FF;
    pointer-events: none;
}

/* ── FONT SIZE INPUT ── */
.cet-fontsize {
    width: 44px;
    background: #0a0a0a;
    border: 1px solid #1e1e1e;
    color: #888;
    border-radius: 6px;
    padding: 3px 6px;
    font-size: 11px;
    font-family: monospace;
    text-align: center;
    outline: none;
    transition: border-color 0.15s;
}
.cet-fontsize:focus { border-color: #00D9FF; color: #fff; }

/* ── LABEL ── */
.cet-label {
    font-size: 9px;
    font-weight: 800;
    color: #2a2a2a;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 0 4px;
    flex-shrink: 0;
}

/* ── PROPERTIES PANEL ── */
.cet-prop-panel {
    position: absolute;
    right: 10px;
    top: 58px;
    width: 220px;
    background: rgba(6,6,8,0.97);
    border: 1px solid #1e1e1e;
    border-radius: 10px;
    padding: 12px;
    z-index: 190;
    backdrop-filter: blur(16px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.6);
    display: none;
    flex-direction: column;
    gap: 10px;
}
.cet-prop-panel.visible { display: flex; }

.cet-prop-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}
.cet-prop-label {
    font-size: 9px;
    font-weight: 800;
    color: #333;
    letter-spacing: 1px;
    text-transform: uppercase;
    flex-shrink: 0;
}
.cet-prop-input {
    flex: 1;
    background: #0a0a0a;
    border: 1px solid #1e1e1e;
    color: #888;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11px;
    font-family: monospace;
    outline: none;
    min-width: 0;
    transition: border-color 0.15s;
}
.cet-prop-input:focus { border-color: #00D9FF; color: #fff; }

.cet-prop-select {
    flex: 1;
    background: #0a0a0a;
    border: 1px solid #1e1e1e;
    color: #888;
    border-radius: 6px;
    padding: 4px 6px;
    font-size: 11px;
    outline: none;
    cursor: pointer;
}
.cet-prop-select:focus { border-color: #00D9FF; }

.cet-prop-color {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid #2a2a2a;
    cursor: pointer;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
}
.cet-prop-color input[type=color] {
    position: absolute;
    width: 200%; height: 200%;
    top: -50%; left: -50%;
    opacity: 0;
    cursor: pointer;
}
.cet-prop-color-swatch {
    width: 100%; height: 100%;
    pointer-events: none;
}

.cet-prop-section {
    font-size: 9px;
    font-weight: 800;
    color: #1e1e1e;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-bottom: 1px solid #111;
    padding-bottom: 6px;
    margin-bottom: 2px;
}

.cet-btn-row {
    display: flex;
    gap: 4px;
}
.cet-prop-btn {
    flex: 1;
    background: #0a0a0a;
    border: 1px solid #1e1e1e;
    color: #555;
    border-radius: 6px;
    padding: 4px;
    cursor: pointer;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.cet-prop-btn:hover { color: #00D9FF; border-color: rgba(0,217,255,0.3); }
.cet-prop-btn .material-icons { font-size: 14px; }

/* ── ICON PICKER ── */
.cet-icon-picker {
    position: absolute;
    left: 50%;
    top: 58px;
    transform: translateX(-50%);
    width: 360px;
    background: rgba(6,6,8,0.98);
    border: 1px solid #1e1e1e;
    border-radius: 10px;
    z-index: 300;
    box-shadow: 0 8px 40px rgba(0,0,0,0.8);
    display: none;
    flex-direction: column;
    overflow: hidden;
}
.cet-icon-picker.visible { display: flex; }

.cet-icon-search {
    background: #0a0a0a;
    border: none;
    border-bottom: 1px solid #1e1e1e;
    color: #aaa;
    padding: 10px 14px;
    font-size: 12px;
    font-family: monospace;
    outline: none;
    width: 100%;
}
.cet-icon-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    padding: 8px;
    max-height: 240px;
    overflow-y: auto;
}
.cet-icon-grid::-webkit-scrollbar { width: 4px; }
.cet-icon-grid::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }

.cet-icon-item {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
}
.cet-icon-item:hover {
    background: rgba(0,217,255,0.08);
    border-color: rgba(0,217,255,0.3);
}
.cet-icon-item .material-icons { font-size: 20px; color: #666; }
.cet-icon-item:hover .material-icons { color: #00D9FF; }

/* ── ALIGN BUTTONS ── */
.cet-align-btn {
    background: #0a0a0a;
    border: 1px solid #1e1e1e;
    color: #555;
    border-radius: 5px;
    padding: 3px 6px;
    cursor: pointer;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
}
.cet-align-btn:hover { color: #fff; border-color: #333; }
.cet-align-btn .material-icons { font-size: 14px; }

/* ── ZOOM BADGE ── */
.cet-zoom-label {
    font-size: 10px;
    font-weight: 800;
    color: #333;
    font-family: monospace;
    min-width: 36px;
    text-align: center;
}
        `;
        document.head.appendChild(s);
    }

    // ─── BUILD TOOLBAR ────────────────────────────────────────────────
    _buildToolbar() {
        const tb = document.createElement('div');
        tb.className = 'cet-toolbar';
        tb.id = 'cet-toolbar-' + this.mode;

        tb.innerHTML = `
        <!-- HISTORY -->
        <button class="cet-btn" id="cet-undo" data-tip="Deshacer (Ctrl+Z)" disabled>
            <span class="material-icons">undo</span>
        </button>
        <button class="cet-btn" id="cet-redo" data-tip="Rehacer (Ctrl+Y)" disabled>
            <span class="material-icons">redo</span>
        </button>

        <div class="cet-sep"></div>

        <!-- ADD ELEMENTS -->
        <span class="cet-label">AGREGAR</span>
        <button class="cet-btn" id="cet-add-text" data-tip="Agregar Texto (T)">
            <span class="material-icons">text_fields</span>
        </button>
        <button class="cet-btn" id="cet-add-image" data-tip="Agregar Imagen">
            <span class="material-icons">add_photo_alternate</span>
        </button>
        <button class="cet-btn" id="cet-add-icon" data-tip="Agregar Icono">
            <span class="material-icons">interests</span>
        </button>
        <button class="cet-btn" id="cet-add-rect" data-tip="Agregar Tarjeta/Rect">
            <span class="material-icons">crop_square</span>
        </button>
        <input type="file" id="cet-img-file" accept="image/*" style="display:none;">

        <div class="cet-sep"></div>

        <!-- TEXT PROPERTIES (shown when text layer selected) -->
        <div id="cet-text-props" style="display:none;align-items:center;gap:4px;">
            <span class="cet-label">TEXTO</span>
            <div class="cet-color-btn" id="cet-text-color-btn" data-tip="Color del texto">
                <div class="cet-color-swatch" id="cet-text-color-swatch"></div>
                <input type="color" id="cet-text-color-input" value="#ffffff">
            </div>
            <input type="number" class="cet-fontsize" id="cet-fontsize" value="42" min="8" max="200" data-tip="Tamaño fuente">
            <div class="cet-sep"></div>
            <button class="cet-btn cet-align-btn" id="cet-align-left" data-tip="Alinear izq">
                <span class="material-icons">format_align_left</span>
            </button>
            <button class="cet-btn cet-align-btn" id="cet-align-center" data-tip="Centrar">
                <span class="material-icons">format_align_center</span>
            </button>
            <button class="cet-btn cet-align-btn" id="cet-align-right" data-tip="Alinear der">
                <span class="material-icons">format_align_right</span>
            </button>
            <div class="cet-sep"></div>
        </div>

        <!-- LAYER COLOR (generic) -->
        <div id="cet-layer-color-wrap" style="display:none;align-items:center;gap:4px;">
            <span class="cet-label">COLOR</span>
            <div class="cet-color-btn" id="cet-layer-color-btn" data-tip="Color del elemento">
                <div class="cet-color-swatch" id="cet-layer-color-swatch"></div>
                <input type="color" id="cet-layer-color-input" value="#00D9FF">
            </div>
            <div class="cet-sep"></div>
        </div>

        <!-- CLIPBOARD -->
        <button class="cet-btn" id="cet-copy" data-tip="Copiar (Ctrl+C)" disabled>
            <span class="material-icons">content_copy</span>
        </button>
        <button class="cet-btn" id="cet-paste" data-tip="Pegar (Ctrl+V)" disabled>
            <span class="material-icons">content_paste</span>
        </button>
        <button class="cet-btn" id="cet-duplicate" data-tip="Duplicar (Ctrl+D)" disabled>
            <span class="material-icons">copy_all</span>
        </button>
        <button class="cet-btn" id="cet-delete" data-tip="Eliminar (Del)" disabled>
            <span class="material-icons" style="color:#FF3366;">delete</span>
        </button>

        <div class="cet-sep"></div>

        <!-- LAYER ORDER -->
        <button class="cet-btn" id="cet-bring-front" data-tip="Traer al frente (Shift+])" disabled>
            <span class="material-icons">flip_to_front</span>
        </button>
        <button class="cet-btn" id="cet-bring-fwd" data-tip="Subir capa (])" disabled>
            <span class="material-icons">keyboard_arrow_up</span>
        </button>
        <button class="cet-btn" id="cet-send-bwd" data-tip="Bajar capa ([)" disabled>
            <span class="material-icons">keyboard_arrow_down</span>
        </button>
        <button class="cet-btn" id="cet-send-back" data-tip="Enviar al fondo (Shift+[)" disabled>
            <span class="material-icons">flip_to_back</span>
        </button>

        <div class="cet-sep"></div>

        <!-- PROPS TOGGLE -->
        <button class="cet-btn" id="cet-props-toggle" data-tip="Propiedades del elemento">
            <span class="material-icons">tune</span>
        </button>

        <div class="cet-sep"></div>

        <!-- ZOOM -->
        <button class="cet-btn" id="cet-zoom-out" data-tip="Alejar">
            <span class="material-icons">zoom_out</span>
        </button>
        <span class="cet-zoom-label" id="cet-zoom-val">FIT</span>
        <button class="cet-btn" id="cet-zoom-in" data-tip="Acercar">
            <span class="material-icons">zoom_in</span>
        </button>
        <button class="cet-btn" id="cet-zoom-fit" data-tip="Ajustar pantalla">
            <span class="material-icons">fit_screen</span>
        </button>
        `;

        // Attach to container (needs position:relative on container)
        this.container.style.position = 'relative';
        this.container.appendChild(tb);
        this._toolbar = tb;

        this._attachToolbarListeners();
    }

    // ─── BUILD PROPERTIES PANEL ──────────────────────────────────────
    _buildPropPanel() {
        const panel = document.createElement('div');
        panel.className = 'cet-prop-panel';
        panel.id = 'cet-prop-panel-' + this.mode;
        panel.innerHTML = `
        <div class="cet-prop-section">PROPIEDADES</div>

        <!-- POSITION -->
        <div class="cet-prop-row">
            <span class="cet-prop-label">X</span>
            <input type="number" class="cet-prop-input" id="cet-prop-x" style="width:60px;">
            <span class="cet-prop-label">Y</span>
            <input type="number" class="cet-prop-input" id="cet-prop-y" style="width:60px;">
        </div>

        <!-- SIZE -->
        <div class="cet-prop-row">
            <span class="cet-prop-label">W</span>
            <input type="number" class="cet-prop-input" id="cet-prop-w" style="width:60px;">
            <span class="cet-prop-label">H</span>
            <input type="number" class="cet-prop-input" id="cet-prop-h" style="width:60px;">
        </div>

        <!-- OPACITY -->
        <div class="cet-prop-row">
            <span class="cet-prop-label">OPACIDAD</span>
            <input type="range" id="cet-prop-opacity" min="0" max="1" step="0.01" value="1"
                style="flex:1;accent-color:#00D9FF;">
            <span id="cet-prop-opacity-val" style="font-size:10px;color:#555;width:28px;text-align:right;font-family:monospace;">100%</span>
        </div>

        <!-- COLOR (text) -->
        <div id="cet-prop-text-section" style="display:none;">
            <div class="cet-prop-section" style="margin-top:8px;">TEXTO</div>
            <div class="cet-prop-row" style="margin-top:6px;">
                <span class="cet-prop-label">COLOR</span>
                <div class="cet-prop-color" id="cet-prop-color-wrap">
                    <div class="cet-prop-color-swatch" id="cet-prop-color-swatch"></div>
                    <input type="color" id="cet-prop-color" value="#ffffff">
                </div>
                <input type="text" class="cet-prop-input" id="cet-prop-color-hex" placeholder="#ffffff"
                    style="flex:1;font-family:monospace;">
            </div>
            <div class="cet-prop-row" style="margin-top:6px;">
                <span class="cet-prop-label">FUENTE</span>
                <select class="cet-prop-select" id="cet-prop-font">
                    <option value="BlackOpsOne">BlackOpsOne</option>
                    <option value="MPLUS Code Latin">MPLUS Code Latin</option>
                    <option value="CODE Bold">CODE Bold</option>
                </select>
            </div>
            <div class="cet-prop-row" style="margin-top:6px;">
                <span class="cet-prop-label">PESO</span>
                <select class="cet-prop-select" id="cet-prop-weight">
                    <option value="400">Regular</option>
                    <option value="600">SemiBold</option>
                    <option value="700">Bold</option>
                    <option value="800">ExtraBold</option>
                    <option value="900">Black</option>
                </select>
            </div>
        </div>

        <!-- LAYER COLOR (non-text) -->
        <div id="cet-prop-layer-color-section" style="display:none;margin-top:4px;">
            <div class="cet-prop-section" style="margin-top:8px;">COLOR</div>
            <div class="cet-prop-row" style="margin-top:6px;">
                <span class="cet-prop-label">RELLENO</span>
                <div class="cet-prop-color" id="cet-prop-fill-wrap">
                    <div class="cet-prop-color-swatch" id="cet-prop-fill-swatch"></div>
                    <input type="color" id="cet-prop-fill" value="#0a0a0c">
                </div>
                <input type="text" class="cet-prop-input" id="cet-prop-fill-hex" placeholder="#0a0a0c"
                    style="flex:1;font-family:monospace;">
            </div>
            <div class="cet-prop-row" style="margin-top:6px;">
                <span class="cet-prop-label">ACENTO</span>
                <div class="cet-prop-color" id="cet-prop-accent-wrap">
                    <div class="cet-prop-color-swatch" id="cet-prop-accent-swatch"></div>
                    <input type="color" id="cet-prop-accent" value="#00D9FF">
                </div>
                <input type="text" class="cet-prop-input" id="cet-prop-accent-hex" placeholder="#00D9FF"
                    style="flex:1;font-family:monospace;">
            </div>
        </div>

        <!-- LAYER ACTIONS -->
        <div class="cet-prop-section" style="margin-top:8px;">ORDEN DE CAPAS</div>
        <div class="cet-btn-row" style="margin-top:6px;">
            <button class="cet-prop-btn" id="cet-p-bring-front" title="Traer al frente">
                <span class="material-icons">flip_to_front</span>
            </button>
            <button class="cet-prop-btn" id="cet-p-bring-fwd" title="Subir capa">
                <span class="material-icons">keyboard_arrow_up</span>
            </button>
            <button class="cet-prop-btn" id="cet-p-send-bwd" title="Bajar capa">
                <span class="material-icons">keyboard_arrow_down</span>
            </button>
            <button class="cet-prop-btn" id="cet-p-send-back" title="Enviar al fondo">
                <span class="material-icons">flip_to_back</span>
            </button>
        </div>

        <!-- TYPE LABEL -->
        <div style="margin-top:10px;font-size:9px;color:#1e1e1e;font-family:monospace;letter-spacing:1px;"
             id="cet-prop-type-label">
            — ningún elemento seleccionado —
        </div>
        `;

        this.container.appendChild(panel);
        this._propPanel = panel;
        this._attachPropListeners();
    }

    // ─── BUILD ICON PICKER ────────────────────────────────────────────
    _buildIconPicker() {
        const ICONS = [
            'security','lock','vpn_key','shield','bug_report','warning','error',
            'computer','dns','router','storage','cloud','cloud_upload','cloud_download',
            'terminal','code','data_object','api','settings','build','construction',
            'search','explore','visibility','visibility_off','wifi','bluetooth',
            'network_check','lan','hub','devices','smartphone','laptop',
            'person','group','admin_panel_settings','manage_accounts','badge',
            'fingerprint','face','supervised_user_circle','account_circle',
            'send','email','message','chat','forum','notifications',
            'public','language','map','location_on','place','travel_explore',
            'analytics','bar_chart','pie_chart','show_chart','trending_up','insights',
            'attach_money','payments','account_balance','credit_card','receipt',
            'school','library_books','science','biotech','psychology','memory',
            'flash_on','bolt','power','battery_full','speed','timer',
            'check_circle','cancel','info','help','report_problem','new_releases',
            'star','favorite','bookmark','thumb_up','celebration','emoji_events',
            'download','upload','sync','refresh','cached','autorenew',
            'edit','create','delete','content_copy','content_paste','undo',
            'add','remove','close','menu','more_vert','more_horiz',
            'arrow_forward','arrow_back','arrow_upward','arrow_downward',
            'keyboard_arrow_right','keyboard_arrow_left','expand_more','chevron_right',
            'home','dashboard','apps','grid_view','view_list','view_module',
            'image','photo','camera','movie','music_note','mic',
            'folder','folder_open','file_present','description','article',
            'schedule','access_time','calendar_today','event','history',
            'dark_mode','light_mode','palette','design_services','auto_awesome',
            'rocket_launch','satellite','sensors','radar','gps_fixed',
            'lock_open','no_encryption','policy','verified_user','gpp_maybe',
            'key','password','token','account_key','encrypted',
        ];

        const picker = document.createElement('div');
        picker.className = 'cet-icon-picker';
        picker.id = 'cet-icon-picker-' + this.mode;
        picker.innerHTML = `
            <input type="text" class="cet-icon-search" placeholder="Buscar icono... (ej: lock, cloud, code)" id="cet-icon-search-${this.mode}">
            <div class="cet-icon-grid" id="cet-icon-grid-${this.mode}"></div>
        `;

        this.container.appendChild(picker);
        this._iconPicker = picker;
        this._allIcons = ICONS;

        const searchEl = picker.querySelector(`#cet-icon-search-${this.mode}`);
        const gridEl   = picker.querySelector(`#cet-icon-grid-${this.mode}`);

        const renderIcons = (filter = '') => {
            const filtered = filter
                ? ICONS.filter(ic => ic.includes(filter.toLowerCase()))
                : ICONS;
            gridEl.innerHTML = filtered.map(ic => `
                <div class="cet-icon-item" data-icon="${ic}" title="${ic}">
                    <span class="material-icons">${ic}</span>
                </div>`).join('');
            gridEl.querySelectorAll('.cet-icon-item').forEach(item => {
                item.onclick = () => {
                    this._addIconLayer(item.dataset.icon);
                    picker.classList.remove('visible');
                };
            });
        };

        renderIcons();
        searchEl.addEventListener('input', (e) => renderIcons(e.target.value));

        // Close on outside click
        document.addEventListener('mousedown', (e) => {
            if (!picker.contains(e.target) && !e.target.closest('#cet-add-icon')) {
                picker.classList.remove('visible');
            }
        });
    }

    // ─── TOOLBAR LISTENERS ───────────────────────────────────────────
    _attachToolbarListeners() {
        const tb = this._toolbar;
        const q  = (id) => tb.querySelector('#' + id);

        // History
        q('cet-undo').onclick = () => this.undo();
        q('cet-redo').onclick = () => this.redo();

        // Add elements
        q('cet-add-text').onclick  = () => this._addTextLayer();
        q('cet-add-image').onclick = () => q('cet-img-file').click();
        q('cet-img-file').onchange = (e) => {
            if (e.target.files[0]) this._addImageLayer(e.target.files[0]);
            e.target.value = '';
        };
        q('cet-add-icon').onclick = () => {
            this._iconPicker.classList.toggle('visible');
        };
        q('cet-add-rect').onclick = () => this._addRectLayer();

        // Text color
        q('cet-text-color-input').oninput = (e) => {
            q('cet-text-color-swatch').style.background = e.target.value;
            this._applyTextColor(e.target.value);
        };

        // Font size
        q('cet-fontsize').onchange = (e) => this._applyFontSize(parseInt(e.target.value));

        // Alignment
        q('cet-align-left').onclick   = () => this._applyTextAlign('left');
        q('cet-align-center').onclick = () => this._applyTextAlign('center');
        q('cet-align-right').onclick  = () => this._applyTextAlign('right');

        // Layer color
        q('cet-layer-color-input').oninput = (e) => {
            q('cet-layer-color-swatch').style.background = e.target.value;
            this._applyLayerColor(e.target.value);
        };

        // Clipboard
        q('cet-copy').onclick      = () => this.copySelected();
        q('cet-paste').onclick     = () => this.pasteClipboard();
        q('cet-duplicate').onclick = () => this.duplicateSelected();
        q('cet-delete').onclick    = () => this.deleteSelected();

        // Layer order
        q('cet-bring-front').onclick = () => { this.editor.bringToFront(); this._updateSelectionUI(); };
        q('cet-bring-fwd').onclick   = () => { this.editor.bringForward(); this._updateSelectionUI(); };
        q('cet-send-bwd').onclick    = () => { this.editor.sendBackward(); this._updateSelectionUI(); };
        q('cet-send-back').onclick   = () => { this.editor.sendToBack(); this._updateSelectionUI(); };

        // Props panel toggle
        q('cet-props-toggle').onclick = () => {
            this._propPanel.classList.toggle('visible');
            q('cet-props-toggle').classList.toggle('active');
        };

        // Zoom
        q('cet-zoom-in').onclick  = () => this._zoom(0.1);
        q('cet-zoom-out').onclick = () => this._zoom(-0.1);
        q('cet-zoom-fit').onclick = () => this._zoomFit();

        // Sync selection state every 200ms (for toolbar button states)
        this._selectionPoll = setInterval(() => this._updateSelectionUI(), 200);
    }

    // ─── PROP PANEL LISTENERS ────────────────────────────────────────
    _attachPropListeners() {
        const pp = this._propPanel;
        const q  = (id) => pp.querySelector('#' + id);

        // Position
        const applyPos = () => {
            const layer = this._getSelectedLayer();
            if (!layer) return;
            const x = parseInt(q('cet-prop-x').value);
            const y = parseInt(q('cet-prop-y').value);
            if (!isNaN(x)) layer.x = x;
            if (!isNaN(y)) layer.y = y;
            layer._freeMove = true;
            this._commitPropChange();
        };
        q('cet-prop-x').onchange = applyPos;
        q('cet-prop-y').onchange = applyPos;

        // Size
        const applySize = () => {
            const layer = this._getSelectedLayer();
            if (!layer) return;
            const w = parseInt(q('cet-prop-w').value);
            const h = parseInt(q('cet-prop-h').value);
            if (!isNaN(w) && w > 0) layer.width  = w;
            if (!isNaN(h) && h > 0) layer.height = h;
            layer._userResized = true;
            layer._freeMove = true;
            this._commitPropChange();
        };
        q('cet-prop-w').onchange = applySize;
        q('cet-prop-h').onchange = applySize;

        // Opacity
        q('cet-prop-opacity').oninput = (e) => {
            const layer = this._getSelectedLayer();
            if (!layer) return;
            layer.opacity = parseFloat(e.target.value);
            q('cet-prop-opacity-val').textContent = Math.round(layer.opacity * 100) + '%';
            this._commitPropChange();
        };

        // Text color
        q('cet-prop-color').oninput = (e) => {
            q('cet-prop-color-swatch').style.background = e.target.value;
            q('cet-prop-color-hex').value = e.target.value;
            const layer = this._getSelectedLayer();
            if (layer) { layer.color = e.target.value; this._commitPropChange(); }
        };
        q('cet-prop-color-hex').onchange = (e) => {
            const v = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}/.test(v)) {
                q('cet-prop-color').value = v.substring(0, 7);
                q('cet-prop-color-swatch').style.background = v;
                const layer = this._getSelectedLayer();
                if (layer) { layer.color = v; this._commitPropChange(); }
            }
        };

        // Font family
        q('cet-prop-font').onchange = (e) => {
            const layer = this._getSelectedLayer();
            if (layer?.font) { layer.font.family = e.target.value; this._commitPropChange(); }
        };

        // Font weight
        q('cet-prop-weight').onchange = (e) => {
            const layer = this._getSelectedLayer();
            if (layer?.font) { layer.font.weight = parseInt(e.target.value); this._commitPropChange(); }
        };

        // Fill color
        q('cet-prop-fill').oninput = (e) => {
            q('cet-prop-fill-swatch').style.background = e.target.value;
            q('cet-prop-fill-hex').value = e.target.value;
            const layer = this._getSelectedLayer();
            if (layer) { layer.fill = e.target.value; this._commitPropChange(); }
        };
        q('cet-prop-fill-hex').onchange = (e) => {
            const v = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}/.test(v)) {
                q('cet-prop-fill').value = v.substring(0, 7);
                const layer = this._getSelectedLayer();
                if (layer) { layer.fill = v; this._commitPropChange(); }
            }
        };

        // Accent color
        q('cet-prop-accent').oninput = (e) => {
            q('cet-prop-accent-swatch').style.background = e.target.value;
            q('cet-prop-accent-hex').value = e.target.value;
            const layer = this._getSelectedLayer();
            if (layer) { layer.accentColor = e.target.value; this._commitPropChange(); }
        };
        q('cet-prop-accent-hex').onchange = (e) => {
            const v = e.target.value.trim();
            if (/^#[0-9a-fA-F]{6}/.test(v)) {
                q('cet-prop-accent').value = v.substring(0, 7);
                const layer = this._getSelectedLayer();
                if (layer) { layer.accentColor = v; this._commitPropChange(); }
            }
        };

        // Layer order
        q('cet-p-bring-front').onclick = () => { this.editor.bringToFront(); this._updatePropPanel(); };
        q('cet-p-bring-fwd').onclick   = () => { this.editor.bringForward(); this._updatePropPanel(); };
        q('cet-p-send-bwd').onclick    = () => { this.editor.sendBackward(); this._updatePropPanel(); };
        q('cet-p-send-back').onclick   = () => { this.editor.sendToBack(); this._updatePropPanel(); };
    }

    // ─── SELECTION UI SYNC ───────────────────────────────────────────
    _updateSelectionUI() {
        const tb     = this._toolbar;
        if (!tb) return;
        const q      = (id) => tb.querySelector('#' + id);
        const hasSelected = this.editor.selectedIdx >= 0;
        const layer  = this._getSelectedLayer();
        const isText = layer?.type === 'text';

        // Enable/disable clipboard & layer order buttons
        ['cet-copy','cet-duplicate','cet-delete',
         'cet-bring-front','cet-bring-fwd','cet-send-bwd','cet-send-back'
        ].forEach(id => {
            const btn = q(id);
            if (btn) btn.disabled = !hasSelected;
        });

        // Paste always available if clipboard has content
        const pasteBtn = q('cet-paste');
        if (pasteBtn) pasteBtn.disabled = !this._clipboard;

        // Text-specific props
        const textProps = tb.querySelector('#cet-text-props');
        if (textProps) textProps.style.display = (isText && hasSelected) ? 'flex' : 'none';

        // Generic layer color
        const layerColorWrap = tb.querySelector('#cet-layer-color-wrap');
        if (layerColorWrap) {
            const showColor = hasSelected && layer && !isText &&
                ['rect','icon','hexagon_node','statbar'].includes(layer.type);
            layerColorWrap.style.display = showColor ? 'flex' : 'none';
        }

        // Sync text color swatch
        if (isText && layer?.color) {
            const hex = this._toHex(layer.color);
            const swatch = tb.querySelector('#cet-text-color-swatch');
            const input  = tb.querySelector('#cet-text-color-input');
            if (swatch) swatch.style.background = hex;
            if (input)  try { input.value = hex; } catch (_) {}
        }

        // Sync font size
        if (isText && layer?.font?.size) {
            const fs = tb.querySelector('#cet-fontsize');
            if (fs && document.activeElement !== fs) fs.value = layer.font.size;
        }

        // Sync layer color swatch for non-text
        if (!isText && layer) {
            const col = layer.accentColor || layer.color || layer.fill || '#00D9FF';
            const hex = this._toHex(col);
            const swatch = tb.querySelector('#cet-layer-color-swatch');
            const input  = tb.querySelector('#cet-layer-color-input');
            if (swatch) swatch.style.background = hex;
            if (input)  try { input.value = hex; } catch (_) {}
        }
    }

    _updatePropPanel() {
        const pp = this._propPanel;
        if (!pp) return;
        const q = (id) => pp.querySelector('#' + id);

        const layer = this._getSelectedLayer();
        if (!layer) {
            q('cet-prop-type-label').textContent = '— ningún elemento seleccionado —';
            return;
        }

        const box = this.editor.editableLayers[this.editor.selectedIdx];
        q('cet-prop-type-label').textContent = `TYPE: ${layer.type?.toUpperCase() || '?'}  ID: ${layer.id || '—'}`;

        // Position & size from box (reflects actual rendered position)
        if (box) {
            if (document.activeElement !== q('cet-prop-x')) q('cet-prop-x').value = Math.round(box.x);
            if (document.activeElement !== q('cet-prop-y')) q('cet-prop-y').value = Math.round(box.y);
            if (document.activeElement !== q('cet-prop-w')) q('cet-prop-w').value = Math.round(box.width);
            if (document.activeElement !== q('cet-prop-h')) q('cet-prop-h').value = Math.round(box.height);
        }

        // Opacity
        const op = layer.opacity !== undefined ? layer.opacity : 1;
        q('cet-prop-opacity').value = op;
        q('cet-prop-opacity-val').textContent = Math.round(op * 100) + '%';

        // Text section
        const isText = layer.type === 'text';
        q('cet-prop-text-section').style.display = isText ? 'block' : 'none';
        if (isText) {
            const hex = this._toHex(layer.color || '#ffffff');
            q('cet-prop-color-swatch').style.background = hex;
            try { q('cet-prop-color').value = hex; } catch (_) {}
            q('cet-prop-color-hex').value = layer.color || hex;
            if (layer.font?.family) {
                const opt = q('cet-prop-font').querySelector(`option[value="${layer.font.family}"]`);
                if (opt) q('cet-prop-font').value = layer.font.family;
            }
            if (layer.font?.weight) q('cet-prop-weight').value = String(layer.font.weight);
        }

        // Layer color section (non-text)
        const hasLayerColor = !isText && (layer.fill || layer.accentColor || layer.color);
        q('cet-prop-layer-color-section').style.display = hasLayerColor ? 'block' : 'none';
        if (hasLayerColor) {
            const fill   = this._toHex(layer.fill || '#0a0a0c');
            const accent = this._toHex(layer.accentColor || layer.color || '#00D9FF');
            q('cet-prop-fill-swatch').style.background = fill;
            q('cet-prop-fill-hex').value = layer.fill || '';
            try { q('cet-prop-fill').value = fill; } catch (_) {}
            q('cet-prop-accent-swatch').style.background = accent;
            q('cet-prop-accent-hex').value = layer.accentColor || layer.color || '';
            try { q('cet-prop-accent').value = accent; } catch (_) {}
        }
    }

    // ─── HISTORY ─────────────────────────────────────────────────────
    pushHistory(sceneGraph) {
        if (!sceneGraph) return;
        const snapshot = JSON.stringify(sceneGraph);
        // Don't push duplicate
        if (this._historyIdx >= 0 && this._history[this._historyIdx] === snapshot) return;
        // Truncate redo branch
        this._history = this._history.slice(0, this._historyIdx + 1);
        this._history.push(snapshot);
        if (this._history.length > this._MAX_HISTORY) this._history.shift();
        this._historyIdx = this._history.length - 1;
        this._syncHistoryButtons();
    }

    _pushHistory(sceneGraph) {
        this.pushHistory(sceneGraph);
    }

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
        this._skipNextHistoryPush = true;
        await this.editor.load(snapshot);
        this._syncHistoryButtons();
        if (this.options.onSceneChange) this.options.onSceneChange(snapshot);
    }

    _syncHistoryButtons() {
        const tb = this._toolbar;
        if (!tb) return;
        const undoBtn = tb.querySelector('#cet-undo');
        const redoBtn = tb.querySelector('#cet-redo');
        if (undoBtn) undoBtn.disabled = this._historyIdx <= 0;
        if (redoBtn) redoBtn.disabled = this._historyIdx >= this._history.length - 1;
        if (this.options.onHistoryChange) {
            this.options.onHistoryChange(this._historyIdx > 0, this._historyIdx < this._history.length - 1);
        }
    }

    // ─── CLIPBOARD ───────────────────────────────────────────────────
    copySelected() {
        const layer = this._getSelectedLayer();
        if (!layer) return;
        this._clipboard = JSON.parse(JSON.stringify(layer));
        const pasteBtn = this._toolbar?.querySelector('#cet-paste');
        if (pasteBtn) pasteBtn.disabled = false;
    }

    pasteClipboard() {
        if (!this._clipboard || !this.editor.sceneGraph) return;
        const clone = JSON.parse(JSON.stringify(this._clipboard));
        clone.id = 'layer_' + Math.random().toString(36).substr(2, 9);
        clone.x  = (clone.x || 0) + 40;
        clone.y  = (clone.y || 0) + 40;
        clone._freeMove = true;
        this.editor.sceneGraph.layers.push(clone);
        this._commitChange();
    }

    duplicateSelected() {
        const layer = this._getSelectedLayer();
        if (!layer || !this.editor.sceneGraph) return;
        const clone = JSON.parse(JSON.stringify(layer));
        clone.id = 'layer_' + Math.random().toString(36).substr(2, 9);
        clone.x  = (clone.x || 0) + 40;
        clone.y  = (clone.y || 0) + 40;
        clone._freeMove = true;
        this.editor.sceneGraph.layers.push(clone);
        this._commitChange();
    }

    deleteSelected() {
        if (this.editor.selectedIdx < 0 || !this.editor.sceneGraph) return;
        const box = this.editor.editableLayers[this.editor.selectedIdx];
        if (!box) return;
        if (box.type === 'brand' || box.type === 'swipe' || box.type === 'page_number') return;
        this.editor.sceneGraph.layers.splice(box.layerIndex, 1);
        this.editor.selectedIdx = -1;
        this._commitChange();
    }

    // ─── ADD LAYERS ──────────────────────────────────────────────────
    _addTextLayer() {
        if (!this.editor.sceneGraph) return;
        const W = this.editor.renderer.width;
        const H = this.editor.renderer.height;
        this.editor.sceneGraph.layers.push({
            id: 'layer_' + Math.random().toString(36).substr(2, 9),
            type: 'text',
            content: 'Nuevo Texto',
            x: Math.round(W * 0.1),
            y: Math.round(H * 0.5),
            width: Math.round(W * 0.8),
            font: { family: 'BlackOpsOne', size: 80, weight: 900 },
            color: '#ffffff',
            align: 'center',
            _freeMove: true
        });
        this._commitChange();
    }

    _addRectLayer() {
        if (!this.editor.sceneGraph) return;
        const W = this.editor.renderer.width;
        const H = this.editor.renderer.height;
        this.editor.sceneGraph.layers.push({
            id: 'layer_' + Math.random().toString(36).substr(2, 9),
            type: 'rect',
            x: Math.round(W * 0.1),
            y: Math.round(H * 0.3),
            width: Math.round(W * 0.8),
            height: 200,
            fill: '#0a0a0c',
            border: { color: '#00D9FF44', width: 2 },
            radius: 16,
            accentColor: '#00D9FF',
            _freeMove: true,
            _userResized: true
        });
        this._commitChange();
    }

    _addImageLayer(file) {
        if (!this.editor.sceneGraph) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const W = this.editor.renderer.width;
            const H = this.editor.renderer.height;
            this.editor.sceneGraph.layers.push({
                id: 'layer_' + Math.random().toString(36).substr(2, 9),
                type: 'image',
                src: e.target.result,
                x: Math.round(W * 0.1),
                y: Math.round(H * 0.2),
                width: Math.round(W * 0.8),
                height: Math.round(H * 0.3),
                opacity: 1,
                _freeMove: true,
                _userResized: true
            });
            this._commitChange();
        };
        reader.readAsDataURL(file);
    }

    _addIconLayer(iconName) {
        if (!this.editor.sceneGraph) return;
        const W = this.editor.renderer.width;
        const H = this.editor.renderer.height;
        this.editor.sceneGraph.layers.push({
            id: 'layer_' + Math.random().toString(36).substr(2, 9),
            type: 'icon',
            icon: iconName,
            x: Math.round(W / 2 - 80),
            y: Math.round(H / 2 - 80),
            size: 160,
            color: '#00D9FF',
            _freeMove: true,
            _userResized: true
        });
        this._commitChange();
    }

    // ─── APPLY TEXT PROPERTIES ───────────────────────────────────────
    _applyTextColor(hex) {
        const layer = this._getSelectedLayer();
        if (!layer || layer.type !== 'text') return;
        layer.color = hex;
        this._commitPropChange();
    }

    _applyFontSize(size) {
        const layer = this._getSelectedLayer();
        if (!layer || layer.type !== 'text' || isNaN(size)) return;
        if (!layer.font) layer.font = {};
        layer.font.size = Math.max(8, Math.min(400, size));
        this._commitPropChange();
    }

    _applyTextAlign(align) {
        const layer = this._getSelectedLayer();
        if (!layer || layer.type !== 'text') return;
        layer.align = align;
        this._commitPropChange();
    }

    _applyLayerColor(hex) {
        const layer = this._getSelectedLayer();
        if (!layer) return;
        if (layer.accentColor !== undefined) layer.accentColor = hex;
        else if (layer.color !== undefined)  layer.color = hex;
        else if (layer.fill !== undefined)   layer.fill = hex;
        this._commitPropChange();
    }

    // ─── COMMIT CHANGES ──────────────────────────────────────────────
    async _commitChange() {
        if (!this.editor.sceneGraph) return;
        this._skipNextHistoryPush = false;
        await this.editor._reRender();
        this._pushHistory(this.editor.sceneGraph);
        if (this.editor.onChange) this.editor.onChange(this.editor.sceneGraph);
    }

    _commitPropChange() {
        if (!this.editor.sceneGraph) return;
        clearTimeout(this._propDebounce);
        this._propDebounce = setTimeout(async () => {
            await this.editor._reRender();
            this._pushHistory(this.editor.sceneGraph);
            if (this.editor.onChange) this.editor.onChange(this.editor.sceneGraph);
        }, 80);
    }

    // ─── ZOOM ────────────────────────────────────────────────────────
    _zoom(delta) {
        if (!this.editor.wrapper) return;
        const cur = this.editor.displayScale || 1;
        const next = Math.max(0.1, Math.min(3, cur + delta));
        this.editor.displayScale = next;
        this.editor.wrapper.style.transform = `scale(${next})`;
        this.editor.scale = 1 / next;
        const zl = this._toolbar?.querySelector('#cet-zoom-val');
        if (zl) zl.textContent = Math.round(next * 100) + '%';
    }

    _zoomFit() {
        this.editor._fitToContainer();
        const zl = this._toolbar?.querySelector('#cet-zoom-val');
        if (zl) zl.textContent = 'FIT';
    }

    // ─── GLOBAL KEYBOARD ─────────────────────────────────────────────
    _onGlobalKeyDown(e) {
        // Don't intercept when typing in inputs/textareas
        const tag = document.activeElement?.tagName?.toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
        // But ALLOW canvas-text-editor (the inline text editor overlay)
        const isCanvasTextEditor = document.activeElement?.classList?.contains('canvas-text-editor');
        if (isInput && !isCanvasTextEditor) return;

        const ctrl = e.ctrlKey || e.metaKey;

        if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); return; }
        if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); this.redo(); return; }
        if (ctrl && e.key === 'c') { e.preventDefault(); this.copySelected(); return; }
        if (ctrl && e.key === 'v') { e.preventDefault(); this.pasteClipboard(); return; }
        if (ctrl && e.key === 'd') { e.preventDefault(); this.duplicateSelected(); return; }
        // T = add text
        if (!ctrl && e.key === 't' && !isInput) { e.preventDefault(); this._addTextLayer(); return; }
    }

    // ─── UTILS ───────────────────────────────────────────────────────
    _getSelectedLayer() {
        if (this.editor.selectedIdx < 0) return null;
        const box = this.editor.editableLayers?.[this.editor.selectedIdx];
        return box?.layer || null;
    }

    _toHex(color) {
        if (!color) return '#ffffff';
        if (typeof color === 'string' && color.startsWith('#') && color.length >= 7) {
            return color.substring(0, 7);
        }
        // Try to handle rgba(r,g,b,a) by converting to hex
        const m = (color + '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
            return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
        }
        return '#00D9FF';
    }

    // ─── DESTROY ────────────────────────────────────────────────────
    destroy() {
        clearInterval(this._selectionPoll);
        clearTimeout(this._propDebounce);
        document.removeEventListener('keydown', this._boundKeyDown, true);
        this._toolbar?.remove();
        this._propPanel?.remove();
        this._iconPicker?.remove();
        this._toolbar = null;
        this._propPanel = null;
        this._iconPicker = null;
    }
}

// Export
if (typeof module !== 'undefined') module.exports = CanvasEditorToolbar;
else window.CanvasEditorToolbar = CanvasEditorToolbar;
