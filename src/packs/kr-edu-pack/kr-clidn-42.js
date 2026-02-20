/**
 * KR-CLIDN-42: NIVEL PROGRESIVO — Barra de progreso skill tree
 * TikTok Algorithm: HIGH completion rate — progress bar keeps users watching to the end
 * Format: Skill/level progression with glowing progress bar
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Tu nivel en Hacking Ético',
        CURRENT_LEVEL: data.CURRENT_LEVEL || 3,
        TOTAL_LEVELS: data.TOTAL_LEVELS || 5,
        LEVEL_LABEL: data.LEVEL_LABEL || 'INTERMEDIO',
        PROGRESS_PCT: data.PROGRESS_PCT || 55,
        LEVELS: data.LEVELS || [
            { NUM: 1, LABEL: 'Newbie', DESC: 'Sabes que existe Kali Linux', DONE: true },
            { NUM: 2, LABEL: 'Aprendiz', DESC: 'Dominas Nmap y Netcat', DONE: true },
            { NUM: 3, LABEL: 'Intermedio', DESC: 'Exploitas vulnerabilidades web (SQLI, XSS)', DONE: true, CURRENT: true },
            { NUM: 4, LABEL: 'Avanzado', DESC: 'Privilege escalation + Post-exploitation', DONE: false },
            { NUM: 5, LABEL: 'Elite', DESC: 'Bypass WAF, AV evasion, C2 frameworks', DONE: false }
        ],
        NEXT_STEP: data.NEXT_STEP || '¿Listo para el nivel 4? El siguiente slide te muestra cómo.',
        CATEGORY: data.CATEGORY || 'SKILL TREE'
    };

    const pct = Math.min(100, Math.max(0, parseInt(d.PROGRESS_PCT) || 0));

    const levelItems = d.LEVELS.map(l => {
        const done = l.DONE;
        const current = l.CURRENT;
        const borderColor = current ? 'var(--primary-color)' : done ? 'rgba(0,255,157,0.3)' : 'rgba(255,255,255,0.1)';
        const bg = current ? 'rgba(0,217,255,0.08)' : done ? 'rgba(0,255,157,0.04)' : 'transparent';
        const numColor = current ? 'var(--primary-color)' : done ? 'var(--success-color)' : '#333';
        const textColor = done ? '#e0e0f0' : '#555';
        const badge = current ? `<span class="mono" style="font-size:34px;color:var(--primary-color);background:rgba(0,217,255,0.1);padding:2px 8px;border-radius:4px;margin-left:8px;">← AQUÍ</span>` : '';
        const check = done && !current ? `<span style="color:var(--success-color);font-size:34px;">✓</span>` : '';

        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;border:1px solid ${borderColor};background:${bg};margin-bottom:8px;">
            <div class="mono" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,0.05);border:1px solid ${numColor};font-size:34px;font-weight:700;color:${numColor};flex-shrink:0;">${esc(String(l.NUM))}</div>
            <div style="flex:1;">
                <div style="font-size:34px;font-weight:700;color:${textColor};">${esc(l.LABEL)}${badge}</div>
                <div style="font-size:34px;color:${done ? '#999' : '#444'};margin-top:2px;">${esc(l.DESC)}</div>
            </div>
            ${check}
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-42</title>
    <style>
        .progress-track {
            width: 100%; height: 12px;
            background: rgba(255,255,255,0.08); border-radius: 6px;
            overflow: hidden; margin: 6px 0 14px;
            position: relative;
        }
        .progress-fill {
            height: 100%; border-radius: 6px;
            background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
            width: ${pct}%;
            box-shadow: 0 0 12px rgba(0,217,255,0.5);
            transition: width 0.8s ease;
        }
        .level-badge {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 6px 14px;
            background: rgba(0,217,255,0.1); border: 1px solid rgba(0,217,255,0.3);
            border-radius: 8px;
        }
        .next-step {
            padding: 12px 16px;
            background: rgba(0,255,157,0.06); border: 1px solid rgba(0,255,157,0.2);
            border-radius: 10px; margin-top: 10px;
            font-size: 37px; color: var(--success-color); line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:75px;margin-bottom:8px;">
            ${TemplateUtils.renderEditable('TITLE', esc(d.TITLE), data._overrides)}
        </h1>

        <!-- Progress Bar Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
            <div class="level-badge">
                <span style="font-size:34px;">🎯</span>
                <span class="mono" style="font-size:34px;font-weight:700;color:var(--primary-color);">
                    NIVEL ${esc(String(d.CURRENT_LEVEL))} / ${esc(String(d.TOTAL_LEVELS))} — ${esc(d.LEVEL_LABEL)}
                </span>
            </div>
            <span class="mono" style="font-size:37px;color:var(--primary-color);font-weight:700;">${pct}%</span>
        </div>

        <!-- Progress Bar -->
        <div class="progress-track">
            <div class="progress-fill"></div>
        </div>

        <!-- Skill Levels -->
        <div>${levelItems}</div>

        <!-- Next Step Teaser -->
        <div class="next-step">
            ${TemplateUtils.renderEditable('NEXT_STEP', esc(d.NEXT_STEP), data._overrides)}
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
