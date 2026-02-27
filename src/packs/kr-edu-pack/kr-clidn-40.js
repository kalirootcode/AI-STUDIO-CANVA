/**
 * KR-CLIDN-40: HOOK COMPARATIVO — "Lo que crees vs La realidad"
 * TikTok Algorithm: HIGH saves + comments (contrarian content formula)
 * Format: Split screen left/right comparison
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || '¿Usas VPN y crees que eres invisible?',
        MYTH_LABEL: data.MYTH_LABEL || 'LO QUE CREES',
        MYTH_ICON: data.MYTH_ICON || '❌',
        MYTH_POINTS: data.MYTH_POINTS || [
            'Tu IP está oculta completamente',
            'Nadie puede rastrearte',
            'El tráfico DNS está cifrado'
        ],
        REALITY_LABEL: data.REALITY_LABEL || 'LA REALIDAD',
        REALITY_ICON: data.REALITY_ICON || '⚡',
        REALITY_POINTS: data.REALITY_POINTS || [
            'La VPN ve TODO tu tráfico',
            'DNS leaks revelan tus sitios',
            'Tu ISP sabe que usas VPN'
        ],
        BOTTOM_LINE: data.BOTTOM_LINE || 'La VPN no es anonimato. Es cambiar a quién le confías tus datos.',
        CATEGORY: data.CATEGORY || 'MITO DESMONTADO'
    };

    const mythItems = d.MYTH_POINTS.map(p =>
        `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <span style="color:#ff4466;font-size:38px;flex-shrink:0;">✗</span>
            <span style="font-size:38px;color:#ccc;line-height:1.3;">${esc(p)}</span>
        </div>`
    ).join('');

    const realityItems = d.REALITY_POINTS.map(p =>
        `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
            <span style="color:var(--success-color);font-size:38px;flex-shrink:0;">✓</span>
            <span style="font-size:38px;color:#e0e0f0;line-height:1.3;">${esc(p)}</span>
        </div>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-40</title>
    <style>
        .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 14px 0; }
        .compare-col {
            padding: 18px; border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .col-myth { background: rgba(255,68,102,0.08); border-color: rgba(255,68,102,0.25); }
        .col-reality { background: rgba(0,255,157,0.06); border-color: rgba(0,255,157,0.2); }
        .col-header {
            display: flex; align-items: center; gap: 8px;
            margin-bottom: 14px; padding-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .divider {
            position: absolute; left: 50%; top: 0; bottom: 0;
            width: 2px; background: linear-gradient(to bottom, transparent, rgba(0,217,255,0.6), transparent);
            transform: translateX(-50%);
        }
        .bottom-line {
            padding: 14px 18px;
            background: rgba(0,217,255,0.06);
            border: 1px solid rgba(0,217,255,0.2);
            border-radius: 10px;
            font-size: 38px; color: var(--primary-color);
            line-height: 1.4; text-align: center;
        }
        .category-badge {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 5px 12px;
            background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.3);
            border-radius: 6px; margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="category-badge">
            <span style="font-size:38px;">🔥</span>
            <span class="mono" style="font-size:38px;color:var(--warning-color);letter-spacing:2px;">${esc(d.CATEGORY)}</span>
        </div>

        <h1 class="cyber-title" style="font-size:78px;margin-bottom:14px;">
            ${TemplateUtils.renderEditable('TITLE', esc(d.TITLE), data._overrides)}
        </h1>

        <div class="compare-grid" style="position:relative;">
            <!-- Myth Column -->
            <div class="compare-col col-myth">
                <div class="col-header">
                    <span style="font-size:44px;">${esc(d.MYTH_ICON)}</span>
                    <span class="mono" style="font-size:38px;color:#ff4466;font-weight:700;letter-spacing:2px;">${esc(d.MYTH_LABEL)}</span>
                </div>
                ${mythItems}
            </div>

            <!-- Reality Column -->
            <div class="compare-col col-reality">
                <div class="col-header">
                    <span style="font-size:44px;">${esc(d.REALITY_ICON)}</span>
                    <span class="mono" style="font-size:38px;color:var(--success-color);font-weight:700;letter-spacing:2px;">${esc(d.REALITY_LABEL)}</span>
                </div>
                ${realityItems}
            </div>
        </div>

        <!-- Bottom Line -->
        <div class="bottom-line">
            ${TemplateUtils.renderEditable('BOTTOM_LINE', esc(d.BOTTOM_LINE), data._overrides)}
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
