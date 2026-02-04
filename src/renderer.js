
// ═══════════════════════════════════════════════════════════════════════════
// CYBER-CANVAS AI STUDIO - Renderer
// ═══════════════════════════════════════════════════════════════════════════

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
let selectedTemplateId = null;

// Sample HTML code (empty - user pastes their own)
const SAMPLE_HTML = ``;

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initEditor();
    initEventListeners();
    initTemplates();
    updatePreviewSize();
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

    // Preview button
    document.getElementById('previewBtn').addEventListener('click', updatePreview);

    // Adapt AI button
    document.getElementById('adaptBtn').addEventListener('click', adaptWithAI);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportContent);

    // Generate with AI button
    document.getElementById('generateBtn').addEventListener('click', generateWithAI);
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
    let contentWidth = 540;  // Default
    let contentHeight = 960;

    const maxWidthMatch = code.match(/max-width:\s*(\d+)px/);
    const maxHeightMatch = code.match(/max-height:\s*(\d+)px/);

    if (maxWidthMatch) contentWidth = parseInt(maxWidthMatch[1]);
    if (maxHeightMatch) contentHeight = parseInt(maxHeightMatch[1]);

    // Calculate zoom factor to fit content in display area
    const zoomFactor = Math.min(displayWidth / contentWidth, displayHeight / contentHeight);

    // Styles with zoom to scale content to fit
    const previewStyles = `
<style id="preview-styles">
    html {
        zoom: ${zoomFactor} !important;
        -moz-transform: scale(${zoomFactor}) !important;
        -moz-transform-origin: 0 0 !important;
    }
    html, body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: #000 !important;
    }
    body {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        min-height: 100vh !important;
    }
    .poster-container,
    body > div:first-child {
        width: ${contentWidth}px !important;
        height: ${contentHeight}px !important;
        max-width: ${contentWidth}px !important;
        max-height: ${contentHeight}px !important;
    }
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

async function adaptWithAI() {
    if (isProcessing) return;

    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showStatus('Ingresa tu API Key de Groq', 'error');
        return;
    }

    const code = editor.getValue().trim();
    const instruction = document.getElementById('aiInstruction').value.trim();
    const aspectKey = document.getElementById('aspectRatio').value;
    const { width, height } = ASPECT_RATIOS[aspectKey];

    const prompt = `Adapt this HTML/CSS code for a ${width}x${height} pixel viewport.

User instructions: ${instruction}

CRITICAL RULES:
1. Main container MUST use: width: 100vw; height: 100vh;
2. Use responsive units (vw, vh, %) instead of fixed pixels
3. Ensure all elements are visible and properly scaled
4. Keep all animations working
5. Return ONLY raw HTML code

CODE TO ADAPT:
${code}`;

    setProcessing(true);
    showProgress(20, 'Enviando a AI...');

    try {
        const result = await window.cyberCanvas.callAI({ apiKey, prompt });

        showProgress(80, 'Procesando respuesta...');

        if (result.success) {
            editor.setValue(result.code);
            updatePreview();
            showStatus('✓ Código adaptado con AI', 'success');
        } else {
            showStatus(`Error AI: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        setProcessing(false);
        hideProgress();
    }
}

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

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

async function initTemplates() {
    templateEngine = new TemplateEngine();
    await templateEngine.loadTemplates();
    renderTemplatesGallery();

    // Select first template by default
    const templates = templateEngine.getTemplates();
    if (templates.length > 0) {
        selectTemplate(templates[0].id);
    }
}

function renderTemplatesGallery() {
    const gallery = document.getElementById('templatesGallery');
    const templates = templateEngine.getTemplates();

    gallery.innerHTML = templates.map(t => `
        <div class="template-card ${selectedTemplateId === t.id ? 'selected' : ''}" 
             data-id="${t.id}" 
             onclick="selectTemplate('${t.id}')">
            <div class="icon">${t.icon}</div>
            <div class="name">${t.name}</div>
        </div>
    `).join('');
}

function selectTemplate(templateId) {
    selectedTemplateId = templateId;
    templateEngine.selectTemplate(templateId);

    // Update UI
    document.querySelectorAll('.template-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id === templateId);
    });

    showStatus(`Template: ${templateEngine.currentTemplate?.name}`, 'success');
}

async function generateWithAI() {
    const theme = document.getElementById('themeInput').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();

    if (!selectedTemplateId) {
        showStatus('Selecciona un template primero', 'error');
        return;
    }

    if (!theme) {
        showStatus('Escribe un tema para generar contenido', 'error');
        return;
    }

    if (!apiKey) {
        showStatus('Ingresa tu API Key de Groq', 'error');
        return;
    }

    try {
        isProcessing = true;
        document.getElementById('generateBtn').disabled = true;
        showProgress(10, 'Generando contenido con IA...');

        // Build prompt
        const prompt = templateEngine.buildPrompt(theme, selectedTemplateId);

        showProgress(30, 'Conectando con Groq...');

        // Call Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un diseñador de contenido visual profesional. Respondes SOLO en JSON válido, sin explicaciones adicionales.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        showProgress(70, 'Procesando respuesta...');

        // Parse JSON from AI response
        let content;
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                content = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (e) {
            throw new Error('Error parsing AI response: ' + e.message);
        }

        showProgress(90, 'Renderizando template...');

        // Render template with content
        const html = templateEngine.renderTemplate(selectedTemplateId, content);

        // Set editor content
        editor.setValue(html);

        showProgress(100, '¡Completado!');
        hideProgress();
        showStatus('✨ Contenido generado exitosamente', 'success');

        // Update preview
        setTimeout(updatePreview, 100);

    } catch (error) {
        console.error('Generation error:', error);
        showStatus(`Error: ${error.message}`, 'error');
        hideProgress();
    } finally {
        isProcessing = false;
        document.getElementById('generateBtn').disabled = false;
    }
}
