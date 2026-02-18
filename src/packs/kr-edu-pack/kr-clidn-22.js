/**
 * KR-CLIDN-22: DIRECTORY TREE (Refactored)
 * Estructura visual de directorios con iconos de carpeta/archivo
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Estructura de Directorios',
        ROOT_PATH: data.ROOT_PATH || '/home/user',
        TREE_ITEMS: data.TREE_ITEMS || [
            { DEPTH: 0, TYPE: 'folder', NAME: 'home/', DETAIL: 'Directorio principal del usuario' },
            { DEPTH: 1, TYPE: 'folder', NAME: 'Desktop/', DETAIL: 'Escritorio' },
            { DEPTH: 1, TYPE: 'folder', NAME: 'Documents/', DETAIL: 'Documentos personales' },
            { DEPTH: 2, TYPE: 'file', NAME: 'notas.txt', DETAIL: 'Archivo de texto' },
            { DEPTH: 1, TYPE: 'folder', NAME: '.config/', DETAIL: 'Configuraciones ocultas' },
            { DEPTH: 1, TYPE: 'file', NAME: '.bashrc', DETAIL: 'Config de Bash' }
        ],
        DESCRIPTION: data.DESCRIPTION || 'En Linux, cada directorio tiene un propósito específico dentro de la jerarquía del sistema de archivos.'
    };

    const treeHTML = d.TREE_ITEMS.map(item => {
        const indent = item.DEPTH * 36;
        const connector = item.DEPTH > 0 ? '<span style="color:#333; margin-right:8px;">├──</span>' : '';
        const icon = item.TYPE === 'folder' ? '📁' : '📄';
        const nameColor = item.TYPE === 'folder' ? 'var(--primary-color)' : '#e2e8f0';
        return `
            <div style="display:flex; align-items:center; gap:10px; padding:10px 0; padding-left:${indent}px; border-bottom:1px solid rgba(255,255,255,0.03);">
                ${connector}
                <span style="font-size:24px;">${icon}</span>
                <span style="font-family:var(--font-mono); font-size:24px; font-weight:600; color:${nameColor};">${esc(item.NAME)}</span>
                <span style="font-size:18px; color:#64748b; margin-left:auto;">${esc(item.DETAIL)}</span>
            </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-22</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:40px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- Root Path -->
        <div class="mono" style="font-size:22px; color:var(--primary-color); background:rgba(0,217,255,0.06); border:1px solid rgba(0,217,255,0.15); padding:10px 18px; border-radius:8px; display:inline-block; margin-bottom:16px;">
            ${esc(d.ROOT_PATH)}
        </div>

        <!-- Tree -->
        <div class="terminal-window" style="flex:1;">
            <div class="term-header">
                <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                <span class="mono" style="margin-left:auto; font-size:16px; color:#666;">tree</span>
            </div>
            <div class="term-body" style="padding:16px 20px;">
                ${treeHTML}
            </div>
        </div>

        <!-- Description -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start;">
            <span style="font-size:24px;">📂</span>
            <span style="font-size:22px; color:#e2e8f0; line-height:1.5;">${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}</span>
        </div>

        <!-- Footer -->
        <div style="margin-top:auto; display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // TREE</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
