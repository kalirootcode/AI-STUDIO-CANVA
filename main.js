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

    // DEBUG: DevTools deshabilitado para producción
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

// IPC: Log from Renderer to Terminal
ipcMain.on('log-message', (event, { level, message, args }) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    console.log(`[R-${level.toUpperCase()} ${timestamp}]`, message, ...args);
});

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

    const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAATpElEQVR42u2aaZRVxbWAv13n3KnnGRqaGWQQFQEVQcUhiBgVRXwEMUFD4lNijOKQaF4UTcxgUOIcjBqcRRCHABo1KgrILCAamZSZ7gZ6ut19x1P7/bjdiooJ0i3mvXW/tXr1WvfcW6fqO7uqTu0qSJMmTZo0adKkSZMmTZo0adKkSZMmTZo0B4S0ZmEDxr2HqhUxjgFBvQSeF0cVFSMIovEG1A16rJk15HO/zcrpTjJWI/mdhwdDBb1CGW0GGDdYoLHq9Sa8a4Gtr1zdWFO+JGqMX62NH1B9QqFSjJtDZkEXNxGt9MT4tGrXklYV6LaOuBUIBlXvOOAHaLIjYBHUcX0KWECB2lCu/B7cDY649Bz+V8K7lvozivt2cYP5Q8QJDDbGd5g4gQLjzxQRxwbzu4ovs0hzOw2rKk00brDJyIJEpHJh/c4lm0MFhyW2rJi63zr1v3ApYlxXbXyUF68f6yXC5YmG8ml7dy5e1anfRLaufqBVBLY4AvuPXYwYF+B04GFU/VaZo/CxERTEKqIpf1iQ2f7Mtpv2rnu6xJ/Z9kwnmH+e48s8TowvFzHlivlQMR95nm7zrNaBWBGMaCIf29hDbKwHmsiyicaPvUT97Hjdlr9nFB1e9/H864nU7wDg6LFLMY6gymgReUittzHWuHe5F6nQREPFo5sW3LkYX3/csiFozVq82tWAA/aDQy+w3+h/oF68nRMqfEHEZCWT9tKFj/Rfn5nhJI85YlzViScPbOtZzbJiCPhcu6K8JLcqnjdcHN8Y4/j6qrI1mUzMjUQaX+7UNvTPO6/rFz+yZ36eiBQB2U119ICaRCJW9czf3g//9sG1BbEEJ/j9vlNFY54XDz8Rq9v8uhvIi328aDK9z3gcG29wMtv2m4G47QtzzJhX7+9rf//A2/LQM2sGZBT2HukE8gJiHE/VOjbRuDJet/MuMb7EP18Zc+gEtu02jm4j7qF+57KfOsH8XyeSXLRmxjG7VHUaUF5RWT3+tt88f6sRTgCbrImH8jeES3Oimplvk5EPIw1VD/Xs4Lw8408jQqFgYIiqnggcrqqlQCbgEwRFFYiLEAbZIsJy4I3Fy9evGXfNvFLEHWGIY+N103+06Jb100+9BzDtM4r7vuEReGjNjEHzrLUjjTHPZfe8ZlvXI8642AnklaV6BEbVbklGw9OB2Nrnhx06gd1PvBsvHg7mdhzykvFlRn5xcccJo79TPB34rqLVRsx3Lr/84Z4Vjf6yPcniQXGTOyKWSEajDbvv7VnaOP2FaRcepsgEYKiqFonIAddH0YQgm0RkVnll9YxBI+8pcRzfucb1fYjybjC/5yhfRtFVtTW152+ad0Z7a22pqr4iIrU7ttdt/uPvlmUhBEXAYsTS2MY48b2eJztzslz+cPvIA6pHiyaRYEEPgHbiBrtG4/rLC4aVHKWqJ6eejOQDp2zcLc9USfGj1s05ycYbl9ft2XTLitljthXk59ykyvmqmiUifA13TU9efEAva+0v2xTnfX/zuzdN/fF1j9/1xvK6H2bmd7zaCeR19hINCwb1jP4T9FJglIjcIMIHHTrmnRfV5MWC8z3USaQCKZjnitwXjWf+KUfqD7geLRLoyygA1U4iTkJEl4FeTqrrpaJE9bJXZ178TkH/uy/LzivsdNzhwfUzZ/54oCqzrNXeByPuSyJTBXRS1T8+ePtFAzZvrfzN0O/PnqXsLMv0J9Y8+ezEoaoMFxEHyAH6AX2xFat8gcwKzyv4wKoaEKvqfuI6SmrEOAQCRQwIhUD5xWe3Caty9Be+0h3kiaqVP3tKRKpUdaIqwxSyWypuP/hU9aLOHUsGbpl/2Qsisk1Vz1Z0VJM4AFQ1JCL9k8nonFCQoPE1LhOvkrvvu/6gbtrC90ABsKpaPXxQvgu02c+Xeqjqzar6abS1urrm2qRu0BvV3vbT++3vblrm8zlRhe7xSATj5h30PU0r1Hs3EKtv9BRIfkXDWtxVvxb//n7NZoscn89pySNtoUAF9GNBY9Nm70Rgy6Gz1BJkq+fZPCALVW3Jo22RwGS0ivqKlTu9ZMO6d1ZUFCPyZtOK4z8WEakB3vH73X5Ag+v3WSMHr6FFAtfMHk5WST81xvdCwPW6x+OJOSDrvm1J/4a5f3nszY8d15wrIqtQuPf+CQddWIvHQPViOL7MjyRZU9VrxMyYiNwBGv22LX0F60Tk90uWbPwuIu0EeaelU1qLBb737Ek0Vq1X1C4N+E37yXcvmy3Ig6D227b1BfaKyPXjL/uzDTru9QaZlbTxHS3pvgBOa9Qssn01uV1OSQpq16yv6zNsSNkLRfnBnkDPb9taEzERuemiyx54IcsN3uc34vgMv3DENEy9a3yLCj6o+O035l2M64JSChwB4gCKoJqMDYw01GxZNeu0tX6//yWgw7dtD5gjIv915NkzR5YW5v1Vje+tPbHs+UZA0RjKy8BHWcEAbz9y5Ncq+KBepK21uMbBet4EgQmglUAq++cGTDAje9vwS56b/9ZTFz6t1o5DpJTUcJEEdqlqDfufrkVEcoB2gO+LF1WpB92hEG369b4BoCL4QEqAQpHma4qIvC65M7XfmWUDKxP+RQI+EU5vKkIRPlHVjw4mmg4qAo8avQg3GEBVOwlkYu0uUNGmAr1kVKsrPgxvnn+ZY609BpgpInnA7yD5KDYe9qxDNC5ijOA4BscIiXgUz0tmZWblnAdMBnI/k6cfglwXjcVW1EdIqirNfwDGGHKzfBLwO+1VuRG44DOJTBCRRwZctDJb1TbV8tPnp6TyjZkiUg14K58ceMAuDioCV88aDED/ccu3KGRi5FqgK2AVxPhD5fllA/4Aeo7AGKBIhHm/uG32n59fYH8QzGnfS4zjGOP4QZpT/qhNSqR2a2Whb9tdC1+c1E9VxzfJ84wxf8zvd+cnZV2PvMUN5uXy5QgWVRtuqN07d9nTJ/4qJydzYFOdEBFbNmJh75KCwG1AYJ9sQbNJvyBZwI+Br5WWbo09kSRIJZAlIqhqLjDcWv0LMAiREaqKIMsffXFz5zadB1wt4i3TZKTWU5uaAlXdJh+hYFbRWTt217/7+YZIGHivtMvRZ/mCoTOsF12IeuZTAWI8MU7UiNM2Mzv757+8c8noeyef+gnQVVVVROIZQacjqaTCrH3kfdoDFa0Wle1fdyHQIoFNoR4DHgA48rw5qNqgGyqeFo1JDkj5vhVyfBmu2uQ76jVeMvTKMyP3nPzZgvXEK+q1ct0zQ0P53Y8zbijCl8dAAQ1aL35vdtlJUxbcKc0SAPSUXys1Hyz6OcioovwMAwSarsWAciO2EMgDeqBeJF63fbobyNm4evbpLYqe1kgmfEpDxRpy2g+O2mRkLXilwDpS71/vAGUleVqVjO6tiYXLmXPjb6FpMd150E368dvX5PoySq5CnHhhtrcROCzV0xTQTKBDtG7n1mS0JhLeNr/5lppVeLgec8lGdrz98ABV/tvzkh9cdfERIQVHVR8H7gc+FE1sAF4EYohx3IxixwRyvl4Dv2mBmxbdSM3Wt0lE9r7hamN7YI2qPq+ql6tq++fuH50MV76/NVa7caBN7KG09/cBRMTpktvh1Dt8ocKzEvHGGa/99WxR1WMQeQrkBhF5DzijIBReGA9vz6vbMb89QOdjbya7eIhTs/W1UwLZZQ+LcfMaG8KP5+dlDUZ1ZSRc/YNJU9Zec9QFr+8JhYKVgv4V9H5B7nP8mXExbq/+45a7/cctP+g2t3qOqevg2xAn6Poyii7o3M63+OVHxjrWWgVeN8ZM69DvJzMyio+60Z9Z4hPxVYIUGdd/kvFld1LrPVuaW3P9vGkjrgUCP7h23q/nvLWzZO3cMbHSkuy7Rfhtu2P/4OYWlF7mhoor3UBuhXqJnuL4hokTcJMev/rH/X3/VpgfeA7V1caYCcf/cDXR+uphxp91D6ltgOYVkoPIboHRwLYVTww4qPa2agQCZJcOwM1ql/Rntcnavjf4IxHZaEQ6C7Sx1l6zbdW9g0O+2ORoY/06FTPE+DIHYgLrGxvrL+3ZwV45b9qI81U501r755Wb/Jd26nrY3CHfm10sIrNVuX3bu9fu3b278pZEPGK9ZGyEuKFOaoKzwo32nHl3H/FSUX7gdlQHAL2BnA3Ln85XdJKIKQeuE7hWRCaJyJUCk4DylrS3VU4mNNPl6J9R0Hc4Ve+/cq4TLLhVA3krRv70rVyEkSAhgZBV7ntv7hVPeMnEky+8svLp1etqvGEndNcTj+vWEbhdlXEiTD/l0tXxQEb+WNR7KRAMnvbWon8+NfT4XleImFm7l1/7p3A4fO9js1eF3VBuctzZPfxZITNElSmqekxTMvUoYKi4OZtA2iHmBsHOQwwrHj+6ZQ3dh1btwj2GTkXVy89qO/Blx5/liyd07JpnBvRR5WGgoPl7CipQB2wRCGvq9aITqf/1gnfe4aPeHhLMyPkuqufEwjsmNtbtfO3j+RNPVdXJquohUiGwXVU9UlsJZSLi/0KVFu+pqh8/aOzfKW5btqU+Gohde9ZiLhk/sdXafFAR2DTougilgL/ZihjXRms2dUNMWTzJpDXPDPSr6hSgoHnFIKnlgZBaZRz5pbdhYeUv7li1w+/3ny9ipnvJhnKMWeqGSo5FE3PAvaLp1EI7oN2/St2r6qDC/Mwpm14dPf6qyX8pcRzZ8/5mN9Jq9jjIMVAERDhB4GVRnSWqMwWdiU3MCuR0mGrcYH0kmlwLnKaqhapaJSLVTdngGlWtBRJfUfrcF9+q7GfcQAiYkwowb2kgEDh83NVzwyIsPfB6CsApQK9EIt5X1Q7SVs6Yt2AMlA2g/2PV2WjVSaaSMSkUktYmtoKtVtU3SC30BUSatyBU9aek1qj7FlrX2NCwyBhzKbA2XL5my551M/xt+o4rDuR07LP4g519QN4Ee+bXGH3qgRrHNceqqisib37rAlc8MZCRE27e4c8o2oF6RwMnaapFDooLuG6J2TLh54tfeOh3E7sonKaKNCVZm9+Ou++n6Ei4PlKnNu5Tm+yfUdBtRtmxV2caJ9BNxC1TmywEwqqpXnAARIyR+6ZMe67SMc5ZIsxuTXkHLRDAIwiAVekuyHk0b/mmMiCOqtQ6xlTUN0Y3ZGeFHFVGqmoPmk4u7H/s0qI2bQpPDu/ZODnSUHW6z59VIMYBon+PRsKbzj4haxnolH/jzpLaal0qIo/OeX3JqzvK91wjIt2At1tbYItm4Qt+cjcIoqo+47hijGlKMVnxPKVDsX+gVdvL8+yb11w6qrZLh7Y9VfUG0DO/KoZUdY+IPCoiS0DrSKWaXJBCVT1TVc8XkcBXVCkKPCgiD8z9x9Kdf3t9SedQ0P8zERkF3BoIZExNxKPccdOP/zME/itunXIH2cGY7KjOG26tXKiquqc6MufGKy5c0bNbmyeBQf+mCKtoEkVFxJDafvhXk54Fpj47553fLFj2wWjXMWNE5EigBphijHkUJd6a8lpdYNfjb8Um6p2czqcf7/hzO4GgCtnBhnaFWbXDIpH4wE1bGq/e8Oq4varyJPucWWkF3vK85JjrbntonIi5EWQh8IqIvOx3g1uSXoIpvzr47ctDI3DwrwFKstsNecYJ5BQCDYDR1AlJFQgmo3vX9+uwZ9Jjfxo7RZWxXygiBlQDJew/2qKkIuqL1xtFZGyv0/9c27VL6XOO0Y8a6+tGedZUnjEomxuuPLfVxTXTqks59ZKA7gWdII6p95dEPWMTkjQuJu6JY43QYMzjd71SM/3O7z0uIuew73E4dKHAFOAxkKIvla86X4T7QZ5Q1UZgNWBFZFMyWjXfWueSbZX+dWKcShuN5onxVX6T8uAbGgNP+mQVIANMMvkr43kBaxw1SYsBTJ1nqh6vqDipQG+549ZzpqnynX0EvQ5cCrwsIl/aElXVe4CngDeAJzzPuwoR9TlO4uQ1S23d8yuygrv3utl5+Ro8tbfWdisy6rpVYi3zO3293bYDpVUjsJmmvZw91nXfVdcNAuL5wAMjAVXjk77Pvra1zx23ymzQ0/jsQRbz2WvI5wQ2LQW3k+q+fuAcx3FKgV2I/DKZExieO37IeJ9nPTzrNBjJQlmH510OtOry7RsXOL/LUZA6qfWHL17rdcZjaDLW03HiJ9bUhv+Rm5P1EanUE0AhqVT8/lJMCuwASgFHRNoAZwn85aryTTgiFyuyLuY6i3AdD7ACW0Uk+k2ed/pGBP4rYtUbcLVwnTi748dOfbJm/eTLfqSqE4GBpGblPGCrosjnR5gYsAsYIkItsElgHiJ3r4zUn2dEOgETBdY3PcBDwiE89fgZR0x9hB03P0/flbeeEDcUlrn+5Q+W9tB819cB2KCqw4Dfkcq4+IFGYDnoeBHjQzVjVayhYtK2dQGf1TFxv+86K/KsGHMlqnZ+529mvPuPEQgw9JPVkJqBJ6nqKRa2JDz7Np6u7OP5tt/fs09m0HH6oHRA+HBzLLJhwvb12ih6pBEGO8ggA30E8lRkLvBz0B34hPll/88j8HMSBR9KX2CwKseCdlWrSRXWJWCZh+5yRTr7kJMFDieVA6wFViksBBaIsAolgs9lftnhh7QN36rAZk6ObEUrqsEYB6ttUe0PnAgcD3Qj1Y3XkxL2DrAKkZ1A0kvGWdD9wI9itDb/EQK/yNBt7yM+B40mslE6N328WUKBsCaSzO/Q99uuYpo0adKkSZMmTZo0adKkSZMmTZo0/xf5Xy7bpLE93t5UAAAAAElFTkSuQmCC";

    // Reemplazar path relativo con Base64 para exportación
    let finalHtml = html.replace(/\.\.\/assets\/kr-clidn-logo-small\.png/g, LOGO_BASE64);

    // --- PATCH: Ensure Iconify is present for export ---
    // Script de Iconify (Inyección forzada para asegurar renderizado)
    const iconifyScript = '<script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>';
    let finalHTML = html;

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

            // 1. Cada pack DEBE tener un pack.json
            if (!fs.existsSync(packJsonPath)) {
                // Silencioso para capetas irrelevantes, pero útil para debug
                // console.warn(`Pack ${folder.name} ignorado (sin pack.json).`);
                continue;
            }

            try {
                const packMeta = JSON.parse(fs.readFileSync(packJsonPath, 'utf8'));
                // Validar ID
                if (!packMeta.id) packMeta.id = folder.name;

                // 2. Escanear templates (.json + .js)
                const files = fs.readdirSync(packPath);
                // Buscar archivos .json que NO sean pack.json
                const templateManifests = files.filter(f => f.endsWith('.json') && f !== 'pack.json');

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
