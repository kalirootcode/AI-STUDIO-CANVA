/**
 * KR-CLIDN-22: DIRECTORY TREE
 * Estructura visual de directorios con iconos de carpeta/archivo
 */
export function render(data) {
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
        DESCRIPTION: data.DESCRIPTION || 'En Linux, cada directorio tiene un propósito específico dentro de la jerarquía del sistema de archivos.',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '04/08'
    };

    const treeHTML = d.TREE_ITEMS.map(item => {
        const indent = item.DEPTH * 40;
        const connector = item.DEPTH > 0 ? '<span class="tree-connector">├── </span>' : '';
        const icon = item.TYPE === 'folder' ? 'folder' : 'description';
        const iconCls = item.TYPE === 'folder' ? 'folder-icon' : 'file-icon';
        return `
            <div class="tree-row" style="padding-left: ${indent + 24}px;">
                ${connector}
                <i class="material-icons ${iconCls}">${icon}</i>
                <span class="tree-name">${item.NAME}</span>
                <span class="tree-detail">${item.DETAIL}</span>
            </div>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #000000; color: #fff; width: 1080px; height: 1920px; overflow: hidden; position: relative; }
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px); background-size: 40px 40px; }

        .slide { position: relative; z-index: 1; width: 100%; height: 100%; padding: 60px; display: flex; flex-direction: column; }
        .brand-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
        .brand-dot { width: 14px; height: 14px; background: #2563EB; border-radius: 50%; box-shadow: 0 0 16px #2563EB; }
        .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; letter-spacing: 5px; color: #2563EB; text-shadow: 0 0 24px rgba(37,99,235,0.5); }
        .brand-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(37,99,235,0.4), transparent); }

        .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }

        .section-label { font-family: 'JetBrains Mono', monospace; font-size: 24px; color: #ff9500; letter-spacing: 4px; margin-bottom: 16px; }
        .title { font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 700; margin-bottom: 16px; }

        .root-path {
            font-family: 'JetBrains Mono', monospace;
            font-size: 26px; color: #2563EB;
            background: rgba(37,99,235,0.06);
            border: 1px solid rgba(37,99,235,0.12);
            padding: 12px 20px; border-radius: 10px;
            display: inline-block; margin-bottom: 32px;
            width: fit-content;
        }

        /* ═══ TREE ═══ */
        .tree-container {
            background: #0c0c0c;
            border: 1px solid rgba(255,149,0,0.12);
            border-radius: 20px;
            padding: 32px 20px;
            margin-bottom: 32px;
        }

        .tree-row {
            display: flex; align-items: center; gap: 12px;
            padding: 14px 0;
            border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .tree-row:last-child { border-bottom: none; }

        .tree-connector { font-family: 'JetBrains Mono', monospace; color: rgba(255,255,255,0.15); font-size: 22px; }
        .folder-icon { color: #ff9500; font-size: 30px; }
        .file-icon { color: #94a3b8; font-size: 28px; }

        .tree-name {
            font-family: 'JetBrains Mono', monospace;
            font-size: 26px; font-weight: 600;
            color: #e2e8f0;
            min-width: 200px;
        }

        .tree-detail {
            font-size: 22px; color: #6b7280;
            margin-left: auto;
        }

        /* ═══ DESC ═══ */
        .desc-box {
            background: rgba(255,149,0,0.05);
            border: 1px solid rgba(255,149,0,0.12);
            border-radius: 16px;
            padding: 28px 32px;
            display: flex; align-items: flex-start; gap: 14px;
        }
        .desc-box i { color: #ff9500; font-size: 30px; margin-top: 2px; flex-shrink: 0; }
        .desc-box span { font-size: 26px; color: #94a3b8; line-height: 1.5; }

        .slide-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; }
        .footer-bar { width: 80px; height: 3px; background: linear-gradient(90deg, #ff9500, transparent); }
        .slide-num { font-family: 'JetBrains Mono', monospace; font-size: 28px; color: rgba(255,255,255,0.25); }
        .corner-deco { position: absolute; bottom: 60px; left: 60px; width: 100px; height: 100px; border-left: 2px solid rgba(255,149,0,0.12); border-bottom: 2px solid rgba(255,149,0,0.12); }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="slide">
        <div class="brand-bar"><div class="brand-dot"></div><div class="brand-name">KR-CLIDN</div><div class="brand-line"></div></div>
        <div class="content">
            <div class="section-label">// Filesystem</div>
            <div class="title">${d.TITLE}</div>
            <div class="root-path">📂 ${d.ROOT_PATH}</div>
            <div class="tree-container">${treeHTML}</div>
            <div class="desc-box">
                <i class="material-icons">lightbulb</i>
                <span>${d.DESCRIPTION}</span>
            </div>
        </div>
        <div class="slide-footer"><div class="footer-bar"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
