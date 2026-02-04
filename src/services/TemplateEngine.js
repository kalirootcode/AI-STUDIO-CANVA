// ═══════════════════════════════════════════════════════════════════════════
// CYBER-CANVAS PRO - Template Engine
// Motor para cargar, renderizar y gestionar templates
// ═══════════════════════════════════════════════════════════════════════════

class TemplateEngine {
    constructor() {
        this.templates = [];
        this.currentTemplate = null;
        this.defaultColors = {
            COLOR_BG: '#000000',
            COLOR_PRIMARY: '#0055ff',
            COLOR_SECONDARY: '#00aaff',
            COLOR_ACCENT: '#00ffff'
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CARGA DE TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════

    async loadTemplates() {
        // En producción, esto leería del filesystem
        // Por ahora, templates hardcodeados para el navegador
        this.templates = [
            {
                id: 'modern-module-card',
                name: 'Módulo con Cards',
                category: 'instagram',
                aspectRatio: '9:16',
                description: 'Template para módulos educativos con título grande y 3 tarjetas',
                icon: '📚',
                slots: ['CATEGORIA', 'TITULO', 'SUBTITULO', 'CARDS', 'BRAND_NAME']
            },
            {
                id: 'quote-minimal',
                name: 'Quote Minimalista',
                category: 'instagram',
                aspectRatio: '9:16',
                description: 'Cita inspiracional con fondo degradado',
                icon: '💬',
                slots: ['QUOTE', 'AUTHOR', 'BRAND_NAME']
            },
            {
                id: 'tips-list',
                name: 'Lista de Tips',
                category: 'instagram',
                aspectRatio: '9:16',
                description: '5 tips o consejos con iconos',
                icon: '💡',
                slots: ['TITULO', 'TIPS', 'BRAND_NAME']
            }
        ];
        return this.templates;
    }

    getTemplates() {
        return this.templates;
    }

    getTemplateById(id) {
        return this.templates.find(t => t.id === id);
    }

    selectTemplate(id) {
        this.currentTemplate = this.getTemplateById(id);
        return this.currentTemplate;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GENERACIÓN DE PROMPT PARA IA
    // ═══════════════════════════════════════════════════════════════════════

    buildPrompt(theme, templateId) {
        const template = this.getTemplateById(templateId);

        const prompts = {
            'modern-module-card': `
Genera contenido para un diseño visual de redes sociales.

TEMA: ${theme}

ESTRUCTURA REQUERIDA (responde SOLO en JSON válido):
{
    "CATEGORIA": "Texto corto de categoría (ej: MÓDULO 1, GUÍA PRO, TIP #3)",
    "TITULO": "Una palabra impactante en mayúsculas (máx 10 caracteres)",
    "SUBTITULO": "Continuación del título (máx 8 caracteres) o vacío",
    "CARDS": [
        {"icono": "nombre_material_icon", "nombre": "Título corto", "descripcion": "Descripción breve"},
        {"icono": "nombre_material_icon", "nombre": "Título corto", "descripcion": "Descripción breve"},
        {"icono": "nombre_material_icon", "nombre": "Título corto", "descripcion": "Descripción breve"}
    ],
    "BRAND_NAME": "CYBER-CANVAS"
}

ICONOS DISPONIBLES (Material Icons): 
rocket_launch, trending_up, psychology, lightbulb, star, verified, speed, security, 
code, terminal, cloud, storage, analytics, build, extension, explore, favorite,
flash_on, grade, hub, insights, layers, memory, network_check, palette, query_stats

REGLAS:
- TITULO debe ser UNA palabra impactante
- Los nombres de las cards deben ser cortos (máx 15 chars)
- Las descripciones deben ser muy breves (máx 25 chars)
- Usa iconos apropiados para el tema
- Responde SOLO el JSON, sin explicaciones`,

            'quote-minimal': `
Genera contenido para un diseño de quote/cita inspiracional.

TEMA: ${theme}

ESTRUCTURA REQUERIDA (responde SOLO en JSON válido):
{
    "QUOTE": "Una frase inspiracional o educativa relacionada con el tema (máx 100 caracteres)",
    "AUTHOR": "Autor o fuente de la cita",
    "BRAND_NAME": "CYBER-CANVAS"
}

REGLAS:
- La cita debe ser impactante y memorable
- Relacionada directamente con el tema
- Responde SOLO el JSON, sin explicaciones`,

            'tips-list': `
Genera contenido para un diseño de lista de tips.

TEMA: ${theme}

ESTRUCTURA REQUERIDA (responde SOLO en JSON válido):
{
    "TITULO": "Título atractivo (ej: 5 TIPS PARA...)",
    "TIPS": [
        {"numero": "01", "texto": "Primer tip breve"},
        {"numero": "02", "texto": "Segundo tip breve"},
        {"numero": "03", "texto": "Tercer tip breve"},
        {"numero": "04", "texto": "Cuarto tip breve"},
        {"numero": "05", "texto": "Quinto tip breve"}
    ],
    "BRAND_NAME": "CYBER-CANVAS"
}

REGLAS:
- Cada tip debe ser accionable y breve (máx 40 chars)
- El título debe captar atención
- Responde SOLO el JSON, sin explicaciones`
        };

        return prompts[templateId] || prompts['modern-module-card'];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDERIZADO DE TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════

    renderTemplate(templateId, content) {
        const templates = {
            'modern-module-card': this.renderModuleCard(content),
            'quote-minimal': this.renderQuoteMinimal(content),
            'tips-list': this.renderTipsList(content)
        };

        return templates[templateId] || '';
    }

    renderModuleCard(content) {
        const cardsHTML = (content.CARDS || []).map(card => `
                <div class="command-card">
                    <div class="command-info">
                        <div class="command-icon">
                            <i class="material-icons">${card.icono}</i>
                        </div>
                        <div class="command-details">
                            <div class="command-name">${card.nombre}</div>
                            <div class="command-description">${card.descripcion}</div>
                        </div>
                    </div>
                    <i class="material-icons command-arrow">arrow_forward</i>
                </div>`).join('\n');

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #000000;
            --primary-blue: #0055ff;
            --secondary-blue: #00aaff;
            --accent-cyan: #00ffff;
            --text-white: #FFFFFF;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Montserrat', sans-serif;
            background-color: #111;
            display: flex;
            justify-content: center;
        }
        .container {
            width: 720px;
            height: 1280px;
            background-color: var(--bg-color);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        .branding {
            position: absolute;
            top: 30px;
            right: 30px;
            display: flex;
            align-items: center;
            z-index: 10;
        }
        .brand-name {
            font-size: 16px;
            font-weight: 700;
            color: var(--accent-cyan);
            letter-spacing: 1px;
        }
        .content {
            text-align: center;
            z-index: 5;
            position: relative;
            width: 85%;
        }
        .module-number {
            font-size: 24px;
            font-weight: 700;
            color: var(--secondary-blue);
            letter-spacing: 4px;
            margin-bottom: 25px;
            text-transform: uppercase;
            position: relative;
            display: inline-block;
        }
        .module-number::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 3px;
            background: linear-gradient(90deg, var(--primary-blue), var(--accent-cyan));
            border-radius: 2px;
        }
        .title {
            font-size: 80px;
            font-weight: 900;
            line-height: 0.9;
            margin: 0 0 15px 0;
            background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-cyan) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            font-size: 32px;
            font-weight: 700;
            color: var(--text-white);
            margin-bottom: 60px;
            position: relative;
            display: inline-block;
        }
        .subtitle::before {
            content: '';
            position: absolute;
            top: -15px; left: -20px; right: -20px; bottom: -15px;
            background: linear-gradient(135deg, rgba(0, 85, 255, 0.1) 0%, rgba(0, 255, 255, 0.1) 100%);
            z-index: -1;
            border-radius: 15px;
        }
        .commands-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
            width: 100%;
        }
        .command-card {
            width: 100%;
            padding: 20px 25px;
            border-radius: 15px;
            background: linear-gradient(135deg, rgba(0, 85, 255, 0.1) 0%, rgba(0, 170, 255, 0.05) 100%);
            border: 1px solid rgba(0, 170, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 10px 30px rgba(0, 85, 255, 0.15);
            position: relative;
            overflow: hidden;
        }
        .command-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(180deg, var(--primary-blue), var(--accent-cyan));
        }
        .command-info {
            display: flex;
            align-items: center;
            z-index: 1;
        }
        .command-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(0, 170, 255, 0.2);
            border: 2px solid var(--secondary-blue);
            display: flex;
            justify-content: center;
            align-items: center;
            margin-right: 20px;
            box-shadow: 0 0 20px rgba(0, 170, 255, 0.3);
        }
        .command-icon i {
            font-size: 30px;
            color: var(--accent-cyan);
        }
        .command-details { text-align: left; }
        .command-name {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-white);
            margin-bottom: 4px;
            font-family: 'Roboto Mono', monospace;
        }
        .command-description {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .command-arrow {
            font-size: 24px;
            color: var(--accent-cyan);
            z-index: 1;
        }
        .background-decoration {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 1;
        }
        .line {
            position: absolute;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent);
            height: 1px;
            width: 100%;
        }
        .line:nth-child(1) { top: 20%; transform: rotate(-15deg); animation: pulse 4s infinite; }
        .line:nth-child(2) { top: 50%; transform: rotate(10deg); animation: pulse 4s infinite 1s; }
        .line:nth-child(3) { top: 80%; transform: rotate(-5deg); animation: pulse 4s infinite 2s; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
        .circle {
            position: absolute;
            border-radius: 50%;
            border: 1px solid rgba(0, 255, 255, 0.15);
        }
        .circle:nth-child(4) { width: 350px; height: 350px; top: -80px; right: -80px; animation: rotate 20s linear infinite; }
        .circle:nth-child(5) { width: 250px; height: 250px; bottom: -40px; left: -40px; animation: rotate 15s linear infinite reverse; }
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .glow {
            position: absolute;
            width: 550px;
            height: 550px;
            background: radial-gradient(circle, rgba(0, 85, 255, 0.15) 0%, transparent 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="background-decoration">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
            <div class="circle"></div>
            <div class="circle"></div>
        </div>
        <div class="glow"></div>
        <div class="branding">
            <span class="brand-name">${content.BRAND_NAME || 'CYBER-CANVAS'}</span>
        </div>
        <div class="content">
            <div class="module-number">${content.CATEGORIA || ''}</div>
            <h1 class="title">${content.TITULO || ''}</h1>
            <div class="subtitle">${content.SUBTITULO || ''}</div>
            <div class="commands-container">
                ${cardsHTML}
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    renderQuoteMinimal(content) {
        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            display: flex;
            justify-content: center;
        }
        .container {
            width: 720px;
            height: 1280px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 60px;
        }
        .quote-mark {
            font-size: 200px;
            color: rgba(0, 212, 255, 0.1);
            position: absolute;
            top: 100px;
            left: 40px;
            font-family: 'Playfair Display', serif;
            line-height: 1;
        }
        .quote {
            font-size: 42px;
            font-weight: 400;
            color: #ffffff;
            text-align: center;
            line-height: 1.4;
            font-family: 'Playfair Display', serif;
            z-index: 2;
            max-width: 600px;
        }
        .author {
            font-size: 18px;
            color: #00d4ff;
            margin-top: 40px;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .brand {
            position: absolute;
            bottom: 40px;
            font-size: 14px;
            color: rgba(255,255,255,0.5);
            letter-spacing: 3px;
        }
        .glow {
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="glow"></div>
        <div class="quote-mark">"</div>
        <p class="quote">${content.QUOTE || ''}</p>
        <span class="author">— ${content.AUTHOR || ''}</span>
        <span class="brand">${content.BRAND_NAME || 'CYBER-CANVAS'}</span>
    </div>
</body>
</html>`;
    }

    renderTipsList(content) {
        const tipsHTML = (content.TIPS || []).map(tip => `
            <div class="tip-item">
                <span class="tip-number">${tip.numero}</span>
                <span class="tip-text">${tip.texto}</span>
            </div>`).join('\n');

        return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Montserrat', sans-serif;
            display: flex;
            justify-content: center;
        }
        .container {
            width: 720px;
            height: 1280px;
            background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 60px;
        }
        .title {
            font-size: 48px;
            font-weight: 900;
            color: #ffffff;
            text-align: center;
            margin-bottom: 60px;
            background: linear-gradient(135deg, #00d4ff 0%, #0055ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .tips-container {
            display: flex;
            flex-direction: column;
            gap: 25px;
            width: 100%;
        }
        .tip-item {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 25px 30px;
            background: rgba(0, 212, 255, 0.05);
            border-left: 4px solid #00d4ff;
            border-radius: 12px;
        }
        .tip-number {
            font-size: 32px;
            font-weight: 900;
            color: #00d4ff;
            min-width: 50px;
        }
        .tip-text {
            font-size: 20px;
            color: #ffffff;
            font-weight: 500;
        }
        .brand {
            position: absolute;
            top: 40px;
            right: 40px;
            font-size: 14px;
            color: #00d4ff;
            letter-spacing: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <span class="brand">${content.BRAND_NAME || 'CYBER-CANVAS'}</span>
        <h1 class="title">${content.TITULO || ''}</h1>
        <div class="tips-container">
            ${tipsHTML}
        </div>
    </div>
</body>
</html>`;
    }
}

// Exportar para uso global
window.TemplateEngine = TemplateEngine;
