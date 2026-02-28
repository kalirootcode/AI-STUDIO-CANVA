import { BaseView } from './BaseView.js';
import { DataEditor } from '../services/DataEditor.js';

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
                                    <option value="EBOOK_CREATOR" style="color:#A855F7; font-weight:bold;">📖 E-BOOK VIRAL (8 Páginas)</option>
                                    <option value="TIKTOK_TREND" style="color:#00D9FF; font-weight:bold;">🔥 TIKTOK TREND (AUTO)</option>
                                    <option value="VIRAL_HOOK_TEST">🧪 A/B Hook Test</option>
                                    <option value="CANVAS_MODE" style="color:#FFD700; font-weight:bold;">🎨 CANVAS ENGINE (AI Libre)</option>
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
                        <iframe id="previewFrame" class="preview-frame"></iframe>
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
                        <button id="exportBatchBtn" class="footer-btn accent" title="Exportar Todo el Pack">
                            <span class="material-icons">collections</span> Exportar Todo
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
                    if (currentSlide.isCanvas && window.app.canvasRenderer) {
                        // Canvas mode: render scene graph to PNG and download directly
                        await window.app.canvasRenderer.render(currentSlide.data);
                        const dataURL = window.app.canvasRenderer.exportDataURL('image/png', 1.0);

                        // Convert data URL to blob and trigger download
                        const response = await fetch(dataURL);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = 'canvas-slide-' + (window.app.currentSlideIndex + 1) + '.png';
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        window.app.setStatus('✅ Slide exportada como PNG');
                    } else if (currentSlide.html) {
                        const exportHtml = window.app.getExportHTML(currentSlide);
                        const result = await window.cyberCanvas.exportImage({
                            html: exportHtml,
                            width,
                            height,
                            format: 'png'
                        });
                        if (result.success) {
                            window.app.setStatus('✅ Exportado: ' + result.path);
                        } else {
                            alert('❌ Error: ' + result.error);
                        }
                    } else {
                        alert('⚠️ No hay contenido exportable en esta slide.');
                    }
                } catch (err) {
                    alert('❌ Error exportando: ' + err.message);
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
                        // Canvas mode: render each slide and save directly to ~/Pictures/
                        const folderName = title.replace(/[^a-zA-Z0-9_\- ]/g, '_').substring(0, 80);
                        window.app.setStatus('🚀 Exportando ' + slides.length + ' slides a Pictures...', true);
                        let exported = 0;
                        let savePath = '';

                        for (let i = 0; i < slides.length; i++) {
                            const slide = slides[i];
                            window.app.setStatus('🖼️ Guardando slide ' + (i + 1) + '/' + slides.length + '...', true);

                            if (slide.isCanvas && slide.data) {
                                // Deep-clone the scene graph so the render pass 
                                // does NOT mutate the original slide data
                                const exportData = JSON.parse(JSON.stringify(slide.data));

                                // Render with skipLayout=true to preserve user modifications
                                // (moved elements, resized items, edited text positions)
                                await window.app.canvasRenderer.render(exportData, { skipLayout: true });
                                const dataURL = window.app.canvasRenderer.exportDataURL('image/png', 1.0);

                                // Save directly to disk via IPC
                                const fileName = folderName + '_slide_' + String(i + 1).padStart(2, '0') + '.png';

                                const result = await window.cyberCanvas.saveCanvasPng({ dataURL, folderName, fileName });
                                if (result.success) {
                                    exported++;
                                    savePath = result.path.replace('/' + fileName, '');
                                }
                            }
                        }

                        window.app.setStatus('✅ ' + exported + ' slides guardadas en ~/Pictures/' + folderName);
                        alert('✅ Exportación completada!\n' + exported + ' imágenes guardadas en:\n' + savePath);
                    } else {
                        // HTML-only mode: use Puppeteer batch export
                        const slidesHtml = slides.map(s => window.app.getExportHTML(s));
                        window.app.setStatus('🚀 Exportando ' + slidesHtml.length + ' slides...', true);

                        const result = await window.cyberCanvas.exportBatch({
                            slides: slidesHtml,
                            width,
                            height,
                            format: 'png',
                            title
                        });

                        if (result.success) {
                            window.app.setStatus('✅ ' + result.count + ' slides exportadas en: ' + result.path);
                            alert('✅ Exportación completada!\n' + result.count + ' imágenes guardadas en:\n' + result.path);
                        } else {
                            alert('❌ Error: ' + result.error);
                        }
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

    updatePreview(html) {
        const frame = this.element.querySelector('#previewFrame');
        if (!frame) return;

        // 1. Get Aspect Ratio
        const ratioSelect = this.element.querySelector('#aspectRatio');
        const ratioParts = ratioSelect ? ratioSelect.value.split('x') : ['1080', '1920'];
        const targetWidth = parseInt(ratioParts[0]);
        const targetHeight = parseInt(ratioParts[1]);

        // 2. Get Container Metrics
        const container = this.element.querySelector('#previewContainer');
        if (!container) return; // Should exist

        const containerRect = container.getBoundingClientRect();
        // Adjust for padding to make preview smaller and avoid UI overlap
        const availWidth = containerRect.width - 100;
        const availHeight = containerRect.height - 100;

        // 3. Calculate Iframe Size (Fit in Container)
        const aspectRatio = targetWidth / targetHeight;
        let displayWidth, displayHeight;

        if (availWidth / availHeight > aspectRatio) {
            // Limited by height
            displayHeight = availHeight;
            displayWidth = displayHeight * aspectRatio;
        } else {
            // Limited by width
            displayWidth = availWidth;
            displayHeight = displayWidth / aspectRatio;
        }

        // Apply Iframe Size
        frame.style.width = `${displayWidth}px`;
        frame.style.height = `${displayHeight}px`;
        frame.style.border = 'none'; // Ensure no border mess up sizing

        // 4. Calculate Content Scaling (Zoom)
        // Assume content is designed for targetWidth/Height (e.g., 1080x1920)
        // If HTML content defines its own size, we rely on the CSS Zoom to Handle it.
        // We match display size to content size.

        let contentWidth = targetWidth;
        let contentHeight = targetHeight;

        // Optional: Parse HTML for explicit width/height? 
        // Legacy code checked for matches. Let's incorporate that safety.
        if (html) {
            const widthMatch = html.match(/(?:max-width|width):\s*(\d+)px/);
            const heightMatch = html.match(/(?:max-height|height):\s*(\d+)px/);
            if (widthMatch && parseInt(widthMatch[1]) > 500) contentWidth = parseInt(widthMatch[1]);
            // If explicit width is found and it's large, use it.
        }

        const zoomFactor = displayWidth / contentWidth;

        console.log(`Preview: Display=${displayWidth}x${displayHeight}, Content=${contentWidth}x${contentHeight}, Zoom=${zoomFactor}`);

        // 5. Inject Scaling CSS
        const scalingStyle = `
            <style>
                html {
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                body {
                    margin: 0;
                    padding: 0;
                    width: ${contentWidth}px;
                    height: ${contentHeight}px;
                    transform: scale(${zoomFactor});
                    transform-origin: top left;
                    overflow: hidden;
                    background: #000;
                }
                /* Optional: Center body if using transform */
                /* Actually with transform-origin top-left and correct iframe size, it fits perfectly. */
                
                /* Legacy uses zoom property which is easier in Chrome */
                /* Let's use zoom for legacy compatibility if previous code used it */
                @media screen and (-webkit-min-device-pixel-ratio:0) { 
                    body {
                        transform: none;
                        zoom: ${zoomFactor};
                    }
                }
            </style>
        `;

        // 6. Set Content
        // Inject styles before closing head, or at start if no head
        let finalHtml = html || "";

        // INJECT INTERACTIVITY SCRIPT
        const interactivity = (window.TemplateUtils && window.TemplateUtils.getInteractivityScript)
            ? window.TemplateUtils.getInteractivityScript()
            : '';

        // INJECT AUTO-DRAG POSITION OVERRIDES (for persisted auto-drag positions)
        let autoDragOverrides = '';
        if (window.app && window.app.slides && window.app.slides[window.app.currentSlideIndex]) {
            const overrides = window.app.slides[window.app.currentSlideIndex].data._overrides || {};
            const autoRules = Object.entries(overrides)
                .filter(([id]) => id.startsWith('auto_'))
                .map(([id, pos]) => `[data-drag-id="${id}"] { transform: translate(${pos.x}px, ${pos.y}px) !important; }`)
                .join('\n');
            if (autoRules) {
                autoDragOverrides = `<style>/* Auto-Drag Overrides */\n${autoRules}\n</style>`;
            }
        }

        if (finalHtml.includes('</head>')) {
            finalHtml = finalHtml.replace('</head>', `${scalingStyle}${interactivity}${autoDragOverrides}</head>`);
        } else {
            finalHtml = `${scalingStyle}${interactivity}${autoDragOverrides}${finalHtml}`;
        }

        frame.srcdoc = finalHtml;

        // Persist Safe Zone State
        frame.onload = () => {
            const toggleSafeBtn = this.element.querySelector('#toggleSafeZone');
            if (toggleSafeBtn && toggleSafeBtn.classList.contains('active')) {
                const safeZone = frame.contentDocument.querySelector('.safe-zone');
                if (safeZone) safeZone.classList.add('debug');
            }
        };
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
