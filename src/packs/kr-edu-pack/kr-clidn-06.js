/**
 * KR-CLIDN-06: LAB / EJERCICIO BÁSICO (Refactored)
 * Exercise card with terminal command
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        EXERCISE_LETTER: data.EXERCISE_LETTER || 'A',
        TITLE: data.TITLE || 'Ejercicio Práctico',
        INTRO_TEXT: data.INTRO_TEXT || 'Abre tu terminal y realiza este ejercicio.',
        COMMAND: data.COMMAND || '$ nmap 192.168.1.1',
        RESULT_TEXT: data.RESULT_TEXT || 'Verás los puertos abiertos del objetivo.',
        NOTE_TITLE: data.NOTE_TITLE || 'Nota',
        NOTE_CONTENT: data.NOTE_CONTENT || 'Solo escanea dispositivos con tu autorización.'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-06</title>
    <style>
        .lab-badge {
            display: inline-flex; align-items: center; gap: 16px;
            margin-bottom: 24px;
        }
        .badge-letter {
            font-family: var(--font-mono); font-size: 28px; font-weight: 800;
            color: #0a0a0f; background: linear-gradient(135deg, var(--primary-color), var(--success-color));
            width: 60px; height: 60px; border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 0 25px rgba(0,217,255,0.3);
        }
        .badge-label {
            font-family: var(--font-mono); font-size: 28px;
            color: var(--primary-color); letter-spacing: 3px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Lab Badge -->
        <div class="lab-badge">
            <div class="badge-letter">${esc(d.EXERCISE_LETTER)}</div>
            <div class="badge-label">// EJERCICIO</div>
        </div>

        <h1 class="cyber-title" style="font-size: 48px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${esc(d.INTRO_TEXT)}</div>

        <!-- Command Terminal -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
            </div>
            <div class="term-body" style="font-size: 28px; font-weight: 700; color: var(--primary-color);">
                ${TemplateUtils.renderEditable('COMMAND', `${esc(d.COMMAND)}`, data._overrides)}
            </div>
        </div>

        <!-- Result -->
        <div class="glass-panel" style="display: flex; gap: 16px; align-items: flex-start;">
            <span style="color: var(--primary-color); font-size: 28px;">→</span>
            <span style="font-size: 22px; color: #e2e8f0; line-height: 1.5;">${esc(d.RESULT_TEXT)}</span>
        </div>

        <!-- Note -->
        <div class="glass-panel" style="display: flex; gap: 14px; align-items: flex-start; border-color: var(--warning-color);">
            <span style="font-size: 28px;">ℹ️</span>
            <div>
                <div class="mono" style="font-size: 22px; font-weight: 600; color: var(--primary-color); margin-bottom: 6px;">${esc(d.NOTE_TITLE)}</div>
                <div style="font-size: 20px; color: #94a3b8; line-height: 1.5;">${esc(d.NOTE_CONTENT)}</div>
            </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: auto; display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // LAB</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
