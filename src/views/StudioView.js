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
                <!-- LEFT PANEL: INPUTS & SCRIPT -->
                <div class="panel-left">
                    <div class="panel-header">
                        <span class="material-icons">input</span>
                        <span>INPUT DECK</span>
                    </div>
                    <div class="panel-content">
                        <!-- TIKTOK SIGNAL (Hidden by default) -->
                        <div id="tiktokSignalBadge" style="display:none; margin-bottom:15px; background:rgba(0,217,255,0.05); border:1px solid rgba(0,217,255,0.3); padding:12px; border-radius:8px;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                                <span class="material-icons" style="color:#00D9FF;">verified</span>
                                <span style="color:#00D9FF; font-weight:700; font-size:13px; letter-spacing:1px;">TIKTOK TREND DETECTADO</span>
                            </div>
                            <div id="tiktokSignalText" style="font-size:12px; color:#ddd; line-height:1.4; margin-bottom:8px;"></div>
                            <div style="font-size:11px; color:#666; font-family:monospace;">Autodetectado desde Chrome Extension</div>
                        </div>

                        <!-- Topic -->
                        <div class="control-group">
                            <label>TEMA</label>
                            <textarea id="themeInput" class="textarea-input tall" placeholder="¿De qué trata el post?"></textarea>
                        </div>
                        
                        <!-- Details Grid -->
                        <div class="control-grid fa-2x">
                            <div class="control-group">
                                <label>SLIDES</label>
                                <input type="number" id="slideCount" value="10" min="5" max="50">
                            </div>
                            <div class="control-group">
                                <label>TIPO DE POST</label>
                                <select id="intentSelect" class="select-input">
                                    <option value="TUTORIAL">📚 Mini Curso (Paso a Paso)</option>
                                    <option value="STORY">🕵️ Historia / Caso Real</option>
                                    <option value="TOOL">🛠️ Review Herramienta</option>
                                    <option value="VS">⚔️ Comparativa (A vs B)</option>
                                    <option value="SPEEDRUN">⚡ Speedrun (X en N pasos)</option>
                                    <option value="ARSENAL">🔫 Arsenal (Top Herramientas)</option>
                                    <option value="INCIDENT">🔥 Caso Real (Forense)</option>
                                    <option value="CHALLENGE">🧩 Challenge / CTF</option>
                                    <option value="CHEATSHEET">📋 Cheat Sheet Completa</option>
                                    <option value="MYTHBUSTER">💥 Destructor de Mitos</option>
                                    <option value="NEWS">📰 Noticia / Actualidad</option>
                                    <option value="THEORY">🧠 Concepto Teórico</option>
                                    <option value="EBOOK_CREATOR" style="color:#A855F7; font-weight:bold;">📖 Libro PDF Educativo</option>
                                    <option value="TIKTOK_TREND" style="color:#00D9FF; font-weight:bold;">🔥 TikTok Viral</option>
                                </select>
                            </div>
                        </div>

                        <!-- SEO SECTION (Auto-Generated) -->
                        <div class="control-group" style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #333;">
                            <label style="color: #00D9FF;">🤖 SEO & VIRALIZACIÓN</label>
                            <textarea id="seoCaption" class="textarea-input" style="height: 80px; font-size: 11px; color: #aaa !important;" placeholder="Descripción viral generada por IA..." readonly></textarea>
                            <input type="text" id="seoHashtags" style="font-size: 11px; color: #00D9FF !important;" placeholder="#Hashtags" readonly>
                            <button id="copySeoBtn" style="
                                margin-top: 6px;
                                background: linear-gradient(135deg, #00D9FF22, #0066FF22);
                                border: 1px solid #00D9FF44;
                                color: #00D9FF;
                                padding: 8px 12px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 11px;
                                font-weight: 700;
                                width: 100%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 6px;
                                transition: all 0.2s;
                                letter-spacing: 0.5px;
                            ">
                                <span class="material-icons" style="font-size: 14px;">content_copy</span>
                                COPIAR DESCRIPCIÓN + HASHTAGS
                            </button>
                        </div>

                        <!-- AI Provider Select -->
                        <div class="control-group" style="margin-top: 15px;">
                            <label>MODELO DE IA</label>
                            <select id="aiProvider" class="select-input">
                                <option value="gemini">✨ Google Gemini (Recomendado)</option>
                                <option value="openai">🧠 OpenAI GPT-4</option>
                                <option value="anthropic"> Claude 3.5 Sonnet</option>
                            </select>
                        </div>

                        <!-- Generate Button -->
                        <button id="generateBtn" class="btn-primary full-width">
                            <span class="material-icons">psychology</span>
                            GENERAR CON IA
                        </button>

                        <div class="divider"></div>

                        <!-- Editor -->
                        <div class="editor-wrapper">
                            <div class="panel-header small">
                                <span>HTML SCRIPT</span>
                                <button id="clearBtn" class="icon-btn">✕</button>
                            </div>
                            <textarea id="editor"></textarea>
                        </div>
                    </div>
                </div>

                <!-- CENTER PANEL: CANVAS -->
                <div class="panel-center">
                    <div id="previewContainer" class="preview-container" style="position:relative;">
                        <!-- FLOATING TOOLBAR — top-right overlay -->
                        <div class="canvas-header" style="position:absolute; top:8px; right:8px; z-index:50; display:flex; flex-direction:row; align-items:center; gap:6px; background:rgba(0,0,0,0.85); border:1px solid #333; border-radius:8px; padding:4px 10px; backdrop-filter:blur(8px);">
                             <div class="nav-controls" style="display:flex; align-items:center; gap:4px;">
                                <button id="prevSlide" class="nav-btn" style="padding:2px 6px; font-size:12px;">❮</button>
                                <span id="slideCounter" class="nav-counter" style="font-size:11px; min-width:50px; text-align:center;">-- / --</span>
                                <button id="nextSlide" class="nav-btn" style="padding:2px 6px; font-size:12px;">❯</button>
                            </div>
                            <div style="width:1px; height:16px; background:#333;"></div>
                            <!-- THEME SELECTOR -->
                            <div class="theme-controls" style="display:flex; gap:5px; align-items:center;">
                                <button class="theme-btn active" data-theme="CYBER" style="background:#00D9FF; width:14px; height:14px; box-shadow:0 0 3px #00D9FF;" title="Cyber"></button>
                                <button class="theme-btn" data-theme="RED_TEAM" style="background:#FF0000; width:14px; height:14px;" title="Red Team"></button>
                                <button class="theme-btn" data-theme="BLUE_TEAM" style="background:#0088FF; width:14px; height:14px;" title="Blue Team"></button>
                                <button class="theme-btn" data-theme="OSINT" style="background:#d946ef; width:14px; height:14px;" title="OSINT"></button>
                                <div style="position:relative; width:14px; height:14px; overflow:hidden; border-radius:50%; border:1px solid #444; cursor:pointer;" title="Color Personalizado">
                                    <input type="color" id="customColorPicker" style="position:absolute; top:-50%; left:-50%; width:200%; height:200%; padding:0; margin:0; cursor:pointer; border:none;" value="#00D9FF">
                                </div>
                            </div>
                            <div style="width:1px; height:16px; background:#333;"></div>
                            <div style="display:flex; gap:6px; align-items:center;">
                                <button id="toggleSafeZone" class="icon-btn active" title="Zona Segura" style="color:#fff; border:1px solid #444; padding:2px; border-radius:4px; font-size:14px;">
                                    <span class="material-icons" style="font-size:16px;">crop_free</span>
                                </button>
                                <select id="aspectRatio" class="ratio-select" style="font-size:11px; padding:2px 4px;">
                                    <option value="1080x1920">9:16</option>
                                    <option value="1080x1080">1:1</option>
                                    <option value="1080x1350">4:5</option>
                                </select>
                            </div>
                        </div>
                        <div id="mainCanvas" class="preview-frame" style="width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"></div>
                    </div>


                </div>

                <!-- RIGHT PANEL: INSPECTOR -->
                <div class="panel-right">
                    <div class="panel-header">
                        <span class="material-icons">tune</span>
                        <span>INSPECTOR</span>
                    </div>
                    <div id="dataEditorPanel" class="panel-content scrollable">
                        <div class="empty-state">
                            Selecciona un slide para editar sus datos
                        </div>
                    </div>
                </div>

                <!-- FOOTER STATUS BAR -->
                <div class="studio-footer">
                    <div class="status-left">
                        <span class="status-dot"></span>
                        <span id="statusText">SISTEMA LISTO</span>
                    </div>
                    
                    <!-- NEW EXPORT CONTROLS IN FOOTER -->
                    <div class="footer-controls">
                        <button id="exportSingleBtn" class="footer-btn" title="Exportar Slide Actual">
                            <span class="material-icons">image</span> Exportar
                        </button>
                        <div class="vl"></div>
                        <button id="exportBatchBtn" class="footer-btn accent" title="Exportar PNGs">
                            <span class="material-icons">collections</span> Multi PNG
                        </button>
                        <div class="vl"></div>
                        <button id="exportPdfBtn" class="footer-btn accent" style="background: linear-gradient(135deg, #00D9FF22, #A855F744); border-color: #A855F7;" title="Exportar PDF Vectorial con Links">
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
        // Initialize CodeMirror if not already
        if (!this.editorInstance) {
            this.initEditor();
        }

        // Initialize DataEditor
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

        // Re-attach listeners if needed
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

            // Format the trend summary
            let summary = `<strong>${data.type.toUpperCase()}</strong>`;
            if (data.hashtag) summary += ` • #${data.hashtag}`;
            if (data.viralHook) summary += `<br><em>"${data.viralHook}"</em>`;

            text.innerHTML = summary;

            // Auto-select TIKTOK_TREND mode if not already
            if (intentSelect && intentSelect.value !== 'TIKTOK_TREND') {
                // Add the option if it doesn't exist (it should be in HTML ideally, but we can inject or select)
                // Actually, let's just select it if it exists. 
                // Wait, I haven't added TIKTOK_TREND to the HTML select options yet! I need to do that too.
            }
        }
    }

    initEditor() {
        const textarea = this.element.querySelector('#editor');
        if (textarea && window.CodeMirror) {
            this.editorInstance = window.CodeMirror.fromTextArea(textarea, {
                mode: 'htmlmixed',
                theme: 'material-darker',
                lineNumbers: true,
                lineWrapping: true
            });

            // Sync logic
            this.editorInstance.on('change', () => {
                // Debounce logic could go here
                // this.updatePreview(); 
                // For now just global or dispatched event
                document.dispatchEvent(new CustomEvent('editor-change', {
                    detail: { value: this.editorInstance.getValue() }
                }));
            });
        }
    }

    attachListeners() {
        // Buttons
        const genBtn = this.element.querySelector('#generateBtn');
        if (genBtn) genBtn.onclick = () => window.app.handleGenerate(); // Hook to main app logic

        // Copy SEO Button
        const copySeoBtn = this.element.querySelector('#copySeoBtn');
        if (copySeoBtn) {
            copySeoBtn.onclick = async () => {
                const caption = this.element.querySelector('#seoCaption')?.value || '';
                const hashtags = this.element.querySelector('#seoHashtags')?.value || '';

                if (!caption && !hashtags) {
                    copySeoBtn.innerHTML = '<span class="material-icons" style="font-size:14px;">warning</span> SIN DATOS';
                    setTimeout(() => {
                        copySeoBtn.innerHTML = '<span class="material-icons" style="font-size:14px;">content_copy</span> COPIAR DESCRIPCIÓN + HASHTAGS';
                    }, 2000);
                    return;
                }

                const textToCopy = `${caption}\n\n${hashtags}`.trim();

                try {
                    await navigator.clipboard.writeText(textToCopy);
                    copySeoBtn.innerHTML = '<span class="material-icons" style="font-size:14px;">check</span> ¡COPIADO!';
                    copySeoBtn.style.borderColor = '#00FF88';
                    copySeoBtn.style.color = '#00FF88';
                    setTimeout(() => {
                        copySeoBtn.innerHTML = '<span class="material-icons" style="font-size:14px;">content_copy</span> COPIAR DESCRIPCIÓN + HASHTAGS';
                        copySeoBtn.style.borderColor = '#00D9FF44';
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
            this.updatePreview(); // Trigger re-render/resize
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
                        // Also toggle button visual state
                        toggleSafeBtn.classList.toggle('active');
                    }
                }
            };
        }

        // Bridge Listener (One-time attach)
        if (!this._messageHandler) {
            this._messageHandler = (e) => this.handlePreviewMessage(e.data);
            window.addEventListener('message', this._messageHandler);
        }

        // Theme Buttons Logic
        const themeBtns = this.element.querySelectorAll('.theme-btn');
        themeBtns.forEach(btn => {
            btn.onclick = () => {
                // Update UI
                themeBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.boxShadow = 'none';
                });
                btn.classList.add('active');
                btn.style.boxShadow = `0 0 8px ${btn.style.background}`;

                // Notify App
                if (window.app && window.app.handleThemeChange) {
                    window.app.handleThemeChange(btn.dataset.theme);
                }
            };
        });

        // Custom Color Picker Logic
        const colorPicker = this.element.querySelector('#customColorPicker');
        if (colorPicker) {
            colorPicker.oninput = (e) => {
                const color = e.target.value;
                // Notify App with Hex
                if (window.app && window.app.handleThemeChange) {
                    window.app.handleThemeChange(color);
                }

                // Visual feedback: remove active from preset buttons
                themeBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.boxShadow = 'none';
                });
            };
        }

        // ── EXPORT BUTTONS ──────────────────────────────────────────────────

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

                // Get dimensions from aspect ratio
                const ratioSelect = this.element.querySelector('#aspectRatio');
                const parts = ratioSelect ? ratioSelect.value.split('x') : ['1080', '1920'];
                const width = parseInt(parts[0]);
                const height = parseInt(parts[1]);

                // UI loading state
                const originalText = exportSingleBtn.innerHTML;
                exportSingleBtn.innerHTML = '<span class="material-icons spin">autorenew</span> Exportando...';
                exportSingleBtn.disabled = true;

                try {
                    if (window.app.canvasRenderer) {
                        // Use a dedicated offscreen renderer to avoid disturbing the live editor
                        const ratioW = width || 1080;
                        const ratioH = height || 1920;
                        const exportRenderer = window.createRenderer(ratioW, ratioH, window.app.canvasRenderer._activeThemeName || 'cyber');
                        exportRenderer._imageCache = new Map(window.app.canvasRenderer._imageCache);
                        const exportData = JSON.parse(JSON.stringify(currentSlide.data));
                        // Pre-load images referenced in layers
                        for (const layer of (exportData.layers || [])) {
                            if (layer.src) await exportRenderer.loadImage(layer.src).catch(() => null);
                            if (layer.imageSrc) await exportRenderer.loadImage(layer.imageSrc).catch(() => null);
                        }
                        // Render with skipLayout=true to preserve ALL user modifications
                        await exportRenderer.render(exportData, { skipLayout: true });
                        await new Promise(r => setTimeout(r, 80));
                        const dataURL = exportRenderer.exportDataURL('image/png', 1.0);

                        // Convert data URL to blob and trigger download
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
                        // Clean up offscreen renderer
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

                // Get dimensions
                const ratioSelect = this.element.querySelector('#aspectRatio');
                const parts = ratioSelect ? ratioSelect.value.split('x') : ['1080', '1920'];
                const width = parseInt(parts[0]);
                const height = parseInt(parts[1]);

                // Get title for folder name
                const title = document.getElementById('themeInput')?.value || 'Post_Sin_Titulo';

                // UI loading state
                const originalText = exportBatchBtn.innerHTML;
                exportBatchBtn.innerHTML = '<span class="material-icons spin">autorenew</span> Exportando...';
                exportBatchBtn.disabled = true;

                const slides = window.app.slides;
                const hasCanvasSlides = slides.some(s => s.isCanvas);

                try {
                    if (hasCanvasSlides && window.app.canvasRenderer) {
                        // ═══ ROBUST OFFSCREEN EXPORT ═══
                        // Uses a SEPARATE renderer so the live editor/previewer is untouched
                        const folderName = title.replace(/[^a-zA-Z0-9_\- ]/g, '_').substring(0, 80);
                        window.app.setStatus('🚀 Preparando exportación de ' + slides.length + ' slides...', true);
                        let exported = 0;
                        let savePath = '';

                        // Create a dedicated offscreen renderer for export
                        const exportRenderer = window.createRenderer(
                            width || 1080,
                            height || 1920,
                            window.app.canvasRenderer._activeThemeName || 'cyber'
                        );
                        // Share image cache to avoid re-downloading assets
                        exportRenderer._imageCache = new Map(window.app.canvasRenderer._imageCache);

                        for (let i = 0; i < slides.length; i++) {
                            const slide = slides[i];
                            window.app.setStatus('🖼️ Renderizando slide ' + (i + 1) + '/' + slides.length + '...', true);

                            if (slide.isCanvas && slide.data) {
                                // Deep-clone to prevent any mutation of original data
                                const exportData = JSON.parse(JSON.stringify(slide.data));

                                // Pre-load any images referenced in layers
                                const layers = exportData.layers || [];
                                for (const layer of layers) {
                                    if (layer.src) await exportRenderer.loadImage(layer.src).catch(() => null);
                                    if (layer.imageSrc) await exportRenderer.loadImage(layer.imageSrc).catch(() => null);
                                }

                                // Render with skipLayout=true to preserve ALL user modifications
                                await exportRenderer.render(exportData, { skipLayout: true });

                                // Brief delay to ensure canvas is fully painted
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

                        // Clean up offscreen renderer
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
                    window.app.setStatus('🚀 Procesando vectores para PDF PDF...', true);

                    // Extraer los scene graphs limpios
                    const sceneGraphs = slides.map(s => s.data);

                    const doc = await CanvasToPDF.generate(sceneGraphs, {
                        title: title,
                        format: [width, height],
                        orientation: width > height ? 'landscape' : 'portrait'
                    });

                    // Descargar en navegador (o podríamos mandar al main process de Electron)
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
        // msg: { type: 'SELECT', id: 'TITLE' } or { type: 'UPDATE_POS', id, x, y }
        if (!msg || !msg.type) return;

        console.log("Studio received:", msg);

        // We need access to current slide data. 
        // Best way involves triggering an event on window.app or modifying local state if we had it.
        // But StudioView is stateless mostly. It relies on window.app state via updateStudioState.
        // Let's dispatch a custom event that App.js can listen to, OR directly call app.

        if (window.app && window.app.handlePreviewAction) {
            window.app.handlePreviewAction(msg);
        }
    }

    updatePreview() {
        if (!window.app || !window.app.slides || window.app.slides.length === 0) return;

        const currentSlide = window.app.slides[window.app.currentSlideIndex];
        if (!currentSlide || !currentSlide.data) return;

        // Ensure canvas element exists
        const canvas = this.element.querySelector('#mainCanvas');
        if (!canvas) return;

        // Initialize CanvasEditor if missing or if it lost its instance methods
        if (!window.app.canvasEditor || typeof window.app.canvasEditor.attachCanvas !== 'function') {
            window.app.canvasEditor = new window.CanvasEditor(canvas, window.app.canvasRenderer);
            // Wire up onChange to persist visual edits (drag, resize, text) back to slide.data
            window.app.canvasEditor.onChange = (modifiedGraph) => {
                if (window.app && window.app.slides && window.app.slides[window.app.currentSlideIndex]) {
                    window.app.slides[window.app.currentSlideIndex].data = modifiedGraph;
                }
            };
        } else {
            // Update canvas reference in case of re-render
            window.app.canvasEditor.attachCanvas(canvas);
        }

        // Render the scene graph onto the preview canvas
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
            // Handle array or string
            hashtagsEl.value = Array.isArray(seoData.hashtags)
                ? seoData.hashtags.join(' ')
                : seoData.hashtags;
        }
    }

    getAspectRatio() {
        return this.element.querySelector('#aspectRatio').value; // "1080x1920"
    }
}
