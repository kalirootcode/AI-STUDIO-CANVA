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
            <span class="mono" style="font-size:44px; font-weight:700; color:var(--primary-color); min-width:36px;">${esc(i.NUMBER)}</span>
            <span style="font-size: 41px; color:#e2e8f0; font-weight:500; flex:1;">${esc(i.TEXT)}</span>
            <span style="flex:1; border-bottom:2px dotted rgba(255,255,255,0.08);"></span>
            <span class="mono" style="font-size: 41px; color:rgba(255,255,255,0.3);">${esc(i.RANGE)}</span>
        </div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-19 - Chapter Divider</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; opacity: 0.15; background: radial-gradient(circle at center, var(--primary-color) 0%, transparent 70%);"></div>

    <div class="safe-zone" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
        
        <!-- Chapter Header -->
        <div class="mono" style="font-size: 54px; color:var(--primary-color); letter-spacing:8px; margin-bottom:24px; text-transform:uppercase; opacity:0.8; border-bottom: 2px solid var(--primary-color); padding-bottom:12px;">
            ${TemplateUtils.renderEditable('SUBTITLE', `CAPÍTULO ${esc(d.TOTAL_SLIDES)}`, data._overrides)}
        </div>
        
        <!-- Main Title -->
        <h1 class="cyber-title" style="font-size:110px; line-height:1.2; padding:0 40px; text-shadow: 0 10px 30px rgba(0,0,0,0.8);">
            ${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}
        </h1>

        <!-- Chapter Items (Optional Content Preview) -->
        <div style="margin-top: 60px; display:flex; flex-direction:column; gap:20px; width:80%;">
            ${itemsHTML}
        </div>
        
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
