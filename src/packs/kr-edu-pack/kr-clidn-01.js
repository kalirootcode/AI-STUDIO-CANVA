/**
 * KR-CLIDN-01: COVER / PORTADA — CURIOSITY EDITION v4
 * Redesign: Logo Eliminado. Split 50/50. Título "Curiosity" centrado arriba. Terminal abajo.
 */
export function render(data) {
    const rawTitle = data.TITLE || 'JOYAS *OCULTAS* DE *KALI*';
    const subtitle = data.SUBTITLE || '3 <span class="kw">herramientas</span> que no conocías (pero deberías) para llevar tu <span class="kw">hacking ético</span> y <span class="kw">análisis</span> al siguiente nivel.';

    // --- Curiosity Logic: Eliminar "Tema:" o prefijos ---
    let cleanTitle = rawTitle;
    if (cleanTitle.includes(':')) {
        // Tomar la parte después de los dos puntos si existe
        // Ej: "Kali Linux: Secretos" -> "Secretos"
        const parts = cleanTitle.split(':');
        if (parts.length > 1) {
            cleanTitle = parts.slice(1).join(':').trim(); // Unir por si hay más :
        }
    }
    // Si quedó vacío por error, usar original
    if (!cleanTitle) cleanTitle = rawTitle;

    // --- Helper: Formatear Título ---
    function formatTitle(titleStr) {
        const words = titleStr.split(' ');
        const lines = [];
        let currentLine = [];

        // Agrupar palabras (ajustado para ser más impactante, max 2-3 por línea)
        for (let i = 0; i < words.length; i++) {
            currentLine.push(words[i]);
            if (currentLine.length === 3 || (words[i].length > 8 && currentLine.length >= 2)) {
                lines.push(currentLine.join(' '));
                currentLine = [];
            }
        }
        if (currentLine.length > 0) lines.push(currentLine.join(' '));

        const joinedLines = lines.join('<br>');

        // Resaltado *word* -> azul
        const finalHtml = joinedLines.replace(/\*([^\*]+)\*/g, '<span class="blue">$1</span>');

        // Tamaño dinámico
        const totalWords = words.length;
        let fontSize = '90px';
        let lineHeight = '1.1';

        if (totalWords <= 3) { fontSize = '130px'; lineHeight = '1.05'; }
        else if (totalWords <= 6) { fontSize = '110px'; }
        else { fontSize = '90px'; }

        return { html: finalHtml, fontSize, lineHeight };
    }

    const titleData = formatTitle(cleanTitle);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&family=Black+Ops+One&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: #000000;
            color: #fff;
            width: 1080px;
            height: 1920px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* ═══ BACKGROUND ═══ */
        body::before {
            content: '';
            position: absolute; inset: 0;
            background: radial-gradient(ellipse 900px 600px at 50% 20%, rgba(37, 99, 235, 0.05) 0%, transparent 60%);
            z-index: 0;
        }
        body::after {
            content: '';
            position: absolute; inset: 0;
            background-image: linear-gradient(rgba(37, 99, 235, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.03) 1px, transparent 1px);
            background-size: 60px 60px;
            z-index: 0;
        }

        /* ═══ LAYOUT SPLIT ═══ */
        .top-section {
            flex: 1; /* 50% aprox */
            display: flex;
            align-items: center; /* Center Vertically */
            justify-content: center;
            padding: 80px;
            position: relative;
            z-index: 2;
        }

        .bottom-section {
            flex: 1; /* 50% aprox */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start; /* Start from top of bottom section */
            padding: 0 80px 80px 80px;
            position: relative;
            z-index: 2;
        }

        /* ═══ TITLE ═══ */
        .title {
            font-family: 'Black Ops One', cursive;
            font-size: ${titleData.fontSize};
            line-height: ${titleData.lineHeight};
            text-transform: uppercase;
            color: #fff;
            text-align: center;
            text-shadow: 0 4px 0 #000, 0 0 40px rgba(37, 99, 235, 0.4);
            letter-spacing: 2px;
            word-break: break-word; /* Safety for very long words */
            /* Animation Hook */
            /* opacity: 0; Handled by animation script - REMOVED FOR STATIC MODE */
        }
        .title .blue {
            color: #3B82F6;
            text-shadow: 0 0 50px rgba(59, 130, 246, 0.8);
        }

        /* ═══ TERMINAL ═══ */
        .terminal-window {
            width: 100%;
            background: #000000;
            border: 1px solid rgba(37, 99, 235, 0.3);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(37, 99, 235, 0.1);
            /* Push it down slightly or center it? 
               User said: "parte inferior dejas el terminal".
               Let's add some margin-top to separate visual weight.
            */
            margin-top: 0; 
            /* opacity: 0; Handled by animation script - REMOVED FOR STATIC MODE */
        }

        .term-header {
            background: linear-gradient(180deg, #111, #000);
            padding: 18px 24px;
            display: flex; align-items: center; gap: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .t-dot { width: 14px; height: 14px; border-radius: 50%; }
        .t-dot.red { background: #ff5f56; } .t-dot.yellow { background: #ffbd2e; } .t-dot.green { background: #27c93f; }
        .term-title { margin-left: 16px; font-family: 'JetBrains Mono', monospace; font-size: 18px; color: rgba(255, 255, 255, 0.4); letter-spacing: 1px; }

        .term-body { padding: 40px 50px; font-family: 'JetBrains Mono', monospace; }
        .term-echo-line { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
        .echo-prompt { color: #3B82F6; font-size: 28px; font-weight: 700; }
        .echo-cmd { color: #fff; font-size: 28px; font-weight: 700; }

        .term-output-text {
            font-family: 'Inter', sans-serif;
            font-size: 34px; line-height: 1.6;
            color: #FFFFFF; font-weight: 600;
            white-space: pre-wrap; word-break: break-word;
        }
        .term-output-text .kw { color: #3B82F6; font-weight: 700; }

        /* ═══ SWIPE ═══ */
        .swipe-indicator { margin-top: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; padding-bottom: 20px; }
        .swipe-text { font-family: 'JetBrains Mono', monospace; font-size: 20px; color: rgba(37,99,235,0.5); letter-spacing: 3px; text-transform: uppercase; }
        .swipe-arrows { font-size: 32px; color: rgba(37,99,235,0.6); letter-spacing: 6px; }

        /* ═══ CORNERS ═══ */
        .corner { position: absolute; width: 60px; height: 60px; pointer-events: none; }
        .corner-tl { top: 40px; left: 40px; border-top: 2px solid rgba(37, 99, 235, 0.15); border-left: 2px solid rgba(37, 99, 235, 0.15); }
        .corner-tr { top: 40px; right: 40px; border-top: 2px solid rgba(37, 99, 235, 0.15); border-right: 2px solid rgba(37, 99, 235, 0.15); }
        .corner-bl { bottom: 40px; left: 40px; border-bottom: 2px solid rgba(37, 99, 235, 0.15); border-left: 2px solid rgba(37, 99, 235, 0.15); }
        .corner-br { bottom: 40px; right: 40px; border-bottom: 2px solid rgba(37, 99, 235, 0.15); border-right: 2px solid rgba(37, 99, 235, 0.15); }
    </style>
</head>
<body>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <!-- IMAGINARY SPLIT: TOP -->
    <div class="top-section">
        <h1 class="title">${titleData.html}</h1>
    </div>

    <!-- IMAGINARY SPLIT: BOTTOM -->
    <div class="bottom-section">
        <div class="terminal-window">
            <div class="term-header">
                <div class="t-dot red"></div>
                <div class="t-dot yellow"></div>
                <div class="t-dot green"></div>
                <span class="term-title">curiosity_mode — root</span>
            </div>
            <div class="term-body">
                <div class="term-echo-line">
                    <span class="echo-prompt">❯</span>
                    <span class="echo-cmd">cat</span>
                    <span class="echo-cmd" style="margin-left: 10px; color: #A855F7;">secrets.txt</span>
                </div>
                <!-- Subtitle as Terminal Output -->
                <div class="term-output-text">${subtitle}</div>
            </div>
        </div>

        <div class="swipe-indicator">
            <div class="swipe-text">Desliza</div>
            <div class="swipe-arrows">❯❯❯</div>
        </div>
    </div>
</body>
</html>`;
}