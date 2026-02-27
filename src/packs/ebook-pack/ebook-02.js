// --- INJECTED SHARED CODE ---
const EBOOK_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&family=Space+Grotesk:wght@500;700;900&display=swap');

    @font-face {
        font-family: 'NewComicTitle';
        src: url('./assets/fonts/newcomictitle.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
    }

    :root {
        --bg-color: #030303;
        --card-bg: #0a0a0c;
        --text-main: #f0f0f0;
        --text-muted: #94a3b8;
        
        --primary-color: #00D9FF;
        --accent-color: #A855F7;
        --warning-color: #FF9500;
        --success-color: #00FF88;
        --danger-color: #FF3366;

        --font-title: 'NewComicTitle', 'Space Grotesk', sans-serif;
        --font-body: 'Inter', sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
        font-family: var(--font-body);
        background: var(--bg-color);
        color: var(--text-main);
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        position: relative;
    }

    .safe-zone {
        position: absolute;
        top: 200px;
        left: 0;
        width: 1080px;
        height: 1240px;
        padding: 40px 60px;
        display: flex;
        flex-direction: column;
        z-index: 10;
        overflow: hidden;
    }

    /* IMAGES & CINEMATIC WRAPPER */
    img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
    }

    .safe-zone img:not([src*="logo"]):not(.emoji) {
        max-height: calc(100% - 40px);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 15px 45px color-mix(in srgb, var(--primary-color) 25%, transparent),
                    inset 0 0 20px rgba(0, 0, 0, 0.5);
        filter: brightness(0.85) contrast(1.1) saturate(1.2);
        position: relative;
        z-index: 1;
    }

    .image-cinematic-wrapper {
        position: relative;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        border-radius: 16px;
        overflow: hidden;
        max-height: 100%;
        max-width: 100%;
    }

    .image-cinematic-wrapper::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent 50%, color-mix(in srgb, var(--bg-color, #0a0a0c) 80%, transparent));
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
        pointer-events: none;
        z-index: 2;
        border-radius: inherit;
        mix-blend-mode: overlay;
    }

    /* TYPOGRAPHY */
    .ebook-h1 {
        font-family: var(--font-title);
        font-size: 88px;
        font-weight: 900;
        line-height: 1.1;
        letter-spacing: 2px;
        text-shadow: 2px 4px 0px rgba(0,0,0,0.6);
        margin-bottom: 32px;
        color: #ffffff;
        text-wrap: balance;
        overflow-wrap: break-word;
    }
    
    .highlight {
        color: var(--primary-color) !important;
    }
    
    .highlight-body {
        color: var(--accent-color) !important;
        font-weight: 700;
    }
    
    .ebook-h2 {
        font-family: var(--font-title);
        font-size: 64px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 1px;
        text-shadow: 1px 3px 0px rgba(0,0,0,0.5);
        margin-bottom: 24px;
        color: #ffffff;
        text-wrap: balance;
        overflow-wrap: break-word;
    }

    .ebook-p {
        font-family: var(--font-body);
        font-size: 42px;
        line-height: 1.6;
        color: var(--text-main);
        margin-bottom: 24px;
        text-align: justify;
        overflow-wrap: break-word;
        word-break: break-word;
    }

    .ebook-p-muted {
        color: var(--text-muted);
    }

    /* TERMINAL */
    .terminal-window {
        background: #050505;
        border: 2px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 24px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    
    .term-header {
        background: #0a0a0c;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.04);
    }

    .term-dot { width: 16px; height: 16px; border-radius: 50%; }
    .term-dot.red { background: #FF3B30; }
    .term-dot.yellow { background: #FFCC00; }
    .term-dot.green { background: #34C759; }

    .term-body {
        padding: 24px;
        font-family: var(--font-mono);
        font-size: 36px;
        line-height: 1.4;
        color: var(--primary-color);
        font-weight: 700;
        white-space: pre-wrap;
        word-break: break-all;
    }

    /* HIGHLIGHTS FOR THEME COLORS */
    .highlight {
        color: var(--primary-color);
        font-weight: bold;
    }
    
    /* UTILITIES */
    .mono { font-family: var(--font-mono); }
    .text-center { text-align: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-row { display: flex; flex-direction: row; }
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    
    /* CIRCUIT EFFECT (Background) */
    .ebook-circuit-bg {
        position: absolute; 
        top: 0; left: 0; 
        width: 100%; height: 100%; 
        z-index: 1; pointer-events: none; 
        opacity: 0.15; 
        background: var(--primary-color); 
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M0 50h30l20-20h20l20-20h10M0 20h20l20 20h20l20 20h20M30 100V70l20-20h20l20 20v30M10 100V80l20-20h20l20 20h30'/%3E%3Ccircle cx='30' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='10' r='3' fill='%23000'/%3E%3Ccircle cx='20' cy='20' r='3' fill='%23000'/%3E%3Ccircle cx='80' cy='60' r='3' fill='%23000'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='70' r='3' fill='%23000'/%3E%3Ccircle cx='10' cy='80' r='3' fill='%23000'/%3E%3Ccircle cx='70' cy='80' r='3' fill='%23000'/%3E%3C/g%3E%3C/svg%3E"); 
        -webkit-mask-size: 150px 150px;
    }
`;

function getEbookHeader(customText = 'KR-CLIDN') {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid rgba(255,255,255,0.05);">
            <div style="display:flex; align-items:center; gap: 16px;">
                <img src="../assets/kr-clidn-logo.png" style="height: 48px; width: auto; border-radius: 8px; object-fit: contain;">
                <span style="font-family:var(--font-title); font-size: 30px; font-weight:800; color:#fff; letter-spacing: 2px;">${customText}</span>
            </div>
            <div class="mono" style="font-size: 30px; color: var(--text-muted); padding: 8px 16px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                EDICIÓN PREMIUM
            </div>
        </div>
    `;
}

function getEbookPagination(current, total) {
    if (!current || !total) return '';
    return `
        <div style="position: absolute; bottom: 40px; left: 0; width: 100%; display:flex; justify-content:center; align-items:center; gap: 24px; z-index: 100;">
            <div style="font-family: var(--font-mono); font-size: 30px; color: var(--text-muted);">
                PÁGINA <span style="color:var(--primary-color); font-weight:bold;">${current}</span> / ${total}
            </div>
            <div style="display:flex; gap: 8px;">
                ${Array.from({ length: parseInt(total) }).map((_, i) => `
                    <div style="width: ${i + 1 === parseInt(current) ? '32px' : '12px'}; height: 12px; background: ${i + 1 === parseInt(current) ? 'var(--primary-color)' : 'rgba(255,255,255,0.15)'}; border-radius: 6px; transition: all 0.3s ease;"></div>
                `).join('')}
            </div>
        </div>
    `;
}

function getEbookAutoFitScript() {
    return `
    <script>
        (function() {
            // Pre-processing: Wrap images for cinematic effects
            function wrapCinematicImages() {
                const safeZone = document.querySelector('.safe-zone');
                if (!safeZone) return;
                
                const images = safeZone.querySelectorAll('img:not([src*="logo"]):not(.emoji):not(.wrapped-cinematic)');
                images.forEach(img => {
                    img.classList.add('wrapped-cinematic');
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'image-cinematic-wrapper';
                    
                    img.parentNode.insertBefore(wrapper, img);
                    wrapper.appendChild(img);
                });
            }

// --- END INJECTED SHARED CODE ---


export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    function formatTitle(titleStr) {
        if (!titleStr) return '';
        return titleStr.replace(/\*(.*?)\*/g, '<span class="highlight">$1</span>');
    }

    function formatContent(contentStr) {
        if (!contentStr) return '';
        return contentStr.replace(/\*(.*?)\*/g, '<span class="highlight-body">$1</span>');
    }

    const d = {
        CHAPTER_NUM: data.CHAPTER_NUM || '01',
        TITLE: data.TITLE || '*ÍNDICE* DEL E-BOOK',
        CHAPTER_TITLE: data.CHAPTER_TITLE || 'Conceptos Fundamentales',
        CHAPTER_DESC: data.CHAPTER_DESC || 'En este capítulo exploraremos los *fundamentos* esenciales de la ciberseguridad ofensiva y las herramientas que todo profesional debe dominar.',
        CURRENT_PAGE: data.CURRENT_PAGE || '2',
        TOTAL_PAGES: data.TOTAL_PAGES || '7'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>EBOOK-02 (Chapter Divider)</title>
    <style>
        ${EBOOK_STYLES}
    </style>
</head>
<body style="background: #000;">
    <!-- Divider specific minimal background -->
    <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 60%);"></div>

    <div class="safe-zone" style="justify-content: center; align-items: center; text-align: center;">
        
        <div class="mono" style="font-size: 54px; color:var(--primary-color); letter-spacing:8px; margin-bottom:24px; text-transform:uppercase; border-bottom: 2px solid rgba(0,217,255,0.3); padding-bottom:12px;">
            CAPÍTULO ${esc(d.CHAPTER_NUM)}
        </div>
        
        <h1 class="ebook-h1" style="font-size: 100px; line-height: 1.1;">
            ${TemplateUtils.renderEditable('CHAPTER_TITLE', esc(d.CHAPTER_TITLE), data._overrides)}
        </h1>

        <h2 class="ebook-h2">
            ${TemplateUtils.renderEditable('TITLE', formatTitle(esc(d.TITLE)), data._overrides)}
        </h2>

        <p class="ebook-p ebook-p-muted" style="max-width: 85%; text-align:center;">
            ${TemplateUtils.renderEditable('CHAPTER_DESC', formatContent(esc(d.CHAPTER_DESC)), data._overrides)}
        </p>

        ${getEbookPagination(d.CURRENT_PAGE, d.TOTAL_PAGES)}
    </div>

    ${getEbookAutoFitScript()}
</body>
</html>`;
}
