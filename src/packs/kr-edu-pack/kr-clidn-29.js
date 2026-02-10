/**
 * KR-CLIDN-29: ERROR / SOLUTION
 * Error común con su explicación y solución
 */
export function render(data) {
    const d = {
        TITLE: data.TITLE || 'Error Común',
        ERROR_CMD: data.ERROR_CMD || '$ apt install nmap',
        ERROR_OUTPUT: data.ERROR_OUTPUT || 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)',
        ERROR_MEANING: data.ERROR_MEANING || 'No tienes permisos de superusuario. El sistema necesita acceso root para instalar paquetes.',
        SOLUTION_CMD: data.SOLUTION_CMD || '$ sudo apt install nmap',
        SOLUTION_OUTPUT: data.SOLUTION_OUTPUT || 'Reading package lists... Done. nmap is already the newest version.',
        WHY_IT_WORKS: data.WHY_IT_WORKS || 'El prefijo sudo eleva tus privilegios temporalmente, permitiendo ejecutar comandos que requieren acceso de administrador.',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '05/08'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #000000; color: #fff; width: 1080px; height: 1920px; overflow: hidden; position: relative; }
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,51,102,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,51,102,0.02) 1px, transparent 1px); background-size: 40px 40px; }

        .slide { position: relative; z-index: 1; width: 100%; height: 100%; padding: 60px; display: flex; flex-direction: column; }
        .brand-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
        .brand-dot { width: 14px; height: 14px; background: #2563EB; border-radius: 50%; box-shadow: 0 0 16px #2563EB; }
        .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; letter-spacing: 5px; color: #2563EB; text-shadow: 0 0 24px rgba(37,99,235,0.5); }
        .brand-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(37,99,235,0.4), transparent); }

        .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .title { font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 700; margin-bottom: 32px; display: flex; align-items: center; gap: 14px; }
        .title i { color: #ff3366; font-size: 44px; }

        /* ═══ ERROR SECTION ═══ */
        .section-header {
            display: flex; align-items: center; gap: 12px;
            margin-bottom: 12px;
        }
        .section-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 22px; font-weight: 700;
            padding: 6px 18px; border-radius: 8px;
            letter-spacing: 2px;
        }
        .badge-error { background: rgba(255,51,102,0.12); color: #ff3366; border: 1px solid rgba(255,51,102,0.2); }
        .badge-fix { background: rgba(77,217,192,0.12); color: #4DD9C0; border: 1px solid rgba(77,217,192,0.2); }

        .term-block {
            background: #0c0c0c;
            border-radius: 16px;
            padding: 24px 28px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 22px;
            line-height: 1.8;
            margin-bottom: 12px;
        }
        .term-block.error-block { border: 1px solid rgba(255,51,102,0.15); }
        .term-block.fix-block { border: 1px solid rgba(77,217,192,0.15); }

        .error-cmd { color: #ff3366; font-weight: 700; }
        .error-out { color: #ff6b8a; }
        .fix-cmd { color: #4DD9C0; font-weight: 700; }
        .fix-out { color: #4ade80; }

        .meaning-box {
            background: rgba(255,51,102,0.05);
            border: 1px solid rgba(255,51,102,0.12);
            border-left: 4px solid #ff3366;
            border-radius: 14px;
            padding: 22px 28px;
            margin-bottom: 32px;
        }
        .meaning-box span { font-size: 26px; color: #e2e8f0; line-height: 1.5; }

        .why-box {
            background: rgba(77,217,192,0.05);
            border: 1px solid rgba(77,217,192,0.12);
            border-left: 4px solid #4DD9C0;
            border-radius: 14px;
            padding: 22px 28px;
        }
        .why-box span { font-size: 26px; color: #e2e8f0; line-height: 1.5; }

        .divider { width: 100%; height: 1px; background: rgba(255,255,255,0.05); margin: 24px 0; }

        .slide-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; }
        .footer-bar { width: 80px; height: 3px; background: linear-gradient(90deg, #ff3366, #4DD9C0); }
        .slide-num { font-family: 'JetBrains Mono', monospace; font-size: 28px; color: rgba(255,255,255,0.25); }
        .corner-deco { position: absolute; bottom: 60px; left: 60px; width: 100px; height: 100px; border-left: 2px solid rgba(255,51,102,0.12); border-bottom: 2px solid rgba(77,217,192,0.12); }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="slide">
        <div class="brand-bar"><div class="brand-dot"></div><div class="brand-name">KR-CLIDN</div><div class="brand-line"></div></div>
        <div class="content">
            <div class="title"><i class="material-icons">bug_report</i> ${d.TITLE}</div>

            <div class="section-header"><div class="section-badge badge-error">✕ ERROR</div></div>
            <div class="term-block error-block">
                <div class="error-cmd">${d.ERROR_CMD}</div>
                <div class="error-out">${d.ERROR_OUTPUT}</div>
            </div>
            <div class="meaning-box"><span>${d.ERROR_MEANING}</span></div>

            <div class="divider"></div>

            <div class="section-header"><div class="section-badge badge-fix">✓ SOLUCIÓN</div></div>
            <div class="term-block fix-block">
                <div class="fix-cmd">${d.SOLUTION_CMD}</div>
                <div class="fix-out">${d.SOLUTION_OUTPUT}</div>
            </div>
            <div class="why-box"><span>${d.WHY_IT_WORKS}</span></div>
        </div>
        <div class="slide-footer"><div class="footer-bar"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
