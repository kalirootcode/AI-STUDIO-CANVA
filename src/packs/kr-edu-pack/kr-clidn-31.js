/**
 * KR-CLIDN-31: SCRIPT EDITOR (Refactored)
 * Editor de código profesional tipo VS Code/IDE
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Script de Escaneo',
        FILENAME: data.FILENAME || 'scan.sh',
        LANGUAGE: data.LANGUAGE || 'bash',
        DESCRIPTION: data.DESCRIPTION || 'Script que automatiza el escaneo de puertos.',
        CODE_LINES: data.CODE_LINES || [
            { TEXT: '#!/bin/bash', TYPE: 'comment' },
            { TEXT: '', TYPE: 'blank' },
            { TEXT: '# Variables de configuración', TYPE: 'comment' },
            { TEXT: 'TARGET=$1', TYPE: 'variable' },
            { TEXT: 'OUTPUT="scan_$(date +%Y%m%d).txt"', TYPE: 'variable' },
            { TEXT: '', TYPE: 'blank' },
            { TEXT: '# Ejecutar escaneo completo', TYPE: 'comment' },
            { TEXT: 'nmap -sS -sV -O $TARGET -oN $OUTPUT', TYPE: 'command' },
            { TEXT: '', TYPE: 'blank' },
            { TEXT: 'echo "Escaneo completado: $OUTPUT"', TYPE: 'string' }
        ],
        EXPLANATION: data.EXPLANATION || 'Este script toma una IP como argumento y ejecuta un escaneo SYN con detección de versiones y OS.'
    };

    const colorMap = {
        comment: '#6a9955',
        variable: 'var(--warning-color)',
        command: 'var(--primary-color)',
        string: '#ce9178',
        keyword: '#c586c0',
        blank: 'transparent'
    };

    const linesHTML = d.CODE_LINES.map((l, i) => {
        const num = String(i + 1).padStart(2, ' ');
        const color = colorMap[l.TYPE] || '#e2e8f0';
        return `<div style="display:flex; gap:16px; padding:4px 0; line-height:1.7;">
            <span style="color:#444; font-size: 41px; min-width:30px; text-align:right; user-select:none; font-family:var(--font-mono);">${num}</span>
            <span style="color:${color}; font-size: 41px; font-family:var(--font-mono);">${l.TEXT ? esc(l.TEXT) : '&nbsp;'}</span>
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-31</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Language Badge -->
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <div class="mono" style="font-size: 41px; color:var(--primary-color); background:rgba(0,217,255,0.06); border:1px solid rgba(0,217,255,0.15); padding:6px 14px; border-radius:6px; letter-spacing:2px;">${esc(d.LANGUAGE.toUpperCase())}</div>
        </div>

        <h1 class="cyber-title" style="font-size:68px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}</div>

        <!-- Code Editor -->
        <div class="terminal-window" style="flex:1;">
            <div class="term-header">
                <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                <span class="mono" style="margin-left:12px; font-size: 41px; color:#999;">📄 ${esc(d.FILENAME)}</span>
                <span class="mono" style="margin-left:auto; font-size: 41px; color:#ffffff;">${esc(d.LANGUAGE)}</span>
            </div>
            <div class="term-body">
                ${linesHTML}
            </div>
        </div>

        <!-- Explanation -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start;">
            <span style="font-size:41px;">💡</span>
            <span style="font-size: 41px; color:#e2e8f0; line-height:1.5;">${esc(d.EXPLANATION)}</span>
        </div>

        <!-- Footer -->
        
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
