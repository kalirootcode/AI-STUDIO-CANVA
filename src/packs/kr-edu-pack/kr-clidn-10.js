/**
 * KR-CLIDN-10: GITHUB TOOL (Refactored)
 * Tool showcase with install/usage commands and features
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TOOL_NAME: data.TOOL_NAME || 'Herramienta',
        TOOL_CATEGORY: data.TOOL_CATEGORY || 'Pentesting',
        DESCRIPTION: data.DESCRIPTION || 'Descripción de la herramienta.',
        INSTALL_CMD: data.INSTALL_CMD || '$ git clone https://github.com/user/tool',
        USAGE_CMD: data.USAGE_CMD || '$ python3 tool.py --target ejemplo.com',
        FEATURES: data.FEATURES || [
            { ICON: '⚡', TEXT: 'Rápido y eficiente' },
            { ICON: '🔒', TEXT: 'Enfocado en seguridad' },
            { ICON: '📦', TEXT: 'Open source' }
        ],
        GITHUB_STARS: data.GITHUB_STARS || '2.5k'
    };

    const featsHTML = d.FEATURES.map(f => `
        <div class="glass-panel" style="display:flex; align-items:center; gap:14px; padding:16px 20px;">
            <span style="font-size:24px;">${f.ICON || '✓'}</span>
            <span style="font-size:22px; color:#e2e8f0;">${esc(f.TEXT)}</span>
        </div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-10</title>
    <style>
        .stars-badge {
            background: rgba(255,149,0,0.08); border: 1px solid rgba(255,149,0,0.25);
            border-radius: 12px; padding: 12px 20px;
            display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .stars-count {
            font-family: var(--font-mono); font-size: 28px;
            font-weight: 700; color: #ff9500;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Tool Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
            <div style="flex:1;">
                <div class="mono" style="font-size:22px; color:var(--primary-color); letter-spacing:2px; margin-bottom:12px;">// ${esc(d.TOOL_CATEGORY)}</div>
                <h1 class="cyber-title" style="font-size:44px;">${esc(d.TOOL_NAME)}</h1>
                <div class="cyber-subtitle">${TemplateUtils.renderEditable('DESCRIPTION', `${TemplateUtils.renderEditable('DESCRIPTION', `${TemplateUtils.renderEditable('DESCRIPTION', `${TemplateUtils.renderEditable('DESCRIPTION', `${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}`, data._overrides)}`, data._overrides)}`, data._overrides)}`, data._overrides)}</div>
            </div>
            <div class="stars-badge">
                <span style="font-size:24px;">⭐</span>
                <span class="stars-count">${esc(d.GITHUB_STARS)}</span>
                <span style="font-size:14px; color:rgba(255,149,0,0.6);">STARS</span>
            </div>
        </div>

        <!-- Install -->
        <div class="mono" style="font-size:18px; color:#ffffff; letter-spacing:2px; margin-bottom:8px;">INSTALACIÓN</div>
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
            </div>
            <div class="term-body" style="font-size:24px; color:var(--primary-color); font-weight:700;">${esc(d.INSTALL_CMD)}</div>
        </div>

        <!-- Usage -->
        <div class="mono" style="font-size:18px; color:#ffffff; letter-spacing:2px; margin-bottom:8px;">USO</div>
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
            </div>
            <div class="term-body" style="font-size:24px; color:var(--primary-color); font-weight:700;">${esc(d.USAGE_CMD)}</div>
        </div>

        <!-- Features -->
        ${featsHTML}
            
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
