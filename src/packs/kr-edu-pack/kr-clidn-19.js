/**
 * KR-CLIDN-19: TABLE OF CONTENTS (Refactored)
 * Índice para posts largos tipo libro
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Contenido',
        SUBTITLE: data.SUBTITLE || 'Lo que aprenderás en este post',
        ITEMS: data.ITEMS || [
            { NUMBER: '01', TEXT: 'Introducción', RANGE: '03-04' },
            { NUMBER: '02', TEXT: 'Conceptos básicos', RANGE: '05-10' },
            { NUMBER: '03', TEXT: 'Práctica', RANGE: '11-15' },
            { NUMBER: '04', TEXT: 'Resumen', RANGE: '16' }
        ],
        TOTAL_SLIDES: data.TOTAL_SLIDES || '16'
    };

    const itemsHTML = d.ITEMS.map(i => `
        <div class="glass-panel" style="display:flex; align-items:center; gap:14px; padding:12px 16px;">
            <span class="mono" style="font-size:26px; font-weight:700; color:var(--primary-color); min-width:36px;">${esc(i.NUMBER)}</span>
            <span style="font-size:22px; color:#e2e8f0; font-weight:500; flex:1;">${esc(i.TEXT)}</span>
            <span style="flex:1; border-bottom:2px dotted rgba(255,255,255,0.08);"></span>
            <span class="mono" style="font-size:20px; color:rgba(255,255,255,0.3);">${esc(i.RANGE)}</span>
        </div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-19</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="mono" style="font-size:22px; color:var(--primary-color); letter-spacing:3px; margin-bottom:12px;">// Índice</div>
        <h1 class="cyber-title" style="font-size:42px;">📖 ${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${TemplateUtils.renderEditable('SUBTITLE', `${esc(d.SUBTITLE)}`, data._overrides)}</div>

        <!-- TOC Items -->
        ${itemsHTML}

        <!-- Total -->
        <div class="glass-panel" style="display:flex; align-items:center; justify-content:center; gap:10px; border-color:rgba(37,99,235,0.12);">
            <span style="font-size:24px;">📄</span>
            <span class="mono" style="font-size:22px; color:#94a3b8;">Total: <strong style="color:var(--primary-color);">${esc(d.TOTAL_SLIDES)} slides</strong></span>
        </div>

        <!-- Footer -->
        <div style="margin-top:auto; display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // TOC</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
