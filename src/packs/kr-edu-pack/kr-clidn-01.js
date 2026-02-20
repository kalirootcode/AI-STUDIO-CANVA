/**
 * KR-CLIDN-01: COVER — TIKTOK OPTIMIZED v6 (Refactored)
 * Safe zone: 200px top + 480px bottom
 * Visible area: 1240px centered
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const themes = {
        CYBER: { p: '#00D9FF', s: '#00FF9D', a: '#FF0055', w: '#FFB800' },
        RED_TEAM: { p: '#FF0000', s: '#32CD32', a: '#FF4500', w: '#FFFF00' },
        BLUE_TEAM: { p: '#0088FF', s: '#00FF9D', a: '#FFA500', w: '#7c3aed' },
        OSINT: { p: '#d946ef', s: '#10b981', a: '#f43f5e', w: '#f59e0b' }
    };

    // Fallback if data.THEME is not passed or invalid
    const themeName = data.THEME || 'CYBER';
    const t = themes[themeName] || themes.CYBER;

    // Inject CSS Variables for color override ONLY (Layout is in cyber-base.css)
    // We override the root variables defined in cyber-base.css
    const themeCSS = `
        :root {
            --primary-color: ${t.p};
            --accent-color: ${t.a};
            --success-color: ${t.s};
            --warning-color: ${t.w};
        }
    `;

    const rawTitle = data.TITLE || data.title || 'Así un *HACKER* tomó el control sin *DESCARGAR* nada';
    const subtitle = data.SUBTITLE || data.subtitle || 'El <span class="highlight">94%</span> de hackers NUNCA las encuentra';
    const category = data.CATEGORY || data.category || 'CLASIFICADO';
    const slideIndex = data.SLIDE_INDEX || 1;
    const totalSlides = data.TOTAL_SLIDES || 5;

    // Title Formatting Logic — Clean colon prefixes
    let cleanTitle = rawTitle;
    if (cleanTitle.includes(':')) {
        const parts = cleanTitle.split(':');
        if (parts.length > 1) cleanTitle = parts.slice(1).join(':').trim();
    }
    if (!cleanTitle) cleanTitle = rawTitle;

    // ── DYNAMIC FONT SIZE based on word count ──
    // 5 words → 120px, 8 words → 100px, 12 words → 80px, 15+ words → 70px
    function calcTitleSize(text) {
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount <= 5) return 120;
        if (wordCount >= 15) return 70;
        return Math.round(120 - ((wordCount - 5) * 5));
    }

    const titleFontSize = calcTitleSize(cleanTitle);

    function formatTitle(titleStr) {
        // 0. Robust Decode: Handle multiple levels of escaping
        let decoded = titleStr;
        const txt = document.createElement("textarea");
        for (let i = 0; i < 3; i++) {
            if (!decoded || !decoded.includes('&')) break;
            txt.innerHTML = decoded;
            decoded = txt.value;
        }
        decoded = decoded.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

        // 1. Security: Escape HTML
        let safeStr = TemplateUtils.escapeHTML(decoded);

        // Check for manual stars *before* processing lines
        const hasManualHighlight = safeStr.includes('*');

        // 2. Smart Line Breaking — max 4 words per line, break on long words
        const words = safeStr.split(/\s+/).filter(w => w.length > 0);
        const maxWordsPerLine = words.length <= 6 ? 3 : 4;
        const lines = [];
        let currentLine = [];

        for (let i = 0; i < words.length; i++) {
            currentLine.push(words[i]);
            if (currentLine.length >= maxWordsPerLine ||
                (words[i].length > 10 && currentLine.length >= 2)) {
                lines.push(currentLine.join(' '));
                currentLine = [];
            }
        }
        if (currentLine.length > 0) lines.push(currentLine.join(' '));

        let joinedLines = lines.join('<br>');

        // 3. Keyword Highlighting
        if (hasManualHighlight) {
            // AI marked keywords with *asterisks*
            return joinedLines.replace(/\*([^\*]+)\*/g, '<span class="highlight">$1</span>');
        } else {
            // Auto-detect keywords
            const keywords = /\b(HACKING|HACKER|KALI|LINUX|SHODAN|NMAP|WIFI|PASSWORD|CRACK|HIDDEN|SECRET|DARK|DEEP|WEB|TOR|VPN|PROXY|ROOT|ADMIN|SYSTEM|ERROR|ZERO|DAY|EXPLOIT|PAYLOAD|ATTACK|DEFENSE|CTF|OSINT|PHISHING|MALWARE|RANSOMWARE|VIRUS|TROJAN|BACKDOOR|ROOTKIT|INJECTION|XSS|CSRF|RCE|VULNERABILITY|BREACH|FORENSIC|PYTHON|BASH|POWERSHELL|CODE|SCRIPT|DOCKER|FIREWALL|SIEM|CONTROL|INVISIBLE|INDETECTABLE|PELIGRO|SECRETO|OCULTO)\b/i;

            let html = joinedLines.replace(new RegExp(keywords, 'gi'), match => `<span class="highlight">${match}</span>`);
            html = html.replace(/(\d+%?)/g, match => `<span class="highlight">${match}</span>`);

            // FALLBACK: If no highlights, pick the 2-3 most impactful words
            if (!html.includes('class="highlight"')) {
                const plainWords = safeStr.replace(/\*/g, '').split(/\s+/).filter(w => w.length > 3);
                const sorted = [...plainWords].sort((a, b) => b.length - a.length);
                const toHighlight = sorted.slice(0, Math.min(3, sorted.length));
                for (const word of toHighlight) {
                    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    html = html.replace(new RegExp(`\\b${escaped}\\b`, 'i'), `<span class="highlight">${word}</span>`);
                }
            }

            return html;
        }
    }

    const titleHtml = formatTitle(cleanTitle);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <!-- Fonts and base styles injected by TemplateEngine -->
    <style>${themeCSS}</style>
    <style>
        /* Template Specific Adjustments */
        .cover-header {
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(10,10,10,0.8);
            padding: 20px 30px;
            border-left: 5px solid var(--accent-color);
            margin-bottom: 20px; /* Reduced from 40px */
            backdrop-filter: blur(5px);
        }
        .cover-cat { font-family: var(--font-mono); font-size: 48px; font-weight: 800; color: var(--accent-color); letter-spacing: 2px; }
        .cover-status { font-family: var(--font-mono); font-size: 41px; color: var(--success-color); display: flex; align-items: center; gap: 10px; }
        
        .brand-header-custom {
            display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 30px;
        }
    </style>
</head>
<body>

    <!-- Backgrounds -->
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <!-- Backgrounds -->
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <!-- 0. EFFECT ZONES: Circuit Board Pattern -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; opacity: 0.25; background: var(--primary-color); -webkit-mask-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M0 50h30l20-20h20l20-20h10M0 20h20l20 20h20l20 20h20M30 100V70l20-20h20l20 20v30M10 100V80l20-20h20l20 20h30'/%3E%3Ccircle cx='30' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='10' r='3' fill='%23000'/%3E%3Ccircle cx='20' cy='20' r='3' fill='%23000'/%3E%3Ccircle cx='80' cy='60' r='3' fill='%23000'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='70' r='3' fill='%23000'/%3E%3Ccircle cx='10' cy='80' r='3' fill='%23000'/%3E%3Ccircle cx='70' cy='80' r='3' fill='%23000'/%3E%3C/g%3E%3C/svg%3E&quot;); -webkit-mask-size: 150px 150px;"></div>
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; opacity: 0.1; background: var(--accent-color); -webkit-mask-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M0 50h30l20-20h20l20-20h10M0 20h20l20 20h20l20 20h20M30 100V70l20-20h20l20 20v30M10 100V80l20-20h20l20 20h30'/%3E%3Ccircle cx='30' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='10' r='3' fill='%23000'/%3E%3Ccircle cx='20' cy='20' r='3' fill='%23000'/%3E%3Ccircle cx='80' cy='60' r='3' fill='%23000'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='70' r='3' fill='%23000'/%3E%3Ccircle cx='10' cy='80' r='3' fill='%23000'/%3E%3Ccircle cx='70' cy='80' r='3' fill='%23000'/%3E%3C/g%3E%3C/svg%3E&quot;); -webkit-mask-size: 250px 250px; transform: rotate(180deg) scale(-1, 1);"></div>
    
    <!-- 1. TOP SAFE ZONE BLOCK: Centered Brand Logo -->
    <div style="position: absolute; top: 200px; left: 50%; transform: translateX(-50%); z-index: 10; width: 100%; display: flex; align-items: center; justify-content: center;">
        <div style="display:flex; align-items:center; justify-content:center; gap:15px; font-family: var(--font-mono); font-weight:800; color:#fff; font-size:45px; letter-spacing:4px; text-shadow: 0 0 15px rgba(255,255,255,0.3);">
            <img src="../assets/kr-clidn-logo-small.png" style="height:70px; width:auto;"/>
            KR-CLIDN
        </div>
    </div>

    <!-- 2. CENTER BLOCK: Title (Vertically & Horizontally Centered) -->
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 95%; text-align: center; z-index: 20;">
        <h1 class="cyber-title" style="
            text-align: center; 
            text-transform: uppercase; 
            font-family: var(--font-military); 
            font-size: ${titleFontSize}px;
            line-height: 1.1;
            margin: 0;
            padding: 0 20px;
            text-shadow: 4px 4px 0px #000;
            color: #fff;
            letter-spacing: 2px;
        ">
            ${TemplateUtils.renderEditable('TITLE', titleHtml, data._overrides)}
        </h1>
    </div>

    <!-- 3. BOTTOM BLOCK: Terminal & Hex (Fixed at 200px from Bottom) -->
    <div style="position: absolute; bottom: 200px; left: 50%; transform: translateX(-50%); width: calc(100% - 100px); z-index: 10;">
        <!-- Terminal Preview -->
        <div class="terminal-window" style="
            border: 2px solid var(--primary-color);
            box-shadow: 0 0 20px color-mix(in srgb, var(--primary-color) 20%, transparent), inset 0 0 20px color-mix(in srgb, var(--primary-color) 5%, transparent);
            background: rgba(5, 5, 5, 0.95);
        ">
            <div class="term-header" style="border-bottom: 1px solid var(--primary-color); background: color-mix(in srgb, var(--primary-color) 10%, transparent);">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
                <span style="margin-left: 10px; color: var(--primary-color); font-family: var(--font-mono); font-weight:bold; letter-spacing:1px;">kali_secrets.sh</span>
            </div>
            <div class="term-body" style="text-align: center; color: #ffffff; padding: 30px;">
                <div style="font-size: 41px; line-height: 1.5; font-family: var(--font-mono);">
                    ${TemplateUtils.renderEditable('SUBTITLE', `<div>${subtitle}</div>`, data._overrides)}
                </div>
            </div>
        </div>

        <!-- Hex Ornament -->
        <div style="
            display: flex; align-items: center; justify-content: center; gap: 15px; 
            font-family: var(--font-mono); font-size: 34px; 
            color: var(--primary-color); opacity: 0.6;
            margin-top: 20px;
        ">
            <div style="height: 1px; width: 40px; background: var(--primary-color);"></div>
            <div style="letter-spacing: 2px;">0x4B414C49</div> 
            <div style="width: 6px; height: 6px; background: var(--accent-color); transform: rotate(45deg);"></div>
            <div style="letter-spacing: 2px;">0x534543</div>
            <div style="height: 1px; width: 40px; background: var(--primary-color);"></div>
        </div>
    </div>

    <!-- System Footer (Absolute, ignored by flex center) -->
    <div style="position: absolute; bottom: 40px; opacity: 0.5; font-size: 34px; font-family: var(--font-mono); letter-spacing: 4px; text-align: center; width: 100%;">
        AWAITING INPUT...
    </div>

    <!-- Auto Fit Script -->
    ${TemplateUtils.getAutoFitScript()}
    
    <!-- Script injection is no longer needed since effects are static -->

</body>
</html>`;
}