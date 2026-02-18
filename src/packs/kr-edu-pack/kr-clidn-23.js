/**
 * KR-CLIDN-23: PROCESS FLOW (Refactored)
 * Flujo visual de cómo funciona algo (pasos con flechas)
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Cómo Funciona',
        FLOW_STEPS: data.FLOW_STEPS || [
            { ICON: '⌨️', LABEL: 'Input', DESC: 'El usuario ejecuta el comando' },
            { ICON: '🧠', LABEL: 'Proceso', DESC: 'El kernel interpreta y procesa' },
            { ICON: '💾', LABEL: 'Sistema', DESC: 'Se accede al filesystem' },
            { ICON: '🖥️', LABEL: 'Output', DESC: 'El resultado aparece en terminal' }
        ],
        DESCRIPTION: data.DESCRIPTION || 'Cada comando en Linux sigue este flujo desde la entrada hasta la salida.'
    };

    const flowHTML = d.FLOW_STEPS.map((step, i) => {
        const arrow = i < d.FLOW_STEPS.length - 1
            ? `<div style="display:flex; justify-content:center; padding:8px 0;">
                 <span style="font-size:28px; color:var(--primary-color); opacity:0.5;">▼</span>
               </div>`
            : '';
        return `
            <div class="glass-panel" style="display:flex; align-items:center; gap:20px; padding:20px 24px;">
                <div style="min-width:48px; height:48px; background:rgba(0,217,255,0.08); border:1px solid rgba(0,217,255,0.2); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px;">
                    ${step.ICON}
                </div>
                <div style="flex:1;">
                    <div style="font-family:var(--font-mono); font-size:24px; font-weight:700; color:var(--primary-color); letter-spacing:1px;">${esc(step.LABEL)}</div>
                    <div style="font-size:20px; color:#ffffff; margin-top:4px;">${esc(step.DESC)}</div>
                </div>
                <div class="mono" style="font-size:20px; color:#333; font-weight:700;">${String(i + 1).padStart(2, '0')}</div>
            </div>
            ${arrow}`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-23</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:42px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}</div>

        <!-- Flow Steps -->
        <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
            ${flowHTML}
        </div>

        <!-- Footer -->
        
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
