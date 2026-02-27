/**
 * CanvasRenderer.js — Main Canvas Compositor Engine
 * 
 * Interprets a Scene Graph JSON and renders each layer
 * onto an HTML5 Canvas element. Orchestrates TextEngine,
 * EffectsEngine, and BrandingSystem.
 */

class CanvasRenderer {
    constructor(width = 1080, height = 1920) {
        this.width = width;
        this.height = height;

        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');

        // Sub-engines
        this.textEngine = new TextEngine(this.ctx);
        this.effectsEngine = new EffectsEngine(this.ctx, this.canvas);
        this.brandingSystem = null; // Set externally if needed

        // Font loading cache
        this._fontsLoaded = new Set();

        // Image cache
        this._imageCache = new Map();

        // Bounding boxes from last render (for CanvasEditor hit-testing)
        this.lastBounds = [];

        // Store renderer reference on canvas for TextEngine keyword access
        this.canvas._renderer = this;
    }

    /**
     * Get the current theme's primary color.
     */
    _getThemeColor(which = 'primary') {
        const theme = this.brandingSystem ? this.brandingSystem.getTheme(this._activeThemeName) : null;
        if (!theme) return '#00D9FF';
        return theme.colors[which] || '#00D9FF';
    }

    /**
     * Load required fonts before rendering.
     */
    async loadFonts(fontList = []) {
        // Inject @font-face for local fonts (if not already done)
        if (!this._fontFaceInjected) {
            this._fontFaceInjected = true;
            const style = document.createElement('style');
            style.textContent = [
                "@font-face {",
                "  font-family: 'BlackOpsOne';",
                "  src: url('./assets/fonts/BlackOpsOne-Regular.ttf') format('truetype');",
                "  font-weight: 400;",
                "  font-display: swap;",
                "}",
                "@font-face {",
                "  font-family: 'MPLUS Code Latin';",
                "  src: url('./assets/fonts/MPLUSCodeLatin-VariableFont_wdth,wght.ttf') format('truetype');",
                "  font-weight: 100 900;",
                "  font-display: swap;",
                "}",
                "@font-face {",
                "  font-family: 'CODE Bold';",
                "  src: url('./assets/fonts/CODE Bold.otf') format('opentype');",
                "  font-weight: 700;",
                "  font-display: swap;",
                "}"
            ].join('\n');
            document.head.appendChild(style);
        }

        const defaults = [
            { family: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
            { family: 'JetBrains Mono', url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap' },
            { family: 'Space Grotesk', url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700;900&display=swap' },
            { family: 'BlackOpsOne', local: true },
            { family: 'MPLUS Code Latin', local: true },
            { family: 'CODE Bold', local: true },
            { family: 'Material Icons', url: 'https://fonts.googleapis.com/icon?family=Material+Icons' }
        ];

        const allFonts = [...defaults, ...fontList];

        // Wait for @font-face fonts to be ready
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        for (const f of allFonts) {
            if (this._fontsLoaded.has(f.family)) continue;
            try {
                if (f.local) {
                    // Local @font-face fonts — try load but don't fail hard
                    await document.fonts.load('400 48px "' + f.family + '"').catch(() => { });
                    await document.fonts.load('700 48px "' + f.family + '"').catch(() => { });
                } else {
                    await document.fonts.load('400 48px "' + f.family + '"');
                    await document.fonts.load('700 48px "' + f.family + '"');
                    await document.fonts.load('900 48px "' + f.family + '"');
                }
                this._fontsLoaded.add(f.family);
            } catch (e) {
                console.warn('[CanvasRenderer] Font load failed: ' + f.family);
            }
        }
    }

    /**
     * Resolve asset path — fixes relative path resolution from Electron src/ context.
     */
    _resolveAssetPath(src) {
        if (!src || src.startsWith('data:') || src.startsWith('http')) return src;
        if (src.startsWith('./assets/')) {
            return '../assets/' + src.substring(9);
        }
        if (src.startsWith('assets/')) {
            return '../' + src;
        }
        return src;
    }

    /**
     * Load an image and cache it.
     */
    async loadImage(src) {
        src = this._resolveAssetPath(src);
        if (this._imageCache.has(src)) return this._imageCache.get(src);

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this._imageCache.set(src, img);
                resolve(img);
            };
            img.onerror = (e) => {
                console.warn(`[CanvasRenderer] Image load failed: ${src}`);
                resolve(null);
            };
            img.src = src;
        });
    }

    /**
     * Main render method — processes a full Scene Graph.
     */
    async render(sceneGraph, options = {}) {
        const { canvas: canvasDef, theme, layers = [] } = sceneGraph;
        const skipLayout = options.skipLayout || false;

        // Resize if needed
        if (canvasDef) {
            this.canvas.width = canvasDef.width || this.width;
            this.canvas.height = canvasDef.height || this.height;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
        }

        // Store theme name for color lookups
        this._activeThemeName = theme || sceneGraph.theme || 'cyber';
        if (this.brandingSystem) this.brandingSystem.setTheme(this._activeThemeName);

        // Load fonts
        await this.loadFonts();

        // Clear canvas
        this.clear();

        // Safe area constraints — from SafeZoneManager
        const SafeZoneManager = (typeof window !== 'undefined' && window.SafeZoneManager) ? window.SafeZoneManager : null;
        const zone = SafeZoneManager ? SafeZoneManager.getZone(this.width, this.height) : null;

        const SAFE_START_Y = zone ? zone.content.top : 140;
        const SAFE_END_Y = zone ? zone.content.bottom : (this.height - 140);
        const SAFE_MARGIN_X = 20;   // 20px side margins
        const MIN_GAP = 30;          // Gap between elements

        let globalMaxBottom = SAFE_START_Y;
        let lastContentRealBottom = SAFE_START_Y;
        let currentBlockMaxBottom = SAFE_START_Y; // Used by post-render check

        let currentCardOrigBot = -1;
        let currentCardDeltaY = 0;

        let prevOrigY = -1;
        let prevRealY = -1;

        // --- PASS 1: Layout & Bounding Box Calculation (skipped during editor re-renders) ---
        if (!skipLayout) {
            for (let i = 0; i < layers.length; i++) {
                const layer = layers[i];

                // Skip layout shifting for absolute fixed elements or user-moved elements
                if (layer._freeMove) {
                    prevOrigY = layer.y || 0;
                    prevRealY = layer.y || 0;
                    continue;
                }
                const isFixed = layer.type === 'background' || layer.type === 'brand' || layer.type === 'pagination' || layer.type === 'swipe';

                if (!isFixed && layer.y !== undefined) {
                    const targetY = layer.y;
                    let realY = targetY;

                    if (layer.type === 'rect') {
                        // Start of a new container card
                        realY = targetY + currentCardDeltaY;

                        // Must clear ALL previous elements (both cards and content)
                        const requiredY = Math.max(globalMaxBottom, lastContentRealBottom) + MIN_GAP;
                        if (realY < requiredY) {
                            realY = requiredY;
                        }

                        // --- LOOK-AHEAD: Scan children until next rect/end to get true card height ---
                        // Use absolute bottom tracking rather than Y-boundary so we never miss children
                        const origCardBottom = targetY + (layer.height || 0);
                        let maxChildBottom = origCardBottom;
                        let simulatedLastBottom = targetY; // Tracks cascade bottom inside the card

                        for (let j = i + 1; j < layers.length; j++) {
                            const child = layers[j];
                            // Stop at next card or fixed layer that marks section boundary
                            if (child.type === 'rect') break;
                            if (child.type === 'background' || child.type === 'brand' || child.type === 'pagination') continue;
                            // Stop at layers clearly outside even the most generous card boundary (+400px slack)
                            if (child.y !== undefined && child.y > origCardBottom + 400) break;

                            if (child.y !== undefined) {
                                let childEstH = child.height || 60;
                                if (child.type === 'text') {
                                    childEstH = this.textEngine.measureTextBlockHeight(child);
                                } else if (child.type === 'terminal') {
                                    const outputLines = (child.output || child.content || '').split('\n').length;
                                    const cmdLines = (child.command || '').split('\n').length;
                                    childEstH = 80 + (outputLines + cmdLines) * 55; // header + padding + lines
                                } else if (child.type === 'icon') {
                                    childEstH = (child.size || 80) + 20;
                                } else if (child.type === 'statbar') {
                                    childEstH = 85;
                                } else if (child.type === 'bulletlist') {
                                    childEstH = ((child.items || []).length * 68) + 20;
                                } else if (child.type === 'divider' || child.type === 'accent_bar') {
                                    childEstH = 30;
                                }

                                // Simulate cascade: if this child would overlap previous, push it down
                                const CONTENT_GAP = 24;
                                let simY = child.y;
                                if (simY < simulatedLastBottom + CONTENT_GAP) {
                                    simY = simulatedLastBottom + CONTENT_GAP;
                                }
                                simulatedLastBottom = simY + childEstH;
                                maxChildBottom = Math.max(maxChildBottom, simulatedLastBottom + 70); // 70px bottom padding
                            }
                        }

                        layer.height = Math.max(layer.height || 0, maxChildBottom - targetY);

                        currentCardDeltaY = realY - targetY;
                        currentCardOrigBot = targetY + layer.height;

                        globalMaxBottom = Math.max(globalMaxBottom, realY + layer.height);

                    } else {
                        // Content layer (text, terminal, etc)
                        const isInsideCard = (targetY <= currentCardOrigBot && currentCardOrigBot !== -1);
                        const isSideBySide = (prevOrigY !== -1 && Math.abs(targetY - prevOrigY) <= 15);

                        if (isInsideCard) {
                            realY = targetY + currentCardDeltaY;
                            if (isSideBySide) {
                                realY = prevRealY;
                            } else {
                                const CONTENT_GAP = 20;
                                if (realY < lastContentRealBottom + CONTENT_GAP) {
                                    realY = lastContentRealBottom + CONTENT_GAP; // Push down to prevent overlap
                                }
                            }
                        } else {
                            // Standalone content outside a card
                            currentCardOrigBot = -1; // Reset card tracking
                            realY = targetY + currentCardDeltaY;

                            if (isSideBySide) {
                                realY = prevRealY;
                            } else {
                                const requiredY = Math.max(globalMaxBottom, lastContentRealBottom) + MIN_GAP;
                                if (realY < requiredY) {
                                    realY = requiredY;
                                    currentCardDeltaY = realY - targetY; // Update delta for subsequent free elements
                                }
                            }
                        }

                        let estH = layer.height || 60;
                        if (layer.type === 'text') estH = this.textEngine.measureTextBlockHeight(layer);
                        lastContentRealBottom = Math.max(lastContentRealBottom, realY + estH);
                    }

                    // Apply safety clamp at very end of page
                    if (realY > SAFE_END_Y - 60) {
                        console.warn(`[CanvasRenderer] Layer at y=${realY} exceeds safe area (max ${SAFE_END_Y}). Clamping.`);
                        realY = SAFE_END_Y - 60;
                    }

                    // Clamp X to safe margins
                    if (layer.x !== undefined && layer.x < SAFE_MARGIN_X) {
                        layer.x = SAFE_MARGIN_X;
                    }

                    // Save references for next iteration
                    prevOrigY = targetY;
                    prevRealY = realY;
                    layer.finalY = realY;
                }
            }
        } // end if (!skipLayout)

        // --- PASS 2: Render & Draw ---
        this.lastBounds = [];
        for (let li = 0; li < layers.length; li++) {
            const layer = layers[li];
            layer._idx = li;
            const isFixed = layer.type === 'background' || layer.type === 'brand' || layer.type === 'pagination' || layer.type === 'swipe';

            if (!skipLayout && layer.finalY !== undefined) {
                layer.y = layer.finalY;
            }

            // Draw the layer and get its actual bottom bound (pixels painted)
            const bottomY = await this.renderLayer(layer);

            // Collect bounding box for CanvasEditor
            if (layer.type !== 'background') {
                const bw = layer.width || (this.width - (layer.x || 0) * 2);
                const bh = (bottomY && layer.y !== undefined) ? (bottomY - layer.y) : (layer.height || 60);
                this.lastBounds.push({ type: layer.type, layerIndex: li, x: layer.x || 0, y: layer.y || 0, width: bw, height: Math.max(bh, 20) });
            }

            // Update the global absolute maximum bottom bounds for the warning system
            if (!isFixed && bottomY !== undefined) {
                currentBlockMaxBottom = Math.max(currentBlockMaxBottom, bottomY);
            }
        }

        // Post-render overflow detection
        if (currentBlockMaxBottom > this.height - 60) {
            console.warn(`[CanvasRenderer] ⚠ Content overflow detected: bottomY=${Math.round(currentBlockMaxBottom)} exceeds canvas height=${this.height}. Content may be cut off.`);
        }

        return this.canvas;
    }

    /**
     * Route a layer to its specific renderer.
     */
    async renderLayer(layer) {
        switch (layer.type) {
            case 'background': return this.drawBackground(layer);
            case 'text': return this.drawText(layer);
            case 'rect': return this.drawRect(layer);
            case 'accent_bar': return this.drawAccentBar(layer);
            case 'terminal': return this.drawTerminal(layer);
            case 'image': return await this.drawImage(layer);
            case 'brand': return await this.drawBrand(layer);
            case 'pagination': return this.drawPagination(layer);
            case 'statbar': return this.drawStatBar(layer);
            case 'divider': return this.drawDivider(layer);
            case 'bulletlist': return this.drawBulletList(layer);
            case 'icon': return this.drawIcon(layer);
            case 'swipe': return this.drawSwipeArrow(layer);
            default:
                console.warn(`[CanvasRenderer] Unknown layer type: ${layer.type}`);
        }
    }

    /**
     * Clear the entire canvas.
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Convert hex color to RGB string (for use in rgba()).
     */
    _hexToRgb(hex) {
        if (!hex || !hex.startsWith('#')) return '0, 217, 255';
        const h = hex.replace('#', '');
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }

    /**
     * Helper to wrap a string into multiple lines based on maxWidth
     */
    _wrapLine(ctx, text, maxWidth) {
        if (!text) return [];
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width <= maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    // =========================================================================
    // LAYER RENDERERS
    // =========================================================================

    /**
     * Draw background — solid color, gradient, or with pattern overlay.
     * Automatically adds ambient light orbs and cinematic noise grain.
     * Cover mode (isCover=true): adds a hacking book-style decorative background.
     */
    drawBackground(layer) {
        const { fill, pattern, opacity, ambientColor, accentColor, isCover } = layer;

        // Enable high-quality rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Solid or gradient fill
        if (typeof fill === 'object' && fill !== null && fill.type) {
            this.ctx.fillStyle = this.effectsEngine.createGradient(fill);
        } else {
            this.ctx.fillStyle = fill || '#000000';
        }
        this.ctx.fillRect(0, 0, this.width, this.height);

        // ── HACKING BOOK COVER BACKGROUND (first slide only) ──
        if (isCover) {
            const primary = this._getThemeColor('primary');
            const accent = this._getThemeColor('accent');
            const primaryRgb = this._hexToRgb(primary);
            const accentRgb = this._hexToRgb(accent);

            // Dark gradient overlay from top
            const coverGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
            coverGrad.addColorStop(0, 'rgba(' + primaryRgb + ', 0.12)');
            coverGrad.addColorStop(0.3, 'rgba(0,0,0,0.95)');
            coverGrad.addColorStop(0.7, 'rgba(0,0,0,0.9)');
            coverGrad.addColorStop(1, 'rgba(' + accentRgb + ', 0.08)');
            this.ctx.fillStyle = coverGrad;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Decorative border frame
            this.ctx.save();
            const borderInset = 40;
            this.ctx.strokeStyle = 'rgba(' + primaryRgb + ', 0.25)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([12, 8]);
            this.ctx.strokeRect(borderInset, borderInset, this.width - borderInset * 2, this.height - borderInset * 2);
            this.ctx.setLineDash([]);

            // Corner accents (4 corners)
            const cornerSize = 60;
            this.ctx.strokeStyle = primary;
            this.ctx.lineWidth = 3;
            // Top-left
            this.ctx.beginPath();
            this.ctx.moveTo(borderInset, borderInset + cornerSize);
            this.ctx.lineTo(borderInset, borderInset);
            this.ctx.lineTo(borderInset + cornerSize, borderInset);
            this.ctx.stroke();
            // Top-right
            this.ctx.beginPath();
            this.ctx.moveTo(this.width - borderInset - cornerSize, borderInset);
            this.ctx.lineTo(this.width - borderInset, borderInset);
            this.ctx.lineTo(this.width - borderInset, borderInset + cornerSize);
            this.ctx.stroke();
            // Bottom-left
            this.ctx.beginPath();
            this.ctx.moveTo(borderInset, this.height - borderInset - cornerSize);
            this.ctx.lineTo(borderInset, this.height - borderInset);
            this.ctx.lineTo(borderInset + cornerSize, this.height - borderInset);
            this.ctx.stroke();
            // Bottom-right
            this.ctx.beginPath();
            this.ctx.moveTo(this.width - borderInset - cornerSize, this.height - borderInset);
            this.ctx.lineTo(this.width - borderInset, this.height - borderInset);
            this.ctx.lineTo(this.width - borderInset, this.height - borderInset - cornerSize);
            this.ctx.stroke();

            // Matrix-style falling characters (decorative)
            this.ctx.font = '400 14px "JetBrains Mono"';
            this.ctx.fillStyle = 'rgba(' + primaryRgb + ', 0.06)';
            const matrixChars = '01アイウエオカキクケコ{}[]<>/\\|;:$#@&%!?';
            for (let col = 0; col < 20; col++) {
                const x = 60 + col * 50 + (Math.sin(col * 1.3) * 15);
                for (let row = 0; row < 30; row++) {
                    const y = 80 + row * 62;
                    const ch = matrixChars[Math.floor((col * 7 + row * 3) % matrixChars.length)];
                    this.ctx.fillText(ch, x, y);
                }
            }

            // Horizontal accent lines
            this.ctx.strokeStyle = 'rgba(' + primaryRgb + ', 0.1)';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                const lineY = 200 + i * 350;
                const lineGrad2 = this.ctx.createLinearGradient(0, 0, this.width, 0);
                lineGrad2.addColorStop(0, 'rgba(0,0,0,0)');
                lineGrad2.addColorStop(0.3, 'rgba(' + primaryRgb + ', 0.08)');
                lineGrad2.addColorStop(0.7, 'rgba(' + primaryRgb + ', 0.08)');
                lineGrad2.addColorStop(1, 'rgba(0,0,0,0)');
                this.ctx.strokeStyle = lineGrad2;
                this.ctx.beginPath();
                this.ctx.moveTo(borderInset + 20, lineY);
                this.ctx.lineTo(this.width - borderInset - 20, lineY);
                this.ctx.stroke();
            }

            this.ctx.restore();
        }

        // Pattern overlay (legacy support)
        if (pattern === 'circuit') {
            this.effectsEngine.drawCircuitPattern(opacity || 0.15);
        }

        // Premium ambient orbs — uses active theme colors
        const primary = ambientColor || this._getThemeColor('primary');
        const accent = accentColor || this._getThemeColor('accent');
        this.effectsEngine.drawAmbientOrbs(primary, accent);

        // Cinematic noise grain
        this.effectsEngine.drawNoiseGrain(0.022);

        // Subtle separator line at top safe zone boundary
        this.ctx.save();
        const lineGrad = this.ctx.createLinearGradient(0, 0, this.width, 0);
        lineGrad.addColorStop(0, 'rgba(0,0,0,0)');
        lineGrad.addColorStop(0.2, 'rgba(' + this._hexToRgb(primary) + ', 0.15)');
        lineGrad.addColorStop(0.8, 'rgba(' + this._hexToRgb(primary) + ', 0.15)');
        lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.strokeStyle = lineGrad;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 130);
        this.ctx.lineTo(this.width, 130);
        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * Draw a text block — with 4K text rendering quality.
     */
    drawText(layer) {
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        return this.textEngine.renderTextBlock(layer);
    }

    /**
     * Draw a rectangle (card, panel, glassmorphism container).
     * Automatically adds a left accent color bar for visual depth.
     */
    drawRect(layer) {
        let { x, y, width, height, fill, border, radius = 16, shadow, accentColor, title } = layer;

        // No clamping — elements render freely (CanvasEditor handles positioning)

        // Premium shadow defaults
        const cardShadow = shadow || {
            blur: 60,
            color: 'rgba(0,0,0,0.7)',
            offsetY: 12,
            spread: 4
        };

        // Card border uses theme color
        const themeCardBorder = border || { color: this._getThemeColor('primary') + '40', width: 1.5 };
        this.effectsEngine.fillRoundRect(x, y, width, height, fill || '#0a0a0c', themeCardBorder, radius, cardShadow);

        // Left accent color bar — theme color
        const barColor = accentColor || this._getThemeColor('primary');
        this.effectsEngine.drawCardAccentBar(x, y, height, barColor, 5, 3);

        // Optional card title header
        if (title) {
            const headerH = 70;
            this.ctx.save();
            this.effectsEngine.roundRect(x, y, width, headerH, [radius, radius, 0, 0]);
            this.ctx.clip();
            const headerGrad = this.ctx.createLinearGradient(x, y, x + width, y);
            headerGrad.addColorStop(0, (barColor + '22'));
            headerGrad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = headerGrad;
            this.ctx.fillRect(x, y, width, headerH);
            this.ctx.restore();

            this.ctx.save();
            this.ctx.font = `700 36px "BlackOpsOne"`;
            this.ctx.fillStyle = barColor;
            this.ctx.fillText(title.toUpperCase(), x + 24, y + 46);
            this.ctx.restore();
        }

        return y + height;
    }

    /**
     * Draw a horizontal accent bar — gradient colored separator.
     */
    drawAccentBar(layer) {
        const { x = 60, y, width = 960, height = 6, color = '#00D9FF' } = layer;
        return this.effectsEngine.drawAccentBar(x, y, width, height, color);
    }

    /**
     * Draw a terminal window component.
     */
    drawTerminal(layer) {
        const {
            x, y, width,
            command = '',
            output = '',
            label = 'bash/shell'
        } = layer;

        const termPadding = 32;
        const headerHeight = 56;
        const fontSize = 36; // Slightly reduced to fit more code
        const lineH = fontSize * 1.5;

        // Pre-wrap lines to calculate true height
        const allowedWidth = width - (termPadding * 2);

        this.ctx.save();

        // Wrap output
        this.ctx.font = `400 ${fontSize}px "JetBrains Mono"`;
        const wrappedOutput = [];
        if (output) {
            for (const line of output.split('\n')) {
                wrappedOutput.push(...this._wrapLine(this.ctx, line, allowedWidth));
            }
        }

        // Wrap command
        this.ctx.font = `700 ${fontSize}px "JetBrains Mono"`;
        const promptText = '❯ ';
        const promptWidth = this.ctx.measureText(promptText).width;
        const wrappedCommand = command ? this._wrapLine(this.ctx, command, allowedWidth - promptWidth) : [];

        this.ctx.restore();

        // Calculate content height dynamically
        const totalLines = wrappedCommand.length + wrappedOutput.length;
        let bodyHeight = totalLines > 0 ? (totalLines * lineH + termPadding * 2) : 0;
        let totalHeight = headerHeight + bodyHeight;

        // No height clamping — terminal renders at full content size

        // Terminal window frame — border uses theme color
        const termBorderColor = this._getThemeColor('primary') + '60'; // 38% opacity
        this.effectsEngine.fillRoundRect(
            x, y, width, totalHeight,
            '#000000',
            { color: termBorderColor, width: 2 },
            12,
            { blur: 40, color: 'rgba(0,0,0,0.8)' }
        );

        // Header bar — dark with theme color tint
        const headerThemeColor = this._getThemeColor('primary');
        const headerRgb = this._hexToRgb(headerThemeColor);
        this.effectsEngine.fillRoundRect(
            x, y, width, headerHeight,
            'rgba(' + headerRgb + ', 0.15)',
            { color: headerThemeColor + '50', width: 1.5 },
            [12, 12, 0, 0]
        );
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(' + headerRgb + ', 0.12)';
        this.effectsEngine.roundRect(x, y, width, headerHeight, 16);
        this.ctx.fill();

        // Traffic light dots
        const dotY = y + headerHeight / 2;
        const dotColors = ['#FF3B30', '#FFCC00', '#34C759'];
        dotColors.forEach((c, i) => {
            this.ctx.fillStyle = c;
            this.ctx.beginPath();
            this.ctx.arc(x + 24 + i * 28, dotY, 8, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Shell label
        this.ctx.font = `400 ${fontSize - 4}px "JetBrains Mono"`;
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(label, x + width - 24, dotY + (fontSize - 4) / 3);
        this.ctx.textAlign = 'left';
        this.ctx.restore();

        // Render command and output within the visible area
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y + headerHeight, width, bodyHeight);
        this.ctx.clip(); // Ensure text doesn't bleed out if clamped

        let currentY = y + headerHeight + termPadding + fontSize;

        // Render Command
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.font = `700 ${fontSize}px "JetBrains Mono"`;

        for (let i = 0; i < wrappedCommand.length; i++) {
            if (currentY > y + totalHeight - termPadding) break; // Stop rendering

            const line = wrappedCommand[i];
            if (i === 0) {
                this.ctx.fillStyle = this._getThemeColor('primary'); // Prompt color — uses theme
                this.ctx.fillText(promptText, x + termPadding, currentY);
                this.ctx.fillStyle = '#f0f0f0';
                this.ctx.fillText(line, x + termPadding + promptWidth, currentY);
            } else {
                this.ctx.fillText(line, x + termPadding + promptWidth, currentY); // Aligned indent
            }
            currentY += lineH;
        }

        // Render Output
        if (wrappedOutput.length > 0) {
            currentY += (lineH * 0.5); // Spacer
            this.ctx.fillStyle = this._getThemeColor('accent'); // Output color — uses theme
            this.ctx.font = `400 ${fontSize}px "JetBrains Mono"`;

            for (const line of wrappedOutput) {
                if (currentY > y + totalHeight - termPadding) {
                    // Indicate truncation
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.fillText("... [OUTPUT TRUNCATED]", x + termPadding, currentY);
                    this.ctx.globalAlpha = 1.0;
                    break;
                }
                this.ctx.fillText(line, x + termPadding, currentY);
                currentY += lineH;
            }
        }

        this.ctx.restore();

        return y + totalHeight;
    }

    /**
     * Draw an image from URL or local path.
     * Supports fit modes: 'cover' (crop to fill), 'contain' (fit inside), 'fill' (stretch).
     */
    async drawImage(layer) {
        const { src, x, y, width, height, radius = 0, opacity = 1, fit = 'cover' } = layer;
        const img = await this.loadImage(src);
        if (!img) return y + (height || 0);

        this.ctx.save();
        this.ctx.globalAlpha = opacity;

        // Always clip to bounding box — prevents image overflow into other elements
        if (radius > 0) {
            this.effectsEngine.roundRect(x, y, width, height, radius);
        } else {
            this.ctx.beginPath();
            this.ctx.rect(x, y, width, height);
        }
        this.ctx.clip();

        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

        if (fit === 'fill' || !imgW || !imgH) {
            // Legacy stretch behavior
            this.ctx.drawImage(img, x, y, width, height);
        } else if (fit === 'contain') {
            // Fit entirely within the box (letter-boxed)
            const imgAspect = imgW / imgH;
            const boxAspect = width / height;
            let dx = x, dy = y, dw = width, dh = height;
            if (imgAspect > boxAspect) {
                dh = width / imgAspect;
                dy = y + (height - dh) / 2;
            } else {
                dw = height * imgAspect;
                dx = x + (width - dw) / 2;
            }
            this.ctx.drawImage(img, 0, 0, imgW, imgH, dx, dy, dw, dh);
        } else {
            // Cover: crop to fill the box, centered
            const imgAspect = imgW / imgH;
            const boxAspect = width / height;
            let sx = 0, sy = 0, sw = imgW, sh = imgH;
            if (imgAspect > boxAspect) {
                sw = imgH * boxAspect;
                sx = (imgW - sw) / 2;
            } else {
                sh = imgW / boxAspect;
                sy = (imgH - sh) / 2;
            }
            this.ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
        }

        this.ctx.restore();
        return y + height;
    }

    /**
     * Draw brand header — dual mode:
     * - Cover mode (isCover=true): 200px centered logo ABOVE brand name
     * - Standard mode: compact logo BESIDE brand name at matching size
     * Uses theme primary color for accents.
     */
    async drawBrand(layer) {
        const {
            logo,
            text = 'KR-CLIDN',
            badge = 'EDICIÓN PREMIUM',
            position = 'top',
            isCover = false
        } = layer;

        // Get theme primary color for accents
        const theme = this.brandingSystem ? this.brandingSystem.getTheme() : null;
        const primaryColor = (theme && theme.colors && theme.colors.primary) || '#00D9FF';
        const primaryRgb = this._hexToRgb(primaryColor);

        const padding = 60;

        if (isCover) {
            // ═══════════════════════════════════════════
            // COVER MODE — Large centered logo + brand name below
            // ═══════════════════════════════════════════
            const logoSize = 200;
            const logoX = (this.width - logoSize) / 2;
            const logoY = 60;

            // Logo with glow effect
            if (logo) {
                const img = await this.loadImage(logo);
                if (img) {
                    this.ctx.save();
                    // Glow behind logo
                    this.ctx.shadowColor = `rgba(${primaryRgb}, 0.6)`;
                    this.ctx.shadowBlur = 40;
                    this.ctx.shadowOffsetX = 0;
                    this.ctx.shadowOffsetY = 0;
                    this.ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
                    this.ctx.restore();

                    // Draw again without shadow for crisp image
                    this.ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
                }
            }

            // Brand name centered below logo
            const nameY = logoY + logoSize + 30;
            this.ctx.save();
            this.ctx.font = '700 52px "CODE Bold"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.letterSpacing = '6px';
            // Subtle text glow
            this.ctx.shadowColor = `rgba(${primaryRgb}, 0.4)`;
            this.ctx.shadowBlur = 20;
            this.ctx.fillText(text, this.width / 2, nameY);
            this.ctx.restore();

            // Badge below brand name
            this.ctx.save();
            this.ctx.font = '400 28px "JetBrains Mono"';
            this.ctx.fillStyle = primaryColor;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(badge, this.width / 2, nameY + 40);
            this.ctx.restore();

            // Accent divider line
            const lineY = nameY + 65;
            const lineW = 300;
            const lineGrad = this.ctx.createLinearGradient(
                (this.width - lineW) / 2, lineY,
                (this.width + lineW) / 2, lineY
            );
            lineGrad.addColorStop(0, 'rgba(0,0,0,0)');
            lineGrad.addColorStop(0.3, `rgba(${primaryRgb}, 0.5)`);
            lineGrad.addColorStop(0.7, `rgba(${primaryRgb}, 0.5)`);
            lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.strokeStyle = lineGrad;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo((this.width - lineW) / 2, lineY);
            this.ctx.lineTo((this.width + lineW) / 2, lineY);
            this.ctx.stroke();

        } else {
            // ═══════════════════════════════════════════
            // STANDARD MODE — Logo beside brand name (matching size)
            // ═══════════════════════════════════════════
            const y = position === 'top' ? 50 : this.height - 100;
            const textSize = 38;
            const logoH = textSize + 8;  // Logo matches text height
            const logoW = logoH;         // Square logo

            // Divider line with theme color
            const lineGrad = this.ctx.createLinearGradient(0, 0, this.width, 0);
            lineGrad.addColorStop(0, 'rgba(0,0,0,0)');
            lineGrad.addColorStop(0.15, `rgba(${primaryRgb}, 0.15)`);
            lineGrad.addColorStop(0.85, `rgba(${primaryRgb}, 0.15)`);
            lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.strokeStyle = lineGrad;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y + logoH + 12);
            this.ctx.lineTo(this.width - padding, y + logoH + 12);
            this.ctx.stroke();

            // Logo (same height as text)
            let logoEndX = padding;
            if (logo) {
                const img = await this.loadImage(logo);
                if (img) {
                    // Subtle glow
                    this.ctx.save();
                    this.ctx.shadowColor = `rgba(${primaryRgb}, 0.35)`;
                    this.ctx.shadowBlur = 15;
                    this.ctx.drawImage(img, padding, y, logoW, logoH);
                    this.ctx.restore();
                    logoEndX = padding + logoW + 14;
                }
            }

            // Brand text (beside logo)
            this.ctx.save();
            this.ctx.font = `800 ${textSize}px "Space Grotesk"`;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(text, logoEndX, y + textSize - 4);
            this.ctx.restore();

            // Badge (right side)
            this.ctx.save();
            this.ctx.font = '400 28px "JetBrains Mono"';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.textAlign = 'right';

            const badgeWidth = this.ctx.measureText(badge).width + 28;
            this.effectsEngine.fillRoundRect(
                this.width - padding - badgeWidth, y + 4,
                badgeWidth, 40,
                `rgba(${primaryRgb}, 0.06)`,
                { color: `rgba(${primaryRgb}, 0.15)`, width: 1 },
                8
            );
            this.ctx.fillText(badge, this.width - padding - 14, y + 34);
            this.ctx.textAlign = 'left';
            this.ctx.restore();
        }
    }

    /**
     * Draw pagination — now minimal, just page counter (no dots).
     */
    drawPagination(layer) {
        // Legacy support — redirect to swipe arrow
        return this.drawSwipeArrow(layer);
    }

    /**
     * Draw swipe arrow indicator (replaces pagination dots).
     * Shows a stylish right-pointing arrow on all slides except the last.
     */
    drawSwipeArrow(layer) {
        const { current = 1, total = 1, isLast = false } = layer;

        const theme = this.brandingSystem ? this.brandingSystem.getTheme() : null;
        const primaryColor = (theme && theme.colors && theme.colors.primary) || '#00D9FF';
        const primaryRgb = this._hexToRgb(primaryColor);

        // Don't show arrow on last slide
        if (isLast || current >= total) return;

        const arrowX = this.width / 2;
        const arrowY = this.height - 70;
        const arrowSize = 22;

        this.ctx.save();

        // Subtle circular background
        this.ctx.beginPath();
        this.ctx.arc(arrowX, arrowY, 36, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${primaryRgb}, 0.08)`;
        this.ctx.fill();
        this.ctx.strokeStyle = `rgba(${primaryRgb}, 0.25)`;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // Arrow chevron (>)
        this.ctx.strokeStyle = primaryColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX - arrowSize * 0.35, arrowY - arrowSize * 0.5);
        this.ctx.lineTo(arrowX + arrowSize * 0.35, arrowY);
        this.ctx.lineTo(arrowX - arrowSize * 0.35, arrowY + arrowSize * 0.5);
        this.ctx.stroke();

        // Subtle glow
        this.ctx.shadowColor = `rgba(${primaryRgb}, 0.4)`;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX - arrowSize * 0.35, arrowY - arrowSize * 0.5);
        this.ctx.lineTo(arrowX + arrowSize * 0.35, arrowY);
        this.ctx.lineTo(arrowX - arrowSize * 0.35, arrowY + arrowSize * 0.5);
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * Draw a stat bar with label and value.
     */
    drawStatBar(layer) {
        const { x, y, width, label, value, maxValue = 100, color = '#00D9FF', showPercent = true } = layer;

        // Label
        this.ctx.font = '700 42px "MPLUS Code Latin"';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(label, x, y);

        // Percentage
        if (showPercent) {
            const pct = `${Math.round((value / maxValue) * 100)}%`;
            this.ctx.fillStyle = color;
            this.ctx.textAlign = 'right';
            this.ctx.fillText(pct, x + width, y);
            this.ctx.textAlign = 'left';
        }

        // Bar
        this.effectsEngine.drawStatBar(x, y + 20, width, value, maxValue, color, 16);
        return y + 60; // Approximate height of statbar block
    }

    /**
     * Draw a horizontal divider line.
     */
    drawDivider(layer) {
        const { x = 60, y, width, color = 'rgba(255,255,255,0.1)', thickness = 2 } = layer;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + (width || this.width - x * 2), y);
        this.ctx.stroke();
        return y + thickness;
    }

    /**
     * Draw a bullet list.
     */
    drawBulletList(layer) {
        const {
            x, y, width,
            items = [],
            font = { family: 'MPLUS Code Latin', size: 40, weight: 400 },
            color = '#f0f0f0',
            bulletColor = '#00D9FF',
            bulletChar = '▸',
            spacing = 20
        } = layer;

        const fontSize = this.textEngine.setFont(font);
        const lineH = fontSize * 1.5;
        let currentY = y;

        for (const item of items) {
            // Bullet
            this.ctx.fillStyle = bulletColor;
            this.ctx.fillText(bulletChar, x, currentY);
            const bulletWidth = this.ctx.measureText(bulletChar + ' ').width;

            // Item text (with word wrap within remaining width)
            const textLayer = {
                content: item,
                x: x + bulletWidth + 8,
                y: currentY,
                width: width - bulletWidth - 8,
                font, color,
                lineHeight: 1.4
            };
            currentY = this.textEngine.renderTextBlock(textLayer);
            currentY += spacing;
        }

        return currentY;
    }

    /**
     * Draw an emoji or icon.
     */
    drawIcon(layer) {
        const { content, x, y, width, size = 80, align = 'center', color } = layer;

        // Detect if content is a Material Icon name (no emoji) or emoji
        const isEmoji = /\p{Extended_Pictographic}/u.test(content || '');
        const isMaterialIcon = !isEmoji && content && content.length > 1 && !/[<>&]/.test(content);

        if (isMaterialIcon) {
            // Material Icon — render with icon font, single theme color
            this.ctx.font = size + 'px "Material Icons"';
            this.ctx.fillStyle = color || this._getThemeColor('primary');
        } else {
            // Emoji fallback
            this.ctx.font = size + 'px serif';
        }

        this.ctx.textAlign = align;

        let drawX = x;
        if (align === 'center' && width) {
            drawX = x + width / 2;
        } else if (align === 'right' && width) {
            drawX = x + width;
        }

        this.ctx.fillText(content, drawX, y);
        this.ctx.textAlign = 'left';
        return y + size / 2;
    }

    // =========================================================================
    // EXPORT
    // =========================================================================

    /**
     * Export canvas to a Blob (PNG or WebP).
     */
    async exportBlob(format = 'image/png', quality = 1.0) {
        return new Promise(resolve => {
            this.canvas.toBlob(blob => resolve(blob), format, quality);
        });
    }

    /**
     * Export canvas to a Data URL string.
     */
    exportDataURL(format = 'image/png', quality = 1.0) {
        return this.canvas.toDataURL(format, quality);
    }

    /**
     * Get the raw Canvas element (for preview embedding).
     */
    getCanvas() {
        return this.canvas;
    }
}

if (typeof module !== 'undefined') module.exports = CanvasRenderer;
else window.CanvasRenderer = CanvasRenderer;
