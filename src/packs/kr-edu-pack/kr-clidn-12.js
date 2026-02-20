/**
 * KR-CLIDN-12: COMPARACIÓN / VS (Refactored)
 * Side-by-side comparison of two tools or concepts
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Comparación',
        LEFT_NAME: data.LEFT_NAME || 'Opción A',
        LEFT_ITEMS: data.LEFT_ITEMS || [
            { TEXT: 'Característica 1' }, { TEXT: 'Característica 2' }, { TEXT: 'Característica 3' }
        ],
        RIGHT_NAME: data.RIGHT_NAME || 'Opción B',
        RIGHT_ITEMS: data.RIGHT_ITEMS || [
            { TEXT: 'Característica 1' }, { TEXT: 'Característica 2' }, { TEXT: 'Característica 3' }
        ],
        VERDICT: data.VERDICT || 'Ambas son herramientas complementarias.'
    };

    const renderItems = (items, color) => items.map(i => `
        <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:10px;">
            <span style="color:${color}; font-size: 41px; margin-top:3px;">✓</span>
            <span style="font-size: 41px; color:#ffffff; line-height:1.4;">${esc(i.TEXT)}</span>
        </div>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-12</title>
    <style>
        .vs-grid { display: flex; gap: 20px; position: relative; }
        .vs-card {
            flex: 1; background: rgba(10,10,10,0.9);
            border-radius: 16px; padding: 20px; position: relative;
        }
        .vs-card.left { border: 1px solid rgba(0,217,255,0.2); }
        .vs-card.left::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,var(--primary-color),transparent); }
        .vs-card.right { border: 1px solid rgba(0,255,136,0.2); }
        .vs-card.right::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,var(--success-color),transparent); }
        .vs-badge {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10;
            width: 56px; height: 56px; background: linear-gradient(135deg, #ff9500, var(--accent-color));
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-family: var(--font-mono); font-size: 41px; font-weight: 800; color: #fff;
            box-shadow: 0 0 25px rgba(255,149,0,0.4);
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="mono" style="font-size: 41px; color:#ff9500; letter-spacing:3px; margin-bottom:12px;">// Comparación</div>
        <h1 class="cyber-title" style="font-size:75px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- VS Cards -->
        <div class="vs-grid">
            <div class="vs-badge">VS</div>
            <div class="vs-card left">
                <div class="mono" style="font-size:41px; font-weight:700; color:var(--primary-color); margin-bottom:18px;">${esc(d.LEFT_NAME)}</div>
                ${renderItems(d.LEFT_ITEMS, 'var(--primary-color)')}
            </div>
            <div class="vs-card right">
                <div class="mono" style="font-size:41px; font-weight:700; color:var(--success-color); margin-bottom:18px;">${esc(d.RIGHT_NAME)}</div>
                ${renderItems(d.RIGHT_ITEMS, 'var(--success-color)')}
            </div>
        </div>

        <!-- Verdict -->
        <div class="glass-panel" style="display:flex; align-items:center; gap:14px; border-color:rgba(255,149,0,0.15);">
            <span style="font-size:44px;">⚖️</span>
            <span style="font-size: 41px; color:#e2e8f0; line-height:1.4;">${esc(d.VERDICT)}</span>
        </div>
            
        </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
