/**
 * KR-CLIDN-39: DENSE REFERENCE (Cheatsheet)
 * Maximum-density command reference in a 2-column grid. Monospace throughout.
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Nmap Cheatsheet',
        CATEGORY: data.CATEGORY || 'Red',
        SECTIONS: data.SECTIONS || [
            {
                HEADER: 'Escaneo Básico',
                COMMANDS: [
                    { CMD: 'nmap target', DESC: 'Escaneo por defecto' },
                    { CMD: 'nmap -sV target', DESC: 'Detectar versiones' }
                ]
            },
            {
                HEADER: 'Escaneo Avanzado',
                COMMANDS: [
                    { CMD: 'nmap -O target', DESC: 'Detectar OS' },
                    { CMD: 'nmap -A target', DESC: 'Escaneo agresivo' }
                ]
            }
        ],
        NOTE: data.NOTE || 'Siempre con autorización. Uso responsable.'
    };

    const sectionsHTML = d.SECTIONS.map(s => {
        const cmdsHTML = s.COMMANDS.map(c => `
            <div style="display:flex; flex-direction:column; gap:4px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                <span style="font-size:38px; color:#aaa; line-height:1.2;"># ${esc(c.DESC)}</span>
                <code style="font-family:var(--font-mono); font-size:38px; color:var(--primary-color); font-weight:700;">$ ${esc(c.CMD)}</code>
            </div>`).join('\n');

        return `
        <div class="terminal-window" style="margin-bottom:16px; border-width:1px;">
            <div class="term-header" style="border-bottom:1px solid var(--primary-color); justify-content:flex-start; gap:12px;">
                <div style="display:flex; gap:6px;">
                    <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                </div>
                <div class="mono" style="font-size:38px; color:var(--warning-color); font-weight:700; letter-spacing:1px;">${esc(s.HEADER)}</div>
            </div>
            <div class="term-body" style="padding:12px 20px;">
                ${cmdsHTML}
            </div>
        </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-39</title>
    <style>
        .dense-container {
            flex: 1; background: rgba(5,5,10,0.8);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px; padding: 20px 24px;
            overflow: hidden;
        }
        .dense-header {
            display: flex; align-items: center; justify-content: space-between;
            padding-bottom: 10px; border-bottom: 2px solid color-mix(in srgb, var(--primary-color) 20%, transparent);
            margin-bottom: 12px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="mono" style="font-size:38px; color:var(--primary-color); letter-spacing:3px; margin-bottom:8px;">📋 REFERENCIA RÁPIDA</div>

        <!-- Dense Container -->
        <div class="dense-container">
            <div class="dense-header">
                <span class="mono" style="font-size:48px; font-weight:800; color:#fff;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</span>
                <span class="mono" style="font-size:38px; color:var(--primary-color); background:rgba(0,217,255,0.08); padding:4px 10px; border-radius:6px;">${esc(d.CATEGORY)}</span>
            </div>
            ${sectionsHTML}
        </div>

        <!-- Note -->
        <div style="display:flex; gap:8px; align-items:center;">
            <span style="font-size:38px;">⚠️</span>
            <span class="mono" style="font-size:38px; color:#666;">${esc(d.NOTE)}</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
