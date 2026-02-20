export const EBOOK_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&family=Space+Grotesk:wght@500;700;900&display=swap');

    @font-face {
        font-family: 'NewComicTitle';
        src: url('./assets/fonts/newcomictitle.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
    }

    :root {
        --bg-color: #030303;
        --card-bg: #0a0a0c;
        --text-main: #f0f0f0;
        --text-muted: #94a3b8;
        
        --primary-color: #00D9FF;
        --accent-color: #A855F7;
        --warning-color: #FF9500;
        --success-color: #00FF88;
        --danger-color: #FF3366;

        --font-title: 'NewComicTitle', 'Space Grotesk', sans-serif;
        --font-body: 'Inter', sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
        font-family: var(--font-body);
        background: var(--bg-color);
        color: var(--text-main);
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        position: relative;
    }

    .safe-zone {
        position: absolute;
        top: 200px;
        left: 0;
        width: 1080px;
        height: 1240px;
        padding: 40px 60px;
        display: flex;
        flex-direction: column;
        z-index: 10;
    }

    /* TYPOGRAPHY */
    .ebook-h1 {
        font-family: var(--font-title);
        font-size: 88px;
        font-weight: 900;
        line-height: 1.1;
        letter-spacing: 2px;
        text-shadow: 2px 4px 0px rgba(0,0,0,0.6);
        margin-bottom: 32px;
        color: #ffffff;
    }
    
    .highlight {
        color: var(--primary-color) !important;
    }
    
    .highlight-body {
        color: var(--accent-color) !important;
        font-weight: 700;
    }
    
    .ebook-h2 {
        font-family: var(--font-title);
        font-size: 64px;
        font-weight: 700;
        line-height: 1.2;
        letter-spacing: 1px;
        text-shadow: 1px 3px 0px rgba(0,0,0,0.5);
        margin-bottom: 24px;
        color: #ffffff;
    }

    .ebook-p {
        font-family: var(--font-body);
        font-size: 48px;
        line-height: 1.6;
        color: var(--text-main);
        margin-bottom: 36px;
    }

    .ebook-p-muted {
        color: var(--text-muted);
    }

    /* TERMINAL */
    .terminal-window {
        background: #050505;
        border: 2px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 24px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    
    .term-header {
        background: #0a0a0c;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid rgba(255,255,255,0.04);
    }

    .term-dot { width: 16px; height: 16px; border-radius: 50%; }
    .term-dot.red { background: #FF3B30; }
    .term-dot.yellow { background: #FFCC00; }
    .term-dot.green { background: #34C759; }

    .term-body {
        padding: 32px;
        font-family: var(--font-mono);
        font-size: 40px;
        line-height: 1.5;
        color: var(--primary-color);
        font-weight: 700;
    }

    /* HIGHLIGHTS FOR THEME COLORS */
    .highlight {
        color: var(--primary-color);
        font-weight: bold;
    }
    
    /* UTILITIES */
    .mono { font-family: var(--font-mono); }
    .text-center { text-align: center; }
    .flex-center { display: flex; align-items: center; justify-content: center; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-row { display: flex; flex-direction: row; }
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    
    /* CIRCUIT EFFECT (Background) */
    .ebook-circuit-bg {
        position: absolute; 
        top: 0; left: 0; 
        width: 100%; height: 100%; 
        z-index: 1; pointer-events: none; 
        opacity: 0.15; 
        background: var(--primary-color); 
        -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M0 50h30l20-20h20l20-20h10M0 20h20l20 20h20l20 20h20M30 100V70l20-20h20l20 20v30M10 100V80l20-20h20l20 20h30'/%3E%3Ccircle cx='30' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='10' r='3' fill='%23000'/%3E%3Ccircle cx='20' cy='20' r='3' fill='%23000'/%3E%3Ccircle cx='80' cy='60' r='3' fill='%23000'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%23000'/%3E%3Ccircle cx='90' cy='70' r='3' fill='%23000'/%3E%3Ccircle cx='10' cy='80' r='3' fill='%23000'/%3E%3Ccircle cx='70' cy='80' r='3' fill='%23000'/%3E%3C/g%3E%3C/svg%3E"); 
        -webkit-mask-size: 150px 150px;
    }
`;
