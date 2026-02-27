import { ViewManager } from './services/ViewManager.js';
import { Sidebar } from './components/Sidebar.js';
import { StudioView } from './views/StudioView.js';
import { TemplatesView } from './views/TemplatesView.js';
import { SettingsView } from './views/SettingsView.js';
import './services/TemplateUtils.js'; // Register Global Utils

class App {
    constructor() {
        this.overrideConsole();
        this.viewManager = new ViewManager();
        this.sidebar = new Sidebar();
        this.tiktokSignal = null; // Store active trend
        this.init();
    }

    overrideConsole() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog(...args);
            if (window.cyberCanvas && window.cyberCanvas.log) {
                window.cyberCanvas.log('info', args[0], ...args.slice(1));
            }
        };

        console.warn = (...args) => {
            originalWarn(...args);
            if (window.cyberCanvas && window.cyberCanvas.log) {
                window.cyberCanvas.log('warn', args[0], ...args.slice(1));
            }
        };

        console.error = (...args) => {
            originalError(...args);
            if (window.cyberCanvas && window.cyberCanvas.log) {
                window.cyberCanvas.log('error', args[0], ...args.slice(1));
            }
        };
    }

    async init() {
        console.log("🚀 Initializing Cyber-Canvas v2...");
        // 1. Init View Manager
        // this.viewManager = new ViewManager(); // Moved to constructor

        // 2. Register Views
        this.viewManager.register('studio', new StudioView());
        this.viewManager.register('templates', new TemplatesView());
        this.viewManager.register('settings', new SettingsView());

        // 3. Init Sidebar
        this.sidebar = new Sidebar(this.viewManager);
        const shell = document.getElementById('app-shell');
        shell.insertBefore(this.sidebar.render(), shell.firstChild);

        // 4. Navigate to Default View
        await this.viewManager.navigate('studio');

        // 5. Init Core Engines (Legacy Bridge)
        this.initEngines();

        // 6. Setup TikTok Listener
        this.setupTikTokListener();

        // 6. Global Event Listeners
        document.addEventListener('editor-change', (e) => {
            this.handleEditorChange(e.detail.value);
        });

        console.log("✅ App Initialized");
    }

    handleEditorChange(contentString) {
        if (!contentString) return;

        // Check if content looks like HTML
        const trimmed = contentString.trim();
        if (trimmed.startsWith('<')) {
            // Treat as Raw HTML Mode
            const studio = this.viewManager.views['studio'];
            if (studio) {
                studio.updatePreview(contentString);
            }

            // Update internal state with raw HTML
            if (this.slides && this.slides[this.currentSlideIndex]) {
                this.slides[this.currentSlideIndex].html = contentString;
                this.slides[this.currentSlideIndex].data = { _raw: true }; // Mark as raw
            }
            return;
        }

        try {
            const data = JSON.parse(contentString);

            // Get current template ID from state
            if (!this.slides || !this.slides[this.currentSlideIndex]) return;
            const currentSlide = this.slides[this.currentSlideIndex];

            // Skip re-render for Canvas slides (they are pre-rendered images)
            if (currentSlide.isCanvas) return;

            // Re-render
            const html = this.templateEngine.renderTemplate(currentSlide.templateId, data);

            // Update Preview
            const studio = this.viewManager.views['studio'];
            if (studio) {
                studio.updatePreview(html);
            }

            // Update internal state
            currentSlide.data = data;
            currentSlide.html = html;

        } catch (err) {
            console.warn("Invalid JSON in editor:", err);
            // Optional: Show error in UI?
        }
    }

    initEngines() {
        // Instantiate engines that were global in legacy renderer.js
        this.templateEngine = new TemplateEngine();
        this.contentEngine = new ContentEngine(); // Assumes it's loaded via script tag

        // Load shared CSS first, then load template packs
        this.templateEngine.loadSharedAssets().then(() => {
            return this.templateEngine.loadFromPacks();
        }).then(packs => {
            console.log("📦 Packs loaded:", packs.length);
            // TODO: Pass to TemplatesView
        });
    }

    setupTikTokListener() {
        if (window.cyberCanvas && window.cyberCanvas.onTiktokTrend) {
            window.cyberCanvas.onTiktokTrend((data) => {
                console.log("🔥 App received TikTok Trend:", data);
                this.tiktokSignal = data;

                // Update Studio View if active
                const studio = this.viewManager.views['studio'];
                if (studio && studio.showTiktokSignal) {
                    studio.showTiktokSignal(data);
                }

                this.setStatus(`🔥 Trend Detectado: ${data.viralHook ? 'Viral Hook' : data.type}`);
            });
        }
    }

    // --- STUDIO ACTIONS ---

    loadPackIntoStudio(packId) {
        // 1. Get templates for this pack
        const templates = this.templateEngine.getTemplatesByPack(packId);

        if (!templates || templates.length === 0) {
            alert("Este pack no tiene templates.");
            return;
        }

        // 2. Initialize Slides with DEFAULT content from first template
        // This ensures 'this.slides' is not empty, so manual editing works.
        const firstTemplate = templates[0];

        // Use default fields from manifest if available, or empty object
        const defaultContent = {};
        if (firstTemplate.fields) {
            for (const [key, field] of Object.entries(firstTemplate.fields)) {
                defaultContent[key] = field.default || `Placeholder ${key}`;
            }
        }
        // Force Theme
        defaultContent.THEME = 'CYBER';

        const initialHtml = this.templateEngine.renderTemplate(firstTemplate.id, defaultContent);

        this.slides = [{
            templateId: firstTemplate.id,
            data: defaultContent,
            html: initialHtml
        }];

        this.currentSlideIndex = 0;
        this.selectedPackId = packId; // Store for valid context

        // 3. Navigate and Update
        this.viewManager.navigate('studio').then(() => {
            this.updateStudioState();
            this.setStatus(`Pack cargado: ${packId}`);
        });
    }



    // --- FOOTER HELPERS ---

    setStatus(text, animate = false) {
        const el = document.getElementById('statusText');
        const dot = document.querySelector('.status-dot');
        if (el) el.innerText = text;
        if (dot) {
            if (animate) dot.classList.add('active');
            else dot.classList.remove('active');
        }
    }

    setProgress(percent) {
        const bar = document.getElementById('progressBar');
        if (bar) bar.style.width = `${percent}%`;
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async handleGenerate() {
        console.log("🤖 Generate Triggered (REAL)");
        const topic = document.getElementById('themeInput').value;
        const count = document.getElementById('slideCount').value;
        const intentSelect = document.getElementById('intentSelect').value;
        const provider = document.getElementById('aiProvider').value;

        if (!topic) {
            this.setStatus('⚠️ Escribe un tema para comenzar', false);
            return;
        }

        // 0. Get API Key
        // Attempt to get specific key, fallback to others if needed? No, strict for now.
        const apiKey = await window.cyberCanvas.getEnvKey(provider);
        if (!apiKey) {
            alert(`⚠️ No se encontró API Key para ${provider.toUpperCase()}. Ve a Configuración y agrégala.`);
            this.viewManager.navigate('settings');
            return;
        }

        // UI Loading State
        const btn = document.getElementById('generateBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="material-icons spin">autorenew</span> GENERANDO...`;
        btn.disabled = true;

        this.setStatus('🚀 Iniciando motores de IA...', true);
        this.setProgress(5);

        try {
            // 1. Mode Selection (Direct)
            const mode = intentSelect;

            // 2. Build Prompt
            this.setStatus(`🎨 Diseñando estructura (${mode})...`, true);

            // Inject trend signal if available
            if (this.tiktokSignal) {
                console.log("💉 Injecting TikTok Signal into Prompt", this.tiktokSignal);
                this.setStatus(`🔥 Inyectando Trend: ${this.tiktokSignal.type}`, true);
            }

            // Detect Canvas mode vs Template mode
            const isCanvasMode = (mode === 'CANVAS_MODE');
            const systemPrompt = isCanvasMode
                ? this.contentEngine.generateCanvasPrompt(topic, count, 'cyber')
                : this.contentEngine.generatePrompt(topic, count, mode, this.tiktokSignal);
            this.setProgress(40);

            // 3. Call AI
            this.setStatus(`📡 Conectando con ${provider.toUpperCase()}...`, true);

            // Artificial progress for long waits
            let progressInterval;
            if (count > 20) {
                let p = 40;
                progressInterval = setInterval(() => {
                    p += 1;
                    if (p > 65) p = 65; // Cap before completion
                    this.setProgress(p);
                    this.setStatus(`🧠 Generando ${count} slides (esto tomará un momento)... ${p}%`, true);
                }, 1000);
            }

            const result = await window.cyberCanvas.callAI({
                provider: provider,
                apiKey: apiKey,
                prompt: systemPrompt
            });

            if (progressInterval) clearInterval(progressInterval);

            if (!result.success) {
                throw new Error(result.error || "Error desconocido en la API.");
            }

            this.setProgress(70);
            this.setStatus('⚙️ Procesando respuesta...', true);

            // 4. Parse JSON
            let slidesData;
            let seoData = {};
            let cleanCode = result.code || "";
            try {
                // Step 1: Strip markdown code fences
                const jsonMatch = cleanCode.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    cleanCode = jsonMatch[1];
                }

                // Step 2: Find the outermost JSON structure
                const firstCurly = cleanCode.indexOf('{');
                const firstBracket = cleanCode.indexOf('[');

                if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
                    const lastCurly = cleanCode.lastIndexOf('}');
                    if (lastCurly !== -1) {
                        cleanCode = cleanCode.substring(firstCurly, lastCurly + 1);
                    }
                } else if (firstBracket !== -1) {
                    const lastBracket = cleanCode.lastIndexOf(']');
                    if (lastBracket !== -1) {
                        cleanCode = cleanCode.substring(firstBracket, lastBracket + 1);
                    }
                }

                // Step 3: Fix common AI JSON mistakes
                // Remove trailing commas before } or ]
                cleanCode = cleanCode.replace(/,\s*([\]}])/g, '$1');
                // Remove control characters except \n \r \t
                cleanCode = cleanCode.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
                // Fix unescaped newlines inside JSON strings safely
                let fixedCode = '';
                let inString = false;
                let escapedChar = false;
                for (let i = 0; i < cleanCode.length; i++) {
                    const ch = cleanCode[i];
                    if (escapedChar) {
                        fixedCode += ch;
                        escapedChar = false;
                    } else if (ch === '\\') {
                        fixedCode += ch;
                        escapedChar = true;
                    } else if (ch === '"') {
                        inString = !inString;
                        fixedCode += ch;
                    } else if (inString && (ch === '\n' || ch === '\r')) {
                        // Escape literal newlines inside strings
                        fixedCode += (ch === '\n') ? '\\n' : '\\r';
                    } else {
                        fixedCode += ch;
                    }
                }
                cleanCode = fixedCode;

                console.log("[DEBUG] Cleaned JSON (first 500 chars):", cleanCode.substring(0, 500));

                let responseData;
                try {
                    responseData = JSON.parse(cleanCode);
                } catch (firstErr) {
                    // === AGGRESSIVE CLEANUP ===
                    console.warn("[JSON-FIX] First parse failed:", firstErr.message, "Trying aggressive cleanup...");

                    // 1. Collapse all real newlines to spaces
                    cleanCode = cleanCode.replace(/\r?\n/g, ' ');

                    // 2. Fix single-quoted strings → double-quoted
                    cleanCode = cleanCode.replace(/(?<=[\{,]\s*)'([^']+)'\s*:/g, '"$1":');
                    cleanCode = cleanCode.replace(/:\s*'([^']*)'/g, ': "$1"');

                    // 3. Fix unquoted property names: { key: → { "key":
                    cleanCode = cleanCode.replace(/(?<=[\{,]\s*)([a-zA-Z_]\w*)\s*:/g, '"$1":');

                    // 4. Remove trailing commas
                    cleanCode = cleanCode.replace(/,\s*([\]}])/g, '$1');

                    // 5. Escape any remaining problematic chars inside strings
                    let cleaned2 = '';
                    let inStr = false, esc = false;
                    for (let i = 0; i < cleanCode.length; i++) {
                        const ch = cleanCode[i];
                        if (esc) { cleaned2 += ch; esc = false; continue; }
                        if (ch === '\\') { cleaned2 += ch; esc = true; continue; }
                        if (ch === '"') { inStr = !inStr; cleaned2 += ch; continue; }
                        if (inStr && ch === '\t') { cleaned2 += '\\t'; continue; }
                        if (inStr && ch === '\b') { cleaned2 += '\\b'; continue; }
                        cleaned2 += ch;
                    }
                    cleanCode = cleaned2;

                    // 6. Remove text after last valid closer
                    const lastBrace = cleanCode.lastIndexOf('}');
                    const lastBrack = cleanCode.lastIndexOf(']');
                    const lastValid = Math.max(lastBrace, lastBrack);
                    if (lastValid > 0) {
                        cleanCode = cleanCode.substring(0, lastValid + 1);
                    }

                    try {
                        responseData = JSON.parse(cleanCode);
                    } catch (secondErr) {
                        // === LAST RESORT: Fix truncated JSON ===
                        console.warn("[JSON-FIX] Second parse failed:", secondErr.message, "Trying truncation fix...");

                        // Check if we're inside an unclosed string (truncated mid-value)
                        let inString2 = false, escaped2 = false;
                        let lastQuotePos = -1;
                        for (let i = 0; i < cleanCode.length; i++) {
                            const c = cleanCode[i];
                            if (escaped2) { escaped2 = false; continue; }
                            if (c === '\\') { escaped2 = true; continue; }
                            if (c === '"') { inString2 = !inString2; lastQuotePos = i; }
                        }

                        // If string is unclosed, close it at a safe point
                        if (inString2 && lastQuotePos > 0) {
                            // Find the last complete-looking content before truncation
                            // Truncate string at a reasonable point and close it
                            let truncPoint = cleanCode.length - 1;
                            // Look backward for end of useful content
                            const searchBack = cleanCode.substring(lastQuotePos + 1);
                            const lastSafe = Math.max(
                                cleanCode.lastIndexOf('\\n'),
                                cleanCode.lastIndexOf('. '),
                                cleanCode.lastIndexOf(', ')
                            );
                            if (lastSafe > lastQuotePos) {
                                truncPoint = lastSafe;
                            }
                            cleanCode = cleanCode.substring(0, truncPoint) + '..."';
                        }

                        // Remove trailing incomplete entries
                        cleanCode = cleanCode.replace(/,\s*"[^"]*"?\s*$/, '');       // trailing incomplete key
                        cleanCode = cleanCode.replace(/,\s*\{[^}]*$/, '');             // trailing incomplete object
                        cleanCode = cleanCode.replace(/,\s*$/, '');                    // trailing comma

                        // Recount open brackets/braces
                        let openBraces = 0, openBrackets = 0;
                        let inStr3 = false, esc3 = false;
                        for (const ch of cleanCode) {
                            if (esc3) { esc3 = false; continue; }
                            if (ch === '\\') { esc3 = true; continue; }
                            if (ch === '"') { inStr3 = !inStr3; continue; }
                            if (inStr3) continue;
                            if (ch === '{') openBraces++;
                            if (ch === '}') openBraces--;
                            if (ch === '[') openBrackets++;
                            if (ch === ']') openBrackets--;
                        }

                        // Add missing closers
                        let suffix = '';
                        for (let i = 0; i < openBrackets; i++) suffix += ']';
                        for (let i = 0; i < openBraces; i++) suffix += '}';
                        cleanCode += suffix;

                        console.log("[JSON-FIX] Truncation repair — added closers:", suffix, "(len:", cleanCode.length, ")");

                        try {
                            responseData = JSON.parse(cleanCode);
                            console.log("[JSON-FIX] ✅ Truncation repair succeeded!");
                        } catch (thirdErr) {
                            // === NUCLEAR: extract what we can ===
                            console.error("[JSON-FIX] All repairs failed. Extracting partial content...");
                            console.error("[JSON-ERROR] Context around position", thirdErr.message);

                            // Try to find and parse just the layers array
                            const layersMatch = cleanCode.match(/"layers"\s*:\s*\[/);
                            if (layersMatch) {
                                const start = layersMatch.index;
                                // Find the outermost structure
                                const wrapper = cleanCode.substring(0, start) + '"layers": []}';
                                try {
                                    responseData = JSON.parse(wrapper);
                                    responseData.layers = []; // Empty but valid
                                    console.warn("[JSON-FIX] ⚠️ Recovered structure with empty layers");
                                } catch (e) {
                                    throw new Error('La IA no devolvió un JSON válido. Error: ' + thirdErr.message + '. Intenta de nuevo.');
                                }
                            } else {
                                throw new Error('La IA no devolvió un JSON válido. Error: ' + thirdErr.message + '. Intenta de nuevo.');
                            }
                        }
                    }
                }

                // Handle new Object structure { seo, slides/pages } vs legacy Array
                slidesData = [];

                if (isCanvasMode) {
                    // Canvas mode: AI returns { seo, pages: [ sceneGraph, ... ] }
                    if (responseData.pages && Array.isArray(responseData.pages)) {
                        slidesData = responseData.pages;
                    } else if (Array.isArray(responseData)) {
                        slidesData = responseData;
                    } else {
                        throw new Error("La respuesta Canvas no contiene un array de 'pages'.");
                    }
                    seoData = responseData.seo || {};
                } else if (Array.isArray(responseData)) {
                    slidesData = responseData;
                } else if (responseData.slides && Array.isArray(responseData.slides)) {
                    slidesData = responseData.slides;
                    seoData = responseData.seo || {};
                } else {
                    throw new Error("La respuesta no es válida (Falta array de slides).");
                }

            } catch (jsonErr) {
                let contextStr = "Snippet not available";
                if (cleanCode && typeof cleanCode === 'string') {
                    // Try to extract position from error message, e.g. "at position 14394"
                    const match = jsonErr.message.match(/position\s+(\d+)/);
                    if (match && match[1]) {
                        const pos = parseInt(match[1]);
                        const start = Math.max(0, pos - 100);
                        const end = Math.min(cleanCode.length, pos + 100);
                        contextStr = `...${cleanCode.substring(start, pos)}[ERROR HERE]${cleanCode.substring(pos, end)}...`;
                        console.error(`[JSON-ERROR] Context around position ${pos}:\n${contextStr}`);
                    } else {
                        console.error("[JSON-ERROR] Raw output:", cleanCode.substring(0, 500) + "...\n(Total length: " + cleanCode.length + ")");
                    }
                }

                throw new Error(`La IA no devolvió un JSON válido. Error: ${jsonErr.message}. Intenta de nuevo.`);
            }

            // Update SEO UI (outside try so it always runs after successful parse)
            console.log("📝 SEO Data:", JSON.stringify(seoData));
            const studio = this.viewManager.views['studio'];
            if (studio && studio.updateSEO) {
                studio.updateSEO(seoData);
            }

            // 5. Render Slides
            this.slides = []; // Store generated slides { id, content, html }

            if (isCanvasMode) {
                // ─── CANVAS MODE: Store scene graphs for CanvasEditor ───
                this.setStatus('🎨 Preparando Motor Canvas...', true);

                // Create shared renderer
                if (!this.canvasRenderer) {
                    this.canvasRenderer = window.createRenderer(1080, 1920, 'cyber');
                }

                for (let i = 0; i < slidesData.length; i++) {
                    const sceneGraph = slidesData[i];
                    this.setStatus(`🎨 Procesando página ${i + 1}/${slidesData.length}...`, true);

                    try {
                        // Apply branding theme tokens
                        const themed = this.canvasRenderer.brandingSystem.applyTheme(sceneGraph, sceneGraph.theme || 'cyber');

                        this.slides.push({
                            templateId: `canvas-page-${i + 1}`,
                            data: themed,
                            html: '',  // Will be rendered live via CanvasEditor
                            isCanvas: true
                        });
                    } catch (renderErr) {
                        console.error(`[Canvas] Error processing page ${i + 1}:`, renderErr);
                        this.slides.push({
                            templateId: `canvas-error-${i + 1}`,
                            data: sceneGraph,
                            html: '',
                            isCanvas: true,
                            error: renderErr.message
                        });
                    }
                }
            } else {
                // ─── TEMPLATE MODE: Render via TemplateEngine (original flow) ───
                this.setStatus('🖼️ Renderizando slides...', true);

                for (const slideData of slidesData) {
                    const templateId = slideData.templateId;
                    const content = slideData.content || {};

                    // Inject Global Theme Meta if missing
                    if (!content.THEME) {
                        content.THEME = slideData.THEME || 'CYBER';
                    }

                    // Render HTML
                    const html = this.templateEngine.renderTemplate(templateId, content);

                    this.slides.push({
                        templateId,
                        data: content,
                        html: html
                    });
                }
            }

            this.setProgress(100);
            this.setStatus('✅ Generación completada', false);

            // 6. Preview First Slide
            this.currentSlideIndex = 0;
            this.updateStudioState();

        } catch (e) {
            console.error(e);
            this.setStatus(`❌ Error: ${e.message}`, false);
            alert("Error: " + e.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            setTimeout(() => this.setProgress(0), 4000);
        }
    }

    updateStudioState() {
        if (!this.slides || this.slides.length === 0) return;

        const currentSlide = this.slides[this.currentSlideIndex];
        const studio = this.viewManager.views['studio'];

        if (studio) {
            if (currentSlide.isCanvas) {
                // ─── CANVAS MODE: Use CanvasEditor ───
                this._showCanvasEditor(currentSlide);
            } else {
                // ─── TEMPLATE MODE: Use iframe preview ───
                this._hideCanvasEditor();
                studio.updatePreview(currentSlide.html);
            }

            // Update Counter
            studio.updateSlideCounter(this.currentSlideIndex + 1, this.slides.length);

            // Update Editor Text (Script)
            if (studio.editorInstance) {
                studio.editorInstance.setValue(JSON.stringify(currentSlide.data, null, 2));
            }

            // Update Inspector
            if (studio.updateInspector) {
                studio.updateInspector(currentSlide.data);
            }
        }
    }

    /**
     * Show the CanvasEditor for a canvas slide.
     */
    async _showCanvasEditor(slide) {
        try {
            const studio = this.viewManager.views['studio'];
            if (!studio) return;

            // Get or create the editor container
            let editorContainer = document.getElementById('canvasEditorContainer');
            const previewFrame = document.getElementById('previewFrame');
            const previewContainer = document.getElementById('previewContainer');

            if (!editorContainer) {
                editorContainer = document.createElement('div');
                editorContainer.id = 'canvasEditorContainer';
                if (previewContainer) {
                    previewContainer.appendChild(editorContainer);
                } else if (previewFrame && previewFrame.parentNode) {
                    previewFrame.parentNode.appendChild(editorContainer);
                }
            }

            // Show editor, hide iframe — match container dimensions
            if (previewFrame) previewFrame.style.display = 'none';
            editorContainer.style.display = 'flex';

            // Ensure container has dimensions (match previewContainer)
            if (previewContainer) {
                const rect = previewContainer.getBoundingClientRect();
                editorContainer.style.width = rect.width + 'px';
                editorContainer.style.height = rect.height + 'px';
            }

            // Create or reuse the canvas editor
            if (!this.canvasRenderer) {
                this.canvasRenderer = window.createRenderer(1080, 1920, 'cyber');
            }

            if (!this.canvasEditor) {
                this.canvasEditor = new CanvasEditor(editorContainer, this.canvasRenderer);
                this.canvasEditor.onChange = (sceneGraph) => {
                    const currentSlide = this.slides[this.currentSlideIndex];
                    if (currentSlide) {
                        currentSlide.data = sceneGraph;
                        if (studio.editorInstance) {
                            studio.editorInstance.setValue(JSON.stringify(sceneGraph, null, 2));
                        }
                    }
                };
            }

            // Load the scene graph into the editor
            console.log('[CanvasEditor] Loading scene graph...');
            await this.canvasEditor.load(slide.data);
            console.log('[CanvasEditor] Scene graph loaded OK');
        } catch (err) {
            console.error('[CanvasEditor] Error showing editor:', err);
        }
    }

    /**
     * Hide the CanvasEditor and show the iframe.
     */
    _hideCanvasEditor() {
        const editorContainer = document.getElementById('canvasEditorContainer');
        const previewFrame = document.getElementById('previewFrame');
        if (editorContainer) editorContainer.style.display = 'none';
        if (previewFrame) previewFrame.style.display = '';
    }

    handlePrevSlide() {
        if (!this.slides || this.slides.length === 0) return;
        if (this.currentSlideIndex > 0) {
            this.currentSlideIndex--;
            this.updateStudioState();
        }
    }

    handleNextSlide() {
        if (!this.slides || this.slides.length === 0) return;
        if (this.currentSlideIndex < this.slides.length - 1) {
            this.currentSlideIndex++;
            this.updateStudioState();
        }
    }

    handleDataChange(newData) {
        if (!this.slides || !this.slides[this.currentSlideIndex]) return;
        const currentSlide = this.slides[this.currentSlideIndex];

        // Skip re-render for Canvas slides (they are pre-rendered images)
        if (currentSlide.isCanvas) return;

        // Update state
        currentSlide.data = newData;

        // Re-render HTML
        const html = this.templateEngine.renderTemplate(currentSlide.templateId, newData);
        currentSlide.html = html;

        // Update UI
        this.updateStudioState();
    }

    async handleAIRefine(instruction) {
        if (!this.slides || !this.slides[this.currentSlideIndex]) return;
        const currentSlide = this.slides[this.currentSlideIndex];

        console.log(`✨ AI Refine: "${instruction}" on slide ${this.currentSlideIndex}`);
        this.setStatus('✨ AI Refinando diseño...', true);

        try {
            // 1. Generate Prompt
            const prompt = this.contentEngine.refineContent(currentSlide.data, instruction, currentSlide.templateId);

            // 2. Call AI
            // Use same provider/key as generation? Or ask user settings?
            // For now, let's grab the first available key or default to current provider in UI if possible.
            // We'll try to get key from settings for default provider 'gemini' first.
            let provider = 'gemini';
            let apiKey = await window.cyberCanvas.getEnvKey(provider);

            if (!apiKey) {
                // Try openai
                provider = 'openai';
                apiKey = await window.cyberCanvas.getEnvKey(provider);
            }

            if (!apiKey) {
                alert("No AI API Key found. Please configure Settings.");
                this.setStatus('⚠️ Falta API Key', false);
                return;
            }

            const result = await window.cyberCanvas.callAI({
                provider: provider,
                apiKey: apiKey,
                prompt: prompt
            });

            if (!result.success) throw new Error(result.error);

            // 3. Parse Result (Robust)
            let cleanCode = result.code;
            const jsonMatch = cleanCode.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                cleanCode = jsonMatch[1];
            } else {
                // Fallback: Try to find the first { and last } (assuming object for refine)
                // Refine usually returns an object, not array.
                const firstBracket = cleanCode.indexOf('{');
                const lastBracket = cleanCode.lastIndexOf('}');
                if (firstBracket !== -1 && lastBracket !== -1) {
                    cleanCode = cleanCode.substring(firstBracket, lastBracket + 1);
                }
            }

            const updatedData = JSON.parse(cleanCode);

            // 4. Update Slide
            this.handleDataChange(updatedData);
            this.setStatus('✅ Diseño actualizado', false);

        } catch (err) {
            console.error("AI Refine Error:", err);
            this.setStatus('❌ Error en refinamiento', false);
            alert("Error al refinar: " + err.message);
        }
    }

    handleThemeChange(newTheme) {
        if (!this.slides || this.slides.length === 0) return;

        // Support custom hex color — create dynamic theme on the fly
        if (newTheme && newTheme.startsWith('#') && newTheme.length >= 7) {
            const customTheme = {
                name: 'Custom',
                colors: {
                    primary: newTheme,
                    accent: newTheme,
                    warning: '#FFD700',
                    success: '#00FF88',
                    danger: '#FF3366',
                    bg: '#030303',
                    cardBg: '#0a0a0c',
                    text: '#f0f0f0',
                    textMuted: '#94a3b8'
                },
                fonts: { title: 'BlackOpsOne', body: 'MPLUS Code Latin', mono: 'JetBrains Mono' },
                background: { fill: '#030303', pattern: null, opacity: 1.0 },
                brand: { name: 'KR-CLIDN', logo: './assets/kr-clidn-logo.png', badge: 'CUSTOM' }
            };
            if (this.canvasRenderer && this.canvasRenderer.brandingSystem) {
                this.canvasRenderer.brandingSystem.registerTheme('custom', customTheme);
            }
            newTheme = 'custom';
        }

        console.log('🎨 Theme Switch (Global): ' + newTheme + ' → Applying to ' + this.slides.length + ' slides');

        for (const slide of this.slides) {
            if (slide.isCanvas) {
                // Apply theme to Canvas slides — set theme name and re-apply tokens
                slide.data.theme = newTheme;
                if (this.canvasRenderer && this.canvasRenderer.brandingSystem) {
                    slide.data = this.canvasRenderer.brandingSystem.applyTheme(slide.data, newTheme);
                }
            } else {
                slide.data.THEME = newTheme;
                slide.html = this.templateEngine.renderTemplate(slide.templateId, slide.data);
            }
        }

        // Re-render canvas editor with new theme in real-time
        if (this.canvasEditor && this.canvasRenderer) {
            const currentSlide = this.slides[this.currentSlideIndex];
            if (currentSlide && currentSlide.isCanvas) {
                this.canvasRenderer.brandingSystem.setTheme(newTheme);
                this.canvasEditor.load(currentSlide.data);
            }
        }
        this.updateStudioState();
        this.setStatus('Tema aplicado globalmente: ' + newTheme);
    }

    handlePreviewAction(action) {
        if (!this.slides || !this.slides[this.currentSlideIndex]) return;
        const currentSlide = this.slides[this.currentSlideIndex];

        if (action.type === 'SELECT') {
            console.log("Selected element:", action.id);
        }

        if (action.type === 'UPDATE_POS') {
            // { type, id, x, y }
            if (!currentSlide.data._overrides) currentSlide.data._overrides = {};
            if (!currentSlide.data._overrides[action.id]) currentSlide.data._overrides[action.id] = {};

            currentSlide.data._overrides[action.id].x = action.x;
            currentSlide.data._overrides[action.id].y = action.y;

            console.log("Updated Position:", currentSlide.data._overrides);

            // Re-render HTML so named editable overrides persist when switching slides
            // (renderEditable reads _overrides and applies transform inline)
            if (action.id && !action.id.startsWith('auto_') && !currentSlide.isCanvas) {
                currentSlide.html = this.templateEngine.renderTemplate(currentSlide.templateId, currentSlide.data);
            }
            // auto_ drag positions are handled at export time via getExportHTML
        }
    }

    /**
     * Get export-ready HTML for a slide:
     * - Bakes auto-drag position overrides as inline styles
     * - Strips interactivity styles/scripts (hover outlines, drag cursor)
     */
    getExportHTML(slide) {
        // Canvas slides: re-render with modified scene graph and export as PNG
        if (slide.isCanvas && this.canvasRenderer) {
            // The slide.data contains the modified scene graph
            // Export will be handled by the export system using canvasRenderer
            return slide.html || '';
        }

        let html = slide.html || '';
        const overrides = slide.data._overrides || {};

        // Inject position overrides for auto-drag elements
        const autoDragStyles = Object.entries(overrides)
            .filter(([id]) => id.startsWith('auto_'))
            .map(([id, pos]) => `[data-drag-id="${id}"] { transform: translate(${pos.x}px, ${pos.y}px) !important; }`)
            .join('\n');

        if (autoDragStyles) {
            const styleBlock = `<style>/* Export Position Overrides */\n${autoDragStyles}\n</style>`;
            if (html.includes('</head>')) {
                html = html.replace('</head>', `${styleBlock}</head>`);
            } else {
                html = styleBlock + html;
            }
        }

        // Strip interactivity styles (drag outlines, cursors)
        html = html.replace(/<style>[\s\S]*?\.drag-ready[\s\S]*?<\/style>/g, '');

        // Strip interactivity script
        html = html.replace(/<script>[\s\S]*?initDragTargets[\s\S]*?<\/script>/g, '');

        return html;
    }
}

// Global Error Handler (suppress benign ResizeObserver errors)
window.addEventListener('error', (event) => {
    // ResizeObserver loop errors are benign browser noise — never show alert
    if (event.message && event.message.includes('ResizeObserver')) {
        event.preventDefault();
        return;
    }
    console.error("Global Error:", event.error);
    alert(`Error Crítico en App:\n${event.message}\n\nRevisa la consola (Ctrl+Shift+I)`);
});

window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason || '');
    if (reason.includes('ResizeObserver')) return;
    console.error("Unhandled Rejection:", event.reason);
    alert(`Promesa rechazada sin manejo:\n${event.reason}`);
});

try {
    // Start
    console.log("🚀 Booting App...");
    window.app = new App();
} catch (err) {
    console.error("App Init Failed:", err);
    alert(`Fallo al iniciar App:\n${err.message}`);
}
