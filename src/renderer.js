// ═══════════════════════════════════════════════════════════════════════════
// CYBER-CANVAS AI STUDIO - Renderer
// ═══════════════════════════════════════════════════════════════════════════

console.log("renderer.js CARGADO CORRECTAMENTE");

// Aspect ratios configuration
const ASPECT_RATIOS = {
    '1920x1080': { width: 1920, height: 1080, label: '16:9 Desktop' },
    '1080x1920': { width: 1080, height: 1920, label: '9:16 Story/Reels' },
    '1080x1080': { width: 1080, height: 1080, label: '1:1 Square' },
    '1080x1350': { width: 1080, height: 1350, label: '4:5 Portrait' }
};

// State
let editor;
let isProcessing = false;
let templateEngine = null;
let carouselEngine = null; // New
let selectedPackId = null; // Renamed from selectedTemplateId
let generatedSlides = []; // New: Stores the array of generated slides content
let currentSlideIndex = 0; // New: Tracks current view

// Sample HTML code (empty - user pastes their own)
const SAMPLE_HTML = ``;

// ... (previous init code remains similar, but calls initCarousel)

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES & PACKS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

async function initTemplates() {
    console.log("Iniciando carga de packs y templates...");
    templateEngine = new TemplateEngine();

    // Cargar packs desde el sistema de archivos (nueva estructura plana)
    const packsMeta = await templateEngine.loadFromPacks();

    // Inicializar Carousel Engine con los packs descubiertos
    carouselEngine = new CarouselEngine(templateEngine);
    carouselEngine.setPacks(packsMeta);

    // Renderizar Galería de Packs
    renderPacksGallery();

    // Seleccionar el primer pack por defecto
    const packs = carouselEngine.getPacks();
    if (packs.length > 0) {
        selectPack(packs[0].id);
    } else {
        showStatus('No se encontraron Packs en src/packs/', 'warning');
    }
}

function renderPacksGallery() {
    const gallery = document.getElementById('templatesGallery');
    const packs = carouselEngine.getPacks();

    if (packs.length === 0) {
        gallery.innerHTML = '<div class="no-templates">No Packs found</div>';
        return;
    }

    gallery.innerHTML = packs.map(p => `
        <div class="template-card ${selectedPackId === p.id ? 'selected' : ''}" 
             data-id="${p.id}" 
             onclick="selectPack('${p.id}')">
            <div class="icon"><i class="material-icons">${p.icon || 'layers'}</i></div>
            <div class="info">
                <div class="name">${p.name}</div>
                <div class="desc">${p.description || 'Pack de plantillas'}</div>
                <div class="count-badge">${p.templateIds.length} Slides</div>
            </div>
        </div>
    `).join('');
}

function selectPack(packId) {
    selectedPackId = packId;

    // Update UI
    document.querySelectorAll('.template-card').forEach(card => {
        if (card.dataset.id === packId) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    const pack = carouselEngine.getPackById(packId);
    if (pack) {
        showStatus(`Pack seleccionado: ${pack.name}`, 'success');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERACIÓN DE CARRUSEL CON IA
// ═══════════════════════════════════════════════════════════════════════════

async function generateWithAI() {
    console.log("Iniciando generateWithAI...");
    const theme = document.getElementById('themeInput').value.trim();
    const provider = document.getElementById('aiProvider').value;
    const apiKey = document.getElementById('apiKey').value.trim();

    console.log(`Estado: Pack=${selectedPackId}, Tema=${theme ? 'OK' : 'Empty'}, Provider=${provider}, APIKey=${apiKey ? 'OK' : 'Missing'}`);

    if (!selectedPackId) {
        showStatus('Selecciona un Pack primero', 'error');
        return;
    }

    if (!theme) {
        showStatus('Escribe un tema para generar contenido', 'error');
        return;
    }

    if (!apiKey) {
        showStatus(`Ingresa tu API Key de ${provider.toUpperCase()}`, 'error');
        return;
    }

    // Validación básica de formato de Key
    if (provider === 'gemini' && apiKey.startsWith('gsk_')) {
        showStatus('Parece que estás usando una Key de GROQ en modo GEMINI. Cámbialo.', 'error');
        return;
    }
    if (provider === 'groq' && !apiKey.startsWith('gsk_')) {
        showStatus('La Key de GROQ suele empezar con "gsk_". Verifica tu llave.', 'warning');
        // No bloqueamos por si acaso, solo warning
    }

    try {
        isProcessing = true;
        const btn = document.getElementById('generateBtn');
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> DISEÑANDO CARRUSEL...';

        showProgress(5, '🧠 Analizando tema y eligiendo plantillas...');

        // 1. Construir prompt MAESTRO v2
        const prompt = carouselEngine.buildCarouselPrompt(theme, selectedPackId);
        console.log("Prompt Carrusel (tamaño):", prompt.length, "chars");

        showProgress(15, `📡 Enviando a ${provider.toUpperCase()} (esto toma ~15s)...`);

        // 2. Llamar a la IA
        // Sanitizar datos para evitar error "An object could not be cloned"
        const cleanOptions = JSON.parse(JSON.stringify({
            provider: String(provider),
            apiKey: String(apiKey),
            prompt: String(prompt)
        }));

        const result = await window.cyberCanvas.callAI(cleanOptions);

        if (!result.success) throw new Error(result.error);

        showProgress(50, '📋 Procesando respuesta de la IA...');
        const aiResponse = result.code;
        console.log("Respuesta IA (tamaño):", aiResponse.length, "chars");

        // 3. Parsear JSON Array (con limpieza robusta)
        let slidesData;
        try {
            // Limpiar posible markdown wrapper
            let cleanResponse = aiResponse
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/gi, '')
                .trim();

            // Buscar el array JSON
            const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                slidesData = JSON.parse(jsonMatch[0]);
            } else {
                // Fallback: tal vez la IA envolvió en un objeto
                const objMatch = cleanResponse.match(/\{[\s\S]*\}/);
                if (objMatch) {
                    const parsed = JSON.parse(objMatch[0]);
                    if (parsed.slides) slidesData = parsed.slides;
                    else throw new Error('No se encontró array de slides');
                } else {
                    throw new Error('No se encontró JSON válido en la respuesta');
                }
            }
        } catch (e) {
            console.warn("⚠️ Parse falló, intentando reparar JSON...", e.message);
            try {
                let raw = aiResponse
                    .replace(/```json\s*/gi, '')
                    .replace(/```\s*/gi, '')
                    .trim();

                const arrStart = raw.indexOf('[');
                if (arrStart === -1) throw new Error('No array found');
                let src = raw.substring(arrStart);

                // ── Sanitizar: escapar caracteres problemáticos dentro de strings ──
                let out = '';
                let inStr = false;
                let esc = false;
                for (let i = 0; i < src.length; i++) {
                    const ch = src[i];
                    if (esc) { out += ch; esc = false; continue; }
                    if (ch === '\\' && inStr) { out += ch; esc = true; continue; }

                    if (ch === '"') {
                        // Detectar si esta comilla cierra el string o es una comilla interna sin escapar
                        if (inStr) {
                            // Mirar qué viene después (ignorando whitespace)
                            let j = i + 1;
                            while (j < src.length && (src[j] === ' ' || src[j] === '\t')) j++;
                            const next = src[j] || '';
                            // Si después viene : , } ] o " es un cierre válido de string
                            if (next === ':' || next === ',' || next === '}' || next === ']' || next === '"' || next === '\n' || next === '\r') {
                                inStr = false;
                                out += '"';
                            } else {
                                // Comilla interna sin escapar — escaparla
                                out += '\\"';
                            }
                        } else {
                            inStr = true;
                            out += '"';
                        }
                        continue;
                    }

                    if (inStr) {
                        // Escapar caracteres de control dentro de strings
                        if (ch === '\n') { out += '\\n'; continue; }
                        if (ch === '\r') { out += '\\r'; continue; }
                        if (ch === '\t') { out += '\\t'; continue; }
                        const code = ch.charCodeAt(0);
                        if (code < 32) { out += '\\u' + code.toString(16).padStart(4, '0'); continue; }
                    }
                    out += ch;
                }

                // Si terminó dentro de un string, cerrarlo
                if (inStr) out += '"';

                // Quitar trailing commas
                out = out.replace(/,\s*([}\]])/g, '$1');

                // Quitar propiedades incompletas al final
                out = out.replace(/,\s*"[^"]*"\s*:\s*$/m, '');
                out = out.replace(/,\s*$/m, '');

                // Cerrar brackets/braces faltantes
                let braces = 0, brackets = 0;
                inStr = false; esc = false;
                for (let i = 0; i < out.length; i++) {
                    const ch = out[i];
                    if (esc) { esc = false; continue; }
                    if (ch === '\\') { esc = true; continue; }
                    if (ch === '"') { inStr = !inStr; continue; }
                    if (inStr) continue;
                    if (ch === '{') braces++;
                    else if (ch === '}') braces--;
                    else if (ch === '[') brackets++;
                    else if (ch === ']') brackets--;
                }
                while (braces > 0) { out += '}'; braces--; }
                while (brackets > 0) { out += ']'; brackets--; }
                out = out.replace(/,\s*([}\]])/g, '$1');

                slidesData = JSON.parse(out);
                console.log(`✅ JSON reparado exitosamente — ${slidesData.length} slides recuperados`);
            } catch (repairError) {
                console.error("Error parseando JSON:", e.message);
                console.error("Error reparando JSON:", repairError.message);
                console.log("Respuesta Raw (primeros 1000 chars):", aiResponse.substring(0, 1000));
                const preview = aiResponse.length > 100 ? aiResponse.substring(0, 100) + '...' : aiResponse;
                throw new Error(`La IA no devolvió JSON válido. Respuesta recibida: "${preview}". Error: ${e.message}`);
            }
        }

        if (!Array.isArray(slidesData) || slidesData.length === 0) {
            throw new Error('El carrusel generado está vacío.');
        }

        // STORE DATA GLOBALLY FOR EDITOR
        window.currentSlidesData = slidesData;
        console.log("Global Slides Data stored:", window.currentSlidesData.length, "items");

        console.log(`✅ ${slidesData.length} slides parseados correctamente`);

        // 4. Validar y renderizar cada slide
        generatedSlides = [];
        const totalSlides = slidesData.length;

        for (let i = 0; i < totalSlides; i++) {
            const item = slidesData[i];
            const pct = 50 + Math.round((i / totalSlides) * 45);
            showProgress(pct, `🎨 Renderizando slide ${i + 1} de ${totalSlides}...`);

            // Validar que el templateId existe
            const template = templateEngine.getTemplateById(item.templateId);
            if (!template) {
                console.warn(`⚠ Template ${item.templateId} no encontrado, saltando slide ${i + 1}`);
                continue;
            }

            try {
                const html = templateEngine.renderTemplate(item.templateId, item.content);
                if (html && html.trim()) {
                    generatedSlides.push(html);
                }
            } catch (renderErr) {
                console.error(`Error renderizando slide ${i + 1} (${item.templateId}):`, renderErr);
            }
        }

        if (generatedSlides.length === 0) {
            throw new Error('No se pudo renderizar ningún slide.');
        }

        // 5. Mostrar el primer slide
        currentSlideIndex = 0;
        updateSlideView();
        setupNavigationControls();

        showProgress(100, '¡Carrusel Completo!');
        showStatus(`✨ ${generatedSlides.length} Slides profesionales generados`, 'success');

        // ═══ AUTO-GENERAR SEO VIRAL ═══
        // Generar automáticamente metadata para TikTok usando la misma API key
        if (typeof window.autoGenerateSEO === 'function') {
            console.log('🚀 Auto-generando SEO viral...');
            // Ejecutar en background sin bloquear la UI
            setTimeout(() => {
                window.autoGenerateSEO(theme, apiKey);
            }, 500);
        }


    } catch (error) {
        console.error('Generation error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        isProcessing = false;
        const btn = document.getElementById('generateBtn');
        btn.disabled = false;
        btn.innerHTML = '<span>🤖</span> GENERAR CON IA';
        hideProgress();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVEGACIÓN DE SLIDES
// ═══════════════════════════════════════════════════════════════════════════

function updateSlideView() {
    if (generatedSlides.length === 0) return;

    // Cargar en el editor el HTML del slide actual
    const html = generatedSlides[currentSlideIndex];
    editor.setValue(html);

    // Actualizar previsualización
    setTimeout(updatePreview, 100);
    updateNavUI();

    // UPDATE DATA EDITOR
    if (window.currentSlidesData && window.currentSlidesData[currentSlideIndex]) {
        // Ensure DataEditor is initialized
        if (!dataEditor && typeof DataEditor !== 'undefined') {
            dataEditor = new DataEditor('dataEditorPanel', (newData) => {
                if (generatedSlides.length > 0 && window.currentSlidesData) {
                    window.currentSlidesData[currentSlideIndex].content = newData;
                    const item = window.currentSlidesData[currentSlideIndex];
                    const newHtml = templateEngine.renderTemplate(item.templateId, newData);
                    editor.setValue(newHtml);
                    generatedSlides[currentSlideIndex] = newHtml;
                }
            });
        }

        if (dataEditor) {
            dataEditor.renderFields(window.currentSlidesData[currentSlideIndex].content);
        }
    }

    // INJECT CLICK LISTENER FOR SYNC
    const iframe = document.getElementById('previewFrame');
    if (iframe && iframe.contentWindow) {
        // Wait for load to ensure body exists
        iframe.onload = () => {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            const script = doc.createElement('script');
            script.textContent = `
                document.body.addEventListener('click', (e) => {
                    e.preventDefault();
                    let text = e.target.innerText;
                    if (text && text.length > 0) {
                        window.parent.postMessage({ type: 'preview-click', text: text }, '*');
                    }
                }, true);
            `;
            doc.body.appendChild(script);

            // ANIMATIONS REMOVED PER USER REQUEST
        };
        // Also try immediately if already loaded
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (doc && doc.body) {
                const script = doc.createElement('script');
                script.textContent = `
                    document.body.addEventListener('click', (e) => {
                        e.preventDefault();
                        let text = e.target.innerText;
                        if (text && text.length > 0) {
                            window.parent.postMessage({ type: 'preview-click', text: text }, '*');
                        }
                    });
                 `;
                doc.body.appendChild(script);

                // ANIMATIONS REMOVED PER USER REQUEST
            }
        } catch (e) { }
    }
}

// Global Message Listener for Sync
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'preview-click' && dataEditor) {
        console.log("Preview Clicked:", event.data.text);
        // Clean text (remove newlines, extra spaces)
        const clean = event.data.text.replace(/\\s+/g, ' ').trim();
        dataEditor.focusFieldByValue(clean);
    }
});

function updateNavUI() {
    // Buscar o crear controles de navegación en el panel de preview
    let navContainer = document.getElementById('slideNav');

    if (!navContainer) {
        const previewHeader = document.querySelector('.preview-panel .panel-header');
        navContainer = document.createElement('div');
        navContainer.id = 'slideNav';
        navContainer.className = 'slide-nav';
        // Insertar antes del badge de tamaño
        previewHeader.insertBefore(navContainer, document.getElementById('previewSize'));
    }

    if (generatedSlides.length > 0) {
        navContainer.innerHTML = `
            <button id="prevSlide" class="nav-btn" ${currentSlideIndex === 0 ? 'disabled' : ''}>❮</button>
            <span class="nav-counter">${currentSlideIndex + 1} / ${generatedSlides.length}</span>
            <button id="nextSlide" class="nav-btn" ${currentSlideIndex === generatedSlides.length - 1 ? 'disabled' : ''}>❯</button>
        `;

        // Re-attach listeners (simple way)
        document.getElementById('prevSlide').onclick = prevSlide;
        document.getElementById('nextSlide').onclick = nextSlide;
        navContainer.style.display = 'flex';
    } else {
        navContainer.style.display = 'none';
    }
}

function setupNavigationControls() {
    // Solo para asegurar que existen, updateNavUI hace el resto
    updateNavUI();
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        // Guardar cambios manuales
        if (generatedSlides.length > 0) {
            generatedSlides[currentSlideIndex] = editor.getValue();
        }
        currentSlideIndex--;
        updateSlideView();
    }
}

function nextSlide() {
    if (currentSlideIndex < generatedSlides.length - 1) {
        // Guardar cambios manuales
        if (generatedSlides.length > 0) {
            generatedSlides[currentSlideIndex] = editor.getValue();
        }
        currentSlideIndex++;
        updateSlideView();
    }
}


// Import DataEditor (assuming ES6 modules are supported, or just include it if it's a script)
// Since we are in Electron/Browser context, we might need to load it via script tag or just assume it's global if loaded in HTML.
// ensuring DataEditor is available. For now, let's assume it's loaded.

let dataEditor = null; // New

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log("DOM Cargado. Iniciando módulos...");
        initEditor();
        console.log("Editor OK");

        initEventListeners();
        console.log("Listeners OK");

        await initTemplates();
        console.log("Templates OK");

        updatePreviewSize();
        console.log("Preview OK");

        // Init Data Editor
        // We need to import it properly. If we can't use import here easily without build step, 
        // I will assume the class is available globally or render it here.
        // Actually, looking at index.html (I haven't seen it yet), I should probably check imports.
        // But to be safe, I'll instantiate if the class exists.
        if (typeof DataEditor !== 'undefined') {
            dataEditor = new DataEditor('dataEditorPanel', (newData) => {
                // On Change Callback
                if (generatedSlides.length > 0) {
                    // 1. Update internal data
                    // We need to store robust data, currently generatedSlides is just HTML strings.
                    // We need to upgrade generatedSlides to be Objects { templateId, content: {} } OR
                    // Keep generatedSlides as HTML but ALSO store a separate `slidesData` array.

                    // Let's implement `slidesData` global state management.
                    if (window.currentSlidesData) {
                        window.currentSlidesData[currentSlideIndex].content = newData;

                        // 2. Re-render current slide
                        const item = window.currentSlidesData[currentSlideIndex];
                        const newHtml = templateEngine.renderTemplate(item.templateId, newData);

                        // 3. Update Editor & Preview
                        editor.setValue(newHtml);
                        generatedSlides[currentSlideIndex] = newHtml; // Update HTML cache
                    }
                }
            });
            console.log("Data Editor Initialized");
        } else {
            console.warn("DataEditor class not found. Make sure to include it in index.html");
        }

    } catch (err) {
        console.error("FATAL ERROR IN INITIALIZATION:", err);
        alert("Error crítico iniciando la app: " + err.message);
    }
});

function initEditor() {
    const textarea = document.getElementById('editor');

    editor = CodeMirror.fromTextArea(textarea, {
        mode: 'htmlmixed',
        theme: 'material-darker',
        lineNumbers: true,
        lineWrapping: false,
        autoCloseTags: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false
    });

    editor.setValue(SAMPLE_HTML);

    // Auto-update preview on change (debounced)
    let timeout;
    editor.on('change', () => {
        clearTimeout(timeout);
        timeout = setTimeout(updatePreview, 500);
    });

    // Initial preview
    setTimeout(updatePreview, 100);
}

function initEventListeners() {
    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
        editor.setValue('');
        hidePlaceholder(false);
    });

    // Aspect ratio change
    document.getElementById('aspectRatio').addEventListener('change', () => {
        updatePreviewSize();
        updatePreview();
    });

    // Format change
    document.getElementById('format').addEventListener('change', updateExportButton);

    // Preview button and Adapt AI removed per user request

    // Export buttons
    document.getElementById('exportSingleBtn').addEventListener('click', exportSingleContent);
    document.getElementById('exportBatchBtn').addEventListener('click', exportBatchContent);

    // Generate with AI button
    const genBtn = document.getElementById('generateBtn');
    if (genBtn) {
        console.log("Botón AI encontrado y listener asignado");
        genBtn.addEventListener('click', () => {
            console.log("Click en Botón Generar detectado");
            generateWithAI();
        });
    } else {
        console.error("Botón AI NO encontrado en el DOM");
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// PREVIEW
// ═══════════════════════════════════════════════════════════════════════════

function updatePreviewSize() {
    const select = document.getElementById('aspectRatio');
    const ratio = ASPECT_RATIOS[select.value];
    document.getElementById('previewSize').textContent = `${ratio.width} × ${ratio.height}`;

    // Update iframe dimensions
    const frame = document.getElementById('previewFrame');
    const container = document.querySelector('.preview-container');

    if (frame && container) {
        scalePreviewFrame(frame, container, ratio.width, ratio.height);
    }
}

function scalePreviewFrame(frame, container, targetWidth, targetHeight) {
    // Get container size
    const containerRect = container.getBoundingClientRect();
    const availWidth = containerRect.width - 40; // padding
    const availHeight = containerRect.height - 40;

    // Calculate aspect ratio and dimensions to fit
    const aspectRatio = targetWidth / targetHeight;
    let width, height;

    if (availWidth / availHeight > aspectRatio) {
        height = availHeight;
        width = height * aspectRatio;
    } else {
        width = availWidth;
        height = width / aspectRatio;
    }
    const scale = 0.9; // Not used anymore

    // Set iframe to actual dimensions
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;

    // Scale using transform
    frame.style.transform = `none`;
    frame.style.transformOrigin = 'center center';
}

function updatePreview() {
    const code = editor.getValue().trim();
    const frame = document.getElementById('previewFrame');
    const placeholder = document.getElementById('previewPlaceholder');

    if (!code) {
        hidePlaceholder(false);
        return;
    }

    hidePlaceholder(true);

    // Get selected aspect ratio from dropdown
    const select = document.getElementById('aspectRatio');
    const ratio = ASPECT_RATIOS[select.value];
    const targetWidth = ratio.width;
    const targetHeight = ratio.height;

    // Get container available space
    const container = document.querySelector('.preview-container');
    const containerRect = container.getBoundingClientRect();
    const availWidth = containerRect.width - 40;
    const availHeight = containerRect.height - 40;

    // Calculate display size maintaining aspect ratio
    const aspectRatio = targetWidth / targetHeight;
    let displayWidth, displayHeight;

    if (availWidth / availHeight > aspectRatio) {
        displayHeight = availHeight;
        displayWidth = displayHeight * aspectRatio;
    } else {
        displayWidth = availWidth;
        displayHeight = displayWidth / aspectRatio;
    }

    // Set iframe to display size
    frame.style.width = `${Math.floor(displayWidth)}px`;
    frame.style.height = `${Math.floor(displayHeight)}px`;
    frame.style.position = '';
    frame.style.left = '';
    frame.style.top = '';
    frame.style.transform = '';
    frame.style.transformOrigin = '';

    // Detect original content size from code
    let contentWidth = targetWidth; // Default to selected aspect ratio width (e.g. 1080)
    let contentHeight = targetHeight; // Default to selected aspect ratio height (e.g. 1920)

    // Try to detect explicit dimensions in CSS
    const widthMatch = code.match(/(?:max-width|width):\s*(\d+)px/);
    const heightMatch = code.match(/(?:max-height|height):\s*(\d+)px/);

    if (widthMatch) contentWidth = parseInt(widthMatch[1]);
    if (heightMatch) contentHeight = parseInt(heightMatch[1]);

    // Fallback logic specific for mobile templates if detected width is small
    // Some templates might use max-width: 100% which isn't useful for scaling calc
    if (contentWidth < 100) contentWidth = targetWidth;

    // Calculate zoom factor to fit content in display area
    const zoomFactor = Math.min(displayWidth / contentWidth, displayHeight / contentHeight);

    // Styles with zoom to scale content to fit
    const previewStyles = `
<style id="preview-styles">
    html {
        width: 100% !important;
        height: 100% !important;
        zoom: ${zoomFactor} !important;
        -moz-transform: scale(${zoomFactor}) !important;
        -moz-transform-origin: 0 0 !important;
        overflow: hidden !important;
    }
    body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${contentWidth}px !important;
        height: ${contentHeight}px !important;
        overflow: hidden !important;
        background: #000 !important;
        transform-origin: top left;
        /* Ensure user content doesn't break out */
        max-width: ${contentWidth}px !important;
        max-height: ${contentHeight}px !important;
    }
    /* Hide scrollbars */
    ::-webkit-scrollbar { display: none !important; }
</style>`;

    const iconifyScript = '<script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>';

    let finalCode = code;
    // Remove conflicting Material Icons link if present to avoid dual-loading (optional, but cleaner)
    // finalCode = finalCode.replace(/<link[^>]*Material\+Icons[^>]*>/g, '');

    let finalHTML;
    if (code.includes('<!DOCTYPE') || code.includes('<html')) {
        if (code.includes('</body>')) {
            finalHTML = code.replace('</body>', previewStyles + iconifyScript + '</body>');
        } else {
            finalHTML = code + previewStyles + iconifyScript;
        }
    } else {
        finalHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8">${iconifyScript}</head><body>${code}${previewStyles}</body></html>`;
    }

    // SANITIZE: Prevent script execution in preview (e.g. alert(1) from slide content)
    // We replace <script> tags with a safe variant or comment them out in the PREVIEW only.
    // The editor still keeps the original code.
    finalHTML = finalHTML.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "<!-- SCRIPT BLOCKED IN PREVIEW -->");

    // Also block inline handlers if dangerous (optional, but good for <img on...> etc)
    // finalHTML = finalHTML.replace(/on\w+="[^"]*"/g, 'data-blocked-handler');

    // Write to iframe
    const doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(finalHTML);
    doc.close();
}

function hidePlaceholder(hide) {
    const placeholder = document.getElementById('previewPlaceholder');
    const frame = document.getElementById('previewFrame');

    if (hide) {
        placeholder.classList.add('hidden');
        frame.style.display = 'block';
    } else {
        placeholder.classList.remove('hidden');
        frame.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

function updateExportButton() {
    const format = document.getElementById('format').value;
    const singleBtn = document.getElementById('exportSingleBtn');
    const batchBtn = document.getElementById('exportBatchBtn');

    if (format === 'MP4') {
        singleBtn.innerHTML = '<span>🎬</span> VIDEO';
        batchBtn.disabled = true;
        batchBtn.title = "Exportación en lote no disponible para video";
    } else {
        singleBtn.innerHTML = '<span>🖼️</span> ACTUAL';
        batchBtn.disabled = false;
        batchBtn.title = "Exportar todos los slides como imágenes";
        batchBtn.innerHTML = '<span>📦</span> TODO';
    }
}

async function exportSingleContent() {
    if (isProcessing) return;

    const code = editor.getValue().trim();
    if (!code) {
        showStatus('Editor vacío', 'error');
        return;
    }

    const format = document.getElementById('format').value;
    const aspectKey = document.getElementById('aspectRatio').value;
    const { width, height } = ASPECT_RATIOS[aspectKey];

    // ANIMATIONS REMOVED PER USER REQUEST

    setProcessing(true);

    try {
        let result;
        if (format === 'MP4') {
            const duration = 5;
            showProgress(0, `Generando video HD (${duration}s) frame-by-frame...`);

            result = await window.cyberCanvas.exportVideo({
                html: code,
                width,
                height,
                duration
            });
        } else {
            showProgress(0, 'Exportando imagen de alta calidad...');
            result = await window.cyberCanvas.exportImage({
                html: code, // Images don't needed animations? Or maybe yes if we snap at end?
                // Actually images should look "finished".
                // Animations start at 0 opacity.
                // So for IMAGES, we should NOT inject animations, or inject a CSS that sets opacity: 1 immediately.
                // Current logic: code (raw) is passed to exportImage.
                // Raw code has NO animation classes. So it renders static. Correct.
                width,
                height,
                format
            });
        }

        if (result.success) {
            showStatus(`Exportado: ${result.path}`, 'success');
        } else {
            showStatus(`Error: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        setProcessing(false);
        hideProgress();
    }
}

async function exportBatchContent() {
    if (isProcessing) return;

    // Guardar cambios del slide actual antes de exportar
    if (generatedSlides.length > 0) {
        generatedSlides[currentSlideIndex] = editor.getValue();
    }

    if (!generatedSlides || generatedSlides.length === 0) {
        showStatus('No hay slides generados para exportar en lote.', 'warning');
        return;
    }

    const format = document.getElementById('format').value;
    if (format === 'MP4') {
        showStatus('La exportación por lote de video no está soportada.', 'warning');
        return;
    }

    const aspectKey = document.getElementById('aspectRatio').value;
    const { width, height } = ASPECT_RATIOS[aspectKey];

    setProcessing(true);
    showProgress(0, `Iniciando exportación de ${generatedSlides.length} slides...`);

    // Obtener título del post para nombrar la carpeta
    const themeInput = document.getElementById('themeInput');
    const postTitle = (themeInput && themeInput.value.trim()) || 'Post_Sin_Titulo';

    try {
        const result = await window.cyberCanvas.exportBatch({
            slides: generatedSlides,
            width,
            height,
            format,
            title: postTitle
        });

        if (result.success) {
            showStatus(`✅ Lote exportado: ${result.count} imágenes en ${result.path}`, 'success');
        } else {
            showStatus(`Error en lote: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus(`Error crítico: ${error.message}`, 'error');
    } finally {
        setProcessing(false);
        hideProgress();
    }
}

function detectAnimationDuration(html) {
    const patterns = [
        /animation-duration\s*:\s*(\d+(?:\.\d+)?)\s*(s|ms)/gi,
        /animation\s*:[^;]*?(\d+(?:\.\d+)?)\s*(s|ms)/gi
    ];

    let maxDuration = 0;

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            let dur = parseFloat(match[1]);
            if (match[2].toLowerCase() === 'ms') dur /= 1000;
            if (dur <= 15 && dur > maxDuration) maxDuration = dur;
        }
    }

    return Math.max(5, Math.min(Math.ceil(maxDuration) + 2, 15));
}

// ═══════════════════════════════════════════════════════════════════════════
// AI INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

// AI Adaptation removed as per user request

// ═══════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function setProcessing(processing) {
    isProcessing = processing;

    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.disabled = processing;
    });
}

function showProgress(percent, text) {
    const container = document.getElementById('progressContainer');
    const fill = document.getElementById('progressFill');
    const label = document.getElementById('progressText');

    container.classList.remove('hidden');
    fill.style.width = `${percent}%`;
    label.textContent = text;
}

function hideProgress() {
    setTimeout(() => {
        document.getElementById('progressContainer').classList.add('hidden');
    }, 1000);
}

function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;

    setTimeout(() => {
        status.className = 'status';
    }, 5000);
}

// End of file
