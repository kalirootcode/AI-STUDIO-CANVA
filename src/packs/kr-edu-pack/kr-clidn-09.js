/**
 * KR-CLIDN-09: CTA / FOLLOW
 * Último slide SIEMPRE. Iconos sociales TikTok (❤️💬🔖↗️) + texto subliminal.
 * SIN flecha de swipe (es el último). SIN brand-bar (logo centrado).
 */
export function render(data) {
    const d = {
        TITLE: data.TITLE || '¿Te fue útil?',
        CTA_MESSAGE: data.CTA_MESSAGE || 'Si llegaste hasta aquí, este contenido fue para ti',
        CLOSING_TEXT: data.CLOSING_TEXT || 'Esto fue solo el inicio...',
        HASHTAGS: data.HASHTAGS || '#KaliLinux #CyberSecurity #HackingÉtico'
    };

    // Removed premature closing brace

    const escapeHTML = (str) => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Inter:wght@400;500;600;700&family=Black+Ops+One&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: #000000;
            color: #fff;
            width: 1080px;
            height: 1920px;
            overflow: hidden;
            position: relative;
        }

        /* ═══ SAME EFFECTS AS COVER ═══ */
        body::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
                radial-gradient(ellipse 600px 400px at 50% 35%, rgba(37, 99, 235, 0.06) 0%, transparent 70%),
                radial-gradient(ellipse 400px 300px at 70% 65%, rgba(77, 217, 192, 0.04) 0%, transparent 60%);
            pointer-events: none;
            z-index: 0;
        }
        body::after {
            content: '';
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px);
            pointer-events: none;
            z-index: 2;
        }

        .slide {
            position: relative; z-index: 1;
            width: 100%; height: 100%;
            padding: 60px;
            display: flex; flex-direction: column;
        }

        .hero {
            flex: 1;
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            text-align: center;
        }

        /* ═══ LOGO CON GLOW ═══ */
        .logo-wrapper { position: relative; margin-bottom: 20px; }
        .logo-glow {
            position: absolute; inset: -30px;
            background: radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, transparent 60%);
            filter: blur(20px); z-index: 0;
        }
        .logo-hero {
            position: relative; z-index: 1;
            width: 120px; height: 120px;
            object-fit: contain;
            filter: drop-shadow(0 0 20px rgba(37, 99, 235, 0.4));
        }

        .brand-hero {
            font-family: 'JetBrains Mono', monospace;
            font-size: 24px; font-weight: 700;
            letter-spacing: 10px;
            color: #2563EB;
            margin-bottom: 8px;
        }
        .brand-divider {
            width: 100px; height: 2px;
            background: linear-gradient(90deg, transparent, #2563EB, #4DD9C0, transparent);
            margin-bottom: 40px;
        }

        /* ═══ TÍTULO BLACK OPS ONE ═══ */
        .title {
            font-family: 'Black Ops One', cursive;
            font-size: 72px;
            color: #fff;
            margin-bottom: 24px;
            text-shadow: 0 0 30px rgba(37, 99, 235, 0.25);
        }

        /* ═══ CTA MESSAGE ═══ */
        .cta-message {
            font-size: 32px;
            color: #94a3b8;
            line-height: 1.55;
            margin-bottom: 56px;
            font-weight: 400;
            max-width: 800px;
            white-space: pre-wrap;
            word-break: break-word;
        }

        /* ═══ SOCIAL ICONS BAR (TikTok style) ═══ */
        .social-bar {
            display: flex;
            gap: 56px;
            align-items: flex-start;
            justify-content: center;
            margin-bottom: 60px;
        }

        .social-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .social-icon {
            width: 80px; height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: transform 0.2s;
        }

        .social-icon .iconify {
            font-size: 38px;
            position: relative;
            z-index: 1;
        }

        /* Heart / Like */
        .social-heart .social-icon {
            background: rgba(255, 44, 85, 0.12);
            border: 2px solid rgba(255, 44, 85, 0.35);
        }
        /* Removed color override to allow multi-color SVG */
        .social-heart .social-icon .iconify { /* color: #FE2C55; */ }
        .social-heart .social-icon::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 44, 85, 0.2) 0%, transparent 70%);
            filter: blur(8px);
        }

        /* Comment */
        .social-comment .social-icon {
            background: rgba(255, 255, 255, 0.06);
            border: 2px solid rgba(255, 255, 255, 0.15);
        }
        /* .social-comment .social-icon .iconify { color: #fff; } */

        /* Bookmark / Save */
        .social-save .social-icon {
            background: rgba(255, 189, 46, 0.1);
            border: 2px solid rgba(255, 189, 46, 0.3);
        }
        /* .social-save .social-icon .iconify { color: #ffbd2e; } */
        .social-save .social-icon::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 189, 46, 0.15) 0%, transparent 70%);
            filter: blur(8px);
        }

        /* Share */
        .social-share .social-icon {
            background: rgba(37, 99, 235, 0.1);
            border: 2px solid rgba(37, 99, 235, 0.3);
        }
        /* .social-share .social-icon .iconify { color: #2563EB; } */

        .social-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: 18px;
            color: rgba(255,255,255,0.5);
            font-weight: 600;
            letter-spacing: 1px;
        }

        .social-action {
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            color: rgba(255,255,255,0.25);
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        /* ═══ SUGGESTIVE CLOSING TEXT ═══ */
        .closing-section {
            width: 100%; max-width: 880px;
            text-align: center;
            position: relative;
            padding-top: 40px;
        }

        .closing-section::before {
            content: '';
            position: absolute;
            top: 0; left: 50%;
            transform: translateX(-50%);
            width: 200px; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(37,99,235,0.3), transparent);
        }

        .closing-main {
            font-family: 'Black Ops One', cursive;
            font-size: 44px;
            background: linear-gradient(135deg, #ffffff 0%, #2563EB 50%, #4DD9C0 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
            filter: drop-shadow(0 0 20px rgba(37, 99, 235, 0.2));
        }

        .closing-sub {
            font-family: 'JetBrains Mono', monospace;
            font-size: 22px;
            color: rgba(255,255,255,0.3);
            letter-spacing: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        .closing-sub .iconify {
            font-size: 20px;
            color: rgba(77, 217, 192, 0.5);
        }

        .hashtags {
            margin-top: 32px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 20px; color: rgba(255,255,255,0.12);
            letter-spacing: 2px;
        }

        /* ═══ GRID DECORATIVO ═══ */
        .grid-overlay {
            position: absolute; inset: 0;
            background-image:
                linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px);
            background-size: 60px 60px;
            pointer-events: none; z-index: 0;
        }

        /* ═══ CORNERS ═══ */
        .corner { position: absolute; width: 50px; height: 50px; z-index: 3; }
        .corner-tl { top: 40px; left: 40px; border-left: 2px solid rgba(37,99,235,0.2); border-top: 2px solid rgba(37,99,235,0.2); }
        .corner-tr { top: 40px; right: 40px; border-right: 2px solid rgba(37,99,235,0.2); border-top: 2px solid rgba(37,99,235,0.2); }
        .corner-bl { bottom: 40px; left: 40px; border-left: 2px solid rgba(37,99,235,0.15); border-bottom: 2px solid rgba(37,99,235,0.15); }
        .corner-br { bottom: 40px; right: 40px; border-right: 2px solid rgba(37,99,235,0.15); border-bottom: 2px solid rgba(37,99,235,0.15); }

        .hex-deco {
            position: absolute;
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px; color: rgba(37,99,235,0.12);
            letter-spacing: 2px;
        }
        .hex-top { top: 48px; right: 100px; }
        .hex-bot { bottom: 48px; left: 100px; }
    </style>
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
</head>
<body>
    <div class="grid-overlay"></div>
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>
    <div class="hex-deco hex-top">0x4B52 0x434C 0x4944</div>
    <div class="hex-deco hex-bot">0xDEAD 0xBEEF 0xCAFE</div>

    <div class="slide">
        <div class="hero">
            <div class="logo-wrapper">
                <div class="logo-glow"></div>
                <img class="logo-hero" src="data:image/png;base64,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" alt="KR-CLIDN">
            </div>
            <div class="brand-hero">KR-CLIDN</div>
            <div class="brand-divider"></div>

            <div class="title">${escapeHTML(d.TITLE)}</div>
            <div class="cta-message">${escapeHTML(d.CTA_MESSAGE)}</div>

            <!-- TikTok Social Icons -->
            <!-- Redesigned Professional Icons (Inline SVG for 100% RELIABILITY) -->
            <div class="social-bar">
                
                <!-- LIKE: Red Heart -->
                <div class="social-item social-heart">
                    <div class="social-icon">
                        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="#FF453A"/>
                            <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="url(#paint0_radial_heart)" fill-opacity="0.2"/>
                            <defs>
                                <radialGradient id="paint0_radial_heart" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12 8) rotate(90) scale(16)">
                                    <stop stop-color="white"/>
                                    <stop offset="1" stop-color="#FF453A" stop-opacity="0"/>
                                </radialGradient>
                            </defs>
                        </svg>
                    </div>
                    <span class="social-label">Me gusta</span>
                </div>

                <!-- COMMENT: Blue Bubble -->
                <div class="social-item social-comment">
                    <div class="social-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="#3B82F6"/>
                            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="url(#paint0_linear_comm)" fill-opacity="0.2"/>
                            <path d="M7 9H17" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            <path d="M7 13H14" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            <defs>
                                <linearGradient id="paint0_linear_comm" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="white" stop-opacity="0.3"/>
                                    <stop offset="1" stop-color="#2563EB" stop-opacity="0"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span class="social-label">Comenta</span>
                </div>

                <!-- SAVE: Yellow Bookmark -->
                <div class="social-item social-save">
                    <div class="social-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" fill="#F59E0B"/>
                             <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" fill="url(#paint0_linear_save)" fill-opacity="0.2"/>
                             <defs>
                                <linearGradient id="paint0_linear_save" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="white" stop-opacity="0.4"/>
                                    <stop offset="1" stop-color="#D97706" stop-opacity="0"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span class="social-label">Guarda</span>
                </div>

                <!-- SHARE: Green/Blue Share -->
                <div class="social-item social-share">
                    <div class="social-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.91 18 21.91C19.61 21.91 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="#10B981"/>
                            <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.91 18 21.91C19.61 21.91 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="url(#paint0_linear_share)" fill-opacity="0.2"/>
                            <defs>
                                <linearGradient id="paint0_linear_share" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                                    <stop stop-color="white" stop-opacity="0.3"/>
                                    <stop offset="1" stop-color="#10B981" stop-opacity="0"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span class="social-label">Comparte</span>
                </div>
            </div>

            <!-- Subliminal Closing Text -->
            <div class="closing-section">
                <div class="closing-main">${escapeHTML(d.CLOSING_TEXT)}</div>
                <div class="closing-sub">
                    <i class="material-icons">bookmark</i>
                    Guarda · Sigue · No te pierdas nada
                    <i class="material-icons">arrow_upward</i>
                </div>
            </div>

            <div class="hashtags">${escapeHTML(d.HASHTAGS)}</div>
        </div>
    </div>
</body>
</html>`;
}
