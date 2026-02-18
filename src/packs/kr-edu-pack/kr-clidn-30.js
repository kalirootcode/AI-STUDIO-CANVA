/**
 * KR-CLIDN-30: MINI TUTORIAL (Refactored)
 * Tutorial compacto de 3 pasos en un solo slide
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Mini Tutorial',
        DESCRIPTION: data.DESCRIPTION || 'Aprende este proceso en 3 pasos rápidos.',
        STEPS: data.STEPS || [
            { NUM: '1', TITLE: 'Abre la terminal', CMD: '$ Ctrl+Alt+T', RESULT: 'Se abre una ventana de terminal' },
            { NUM: '2', TITLE: 'Actualiza el sistema', CMD: '$ sudo apt update', RESULT: 'Se descargan las listas de paquetes' },
            { NUM: '3', TITLE: 'Instala la herramienta', CMD: '$ sudo apt install nmap', RESULT: 'nmap quedará instalado y listo' }
        ],
        FINAL_NOTE: data.FINAL_NOTE || '¡Listo! Ahora puedes usar nmap desde tu terminal.'
    };

    const stepsHTML = d.STEPS.map(s => `
        <div class="glass-panel" style="display:flex; gap:20px; align-items:flex-start; padding:20px 24px;">
            <div style="min-width:48px; height:48px; background:linear-gradient(135deg, var(--primary-color), var(--secondary-color)); border-radius:12px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:24px; font-weight:800; color:#000;">
                ${esc(s.NUM)}
            </div>
            <div style="flex:1;">
                <div style="font-size:24px; font-weight:700; color:#fff; margin-bottom:8px;">${esc(s.TITLE)}</div>
                <div style="font-family:var(--font-mono); font-size:20px; color:var(--primary-color); background:#0a0a0a; padding:8px 14px; border-radius:6px; border:1px solid rgba(0,217,255,0.1); margin-bottom:8px; display:inline-block;">
                    ${esc(s.CMD)}
                </div>
                <div style="font-size:18px; color:#64748b; display:flex; align-items:center; gap:8px;">
                    <span style="color:var(--success-color);">→</span> ${esc(s.RESULT)}
                </div>
            </div>
        </div>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-30</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:42px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}</div>

        <!-- Steps -->
        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
            ${stepsHTML}
        </div>

        <!-- Final Note -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:center; border-color:rgba(16,185,129,0.15);">
            <span style="font-size:24px;">✅</span>
            <span style="font-size:22px; color:var(--success-color); line-height:1.5;">${esc(d.FINAL_NOTE)}</span>
        </div>

        <!-- Footer -->
        <div style="display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // TUTORIAL</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
