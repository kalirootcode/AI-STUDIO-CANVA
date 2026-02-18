/**
 * KR-CLIDN-33: VS COMPARISON (Refactored)
 * Side-by-side comparison of two technologies/concepts
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || 'HTTP vs HTTPS',
        SIDE_A: data.SIDE_A || {
            NAME: 'HTTP',
            COLOR: 'var(--accent-color)',
            POINTS: ['Texto plano', 'Inseguro', 'Puerto 80']
        },
        SIDE_B: data.SIDE_B || {
            NAME: 'HTTPS',
            COLOR: 'var(--success-color)',
            POINTS: ['Cifrado TLS', 'Seguro', 'Puerto 443']
        },
        DESCRIPTION: data.DESCRIPTION || 'Siempre utiliza HTTPS para proteger la integridad de los datos.'
    };

    const renderSide = (side) => `
        <div style="flex:1; display:flex; flex-direction:column; gap:16px;">
            <div style="font-family:var(--font-mono); font-size:32px; font-weight:800; color:${side.COLOR}; text-align:center; letter-spacing:3px;">
                ${esc(side.NAME)}
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                ${side.POINTS.map(p => `
                    <div class="glass-panel" style="padding:16px 20px; border-color:${side.COLOR}15; text-align:center;">
                        <span style="font-size:22px; color:#e2e8f0;">${esc(p)}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-33</title>
    <style>
        .vs-layout { display: flex; gap: 24px; flex: 1; align-items: flex-start; }
        .vs-divider {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; gap: 8px; padding: 0 8px;
        }
        .vs-badge {
            width: 72px; height: 72px; border-radius: 50%;
            background: #0a0a0a; border: 2px solid rgba(255,255,255,0.1);
        /* Unique conclusion styles */
        .conclusion-hero {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            gap: 40px;
        }
        
        .big-logo {
            width: 180px; 
            height: 180px;
            filter: drop-shadow(0 0 40px rgba(0,217,255,0.6));
            animation: pulseLogo 3s infinite ease-in-out;
            object-fit: contain;
        }

        @keyframes pulseLogo {
            0% { transform: scale(1); filter: drop-shadow(0 0 40px rgba(0,217,255,0.6)); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 60px rgba(0,217,255,0.8)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 40px rgba(0,217,255,0.6)); }
        }

        .cta-box {
            background: rgba(10,10,10,0.8);
            border: 1px solid var(--accent-color);
            padding: 30px;
            border-radius: 16px;
            width: 90%;
            position: relative;
        }
        
        .profile-pic {
            width: 100px; height: 100px; border-radius: 50%;
            border: 3px solid var(--primary-color);
            margin: -80px auto 20px auto;
            background: #000;
            display: flex; align-items: center; justify-content: center;
            font-size: 40px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        <!-- No standard header here, we want big logo -->
        
        <div class="conclusion-hero">
            <!-- 1. BIG LOGO -->
            <img src="../assets/kr-clidn-logo.png" class="big-logo" alt="KR-CLIDN" />
            
            <div style="font-family: var(--font-mono); font-size: 32px; font-weight: 800; letter-spacing: 8px;">KR-CLIDN</div>

            <!-- 2. Final Questions -->
            <div class="flex-col" style="gap: 20px; margin-top: 20px;">
                <h2 class="cyber-title" style="font-size: 38px;">${TemplateUtils.renderEditable('TITLE', esc(d.TITLE), data._overrides)}</h2>
                <div class="cyber-subtitle" style="font-size: 28px; color: var(--primary-color);">${TemplateUtils.renderEditable('SUBTITLE', esc(d.DESCRIPTION), data._overrides)}</div>
            </div>

            <!-- 3. CTA -->
            <div class="cta-box">
                <div class="profile-pic">👨‍💻</div>
                <div style="font-size: 24px; color: #fff; line-height: 1.5;">
                    Sígueme para más tutoriales de <br>
                    <span style="color: var(--accent-color); font-weight: 700;">Ciberseguridad Defensiva y Ofensiva</span>.
                </div>
            </div>
        </div>

        <!-- Minimal Footer -->
        <div style="margin-top: auto; opacity: 0.4; font-size: 14px; letter-spacing: 2px;" class="mono">
            POWERED BY CYBER-CANVAS
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
