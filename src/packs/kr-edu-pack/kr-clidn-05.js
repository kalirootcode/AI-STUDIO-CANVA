/**
 * KR-CLIDN-05: GRID / COLUMNAS (Refactored for Cyber System)
 */

export function render(data) {
    // Access global utils
    const TemplateUtils = window.TemplateUtils;
    const d = {
        TITLE: data.TITLE || 'Desglose de Columnas',
        COMMAND: data.COMMAND || '',
        INTRO_TEXT: data.INTRO_TEXT || 'Cada columna tiene un significado específico.',
        OUTPUT_LINES: data.OUTPUT_LINES || [],
        GRID_ITEMS: data.GRID_ITEMS || []
    };

    // Helper to sanitize
    const esc = TemplateUtils.escapeHTML;

    // Generate Layout
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-05</title>
    <!-- Styles injected by TemplateEngine -->
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        <!-- HEADER -->
        <div class="flex-col">
            ${TemplateUtils.renderMetaBadge(data)}
            <h1 class="cyber-title">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
            <div class="cyber-subtitle">${esc(d.INTRO_TEXT)}</div>
        </div>

        <!-- CONTENT -->
        <div class="flex-col" style="gap: 20px;">
            
            <!-- 1. TERMINAL PREVIEW (If command exists) -->
            ${d.COMMAND ? `
            <div class="terminal-window">
                <div class="term-header">
                    <div class="term-dot red"></div>
                    <div class="term-dot yellow"></div>
                    <div class="term-dot green"></div>
                </div>
                <div class="term-body">
                    <span style="color:var(--success-color)">➜</span> <span style="color:#fff">${TemplateUtils.renderEditable('COMMAND', `${esc(d.COMMAND)}`, data._overrides)}</span>
                    <div style="margin-top:8px; color:#ffffff; font-size:0.9em;">
                        ${d.OUTPUT_LINES.map(l => `<div>${esc(l.TEXT)}</div>`).join('')}
                    </div>
                </div>
            </div>` : ''}

            <!-- 2. FLEX SYSTEM (Anteriormente Grid) -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${d.GRID_ITEMS.map((item, i) => `
                <div class="glass-panel" style="animation: fadeInUp 0.5s ease backwards; animation-delay: ${i * 0.1}s; padding:24px;">
                    <div class="flex-center" style="justify-content:flex-start; margin-bottom:16px;">
                        <div style="
                            background:var(--primary-color); color:#000; 
                            width:32px; height:32px; border-radius:6px; 
                            font-weight:800; display:flex; align-items:center; justify-content:center;
                            margin-right:12px;">
                            ${item.NUMBER}
                        </div>
                        <h3 class="mono" style="color:var(--primary-color); font-size:41px;">${esc(item.TITLE)}</h3>
                    </div>
                    <p style="font-size: 41px; color:#ccc; line-height:1.5;">
                        ${esc(item.CONTENT)}
                    </p>
                </div>
                `).join('')}
            </div>

        </div>

        <!-- FOOTER / BRAND -->
            
        </div>

    <!-- UTILS -->
    <!-- UTILS -->
    <style>
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
