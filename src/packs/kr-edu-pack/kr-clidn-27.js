/**
 * KR-CLIDN-27: PERMISSION MATRIX (Refactored)
 * Permisos de archivos Linux explicados visualmente (rwx)
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Permisos Linux',
        FILE_EXAMPLE: data.FILE_EXAMPLE || '-rwxr-xr-- 1 root www-data 4096 script.sh',
        PERMISSION_GROUPS: data.PERMISSION_GROUPS || [
            { GROUP: 'Owner', PERMS: 'rwx', ICON: '👤', COLOR: 'var(--primary-color)', DESC: 'Lectura, escritura y ejecución total' },
            { GROUP: 'Group', PERMS: 'r-x', ICON: '👥', COLOR: 'var(--success-color)', DESC: 'Puede leer y ejecutar, no escribir' },
            { GROUP: 'Others', PERMS: 'r--', ICON: '🌍', COLOR: '#ff9500', DESC: 'Solo lectura, sin otros permisos' }
        ],
        EXPLANATION: data.EXPLANATION || 'Los permisos determinan quién puede leer (r), escribir (w) o ejecutar (x) cada archivo del sistema.'
    };

    const groupsHTML = d.PERMISSION_GROUPS.map(g => {
        const permsHTML = g.PERMS.split('').map(c => {
            const isActive = c !== '-';
            return `<span style="
                font-family:var(--font-mono); font-size:36px; font-weight:800;
                width:56px; height:56px; display:flex; align-items:center; justify-content:center;
                border-radius:10px;
                ${isActive
                    ? `color:${g.COLOR}; background:${g.COLOR}12; border:1px solid ${g.COLOR}30;`
                    : 'color:#333; background:#0a0a0a; border:1px solid #1a1a1a;'
                }
            ">${c}</span>`;
        }).join('');

        return `
            <div class="glass-panel" style="display:flex; align-items:center; gap:20px; padding:20px 24px;">
                <span style="font-size:32px;">${g.ICON}</span>
                <div style="flex:1;">
                    <div style="font-size:22px; font-weight:700; color:${g.COLOR}; margin-bottom:4px;">${esc(g.GROUP)}</div>
                    <div style="font-size:18px; color:#ffffff;">${esc(g.DESC)}</div>
                </div>
                <div style="display:flex; gap:8px;">${permsHTML}</div>
            </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-27</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:42px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- File Example -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                <span class="mono" style="margin-left:auto; font-size:16px; color:#ffffff;">ls -la</span>
            </div>
            <div class="term-body" style="font-family:var(--font-mono); font-size:24px; color:var(--primary-color);">
                ${esc(d.FILE_EXAMPLE)}
            </div>
        </div>

        <!-- Permission Groups -->
        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:16px;">
            ${groupsHTML}
        </div>

        <!-- Explanation -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start;">
            <span style="font-size:24px;">🔑</span>
            <span style="font-size:22px; color:#e2e8f0; line-height:1.5;">${esc(d.EXPLANATION)}</span>
        </div>

        <!-- Footer -->
        
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
