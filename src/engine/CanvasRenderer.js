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
        const SAFE_MARGIN_X = 60;   // 60px side margins for professional look
        const MIN_GAP = 40;          // Gap between elements

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

                // ── ENFORCE X MARGINS ── Ensure elements don't exceed canvas edges
                if (layer.x !== undefined && layer.x < SAFE_MARGIN_X && layer.type !== 'background' && layer.type !== 'brand' && layer.type !== 'pagination' && layer.type !== 'swipe') {
                    layer.x = SAFE_MARGIN_X;
                }
                const maxContentWidth = this.width - (SAFE_MARGIN_X * 2);
                if (layer.width && layer.width > maxContentWidth && layer.type !== 'background') {
                    layer.width = maxContentWidth;
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
                                } else if (child.type === 'warningbox') {
                                    childEstH = child.height || 180;
                                } else if (child.type === 'checklist') {
                                    childEstH = ((child.items || []).length * 66) + 20;
                                } else if (child.type === 'gridbox') {
                                    const cols = child.columns || 2;
                                    childEstH = Math.ceil((child.cells || []).length / cols) * 270;
                                } else if (child.type === 'toolgrid') {
                                    const cols = (child.tools || []).length > 4 ? 3 : 2;
                                    childEstH = Math.ceil((child.tools || []).length / cols) * 174;
                                } else if (child.type === 'attackflow') {
                                    childEstH = ((child.stages || []).length * 180);
                                } else if (child.type === 'architecturediag') {
                                    childEstH = ((child.layers || []).length * 190);
                                } else if (child.type === 'nodegraph') {
                                    childEstH = child.height || 500;
                                } else if (child.type === 'directorytree') {
                                    childEstH = 60 + ((child.items || []).length * 50);
                                } else if (child.type === 'barchart') {
                                    childEstH = child.height || 400;
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
                        else if (layer.type === 'terminal') { const oL = (layer.output || layer.content || '').split('\n').length; const cL = (layer.command || '').split('\n').length; estH = 80 + (oL + cL) * 55; }
                        else if (layer.type === 'warningbox') estH = layer.height || 180;
                        else if (layer.type === 'checklist') estH = ((layer.items || []).length * 66) + 20;
                        else if (layer.type === 'gridbox') { const cols = layer.columns || 2; estH = Math.ceil((layer.cells || []).length / cols) * 270; }
                        else if (layer.type === 'toolgrid') { const cols = (layer.tools || []).length > 4 ? 3 : 2; estH = Math.ceil((layer.tools || []).length / cols) * 174; }
                        else if (layer.type === 'attackflow') estH = ((layer.stages || []).length * 180);
                        else if (layer.type === 'architecturediag') estH = ((layer.layers || []).length * 190);
                        else if (layer.type === 'nodegraph') estH = layer.height || 500;
                        else if (layer.type === 'directorytree') estH = 60 + ((layer.items || []).length * 50);
                        else if (layer.type === 'barchart') estH = layer.height || 400;
                        else if (layer.type === 'bulletlist') estH = ((layer.items || []).length * 68) + 20;
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
        if (!layer || !layer.type) return;
        switch (layer.type.toLowerCase()) {
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
            case 'nodegraph': return this.drawNodeGraph(layer);
            case 'barchart': return this.drawBarChart(layer);
            case 'checklist': return this.drawChecklist(layer);
            case 'gridbox': return this.drawGridBox(layer);
            case 'warningbox': return this.drawWarningBox(layer);
            case 'directorytree': return this.drawDirectoryTree(layer);
            case 'toolgrid': return this.drawToolGrid(layer);
            case 'attackflow': return this.drawAttackFlow(layer);
            case 'architecturediag': return this.drawArchitectureDiag(layer);
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

        // ── PROFESSIONAL GEOMETRIC COVER BACKGROUND ──
        if (isCover) {
            const primary = this._getThemeColor('primary');
            const primaryRgb = this._hexToRgb(primary);

            // Removed radial gradient as requested, keeping the solid base fill from above

            // Draw professional geometric net (denser and enhanced)
            this.effectsEngine.drawGeometricNetPattern(0.35, primary, 42);

            // Draw clean subtle border frame
            this.ctx.save();
            const borderInset = 35;
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(borderInset, borderInset, this.width - borderInset * 2, this.height - borderInset * 2);

            // Minimalist modern corners (L-shapes)
            const cornerSize = 25;
            this.ctx.strokeStyle = 'rgba(' + primaryRgb + ', 0.6)';
            this.ctx.lineWidth = 2.5;

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

            this.ctx.restore();
        }

        // Pattern overlay (legacy support)
        if (pattern === 'circuit') {
            this.effectsEngine.drawCircuitPattern(opacity || 0.15);
        }

        if (pattern === 'net') {
            this.effectsEngine.drawGeometricNetPattern(opacity || 0.15, this._getThemeColor('primary'));
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
            this.ctx.font = `700 ${textSize}px "CODE Bold"`;
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
     * Cross-platform smart icon renderer.
     * Detects if it's an emoji or a material icon and uses the correct font.
     */
    _renderSmartIcon(ctx, icon, px, py, size, color, align = 'center') {
        if (!icon) return;

        // Detect if content is an emoji
        const isEmoji = /\p{Extended_Pictographic}/u.test(icon);
        const isMaterialIcon = !isEmoji && icon.length > 1 && !/[<>&]/.test(icon);

        ctx.textAlign = align;
        ctx.textBaseline = 'middle';

        if (isMaterialIcon) {
            ctx.font = size + 'px "Material Icons"';
            ctx.fillStyle = color || this._getThemeColor('primary');
        } else {
            ctx.font = size + 'px serif'; // OS native fallback for emojis
        }

        ctx.fillText(icon, px, py);
    }

    /**
     * Draw an emoji or icon (Original Layer).
     */
    drawIcon(layer) {
        const { content, x, y, width, size = 80, align = 'center', color } = layer;

        let drawX = x;
        if (align === 'center' && width) {
            drawX = x + width / 2;
        } else if (align === 'right' && width) {
            drawX = x + width;
        }

        this._renderSmartIcon(this.ctx, content, drawX, y, size, color, align);
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        return y + size / 2;
    }

    // =========================================================================
    // EXPORT

    // ════════════════ NUEVOS LAYER TYPES AVANZADOS ════════════════

    /**
     * Draw Node Graph (Network topology)
     */
    drawNodeGraph(layer) {
        const x = layer.x || 60;
        const y = layer.y || 400;
        const w = layer.width || 960;
        const h = layer.height || 500;
        const nodes = layer.nodes || [];
        const connections = layer.connections || [];
        const themeColor = this._getThemeColor();

        // Save context
        this.ctx.save();
        this.ctx.translate(x, y);

        // Map node IDs to their computed pixel coordinates
        const nodeMap = {};
        nodes.forEach(n => {
            nodeMap[n.id] = {
                px: (n.x || 0.5) * w,
                py: (n.y || 0.5) * h,
                label: n.label || '',
                icon: n.icon || ''
            };
        });

        // Draw connections first (so they go under nodes)
        connections.forEach(conn => {
            const numA = nodeMap[conn.from];
            const numB = nodeMap[conn.to];
            if (!numA || !numB) return;

            const connColor = conn.color || themeColor;

            this.ctx.beginPath();
            this.ctx.moveTo(numA.px, numA.py);
            // Draw a subtle curve if they are mostly horizontal, else straight line
            if (Math.abs(numA.py - numB.py) < 100) {
                const midX = (numA.px + numB.px) / 2;
                this.ctx.bezierCurveTo(midX, numA.py - 50, midX, numB.py - 50, numB.px, numB.py);
            } else {
                this.ctx.lineTo(numB.px, numB.py);
            }

            this.ctx.strokeStyle = connColor;
            this.ctx.lineWidth = 4;
            // Glow effect
            this.ctx.shadowColor = connColor;
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Draw connection label if exists
            if (conn.label) {
                const midX = (numA.px + numB.px) / 2;
                const midY = (numA.py + numB.py) / 2;

                this.ctx.fillStyle = '#111';
                const metrics = this.ctx.measureText(conn.label);
                const lw = Math.max(metrics.width + 20, 80);
                this.ctx.fillRect(midX - lw / 2, midY - 15, lw, 30);

                this.ctx.font = '600 20px "MPLUS Code Latin"';
                this.ctx.fillStyle = connColor;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(conn.label, midX, midY);
            }
        });

        // Draw nodes
        const nodeRadius = 40;
        nodes.forEach(n => {
            const px = nodeMap[n.id].px;
            const py = nodeMap[n.id].py;

            // Outer glow
            this.ctx.beginPath();
            this.ctx.arc(px, py, nodeRadius + 5, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${this._hexToRgb(themeColor)}, 0.2)`;
            this.ctx.fill();

            // Inner circle
            this.ctx.beginPath();
            this.ctx.arc(px, py, nodeRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#0a0a0c';
            this.ctx.strokeStyle = themeColor;
            this.ctx.lineWidth = 3;
            this.ctx.fill();
            this.ctx.stroke();

            // Icon
            if (n.icon) {
                this._renderSmartIcon(this.ctx, n.icon, px, py + 2, 40, themeColor, 'center');
            }

            // Label
            if (n.label) {
                this.ctx.font = '700 24px "MPLUS Code Latin"';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(n.label, px, py + nodeRadius + 25);
            }
        });

        this.ctx.restore();
        return y + (layer.height || 500);
    }

    /**
     * Draw Bar Chart (Statistics)
     */
    drawBarChart(layer) {
        const x = layer.x || 60;
        const y = layer.y || 500;
        const w = layer.width || 960;
        const h = layer.height || 400;
        const title = layer.title || '';
        const data = layer.data || [];
        const color = layer.color || this._getThemeColor();

        this.ctx.save();
        this.ctx.translate(x, y);

        // Draw title
        if (title) {
            this.ctx.font = '800 36px "BlackOpsOne"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(title, 0, 0);
        }

        const startY = title ? 60 : 0;
        const chartH = h - startY;

        if (data.length === 0) {
            this.ctx.restore();
            return;
        }

        const maxVal = Math.max(...data.map(d => d.value || 0));
        const barHeight = Math.min(60, (chartH / data.length) - 20);
        const labelWidth = 250;
        const maxBarWidth = w - labelWidth - 80;

        let currentY = startY + 20;

        data.forEach(item => {
            const val = item.value || 0;
            const barW = maxVal > 0 ? (val / maxVal) * maxBarWidth : 0;

            // Label
            this.ctx.font = '700 32px "MPLUS Code Latin"';
            this.ctx.fillStyle = '#cccccc';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.label || '', labelWidth - 20, currentY + barHeight / 2);

            // Bar background
            this.ctx.fillStyle = '#111111';
            this.effectsEngine.roundRect(labelWidth, currentY, maxBarWidth, barHeight, 6);
            this.ctx.fill();

            // Bar fill
            if (barW > 0) {
                this.ctx.fillStyle = color;
                this.ctx.shadowColor = color;
                this.ctx.shadowBlur = 10;
                this.effectsEngine.roundRect(labelWidth, currentY, barW, barHeight, 6);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }

            // Value text
            this.ctx.font = '800 32px "MPLUS Code Latin"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(val.toString(), labelWidth + barW + 15, currentY + barHeight / 2);

            currentY += barHeight + 20;
        });

        this.ctx.restore();
        return y + h;
    }

    /**
     * Draw Checklist (Interactive tasks)
     */
    drawChecklist(layer) {
        const x = layer.x || 60;
        const y = layer.y || 600;
        const w = layer.width || 960;
        const items = layer.items || [];
        const themeColor = this._getThemeColor();

        this.ctx.save();
        this.ctx.translate(x, y);

        let currentY = 0;
        const boxSize = 36;
        const gap = 24;

        items.forEach(item => {
            const status = item.status || 'pending';

            // Draw Checkbox
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = '#555';
            this.ctx.fillStyle = 'transparent';

            if (status === 'done') {
                this.ctx.fillStyle = '#00FF88'; // Success green
                this.ctx.strokeStyle = '#00FF88';
                this.ctx.shadowColor = '#00FF88';
                this.ctx.shadowBlur = 10;
            } else if (status === 'active') {
                this.ctx.fillStyle = 'transparent';
                this.ctx.strokeStyle = themeColor;
                this.ctx.shadowColor = themeColor;
                this.ctx.shadowBlur = 10;
            }

            this.effectsEngine.roundRect(0, currentY, boxSize, boxSize, 6);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Draw checkmark or loader
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            if (status === 'done') {
                this.ctx.font = 'bold 24px monospace';
                this.ctx.fillStyle = '#000';
                this.ctx.fillText('✓', boxSize / 2, currentY + boxSize / 2 + 2);
            } else if (status === 'active') {
                this.ctx.font = 'bold 20px monospace';
                this.ctx.fillStyle = themeColor;
                this.ctx.fillText('▶', boxSize / 2 + 2, currentY + boxSize / 2 + 1);
            }

            // Draw text
            this.ctx.font = '700 38px "MPLUS Code Latin"';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';

            if (status === 'done') {
                this.ctx.fillStyle = '#888';
                // Strikethrough
                const metrics = this.ctx.measureText(item.text);
                this.ctx.beginPath();
                this.ctx.moveTo(boxSize + gap, currentY + boxSize / 2);
                this.ctx.lineTo(boxSize + gap + metrics.width, currentY + boxSize / 2);
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#888';
                this.ctx.stroke();
            } else if (status === 'active') {
                this.ctx.fillStyle = '#ffffff';
            } else {
                this.ctx.fillStyle = '#cccccc';
            }

            this.ctx.fillText(item.text || '', boxSize + gap, currentY - 4);

            currentY += boxSize + 30; // Spacing between items
        });

        this.ctx.restore();
        return y + currentY;
    }

    /**
     * Draw GridBox (Matrices/Pros vs Cons)
     */
    drawGridBox(layer) {
        const x = layer.x || 60;
        const y = layer.y || 400;
        const w = layer.width || 960;
        const cols = layer.columns || 2;
        const cells = layer.cells || [];

        this.ctx.save();
        this.ctx.translate(x, y);

        const gap = 20;
        const colWidth = (w - (gap * (cols - 1))) / cols;
        const baseHeight = 250;

        let curX = 0;
        let curY = 0;

        cells.forEach((cell, i) => {
            if (i > 0 && i % cols === 0) {
                curX = 0;
                curY += baseHeight + gap;
            }

            const cellColor = cell.color || '#333';

            // Background
            this.ctx.fillStyle = '#0a0a0c';
            this.effectsEngine.roundRect(curX, curY, colWidth, baseHeight, 12);
            this.ctx.fill();

            // Accent Top
            this.ctx.fillStyle = cellColor;
            this.ctx.beginPath();
            this.ctx.moveTo(curX + 12, curY);
            this.ctx.lineTo(curX + colWidth - 12, curY);
            this.ctx.arcTo(curX + colWidth, curY, curX + colWidth, curY + 12, 12);
            this.ctx.lineTo(curX + colWidth, curY + 8);
            this.ctx.lineTo(curX, curY + 8);
            this.ctx.arcTo(curX, curY, curX + 12, curY, 12);
            this.ctx.fill();

            // Border
            this.ctx.strokeStyle = '#222';
            this.ctx.lineWidth = 2;
            this.effectsEngine.roundRect(curX, curY, colWidth, baseHeight, 12);
            this.ctx.stroke();

            // Cell Title
            this.ctx.font = '900 36px "BlackOpsOne"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(cell.title || '', curX + colWidth / 2, curY + 30);

            // Divider
            this.ctx.strokeStyle = '#222';
            this.ctx.beginPath();
            this.ctx.moveTo(curX + 20, curY + 80);
            this.ctx.lineTo(curX + colWidth - 20, curY + 80);
            this.ctx.stroke();

            // Cell Text (wrapped)
            const words = (cell.text || '').split(' ');
            let tLine = '';
            let tY = curY + 110;
            this.ctx.font = '600 30px "MPLUS Code Latin"';
            this.ctx.fillStyle = '#cccccc';

            for (let w = 0; w < words.length; w++) {
                const testLine = tLine + words[w] + ' ';
                const metrics = this.ctx.measureText(testLine);
                if (metrics.width > colWidth - 40 && w > 0) {
                    this.ctx.fillText(tLine, curX + colWidth / 2, tY);
                    tLine = words[w] + ' ';
                    tY += 40;
                } else {
                    tLine = testLine;
                }
            }
            this.ctx.fillText(tLine, curX + colWidth / 2, tY);

            curX += colWidth + gap;
        });

        this.ctx.restore();
        return y + curY + baseHeight;
    }

    /**
     * Draw WarningBox (Alerts/Tips)
     */
    drawWarningBox(layer) {
        const x = layer.x || 60;
        const y = layer.y || 800;
        const w = layer.width || 960;
        const title = layer.title || 'ATENCIÓN';
        const message = layer.message || '';
        const icon = layer.icon || '⚠️';

        let color = '#FF9500'; // warning default
        if (layer.style === 'danger') color = '#FF3366';
        if (layer.style === 'success') color = '#00FF88';
        if (layer.style === 'info') color = '#00D9FF';

        this.ctx.save();
        this.ctx.translate(x, y);

        // Box dimensions — respect user resize
        this.ctx.font = '600 36px "MPLUS Code Latin"';
        const h = layer.height || 180;

        // Background
        this.ctx.fillStyle = `rgba(${this._hexToRgb(color)}, 0.1)`;
        this.effectsEngine.roundRect(0, 0, w, h, 12);
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = `rgba(${this._hexToRgb(color)}, 0.4)`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Left accent bar
        this.ctx.fillStyle = color;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.effectsEngine.roundRect(-2, -2, 10, h + 4, 8);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Icon
        this._renderSmartIcon(this.ctx, icon, 70, h / 2 + 5, 70, color, 'center');

        // Title
        this.ctx.font = '900 42px "BlackOpsOne"';
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(title, 140, 30);

        // Message
        this.ctx.font = '700 34px "MPLUS Code Latin"';
        this.ctx.fillStyle = '#ffffff';

        const words = message.split(' ');
        let tLine = '';
        let tY = 90;
        for (let idx = 0; idx < words.length; idx++) {
            const testLine = tLine + words[idx] + ' ';
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > w - 170 && idx > 0) {
                this.ctx.fillText(tLine, 140, tY);
                tLine = words[idx] + ' ';
                tY += 45;
            } else {
                tLine = testLine;
            }
        }
        this.ctx.fillText(tLine, 140, tY);

        this.ctx.restore();
        return y + h;
    }


    /**
     * Draw Directory Tree (File system visualization)
     */
    drawDirectoryTree(layer) {
        const x = layer.x || 60;
        const y = layer.y || 400;
        const w = layer.width || 960;
        const root = layer.root || '/';
        const items = layer.items || [];
        const themeColor = this._getThemeColor();

        this.ctx.save();
        this.ctx.translate(x, y);

        // Root background
        this.ctx.fillStyle = '#0a0a0c';
        this.effectsEngine.roundRect(0, 0, w, 60, 8);
        this.ctx.fill();

        // Root border
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        this.effectsEngine.roundRect(0, 0, w, 60, 8);
        this.ctx.stroke();

        this._renderSmartIcon(this.ctx, 'folder', 30, 30, 30, themeColor);
        this.ctx.font = '800 32px "MPLUS Code Latin"';
        this.ctx.fillStyle = themeColor;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(root, 60, 32);

        let curY = 90;
        const indentX = 40;

        items.forEach((item, index) => {
            const isLast = index === items.length - 1;
            const depth = item.depth || 1;
            const icon = item.isDir ? 'folder' : 'description';
            const color = item.isDir ? themeColor : '#aaaaaa';
            const px = depth * indentX;

            // Draw line from parent
            this.ctx.strokeStyle = '#444';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();

            // Vertical line piece
            if (isLast) {
                this.ctx.moveTo(px - 15, curY - 30);
                this.ctx.lineTo(px - 15, curY);
                this.ctx.lineTo(px + 10, curY);
            } else {
                this.ctx.moveTo(px - 15, curY - 30);
                this.ctx.lineTo(px - 15, curY + 40); // continue down
                this.ctx.moveTo(px - 15, curY);
                this.ctx.lineTo(px + 10, curY);
            }
            this.ctx.stroke();

            // Item Icon
            this._renderSmartIcon(this.ctx, icon, px + 30, curY, 26, color);

            // Item Name
            this.ctx.font = item.isDir ? '700 28px "MPLUS Code Latin"' : '500 28px "MPLUS Code Latin"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(item.path || '', px + 55, curY + 2);

            // Item Description
            if (item.desc) {
                this.ctx.font = 'italic 400 24px "MPLUS Code Latin"';
                this.ctx.fillStyle = '#777777';
                const pathWidth = this.ctx.measureText(item.path).width;
                this.ctx.fillText('// ' + item.desc, px + 55 + pathWidth + 15, curY + 2);
            }

            curY += 50;
        });

        this.ctx.restore();
        return y + curY;
    }

    /**
     * Draw Tool Grid (Kali Arsenal)
     */
    drawToolGrid(layer) {
        const x = layer.x || 60;
        const y = layer.y || 400;
        const w = layer.width || 960;
        const tools = layer.tools || [];
        const themeColor = this._getThemeColor();
        const cols = tools.length > 4 ? 3 : 2;

        this.ctx.save();
        this.ctx.translate(x, y);

        const gap = 24;
        const colWidth = (w - (gap * (cols - 1))) / cols;
        const boxH = layer._userResized && layer.height ? Math.max(80, (layer.height / Math.ceil(tools.length / cols)) - gap) : 150;

        let curX = 0;
        let curY = 0;

        tools.forEach((tool, i) => {
            if (i > 0 && i % cols === 0) {
                curX = 0;
                curY += boxH + gap;
            }

            // Box Background
            this.ctx.fillStyle = '#0a0a0c';
            this.effectsEngine.roundRect(curX, curY, colWidth, boxH, 12);
            this.ctx.fill();

            // Box Border / Glow
            this.ctx.strokeStyle = themeColor;
            this.ctx.lineWidth = 1;
            this.ctx.shadowColor = themeColor;
            this.ctx.shadowBlur = 5;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Decorator bar
            this.ctx.fillStyle = themeColor;
            this.effectsEngine.roundRect(curX + 15, curY + 15, 6, 40, 3);
            this.ctx.fill();

            // Category Label
            this.ctx.font = '600 20px "MPLUS Code Latin"';
            this.ctx.fillStyle = '#888';
            this.ctx.textAlign = 'left';
            this.ctx.fillText((tool.category || '').toUpperCase(), curX + 35, curY + 35);

            // Tool Name
            this.ctx.font = '900 38px "BlackOpsOne"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(tool.name || '', curX + 35, curY + 95);

            // Icon
            this._renderSmartIcon(this.ctx, tool.icon || 'build', curX + colWidth - 45, curY + boxH / 2, 50, themeColor);

            curX += colWidth + gap;
        });

        this.ctx.restore();
        return y + curY + boxH;
    }

    /**
     * Draw Attack Flow (Kill Chain process)
     */
    drawAttackFlow(layer) {
        const x = layer.x || 60;
        const y = layer.y || 400;
        const w = layer.width || 960;
        const stages = layer.stages || [];
        const themeColor = this._getThemeColor();

        this.ctx.save();
        this.ctx.translate(x, y);

        const boxH = layer._userResized && layer.height ? Math.max(80, layer.height / Math.max(1, stages.length)) : 120;
        const gap = 60; // Space for arrow
        let curY = 0;

        stages.forEach((stage, index) => {
            const isLast = index === stages.length - 1;

            // Box
            this.ctx.fillStyle = '#0f0f12';
            this.ctx.strokeStyle = '#222';
            this.ctx.lineWidth = 2;
            this.effectsEngine.roundRect(0, curY, w, boxH, 12);
            this.ctx.fill();
            this.ctx.stroke();

            // Colored Left Border
            this.ctx.fillStyle = themeColor;
            this.ctx.shadowColor = themeColor;
            this.ctx.shadowBlur = 10;
            this.effectsEngine.roundRect(0, curY, 8, boxH, { tl: 12, bl: 12, tr: 0, br: 0 });
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Step Number bg
            this.ctx.fillStyle = 'rgba(255,255,255,0.05)';
            this.ctx.beginPath();
            this.ctx.arc(60, curY + boxH / 2, 35, 0, Math.PI * 2);
            this.ctx.fill();

            // Step Number
            this.ctx.font = '900 36px "BlackOpsOne"';
            this.ctx.fillStyle = themeColor;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(index + 1, 60, curY + boxH / 2);

            // Title
            this.ctx.font = '800 38px "MPLUS Code Latin"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(stage.title || '', 120, curY + boxH / 2 - 15);

            // Desc
            this.ctx.font = '500 26px "MPLUS Code Latin"';
            this.ctx.fillStyle = '#999';
            this.ctx.fillText(stage.desc || '', 120, curY + boxH / 2 + 25);

            curY += boxH;

            // Draw glowing arrow to next box if not last
            if (!isLast) {
                const arrowX = w / 2;

                this.ctx.shadowColor = themeColor;
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = themeColor;

                // Polygon downward arrow
                this.ctx.beginPath();
                this.ctx.moveTo(arrowX - 8, curY + 10);
                this.ctx.lineTo(arrowX + 8, curY + 10);
                this.ctx.lineTo(arrowX + 8, curY + gap - 20);
                this.ctx.lineTo(arrowX + 20, curY + gap - 20);
                this.ctx.lineTo(arrowX, curY + gap - 5);
                this.ctx.lineTo(arrowX - 20, curY + gap - 20);
                this.ctx.lineTo(arrowX - 8, curY + gap - 20);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.shadowBlur = 0;

                curY += gap;
            }
        });

        this.ctx.restore();
        return y + curY;
    }

    /**
     * Draw Architecture Diagram (Stacked server layers)
     */
    drawArchitectureDiag(layer) {
        const x = layer.x || 60;
        const y = layer.y || 400;
        const w = layer.width || 960;
        const layersData = layer.layers || [];
        const themeColor = this._getThemeColor();

        this.ctx.save();
        this.ctx.translate(x, y);

        const totalH = layersData.length * 160 + (layersData.length - 1) * 30; // 160px box + 30px gap
        let curY = 0;

        layersData.forEach((ld, index) => {
            const isLast = index === layersData.length - 1;
            const boxW = w - (index * 60); // Pyramid effect
            const boxX = (w - boxW) / 2;
            const boxH = layer._userResized && layer.height ? Math.max(80, (layer.height - (layersData.length - 1) * 30) / layersData.length) : 160;

            // Shadow / Depth
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.effectsEngine.roundRect(boxX + 10, curY + 10, boxW, boxH, 8);
            this.ctx.fill();

            // Main Plate
            this.ctx.fillStyle = '#0a0a0c';
            this.ctx.strokeStyle = index === 0 ? themeColor : '#333';
            this.ctx.lineWidth = index === 0 ? 3 : 2;
            this.effectsEngine.roundRect(boxX, curY, boxW, boxH, 8);
            this.ctx.fill();
            this.ctx.stroke();

            // Accent Glow on Top edge
            if (index === 0) {
                this.ctx.shadowColor = themeColor;
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.moveTo(boxX + 20, curY);
                this.ctx.lineTo(boxX + boxW - 20, curY);
                this.ctx.strokeStyle = themeColor;
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }

            // Tech Stack labels
            this.ctx.font = '600 24px "MPLUS Code Latin"';
            this.ctx.fillStyle = '#888';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(ld.tech || '', boxX + boxW - 30, curY + boxH - 25);

            // Layer Name
            this.ctx.font = '900 42px "BlackOpsOne"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ld.name || '', boxX + 120, curY + boxH / 2);

            // Icon
            this._renderSmartIcon(this.ctx, ld.icon || 'storage', boxX + 60, curY + boxH / 2, 50, themeColor);

            // Draw connection downwards
            if (!isLast) {
                this.ctx.beginPath();
                this.ctx.setLineDash([8, 8]);
                this.ctx.moveTo(w / 2, curY + boxH);
                this.ctx.lineTo(w / 2, curY + boxH + 30);
                this.ctx.strokeStyle = themeColor;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            curY += boxH + 30;
        });

        this.ctx.restore();
        return y + curY;
    }

    // =========================================================================

    /**
     * Export canvas to a Blob
 (PNG or WebP).
 (PNG or WebP).
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
