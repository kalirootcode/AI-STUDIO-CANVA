/**
 * KR-CLIDN-01: COVER — TIKTOK OPTIMIZED v6 (Refactored)
 * Safe zone: 200px top + 480px bottom
 * Visible area: 1240px centered
 */
export function render(data) {
    const TemplateUtils = window.TemplateUtils;
    const themes = {
        CYBER: { p: '#00D9FF', s: '#00FF9D', a: '#FF0055', w: '#FFB800' },
        RED_TEAM: { p: '#FF0000', s: '#32CD32', a: '#FF4500', w: '#FFFF00' },
        BLUE_TEAM: { p: '#0088FF', s: '#00FF9D', a: '#FFA500', w: '#7c3aed' },
        OSINT: { p: '#d946ef', s: '#10b981', a: '#f43f5e', w: '#f59e0b' }
    };

    // Fallback if data.THEME is not passed or invalid
    const themeName = data.THEME || 'CYBER';
    const t = themes[themeName] || themes.CYBER;

    // Inject CSS Variables for color override ONLY (Layout is in cyber-base.css)
    // We override the root variables defined in cyber-base.css
    const themeCSS = `
        :root {
            --primary-color: ${t.p};
            --accent-color: ${t.a};
            --success-color: ${t.s};
            --warning-color: ${t.w};
        }
    `;

    const rawTitle = data.TITLE || data.title || '3 HERRAMIENTAS *OCULTAS* DE *KALI*';
    const subtitle = data.SUBTITLE || data.subtitle || 'El <span class="highlight">94%</span> de hackers NUNCA las encuentra';
    const category = data.CATEGORY || data.category || 'CLASIFICADO';
    const slideIndex = data.SLIDE_INDEX || 1;
    const totalSlides = data.TOTAL_SLIDES || 5;

    // Title Formatting Logic (Keep existing logic)
    let cleanTitle = rawTitle;
    if (cleanTitle.includes(':')) {
        const parts = cleanTitle.split(':');
        if (parts.length > 1) cleanTitle = parts.slice(1).join(':').trim();
    }
    if (!cleanTitle) cleanTitle = rawTitle;

    function formatTitle(titleStr) {
        // 0. Robust Decode: Handle multiple levels of escaping (e.g., &amp;amp;#039;)
        let decoded = titleStr;
        const txt = document.createElement("textarea");

        // Loop to peel off layers of escaping (max 3 to avoid infinite loops)
        for (let i = 0; i < 3; i++) {
            if (!decoded || !decoded.includes('&')) break;
            txt.innerHTML = decoded;
            decoded = txt.value;
        }

        // Manual cleanup for stubborn entities if browser didn't catch them
        decoded = decoded.replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');

        // 1. Security: Escape HTML first (Fresh start)
        let safeStr = TemplateUtils.escapeHTML(decoded);

        const words = safeStr.split(' ');
        const lines = [];
        let currentLine = [];

        // Smart Highlight regex (Removed single letters to avoid breaking HTML attributes)
        const keywords = /\b(HACKING|HACKER|KALI|LINUX|SHODAN|NMAP|WIFI|PASSWORD|CRACK|HIDDEN|SECRET|DARK|DEEP|WEB|TOR|VPN|PROXY|GOD|MODE|ROOT|ADMIN|SYSTEM|ERROR|BUG|ZERO|DAY|EXPLOIT|PAYLOAD|ATTACK|DEFENSE|CTF|OSINT|SOCIAL|ENGINEERING|PHISHING|WIFI|NETWORK|TRAFFIC|SNIFFING|SPOOFING|MITM|DOS|DDOS|BOTNET|MALWARE|RANSOMWARE|VIRUS|TROJAN|WORM|SPYWARE|KEYLOGGER|BACKDOOR|ROOTKIT|BOOTKIT|RAT|C2|COMMAND|CONTROL|SERVER|CLIENT|DATABASE|SQL|INJECTION|XSS|CSRF|RCE|LFI|RFI|SSRF|XXE|DESERIALIZATION|BUFFER|OVERFLOW|HEAP|STACK|FORMAT|STRING|RACE|CONDITION|LOGIC|FLAW|VULNERABILITY|EXPOSURE|DISCLOSURE|LEAK|BREACH|COMPROMISE|INCIDENT|RESPONSE|FORENSIC|ANALYSIS|REVERSE|ENGINEERING|ASSEMBLY|DEBUGGER|DISASSEMBLER|HEX|BINARY|CODE|SCRIPT|PYTHON|BASH|POWERSHELL|JAVASCRIPT|PHP|JAVA|CPP|GO|RUST|RUBY|PERL|LUA|HTML|CSS|REACT|ANGULAR|VUE|NODE|DENO|EXPRESS|DJANGO|FLASK|SPRING|BOOT|DOTNET|AWS|AZURE|GCP|CLOUD|DOCKER|KUBERNETES|CONTAINER|VIRTUAL|MACHINE|VM|HYPERVISOR|VMWARE|VIRTUALBOX|QEMU|KVM|XEN|ESXI|PROXMOX|OPENVPN|WIREGUARD|IPSEC|SSL|TLS|SSH|FTP|SFTP|SCP|TFTP|TELNET|SMTP|POP3|IMAP|DNS|DHCP|ARP|ICMP|TCP|UDP|IPV4|IPV6|MAC|ADDRESS|SUBNET|MASK|GATEWAY|ROUTER|SWITCH|FIREWALL|IDS|IPS|WAF|SIEM|SOC|NOC|CERT|CSIRT|CISO|CIO|CTO|CEO|CFO|COO|CMO|HR|LEGAL|FINANCE|SALES|MARKETING|SUPPORT|DEV|OPS|DEVOPS|SEC|DEVSEC|AGILE|SCRUM|KANBAN|LEAN|WATERFALL|SDLC|CI|CD|PIPELINE|GIT|GITHUB|GITLAB|BITBUCKET|JIRA|CONFLUENCE|SLACK|DISCORD|TELEGRAM|SIGNAL|WHATSAPP|MESSENGER|FACEBOOK|INSTAGRAM|TWITTER|LINKEDIN|YOUTUBE|TIKTOK|SNAPCHAT|REDDIT|PINTEREST|TUMBLR|MEDIUM|WORDPRESS|JOOMLA|DRUPAL|MAGENTO|SHOPIFY|PRESTASHOP|WIX|SQUARESPACE|WEEBLY|GHOST|STRAPI|NETLIFY|VERCEL|HEROKU|DIGITALOCEAN|LINODE|VULTR|HETZNER|OVH|AMAZON|GOOGLE|IBM|MICROSOFT|ORACLE)\b/i;

        // Check for manual stars *before* processing lines
        const hasManualHighlight = safeStr.includes('*');

        for (let i = 0; i < words.length; i++) {
            currentLine.push(words[i]);
            if (currentLine.length === 3 || (words[i].length > 8 && currentLine.length >= 2)) {
                lines.push(currentLine.join(' '));
                currentLine = [];
            }
        }
        if (currentLine.length > 0) lines.push(currentLine.join(' '));

        let joinedLines = lines.join('<br>'); // Note: using <br> which is HTML, so we must be careful with subsequent replaces

        if (hasManualHighlight) {
            return joinedLines.replace(/\*([^\*]+)\*/g, '<span class="highlight">$1</span>');
        } else {
            // ORDER MATTERS:
            // 1. Highlight Keywords FIRST (on safe text).
            // 2. Highlight Numbers SECOND.
            let html = joinedLines.replace(new RegExp(keywords, 'gi'), match => `<span class="highlight">${match}</span>`);
            html = html.replace(/(\d+%?)/g, match => `<span class="highlight">${match}</span>`);

            // 3. FALLBACK: If no highlights were applied, highlight the longest/most impactful words
            if (!html.includes('class="highlight"')) {
                const plainWords = safeStr.split(/\s+/).filter(w => w.length > 3);
                // Sort by length (longer = more impactful) and highlight top 2-3
                const sorted = [...plainWords].sort((a, b) => b.length - a.length);
                const toHighlight = sorted.slice(0, Math.min(3, sorted.length));
                for (const word of toHighlight) {
                    html = html.replace(new RegExp(`\\b${word}\\b`, 'i'), `<span class="highlight">${word}</span>`);
                }
            }

            return html;
        }
    }

    const titleHtml = formatTitle(cleanTitle);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <!-- Fonts and base styles injected by TemplateEngine -->
    <style>${themeCSS}</style>
    <style>
        /* Template Specific Adjustments */
        .cover-header {
            display: flex; align-items: center; justify-content: space-between;
            background: rgba(10,10,10,0.8);
            padding: 20px 30px;
            border-left: 5px solid var(--accent-color);
            margin-bottom: 20px; /* Reduced from 40px */
            backdrop-filter: blur(5px);
        }
        .cover-cat { font-family: var(--font-mono); font-size: 28px; font-weight: 800; color: var(--accent-color); letter-spacing: 2px; }
        .cover-status { font-family: var(--font-mono); font-size: 22px; color: var(--success-color); display: flex; align-items: center; gap: 10px; }
        
        .brand-header-custom {
            display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 30px;
        }
    </style>
</head>
<body>

    <!-- Backgrounds -->
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <!-- Backgrounds -->
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="safe-zone" style="align-items: center; justify-content: center; --safe-bottom: 120px;">
        
        <!-- Main Content Group (Centered) -->
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
            
            <!-- Military Header Card -->
            <div class="military-card" style="
                background: rgba(10,10,10,0.9);
                border: 1px solid var(--glass-border);
                border-top: 4px solid var(--primary-color);
                padding: 20px 30px;
                display: flex; align-items: center; justify-content: space-between; gap: 16px;
                font-family: var(--font-mono);
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                width: 100%; margin: 0 auto;
                border-radius: 4px;
                box-sizing: border-box;
            ">
                <div style="font-weight: 800; letter-spacing: 2px; color: #fff; display:flex; align-items:center; gap:12px; font-size: 22px;">
                    <img src="../assets/kr-clidn-logo-small.png" style="height:36px; width:auto;"/>
                    KR-CLIDN
                </div>
                <div style="color: #333; font-size: 20px;">//</div>
                <div style="font-weight: 700; color: var(--accent-color); letter-spacing: 1px; flex: 1; text-align: center; font-size: 20px;">⚠️ ${category}</div>
                <div style="color: #333; font-size: 20px;">//</div>
                <div style="color: var(--success-color); font-weight: 700; display: flex; align-items: center; gap: 8px; font-size: 18px;">
                    <span style="font-size: 14px;">●</span> ACTIVO
                </div>
            </div>

            <!-- Main Title (Sharp & Static) -->
            <h1 class="cyber-title" style="
                text-align: center; 
                text-transform: uppercase; 
                font-family: var(--font-military); 
                font-size: 80px;
                line-height: 1;
                margin: 120px 0;
                max-width: 95%;
                text-shadow: 4px 4px 0px #000; /* Sharp solid shadow for contrast */
                color: #fff;
                letter-spacing: 2px;
            ">
                ${TemplateUtils.renderEditable('TITLE', titleHtml, data._overrides)}
            </h1>

            <!-- Terminal Preview (Cyan Border + White Text) -->
            <div class="terminal-window" style="
                border: 2px solid var(--primary-color);
                box-shadow: 0 0 20px color-mix(in srgb, var(--primary-color) 20%, transparent), inset 0 0 20px color-mix(in srgb, var(--primary-color) 5%, transparent);
                background: rgba(5, 5, 5, 0.95);
            ">
                <div class="term-header" style="border-bottom: 1px solid var(--primary-color); background: color-mix(in srgb, var(--primary-color) 10%, transparent);">
                    <div class="term-dot red"></div>
                    <div class="term-dot yellow"></div>
                    <div class="term-dot green"></div>
                    <span style="margin-left: 10px; color: var(--primary-color); font-family: var(--font-mono); font-weight:bold; letter-spacing:1px;">kali_secrets.sh</span>
                </div>
                <div class="term-body" style="text-align: center; color: #ffffff; padding: 30px;">
                    <div style="font-size: 24px; line-height: 1.5; font-family: var(--font-mono);">
                        ${TemplateUtils.renderEditable('SUBTITLE', `<div>${subtitle}</div>`, data._overrides)}
                    </div>
                </div>
            </div>

            <!-- Hex Ornament -->
            <div style="
                display: flex; align-items: center; justify-content: center; gap: 15px; 
                font-family: var(--font-mono); font-size: 14px; 
                color: var(--primary-color); opacity: 0.6;
                margin-top: 30px;
            ">
                <div style="height: 1px; width: 40px; background: var(--primary-color);"></div>
                <div style="letter-spacing: 2px;">0x4B414C49</div> 
                <div style="width: 6px; height: 6px; background: var(--accent-color); transform: rotate(45deg);"></div>
                <div style="letter-spacing: 2px;">0x534543</div>
                <div style="height: 1px; width: 40px; background: var(--primary-color);"></div>
            </div>

        </div>

        <!-- System Footer (Absolute, ignored by flex center) -->
        <div style="position: absolute; bottom: 40px; opacity: 0.5; font-size: 12px; font-family: var(--font-mono); letter-spacing: 4px; text-align: center; width: 100%;">
            AWAITING INPUT...
        </div>

    </div>

    <!-- Auto Fit Script -->
    ${TemplateUtils.getAutoFitScript()}

</body>
</html>`;
}