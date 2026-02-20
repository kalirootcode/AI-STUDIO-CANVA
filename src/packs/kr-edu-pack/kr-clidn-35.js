/**
 * KR-CLIDN-35: TOOL CARD (Arsenal)
 * Showcases a single tool with name, description, install, ratings.
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TOOL_NAME: data.TOOL_NAME || 'Nmap',
        TOOL_ICON: data.TOOL_ICON || '🔍',
        CATEGORY: data.CATEGORY || 'Escaneo de Red',
        DESCRIPTION: data.DESCRIPTION || 'El escáner de puertos más utilizado del mundo.',
        INSTALL_CMD: data.INSTALL_CMD || '$ sudo apt install nmap',
        USAGE_CMD: data.USAGE_CMD || '$ nmap -sV -O target.com',
        DIFFICULTY: data.DIFFICULTY || '⭐⭐',
        POWER: data.POWER || '🔥🔥🔥🔥🔥',
        PLATFORM: data.PLATFORM || 'Linux / Windows / macOS'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-35</title>
    <style>
        .tool-hero {
            background: rgba(10,10,15,0.9);
            border: 1px solid color-mix(in srgb, var(--primary-color) 15%, transparent);
            border-radius: 20px; padding: 32px; text-align: center;
            position: relative;
        }
        .tool-icon { font-size: 109px; margin-bottom: 16px; }
        .tool-name {
            font-family: var(--font-mono); font-size: 82px; font-weight: 800;
            color: var(--primary-color); margin-bottom: 8px;
            text-shadow: 0 0 20px color-mix(in srgb, var(--primary-color) 30%, transparent);
        }
        .tool-cat {
            font-family: var(--font-mono); font-size: 34px; color: #888;
            letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px;
        }
        .rating-row {
            display: flex; justify-content: center; gap: 32px;
            padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.06);
        }
        .rating-item {
            display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .rating-label { font-family: var(--font-mono); font-size: 34px; color: #666; text-transform: uppercase; }
        .rating-value { font-size: 34px; }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="mono" style="font-size:34px; color:var(--primary-color); letter-spacing:3px; margin-bottom:8px;">🔫 ARSENAL</div>

        <!-- Tool Card -->
        <div class="tool-hero">
            <div class="tool-icon">${d.TOOL_ICON}</div>
            <div class="tool-name">${TemplateUtils.renderEditable('TOOL_NAME', `${esc(d.TOOL_NAME)}`, data._overrides)}</div>
            <div class="tool-cat">${esc(d.CATEGORY)}</div>
            <div style="font-size:37px; color:#e2e8f0; line-height:1.5; max-width:800px; margin: 0 auto 20px;">
                ${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}
            </div>
            <div class="rating-row">
                <div class="rating-item">
                    <span class="rating-label">Dificultad</span>
                    <span class="rating-value">${esc(d.DIFFICULTY)}</span>
                </div>
                <div class="rating-item">
                    <span class="rating-label">Poder</span>
                    <span class="rating-value">${esc(d.POWER)}</span>
                </div>
            </div>
        </div>

        <!-- Install -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
            </div>
            <div class="term-body" style="font-size:41px; font-weight:700; color:var(--success-color);">
                ${esc(d.INSTALL_CMD)}
            </div>
        </div>

        <!-- Platform -->
        <div class="glass-panel" style="display:flex; gap:10px; align-items:center; justify-content:center;">
            <span style="font-size:34px;">💻</span>
            <span class="mono" style="font-size:34px; color:#aaa;">${esc(d.PLATFORM)}</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
