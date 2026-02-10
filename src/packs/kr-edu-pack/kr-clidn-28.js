/**
 * KR-CLIDN-28: CHEAT SHEET
 * Grid compacto de múltiples comandos rápidos
 */
export function render(data) {
    const d = {
        TITLE: data.TITLE || 'Cheat Sheet',
        CATEGORY: data.CATEGORY || 'Comandos Esenciales',
        COMMANDS: data.COMMANDS || [
            { CMD: 'pwd', DESC: 'Directorio actual' },
            { CMD: 'ls -la', DESC: 'Listar todo detallado' },
            { CMD: 'cd ~', DESC: 'Ir al home' },
            { CMD: 'mkdir -p', DESC: 'Crear directorios' },
            { CMD: 'rm -rf', DESC: 'Eliminar recursivo' },
            { CMD: 'cp -r', DESC: 'Copiar recursivo' },
            { CMD: 'mv', DESC: 'Mover/Renombrar' },
            { CMD: 'chmod', DESC: 'Cambiar permisos' }
        ],
        NOTE: data.NOTE || 'Guarda esta referencia rápida para tenerla siempre a mano.',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '05/08'
    };

    const cmdsHTML = d.COMMANDS.map(c => `
        <div class="cs-item">
            <code>${c.CMD}</code>
            <span>${c.DESC}</span>
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
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px); background-size: 40px 40px; }

        .slide { position: relative; z-index: 1; width: 100%; height: 100%; padding: 60px; display: flex; flex-direction: column; }
        .brand-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
        .brand-dot { width: 14px; height: 14px; background: #2563EB; border-radius: 50%; box-shadow: 0 0 16px #2563EB; }
        .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; letter-spacing: 5px; color: #2563EB; text-shadow: 0 0 24px rgba(37,99,235,0.5); }
        .brand-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(37,99,235,0.4), transparent); }

        .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }

        .top-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .cat-tag {
            font-family: 'JetBrains Mono', monospace;
            font-size: 22px; color: #2563EB;
            background: rgba(37,99,235,0.08);
            border: 1px solid rgba(37,99,235,0.15);
            padding: 8px 18px; border-radius: 8px;
            letter-spacing: 2px;
        }
        .title { font-family: 'JetBrains Mono', monospace; font-size: 56px; font-weight: 700; margin-bottom: 36px; }

        /* ═══ CHEAT GRID ═══ */
        .cs-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 36px;
        }

        .cs-item {
            background: rgba(15,20,40,0.7);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(37,99,235,0.08);
            border-radius: 16px;
            padding: 24px;
            display: flex; flex-direction: column; gap: 10px;
        }

        .cs-item code {
            font-family: 'JetBrains Mono', monospace;
            font-size: 28px; font-weight: 700;
            color: #2563EB;
            background: rgba(37,99,235,0.06);
            padding: 8px 14px; border-radius: 8px;
            display: inline-block;
            width: fit-content;
        }

        .cs-item span {
            font-size: 22px; color: #94a3b8;
            line-height: 1.4;
        }

        .note-box {
            background: rgba(37,99,235,0.05);
            border: 1px solid rgba(37,99,235,0.12);
            border-radius: 14px;
            padding: 22px 28px;
            display: flex; align-items: center; gap: 12px;
        }
        .note-box i { color: #2563EB; font-size: 26px; }
        .note-box span { font-size: 24px; color: #94a3b8; }

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
            <div class="top-bar"><div class="cat-tag">// ${d.CATEGORY}</div></div>
            <div class="title">${d.TITLE}</div>
            <div class="cs-grid">${cmdsHTML}</div>
            <div class="note-box">
                <i class="material-icons">bookmark</i>
                <span>${d.NOTE}</span>
            </div>
        </div>
        <div class="slide-footer"><div class="footer-bar"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
