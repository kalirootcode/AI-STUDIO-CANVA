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

        const SAFE_START_Y = zone ? Math.max(zone.content.top, 300) : 300;
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
                                    childEstH = child.height || 220;
                                } else if (child.type === 'checklist') {
                                    childEstH = ((child.items || []).length * 86) + 50;
                                } else if (child.type === 'gridbox') {
                                    const cols = child.columns || 2;
                                    const gap = 20;
                                    const cW = (this.width - (SAFE_MARGIN_X * 2) - (gap * (cols - 1))) / cols;
                                    let maxLines = 1;

                                    // Estimate wrapper height without real ctx access
                                    (child.cells || []).forEach(cell => {
                                        const chars = (cell.text || '').length;
                                        const estCharsPerLine = Math.floor((cW - 40) / 16); // ~16px per char avg for size 30
                                        const lines = Math.max(1, Math.ceil(chars / estCharsPerLine));
                                        if (lines > maxLines) maxLines = lines;
                                    });

                                    const estCellH = 140 + (maxLines * 50) + 40;  // More generous per-cell height
                                    childEstH = Math.ceil((child.cells || []).length / cols) * (estCellH + 40); // Larger gap between rows

                                } else if (child.type === 'toolgrid') {
                                    const cols = (child.tools || []).length > 4 ? 3 : 2;
                                    childEstH = Math.ceil((child.tools || []).length / cols) * 200;
                                } else if (child.type === 'attackflow') {
                                    childEstH = ((child.stages || []).length * 200) + 80; // 200px per stage + base padding
                                } else if (child.type === 'architecturediag') {
                                    childEstH = ((child.layers || []).length * 210) + 60;
                                } else if (child.type === 'nodegraph') {
                                    childEstH = (child.height || 500) + 80;
                                } else if (child.type === 'directorytree') {
                                    childEstH = 80 + ((child.items || []).length * 65);
                                } else if (child.type === 'barchart') {
                                    childEstH = (child.height || 400) + 80;
                                } else if (child.type === 'codeblock') {
                                    childEstH = child.height || Math.max(300, 80 + (Math.max(10, Math.min(30, (child.code || '').split('\n').length)) * 38));
                                } else if (child.type === 'hexdump') {
                                    childEstH = ((child.lines || 10) * 42) + 40;
                                } else if (child.type === 'timeline') {
                                    childEstH = ((child.events || []).length * 150) + 120; // More space per event
                                } else if (child.type === 'vs_table') {
                                    childEstH = 220 + ((child.rows || []).length * 120); // Rows can have multiline text
                                } else if (child.type === 'radarchart') {
                                    childEstH = (child.height || 500) + 80;
                                }

                                // Simulate cascade: if this child would overlap previous, push it down
                                const CONTENT_GAP = 30;
                                let simY = child.y;
                                if (simY < simulatedLastBottom + CONTENT_GAP) {
                                    simY = simulatedLastBottom + CONTENT_GAP;
                                }
                                simulatedLastBottom = simY + childEstH;
                                maxChildBottom = Math.max(maxChildBottom, simulatedLastBottom + 140); // 140px bottom padding (was 70)
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
                        else if (layer.type === 'terminal') { const oL = (layer.output || layer.content || '').split('\n').length; const cL = (layer.command || '').split('\n').length; estH = 100 + (oL + cL) * 58; }
                        else if (layer.type === 'warningbox') estH = layer.height || 220;
                        else if (layer.type === 'checklist') estH = ((layer.items || []).length * 86) + 50;
                        else if (layer.type === 'gridbox') { const cols = layer.columns || 2; estH = Math.ceil((layer.cells || []).length / cols) * 320; }
                        else if (layer.type === 'toolgrid') { const cols = (layer.tools || []).length > 4 ? 3 : 2; estH = Math.ceil((layer.tools || []).length / cols) * 200; }
                        else if (layer.type === 'attackflow') estH = ((layer.stages || []).length * 200) + 80;
                        else if (layer.type === 'architecturediag') estH = ((layer.layers || []).length * 210) + 60;
                        else if (layer.type === 'nodegraph') estH = (layer.height || 500) + 80;
                        else if (layer.type === 'directorytree') estH = 80 + ((layer.items || []).length * 65);
                        else if (layer.type === 'barchart') estH = (layer.height || 400) + 80;
                        else if (layer.type === 'codeblock') estH = layer.height || Math.max(300, 80 + (Math.max(10, Math.min(30, (layer.code || '').split('\n').length)) * 38));
                        else if (layer.type === 'hexdump') estH = ((layer.lines || 10) * 42) + 40;
                        else if (layer.type === 'timeline') estH = ((layer.events || []).length * 150) + 120;
                        else if (layer.type === 'vs_table') estH = 220 + ((layer.rows || []).length * 120);
                        else if (layer.type === 'radarchart') estH = (layer.height || 500) + 80;
                        else if (layer.type === 'bulletlist') estH = ((layer.items || []).length * 80) + 30;
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
            case 'hexagon_node': return this.drawHexagonNode(layer);
            case 'connection_line': return this.drawConnectionLine(layer);
            case 'barchart': return this.drawBarChart(layer);
            case 'checklist': return this.drawChecklist(layer);
            case 'gridbox': return this.drawGridBox(layer);
            case 'warningbox': return this.drawWarningBox(layer);
            case 'directorytree': return this.drawDirectoryTree(layer);
            case 'toolgrid': return this.drawToolGrid(layer);
            case 'attackflow': return this.drawAttackFlow(layer);
            case 'architecturediag': return this.drawArchitectureDiag(layer);
            case 'codeblock': return this.drawCodeBlock(layer);
            case 'hexdump': return this.drawHexdump(layer);
            case 'timeline': return this.drawTimeline(layer);
            case 'vs_table': return this.drawVsTable(layer);
            case 'radarchart': return this.drawRadarChart(layer);
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
        this.ctx.fillStyle = '#000000'; // Fondo estrictamente negro en todas las escenas
        this.ctx.fillRect(0, 0, this.width, this.height);

        const primary = ambientColor || this._getThemeColor('primary');
        const primaryRgb = this._hexToRgb(primary);
        const accent = accentColor || this._getThemeColor('accent');

        // Solo aplicamos efectos a la portada y al final (isCover maneja ambos en ContentEngine)
        if (isCover) {
            // ── PROFESSIONAL GEOMETRIC COVER BACKGROUND ──
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
            this.effectsEngine.drawGeometricNetPattern(opacity || 0.15, primary);
        }

        // Premium ambient orbs
        this.effectsEngine.drawAmbientOrbs(primary, accent);

        // Cinematic noise grain
        this.effectsEngine.drawNoiseGrain(0.022);

        // Subtle separator line at top safe zone boundary (adjusted for 300px top margin)
        this.ctx.save();
        const lineGrad = this.ctx.createLinearGradient(0, 0, this.width, 0);
        lineGrad.addColorStop(0, 'rgba(0,0,0,0)');
        lineGrad.addColorStop(0.2, 'rgba(' + this._hexToRgb(primary) + ', 0.15)');
        lineGrad.addColorStop(0.8, 'rgba(' + this._hexToRgb(primary) + ', 0.15)');
        lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.strokeStyle = lineGrad;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 280);
        this.ctx.lineTo(this.width, 280);
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
            // COVER MODE — Compact logo + brand name INSIDE the 300px top margin
            // ═══════════════════════════════════════════
            const logoSize = 120;                       // Compact so everything fits in 300px
            const logoX = (this.width - logoSize) / 2;
            const logoY = 22;                            // Start 22px from top edge

            // Logo with glow effect
            if (logo) {
                const img = await this.loadImage(logo);
                if (img) {
                    this.ctx.save();
                    // Glow behind logo
                    this.ctx.shadowColor = `rgba(${primaryRgb}, 0.6)`;
                    this.ctx.shadowBlur = 30;
                    this.ctx.shadowOffsetX = 0;
                    this.ctx.shadowOffsetY = 0;
                    this.ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
                    this.ctx.restore();

                    // Draw again without shadow for crisp image
                    this.ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
                }
            }

            // Brand name centered below logo — inside 300px zone
            const nameY = logoY + logoSize + 16;        // 22 + 120 + 16 = 158px
            this.ctx.save();
            this.ctx.font = '700 46px "CODE Bold"';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'center';
            this.ctx.letterSpacing = '6px';
            // Subtle text glow
            this.ctx.shadowColor = `rgba(${primaryRgb}, 0.4)`;
            this.ctx.shadowBlur = 18;
            this.ctx.fillText(text, this.width / 2, nameY);
            this.ctx.restore();

            // Badge below brand name — still inside 300px zone
            this.ctx.save();
            this.ctx.font = '400 24px "JetBrains Mono"';
            this.ctx.fillStyle = primaryColor;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(badge, this.width / 2, nameY + 36);  // 158 + 36 = 194px
            this.ctx.restore();

            // Accent divider line — bottom boundary of the 300px zone
            const lineY = nameY + 60;                   // 158 + 60 = 218px — within 300px
            const lineW = 280;
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
            // Centered vertically inside the header area. For 'top', start at 60px to stick to the top edge.
            const y = position === 'top' ? 60 : this.height - 100;
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
            icon = 'double_arrow',
            spacing = 30
        } = layer;

        const fontSize = this.textEngine.setFont(font);
        const iconSize = fontSize * 0.9;
        const indent = iconSize + 25;
        let currentY = y;

        const themeColor = this._getThemeColor();
        const bulletColor = layer.bulletColor || themeColor;

        for (const item of items) {
            if (item) {
                // Parseo robusto: Puede venir un primitivo 'string' o un Objeto { text: '...', icon: '...' }
                const isObject = typeof item === 'object' && item !== null;
                const contentText = isObject ? (item.text || item.content || '') : item;
                const itemIcon = isObject && item.icon ? item.icon : icon;

                if (!contentText.trim()) continue; // Skip strictly empty items dynamically defined

                // Efecto "Glow" tipo Hacker/Neon en la viñeta
                this.ctx.save();
                this.ctx.shadowBlur = 12;
                this.ctx.shadowColor = bulletColor;

                // Align icon with the vertical center of the FIRST line of the paragraph
                const iconY = currentY + (fontSize * 1.4) / 2;
                this._renderSmartIcon(this.ctx, layer.icon || itemIcon, x + iconSize / 2, iconY, iconSize, bulletColor, 'center');
                this.ctx.restore(); // Limpiar el shadow para que no ensucie el texto

                // Item text (with word wrap within remaining width and high contrast)
                const textLayer = {
                    content: contentText,
                    x: x + indent,
                    y: currentY,
                    width: width - indent,
                    font,
                    color: '#ffffff', // High contrast white overriding dull gray
                    lineHeight: 1.5 // Más elegante
                };
                currentY = this.textEngine.renderTextBlock(textLayer);
            }
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
        const unpositionedNodes = nodes.filter(n => typeof n.x === 'undefined' || typeof n.y === 'undefined');
        const totalUnpositioned = unpositionedNodes.length;
        let autoIdx = 0;
        let maxPy = 0;
        let maxPx = 0;

        nodes.forEach(n => {
            let px, py;
            if (typeof n.x === 'undefined' || typeof n.y === 'undefined') {
                // Auto-distribute unpositioned nodes in a perfect circle
                if (totalUnpositioned === 1) {
                    px = w / 2;
                    py = h / 2;
                } else {
                    const angle = (Math.PI * 2 * autoIdx) / totalUnpositioned - Math.PI / 2;
                    const r = Math.min(w, h) * 0.35; // radius of layout circle
                    px = (w / 2) + r * Math.cos(angle);
                    py = (h / 2) + r * Math.sin(angle);
                }
                autoIdx++;
            } else {
                px = n.x * w;
                py = n.y * h;
            }

            // Track maximum extremities to fix Bounding Box (Cyan Box) wrapping
            // Add 100px padding for the radius + text label
            if (py + 100 > maxPy) maxPy = py + 100;
            if (px + 100 > maxPx) maxPx = px + 100;

            nodeMap[n.id] = {
                px: px,
                py: py,
                label: n.label || '',
                icon: n.icon || ''
            };
        });

        // Draw connections first (so they go under nodes)
        connections.forEach((conn, idx) => {
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
            this.ctx.lineWidth = 3; // Thinner cleaner line

            // Tech dashboard animated pulsing dashes
            // Offset the dash pattern based on current time to simulate data flow
            const timeStr = Date.now() / 20;
            this.ctx.setLineDash([15, 10]);
            this.ctx.lineDashOffset = -timeStr; // Flow towards destination

            // Glow effect
            this.ctx.shadowColor = connColor;
            this.ctx.shadowBlur = 20;
            this.ctx.stroke();

            // Secondary bright inner core
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.stroke();

            this.ctx.shadowBlur = 0;
            this.ctx.setLineDash([]); // Reset dash for labels and nodes

            // Draw connection label if exists
            if (conn.label) {
                const midX = (numA.px + numB.px) / 2;
                const midY = (numA.py + numB.py) / 2 - 20; // Float slightly above the line

                this.ctx.font = '600 18px "MPLUS Code Latin"';
                const metrics = this.ctx.measureText(conn.label);
                const lw = Math.max(metrics.width + 30, 80);
                const lh = 36;

                // Translucent tech pill
                this.ctx.fillStyle = `rgba(10, 10, 12, 0.85)`;
                this.ctx.strokeStyle = `rgba(${this._hexToRgb(connColor)}, 0.5)`;
                this.ctx.lineWidth = 1;
                this.effectsEngine.roundRect(midX - lw / 2, midY - lh / 2, lw, lh, 18);
                this.ctx.fill();
                this.ctx.stroke();

                this.ctx.fillStyle = '#ffffff';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(conn.label, midX, midY + 1);
            }
        });

        // Helper function for drawing glowing hexagons
        const drawHexagon = (cx, cy, radius) => {
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const x = cx + radius * Math.cos(angle);
                const y = cy + radius * Math.sin(angle);
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
        };

        // Draw nodes
        const nodeRadius = 45;
        nodes.forEach(n => {
            const px = nodeMap[n.id].px;
            const py = nodeMap[n.id].py;

            // 1) Glowing faint outer ring
            this.ctx.beginPath();
            this.ctx.arc(px, py, nodeRadius + 14, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${this._hexToRgb(themeColor)}, 0.08)`;
            this.ctx.fill();

            // 2) Tech dashed ring
            this.ctx.beginPath();
            this.ctx.arc(px, py, nodeRadius + 8, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(${this._hexToRgb(themeColor)}, 0.4)`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([4, 8]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // 3) Hexagonal Solid Core
            drawHexagon(px, py, nodeRadius);
            // Solid dark center
            this.ctx.fillStyle = '#0a0a0c';
            this.ctx.fill();

            // Glowing bright border
            this.ctx.shadowColor = themeColor;
            this.ctx.shadowBlur = 20;
            this.ctx.strokeStyle = themeColor;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // 4) Inside Highlight Ring
            drawHexagon(px, py, nodeRadius - 6);
            this.ctx.strokeStyle = `rgba(${this._hexToRgb(themeColor)}, 0.2)`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // 5) Icon perfectly centered — with emoji fallback
            if (n.icon) {
                const iconMap = {
                    'dns': '🌐', 'storage': '💾', 'cloud': '☁️', 'router': '📡',
                    'server': '🖥️', 'database': '🗄️', 'desktop_mac': '🖥️', 'computer': '💻',
                    'laptop': '💻', 'wifi': '📶', 'lan': '🔌', 'hub': '🔀',
                    'security': '🛡️', 'shield': '🛡️', 'lock': '🔒', 'key': '🔑',
                    'visibility': '👁️', 'search': '🔍', 'bug_report': '🐛', 'warning': '⚠️',
                    'terminal': '⌨️', 'code': '⟨⟩', 'settings': '⚙️', 'build': '🔧',
                    'firewall': '🧱', 'workstation': '🖥️', 'api': '🔗', 'web': '🌐',
                    'scan': '🔍', 'person': '👤', 'group': '👥', 'folder': '📂',
                    'email': '📧', 'power': '⚡', 'target': '🎯', 'exploit': '💀',
                };
                const emoji = iconMap[n.icon] || iconMap[n.icon.toLowerCase()] || '🔷';
                this.ctx.font = '30px serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(emoji, px, py + 2);
            }

            // 6) Align text baseline perfectly to MATCH CanvasEditor extracting text
            if (n.label) {
                this.ctx.font = '700 20px "MPLUS Code Latin"';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'top'; // KEY FIX
                this.ctx.fillText(n.label, px, py + nodeRadius + 8); // Matched to Editor offset
            }
        });

        this.ctx.restore();

        // Ensure the layout engine stores the true encapsulating height and width for CanvasEditor
        // so the cyan bounding box wraps perfectly around the deepest and widest nodes.
        layer.width = Math.max(w, maxPx - x + 20);
        layer.height = Math.max(h, maxPy + 20);
        return y + layer.height;
    }

    /**
     * Draw individual Hexagon Node (for Exploded NodeGraph)
     * Premium cyber-dashboard style with built-in icon fallback
     */
    drawHexagonNode(layer) {
        const x = layer.x || 60;
        const y = layer.y || 400;
        const radius = layer.size || 45;
        const themeColor = layer.color || this._getThemeColor();
        const iconName = layer.icon || 'dns';

        const cx = x + radius;
        const cy = y + radius;

        // ═══ BUILT-IN ICON FALLBACK MAP ═══
        // Material Icons font is not guaranteed. Use Unicode/Emoji as reliable fallback.
        const iconMap = {
            // Network & Infrastructure
            'dns': '🌐', 'storage': '💾', 'cloud': '☁️', 'router': '📡',
            'server': '🖥️', 'database': '🗄️', 'desktop_mac': '🖥️', 'computer': '💻',
            'laptop': '💻', 'phone_android': '📱', 'tablet': '📱', 'devices': '📱',
            'wifi': '📶', 'network_check': '🔗', 'lan': '🔌', 'hub': '🔀',
            'vpn_lock': '🔐', 'public': '🌍', 'language': '🌍',
            // Security
            'security': '🛡️', 'shield': '🛡️', 'lock': '🔒', 'lock_open': '🔓',
            'key': '🔑', 'fingerprint': '👆', 'verified_user': '✅', 'gpp_good': '✅',
            'admin_panel_settings': '⚙️', 'policy': '📋',
            // Monitoring & Analysis
            'visibility': '👁️', 'search': '🔍', 'bug_report': '🐛', 'warning': '⚠️',
            'error': '❌', 'report': '📊', 'analytics': '📈', 'monitoring': '📡',
            'terminal': '⌨️', 'code': '⟨⟩', 'memory': '🧠', 'settings': '⚙️',
            // Communication
            'email': '📧', 'mail': '📧', 'chat': '💬', 'forum': '💬',
            'person': '👤', 'group': '👥', 'people': '👥', 'account_circle': '👤',
            // Files
            'folder': '📂', 'file': '📄', 'description': '📄', 'attachment': '📎',
            // Actions
            'build': '🔧', 'extension': '🧩', 'power': '⚡', 'bolt': '⚡',
            'sync': '🔄', 'autorenew': '🔄', 'download': '⬇️', 'upload': '⬆️',
            // Misc
            'firewall': '🧱', 'workstation': '🖥️', 'api': '🔗', 'web': '🌐',
            'scan': '🔍', 'nmap': '🔍', 'exploit': '💀', 'malware': '🦠',
            'target': '🎯', 'attack': '⚔️', 'hacker': '💀', 'payload': '💣',
        };

        // Resolve icon: try Material Icons first, fallback to emoji map
        const fallbackEmoji = iconMap[iconName] || iconMap[iconName.toLowerCase()] || '🔷';

        this.ctx.save();

        // Helper function for drawing glowing hexagons
        const drawHexagon = (hcx, hcy, hr) => {
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                const px = hcx + hr * Math.cos(angle);
                const py = hcy + hr * Math.sin(angle);
                if (i === 0) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.closePath();
        };

        // 1) Pulsing outer glow aura
        const pulseTime = (Math.sin(Date.now() / 800) + 1) / 2; // 0..1 pulse
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius + 18 + pulseTime * 6, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${this._hexToRgb(themeColor)}, ${0.03 + pulseTime * 0.04})`;
        this.ctx.fill();

        // 2) Tech dashed orbital ring (animated rotation)
        const rotAngle = Date.now() / 3000;
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(rotAngle);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius + 10, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(${this._hexToRgb(themeColor)}, 0.35)`;
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([6, 12]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.restore();

        // 3) Hexagonal Solid Core with gradient fill
        drawHexagon(cx, cy, radius);
        const grad = this.ctx.createRadialGradient(cx, cy - radius * 0.3, 0, cx, cy, radius);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, '#0a0a0c');
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        // Glowing bright border with double-stroke
        this.ctx.shadowColor = themeColor;
        this.ctx.shadowBlur = 25;
        this.ctx.strokeStyle = themeColor;
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // 4) Inner hexagonal highlight ring
        drawHexagon(cx, cy, radius - 6);
        this.ctx.strokeStyle = `rgba(${this._hexToRgb(themeColor)}, 0.15)`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 5) Corner accent dots (4 cardinal points)
        const dotPositions = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        dotPositions.forEach(a => {
            const dx = cx + (radius + 10) * Math.cos(a);
            const dy = cy + (radius + 10) * Math.sin(a);
            this.ctx.beginPath();
            this.ctx.arc(dx, dy, 2, 0, Math.PI * 2);
            this.ctx.fillStyle = themeColor;
            this.ctx.fill();
        });

        // 6) Icon — Try Material Icons font, then fallback to emoji
        const iconSize = Math.max(24, radius * 0.75);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Attempt Material Icons first
        this.ctx.font = `${iconSize}px "Material Icons"`;
        const metrics = this.ctx.measureText(iconName);
        const materialWorks = metrics.width > 0 && metrics.width < iconSize * 2;

        if (materialWorks && iconName.length > 1) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(iconName, cx, cy + 2);
        } else {
            // Emoji fallback — always works
            this.ctx.font = `${iconSize}px serif`;
            this.ctx.fillText(fallbackEmoji, cx, cy + 2);
        }

        this.ctx.restore();

        layer.width = radius * 2;
        layer.height = radius * 2;
        return y + layer.height;
    }

    /**
     * Draw targeted Connection Line (for Exploded NodeGraph)
     * Premium animated cyber-dashboard style
     */
    drawConnectionLine(layer) {
        const sx = layer.startX || 0;
        const sy = layer.startY || 0;
        const ex = layer.endX || 200;
        const ey = layer.endY || 200;
        const connColor = layer.color || this._getThemeColor();

        this.ctx.save();

        // Create gradient along the line direction
        const lineGrad = this.ctx.createLinearGradient(sx, sy, ex, ey);
        lineGrad.addColorStop(0, `rgba(${this._hexToRgb(connColor)}, 0.3)`);
        lineGrad.addColorStop(0.5, connColor);
        lineGrad.addColorStop(1, `rgba(${this._hexToRgb(connColor)}, 0.3)`);

        // Background glow trail (wider, softer)
        this.ctx.beginPath();
        this.ctx.moveTo(sx, sy);
        if (Math.abs(sy - ey) < 100) {
            const midX = (sx + ex) / 2;
            this.ctx.bezierCurveTo(midX, sy - 50, midX, ey - 50, ex, ey);
        } else {
            this.ctx.lineTo(ex, ey);
        }
        this.ctx.strokeStyle = `rgba(${this._hexToRgb(connColor)}, 0.08)`;
        this.ctx.lineWidth = 12;
        this.ctx.stroke();

        // Main animated dashed line
        this.ctx.beginPath();
        this.ctx.moveTo(sx, sy);
        if (Math.abs(sy - ey) < 100) {
            const midX = (sx + ex) / 2;
            this.ctx.bezierCurveTo(midX, sy - 50, midX, ey - 50, ex, ey);
        } else {
            this.ctx.lineTo(ex, ey);
        }

        this.ctx.strokeStyle = lineGrad;
        this.ctx.lineWidth = 2.5;

        // Tech dashboard animated pulsing dashes
        const timeStr = Date.now() / 20;
        this.ctx.setLineDash([15, 10]);
        this.ctx.lineDashOffset = -timeStr; // Flow towards destination

        // Glow effect
        this.ctx.shadowColor = connColor;
        this.ctx.shadowBlur = 15;
        this.ctx.stroke();

        // Secondary bright inner core
        this.ctx.lineWidth = 0.8;
        this.ctx.strokeStyle = `rgba(255,255,255,0.6)`;
        this.ctx.shadowBlur = 0;
        this.ctx.stroke();

        this.ctx.setLineDash([]); // Reset dash

        // Endpoint dots (small circles at connection points)
        [{ px: sx, py: sy }, { px: ex, py: ey }].forEach(pt => {
            this.ctx.beginPath();
            this.ctx.arc(pt.px, pt.py, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = connColor;
            this.ctx.shadowColor = connColor;
            this.ctx.shadowBlur = 10;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // Draw connection label if exists
        if (layer.label) {
            const midX = (sx + ex) / 2;
            const midY = (sy + ey) / 2 - 20; // Float slightly above the line

            this.ctx.font = '600 16px "MPLUS Code Latin"';
            const metrics = this.ctx.measureText(layer.label);
            const lw = Math.max(metrics.width + 24, 60);
            const lh = 30;

            // Translucent tech pill with gradient border
            this.ctx.fillStyle = `rgba(6, 6, 10, 0.9)`;
            this.ctx.strokeStyle = `rgba(${this._hexToRgb(connColor)}, 0.6)`;
            this.ctx.lineWidth = 1;
            this.effectsEngine.roundRect(midX - lw / 2, midY - lh / 2, lw, lh, 15);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = connColor;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(layer.label, midX, midY + 1);
        }

        this.ctx.restore();

        // Compute loose bounding box
        layer.x = Math.min(sx, ex) - 20;
        layer.y = Math.min(sy, ey) - 20;
        layer.width = Math.abs(ex - sx) + 40;
        layer.height = Math.abs(ey - sy) + 80;

        return layer.y + layer.height;
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

            // Configuración Tipográfica
            const fontConfig = { family: 'MPLUS Code Latin', size: 38, weight: 700 };
            const textIndent = boxSize + gap;
            const availableWidth = w - textIndent;

            let textColor = '#cccccc';
            if (status === 'done') textColor = '#888';
            else if (status === 'active') textColor = '#ffffff';

            const textLayer = {
                content: item.text || '',
                x: textIndent,
                y: currentY - 4, // Ligeramente arriba para alinear con checkbox
                width: availableWidth,
                font: fontConfig,
                color: textColor,
                lineHeight: 1.3
            };

            // Renderizar el bloque de texto y obtener hasta dónde llegó (Y)
            const nextY = this.textEngine.renderTextBlock(textLayer);

            // Strikethrough visual simplificado para el elemento completado
            if (status === 'done') {
                this.ctx.save();
                this.ctx.font = '700 38px "MPLUS Code Latin"';
                // Calculamos solo una aproximación o la primera línea cortada para el tachado
                const metrics = this.ctx.measureText((item.text || '').substring(0, 30));
                this.ctx.beginPath();
                this.ctx.moveTo(textIndent, currentY + boxSize / 2);
                this.ctx.lineTo(textIndent + Math.min(metrics.width, availableWidth), currentY + boxSize / 2);
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = '#888';
                this.ctx.stroke();
                this.ctx.restore();
            }

            // El siguiente item empieza después del texto renderizado, asegurando un mínimo del boxSize
            const itemTotalHeight = Math.max(nextY - currentY, boxSize);
            currentY += itemTotalHeight + 30; // Spacing between items
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
        const numRows = Math.ceil(cells.length / cols);

        // Dynamic Height Calculation: find max height required across all cells
        let maxReqHeight = 150; // Base space for title + paddings
        this.ctx.font = '600 30px "MPLUS Code Latin"';
        cells.forEach(cell => {
            const words = (cell.text || '').split(' ');
            let tLine = '';
            let lines = 1;
            for (let w = 0; w < words.length; w++) {
                const testLine = tLine + words[w] + ' ';
                const metrics = this.ctx.measureText(testLine);
                if (metrics.width > colWidth - 40 && w > 0) {
                    lines++;
                    tLine = words[w] + ' ';
                } else {
                    tLine = testLine;
                }
            }
            const reqH = 120 + (lines * 40) + 30; // 120 start Y + line heights + bottom padding
            if (reqH > maxReqHeight) maxReqHeight = reqH;
        });

        const baseHeight = (layer._userResized && layer.height) ? Math.max(100, (layer.height - gap * (numRows - 1)) / numRows) : maxReqHeight;

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
            this.ctx.fillText(cell.title || '', curX + colWidth / 2, curY + 40, colWidth - 40);

            // Divider
            this.ctx.strokeStyle = '#222';
            this.ctx.beginPath();
            this.ctx.moveTo(curX + 20, curY + 80);
            this.ctx.lineTo(curX + colWidth - 20, curY + 80);
            this.ctx.stroke();

            // Cell Text (wrapped)
            const words = (cell.text || '').split(' ');
            let tLine = '';
            let tY = curY + 120;
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
     * Draw CodeBlock (Syntax Highlighted Code Editor)
     */
    drawCodeBlock(layer) {
        let { x = 60, y = 800, width = 960, height, code = '', language = 'python', title = '' } = layer;

        const maxLines = Math.max(10, Math.min(30, code.split('\n').length));
        height = height || Math.max(250, 60 + (maxLines * 30));

        // Draw MacOS style window background
        this.ctx.fillStyle = '#1e1e1e'; // VS Code Dark
        this.effectsEngine.roundRect(x, y, width, height, 12, { blur: 20, color: 'rgba(0,0,0,0.5)', offsetY: 10 });

        // Header Bar
        this.ctx.fillStyle = '#2d2d2d';
        this.effectsEngine.roundRect(x, y, width, 45, [12, 12, 0, 0]);
        this.ctx.fill();

        // Mac Buttons
        const btnColors = ['#ff5f56', '#ffbd2e', '#27c93f'];
        for (let i = 0; i < 3; i++) {
            this.ctx.fillStyle = btnColors[i];
            this.ctx.beginPath();
            this.ctx.arc(x + 25 + (i * 25), y + 22, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Title/Filename
        if (title || language) {
            this.ctx.font = '500 20px "Inter"';
            this.ctx.fillStyle = '#888888';
            this.ctx.textAlign = 'center';
            this.ctx.fillText((title || language).toLowerCase(), x + width / 2, y + 28);
            this.ctx.textAlign = 'left';
        }

        // Simple Regex Syntax Highlighter
        const lines = code.split('\n');
        this.ctx.font = '500 24px "JetBrains Mono", monospace';
        let currentY = y + 80;

        lines.forEach((line, i) => {
            if (i >= maxLines) return; // Prevent overflow

            // Line Number
            this.ctx.fillStyle = '#555555';
            this.ctx.fillText(String(i + 1).padStart(2, ' '), x + 20, currentY);

            // Very basic syntax highlighting simulation
            let curX = x + 70;
            const words = line.split(/(\s+|[().,{}="'])/g);

            words.forEach(word => {
                if (!word) return;
                let color = '#d4d4d4'; // default text

                if (word.match(/^(def|class|if|else|elif|return|import|from|const|let|var|function|export)$/)) color = '#c586c0'; // keyword
                else if (word.match(/^(True|False|None|null|undefined)$/)) color = '#569cd6'; // boolean
                else if (word.match(/^[0-9]+$/)) color = '#b5cea8'; // number
                else if (word.match(/^['"].*['"]$/)) color = '#ce9178'; // string block (rough)
                else if (word.startsWith('#') || word.startsWith('//')) color = '#6a9955'; // comment (rough)

                this.ctx.fillStyle = color;
                this.ctx.fillText(word, curX, currentY);
                curX += this.ctx.measureText(word).width;
            });

            currentY += 30;
        });

        return y + height;
    }

    /**
     * Draw Hexdump (Matrix/Mr Robot style machine code visualization)
     */
    drawHexdump(layer) {
        const { x = 60, y = 600, width = 960, height = 400, color = this._getThemeColor('primary'), lines = 10 } = layer;

        this.ctx.save();
        this.ctx.font = '600 22px "JetBrains Mono"';
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.6; // Keep it as a semi-transparent background widget

        let startAddr = 0x00401000;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+.,/;[]";

        for (let i = 0; i < lines; i++) {
            const cy = y + (i * 35);

            // Draw Address
            const addr = '0x' + startAddr.toString(16).toUpperCase().padStart(8, '0');
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillText(addr, x, cy);

            // Draw Hex Pairs
            this.ctx.globalAlpha = 0.5;
            let hexStr = '';
            let asciiStr = '';
            for (let j = 0; j < 16; j++) {
                const val = Math.floor(Math.random() * 255);
                hexStr += val.toString(16).padStart(2, '0').toUpperCase() + ' ';
                asciiStr += chars.charAt(Math.floor(Math.random() * chars.length));
                if (j === 7) hexStr += ' '; // middle gap
            }

            this.ctx.fillText(hexStr, x + 150, cy);

            // Draw ASCII dump
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillText(asciiStr, x + 650, cy);

            startAddr += 16;
        }

        this.ctx.restore();
        return y + (lines * 35);
    }

    /**
     * Draw Timeline (Roadmap/Chronological states)
     */
    drawTimeline(layer) {
        const { x = 60, y = 500, width = 960, events = [], color = this._getThemeColor('primary') } = layer;

        this.ctx.save();
        const startY = y;
        let currentY = startY;
        const nodeX = x + 150; // X position of the timeline line

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 4;

        events.forEach((ev, i) => {
            // Draw Node Circle
            this.ctx.fillStyle = '#0a0a0c';
            this.ctx.beginPath();
            this.ctx.arc(nodeX, currentY + 30, 16, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            // Draw Node Inner
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(nodeX, currentY + 30, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Line to next node
            if (i < events.length - 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(nodeX, currentY + 46);
                this.ctx.lineTo(nodeX, currentY + 140); // Base step height
                this.ctx.stroke();
            }

            // Date / Label (Left side)
            if (ev.date) {
                this.ctx.font = '700 24px "MPLUS Code Latin"';
                this.ctx.fillStyle = color;
                this.ctx.textAlign = 'right';
                this.ctx.fillText(ev.date, nodeX - 40, currentY + 38);
            }

            // Title (Right side)
            if (ev.title) {
                this.ctx.font = '800 32px "BlackOpsOne"';
                this.ctx.fillStyle = '#ffffff';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(ev.title, nodeX + 40, currentY + 38);
            }

            // Description (Right side)
            if (ev.desc) {
                this.ctx.font = '500 24px "MPLUS Code Latin"';
                this.ctx.fillStyle = '#999999';
                const lines = this._wrapLine(this.ctx, ev.desc, width - Math.max((nodeX - x) - 40, 0) - 100);
                lines.forEach((l, li) => {
                    this.ctx.fillText(l, nodeX + 40, currentY + 75 + (li * 32));
                });
                currentY += (lines.length * 32) + 20; // add line height
            } else {
                currentY += 40;
            }

            currentY += 80; // step gap
        });

        this.ctx.restore();
        return currentY;
    }

    /**
     * Draw VS Table (Comparisons)
     */
    drawVsTable(layer) {
        let { x = 60, y = 500, width = 960, leftTitle = 'A', rightTitle = 'B', rows = [],
            leftColor = '#00D9FF', rightColor = '#FF3366' } = layer;

        this.ctx.save();
        let curY = y;
        const halfW = width / 2;

        // Draw Headers
        this.ctx.font = '900 42px "BlackOpsOne"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Left Header
        this.ctx.fillStyle = leftColor;
        this.ctx.fillText(leftTitle, x + (halfW / 2), curY + 40);

        // Right Header
        this.ctx.fillStyle = rightColor;
        this.ctx.fillText(rightTitle, x + halfW + (halfW / 2), curY + 40);

        // VS Badge
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '900 28px "BlackOpsOne"';
        this.effectsEngine.roundRect(x + halfW - 35, curY + 5, 70, 70, 35);
        this.ctx.fill();
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('VS', x + halfW, curY + 44);

        curY += 120;

        // Configure text rendering
        const fontSize = 28;
        const lineHeight = fontSize + 8;
        this.ctx.font = `600 ${fontSize}px "MPLUS Code Latin"`;

        rows.forEach(row => {
            // Process lines
            const padX = 70; // padding inside column
            const maxTextW = halfW - padX;

            const leftLines = this._wrapLine(this.ctx, row.left || '', maxTextW);
            const rightLines = this._wrapLine(this.ctx, row.right || '', maxTextW);

            const maxLines = Math.max(leftLines.length, rightLines.length);
            const h = Math.max(90, (maxLines * lineHeight) + 60); // Dynamic height + padding

            // Alternating Row Backgrounds
            this.ctx.fillStyle = 'rgba(255,255,255,0.03)';
            this.ctx.fillRect(x, curY, width, h);

            // Center Divider
            this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + halfW, curY + 15);
            this.ctx.lineTo(x + halfW, curY + h - 15);
            this.ctx.stroke();

            // Right Accent Divider (Vulnerable vs Patched feel)
            this.ctx.fillStyle = rightColor;
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillRect(x + halfW, curY, 3, h);
            this.ctx.globalAlpha = 1.0;

            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Function to render text block vertically centered
            const renderTextBlock = (lines, positive, baseX, baseY, boxH, iconPrefix) => {
                const totalTextH = lines.length * lineHeight;
                let startY = baseY + (boxH - totalTextH) / 2 + (lineHeight / 2);

                lines.forEach((line, i) => {
                    // Only add icon to the first line
                    const textToDraw = (i === 0 && positive) ? (iconPrefix + line) : line;
                    this.ctx.fillStyle = positive ? '#00FF88' : '#e0e0e0';
                    this.ctx.fillText(textToDraw, baseX, startY);
                    startY += lineHeight;
                });
            };

            // Left Column
            const leftIcon = row.leftPositive ? '✅ ' : '❌ ';
            renderTextBlock(leftLines, row.leftPositive, x + (halfW / 2), curY, h, leftIcon);

            // Right Column
            const rightIcon = row.rightPositive ? '✅ ' : '❌ ';
            renderTextBlock(rightLines, row.rightPositive, x + halfW + (halfW / 2), curY, h, rightIcon);

            curY += h + 10; // Gap between rows
        });

        this.ctx.restore();
        return curY;
    }

    /**
     * Draw Radar Chart (Stats/Skills Polygon)
     */
    drawRadarChart(layer) {
        const { x = 60, y = 500, width = 960, height = 500, color = this._getThemeColor('primary'), stats = [] } = layer;

        if (!stats || stats.length < 3) return y + 100; // Need at least 3 points for a radar

        this.ctx.save();
        const cx = x + width / 2;
        const cy = y + height / 2;
        const radius = Math.min(width, height) / 2 - 80;

        // Draw web rings
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        const levels = 5;

        for (let l = 1; l <= levels; l++) {
            const r = (radius / levels) * l;
            this.ctx.beginPath();
            for (let i = 0; i < stats.length; i++) {
                const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
                const px = cx + Math.cos(angle) * r;
                const py = cy + Math.sin(angle) * r;
                if (i === 0) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.closePath();
            this.ctx.stroke();
        }

        // Draw spokes
        this.ctx.beginPath();
        for (let i = 0; i < stats.length; i++) {
            const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
        }
        this.ctx.stroke();

        // Draw Data Polygon
        this.ctx.beginPath();
        for (let i = 0; i < stats.length; i++) {
            const val = Math.max(0, Math.min(10, stats[i].value || 5)); // normalized to 0-10
            const norm = val / 10;
            const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
            const px = cx + Math.cos(angle) * (radius * norm);
            const py = cy + Math.sin(angle) * (radius * norm);
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();

        // Fill Data
        const cRgb = this._hexToRgb(color);
        this.ctx.fillStyle = `rgba(${cRgb}, 0.3)`;
        this.ctx.fill();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();

        // Draw Labels
        this.ctx.font = '700 24px "BlackOpsOne"';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let i = 0; i < stats.length; i++) {
            const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
            const px = cx + Math.cos(angle) * (radius + 40); // Offset for text
            const py = cy + Math.sin(angle) * (radius + 40);

            // Adjust alignment based on position to prevent overlap
            if (px < cx - 20) this.ctx.textAlign = 'right';
            else if (px > cx + 20) this.ctx.textAlign = 'left';
            else this.ctx.textAlign = 'center';

            this.ctx.fillText((stats[i].label || '').toUpperCase(), px, py);

            // Draw Value
            this.ctx.font = '600 20px "MPLUS Code Latin"';
            this.ctx.fillStyle = color;
            this.ctx.fillText(`${stats[i].value}/10`, px, py + 25);
            this.ctx.font = '700 24px "BlackOpsOne"'; // reset
            this.ctx.fillStyle = '#ffffff';
        }

        this.ctx.restore();
        return y + height;
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

        // Convert hex themeColor to rgba
        const hexToRgba = (hex, alpha) => {
            let r = 0, g = 0, b = 0;
            if (hex.length === 4) {
                r = parseInt(hex[1] + hex[1], 16);
                g = parseInt(hex[2] + hex[2], 16);
                b = parseInt(hex[3] + hex[3], 16);
            } else if (hex.length === 7) {
                r = parseInt(hex.substring(1, 3), 16);
                g = parseInt(hex.substring(3, 5), 16);
                b = parseInt(hex.substring(5, 7), 16);
            }
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        this.ctx.save();
        this.ctx.translate(x, y);

        // --- Root Header (Neumorphic Glass) ---
        // Dark Base
        this.ctx.fillStyle = '#0f1115';
        this.effectsEngine.roundRect(0, 0, w, 66, 12);
        this.ctx.fill();

        // Overlay with translucent theme color
        this.ctx.fillStyle = hexToRgba(themeColor, 0.15);
        this.ctx.fill();

        // Glowing top/bottom border
        this.ctx.strokeStyle = hexToRgba(themeColor, 0.4);
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // Root Folder Icon (Centered in Y=33)
        this._renderSmartIcon(this.ctx, 'folder', 34, 33, 30, themeColor);

        // Root Text (Aligned properly with icon)
        this.ctx.font = '800 32px "MPLUS Code Latin"';
        this.ctx.fillStyle = themeColor;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(root, 65, 35);

        // Reset TextBaseline for children
        this.ctx.textBaseline = 'top';

        // --- Tree Items ---
        let curY = 96;
        const indentX = 45;

        items.forEach((item, index) => {
            const isLast = index === items.length - 1;
            const depth = item.depth || 1;
            const isFolder = item.isDir;
            const icon = isFolder ? 'folder' : 'description';

            const iconColor = isFolder ? themeColor : '#aaaaaa';
            const titleColor = isFolder ? '#ffffff' : '#d1d5db';
            const fontWeight = isFolder ? '700' : '500';

            const px = depth * indentX;

            // Draw Connection Line (Refined shape and color)
            this.ctx.strokeStyle = hexToRgba(themeColor, 0.35); // Soft guides matching theme
            this.ctx.lineWidth = 2.5;
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();

            // Vertical line piece
            if (isLast) {
                this.ctx.moveTo(px - 18, curY - 30);
                this.ctx.lineTo(px - 18, curY);
                this.ctx.lineTo(px + 10, curY);
            } else {
                this.ctx.moveTo(px - 18, curY - 30);
                this.ctx.lineTo(px - 18, curY + 45); // continue down
                this.ctx.moveTo(px - 18, curY);
                this.ctx.lineTo(px + 10, curY);
            }
            this.ctx.stroke();

            // Item Icon
            this._renderSmartIcon(this.ctx, icon, px + 30, curY, 26, iconColor);

            // Item Name
            this.ctx.font = `${fontWeight} 28px "MPLUS Code Latin"`;
            this.ctx.fillStyle = titleColor;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(item.path || '', px + 58, curY + 2);

            // Item Description
            if (item.desc) {
                this.ctx.font = 'italic 400 24px "MPLUS Code Latin"';
                this.ctx.fillStyle = '#6b7280';
                const pathWidth = this.ctx.measureText(item.path || '').width;
                this.ctx.fillText('// ' + item.desc, px + 58 + pathWidth + 20, curY + 2);
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
