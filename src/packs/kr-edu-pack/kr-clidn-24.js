/**
 * KR-CLIDN-24: BEFORE / AFTER (Refactored)
 * Transformación visual: antes y después de ejecutar un comando
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Antes y Después',
        BEFORE_TITLE: data.BEFORE_TITLE || 'ANTES',
        BEFORE_LINES: data.BEFORE_LINES || [
            { TEXT: '$ ls' },
            { TEXT: 'file1.txt  file2.txt  folder/' }
        ],
        AFTER_TITLE: data.AFTER_TITLE || 'DESPUÉS',
        AFTER_LINES: data.AFTER_LINES || [
            { TEXT: '$ ls -la --color' },
            { TEXT: 'drwxr-xr-x 2 user user 4096 Jan 15 ./' },
            { TEXT: '-rw-r--r-- 1 user user  128 Jan 15 file1.txt' }
        ],
        COMMAND: data.COMMAND || 'ls -la --color',
        EXPLANATION: data.EXPLANATION || 'Al agregar las flags -la y --color, obtienes permisos, propietario, tamaño y colores que facilitan la lectura.'
    };

    const renderLines = (lines) => lines.map(l =>
        `<div style="font-family:var(--font-mono); font-size: 41px; color:#e2e8f0; padding:5px 0; line-height:1.5;">${esc(l.TEXT)}</div>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-24</title>
    <style>
        .ba-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1; }
        .ba-label {
            font-family: var(--font-mono); font-size: 41px; font-weight: 700;
            letter-spacing: 3px; padding: 8px 16px; border-radius: 6px; display: inline-block;
            margin-bottom: 12px;
        }
        .ba-before .ba-label { color: #ef4444; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); }
        .ba-after .ba-label { color: var(--success-color); background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:71px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- Command Badge -->
        <div class="mono" style="font-size: 41px; color:var(--primary-color); background:rgba(0,217,255,0.06); border:1px solid rgba(0,217,255,0.15); padding:10px 18px; border-radius:8px; display:inline-block; margin-bottom:20px;">
            $ ${TemplateUtils.renderEditable('COMMAND', `${esc(d.COMMAND)}`, data._overrides)}
        </div>

        <!-- Before / After Grid -->
        <div class="ba-grid">
            <div class="ba-before">
                <div class="ba-label">❌ ${esc(d.BEFORE_TITLE)}</div>
                <div class="terminal-window">
                    <div class="term-header">
                        <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                    </div>
                    <div class="term-body">${renderLines(d.BEFORE_LINES)}</div>
                </div>
            </div>
            <div class="ba-after">
                <div class="ba-label">✅ ${esc(d.AFTER_TITLE)}</div>
                <div class="terminal-window">
                    <div class="term-header">
                        <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                    </div>
                    <div class="term-body">${renderLines(d.AFTER_LINES)}</div>
                </div>
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
