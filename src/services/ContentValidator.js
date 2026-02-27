/**
 * ContentValidator.js — Pre-render AI Content Validator
 * 
 * Validates and sanitizes AI-generated JSON content before it reaches
 * the rendering pipeline. Enforces LayoutConstraints on every field,
 * truncates overflows, and logs warnings for debugging.
 * 
 * Sits between the AI response and the TemplateEngine/CanvasRenderer.
 */

class ContentValidator {

    /**
     * Validate and sanitize an array of carousel slides.
     * Each slide has { templateId, content: { FIELD: value, ... } }
     * 
     * @param {Array} slides - Array of slide objects from AI
     * @returns {{ valid: boolean, slides: Array, warnings: string[] }}
     */
    static validate(slides) {
        if (!Array.isArray(slides)) {
            console.warn('[ContentValidator] Input is not an array, wrapping.');
            slides = [slides];
        }

        const warnings = [];
        const sanitizedSlides = slides.map((slide, idx) => {
            return this.validateSlide(slide, idx, warnings);
        });

        if (warnings.length > 0) {
            console.log(`[ContentValidator] ${warnings.length} warning(s):`);
            warnings.forEach(w => console.warn(`  ⚠ ${w}`));
        }

        return {
            valid: warnings.length === 0,
            slides: sanitizedSlides,
            warnings,
        };
    }

    /**
     * Validate a single slide's content fields.
     * @param {Object} slide - { templateId, content: { ... } }
     * @param {number} slideIndex - For logging
     * @param {string[]} warnings - Warnings array to push to
     * @returns {Object} Sanitized slide
     */
    static validateSlide(slide, slideIndex, warnings) {
        if (!slide || !slide.content) {
            warnings.push(`Slide ${slideIndex + 1}: No content found.`);
            return slide;
        }

        const templateId = slide.templateId || 'unknown';
        const content = { ...slide.content };

        // Get constraints for this template
        const LayoutConstraints = this._getLayoutConstraints();
        if (!LayoutConstraints) {
            return slide; // Module not available, skip validation
        }
        const TextFitter = this._getTextFitter();

        // Iterate all content fields
        for (const [field, value] of Object.entries(content)) {
            if (typeof value === 'string') {
                // Validate string fields
                content[field] = this._validateStringField(
                    value, field, templateId, slideIndex, warnings, LayoutConstraints, TextFitter
                );
            } else if (Array.isArray(value)) {
                // Validate array fields (COMPONENTS, KEY_FLAGS, etc.)
                content[field] = this._validateArrayField(
                    value, field, templateId, slideIndex, warnings, LayoutConstraints, TextFitter
                );
            }
            // Skip non-string/non-array fields (numbers, booleans, etc.)
        }

        return { ...slide, content };
    }

    /**
     * Validate and truncate a string field.
     * @private
     */
    static _validateStringField(value, fieldName, templateId, slideIndex, warnings, LayoutConstraints, TextFitter) {
        const constraints = LayoutConstraints.forField(templateId, fieldName);

        // Strip common AI artifacts
        let cleaned = this._cleanText(value);

        // Check and truncate
        if (TextFitter) {
            const result = TextFitter.smartTruncate(cleaned, constraints);
            if (result.wasTruncated) {
                warnings.push(`Slide ${slideIndex + 1} [${templateId}]: ${fieldName} truncated from ${cleaned.length} to ${result.text.length} chars (limit: ${constraints.maxChars} chars / ${constraints.maxWords} words)`);
            }
            return result.text;
        }

        // Fallback: simple char truncation if TextFitter not available
        if (cleaned.length > constraints.maxChars) {
            const truncated = cleaned.substring(0, constraints.maxChars - 1).trim() + '…';
            warnings.push(`Slide ${slideIndex + 1} [${templateId}]: ${fieldName} truncated from ${cleaned.length} to ${constraints.maxChars} chars`);
            return truncated;
        }

        return cleaned;
    }

    /**
     * Validate array fields — iterate each item and validate sub-fields.
     * @private
     */
    static _validateArrayField(arrayValue, fieldName, templateId, slideIndex, warnings, LayoutConstraints, TextFitter) {
        return arrayValue.map((item, itemIdx) => {
            if (typeof item === 'string') {
                // Simple string arrays (e.g., bulletlist items)
                const constraints = LayoutConstraints.forField(templateId, 'TEXT');
                const cleaned = this._cleanText(item);
                if (TextFitter) {
                    const result = TextFitter.smartTruncate(cleaned, constraints);
                    if (result.wasTruncated) {
                        warnings.push(`Slide ${slideIndex + 1} [${templateId}]: ${fieldName}[${itemIdx}] truncated`);
                    }
                    return result.text;
                }
                return cleaned.substring(0, constraints.maxChars);
            }

            if (typeof item === 'object' && item !== null) {
                // Object arrays (e.g., { FLAG: "-l", DESC: "Long format" })
                const validatedItem = {};
                for (const [subField, subValue] of Object.entries(item)) {
                    if (typeof subValue === 'string') {
                        const constraints = LayoutConstraints.forField(templateId, subField);
                        const cleaned = this._cleanText(subValue);
                        if (TextFitter) {
                            const result = TextFitter.smartTruncate(cleaned, constraints);
                            if (result.wasTruncated) {
                                warnings.push(`Slide ${slideIndex + 1} [${templateId}]: ${fieldName}[${itemIdx}].${subField} truncated`);
                            }
                            validatedItem[subField] = result.text;
                        } else {
                            validatedItem[subField] = cleaned.substring(0, constraints.maxChars);
                        }
                    } else {
                        validatedItem[subField] = subValue;
                    }
                }
                return validatedItem;
            }

            return item;
        });
    }

    /**
     * Clean common AI text artifacts.
     * @private
     */
    static _cleanText(text) {
        if (!text) return '';
        return text
            .replace(/\n+/g, ' ')          // Collapse newlines into spaces
            .replace(/\s{2,}/g, ' ')        // Collapse multiple spaces
            .replace(/^\s+|\s+$/g, '')      // Trim
            .replace(/^["']+|["']+$/g, ''); // Strip wrapping quotes from AI
    }

    /**
     * Get LayoutConstraints module (handle browser vs Node).
     * @private
     */
    static _getLayoutConstraints() {
        if (typeof window !== 'undefined' && window.LayoutConstraints) {
            return window.LayoutConstraints;
        }
        try {
            return require('./LayoutConstraints') || require('../engine/LayoutConstraints');
        } catch (e) {
            return null;
        }
    }

    /**
     * Get TextFitter module.
     * @private
     */
    static _getTextFitter() {
        if (typeof window !== 'undefined' && window.TextFitter) {
            return window.TextFitter;
        }
        try {
            return require('./TextFitter') || require('../engine/TextFitter');
        } catch (e) {
            return null;
        }
    }

    /**
     * Validate a single content object for the Canvas pipeline (Scene Graph pages).
     * Canvas pages have layers with text content instead of template fields.
     * 
     * @param {Object} page - { canvas: {...}, layers: [...] }
     * @param {number} pageIndex
     * @returns {{ page: Object, warnings: string[] }}
     */
    static validateCanvasPage(page, pageIndex = 0) {
        const warnings = [];
        if (!page || !page.layers) return { page, warnings };

        const LayoutConstraints = this._getLayoutConstraints();
        const TextFitter = this._getTextFitter();
        if (!LayoutConstraints || !TextFitter) return { page, warnings };

        const layers = page.layers.map((layer, layerIdx) => {
            if (layer.type === 'text' && layer.content) {
                // Determine field type by font size and position
                const role = this._inferTextRole(layer);
                const constraints = LayoutConstraints.FIELD_DEFAULTS[role] ||
                    { maxChars: 200, maxWords: 35, maxLines: 5, minFontSize: 28 };

                const result = TextFitter.smartTruncate(layer.content, constraints);
                if (result.wasTruncated) {
                    warnings.push(`Page ${pageIndex + 1}, Layer ${layerIdx}: text truncated (role: ${role})`);
                    layer = { ...layer, content: result.text };
                }
            }

            // Validate terminal output
            if (layer.type === 'terminal') {
                if (layer.command && layer.command.length > 60) {
                    warnings.push(`Page ${pageIndex + 1}, Layer ${layerIdx}: command truncated`);
                    layer = { ...layer, command: layer.command.substring(0, 57) + '…' };
                }
            }

            // Validate bullet list items
            if (layer.type === 'bulletlist' && Array.isArray(layer.items)) {
                layer = {
                    ...layer,
                    items: layer.items.map(item => {
                        if (typeof item === 'string' && item.length > 60) {
                            return item.substring(0, 57).trim() + '…';
                        }
                        return item;
                    })
                };
            }

            return layer;
        });

        return { page: { ...page, layers }, warnings };
    }

    /**
     * Infer the text role from layer properties (for Canvas pipeline).
     * @private
     */
    static _inferTextRole(layer) {
        const fontSize = (layer.font && layer.font.size) || 42;
        if (fontSize >= 70) return 'TITLE';
        if (fontSize >= 50) return 'SUBTITLE';
        if (fontSize <= 32) return 'NOTE';
        return 'DESCRIPTION';
    }
}

if (typeof module !== 'undefined') module.exports = ContentValidator;
else window.ContentValidator = ContentValidator;
