/**
 * KR-CLIDN-43: MITO VS REALIDAD — Fact-check format
 * TikTok Algorithm: HIGH comments (people disagree) + HIGH shares (educating others)
 * Format: 3-4 myths busted with verdict badges
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'MITOS de la Ciberseguridad que te ponen en peligro',
        MYTHS: data.MYTHS || [
            {
                MYTH: 'Los antivirus te protegen de todo',
                REALITY: 'Un 0-day elude CUALQUIER antivirus. El hacker tarda 15 min.',
                VERDICT: 'FALSO',
                DANGER: 'CRÍTICO'
            },
            {
                MYTH: 'Solo las grandes empresas son atacadas',
                REALITY: '43% de ciberataques apuntan a PYMES. Son más fáciles.',
                VERDICT: 'FALSO',
                DANGER: 'ALTO'
            },
            {
                MYTH: 'Una contraseña larga es suficiente',
                REALITY: 'Sin 2FA, una contraseña de 20 caracteres se crackea con brechas.',
                VERDICT: 'FALSO',
                DANGER: 'ALTO'
            }
        ],
        CLOSING: data.CLOSING || '¿Cuál de estos mitos creías tú? Comenta 👇',
        CATEGORY: data.CATEGORY || 'FACT CHECK'
    };

    const mythItems = d.MYTHS.map(m => {
        const dangerColor = m.DANGER === 'CRÍTICO' ? '#ff0055' : m.DANGER === 'ALTO' ? '#ff6600' : '#FFB800';

        return `<div class="myth-row">
            <div class="myth-header">
                <span class="myth-tag">MITO</span>
                <span style="font-size:36px;font-weight:700;color:#fff;flex:1;">${esc(m.MYTH)}</span>
                <span class="verdict-badge">${esc(m.VERDICT)}</span>
            </div>
            <div class="reality-body">
                <span style="color:var(--success-color);font-size:34px;margin-right:8px;">✓ REALIDAD:</span>
                <span style="font-size:34px;color:#ccc;line-height:1.4;">${esc(m.REALITY)}</span>
                <span class="danger-badge" style="background:${dangerColor}22;border-color:${dangerColor}44;color:${dangerColor};">⚠ ${esc(m.DANGER)}</span>
            </div>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-43</title>
    <style>
        .category-pill {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 4px 12px; border-radius: 20px;
            background: rgba(255,0,85,0.1); border: 1px solid rgba(255,0,85,0.3);
            margin-bottom: 10px;
        }
        .myth-row {
            margin-bottom: 12px;
            border-radius: 10px; overflow: hidden;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .myth-header {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px;
            background: rgba(255,68,68,0.07);
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .myth-tag {
            font-family: 'JetBrains Mono', monospace;
            font-size: 34px; color: #666; letter-spacing: 1px;
            padding: 2px 6px; border: 1px solid #333; border-radius: 4px;
            white-space: nowrap;
        }
        .verdict-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 34px; font-weight: 900; letter-spacing: 2px;
            padding: 3px 10px; border-radius: 4px;
            background: rgba(255,0,85,0.15); border: 1px solid rgba(255,0,85,0.4);
            color: #ff4466; white-space: nowrap;
        }
        .reality-body {
            padding: 10px 14px;
            background: rgba(0,0,0,0.3);
            display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
        }
        .danger-badge {
            font-size: 34px; font-weight: 700; letter-spacing: 1px;
            padding: 2px 8px; border-radius: 4px; border: 1px solid;
            margin-left: auto;
        }
        .closing-box {
            text-align: center; padding: 14px;
            font-size: 44px; font-weight: 700; color: var(--primary-color);
            border-top: 1px solid rgba(0,217,255,0.15);
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="category-pill">
            <span style="font-size:34px;">🔍</span>
            <span class="mono" style="font-size:34px;color:#ff4466;letter-spacing:2px;font-weight:700;">${esc(d.CATEGORY)}</span>
        </div>

        <h1 class="cyber-title" style="font-size:68px;margin-bottom:14px;">
            ${TemplateUtils.renderEditable('TITLE', esc(d.TITLE), data._overrides)}
        </h1>

        ${mythItems}

        <div class="closing-box">
            ${TemplateUtils.renderEditable('CLOSING', esc(d.CLOSING), data._overrides)}
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
