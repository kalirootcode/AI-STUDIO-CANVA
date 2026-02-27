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
            justify-content: center;
            align-items: center; text-align: center;
            padding: 20px 0;
        }
        .quote-mark {
            font-size: 170px; color: color-mix(in srgb, var(--primary-color) 30%, transparent); line-height: 1;
            margin-bottom: 10px;
        }
        .quote-text {
            font-size: 58px; font-weight: 700; line-height: 1.5;
            max-width: 850px; margin-bottom: 24px;
            color: #ffffff;
        }
        .quote-author {
            font-family: var(--font-mono); font-size: 41px;
            font-weight: 600; color: var(--primary-color); margin-bottom: 8px;
        }
        .quote-context {
            font-size: 38px; color: #aaaaaa; max-width: 700px;
        }
        .divider-line {
            width: 120px; height: 2px; margin: 20px auto;
            background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
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
            <div class="divider-line"></div>
            <div class="quote-author">— ${TemplateUtils.renderEditable('QUOTE_AUTHOR', `${esc(d.QUOTE_AUTHOR)}`, data._overrides)}</div>
            <div class="quote-context">${TemplateUtils.renderEditable('CONTEXT', `${esc(d.CONTEXT)}`, data._overrides)}</div>
        </div>

        <!-- Extra Fact -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:center;">
            <span style="font-size:41px;">💡</span>
            <span style="font-size: 38px; color:#ffffff; line-height:1.4;">${esc(d.EXTRA_FACT)}</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}

