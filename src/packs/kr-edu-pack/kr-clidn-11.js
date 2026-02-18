/**
 * KR-CLIDN-11: COMMAND CARD (Refactored)
 * Dense command reference with syntax, example, and flags
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        COMMAND_NAME: data.COMMAND_NAME || 'nmap',
        COMMAND_NUMBER: data.COMMAND_NUMBER || '01',
        TOTAL_COMMANDS: data.TOTAL_COMMANDS || '30',
        CATEGORY: data.CATEGORY || 'Escaneo',
        SYNTAX: data.SYNTAX || 'nmap [opciones] [target]',
        DESCRIPTION: data.DESCRIPTION || 'Escanea puertos y servicios en red',
        EXAMPLE_CMD: data.EXAMPLE_CMD || '$ nmap -sS -sV 192.168.1.1',
        EXAMPLE_OUTPUT: data.EXAMPLE_OUTPUT || 'PORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http',
        KEY_FLAGS: data.KEY_FLAGS || [
            { FLAG: '-sS', DESC: 'SYN scan (sigiloso)' },
            { FLAG: '-sV', DESC: 'Detecta versiones' },
            { FLAG: '-A', DESC: 'Escaneo agresivo' }
        ]
    };

    const flagsHTML = d.KEY_FLAGS.map(f => `
        <div style="display:flex; align-items:center; gap:16px; padding:10px 16px; background:#0a0a0a; border-left:3px solid var(--primary-color); margin-bottom:8px;">
            <span class="mono" style="font-size:24px; font-weight:800; color:var(--primary-color); min-width:60px;">${esc(f.FLAG)}</span>
            <span style="font-size:22px; color:#ffffff;">${esc(f.DESC)}</span>
        </div>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-11</title>
    <style>
        .syntax-box {
            background: #0c0c0c; border: 2px solid var(--primary-color);
            border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Header -->
        <div class="glass-panel" style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px; border-left:4px solid var(--secondary-color);">
            <span class="mono" style="font-size:22px; color:var(--primary-color); font-weight:700;">[${esc(d.COMMAND_NUMBER)}/${esc(d.TOTAL_COMMANDS)}]</span>
            <span class="mono" style="font-size:20px; color:var(--secondary-color);">${esc(d.CATEGORY)}</span>
        </div>

        <!-- Command Name -->
        <div class="mono" style="font-size:48px; font-weight:800; color:var(--primary-color); text-align:center; margin-bottom:12px;">${esc(d.COMMAND_NAME)}</div>
        <div class="cyber-subtitle" style="text-align:center;">${TemplateUtils.renderEditable('DESCRIPTION', `${TemplateUtils.renderEditable('DESCRIPTION', `${TemplateUtils.renderEditable('DESCRIPTION', `${TemplateUtils.renderEditable('DESCRIPTION', `${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}`, data._overrides)}`, data._overrides)}`, data._overrides)}`, data._overrides)}</div>

        <!-- Syntax -->
        <div class="syntax-box">
            <div class="mono" style="font-size:16px; color:var(--primary-color); opacity:0.7; margin-bottom:8px;">SINTAXIS</div>
            <div class="mono" style="font-size:26px; color:#fff; font-weight:600;">${esc(d.SYNTAX)}</div>
        </div>

        <!-- Terminal Example -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
            </div>
            <div class="term-body">
                <div style="color:var(--primary-color); font-size:24px; font-weight:700; margin-bottom:12px;">${esc(d.EXAMPLE_CMD)}</div>
                <div style="color:var(--success-color); font-size:22px; line-height:1.6; white-space:pre-wrap;">${esc(d.EXAMPLE_OUTPUT)}</div>
            </div>
        </div>

        <!-- Flags -->
        <div class="mono" style="font-size:18px; color:#ffffff; letter-spacing:2px; margin-bottom:12px;">FLAGS PRINCIPALES</div>
        ${flagsHTML}
            
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
