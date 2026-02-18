
/**
 * PROFESSIONAL CONTENT ENGINE v4.0 (Full Spectrum)
 * Generates structured AI prompts that map to ALL 33 Cyber-Canvas templates.
 * Handles dynamic slide count (5-50) with "Smart Narrative" logic and Chapters.
 */

class ContentEngine {
    constructor() {
        this.brandName = "KR-CLIDN";

        // 1. REGISTER ALL 33 TEMPLATES
        this.templates = {
            // --- OPENERS ---
            COVER: {
                id: 'kr-clidn-01',
                desc: 'Portada viral',
                schema: `"TITLE": "Título GANCHO de 5-15 palabras que genere CURIOSIDAD y RETENCIÓN. Usa *asteriscos* alrededor de 2-3 palabras clave para resaltarlas. Ej: 'Así un *HACKER* tomó el control sin *DESCARGAR* nada'", "SUBTITLE": "Promesa o dato impactante con número", "CATEGORY": "Categoría"`
            },
            HOOK: {
                id: 'kr-clidn-19',
                desc: 'Índice de Contenidos',
                schema: `"TITLE": "Título", "SUBTITLE": "Intro", "ITEMS": [{"NUMBER": "01", "TEXT": "Tema", "RANGE": "03-05"}], "TOTAL_SLIDES": "30"`
            },

            // --- CONCEPTS & BASICS ---
            ANATOMY: {
                id: 'kr-clidn-02',
                desc: 'Anatomía de comando',
                schema: `"TITLE": "Anatomía", "COMMAND_STRUCTURE": "cmd -opt target", "TIP": "Tip", "COMPONENTS": [{"NUMBER": "1", "NAME": "Flag", "DESCRIPTION": "Desc"}]`
            },
            CONCEPTO: {
                id: 'kr-clidn-15',
                desc: 'Definición Técnica',
                schema: `"TERM": "Término", "CATEGORY": "Cat", "DEFINITION": "Definición", "KEY_POINTS": [{"ICON": "🔗", "TEXT": "Punto"}], "EXAMPLE": "Ejemplo"`
            },
            LIST: {
                id: 'kr-clidn-03',
                desc: 'Lista de herramientas',
                schema: `"TITLE": "Lista", "INTRO_TEXT": "Intro", "TIP_TITLE": "Tip", "TIP_CONTENT": "Contenido", "OPTIONS": [{"FLAG": "1", "NAME": "Nom", "ICON": "⚡", "DESCRIPTION": "Desc"}]`
            },
            GRID: {
                id: 'kr-clidn-05',
                desc: 'Grid con Terminal',
                schema: `"TITLE": "Título", "COMMAND": "$ cmd", "INTRO_TEXT": "Intro", "OUTPUT_LINES": [{"TEXT": "out"}], "GRID_ITEMS": [{"NUMBER": "1", "TITLE": "T", "CONTENT": "C"}]`
            },

            // --- TECHNICAL / HANDS-ON ---
            TERMINAL_OUTPUT: {
                id: 'kr-clidn-04',
                desc: 'Salida de Terminal',
                schema: `"TITLE": "Título", "COMMAND": "$ cmd", "WARNING_TEXT": "Warn", "OUTPUT_LINES": [{"TEXT": "line", "HIGHLIGHT": "kw"}], "BREAKDOWN_CARDS": [{"NUMBER": "1", "TITLE": "T", "CONTENT_HTML": "C"}]`
            },
            PRO_TERMINAL: {
                id: 'kr-clidn-21',
                desc: 'Terminal Avanzada Color',
                schema: `"TITLE": "Terminal", "TERMINAL_LINES": [{"TYPE": "prompt/output/success/error", "TEXT": "txt"}], "EXPLANATION": "Expl"`
            },
            CODE: { // Legacy ID 11
                id: 'kr-clidn-11',
                desc: 'Comando y Flags',
                schema: `"COMMAND_NAME": "cmd", "CATEGORY": "Cat", "SYNTAX": "sintaxis", "DESCRIPTION": "Desc", "EXAMPLE_CMD": "$ cmd", "EXAMPLE_OUTPUT": "out", "KEY_FLAGS": [{"FLAG": "-f", "DESC": "desc"}]`
            },
            CODE_BLOCK: { // Script view
                id: 'kr-clidn-14',
                desc: 'Bloque de Código',
                schema: `"TITLE": "Script", "LANGUAGE": "bash/py", "DESCRIPTION": "Desc", "CODE_LINES": [{"LINE": "code", "COMMENT": "com"}], "EXPLANATION": "Expl"`
            },
            SCRIPT_EDITOR: {
                id: 'kr-clidn-31',
                desc: 'Editor IDE Completo',
                schema: `"TITLE": "Script Pro", "FILENAME": "scan.sh", "LANGUAGE": "bash", "DESCRIPTION": "Desc", "CODE_LINES": [{"TEXT": "code", "TYPE": "comment/variable/command/string"}], "EXPLANATION": "Expl"`
            },
            COMMAND_CARD: { // ID 10 is specific tool card
                id: 'kr-clidn-10',
                desc: 'Herramienta GitHub',
                schema: `"TOOL_NAME": "Tool", "TOOL_CATEGORY": "Cat", "DESCRIPTION": "Desc", "INSTALL_CMD": "$ git clone...", "USAGE_CMD": "$ python...", "FEATURES": [{"ICON": "⚡", "TEXT": "Feat"}], "GITHUB_STARS": "5k"`
            },
            CHEAT_SHEET: {
                id: 'kr-clidn-28',
                desc: 'Hoja de Trucos',
                schema: `"TITLE": "Cheat Sheet", "CATEGORY": "Cat", "COMMANDS": [{"CMD": "ls", "DESC": "listar"}], "NOTE": "Nota"`
            },
            MINI_TUTORIAL: {
                id: 'kr-clidn-30',
                desc: 'Tutorial 3 Pasos',
                schema: `"TITLE": "Tutorial", "DESCRIPTION": "Desc", "STEPS": [{"NUM": "1", "TITLE": "T", "CMD": "$ cmd", "RESULT": "res"}], "FINAL_NOTE": "Fin"`
            },
            LAB: {
                id: 'kr-clidn-06',
                desc: 'Ejercicio Práctico',
                schema: `"EXERCISE_LETTER": "A", "TITLE": "Ejercicio", "INTRO_TEXT": "Intro", "COMMAND": "$ cmd", "RESULT_TEXT": "Res", "NOTE_TITLE": "Nota", "NOTE_CONTENT": "Cont"`
            },
            STEP_BY_STEP: {
                id: 'kr-clidn-13',
                desc: 'Paso Individual',
                schema: `"STEP_NUMBER": "01", "TOTAL_STEPS": "05", "TITLE": "Paso", "DESCRIPTION": "Desc", "COMMAND": "$ cmd", "EXPECTED_RESULT": "Res", "NOTE": "Nota"`
            },

            // --- VISUAL & DIAGRAMS ---
            FLOW: {
                id: 'kr-clidn-23',
                desc: 'Flujo de Proceso',
                schema: `"TITLE": "Flujo", "FLOW_STEPS": [{"ICON": "icon", "LABEL": "Paso", "DESC": "Desc"}], "DESCRIPTION": "Expl"`
            },
            DIRECTORY_TREE: {
                id: 'kr-clidn-22',
                desc: 'Árbol de Directorios',
                schema: `"TITLE": "Árbol", "ROOT_PATH": "/var", "TREE_ITEMS": [{"DEPTH": 0, "TYPE": "folder/file", "NAME": "name", "DETAIL": "desc"}], "DESCRIPTION": "Expl"`
            },
            NETWORK_DIAGRAM: {
                id: 'kr-clidn-26',
                desc: 'Diagrama de Red',
                schema: `"TITLE": "Red", "NODES": [{"ICON": "💻", "NAME": "PC", "IP": "1.1.1.1", "STATUS": "active"}], "DESCRIPTION": "Expl"`
            },
            STATISTIC_CHART: { // 32
                id: 'kr-clidn-32',
                desc: 'Gráfico Datos',
                schema: `"TITLE": "Gráfico", "TYPE": "bar/circle", "STATS": [{"LABEL": "Lb", "VALUE": 50, "COLOR": "#f00"}], "DESCRIPTION": "Desc"`
            },
            STATS_HERO: { // 08
                id: 'kr-clidn-08',
                desc: 'Dato Destacado',
                schema: `"EXERCISE_LETTER": "D", "TITLE": "Dato", "INTRO_TEXT": "Intro", "COMMAND": "$ cmd", "RESULT_TEXT": "Res", "PERCENTAGE": "90%", "PERCENTAGE_TEXT": "Txt", "TIP_TITLE": "Tip", "TIP_CONTENT": "Cont"`
            },

            // --- COMPARISONS ---
            VS_CARD: { // 33
                id: 'kr-clidn-33',
                desc: 'VS Completo',
                schema: `"TITLE": "VS", "SIDE_A": {"NAME": "A", "COLOR": "#f00", "POINTS": ["p1"]}, "SIDE_B": {"NAME": "B", "COLOR": "#0f0", "POINTS": ["p1"]}, "DESCRIPTION": "Verdict"`
            },
            VS_SIMPLE: { // 12
                id: 'kr-clidn-12',
                desc: 'VS Simple',
                schema: `"TITLE": "VS", "LEFT_NAME": "A", "LEFT_ITEMS": [{"TEXT": "t"}], "RIGHT_NAME": "B", "RIGHT_ITEMS": [{"TEXT": "t"}], "VERDICT": "Fin"`
            },
            BEFORE_AFTER: {
                id: 'kr-clidn-24',
                desc: 'Antes y Después',
                schema: `"TITLE": "Cambio", "BEFORE_TITLE": "Antes", "BEFORE_LINES": [{"TEXT": "t"}], "AFTER_TITLE": "Después", "AFTER_LINES": [{"TEXT": "t"}], "COMMAND": "$ cmd", "EXPLANATION": "Expl"`
            },

            // --- ADVICE & SAFETY ---
            WARNING: {
                id: 'kr-clidn-07',
                desc: 'Advertencia',
                schema: `"TITLE": "Título", "INTRO_TEXT": "Intro", "COMMAND": "$ cmd", "RESULT_TEXT": "Res", "WARNING_TITLE": "PELIGRO", "WARNING_CONTENT": "Texto"`
            },
            DO_DONT: {
                id: 'kr-clidn-16',
                desc: 'Do vs Dont',
                schema: `"TITLE": "Prácticas", "DO_ITEMS": [{"TEXT": "Hacer"}], "DONT_ITEMS": [{"TEXT": "No hacer"}], "BOTTOM_TIP": "Consejo"`
            },
            CHECKLIST: {
                id: 'kr-clidn-17',
                desc: 'Checklist',
                schema: `"TITLE": "Lista", "DESCRIPTION": "Desc", "CHECK_ITEMS": [{"TEXT": "Item", "CHECKED": true}], "NOTE": "Nota"`
            },
            PRO_TIP: {
                id: 'kr-clidn-25',
                desc: 'Tip Profesional',
                schema: `"TIP_NUMBER": "01", "TITLE": "Pro Tip", "TIP_TEXT": "Texto", "EXAMPLE_CMD": "cmd", "WHY_TEXT": "Por qué", "CATEGORY": "Cat"`
            },
            QUOTE: {
                id: 'kr-clidn-18',
                desc: 'Cita / Frase',
                schema: `"QUOTE_TEXT": "Cita", "QUOTE_AUTHOR": "Autor", "CONTEXT": "Ctx", "EXTRA_FACT": "Dato"`
            },
            ERROR_SOLUTION: {
                id: 'kr-clidn-29',
                desc: 'Error y Solución',
                schema: `"TITLE": "Error", "ERROR_CMD": "$ bad", "ERROR_OUTPUT": "Err", "ERROR_MEANING": "Significado", "SOLUTION_CMD": "$ good", "SOLUTION_OUTPUT": "Ok", "WHY_IT_WORKS": "Por qué"`
            },
            PERMISSION_MATRIX: {
                id: 'kr-clidn-27',
                desc: 'Matriz Permisos',
                schema: `"TITLE": "Permisos", "FILE_EXAMPLE": "-rwx...", "PERMISSION_GROUPS": [{"GROUP": "Owner", "PERMS": "rwx", "ICON": "👤", "COLOR": "#f00", "DESC": "Desc"}], "EXPLANATION": "Expl"`
            },

            // --- STRUCTURAL ---
            CHAPTER: {
                id: 'kr-clidn-20',
                desc: 'Separador Capítulo',
                schema: `"CHAPTER_NUMBER": "01", "CHAPTER_TITLE": "Título", "CHAPTER_SUBTITLE": "Subtítulo", "ICON": "📂"`
            },
            CONCLUSION: { // 09 usually CTA
                id: 'kr-clidn-09',
                desc: 'Cierre / CTA',
                schema: `"TITLE": "Pregunta cierre", "CTA_MESSAGE": "Llamada acción", "CLOSING_TEXT": "Frase final", "HASHTAGS": "#tags"`
            }
        };

        // 2. DEFINE CATEGORIES for Weighted Selection
        this.categories = {
            OPENER: ['COVER', 'HOOK'],
            CONCEPT: ['CONCEPTO', 'ANATOMY', 'QUOTE', 'LIST'],
            TECHNICAL: ['TERMINAL_OUTPUT', 'PRO_TERMINAL', 'CODE', 'CODE_BLOCK', 'SCRIPT_EDITOR', 'CHEAT_SHEET', 'COMMAND_CARD', 'PERMISSION_MATRIX'],
            VISUAL: ['FLOW', 'DIRECTORY_TREE', 'NETWORK_DIAGRAM', 'GRID', 'STATISTIC_CHART', 'STATS_HERO'],
            COMPARISON: ['VS_CARD', 'VS_SIMPLE', 'BEFORE_AFTER'],
            ACTIONABLE: ['MINI_TUTORIAL', 'LAB', 'STEP_BY_STEP', 'ERROR_SOLUTION'],
            ADVICE: ['PRO_TIP', 'DO_DONT', 'CHECKLIST', 'WARNING'],
            CLOSER: ['CONCLUSION']
        };
    }


    /**
     * Builds a specific sequence based on Content Mode.
     * Enforces strict structure for Tutorials, Stories, etc.
     */
    buildSlideSequence(count, mode = 'TUTORIAL') {
        const sequence = ['COVER'];
        let remaining = count - 2; // Reserve Cover + Conclusion (Index handled inside)

        // 1. Define Core Sequences by Mode
        if (mode === 'TUTORIAL') {
            // Structure: Cover -> Index -> Prerequisites -> Steps... -> Conclusion
            sequence.push('HOOK'); // The Index Slide
            remaining--;

            // Add Prerequisites if space permits
            if (remaining > 5) {
                sequence.push('CHECKLIST'); // "What you need"
                remaining--;
            }

            // Fill with Steps
            const stepTemplates = ['STEP_BY_STEP', 'TERMINAL_OUTPUT', 'CODE_BLOCK', 'WARNING', 'PRO_TIP'];
            for (let i = 0; i < remaining; i++) {
                // Alternating Logic for visual variety
                if (i % 3 === 0) sequence.push('STEP_BY_STEP'); // Core step
                else if (i % 3 === 1) sequence.push('TERMINAL_OUTPUT'); // Result
                else sequence.push('PRO_TIP'); // Advice
            }

        } else if (mode === 'STORY') {
            // Structure: Cover -> Hook -> Context -> Narrative... -> Lesson -> Conclusion
            sequence.push('HOOK'); // "What happened" summary
            remaining--;

            const storyTemplates = ['QUOTE', 'NETWORK_DIAGRAM', 'FLOW', 'ANATOMY', 'STATS_HERO', 'VS_SIMPLE'];
            for (let i = 0; i < remaining; i++) {
                sequence.push(storyTemplates[i % storyTemplates.length]);
            }

        } else if (mode === 'TOOL') {
            // Structure: Cover -> What is it -> Install -> Usage -> Features -> Pro Tip -> Conclusion
            const toolSeq = ['CONCEPTO', 'COMMAND_CARD', 'TERMINAL_OUTPUT', 'LIST', 'PRO_TIP', 'VS_SIMPLE'];
            // Fill available slots looping through toolSeq
            for (let i = 0; i < remaining; i++) {
                sequence.push(toolSeq[i % toolSeq.length]);
            }

        } else if (mode === 'VS') {
            // Structure: Cover -> Contenders -> Round 1 -> Round 2 -> Verdict
            sequence.push('VS_CARD'); // Main Comparison
            remaining--;

            const vsTemplates = ['VS_SIMPLE', 'BEFORE_AFTER', 'STATISTIC_CHART', 'LIST'];
            for (let i = 0; i < remaining; i++) {
                sequence.push(vsTemplates[i % vsTemplates.length]);
            }

        } else {
            // Default "Smart Mix" (The old logic)
            // If very short, just mix technical/visual
            if (remaining <= 5) {
                sequence.push('HOOK');
                remaining--;
                sequence.push(...this.getRandomMix(remaining, 'THEORY', 'MIX'));
            } else {
                // Chapter Logic
                sequence.push('HOOK'); // Index
                remaining--;

                const numChapters = Math.min(4, Math.ceil(remaining / 8));
                const slidesPerChapter = Math.floor(remaining / numChapters);
                let extraSlides = remaining % numChapters;

                for (let c = 1; c <= numChapters; c++) {
                    sequence.push('CHAPTER');
                    remaining--;

                    let chapterLen = slidesPerChapter - 1;
                    if (extraSlides > 0) { chapterLen++; extraSlides--; }

                    sequence.push(...this.getRandomMix(chapterLen, 'THEORY', 'MIX'));
                }
            }
        }

        sequence.push('CONCLUSION');
        return sequence;
    }

    /**
     * Returns a random list of template keys based on focus and intent.
     */
    getRandomMix(count, intent, focus) {
        const mix = [];
        let pool = [];

        // Simple pool for now
        const all = [
            ...this.categories.CONCEPT,
            ...this.categories.TECHNICAL,
            ...this.categories.VISUAL,
            ...this.categories.ADVICE
        ];

        for (let i = 0; i < count; i++) {
            mix.push(all[Math.floor(Math.random() * all.length)]);
        }
        return mix;
    }

    generatePrompt(topic, slideCount = 10, mode = 'TUTORIAL') {
        const count = Math.max(5, Math.min(50, parseInt(slideCount)));
        const sequence = this.buildSlideSequence(count, mode);
        // Default theme based on mode if not strictly intent-based
        const themeMap = { 'TUTORIAL': 'BLUE_TEAM', 'STORY': 'OSINT', 'TOOL': 'RED_TEAM', 'VS': 'CYBER', 'NEWS': 'CYBER', 'THEORY': 'CYBER' };
        const theme = themeMap[mode] || 'CYBER';

        console.log(`[ContentEngine] Topic: "${topic}" | Mode: ${mode} | Slides: ${count} | Sequence:`, sequence);

        let slideInstructions = '';

        // Special Instruction for Index Consistency
        const indexConfig = `
    IMPORTANT: SLIDE 2 is the INDEX ("HOOK" template). 
    It MUST list the key sections/steps that appear in the SUBSEQUENT slides.
    If Mode is TUTORIAL, list the Steps.
    If Mode is STORY, list the chronological phases.
    Ensure the "ITEMS" array in Slide 2 MATCHES the content of the rest of the generated JSON.
        `;

        for (let i = 0; i < sequence.length; i++) {
            const type = sequence[i];
            const tmpl = this.templates[type];
            const slideNum = i + 1;

            slideInstructions += `
    {
        "templateId": "${tmpl.id}",
        "THEME": "${theme}",
        "SLIDE_INDEX": ${slideNum},
        "TOTAL_SLIDES": ${count},
        "content": {
            ${tmpl.schema} 
        }
    }${i < sequence.length - 1 ? ',' : ''}`;
        }

        return `ACTÚA COMO UN EXPERTO EN CIBERSEGURIDAD Y EDUCADOR.
TIPO DE POST: "${mode}"
TEMA: "${topic}"
SLIDES: ${count}

OBJETIVO: Generar un post tipo "${mode}" con estructura narrativa perfecta.

${indexConfig}

ESTRUCTURA DEL OBJETO JSON SOLICITADO (NO CAMBIES EL ORDEN):
{
    "seo": {
        "description": "Escribe aquí una descripción VIRAL para Instagram/LinkedIn/TikTok sobre este post. Usa ganchos, dolor y solución. Máximo 300 caracteres.",
        "hashtags": "#Ciberseguridad #Hacking #KaliLinux #..."
    },
    "slides": [
        ${slideInstructions}
    ]
}

REGLAS:
1. Genera JSON válido.
2. Contenido 100% en Español.
3. Se profundo y técnico.
4. Asegura que el Slide 2 (Índice) refleje REALMENTE lo que viene después.
5. NO incluyas markdown fences (\`\`\`) si es posible, o asegúrate de que sea JSON puro.

RETORNA SOLO EL JSON.`;
    }


    // Refine Logic (unchanged concept but updated with full map check)
    refineContent(currentData, instruction, templateId) {
        let schemaDesc = "Keep structure.";
        const tmplKey = Object.keys(this.templates).find(k => this.templates[k].id === templateId);
        if (tmplKey) schemaDesc = this.templates[tmplKey].schema;

        return `ACT as a Design Data Specialist.
UPDATE the JSON content based on instruction: "${instruction}"
CURRENT JSON: ${JSON.stringify(currentData)}
SCHEMA RULES: ${schemaDesc}
RETURN ONLY UPDATED JSON.`;
    }
}

if (typeof module !== 'undefined') module.exports = ContentEngine;
else window.ContentEngine = ContentEngine;
