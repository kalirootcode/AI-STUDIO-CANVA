const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cyberCanvas', {
    // Exportar imagen
    exportImage: (options) => ipcRenderer.invoke('export-image', options),

    // Exportar video
    exportVideo: (options) => ipcRenderer.invoke('export-video', options),

    // Exportar batch
    exportBatch: (options) => ipcRenderer.invoke('export-batch', options),

    // Llamar a AI
    callAI: (options) => ipcRenderer.invoke('call-ai', options),

    // Generar SEO Viral
    generateSEO: (options) => ipcRenderer.invoke('generate-seo', options),
    log: (level, message, ...args) => ipcRenderer.send('log-message', { level, message, args }),

    // Cargar packs de templates
    loadPacks: () => ipcRenderer.invoke('load-packs'),

    // Persistencia API Keys
    getEnvKey: (provider) => ipcRenderer.invoke('get-env-key', provider),
    saveEnvKey: (options) => ipcRenderer.invoke('save-env-key', options),

    // ── TikTok Intelligence Bridge ──────────────────────────────────────────
    // Send data to Chrome Extension via WebSocket
    tiktokBridgeSend: (payload) => ipcRenderer.invoke('tiktok-bridge-send', payload),
    // Get bridge server status
    tiktokBridgeStatus: () => ipcRenderer.invoke('tiktok-bridge-status'),
    // Listen for incoming data from extension
    onTiktokTrend: (cb) => ipcRenderer.on('tiktok-trend-data', (_, data) => cb(data)),
    onTiktokViral: (cb) => ipcRenderer.on('tiktok-viral-video', (_, data) => cb(data)),
    onTiktokGenerate: (cb) => ipcRenderer.on('tiktok-generate-request', (_, data) => cb(data)),
    onTiktokStatus: (cb) => ipcRenderer.on('tiktok-extension-status', (_, data) => cb(data))
});

