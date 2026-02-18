/**
 * KR-CLIDN-20: CHAPTER DIVIDER (Refactored)
 * Separador de sección para posts largos
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        CHAPTER_NUMBER: data.CHAPTER_NUMBER || '02',
        CHAPTER_TITLE: data.CHAPTER_TITLE || 'Sección',
        CHAPTER_SUBTITLE: data.CHAPTER_SUBTITLE || 'Subtítulo de la sección',
        ICON: data.ICON || '🖥️'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-20</title>
    <style>
        .chapter-hero {
            flex: 1; display: flex; flex-direction: column;
            justify-content: center; align-items: center; text-align: center;
        }
        .chapter-icon-box {
            width: 100px; height: 100px; background: #0a0a0a;
            border: 2px solid rgba(0,217,255,0.2); border-radius: 24px;
            display: flex; align-items: center; justify-content: center;
            font-size: 48px; margin-bottom: 24px;
            box-shadow: 0 0 30px rgba(0,217,255,0.1);
        }
        .chapter-num {
            font-family: var(--font-mono); font-size: 120px; font-weight: 800;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; line-height: 1; margin-bottom: 20px;
        }
        .line-deco {
            width: 200px; height: 3px; margin-bottom: 24px;
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

        <div class="chapter-hero">
            <div class="chapter-icon-box">${d.ICON}</div>
            <div class="mono" style="font-size:26px; color:rgba(255,255,255,0.3); letter-spacing:4px; margin-bottom:12px;">SECCIÓN</div>
            <div class="chapter-num">${TemplateUtils.renderEditable('CHAPTER_NUMBER', `${esc(d.CHAPTER_NUMBER)}`, data._overrides)}</div>
            <div class="line-deco"></div>
            <div class="mono" style="font-size:32px; font-weight:700; color:#fff; margin-bottom:16px;">${TemplateUtils.renderEditable('CHAPTER_TITLE', `${esc(d.CHAPTER_TITLE)}`, data._overrides)}</div>
            <div style="font-size:24px; color:#94a3b8; max-width:700px; line-height:1.5;">${TemplateUtils.renderEditable('CHAPTER_SUBTITLE', `${esc(d.CHAPTER_SUBTITLE)}`, data._overrides)}</div>
        </div>

        <!-- Footer -->
        <div style="display:flex; align-items:center; justify-content:center; opacity:0.5;">
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // CHAPTER</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
