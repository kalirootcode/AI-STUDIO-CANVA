/**
 * KR-CLIDN-26: NETWORK DIAGRAM (Refactored)
 * Compact network topology visualization with high-tech styling
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Topología de Red',
        NODES: data.NODES || [
            { ICON: '🌐', NAME: 'Internet', IP: 'WAN', STATUS: 'active' },
            { ICON: '📡', NAME: 'Router', IP: '192.168.1.1', STATUS: 'active' },
            { ICON: '🛡️', NAME: 'Firewall', IP: '192.168.1.254', STATUS: 'active' },
            { ICON: '🖥️', NAME: 'Target PC', IP: '192.168.1.50', STATUS: 'target' }
        ],
        DESCRIPTION: data.DESCRIPTION || 'Visualización de la infraestructura de red objetivo y puntos de acceso.'
    };

    const nodesHTML = d.NODES.map((n, i) => {
        const isTarget = n.STATUS === 'target';
        const isOffline = n.STATUS === 'offline';

        let borderClr = 'rgba(255,255,255,0.08)';
        let statusClr = 'var(--success-color)';
        let statusTxt = 'ONLINE';

        if (isTarget) {
            borderClr = 'rgba(255,51,102,0.3)';
            statusClr = 'var(--accent-color)';
            statusTxt = '🎯 TARGET';
        } else if (isOffline) {
            borderClr = 'rgba(255,255,255,0.05)';
            statusClr = '#ffffff';
            statusTxt = 'OFFLINE';
        }

        const connector = i < d.NODES.length - 1
            ? `<div style="display:flex; justify-content:center; padding:4px 0;">
                 <div style="width:2px; height:30px; background:linear-gradient(to bottom, var(--primary-color), transparent);"></div>
               </div>`
            : '';

        return `
            <div class="glass-panel" style="display:flex; align-items:center; gap:20px; padding:20px 24px; border-color:${borderClr}; ${isTarget ? 'box-shadow:0 0 20px rgba(255,51,102,0.1);' : ''}">
                <span style="font-size:36px;">${n.ICON}</span>
                <div style="flex:1;">
                    <div style="font-size:24px; font-weight:700; color:#fff;">${esc(n.NAME)}</div>
                    <div class="mono" style="font-size:18px; color:var(--primary-color);">${esc(n.IP)}</div>
                </div>
                <div class="mono" style="font-size:16px; color:${statusClr}; letter-spacing:2px; font-weight:600;">${statusTxt}</div>
            </div>
            ${connector}`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-26</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:42px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}</div>

        <!-- Network Nodes -->
        <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
            ${nodesHTML}
        </div>

        <!-- Footer -->
        
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
