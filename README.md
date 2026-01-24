# 🎨 CYBER-CANVAS AI STUDIO (Electron)

<p align="center">
  <img src="assets/logo.png" alt="Logo" width="100">
</p>

**AI-Powered Web Design Generator** - Versión Electron con mejor rendimiento

## ⚡ Características

- 🖥️ **Editor profesional** con CodeMirror (syntax highlighting)
- 👁️ **Preview en tiempo real** (iframe nativo)
- 📸 **Exportar imágenes** (PNG, JPG, WEBP)
- 🎬 **Exportar videos** (Puppeteer → MP4)
- 🤖 **Adaptar con AI** (Groq LLaMA 3.3)
- 🎨 **Tema profesional** (negro + azul cielo)

## 📐 Formatos

| Aspecto | Resolución | Uso |
|---------|-----------|-----|
| 16:9 | 1920×1080 | Desktop, YouTube |
| 9:16 | 1080×1920 | Stories, Reels, TikTok |
| 1:1 | 1080×1080 | Instagram Feed |
| 4:5 | 1080×1350 | Instagram Óptimo |

## 🚀 Instalación

```bash
cd CYBER-CANVAS-ELECTRON

# Instalar dependencias
npm install

# Ejecutar
npm start
```

### Requisitos
- Node.js 18+
- FFmpeg (para exportar videos)

## 📁 Estructura

```
CYBER-CANVAS-ELECTRON/
├── main.js           # Proceso principal Electron
├── preload.js        # Bridge IPC
├── package.json
├── assets/
│   └── logo.png
└── src/
    ├── index.html    # UI
    ├── styles.css    # Tema negro/azul
    └── renderer.js   # Lógica
```

## 🔑 API Key

Obtén tu API Key gratuita en [console.groq.com](https://console.groq.com)

---

Made with 💙 by kalirootcode
