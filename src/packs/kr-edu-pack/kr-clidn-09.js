/**
 * KR-CLIDN-09: CTA / FOLLOW (Refactored)
 * Last slide with social icons and closing text
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || '¿Te fue útil?',
        CTA_MESSAGE: data.CTA_MESSAGE || 'Si llegaste hasta aquí, este contenido fue para ti',
        CLOSING_TEXT: data.CLOSING_TEXT || 'Esto fue solo el inicio...',
        HASHTAGS: data.HASHTAGS || '#KaliLinux #CyberSecurity #HackingÉtico'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-09</title>
    <style>
        .cta-hero {
            flex: 1; display: flex; flex-direction: column;
            justify-content: center; align-items: center; text-align: center;
        }
        .social-bar {
            display: flex; gap: 48px; justify-content: center;
            margin: 40px 0;
        }
        .social-item {
            display: flex; flex-direction: column;
            align-items: center; gap: 10px;
        }
        .social-icon {
            width: 72px; height: 72px; border-radius: 50%;
            background: #0a0a0a; display: flex;
            align-items: center; justify-content: center;
            font-size: 32px;
        }
        .social-icon.heart { border: 2px solid rgba(255,44,85,0.35); }
        .social-icon.comment { border: 2px solid rgba(255,255,255,0.15); }
        .social-icon.save { border: 2px solid rgba(255,189,46,0.3); }
        .social-icon.share { border: 2px solid rgba(0,217,255,0.3); }
        .social-label {
            font-family: var(--font-mono); font-size: 22px;
            color: rgba(255,255,255,0.5); font-weight: 600;
        }
        .closing-text {
            font-size: 32px; font-weight: 700;
            background: linear-gradient(135deg, #fff, var(--primary-color));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; margin-bottom: 16px;
        }
        .closing-sub {
            font-family: var(--font-mono); font-size: 20px;
            color: rgba(255,255,255,0.3); letter-spacing: 3px;
        }
        .hashtags {
            font-family: var(--font-mono); font-size: 18px;
            color: rgba(255,255,255,0.12); letter-spacing: 2px;
            margin-top: 24px;
        }
    </style>
</head>
<body>
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone">
        <div class="cta-hero">
            
            <!-- Large Brand Hero (Requested: 200x200 Logo + Name) -->
            <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 30px;">
                <img src="../assets/kr-clidn-logo.png" style="width: 200px; height: 200px; filter: drop-shadow(0 0 20px rgba(0,217,255,0.4)); object-fit: contain;" />
                <div style="font-family: var(--font-military); font-size: 48px; letter-spacing: 4px; margin-top: 10px; color: #fff;">KR-CLIDN</div>
            </div>

            <h1 class="cyber-title" style="font-size: 38px; margin-bottom: 16px;">${TemplateUtils.renderEditable('TITLE', `${esc(d.TITLE)}`, data._overrides)}</h1>
            <div style="font-size: 26px; color: #94a3b8; line-height: 1.5; margin-bottom: 48px; max-width: 800px;">${esc(d.CTA_MESSAGE)}</div>

            <!-- Social Icons -->
            <div class="social-bar">
                <div class="social-item">
                    <div class="social-icon heart">❤️</div>
                    <span class="social-label">Me gusta</span>
                </div>
                <div class="social-item">
                    <div class="social-icon comment">💬</div>
                    <span class="social-label">Comenta</span>
                </div>
                <div class="social-item">
                    <div class="social-icon save">🔖</div>
                    <span class="social-label">Guarda</span>
                </div>
                <div class="social-item">
                    <div class="social-icon share">↗️</div>
                    <span class="social-label">Comparte</span>
                </div>
            </div>

            <!-- Closing -->
            <div class="closing-text">${esc(d.CLOSING_TEXT)}</div>
            <div class="closing-sub">Guarda · Sigue · No te pierdas nada</div>
            <div class="hashtags">${esc(d.HASHTAGS)}</div>
        </div>

        <!-- Footer -->
        <div style="display:flex; align-items:center; justify-content:center; opacity:0.5;">
            <span class="mono" style="letter-spacing:2px; font-size:14px;">CYBER-CANVAS // CTA</span>
        </div>
    </div>

    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
