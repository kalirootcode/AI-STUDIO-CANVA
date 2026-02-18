/**
 * KR-CLIDN-17: CHECKLIST (Refactored)
 * Lista de requisitos, pasos o verificaciones
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Checklist',
        DESCRIPTION: data.DESCRIPTION || 'Verifica estos requisitos antes de continuar.',
        CHECK_ITEMS: data.CHECK_ITEMS || [
            { TEXT: 'Kali Linux instalado', CHECKED: true },
            { TEXT: 'Terminal abierta', CHECKED: true },
            { TEXT: 'Conexión a red', CHECKED: false },
            { TEXT: 'Permisos root', CHECKED: false }
        ],
        NOTE: data.NOTE || 'Todos los items deben completarse antes de comenzar.'
    };

    const checksHTML = d.CHECK_ITEMS.map(c => `
        <div class="glass-panel" style="display:flex; align-items:center; gap:16px; padding:14px 18px; ${c.CHECKED ? 'border-color:rgba(0,255,136,0.15);' : ''}">
            <span style="font-size:24px; color:${c.CHECKED ? 'var(--success-color)' : 'rgba(255,255,255,0.2)'};">${c.CHECKED ? '☑' : '☐'}</span>
            <span style="font-size:22px; color:${c.CHECKED ? '#e2e8f0' : '#94a3b8'}; line-height:1.4;">${esc(c.TEXT)}</span>
        </div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-17</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="mono" style="font-size:22px; color:var(--primary-color); letter-spacing:3px; margin-bottom:12px;">// Checklist</div>
        <h1 class="cyber-title" style="font-size:42px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}</div>

        <!-- Check Items -->
        ${checksHTML}

        <!-- Note -->
        <div class="glass-panel" style="display:flex; gap:12px; align-items:center; border-color:rgba(37,99,235,0.15);">
            <span style="font-size:24px;">ℹ️</span>
            <span style="font-size:20px; color:#94a3b8;">${esc(d.NOTE)}</span>
        </div>

        <!-- Footer -->
        <div style="margin-top:auto; display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // CHECK</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
