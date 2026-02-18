/**
 * KR-CLIDN-25: PRO TIP CARD (Refactored)
 * Tip profesional visual con gran énfasis
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TIP_NUMBER: data.TIP_NUMBER || '01',
        TITLE: data.TITLE || 'Pro Tip',
        TIP_TEXT: data.TIP_TEXT || 'Usa alias en tu .bashrc para acelerar tu flujo de trabajo. Esto te ahorrará horas a largo plazo.',
        EXAMPLE_CMD: data.EXAMPLE_CMD || "alias ll='ls -la --color=auto'",
        WHY_TEXT: data.WHY_TEXT || 'Los alias convierten comandos largos en atajos que puedes escribir en segundos.',
        CATEGORY: data.CATEGORY || 'Productividad'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-25</title>
    <style>
        /* Force Black Background */
        body { background-color: #000 !important; }
        
        .tip-hero {
            flex: 1; display: flex; flex-direction: column;
            justify-content: center; align-items: center; /* Centering */
            gap: 24px; text-align: center; /* Text centering */
        }
        .tip-badge {
            font-family: var(--font-mono); font-size: 28px; font-weight: 700;
            color: var(--warning-color); background: rgba(255,149,0,0.08);
            border: 1px solid rgba(255,149,0,0.2); padding: 8px 18px;
            border-radius: 8px; letter-spacing: 3px; display: inline-block;
            /* align-self: flex-start; REMOVED */
        }
        .tip-icon {
            width: 90px; height: 90px; border-radius: 20px;
            background: linear-gradient(135deg, rgba(255,149,0,0.15), rgba(255,149,0,0.05));
            border: 2px solid rgba(255,149,0,0.25);
            display: flex; align-items: center; justify-content: center;
            font-size: 42px;
            /* No need for margin manipulation due to flex gap */
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="tip-hero">
            <div class="tip-badge">💡 PRO TIP #${esc(d.TIP_NUMBER)}</div>
            <div class="tip-icon">⚡</div>

            <h1 class="cyber-title" style="font-size:44px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

            <!-- Tip Text -->
            <div style="font-size:26px; color:#e2e8f0; line-height:1.6; max-width:900px;">
                ${esc(d.TIP_TEXT)}
            </div>

            <!-- Example Command -->
            <div class="terminal-window">
                <div class="term-header">
                    <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                    <span class="mono" style="margin-left:auto; font-size:16px; color:#666;">ejemplo</span>
                </div>
                <div class="term-body" style="font-family:var(--font-mono); font-size:24px; color:var(--primary-color);">
                    $ ${esc(d.EXAMPLE_CMD)}
                </div>
            </div>

            <!-- Why -->
            <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start;">
                <span style="font-size:22px;">🎯</span>
                <div>
                    <div class="mono" style="font-size:16px; color:var(--warning-color); letter-spacing:2px; margin-bottom:6px;">¿POR QUÉ?</div>
                    <span style="font-size:22px; color:#94a3b8; line-height:1.5;">${esc(d.WHY_TEXT)}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="display:flex; align-items:center; justify-content:space-between; opacity:0.5;">
            <div style="display:flex; align-items:center;">
                <div style="width:40px; height:4px; background:var(--warning-color); margin-right:16px;"></div>
                <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // TIP</span>
            </div>
            <span class="mono" style="font-size:14px; color:#555;">${esc(d.CATEGORY)}</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
