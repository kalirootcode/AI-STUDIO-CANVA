/**
 * KR-CLIDN-16: DO vs DON'T
 * Buenas vs malas prácticas
 */
export function render(data) {
    const d = {
        TITLE: data.TITLE || 'Buenas Prácticas',
        DO_ITEMS: data.DO_ITEMS || [
            { TEXT: 'Pide autorización antes de escanear' },
            { TEXT: 'Documenta tus hallazgos' }
        ],
        DONT_ITEMS: data.DONT_ITEMS || [
            { TEXT: 'Escanear redes sin autorización' },
            { TEXT: 'Compartir vulnerabilidades públicamente' }
        ],
        BOTTOM_TIP: data.BOTTOM_TIP || 'La ética es lo que diferencia a un hacker de un criminal.',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '05/08'
    };

    const doHTML = d.DO_ITEMS.map(i => `<div class="practice-item do"><i class="material-icons">check_circle</i><span>${i.TEXT}</span></div>`).join('\n');
    const dontHTML = d.DONT_ITEMS.map(i => `<div class="practice-item dont"><i class="material-icons">cancel</i><span>${i.TEXT}</span></div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #000000; color: #fff; width: 1080px; height: 1920px; overflow: hidden; position: relative; }
        

        .slide { position: relative; z-index: 1; width: 100%; height: 100%; padding: 60px; display: flex; flex-direction: column; }
        .brand-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 50px; }
        .brand-logo { width: 44px; height: 44px; object-fit: contain; }
        .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #2563EB; text-shadow: 0 0 20px rgba(37,99,235,0.4); }
        .brand-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(37,99,235,0.3), transparent); }
        .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }

        .section-label { font-family: 'JetBrains Mono', monospace; font-size: 30px; color: #ff9500; letter-spacing: 3px; margin-bottom: 16px; }
        .title { font-family: 'JetBrains Mono', monospace; font-size: 48px; font-weight: 700; margin-bottom: 40px; }

        .columns { display: flex; gap: 24px; margin-bottom: 36px; }

        .column {
            flex: 1;
            background: rgba(15,20,40,0.7);
            backdrop-filter: blur(15px);
            border-radius: 18px; padding: 32px;
            position: relative; overflow: hidden;
        }

        .column::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .column.do-col { border: 1px solid rgba(77,217,192,0.15); }
        .column.do-col::before { background: linear-gradient(90deg, #4DD9C0, transparent); }
        .column.dont-col { border: 1px solid rgba(255,51,102,0.15); }
        .column.dont-col::before { background: linear-gradient(90deg, #ff3366, transparent); }

        .col-header { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .col-header i { font-size: 32px; }
        .do-col .col-header i { color: #4DD9C0; }
        .dont-col .col-header i { color: #ff3366; }

        .col-title { font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 700; }
        .do-col .col-title { color: #4DD9C0; }
        .dont-col .col-title { color: #ff3366; }

        .practices { display: flex; flex-direction: column; gap: 14px; }

        .practice-item { display: flex; align-items: flex-start; gap: 10px; }
        .practice-item.do i { color: #4DD9C0; font-size: 30px; margin-top: 2px; }
        .practice-item.dont i { color: #ff3366; font-size: 30px; margin-top: 2px; }
        .practice-item span { font-size: 28px; color: #94a3b8; line-height: 1.4; }

        .tip-bottom {
            background: rgba(255,149,0,0.06);
            border: 1px solid rgba(255,149,0,0.15);
            border-radius: 12px; padding: 24px 28px;
            display: flex; align-items: center; gap: 12px;
        }
        .tip-bottom i { color: #ff9500; font-size: 32px; }
        .tip-bottom span { font-size: 30px; color: #e2e8f0; line-height: 1.4; }

        .slide-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 30px; }
        .slide-num { font-family: 'JetBrains Mono', monospace; font-size: 32px; color: rgba(255,255,255,0.3); }
        .footer-accent { width: 60px; height: 3px; background: linear-gradient(90deg, #ff9500, transparent); }
        .corner-deco { position: absolute; bottom: 60px; left: 60px; width: 80px; height: 80px; border-left: 2px solid rgba(255,149,0,0.12); border-bottom: 2px solid rgba(255,149,0,0.12); }
    </style>
</head>
<body>
    <div class="slide">
        <div class="brand-bar"><img class="brand-logo" src="data:image/png;base64,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" alt="KR"><div class="brand-name">KR-CLIDN</div><div class="brand-line"></div></div>
        <div class="content">
            <div class="section-label">// Ética</div>
            <div class="title">${d.TITLE}</div>
            <div class="columns">
                <div class="column do-col">
                    <div class="col-header"><i class="material-icons">thumb_up</i><div class="col-title">DO ✓</div></div>
                    <div class="practices">${doHTML}</div>
                </div>
                <div class="column dont-col">
                    <div class="col-header"><i class="material-icons">thumb_down</i><div class="col-title">DON'T ✗</div></div>
                    <div class="practices">${dontHTML}</div>
                </div>
            </div>
            <div class="tip-bottom">
                <i class="material-icons">gavel</i>
                <span>${d.BOTTOM_TIP}</span>
            </div>
        </div>
        <div class="slide-footer"><div class="footer-accent"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
