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

    // Quitar menú en producción pero habilitar recarga
    Menu.setApplicationMenu(null);

    // Habilitar recarga manual con Ctrl+R o F5 ya que quitamos el menú
    const { globalShortcut } = require('electron');
    globalShortcut.register('CommandOrControl+R', () => {
        if (mainWindow) mainWindow.reload();
    });
    globalShortcut.register('F5', () => {
        if (mainWindow) mainWindow.reload();
    });

    // DEBUG: DevTools deshabilitado para producción
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

// IPC: Log from Renderer to Terminal
ipcMain.on('log-message', (event, { level, message, args }) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[R-${level.toUpperCase()} ${timestamp}]`, message, ...args);
});

app.whenReady().then(() => {
    createWindow();
    startTikTokBridge();
});

// ─── TikTok Intelligence Bridge (WebSocket Server) ─────────────────────────

let tiktokBridgeWss = null;
const TIKTOK_BRIDGE_PORT = 7890;

function startTikTokBridge() {
    try {
        const { WebSocketServer } = require('ws');
        tiktokBridgeWss = new WebSocketServer({ port: TIKTOK_BRIDGE_PORT });

        tiktokBridgeWss.on('listening', () => {
            console.log(`[TikTok Bridge] ✅ WebSocket server running on ws://localhost:${TIKTOK_BRIDGE_PORT}`);
        });

        tiktokBridgeWss.on('connection', (ws) => {
            console.log('[TikTok Bridge] Chrome Extension connected ✅');

            // Notify renderer
            if (mainWindow) {
                mainWindow.webContents.send('tiktok-extension-status', { connected: true });
            }

            // Send welcome
            ws.send(JSON.stringify({ type: 'APP_READY', version: '1.0.0' }));

            ws.on('message', (rawData) => {
                try {
                    const msg = JSON.parse(rawData.toString());
                    console.log('[TikTok Bridge] Message received:', msg.type);
                    handleExtensionMessage(ws, msg);
                } catch (e) {
                    console.error('[TikTok Bridge] Bad message:', e.message);
                }
            });

            ws.on('close', () => {
                console.log('[TikTok Bridge] Extension disconnected');
                if (mainWindow) {
                    mainWindow.webContents.send('tiktok-extension-status', { connected: false });
                }
            });

            ws.on('error', (err) => {
                console.error('[TikTok Bridge] WS error:', err.message);
            });
        });

        tiktokBridgeWss.on('error', (err) => {
            console.error('[TikTok Bridge] Server error:', err.message);
        });

    } catch (e) {
        console.warn('[TikTok Bridge] Could not start WebSocket server (ws module missing?):', e.message);
    }
}

function handleExtensionMessage(ws, msg) {
    if (!mainWindow) return;

    switch (msg.type) {
        case 'EXTENSION_HELLO':
            console.log('[TikTok Bridge] Extension hello, version:', msg.version);
            break;

        case 'TREND_DATA':
            // Forward trend data to renderer (Studio will inject into AI prompt)
            mainWindow.webContents.send('tiktok-trend-data', msg);
            break;

        case 'VIRAL_VIDEO':
            // Forward viral video hook/data to renderer
            mainWindow.webContents.send('tiktok-viral-video', msg);
            break;

        case 'VIDEO_DATA':
            mainWindow.webContents.send('tiktok-video-data', msg);
            break;

        case 'PROFILE_DATA':
            mainWindow.webContents.send('tiktok-profile-data', msg);
            break;

        case 'GENERATE_REQUEST':
            // Extension requests content generation with trend signal
            mainWindow.webContents.send('tiktok-generate-request', msg);
            break;

        default:
            console.log('[TikTok Bridge] Unknown message type:', msg.type);
    }
}

// IPC: Renderer can send messages to extension via WS
ipcMain.handle('tiktok-bridge-send', (event, payload) => {
    if (!tiktokBridgeWss) return { ok: false, error: 'Bridge not running' };
    let sent = 0;
    tiktokBridgeWss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(JSON.stringify(payload));
            sent++;
        }
    });
    return { ok: true, sent };
});

// IPC: Get bridge status
ipcMain.handle('tiktok-bridge-status', () => {
    return {
        running: !!tiktokBridgeWss,
        port: TIKTOK_BRIDGE_PORT,
        clients: tiktokBridgeWss ? tiktokBridgeWss.clients.size : 0
    };
});



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

// ─── DOTENV Persistencia ───
require('dotenv').config();

ipcMain.handle('get-env-key', async (event, provider) => {
    const keyName = provider === 'gemini' ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';
    return process.env[keyName] || '';
});

ipcMain.handle('save-env-key', async (event, { provider, key }) => {
    const keyName = provider === 'gemini' ? 'GEMINI_API_KEY' : 'GROQ_API_KEY';
    const envPath = path.join(__dirname, '.env');

    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if key exists
    const regex = new RegExp(`^${keyName}=.*`, 'm');
    if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${keyName}=${key}`);
    } else {
        envContent += `\n${keyName}=${key}`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    // Update current process env
    process.env[keyName] = key;
    return true;
});

// ─── Helper: Preparar HTML para exportación (idéntico al previsualizador) ───
function prepareExportHTML(html, width, height) {
    // Inyectar estilos de reset directamente en el HTML del usuario
    const exportStyles = `
<style id="export-reset">
    html {
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
    }
    body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${width}px !important;
        height: ${height}px !important;
        overflow: hidden !important;
        max-width: ${width}px !important;
        max-height: ${height}px !important;
        overflow: hidden !important;
    }
    ::-webkit-scrollbar { display: none !important; }
</style>`;

    // ── LOGO REPLACEMENT: Convert relative paths to Base64 data URIs ──
    // This ensures logos render correctly in Puppeteer's isolated context
    let finalHTML = html;

    // IMPORTANT: Replace small logo FIRST (its name is a superset of the full logo name)
    const logoSmallPath = path.join(__dirname, 'assets', 'kr-clidn-logo-small.png');
    if (fs.existsSync(logoSmallPath) && finalHTML.includes('kr-clidn-logo-small.png')) {
        const logoSmallB64 = 'data:image/png;base64,' + fs.readFileSync(logoSmallPath).toString('base64');
        finalHTML = finalHTML.replace(/\.\.\/assets\/kr-clidn-logo-small\.png/g, logoSmallB64);
    }

    // Then replace full-size logo
    const logoPath = path.join(__dirname, 'assets', 'kr-clidn-logo.png');
    if (fs.existsSync(logoPath) && finalHTML.includes('kr-clidn-logo.png')) {
        const logoB64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
        finalHTML = finalHTML.replace(/\.\.\/assets\/kr-clidn-logo\.png/g, logoB64);
    }

    // --- PATCH: Ensure Iconify is present for export ---
    const iconifyScript = '<script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>';

    // 1. Inyectar Script si falta
    if (!finalHTML.includes('iconify.min.js')) {
        if (finalHTML.includes('<head>')) {
            finalHTML = finalHTML.replace('<head>', '<head>' + iconifyScript);
        } else if (finalHTML.includes('<body>')) {
            finalHTML = iconifyScript + finalHTML;
        }
    }

    // 2. Inyectar Estilos
    if (finalHTML.includes('<!DOCTYPE') || finalHTML.includes('<html')) {
        if (finalHTML.includes('</body>')) {
            finalHTML = finalHTML.replace('</body>', exportStyles + '</body>');
        } else {
            finalHTML = finalHTML + exportStyles;
        }
    } else {
        // Fallback for raw content: Wrap in full HTML + Script + Styles
        finalHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8">${iconifyScript}</head><body>${html}${exportStyles}</body></html>`;
    }

    return finalHTML;
}

// IPC: Exportar imagen (ALTA CALIDAD + SVG)
ipcMain.handle('export-image', async (event, { html, width, height, format }) => {
    const puppeteer = require('puppeteer');

    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
        });

        const page = await browser.newPage();

        // Viewport exacto = dimensiones del contenido (pixel perfect)
        await page.setViewport({
            width,
            height,
            deviceScaleFactor: 1
        });

        // Preparar HTML (inyectar reset, idéntico al previsualizador)
        const finalHTML = prepareExportHTML(html, width, height);
        await page.setContent(finalHTML, { waitUntil: 'networkidle0', timeout: 60000 });

        // Esperar carga de fuentes y renderizado completo
        await page.evaluate(() => document.fonts.ready).catch(() => { });
        await new Promise(resolve => setTimeout(resolve, 3000));

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

// IPC: Exportar Batch (Lote de imágenes)
ipcMain.handle('save-canvas-png', async (event, { dataURL, folderName, fileName }) => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    try {
        // Resolve path: ~/Pictures/{folderName}/{fileName}
        const picturesDir = path.join(os.homedir(), 'Pictures', folderName || 'Export');
        const filePath = path.join(picturesDir, fileName);

        // Ensure directory exists
        if (!fs.existsSync(picturesDir)) {
            fs.mkdirSync(picturesDir, { recursive: true });
        }
        // Convert data URL to buffer
        const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);
        console.log('[Export] Saved:', filePath);
        return { success: true, path: filePath };
    } catch (err) {
        console.error('[Export] Error saving:', err.message);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('export-batch', async (event, { slides, width, height, format, title }) => {
    const puppeteer = require('puppeteer');
    const fs = require('fs');
    const path = require('path');

    try {
        // 1. Crear carpeta automáticamente en ~/Pictures/CyberCanvas/<titulo_del_post>
        // Sanitizar el título para uso seguro como nombre de carpeta
        const safeTitle = (title || 'Post_Sin_Titulo')
            .replace(/[<>:"/\\|?*]/g, '')  // Eliminar caracteres no válidos
            .replace(/\s+/g, '_')           // Espacios → guiones bajos
            .substring(0, 50);              // Limitar longitud a 50 caracteres para evitar errores de path

        const outputDir = path.join(require('os').homedir(), 'Pictures', 'CyberCanvas', safeTitle);

        // Crear carpeta (y padres) automáticamente
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 2. Iniciar navegador (una sola vez)
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
        });

        const page = await browser.newPage();

        // Configuración de viewport exacta
        await page.setViewport({
            width,
            height,
            deviceScaleFactor: 1
        });

        let count = 0;
        const total = slides.length;
        const ext = format.toLowerCase();

        console.log(`[Batch] Exportando ${total} imágenes a ${outputDir}...`);

        // 3. Iterar y renderizar
        for (let i = 0; i < total; i++) {
            const html = slides[i];
            const slideNum = String(i + 1).padStart(2, '0');
            const filename = `slide_${slideNum}.${ext}`;
            const outputPath = path.join(outputDir, filename);

            // ─── Renderizado directo (idéntico al previsualizador) ───
            const finalHTML = prepareExportHTML(html, width, height);

            // Optimización: Usar 'domcontentloaded' + espera explícita de fuentes es más seguro que 'networkidle0' para evitar timeouts
            await page.setContent(finalHTML, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Esperar carga de fuentes y renderizado completo
            await page.evaluate(async () => {
                await document.fonts.ready;
                // Double check for Black Ops One specifically if present
                if (document.fonts.check('1em "Black Ops One"')) return;
                // Force wait if not ready
                await new Promise(r => setTimeout(r, 1000));
            }).catch(() => { });

            // Optimización de tiempos de espera
            if (i === 0) await new Promise(resolve => setTimeout(resolve, 3000)); // Primera vez: 3s suficentes
            else await new Promise(resolve => setTimeout(resolve, 500));  // Siguientes: 0.5s (muy rápido)

            await page.screenshot({
                path: outputPath,
                type: ext === 'jpg' ? 'jpeg' : ext,
                quality: ext === 'png' ? undefined : 100,
                omitBackground: false
            });

            console.log(`[Batch] Guardado: ${filename}`);
            count++;
        }

        await browser.close();
        return { success: true, count, path: outputDir };

    } catch (error) {
        console.error("Batch Export Error:", error);
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

// IPC: Llamar a AI (Groq / Gemini)
ipcMain.handle('call-ai', async (event, { provider, apiKey, prompt }) => {
    try {
        // Sanitizar API Key (eliminar espacios y saltos de línea)
        apiKey = apiKey ? apiKey.trim() : '';

        console.log(`[IPC] call-ai request: Provider=${provider}, KeyLength=${apiKey.length}, KeyStart=${apiKey.substring(0, 4)}...`);

        if (provider === 'gemini') {
            // ─── GEMINI (Google Generative AI) ───
            // Lista ampliada de modelos para maximizar compatibilidad
            // Actualizado con modelos disponibles confirmados (v2.5, v2.0)
            const models = [
                'gemini-2.5-pro',
                'gemini-2.0-flash',
                'gemini-2.0-flash-001',
                'gemini-1.5-pro-latest',
                'gemini-1.5-pro',
                'gemini-1.5-flash',
                'gemini-pro-latest',
                'gemini-pro'
            ];

            let lastError = null;

            for (const model of models) {
                console.log(`[IPC] Intentando Gemini con modelo: ${model}...`);

                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 65536
                            }
                        })
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        console.warn(`[IPC] Falló ${model}: ${response.status} - ${errText}`);
                        lastError = `Error (${model}): ${response.status}`;
                        continue;
                    }

                    const data = await response.json();

                    if (data.error) {
                        lastError = data.error.message || JSON.stringify(data.error);
                        continue;
                    }

                    if (!data.candidates || data.candidates.length === 0) {
                        if (data.promptFeedback && data.promptFeedback.blockReason) {
                            return { success: false, error: `Gemini Blocked (${model}): ${data.promptFeedback.blockReason}` };
                        }
                        lastError = `No candidates from ${model}`;
                        continue;
                    }

                    // Detectar truncación por tokens
                    const finishReason = data.candidates[0].finishReason;
                    if (finishReason === 'MAX_TOKENS') {
                        console.warn(`[IPC] ⚠️ Respuesta TRUNCADA por MAX_TOKENS — el JSON estará incompleto`);
                    }

                    const code = data.candidates[0].content.parts[0].text.trim();
                    // Limpieza simple
                    let cleanCode = code;
                    if (cleanCode.startsWith('```json')) cleanCode = cleanCode.slice(7);
                    else if (cleanCode.startsWith('```')) cleanCode = cleanCode.slice(3);
                    if (cleanCode.endsWith('```')) cleanCode = cleanCode.slice(0, -3);

                    console.log(`[IPC] Éxito con Gemini (${model})`);
                    console.log(`[IPC] Response length: ${cleanCode.length} chars | finishReason: ${finishReason}`);
                    console.log(`[IPC] Response Preview: ${cleanCode.substring(0, 300)}...`);
                    return { success: true, code: cleanCode.trim() };

                } catch (err) {
                    console.error(`[IPC] Excepción con ${model}:`, err);
                    lastError = err.message;
                }
            }

            // Si llegamos aquí, todo falló. Intentemos listar los modelos disponibles para ver qué pasa.
            console.log("[IPC] Todos los modelos fallaron. Intentando listar modelos disponibles...");
            try {
                const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
                if (listResp.ok) {
                    const listData = await listResp.json();
                    if (listData.models) {
                        const availableModels = listData.models.map(m => m.name.replace('models/', '')).join(', ');
                        return { success: false, error: `No se pudo conectar con ningún modelo estándar. Modelos disponibles para tu Key: ${availableModels}. Error original: ${lastError}` };
                    }
                }
            } catch (listErr) {
                console.error("Error listing models:", listErr);
            }

            return { success: false, error: `Gemini Error: Ningún modelo compatible encontrado. Último error: ${lastError}` };

        } else {
            // ─── GROQ (Llama 3) ───
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: 'You are an expert content creator and code generator. Follow instructions precisely. When asked for JSON, return ONLY valid JSON without any markdown formatting or extra text.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 8000
                })
            });

            const data = await response.json();

            if (data.error) {
                return { success: false, error: data.error.message };
            }

            let code = data.choices[0].message.content.trim();

            // Limpiar markdown
            if (code.startsWith('```json')) code = code.slice(7);
            else if (code.startsWith('```')) code = code.slice(3);
            if (code.endsWith('```')) code = code.slice(0, -3);

            return { success: true, code: code.trim() };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// ─── IPC: Generar Metadata SEO Viral ───
ipcMain.handle('generate-seo', async (event, { tema, nicho, apiKey }) => {
    try {
        console.log(`[IPC] generate-seo request: Tema="${tema}", Nicho="${nicho}", APIKey=${apiKey ? 'OK' : 'Missing'}`);

        if (!apiKey) {
            throw new Error('API Key requerida');
        }

        // Importar y usar SEOEngine
        const SEOEngine = require('./src/services/SEOEngine');
        const seo = new SEOEngine(apiKey);

        const metadata = await seo.generarMetadataViral(tema, nicho);

        console.log(`[IPC] SEO generado exitosamente para: ${tema}`);
        return { success: true, data: metadata };
    } catch (error) {
        console.error('[IPC] Error generando SEO:', error);
        return { success: false, error: error.message };
    }
});

// IPC: Cargar Packs (nueva estructura plana)
// IPC: Cargar Packs (nueva estructura plana) - Robustez mejorada
ipcMain.handle('load-packs', async () => {
    try {
        // En producción (asar) o desarrollo, ajustar ruta correctamente
        // Se asume que src/packs está al mismo nivel que main.js o dentro de resources
        const packsDir = path.join(__dirname, 'src', 'packs');

        if (!fs.existsSync(packsDir)) {
            console.error('Directorio de packs no encontrado:', packsDir);
            return [];
        }

        const packFolders = fs.readdirSync(packsDir, { withFileTypes: true })
            .filter(e => e.isDirectory());

        const packs = [];

        for (const folder of packFolders) {
            const packPath = path.join(packsDir, folder.name);
            const packJsonPath = path.join(packPath, 'pack.json');

            console.log(`[DEBUG] Revisando pack folder: ${folder.name} en ${packPath}`);

            // 1. Cada pack DEBE tener un pack.json
            if (!fs.existsSync(packJsonPath)) {
                console.warn(`[DEBUG] Pack ${folder.name} ignorado (sin pack.json).`);
                continue;
            }

            try {
                const packMeta = JSON.parse(fs.readFileSync(packJsonPath, 'utf8'));
                // Validar ID
                if (!packMeta.id) packMeta.id = folder.name;

                // 2. Escanear templates (.json + .js)
                const files = fs.readdirSync(packPath);
                console.log(`[DEBUG] Pack ${packMeta.name} tiene ${files.length} archivos en total.`);
                // Buscar archivos .json que NO sean pack.json
                const templateManifests = files.filter(f => f.endsWith('.json') && f !== 'pack.json');
                console.log(`[DEBUG] Pack ${packMeta.name} tiene ${templateManifests.length} manifestos de template.`);

                const templates = [];

                for (const manifestFile of templateManifests) {
                    const tid = manifestFile.replace('.json', '');
                    const manifestPath = path.join(packPath, manifestFile);
                    const jsPath = path.join(packPath, `${tid}.js`);

                    if (!fs.existsSync(jsPath)) {
                        console.warn(`Template ${tid} tiene manifiesto pero falta el JS.`);
                        continue;
                    }

                    try {
                        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                        const jsContent = fs.readFileSync(jsPath, 'utf8');

                        templates.push({
                            id: manifest.id || tid,
                            manifest: manifest,
                            code: jsContent
                        });
                    } catch (err) {
                        console.error(`Error leyendo template ${tid} en ${packMeta.name}:`, err.message);
                    }
                }

                // Solo añadir packs con al menos 1 template o si es intencional
                packs.push({
                    id: packMeta.id,
                    name: packMeta.name || folder.name,
                    description: packMeta.description || '',
                    icon: packMeta.icon || 'layers',
                    templates: templates
                });

                console.log(`[Main] Pack cargado: "${packMeta.name}" (${templates.length} templates)`);

            } catch (err) {
                console.error(`Error procesando pack ${folder.name}:`, err.message);
            }
        }

        return packs;
    } catch (error) {
        console.error('[Main] Error crítico cargando packs:', error);
        return [];
    }
});
