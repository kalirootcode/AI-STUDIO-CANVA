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
                                    <option value="NEWS">📰 Noticia / Actualidad</option>
                                    <option value="THEORY">🧠 Concepto Teórico</option>
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
                    <div class="canvas-header">
                         <div class="nav-controls">
                            <button id="prevSlide" class="nav-btn">❮</button>
                            <span id="slideCounter" class="nav-counter">-- / --</span>
                            <button id="nextSlide" class="nav-btn">❯</button>
                        </div>
                        
                        <!-- THEME SELECTOR -->
                        <div class="theme-controls" style="display:flex; gap:8px; margin:0 15px; border-left:1px solid #333; border-right:1px solid #333; padding:0 15px; align-items: center;">
                            <button class="theme-btn active" data-theme="CYBER" style="background:#00D9FF; box-shadow:0 0 5px #00D9FF;" title="Cyber (Blue)"></button>
                            <button class="theme-btn" data-theme="RED_TEAM" style="background:#FF0000;" title="Red Team"></button>
                            <button class="theme-btn" data-theme="BLUE_TEAM" style="background:#0088FF;" title="Blue Team"></button>
                            <button class="theme-btn" data-theme="OSINT" style="background:#d946ef;" title="OSINT (Purple)"></button>
                            
                            <!-- CUSTOM COLOR PICKER -->
                            <div style="width:1px; height:16px; background:#333; margin:0 4px;"></div>
                            <div style="position:relative; width:20px; height:20px; overflow:hidden; border-radius:50%; border:1px solid #444; cursor:pointer;" title="Color Personalizado">
                                <input type="color" id="customColorPicker" style="position:absolute; top:-50%; left:-50%; width:200%; height:200%; padding:0; margin:0; cursor:pointer; border:none;" value="#00D9FF">
                            </div>
                        </div>

                        <div style="display:flex; gap:10px; align-items:center;">
                            <button id="toggleSafeZone" class="icon-btn active" title="Ver Zona Segura TikTok" style="color:#fff; border:1px solid #444; padding:4px; border-radius:4px;">
                                <span class="material-icons">crop_free</span>
                            </button>
                            <select id="aspectRatio" class="ratio-select">
                                <option value="1080x1920">9:16 (TikTok)</option>
                                <option value="1080x1080">1:1 (Post)</option>
                                <option value="1080x1350">4:5 (Portrait)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div id="previewContainer" class="preview-container">
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
                if (!currentSlide || !currentSlide.html) {
                    alert('⚠️ No hay contenido en la slide actual.');
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
                    const result = await window.cyberCanvas.exportImage({
                        html: currentSlide.html,
                        width,
                        height,
                        format: 'png'
                    });

                    if (result.success) {
                        window.app.setStatus(`✅ Exportado: ${result.path}`);
                    } else {
                        alert(`❌ Error: ${result.error}`);
                    }
                } catch (err) {
                    alert(`❌ Error exportando: ${err.message}`);
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

                // Collect all slide HTML
                const slidesHtml = window.app.slides.map(s => s.html);

                // Get title for folder name
                const title = document.getElementById('themeInput')?.value || 'Post_Sin_Titulo';

                // UI loading state
                const originalText = exportBatchBtn.innerHTML;
                exportBatchBtn.innerHTML = '<span class="material-icons spin">autorenew</span> Exportando...';
                exportBatchBtn.disabled = true;
                window.app.setStatus(`🚀 Exportando ${slidesHtml.length} slides...`, true);

                try {
                    const result = await window.cyberCanvas.exportBatch({
                        slides: slidesHtml,
                        width,
                        height,
                        format: 'png',
                        title
                    });

                    if (result.success) {
                        window.app.setStatus(`✅ ${result.count} slides exportadas en: ${result.path}`);
                        alert(`✅ Exportación completada!\n${result.count} imágenes guardadas en:\n${result.path}`);
                    } else {
                        alert(`❌ Error: ${result.error}`);
                    }
                } catch (err) {
                    alert(`❌ Error exportando batch: ${err.message}`);
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
        // Adjust for padding if any 
        const availWidth = containerRect.width - 20;
        const availHeight = containerRect.height - 20;

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

        if (finalHtml.includes('</head>')) {
            finalHtml = finalHtml.replace('</head>', `${scalingStyle}${interactivity}</head>`);
        } else {
            finalHtml = `${scalingStyle}${interactivity}${finalHtml}`;
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
