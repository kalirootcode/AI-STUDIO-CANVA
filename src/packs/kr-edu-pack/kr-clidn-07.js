/**
 * KR-CLIDN-07: WARNING — Ethical Caution (Refactored)
 * Red-themed warning slide
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        EXERCISE_LETTER: data.EXERCISE_LETTER || 'B',
        TITLE: data.TITLE || 'Precaución Ética',
        INTRO_TEXT: data.INTRO_TEXT || 'Este comando requiere autorización explícita',
        COMMAND: data.COMMAND || '$ nmap -A target.com',
        RESULT_TEXT: data.RESULT_TEXT || 'Escaneo completo de puertos y servicios',
        WARNING_TITLE: data.WARNING_TITLE || '⚠ ADVERTENCIA',
        WARNING_CONTENT: data.WARNING_CONTENT || 'El uso no autorizado es ILEGAL y puede resultar en consecuencias legales severas'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-07</title>
    <style>
        .warning-box {
            background: rgba(255, 0, 85, 0.08);
            border: 3px solid var(--accent-color);
            border-radius: 16px; padding: 28px;
            position: relative;
        }
        .warning-box::before {
            content: ''; position: absolute; left: 0; top: 0;
            width: 5px; height: 100%; background: var(--accent-color);
            border-radius: 16px 0 0 16px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Header badge -->
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px;">
            <div style="font-family:var(--font-mono); font-size:24px; font-weight:800; color:#fff; background:var(--accent-color); width:52px; height:52px; border-radius:10px; display:flex; align-items:center; justify-content:center;">${esc(d.EXERCISE_LETTER)}</div>
            <span class="mono" style="font-size:28px; color:var(--accent-color); letter-spacing:2px;">// PRECAUCIÓN</span>
        </div>

        <h1 class="cyber-title" style="font-size: 48px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${esc(d.INTRO_TEXT)}</div>

        <!-- Terminal -->
        <div class="terminal-window" style="border-color: var(--accent-color);">
            <div class="term-header" style="background: #1a0a0f;">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
            </div>
            <div class="term-body" style="font-size: 28px; font-weight: 700; color: var(--accent-color);">
                ${TemplateUtils.renderEditable('COMMAND', `${esc(d.COMMAND)}`, data._overrides)}
            </div>
        </div>

        <!-- Result -->
        <div class="glass-panel" style="display: flex; gap: 14px; align-items: center;">
            <span style="color: var(--primary-color); font-size: 28px;">→</span>
            <span style="font-size: 22px; color: #e2e8f0; line-height: 1.5;">${esc(d.RESULT_TEXT)}</span>
        </div>

        <!-- Warning Box -->
        <div class="warning-box">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
                <span style="font-size:28px;">⚠</span>
                <span class="mono" style="font-size:28px; font-weight:800; color:var(--accent-color);">${esc(d.WARNING_TITLE)}</span>
            </div>
            <div style="font-size:22px; color:#e2e8f0; line-height:1.6; padding-left:40px;">${esc(d.WARNING_CONTENT)}</div>
        </div>

        <!-- Footer -->
        <div style="margin-top: auto; display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // WARNING</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
