/**
 * KR-CLIDN-26: NETWORK DIAGRAM
 * Diagrama visual de red / topología simplificada
 */
export function render(data) {
    const d = {
        TITLE: data.TITLE || 'Topología de Red',
        NODES: data.NODES || [
            { ICON: 'router', NAME: 'Router', IP: '192.168.1.1', STATUS: 'active' },
            { ICON: 'computer', NAME: 'Kali Linux', IP: '192.168.1.100', STATUS: 'active' },
            { ICON: 'dns', NAME: 'Servidor DNS', IP: '8.8.8.8', STATUS: 'active' },
            { ICON: 'storage', NAME: 'Target', IP: '192.168.1.50', STATUS: 'target' }
        ],
        DESCRIPTION: data.DESCRIPTION || 'Esta topología muestra la red local típica donde realizamos pruebas de penetración autorizadas.',
        SLIDE_NUMBER: data.SLIDE_NUMBER || '04/08'
    };

    const nodesHTML = d.NODES.map(n => {
        const stClass = n.STATUS === 'target' ? 'node-target' : 'node-active';
        return `
            <div class="node ${stClass}">
                <div class="node-icon"><i class="material-icons">${n.ICON}</i></div>
                <div class="node-name">${n.NAME}</div>
                <div class="node-ip">${n.IP}</div>
                <div class="node-status">${n.STATUS === 'target' ? '● TARGET' : '● ONLINE'}</div>
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
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px); background-size: 40px 40px; }
        

        .slide { position: relative; z-index: 1; width: 100%; height: 100%; padding: 60px; display: flex; flex-direction: column; }
        .brand-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; }
        .brand-dot { width: 14px; height: 14px; background: #2563EB; border-radius: 50%; box-shadow: 0 0 16px #2563EB; }
        .brand-name { font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; letter-spacing: 5px; color: #2563EB; text-shadow: 0 0 24px rgba(37,99,235,0.5); }
        .brand-line { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(37,99,235,0.4), transparent); }

        .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .section-label { font-family: 'JetBrains Mono', monospace; font-size: 24px; color: #2563EB; letter-spacing: 4px; margin-bottom: 16px; }
        .title { font-family: 'JetBrains Mono', monospace; font-size: 52px; font-weight: 700; margin-bottom: 40px; }

        /* ═══ NETWORK GRID ═══ */
        .net-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 36px; }

        .node {
            background: rgba(15,20,40,0.8);
            backdrop-filter: blur(15px);
            border-radius: 20px;
            padding: 32px;
            display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .node-active { border: 1px solid rgba(37,99,235,0.15); }
        .node-target { border: 2px solid rgba(255,51,102,0.3); box-shadow: 0 0 30px rgba(255,51,102,0.08); }

        .node-icon {
            width: 72px; height: 72px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 16px;
        }
        .node-active .node-icon { background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.2); }
        .node-target .node-icon { background: rgba(255,51,102,0.1); border: 1px solid rgba(255,51,102,0.2); }
        .node-active .node-icon i { color: #2563EB; font-size: 36px; }
        .node-target .node-icon i { color: #ff3366; font-size: 36px; }

        .node-name { font-family: 'JetBrains Mono', monospace; font-size: 26px; font-weight: 700; color: #e2e8f0; margin-bottom: 8px; }
        .node-ip { font-family: 'JetBrains Mono', monospace; font-size: 22px; color: #6b7280; margin-bottom: 12px; }

        .node-status { font-family: 'JetBrains Mono', monospace; font-size: 18px; letter-spacing: 2px; }
        .node-active .node-status { color: #4DD9C0; }
        .node-target .node-status { color: #ff3366; }

        /* ═══ CONNECTIONS ═══ */
        .connections {
            display: flex; justify-content: center; gap: 16px;
            margin-bottom: 28px;
        }
        .conn-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(37,99,235,0.3); }

        .desc-box {
            background: rgba(37,99,235,0.05);
            border: 1px solid rgba(37,99,235,0.12);
            border-radius: 16px;
            padding: 28px 32px;
            display: flex; align-items: flex-start; gap: 14px;
        }
        .desc-box i { color: #2563EB; font-size: 30px; flex-shrink: 0; }
        .desc-box span { font-size: 26px; color: #94a3b8; line-height: 1.5; }

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
            <div class="section-label">// Red</div>
            <div class="title">${d.TITLE}</div>
            <div class="net-grid">${nodesHTML}</div>
            <div class="connections">
                <div class="conn-dot"></div><div class="conn-dot"></div><div class="conn-dot"></div>
                <div class="conn-dot"></div><div class="conn-dot"></div>
            </div>
            <div class="desc-box">
                <i class="material-icons">hub</i>
                <span>${d.DESCRIPTION}</span>
            </div>
        </div>
        <div class="slide-footer"><div class="footer-bar"></div><div class="slide-num">${d.SLIDE_NUMBER}</div></div>
        <div class="corner-deco"></div>
    </div>
</body>
</html>`;
}
