/**
 * PROFESSIONAL CONTENT ENGINE v5.0 (Canvas Engine Native)
 * Generates structured AI prompts exclusively for the JSON Canvas generation.
 * All legacy HTML templates have been removed.
 */

class ContentEngine {
    constructor() {
        this.brandName = "KR-CLIDN";
    }

    /**
     * Generate a prompt for the Canvas Scene Graph rendering mode.
     * The AI returns a Scene Graph JSON that the CanvasRenderer interprets directly.
     */
    generatePrompt(topic, slideCount = 10, mode = 'TUTORIAL', trendSignal = null, chunkIndex = 0, totalChunks = 1) {
        const count = Math.max(5, Math.min(50, parseInt(slideCount)));

        // Chunking context instruction
        let chunkContext = '';
        if (totalChunks > 1) {
            if (chunkIndex === 0) {
                chunkContext = `\n\n[ATENCIÓN: ESTE ES EL REQUERIMIENTO PARTE ${chunkIndex + 1} DE ${totalChunks}. Genera la PORTADA y los primeros ${count} slides introductorios. NO pongas conclusión aún.]`;
            } else if (chunkIndex === totalChunks - 1) {
                chunkContext = `\n\n[ATENCIÓN: ESTE ES EL REQUERIMIENTO PARTE ${chunkIndex + 1} DE ${totalChunks}. Genera los últimos ${count} slides, incluyendo el contenido profundo final y la CONTRAPORTADA/CTA.]`;
            } else {
                chunkContext = `\n\n[ATENCIÓN: ESTE ES EL REQUERIMIENTO PARTE ${chunkIndex + 1} DE ${totalChunks}. Genera ${count} slides de desarrollo profundo intermedio. NI portada NI contraportada.]`;
            }
        }

        // Theme mapping based on content type
        const themeMap = {
            'TUTORIAL': 'BLUE_TEAM', 'STORY': 'OSINT', 'TOOL': 'RED_TEAM',
            'VS': 'CYBER', 'NEWS': 'CYBER', 'THEORY': 'BLUE_TEAM',
            'SPEEDRUN': 'RED_TEAM', 'ARSENAL': 'RED_TEAM', 'INCIDENT': 'OSINT',
            'CHALLENGE': 'RED_TEAM', 'CHEATSHEET': 'BLUE_TEAM', 'MYTHBUSTER': 'CYBER',
            'TIKTOK_TREND': 'CYBER', 'VIRAL_HOOK_TEST': 'RED_TEAM',
            'EBOOK_CREATOR': 'CYBER'
        };
        const theme = themeMap[mode] || 'CYBER';

        // Prefer BrandingSystem if available (single source of truth)
        let colors;
        if (typeof window !== 'undefined' && window.brandingInstance?.getThemeColors) {
            colors = window.brandingInstance.getThemeColors(theme);
        } else {
            const themeColors = {
                CYBER:     { primary: '#00D9FF', accent: '#A855F7', warning: '#FF9500', success: '#00FF88', danger: '#FF3366', text: '#f0f0f0', muted: '#94a3b8' },
                cyber:     { primary: '#00D9FF', accent: '#A855F7', warning: '#FF9500', success: '#00FF88', danger: '#FF3366', text: '#f0f0f0', muted: '#94a3b8' },
                hacker:    { primary: '#00FF41', accent: '#FF00FF', warning: '#FFD700', success: '#00FF41', danger: '#FF0040', text: '#e0ffe0', muted: '#5a8a5a' },
                minimal:   { primary: '#3B82F6', accent: '#8B5CF6', warning: '#F59E0B', success: '#10B981', danger: '#EF4444', text: '#ffffff', muted: '#9ca3af' },
                RED_TEAM:  { primary: '#FF0000', accent: '#FF6600', warning: '#FFD700', success: '#FF4444', danger: '#FF0040', text: '#f0f0f0', muted: '#a38888' },
                BLUE_TEAM: { primary: '#0088FF', accent: '#00CCFF', warning: '#FF9500', success: '#00FF88', danger: '#FF3366', text: '#f0f0f0', muted: '#8888a3' },
                OSINT:     { primary: '#D946EF', accent: '#A855F7', warning: '#F59E0B', success: '#10B981', danger: '#EF4444', text: '#f0f0f0', muted: '#a388a3' },
            };
            colors = themeColors[theme] || themeColors.CYBER;
        }

        // Mode specific golden rules
        const modeRules = {
            'TIKTOK_TREND': `REGLAS (TIKTOK TREND):\n- SLIDE 1: HOOK VISUAL OBLIGATORIO.\n- VELOCIDAD EXTREMA: Poco texto, muy visual.\n- PATRONES VISUALES: Usa emojis grandes como iconos.`,
            'EBOOK_CREATOR': `REGLAS (E-BOOK VIRAL):\n- PORTADA (Slide 1): Título IMPACTANTE con *kw*.\n- ÍNDICE (Slide 2).\n- PÁGINAS: Mucho texto, profundo, educativo. NO seas breve.\n- CONTRAPORTADA: CTA persuasivo.`,
            'TUTORIAL': `REGLAS (TUTORIAL):\n- Slide 1: Gancho visual.\n- Usa progresión de dificultad.\n- Cada paso debe tener un comando ejecutable.\n- Penúltimo slide: ANTES vs DESPUÉS.`
        };
        const rule = modeRules[mode] || modeRules['TUTORIAL'];

        let tiktokContext = '';
        if (trendSignal) {
            tiktokContext = `TREND SIGNAL: Adapta el contenido al sonido viral: ${trendSignal.sound}. Hook Ref: "${trendSignal.viralHook}"`;
        }

        return `ACTÚA COMO UN DISEÑADOR GRÁFICO PROFESIONAL Y ESTRATEGA DE CONTENIDO VIRAL EN CIBERSEGURIDAD.
TIPO DE POST: "${mode}"
TEMA: "${topic}"
PÁGINAS: ${count}
TEMA VISUAL: "${theme}"

OBJETIVO: Generar ${count} páginas de contenido formato Scene Graph JSON para Canvas Engine. No hay HTML ni plantillas. Todo se dibuja en coordenadas absolutas del Canvas 1080x1920.
${chunkContext}

${tiktokContext}
${rule}

## TIPOS DE LAYER DISPONIBLES (Dibuja de atrás hacia adelante en el array 'layers')

### 1. background (Fondo sólido)
{ "type": "background", "fill": "#000000" } ó para portada: { "type": "background", "fill": "#000000", "isCover": true }

### 2. brand (Header con logo — CADA página DEBE tenerlo)
PORTADA/CIERRE: { "type": "brand", "logo": "./assets/kr-clidn-logo.png", "text": "KR-CLIDN", "badge": "EDICIÓN PREMIUM", "position": "top", "isCover": true }
RESTO: { "type": "brand", "logo": "./assets/kr-clidn-logo.png", "text": "KR-CLIDN", "badge": "EDICIÓN PREMIUM", "position": "top" }

### 3. text (Textos, Títulos, Párrafos)
TÍTULO: { "type": "text", "content": "TÍTULO AQUÍ", "x": 60, "y": 420, "width": 960, "font": { "family": "BlackOpsOne", "size": 88, "weight": 900 }, "color": "#ffffff", "align": "center", "highlights": [{ "text": "AQUÍ", "color": "${colors.primary}" }] }
PÁRRAFO: { "type": "text", "content": "Texto largo del párrafo.", "x": 60, "y": 600, "width": 960, "font": { "family": "MPLUS Code Latin", "size": 42, "weight": 700 }, "color": "#f0f0f0", "align": "justify", "lineHeight": 1.6, "highlights": [{ "text": "párrafo", "color": "${colors.accent}" }] }

### 4. terminal (Ventana de comandos)
{ "type": "terminal", "x": 60, "y": 800, "width": 960, "command": "nmap -sV target", "output": "PORT STATE SERVICE\\n22/tcp open ssh" }

### 5. rect (Tarjetas/Contenedores con barra de acento lateral)
{ "type": "rect", "x": 60, "y": 500, "width": 960, "height": 300, "fill": "#0a0a0c", "border": { "color": "${colors.primary}33", "width": 2 }, "radius": 16, "accentColor": "${colors.primary}", "title": "TÍTULO TARJETA" }

### 6. statbar (Barra de progreso estadística)
{ "type": "statbar", "x": 60, "y": 600, "width": 960, "label": "Eficiencia", "value": 85, "maxValue": 100, "color": "${colors.primary}" }

### 7. bulletlist (Lista decorada)
{ "type": "bulletlist", "x": 60, "y": 500, "width": 900, "items": ["Item", "Otro"], "font": { "family": "MPLUS Code Latin", "size": 40 }, "color": "#f0f0f0", "bulletColor": "${colors.primary}" }

### 8. swipe (Flecha de continuación — TODAS excepto la última)
{ "type": "swipe", "current": 1, "total": ${count} }

### COMPONENTES AVANZADOS OBLIGATORIOS (Combínalos creativamente)
- nodegraph: { "type": "nodegraph", "x": 60, "y": 400, "width": 960, "height": 500, "nodes": [{"id":"n1", "label":"Server", "icon":"dns"}], "connections": [{"from":"n1", "to":"n2", "label":"TCP"}] }
- barchart: { "type": "barchart", "x": 60, "y": 500, "width": 960, "height": 400, "title": "Stats", "color": "${colors.accent}", "data": [{"label":"A", "value":10}] }
- checklist: { "type": "checklist", ... }
- gridbox: { "type": "gridbox", "columns": 2, "cells": [{ "title": "PROS", "text": "...", "color": "${colors.success}" }] }
- warningbox: { "type": "warningbox", "style": "danger", "icon": "⚠️", "title": "CUIDADO", "message": "..." }
- directorytree: { "type": "directorytree", "root": "/var/", "items": [...] }
- attackflow: { "type": "attackflow", "stages": [...] }
- codeblock: { "type": "codeblock", "x": 60, "y": 600, "width": 960, "code": "def hack():\n    pass", "language": "python", "title": "exploit.py" }
- timeline: { "type": "timeline", "x": 60, "y": 500, "width": 960, "events": [{"date":"Step 1", "title":"Recon", "desc":"..."}] }
- vs_table: { "type": "vs_table", "x": 60, "y": 500, "width": 960, "leftTitle":"A", "rightTitle":"B", "rows":[{"left":"...", "right":"...", "leftPositive":true, "rightPositive":false}] }
- radarchart: { "type": "radarchart", "x": 60, "y": 500, "width": 960, "height": 500, "stats":[{"label":"Speed", "value":8}] }
- hexdump: { "type": "hexdump", "x": 60, "y": 600, "width": 960, "lines": 10 }

## REGLAS ESPACIALES Y DE DISEÑO (ESTRICTO)
1. EJE Y ZONA PROHIBIDA SUPERIOR: [y < 380] está RESERVADO para el brand (que empujamos 300px abajo en portadas/cierres). Todo tu contenido principal debe empezar a partir de y=420.
2. EJE Y ZONA PROHIBIDA INFERIOR: [y > 1710].
3. SUMA EXACTA: Calcula mentalmente que la altura de los bloques no sobrepase el espacio (y < 1710). Divide contenido si hace falta.
4. FUENTES: SÓLO "BlackOpsOne" (Títulos) y "MPLUS Code Latin" (Texto). NO uses otras.
5. GENERADOR PURO JSON.

FORMATO RESPUESTA JSON REQUERIDO:
{
    "seo": { "description": "Desc corta", "hashtags": "#Tag" },
    "pages": [
        {
            "canvas": { "width": 1080, "height": 1920 },
            "theme": "${theme}",
            "layers": [ {"type": "background"}, {"type": "brand", ...}, ...contenido..., {"type": "swipe"} ]
        }
    ]
}

RETORNA SOLO EL JSON VÁLIDO. SIN TEXTO EXTRA.`;
    }

    /**
     * Advanced AI Auto-Refiner Prompt
     * Injects spatial awareness (bounding boxes) so the AI can fix overlaps and margins.
     */
    generateLayoutRefinementPrompt(slideJSON, boundsInfo, instruction) {
        return `ACTÚA COMO UN UX/UI DESIGNER EXPERTO Y OPTIMIZADOR DE ESPACIOS.
OBJETIVO: Recibir un JSON de una diapositiva de Canvas Engine que tiene errores de layout (superposiciones, texto saturado, márgenes incorrectos) y DEVOLVER EL JSON CORREGIDO.

INSTRUCCIÓN DEL USUARIO: "${instruction}"

--- CONTEXTO ESPACIAL (MUY IMPORTANTE) ---
El motor de renderizado ha analizado la diapositiva y ha determinado las siguientes Cajas Delimitadoras (Bounding Boxes) reales de los elementos generados:
${boundsInfo}

--- REGLAS DE CORRECCIÓN ---
1. FIX OVERLAPS (Eje Y): Si ves en el contexto espacial que un elemento termina (Bottom Y) muy cerca o por debajo de donde empieza el siguiente (Top Y), DEBES aumentar la propiedad 'y' del siguiente elemento para empujarlo hacia abajo. Deja al menos 30px de separación.
2. DESATURACIÓN DE TEXTO: Si el problema es que un bloque de texto o código es inmensamente largo e invade toda la pantalla, no solo cambies la 'y'. RESUME su contenido (acorta 'text', corta líneas de 'code') manteniendo el mensaje principal para que el elemento sea más bajo.
3. CONSERVA EL ESQUEMA: NO cambies los 'type' de los layers. NO elimines layers a menos que sea estrictamente necesario (ej: borrar un párrafo secundario para salvar el layout). Mantén colores y fuentes.
4. MÁRGENES: La 'x' debe ser 60 y la 'width' máxima 960 para la mayoría de contenedores.
5. NO modifiques background, brand o swipe.

CURRENT SLIDE JSON:
${JSON.stringify(slideJSON, null, 2)}

RESPONDE SOLAMENTE CON EL JSON ACTUALIZADO Y CORREGIDO. NADA DE TEXTO EXTRA. DEBE SER UN ARRAY VÁLIDO DE LAYERS O EL OBJETO 'pages' COMPLETO.`;
    }
}

// Exportar para Node y Web
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentEngine;
} else {
    window.ContentEngine = ContentEngine;
}
