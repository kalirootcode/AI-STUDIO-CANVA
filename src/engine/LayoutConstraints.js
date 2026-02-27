/**
 * LayoutConstraints.js — Centralized Constraint Engine
 * 
 * Defines per-template and per-field layout constraints:
 * maxChars, maxWords, maxLines, minFontSize, and safe-zone geometry.
 * Consumed by TextFitter, ContentValidator, and SafeZoneManager.
 */

class LayoutConstraints {

    /**
     * Default constraints for common field types.
     * These apply when no per-template override exists.
     */
    static FIELD_DEFAULTS = {
        // Titles
        TITLE: { maxChars: 50, maxWords: 8, maxLines: 2, minFontSize: 54 },
        CHAPTER_TITLE: { maxChars: 30, maxWords: 5, maxLines: 1, minFontSize: 54 },
        CHAPTER_SUBTITLE: { maxChars: 60, maxWords: 10, maxLines: 2, minFontSize: 36 },

        // Subtitles / Descriptions
        SUBTITLE: { maxChars: 120, maxWords: 20, maxLines: 3, minFontSize: 36 },
        DESCRIPTION: { maxChars: 180, maxWords: 30, maxLines: 4, minFontSize: 32 },
        INTRO_TEXT: { maxChars: 180, maxWords: 30, maxLines: 4, minFontSize: 32 },
        DEFINITION: { maxChars: 180, maxWords: 30, maxLines: 4, minFontSize: 32 },

        // Terminal / Code fields
        COMMAND: { maxChars: 55, maxWords: 12, maxLines: 2, minFontSize: 30 },
        CMD: { maxChars: 55, maxWords: 12, maxLines: 2, minFontSize: 30 },
        COMMAND_STRUCTURE: { maxChars: 50, maxWords: 10, maxLines: 1, minFontSize: 36 },
        SYNTAX: { maxChars: 40, maxWords: 8, maxLines: 1, minFontSize: 36 },
        EXAMPLE_CMD: { maxChars: 50, maxWords: 10, maxLines: 1, minFontSize: 30 },
        EXAMPLE_OUTPUT: { maxChars: 70, maxWords: 12, maxLines: 2, minFontSize: 28 },
        ERROR_CMD: { maxChars: 55, maxWords: 10, maxLines: 1, minFontSize: 30 },
        ERROR_OUTPUT: { maxChars: 130, maxWords: 20, maxLines: 3, minFontSize: 28 },
        INSTALL_CMD: { maxChars: 70, maxWords: 10, maxLines: 2, minFontSize: 28 },
        USAGE_CMD: { maxChars: 60, maxWords: 10, maxLines: 1, minFontSize: 30 },

        // Explanations / Tips / Notes
        EXPLANATION: { maxChars: 130, maxWords: 20, maxLines: 3, minFontSize: 32 },
        WHY_TEXT: { maxChars: 130, maxWords: 20, maxLines: 3, minFontSize: 32 },
        WHY_IT_WORKS: { maxChars: 150, maxWords: 25, maxLines: 4, minFontSize: 30 },
        TIP_TEXT: { maxChars: 160, maxWords: 25, maxLines: 4, minFontSize: 30 },
        TIP_CONTENT: { maxChars: 100, maxWords: 16, maxLines: 3, minFontSize: 30 },
        NOTE_CONTENT: { maxChars: 100, maxWords: 16, maxLines: 3, minFontSize: 30 },
        WARNING_CONTENT: { maxChars: 100, maxWords: 16, maxLines: 3, minFontSize: 30 },
        NOTE: { maxChars: 100, maxWords: 16, maxLines: 3, minFontSize: 30 },
        BOTTOM_TIP: { maxChars: 90, maxWords: 15, maxLines: 2, minFontSize: 30 },
        FINAL_NOTE: { maxChars: 90, maxWords: 15, maxLines: 2, minFontSize: 30 },

        // CTA / Social
        CTA_MESSAGE: { maxChars: 120, maxWords: 20, maxLines: 3, minFontSize: 32 },
        CLOSING_TEXT: { maxChars: 60, maxWords: 10, maxLines: 2, minFontSize: 32 },
        HASHTAGS: { maxChars: 80, maxWords: 10, maxLines: 1, minFontSize: 28 },
        VERDICT: { maxChars: 90, maxWords: 15, maxLines: 2, minFontSize: 32 },

        // Quotes
        QUOTE_TEXT: { maxChars: 120, maxWords: 20, maxLines: 3, minFontSize: 36 },
        EXTRA_FACT: { maxChars: 100, maxWords: 16, maxLines: 2, minFontSize: 30 },
        CONTEXT: { maxChars: 80, maxWords: 12, maxLines: 2, minFontSize: 30 },

        // Results
        RESULT: { maxChars: 120, maxWords: 20, maxLines: 3, minFontSize: 32 },
        RESULT_TEXT: { maxChars: 100, maxWords: 16, maxLines: 2, minFontSize: 32 },
        EXPECTED_RESULT: { maxChars: 100, maxWords: 16, maxLines: 2, minFontSize: 32 },
        SOLUTION_OUTPUT: { maxChars: 80, maxWords: 12, maxLines: 2, minFontSize: 28 },
        ERROR_MEANING: { maxChars: 120, maxWords: 20, maxLines: 3, minFontSize: 30 },
        SOLUTION_CMD: { maxChars: 55, maxWords: 10, maxLines: 1, minFontSize: 30 },

        // Small labels
        COMMAND_NAME: { maxChars: 15, maxWords: 2, maxLines: 1, minFontSize: 42 },
        COMMAND_NUMBER: { maxChars: 3, maxWords: 1, maxLines: 1, minFontSize: 42 },
        TOTAL_COMMANDS: { maxChars: 3, maxWords: 1, maxLines: 1, minFontSize: 36 },
        CATEGORY: { maxChars: 20, maxWords: 3, maxLines: 1, minFontSize: 32 },
        STEP_NUMBER: { maxChars: 3, maxWords: 1, maxLines: 1, minFontSize: 42 },
        TOTAL_STEPS: { maxChars: 3, maxWords: 1, maxLines: 1, minFontSize: 36 },
        EXERCISE_LETTER: { maxChars: 1, maxWords: 1, maxLines: 1, minFontSize: 42 },
        TIP_NUMBER: { maxChars: 3, maxWords: 1, maxLines: 1, minFontSize: 42 },
        PERCENTAGE: { maxChars: 5, maxWords: 1, maxLines: 1, minFontSize: 42 },
        PERCENTAGE_TEXT: { maxChars: 50, maxWords: 8, maxLines: 1, minFontSize: 32 },
        TERM: { maxChars: 20, maxWords: 3, maxLines: 1, minFontSize: 48 },
        TIME_ESTIMATE: { maxChars: 10, maxWords: 2, maxLines: 1, minFontSize: 32 },
        LANGUAGE: { maxChars: 15, maxWords: 1, maxLines: 1, minFontSize: 28 },
        FILENAME: { maxChars: 30, maxWords: 1, maxLines: 1, minFontSize: 28 },
        TOOL_NAME: { maxChars: 25, maxWords: 3, maxLines: 1, minFontSize: 42 },
        TOOL_CATEGORY: { maxChars: 20, maxWords: 3, maxLines: 1, minFontSize: 32 },
        GITHUB_STARS: { maxChars: 8, maxWords: 1, maxLines: 1, minFontSize: 32 },
        FILE_EXAMPLE: { maxChars: 60, maxWords: 10, maxLines: 1, minFontSize: 28 },
        ROOT_PATH: { maxChars: 30, maxWords: 1, maxLines: 1, minFontSize: 30 },

        // Misc
        WARNING_TEXT: { maxChars: 80, maxWords: 12, maxLines: 2, minFontSize: 32 },
        WARNING_TITLE: { maxChars: 30, maxWords: 5, maxLines: 1, minFontSize: 36 },
        TIP_TITLE: { maxChars: 20, maxWords: 3, maxLines: 1, minFontSize: 36 },
        NOTE_TITLE: { maxChars: 20, maxWords: 3, maxLines: 1, minFontSize: 36 },

        // Array items — sub-field constraints
        TEXT: { maxChars: 60, maxWords: 10, maxLines: 2, minFontSize: 30 },
        DESC: { maxChars: 50, maxWords: 8, maxLines: 2, minFontSize: 28 },
        FLAG: { maxChars: 10, maxWords: 1, maxLines: 1, minFontSize: 30 },
        NAME: { maxChars: 25, maxWords: 4, maxLines: 1, minFontSize: 32 },
        LABEL: { maxChars: 20, maxWords: 3, maxLines: 1, minFontSize: 30 },
        CONTENT: { maxChars: 60, maxWords: 10, maxLines: 2, minFontSize: 28 },
        CONTENT_HTML: { maxChars: 80, maxWords: 12, maxLines: 2, minFontSize: 28 },
        LINE: { maxChars: 55, maxWords: 10, maxLines: 1, minFontSize: 28 },
        COMMENT: { maxChars: 40, maxWords: 8, maxLines: 1, minFontSize: 28 },
        EXAMPLE: { maxChars: 100, maxWords: 16, maxLines: 2, minFontSize: 28 },
        HIGHLIGHT: { maxChars: 20, maxWords: 3, maxLines: 1, minFontSize: 28 },
        PERMS: { maxChars: 3, maxWords: 1, maxLines: 1, minFontSize: 28 },
        GROUP: { maxChars: 15, maxWords: 2, maxLines: 1, minFontSize: 28 },
        DETAIL: { maxChars: 40, maxWords: 6, maxLines: 1, minFontSize: 28 },
        IP: { maxChars: 20, maxWords: 1, maxLines: 1, minFontSize: 28 },
        STATUS: { maxChars: 10, maxWords: 1, maxLines: 1, minFontSize: 28 },
        COLOR: { maxChars: 10, maxWords: 1, maxLines: 1, minFontSize: 28 },
    };

    /**
     * Per-template overrides. Only need to specify fields that differ from FIELD_DEFAULTS.
     */
    static TEMPLATE_OVERRIDES = {
        'kr-clidn-01': {
            TITLE: { maxChars: 45, maxWords: 10, maxLines: 3, minFontSize: 64 },
            SUBTITLE: { maxChars: 120, maxWords: 20, maxLines: 3, minFontSize: 36 },
        },
        'kr-clidn-09': {
            TITLE: { maxChars: 30, maxWords: 6, maxLines: 1, minFontSize: 48 },
            CTA_MESSAGE: { maxChars: 120, maxWords: 20, maxLines: 3, minFontSize: 36 },
        },
        'kr-clidn-11': {
            DESCRIPTION: { maxChars: 160, maxWords: 25, maxLines: 3, minFontSize: 32 },
            EXAMPLE_OUTPUT: { maxChars: 150, maxWords: 20, maxLines: 3, minFontSize: 28 },
        },
        'kr-clidn-34': {
            TITLE: { maxChars: 40, maxWords: 7, maxLines: 2, minFontSize: 54 },
            COMMAND: { maxChars: 55, maxWords: 10, maxLines: 1, minFontSize: 36 },
            RESULT: { maxChars: 100, maxWords: 16, maxLines: 2, minFontSize: 32 },
        },
        'kr-clidn-02': {
            TITLE: { maxChars: 40, maxWords: 7, maxLines: 2, minFontSize: 54 },
            TIP: { maxChars: 90, maxWords: 14, maxLines: 2, minFontSize: 32 },
        },
        'kr-clidn-15': {
            TERM: { maxChars: 20, maxWords: 3, maxLines: 1, minFontSize: 60 },
            DEFINITION: { maxChars: 180, maxWords: 30, maxLines: 5, minFontSize: 30 },
        },
        'kr-clidn-18': {
            QUOTE_TEXT: { maxChars: 120, maxWords: 20, maxLines: 4, minFontSize: 38 },
        },
        'kr-clidn-28': {
            TITLE: { maxChars: 30, maxWords: 5, maxLines: 1, minFontSize: 54 },
            CMD: { maxChars: 15, maxWords: 3, maxLines: 1, minFontSize: 30 },
            DESC: { maxChars: 25, maxWords: 4, maxLines: 1, minFontSize: 28 },
        },
        'kr-clidn-29': {
            ERROR_OUTPUT: { maxChars: 120, maxWords: 20, maxLines: 2, minFontSize: 28 },
        },
    };

    /**
     * Font size tiers — guaranteed minimums by element role.
     */
    static FONT_TIERS = {
        title: { min: 54, default: 82, max: 163 },
        subtitle: { min: 36, default: 48, max: 64 },
        body: { min: 28, default: 41, max: 48 },
        mono: { min: 24, default: 36, max: 44 },
        label: { min: 24, default: 30, max: 38 },
    };

    /**
     * Get constraints for a specific field in a specific template.
     * @param {string} templateId - e.g. 'kr-clidn-34'
     * @param {string} fieldName - e.g. 'TITLE'
     * @returns {{ maxChars: number, maxWords: number, maxLines: number, minFontSize: number }}
     */
    static forField(templateId, fieldName) {
        // 1. Check per-template override
        const overrides = this.TEMPLATE_OVERRIDES[templateId];
        if (overrides && overrides[fieldName]) {
            return { ...this.FIELD_DEFAULTS[fieldName], ...overrides[fieldName] };
        }

        // 2. Use field default
        if (this.FIELD_DEFAULTS[fieldName]) {
            return { ...this.FIELD_DEFAULTS[fieldName] };
        }

        // 3. Fallback for completely unknown fields
        return { maxChars: 200, maxWords: 35, maxLines: 5, minFontSize: 28 };
    }

    /**
     * Get all field constraints for a template.
     * @param {string} templateId
     * @returns {Object} Map of fieldName → constraints
     */
    static forTemplate(templateId) {
        const result = {};
        const overrides = this.TEMPLATE_OVERRIDES[templateId] || {};

        // Start with defaults for all known fields
        for (const [field, constraint] of Object.entries(this.FIELD_DEFAULTS)) {
            result[field] = { ...constraint };
        }

        // Apply per-template overrides
        for (const [field, override] of Object.entries(overrides)) {
            result[field] = { ...result[field], ...override };
        }

        return result;
    }

    /**
     * Get font tier bounds for an element role.
     * @param {'title'|'subtitle'|'body'|'mono'|'label'} role
     * @returns {{ min: number, default: number, max: number }}
     */
    static fontTier(role) {
        return this.FONT_TIERS[role] || this.FONT_TIERS.body;
    }
}

if (typeof module !== 'undefined') module.exports = LayoutConstraints;
else window.LayoutConstraints = LayoutConstraints;
