/**
 * KR-CLIDN-27: PERMISSION MATRIX
 * Permisos de archivos Linux explicados visualmente (rwx)
 */
export function render(data) {
    const d = {
        TITLE: data.TITLE || 'Permisos Linux',
        FILE_EXAMPLE: data.FILE_EXAMPLE || '-rwxr-xr-- 1 root www-data 4096 script.sh',
        PERMISSION_GROUPS: data.PERMISSION_GROUPS || [
            { GROUP: 'Owner', PERMS: 'rwx', ICON: 'person', COLOR: '#4DD9C0', DESC: 'Lectura, escritura y ejecución total' },
            { GROUP: 'Group', PERMS: 'r-x', ICON: 'group', COLOR: '#2563EB', DESC: 'Puede leer y ejecutar, no escribir' },
            { GROUP: 'Others', PERMS: 'r--', ICON: 'public', COLOR: '#ff9500', DESC: 'Solo lectura, sin otros permisos' }
        ],
        EXPLANATION: data.EXPLANATION || 'Los permisos determinan quién puede leer (r), escribir (w) o ejecutar (x) cada archivo del sistema.',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '05/08'
    };

    const groupsHTML = d.PERMISSION_GROUPS.map(g => `
        <div class="perm-group">
            <div class="perm-header" style="border-color: ${g.COLOR}20;">
                <div class="perm-icon" style="background: ${g.COLOR}15; border-color: ${g.COLOR}30;">
                    <i class="material-icons" style="color: ${g.COLOR};">${g.ICON}</i>
                </div>
                <div class="perm-group-name">${g.GROUP}</div>
            </div>
            <div class="perm-chars">
                ${g.PERMS.split('').map(c => `<span class="${c !== '-' ? 'active' : 'off'}">${c}</span>`).join('')}
            </div>
            <div class="perm-desc">${g.DESC}</div>
        </div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #000000; color: #fff; width: 1080px; height: 1920px; overflow: hidden; position: relative; }
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(77,217,192,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(77,217,192,0.03) 1px, transparent 1px); background-size: 40px 40px; }

        .slide { position: relative; z-index: 1; width: 100%; height: 100%; padding: 60px; display: flex; flex-direction: column; }
        .brand-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
        .brand-dot { width: 14px; height: 14px; background: #2563EB; border-radius: 50%; box-shadow: 0 0 16px #2563EB; }
        .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; letter-spacing: 5px; color: #2563EB; text-shadow: 0 0 24px rgba(37,99,235,0.5); }
        .brand-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(37,99,235,0.4), transparent); }

        .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .section-label { font-family: 'JetBrains Mono', monospace; font-size: 24px; color: #4DD9C0; letter-spacing: 4px; margin-bottom: 16px; }
        .title { font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 700; margin-bottom: 32px; }

        .file-strip {
            background: #0c0c0c;
            border: 1px solid rgba(77,217,192,0.15);
            border-radius: 14px;
            padding: 20px 28px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 24px; color: #4ade80;
            margin-bottom: 36px;
            text-align: center;
            letter-spacing: 1px;
        }

        .perm-groups { display: flex; flex-direction: column; gap: 18px; margin-bottom: 36px; }
        .perm-group {
            background: rgba(15,20,40,0.7);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 18px;
            padding: 28px 32px;
        }
        .perm-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .perm-icon {
            width: 52px; height: 52px;
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            border: 1px solid;
            flex-shrink: 0;
        }
        .perm-icon i { font-size: 28px; }
        .perm-group-name { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #e2e8f0; }

        .perm-chars {
            display: flex; gap: 12px; margin-bottom: 14px; margin-left: 68px;
        }
        .perm-chars span {
            font-family: 'JetBrains Mono', monospace;
            font-size: 36px; font-weight: 800;
            width: 56px; height: 56px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 12px;
        }
        .perm-chars span.active { background: rgba(77,217,192,0.12); color: #4DD9C0; border: 1px solid rgba(77,217,192,0.2); }
        .perm-chars span.off { background: rgba(255,255,255,0.03); color: #4a5568; border: 1px solid rgba(255,255,255,0.05); }

        .perm-desc { font-size: 24px; color: #94a3b8; margin-left: 68px; line-height: 1.4; }

        .explain-box {
            background: rgba(77,217,192,0.05);
            border: 1px solid rgba(77,217,192,0.12);
            border-radius: 16px;
            padding: 26px 32px;
            display: flex; align-items: flex-start; gap: 14px;
        }
        .explain-box i { color: #4DD9C0; font-size: 28px; flex-shrink: 0; }
        .explain-box span { font-size: 26px; color: #94a3b8; line-height: 1.5; }

        .slide-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; }
        .footer-bar { width: 80px; height: 3px; background: linear-gradient(90deg, #4DD9C0, transparent); }
        .slide-num { font-family: 'JetBrains Mono', monospace; font-size: 28px; color: rgba(255,255,255,0.25); }
        .corner-deco { position: absolute; bottom: 60px; left: 60px; width: 100px; height: 100px; border-left: 2px solid rgba(77,217,192,0.12); border-bottom: 2px solid rgba(77,217,192,0.12); }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="slide">
        <div class="brand-bar"><div class="brand-dot"></div><div class="brand-name">KR-CLIDN</div><div class="brand-line"></div></div>
        <div class="content">
            <div class="section-label">// Permisos</div>
            <div class="title">${d.TITLE}</div>
            <div class="file-strip">${d.FILE_EXAMPLE}</div>
            <div class="perm-groups">${groupsHTML}</div>
            <div class="explain-box">
                <i class="material-icons">info</i>
                <span>${d.EXPLANATION}</span>
            </div>
        </div>
        <div class="slide-footer"><div class="footer-bar"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
