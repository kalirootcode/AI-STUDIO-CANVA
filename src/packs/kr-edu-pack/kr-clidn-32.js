/**
 * KR-CLIDN-32: STATISTIC CHART (Refactored)
 * Visualización de datos: Gráficos circulares y barras
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Estadísticas de Ataque',
        TYPE: data.TYPE || 'circle',
        STATS: data.STATS || [
            { LABEL: 'Phishing', VALUE: 85, COLOR: 'var(--accent-color)' },
            { LABEL: 'Ransomware', VALUE: 60, COLOR: '#FF9500' },
            { LABEL: 'DDoS', VALUE: 40, COLOR: 'var(--primary-color)' }
        ],
        DESCRIPTION: data.DESCRIPTION || 'El phishing sigue siendo el vector de ataque principal.'
    };

    const isCircle = d.TYPE === 'circle';

    let chartsHTML = '';

    if (isCircle) {
        chartsHTML = `<div style="display:flex; justify-content:center; gap:40px; flex-wrap:wrap; flex:1; align-items:center;">
            ${d.STATS.map(s => `
                <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
                    <div style="width:140px; height:140px; border-radius:50%; background:conic-gradient(${s.COLOR} ${s.VALUE}%, #1a1a1a ${s.VALUE}%); display:flex; align-items:center; justify-content:center;">
                        <div style="width:100px; height:100px; border-radius:50%; background:#0a0a0a; display:flex; align-items:center; justify-content:center;">
                            <span style="font-family:var(--font-mono); font-size:48px; font-weight:800; color:${s.COLOR};">${s.VALUE}%</span>
                        </div>
                    </div>
                    <span style="font-family:var(--font-mono); font-size: 41px; color:#ffffff; letter-spacing:1px;">${esc(s.LABEL)}</span>
                </div>
            `).join('')}
        </div>`;
    } else {
        chartsHTML = `<div style="display:flex; flex-direction:column; gap:24px; flex:1; justify-content:center;">
            ${d.STATS.map(s => `
                <div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="font-size: 41px; font-weight:600; color:#e2e8f0;">${esc(s.LABEL)}</span>
                        <span style="font-family:var(--font-mono); font-size: 41px; font-weight:700; color:${s.COLOR};">${s.VALUE}%</span>
                    </div>
                    <div style="height:16px; background:#1a1a1a; border-radius:8px; overflow:hidden;">
                        <div style="height:100%; width:${s.VALUE}%; background:${s.COLOR}; border-radius:8px; box-shadow:0 0 20px ${s.COLOR}40;"></div>
                    </div>
                </div>
            `).join('')}
        </div>`;
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-32</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:71px;">📊 ${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- Charts -->
        ${chartsHTML}

        <!-- Description -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start;">
            <span style="font-size:41px;">📈</span>
            <span style="font-size: 41px; color:#e2e8f0; line-height:1.5;">${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}</span>
        </div>

        <!-- Footer -->
        
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
