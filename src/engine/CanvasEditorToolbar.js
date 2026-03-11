/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CanvasEditorToolbar.js — Professional Editor Toolbar               ║
 * ║  Cyber-Canvas Studio v2  —  PRODUCTION BUILD                        ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Wraps CanvasEditor with Canva-like toolbar. Zero modifications to  ║
 * ║  CanvasEditor — 100% additive. Works for Studio, Ebook, Thumbnails. ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Capacidades:                                                        ║
 * ║  · Undo/Redo    Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y  (60 estados)        ║
 * ║  · Copy/Paste/Duplicate/Delete  Ctrl+C/V/D / Del                   ║
 * ║  · Agregar: Texto, Imagen, Icono, Rect, Divisor                    ║
 * ║  · Text props: color, fuente, peso, tamaño, alineación              ║
 * ║  · Layer color: fill, accentColor                                   ║
 * ║  · Opacity slider                                                   ║
 * ║  · Align: izq/centro/der/arriba/abajo/medio                         ║
 * ║  · Lock / Hide / Delete desde panel                                 ║
 * ║  · Nav slides: ◀ ▶ con contador (Studio mode)                       ║
 * ║  · Context menu (click derecho en canvas)                           ║
 * ║  · Zoom: fit / + / -                                                ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  FIXES vs versión anterior:                                          ║
 * ║  · Infinite loop en onChange → guard flag _inToolbarCallback         ║
 * ║  · _commitChange/_commitPropChange ya no llaman editor.onChange      ║
 * ║  · _restoreHistory tiene guard para no re-pushear historia           ║
 * ║  · _toHex acepta null/undefined/objeto sin crashear                  ║
 * ║  · Keyboard listener usa capture phase, se limpia en destroy()       ║
 * ║  · setInterval polling eliminado → se usa editor.onChange hook       ║
 * ║  · Nav prev/next vía callbacks, no window.app                        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

class CanvasEditorToolbar {

    // ─── CONSTRUCTOR ─────────────────────────────────────────────────
    constructor(container, canvasEditor, options = {}) {
        this.container = container;
        this.editor    = canvasEditor;
        this.options   = options;
        this.mode      = options.mode || 'studio';

        // ── History ───────────────────────────────────────────────
        this._history     = [];
        this._historyIdx  = -1;
        this._MAX_HISTORY = 60;

        // ── Clipboard ─────────────────────────────────────────────
        this._clipboard = null;

        // ── DOM refs ──────────────────────────────────────────────
        this._toolbar    = null;
        this._propPanel  = null;
        this._iconPicker = null;
        this._ctxMenu    = null;

        // ── Re-entry guard (prevents infinite onChange loops) ─────
        this._inToolbarCallback = false;

        // ── Keyboard ──────────────────────────────────────────────
        this._boundKeyDown = (e) => this._onGlobalKeyDown(e);
        document.addEventListener('keydown', this._boundKeyDown, true);

        // ── Context menu from canvas ───────────────────────────────
        this._boundCtxMenu = (e) => this._onEditorContextMenu(e);
        container.addEventListener('editor-contextmenu', this._boundCtxMenu);

        this._injectStyles();
        this._buildToolbar();
        this._buildPropPanel();
        this._buildIconPicker();
        this._buildContextMenu();

        // ── Hook editor.onChange ──────────────────────────────────
        //    Guard prevents re-entry from onSceneChange callbacks.
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
    }

    // ─── STYLES ──────────────────────────────────────────────────────
    _injectStyles() {
        if (document.getElementById('cet-styles')) return;
        const s = document.createElement('style');
        s.id = 'cet-styles';
        s.textContent = `
/* ─ TOOLBAR ─────────────────────────────────────────────────────── */
.cet-toolbar {
    position:absolute; top:10px; left:50%; transform:translateX(-50%);
    z-index:200; display:flex; align-items:center; gap:2px;
    background:rgba(5,5,7,0.97); border:1px solid #1a1a1a;
    border-radius:12px; padding:5px 8px;
    backdrop-filter:blur(20px);
    box-shadow:0 4px 28px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03);
    user-select:none; white-space:nowrap; pointer-events:auto; overflow:visible;
}
/* ─ BUTTONS ─────────────────────────────────────────────────────── */
.cet-btn {
    background:transparent; border:1px solid transparent; color:#484848;
    width:32px; height:32px; border-radius:7px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    font-size:17px; transition:all 0.12s; position:relative; flex-shrink:0;
}
.cet-btn:hover  { color:#fff; background:rgba(255,255,255,0.07); border-color:#252525; }
.cet-btn.active { color:#00D9FF; background:rgba(0,217,255,0.1); border-color:rgba(0,217,255,0.35); }
.cet-btn:disabled { opacity:0.18; cursor:not-allowed; }
.cet-btn .material-icons { font-size:18px; line-height:1; }
/* Tooltip */
.cet-btn::after {
    content:attr(data-tip); position:absolute; bottom:-32px; left:50%;
    transform:translateX(-50%); background:rgba(0,0,0,0.92); color:#999;
    font-size:10px; padding:3px 8px; border-radius:4px; white-space:nowrap;
    pointer-events:none; opacity:0; transition:opacity 0.12s; z-index:999;
    border:1px solid #1e1e1e;
}
.cet-btn:hover::after { opacity:1; }
/* ─ SEPARADOR ─────────────────────────────────────────────────── */
.cet-sep { width:1px; height:22px; background:#181818; margin:0 4px; flex-shrink:0; }
/* ─ LABEL ─────────────────────────────────────────────────────── */
.cet-label {
    font-size:9px; font-weight:800; color:#252525; letter-spacing:1px;
    text-transform:uppercase; padding:0 4px; flex-shrink:0;
}
/* ─ COLOR SWATCH ─────────────────────────────────────────────── */
.cet-color-btn {
    width:32px; height:32px; border-radius:7px; border:1px solid #252525;
    cursor:pointer; position:relative; overflow:hidden; flex-shrink:0;
    transition:border-color 0.12s;
}
.cet-color-btn:hover { border-color:#00D9FF; }
.cet-color-btn input[type=color] {
    position:absolute; width:200%; height:200%; top:-50%; left:-50%;
    opacity:0; cursor:pointer; border:none; padding:0;
}
.cet-color-swatch { width:100%; height:100%; pointer-events:none; }
/* ─ FONT SIZE ─────────────────────────────────────────────────── */
.cet-fontsize {
    width:46px; background:#090909; border:1px solid #1a1a1a; color:#777;
    border-radius:6px; padding:3px 6px; font-size:11px; font-family:monospace;
    text-align:center; outline:none; transition:border-color 0.12s;
}
.cet-fontsize:focus { border-color:#00D9FF; color:#fff; }
/* ─ ZOOM BADGE ────────────────────────────────────────────────── */
.cet-zoom-label {
    font-size:10px; font-weight:700; color:#303030; font-family:monospace;
    min-width:36px; text-align:center;
}
/* ─ PROPERTIES PANEL ──────────────────────────────────────────── */
.cet-prop-panel {
    position:absolute; right:10px; top:58px; width:230px;
    background:rgba(5,5,7,0.97); border:1px solid #1a1a1a;
    border-radius:10px; padding:14px; z-index:190;
    backdrop-filter:blur(20px); box-shadow:0 4px 28px rgba(0,0,0,0.7);
    display:none; flex-direction:column; gap:10px;
}
.cet-prop-panel.visible { display:flex; }
.cet-prop-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.cet-prop-label {
    font-size:9px; font-weight:800; color:#2e2e2e; letter-spacing:1px;
    text-transform:uppercase; flex-shrink:0;
}
.cet-prop-input {
    flex:1; background:#090909; border:1px solid #1a1a1a; color:#777;
    border-radius:6px; padding:4px 8px; font-size:11px; font-family:monospace;
    outline:none; min-width:0; transition:border-color 0.12s;
}
.cet-prop-input:focus { border-color:#00D9FF; color:#fff; }
.cet-prop-select {
    flex:1; background:#090909; border:1px solid #1a1a1a; color:#777;
    border-radius:6px; padding:4px 6px; font-size:11px; outline:none; cursor:pointer;
}
.cet-prop-select:focus { border-color:#00D9FF; }
.cet-prop-color {
    width:28px; height:28px; border-radius:6px; border:1px solid #252525;
    cursor:pointer; overflow:hidden; position:relative; flex-shrink:0;
}
.cet-prop-color input[type=color] {
    position:absolute; width:200%; height:200%; top:-50%; left:-50%;
    opacity:0; cursor:pointer;
}
.cet-prop-color-swatch { width:100%; height:100%; pointer-events:none; }
.cet-prop-section {
    font-size:9px; font-weight:800; color:#1a1a1a; letter-spacing:1.5px;
    text-transform:uppercase; border-bottom:1px solid #101010;
    padding-bottom:6px; margin-bottom:2px;
}
.cet-btn-row { display:flex; gap:4px; }
.cet-prop-btn {
    flex:1; background:#090909; border:1px solid #1a1a1a; color:#444;
    border-radius:6px; padding:5px; cursor:pointer; font-size:10px;
    display:flex; align-items:center; justify-content:center; transition:all 0.12s;
}
.cet-prop-btn:hover { color:#00D9FF; border-color:rgba(0,217,255,0.3); }
.cet-prop-btn .material-icons { font-size:14px; }
/* ─ ICON PICKER ────────────────────────────────────────────────── */
.cet-icon-picker {
    position:absolute; left:50%; top:58px; transform:translateX(-50%);
    width:380px; background:rgba(5,5,7,0.99); border:1px solid #1a1a1a;
    border-radius:10px; z-index:300; box-shadow:0 8px 40px rgba(0,0,0,0.85);
    display:none; flex-direction:column; overflow:hidden;
}
.cet-icon-picker.visible { display:flex; }
.cet-icon-search {
    background:#090909; border:none; border-bottom:1px solid #1a1a1a;
    color:#aaa; padding:10px 14px; font-size:12px; font-family:monospace;
    outline:none; width:100%;
}
.cet-icon-grid {
    display:grid; grid-template-columns:repeat(9,1fr); gap:3px;
    padding:8px; max-height:260px; overflow-y:auto;
}
.cet-icon-grid::-webkit-scrollbar { width:4px; }
.cet-icon-grid::-webkit-scrollbar-thumb { background:#1e1e1e; border-radius:2px; }
.cet-icon-item {
    width:38px; height:38px; display:flex; align-items:center; justify-content:center;
    border-radius:6px; cursor:pointer; transition:all 0.12s; border:1px solid transparent;
}
.cet-icon-item:hover { background:rgba(0,217,255,0.08); border-color:rgba(0,217,255,0.3); }
.cet-icon-item .material-icons { font-size:20px; color:#555; }
.cet-icon-item:hover .material-icons { color:#00D9FF; }
/* ─ CONTEXT MENU ───────────────────────────────────────────────── */
.cet-ctx-menu {
    position:fixed; background:rgba(5,5,7,0.98); border:1px solid #1e1e1e;
    border-radius:8px; z-index:9999; padding:4px 0; min-width:160px;
    box-shadow:0 8px 32px rgba(0,0,0,0.8); display:none;
}
.cet-ctx-menu.visible { display:block; }
.cet-ctx-item {
    padding:7px 14px; font-size:11px; font-family:monospace; color:#666;
    cursor:pointer; display:flex; align-items:center; gap:8px;
    transition:background 0.1s, color 0.1s;
}
.cet-ctx-item:hover { background:rgba(0,217,255,0.07); color:#fff; }
.cet-ctx-item.danger:hover { background:rgba(255,51,102,0.08); color:#FF3366; }
.cet-ctx-item .material-icons { font-size:14px; }
.cet-ctx-sep { height:1px; background:#111; margin:3px 0; }
/* ─ ALIGN BUTTONS ─────────────────────────────────────────────── */
.cet-align-btn {
    background:#090909; border:1px solid #1a1a1a; color:#444;
    border-radius:5px; padding:3px 6px; cursor:pointer;
    display:flex; align-items:center; justify-content:center; transition:all 0.12s;
}
.cet-align-btn:hover { color:#fff; border-color:#333; }
.cet-align-btn .material-icons { font-size:14px; }
        `;
        document.head.appendChild(s);
    }

    // ─── BUILD TOOLBAR ────────────────────────────────────────────────
    _buildToolbar() {
        const tb = document.createElement('div');
        tb.className = 'cet-toolbar';
        tb.id = 'cet-toolbar-' + this.mode;

        const navHTML = this.mode === 'studio' ? `
        <button class="cet-btn" id="cet-prev" data-tip="Imagen anterior (←)">
            <span class="material-icons">chevron_left</span>
        </button>
        <span class="cet-zoom-label" id="cet-slide-counter" style="min-width:44px;">— / —</span>
        <button class="cet-btn" id="cet-next" data-tip="Imagen siguiente (→)">
            <span class="material-icons">chevron_right</span>
        </button>
        <div class="cet-sep"></div>` : '';

        tb.innerHTML = `
        ${navHTML}

        <!-- HISTORY -->
        <button class="cet-btn" id="cet-undo" data-tip="Deshacer (Ctrl+Z)" disabled>
            <span class="material-icons">undo</span>
        </button>
        <button class="cet-btn" id="cet-redo" data-tip="Rehacer (Ctrl+Y)" disabled>
            <span class="material-icons">redo</span>
        </button>

        <div class="cet-sep"></div>

        <!-- ADD ELEMENTS -->
        <span class="cet-label">ADD</span>
        <button class="cet-btn" id="cet-add-text"  data-tip="Texto (T)"><span class="material-icons">text_fields</span></button>
        <button class="cet-btn" id="cet-add-image" data-tip="Imagen"><span class="material-icons">add_photo_alternate</span></button>
        <button class="cet-btn" id="cet-add-icon"  data-tip="Icono"><span class="material-icons">interests</span></button>
        <button class="cet-btn" id="cet-add-rect"  data-tip="Tarjeta"><span class="material-icons">crop_square</span></button>
        <button class="cet-btn" id="cet-add-div"   data-tip="Divisor"><span class="material-icons">horizontal_rule</span></button>
        <input type="file" id="cet-img-file" accept="image/*" style="display:none;">

        <div class="cet-sep"></div>

        <!-- TEXT PROPS (visible when text selected) -->
        <div id="cet-text-props" style="display:none;align-items:center;gap:4px;">
            <span class="cet-label">TEXTO</span>
            <div class="cet-color-btn" id="cet-text-color-btn" data-tip="Color texto">
                <div class="cet-color-swatch" id="cet-text-color-swatch"></div>
                <input type="color" id="cet-text-color-input" value="#ffffff">
            </div>
            <input type="number" class="cet-fontsize" id="cet-fontsize" value="42" min="8" max="400" data-tip="Tamaño fuente">
            <button class="cet-btn cet-align-btn" id="cet-align-left"   data-tip="Alinear izq"><span class="material-icons">format_align_left</span></button>
            <button class="cet-btn cet-align-btn" id="cet-align-center" data-tip="Centrar"><span class="material-icons">format_align_center</span></button>
            <button class="cet-btn cet-align-btn" id="cet-align-right"  data-tip="Alinear der"><span class="material-icons">format_align_right</span></button>
            <div class="cet-sep"></div>
        </div>

        <!-- LAYER COLOR (visible for rects, icons, etc) -->
        <div id="cet-layer-color-wrap" style="display:none;align-items:center;gap:4px;">
            <span class="cet-label">COLOR</span>
            <div class="cet-color-btn" id="cet-layer-color-btn" data-tip="Color elemento">
                <div class="cet-color-swatch" id="cet-layer-color-swatch"></div>
                <input type="color" id="cet-layer-color-input" value="#00D9FF">
            </div>
            <div class="cet-sep"></div>
        </div>

        <!-- CLIPBOARD / DELETE -->
        <button class="cet-btn" id="cet-copy"      data-tip="Copiar (Ctrl+C)" disabled><span class="material-icons">content_copy</span></button>
        <button class="cet-btn" id="cet-paste"     data-tip="Pegar (Ctrl+V)" disabled><span class="material-icons">content_paste</span></button>
        <button class="cet-btn" id="cet-duplicate" data-tip="Duplicar (Ctrl+D)" disabled><span class="material-icons">copy_all</span></button>
        <button class="cet-btn" id="cet-delete"    data-tip="Eliminar (Del)" disabled>
            <span class="material-icons" style="color:#FF3366">delete</span>
        </button>

        <div class="cet-sep"></div>

        <!-- LAYER ORDER -->
        <button class="cet-btn" id="cet-bring-front" data-tip="Frente (Shift+])" disabled><span class="material-icons">flip_to_front</span></button>
        <button class="cet-btn" id="cet-bring-fwd"   data-tip="Subir capa (])" disabled><span class="material-icons">keyboard_arrow_up</span></button>
        <button class="cet-btn" id="cet-send-bwd"    data-tip="Bajar capa ([)" disabled><span class="material-icons">keyboard_arrow_down</span></button>
        <button class="cet-btn" id="cet-send-back"   data-tip="Fondo (Shift+[)" disabled><span class="material-icons">flip_to_back</span></button>

        <div class="cet-sep"></div>

        <!-- ALIGN (canvas) -->
        <span class="cet-label">ALINEAR</span>
        <button class="cet-btn cet-align-btn" id="cet-align-canvas-left"   data-tip="Alinear izquierda"><span class="material-icons">align_horizontal_left</span></button>
        <button class="cet-btn cet-align-btn" id="cet-align-canvas-center" data-tip="Centrar horizontal"><span class="material-icons">align_horizontal_center</span></button>
        <button class="cet-btn cet-align-btn" id="cet-align-canvas-right"  data-tip="Alinear derecha"><span class="material-icons">align_horizontal_right</span></button>
        <button class="cet-btn cet-align-btn" id="cet-align-canvas-top"    data-tip="Alinear arriba"><span class="material-icons">align_vertical_top</span></button>
        <button class="cet-btn cet-align-btn" id="cet-align-canvas-middle" data-tip="Centrar vertical"><span class="material-icons">align_vertical_center</span></button>
        <button class="cet-btn cet-align-btn" id="cet-align-canvas-bottom" data-tip="Alinear abajo"><span class="material-icons">align_vertical_bottom</span></button>

        <div class="cet-sep"></div>

        <!-- PROPS PANEL TOGGLE -->
        <button class="cet-btn" id="cet-props-toggle" data-tip="Panel de propiedades">
            <span class="material-icons">tune</span>
        </button>

        <div class="cet-sep"></div>

        <!-- ZOOM -->
        <button class="cet-btn" id="cet-zoom-out" data-tip="Alejar (-)"><span class="material-icons">zoom_out</span></button>
        <span class="cet-zoom-label" id="cet-zoom-val">FIT</span>
        <button class="cet-btn" id="cet-zoom-in"  data-tip="Acercar (+)"><span class="material-icons">zoom_in</span></button>
        <button class="cet-btn" id="cet-zoom-fit" data-tip="Ajustar (0)"><span class="material-icons">fit_screen</span></button>
        `;

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
        <div class="cet-prop-section">POSICIÓN Y TAMAÑO</div>
        <div class="cet-prop-row">
            <span class="cet-prop-label">X</span>
            <input type="number" class="cet-prop-input" id="cet-prop-x" style="width:62px;">
            <span class="cet-prop-label">Y</span>
            <input type="number" class="cet-prop-input" id="cet-prop-y" style="width:62px;">
        </div>
        <div class="cet-prop-row">
            <span class="cet-prop-label">W</span>
            <input type="number" class="cet-prop-input" id="cet-prop-w" style="width:62px;">
            <span class="cet-prop-label">H</span>
            <input type="number" class="cet-prop-input" id="cet-prop-h" style="width:62px;">
        </div>
        <div class="cet-prop-row">
            <span class="cet-prop-label">OPACIDAD</span>
            <input type="range" id="cet-prop-opacity" min="0" max="1" step="0.01" value="1"
                style="flex:1;accent-color:#00D9FF;">
            <span id="cet-prop-opacity-val" style="font-size:10px;color:#444;width:30px;text-align:right;font-family:monospace;">100%</span>
        </div>
        <div class="cet-prop-row">
            <span class="cet-prop-label">ROTACIÓN</span>
            <input type="number" class="cet-prop-input" id="cet-prop-rotation" placeholder="0" style="width:70px;">
            <span style="font-size:10px;color:#333;font-family:monospace;">°</span>
        </div>

        <!-- TEXT section -->
        <div id="cet-prop-text-section" style="display:none;">
            <div class="cet-prop-section" style="margin-top:8px;">TEXTO</div>
            <div class="cet-prop-row" style="margin-top:6px;">
                <span class="cet-prop-label">COLOR</span>
                <div class="cet-prop-color" id="cet-prop-color-wrap">
                    <div class="cet-prop-color-swatch" id="cet-prop-color-swatch"></div>
                    <input type="color" id="cet-prop-color" value="#ffffff">
                </div>
                <input type="text" class="cet-prop-input" id="cet-prop-color-hex" placeholder="#ffffff" style="font-family:monospace;">
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
                    <option value="500">Medium</option>
                    <option value="600">SemiBold</option>
                    <option value="700">Bold</option>
                    <option value="800">ExtraBold</option>
                    <option value="900">Black</option>
                </select>
            </div>
        </div>

        <!-- LAYER COLOR section -->
        <div id="cet-prop-layer-color-section" style="display:none;margin-top:4px;">
            <div class="cet-prop-section" style="margin-top:8px;">COLOR ELEMENTO</div>
            <div class="cet-prop-row" style="margin-top:6px;">
                <span class="cet-prop-label">RELLENO</span>
                <div class="cet-prop-color" id="cet-prop-fill-wrap">
                    <div class="cet-prop-color-swatch" id="cet-prop-fill-swatch"></div>
                    <input type="color" id="cet-prop-fill" value="#0a0a0c">
                </div>
                <input type="text" class="cet-prop-input" id="cet-prop-fill-hex" placeholder="#0a0a0c" style="font-family:monospace;">
            </div>
            <div class="cet-prop-row" style="margin-top:6px;">
                <span class="cet-prop-label">ACENTO</span>
                <div class="cet-prop-color" id="cet-prop-accent-wrap">
                    <div class="cet-prop-color-swatch" id="cet-prop-accent-swatch"></div>
                    <input type="color" id="cet-prop-accent" value="#00D9FF">
                </div>
                <input type="text" class="cet-prop-input" id="cet-prop-accent-hex" placeholder="#00D9FF" style="font-family:monospace;">
            </div>
        </div>

        <!-- ACTIONS -->
        <div class="cet-prop-section" style="margin-top:8px;">CAPA</div>
        <div class="cet-btn-row" style="margin-top:6px;">
            <button class="cet-prop-btn" id="cet-p-bring-front" title="Frente"><span class="material-icons">flip_to_front</span></button>
            <button class="cet-prop-btn" id="cet-p-bring-fwd"   title="Subir"><span class="material-icons">keyboard_arrow_up</span></button>
            <button class="cet-prop-btn" id="cet-p-send-bwd"    title="Bajar"><span class="material-icons">keyboard_arrow_down</span></button>
            <button class="cet-prop-btn" id="cet-p-send-back"   title="Fondo"><span class="material-icons">flip_to_back</span></button>
        </div>
        <div class="cet-btn-row" style="margin-top:6px;">
            <button class="cet-prop-btn" id="cet-p-lock"   title="Bloquear capa"><span class="material-icons">lock</span></button>
            <button class="cet-prop-btn" id="cet-p-hide"   title="Ocultar capa"><span class="material-icons">visibility_off</span></button>
            <button class="cet-prop-btn" id="cet-p-delete" title="Eliminar" style="color:#FF3366"><span class="material-icons">delete</span></button>
        </div>

        <!-- TYPE INFO -->
        <div id="cet-prop-type-label"
            style="margin-top:10px;font-size:9px;color:#1e1e1e;font-family:monospace;letter-spacing:1px;">
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
            'network_check','lan','hub','devices','smartphone','laptop','desktop_windows',
            'person','group','admin_panel_settings','manage_accounts','badge',
            'fingerprint','face','supervised_user_circle','account_circle',
            'send','email','message','chat','forum','notifications','inbox',
            'public','language','map','location_on','place','travel_explore','gps_fixed',
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
            'home','dashboard','apps','grid_view','view_list','view_module',
            'image','photo','camera','movie','music_note','mic',
            'folder','folder_open','file_present','description','article',
            'schedule','access_time','calendar_today','event','history',
            'dark_mode','light_mode','palette','design_services','auto_awesome',
            'rocket_launch','satellite','sensors','radar','gps_fixed',
            'lock_open','no_encryption','policy','verified_user','gpp_maybe',
            'key','password','token','encrypted',
            'cloud_sync','https','vpn_lock','firewall','security_update',
        ];
        const picker = document.createElement('div');
        picker.className = 'cet-icon-picker';
        picker.id = 'cet-icon-picker-' + this.mode;
        picker.innerHTML = `
            <input type="text" class="cet-icon-search"
                placeholder="Buscar icono... (ej: lock, cloud, code)"
                id="cet-icon-search-${this.mode}">
            <div class="cet-icon-grid" id="cet-icon-grid-${this.mode}"></div>
        `;
        this.container.appendChild(picker);
        this._iconPicker = picker;
        this._allIcons   = ICONS;

        const searchEl = picker.querySelector(`#cet-icon-search-${this.mode}`);
        const gridEl   = picker.querySelector(`#cet-icon-grid-${this.mode}`);

        const renderIcons = (filter='') => {
            const list = filter
                ? ICONS.filter(ic => ic.includes(filter.toLowerCase()))
                : ICONS;
            gridEl.innerHTML = list.map(ic =>
                `<div class="cet-icon-item" data-icon="${ic}" title="${ic}">
                    <span class="material-icons">${ic}</span>
                </div>`).join('');
            gridEl.querySelectorAll('.cet-icon-item').forEach(item => {
                item.onclick = () => { this._addIconLayer(item.dataset.icon); picker.classList.remove('visible'); };
            });
        };
        renderIcons();
        searchEl.addEventListener('input', (e) => renderIcons(e.target.value));
        document.addEventListener('mousedown', (e) => {
            if (!picker.contains(e.target) && !e.target.closest('#cet-add-icon'))
                picker.classList.remove('visible');
        });
    }

    // ─── BUILD CONTEXT MENU ───────────────────────────────────────────
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

        const b = (id,fn) => { const el=menu.querySelector('#'+id); if(el) el.onclick=fn; };
        b('cet-ctx-copy',  () => { this.copySelected();        this._hideCtxMenu(); });
        b('cet-ctx-paste', () => { this._pasteAtCtxPos();      this._hideCtxMenu(); });
        b('cet-ctx-dup',   () => { this.duplicateSelected();   this._hideCtxMenu(); });
        b('cet-ctx-front', () => { this.editor.bringToFront(); this._hideCtxMenu(); });
        b('cet-ctx-back',  () => { this.editor.sendToBack();   this._hideCtxMenu(); });
        b('cet-ctx-lock',  () => { this.editor.toggleLock();   this._hideCtxMenu(); });
        b('cet-ctx-hide',  () => { this.editor.toggleVisible(); this._hideCtxMenu(); });
        b('cet-ctx-del',   () => { this.deleteSelected();      this._hideCtxMenu(); });

        document.addEventListener('mousedown', (e) => {
            if (!menu.contains(e.target)) this._hideCtxMenu();
        });
    }

    _onEditorContextMenu(e) {
        const { clientX, clientY, layerIdx } = e.detail;
        if (layerIdx >= 0) {
            this.editor.selectedIdx = layerIdx;
            this.editor._drawOverlay();
        }
        this._ctxLastX = e.detail.canvasX;
        this._ctxLastY = e.detail.canvasY;
        const menu = this._ctxMenu;
        if (!menu) return;
        menu.style.left = clientX + 'px';
        menu.style.top  = clientY + 'px';
        menu.classList.add('visible');
        // Prevent menu from going off-screen
        requestAnimationFrame(() => {
            const r = menu.getBoundingClientRect();
            if (r.right  > window.innerWidth)  menu.style.left = (clientX - r.width)  + 'px';
            if (r.bottom > window.innerHeight)  menu.style.top  = (clientY - r.height) + 'px';
        });
    }

    _hideCtxMenu() { this._ctxMenu?.classList.remove('visible'); }

    _pasteAtCtxPos() {
        if (!this._clipboard || !this.editor.sceneGraph) return;
        const clone = JSON.parse(JSON.stringify(this._clipboard));
        clone.id = 'layer_' + Math.random().toString(36).substr(2,9);
        if (this._ctxLastX !== undefined) {
            clone.x = Math.round(this._ctxLastX - (clone.width||200)/2);
            clone.y = Math.round(this._ctxLastY - (clone.height||80)/2);
        } else {
            clone.x = (clone.x||0)+40;
            clone.y = (clone.y||0)+40;
        }
        clone._freeMove = true;
        this.editor.sceneGraph.layers.push(clone);
        this._commitChange();
    }

    // ─── TOOLBAR LISTENERS ───────────────────────────────────────────
    _attachToolbarListeners() {
        const tb = this._toolbar;
        const q  = (id) => tb.querySelector('#'+id);
        const on = (id,ev,fn) => { const el=q(id); if(el) el.addEventListener(ev,fn); };
        const click = (id,fn) => on(id,'click',fn);

        // Navigation (Studio)
        click('cet-prev', () => { if (this.options.onPrev) this.options.onPrev(); });
        click('cet-next', () => { if (this.options.onNext) this.options.onNext(); });

        // History
        click('cet-undo', () => this.undo());
        click('cet-redo', () => this.redo());

        // Add elements
        click('cet-add-text',  () => this._addTextLayer());
        click('cet-add-image', () => q('cet-img-file')?.click());
        on('cet-img-file','change',(e)=>{ if(e.target.files[0]) this._addImageLayer(e.target.files[0]); e.target.value=''; });
        click('cet-add-icon',  () => this._iconPicker?.classList.toggle('visible'));
        click('cet-add-rect',  () => this._addRectLayer());
        click('cet-add-div',   () => this._addDividerLayer());

        // Text color
        on('cet-text-color-input','input',(e)=>{
            q('cet-text-color-swatch').style.background = e.target.value;
            this._applyTextColor(e.target.value);
        });

        // Font size — both change and Enter key
        on('cet-fontsize','change',(e)=>this._applyFontSize(parseInt(e.target.value)));
        on('cet-fontsize','keydown',(e)=>{ if(e.key==='Enter') this._applyFontSize(parseInt(e.target.value)); });

        // Alignment (text)
        click('cet-align-left',   () => this._applyTextAlign('left'));
        click('cet-align-center', () => this._applyTextAlign('center'));
        click('cet-align-right',  () => this._applyTextAlign('right'));

        // Layer color
        on('cet-layer-color-input','input',(e)=>{
            q('cet-layer-color-swatch').style.background = e.target.value;
            this._applyLayerColor(e.target.value);
        });

        // Clipboard
        click('cet-copy',      () => this.copySelected());
        click('cet-paste',     () => this.pasteClipboard());
        click('cet-duplicate', () => this.duplicateSelected());
        click('cet-delete',    () => this.deleteSelected());

        // Layer order
        click('cet-bring-front', () => { this.editor.bringToFront(); this._updateSelectionUI(); });
        click('cet-bring-fwd',   () => { this.editor.bringForward(); this._updateSelectionUI(); });
        click('cet-send-bwd',    () => { this.editor.sendBackward(); this._updateSelectionUI(); });
        click('cet-send-back',   () => { this.editor.sendToBack();   this._updateSelectionUI(); });

        // Align to canvas
        click('cet-align-canvas-left',   () => { this.editor.alignLayers('left');   this._afterExternalAction(); });
        click('cet-align-canvas-center', () => { this.editor.alignLayers('center'); this._afterExternalAction(); });
        click('cet-align-canvas-right',  () => { this.editor.alignLayers('right');  this._afterExternalAction(); });
        click('cet-align-canvas-top',    () => { this.editor.alignLayers('top');    this._afterExternalAction(); });
        click('cet-align-canvas-middle', () => { this.editor.alignLayers('middle'); this._afterExternalAction(); });
        click('cet-align-canvas-bottom', () => { this.editor.alignLayers('bottom'); this._afterExternalAction(); });

        // Props panel toggle
        click('cet-props-toggle', () => {
            this._propPanel?.classList.toggle('visible');
            q('cet-props-toggle')?.classList.toggle('active');
        });

        // Zoom
        click('cet-zoom-out', () => this._zoom(-0.1));
        click('cet-zoom-in',  () => this._zoom(0.1));
        click('cet-zoom-fit', () => this._zoomFit());
    }

    _afterExternalAction() {
        this._pushHistory(this.editor.sceneGraph);
        this._updateSelectionUI();
        this._updatePropPanel();
        if (this.options.onSceneChange) this.options.onSceneChange(this.editor.sceneGraph);
    }

    // ─── PROPERTIES PANEL LISTENERS ──────────────────────────────────
    _attachPropListeners() {
        const pp = this._propPanel;
        const q  = (id) => pp.querySelector('#'+id);
        const on = (id,ev,fn) => { const el=q(id); if(el) el.addEventListener(ev,fn); };
        const click=(id,fn)=>on(id,'click',fn);

        // Position
        const applyPos = () => {
            const layer=this._getSelectedLayer(); if(!layer) return;
            const x=parseInt(q('cet-prop-x').value), y=parseInt(q('cet-prop-y').value);
            if(!isNaN(x)) layer.x=x; if(!isNaN(y)) layer.y=y;
            layer._freeMove=true; this._commitPropChange();
        };
        on('cet-prop-x','change',applyPos); on('cet-prop-y','change',applyPos);

        // Size
        const applySize = () => {
            const layer=this._getSelectedLayer(); if(!layer) return;
            const w=parseInt(q('cet-prop-w').value), h=parseInt(q('cet-prop-h').value);
            if(!isNaN(w)&&w>0) layer.width=w; if(!isNaN(h)&&h>0) layer.height=h;
            layer._userResized=true; layer._freeMove=true; this._commitPropChange();
        };
        on('cet-prop-w','change',applySize); on('cet-prop-h','change',applySize);

        // Opacity
        on('cet-prop-opacity','input',(e)=>{
            const layer=this._getSelectedLayer(); if(!layer) return;
            layer.opacity=parseFloat(e.target.value);
            q('cet-prop-opacity-val').textContent=Math.round(layer.opacity*100)+'%';
            this._commitPropChange();
        });

        // Rotation
        on('cet-prop-rotation','change',(e)=>{
            const layer=this._getSelectedLayer(); if(!layer) return;
            layer._rotation=parseFloat(e.target.value)||0;
            layer._freeMove=true; this._commitPropChange();
        });

        // Text color (picker + hex)
        on('cet-prop-color','input',(e)=>{
            q('cet-prop-color-swatch').style.background=e.target.value;
            q('cet-prop-color-hex').value=e.target.value;
            const layer=this._getSelectedLayer();
            if(layer){ layer.color=e.target.value; this._commitPropChange(); }
        });
        on('cet-prop-color-hex','change',(e)=>{
            const v=e.target.value.trim();
            if(/^#[0-9a-fA-F]{6}/.test(v)){
                try{ q('cet-prop-color').value=v.substring(0,7); }catch(_){}
                q('cet-prop-color-swatch').style.background=v;
                const layer=this._getSelectedLayer();
                if(layer){ layer.color=v; this._commitPropChange(); }
            }
        });

        // Font family & weight
        on('cet-prop-font','change',(e)=>{
            const layer=this._getSelectedLayer();
            if(layer?.font){ layer.font.family=e.target.value; this._commitPropChange(); }
        });
        on('cet-prop-weight','change',(e)=>{
            const layer=this._getSelectedLayer();
            if(layer?.font){ layer.font.weight=parseInt(e.target.value); this._commitPropChange(); }
        });

        // Fill color
        on('cet-prop-fill','input',(e)=>{
            q('cet-prop-fill-swatch').style.background=e.target.value;
            q('cet-prop-fill-hex').value=e.target.value;
            const layer=this._getSelectedLayer();
            if(layer){ layer.fill=e.target.value; this._commitPropChange(); }
        });
        on('cet-prop-fill-hex','change',(e)=>{
            const v=e.target.value.trim();
            if(/^#[0-9a-fA-F]{6}/.test(v)){
                try{ q('cet-prop-fill').value=v.substring(0,7); }catch(_){}
                const layer=this._getSelectedLayer();
                if(layer){ layer.fill=v; this._commitPropChange(); }
            }
        });

        // Accent color
        on('cet-prop-accent','input',(e)=>{
            q('cet-prop-accent-swatch').style.background=e.target.value;
            q('cet-prop-accent-hex').value=e.target.value;
            const layer=this._getSelectedLayer();
            if(layer){ layer.accentColor=e.target.value; this._commitPropChange(); }
        });
        on('cet-prop-accent-hex','change',(e)=>{
            const v=e.target.value.trim();
            if(/^#[0-9a-fA-F]{6}/.test(v)){
                try{ q('cet-prop-accent').value=v.substring(0,7); }catch(_){}
                const layer=this._getSelectedLayer();
                if(layer){ layer.accentColor=v; this._commitPropChange(); }
            }
        });

        // Layer actions in panel
        click('cet-p-bring-front',()=>{ this.editor.bringToFront(); this._updatePropPanel(); });
        click('cet-p-bring-fwd',  ()=>{ this.editor.bringForward(); this._updatePropPanel(); });
        click('cet-p-send-bwd',   ()=>{ this.editor.sendBackward(); this._updatePropPanel(); });
        click('cet-p-send-back',  ()=>{ this.editor.sendToBack();   this._updatePropPanel(); });
        click('cet-p-lock',  ()=>{ this.editor.toggleLock();    this._updatePropPanel(); });
        click('cet-p-hide',  ()=>{ this.editor.toggleVisible(); this._updatePropPanel(); });
        click('cet-p-delete',()=>{ this.deleteSelected(); });
    }

    // ─── SELECTION UI SYNC ───────────────────────────────────────────
    _updateSelectionUI() {
        const tb = this._toolbar;
        if (!tb) return;
        const q = (id) => tb.querySelector('#'+id);
        const hasSelected = this.editor.selectedIdx >= 0;
        const layer       = this._getSelectedLayer();
        const isText      = layer?.type === 'text';

        // Enable/disable selection-dependent buttons
        ['cet-copy','cet-duplicate','cet-delete',
         'cet-bring-front','cet-bring-fwd','cet-send-bwd','cet-send-back',
         'cet-align-canvas-left','cet-align-canvas-center','cet-align-canvas-right',
         'cet-align-canvas-top','cet-align-canvas-middle','cet-align-canvas-bottom',
        ].forEach(id => { const b=q(id); if(b) b.disabled=!hasSelected; });

        const pasteBtn = q('cet-paste');
        if (pasteBtn) pasteBtn.disabled = !this._clipboard;

        // Show/hide text props
        const textProps = tb.querySelector('#cet-text-props');
        if (textProps) textProps.style.display = (isText&&hasSelected) ? 'flex' : 'none';

        // Show/hide layer color
        const colorWrap = tb.querySelector('#cet-layer-color-wrap');
        if (colorWrap) {
            const show = hasSelected && layer && !isText &&
                ['rect','icon','hexagon_node','statbar','codeblock'].includes(layer.type);
            colorWrap.style.display = show ? 'flex' : 'none';
        }

        // Sync text color swatch
        if (isText && layer?.color) {
            const hex = this._toHex(layer.color);
            const sw  = tb.querySelector('#cet-text-color-swatch');
            const inp = tb.querySelector('#cet-text-color-input');
            if (sw) sw.style.background = hex;
            if (inp) { try { inp.value=hex; }catch(_){} }
        }

        // Sync font size
        if (isText && layer?.font?.size) {
            const fs = tb.querySelector('#cet-fontsize');
            if (fs && document.activeElement!==fs) fs.value = layer.font.size;
        }

        // Sync layer color swatch
        if (!isText && layer) {
            const col = layer.accentColor||layer.color||layer.fill||'#00D9FF';
            const hex = this._toHex(col);
            const sw  = tb.querySelector('#cet-layer-color-swatch');
            const inp = tb.querySelector('#cet-layer-color-input');
            if (sw) sw.style.background = hex;
            if (inp) { try { inp.value=hex; }catch(_){} }
        }
    }

    _updatePropPanel() {
        const pp = this._propPanel;
        if (!pp||!pp.classList.contains('visible')) return;
        const q = (id) => pp.querySelector('#'+id);

        const layer = this._getSelectedLayer();
        if (!layer) {
            q('cet-prop-type-label').textContent = '— ningún elemento seleccionado —';
            return;
        }
        const box = this.editor.editableLayers[this.editor.selectedIdx];
        q('cet-prop-type-label').textContent = `TYPE: ${(layer.type||'?').toUpperCase()}  ID: ${layer.id||'—'}`;

        if (box) {
            const setIfBlur=(id,v)=>{ const el=q(id); if(el&&document.activeElement!==el) el.value=Math.round(v); };
            setIfBlur('cet-prop-x', box.x); setIfBlur('cet-prop-y', box.y);
            setIfBlur('cet-prop-w', box.width); setIfBlur('cet-prop-h', box.height);
        }

        const op = layer.opacity!==undefined ? layer.opacity : 1;
        q('cet-prop-opacity').value = op;
        q('cet-prop-opacity-val').textContent = Math.round(op*100)+'%';

        // Rotation
        const rotEl = q('cet-prop-rotation');
        if (rotEl && document.activeElement!==rotEl)
            rotEl.value = Math.round(layer._rotation||0);

        // Text section
        const isText = layer.type==='text';
        q('cet-prop-text-section').style.display = isText ? 'block' : 'none';
        if (isText) {
            const hex = this._toHex(layer.color);
            q('cet-prop-color-swatch').style.background = hex;
            try { q('cet-prop-color').value = hex; } catch(_) {}
            if (document.activeElement !== q('cet-prop-color-hex'))
                q('cet-prop-color-hex').value = layer.color||hex;
            const fontEl = q('cet-prop-font');
            if (fontEl && layer.font?.family) {
                const opt = fontEl.querySelector(`option[value="${layer.font.family}"]`);
                if (opt) fontEl.value = layer.font.family;
            }
            if (layer.font?.weight && document.activeElement!==q('cet-prop-weight'))
                q('cet-prop-weight').value = String(layer.font.weight);
        }

        // Layer color section
        const hasColor = !isText && (layer.fill||layer.accentColor||layer.color);
        q('cet-prop-layer-color-section').style.display = hasColor ? 'block' : 'none';
        if (hasColor) {
            const fill   = this._toHex(layer.fill||'#0a0a0c');
            const accent = this._toHex(layer.accentColor||layer.color||'#00D9FF');
            q('cet-prop-fill-swatch').style.background   = fill;
            q('cet-prop-accent-swatch').style.background = accent;
            if (document.activeElement!==q('cet-prop-fill-hex'))   q('cet-prop-fill-hex').value   = layer.fill||'';
            if (document.activeElement!==q('cet-prop-accent-hex')) q('cet-prop-accent-hex').value = layer.accentColor||layer.color||'';
            try { q('cet-prop-fill').value=fill; q('cet-prop-accent').value=accent; } catch(_){}
        }
    }

    // ─── HISTORY ─────────────────────────────────────────────────────
    pushHistory(sceneGraph) {
        if (!sceneGraph) return;
        const snap = JSON.stringify(sceneGraph);
        if (this._historyIdx>=0 && this._history[this._historyIdx]===snap) return;
        this._history = this._history.slice(0, this._historyIdx+1);
        this._history.push(snap);
        if (this._history.length > this._MAX_HISTORY) this._history.shift();
        this._historyIdx = this._history.length-1;
        this._syncHistoryButtons();
    }

    _pushHistory(sceneGraph) { this.pushHistory(sceneGraph); }

    undo() {
        if (this._historyIdx <= 0) return;
        this._historyIdx--;
        this._restoreHistory();
    }

    redo() {
        if (this._historyIdx >= this._history.length-1) return;
        this._historyIdx++;
        this._restoreHistory();
    }

    async _restoreHistory() {
        if (this._historyIdx<0 || this._historyIdx>=this._history.length) return;
        const snapshot = JSON.parse(this._history[this._historyIdx]);
        // Guard so editor.load → onChange doesn't push new history
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
        const tb = this._toolbar;
        if (!tb) return;
        const u = tb.querySelector('#cet-undo');
        const r = tb.querySelector('#cet-redo');
        if (u) u.disabled = this._historyIdx <= 0;
        if (r) r.disabled = this._historyIdx >= this._history.length-1;
        if (this.options.onHistoryChange)
            this.options.onHistoryChange(this._historyIdx>0, this._historyIdx<this._history.length-1);
    }

    // ─── CLIPBOARD ───────────────────────────────────────────────────
    copySelected() {
        const layer = this._getSelectedLayer();
        if (!layer) return;
        this._clipboard = JSON.parse(JSON.stringify(layer));
        const pb = this._toolbar?.querySelector('#cet-paste');
        if (pb) pb.disabled = false;
    }

    pasteClipboard() {
        if (!this._clipboard||!this.editor.sceneGraph) return;
        const clone = JSON.parse(JSON.stringify(this._clipboard));
        clone.id = 'layer_'+Math.random().toString(36).substr(2,9);
        clone.x = (clone.x||0)+40; clone.y=(clone.y||0)+40;
        clone._freeMove = true;
        this.editor.sceneGraph.layers.push(clone);
        this._commitChange();
    }

    duplicateSelected() {
        const layer = this._getSelectedLayer();
        if (!layer||!this.editor.sceneGraph) return;
        const clone = JSON.parse(JSON.stringify(layer));
        clone.id = 'layer_'+Math.random().toString(36).substr(2,9);
        clone.x = (clone.x||0)+40; clone.y=(clone.y||0)+40;
        clone._freeMove=true;
        this.editor.sceneGraph.layers.push(clone);
        this._commitChange();
    }

    deleteSelected() {
        if (this.editor.selectedIdx<0||!this.editor.sceneGraph) return;
        const box = this.editor.editableLayers[this.editor.selectedIdx];
        if (!box||['brand','swipe','page_number'].includes(box.type)||box.locked) return;
        this.editor.sceneGraph.layers.splice(box.layerIndex,1);
        this.editor.selectedIdx=-1; this.editor.selectedIdxs=[];
        this._commitChange();
    }

    // ─── ADD LAYERS ──────────────────────────────────────────────────
    _addTextLayer() {
        if (!this.editor.sceneGraph) return;
        const W=this.editor.renderer.width, H=this.editor.renderer.height;
        const newLayer = {
            id:'layer_'+Math.random().toString(36).substr(2,9),
            type:'text', content:'Nuevo Texto',
            x:Math.round(W*0.1), y:Math.round(H*0.5),
            width:Math.round(W*0.8),
            font:{family:'BlackOpsOne',size:80,weight:900},
            color:'#ffffff', align:'center', _freeMove:true
        };
        this.editor.sceneGraph.layers.push(newLayer);
        this._commitChange(() => {
            // Auto-select new layer after render
            const newIdx = this.editor.editableLayers.findIndex(b=>b.layer.id===newLayer.id);
            if (newIdx>=0) { this.editor.selectedIdx=newIdx; this.editor._drawOverlay(); }
        });
    }

    _addRectLayer() {
        if (!this.editor.sceneGraph) return;
        const W=this.editor.renderer.width, H=this.editor.renderer.height;
        this.editor.sceneGraph.layers.push({
            id:'layer_'+Math.random().toString(36).substr(2,9),
            type:'rect', x:Math.round(W*0.1), y:Math.round(H*0.3),
            width:Math.round(W*0.8), height:200,
            fill:'#0a0a0c', border:{color:'#00D9FF44',width:2},
            radius:16, accentColor:'#00D9FF', _freeMove:true, _userResized:true
        });
        this._commitChange();
    }

    _addDividerLayer() {
        if (!this.editor.sceneGraph) return;
        const W=this.editor.renderer.width, H=this.editor.renderer.height;
        this.editor.sceneGraph.layers.push({
            id:'layer_'+Math.random().toString(36).substr(2,9),
            type:'divider', x:Math.round(W*0.05), y:Math.round(H*0.5),
            width:Math.round(W*0.9), _freeMove:true, _userResized:true
        });
        this._commitChange();
    }

    _addImageLayer(file) {
        if (!this.editor.sceneGraph) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const W=this.editor.renderer.width, H=this.editor.renderer.height;
            const img = new Image();
            img.onload = () => {
                const aspect = img.width/img.height;
                const w      = Math.round(W*0.8);
                const h      = Math.round(w/aspect);
                this.editor.sceneGraph.layers.push({
                    id:'layer_'+Math.random().toString(36).substr(2,9),
                    type:'image', src:e.target.result,
                    x:Math.round(W*0.1), y:Math.round((H-h)/2),
                    width:w, height:h, opacity:1,
                    _freeMove:true, _userResized:true
                });
                this._commitChange();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    _addIconLayer(iconName) {
        if (!this.editor.sceneGraph) return;
        const W=this.editor.renderer.width, H=this.editor.renderer.height;
        this.editor.sceneGraph.layers.push({
            id:'layer_'+Math.random().toString(36).substr(2,9),
            type:'icon', icon:iconName,
            x:Math.round(W/2-80), y:Math.round(H/2-80),
            size:160, color:'#00D9FF', _freeMove:true, _userResized:true
        });
        this._commitChange();
    }

    // ─── APPLY PROPERTIES ────────────────────────────────────────────
    _applyTextColor(hex) {
        const layer=this._getSelectedLayer();
        if (!layer||layer.type!=='text') return;
        layer.color=hex; this._commitPropChange();
    }

    _applyFontSize(size) {
        const layer=this._getSelectedLayer();
        if (!layer||layer.type!=='text'||isNaN(size)) return;
        if (!layer.font) layer.font={};
        layer.font.size = Math.max(8,Math.min(400,size));
        this._commitPropChange();
    }

    _applyTextAlign(align) {
        const layer=this._getSelectedLayer();
        if (!layer||layer.type!=='text') return;
        layer.align=align; this._commitPropChange();
    }

    _applyLayerColor(hex) {
        const layer=this._getSelectedLayer();
        if (!layer) return;
        if      (layer.accentColor!==undefined) layer.accentColor=hex;
        else if (layer.color!==undefined)       layer.color=hex;
        else if (layer.fill!==undefined)        layer.fill=hex;
        this._commitPropChange();
    }

    // ─── COMMIT CHANGES ──────────────────────────────────────────────
    /**
     * _commitChange: called after mutating the scene graph directly (add/delete/paste/duplicate).
     * DOES NOT call editor.onChange — that would loop back through our hook.
     * Instead calls onSceneChange directly after rendering.
     */
    async _commitChange(afterRender) {
        if (!this.editor.sceneGraph) return;
        this._inToolbarCallback = true;
        try {
            await this.editor._reRender();
            this._pushHistory(this.editor.sceneGraph);
            this._updateSelectionUI();
            this._updatePropPanel();
            if (this.options.onSceneChange) this.options.onSceneChange(this.editor.sceneGraph);
            if (afterRender) afterRender();
        } finally {
            this._inToolbarCallback = false;
        }
    }

    /**
     * _commitPropChange: debounced version for live property changes (color, font, etc.)
     */
    _commitPropChange() {
        if (!this.editor.sceneGraph) return;
        clearTimeout(this._propDebounce);
        this._propDebounce = setTimeout(async () => {
            this._inToolbarCallback = true;
            try {
                await this.editor._reRender();
                this._pushHistory(this.editor.sceneGraph);
                this._updateSelectionUI();
                this._updatePropPanel();
                if (this.options.onSceneChange) this.options.onSceneChange(this.editor.sceneGraph);
            } finally {
                this._inToolbarCallback = false;
            }
        }, 80);
    }

    // ─── ZOOM ────────────────────────────────────────────────────────
    _zoom(delta) {
        if (!this.editor.wrapper) return;
        const cur  = this.editor.displayScale || 1;
        const next = Math.max(0.15, Math.min(3, cur+delta));
        this.editor.displayScale = next;
        this.editor.scale = 1/next;
        this.editor.wrapper.style.transform       = `scale(${next})`;
        this.editor.wrapper.style.transformOrigin = 'top left';
        // Re-center
        const cW  = this.editor.renderer.width  * next;
        const cH  = this.editor.renderer.height * next;
        const rect = this.editor.container.getBoundingClientRect();
        this.editor.wrapper.style.left = Math.max(0,(rect.width -cW)/2)+'px';
        this.editor.wrapper.style.top  = Math.max(0,(rect.height-cH)/2)+'px';
        const zl = this._toolbar?.querySelector('#cet-zoom-val');
        if (zl) zl.textContent = Math.round(next*100)+'%';
    }

    _zoomFit() {
        this.editor._fitToContainer();
        const zl = this._toolbar?.querySelector('#cet-zoom-val');
        if (zl) zl.textContent = 'FIT';
    }

    // ─── NAV COUNTER ─────────────────────────────────────────────────
    updateNavCounter(current, total) {
        const el = this._toolbar?.querySelector('#cet-slide-counter');
        if (el) el.textContent = `${current}/${total}`;
    }

    // ─── GLOBAL KEYBOARD ─────────────────────────────────────────────
    _onGlobalKeyDown(e) {
        const tag          = document.activeElement?.tagName?.toLowerCase();
        const isInput      = tag==='input'||tag==='textarea'||tag==='select';
        const isTextEditor = document.activeElement?.classList?.contains('canvas-text-editor');
        if (isInput && !isTextEditor) return;

        const ctrl = e.ctrlKey||e.metaKey;

        if (ctrl && e.key==='z' && !e.shiftKey) { e.preventDefault(); this.undo();            return; }
        if (ctrl && (e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); this.redo(); return; }
        if (ctrl && e.key==='c')                { e.preventDefault(); this.copySelected();     return; }
        if (ctrl && e.key==='v')                { e.preventDefault(); this.pasteClipboard();   return; }
        if (ctrl && e.key==='d')                { e.preventDefault(); this.duplicateSelected();return; }
        // T = add text
        if (!ctrl && e.key==='t' && !isInput)   { e.preventDefault(); this._addTextLayer();    return; }
        // 0 = fit
        if (!ctrl && e.key==='0' && !isInput)   { e.preventDefault(); this._zoomFit();         return; }
        // Escape hides context menu
        if (e.key==='Escape') { this._hideCtxMenu(); this._iconPicker?.classList.remove('visible'); }
    }

    // ─── UTILS ───────────────────────────────────────────────────────
    _getSelectedLayer() {
        if (this.editor.selectedIdx<0) return null;
        return this.editor.editableLayers?.[this.editor.selectedIdx]?.layer||null;
    }

    /**
     * _toHex — safely convert any CSS color to #rrggbb.
     * Handles: #rgb, #rrggbb, #rrggbbaa, rgba(...), named colors, null/undefined.
     */
    _toHex(color) {
        if (!color || typeof color !== 'string') return '#ffffff';
        const s = color.trim();
        // Already #rrggbb or #rrggbbaa
        if (/^#[0-9a-fA-F]{6,8}$/.test(s)) return s.substring(0,7);
        // #rgb shorthand
        if (/^#[0-9a-fA-F]{3}$/.test(s)) {
            return '#'+s[1]+s[1]+s[2]+s[2]+s[3]+s[3];
        }
        // rgba / rgb
        const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return '#'+[m[1],m[2],m[3]].map(n=>parseInt(n).toString(16).padStart(2,'0')).join('');
        // named colors — render to canvas
        try {
            const ctx = document.createElement('canvas').getContext('2d');
            ctx.fillStyle = s;
            const computed = ctx.fillStyle;
            if (computed && computed.startsWith('#')) return computed.substring(0,7);
        } catch(_) {}
        return '#00D9FF'; // fallback
    }

    // ─── DESTROY ─────────────────────────────────────────────────────
    destroy() {
        clearTimeout(this._propDebounce);
        document.removeEventListener('keydown',   this._boundKeyDown,  true);
        this.container.removeEventListener('editor-contextmenu', this._boundCtxMenu);
        this._toolbar?.remove();
        this._propPanel?.remove();
        this._iconPicker?.remove();
        this._ctxMenu?.remove();
        this._toolbar    = null;
        this._propPanel  = null;
        this._iconPicker = null;
        this._ctxMenu    = null;
    }
}

if (typeof module !== 'undefined') module.exports = CanvasEditorToolbar;
else window.CanvasEditorToolbar = CanvasEditorToolbar;
