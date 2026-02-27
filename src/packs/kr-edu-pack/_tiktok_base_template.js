/**
 * TEMPLATE BASE TIKTOK-OPTIMIZED
 * Safe zone: 200px top + 480px bottom = 1240px visible
 * Use este código como base para todos los templates
 */

// ESTRUCTURA ESTÁNDAR:
const TIKTOK_SAFE_ZONE_STYLES = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
        font-family: 'Inter', sans-serif;
        background: #000000;
        color: #fff;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
    }

    /* SAFE ZONE */
    .safe-zone {
        position: absolute;
        top: 200px;
        width: 1080px;
        height: 1240px;
        padding: 30px 40px;
        display: flex;
        flex-direction: column;
    }

    /* BRACKETS DECORATIVOS */
    .bracket {
        position: absolute;
        font-family: 'JetBrains Mono', monospace;
        font-size: 38px;
        opacity: 0.2;
    }
    .bracket-tl { top: 210px; left: 15px; }
    .bracket-tr { top: 210px; right: 15px; }
    .bracket-bl { bottom: 490px; left: 15px; }
    .bracket-br { bottom: 490px; right: 15px; }

    /* HEADER ESTÁNDAR */
    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        padding: 12px 20px;
        background: #0a0a0a;
    }

    .label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 38px;
        letter-spacing: 3px;
    }

    /* TÍTULOS */
    .title {
        font-family: 'Inter', sans-serif;
        font-size: 42px;
        font-weight: 900;
        margin-bottom: 24px;
    }

    /* TERMINAL */
    .terminal {
        background: #0c0c0c;
        border: 2px solid #00D9FF;
        border-radius: 12px;
        overflow: hidden;
    }

    .term-header {
        background: #111;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid #222;
    }

    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot-r { background: #FF3366; }
    .dot-y { background: #FFD700; }
    .dot-g { background: #00FF88; }

    /* COLORES */
    .cyan { color: #00D9FF; }
    .green { color: #00FF88; }
    .red { color: #FF3366; }
    .purple { color: #A855F7; }
`;

// EJEMPLO DE USO:
export function renderTemplate(data) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Inter:wght@600;700;800;900&display=swap" rel="stylesheet">
    <style>
        ${TIKTOK_SAFE_ZONE_STYLES}
        /* Estilos específicos del template aquí */
    </style>
</head>
<body>
    <div class="bracket bracket-tl">┌─</div>
    <div class="bracket bracket-tr">─┐</div>
    <div class="bracket bracket-bl">└─</div>
    <div class="bracket bracket-br">─┘</div>

    <div class="safe-zone">
        <!-- Contenido aquí -->
    </div>
    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
