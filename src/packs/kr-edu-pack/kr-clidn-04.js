/**
 * KR-CLIDN-04: TERMINAL OUTPUT — Output Analysis (Refactored)
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Entendiendo la Salida',
        COMMAND: data.COMMAND || '',
        WARNING_TEXT: data.WARNING_TEXT || 'Interpretar correctamente la salida es clave.',
        OUTPUT_LINES: data.OUTPUT_LINES || [
            { TEXT: 'PORT   STATE SERVICE', HIGHLIGHT: 'STATE' },
            { TEXT: '22/tcp open  ssh', HIGHLIGHT: 'open' }
        ],
        BREAKDOWN_CARDS: data.BREAKDOWN_CARDS || [
            { NUMBER: '1', TITLE: 'Puerto', CONTENT_HTML: 'Número de puerto y protocolo' }
        ]
    };

    const outputHTML = d.OUTPUT_LINES.map(line => {
        let text = esc(line.TEXT || '');
        if (line.HIGHLIGHT) {
            const safeHL = esc(line.HIGHLIGHT);
            text = text.replace(safeHL, `<span class="highlight">${safeHL}</span>`);
        }
        return `<div>${text}</div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-04</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="flex-col">
            <h1 class="cyber-title">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        </div>

        <!-- Warning -->
        <div class="glass-panel" style="display: flex; align-items: center; gap: 16px; border-color: var(--accent-color);">
            <span style="font-size: 48px; color: var(--accent-color);">⚠️</span>
            <span style="font-size: 41px; color: var(--accent-color);">${TemplateUtils.renderEditable('WARNING', `${esc(d.WARNING_TEXT)}`, data._overrides)}</span>
        </div>

        <!-- Terminal -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
                <span style="margin-left: 12px; color: #ffffff;" class="mono">terminal</span>
            </div>
            <div class="term-body" style="line-height: 1.4;">
                ${d.COMMAND ? `<div><span style="color:var(--success-color); font-weight:700;">$</span> <span style="color:var(--primary-color); font-weight:700;">${TemplateUtils.renderEditable('COMMAND', `${esc(d.COMMAND)}`, data._overrides)}</span></div><br>` : ''}
                ${outputHTML}
            </div>
        </div>

        <!-- Breakdown Cards -->
        <div class="flex-col" style="gap: 14px;">
            ${d.BREAKDOWN_CARDS.map((c, i) => `
            <div class="glass-panel" style="display: flex; align-items: flex-start; gap: 20px; padding: 20px; animation: fadeInUp 0.4s ease backwards; animation-delay: ${i * 0.1}s;">
                <div style="background: linear-gradient(135deg, var(--primary-color), #7c3aed); color: #000; width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 41px; flex-shrink: 0;" class="mono">${c.NUMBER}</div>
                <div>
                    <div class="mono" style="font-size: 41px; font-weight: 600; color: var(--primary-color); margin-bottom: 6px;">${esc(c.TITLE)}</div>
                    <div style="font-size: 41px; color: #ffffff; line-height: 1.5;">${esc(c.CONTENT_HTML)}</div>
                </div>
            </div>`).join('')}
        </div>
            
        </div>

    <style>
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
