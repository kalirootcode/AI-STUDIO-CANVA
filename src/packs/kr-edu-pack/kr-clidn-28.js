/**
 * KR-CLIDN-28: CHEAT SHEET (Refactored)
 * Grid compacto de múltiples comandos rápidos
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

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
        NOTE: data.NOTE || 'Guarda esta referencia rápida para tenerla siempre a mano.'
    };

    const cmdsHTML = d.COMMANDS.map(c => `
        <div class="terminal-window" style="margin-bottom: 8px; border-width: 1px; flex: 1;">
            <div class="term-header" style="border-bottom: 1px solid var(--primary-color);">
                <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
            </div>
            <div class="term-body" style="padding: 12px; display:flex; justify-content:space-between; align-items:center;">
                <code style="font-family:var(--font-mono); font-size:41px; color:var(--primary-color); font-weight:700;">${esc(c.CMD)}</code>
                <span style="font-size: 34px; color:#ffffff; opacity:0.8;">// ${esc(c.DESC)}</span>
            </div>
        </div>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-28</title>
    <style>
        .cs-grid { display: flex; flex-direction: column; gap: 12px; flex: 1; justify-content: center; }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Category Badge -->
        <div class="mono" style="font-size: 41px; color:var(--warning-color); background:rgba(255,149,0,0.08); border:1px solid rgba(255,149,0,0.15); padding:6px 14px; border-radius:6px; display:inline-block; letter-spacing:2px; margin-bottom:8px; align-self:flex-start;">
            📋 ${esc(d.CATEGORY)}
        </div>

        <h1 class="cyber-title" style="font-size:75px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- Commands Grid -->
        <div class="cs-grid">
            ${cmdsHTML}
        </div>

        <!-- Note -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start;">
            <span style="font-size: 41px;">💾</span>
            <span style="font-size: 41px; color:#ffffff; line-height:1.5;">${esc(d.NOTE)}</span>
        </div>

        <!-- Footer -->
        
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
