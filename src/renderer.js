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

// Sample HTML code (empty - user pastes their own)
const SAMPLE_HTML = ``;

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initEditor();
    initEventListeners();
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

    // Get aspect ratio
    const select = document.getElementById('aspectRatio');
    const ratio = ASPECT_RATIOS[select.value];

    // Get iframe display size
    const container = document.querySelector('.preview-container');
    const containerRect = container.getBoundingClientRect();
    const availWidth = containerRect.width - 40;
    const availHeight = containerRect.height - 40;
    const aspectRatio = ratio.width / ratio.height;

    let iframeWidth, iframeHeight;
    if (availWidth / availHeight > aspectRatio) {
        iframeHeight = availHeight;
        iframeWidth = iframeHeight * aspectRatio;
    } else {
        iframeWidth = availWidth;
        iframeHeight = iframeWidth / aspectRatio;
    }

    // Set iframe size
    frame.style.width = `${Math.floor(iframeWidth)}px`;
    frame.style.height = `${Math.floor(iframeHeight)}px`;

    // Calculate scale to fit original content into iframe
    const scale = iframeWidth / ratio.width;

    // Wrap content with scaling transform
    const wrappedHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        html {
            margin: 0;
            padding: 0;
            width: ${ratio.width}px;
            height: ${ratio.height}px;
            overflow: hidden;
            background: #000000;
            transform: scale(${scale});
            transform-origin: top left;
        }
        body {
            margin: 0;
            padding: 0;
            width: ${ratio.width}px;
            height: ${ratio.height}px;
            overflow: hidden;
            background: #000000;
        }
    </style>
</head>
<body>
${code}
</body>
</html>`;

    // Write to iframe
    const doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(wrappedHTML);
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
