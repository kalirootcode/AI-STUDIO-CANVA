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
            <div style="min-width:48px; height:48px; background:linear-gradient(135deg, var(--primary-color), var(--secondary-color)); border-radius:12px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:41px; font-weight:800; color:#000;">
                ${esc(s.NUM)}
            </div>
            <div style="flex:1;">
                <div style="font-size:41px; font-weight:700; color:#fff; margin-bottom:8px;">${esc(s.TITLE)}</div>
                <div class="terminal-window" style="margin-bottom: 8px; border-width: 1px;">
                    <div class="term-header" style="border-bottom: 1px solid var(--primary-color);">
                        <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                    </div>
                    <div class="term-body" style="font-family:var(--font-mono); font-size: 41px; color:var(--primary-color); padding: 12px; font-weight: 700;">
                        ${esc(s.CMD)}
                    </div>
                </div>
                <div style="font-size: 41px; color:#ffffff; display:flex; align-items:center; gap:8px;">
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

        <h1 class="cyber-title" style="font-size:71px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}</div>

        <!-- Steps -->
        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
            ${stepsHTML}
        </div>

        <!-- Final Note -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:center; border-color:rgba(16,185,129,0.15);">
            <span style="font-size:41px;">✅</span>
            <span style="font-size: 41px; color:var(--success-color); line-height:1.5;">${esc(d.FINAL_NOTE)}</span>
        </div>

        <!-- Footer -->
        
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
