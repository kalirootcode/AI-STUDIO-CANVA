/**
 * KR-CLIDN-23: PROCESS FLOW
 * Flujo visual de cómo funciona algo (pasos con flechas)
 */
export function render(data) {
    const d = {
        TITLE: data.TITLE || 'Cómo Funciona',
        FLOW_STEPS: data.FLOW_STEPS || [
            { ICON: 'keyboard', LABEL: 'Input', DESC: 'El usuario ejecuta el comando' },
            { ICON: 'memory', LABEL: 'Proceso', DESC: 'El kernel interpreta y procesa' },
            { ICON: 'storage', LABEL: 'Sistema', DESC: 'Se accede al filesystem' },
            { ICON: 'monitor', LABEL: 'Output', DESC: 'El resultado aparece en terminal' }
        ],
        DESCRIPTION: data.DESCRIPTION || 'Cada comando en Linux sigue este flujo desde la entrada hasta la salida.',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '04/08'
    };

    const flowHTML = d.FLOW_STEPS.map((step, i) => {
        const arrow = i < d.FLOW_STEPS.length - 1 ? '<div class="flow-arrow"><i class="material-icons">arrow_downward</i></div>' : '';
        return `
            <div class="flow-step">
                <div class="flow-num">${String(i + 1).padStart(2, '0')}</div>
                <div class="flow-icon-box"><i class="material-icons">${step.ICON}</i></div>
                <div class="flow-info">
                    <div class="flow-label">${step.LABEL}</div>
                    <div class="flow-desc">${step.DESC}</div>
                </div>
            </div>
            ${arrow}`;
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
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(168,85,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.03) 1px, transparent 1px); background-size: 40px 40px; }

        .slide { position: relative; z-index: 1; width: 100%; height: 100%; padding: 60px; display: flex; flex-direction: column; }
        .brand-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
        .brand-dot { width: 14px; height: 14px; background: #2563EB; border-radius: 50%; box-shadow: 0 0 16px #2563EB; }
        .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; letter-spacing: 5px; color: #2563EB; text-shadow: 0 0 24px rgba(37,99,235,0.5); }
        .brand-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(37,99,235,0.4), transparent); }

        .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }

        .section-label { font-family: 'JetBrains Mono', monospace; font-size: 24px; color: #a855f7; letter-spacing: 4px; margin-bottom: 16px; }
        .title { font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 700; margin-bottom: 40px; }

        /* ═══ FLOW ═══ */
        .flow { display: flex; flex-direction: column; align-items: stretch; gap: 0; margin-bottom: 36px; }

        .flow-step {
            display: flex; align-items: center; gap: 20px;
            background: rgba(15,20,40,0.7);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(168,85,247,0.12);
            border-radius: 18px;
            padding: 28px 32px;
        }

        .flow-num {
            font-family: 'JetBrains Mono', monospace;
            font-size: 22px; font-weight: 700;
            color: rgba(168,85,247,0.4);
        }

        .flow-icon-box {
            width: 64px; height: 64px;
            background: rgba(168,85,247,0.1);
            border: 1px solid rgba(168,85,247,0.2);
            border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .flow-icon-box i { font-size: 32px; color: #a855f7; }

        .flow-info { flex: 1; }
        .flow-label { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #e2e8f0; margin-bottom: 6px; }
        .flow-desc { font-size: 24px; color: #94a3b8; line-height: 1.4; }

        .flow-arrow {
            display: flex; justify-content: center; padding: 8px 0;
        }
        .flow-arrow i { color: rgba(168,85,247,0.3); font-size: 32px; }

        .desc-bottom {
            background: rgba(168,85,247,0.05);
            border: 1px solid rgba(168,85,247,0.12);
            border-radius: 16px;
            padding: 28px 32px;
            display: flex; align-items: flex-start; gap: 14px;
        }
        .desc-bottom i { color: #a855f7; font-size: 30px; flex-shrink: 0; }
        .desc-bottom span { font-size: 26px; color: #94a3b8; line-height: 1.5; }

        .slide-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; }
        .footer-bar { width: 80px; height: 3px; background: linear-gradient(90deg, #a855f7, transparent); }
        .slide-num { font-family: 'JetBrains Mono', monospace; font-size: 28px; color: rgba(255,255,255,0.25); }
        .corner-deco { position: absolute; bottom: 60px; left: 60px; width: 100px; height: 100px; border-left: 2px solid rgba(168,85,247,0.12); border-bottom: 2px solid rgba(168,85,247,0.12); }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="slide">
        <div class="brand-bar"><div class="brand-dot"></div><div class="brand-name">KR-CLIDN</div><div class="brand-line"></div></div>
        <div class="content">
            <div class="section-label">// Flujo</div>
            <div class="title">${d.TITLE}</div>
            <div class="flow">${flowHTML}</div>
            <div class="desc-bottom">
                <i class="material-icons">auto_awesome</i>
                <span>${d.DESCRIPTION}</span>
            </div>
        </div>
        <div class="slide-footer"><div class="footer-bar"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
