/**
 * KR-CLIDN-14: CODE BLOCK — SYNTAX HIGHLIGHTED (Refactored)
 * Code display with line numbers and explanation
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Script de Automatización',
        LANGUAGE: data.LANGUAGE || 'bash',
        DESCRIPTION: data.DESCRIPTION || 'Este script automatiza la enumeración de puertos.',
        CODE_LINES: data.CODE_LINES || [
            { LINE: '#!/bin/bash', COMMENT: '' },
            { LINE: 'target="192.168.1.50"', COMMENT: '# Objetivo' },
            { LINE: 'echo "Escaneando $target..."', COMMENT: '' },
            { LINE: 'nmap -sS -p- $target', COMMENT: '# Escaneo rápido' }
        ],
        EXPLANATION: data.EXPLANATION || 'El uso de variables permite reutilizar el script.'
    };

    const codeHTML = d.CODE_LINES.map((line, i) => `
        <div style="display:flex; gap:16px; align-items:flex-start; padding:4px 0;">
            <span style="color:#444; font-size: 41px; min-width:30px; text-align:right; user-select:none;">${i + 1}</span>
            <span style="color:var(--primary-color); font-size: 41px; flex:1;">${esc(line.LINE)}</span>
            ${line.COMMENT ? `<span style="color:#ffffff; font-size: 41px; white-space:nowrap;">${esc(line.COMMENT)}</span>` : ''}
        </div>`).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-14</title>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Language badge -->
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
            <div class="mono" style="font-size: 41px; color:var(--primary-color); background:rgba(0,217,255,0.06); border:1px solid rgba(0,217,255,0.15); padding:6px 14px; border-radius:6px; letter-spacing:2px;">${esc(d.LANGUAGE.toUpperCase())}</div>
        </div>

        <h1 class="cyber-title" style="font-size:71px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
        <div class="cyber-subtitle">${TemplateUtils.renderEditable('DESCRIPTION', `${esc(d.DESCRIPTION)}`, data._overrides)}</div>

        <!-- Code Block -->
        <div class="terminal-window" style="flex:1;">
            <div class="term-header">
                <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                <span class="mono" style="margin-left:auto; font-size: 41px; color:#ffffff;">${esc(d.LANGUAGE)}</span>
            </div>
            <div class="term-body" style="font-family:var(--font-mono);">
                ${codeHTML}
            </div>
        </div>

        <!-- Explanation -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start;">
            <span style="font-size:41px;">💡</span>
            <span style="font-size: 41px; color:#e2e8f0; line-height:1.5;">${esc(d.EXPLANATION)}</span>
        </div>
            
        </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
