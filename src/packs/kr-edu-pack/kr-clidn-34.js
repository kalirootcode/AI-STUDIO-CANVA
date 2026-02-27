/**
 * KR-CLIDN-34: SPEEDRUN STEP
 * Compact numbered step with action + command + result. Maximum speed feel.
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        STEP_NUMBER: data.STEP_NUMBER || '01',
        TOTAL_STEPS: data.TOTAL_STEPS || '05',
        TITLE: data.TITLE || 'Instalar herramienta',
        COMMAND: data.COMMAND || '$ sudo apt install nmap',
        RESULT: data.RESULT || 'Instalación completada.',
        TIME_ESTIMATE: data.TIME_ESTIMATE || '~10s'
    };

    const progress = Math.round((parseInt(d.STEP_NUMBER) / parseInt(d.TOTAL_STEPS)) * 100);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-34</title>
    <style>
        .speed-badge {
            display: inline-flex; align-items: center; gap: 10px;
            background: rgba(0,0,0,0.6); border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
            border-radius: 8px; padding: 8px 16px; margin-bottom: 16px;
        }
        .speed-num {
            font-family: var(--font-mono); font-size: 163px; font-weight: 900;
            color: var(--primary-color); line-height: 1;
            text-shadow: 0 0 40px color-mix(in srgb, var(--primary-color) 40%, transparent);
        }
        .speed-of {
            font-family: var(--font-mono); font-size: 48px; color: #555;
        }
        .speed-bar {
            width: 100%; height: 6px; background: #1a1a1a; border-radius: 3px;
            margin-top: 16px; overflow: hidden;
        }
        .speed-fill {
            height: 100%; border-radius: 3px;
            background: linear-gradient(90deg, var(--primary-color), var(--success-color));
            box-shadow: 0 0 10px color-mix(in srgb, var(--primary-color) 50%, transparent);
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Step Badge -->
        <div class="speed-badge">
            <span class="mono" style="font-size:38px; color:var(--primary-color); letter-spacing:3px;">⚡ SPEEDRUN</span>
            <span class="mono" style="font-size:38px; color:#555;">${esc(d.TIME_ESTIMATE)}</span>
        </div>

        <!-- Big Step Number -->
        <div style="display:flex; align-items:baseline; gap:12px; margin-bottom:20px;">
            <span class="speed-num">${esc(d.STEP_NUMBER)}</span>
            <span class="speed-of">/ ${esc(d.TOTAL_STEPS)}</span>
        </div>

        <!-- Step Title -->
        <h1 class="cyber-title" style="font-size:82px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- Command -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
            </div>
            <div class="term-body" style="font-size:44px; font-weight:700; color:var(--primary-color);">
                ${TemplateUtils.renderEditable('COMMAND', `${esc(d.COMMAND)}`, data._overrides)}
            </div>
        </div>

        <!-- Result -->
        <div class="glass-panel" style="display:flex; gap:12px; align-items:center;">
            <span style="font-size:41px;">✅</span>
            <span style="font-size:38px; color:#ffffff; line-height:1.4;">${TemplateUtils.renderEditable('RESULT', `${esc(d.RESULT)}`, data._overrides)}</span>
        </div>

        <!-- Progress Bar -->
        <div class="speed-bar">
            <div class="speed-fill" style="width:${progress}%;"></div>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
