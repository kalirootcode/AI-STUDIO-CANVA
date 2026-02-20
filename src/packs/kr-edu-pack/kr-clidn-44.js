/**
 * KR-CLIDN-44: POLL / PREGUNTA DE ENGAGEMENT
 * TikTok Algorithm: HIGHEST comment rate — polling drives comments (algo boost)
 * Format: Bold question + 4 clickable answer options + comment CTA
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || '¿Cuánto sabes de ciberseguridad?',
        QUESTION: data.QUESTION || 'Un hacker te envía un email de "tu banco" pidiendo tu clave. ¿Qué haces?',
        OPTIONS: data.OPTIONS || [
            { KEY: 'A', TEXT: 'Click en el enlace y verifico', COLOR: '#ff4466', ICON: '❌' },
            { KEY: 'B', TEXT: 'Llamo directamente al banco', COLOR: '#00FF9D', ICON: '✓' },
            { KEY: 'C', TEXT: 'Borro el email y punto', COLOR: '#FFB800', ICON: '⚠' },
            { KEY: 'D', TEXT: 'Lo reenvío a seguridad TI', COLOR: '#00d9ff', ICON: '🛡' }
        ],
        CORRECT_KEY: data.CORRECT_KEY || 'B',
        REVEAL: data.REVEAL || 'La respuesta correcta está en el siguiente slide...',
        COMMENT_CTA: data.COMMENT_CTA || 'Comenta tu respuesta (A/B/C/D) 👇',
        CATEGORY: data.CATEGORY || 'QUIZ VIRAL'
    };

    const optionItems = d.OPTIONS.map(o => {
        const isCorrect = o.KEY === d.CORRECT_KEY;
        const borderAlpha = isCorrect ? '0.4' : '0.15';
        const bgAlpha = isCorrect ? '0.08' : '0.04';

        return `<div class="poll-option" style="border-color:rgba(${hexToRgb(o.COLOR)},${borderAlpha});background:rgba(${hexToRgb(o.COLOR)},${bgAlpha});">
            <div class="option-key" style="background:rgba(${hexToRgb(o.COLOR)},0.15);border-color:rgba(${hexToRgb(o.COLOR)},0.4);color:${o.COLOR};">${esc(o.KEY)}</div>
            <span style="font-size:37px;color:#e0e0f0;flex:1;line-height:1.3;">${esc(o.TEXT)}</span>
            <span style="font-size:37px;">${esc(o.ICON)}</span>
        </div>`;
    }).join('');

    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return isNaN(r) ? '0,217,255' : `${r},${g},${b}`;
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-44</title>
    <style>
        .quiz-banner {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 5px 14px; border-radius: 6px;
            background: rgba(0,217,255,0.1); border: 1px solid rgba(0,217,255,0.3);
            margin-bottom: 10px;
        }
        .question-box {
            padding: 16px 18px; margin-bottom: 14px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px;
        }
        .poll-option {
            display: flex; align-items: center; gap: 12px;
            padding: 12px 16px; margin-bottom: 9px;
            border-radius: 10px; border: 1px solid;
            cursor: pointer; transition: all 0.2s;
        }
        .option-key {
            width: 40px; height: 40px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            border-radius: 8px; border: 1px solid;
            font-family: 'JetBrains Mono', monospace;
            font-size: 34px; font-weight: 900;
        }
        .reveal-text {
            font-size: 34px; color: #666; font-style: italic;
            text-align: center; margin: 10px 0 4px;
        }
        .comment-cta {
            text-align: center; padding: 12px;
            font-size: 48px; font-weight: 800; color: var(--primary-color);
            border-top: 1px solid rgba(0,217,255,0.15);
            text-shadow: 0 0 20px rgba(0,217,255,0.4);
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="quiz-banner">
            <span style="font-size:34px;">🎯</span>
            <span class="mono" style="font-size:34px;color:var(--primary-color);font-weight:700;letter-spacing:2px;">${esc(d.CATEGORY)}</span>
        </div>

        <h1 class="cyber-title" style="font-size:71px;margin-bottom:10px;">
            ${TemplateUtils.renderEditable('TITLE', esc(d.TITLE), data._overrides)}
        </h1>

        <!-- Question -->
        <div class="question-box">
            <div style="font-size:41px;color:#fff;font-weight:700;line-height:1.4;">
                ${TemplateUtils.renderEditable('QUESTION', esc(d.QUESTION), data._overrides)}
            </div>
        </div>

        <!-- Poll Options -->
        <div>${optionItems}</div>

        <!-- Reveal Teaser -->
        <div class="reveal-text">${esc(d.REVEAL)}</div>

        <!-- Comment CTA -->
        <div class="comment-cta">
            ${TemplateUtils.renderEditable('COMMENT_CTA', esc(d.COMMENT_CTA), data._overrides)}
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
