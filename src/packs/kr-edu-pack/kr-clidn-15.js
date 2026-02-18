/**
 * KR-CLIDN-15: CONCEPTO / DEFINICIÓN (Refactored)
 * Define un término técnico con contexto y ejemplo
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TERM: data.TERM || 'TCP/IP',
        CATEGORY: data.CATEGORY || 'Redes',
        DEFINITION: data.DEFINITION || 'Definición del concepto.',
        KEY_POINTS: data.KEY_POINTS || [
            { ICON: '🔗', TEXT: 'Punto clave 1' },
            { ICON: '🌐', TEXT: 'Punto clave 2' },
            { ICON: '📡', TEXT: 'Punto clave 3' }
        ],
        EXAMPLE: data.EXAMPLE || 'Ejemplo práctico del concepto.'
    };

    const pointsHTML = d.KEY_POINTS.map(p => `
        <div class="glass-panel" style="display:flex; align-items:center; gap:14px; padding:14px 18px;">
            <span style="font-size:24px;">${p.ICON || '✓'}</span>
            <span style="font-size:22px; color:#ffffff; line-height:1.4;">${esc(p.TEXT)}</span>
        </div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-15</title>
    <style>
        .term-name {
            font-family: var(--font-mono); font-size: 48px; font-weight: 800;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; line-height: 1.2; margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="mono" style="font-size:22px; color:var(--secondary-color); letter-spacing:2px; margin-bottom:12px;">// ${esc(d.CATEGORY)}</div>
        <div class="term-name">${esc(d.TERM)}</div>

        <!-- Definition -->
        <div style="font-size:24px; color:#e2e8f0; line-height:1.6; padding-left:14px; border-left:3px solid rgba(168,85,247,0.3); margin-bottom:20px;">
            ${esc(d.DEFINITION)}
        </div>

        <!-- Key Points -->
        ${pointsHTML}

        <!-- Example -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start; border-color:rgba(37,99,235,0.15);">
            <span style="font-size:24px;">▶</span>
            <span style="font-size:22px; color:#ffffff; line-height:1.5;">${esc(d.EXAMPLE)}</span>
        </div>
            
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
