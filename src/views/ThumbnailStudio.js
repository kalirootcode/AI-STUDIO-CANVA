/**
 * ThumbnailStudio.js — Sistema Profesional de Creación de Miniaturas
 * Integración: Cyber-Canvas Electron
 * Formatos: YouTube 16:9 (1280×720) | Reels/TikTok 9:16 (1080×1920)
 */

export class ThumbnailStudio {
  constructor(canvasRenderer, containerId) {
    this.renderer = canvasRenderer;
    this.container = document.getElementById(containerId);
    this.currentScene = null;
    this.uploadedBg = null;
    this.format = '16:9';
    this.FORMATS = {
      '16:9': { w: 1280, h: 720, label: 'YouTube 16:9', icon: '▬' },
      '9:16': { w: 1080, h: 1920, label: 'Reels / TikTok 9:16', icon: '▮' },
      '1:1': { w: 1080, h: 1080, label: 'Instagram 1:1', icon: '■' },
    };
    this._init();
  }

  _init() {
    this.container.innerHTML = '';
    this.container.insertAdjacentHTML('beforeend', this._buildHTML());
    this._injectStyles();
    this._bindEvents();
    this._loadDefaultScene();
  }

  // ─────────────────────────────────────────────────────────────
  // HTML SHELL
  // ─────────────────────────────────────────────────────────────
  _buildHTML() {
    return `
<div class="ts-root" id="ts-root">

  <!-- LEFT: Controls -->
  <aside class="ts-panel ts-left">

    <!-- FORMAT SWITCHER -->
    <div class="ts-section">
      <div class="ts-section-title"><span class="ts-dot"></span>FORMATO</div>
      <div class="ts-format-grid">
        ${Object.entries(this.FORMATS).map(([k, v]) => `
          <button class="ts-format-btn ${k === '16:9' ? 'active' : ''}" data-format="${k}">
            <span class="ts-fmt-icon">${v.icon}</span>
            <span class="ts-fmt-ratio">${k}</span>
            <span class="ts-fmt-label">${v.label}</span>
          </button>`).join('')}
      </div>
    </div>

    <!-- TEMPLATE PICKER -->
    <div class="ts-section">
      <div class="ts-section-title"><span class="ts-dot"></span>PLANTILLA</div>
      <div class="ts-template-grid" id="ts-template-grid"></div>
    </div>

    <!-- BACKGROUND CONTROLS -->
    <div class="ts-section">
      <div class="ts-section-title"><span class="ts-dot"></span>FONDO</div>
      <div class="ts-bg-tabs">
        <button class="ts-tab active" data-tab="color">Color</button>
        <button class="ts-tab" data-tab="gradient">Degradado</button>
        <button class="ts-tab" data-tab="image">Imagen</button>
      </div>

      <!-- COLOR TAB -->
      <div class="ts-tab-content active" id="ts-tab-color">
        <div class="ts-color-swatches" id="ts-bg-swatches">
          ${['#000000', '#0a0a0c', '#030308', '#0c0606', '#060610', '#111827', '#1a0533', '#0d1f0d'].map(c => `
            <button class="ts-swatch" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}
        </div>
        <div class="ts-color-row">
          <input type="color" id="ts-bg-custom-color" value="#000000" class="ts-color-input">
          <span class="ts-color-hex" id="ts-bg-hex">#000000</span>
        </div>
      </div>

      <!-- GRADIENT TAB -->
      <div class="ts-tab-content" id="ts-tab-gradient">
        <div class="ts-gradient-presets" id="ts-gradient-presets">
          ${[
        { stops: ['#000000', '#0a1628'], label: 'Deep Ocean' },
        { stops: ['#030303', '#1a0033'], label: 'Void Purple' },
        { stops: ['#000000', '#1a0000'], label: 'Blood Void' },
        { stops: ['#030303', '#002810'], label: 'Matrix' },
        { stops: ['#050505', '#0a1a3a'], label: 'Cyber Blue' },
        { stops: ['#0a0006', '#1f0a2a'], label: 'Neon Dusk' },
      ].map(g => `
            <button class="ts-grad-btn" data-stops='${JSON.stringify(g.stops)}' title="${g.label}"
              style="background:linear-gradient(135deg,${g.stops[0]},${g.stops[1]})">
              <span class="ts-grad-label">${g.label}</span>
            </button>`).join('')}
        </div>
        <div class="ts-grad-angle-row">
          <label>Ángulo <span id="ts-angle-val">135°</span></label>
          <input type="range" id="ts-grad-angle" min="0" max="360" value="135" class="ts-slider">
        </div>
        <div class="ts-color-row">
          <label style="font-size:10px;color:#888">Desde</label>
          <input type="color" id="ts-grad-c1" value="#000000" class="ts-color-input">
          <label style="font-size:10px;color:#888">Hasta</label>
          <input type="color" id="ts-grad-c2" value="#0a1628" class="ts-color-input">
        </div>
      </div>

      <!-- IMAGE TAB -->
      <div class="ts-tab-content" id="ts-tab-image">
        <div class="ts-upload-zone" id="ts-upload-zone">
          <div class="ts-upload-icon">⬆</div>
          <div class="ts-upload-text">Arrastra imagen o click para subir</div>
          <div class="ts-upload-sub">JPG, PNG, WEBP — Recomendado 4K</div>
          <input type="file" id="ts-bg-file" accept="image/*" style="display:none">
        </div>
        <div class="ts-image-controls" id="ts-image-controls" style="display:none">
          <div class="ts-img-preview-row">
            <img id="ts-img-thumb" style="width:60px;height:40px;object-fit:cover;border-radius:4px;border:1px solid #333">
            <button class="ts-btn-sm ts-btn-danger" id="ts-remove-bg-img">✕ Quitar</button>
          </div>
          <div class="ts-control-row">
            <label>Opacidad <span id="ts-img-opacity-val">100%</span></label>
            <input type="range" id="ts-img-opacity" min="0" max="100" value="100" class="ts-slider">
          </div>
          <div class="ts-control-row">
            <label>Blur <span id="ts-img-blur-val">0px</span></label>
            <input type="range" id="ts-img-blur" min="0" max="40" value="0" class="ts-slider">
          </div>
          <div class="ts-overlay-row">
            <label>Overlay de color</label>
            <input type="color" id="ts-overlay-color" value="#000000" class="ts-color-input">
            <input type="range" id="ts-overlay-opacity" min="0" max="90" value="40" class="ts-slider">
          </div>
        </div>
      </div>
    </div>

    <!-- TYPOGRAPHY CONTROLS -->
    <div class="ts-section">
      <div class="ts-section-title"><span class="ts-dot"></span>TIPOGRAFÍA</div>

      <div class="ts-field-group">
        <label class="ts-field-label">TÍTULO PRINCIPAL</label>
        <textarea class="ts-textarea" id="ts-main-title" rows="2" placeholder="Escribe el título impactante...">APRENDE NMAP EN 10 MINUTOS</textarea>
        <div class="ts-inline-controls">
          <input type="color" id="ts-title-color" value="#ffffff" class="ts-color-input">
          <select class="ts-select" id="ts-title-font">
            <option value="BlackOpsOne">Black Ops One</option>
            <option value="'Bebas Neue'" selected>Bebas Neue</option>
            <option value="'Impact'">Impact</option>
            <option value="'MPLUS Code Latin'">MPLUS Code</option>
            <option value="'JetBrains Mono'">JetBrains Mono</option>
          </select>
          <input type="range" id="ts-title-size" min="40" max="200" value="100" class="ts-slider" title="Tamaño">
        </div>
        <div class="ts-inline-controls" style="margin-top:6px">
          <label style="font-size:10px;color:#888">Sombra glow</label>
          <input type="color" id="ts-title-glow" value="#00D9FF" class="ts-color-input">
          <input type="range" id="ts-title-glow-blur" min="0" max="80" value="20" class="ts-slider">
        </div>
      </div>

      <div class="ts-field-group">
        <label class="ts-field-label">SUBTÍTULO / BADGE</label>
        <input type="text" class="ts-input" id="ts-subtitle" placeholder="Ej: TUTORIAL COMPLETO" value="TUTORIAL COMPLETO">
        <div class="ts-inline-controls">
          <input type="color" id="ts-sub-color" value="#00D9FF" class="ts-color-input">
          <input type="color" id="ts-sub-bg" value="#00D9FF" class="ts-color-input" title="Fondo badge">
          <select class="ts-select" id="ts-sub-style">
            <option value="badge">Badge</option>
            <option value="line">Línea</option>
            <option value="pill">Pill</option>
            <option value="ghost">Ghost</option>
            <option value="none">Solo texto</option>
          </select>
        </div>
      </div>

      <div class="ts-field-group">
        <label class="ts-field-label">TEXTO SUPERIOR (Eyebrow)</label>
        <input type="text" class="ts-input" id="ts-eyebrow" placeholder="Ej: KR-CLIDN · CIBERSEGURIDAD" value="KR-CLIDN · CIBERSEGURIDAD">
        <input type="color" id="ts-eyebrow-color" value="#A855F7" class="ts-color-input" style="margin-top:6px">
      </div>

      <div class="ts-field-group">
        <label class="ts-field-label">NÚMERO / STAT GRANDE</label>
        <div class="ts-inline-controls">
          <input type="text" class="ts-input" id="ts-stat-number" placeholder="Ej: #1" value="" style="width:80px">
          <input type="color" id="ts-stat-color" value="#FF3366" class="ts-color-input">
          <label style="font-size:10px;color:#888;white-space:nowrap">Mostrar</label>
          <input type="checkbox" id="ts-stat-show" checked>
        </div>
      </div>
    </div>

    <!-- VISUAL EFFECTS -->
    <div class="ts-section">
      <div class="ts-section-title"><span class="ts-dot"></span>EFECTOS VISUALES</div>
      <div class="ts-effects-grid">
        <label class="ts-effect-toggle" title="Red de nodos">
          <input type="checkbox" id="ts-fx-nodegraph" checked>
          <span>Red Nodos</span>
        </label>
        <label class="ts-effect-toggle" title="Ruido de grano">
          <input type="checkbox" id="ts-fx-grain" checked>
          <span>Grano</span>
        </label>
        <label class="ts-effect-toggle" title="Orbes ambientales">
          <input type="checkbox" id="ts-fx-orbs" checked>
          <span>Orbes</span>
        </label>
        <label class="ts-effect-toggle" title="Barras de acento">
          <input type="checkbox" id="ts-fx-scanlines">
          <span>Scanlines</span>
        </label>
        <label class="ts-effect-toggle" title="Patrón de circuito">
          <input type="checkbox" id="ts-fx-circuit">
          <span>Circuito</span>
        </label>
        <label class="ts-effect-toggle" title="Glitch en el título">
          <input type="checkbox" id="ts-fx-glitch">
          <span>Glitch</span>
        </label>
        <label class="ts-effect-toggle" title="Marco de color">
          <input type="checkbox" id="ts-fx-frame" checked>
          <span>Marco</span>
        </label>
        <label class="ts-effect-toggle" title="Luz de fondo LED">
          <input type="checkbox" id="ts-fx-led">
          <span>LED Glow</span>
        </label>
      </div>

      <div class="ts-control-row" style="margin-top:10px">
        <label>Color primario <span style="font-size:9px;color:#888">efectos & texto</span></label>
        <input type="color" id="ts-primary-color" value="#00D9FF" class="ts-color-input">
      </div>
      <div class="ts-color-swatches" id="ts-primary-swatches">
        ${['#00D9FF', '#A855F7', '#FF3366', '#00FF88', '#FF9500', '#FF0000', '#0088FF', '#D946EF'].map(c => `
          <button class="ts-swatch" data-primary="${c}" style="background:${c}" title="${c}"></button>`).join('')}
      </div>
    </div>

    <!-- LOGO / MARCA -->
    <div class="ts-section">
      <div class="ts-section-title"><span class="ts-dot"></span>MARCA / LOGO</div>
      <div class="ts-inline-controls">
        <input type="text" class="ts-input" id="ts-brand-name" value="KR-CLIDN" placeholder="Nombre de marca">
        <input type="color" id="ts-brand-color" value="#00D9FF" class="ts-color-input">
      </div>
      <div class="ts-inline-controls" style="margin-top:6px">
        <label style="font-size:10px;color:#888">Posición</label>
        <select class="ts-select" id="ts-brand-pos">
          <option value="top-left">Arriba Izq</option>
          <option value="top-right">Arriba Der</option>
          <option value="bottom-left" selected>Abajo Izq</option>
          <option value="bottom-right">Abajo Der</option>
        </select>
        <input type="checkbox" id="ts-brand-show" checked>
        <label style="font-size:10px;color:#888">Visible</label>
      </div>
    </div>

    <!-- ELEMENTOS EXTRA -->
    <div class="ts-section">
      <div class="ts-section-title"><span class="ts-dot"></span>ELEMENTOS</div>

      <div class="ts-field-group">
        <label class="ts-field-label">BADGE DE DURACIÓN</label>
        <div class="ts-inline-controls">
          <input type="text" class="ts-input" id="ts-duration" placeholder="Ej: 10:32" value="" style="width:70px">
          <label style="font-size:10px;color:#888">Mostrar</label>
          <input type="checkbox" id="ts-duration-show">
        </div>
      </div>

      <div class="ts-field-group">
        <label class="ts-field-label">ETIQUETA DE CATEGORÍA</label>
        <div class="ts-inline-controls">
          <input type="text" class="ts-input" id="ts-category" placeholder="Ej: HACKING" value="HACKING">
          <input type="color" id="ts-category-color" value="#FF3366" class="ts-color-input">
        </div>
      </div>

      <div class="ts-field-group">
        <label class="ts-field-label">IMAGEN / PERSONA (PNG recortada)</label>
        <div class="ts-upload-zone ts-upload-sm" id="ts-person-zone">
          <div class="ts-upload-icon" style="font-size:18px">👤</div>
          <div class="ts-upload-text" style="font-size:10px">PNG con fondo transparente</div>
          <input type="file" id="ts-person-file" accept="image/*" style="display:none">
        </div>
        <div id="ts-person-controls" style="display:none;margin-top:8px">
          <div class="ts-inline-controls">
            <label style="font-size:10px;color:#888">Pos X</label>
            <input type="range" id="ts-person-x" min="-200" max="200" value="0" class="ts-slider">
            <label style="font-size:10px;color:#888">Scale</label>
            <input type="range" id="ts-person-scale" min="30" max="200" value="100" class="ts-slider">
          </div>
          <button class="ts-btn-sm ts-btn-danger" id="ts-remove-person">✕ Quitar persona</button>
        </div>
      </div>
    </div>

  </aside>

  <!-- CENTER: Canvas Preview -->
  <main class="ts-center">
    <div class="ts-preview-header">
      <div class="ts-preview-info">
        <span class="ts-badge-live">● LIVE</span>
        <span id="ts-preview-dims">1280 × 720</span>
      </div>
      <div class="ts-preview-actions">
        <button class="ts-action-btn" id="ts-btn-randomize" title="Aleatorizar diseño">⟳ Random</button>
        <button class="ts-action-btn" id="ts-btn-copy" title="Copiar al portapapeles">⧉ Copiar</button>
        <button class="ts-action-btn ts-action-primary" id="ts-btn-export-png">↓ PNG</button>
        <button class="ts-action-btn ts-action-primary" id="ts-btn-export-jpg">↓ JPG</button>
      </div>
    </div>

    <div class="ts-canvas-stage" id="ts-canvas-stage">
      <div class="ts-canvas-wrapper" id="ts-canvas-wrapper">
        <canvas id="ts-main-canvas"></canvas>
      </div>
    </div>

    <!-- Template quick-switch bar -->
    <div class="ts-template-bar" id="ts-template-bar"></div>
  </main>

  <!-- RIGHT: Layer Inspector -->
  <aside class="ts-panel ts-right">
    <div class="ts-section-title" style="padding:16px 16px 8px"><span class="ts-dot"></span>INSPECTOR</div>

    <!-- Composition guides -->
    <div class="ts-section">
      <div class="ts-section-title" style="font-size:9px">COMPOSICIÓN</div>
      <div class="ts-comp-guides">
        <label class="ts-effect-toggle">
          <input type="checkbox" id="ts-guide-thirds">
          <span>Tercios</span>
        </label>
        <label class="ts-effect-toggle">
          <input type="checkbox" id="ts-guide-center">
          <span>Centro</span>
        </label>
        <label class="ts-effect-toggle">
          <input type="checkbox" id="ts-guide-safe">
          <span>Zona segura</span>
        </label>
      </div>
    </div>

    <!-- Color palette from image -->
    <div class="ts-section">
      <div class="ts-section-title" style="font-size:9px">PALETA EXTRAÍDA</div>
      <div class="ts-palette-row" id="ts-palette-row">
        <div class="ts-palette-empty">Sube una imagen para extraer colores</div>
      </div>
    </div>

    <!-- History -->
    <div class="ts-section">
      <div class="ts-section-title" style="font-size:9px">HISTORIAL</div>
      <div class="ts-history-list" id="ts-history-list">
        <div class="ts-history-empty">Sin historial aún</div>
      </div>
    </div>

    <!-- Export presets -->
    <div class="ts-section">
      <div class="ts-section-title" style="font-size:9px">EXPORTAR LOTE</div>
      <div class="ts-export-presets">
        <button class="ts-preset-btn" id="ts-export-all-formats">
          <span class="ts-preset-icon">⬡</span>
          <span>Todos los formatos</span>
          <span class="ts-preset-sub">16:9 + 9:16 + 1:1</span>
        </button>
        <button class="ts-preset-btn" id="ts-export-yt-pack">
          <span class="ts-preset-icon">▶</span>
          <span>YouTube Pack</span>
          <span class="ts-preset-sub">1280×720 optimizado</span>
        </button>
        <button class="ts-preset-btn" id="ts-export-social-pack">
          <span class="ts-preset-icon">◈</span>
          <span>Social Pack</span>
          <span class="ts-preset-sub">Reels + Stories + Feed</span>
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="ts-section ts-stats">
      <div class="ts-stat-item"><span>Plantilla</span><span id="ts-stat-template">—</span></div>
      <div class="ts-stat-item"><span>Formato</span><span id="ts-stat-format">16:9</span></div>
      <div class="ts-stat-item"><span>Res.</span><span id="ts-stat-res">1280×720</span></div>
      <div class="ts-stat-item"><span>Efectos</span><span id="ts-stat-fx">3</span></div>
    </div>
    <!-- Mismo footer portado de StudioView -->
    <div class="studio-footer" style="grid-column: 1 / -1; position: relative;">
        <div class="status-left">
            <span class="status-dot active"></span>
            <span id="ts-statusText">SISTEMA LISTO</span>
        </div>

        <div class="footer-controls">
            <button id="ts-foot-export-png" class="footer-btn accent" title="Exportar PNGs">
                <span class="material-icons">collections</span> MULTI PNG
            </button>
        </div>

        <div class="progress-container">
            <div id="ts-progressBar" class="progress-bar"></div>
        </div>

        <div class="status-right">
            <span>v2.0.1</span>
        </div>
    </div>

</div>`;
  }

  // ─────────────────────────────────────────────────────────────
  // STYLES
  // ─────────────────────────────────────────────────────────────
  _injectStyles() {
    if (document.getElementById('ts-styles')) return;
    const style = document.createElement('style');
    style.id = 'ts-styles';
    style.textContent = `
/* ── THUMBNAIL STUDIO ROOT ── */
.ts-root {
  display: grid;
  grid-template-columns: 280px 1fr 220px;
  height: 100%;
  width: 100%;
  background: #030303;
  color: #e0e0e0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  overflow: hidden;
  position: relative;
}

/* ── PANELS ── */
.ts-panel {
  background: #080808;
  border-right: 1px solid #1a1a1a;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #222 transparent;
}
.ts-right { border-right: none; border-left: 1px solid #1a1a1a; }

/* ── SECTIONS ── */
.ts-section {
  padding: 14px 16px;
  border-bottom: 1px solid #111;
}
.ts-section-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #444;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.ts-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #00D9FF;
  box-shadow: 0 0 6px #00D9FF;
  display: inline-block;
  flex-shrink: 0;
}

/* ── FORMAT GRID ── */
.ts-format-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.ts-format-btn {
  background: #111;
  border: 1px solid #222;
  border-radius: 8px;
  padding: 8px 4px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.15s;
  color: #888;
}
.ts-format-btn:hover { border-color: #00D9FF44; color: #ccc; }
.ts-format-btn.active {
  border-color: #00D9FF;
  background: #00D9FF0a;
  color: #00D9FF;
  box-shadow: 0 0 12px #00D9FF22;
}
.ts-fmt-icon { font-size: 16px; }
.ts-fmt-ratio { font-size: 10px; font-weight: 700; }
.ts-fmt-label { font-size: 8px; color: inherit; opacity: 0.7; text-align: center; }

/* ── TEMPLATE GRID ── */
.ts-template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.ts-tpl-thumb {
  aspect-ratio: 16/9;
  background: #111;
  border: 1px solid #222;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: all 0.15s;
}
.ts-tpl-thumb:hover { border-color: #00D9FF44; }
.ts-tpl-thumb.active { border-color: #00D9FF; box-shadow: 0 0 10px #00D9FF33; }
.ts-tpl-thumb canvas { width: 100%; height: 100%; display: block; }
.ts-tpl-label {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.8);
  font-size: 8px;
  padding: 2px 4px;
  color: #888;
  text-align: center;
  letter-spacing: 1px;
}
.ts-tpl-thumb.active .ts-tpl-label { color: #00D9FF; }

/* ── BG TABS ── */
.ts-bg-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}
.ts-tab {
  flex: 1;
  padding: 5px 0;
  background: #111;
  border: 1px solid #222;
  border-radius: 5px;
  color: #666;
  cursor: pointer;
  font-family: inherit;
  font-size: 10px;
  transition: all 0.15s;
}
.ts-tab.active { background: #00D9FF12; border-color: #00D9FF; color: #00D9FF; }
.ts-tab-content { display: none; }
.ts-tab-content.active { display: block; }

/* ── SWATCHES ── */
.ts-color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}
.ts-swatch {
  width: 24px; height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: transform 0.1s;
  padding: 0;
}
.ts-swatch:hover { transform: scale(1.15); border-color: rgba(255,255,255,0.4); }

/* ── COLOR ROW ── */
.ts-color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.ts-color-input {
  width: 32px; height: 28px;
  border: 1px solid #333;
  border-radius: 4px;
  background: #111;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
}
.ts-color-hex {
  font-size: 10px;
  color: #666;
  font-family: 'JetBrains Mono', monospace;
}

/* ── GRADIENT ── */
.ts-gradient-presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}
.ts-grad-btn {
  height: 36px;
  border-radius: 6px;
  border: 1px solid #222;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.15s;
}
.ts-grad-btn:hover { border-color: rgba(255,255,255,0.3); transform: scale(1.03); }
.ts-grad-label { font-size: 7px; color: rgba(255,255,255,0.6); position: absolute; bottom: 2px; left: 4px; }
.ts-grad-angle-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }

/* ── UPLOAD ZONE ── */
.ts-upload-zone {
  border: 1px dashed #333;
  border-radius: 8px;
  padding: 20px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  background: #0a0a0a;
}
.ts-upload-zone:hover, .ts-upload-zone.drag-over { border-color: #00D9FF; background: #00D9FF08; }
.ts-upload-sm { padding: 12px 8px; }
.ts-upload-icon { font-size: 24px; margin-bottom: 6px; color: #444; }
.ts-upload-text { font-size: 10px; color: #666; }
.ts-upload-sub { font-size: 8px; color: #444; margin-top: 2px; }
.ts-img-preview-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }

/* ── SLIDER ── */
.ts-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 3px;
  background: #222;
  border-radius: 2px;
  outline: none;
}
.ts-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #00D9FF;
  cursor: pointer;
  box-shadow: 0 0 6px #00D9FF66;
}

/* ── FIELDS ── */
.ts-field-group { margin-bottom: 12px; }
.ts-field-label {
  display: block;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #555;
  text-transform: uppercase;
  margin-bottom: 5px;
}
.ts-textarea, .ts-input, .ts-select {
  width: 100%;
  background: #111;
  border: 1px solid #222;
  border-radius: 5px;
  color: #e0e0e0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 7px 9px;
  outline: none;
  resize: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.ts-textarea:focus, .ts-input:focus, .ts-select:focus { border-color: #00D9FF44; }
.ts-select { padding: 5px 8px; }
.ts-inline-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  flex-wrap: wrap;
}
.ts-inline-controls .ts-slider { width: 80px; }
.ts-inline-controls .ts-select { flex: 1; min-width: 0; }

/* ── EFFECTS GRID ── */
.ts-effects-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}
.ts-effect-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  background: #0f0f0f;
  border: 1px solid #1a1a1a;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s;
  font-size: 10px;
  color: #777;
  user-select: none;
}
.ts-effect-toggle:hover { border-color: #333; color: #aaa; }
.ts-effect-toggle input[type=checkbox] { accent-color: #00D9FF; width: 12px; height: 12px; }
.ts-effect-toggle:has(input:checked) { border-color: #00D9FF33; color: #ccc; background: #00D9FF08; }

/* ── CENTER AREA ── */
.ts-center {
  display: flex;
  flex-direction: column;
  background: #050505;
  overflow: hidden;
}
.ts-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #111;
  flex-shrink: 0;
}
.ts-preview-info { display: flex; align-items: center; gap: 10px; }
.ts-badge-live {
  font-size: 9px;
  color: #ff3366;
  animation: ts-blink 2s infinite;
  font-weight: 700;
}
@keyframes ts-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
.ts-preview-actions { display: flex; gap: 6px; align-items: center; }
.ts-action-btn {
  background: #111;
  border: 1px solid #222;
  border-radius: 5px;
  color: #888;
  padding: 5px 10px;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.ts-action-btn:hover { border-color: #333; color: #ccc; }
.ts-action-primary {
  background: #00D9FF12;
  border-color: #00D9FF44;
  color: #00D9FF;
}
.ts-action-primary:hover { background: #00D9FF22; border-color: #00D9FF; }

/* ── CANVAS STAGE ── */
.ts-canvas-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  position: relative;
  background:
    radial-gradient(circle at 50% 50%, #0a0a0a 0%, #030303 100%);
}
.ts-canvas-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,217,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,217,255,0.015) 1px, transparent 1px);
  background-size: 20px 20px;
}
.ts-canvas-wrapper {
  position: relative;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.05),
    0 20px 80px rgba(0,0,0,0.8),
    0 0 40px rgba(0,217,255,0.05);
  border-radius: 4px;
  overflow: hidden;
}
.ts-canvas-wrapper canvas {
  display: block;
  image-rendering: -webkit-optimize-contrast;
}

/* ── TEMPLATE BAR ── */
.ts-template-bar {
  height: 64px;
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  border-top: 1px solid #111;
  overflow-x: auto;
  align-items: center;
  flex-shrink: 0;
  scrollbar-width: thin;
  scrollbar-color: #222 transparent;
}
.ts-bar-thumb {
  height: 48px;
  aspect-ratio: 16/9;
  background: #111;
  border: 1px solid #1a1a1a;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.15s;
  position: relative;
}
.ts-bar-thumb:hover { border-color: #00D9FF44; }
.ts-bar-thumb.active { border-color: #00D9FF; }
.ts-bar-thumb canvas { width: 100%; height: 100%; display: block; }

/* ── RIGHT PANEL ── */
.ts-comp-guides { display: flex; flex-direction: column; gap: 4px; }
.ts-palette-row { display: flex; gap: 4px; flex-wrap: wrap; }
.ts-palette-swatch { width: 28px; height: 28px; border-radius: 4px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); }
.ts-palette-empty { font-size: 9px; color: #444; }
.ts-history-list { display: flex; flex-direction: column; gap: 4px; }
.ts-history-empty { font-size: 9px; color: #444; }
.ts-history-item {
  display: flex; gap: 6px; align-items: center;
  padding: 5px 6px;
  background: #0d0d0d;
  border: 1px solid #1a1a1a;
  border-radius: 4px;
  cursor: pointer;
}
.ts-history-item:hover { border-color: #333; }
.ts-history-thumb { width: 36px; height: 20px; border-radius: 2px; overflow: hidden; flex-shrink: 0; }
.ts-history-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ts-history-meta { flex: 1; min-width: 0; }
.ts-history-name { font-size: 9px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ts-history-time { font-size: 8px; color: #444; }

/* ── EXPORT PRESETS ── */
.ts-export-presets { display: flex; flex-direction: column; gap: 4px; }
.ts-preset-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px;
  background: #0d0d0d;
  border: 1px solid #1a1a1a;
  border-radius: 6px;
  cursor: pointer;
  color: #888;
  font-family: inherit;
  font-size: 10px;
  text-align: left;
  transition: all 0.15s;
  width: 100%;
}
.ts-preset-btn:hover { border-color: #00D9FF33; color: #ccc; background: #00D9FF05; }
.ts-preset-icon { font-size: 14px; }
.ts-preset-sub { margin-left: auto; font-size: 8px; color: #444; }

/* ── STATS ── */
.ts-stats { display: flex; flex-direction: column; gap: 6px; }
.ts-stat-item { display: flex; justify-content: space-between; font-size: 10px; color: #555; }
.ts-stat-item span:last-child { color: #00D9FF; }

/* ── MISC ── */
.ts-control-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 10px; color: #666; }
.ts-control-row label { flex: 1; }
.ts-overlay-row { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
.ts-overlay-row label { font-size: 10px; color: #666; }
.ts-btn-sm {
  padding: 4px 8px; border-radius: 4px; font-family: inherit; font-size: 9px; cursor: pointer;
  border: 1px solid #333; background: #111; color: #888;
}
.ts-btn-danger { border-color: #ff336633; color: #ff3366; }
.ts-btn-danger:hover { background: #ff336610; }

/* ── GUIDE OVERLAYS ── */
.ts-guide-thirds, .ts-guide-center, .ts-guide-safe {
  position: absolute; pointer-events: none; inset: 0;
}
`;
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────────────────────────
  // TEMPLATES DEFINITIONS (10 diseños profesionales)
  // ─────────────────────────────────────────────────────────────
  _getTemplates() {
    return [
      { id: 'impact', label: 'IMPACT', desc: 'Título masivo centrado' },
      { id: 'split', label: 'SPLIT', desc: 'Imagen + texto partido' },
      { id: 'cinematic', label: 'CINEMA', desc: 'Barras cine + título' },
      { id: 'neon-frame', label: 'NEON', desc: 'Marco de neón' },
      { id: 'terminal', label: 'TERMINAL', desc: 'Estilo terminal hacker' },
      { id: 'minimal-bold', label: 'MINIMAL', desc: 'Bold minimalista' },
      { id: 'glitch', label: 'GLITCH', desc: 'Efecto glitch distorsión' },
      { id: 'magazine', label: 'MAGAZINE', desc: 'Estilo editorial' },
      { id: 'stat-hero', label: 'STAT', desc: 'Número grande hero' },
      { id: 'dark-card', label: 'CARD', desc: 'Tarjeta premium oscura' },
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // CANVAS RENDERER — The actual drawing engine
  // ─────────────────────────────────────────────────────────────
  async _renderToCanvas(canvas, opts = {}) {
    const { w, h } = this.FORMATS[this.format];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const cfg = this._getConfig();
    const tpl = opts.template || cfg.template;

    ctx.clearRect(0, 0, w, h);

    // 1. BACKGROUND
    await this._drawBackground(ctx, w, h, cfg);

    // 2. VISUAL EFFECTS (behind text)
    if (cfg.fx.orbs) this._drawOrbs(ctx, w, h, cfg.primary);
    if (cfg.fx.nodegraph) this._drawNodeGraph(ctx, w, h, cfg.primary);
    if (cfg.fx.circuit) this._drawCircuit(ctx, w, h, cfg.primary);
    if (cfg.fx.scanlines) this._drawScanlines(ctx, w, h);

    // 3. PERSON IMAGE (behind text, above bg)
    if (cfg.personImg) {
      await this._drawPerson(ctx, w, h, cfg);
    }

    // 4. TEMPLATE-SPECIFIC LAYOUT
    this._drawTemplate(ctx, w, h, cfg, tpl);

    // 5. GUIDE OVERLAYS
    if (cfg.guides.thirds) this._drawThirds(ctx, w, h);
    if (cfg.guides.center) this._drawCenter(ctx, w, h);
    if (cfg.guides.safe) this._drawSafeZone(ctx, w, h);

    // 6. GRAIN (always on top)
    if (cfg.fx.grain) this._drawGrain(ctx, w, h);
  }

  _getConfig() {
    const root = this.container.querySelector('#ts-root') || this.container;
    const $ = id => root.querySelector(`#${id}`);
    return {
      template: this.currentTemplate || 'impact',
      primary: $('ts-primary-color')?.value || '#00D9FF',
      bgMode: this._activeBgTab || 'color',
      bgColor: $('ts-bg-custom-color')?.value || '#000000',
      bgGrad: {
        c1: $('ts-grad-c1')?.value || '#000000',
        c2: $('ts-grad-c2')?.value || '#0a1628',
        angle: parseInt($('ts-grad-angle')?.value || '135'),
      },
      bgImg: this.uploadedBg,
      imgOpacity: parseInt($('ts-img-opacity')?.value || '100') / 100,
      imgBlur: parseInt($('ts-img-blur')?.value || '0'),
      overlayColor: $('ts-overlay-color')?.value || '#000000',
      overlayOpacity: parseInt($('ts-overlay-opacity')?.value || '40') / 100,
      mainTitle: $('ts-main-title')?.value || '',
      subtitle: $('ts-subtitle')?.value || '',
      eyebrow: $('ts-eyebrow')?.value || '',
      statNum: $('ts-stat-number')?.value || '',
      showStat: $('ts-stat-show')?.checked,
      titleFont: $('ts-title-font')?.value || 'BlackOpsOne',
      titleSize: parseInt($('ts-title-size')?.value || '100'),
      titleColor: $('ts-title-color')?.value || '#ffffff',
      titleGlow: $('ts-title-glow')?.value || '#00D9FF',
      titleGlowBlur: parseInt($('ts-title-glow-blur')?.value || '20'),
      subColor: $('ts-sub-color')?.value || '#00D9FF',
      subBg: $('ts-sub-bg')?.value || '#00D9FF',
      subStyle: $('ts-sub-style')?.value || 'badge',
      eyebrowColor: $('ts-eyebrow-color')?.value || '#A855F7',
      brandName: $('ts-brand-name')?.value || 'KR-CLIDN',
      brandColor: $('ts-brand-color')?.value || '#00D9FF',
      brandPos: $('ts-brand-pos')?.value || 'bottom-left',
      showBrand: $('ts-brand-show')?.checked,
      duration: $('ts-duration')?.value || '',
      showDuration: $('ts-duration-show')?.checked,
      category: $('ts-category')?.value || '',
      categoryColor: $('ts-category-color')?.value || '#FF3366',
      personImg: this.uploadedPerson,
      personX: parseInt($('ts-person-x')?.value || '0'),
      personScale: parseInt($('ts-person-scale')?.value || '100') / 100,
      fx: {
        nodegraph: $('ts-fx-nodegraph')?.checked,
        grain: $('ts-fx-grain')?.checked,
        orbs: $('ts-fx-orbs')?.checked,
        scanlines: $('ts-fx-scanlines')?.checked,
        circuit: $('ts-fx-circuit')?.checked,
        glitch: $('ts-fx-glitch')?.checked,
        frame: $('ts-fx-frame')?.checked,
        led: $('ts-fx-led')?.checked,
      },
      guides: {
        thirds: $('ts-guide-thirds')?.checked,
        center: $('ts-guide-center')?.checked,
        safe: $('ts-guide-safe')?.checked,
      }
    };
  }

  async _drawBackground(ctx, w, h, cfg) {
    ctx.save();
    if (cfg.bgMode === 'image' && cfg.bgImg) {
      if (cfg.imgBlur > 0) {
        ctx.filter = `blur(${cfg.imgBlur}px)`;
        ctx.drawImage(cfg.bgImg, -cfg.imgBlur * 2, -cfg.imgBlur * 2, w + cfg.imgBlur * 4, h + cfg.imgBlur * 4);
        ctx.filter = 'none';
      } else {
        ctx.drawImage(cfg.bgImg, 0, 0, w, h);
      }
      // Overlay
      ctx.globalAlpha = cfg.overlayOpacity;
      ctx.fillStyle = cfg.overlayColor;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    } else if (cfg.bgMode === 'gradient') {
      const rad = (cfg.bgGrad.angle * Math.PI) / 180;
      const grd = ctx.createLinearGradient(
        w / 2 - Math.cos(rad) * w / 2, h / 2 - Math.sin(rad) * h / 2,
        w / 2 + Math.cos(rad) * w / 2, h / 2 + Math.sin(rad) * h / 2
      );
      grd.addColorStop(0, cfg.bgGrad.c1);
      grd.addColorStop(1, cfg.bgGrad.c2);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = cfg.bgColor;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  _drawOrbs(ctx, w, h, primary) {
    ctx.save();
    const hex = primary || '#00D9FF';
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const orbs = [
      { x: w * 0.2, y: h * 0.2, radius: w * 0.4, op: 0.06 },
      { x: w * 0.8, y: h * 0.75, radius: w * 0.35, op: 0.04 },
      { x: w * 0.55, y: h * 0.45, radius: w * 0.25, op: 0.03 },
    ];
    for (const o of orbs) {
      const grd = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
      grd.addColorStop(0, `rgba(${r},${g},${b},${o.op})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  _drawNodeGraph(ctx, w, h, primary) {
    ctx.save();
    const hex = primary || '#00D9FF';
    ctx.strokeStyle = hex; ctx.fillStyle = hex;
    const nodes = [], N = 80, dist = 180;
    let seed = 42;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    for (let i = 0; i < N; i++) nodes.push({ x: rnd() * w, y: rnd() * h, s: rnd() * 2 + 1 });
    ctx.lineWidth = 1;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < dist) { ctx.globalAlpha = (1 - d / dist) * 0.12; ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke(); }
    }
    ctx.globalAlpha = 0.3;
    for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, n.s, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  _drawCircuit(ctx, w, h, primary) {
    ctx.save(); ctx.globalAlpha = 0.08;
    ctx.strokeStyle = primary || '#00D9FF'; ctx.lineWidth = 1.5;
    const gs = 120;
    for (let x = 0; x < w; x += gs) for (let y = 0; y < h; y += gs) {
      ctx.beginPath(); ctx.moveTo(x, y + gs * 0.5); ctx.lineTo(x + gs * 0.3, y + gs * 0.5);
      ctx.lineTo(x + gs * 0.5, y + gs * 0.3); ctx.lineTo(x + gs * 0.8, y + gs * 0.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + gs * 0.3, y + gs * 0.5, 3, 0, Math.PI * 2); ctx.fillStyle = primary || '#00D9FF'; ctx.fill();
    }
    ctx.restore();
  }

  _drawScanlines(ctx, w, h) {
    ctx.save(); ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#000';
    for (let y = 0; y < h; y += 4) { ctx.fillRect(0, y, w, 2); }
    ctx.restore();
  }

  _drawGrain(ctx, w, h) {
    ctx.save(); ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#fff';
    const total = Math.floor(w * h * 0.005);
    for (let i = 0; i < total; i++) { ctx.fillRect((Math.random() * w) | 0, (Math.random() * h) | 0, 1, 1); }
    ctx.restore();
  }

  async _drawPerson(ctx, w, h, cfg) {
    if (!cfg.personImg) return;
    ctx.save();
    const img = cfg.personImg;
    const scale = cfg.personScale;
    const dh = h * 0.85 * scale;
    const dw = img.naturalWidth / img.naturalHeight * dh;
    const cx = w / 2 + (w * 0.25 * cfg.personX / 100);
    const x = cx - dw / 2;
    const y = h - dh;
    // person glow
    ctx.shadowColor = cfg.primary;
    ctx.shadowBlur = 40;
    ctx.drawImage(img, x, y, dw, dh);
    ctx.restore();
  }

  // ─── TEXT HELPERS ───
  _wrapText(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  _drawGlowText(ctx, text, x, y, color, blur) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  _drawSubtitleBadge(ctx, text, x, y, style, color, bgColor, w) {
    if (!text) return 0;
    ctx.save();
    const pad = { x: 24, y: 10 };
    const fs = Math.max(14, w * 0.018);
    ctx.font = `700 ${fs}px 'JetBrains Mono', monospace`;
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width;
    const bw = tw + pad.x * 2, bh = fs + pad.y * 2;
    const bx = x - bw / 2;
    const by = y - bh / 2;

    if (style === 'badge') {
      ctx.fillStyle = bgColor + '22';
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
      ctx.strokeStyle = bgColor; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.stroke();
    } else if (style === 'pill') {
      ctx.fillStyle = bgColor;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh / 2); ctx.fill();
      color = '#000';
    } else if (style === 'line') {
      ctx.strokeStyle = bgColor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.stroke();
    } else if (style === 'ghost') {
      ctx.strokeStyle = bgColor + '55'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.shadowColor = bgColor; ctx.shadowBlur = 8;
    ctx.fillText(text.toUpperCase(), x, y + 1);
    ctx.restore();
    return bh;
  }

  _drawEyebrow(ctx, text, cx, y, color, w) {
    if (!text) return;
    ctx.save();
    const fs = Math.max(11, w * 0.012);
    ctx.font = `600 ${fs}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.85;
    ctx.letterSpacing = '3px';
    ctx.fillText(text.toUpperCase(), cx, y);
    ctx.restore();
  }

  _drawBrand(ctx, w, h, cfg) {
    if (!cfg.showBrand || !cfg.brandName) return;
    ctx.save();
    const fs = Math.max(10, w * 0.012);
    ctx.font = `700 ${fs}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = cfg.brandColor;
    ctx.shadowColor = cfg.brandColor; ctx.shadowBlur = 10;
    ctx.textBaseline = 'middle';
    const margin = w * 0.04;
    const pos = cfg.brandPos;
    const x = pos.includes('right') ? w - margin : margin;
    const y = pos.includes('top') ? margin * 0.8 : h - margin * 0.8;
    ctx.textAlign = pos.includes('right') ? 'right' : 'left';
    ctx.fillText('● ' + cfg.brandName, x, y);
    ctx.restore();
  }

  _drawCategoryLabel(ctx, w, h, cfg) {
    if (!cfg.category) return;
    ctx.save();
    const fs = Math.max(10, w * 0.013);
    ctx.font = `700 ${fs}px 'JetBrains Mono', monospace`;
    const tw = ctx.measureText(cfg.category).width;
    const pad = { x: 16, y: 7 };
    const bw = tw + pad.x * 2, bh = fs + pad.y * 2;
    const x = w * 0.04, y = h * 0.04;
    ctx.fillStyle = cfg.categoryColor + '22';
    ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 3); ctx.fill();
    ctx.strokeStyle = cfg.categoryColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 3); ctx.stroke();
    ctx.fillStyle = cfg.categoryColor; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.shadowColor = cfg.categoryColor; ctx.shadowBlur = 8;
    ctx.fillText(cfg.category, x + pad.x, y + bh / 2);
    ctx.restore();
  }

  _drawDuration(ctx, w, h, cfg) {
    if (!cfg.showDuration || !cfg.duration) return;
    ctx.save();
    const fs = Math.max(12, w * 0.018);
    ctx.font = `700 ${fs}px 'JetBrains Mono', monospace`;
    const tw = ctx.measureText(cfg.duration).width;
    const pad = { x: 14, y: 7 };
    const bw = tw + pad.x * 2, bh = fs + pad.y * 2;
    const x = w - bw - w * 0.04, y = h - bh - h * 0.03;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(cfg.duration, x + pad.x, y + bh / 2);
    ctx.restore();
  }

  _drawFrame(ctx, w, h, color) {
    ctx.save();
    const grd = ctx.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, color);
    grd.addColorStop(0.5, color + '88');
    grd.addColorStop(1, color);
    ctx.strokeStyle = grd; ctx.lineWidth = 3;
    ctx.shadowColor = color; ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, h); ctx.lineTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(0, h);
    ctx.stroke();
    // Bottom bar
    const bg = ctx.createLinearGradient(0, 0, w, 0);
    bg.addColorStop(0, color); bg.addColorStop(0.6, color); bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.roundRect(w * 0.04, h * 0.95, w * 0.3, 3, 2); ctx.fill();
    ctx.restore();
  }

  _drawLedGlow(ctx, w, h, color) {
    ctx.save();
    const grd = ctx.createLinearGradient(0, h, 0, h * 0.5);
    grd.addColorStop(0, color + '18');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // TEMPLATE DRAWERS (10 unique layouts)
  // ─────────────────────────────────────────────────────────────
  _drawTemplate(ctx, w, h, cfg, tpl) {
    if (cfg.fx.frame) this._drawFrame(ctx, w, h, cfg.primary);
    if (cfg.fx.led) this._drawLedGlow(ctx, w, h, cfg.primary);

    switch (tpl) {
      case 'impact': this._tplImpact(ctx, w, h, cfg); break;
      case 'split': this._tplSplit(ctx, w, h, cfg); break;
      case 'cinematic': this._tplCinematic(ctx, w, h, cfg); break;
      case 'neon-frame': this._tplNeonFrame(ctx, w, h, cfg); break;
      case 'terminal': this._tplTerminal(ctx, w, h, cfg); break;
      case 'minimal-bold': this._tplMinimalBold(ctx, w, h, cfg); break;
      case 'glitch': this._tplGlitch(ctx, w, h, cfg); break;
      case 'magazine': this._tplMagazine(ctx, w, h, cfg); break;
      case 'stat-hero': this._tplStatHero(ctx, w, h, cfg); break;
      case 'dark-card': this._tplDarkCard(ctx, w, h, cfg); break;
      default: this._tplImpact(ctx, w, h, cfg);
    }
    this._drawCategoryLabel(ctx, w, h, cfg);
    this._drawDuration(ctx, w, h, cfg);
    this._drawBrand(ctx, w, h, cfg);
  }

  _tplImpact(ctx, w, h, cfg) {
    const cx = w / 2;
    this._drawEyebrow(ctx, cfg.eyebrow, cx, h * 0.34, cfg.eyebrowColor, w);
    // Big title
    const maxFs = cfg.titleSize * (w / 1280);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = cfg.titleColor;
    ctx.shadowColor = cfg.titleGlow; ctx.shadowBlur = cfg.titleGlowBlur;
    const lines = cfg.mainTitle.split('\n');
    let fs = maxFs;
    ctx.font = `900 ${fs}px ${cfg.titleFont}, 'Impact', sans-serif`;
    while (ctx.measureText(lines[0]).width > w * 0.88 && fs > 20) { fs -= 2; ctx.font = `900 ${fs}px ${cfg.titleFont}, 'Impact', sans-serif`; }
    const lh = fs * 1.05;
    const totalH = lines.length * lh;
    let y = h * 0.5 - totalH / 2 + lh / 2;
    for (const line of lines) { ctx.fillText(line.toUpperCase(), cx, y); y += lh; }
    ctx.restore();
    const subY = h * 0.5 + totalH / 2 + h * 0.06;
    this._drawSubtitleBadge(ctx, cfg.subtitle, cx, subY, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  _tplSplit(ctx, w, h, cfg) {
    // Left vertical accent
    ctx.save();
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, cfg.primary); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.shadowColor = cfg.primary; ctx.shadowBlur = 20;
    ctx.fillRect(w * 0.04, 0, 3, h);
    ctx.restore();
    // Text left-aligned
    const lx = w * 0.08;
    this._drawEyebrow(ctx, cfg.eyebrow, lx + (w * 0.4), h * 0.32, cfg.eyebrowColor, w);
    ctx.save();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = cfg.titleColor; ctx.shadowColor = cfg.titleGlow; ctx.shadowBlur = cfg.titleGlowBlur;
    const maxFs = cfg.titleSize * (w / 1280) * 0.9;
    const lines = this._wrapText({ measureText: (t) => { ctx.font = `900 ${maxFs}px ${cfg.titleFont}, Impact, sans-serif`; return ctx.measureText(t); } }, cfg.mainTitle, w * 0.5);
    ctx.font = `900 ${maxFs}px ${cfg.titleFont}, Impact, sans-serif`;
    let y = h * 0.36;
    for (const l of lines) { ctx.fillText(l.toUpperCase(), lx, y); y += maxFs * 1.05; }
    ctx.restore();
    this._drawSubtitleBadge(ctx, cfg.subtitle, lx + ctx.measureText?.(cfg.subtitle)?.width / 2 || w * 0.25, y + h * 0.05, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  _tplCinematic(ctx, w, h, cfg) {
    // Black bars
    const bh = h * 0.13;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, bh); ctx.fillRect(0, h - bh, w, bh);
    // Subtle gradient over bars
    [0, h - bh].forEach(by => {
      const g = ctx.createLinearGradient(0, by, w, by);
      g.addColorStop(0, cfg.primary + '33'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, by, w, bh);
    });
    const cx = w / 2, cy = h / 2;
    this._drawEyebrow(ctx, cfg.eyebrow, cx, cy - h * 0.15, cfg.eyebrowColor, w);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = cfg.titleColor;
    ctx.shadowColor = cfg.titleGlow; ctx.shadowBlur = cfg.titleGlowBlur;
    const fs = cfg.titleSize * (w / 1280) * 0.85;
    ctx.font = `900 ${fs}px ${cfg.titleFont}, Impact, sans-serif`;
    const lines = cfg.mainTitle.split('\n');
    let y = cy - (lines.length - 1) * fs * 0.55;
    for (const l of lines) { ctx.fillText(l.toUpperCase(), cx, y); y += fs * 1.1; }
    ctx.restore();
    this._drawSubtitleBadge(ctx, cfg.subtitle, cx, cy + h * 0.15, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  _tplNeonFrame(ctx, w, h, cfg) {
    // Inner glowing rectangle
    const pad = w * 0.06;
    ctx.save();
    ctx.shadowColor = cfg.primary; ctx.shadowBlur = 30;
    ctx.strokeStyle = cfg.primary; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 8); ctx.stroke();
    // Second inner
    ctx.shadowBlur = 15; ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.roundRect(pad + 8, pad + 8, w - pad * 2 - 16, h - pad * 2 - 16, 6); ctx.stroke();
    ctx.restore();
    const cx = w / 2;
    this._drawEyebrow(ctx, cfg.eyebrow, cx, h * 0.38, cfg.eyebrowColor, w);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = cfg.titleColor; ctx.shadowColor = cfg.titleGlow; ctx.shadowBlur = cfg.titleGlowBlur * 1.5;
    const fs = cfg.titleSize * (w / 1280) * 0.88;
    ctx.font = `900 ${fs}px ${cfg.titleFont}, Impact, sans-serif`;
    const lines = cfg.mainTitle.split('\n');
    let y = h * 0.5 - (lines.length - 1) * fs * 0.55;
    for (const l of lines) { ctx.fillText(l.toUpperCase(), cx, y); y += fs * 1.1; }
    ctx.restore();
    this._drawSubtitleBadge(ctx, cfg.subtitle, cx, h * 0.68, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  _tplTerminal(ctx, w, h, cfg) {
    // Terminal window
    const mx = w * 0.06, my = h * 0.12, mw = w - mx * 2, mh = h - my * 2;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 10); ctx.fill();
    ctx.strokeStyle = cfg.primary + '44'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 10); ctx.stroke();
    // Title bar
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(mx, my, mw, 36, { tl: 10, tr: 10, br: 0, bl: 0 }); ctx.fill();
    ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(mx + 18 + i * 22, my + 18, 6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = cfg.primary; ctx.font = `500 ${Math.max(10, w * 0.011)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('root@kali:~# thumbnail_studio', w / 2, my + 18);
    // Content
    const lx = mx + 24, startY = my + 60;
    ctx.font = `700 ${Math.max(10, w * 0.013)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'left'; ctx.fillStyle = cfg.primary + '88';
    ctx.fillText('$ ' + (cfg.eyebrow || 'THUMBNAIL STUDIO').toLowerCase(), lx, startY);
    ctx.save();
    ctx.fillStyle = cfg.titleColor; ctx.shadowColor = cfg.titleGlow; ctx.shadowBlur = cfg.titleGlowBlur;
    const titleFs = cfg.titleSize * (w / 1280) * 0.75;
    ctx.font = `900 ${titleFs}px ${cfg.titleFont}, Impact, sans-serif`;
    const lines = cfg.mainTitle.split('\n');
    let ty = startY + h * 0.1;
    for (const l of lines) { ctx.fillText(l.toUpperCase(), lx, ty); ty += titleFs * 1.08; }
    ctx.restore();
    // blinking cursor
    ctx.fillStyle = cfg.primary; ctx.fillRect(lx, ty + 8, Math.max(10, w * 0.012), Math.max(16, w * 0.018));
    ctx.restore();
    this._drawSubtitleBadge(ctx, cfg.subtitle, w / 2, my + mh - h * 0.07, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  _tplMinimalBold(ctx, w, h, cfg) {
    // Horizontal rule
    const cx = w / 2;
    ctx.save(); ctx.strokeStyle = cfg.primary; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.42); ctx.lineTo(w * 0.9, h * 0.42); ctx.stroke();
    ctx.restore();
    this._drawEyebrow(ctx, cfg.eyebrow, cx, h * 0.38, cfg.eyebrowColor, w);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = cfg.titleColor;
    const fs = cfg.titleSize * (w / 1280);
    ctx.font = `900 ${fs}px ${cfg.titleFont}, Impact, sans-serif`;
    const lines = cfg.mainTitle.split('\n');
    let y = h * 0.52 - (lines.length - 1) * fs * 0.5;
    for (const l of lines) { ctx.fillText(l.toUpperCase(), cx, y); y += fs * 1.0; }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = cfg.primary; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.72); ctx.lineTo(w * 0.9, h * 0.72); ctx.stroke();
    ctx.restore();
    this._drawSubtitleBadge(ctx, cfg.subtitle, cx, h * 0.78, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  _tplGlitch(ctx, w, h, cfg) {
    const cx = w / 2, cy = h / 2;
    const fs = cfg.titleSize * (w / 1280) * 0.9;
    this._drawEyebrow(ctx, cfg.eyebrow, cx, cy - h * 0.18, cfg.eyebrowColor, w);
    // Glitch layers
    const lines = cfg.mainTitle.split('\n');
    const drawLines = (ox, oy, color, alpha) => {
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.font = `900 ${fs}px ${cfg.titleFont}, Impact, sans-serif`;
      let y = cy - (lines.length - 1) * fs * 0.52 + oy;
      for (const l of lines) { ctx.fillText(l.toUpperCase(), cx + ox, y); y += fs * 1.08; }
      ctx.restore();
    };
    if (cfg.fx.glitch) {
      drawLines(-3, 1, '#ff0040', 0.6);
      drawLines(3, -1, '#00D9FF', 0.6);
    }
    drawLines(0, 0, cfg.titleColor, 1);
    ctx.save();
    ctx.font = `900 ${fs}px ${cfg.titleFont}, Impact, sans-serif`;
    ctx.shadowColor = cfg.titleGlow; ctx.shadowBlur = cfg.titleGlowBlur;
    ctx.textAlign = 'center'; ctx.fillStyle = 'transparent';
    ctx.restore();
    this._drawSubtitleBadge(ctx, cfg.subtitle, cx, cy + h * 0.2, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  _tplMagazine(ctx, w, h, cfg) {
    // Left color block
    ctx.save();
    const bw = w * 0.04;
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, cfg.primary); grd.addColorStop(1, cfg.primary + '33');
    ctx.fillStyle = grd; ctx.shadowColor = cfg.primary; ctx.shadowBlur = 20;
    ctx.fillRect(0, 0, bw, h);
    ctx.restore();
    // Horizontal stripe
    ctx.save();
    ctx.fillStyle = cfg.primary + '22';
    ctx.fillRect(0, h * 0.58, w, h * 0.08);
    ctx.strokeStyle = cfg.primary; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, h * 0.58); ctx.lineTo(w, h * 0.58); ctx.stroke();
    ctx.restore();
    const lx = w * 0.08;
    this._drawEyebrow(ctx, cfg.eyebrow, lx + (w * 0.42), h * 0.28, cfg.eyebrowColor, w);
    ctx.save();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = cfg.titleColor; ctx.shadowColor = cfg.titleGlow; ctx.shadowBlur = cfg.titleGlowBlur;
    const fs = cfg.titleSize * (w / 1280) * 0.88;
    ctx.font = `900 ${fs}px ${cfg.titleFont}, Impact, sans-serif`;
    const lines = this._wrapText({ measureText: (t) => { ctx.font = `900 ${fs}px ${cfg.titleFont}, Impact, sans-serif`; return ctx.measureText(t); } }, cfg.mainTitle, w * 0.82);
    let y = h * 0.34;
    for (const l of lines) { ctx.fillText(l.toUpperCase(), lx, y); y += fs * 1.05; }
    ctx.restore();
    this._drawSubtitleBadge(ctx, cfg.subtitle, lx + w * 0.25, h * 0.7, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  _tplStatHero(ctx, w, h, cfg) {
    const cx = w / 2;
    if (cfg.showStat && cfg.statNum) {
      ctx.save();
      const sfs = cfg.titleSize * (w / 1280) * 1.8;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `900 ${sfs}px ${cfg.titleFont}, Impact, sans-serif`;
      ctx.fillStyle = cfg.primary + '18';
      ctx.fillText(cfg.statNum, cx, h * 0.45);
      ctx.fillStyle = cfg.primary; ctx.shadowColor = cfg.primary; ctx.shadowBlur = 40;
      ctx.fillText(cfg.statNum, cx, h * 0.45);
      ctx.restore();
    }
    ctx.save();
    const tfs = cfg.titleSize * (w / 1280) * 0.6;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = cfg.titleColor; ctx.shadowColor = cfg.titleGlow; ctx.shadowBlur = cfg.titleGlowBlur;
    ctx.font = `900 ${tfs}px ${cfg.titleFont}, Impact, sans-serif`;
    const lines = cfg.mainTitle.split('\n');
    let y = h * 0.72 - (lines.length - 1) * tfs * 0.55;
    for (const l of lines) { ctx.fillText(l.toUpperCase(), cx, y); y += tfs * 1.05; }
    ctx.restore();
    this._drawEyebrow(ctx, cfg.eyebrow, cx, h * 0.28, cfg.eyebrowColor, w);
    this._drawSubtitleBadge(ctx, cfg.subtitle, cx, h * 0.84, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  _tplDarkCard(ctx, w, h, cfg) {
    // Card
    const cx = w / 2, cy = h / 2;
    const cw = w * 0.84, ch = h * 0.7;
    const cx0 = cx - cw / 2, cy0 = cy - ch / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(8,8,10,0.88)';
    ctx.shadowColor = cfg.primary; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.roundRect(cx0, cy0, cw, ch, 16); ctx.fill();
    ctx.strokeStyle = cfg.primary + '44'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(cx0, cy0, cw, ch, 16); ctx.stroke();
    // Top accent line
    const ag = ctx.createLinearGradient(cx0, 0, cx0 + cw, 0);
    ag.addColorStop(0, 'rgba(0,0,0,0)'); ag.addColorStop(0.5, cfg.primary); ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = ag; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx0 + 20, cy0); ctx.lineTo(cx0 + cw - 20, cy0); ctx.stroke();
    ctx.restore();
    this._drawEyebrow(ctx, cfg.eyebrow, cx, cy - ch * 0.28, cfg.eyebrowColor, w);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = cfg.titleColor; ctx.shadowColor = cfg.titleGlow; ctx.shadowBlur = cfg.titleGlowBlur;
    const fs = cfg.titleSize * (w / 1280) * 0.82;
    ctx.font = `900 ${fs}px ${cfg.titleFont}, Impact, sans-serif`;
    const lines = cfg.mainTitle.split('\n');
    let y = cy - (lines.length - 1) * fs * 0.5;
    for (const l of lines) { ctx.fillText(l.toUpperCase(), cx, y); y += fs * 1.08; }
    ctx.restore();
    this._drawSubtitleBadge(ctx, cfg.subtitle, cx, cy + ch * 0.3, cfg.subStyle, cfg.subColor, cfg.subBg, w);
  }

  // ─── GUIDE HELPERS ───
  _drawThirds(ctx, w, h) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,0,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    [1 / 3, 2 / 3].forEach(t => {
      ctx.beginPath(); ctx.moveTo(w * t, 0); ctx.lineTo(w * t, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h * t); ctx.lineTo(w, h * t); ctx.stroke();
    });
    ctx.restore();
  }
  _drawCenter(ctx, w, h) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,100,100,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    ctx.restore();
  }
  _drawSafeZone(ctx, w, h) {
    ctx.save(); ctx.strokeStyle = 'rgba(0,217,255,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
    const p = 0.05;
    ctx.strokeRect(w * p, h * p, w * (1 - p * 2), h * (1 - p * 2));
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // EVENT BINDING
  // ─────────────────────────────────────────────────────────────
  _bindEvents() {
    // Use container-scoped queries to avoid conflicts with other DOM elements
    const root = this.container.querySelector('#ts-root') || this.container;
    const $ = id => root.querySelector(`#${id}`);
    const $$ = sel => root.querySelectorAll(sel);

    // Format switcher
    $$(`.ts-format-btn`).forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.ts-format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.format = btn.dataset.format;
        this._updateDimsDisplay();
        this._scheduleRender();
      });
    });

    // BG tabs
    $$('#ts-root .ts-tab, .ts-bg-tabs .ts-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const group = tab.parentElement;
        group.querySelectorAll('.ts-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabId = tab.dataset.tab;
        this._activeBgTab = tabId;
        const parent = group.nextElementSibling?.parentElement || group.parentElement;
        parent.querySelectorAll('.ts-tab-content').forEach(c => c.classList.remove('active'));
        $(`ts-tab-${tabId}`)?.classList.add('active');
        this._scheduleRender();
      });
    });

    // BG swatches
    $$('#ts-bg-swatches .ts-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        $('ts-bg-custom-color').value = sw.dataset.color;
        $('ts-bg-hex').textContent = sw.dataset.color;
        this._activeBgTab = 'color';
        this._scheduleRender();
      });
    });

    // BG custom color
    $('ts-bg-custom-color')?.addEventListener('input', e => {
      $('ts-bg-hex').textContent = e.target.value;
      this._activeBgTab = 'color';
      this._scheduleRender();
    });

    // Gradient presets
    $$('.ts-grad-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const stops = JSON.parse(btn.dataset.stops);
        $('ts-grad-c1').value = stops[0];
        $('ts-grad-c2').value = stops[1];
        this._activeBgTab = 'gradient';
        this._scheduleRender();
      });
    });

    // Gradient controls
    ['ts-grad-angle', 'ts-grad-c1', 'ts-grad-c2'].forEach(id => {
      $(id)?.addEventListener('input', e => {
        if (id === 'ts-grad-angle') $('ts-angle-val').textContent = e.target.value + '°';
        this._activeBgTab = 'gradient';
        this._scheduleRender();
      });
    });

    // Image upload — BG
    const uploadZone = $('ts-upload-zone');
    const bgFile = $('ts-bg-file');
    uploadZone?.addEventListener('click', () => bgFile.click());
    uploadZone?.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone?.addEventListener('drop', e => {
      e.preventDefault(); uploadZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this._loadBgImage(file);
    });
    bgFile?.addEventListener('change', e => { if (e.target.files[0]) this._loadBgImage(e.target.files[0]); });
    $('ts-remove-bg-img')?.addEventListener('click', () => {
      this.uploadedBg = null;
      $('ts-image-controls').style.display = 'none';
      $('ts-upload-zone').style.display = '';
      this._scheduleRender();
    });

    // Image controls
    ['ts-img-opacity', 'ts-img-blur', 'ts-overlay-opacity'].forEach(id => {
      $(id)?.addEventListener('input', e => {
        const label = { 'ts-img-opacity': 'ts-img-opacity-val', 'ts-img-blur': 'ts-img-blur-val' }[id];
        if (label) $(label).textContent = id.includes('blur') ? e.target.value + 'px' : e.target.value + '%';
        this._activeBgTab = 'image';
        this._scheduleRender();
      });
    });
    $('ts-overlay-color')?.addEventListener('input', () => { this._activeBgTab = 'image'; this._scheduleRender(); });

    // Person upload
    const personZone = $('ts-person-zone');
    const personFile = $('ts-person-file');
    personZone?.addEventListener('click', () => personFile.click());
    personFile?.addEventListener('change', e => { if (e.target.files[0]) this._loadPersonImage(e.target.files[0]); });
    $('ts-remove-person')?.addEventListener('click', () => {
      this.uploadedPerson = null;
      $('ts-person-controls').style.display = 'none';
      this._scheduleRender();
    });
    ['ts-person-x', 'ts-person-scale'].forEach(id => {
      $(id)?.addEventListener('input', () => this._scheduleRender());
    });

    // Primary color swatches
    $$('#ts-primary-swatches .ts-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        $('ts-primary-color').value = sw.dataset.primary;
        this._scheduleRender();
      });
    });

    // All generic controls
    const inputIds = [
      'ts-primary-color', 'ts-title-color', 'ts-title-font', 'ts-title-size',
      'ts-title-glow', 'ts-title-glow-blur', 'ts-main-title', 'ts-subtitle',
      'ts-eyebrow', 'ts-sub-color', 'ts-sub-bg', 'ts-sub-style', 'ts-eyebrow-color',
      'ts-stat-number', 'ts-stat-show', 'ts-stat-color', 'ts-brand-name', 'ts-brand-color',
      'ts-brand-pos', 'ts-brand-show', 'ts-duration', 'ts-duration-show',
      'ts-category', 'ts-category-color',
      'ts-fx-nodegraph', 'ts-fx-grain', 'ts-fx-orbs', 'ts-fx-scanlines',
      'ts-fx-circuit', 'ts-fx-glitch', 'ts-fx-frame', 'ts-fx-led',
      'ts-guide-thirds', 'ts-guide-center', 'ts-guide-safe',
    ];
    inputIds.forEach(id => {
      $(id)?.addEventListener('input', () => this._scheduleRender());
      $(id)?.addEventListener('change', () => this._scheduleRender());
    });

    // Export buttons
    $('ts-btn-export-png')?.addEventListener('click', () => this._export('png'));
    $('ts-btn-export-jpg')?.addEventListener('click', () => this._export('jpg'));
    $('ts-btn-copy')?.addEventListener('click', () => this._copyToClipboard());
    $('ts-btn-randomize')?.addEventListener('click', () => this._randomize());
    $('ts-export-all-formats')?.addEventListener('click', () => this._exportAllFormats());
    $('ts-foot-export-png')?.addEventListener('click', () => this._exportAllFormats());
    $('ts-export-yt-pack')?.addEventListener('click', () => this._exportYTPack());
    $('ts-export-social-pack')?.addEventListener('click', () => this._exportSocialPack());
  }

  // ─────────────────────────────────────────────────────────────
  // IMAGE LOADING
  // ─────────────────────────────────────────────────────────────
  _loadBgImage(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        this.uploadedBg = img;
        const uploadZone = this.container.querySelector('#ts-upload-zone');
        const imageControls = this.container.querySelector('#ts-image-controls');
        const imgThumb = this.container.querySelector('#ts-img-thumb');
        if (uploadZone) uploadZone.style.display = 'none';
        if (imageControls) imageControls.style.display = '';
        if (imgThumb) imgThumb.src = e.target.result;
        this._activeBgTab = 'image';
        // Extract palette
        this._extractPalette(img);
        this._scheduleRender();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  _loadPersonImage(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        this.uploadedPerson = img;
        const controls = this.container.querySelector('#ts-person-controls');
        if (controls) controls.style.display = '';
        this._scheduleRender();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  _extractPalette(img) {
    const c = document.createElement('canvas');
    c.width = 80; c.height = 45;
    c.getContext('2d').drawImage(img, 0, 0, 80, 45);
    const data = c.getContext('2d').getImageData(0, 0, 80, 45).data;
    const colors = new Set();
    for (let i = 0; i < data.length; i += 16 * 4) {
      const r = data[i] & 0xF0, g = data[i + 1] & 0xF0, b = data[i + 2] & 0xF0;
      colors.add(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
    }
    const palette = [...colors].slice(0, 8);
    const row = this.container.querySelector('#ts-palette-row');
    if (row) {
      row.innerHTML = palette.map(color => `
                <div class="ts-palette-swatch" style="background:${color}" title="${color}" data-color="${color}">
                </div>`).join('');
      row.querySelectorAll('.ts-palette-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
          const primaryInput = this.container.querySelector('#ts-primary-color');
          if (primaryInput) primaryInput.value = sw.dataset.color;
          this._scheduleRender();
        });
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER LOOP
  // ─────────────────────────────────────────────────────────────
  _scheduleRender() {
    if (this._renderTimer) cancelAnimationFrame(this._renderTimer);
    this._renderTimer = requestAnimationFrame(() => this._renderPreview());
  }

  async _renderPreview() {
    const canvas = this.container.querySelector('#ts-main-canvas');
    if (!canvas) return;
    await this._renderToCanvas(canvas);
    this._fitCanvasToStage(canvas);
    this._updateStats();
    this._addToHistory();
  }

  _fitCanvasToStage(canvas) {
    const stage = this.container.querySelector('#ts-canvas-stage');
    if (!stage) return;
    const sw = stage.clientWidth - 40, sh = stage.clientHeight - 40;
    const scale = Math.min(sw / canvas.width, sh / canvas.height, 1);
    canvas.style.width = Math.round(canvas.width * scale) + 'px';
    canvas.style.height = Math.round(canvas.height * scale) + 'px';
  }

  _updateDimsDisplay() {
    const { w, h, label } = this.FORMATS[this.format];
    const el = this.container.querySelector('#ts-preview-dims');
    if (el) el.textContent = `${w} × ${h} · ${label}`;
  }

  _updateStats() {
    const root = this.container.querySelector('#ts-root') || this.container;
    const $ = id => root.querySelector(`#${id}`);
    const { w, h } = this.FORMATS[this.format];
    $('ts-stat-template').textContent = this.currentTemplate || 'impact';
    $('ts-stat-format').textContent = this.format;
    $('ts-stat-res').textContent = `${w}×${h}`;
    const fxCount = ['ts-fx-nodegraph', 'ts-fx-grain', 'ts-fx-orbs', 'ts-fx-scanlines', 'ts-fx-circuit', 'ts-fx-glitch', 'ts-fx-frame', 'ts-fx-led']
      .filter(id => $(id)?.checked).length;
    $('ts-stat-fx').textContent = String(fxCount);
  }

  // ─────────────────────────────────────────────────────────────
  // TEMPLATES PANEL SETUP
  // ─────────────────────────────────────────────────────────────
  _buildTemplateGrid() {
    const templates = this._getTemplates();
    const grid = this.container.querySelector('#ts-template-grid');
    const bar = this.container.querySelector('#ts-template-bar');
    if (!grid || !bar) return;

    templates.forEach((tpl, i) => {
      // Sidebar thumb
      const wrap = document.createElement('div');
      wrap.className = `ts-tpl-thumb${i === 0 ? ' active' : ''}`;
      wrap.dataset.tpl = tpl.id;
      wrap.title = tpl.desc;
      const c = document.createElement('canvas');
      wrap.appendChild(c);
      const lbl = document.createElement('div');
      lbl.className = 'ts-tpl-label';
      lbl.textContent = tpl.label;
      wrap.appendChild(lbl);
      wrap.addEventListener('click', () => this._selectTemplate(tpl.id));
      grid.appendChild(wrap);

      // Bottom bar thumb
      const barThumb = document.createElement('div');
      barThumb.className = `ts-bar-thumb${i === 0 ? ' active' : ''}`;
      barThumb.dataset.tpl = tpl.id;
      barThumb.title = tpl.label;
      const bc = document.createElement('canvas');
      barThumb.appendChild(bc);
      barThumb.addEventListener('click', () => this._selectTemplate(tpl.id));
      bar.appendChild(barThumb);
    });

    // Render all thumbs
    this._renderAllThumbs();
  }

  _selectTemplate(id) {
    this.currentTemplate = id;
    this.container.querySelectorAll('.ts-tpl-thumb, .ts-bar-thumb').forEach(el => {
      el.classList.toggle('active', el.dataset.tpl === id);
    });
    const statTpl = this.container.querySelector('#ts-stat-template');
    if (statTpl) statTpl.textContent = id;
    this._scheduleRender();
    setTimeout(() => this._renderAllThumbs(), 100);
  }

  async _renderAllThumbs() {
    const thumbs = this.container.querySelectorAll('.ts-tpl-thumb canvas, .ts-bar-thumb canvas');
    for (const canvas of thumbs) {
      const tplId = canvas.parentElement.dataset.tpl;
      await this._renderToCanvas(canvas, { template: tplId });
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // EXPORT
  // ─────────────────────────────────────────────────────────────
  async _export(type = 'png') {
    const { w, h } = this.FORMATS[this.format];
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    await this._renderToCanvas(canvas);
    const mime = type === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = type === 'jpg' ? 0.95 : undefined;
    const url = canvas.toDataURL(mime, quality);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thumbnail_${this.format.replace(':', '-')}_${Date.now()}.${type}`;
    a.click();
  }

  async _exportAllFormats() {
    for (const fmt of Object.keys(this.FORMATS)) {
      this.format = fmt;
      await this._export('png');
      await new Promise(r => setTimeout(r, 200));
    }
    this.format = '16:9';
    this._scheduleRender();
  }

  async _exportYTPack() {
    this.format = '16:9';
    await this._export('jpg');
    await this._export('png');
  }

  async _exportSocialPack() {
    for (const fmt of ['9:16', '1:1', '16:9']) {
      this.format = fmt;
      await this._export('png');
      await new Promise(r => setTimeout(r, 200));
    }
    this.format = '16:9';
    this._scheduleRender();
  }

  async _copyToClipboard() {
    const { w, h } = this.FORMATS[this.format];
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    await this._renderToCanvas(canvas);
    canvas.toBlob(blob => {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => {
        const btn = this.container.querySelector('#ts-btn-copy');
        if (btn) { const orig = btn.textContent; btn.textContent = '✓ Copiado!'; setTimeout(() => btn.textContent = orig, 2000); }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // RANDOMIZER
  // ─────────────────────────────────────────────────────────────
  _randomize() {
    const templates = this._getTemplates().map(t => t.id);
    const colors = ['#00D9FF', '#A855F7', '#FF3366', '#00FF88', '#FF9500', '#FF0000', '#0088FF', '#D946EF'];
    const gradients = [
      ['#000000', '#0a1628'], ['#030303', '#1a0033'], ['#000000', '#1a0000'],
      ['#030303', '#002810'], ['#050505', '#0a1a3a'], ['#0a0006', '#1f0a2a'],
    ];
    const subStyles = ['badge', 'line', 'pill', 'ghost', 'none'];
    const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
    const root = this.container.querySelector('#ts-root') || this.container;
    const $ = id => root.querySelector(`#${id}`);

    this._selectTemplate(rnd(templates));
    const primary = rnd(colors);
    $('ts-primary-color').value = primary;
    $('ts-title-glow').value = primary;
    const grad = rnd(gradients);
    $('ts-grad-c1').value = grad[0];
    $('ts-grad-c2').value = grad[1];
    $('ts-grad-angle').value = Math.floor(Math.random() * 360);
    $('ts-sub-bg').value = primary;
    $('ts-sub-color').value = primary;
    $('ts-eyebrow-color').value = rnd(colors);
    $('ts-sub-style').value = rnd(subStyles);
    this._activeBgTab = 'gradient';
    root.querySelectorAll('.ts-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'gradient'));
    root.querySelectorAll('.ts-tab-content').forEach(c => c.classList.toggle('active', c.id === 'ts-tab-gradient'));
    // Toggle random effects
    ['ts-fx-nodegraph', 'ts-fx-grain', 'ts-fx-orbs', 'ts-fx-scanlines', 'ts-fx-circuit', 'ts-fx-glitch', 'ts-fx-frame', 'ts-fx-led']
      .forEach(id => { const el = $(id); if (el) el.checked = Math.random() > 0.4; });
    this._scheduleRender();
    setTimeout(() => this._renderAllThumbs(), 200);
  }

  // ─────────────────────────────────────────────────────────────
  // HISTORY
  // ─────────────────────────────────────────────────────────────
  _addToHistory() {
    const canvas = this.container.querySelector('#ts-main-canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg', 0.4);
    const list = this.container.querySelector('#ts-history-list');
    if (!list) return;
    if (list.querySelector('.ts-history-empty')) list.innerHTML = '';
    const item = document.createElement('div');
    item.className = 'ts-history-item';
    item.innerHTML = `
            <div class="ts-history-thumb"><img src="${url}"></div>
            <div class="ts-history-meta">
                <div class="ts-history-name">${this.currentTemplate || 'impact'} · ${this.format}</div>
                <div class="ts-history-time">${new Date().toLocaleTimeString()}</div>
            </div>`;
    list.insertBefore(item, list.firstChild);
    while (list.children.length > 10) list.removeChild(list.lastChild);
  }

  // ─────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────
  _loadDefaultScene() {
    this.currentTemplate = 'impact';
    this._activeBgTab = 'gradient';
    this._buildTemplateGrid();
    this._updateDimsDisplay();
    // First render
    setTimeout(() => {
      this._activeBgTab = 'gradient';
      const root = this.container.querySelector('#ts-root') || this.container;
      root.querySelectorAll('.ts-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'gradient'));
      root.querySelectorAll('.ts-tab-content').forEach(c => c.classList.toggle('active', c.id === 'ts-tab-gradient'));
      this._scheduleRender();
    }, 100);
  }
}

export class ThumbnailView {
  constructor() {
    this.isRendered = false;
    this.studio = null;
  }

  render() {
    const el = document.createElement('div');
    el.id = 'thumbnail-view';
    el.style.cssText = 'width:100%;height:100%;display:none;overflow:hidden;';
    el.innerHTML = '<div id="ts-studio-container" style="width:100%;height:100%;"></div>';
    return el;
  }

  async onInit() {
    await new Promise(r => setTimeout(r, 50));
    const container = document.getElementById('ts-studio-container');
    if (!container) { console.warn('[ThumbnailView] Container #ts-studio-container not found'); return; }
    this.studio = new ThumbnailStudio(window.app?.canvasRenderer, 'ts-studio-container');
  }

  show() { document.getElementById('thumbnail-view').style.display = ''; }
  hide() { document.getElementById('thumbnail-view').style.display = 'none'; }
  onEnter() { this.studio?._scheduleRender(); }
}
