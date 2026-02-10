/**
 * KR-CLIDN-25: PRO TIP CARD
 * Tip profesional visual con gran énfasis
 */
export function render(data) {
    const d = {
        TIP_NUMBER: data.TIP_NUMBER || '01',
        TITLE: data.TITLE || 'Pro Tip',
        TIP_TEXT: data.TIP_TEXT || 'Usa alias en tu .bashrc para acelerar tu flujo de trabajo. Esto te ahorrará horas a largo plazo.',
        EXAMPLE_CMD: data.EXAMPLE_CMD || "alias ll='ls -la --color=auto'",
        WHY_TEXT: data.WHY_TEXT || 'Los alias convierten comandos largos en atajos que puedes escribir en segundos.',
        CATEGORY: data.CATEGORY || 'Productividad',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '04/08'
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
        
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,149,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,149,0,0.03) 1px, transparent 1px); background-size: 40px 40px; }

        .slide { position: relative; z-index: 1; width: 100%; height: 100%; padding: 60px; display: flex; flex-direction: column; }
        .brand-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
        .brand-dot { width: 14px; height: 14px; background: #2563EB; border-radius: 50%; box-shadow: 0 0 16px #2563EB; }
        .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; letter-spacing: 5px; color: #2563EB; text-shadow: 0 0 24px rgba(37,99,235,0.5); }
        .brand-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(37,99,235,0.4), transparent); }

        .content { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }

        .tip-badge {
            font-family: 'JetBrains Mono', monospace;
            font-size: 22px; font-weight: 700;
            background: rgba(255,149,0,0.12);
            color: #ff9500;
            border: 1px solid rgba(255,149,0,0.2);
            padding: 8px 20px; border-radius: 10px;
            letter-spacing: 3px;
            margin-bottom: 20px;
        }

        .tip-icon-box {
            width: 100px; height: 100px;
            background: linear-gradient(135deg, rgba(255,149,0,0.15), rgba(255,149,0,0.05));
            border: 2px solid rgba(255,149,0,0.25);
            border-radius: 28px;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 32px;
            box-shadow: 0 0 40px rgba(255,149,0,0.1);
        }
        .tip-icon-box i { font-size: 50px; color: #ff9500; }

        .tip-num {
            font-family: 'JetBrains Mono', monospace;
            font-size: 28px; font-weight: 800;
            color: rgba(255,149,0,0.3); margin-bottom: 12px;
        }

        .tip-title {
            font-family: 'JetBrains Mono', monospace;
            font-size: 56px; font-weight: 700;
            margin-bottom: 28px;
        }

        .tip-text {
            font-size: 32px; color: #e2e8f0;
            line-height: 1.5; max-width: 800px;
            margin-bottom: 40px;
        }

        .cmd-block {
            background: #0c0c0c;
            border: 1px solid rgba(255,149,0,0.15);
            border-radius: 14px;
            padding: 24px 36px;
            margin-bottom: 36px;
            width: 100%;
            max-width: 850px;
        }
        .cmd-block code {
            font-family: 'JetBrains Mono', monospace;
            font-size: 28px; color: #ff9500;
        }

        .why-box {
            background: rgba(255,149,0,0.05);
            border: 1px solid rgba(255,149,0,0.12);
            border-radius: 16px;
            padding: 24px 32px;
            max-width: 850px;
            display: flex; align-items: center; gap: 14px;
        }
        .why-box i { color: #ff9500; font-size: 28px; flex-shrink: 0; }
        .why-box span { font-size: 26px; color: #94a3b8; text-align: left; line-height: 1.4; }

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
            <div class="tip-badge">// ${d.CATEGORY}</div>
            <div class="tip-icon-box"><i class="material-icons">lightbulb</i></div>
            <div class="tip-num">TIP #${d.TIP_NUMBER}</div>
            <div class="tip-title">${d.TITLE}</div>
            <div class="tip-text">${d.TIP_TEXT}</div>
            <div class="cmd-block"><code>${d.EXAMPLE_CMD}</code></div>
            <div class="why-box">
                <i class="material-icons">trending_up</i>
                <span>${d.WHY_TEXT}</span>
            </div>
        </div>
        <div class="slide-footer"><div class="footer-bar"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
