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

    // Cargar packs de templates
    loadPacks: () => ipcRenderer.invoke('load-packs')
});
