/**
 * KR-CLIDN-41: STAT BOMB — Un dato impactante + contexto visual
 * TikTok Algorithm: ULTRA HIGH engagement — shocking number + story = viral share bait
 * Format: Giant centered statistic with supporting context cards
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        SETUP: data.SETUP || 'En 2024, los hackers atacaron empresas cada',
        STAT_NUMBER: data.STAT_NUMBER || '39',
        STAT_UNIT: data.STAT_UNIT || 'segundos',
        STAT_DETAIL: data.STAT_DETAIL || 'Un ataque por cada latido de tu corazón',
        CONTEXT_CARDS: data.CONTEXT_CARDS || [
            { ICON: '🌍', TEXT: '2.200+ ataques/día a nivel global' },
            { ICON: '💸', TEXT: 'Pérdidas de $8.4B anuales' },
            { ICON: '🔓', TEXT: '61% por credenciales robadas' }
        ],
        SOURCE: data.SOURCE || 'Verizon DBIR 2024',
        HOOK: data.HOOK || '¿Tu empresa sobreviviría un ataque ahora mismo?',
        CATEGORY: data.CATEGORY || 'DATO IMPACTANTE'
    };

    const contextCards = d.CONTEXT_CARDS.map(c =>
        `<div class="context-card">
            <span style="font-size:48px;">${esc(c.ICON)}</span>
            <span style="font-size:34px;color:#ccc;line-height:1.3;">${esc(c.TEXT)}</span>
        </div>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-41</title>
    <style>
        .stat-stage {
            text-align: center;
            padding: 20px 0 14px;
            position: relative;
        }
        .stat-glow {
            position: absolute; inset: -20px;
            background: radial-gradient(ellipse at center, rgba(0,217,255,0.15) 0%, transparent 70%);
            pointer-events: none;
        }
        .stat-setup {
            font-size: 44px; color: #999; margin-bottom: 4px;
            text-transform: uppercase; letter-spacing: 2px;
        }
        .stat-number {
            font-family: 'JetBrains Mono', monospace;
            font-size: 238px; font-weight: 900; line-height: 1;
            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .stat-unit {
            font-size: 68px; font-weight: 700; color: #fff;
            text-transform: uppercase; letter-spacing: 4px;
            margin-top: -10px;
        }
        .stat-detail {
            font-size: 37px; color: rgba(0,217,255,0.8);
            margin-top: 6px; font-style: italic;
        }
        .context-grid {
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 10px; margin: 14px 0;
        }
        .context-card {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 12px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 10px;
        }
        .source-tag {
            font-size: 34px; color: #444;
            font-family: 'JetBrains Mono', monospace;
            text-align: right; margin-bottom: 8px;
        }
        .hook-box {
            text-align: center; padding: 12px;
            border-top: 1px solid rgba(0,217,255,0.15);
            font-size: 41px; color: #fff; font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Giant Stat -->
        <div class="stat-stage">
            <div class="stat-glow"></div>
            <div class="stat-setup">${esc(d.SETUP)}</div>
            <div class="stat-number">${esc(d.STAT_NUMBER)}</div>
            <div class="stat-unit">${esc(d.STAT_UNIT)}</div>
            <div class="stat-detail">${TemplateUtils.renderEditable('STAT_DETAIL', esc(d.STAT_DETAIL), data._overrides)}</div>
        </div>

        <!-- Context Cards -->
        <div class="context-grid">
            ${contextCards}
        </div>

        <!-- Source -->
        <div class="source-tag">Fuente: ${esc(d.SOURCE)}</div>

        <!-- Hook Question -->
        <div class="hook-box">
            ${TemplateUtils.renderEditable('HOOK', esc(d.HOOK), data._overrides)}
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
