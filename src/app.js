import { ViewManager } from './services/ViewManager.js';
import { Sidebar } from './components/Sidebar.js';
import { StudioView } from './views/StudioView.js';
import { ThumbnailView } from './views/ThumbnailStudio.js';
import { SettingsView } from './views/SettingsView.js';
import { EbookView } from './views/EbookView.js';

class App {
    constructor() {
        this.overrideConsole();
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
        if (this._initialized) return;
        this._initialized = true;

        console.log("🚀 Initializing Cyber-Canvas v2...");
        // 1. Init View Manager
        this.viewManager = new ViewManager();

        // 2. Register Views
        this.viewManager.register('studio', new StudioView());
        this.viewManager.register('ebook', new EbookView());
        this.viewManager.register('thumbnails', new ThumbnailView());
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

            // Ignore manual HTML editor inputs now that we use visual CanvasEditor
            if (currentSlide.isCanvas) return;

        } catch (err) {
            console.warn("Invalid JSON in editor:", err);
            // Optional: Show error in UI?
        }
    }

    initEngines() {
        // Instantiate engines that were global in legacy renderer.js
        this.contentEngine = new ContentEngine(); // Assumes it's loaded via script tag
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

    // loadPackIntoStudio obsolete



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

            this.setStatus(`🎨 Diseñando estructura (${mode})...`, true);

            // Inject trend signal if available
            if (this.tiktokSignal) {
                console.log("💉 Injecting TikTok Signal into Prompt", this.tiktokSignal);
                this.setStatus(`🔥 Inyectando Trend: ${this.tiktokSignal.type}`, true);
            }

            // --- CHUNKING LOGIC ---
            const CHUNK_SIZE = 12; // Safest size to avoid token limit cutoffs
            const chunkCount = Math.ceil(count / CHUNK_SIZE);
            let mergedSlides = [];
            let mergedSeo = {};

            for (let i = 0; i < chunkCount; i++) {
                const slidesInChunk = (i === chunkCount - 1) ? (count % CHUNK_SIZE || CHUNK_SIZE) : CHUNK_SIZE;
                this.setStatus(`📡 Conectando con ${provider.toUpperCase()}... (Parte ${i + 1}/${chunkCount})`, true);

                const currentProgress = 5 + (i / chunkCount) * 60;
                this.setProgress(currentProgress);

                // Generate Canvas JSON
                const systemPrompt = this.contentEngine.generatePrompt(topic, slidesInChunk, mode, this.tiktokSignal, i, chunkCount);

                let progressInterval;
                if (slidesInChunk > 5) {
                    let p = currentProgress;
                    const maxP = currentProgress + (60 / chunkCount) * 0.9;
                    progressInterval = setInterval(() => {
                        p += 1;
                        if (p > maxP) p = maxP;
                        this.setProgress(p);
                        this.setStatus(`🧠 Generando parte ${i + 1} (${slidesInChunk} slides)... ${Math.round(p)}%`, true);
                    }, 1000);
                }

                const result = await window.cyberCanvas.callAI({
                    provider: provider,
                    apiKey: apiKey,
                    prompt: systemPrompt
                });

                if (progressInterval) clearInterval(progressInterval);

                if (!result.success) {
                    throw new Error(`Error en la parte ${i + 1}: ` + (result.error || "Error desconocido en la API."));
                }

                this.setStatus(`⚙️ Procesando parte ${i + 1}...`, true);

                // Parse JSON
                let slidesData;
                let seoData = {};
                let cleanCode = result.code || "";

                try {
                    // Step 1: Strip markdown code fences
                    const jsonMatch = cleanCode.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                    if (jsonMatch) cleanCode = jsonMatch[1];

                    // Step 2: Find the outermost JSON structure
                    const firstCurly = cleanCode.indexOf('{');
                    const firstBracket = cleanCode.indexOf('[');
                    if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
                        const lastCurly = cleanCode.lastIndexOf('}');
                        if (lastCurly !== -1) cleanCode = cleanCode.substring(firstCurly, lastCurly + 1);
                    } else if (firstBracket !== -1) {
                        const lastBracket = cleanCode.lastIndexOf(']');
                        if (lastBracket !== -1) cleanCode = cleanCode.substring(firstBracket, lastBracket + 1);
                    }

                    // Step 3: Fix common AI JSON mistakes
                    cleanCode = cleanCode.replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas
                    cleanCode = cleanCode.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

                    // Fix unescaped newlines safely
                    let fixedCode = '', inString = false, escapedChar = false;
                    for (let j = 0; j < cleanCode.length; j++) {
                        const ch = cleanCode[j];
                        if (escapedChar) { fixedCode += ch; escapedChar = false; }
                        else if (ch === '\\') {
                            const next = cleanCode[j + 1];
                            if (['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'].includes(next)) {
                                fixedCode += ch; escapedChar = true;
                            } else fixedCode += '\\\\';
                        }
                        else if (ch === '"') { inString = !inString; fixedCode += ch; }
                        else if (inString && (ch === '\n' || ch === '\r')) fixedCode += (ch === '\n') ? '\\n' : '\\r';
                        else if (inString && ch === '\t') fixedCode += '\\t';
                        else fixedCode += ch;
                    }
                    cleanCode = fixedCode;

                    let responseData;
                    try {
                        responseData = JSON.parse(cleanCode);
                    } catch (firstErr) {
                        // === AGGRESSIVE CLEANUP ===
                        console.warn(`[JSON-FIX PARTE ${i + 1}] First parse failed:`, firstErr.message, "Trying aggressive cleanup...");
                        cleanCode = cleanCode.replace(/\r?\n/g, ' ');
                        cleanCode = cleanCode.replace(/(?<=[\{,]\s*)'([^']+)'\s*:/g, '"$1":');
                        cleanCode = cleanCode.replace(/:\s*'([^']*)'/g, ': "$1"');
                        cleanCode = cleanCode.replace(/(?<=[\{,]\s*)([a-zA-Z_]\w*)\s*:/g, '"$1":');
                        cleanCode = cleanCode.replace(/(?<=:\s*")(.*?)(?="\s*(?:,|}|$))/gm, match => match.replace(/(?<!\\)"/g, '\\"'));
                        cleanCode = cleanCode.replace(/,\s*([\]}])/g, '$1');

                        let cleaned2 = '', inStr = false, esc = false;
                        for (let k = 0; k < cleanCode.length; k++) {
                            const ch = cleanCode[k];
                            if (esc) { cleaned2 += ch; esc = false; continue; }
                            if (ch === '\\') { cleaned2 += ch; esc = true; continue; }
                            if (ch === '"') { inStr = !inStr; cleaned2 += ch; continue; }
                            if (inStr && ch === '\t') { cleaned2 += '\\t'; continue; }
                            if (inStr && ch === '\b') { cleaned2 += '\\b'; continue; }
                            cleaned2 += ch;
                        }
                        cleanCode = cleaned2;
                        const lastValid = Math.max(cleanCode.lastIndexOf('}'), cleanCode.lastIndexOf(']'));
                        if (lastValid > 0) cleanCode = cleanCode.substring(0, lastValid + 1);

                        try { responseData = JSON.parse(cleanCode); }
                        catch (secondErr) {
                            // === LAST RESORT: Fix truncated JSON ===
                            let inString2 = false, escaped2 = false, lastQuotePos = -1;
                            for (let k = 0; k < cleanCode.length; k++) {
                                const c = cleanCode[k];
                                if (escaped2) { escaped2 = false; continue; }
                                if (c === '\\') { escaped2 = true; continue; }
                                if (c === '"') { inString2 = !inString2; lastQuotePos = k; }
                            }
                            if (inString2 && lastQuotePos > 0) {
                                let truncPoint = cleanCode.length - 1;
                                const lastSafe = Math.max(cleanCode.lastIndexOf('\\n'), cleanCode.lastIndexOf('. '), cleanCode.lastIndexOf(', '));
                                if (lastSafe > lastQuotePos) truncPoint = lastSafe;
                                cleanCode = cleanCode.substring(0, truncPoint) + '..."';
                            }
                            cleanCode = cleanCode.replace(/,\s*"[^"]*"?\s*$/, '');
                            cleanCode = cleanCode.replace(/,\s*\{[^}]*$/, '');
                            cleanCode = cleanCode.replace(/,\s*$/, '');

                            let openBraces = 0, openBrackets = 0;
                            let inStr3 = false, esc3 = false;
                            for (const ch of cleanCode) {
                                if (esc3) { esc3 = false; continue; }
                                if (ch === '\\') { esc3 = true; continue; }
                                if (ch === '"') { inStr3 = !inStr3; continue; }
                                if (inStr3) continue;
                                if (ch === '{') openBraces++; if (ch === '}') openBraces--;
                                if (ch === '[') openBrackets++; if (ch === ']') openBrackets--;
                            }
                            for (let k = 0; k < openBrackets; k++) cleanCode += ']';
                            for (let k = 0; k < openBraces; k++) cleanCode += '}';

                            try { responseData = JSON.parse(cleanCode); }
                            catch (thirdErr) {
                                const layersMatch = cleanCode.match(/"layers"\s*:\s*\[/);
                                if (layersMatch) {
                                    const wrapper = cleanCode.substring(0, layersMatch.index) + '"layers": []}';
                                    try {
                                        responseData = JSON.parse(wrapper); responseData.layers = [];
                                    } catch (e) { throw new Error('Parcial ' + (i + 1) + ': JSON inválido.'); }
                                } else throw new Error('Parcial ' + (i + 1) + ': JSON inválido.');
                            }
                        }
                    }

                    if (responseData.pages && Array.isArray(responseData.pages)) {
                        slidesData = responseData.pages;
                    } else if (Array.isArray(responseData)) {
                        slidesData = responseData;
                    } else if (responseData.slides && Array.isArray(responseData.slides)) {
                        slidesData = responseData.slides;
                    } else throw new Error(`La parte ${i + 1} no contiene array de pages.`);

                    // Merge Results
                    mergedSlides = mergedSlides.concat(slidesData);
                    if (responseData.seo) mergedSeo = Object.assign(mergedSeo, responseData.seo);

                } catch (jsonErr) {
                    console.error(`[JSON-ERROR PARTE ${i + 1}]`, jsonErr.message);
                    throw new Error(`Error en parseo JSON de parte ${i + 1}: ${jsonErr.message}. La IA sobrepasó los límites, intenta generar menos slides a la vez.`);
                }
            } // END CHUNK LOOP

            this.setProgress(70);

            // Update SEO UI
            console.log("📝 Merged SEO Data:", JSON.stringify(mergedSeo));
            const studio = this.viewManager.views['studio'];
            if (studio && studio.updateSEO) {
                studio.updateSEO(mergedSeo);
            }

            // 5. Render Canvas Slides
            this.slides = []; // Store generated slides { id, content, html }

            // ─── CANVAS MODE: Store scene graphs for CanvasEditor ───
            this.setStatus('🎨 Preparando Motor Canvas...', true);

            // Create shared renderer
            if (!this.canvasRenderer) {
                this.canvasRenderer = window.createRenderer(1080, 1920, 'cyber');
            }

            for (let i = 0; i < mergedSlides.length; i++) {
                const sceneGraph = mergedSlides[i];
                this.setStatus(`🎨 Procesando página ${i + 1}/${mergedSlides.length}...`, true);

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
            studio.updatePreview(); // Trigger native CanvasEditor render

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

    // Obsolete `_showCanvasEditor` and `_hideCanvasEditor` removed.

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

        // Canvas slides: Update the internal JSON and force a visual re-render
        currentSlide.data = newData;
        if (this.canvasEditor) {
            this.canvasEditor.load(newData);
        }

        // Update CodeMirror editor without re-triggering changes
        const studio = this.viewManager.views['studio'];
        if (studio && studio.editorInstance) {
            const currentVal = studio.editorInstance.getValue();
            const newVal = JSON.stringify(newData, null, 2);
            if (currentVal !== newVal) {
                studio.editorInstance.setValue(newVal);
            }
        }
    }

    async handleAIRefine(instruction) {
        if (!this.slides || !this.slides[this.currentSlideIndex]) return;
        const currentSlide = this.slides[this.currentSlideIndex];

        console.log(`✨ AI Refine: "${instruction}" on slide ${this.currentSlideIndex}`);
        this.setStatus('✨ AI Refinando diseño...', true);

        try {
            // 1. Extract Spatial Awareness (Bounding Boxes) from Renderer
            let boundsInfo = "Contexto Espacial no disponible.";
            if (this.canvasRenderer && this.canvasRenderer.lastBounds && this.canvasRenderer.lastBounds.length > 0) {
                const bounds = this.canvasRenderer.lastBounds.map(b => {
                    return `- Layer [${b.layerIndex}] (${b.type}): Y=${Math.round(b.y)}, Height=${Math.round(b.height)}, BottomY=${Math.round(b.y + b.height)}`;
                });
                boundsInfo = bounds.join('\\n');
            }
            console.log("[Spatial AI] Inyectando datos:\\n" + boundsInfo);

            // 2. Generate Advanced Refinement Prompt
            const prompt = this.contentEngine.generateLayoutRefinementPrompt(currentSlide.data, boundsInfo, instruction);

            // 3. Call AI
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
            if (action.id && !action.id.startsWith('auto_')) {
                // Legacy inline template update logic removed
            }
        }
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
