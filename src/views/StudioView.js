import { BaseView } from './BaseView.js';
import { DataEditor } from '../services/DataEditor.js';
import { CanvasToPDF } from '../utils/CanvasToPDF.js';

export class StudioView extends BaseView {
    constructor() {
        super('studio');
    }

    render() {
        this.element.innerHTML = `
            <div class="studio-layout">

                <!-- ══════════════════════════════════════════ -->
                <!-- LEFT PANEL: INPUTS & SCRIPT               -->
                <!-- ══════════════════════════════════════════ -->
                <div class="panel-left">
                    <div class="panel-header">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span class="ts-dot" style="background:#00D9FF;box-shadow:0 0 6px #00D9FF;"></span>
                            <span>INPUT DECK</span>
                        </div>
                        <span class="material-icons" style="font-size:14px;color:#2a2a2a;">input</span>
                    </div>

                    <div class="panel-content">

                        <!-- TIKTOK SIGNAL BADGE -->
                        <div id="tiktokSignalBadge" style="display:none;" class="ts-section">
                            <div style="background:rgba(0,217,255,0.05);border:1px solid rgba(0,217,255,0.2);padding:12px;border-radius:8px;">
                                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                    <span class="material-icons" style="color:#00D9FF;font-size:16px;">verified</span>
                                    <span style="color:#00D9FF;font-weight:800;font-size:10px;letter-spacing:1.5px;">TIKTOK TREND DETECTADO</span>
                                </div>
                                <div id="tiktokSignalText" style="font-size:11px;color:#aaa;line-height:1.5;margin-bottom:6px;"></div>
                                <div style="font-size:10px;color:#444;font-family:monospace;">Autodetectado desde Chrome Extension</div>
                            </div>
                        </div>

                        <!-- TEMA -->
                        <div class="ts-section">
                            <div class="ts-section-label">
                                <span class="ts-label-bar" style="background:#00D9FF;"></span>
                                TEMA
                            </div>
                            <textarea id="themeInput" class="ts-input ts-textarea" placeholder="¿De qué trata el post?"></textarea>
                        </div>

                        <!-- SLIDES + TIPO -->
                        <div class="ts-section">
                            <div class="ts-section-label">
                                <span class="ts-label-bar" style="background:#0066FF;"></span>
                                CONFIGURACIÓN
                            </div>
                            <div class="ts-grid-2">
                                <div class="ts-field">
                                    <div class="ts-field-label">SLIDES</div>
                                    <input type="number" id="slideCount" class="ts-input" value="10" min="5" max="50">
                                </div>
                                <div class="ts-field">
                                    <div class="ts-field-label">TIPO DE POST</div>
                                    <select id="intentSelect" class="ts-input ts-select">
                                        <option value="TUTORIAL">📚 Mini Curso</option>
                                        <option value="STORY">🕵️ Historia / Caso Real</option>
                                        <option value="TOOL">🛠️ Review Herramienta</option>
                                        <option value="VS">⚔️ Comparativa A vs B</option>
                                        <option value="SPEEDRUN">⚡ Speedrun</option>
                                        <option value="ARSENAL">🔫 Arsenal</option>
                                        <option value="INCIDENT">🔥 Caso Real (Forense)</option>
                                        <option value="CHALLENGE">🧩 Challenge / CTF</option>
                                        <option value="CHEATSHEET">📋 Cheat Sheet</option>
                                        <option value="MYTHBUSTER">💥 Destructor de Mitos</option>
                                        <option value="NEWS">📰 Noticia / Actualidad</option>
                                        <option value="THEORY">🧠 Concepto Teórico</option>
                                        <option value="EBOOK_CREATOR" style="color:#A855F7;font-weight:bold;">📖 Libro PDF Educativo</option>
                                        <option value="TIKTOK_TREND" style="color:#00D9FF;font-weight:bold;">🔥 TikTok Viral</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- SEO -->
                        <div class="ts-section">
                            <div class="ts-section-label">
                                <span class="ts-label-bar" style="background:#00D9FF;"></span>
                                <span style="color:#00D9FF;">SEO & VIRALIZACIÓN</span>
                                <span style="margin-left:auto;font-size:9px;color:#333;font-weight:600;">🤖 IA</span>
                            </div>
                            <textarea id="seoCaption" class="ts-input ts-textarea ts-readonly" style="height:72px;" placeholder="Descripción viral generada por IA..." readonly></textarea>
                            <input type="text" id="seoHashtags" class="ts-input ts-readonly" placeholder="#Hashtags" readonly>
                            <button id="copySeoBtn" class="ts-btn-ghost">
                                <span class="material-icons" style="font-size:13px;">content_copy</span>
                                COPIAR DESCRIPCIÓN + HASHTAGS
                            </button>
                        </div>

                        <!-- MODELO IA -->
                        <div class="ts-section">
                            <div class="ts-section-label">
                                <span class="ts-label-bar" style="background:#bd00ff;"></span>
                                MODELO DE IA
                            </div>
                            <select id="aiProvider" class="ts-input ts-select">
                                <option value="gemini">✨ Google Gemini (Recomendado)</option>
                                <option value="openai">🧠 OpenAI GPT-4</option>
                                <option value="anthropic"> Claude 3.5 Sonnet</option>
                            </select>
                        </div>

                        <!-- GENERATE BUTTON -->
                        <div class="ts-section" style="border-bottom:none;padding-bottom:8px;">
                            <button id="generateBtn" class="ts-btn-primary">
                                <span class="material-icons">psychology</span>
                                GENERAR CON IA
                            </button>
                        </div>

                        <div class="ts-divider"></div>

                        <!-- EDITOR JSON -->
                        <div class="ts-section" style="padding-bottom:0; flex:1; display:flex; flex-direction:column; min-height:200px;">
                            <div class="ts-section-label" style="display:flex; align-items:center;">
                                <span class="ts-label-bar" style="background:#444;"></span>
                                HTML SCRIPT / JSON
                                
                                <div style="margin-left:auto; display:flex; gap:6px;">
                                    <button id="popoutJsonBtn" class="ts-btn-icon" title="Abrir en ventana flotante" style="color:#00D9FF;">
                                        <span class="material-icons" style="font-size:14px;">open_in_new</span>
                                    </button>
                                    <button id="clearBtn" class="ts-btn-icon" title="Limpiar Data">✕</button>
                                </div>
                            </div>
                            <div class="ts-editor-wrap" style="flex:1; border:1px solid #1a1a1a; border-radius:6px; overflow:hidden; position:relative;">
                                <textarea id="editor"></textarea>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- ══════════════════════════════════════════ -->
                <!-- CENTER PANEL: CANVAS                      -->
                <!-- ══════════════════════════════════════════ -->
                <div class="panel-center">
                    <div id="previewContainer" class="preview-container" style="position:relative;">

                        <!-- FLOATING TOOLBAR -->
                        <div class="canvas-header" style="position:absolute;top:10px;right:10px;z-index:50;display:flex;flex-direction:row;align-items:center;gap:6px;background:rgba(4,4,4,0.96);border:1px solid #1a1a1a;border-radius:10px;padding:5px 12px;backdrop-filter:blur(12px);box-shadow:0 0 20px rgba(0,217,255,0.05),0 4px 16px rgba(0,0,0,0.5);">

                            <!-- NAV CONTROLS -->
                            <div class="nav-controls" style="display:flex;align-items:center;gap:4px;">
                                <button id="prevSlide" class="nav-btn" style="padding:2px 6px;font-size:12px;">❮</button>
                                <span id="slideCounter" class="nav-counter" style="font-size:11px;min-width:52px;text-align:center;font-family:monospace;color:#555;">-- / --</span>
                                <button id="nextSlide" class="nav-btn" style="padding:2px 6px;font-size:12px;">❯</button>
                            </div>

                            <div style="width:1px;height:16px;background:#1e1e1e;"></div>

                            <!-- THEME DOTS -->
                            <div class="theme-controls" style="display:flex;gap:5px;align-items:center;">
                                <button class="theme-btn active" data-theme="CYBER"     style="background:#00D9FF;width:13px;height:13px;box-shadow:0 0 5px #00D9FF;" title="Cyber"></button>
                                <button class="theme-btn"        data-theme="RED_TEAM"  style="background:#FF0000;width:13px;height:13px;" title="Red Team"></button>
                                <button class="theme-btn"        data-theme="BLUE_TEAM" style="background:#0088FF;width:13px;height:13px;" title="Blue Team"></button>
                                <button class="theme-btn"        data-theme="OSINT"     style="background:#d946ef;width:13px;height:13px;" title="OSINT"></button>
                                <div style="position:relative;width:13px;height:13px;overflow:hidden;border-radius:50%;border:1px solid #333;cursor:pointer;" title="Color Personalizado">
                                    <input type="color" id="customColorPicker" style="position:absolute;top:-50%;left:-50%;width:200%;height:200%;padding:0;margin:0;cursor:pointer;border:none;" value="#00D9FF">
                                </div>
                            </div>

                            <div style="width:1px;height:16px;background:#1e1e1e;"></div>

                            <!-- SAFE ZONE + RATIO -->
                            <div style="display:flex;gap:6px;align-items:center;">
                                <button id="toggleSafeZone" class="icon-btn active" title="Zona Segura" style="color:#555;border:1px solid #1e1e1e;padding:2px;border-radius:4px;font-size:14px;transition:all 0.2s;">
                                    <span class="material-icons" style="font-size:15px;">crop_free</span>
                                </button>
                                <select id="aspectRatio" class="ratio-select" style="font-size:11px;padding:2px 4px;color:#666 !important;border-color:#1e1e1e !important;background:transparent !important;">
                                    <option value="1080x1920">9:16</option>
                                    <option value="1080x1080">1:1</option>
                                    <option value="1080x1350">4:5</option>
                                </select>
                            </div>

                        </div>

                        <!-- CANVAS -->
                        <div id="mainCanvas" class="preview-frame" style="width:100%;height:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#000;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.5);"></div>

                    </div>
                </div>

                <!-- ══════════════════════════════════════════ -->
                <!-- RIGHT PANEL: INSPECTOR                    -->
                <!-- ══════════════════════════════════════════ -->
                <div class="panel-right">
                    <div class="panel-header">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span class="ts-dot" style="background:#bd00ff;box-shadow:0 0 6px #bd00ff;"></span>
                            <span>INSPECTOR</span>
                        </div>
                        <span class="material-icons" style="font-size:14px;color:#2a2a2a;">tune</span>
                    </div>
                    <div id="dataEditorPanel" class="panel-content scrollable">
                        <div class="ts-empty-state">
                            <span class="material-icons" style="font-size:32px;color:#1e1e1e;display:block;margin-bottom:10px;">tune</span>
                            Selecciona un slide para editar sus datos
                        </div>
                    </div>
                </div>

                <!-- ══════════════════════════════════════════ -->
                <!-- FOOTER STATUS BAR                         -->
                <!-- ══════════════════════════════════════════ -->
                <div class="studio-footer">
                    <div class="status-left">
                        <span class="status-dot"></span>
                        <span id="statusText">SISTEMA LISTO</span>
                    </div>

                    <div class="footer-controls">
                        <button id="exportSingleBtn" class="footer-btn" title="Exportar Slide Actual">
                            <span class="material-icons">image</span> Exportar
                        </button>
                        <div class="vl"></div>
                        <button id="exportBatchBtn" class="footer-btn accent" title="Exportar PNGs">
                            <span class="material-icons">collections</span> Multi PNG
                        </button>
                        <div class="vl"></div>
                        <button id="exportPdfBtn" class="footer-btn accent" style="background:linear-gradient(135deg,#00D9FF22,#A855F744);border-color:#A855F7;" title="Exportar PDF Vectorial con Links">
                            <span class="material-icons">picture_as_pdf</span> PDF Book
                        </button>
                    </div>

                    <div class="progress-container">
                        <div id="progressBar" class="progress-bar"></div>
                    </div>

                    <div class="status-right">
                        <span>v2.0.1</span>
                    </div>
                </div>

            </div>
        `;
        return this.element;
    }

    async onEnter() {
        console.log("StudioView: onEnter");
        if (!this.editorInstance) {
            this.initEditor();
        }

        if (!this.dataEditor) {
            this.dataEditor = new DataEditor(
                'dataEditorPanel',
                (newData) => {
                    if (window.app && window.app.handleDataChange) {
                        window.app.handleDataChange(newData);
                    }
                },
                (instruction) => {
                    if (window.app && window.app.handleAIRefine) {
                        return window.app.handleAIRefine(instruction);
                    }
                    return Promise.reject("App not ready");
                }
            );
        }

        this.attachListeners();
    }

    updateInspector(data) {
        if (this.dataEditor) {
            this.dataEditor.renderFields(data);
        }
    }

    showTiktokSignal(data) {
        const badge = this.element.querySelector('#tiktokSignalBadge');
        const text = this.element.querySelector('#tiktokSignalText');
        const intentSelect = this.element.querySelector('#intentSelect');
        const themeInput = this.element.querySelector('#themeInput');

        if (badge && text) {
            badge.style.display = 'block';
            let summary = `<strong>${data.type.toUpperCase()}</strong>`;
            if (data.hashtag) summary += ` • #${data.hashtag}`;
            if (data.viralHook) summary += `<br><em>"${data.viralHook}"</em>`;
            text.innerHTML = summary;

            if (intentSelect && intentSelect.value !== 'TIKTOK_TREND') {
                // Auto-select logic preserved
            }
        }
    }

    initEditor() {
        const textarea = this.element.querySelector('#editor');
        if (textarea && window.CodeMirror) {
            this.editorInstance = window.CodeMirror.fromTextArea(textarea, {
                mode: 'application/json',
                theme: 'material-darker',
                lineNumbers: true,
                lineWrapping: true,
                tabSize: 2,
                matchBrackets: true,
                autoCloseBrackets: true
            });

            // Ajustar altura al contenedor parent
            this.editorInstance.setSize("100%", "100%");

            let isUpdatingFromCode = false;

            this.editorInstance.on('change', () => {
                const val = this.editorInstance.getValue();

                // Dispara el evento global para sincronización (solo si fue modificado manualmente)
                document.dispatchEvent(new CustomEvent('editor-change', {
                    detail: { value: val }
                }));

                // Auto-refresh Canvas interactivo si detectamos cambios válidos de JSON manual
                if (window.app && window.app.slides && window.app.slides.length > 0) {
                    try {
                        const parsed = JSON.parse(val);
                        // Solo actualizamos si pudimos parsearlo sin crashear
                        isUpdatingFromCode = true;

                        // Guardarlo sigilosamente en los datos de la diapositiva en app principal
                        if (window.app.slides[window.app.currentSlideIndex]) {
                            // Copiar sin destruir _raw u otras vainas internas
                            window.app.slides[window.app.currentSlideIndex].data = {
                                ...window.app.slides[window.app.currentSlideIndex].data,
                                ...parsed
                            };
                        }

                        // Refrescar al vuelo el CanvasEditor sin causar infinite loop
                        if (window.app.canvasEditor && typeof window.app.canvasEditor.load === 'function' && !window.app.isExporting) {
                            // Esperar ticks para no estrangular UI
                            clearTimeout(this._refreshTimeout);
                            this._refreshTimeout = setTimeout(() => {
                                window.app.canvasEditor.load(window.app.slides[window.app.currentSlideIndex].data);
                            }, 200);
                        }
                    } catch (e) {
                        // User is still typing invalid JSON, ignore until valid
                    } finally {
                        isUpdatingFromCode = false;
                    }
                }
            });

            // Actualizar la caja desde afuera (cuando el canvas se mueva)
            this._externalDataSync = (newDataStr) => {
                if (!isUpdatingFromCode && this.editorInstance.getValue() !== newDataStr) {
                    this.editorInstance.setValue(newDataStr);
                }
            };
        }
    }

    attachListeners() {
        const genBtn = this.element.querySelector('#generateBtn');
        if (genBtn) genBtn.onclick = () => window.app.handleGenerate();

        // Popout JSON Editor
        const popoutBtn = this.element.querySelector('#popoutJsonBtn');
        if (popoutBtn) {
            popoutBtn.onclick = () => {
                if (window.cyberCanvas && window.cyberCanvas.openPopout) {
                    const currentData = this.editorInstance ? this.editorInstance.getValue() : {};
                    // Lanzar ventana y mandar dataset actual
                    window.cyberCanvas.openPopout('json-editor', currentData);
                } else {
                    console.warn("IPC openPopout no disponible. Estás en web mode?");
                }
            };
        }

        // Copy SEO Button
        const copySeoBtn = this.element.querySelector('#copySeoBtn');
        if (copySeoBtn) {
            copySeoBtn.onclick = async () => {
                const caption = this.element.querySelector('#seoCaption')?.value || '';
                const hashtags = this.element.querySelector('#seoHashtags')?.value || '';

                if (!caption && !hashtags) {
                    copySeoBtn.innerHTML = '<span class="material-icons" style="font-size:13px;">warning</span> SIN DATOS';
                    setTimeout(() => {
                        copySeoBtn.innerHTML = '<span class="material-icons" style="font-size:13px;">content_copy</span> COPIAR DESCRIPCIÓN + HASHTAGS';
                    }, 2000);
                    return;
                }

                const textToCopy = `${caption}\n\n${hashtags}`.trim();

                try {
                    await navigator.clipboard.writeText(textToCopy);
                    copySeoBtn.innerHTML = '<span class="material-icons" style="font-size:13px;">check</span> ¡COPIADO!';
                    copySeoBtn.style.borderColor = '#00FF88';
                    copySeoBtn.style.color = '#00FF88';
                    setTimeout(() => {
                        copySeoBtn.innerHTML = '<span class="material-icons" style="font-size:13px;">content_copy</span> COPIAR DESCRIPCIÓN + HASHTAGS';
                        copySeoBtn.style.borderColor = 'rgba(0,217,255,0.2)';
                        copySeoBtn.style.color = '#00D9FF';
                    }, 2500);
                } catch (err) {
                    console.error('Copy failed:', err);
                }
            };
        }

        // Navigation
        this.element.querySelector('#prevSlide').onclick = () => window.app.handlePrevSlide();
        this.element.querySelector('#nextSlide').onclick = () => window.app.handleNextSlide();

        // Aspect Ratio
        this.element.querySelector('#aspectRatio').onchange = (e) => {
            console.log("Ratio changed:", e.target.value);
            this.updatePreview();
        };

        // Safe Zone Toggle
        const toggleSafeBtn = this.element.querySelector('#toggleSafeZone');
        if (toggleSafeBtn) {
            toggleSafeBtn.onclick = () => {
                const frame = this.element.querySelector('#previewFrame');
                if (frame && frame.contentDocument) {
                    const safeZone = frame.contentDocument.querySelector('.safe-zone');
                    if (safeZone) {
                        safeZone.classList.toggle('debug');
                        toggleSafeBtn.classList.toggle('active');
                    }
                }
            }
        }

        // Bridge Listener
        if (!this._messageHandler) {
            this._messageHandler = (e) => this.handlePreviewMessage(e.data);
            window.addEventListener('message', this._messageHandler);
        }

        // Sync from Popout Editor
        if (window.cyberCanvas && window.cyberCanvas.onSyncJSON) {
            window.cyberCanvas.onSyncJSON((data) => {
                if (this.editorInstance && this.editorInstance.getValue() !== data) {
                    // Sincronizar editor local con lo que viene de la ventana externa
                    this.editorInstance.setValue(data);
                }
            });
        }

        // Theme Buttons
        const themeBtns = this.element.querySelectorAll('.theme-btn');
        themeBtns.forEach(btn => {
            btn.onclick = () => {
                themeBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.boxShadow = 'none';
                });
                btn.classList.add('active');
                btn.style.boxShadow = `0 0 8px ${btn.style.background}`;

                if (window.app && window.app.handleThemeChange) {
                    window.app.handleThemeChange(btn.dataset.theme);
                }
            };
        });

        // Custom Color Picker
        const colorPicker = this.element.querySelector('#customColorPicker');
        if (colorPicker) {
            colorPicker.oninput = (e) => {
                const color = e.target.value;
                if (window.app && window.app.handleThemeChange) {
                    window.app.handleThemeChange(color);
                }
                themeBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.boxShadow = 'none';
                });
            };
        }

        // ── EXPORT BUTTONS ──────────────────────────────────────────

        // Export Single Slide
        const exportSingleBtn = this.element.querySelector('#exportSingleBtn');
        if (exportSingleBtn) {
            exportSingleBtn.onclick = async () => {
                if (!window.app || !window.app.slides || window.app.slides.length === 0) {
                    alert('⚠️ No hay slides para exportar. Genera contenido primero.');
                    return;
                }

                const currentSlide = window.app.slides[window.app.currentSlideIndex];
                if (!currentSlide) {
                    alert('⚠️ No hay slides para exportar.');
                    return;
                }

                const ratioSelect = this.element.querySelector('#aspectRatio');
                const parts = ratioSelect ? ratioSelect.value.split('x') : ['1080', '1920'];
                const width = parseInt(parts[0]);
                const height = parseInt(parts[1]);

                const originalText = exportSingleBtn.innerHTML;
                exportSingleBtn.innerHTML = '<span class="material-icons spin">autorenew</span> Exportando...';
                exportSingleBtn.disabled = true;

                try {
                    if (window.app.canvasRenderer) {
                        const ratioW = width || 1080;
                        const ratioH = height || 1920;
                        const exportRenderer = window.createRenderer(ratioW, ratioH, window.app.canvasRenderer._activeThemeName || 'cyber');
                        exportRenderer._imageCache = new Map(window.app.canvasRenderer._imageCache);
                        const exportData = JSON.parse(JSON.stringify(currentSlide.data));

                        for (const layer of (exportData.layers || [])) {
                            if (layer.src) await exportRenderer.loadImage(layer.src).catch(() => null);
                            if (layer.imageSrc) await exportRenderer.loadImage(layer.imageSrc).catch(() => null);
                        }

                        await exportRenderer.render(exportData, { skipLayout: true });
                        await new Promise(r => setTimeout(r, 80));
                        const dataURL = exportRenderer.exportDataURL('image/png', 1.0);

                        const response = await fetch(dataURL);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = `cyber_canvas_slide_${window.app.currentSlideIndex + 1}.png`;
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        exportRenderer.canvas.remove();
                        exportRenderer._imageCache.clear();
                        window.app.setStatus('✅ Slide exportada como PNG');
                    }
                } catch (error) {
                    console.error('Error durante exportación individual:', error);
                    alert('❌ Ocurrió un error: ' + error.message);
                } finally {
                    exportSingleBtn.innerHTML = originalText;
                    exportSingleBtn.disabled = false;
                }
            };
        }

        // Export All Slides (Batch)
        const exportBatchBtn = this.element.querySelector('#exportBatchBtn');
        if (exportBatchBtn) {
            exportBatchBtn.onclick = async () => {
                if (!window.app || !window.app.slides || window.app.slides.length === 0) {
                    alert('⚠️ No hay slides para exportar. Genera contenido primero.');
                    return;
                }

                const ratioSelect = this.element.querySelector('#aspectRatio');
                const parts = ratioSelect ? ratioSelect.value.split('x') : ['1080', '1920'];
                const width = parseInt(parts[0]);
                const height = parseInt(parts[1]);

                const title = document.getElementById('themeInput')?.value || 'Post_Sin_Titulo';
                const originalText = exportBatchBtn.innerHTML;
                exportBatchBtn.innerHTML = '<span class="material-icons spin">autorenew</span> Exportando...';
                exportBatchBtn.disabled = true;

                const slides = window.app.slides;
                const hasCanvasSlides = slides.some(s => s.isCanvas);

                try {
                    if (hasCanvasSlides && window.app.canvasRenderer) {
                        const folderName = title.replace(/[^a-zA-Z0-9_\- ]/g, '_').substring(0, 80);
                        window.app.setStatus('🚀 Preparando exportación de ' + slides.length + ' slides...', true);
                        let exported = 0;
                        let savePath = '';

                        const exportRenderer = window.createRenderer(
                            width || 1080,
                            height || 1920,
                            window.app.canvasRenderer._activeThemeName || 'cyber'
                        );
                        exportRenderer._imageCache = new Map(window.app.canvasRenderer._imageCache);

                        for (let i = 0; i < slides.length; i++) {
                            const slide = slides[i];
                            window.app.setStatus('🖼️ Renderizando slide ' + (i + 1) + '/' + slides.length + '...', true);

                            if (slide.isCanvas && slide.data) {
                                const exportData = JSON.parse(JSON.stringify(slide.data));
                                const layers = exportData.layers || [];

                                for (const layer of layers) {
                                    if (layer.src) await exportRenderer.loadImage(layer.src).catch(() => null);
                                    if (layer.imageSrc) await exportRenderer.loadImage(layer.imageSrc).catch(() => null);
                                }

                                await exportRenderer.render(exportData, { skipLayout: true });
                                await new Promise(r => setTimeout(r, 80));

                                const dataURL = exportRenderer.exportDataURL('image/png', 1.0);
                                const fileName = folderName + '_slide_' + String(i + 1).padStart(2, '0') + '.png';

                                const result = await window.cyberCanvas.saveCanvasPng({ dataURL, folderName, fileName });
                                if (result.success) {
                                    exported++;
                                    savePath = result.path.replace('/' + fileName, '');
                                }
                            }
                        }

                        exportRenderer.canvas.remove();
                        exportRenderer._imageCache.clear();

                        window.app.setStatus('✅ ' + exported + ' slides guardadas en ~/Pictures/' + folderName);
                        alert('✅ Exportación completada!\n' + exported + ' imágenes guardadas en:\n' + savePath);
                    } else {
                        alert('❌ Error: El modo antiguo de plantillas HTML ya no está soportado. Regenera el contenido usando el nuevo Motor Canvas.');
                    }
                } catch (err) {
                    alert('❌ Error exportando batch: ' + err.message);
                } finally {
                    exportBatchBtn.innerHTML = originalText;
                    exportBatchBtn.disabled = false;
                    window.app.setStatus('SISTEMA LISTO');
                }
            };
        }

        // Export PDF
        const exportPdfBtn = this.element.querySelector('#exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.onclick = async () => {
                if (!window.app || !window.app.slides || window.app.slides.length === 0) {
                    alert('⚠️ No hay slides para exportar.');
                    return;
                }

                const title = document.getElementById('themeInput')?.value || 'Libro_PDF';
                const originalText = exportPdfBtn.innerHTML;
                exportPdfBtn.innerHTML = '<span class="material-icons spin">autorenew</span> Generando PDF...';
                exportPdfBtn.disabled = true;

                const slides = window.app.slides;
                const ratioSelect = this.element.querySelector('#aspectRatio');
                const parts = ratioSelect ? ratioSelect.value.split('x') : ['1080', '1920'];
                const width = parseInt(parts[0]);
                const height = parseInt(parts[1]);

                try {
                    window.app.setStatus('🚀 Procesando vectores para PDF...', true);
                    const sceneGraphs = slides.map(s => s.data);

                    const doc = await CanvasToPDF.generate(sceneGraphs, {
                        title: title,
                        format: [width, height],
                        orientation: width > height ? 'landscape' : 'portrait'
                    });

                    const fileName = title.replace(/[^a-zA-Z0-9_\- ]/g, '_').substring(0, 80) + '.pdf';
                    doc.save(fileName);

                    window.app.setStatus('✅ PDF Exportado Exitosamente: ' + fileName);
                } catch (err) {
                    console.error(err);
                    alert('❌ Error generando PDF: ' + err.message);
                } finally {
                    exportPdfBtn.innerHTML = originalText;
                    exportPdfBtn.disabled = false;
                    window.app.setStatus('SISTEMA LISTO');
                }
            };
        }
    }

    handlePreviewMessage(msg) {
        if (!msg || !msg.type) return;
        console.log("Studio received:", msg);
        if (window.app && window.app.handlePreviewAction) {
            window.app.handlePreviewAction(msg);
        }
    }

    updatePreview() {
        if (!window.app || !window.app.slides || window.app.slides.length === 0) return;

        const currentSlide = window.app.slides[window.app.currentSlideIndex];
        if (!currentSlide || !currentSlide.data) return;

        // Sync al CodeMirror nuevo si existe (Formateado en JSON pretty-print)
        if (this._externalDataSync && !currentSlide.data._raw) {
            const prettyJson = JSON.stringify(currentSlide.data, null, 2);
            this._externalDataSync(prettyJson);
        }

        const canvas = this.element.querySelector('#mainCanvas');
        if (!canvas) return;

        if (!window.app.canvasEditor || typeof window.app.canvasEditor.attachCanvas !== 'function') {
            window.app.canvasEditor = new window.CanvasEditor(canvas, window.app.canvasRenderer);
            window.app.canvasEditor.onChange = (modifiedGraph) => {
                if (window.app && window.app.slides && window.app.slides[window.app.currentSlideIndex]) {
                    window.app.slides[window.app.currentSlideIndex].data = modifiedGraph;

                    // Cuando edito texto directamente en la imagen (Canvas), actualizar la caja SCRIPT interactivamente
                    if (this._externalDataSync) {
                        this._externalDataSync(JSON.stringify(modifiedGraph, null, 2));
                    }
                }
            };
        } else {
            window.app.canvasEditor.attachCanvas(canvas);
        }

        window.app.canvasEditor.load(currentSlide.data);
    }

    updateSlideCounter(current, total) {
        const el = this.element.querySelector('#slideCounter');
        if (el) el.innerText = `${current} / ${total}`;
    }

    updateSEO(seoData) {
        if (!seoData) return;
        const captionEl = this.element.querySelector('#seoCaption');
        const hashtagsEl = this.element.querySelector('#seoHashtags');

        if (captionEl && seoData.description) captionEl.value = seoData.description;
        if (hashtagsEl && seoData.hashtags) {
            hashtagsEl.value = Array.isArray(seoData.hashtags)
                ? seoData.hashtags.join(' ')
                : seoData.hashtags;
        }
    }

    getAspectRatio() {
        return this.element.querySelector('#aspectRatio').value;
    }
}
