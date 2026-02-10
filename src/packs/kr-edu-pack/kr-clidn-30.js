/**
 * KR-CLIDN-30: MINI TUTORIAL
 * Tutorial compacto de 3 pasos en un solo slide
 */
export function render(data) {
    const d = {
        TITLE: data.TITLE || 'Mini Tutorial',
        DESCRIPTION: data.DESCRIPTION || 'Aprende este proceso en 3 pasos rápidos.',
        STEPS: data.STEPS || [
            { NUM: '1', TITLE: 'Abre la terminal', CMD: '$ Ctrl+Alt+T', RESULT: 'Se abre una ventana de terminal' },
            { NUM: '2', TITLE: 'Actualiza el sistema', CMD: '$ sudo apt update', RESULT: 'Se descargan las listas de paquetes' },
            { NUM: '3', TITLE: 'Instala la herramienta', CMD: '$ sudo apt install nmap', RESULT: 'nmap quedará instalado y listo' }
        ],
        FINAL_NOTE: data.FINAL_NOTE || '¡Listo! Ahora puedes usar nmap desde tu terminal.',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '04/08'
    };

    const stepsHTML = d.STEPS.map(s => `
        <div class="mini-step">
            <div class="step-num-circle">${s.NUM}</div>
            <div class="step-body">
                <div class="step-title">${s.TITLE}</div>
                <div class="step-cmd"><code>${s.CMD}</code></div>
                <div class="step-result"><i class="material-icons">arrow_forward</i> ${s.RESULT}</div>
            </div>
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
        .section-label { font-family: 'JetBrains Mono', monospace; font-size: 24px; color: #a855f7; letter-spacing: 4px; margin-bottom: 16px; }
        .title { font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 700; margin-bottom: 16px; }
        .desc { font-size: 28px; color: #94a3b8; margin-bottom: 36px; line-height: 1.5; }

        /* ═══ STEPS ═══ */
        .steps { display: flex; flex-direction: column; gap: 20px; margin-bottom: 36px; }

        .mini-step {
            display: flex; gap: 20px;
            background: rgba(15,20,40,0.7);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(168,85,247,0.1);
            border-radius: 20px;
            padding: 28px 32px;
        }

        .step-num-circle {
            width: 56px; height: 56px;
            background: linear-gradient(135deg, #a855f7, #2563EB);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-family: 'JetBrains Mono', monospace;
            font-size: 28px; font-weight: 800; color: #fff;
            flex-shrink: 0;
        }

        .step-body { flex: 1; }
        .step-title { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #e2e8f0; margin-bottom: 10px; }

        .step-cmd {
            background: #0c0c0c;
            border: 1px solid rgba(168,85,247,0.12);
            border-radius: 10px;
            padding: 12px 18px;
            margin-bottom: 10px;
        }
        .step-cmd code {
            font-family: 'JetBrains Mono', monospace;
            font-size: 24px; color: #a855f7;
        }

        .step-result {
            font-size: 22px; color: #6b7280;
            display: flex; align-items: center; gap: 8px;
        }
        .step-result i { font-size: 20px; color: #4DD9C0; }

        .final-note {
            background: linear-gradient(135deg, rgba(77,217,192,0.06), rgba(37,99,235,0.04));
            border: 1px solid rgba(77,217,192,0.15);
            border-radius: 16px;
            padding: 28px 32px;
            display: flex; align-items: center; gap: 14px;
        }
        .final-note i { color: #4DD9C0; font-size: 32px; flex-shrink: 0; }
        .final-note span { font-size: 28px; color: #e2e8f0; font-weight: 600; line-height: 1.4; }

        .slide-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; }
        .footer-bar { width: 80px; height: 3px; background: linear-gradient(90deg, #a855f7, #2563EB); }
        .slide-num { font-family: 'JetBrains Mono', monospace; font-size: 28px; color: rgba(255,255,255,0.25); }
        .corner-deco { position: absolute; bottom: 60px; left: 60px; width: 100px; height: 100px; border-left: 2px solid rgba(168,85,247,0.12); border-bottom: 2px solid rgba(168,85,247,0.12); }
    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="slide">
        <div class="brand-bar"><div class="brand-dot"></div><div class="brand-name">KR-CLIDN</div><div class="brand-line"></div></div>
        <div class="content">
            <div class="section-label">// Tutorial Rápido</div>
            <div class="title">${d.TITLE}</div>
            <div class="desc">${d.DESCRIPTION}</div>
            <div class="steps">${stepsHTML}</div>
            <div class="final-note">
                <i class="material-icons">check_circle</i>
                <span>${d.FINAL_NOTE}</span>
            </div>
        </div>
        <div class="slide-footer"><div class="footer-bar"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
