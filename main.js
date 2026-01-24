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

// IPC: Exportar imagen
ipcMain.handle('export-image', async (event, { html, width, height, format }) => {
    const puppeteer = require('puppeteer');

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        await page.setContent(html, { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Crear directorio de salida
        const outputDir = path.join(require('os').homedir(), 'Pictures', 'CyberCanvas');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `cybercanvas_${width}x${height}_${timestamp}.${format.toLowerCase()}`;
        const outputPath = path.join(outputDir, filename);

        await page.screenshot({
            path: outputPath,
            type: format.toLowerCase() === 'jpg' ? 'jpeg' : format.toLowerCase(),
            quality: format.toLowerCase() === 'png' ? undefined : 95
        });

        await browser.close();

        return { success: true, path: outputPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// IPC: Exportar video (PROFESIONAL)
ipcMain.handle('export-video', async (event, { html, width, height, duration }) => {
    const puppeteer = require('puppeteer');
    const { execSync } = require('child_process');

    try {
        const tempDir = path.join(require('os').tmpdir(), `cybercanvas_${Date.now()}`);
        fs.mkdirSync(tempDir, { recursive: true });

        // Preparar HTML con fondo negro garantizado
        const professionalHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
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
    ${html.includes('<body') ? html.replace(/<body[^>]*>/i, '<body>') : html}
</body>
</html>`;

        const browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu-vsync',
                '--disable-frame-rate-limit'
            ]
        });

        const page = await browser.newPage();

        // Viewport exacto
        await page.setViewport({
            width,
            height,
            deviceScaleFactor: 1
        });

        // Background negro
        await page.evaluateOnNewDocument(() => {
            document.documentElement.style.background = '#000000';
            document.body.style.background = '#000000';
        });

        await page.setContent(professionalHTML, { waitUntil: 'networkidle0' });

        // Esperar fuentes e imágenes
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Capturar frames en alta calidad (60fps)
        const fps = 60;
        const totalFrames = duration * fps;
        const frameInterval = 1000 / fps; // ms por frame

        for (let i = 0; i < totalFrames; i++) {
            const framePath = path.join(tempDir, `frame_${String(i).padStart(6, '0')}.png`);

            await page.screenshot({
                path: framePath,
                type: 'png',
                omitBackground: false // Incluir fondo negro
            });

            // Esperar frame exacto
            await new Promise(resolve => setTimeout(resolve, frameInterval));
        }

        await browser.close();

        // Crear video con FFmpeg (CALIDAD PROFESIONAL)
        const outputDir = path.join(require('os').homedir(), 'Videos', 'CyberCanvas');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const outputPath = path.join(outputDir, `cybercanvas_${width}x${height}_${timestamp}.mp4`);

        // FFmpeg con máxima calidad
        const ffmpegCmd = [
            'ffmpeg',
            '-y',
            `-framerate ${fps}`,
            `-i "${tempDir}/frame_%06d.png"`,
            '-c:v libx264',
            '-preset slow',          // Mejor compresión
            '-crf 15',               // Calidad casi sin pérdida (0-51, menor=mejor)
            '-pix_fmt yuv420p',
            '-profile:v high',       // Perfil alto
            '-level:v 4.2',
            `-b:v 20M`,              // Bitrate 20 Mbps
            `-maxrate 25M`,
            `-bufsize 30M`,
            '-tune animation',       // Optimizado para animaciones
            '-movflags +faststart',  // Streaming
            `"${outputPath}"`
        ].join(' ');

        execSync(ffmpegCmd, { stdio: 'ignore' });

        // Limpiar temp
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
