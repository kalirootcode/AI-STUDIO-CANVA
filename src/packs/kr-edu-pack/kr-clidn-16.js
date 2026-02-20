/**
 * KR-CLIDN-16: DO vs DON'T (Refactored)
 * Buenas vs malas prácticas side-by-side
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Buenas Prácticas',
        DO_ITEMS: data.DO_ITEMS || [
            { TEXT: 'Pide autorización antes de escanear' },
            { TEXT: 'Documenta tus hallazgos' }
        ],
        DONT_ITEMS: data.DONT_ITEMS || [
            { TEXT: 'Escanear redes sin autorización' },
            { TEXT: 'Compartir vulnerabilidades públicamente' }
        ],
        BOTTOM_TIP: data.BOTTOM_TIP || 'La ética es lo que diferencia a un hacker de un criminal.'
    };

    const renderList = (items, icon, color) => items.map(i => `
        <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:10px;">
            <span style="color:${color}; font-size: 41px; margin-top:2px;">${icon}</span>
            <span style="font-size: 41px; color:#ffffff; line-height:1.4;">${esc(i.TEXT)}</span>
        </div>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-16</title>
    <style>
        .do-dont-grid { display: flex; gap: 20px; }
        .do-dont-card {
            flex: 1; background: rgba(10,10,10,0.9);
            border-radius: 16px; padding: 20px; position: relative;
        }
        .do-dont-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
        .do-col { border: 1px solid rgba(0,255,136,0.15); }
        .do-col::before { background: linear-gradient(90deg,var(--success-color),transparent); }
        .dont-col { border: 1px solid rgba(255,51,102,0.15); }
        .dont-col::before { background: linear-gradient(90deg,var(--accent-color),transparent); }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="mono" style="font-size: 41px; color:#ff9500; letter-spacing:3px; margin-bottom:12px;">// BUENAS PRÁCTICAS</div>
        <h1 class="cyber-title" style="font-size:75px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- DO / DON'T Columns -->
        <div class="do-dont-grid">
            <div class="do-dont-card do-col">
                <div class="mono" style="font-size:41px; font-weight:700; color:var(--success-color); margin-bottom:18px;">HACER ✓</div>
                ${renderList(d.DO_ITEMS, '✓', 'var(--success-color)')}
            </div>
            <div class="do-dont-card dont-col">
                <div class="mono" style="font-size:41px; font-weight:700; color:var(--accent-color); margin-bottom:18px;">EVITAR ✗</div>
                ${renderList(d.DONT_ITEMS, '✗', 'var(--accent-color)')}
            </div>
        </div>

        <!-- Tip -->
        <div class="glass-panel" style="display:flex; gap:12px; align-items:center; border-color:rgba(255,149,0,0.15);">
            <span style="font-size:41px;">⚖️</span>
            <span style="font-size: 41px; color:#e2e8f0; line-height:1.4;">${esc(d.BOTTOM_TIP)}</span>
        </div>
            
        </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
