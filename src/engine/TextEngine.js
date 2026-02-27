/**
 * TextEngine.js — Canvas Typography Renderer
 * 
 * Handles word-wrap, text justification, keyword highlighting,
 * and multi-line rendering for the Canvas Renderer.
 */

class TextEngine {
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * Measure text dimensions with current font settings.
     */
    measure(text) {
        const metrics = this.ctx.measureText(text);
        return {
            width: metrics.width,
            ascent: metrics.actualBoundingBoxAscent || 0,
            descent: metrics.actualBoundingBoxDescent || 0,
            height: (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0)
        };
    }

    /**
     * Set font on the canvas context.
     */
    setFont(fontDef) {
        const weight = fontDef.weight || 400;
        const size = fontDef.size || 42;
        const family = fontDef.family || 'Inter';
        this.ctx.font = `${weight} ${size}px "${family}"`;

        // Store explicitly to safely toggle bold later without parsing ctx.font
        this._currentFontDef = { weight, size, family };
        return size;
    }

    /**
     * Switch context font to bold or normal safely
     */
    _setBold(isBold) {
        if (!this._currentFontDef) return;
        const weight = isBold ? 700 : (this._currentFontDef.weight || 400);
        this.ctx.font = `${weight} ${this._currentFontDef.size}px "${this._currentFontDef.family}"`;
    }

    /**
     * Parses text and highlights into an array of styled tokens (words and spaces).
     * @returns Array of { text, color, bold, width, isSpace }
     */
    _tokenizeText(text, highlights, defaultColor) {
        // Split by whitespace but keep the whitespace as tokens
        // e.g. "Hello  world" -> ["Hello", "  ", "world"]
        const rawTokens = text.split(/(\s+)/).filter(t => t.length > 0);
        const tokens = [];

        for (const token of rawTokens) {
            const isSpace = /^\s+$/.test(token);
            let color = defaultColor;
            let bold = false;

            if (!isSpace) {
                // Check if this word matches any highlight
                for (const h of highlights) {
                    // Exact match or full word match, not substring (to avoid "De" matching "DECONSTRUYENDO")
                    if (h.text && token.toLowerCase() === h.text.toLowerCase()) {
                        color = h.color;
                        bold = h.bold || false;
                        break;
                    }
                }
            }

            // Measure token
            if (bold) this._setBold(true);
            const width = this.ctx.measureText(token).width;
            if (bold) this._setBold(false);

            tokens.push({ text: token, color, bold, width, isSpace });
        }

        return tokens;
    }

    /**
     * Word-wrap tokens into lines that fit within maxWidth.
     * @returns Array of lines: { tokens[], width, isLast }
     */
    _wrapTokens(tokens, maxWidth) {
        const lines = [];
        let currentLine = { tokens: [], width: 0 };

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // If it's a space and we are at the start of a line, skip it (no leading spaces)
            if (token.isSpace && currentLine.tokens.length === 0) continue;

            const newWidth = currentLine.width + token.width;

            if (newWidth <= maxWidth || currentLine.tokens.length === 0) {
                // Fits, or line is empty (must put at least one word)
                currentLine.tokens.push(token);
                currentLine.width = newWidth;
            } else {
                // Doesn't fit, push current line
                // Strip trailing spaces from the line we are pushing
                while (currentLine.tokens.length > 0 && currentLine.tokens[currentLine.tokens.length - 1].isSpace) {
                    const spaceToken = currentLine.tokens.pop();
                    currentLine.width -= spaceToken.width;
                }

                lines.push(currentLine);

                // Start new line
                if (token.isSpace) {
                    // Skip leading space on new line
                    currentLine = { tokens: [], width: 0 };
                } else {
                    currentLine = { tokens: [token], width: token.width };
                }
            }
        }

        if (currentLine.tokens.length > 0) {
            // Strip trailing spaces
            while (currentLine.tokens.length > 0 && currentLine.tokens[currentLine.tokens.length - 1].isSpace) {
                const spaceToken = currentLine.tokens.pop();
                currentLine.width -= spaceToken.width;
            }
            currentLine.isLast = true;
            lines.push(currentLine);
        }

        return lines;
    }

    /**
     * Render a single line of styled tokens.
     * Highlighted tokens automatically receive a color glow.
     */
    _renderTokenLine(line, x, y, maxWidth, align) {
        let offsetX = x;
        let extraSpacePerGap = 0;

        // Calculate justification spacing
        if (align === 'justify' && !line.isLast) {
            let spaceCount = 0;
            for (const t of line.tokens) if (t.isSpace) spaceCount++;

            if (spaceCount > 0) {
                const remainingSpace = Math.max(0, maxWidth - line.width);
                extraSpacePerGap = remainingSpace / spaceCount;
            }
        } else if (align === 'center') {
            offsetX = x + (maxWidth - line.width) / 2;
        } else if (align === 'right') {
            offsetX = x + (maxWidth - line.width);
        }

        // Draw tokens
        for (const token of line.tokens) {
            if (token.isSpace) {
                offsetX += token.width + extraSpacePerGap;
                continue;
            }

            if (token.bold) this._setBold(true);

            // Flat color only — no glow or shadow effects
            this.ctx.fillStyle = token.color;
            this.ctx.fillText(token.text, offsetX, y);

            offsetX += token.width;
            if (token.bold) this._setBold(false);
        }
    }

    /**
     * Stroke-only render for creating text outlines (used for title fonts).
     */
    _strokeTokenLine(line, x, y, maxWidth, align) {
        let offsetX = x;
        if (align === 'center') offsetX = x + (maxWidth - line.width) / 2;
        else if (align === 'right') offsetX = x + (maxWidth - line.width);

        for (const token of line.tokens) {
            if (token.isSpace) { offsetX += token.width; continue; }
            this.ctx.strokeText(token.text, offsetX, y);
            offsetX += token.width;
        }
    }

    /**
     * Auto-detect 1-2 important keywords in title text and return highlights.
     * Keywords are the longest or most significant words.
     */
    _autoHighlightKeywords(text, fontSize) {
        if (!text || text.length < 3) return [];

        // Get theme color from the renderer
        let themeColor = '#00D9FF';
        if (this.ctx && this.ctx.canvas && this.ctx.canvas._renderer) {
            const renderer = this.ctx.canvas._renderer;
            if (renderer._getThemeColor) {
                themeColor = renderer._getThemeColor('primary');
            }
        }

        // Split into words, find meaningful words (4+ chars)
        const words = text.split(/\s+/).filter(w => w.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '').length >= 4);
        if (words.length === 0) return [];

        // Sort by length descending, pick top 1-2
        const sorted = [...words].sort((a, b) => b.length - a.length);
        const numKeywords = fontSize >= 64 ? 2 : 1;
        const keywords = sorted.slice(0, Math.min(numKeywords, sorted.length));

        return keywords.map(kw => {
            const clean = kw.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '');
            return { text: clean, color: themeColor };
        });
    }

    /**
     * Compute the total height of a text block without rendering it.
     */
    measureTextBlockHeight(layer) {
        const {
            content, width, font = {}, lineHeight = 1.6, highlights = [], color = '#f0f0f0' // Matched default lineHeight
        } = layer;

        const fontSize = this.setFont(font);
        const lineGap = fontSize * lineHeight;
        const maxWidth = width || 960;

        const tokens = this._tokenizeText(content, highlights, color);
        const lines = this._wrapTokens(tokens, maxWidth);

        return lines.length * lineGap;
    }

    /**
     * Full text block renderer — the main entry point.
     * Handles wrapping, justification, highlights, and multi-paragraph text.
     * Now integrates TextFitter for smart truncation and adaptive font scaling.
     */
    renderTextBlock(layer) {
        let {
            content, x, y, width,
            font = {},
            color = '#f0f0f0',
            align = 'left',
            lineHeight = 1.5,
            letterSpacing = 0,
            highlights = [],
            maxLines = Infinity,
            effects = [],
            _constraints = null   // Optional: LayoutConstraints for this field
        } = layer;

        // --- TextFitter Integration ---
        const TextFitter = (typeof window !== 'undefined' && window.TextFitter) ? window.TextFitter : null;

        if (TextFitter && content && _constraints) {
            const fitResult = TextFitter.fitText(content, _constraints, this.ctx, {
                maxWidth: width || 960,
                maxLines: _constraints.maxLines || maxLines,
                defaultFontSize: font.size || 42,
                minFontSize: _constraints.minFontSize || 28,
                fontFamily: font.family || 'Inter',
                fontWeight: font.weight || 400,
                lineHeight: lineHeight,
            });

            content = fitResult.fittedText;
            if (fitResult.wasScaled) {
                font = { ...font, size: fitResult.fontSize };
                lineHeight = fitResult.lineHeight;
            }
        }

        const fontSize = this.setFont(font);
        const lineGap = fontSize * lineHeight;
        const maxWidth = width || 960;
        const isTitleFont = (font.family || '').toLowerCase().includes('newcomictitle');

        // Auto letterSpacing for premium fonts
        const effectiveLetterSpacing = letterSpacing || (isTitleFont ? 1.5 : 0);
        if (effectiveLetterSpacing > 0) {
            this.ctx.letterSpacing = `${effectiveLetterSpacing}px`;
        }
        this._applyTextEffects(effects);

        // Auto-highlight keywords in titles if no highlights specified
        let effectiveHighlights = highlights || [];
        if (effectiveHighlights.length === 0 && content && content.length > 5) {
            effectiveHighlights = this._autoHighlightKeywords(content, font.size || 36);
        }

        // 1. Tokenize the entire content
        const tokens = this._tokenizeText(content, effectiveHighlights, color);

        // 2. Wrap tokens into lines
        const lines = this._wrapTokens(tokens, maxWidth);

        // 3. Render each line
        let currentY = y;
        let linesRendered = 0;

        // Canvas boundary — stop rendering text that would be invisible
        const canvasHeight = this.ctx.canvas ? this.ctx.canvas.height : Infinity;
        const bottomLimit = canvasHeight === 1920 ? 1710 : (canvasHeight - 60); // Tighter bottom limit

        for (const line of lines) {
            if (linesRendered >= maxLines) break;

            // Check if next line would exceed canvas bounds
            if (currentY > bottomLimit) {
                if (linesRendered > 0) {
                    this.ctx.fillStyle = color || '#94a3b8';
                    this.ctx.fillText('...', x, currentY - lineGap + fontSize);
                }
                console.warn(`[TextEngine] Text truncated at y=${Math.round(currentY)} (canvas bottom: ${canvasHeight})`);
                break;
            }

            // For title fonts: draw dark outline for contrast before fill
            if (isTitleFont) {
                this.ctx.save();
                this.ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                this.ctx.lineWidth = 6;
                this.ctx.lineJoin = 'round';
                this._strokeTokenLine(line, x, currentY, maxWidth, align);
                this.ctx.restore();
            }

            this._renderTokenLine(line, x, currentY, maxWidth, align);
            currentY += lineGap;
            linesRendered++;
        }

        this._resetEffects();
        if (effectiveLetterSpacing > 0) {
            this.ctx.letterSpacing = '0px';
        }

        return currentY;
    }

    /**
     * Apply glow/shadow effects from layer effects array.
     */
    _applyTextEffects(effects) {
        // All text effects disabled — clean flat rendering only
        return;
    }

    /**
     * Reset shadow/glow effects.
     */
    _resetEffects() {
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
}

if (typeof module !== 'undefined') module.exports = TextEngine;
else window.TextEngine = TextEngine;
