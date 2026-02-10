/**
 * KR-CLIDN-24: BEFORE / AFTER
 * Transformación visual: antes y después de ejecutar un comando
 */
export function render(data) {
    const d = {
        TITLE: data.TITLE || 'Antes y Después',
        BEFORE_TITLE: data.BEFORE_TITLE || 'ANTES',
        BEFORE_LINES: data.BEFORE_LINES || [
            { TEXT: '$ ls' },
            { TEXT: 'file1.txt  file2.txt  folder/' }
        ],
        AFTER_TITLE: data.AFTER_TITLE || 'DESPUÉS',
        AFTER_LINES: data.AFTER_LINES || [
            { TEXT: '$ ls -la --color' },
            { TEXT: 'drwxr-xr-x 2 user user 4096 Jan 15 ./' },
            { TEXT: '-rw-r--r-- 1 user user  128 Jan 15 file1.txt' }
        ],
        COMMAND: data.COMMAND || 'ls -la --color',
        EXPLANATION: data.EXPLANATION || 'Al agregar las flags -la y --color, obtienes permisos, propietario, tamaño y colores que facilitan la lectura.',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '04/08'
    };

    const beforeHTML = d.BEFORE_LINES.map(l => `<div class="term-line">${l.TEXT}</div>`).join('');
    const afterHTML = d.AFTER_LINES.map(l => `<div class="term-line">${l.TEXT}</div>`).join('');

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
        .section-label { font-family: 'JetBrains Mono', monospace; font-size: 24px; color: #2563EB; letter-spacing: 4px; margin-bottom: 16px; }
        .title { font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 700; margin-bottom: 36px; }

        /* ═══ PANELS ═══ */
        .panels { display: flex; flex-direction: column; gap: 0; margin-bottom: 32px; }

        .panel-label-row {
            display: flex; align-items: center; gap: 12px;
            padding: 12px 0;
        }
        .panel-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 20px; font-weight: 700;
            padding: 6px 16px; border-radius: 8px;
            letter-spacing: 2px;
        }
        .panel-badge.before { background: rgba(255,51,102,0.12); color: #ff3366; border: 1px solid rgba(255,51,102,0.2); }
        .panel-badge.after { background: rgba(77,217,192,0.12); color: #4DD9C0; border: 1px solid rgba(77,217,192,0.2); }

        .panel {
            background: #0c0c0c;
            border-radius: 16px;
            padding: 28px 32px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 24px;
            line-height: 1.8;
        }
        .panel.before-panel { border: 1px solid rgba(255,51,102,0.15); }
        .panel.after-panel { border: 1px solid rgba(77,217,192,0.15); }

        .panel .term-line { color: #94a3b8; }
        .before-panel .term-line:first-child { color: #ff3366; }
        .after-panel .term-line:first-child { color: #4DD9C0; }

        /* ═══ ARROW ═══ */
        .transform-arrow {
            display: flex; align-items: center; justify-content: center; gap: 12px;
            padding: 16px 0;
        }
        .transform-arrow i { color: #2563EB; font-size: 36px; }
        .cmd-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 22px; color: #2563EB;
            background: rgba(37,99,235,0.08);
            border: 1px solid rgba(37,99,235,0.15);
            padding: 8px 20px; border-radius: 10px;
        }

        .explain-box {
            background: rgba(15,20,40,0.7);
            border: 1px solid rgba(37,99,235,0.1);
            border-left: 4px solid #2563EB;
            border-radius: 16px;
            padding: 28px 32px;
            display: flex; align-items: flex-start; gap: 14px;
        }
        .explain-box i { color: #2563EB; font-size: 30px; flex-shrink: 0; }
        .explain-box span { font-size: 26px; color: #94a3b8; line-height: 1.5; }

        .slide-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; }
        .footer-bar { width: 80px; height: 3px; background: linear-gradient(90deg, #2563EB, transparent); }
        .slide-num { font-family: 'JetBrains Mono', monospace; font-size: 28px; color: rgba(255,255,255,0.25); }
        .corner-deco { position: absolute; bottom: 60px; left: 60px; width: 100px; height: 100px; border-left: 2px solid rgba(37,99,235,0.12); border-bottom: 2px solid rgba(37,99,235,0.12); }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="slide">
        <div class="brand-bar"><div class="brand-dot"></div><div class="brand-name">KR-CLIDN</div><div class="brand-line"></div></div>
        <div class="content">
            <div class="section-label">// Transformación</div>
            <div class="title">${d.TITLE}</div>
            <div class="panels">
                <div class="panel-label-row"><div class="panel-badge before">${d.BEFORE_TITLE}</div></div>
                <div class="panel before-panel">${beforeHTML}</div>
                <div class="transform-arrow">
                    <i class="material-icons">arrow_downward</i>
                    <div class="cmd-badge">${d.COMMAND}</div>
                    <i class="material-icons">arrow_downward</i>
                </div>
                <div class="panel-label-row"><div class="panel-badge after">${d.AFTER_TITLE}</div></div>
                <div class="panel after-panel">${afterHTML}</div>
            </div>
            <div class="explain-box">
                <i class="material-icons">auto_awesome</i>
                <span>${d.EXPLANATION}</span>
            </div>
        </div>
        <div class="slide-footer"><div class="footer-bar"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
