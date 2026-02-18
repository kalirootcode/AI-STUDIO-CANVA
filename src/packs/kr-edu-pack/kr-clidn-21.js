/**
 * KR-CLIDN-21: PRO TERMINAL (Refactored)
 * Multi-line terminal with colorized output
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Terminal en Acción',
        TERMINAL_LINES: data.TERMINAL_LINES || [
            { TYPE: 'prompt', TEXT: '$ nmap -sS -sV 192.168.1.1' },
            { TYPE: 'output', TEXT: 'Starting Nmap 7.94' },
            { TYPE: 'highlight', TEXT: 'PORT     STATE SERVICE  VERSION' },
            { TYPE: 'success', TEXT: '22/tcp   open  ssh      OpenSSH 8.9' },
            { TYPE: 'success', TEXT: '80/tcp   open  http     Apache 2.4' },
            { TYPE: 'warning', TEXT: '443/tcp  open  ssl      VULNERABLE' },
            { TYPE: 'output', TEXT: 'Scan done: 1 IP in 12.34s' }
        ],
        EXPLANATION: data.EXPLANATION || 'Escaneo SYN que detecta puertos abiertos y versiones de servicios'
    };

    const colorMap = {
        prompt: 'var(--primary-color)',
        highlight: 'var(--accent-color)',
        success: 'var(--success-color)',
        warning: 'var(--warning-color)',
        error: '#ff3333',
        output: '#94a3b8'
    };

    const linesHTML = d.TERMINAL_LINES.map(l => {
        const color = colorMap[l.TYPE] || '#94a3b8';
        const prefix = l.TYPE === 'prompt' ? '<span style="color:var(--success-color);">❯</span> ' : '  ';
        return `<div style="padding:6px 0; font-size:22px; color:${color}; font-family:var(--font-mono); line-height:1.6;">${prefix}${esc(l.TEXT)}</div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-21</title>
    <style>
        .pro-terminal { flex: 1; display: flex; flex-direction: column; }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:42px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <div class="pro-terminal">
            <!-- Terminal Window -->
            <div class="terminal-window" style="flex:1;">
                <div class="term-header">
                    <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                    <span class="mono" style="margin-left:auto; font-size:16px; color:#666;">terminal</span>
                </div>
                <div class="term-body">
                    ${linesHTML}
                </div>
            </div>

            <!-- Explanation -->
            <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start; margin-top:20px;">
                <span style="font-size:24px;">💡</span>
                <span style="font-size:22px; color:#e2e8f0; line-height:1.5;">${esc(d.EXPLANATION)}</span>
            </div>
        </div>

        <!-- Footer -->
        <div style="display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // TERMINAL</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
