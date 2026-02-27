/**
 * TextFitter.js — Hybrid Text Fitting Engine
 * 
 * 3-strategy intelligent text fitting system:
 * 1. Smart Truncation — cuts text at word boundaries with "…"
 * 2. Adaptive Font Scaling — reduces font-size within tier limits
 * 3. Line-height Compression — reduces lineHeight as last resort
 * 
 * Works with both Canvas (TextEngine) and HTML (getAutoFitScript) pipelines.
 */

class TextFitter {

    /**
     * Truncate text to a maximum number of characters, respecting word boundaries.
     * Adds "…" if truncated.
     * @param {string} text - Original text
     * @param {number} maxChars - Maximum character count
     * @returns {{ text: string, wasTruncated: boolean }}
     */
    static truncateByChars(text, maxChars) {
        if (!text || text.length <= maxChars) {
            return { text: text || '', wasTruncated: false };
        }

        // Find the last space before the maxChars boundary
        let cutoff = maxChars - 1; // Leave room for "…"
        while (cutoff > 0 && text[cutoff] !== ' ') {
            cutoff--;
        }

        // If no space found, just hard-cut
        if (cutoff <= 0) cutoff = maxChars - 1;

        const truncated = text.substring(0, cutoff).replace(/[\s,;:.]+$/, '') + '…';
        return { text: truncated, wasTruncated: true };
    }

    /**
     * Truncate text to a maximum number of words.
     * Adds "…" if truncated.
     * @param {string} text - Original text
     * @param {number} maxWords - Maximum word count
     * @returns {{ text: string, wasTruncated: boolean }}
     */
    static truncateByWords(text, maxWords) {
        if (!text) return { text: '', wasTruncated: false };

        const words = text.split(/\s+/);
        if (words.length <= maxWords) {
            return { text, wasTruncated: false };
        }

        const truncated = words.slice(0, maxWords).join(' ').replace(/[\s,;:.]+$/, '') + '…';
        return { text: truncated, wasTruncated: true };
    }

    /**
     * Smart truncation: applies both word and char limits, taking the shorter result.
     * @param {string} text
     * @param {{ maxChars: number, maxWords: number }} constraints
     * @returns {{ text: string, wasTruncated: boolean }}
     */
    static smartTruncate(text, constraints) {
        if (!text) return { text: '', wasTruncated: false };
        if (!constraints) return { text, wasTruncated: false };

        const { maxChars = Infinity, maxWords = Infinity } = constraints;

        // Apply word limit first (usually more impactful)
        let result = this.truncateByWords(text, maxWords);

        // Then apply char limit on top
        if (result.text.length > maxChars) {
            const charResult = this.truncateByChars(result.text, maxChars);
            result = { text: charResult.text, wasTruncated: true };
        }

        return result;
    }

    /**
     * Calculate the optimal font size for text to fit within given line constraints.
     * Uses binary-search-like approach with a Canvas 2D context for measurement.
     * 
     * @param {string} text - The text to fit
     * @param {Object} options
     * @param {CanvasRenderingContext2D} options.ctx - Canvas context for measurement
     * @param {number} options.maxWidth - Available width in pixels
     * @param {number} options.maxLines - Maximum number of lines allowed
     * @param {number} options.defaultFontSize - Starting font size
     * @param {number} options.minFontSize - Minimum allowed font size
     * @param {string} options.fontFamily - Font family to use
     * @param {number} options.fontWeight - Font weight
     * @param {number} options.lineHeight - Line height multiplier
     * @returns {{ fontSize: number, lineHeight: number, lines: number, scaled: boolean }}
     */
    static adaptiveFontScale(text, options) {
        const {
            ctx,
            maxWidth = 960,
            maxLines = Infinity,
            defaultFontSize = 42,
            minFontSize = 28,
            fontFamily = 'Inter',
            fontWeight = 400,
            lineHeight = 1.5,
        } = options;

        if (!ctx || !text) {
            return { fontSize: defaultFontSize, lineHeight, lines: 1, scaled: false };
        }

        let currentSize = defaultFontSize;
        let currentLineHeight = lineHeight;
        let linesNeeded = Infinity;

        // Phase 1: Scale font size down until text fits within maxLines
        while (currentSize > minFontSize && linesNeeded > maxLines) {
            ctx.font = `${fontWeight} ${currentSize}px "${fontFamily}"`;
            linesNeeded = this._countLines(ctx, text, maxWidth);

            if (linesNeeded <= maxLines) break;

            currentSize = Math.max(minFontSize, currentSize - 2);
        }

        // Phase 2: If still doesn't fit, compress line height
        if (linesNeeded > maxLines && currentLineHeight > 1.2) {
            while (currentLineHeight > 1.2 && linesNeeded > maxLines) {
                currentLineHeight = Math.max(1.2, currentLineHeight - 0.1);
                // Recount with the current font size (line count doesn't change with lineHeight,
                // but the total block height does — relevant for vertical fit)
                linesNeeded = this._countLines(ctx, text, maxWidth);
            }
        }

        return {
            fontSize: currentSize,
            lineHeight: Math.round(currentLineHeight * 10) / 10,
            lines: linesNeeded,
            scaled: currentSize < defaultFontSize || currentLineHeight < lineHeight,
        };
    }

    /**
     * Full hybrid fit: combines truncation + font scaling.
     * This is the main entry point for the system.
     * 
     * @param {string} text - Original text
     * @param {Object} constraints - From LayoutConstraints.forField()
     * @param {CanvasRenderingContext2D|null} ctx - Canvas context (null for non-canvas)
     * @param {Object} fontOptions - Font options for scaling
     * @returns {{ fittedText: string, fontSize: number, lineHeight: number, lines: number, wasTruncated: boolean, wasScaled: boolean }}
     */
    static fitText(text, constraints, ctx = null, fontOptions = {}) {
        if (!text) {
            return { fittedText: '', fontSize: fontOptions.defaultFontSize || 42, lineHeight: 1.5, lines: 0, wasTruncated: false, wasScaled: false };
        }
        if (!constraints) {
            return { fittedText: text, fontSize: fontOptions.defaultFontSize || 42, lineHeight: 1.5, lines: 1, wasTruncated: false, wasScaled: false };
        }

        // Step 1: Smart truncation
        const truncResult = this.smartTruncate(text, constraints);
        let fittedText = truncResult.text;
        let wasTruncated = truncResult.wasTruncated;

        // Step 2: Adaptive font scaling (only if ctx available — Canvas pipeline)
        let fontSize = fontOptions.defaultFontSize || 42;
        let lineHeight = fontOptions.lineHeight || 1.5;
        let lines = 1;
        let wasScaled = false;

        if (ctx && constraints.maxLines) {
            const scaleResult = this.adaptiveFontScale(fittedText, {
                ctx,
                maxWidth: fontOptions.maxWidth || 960,
                maxLines: constraints.maxLines,
                defaultFontSize: fontSize,
                minFontSize: constraints.minFontSize || 28,
                fontFamily: fontOptions.fontFamily || 'Inter',
                fontWeight: fontOptions.fontWeight || 400,
                lineHeight,
            });

            fontSize = scaleResult.fontSize;
            lineHeight = scaleResult.lineHeight;
            lines = scaleResult.lines;
            wasScaled = scaleResult.scaled;

            // Step 3: If still overflows after scaling, hard-truncate to maxLines
            if (lines > constraints.maxLines) {
                fittedText = this._truncateToLines(ctx, fittedText, fontOptions.maxWidth || 960, constraints.maxLines);
                wasTruncated = true;
                lines = constraints.maxLines;
            }
        }

        if (wasTruncated) {
            console.log(`[TextFitter] Truncated: "${text.substring(0, 40)}…" → ${fittedText.length} chars`);
        }
        if (wasScaled) {
            console.log(`[TextFitter] Scaled: fontSize ${fontOptions.defaultFontSize || 42} → ${fontSize}, lineHeight → ${lineHeight}`);
        }

        return { fittedText, fontSize, lineHeight, lines, wasTruncated, wasScaled };
    }

    /**
     * Count how many lines a text occupies at the current font settings.
     * @private
     */
    static _countLines(ctx, text, maxWidth) {
        const words = text.split(/\s+/);
        let lines = 1;
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines++;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        return lines;
    }

    /**
     * Truncate text to fit within a given number of visual lines.
     * @private
     */
    static _truncateToLines(ctx, text, maxWidth, maxLines) {
        const words = text.split(/\s+/);
        let lines = 1;
        let currentLine = '';
        let lastGoodIndex = 0;

        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines++;
                if (lines > maxLines) {
                    // Take all words up to this point, add ellipsis
                    const result = words.slice(0, lastGoodIndex + 1).join(' ');
                    return result.replace(/[\s,;:.]+$/, '') + '…';
                }
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
            lastGoodIndex = i;
        }

        return text; // Fits as-is
    }

    /**
     * Utility: get word count of a string.
     * @param {string} text
     * @returns {number}
     */
    static wordCount(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).length;
    }

    /**
     * Utility: check if text exceeds constraints.
     * @param {string} text
     * @param {Object} constraints
     * @returns {{ exceedsChars: boolean, exceedsWords: boolean, charCount: number, wordCount: number }}
     */
    static check(text, constraints) {
        const charCount = (text || '').length;
        const words = this.wordCount(text);
        return {
            exceedsChars: charCount > (constraints.maxChars || Infinity),
            exceedsWords: words > (constraints.maxWords || Infinity),
            charCount,
            wordCount: words,
        };
    }
}

if (typeof module !== 'undefined') module.exports = TextFitter;
else window.TextFitter = TextFitter;
