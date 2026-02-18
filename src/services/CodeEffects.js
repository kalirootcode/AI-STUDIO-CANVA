
export const CodeEffects = {
    // Matrix Rain Effect adapted for specific containers
    // containerId: DOM ID to attach canvas to
    // color: Hex color (default primary)
    // direction: 'down' or 'up'
    mountMatrixRain(containerId, color = '#00D9FF', direction = 'down') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Create Canvas
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.opacity = '0.3'; // Subtle
        canvas.style.zIndex = '-1';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width, height;
        let columns;
        let drops = [];

        function resize() {
            width = canvas.width = container.offsetWidth;
            height = canvas.height = container.offsetHeight;
            const fontSize = 14;
            columns = Math.floor(width / fontSize);
            drops = [];
            for (let i = 0; i < columns; i++) {
                drops[i] = Math.random() * -100; // Start above
            }
        }

        window.addEventListener('resize', resize);
        resize();

        const chars = "0123456789ABCDEF<>/{}[]*&^%$#@!qwertyuiopasdfghjklzxcvbnm";
        const fontSize = 14;

        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Fade effect
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = color;
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                ctx.fillText(text, x, y);

                if (direction === 'down') {
                    if (y > height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                } else {
                    // Upward flow is tricky with this loop structure, simpler to visually invert or just stick to down
                    // Let's just do down for now, it's classic
                    if (y > height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                }
            }
            requestAnimationFrame(draw);
        }

        draw();
    },

    // Inject styles for glowing pulse
    injectGlobalStyles() {
        return `
        <style>
            @keyframes cyber-pulse {
                0% { box-shadow: 0 0 5px var(--primary-color); }
                50% { box-shadow: 0 0 20px var(--primary-color), 0 0 10px var(--accent-color); }
                100% { box-shadow: 0 0 5px var(--primary-color); }
            }
            @keyframes icon-float {
                0% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
                100% { transform: translateY(0); }
            }
            .cyber-effect-pulse {
                animation: cyber-pulse 3s infinite;
            }
            .cyber-effect-float {
                animation: icon-float 6s ease-in-out infinite;
            }
        </style>
        `;
    }
};
