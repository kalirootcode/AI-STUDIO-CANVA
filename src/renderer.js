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
            console.error("Error parseando JSON:", e);
            console.log("Respuesta Raw:", aiResponse.substring(0, 500));
            // Mostrar los primeros 100 caracteres de la respuesta en el error para debug
            const preview = aiResponse.length > 100 ? aiResponse.substring(0, 100) + '...' : aiResponse;
            throw new Error(`La IA no devolvió JSON válido. Respuesta recibida: "${preview}". Error: ${e.message}`);
        }

        if (!Array.isArray(slidesData) || slidesData.length === 0) {
            throw new Error('El carrusel generado está vacío.');
        }

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
}

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
        // Guardar cambios manuales del slide actual antes de cambiar? (Opcional, por ahora no para simplificar)
        // generatedSlides[currentSlideIndex] = editor.getValue(); 
        currentSlideIndex--;
        updateSlideView();
    }
}

function nextSlide() {
    if (currentSlideIndex < generatedSlides.length - 1) {
        // generatedSlides[currentSlideIndex] = editor.getValue();
        currentSlideIndex++;
        updateSlideView();
    }
}

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

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportContent);

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

    let finalHTML;
    if (code.includes('<!DOCTYPE') || code.includes('<html')) {
        if (code.includes('</body>')) {
            finalHTML = code.replace('</body>', previewStyles + '</body>');
        } else {
            finalHTML = code + previewStyles;
        }
    } else {
        finalHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${code}${previewStyles}</body></html>`;
    }

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
    const btn = document.getElementById('exportBtn');

    if (format === 'MP4') {
        btn.innerHTML = '<span>🎬</span> EXPORTAR VIDEO';
    } else {
        btn.innerHTML = '<span>📸</span> EXPORTAR';
    }
}

async function exportContent() {
    if (isProcessing) return;

    const code = editor.getValue().trim();
    if (!code) {
        showStatus('Editor vacío', 'error');
        return;
    }

    const format = document.getElementById('format').value;
    const aspectKey = document.getElementById('aspectRatio').value;
    const { width, height } = ASPECT_RATIOS[aspectKey];

    setProcessing(true);

    try {
        let result;

        if (format === 'MP4') {
            showProgress(0, 'Preparando video...');

            // Detect animation duration
            const duration = detectAnimationDuration(code);

            showProgress(10, `Grabando ${duration}s...`);

            result = await window.cyberCanvas.exportVideo({
                html: code,
                width,
                height,
                duration
            });

            showProgress(100, '¡Video listo!');
        } else {
            showProgress(0, 'Renderizando...');

            result = await window.cyberCanvas.exportImage({
                html: code,
                width,
                height,
                format
            });

            showProgress(100, '¡Imagen lista!');
        }

        if (result.success) {
            showStatus(`✓ Guardado: ${result.path.split('/').pop()}`, 'success');
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
