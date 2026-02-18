/**
 * KR-CLIDN-13: STEP BY STEP (Refactored)
 * Single numbered step with command and expected result
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        STEP_NUMBER: data.STEP_NUMBER || '01',
        TOTAL_STEPS: data.TOTAL_STEPS || '05',
        TITLE: data.TITLE || 'Instalación',
        DESCRIPTION: data.DESCRIPTION || 'Descripción del paso.',
        COMMAND: data.COMMAND || '$ sudo apt install nmap',
        EXPECTED_RESULT: data.EXPECTED_RESULT || 'El paquete se instalará correctamente.',
        NOTE: data.NOTE || 'Asegúrate de tener conexión a internet.'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-13</title>
    <style>
        .step-badge {
            width: 90px; height: 90px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border-radius: 18px; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            box-shadow: 0 0 30px rgba(0,217,255,0.25);
        }
        .step-badge .num {
            font-family: var(--font-mono); font-size: 36px;
            font-weight: 800; color: #fff; line-height: 1;
        }
        .step-badge .label {
            font-family: var(--font-mono); font-size: 14px;
            color: rgba(255,255,255,0.7); letter-spacing: 2px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Step Header -->
        <div style="display:flex; flex-direction:column; align-items:center; text-align:center; gap:16px; margin-bottom:24px;">
            <div class="step-badge">
                <div class="num">${esc(d.STEP_NUMBER)}</div>
                <div class="label">PASO</div>
            </div>
            <div class="mono" style="font-size:20px; color:rgba(255,255,255,0.3);">Paso ${esc(d.STEP_NUMBER)} de ${esc(d.TOTAL_STEPS)}</div>
            <h1 class="cyber-title" style="font-size:44px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        </div>

        <!-- Description -->
        <div style="font-size:24px; color:#ffffff; line-height:1.6; padding-left:12px; border-left:3px solid rgba(0,217,255,0.2); margin-bottom:24px;">
            ${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}
        </div>

        <!-- Command -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
            </div>
            <div class="term-body" style="font-size:26px; font-weight:700; color:var(--primary-color);">
                ${TemplateUtils.renderEditable('COMMAND', `${esc(d.COMMAND)}`, data._overrides)}
            </div>
        </div>

        <!-- Expected Result -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start;">
            <span style="color:var(--primary-color); font-size:26px;">→</span>
            <span style="font-size:22px; color:#e2e8f0; line-height:1.5;">${esc(d.EXPECTED_RESULT)}</span>
        </div>

        <!-- Note -->
        <div class="glass-panel" style="display:flex; gap:12px; align-items:center; border-color:rgba(168,85,247,0.15);">
            <span style="font-size:24px;">ℹ️</span>
            <span style="font-size:20px; color:#ffffff;">${esc(d.NOTE)}</span>
        </div>
            
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
