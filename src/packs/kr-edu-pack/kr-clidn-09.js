/**
 * KR-CLIDN-09: CTA / FOLLOW — PREMIUM CONCLUSION v3
 * Centered layout with theme-reactive closing text & social CTA
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const esc = TemplateUtils.escapeHTML;

    const d = {
        TITLE: data.TITLE || '¿Te fue útil este contenido?',
        CTA_MESSAGE: data.CTA_MESSAGE || 'Sígueme para más tutoriales de Ciberseguridad y Hacking Ético.',
        CLOSING_TEXT: data.CLOSING_TEXT || 'La mejor defensa es el conocimiento.',
        HASHTAGS: data.HASHTAGS || '#KaliLinux #CyberSecurity #HackingÉtico'
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>KR-CLIDN-09</title>
    <style>
        /* ── LAYOUT ── */
        .cta-wrapper {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: calc(100% - 120px);
            text-align: center;
            z-index: 20;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
        }

        /* ── BRAND HERO ── */
        .brand-hero {
            display: flex; flex-direction: column;
            align-items: center; gap: 8px;
            margin-bottom: 40px;
        }
        .brand-hero img {
            width: 140px; height: 140px;
            object-fit: contain;
            filter: drop-shadow(0 0 25px color-mix(in srgb, var(--primary-color) 40%, transparent));
        }
        .brand-name {
            font-family: var(--font-military);
            font-size: 68px; letter-spacing: 6px;
            color: #fff;
            text-shadow: 0 2px 10px rgba(0,0,0,0.8);
        }

        /* ── MAIN TITLE ── */
        .cta-title {
            font-family: var(--font-military);
            font-size: 82px; font-weight: 900;
            color: #fff; text-transform: uppercase;
            line-height: 1.15; letter-spacing: 1px;
            margin-bottom: 12px;
            text-shadow: 0 4px 12px rgba(0,0,0,0.9);
        }
        .cta-subtitle {
            font-family: var(--font-sans);
            font-size: 44px; color: rgba(255,255,255,0.7);
            line-height: 1.5; margin-bottom: 40px;
            max-width: 800px;
            text-shadow: 0 2px 6px rgba(0,0,0,0.6);
        }

        /* ── SOCIAL BAR ── */
        .social-bar {
            display: flex; gap: 36px;
            justify-content: center;
            margin-bottom: 48px;
        }
        .social-item {
            display: flex; flex-direction: column;
            align-items: center; gap: 10px;
        }
        .social-icon {
            width: 68px; height: 68px; border-radius: 50%;
            background: rgba(10,10,10,0.85);
            display: flex; align-items: center; justify-content: center;
            font-size: 48px;
            backdrop-filter: blur(8px);
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .social-icon.heart  { border: 2px solid rgba(255,44,85,0.50); }
        .social-icon.comment { border: 2px solid rgba(255,255,255,0.20); }
        .social-icon.save   { border: 2px solid rgba(255,189,46,0.40); }
        .social-icon.share  { border: 2px solid var(--primary-color); }
        .social-label {
            font-family: var(--font-mono);
            font-size: 41px; font-weight: 600;
            color: rgba(255,255,255,0.45);
        }

        /* ── SEPARATOR ── */
        .cta-separator {
            display: flex; align-items: center; justify-content: center;
            gap: 16px; margin-bottom: 36px; width: 100%;
        }
        .cta-sep-line {
            height: 1px; width: 80px;
            background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
            opacity: 0.5;
        }
        .cta-sep-diamond {
            width: 8px; height: 8px;
            background: var(--primary-color);
            transform: rotate(45deg);
            box-shadow: 0 0 8px var(--primary-color);
        }

        /* ── CLOSING TEXT (PRIMARY COLOR) ── */
        .closing-text {
            font-family: var(--font-sans);
            font-size: 58px; font-weight: 800;
            color: var(--primary-color);
            line-height: 1.3;
            margin-bottom: 20px;
            text-shadow: 0 0 30px color-mix(in srgb, var(--primary-color) 30%, transparent),
                         0 2px 4px rgba(0,0,0,0.8);
            max-width: 850px;
        }

        /* ── FOOTER LABELS ── */
        .cta-footer-label {
            font-family: var(--font-mono);
            font-size: 41px; font-weight: 600;
            color: rgba(255,255,255,0.25);
            letter-spacing: 4px;
            margin-bottom: 16px;
        }
        .cta-hashtags {
            font-family: var(--font-mono);
            font-size: 41px;
            color: rgba(255,255,255,0.10);
            letter-spacing: 2px;
            max-width: 700px;
            word-spacing: 4px;
        }
    </style>
</head>
<body>
    <!-- Backgrounds -->
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <!-- 0. EFFECT ZONES: Circuit Board Pattern (Same as Cover 01) -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; opacity: 0.25; background: var(--primary-color); -webkit-mask-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M0 50h30l20-20h20l20-20h10M0 20h20l20 20h20l20 20h20M30 100V70l20-20h20l20 20v30M10 100V80l20-20h20l20 20h30'/%3E%3Ccircle cx='30' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='10' r='3' fill='%23000'/%3E%3Ccircle cx='20' cy='20' r='3' fill='%23000'/%3E%3Ccircle cx='80' cy='60' r='3' fill='%23000'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='70' r='3' fill='%23000'/%3E%3Ccircle cx='10' cy='80' r='3' fill='%23000'/%3E%3Ccircle cx='70' cy='80' r='3' fill='%23000'/%3E%3C/g%3E%3C/svg%3E&quot;); -webkit-mask-size: 150px 150px;"></div>
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; opacity: 0.1; background: var(--accent-color); -webkit-mask-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M0 50h30l20-20h20l20-20h10M0 20h20l20 20h20l20 20h20M30 100V70l20-20h20l20 20v30M10 100V80l20-20h20l20 20h30'/%3E%3Ccircle cx='30' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='10' r='3' fill='%23000'/%3E%3Ccircle cx='20' cy='20' r='3' fill='%23000'/%3E%3Ccircle cx='80' cy='60' r='3' fill='%23000'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='70' r='3' fill='%23000'/%3E%3Ccircle cx='10' cy='80' r='3' fill='%23000'/%3E%3Ccircle cx='70' cy='80' r='3' fill='%23000'/%3E%3C/g%3E%3C/svg%3E&quot;); -webkit-mask-size: 250px 250px; transform: rotate(180deg) scale(-1, 1);"></div>

    <!-- ═══ CENTERED CTA CONTENT ═══ -->
    <div class="cta-wrapper">

        <!-- Brand -->
        <div class="brand-hero">
            <img src="../assets/kr-clidn-logo.png" alt="KR-CLIDN" />
            <div class="brand-name">KR-CLIDN</div>
        </div>

        <!-- Title -->
        <div class="cta-title">${TemplateUtils.renderEditable('TITLE', esc(d.TITLE), data._overrides)}</div>
        <div class="cta-subtitle">${esc(d.CTA_MESSAGE)}</div>

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

        <!-- Separator -->
        <div class="cta-separator">
            <div class="cta-sep-line"></div>
            <div class="cta-sep-diamond"></div>
            <div class="cta-sep-line"></div>
        </div>

        <!-- Closing Text (Theme Primary Color) -->
        <div class="closing-text">${esc(d.CLOSING_TEXT)}</div>

        <!-- Footer Labels -->
        <div class="cta-footer-label">GUARDA · SIGUE · NO TE PIERDAS NADA</div>
        <div class="cta-hashtags">${esc(d.HASHTAGS)}</div>
    </div>

    <!-- System Footer -->
    <div style="position: absolute; bottom: 35px; width: 100%; text-align: center; z-index: 10;">
        <div style="font-family: var(--font-mono); font-size: 38px; color: rgba(255,255,255,0.15); letter-spacing: 6px;">
            END_OF_TRANSMISSION
        </div>
    </div>

    <!-- Matrix Rain Script Removed for Book Aesthetic -->
    ${TemplateUtils.getAutoFitScript()}
</body>
</html>`;
}
