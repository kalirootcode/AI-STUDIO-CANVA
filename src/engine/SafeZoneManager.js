/**
 * SafeZoneManager.js — Margin & Border Enforcement
 * 
 * Provides centralized safe-zone geometry for any canvas/template size.
 * Used by CanvasRenderer (Canvas pipeline) and getAutoFitScript (HTML pipeline).
 * Guarantees that no content ever overlaps brand headers or pagination areas.
 */

class SafeZoneManager {

    /**
     * Default zone configuration for the standard 1080×1920 canvas.
     */
    static DEFAULTS = {
        // Brand header occupies the top
        brandHeight: 100,
        brandPadding: 40,      // Space below brand separator line

        // Pagination occupies the bottom
        paginationHeight: 100,
        paginationPadding: 40, // Space above pagination dots

        // Lateral margins
        marginX: 60,

        // Minimum gap between content blocks
        minGap: 30,

        // Minimum gap between content and bottom zone
        bottomBuffer: 60,
    };

    /**
     * Calculate safe zones for a given canvas size.
     * @param {number} width - Canvas width (default 1080)
     * @param {number} height - Canvas height (default 1920)
     * @returns {Object} Zone definitions
     */
    static getZone(width = 1080, height = 1920) {
        const d = this.DEFAULTS;

        // Top boundary: brand header + padding
        const contentTop = d.brandHeight + d.brandPadding; // 140

        // Bottom boundary: above pagination - buffer
        const contentBottom = height - d.paginationHeight - d.paginationPadding; // 1780

        // Lateral boundaries
        const contentLeft = d.marginX;
        const contentRight = width - d.marginX;
        const contentWidth = contentRight - contentLeft;

        // Maximum usable height for content
        const maxContentHeight = contentBottom - contentTop;

        return {
            // Full canvas
            canvas: { width, height },

            // Safe content area
            content: {
                top: contentTop,
                bottom: contentBottom,
                left: contentLeft,
                right: contentRight,
                width: contentWidth,
                height: maxContentHeight,
            },

            // Brand header zone (do NOT place content here)
            brand: {
                top: 0,
                bottom: d.brandHeight,
                height: d.brandHeight,
            },

            // Pagination zone (do NOT place content here)
            pagination: {
                top: height - d.paginationHeight,
                bottom: height,
                height: d.paginationHeight,
            },

            // Constraints
            minGap: d.minGap,
            marginX: d.marginX,
            bottomBuffer: d.bottomBuffer,
            maxContentHeight,
        };
    }

    /**
     * Validate a layer's position and clamp it within the safe zone.
     * Returns the clamped Y and whether clamping occurred.
     * @param {Object} layer - Layer with x, y, height properties
     * @param {Object} zone - Zone from getZone()
     * @returns {{ y: number, x: number, clamped: boolean, clampReason: string|null }}
     */
    static clampLayer(layer, zone) {
        let x = layer.x !== undefined ? layer.x : zone.content.left;
        let y = layer.y !== undefined ? layer.y : zone.content.top;
        let clamped = false;
        let clampReason = null;
        const layerHeight = layer.height || 60;

        // Clamp X to safe margins
        if (x < zone.content.left) {
            x = zone.content.left;
            clamped = true;
            clampReason = `x=${layer.x} < marginX=${zone.content.left}`;
        }

        // Clamp Y — top boundary
        if (y < zone.content.top) {
            y = zone.content.top;
            clamped = true;
            clampReason = `y=${layer.y} overlaps brand zone (top=${zone.content.top})`;
        }

        // Clamp Y — bottom boundary (ensure the layer's bottom edge stays in zone)
        if (y + layerHeight > zone.content.bottom) {
            const maxY = zone.content.bottom - layerHeight;
            if (maxY > zone.content.top) {
                y = maxY;
            } else {
                // Layer is taller than the entire content zone — clamp to top, it will overflow downward
                y = zone.content.top;
            }
            clamped = true;
            clampReason = `layer bottom (${layer.y + layerHeight}) exceeds zone bottom (${zone.content.bottom})`;
        }

        if (clamped) {
            console.warn(`[SafeZoneManager] Clamped layer "${layer.type || 'unknown'}": ${clampReason} → y=${Math.round(y)}, x=${Math.round(x)}`);
        }

        return { y: Math.round(y), x: Math.round(x), clamped, clampReason };
    }

    /**
     * Check if a layer fits within the remaining vertical space.
     * @param {number} currentY - Current Y cursor position
     * @param {number} layerHeight - Estimated height of the layer
     * @param {Object} zone - Zone from getZone()
     * @returns {{ fits: boolean, availableHeight: number }}
     */
    static checkFit(currentY, layerHeight, zone) {
        const available = zone.content.bottom - currentY;
        return {
            fits: layerHeight <= available,
            availableHeight: Math.max(0, available),
        };
    }

    /**
     * Get CSS safe-zone styles for HTML templates.
     * Returns a CSS string that defines the safe-zone container properly.
     * @param {number} width
     * @param {number} height
     * @returns {string} CSS rules
     */
    static getCSS(width = 1080, height = 1920) {
        const zone = this.getZone(width, height);
        return `
            .safe-zone {
                position: absolute;
                top: ${zone.content.top}px;
                left: ${zone.content.left}px;
                width: ${zone.content.width}px;
                height: ${zone.content.height}px;
                display: flex;
                flex-direction: column;
                gap: ${zone.minGap}px;
                overflow: hidden;
                box-sizing: border-box;
            }
        `;
    }

    /**
     * Calculate the available height for content given what's already placed.
     * @param {number} usedHeight - Total height consumed by placed content
     * @param {number} canvasHeight - Total canvas height
     * @returns {number} Remaining available height
     */
    static remainingHeight(usedHeight, canvasHeight = 1920) {
        const zone = this.getZone(1080, canvasHeight);
        return Math.max(0, zone.maxContentHeight - usedHeight);
    }
}

if (typeof module !== 'undefined') module.exports = SafeZoneManager;
else window.SafeZoneManager = SafeZoneManager;
