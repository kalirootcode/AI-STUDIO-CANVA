/**
 * KR-CLIDN-18: QUOTE / FACT (Refactored)
 * Dato impactante o cita relevante
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        QUOTE_TEXT: data.QUOTE_TEXT || '"La seguridad no es un producto, es un proceso."',
        QUOTE_AUTHOR: data.QUOTE_AUTHOR || 'Bruce Schneier',
        CONTEXT: data.CONTEXT || 'Criptógrafo y experto en seguridad informática.',
        EXTRA_FACT: data.EXTRA_FACT || 'El 95% de las brechas de seguridad son causadas por error humano.'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-18</title>
    <style>
        .quote-hero {
            flex: 1; display: flex; flex-direction: column;
            justify-content: flex-start; /* Changed from center to lift it up */
            align-items: center; text-align: center;
            padding-top: 80px; /* Visual centering adjustment */
        }
        .quote-mark {
            font-size: 100px; color: rgba(168,85,247,0.3); line-height: 1;
        }
        .quote-text {
            font-size: 32px; font-weight: 700; line-height: 1.5;
            max-width: 850px; margin-bottom: 24px;
            background: linear-gradient(135deg, #fff, #94a3b8);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .quote-author {
            font-family: var(--font-mono); font-size: 24px;
            font-weight: 600; color: var(--secondary-color); margin-bottom: 8px;
        }
        .divider-line {
            width: 120px; height: 2px; margin: 24px auto;
            background: linear-gradient(90deg, transparent, var(--secondary-color), transparent);
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="quote-hero">
            <div class="quote-mark">❝</div>
            <div class="quote-text">${TemplateUtils.renderEditable('QUOTE_TEXT', `${esc(d.QUOTE_TEXT)}`, data._overrides)}</div>
            <div class="quote-author">— ${TemplateUtils.renderEditable('QUOTE_AUTHOR', `${esc(d.QUOTE_AUTHOR)}`, data._overrides)}</div>
            <div style="font-size:22px; color:#94a3b8;">${TemplateUtils.renderEditable('CONTEXT', `${esc(d.CONTEXT)}`, data._overrides)}</div>
            <div class="divider-line"></div>
        </div>

        <!-- Extra Fact -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:center; border-color:rgba(168,85,247,0.15);">
            <span style="font-size:24px;">💡</span>
            <span style="font-size:22px; color:#94a3b8; line-height:1.4;">${esc(d.EXTRA_FACT)}</span>
        </div>

        <!-- Footer -->
        <div style="display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // QUOTE</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
