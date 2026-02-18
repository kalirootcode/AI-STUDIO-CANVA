/**
 * KR-CLIDN-08: ESTADÍSTICA / DATO IMPACTANTE (Refactored)
 * Big stat number with glow and context
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        EXERCISE_LETTER: data.EXERCISE_LETTER || 'C',
        TITLE: data.TITLE || 'Dato Clave',
        INTRO_TEXT: data.INTRO_TEXT || 'Un dato que debes conocer.',
        COMMAND: data.COMMAND || '$ nmap -O objetivo',
        RESULT_TEXT: data.RESULT_TEXT || 'Resultado del análisis.',
        PERCENTAGE: data.PERCENTAGE || '95%',
        PERCENTAGE_TEXT: data.PERCENTAGE_TEXT || 'Precisión de detección.',
        TIP_TITLE: data.TIP_TITLE || 'Recuerda',
        TIP_CONTENT: data.TIP_CONTENT || 'Consejo importante.'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-08</title>
    <style>
        .stat-hero {
            background: rgba(10,10,10,0.9); border: 1px solid rgba(0,217,255,0.2);
            border-radius: 20px; padding: 32px; text-align: center;
            position: relative; overflow: hidden;
        }
        .stat-hero::before {
            content: ''; position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 280px; height: 280px; border-radius: 50%;
            background: radial-gradient(circle, rgba(0,217,255,0.1) 0%, transparent 70%);
        }
        .stat-number {
            font-family: var(--font-mono); font-size: 120px; font-weight: 800;
            background: linear-gradient(135deg, var(--primary-color), var(--success-color));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; position: relative;
            filter: drop-shadow(0 0 30px rgba(0,217,255,0.4));
        }
        .stat-label {
            font-size: 24px; color: #ffffff; margin-top: 12px;
            position: relative;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Badge -->
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:20px;">
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#0a0a0f; background:linear-gradient(135deg,var(--primary-color),#7c3aed); width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center;">${esc(d.EXERCISE_LETTER)}</div>
            <span class="mono" style="font-size:26px; color:var(--primary-color); letter-spacing:3px;">// DATO CLAVE</span>
        </div>

        <h1 class="cyber-title" style="font-size: 44px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle" style="font-size: 26px;">${esc(d.INTRO_TEXT)}</div>

        <!-- Command -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
            </div>
            <div class="term-body" style="font-size: 26px; font-weight: 700; color: var(--primary-color);">
                ${TemplateUtils.renderEditable('COMMAND', `${esc(d.COMMAND)}`, data._overrides)}
            </div>
        </div>

        <div style="font-size: 22px; color: #ffffff; margin-bottom: 20px; line-height: 1.5;">${esc(d.RESULT_TEXT)}</div>

        <!-- Big Stat -->
        <div class="stat-hero">
            <div class="stat-number">${esc(d.PERCENTAGE)}</div>
            <div class="stat-label">${esc(d.PERCENTAGE_TEXT)}</div>
        </div>

        <!-- Tip -->
        <div class="glass-panel" style="display: flex; gap: 14px; align-items: flex-start; border-color: var(--primary-color);">
            <span style="font-size: 26px;">💡</span>
            <div>
                <div class="mono" style="font-size: 20px; font-weight: 600; color: var(--primary-color); margin-bottom: 4px;">${esc(d.TIP_TITLE)}</div>
                <div style="font-size: 20px; color: #ffffff; line-height: 1.5;">${esc(d.TIP_CONTENT)}</div>
            </div>
        </div>
            
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
