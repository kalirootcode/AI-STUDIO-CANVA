/**
 * EffectsEngine.js — Visual Effects for Canvas Renderer (Production v2.0)
 * 
 * Handles gradients, glow, shadows, patterns, glassmorphism,
 * ambient orbs, noise grain, and rounded rectangles.
 */

class EffectsEngine {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this._patternCache = new Map();
    }

    /**
     * Create a gradient fill style.
     * Supports linear, radial, and multi-stop gradients.
     */
    createGradient(gradientDef) {
        const { type = 'linear', angle = 0, stops = ['#000', '#111'], cx, cy, r, x1: gx1, y1: gy1, x2: gx2, y2: gy2 } = gradientDef;

        if (type === 'radial') {
            const centerX = cx || this.canvas.width / 2;
            const centerY = cy || this.canvas.height / 2;
            const radius = r || Math.max(this.canvas.width, this.canvas.height) * 0.6;
            const grad = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            stops.forEach((stop, i) => {
                if (typeof stop === 'string') {
                    grad.addColorStop(i / (stops.length - 1), stop);
                } else {
                    grad.addColorStop(stop.offset, stop.color);
                }
            });
            return grad;
        }

        // Linear gradient with angle or explicit coordinates
        let lx1, ly1, lx2, ly2;
        if (gx1 !== undefined) {
            lx1 = gx1; ly1 = gy1; lx2 = gx2; ly2 = gy2;
        } else {
            const rad = (angle * Math.PI) / 180;
            const w = this.canvas.width;
            const h = this.canvas.height;
            lx1 = w / 2 - Math.cos(rad) * w / 2;
            ly1 = h / 2 - Math.sin(rad) * h / 2;
            lx2 = w / 2 + Math.cos(rad) * w / 2;
            ly2 = h / 2 + Math.sin(rad) * h / 2;
        }

        const grad = this.ctx.createLinearGradient(lx1, ly1, lx2, ly2);
        stops.forEach((stop, i) => {
            if (typeof stop === 'string') {
                grad.addColorStop(i / (stops.length - 1), stop);
            } else {
                grad.addColorStop(stop.offset, stop.color);
            }
        });
        return grad;
    }

    /**
     * Draw a rounded rectangle path.
     */
    roundRect(x, y, width, height, radius = 16) {
        const r = Math.min(radius, width / 2, height / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + width - r, y);
        this.ctx.arcTo(x + width, y, x + width, y + r, r);
        this.ctx.lineTo(x + width, y + height - r);
        this.ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
        this.ctx.lineTo(x + r, y + height);
        this.ctx.arcTo(x, y + height, x, y + height - r, r);
        this.ctx.lineTo(x, y + r);
        this.ctx.arcTo(x, y, x + r, y, r);
        this.ctx.closePath();
    }

    /**
     * Draw a filled rounded rectangle with optional shadow and border.
     * Supports shadow.spread for a larger glow box-shadow effect.
     */
    fillRoundRect(x, y, width, height, fill, border = null, radius = 16, shadow = null) {
        this.ctx.save();

        // Apply outer glow / box-shadow with spread
        if (shadow) {
            const sp = shadow.spread || 0;
            if (sp > 0) {
                this.ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
                this.ctx.shadowBlur = (shadow.blur || 20) + sp;
                this.ctx.shadowOffsetX = shadow.offsetX || 0;
                this.ctx.shadowOffsetY = shadow.offsetY || 8;
                // Draw expanded rect to simulate spread
                this.roundRect(x - sp, y - sp, width + sp * 2, height + sp * 2, radius + sp);
                this.ctx.fillStyle = 'transparent';
                this.ctx.fill();
            }
            this.ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = shadow.blur || 20;
            this.ctx.shadowOffsetX = shadow.offsetX || 0;
            this.ctx.shadowOffsetY = shadow.offsetY || 8;
        }

        this.roundRect(x, y, width, height, radius);

        // Fill
        if (typeof fill === 'object' && fill !== null && fill.type) {
            this.ctx.fillStyle = this.createGradient(fill);
        } else {
            this.ctx.fillStyle = fill || '#050505';
        }
        this.ctx.fill();

        // Reset shadow before border
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Border
        if (border) {
            this.ctx.strokeStyle = border.color || 'rgba(255,255,255,0.1)';
            this.ctx.lineWidth = border.width || 2;
            this.roundRect(x, y, width, height, radius);
            this.ctx.stroke();
        }

        // Inner highlight (top edge shimmer — makes cards look 3D)
        this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        this.ctx.lineWidth = 1;
        this.roundRect(x + 1, y + 1, width - 2, height - 2, radius);
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Apply a neon glow effect around text or shapes.
     */
    applyGlow(color, blur = 20) {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = blur;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    /**
     * Draw ambient color orbs for premium background atmosphere.
     * Draws 2-3 large, blurred radial gradients at very low opacity.
     */
    drawAmbientOrbs(primaryColor = '#00D9FF', accentColor = '#A855F7') {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.save();

        const orbs = [
            { x: w * 0.15, y: h * 0.2, r: w * 0.5, color: primaryColor, opacity: 0.04 },
            { x: w * 0.85, y: h * 0.75, r: w * 0.45, color: accentColor, opacity: 0.035 },
            { x: w * 0.5, y: h * 0.5, r: w * 0.35, color: primaryColor, opacity: 0.02 },
        ];

        for (const orb of orbs) {
            const grad = this.ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
            grad.addColorStop(0, orb.color.replace(')', `, ${orb.opacity})`).replace('rgb', 'rgba').replace(/#([0-9a-f]{6})/i, (m, hex) => {
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                return `rgba(${r},${g},${b},${orb.opacity})`;
            }));
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    /**
     * Draw a cinematic noise grain overlay for depth and texture.
     * Uses a seeded pseudo-random approach for deterministic output.
     */
    drawNoiseGrain(opacity = 0.025) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.save();
        this.ctx.globalAlpha = opacity;

        // Draw noise as sparse white pixel dots
        const density = 0.008; // 0.8% of pixels
        const total = Math.floor(w * h * density);

        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < total; i++) {
            // Simple LCG pseudo-random for performance
            const px = (Math.random() * w) | 0;
            const py = (Math.random() * h) | 0;
            this.ctx.fillRect(px, py, 1, 1);
        }

        this.ctx.restore();
    }

    /**
     * Draw horizontal accent bar with gradient.
     */
    drawAccentBar(x, y, width, height = 6, color = '#00D9FF') {
        this.ctx.save();
        const grad = this.ctx.createLinearGradient(x, y, x + width, y);
        grad.addColorStop(0, color);
        grad.addColorStop(0.6, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = grad;
        this.applyGlow(color, 8);
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, width, height, height / 2);
        this.ctx.fill();
        this.ctx.restore();
        return y + height;
    }

    /**
     * Draw card left-accent bar (vertical colored strip).
     */
    drawCardAccentBar(x, y, height, color = '#00D9FF', width = 4, radius = 2) {
        this.ctx.save();
        const grad = this.ctx.createLinearGradient(x, y, x, y + height);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = grad;
        this.applyGlow(color, 6);
        this.roundRect(x, y + 8, width, height - 16, radius);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawGeometricNetPattern(opacity = 0.15, color = '#00D9FF', seed = 42) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 1;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const numNodes = 160; // Increased density
        const connectionDist = 220;

        // Simple LCG pseudo-random function for consistent rendering
        let currentSeed = seed;
        const random = () => {
            currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
            return currentSeed / 4294967296;
        };

        const nodes = [];
        for (let i = 0; i < numNodes; i++) {
            // 5% chance of being a larger 'hub' node
            const isHub = random() > 0.95;
            nodes.push({
                x: random() * w,
                y: random() * h,
                size: isHub ? random() * 4 + 4 : random() * 2 + 1.5,
                isHub: isHub
            });
        }

        // Draw connections with distance-based opacity and glow
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10; // Subtle glow for connections
        for (let i = 0; i < numNodes; i++) {
            for (let j = i + 1; j < numNodes; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < connectionDist) {
                    const lineOpacity = (1 - (dist / connectionDist)) * opacity;
                    // Hub connections are slightly brighter
                    this.ctx.globalAlpha = (nodes[i].isHub || nodes[j].isHub) ? lineOpacity * 1.5 : lineOpacity;
                    this.ctx.lineWidth = (nodes[i].isHub || nodes[j].isHub) ? 1.5 : 1;

                    this.ctx.beginPath();
                    this.ctx.moveTo(nodes[i].x, nodes[i].y);
                    this.ctx.lineTo(nodes[j].x, nodes[j].y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw nodes over lines
        this.ctx.shadowBlur = 15; // Stronger glow for nodes
        for (const node of nodes) {
            this.ctx.globalAlpha = node.isHub ? Math.min(1, opacity * 4) : Math.min(1, opacity * 2.5);
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Reset shadow
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';

        this.ctx.restore();
    }

    /**
     * Draw the circuit board background pattern.
     */
    drawCircuitPattern(opacity = 0.15, color = '#00D9FF') {
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        const w = this.canvas.width;
        const h = this.canvas.height;
        const gridSize = 150;

        for (let gx = 0; gx < w; gx += gridSize) {
            for (let gy = 0; gy < h; gy += gridSize) {
                this._drawCircuitCell(gx, gy, gridSize);
            }
        }

        this.ctx.restore();
    }

    /**
     * Draw a single circuit cell for the pattern.
     */
    _drawCircuitCell(ox, oy, size) {
        const ctx = this.ctx;
        const s = size;

        ctx.beginPath();
        ctx.moveTo(ox, oy + s * 0.5);
        ctx.lineTo(ox + s * 0.3, oy + s * 0.5);
        ctx.lineTo(ox + s * 0.5, oy + s * 0.3);
        ctx.lineTo(ox + s * 0.7, oy + s * 0.3);
        ctx.lineTo(ox + s * 0.9, oy + s * 0.1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ox + s * 0.3, oy + s);
        ctx.lineTo(ox + s * 0.3, oy + s * 0.7);
        ctx.lineTo(ox + s * 0.5, oy + s * 0.5);
        ctx.lineTo(ox + s * 0.7, oy + s * 0.5);
        ctx.lineTo(ox + s * 0.7, oy + s * 0.7);
        ctx.stroke();

        const dots = [
            [0.3, 0.5], [0.5, 0.3], [0.9, 0.1],
            [0.3, 0.7], [0.7, 0.5], [0.7, 0.7]
        ];
        for (const [dx, dy] of dots) {
            ctx.beginPath();
            ctx.arc(ox + s * dx, oy + s * dy, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw a progress bar / stat bar.
     */
    drawStatBar(x, y, width, value, maxValue, color, height = 16) {
        const percentage = Math.min(value / maxValue, 1);

        // Background track
        this.fillRoundRect(x, y, width, height, 'rgba(255,255,255,0.08)', null, height / 2);

        // Filled portion
        const filledWidth = Math.max(height, width * percentage);
        this.ctx.save();
        this.applyGlow(color, 12);
        this.fillRoundRect(x, y, filledWidth, height, color, null, height / 2);
        this.ctx.restore();
    }

    /**
     * Reset all effect states.
     */
    reset() {
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.globalAlpha = 1;
    }
}

if (typeof module !== 'undefined') module.exports = EffectsEngine;
else window.EffectsEngine = EffectsEngine;
