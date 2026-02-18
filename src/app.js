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
            const systemPrompt = this.contentEngine.generatePrompt(topic, count, mode);
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
            try {
                // Remove potential markdown fences if backend didn't clean them
                let cleanCode = result.code;
                if (cleanCode.startsWith('```json')) cleanCode = cleanCode.slice(7);
                if (cleanCode.startsWith('```')) cleanCode = cleanCode.slice(3);
                if (cleanCode.endsWith('```')) cleanCode = cleanCode.slice(0, -3);

                slidesData = JSON.parse(cleanCode);

                if (!Array.isArray(slidesData)) throw new Error("La respuesta no es un array.");
            } catch (jsonErr) {
                console.error("JSON Parse Error:", result.code);
                throw new Error("La IA no devolvió un JSON válido. Intenta de nuevo.");
            }

            // 5. Render Slides
            this.setStatus('🖼️ Renderizando slides...', true);
            this.slides = []; // Store generated slides { id, content, html }

            for (const slideData of slidesData) {
                const templateId = slideData.templateId;
                const content = slideData.content || {};

                // Inject Global Theme Meta if missing
                if (!content.THEME) {
                    // Map mode to theme using ContentEngine's logic if possible, or default
                    // We can just rely on what ContentEngine inserted into the prompt, 
                    // but if AI missed it, we default to CYBER.
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
        const studio = this.viewManager.views['studio']; // Access view instance

        if (studio) {
            // Update Preview
            studio.updatePreview(currentSlide.html);

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

            // 3. Parse Result
            let cleanCode = result.code;
            if (cleanCode.startsWith('```json')) cleanCode = cleanCode.slice(7);
            if (cleanCode.startsWith('```')) cleanCode = cleanCode.slice(3);
            if (cleanCode.endsWith('```')) cleanCode = cleanCode.slice(0, -3);

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

        console.log(`🎨 Theme Switch (Global): ${newTheme} → Applying to ${this.slides.length} slides`);

        // Apply theme to ALL slides
        for (const slide of this.slides) {
            slide.data.THEME = newTheme;
            slide.html = this.templateEngine.renderTemplate(slide.templateId, slide.data);
        }

        // Update UI (shows current slide with new theme)
        this.updateStudioState();
        this.setStatus(`Tema aplicado globalmente: ${newTheme}`);
    }

    handlePreviewAction(action) {
        if (!this.slides || !this.slides[this.currentSlideIndex]) return;
        const currentSlide = this.slides[this.currentSlideIndex];

        if (action.type === 'SELECT') {
            console.log("Selected element:", action.id);
            // Optionally scroll inspector to field?
            // For now just log.
        }

        if (action.type === 'UPDATE_POS') {
            // { type, id, x, y }
            if (!currentSlide.data._overrides) currentSlide.data._overrides = {};

            if (!currentSlide.data._overrides[action.id]) currentSlide.data._overrides[action.id] = {};

            currentSlide.data._overrides[action.id].x = action.x;
            currentSlide.data._overrides[action.id].y = action.y;

            console.log("Updated Position:", currentSlide.data._overrides);
            // We don't need to re-render ENTIRE template just for this if the preview handles it visually.
            // BUT, if we change slides and come back, we need it saved.
            // Also, if we export, we need the renderer to respect _overrides.

            // The visual update in preview is already done by the drag script.
            // We just save state here.
        }
    }
}

// Global Error Handler
window.addEventListener('error', (event) => {
    console.error("Global Error:", event.error);
    alert(`Error Crítico en App:\n${event.message}\n\nRevisa la consola (Ctrl+Shift+I)`);
});

window.addEventListener('unhandledrejection', (event) => {
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
