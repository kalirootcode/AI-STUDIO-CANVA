/**
 * KR-CLIDN-03: FEATURE CARDS — Options Grid (Refactored)
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Opciones Esenciales',
        INTRO_TEXT: data.INTRO_TEXT || 'Las opciones más importantes',
        TIP_TITLE: data.TIP_TITLE || 'Pro Tip',
        TIP_CONTENT: data.TIP_CONTENT || 'Combina opciones para mejor resultado',
        OPTIONS: data.OPTIONS || [
            { FLAG: '-sS', NAME: 'SYN Scan', ICON: '⚡', DESCRIPTION: 'Escaneo sigiloso' },
            { FLAG: '-sV', NAME: 'Version', ICON: 'ℹ️', DESCRIPTION: 'Detecta versiones' }
        ]
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-03</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="flex-col">
            <h1 class="cyber-title">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
            <div class="cyber-subtitle">${esc(d.INTRO_TEXT)}</div>
        </div>

        <!-- Options Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1;">
            ${d.OPTIONS.map((o, i) => `
            <div class="glass-panel" style="animation: fadeInUp 0.4s ease backwards; animation-delay: ${i * 0.08}s;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                    <span style="font-size: 28px;">${o.ICON || '⚡'}</span>
                    <span class="mono" style="font-size: 28px; font-weight: 800; color: var(--primary-color);">${esc(o.FLAG)}</span>
                </div>
                <div class="mono" style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 8px;">${esc(o.NAME)}</div>
                <div style="font-size: 20px; color: #94a3b8; line-height: 1.4;">${esc(o.DESCRIPTION)}</div>
            </div>`).join('')}
        </div>

        <!-- Tip -->
        <div class="glass-panel" style="border-color: var(--warning-color);">
            <div class="mono" style="font-size: 22px; font-weight: 700; color: var(--warning-color); margin-bottom: 8px;">💡 ${esc(d.TIP_TITLE)}</div>
            <div style="font-size: 20px; color: #94a3b8;">${esc(d.TIP_CONTENT)}</div>
        </div>

        <!-- Footer -->
        <div style="margin-top: auto; display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // OPTIONS</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
    <style>
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</body>
</html>`;
}
