/**
 * KR-CLIDN-02: ANATOMÍA — Command Structure (Refactored)
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Anatomía del Comando',
        COMMAND_STRUCTURE: data.COMMAND_STRUCTURE || 'comando [opciones] objetivo',
        TIP: data.TIP || 'Los elementos entre [ ] son opcionales',
        COMPONENTS: data.COMPONENTS || [
            { NUMBER: '1', NAME: 'comando', DESCRIPTION: 'Binario principal' },
            { NUMBER: '2', NAME: '[opciones]', DESCRIPTION: 'Flags modificadores' },
            { NUMBER: '3', NAME: 'objetivo', DESCRIPTION: 'Target a escanear' }
        ]
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-02</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="flex-col">
            <h1 class="cyber-title">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
            <div class="cyber-subtitle">// ANATOMÍA — ${d.COMPONENTS.length} PARTES</div>
        </div>

        <!-- Command Box -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
            </div>
            <div class="term-body" style="font-size: 48px; font-weight: 700; color: var(--primary-color);">
                <span style="color: var(--success-color);">$</span> ${esc(d.COMMAND_STRUCTURE)}
            </div>
        </div>

        <!-- Components -->
        <div class="flex-col" style="gap: 16px; flex: 1;">
            ${d.COMPONENTS.map((c, i) => `
            <div class="glass-panel" style="display: flex; align-items: center; gap: 20px; padding: 24px; animation: fadeInUp 0.4s ease backwards; animation-delay: ${i * 0.1}s;">
                <div style="background: var(--primary-color); color: #000; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 41px; flex-shrink: 0;" class="mono">${c.NUMBER}</div>
                <div>
                    <div class="mono" style="font-size: 48px; font-weight: 700; color: #fff; margin-bottom: 4px;">${esc(c.NAME)}</div>
                    <div style="font-size: 41px; color: #ffffff;">${esc(c.DESCRIPTION)}</div>
                </div>
            </div>`).join('')}
        </div>

        <!-- Tip -->
        <div class="glass-panel" style="display: flex; gap: 16px; align-items: center; border-color: var(--warning-color);">
            <span style="font-size: 54px;">💡</span>
            <span style="font-size: 41px; color: #ffffff;">${TemplateUtils.renderEditable('TIP', `${esc(d.TIP)}`, data._overrides)}</span>
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
