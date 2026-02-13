/**
 * KR-CLIDN-01: COVER / PORTADA — TEXT EDITION v3
 * Solo texto elegante con palabras clave resaltadas en AZUL y LOGO.
 * Fix: Corrección de ruptura de tags HTML al dividir título.
 */
export function render(data) {
    const rawTitle = data.TITLE || 'JOYAS *OCULTAS* DE *KALI*';
    const subtitle = data.SUBTITLE || '3 <span class="kw">herramientas</span> que no conocías (pero deberías) para llevar tu <span class="kw">hacking ético</span> y <span class="kw">análisis</span> al siguiente nivel.';

    // --- Helper: Formatear Título (FIXED) ---
    function formatTitle(titleStr) {
        // 1. Separar en palabras (raw) ANTES de procesar HTML
        const words = titleStr.split(' ');

        // 2. Agrupar en líneas (max 3 palabras)
        const lines = [];
        let currentLine = [];

        for (let i = 0; i < words.length; i++) {
            currentLine.push(words[i]);
            if (currentLine.length === 3) {
                lines.push(currentLine.join(' '));
                currentLine = [];
            }
        }
        if (currentLine.length > 0) lines.push(currentLine.join(' '));

        // 3. Unir líneas con <br>
        const joinedLines = lines.join('<br>'); // Usamos <br> explícito

        // 4. Aplicar resaltado (ahora seguro porque el HTML tags no existen aun)
        // Regex permite saltos de línea (<br>) dentro del match
        const finalHtml = joinedLines.replace(/\*([^\*]+)\*/g, '<span class="blue">$1</span>');

        // 5. Calcular tamaño de fuente dinámico
        const totalWords = words.length;
        let fontSize = '80px';
        let lineHeight = '1.1';

        if (totalWords <= 3) {
            fontSize = '120px';
            lineHeight = '1.05';
        } else if (totalWords <= 6) {
            fontSize = '100px';
        } else {
            fontSize = '80px';
        }

        return {
            html: finalHtml,
            fontSize,
            lineHeight
        };
    }

    const titleData = formatTitle(rawTitle);

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
            position: relative;
        }

        /* ═══ BACKGROUND ═══ */
        body::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
                radial-gradient(ellipse 900px 600px at 50% 20%, rgba(37, 99, 235, 0.05) 0%, transparent 60%),
                radial-gradient(ellipse 700px 500px at 50% 50%, rgba(37, 99, 235, 0.08) 0%, transparent 70%);
            z-index: 0;
        }

        body::after {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(rgba(37, 99, 235, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(37, 99, 235, 0.03) 1px, transparent 1px);
            background-size: 60px 60px;
            z-index: 0;
        }

        .slide {
            position: relative;
            z-index: 1;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 80px;
        }

        /* ═══ HERO TITLE ═══ */
        .title-container {
            margin-bottom: 60px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .cover-logo {
            width: 420px; /* 3x más grande */
            height: auto;
            margin-bottom: 60px;
            margin-top: -120px; /* Ajuste visual */
            filter: drop-shadow(0 0 30px rgba(37, 99, 235, 0.5));
        }

        .title {
            font-family: 'Black Ops One', cursive;
            font-size: ${titleData.fontSize};
            line-height: ${titleData.lineHeight};
            text-transform: uppercase;
            color: #fff;
            text-align: center;
            text-shadow: 
                0 4px 0 #000, 
                0 0 20px rgba(37, 99, 235, 0.2); 
            letter-spacing: 2px;
        }

        .title .blue {
            color: #3B82F6; /* Azul brillante */
            text-shadow: 
                0 0 30px rgba(59, 130, 246, 0.6);
        }

        /* ═══ TERMINAL ═══ */
        .terminal-window {
            width: 100%;
            background: #000000;
            border: 1px solid rgba(37, 99, 235, 0.3);
            border-radius: 16px;
            overflow: hidden;
            box-shadow:
                0 30px 80px rgba(0, 0, 0, 0.8),
                0 0 40px rgba(37, 99, 235, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.04);
            margin-top: 40px;
        }

        .term-header {
            background: linear-gradient(180deg, #111, #000);
            padding: 18px 24px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .t-dot { width: 14px; height: 14px; border-radius: 50%; }
        .t-dot.red { background: #ff5f56; }
        .t-dot.yellow { background: #ffbd2e; }
        .t-dot.green { background: #27c93f; }
        .term-title { margin-left: 16px; font-family: 'JetBrains Mono', monospace; font-size: 18px; color: rgba(255, 255, 255, 0.4); letter-spacing: 1px; }

        .term-body { padding: 40px 50px; font-family: 'JetBrains Mono', monospace; }

        .term-echo-line { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
        .echo-prompt { color: #3B82F6; font-size: 28px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
        .echo-cmd { color: #fff; font-size: 28px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
        .echo-quote { color: #A855F7; font-size: 28px; font-weight: 700; }

        .term-output { text-align: center; padding: 20px 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 10px; }
        .term-output-text { font-family: 'Inter', sans-serif; font-size: 34px; line-height: 1.6; color: #FFFFFF; font-weight: 600; }
        .term-output-text .kw { color: #3B82F6; font-weight: 700; }

        /* ═══ SWIPE ═══ */
        .swipe-indicator { position: absolute; bottom: 60px; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .swipe-text { font-family: 'JetBrains Mono', monospace; font-size: 20px; color: rgba(37,99,235,0.5); letter-spacing: 3px; text-transform: uppercase; }
        .swipe-arrows { font-size: 32px; color: rgba(37,99,235,0.6); letter-spacing: 6px; }

        /* ═══ ESQUINAS ═══ */
        .corner { position: absolute; width: 60px; height: 60px; }
        .corner-tl { top: 40px; left: 40px; border-top: 2px solid rgba(37, 99, 235, 0.15); border-left: 2px solid rgba(37, 99, 235, 0.15); }
        .corner-tr { top: 40px; right: 40px; border-top: 2px solid rgba(37, 99, 235, 0.15); border-right: 2px solid rgba(37, 99, 235, 0.15); }
        .corner-bl { bottom: 40px; left: 40px; border-bottom: 2px solid rgba(37, 99, 235, 0.15); border-left: 2px solid rgba(37, 99, 235, 0.15); }
        .corner-br { bottom: 40px; right: 40px; border-bottom: 2px solid rgba(37, 99, 235, 0.15); border-right: 2px solid rgba(37, 99, 235, 0.15); }
    </style>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body>
    <div class="slide">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>

        <div class="title-container">
            <img class="cover-logo" src="data:image/png;base64,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" alt="KR">
            <h1 class="title">${titleData.html}</h1>
        </div>

        <div class="terminal-window">
            <div class="term-header">
                <div class="t-dot red"></div>
                <div class="t-dot yellow"></div>
                <div class="t-dot green"></div>
                <span class="term-title">bash — 80×24</span>
            </div>
            <div class="term-body">
                <div class="term-echo-line">
                    <span class="echo-prompt">❯</span>
                    <span class="echo-cmd">echo</span>
                    <span class="echo-quote">"</span>
                </div>
                <div class="term-output">
                    <div class="term-output-text">${subtitle}</div>
                </div>
                <div class="term-echo-line" style="justify-content: flex-end; margin-bottom: 0; margin-top: 20px;">
                    <span class="echo-quote">"</span>
                </div>
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