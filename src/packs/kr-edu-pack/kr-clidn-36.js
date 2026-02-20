/**
 * KR-CLIDN-36: TIMELINE (Incident)
 * Vertical timeline with date markers for forensic chronology.
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Cronología del Ataque',
        EVENTS: data.EVENTS || [
            { TIME: '08:00', ICON: '🔍', EVENT: 'Reconocimiento inicial', DETAIL: 'Escaneo de puertos detectado' },
            { TIME: '08:15', ICON: '💉', EVENT: 'Explotación', DETAIL: 'SQL Injection en formulario de login' },
            { TIME: '08:30', ICON: '🚨', EVENT: 'Detección', DETAIL: 'IDS genera alerta de tráfico anómalo' }
        ],
        IMPACT: data.IMPACT || 'Tiempo total: 30 minutos hasta detección'
    };

    const eventsHTML = d.EVENTS.map((e, i) => `
        <div style="display:flex; gap:16px; align-items:flex-start; position:relative;">
            <!-- Timeline line -->
            <div style="display:flex; flex-direction:column; align-items:center; min-width:60px;">
                <div class="mono" style="font-size:34px; color:var(--primary-color); font-weight:700;">${esc(e.TIME)}</div>
                <div style="width:3px; flex:1; background:linear-gradient(180deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 20%, transparent)); margin-top:8px; min-height:20px;"></div>
            </div>
            <!-- Event dot -->
            <div style="width:40px; height:40px; background:rgba(0,0,0,0.8); border:2px solid var(--primary-color); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:34px; flex-shrink:0; margin-top:2px; box-shadow:0 0 15px color-mix(in srgb, var(--primary-color) 25%, transparent);">${e.ICON || '⚡'}</div>
            <!-- Content -->
            <div style="flex:1; padding-bottom:16px;">
                <div style="font-size:41px; font-weight:700; color:#fff; margin-bottom:4px;">${esc(e.EVENT)}</div>
                <div style="font-size:34px; color:#aaa; line-height:1.4;">${esc(e.DETAIL)}</div>
            </div>
        </div>`).join('\n');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-36</title>
    <style>
        .timeline-container { flex:1; display:flex; flex-direction:column; justify-content:center; }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="mono" style="font-size:34px; color:var(--accent-color); letter-spacing:3px; margin-bottom:8px;">🔥 TIMELINE</div>
        <h1 class="cyber-title" style="font-size:75px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <div class="timeline-container">
            ${eventsHTML}
        </div>

        <!-- Impact -->
        <div class="glass-panel" style="display:flex; gap:12px; align-items:center; border-color:color-mix(in srgb, var(--accent-color) 15%, transparent);">
            <span style="font-size:41px;">⏱️</span>
            <span style="font-size:37px; color:#ffffff; line-height:1.4;">${TemplateUtils.renderEditable('IMPACT', `${esc(d.IMPACT)}`, data._overrides)}</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
