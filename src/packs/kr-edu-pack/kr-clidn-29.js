/**
 * KR-CLIDN-29: ERROR / SOLUTION (Refactored)
 * Error común con su explicación y solución
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'Error Común',
        ERROR_CMD: data.ERROR_CMD || '$ apt install nmap',
        ERROR_OUTPUT: data.ERROR_OUTPUT || 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)',
        ERROR_MEANING: data.ERROR_MEANING || 'No tienes permisos de superusuario. El sistema necesita acceso root para instalar paquetes.',
        SOLUTION_CMD: data.SOLUTION_CMD || '$ sudo apt install nmap',
        SOLUTION_OUTPUT: data.SOLUTION_OUTPUT || 'Reading package lists... Done. nmap is already the newest version.',
        WHY_IT_WORKS: data.WHY_IT_WORKS || 'El prefijo sudo eleva tus privilegios temporalmente, permitiendo ejecutar comandos que requieren acceso de administrador.'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-29</title>
    <style>
        .err-section { margin-bottom: 20px; }
        .err-badge {
            font-family: var(--font-mono); font-size: 20px; font-weight: 700;
            padding: 6px 16px; border-radius: 6px; letter-spacing: 2px;
            display: inline-block; margin-bottom: 12px;
        }
        .err-badge.error { color: var(--accent-color); background: rgba(255,51,102,0.08); border: 1px solid rgba(255,51,102,0.2); }
        .err-badge.fix { color: var(--success-color); background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <h1 class="cyber-title" style="font-size:42px;">⚠️ ${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- ERROR Section -->
        <div class="err-section">
            <div class="err-badge error">❌ ERROR</div>
            <div class="terminal-window">
                <div class="term-header">
                    <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                </div>
                <div class="term-body">
                    <div style="font-family:var(--font-mono); font-size:22px; color:#e2e8f0; margin-bottom:8px;">${esc(d.ERROR_CMD)}</div>
                    <div style="font-family:var(--font-mono); font-size:20px; color:var(--accent-color); line-height:1.5;">${esc(d.ERROR_OUTPUT)}</div>
                </div>
            </div>
            <div class="glass-panel" style="margin-top:12px; display:flex; gap:12px; align-items:flex-start;">
                <span style="font-size:20px;">🔍</span>
                <span style="font-size:20px; color:#94a3b8; line-height:1.5;">${esc(d.ERROR_MEANING)}</span>
            </div>
        </div>

        <!-- SOLUTION Section -->
        <div class="err-section">
            <div class="err-badge fix">✅ SOLUCIÓN</div>
            <div class="terminal-window">
                <div class="term-header">
                    <div class="term-dot red"></div><div class="term-dot yellow"></div><div class="term-dot green"></div>
                </div>
                <div class="term-body">
                    <div style="font-family:var(--font-mono); font-size:22px; color:var(--success-color); margin-bottom:8px;">${esc(d.SOLUTION_CMD)}</div>
                    <div style="font-family:var(--font-mono); font-size:20px; color:#94a3b8; line-height:1.5;">${esc(d.SOLUTION_OUTPUT)}</div>
                </div>
            </div>
        </div>

        <!-- Why It Works -->
        <div class="glass-panel" style="display:flex; gap:14px; align-items:flex-start;">
            <span style="font-size:24px;">💡</span>
            <div>
                <div class="mono" style="font-size:16px; color:var(--success-color); letter-spacing:2px; margin-bottom:6px;">¿POR QUÉ FUNCIONA?</div>
                <span style="font-size:22px; color:#e2e8f0; line-height:1.5;">${esc(d.WHY_IT_WORKS)}</span>
            </div>
        </div>

        <!-- Footer -->
        <div style="margin-top:auto; display:flex; align-items:center; opacity:0.5;">
            <div style="width:40px; height:4px; background:var(--accent-color); margin-right:16px;"></div>
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // ERROR-FIX</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
