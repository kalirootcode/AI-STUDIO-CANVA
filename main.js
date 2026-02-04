const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1500,
        height: 950,
        minWidth: 1200,
        minHeight: 700,
        backgroundColor: '#000000',
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#000000',
            symbolColor: '#00D4FF'
        },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('src/index.html');

    // Quitar menú en producción
    Menu.setApplicationMenu(null);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC: Exportar imagen (ALTA CALIDAD + SVG)
ipcMain.handle('export-image', async (event, { html, width, height, format }) => {
    const puppeteer = require('puppeteer');

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
        });

        const page = await browser.newPage();

        // Usar deviceScaleFactor 2 para imágenes 2x más nítidas (retina)
        await page.setViewport({
            width,
            height,
            deviceScaleFactor: 2
        });

        // Detect content size from the HTML
        let contentWidth = 540;  // Default
        let contentHeight = 960;

        const maxWidthMatch = html.match(/max-width:\s*(\d+)px/);
        const maxHeightMatch = html.match(/max-height:\s*(\d+)px/);

        if (maxWidthMatch) contentWidth = parseInt(maxWidthMatch[1]);
        if (maxHeightMatch) contentHeight = parseInt(maxHeightMatch[1]);

        // Calculate scale to fill the target viewport
        const scaleFactor = Math.min(width / contentWidth, height / contentHeight);

        // Extract just the body content from user's HTML
        let bodyContent = html;
        if (html.includes('<body')) {
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            if (bodyMatch) bodyContent = bodyMatch[1];
        }

        // Create export HTML with proper scaling
        const scaledHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
            background: #000000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .export-container {
            transform: scale(${scaleFactor});
            transform-origin: center center;
            width: ${contentWidth}px;
            height: ${contentHeight}px;
            position: relative;
        }
        .poster-container,
        .export-container > div:first-child {
            width: ${contentWidth}px !important;
            height: ${contentHeight}px !important;
            max-width: none !important;
            max-height: none !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
        }
    </style>
    ${html.includes('<style') ? html.match(/<style[^>]*>[\s\S]*?<\/style>/gi)?.join('') || '' : ''}
</head>
<body>
    <div class="export-container">
        ${bodyContent}
    </div>
</body>
</html>`;

        await page.setContent(scaledHTML, { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mostrar diálogo para elegir nombre y ubicación
        const ext = format.toLowerCase();
        const defaultName = `cybercanvas_${width}x${height}`;

        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Guardar imagen',
            defaultPath: path.join(require('os').homedir(), 'Pictures', 'CyberCanvas', `${defaultName}.${ext}`),
            filters: [
                { name: format.toUpperCase(), extensions: [ext] }
            ]
        });

        if (canceled || !filePath) {
            await browser.close();
            return { success: false, error: 'Exportación cancelada' };
        }

        const outputPath = filePath;

        if (ext === 'svg') {
            // Exportar SVG extrayendo el HTML como SVG usando foreignObject
            const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
        <html xmlns="http://www.w3.org/1999/xhtml">
            ${html}
        </html>
    </foreignObject>
</svg>`;
            fs.writeFileSync(outputPath, svgContent);
        } else {
            // Screenshot de alta calidad
            await page.screenshot({
                path: outputPath,
                type: ext === 'jpg' ? 'jpeg' : ext,
                quality: ext === 'png' ? undefined : 100,
                omitBackground: false
            });
        }

        await browser.close();

        return { success: true, path: outputPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// IPC: Exportar video (FRAME-BY-FRAME HD)
ipcMain.handle('export-video', async (event, { html, width, height, duration }) => {
    const { chromium } = require('playwright');
    const { execSync } = require('child_process');

    try {
        const tempDir = path.join(require('os').tmpdir(), `cybercanvas_${Date.now()}`);
        const framesDir = path.join(tempDir, 'frames');
        fs.mkdirSync(framesDir, { recursive: true });

        // HTML optimizado
        const professionalHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
            background-color: #000000 !important;
        }
        * {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
        }
    </style>
</head>
<body>
${html}
</body>
</html>`;

        const htmlPath = path.join(tempDir, 'content.html');
        fs.writeFileSync(htmlPath, professionalHTML);

        // Lanzar navegador SIN grabación de video nativa
        const browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-gpu'
            ]
        });

        const context = await browser.newContext({
            viewport: { width, height }
        });

        const page = await context.newPage();
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

        // Esperar carga completa
        await page.waitForTimeout(2000);

        // Capturar frames (30fps para calidad óptima)
        const fps = 30;
        const totalFrames = duration * fps;
        const frameInterval = 1000 / fps;

        for (let i = 0; i < totalFrames; i++) {
            const framePath = path.join(framesDir, `frame_${String(i).padStart(5, '0')}.png`);
            await page.screenshot({
                path: framePath,
                type: 'png'
            });
            await page.waitForTimeout(frameInterval);
        }

        await browser.close();

        // Crear video HD con FFmpeg
        const outputDir = path.join(require('os').homedir(), 'Videos', 'CyberCanvas');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const outputPath = path.join(outputDir, `cybercanvas_${width}x${height}_${timestamp}.mp4`);

        // FFmpeg: PNG frames → MP4 HD con colores vibrantes
        const ffmpegCmd = [
            'ffmpeg',
            '-y',
            `-framerate ${fps}`,
            `-i "${framesDir}/frame_%05d.png"`,
            // Filtro para mejorar color y nitidez
            '-vf "eq=saturation=1.1:contrast=1.05,unsharp=3:3:0.5"',
            '-c:v libx264',
            '-preset slow',
            '-crf 12',                    // Más calidad (menor = mejor)
            '-pix_fmt yuv420p',
            '-profile:v high',
            '-level:v 4.2',
            '-b:v 25M',                   // Bitrate alto
            '-maxrate 30M',
            '-bufsize 40M',
            '-colorspace bt709',          // Preservar colores
            '-color_primaries bt709',
            '-color_trc bt709',
            '-movflags +faststart',
            `"${outputPath}"`
        ].join(' ');

        execSync(ffmpegCmd, { stdio: 'ignore' });

        // Limpiar
        fs.rmSync(tempDir, { recursive: true, force: true });

        return { success: true, path: outputPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// IPC: Llamar a AI (Groq)
ipcMain.handle('call-ai', async (event, { apiKey, prompt }) => {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are an HTML/CSS expert. Return ONLY raw HTML code, no markdown.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 8000
            })
        });

        const data = await response.json();

        if (data.error) {
            return { success: false, error: data.error.message };
        }

        let code = data.choices[0].message.content.trim();

        // Limpiar markdown si existe
        if (code.startsWith('```html')) code = code.slice(7);
        else if (code.startsWith('```')) code = code.slice(3);
        if (code.endsWith('```')) code = code.slice(0, -3);

        return { success: true, code: code.trim() };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
