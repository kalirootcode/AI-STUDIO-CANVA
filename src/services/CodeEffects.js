/**
 * CodeEffects.js — DOM-level visual effects (Matrix Rain, CSS animations).
 * These run directly on HTML elements, separate from the canvas pipeline.
 */

export const CodeEffects = {

    /**
     * Mount a Matrix Rain canvas effect inside a container element.
     * Returns a cleanup function — call it to stop the animation and remove the canvas.
     *
     * @param {string} containerId  - DOM ID of the target container.
     * @param {string} color        - Hex or CSS color for the characters.
     * @param {'down'|'up'} direction - Flow direction.
     * @returns {Function} cleanup  - Call to stop and remove the effect.
     */
    mountMatrixRain(containerId, color = '#00D9FF', direction = 'down') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`[CodeEffects] Container #${containerId} not found.`);
            return () => {};
        }

        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            opacity: '0.25',
            zIndex: '-1',
            pointerEvents: 'none',
        });
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const FONT_SIZE  = 14;
        const CHARS = '0123456789ABCDEF<>/{}[]*&^%$#@!';
        let width, height, columns, drops;
        let animFrameId = null;
        let alive = true;

        const resize = () => {
            width   = canvas.width  = container.offsetWidth;
            height  = canvas.height = container.offsetHeight;
            columns = Math.max(1, Math.floor(width / FONT_SIZE));
            drops   = Array.from({ length: columns }, () => Math.random() * -50);
        };

        const draw = () => {
            if (!alive) return;
            animFrameId = requestAnimationFrame(draw);

            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = color;
            ctx.font = `${FONT_SIZE}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = CHARS[Math.floor(Math.random() * CHARS.length)];
                const x = i * FONT_SIZE;

                if (direction === 'up') {
                    const y = height - drops[i] * FONT_SIZE;
                    ctx.fillText(text, x, y);
                    if (drops[i] * FONT_SIZE > height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                } else {
                    const y = drops[i] * FONT_SIZE;
                    ctx.fillText(text, x, y);
                    if (y > height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                }
            }
        };

        // Use ResizeObserver when available for more reliable resize detection
        let resizeObserver = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => resize());
            resizeObserver.observe(container);
        } else {
            window.addEventListener('resize', resize);
        }

        resize();
        draw();

        // Return cleanup function
        return () => {
            alive = false;
            if (animFrameId) cancelAnimationFrame(animFrameId);
            if (resizeObserver) resizeObserver.disconnect();
            else window.removeEventListener('resize', resize);
            canvas.remove();
        };
    },

    /**
     * Mount a Pulse scanline effect on a container element.
     * Adds a slow horizontal sweep overlay.
     * Returns a cleanup function.
     *
     * @param {string} containerId
     * @param {string} color
     * @returns {Function} cleanup
     */
    mountScanline(containerId, color = '#00D9FF') {
        const container = document.getElementById(containerId);
        if (!container) return () => {};

        const line = document.createElement('div');
        Object.assign(line.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            opacity: '0.4',
            zIndex: '1',
            pointerEvents: 'none',
            animation: 'cet-scanline 4s linear infinite',
        });
        container.style.position = container.style.position || 'relative';
        container.style.overflow = container.style.overflow || 'hidden';
        container.appendChild(line);

        return () => line.remove();
    },

    /**
     * Inject global CSS animations used by CodeEffects.
     * Safe to call multiple times — uses a guard ID.
     */
    injectGlobalStyles() {
        if (document.getElementById('code-effects-styles')) return;
        const style = document.createElement('style');
        style.id = 'code-effects-styles';
        style.textContent = `
            @keyframes cyber-pulse {
                0%   { box-shadow: 0 0 5px var(--primary-color, #00D9FF); }
                50%  { box-shadow: 0 0 20px var(--primary-color, #00D9FF), 0 0 10px var(--accent-color, #A855F7); }
                100% { box-shadow: 0 0 5px var(--primary-color, #00D9FF); }
            }
            @keyframes icon-float {
                0%   { transform: translateY(0); }
                50%  { transform: translateY(-10px); }
                100% { transform: translateY(0); }
            }
            @keyframes cet-scanline {
                0%   { top: -2px; }
                100% { top: 100%; }
            }
            .cyber-effect-pulse  { animation: cyber-pulse 3s ease-in-out infinite; }
            .cyber-effect-float  { animation: icon-float  6s ease-in-out infinite; }
        `;
        document.head.appendChild(style);
    },
};
