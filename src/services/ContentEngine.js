
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
                schema: `"TERM": "Término", "CATEGORY": "Cat", "DEFINITION": "Párrafo MUY largo explicando detalladamente. Puedes extenderte mucho aquí sin problema.", "KEY_POINTS": [{"ICON": "🔗", "TEXT": "Punto (MÁXIMO 2 ITEMS, pero con texto más largo)"}], "EXAMPLE": "Ejemplo extenso"`
            },
            LIST: {
                id: 'kr-clidn-03',
                desc: 'Lista de herramientas',
                schema: `"TITLE": "Lista", "INTRO_TEXT": "Intro", "TIP_TITLE": "Tip", "TIP_CONTENT": "Contenido", "OPTIONS": [{"FLAG": "1", "NAME": "Nom", "ICON": "⚡", "DESCRIPTION": "Desc"}]`
            },
            GRID: {
                id: 'kr-clidn-05',
                desc: 'Columna/Lista Extendida',
                schema: `"TITLE": "Título", "COMMAND": "$ cmd", "INTRO_TEXT": "Intro", "OUTPUT_LINES": [{"TEXT": "out"}], "GRID_ITEMS": [{"NUMBER": "1", "TITLE": "T", "CONTENT": "Párrafo LARGO detallando el item. Extiéndete todo lo que quieras. (MÁXIMO 2 ITEMS TOTALES)"}]`
            },

            // --- TECHNICAL / HANDS-ON ---
            TERMINAL_OUTPUT: {
                id: 'kr-clidn-04',
                desc: 'Salida de Terminal',
                schema: `"TITLE": "Título", "COMMAND": "$ cmd", "WARNING_TEXT": "Warn", "OUTPUT_LINES": [{"TEXT": "line", "HIGHLIGHT": "kw"}], "BREAKDOWN_CARDS": [{"NUMBER": "1", "TITLE": "T", "CONTENT_HTML": "Párrafo extenso explicativo. (MÁXIMO 2 ITEMS)"}]`
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

            // --- MODE-SPECIFIC ---
            SPEEDRUN_STEP: {
                id: 'kr-clidn-34',
                desc: 'Paso Speedrun',
                schema: `"STEP_NUMBER": "01", "TOTAL_STEPS": "05", "TITLE": "Acción", "COMMAND": "$ cmd", "RESULT": "Resultado", "TIME_ESTIMATE": "~10s"`
            },
            TOOL_CARD: {
                id: 'kr-clidn-35',
                desc: 'Tarjeta Arsenal',
                schema: `"TOOL_NAME": "Tool", "TOOL_ICON": "🔍", "CATEGORY": "Cat", "DESCRIPTION": "Desc", "INSTALL_CMD": "$ apt install...", "USAGE_CMD": "$ tool...", "DIFFICULTY": "⭐⭐", "POWER": "🔥🔥🔥", "PLATFORM": "Linux"`
            },
            TIMELINE: {
                id: 'kr-clidn-36',
                desc: 'Línea Temporal',
                schema: `"TITLE": "Cronología", "EVENTS": [{"TIME": "08:00", "ICON": "🔍", "EVENT": "Evento", "DETAIL": "Detalle"}], "IMPACT": "Impacto"`
            },
            PUZZLE: {
                id: 'kr-clidn-37',
                desc: 'Challenge/Puzzle',
                schema: `"CHALLENGE_NUM": "01", "TITLE": "Reto", "SCENARIO": "Escenario", "TERMINAL_LINES": [{"TYPE": "prompt/output", "TEXT": "txt"}], "HINT": "Pista", "DIFFICULTY": "MEDIO"`
            },
            MYTH_REALITY: {
                id: 'kr-clidn-38',
                desc: 'Mito vs Realidad',
                schema: `"MYTH_TITLE": "Título", "MYTH_TEXT": "Mito", "REALITY_TEXT": "Realidad", "PROOF_CMD": "$ cmd", "PROOF_EXPLAIN": "Expl", "VERDICT": "Veredicto"`
            },
            DENSE_REF: {
                id: 'kr-clidn-39',
                desc: 'Referencia Densa',
                schema: `"TITLE": "Ref", "CATEGORY": "Cat", "SECTIONS": [{"HEADER": "Sección", "COMMANDS": [{"CMD": "cmd", "DESC": "desc"}]}], "NOTE": "Nota"`
            },

            // --- TIKTOK VIRAL (NEW) ---
            HOOK_COMPARE: {
                id: 'kr-clidn-40',
                desc: 'Hook Comparativo',
                schema: `"TITLE": "Título", "MYTH_LABEL": "Lo que crees", "MYTH_ICON": "❌", "MYTH_POINTS": ["p1"], "REALITY_LABEL": "La realidad", "REALITY_ICON": "⚡", "REALITY_POINTS": ["p1"], "BOTTOM_LINE": "Conclusión", "CATEGORY": "MITOS"`
            },
            STAT_BOMB: {
                id: 'kr-clidn-41',
                desc: 'Dato Impactante',
                schema: `"SETUP": "Contexto", "STAT_NUMBER": "99", "STAT_UNIT": "%", "STAT_DETAIL": "Detalle", "CONTEXT_CARDS": [{"ICON": "⚡", "TEXT": "txt"}], "SOURCE": "Fuente", "HOOK": "Pregunta", "CATEGORY": "DATO"`
            },
            PROGRESS_BAR: {
                id: 'kr-clidn-42',
                desc: 'Barra Progreso',
                schema: `"TITLE": "Nivel", "CURRENT_LEVEL": 3, "TOTAL_LEVELS": 5, "LEVEL_LABEL": "Label", "PROGRESS_PCT": 60, "LEVELS": [{"NUM": 1, "LABEL": "L", "DESC": "D", "DONE": true, "CURRENT": false}], "NEXT_STEP": "Teaser", "CATEGORY": "SKILL"`
            },
            MYTH_VS_REALITY: {
                id: 'kr-clidn-43',
                desc: 'Mito vs Realidad',
                schema: `"TITLE": "Mitos", "MYTHS": [{"MYTH": "M", "REALITY": "R", "VERDICT": "FALSO", "DANGER": "ALTO"}], "CLOSING": "Cierre", "CATEGORY": "FACT CHECK"`
            },
            POLL: {
                id: 'kr-clidn-44',
                desc: 'Encuesta Viral',
                schema: `"TITLE": "Pregunta", "QUESTION": "Q", "OPTIONS": [{"KEY": "A", "TEXT": "T", "COLOR": "#f00", "ICON": "x"}], "CORRECT_KEY": "B", "REVEAL": "Teaser", "COMMENT_CTA": "Comenta", "CATEGORY": "QUIZ"`
            },

            // --- TIKTOK VIRAL (NEW) ---
            HOOK_COMPARE: {
                id: 'kr-clidn-40',
                desc: 'Hook Comparativo',
                schema: `"TITLE": "Título", "MYTH_LABEL": "Lo que crees", "MYTH_ICON": "❌", "MYTH_POINTS": ["p1"], "REALITY_LABEL": "La realidad", "REALITY_ICON": "⚡", "REALITY_POINTS": ["p1"], "BOTTOM_LINE": "Conclusión", "CATEGORY": "MITOS"`
            },
            STAT_BOMB: {
                id: 'kr-clidn-41',
                desc: 'Dato Impactante',
                schema: `"SETUP": "Contexto", "STAT_NUMBER": "99", "STAT_UNIT": "%", "STAT_DETAIL": "Detalle", "CONTEXT_CARDS": [{"ICON": "⚡", "TEXT": "txt"}], "SOURCE": "Fuente", "HOOK": "Pregunta", "CATEGORY": "DATO"`
            },
            PROGRESS_BAR: {
                id: 'kr-clidn-42',
                desc: 'Barra Progreso',
                schema: `"TITLE": "Nivel", "CURRENT_LEVEL": 3, "TOTAL_LEVELS": 5, "LEVEL_LABEL": "Label", "PROGRESS_PCT": 60, "LEVELS": [{"NUM": 1, "LABEL": "L", "DESC": "D", "DONE": true, "CURRENT": false}], "NEXT_STEP": "Teaser", "CATEGORY": "SKILL"`
            },
            MYTH_VS_REALITY: {
                id: 'kr-clidn-43',
                desc: 'Mito vs Realidad',
                schema: `"TITLE": "Mitos", "MYTHS": [{"MYTH": "M", "REALITY": "R", "VERDICT": "FALSO", "DANGER": "ALTO"}], "CLOSING": "Cierre", "CATEGORY": "FACT CHECK"`
            },
            POLL: {
                id: 'kr-clidn-44',
                desc: 'Encuesta Viral',
                schema: `"TITLE": "Pregunta", "QUESTION": "Q", "OPTIONS": [{"KEY": "A", "TEXT": "T", "COLOR": "#f00", "ICON": "x"}], "CORRECT_KEY": "B", "REVEAL": "Teaser", "COMMENT_CTA": "Comenta", "CATEGORY": "QUIZ"`
            },

            // --- EBOOK VIRAL PACK (NEW) ---
            EBOOK_01: {
                id: 'ebook-01',
                desc: 'Portada Ebook',
                schema: `"TITLE": "Título con *palabras clave* resaltadas entre asteriscos", "SUBTITLE": "Subtítulo con *keyword* resaltada", "AUTHOR": "KR-CLIDN"`
            },
            EBOOK_02: {
                id: 'ebook-02',
                desc: 'Separador Capítulo',
                schema: `"CHAPTER_NUM": "01", "CHAPTER_TITLE": "Título del Capítulo", "TITLE": "*Subtítulo* del capítulo", "CHAPTER_DESC": "Párrafo descriptivo del contenido del capítulo con *palabras clave* resaltadas entre asteriscos. Describe qué aprenderá el lector.", "CURRENT_PAGE": "2", "TOTAL_PAGES": "TOTAL_REAL"`
            },
            EBOOK_03: {
                id: 'ebook-03',
                desc: 'Página de Teoría',
                schema: `"TITLE": "*Título* del Concepto", "CONTENT": "Párrafos o HTML fluido y sin alturas fijas. NUNCA uses height o min-height en divs internos. Deja que el texto decida la altura. Resalta *palabras clave*.", "CURRENT_PAGE": "3", "TOTAL_PAGES": "TOTAL_REAL"`
            },
            EBOOK_04: {
                id: 'ebook-04',
                desc: 'Ejemplo Práctico',
                schema: `"TITLE": "Comando: *nombre*", "DESCRIPTION": "Dos párrafos explicativos separados por \\\\n\\\\n. Resalta *herramientas* y *conceptos* entre asteriscos.\\\\n\\\\nSegundo párrafo con detalles técnicos adicionales.", "COMMAND": "comando_real_ejecutable", "OUTPUT": "Salida realista del terminal", "CURRENT_PAGE": "4", "TOTAL_PAGES": "TOTAL_REAL"`
            },
            EBOOK_05: {
                id: 'ebook-05',
                desc: 'Gráfico Estadísticas',
                schema: `"TITLE": "*Datos* Relevantes", "SUBTITLE": "Párrafo de contexto explicando las *estadísticas* con palabras clave resaltadas. Mínimo 2 líneas.", "STATS": [{"LABEL": "Categoría", "VALUE": 80, "COLOR": "var(--primary-color)"}, {"LABEL": "Cat 2", "VALUE": 55, "COLOR": "var(--accent-color)"}, {"LABEL": "Cat 3", "VALUE": 30, "COLOR": "var(--warning-color)"}], "CURRENT_PAGE": "5", "TOTAL_PAGES": "TOTAL_REAL"`
            },
            EBOOK_06: {
                id: 'ebook-06',
                desc: 'Hoja de Trucos',
                schema: `"TITLE": "*Hoja* de Trucos", "INTRO": "Párrafo introductorio con *keywords* resaltadas describiendo esta referencia rápida.", "COMMANDS": [{"CMD": "comando_real", "DESC": "Descripción corta"}], "TIP": "Consejo profesional con *keywords* resaltadas entre asteriscos.", "CURRENT_PAGE": "6", "TOTAL_PAGES": "TOTAL_REAL"`
            },
            EBOOK_07: {
                id: 'ebook-07',
                desc: 'Contraportada',
                schema: `"TITLE": "*Fin* del E-Book", "CTA": "Mensaje persuasivo con *palabras clave* resaltadas para guardar, compartir y seguir.", "MOTIVATION": "Frase motivacional con *keywords* sobre el valor de aprender este tema.", "HASHTAGS": "#hashtags #relevantes"`
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
                schema: `"TITLE": "Pregunta de cierre que enganche (ej: '¿Listo para proteger tu red?')", "CTA_MESSAGE": "Frase PERSUASIVA para seguir la cuenta (ej: 'Sígueme para dominar la ciberseguridad desde cero'). NO mencionar próximo post específico.", "CLOSING_TEXT": "Frase motivacional corta y poderosa que inspire a seguir aprendiendo", "HASHTAGS": "#tags"`
            }
        };

        // 2. DEFINE CATEGORIES for Weighted Selection
        this.categories = {
            OPENER: ['COVER', 'HOOK'],
            CONCEPT: ['CONCEPTO', 'ANATOMY', 'QUOTE', 'LIST'],
            TECHNICAL: ['TERMINAL_OUTPUT', 'PRO_TERMINAL', 'CODE', 'CODE_BLOCK', 'SCRIPT_EDITOR', 'CHEAT_SHEET', 'COMMAND_CARD', 'PERMISSION_MATRIX', 'DENSE_REF'],
            VISUAL: ['FLOW', 'DIRECTORY_TREE', 'NETWORK_DIAGRAM', 'GRID', 'STATISTIC_CHART', 'STATS_HERO', 'TIMELINE'],
            COMPARISON: ['VS_CARD', 'VS_SIMPLE', 'BEFORE_AFTER', 'MYTH_REALITY'],
            ACTIONABLE: ['MINI_TUTORIAL', 'LAB', 'STEP_BY_STEP', 'ERROR_SOLUTION', 'SPEEDRUN_STEP', 'PUZZLE'],
            ADVICE: ['PRO_TIP', 'DO_DONT', 'CHECKLIST', 'WARNING', 'TOOL_CARD'],
            CLOSER: ['CONCLUSION']
        };
    }

    /**
     * Builds a specific sequence based on Content Mode.
     * 11 Modes with psychology-driven template ordering.
     */
    buildSlideSequence(count, mode = 'TUTORIAL') {
        const sequence = ['COVER'];
        let remaining = count - 2; // Reserve Cover + Conclusion

        // ─── MODE: TIKTOK_TREND (NEW) ───
        if (mode === 'TIKTOK_TREND') {
            // Highly aggressive viral structure
            sequence[0] = Math.random() > 0.5 ? 'HOOK_COMPARE' : 'STAT_BOMB'; // Replace default cover

            // Core rotation of high-retention templates
            const viralPool = ['MYTH_VS_REALITY', 'VS_CARD', 'PROGRESS_BAR', 'DO_DONT', 'POLL', 'ERROR_SOLUTION', 'TIMELINE'];

            for (let i = 0; i < remaining; i++) {
                sequence.push(viralPool[Math.floor(Math.random() * viralPool.length)]);
            }

            // Strong engagement closer
            sequence.push('POLL');
            return sequence;
        }

        // ─── MODE: VIRAL_HOOK_TEST (NEW) ───
        if (mode === 'VIRAL_HOOK_TEST') {
            return ['HOOK_COMPARE', 'STAT_BOMB', 'COVER', 'POLL'];
        }

        // ─── MODE: EBOOK_CREATOR (DYNAMIC EBOOK) ───
        if (mode === 'EBOOK_CREATOR') {
            // Dynamic sequence that adapts to any page count
            const ebookSeq = ['EBOOK_01', 'EBOOK_02']; // Cover + Chapter
            let ebookRemaining = count - 3; // Reserve 1 for back cover
            const middleTypes = ['EBOOK_03', 'EBOOK_04', 'EBOOK_05', 'EBOOK_03', 'EBOOK_06'];
            for (let i = 0; i < ebookRemaining; i++) {
                ebookSeq.push(middleTypes[i % middleTypes.length]);
            }
            ebookSeq.push('EBOOK_07'); // Back cover
            return ebookSeq;
        }

        // ─── MODE: TUTORIAL (Improved) ───
        if (mode === 'TUTORIAL') {
            // Structure: Cover → Index → Prerequisites → [Step→Result→Tip]... → Before/After → Conclusion
            sequence.push('HOOK');
            remaining--;

            if (remaining > 5) {
                sequence.push('CHECKLIST'); // "What you need"
                remaining--;
            }

            for (let i = 0; i < remaining; i++) {
                const cycle = i % 5;
                if (cycle === 0) sequence.push('STEP_BY_STEP');
                else if (cycle === 1) sequence.push('TERMINAL_OUTPUT');
                else if (cycle === 2) sequence.push('PRO_TIP');
                else if (cycle === 3) sequence.push('WARNING');
                else sequence.push('BEFORE_AFTER');
            }

            // ─── MODE: STORY (Kill Chain) ───
        } else if (mode === 'STORY') {
            // Structure: Cover → Index → Recon → Weaponize → Deliver → Exploit → Persist → Lesson
            sequence.push('HOOK');
            remaining--;

            // Kill Chain narrative arc
            const storyArc = [
                'CONCEPTO',          // Context: What happened
                'NETWORK_DIAGRAM',   // Recon: The target
                'FLOW',              // Attack flow
                'TERMINAL_OUTPUT',   // The exploit
                'CODE_BLOCK',        // The payload
                'STATS_HERO',        // The impact
                'QUOTE',             // Lesson learned
                'DO_DONT',           // How to defend
                'CHECKLIST'          // Action items
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(storyArc[i % storyArc.length]);
            }

            // ─── MODE: TOOL (Improved) ───
        } else if (mode === 'TOOL') {
            // Structure: Cover → What → Install → Use → Features → Errors → Cheat → Conclusion
            const toolSeq = [
                'CONCEPTO',          // What is it
                'COMMAND_CARD',      // GitHub/Install
                'TERMINAL_OUTPUT',   // Basic usage
                'LIST',              // Key features
                'CODE_BLOCK',        // Script example
                'ERROR_SOLUTION',    // Common errors
                'CHEAT_SHEET',       // Quick reference
                'PRO_TIP',           // Pro tips
                'VS_SIMPLE'          // vs alternatives
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(toolSeq[i % toolSeq.length]);
            }

            // ─── MODE: VS (Improved) ───
        } else if (mode === 'VS') {
            // Structure: Cover → Main VS → Rounds → Stats → Verdict
            sequence.push('VS_CARD');
            remaining--;

            const vsSeq = [
                'TERMINAL_OUTPUT',   // Tool A demo
                'TERMINAL_OUTPUT',   // Tool B demo
                'VS_SIMPLE',         // Feature comparison
                'STATISTIC_CHART',   // Performance data
                'BEFORE_AFTER',      // Real-world result
                'DO_DONT',           // When to use which
                'STATS_HERO'         // Winner stats
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(vsSeq[i % vsSeq.length]);
            }

            // ─── MODE: SPEEDRUN ⚡ ───
        } else if (mode === 'SPEEDRUN') {
            // Structure: Cover → Rapid-fire numbered steps → Result
            // No index, just GO GO GO
            const speedSeq = [
                'SPEEDRUN_STEP',
                'SPEEDRUN_STEP',
                'SPEEDRUN_STEP',
                'TERMINAL_OUTPUT',
                'SPEEDRUN_STEP',
                'SPEEDRUN_STEP',
                'CODE_BLOCK',
                'STATS_HERO'
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(speedSeq[i % speedSeq.length]);
            }

            // ─── MODE: ARSENAL 🔫 ───
        } else if (mode === 'ARSENAL') {
            // Structure: Cover → Index → Tool cards with ratings → Summary
            sequence.push('HOOK');
            remaining--;

            const arsenalSeq = [
                'TOOL_CARD',         // Tool with ratings
                'TERMINAL_OUTPUT',   // Demo usage
                'TOOL_CARD',         // Next tool
                'CODE_BLOCK',        // Usage example
                'TOOL_CARD',         // Next tool
                'DENSE_REF',         // Quick reference
                'TOOL_CARD',         // Next tool
                'PRO_TIP'            // Pro tip
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(arsenalSeq[i % arsenalSeq.length]);
            }

            // ─── MODE: INCIDENT 🔥 ───
        } else if (mode === 'INCIDENT') {
            // Structure: Cover → Timeline → Target → Attack → Impact → Forensics → Defense
            sequence.push('HOOK');
            remaining--;

            const incidentSeq = [
                'QUOTE',             // "On March 15, the world woke up to..."
                'TIMELINE',          // Chronological incident timeline
                'NETWORK_DIAGRAM',   // The target infrastructure
                'TERMINAL_OUTPUT',   // What the attacker ran
                'CODE_BLOCK',        // The exploit code
                'STATS_HERO',        // Damage/Impact numbers
                'TIMELINE',          // Detection timeline
                'CHECKLIST',         // Lessons / How to prevent
                'DO_DONT'            // Defense recommendations
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(incidentSeq[i % incidentSeq.length]);
            }

            // ─── MODE: CHALLENGE 🧩 ───
        } else if (mode === 'CHALLENGE') {
            // Structure: Cover → Puzzles → Clues → Solution Reveal
            const challengeSeq = [
                'PUZZLE',            // The CTF challenge
                'CONCEPTO',          // Context/Hint
                'CODE_BLOCK',        // "Look at this code..."
                'PUZZLE',            // Another puzzle
                'DIRECTORY_TREE',    // "Where's the flag?"
                'BEFORE_AFTER',      // Wrong vs Right approach
                'PUZZLE',            // Solution reveal
                'STATS_HERO'         // Score/Difficulty rating
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(challengeSeq[i % challengeSeq.length]);
            }

            // ─── MODE: CHEATSHEET 📋 ───
        } else if (mode === 'CHEATSHEET') {
            // Structure: Cover → Dense reference sections + cheat sheets
            sequence.push('HOOK'); // Table of contents
            remaining--;

            const cheatSeq = [
                'DENSE_REF',         // Dense command reference
                'CHEAT_SHEET',       // Commands group
                'DENSE_REF',         // More dense reference
                'CODE',              // Syntax reference
                'DENSE_REF',         // Even more reference
                'PRO_TIP',           // Pro tips
                'ERROR_SOLUTION',    // Common mistakes
                'PERMISSION_MATRIX'  // Reference table
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(cheatSeq[i % cheatSeq.length]);
            }

            // ─── MODE: MYTHBUSTER 💥 ───
        } else if (mode === 'MYTHBUSTER') {
            // Structure: Cover → [Myth❌ → Reality✅ → Proof]... → Summary
            const mythSeq = [
                'MYTH_REALITY',      // Myth vs Reality split
                'TERMINAL_OUTPUT',   // Proof with real output
                'STATS_HERO',        // Stats that prove/disprove
                'MYTH_REALITY',      // Next myth
                'CODE_BLOCK',        // Technical proof
                'CONCEPTO',          // Why people believe this
                'MYTH_REALITY',      // Another myth
                'BEFORE_AFTER',      // Expected vs Actual
                'CHECKLIST'          // Truth summary
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(mythSeq[i % mythSeq.length]);
            }

            // ─── MODE: NEWS ───
        } else if (mode === 'NEWS') {
            // Structure: Cover → What happened → Impact → Analysis → What's next
            sequence.push('HOOK');
            remaining--;

            const newsSeq = [
                'QUOTE',             // The headline/statement
                'STATS_HERO',        // Key numbers
                'NETWORK_DIAGRAM',   // Who's affected
                'FLOW',              // Timeline
                'CONCEPTO',          // Analysis
                'VS_SIMPLE',         // Before vs After
                'DO_DONT',           // What to do
                'CHECKLIST'          // Action items
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(newsSeq[i % newsSeq.length]);
            }

            // ─── MODE: THEORY ───
        } else if (mode === 'THEORY') {
            // Structure: Cover → Index → Concepts → Visuals → Applications
            sequence.push('HOOK');
            remaining--;

            const theorySeq = [
                'CONCEPTO',          // Core concept
                'ANATOMY',           // Break it down
                'FLOW',              // How it works
                'GRID',              // Components
                'DIRECTORY_TREE',    // Structure
                'STATISTIC_CHART',   // Data
                'QUOTE',             // Expert insight
                'MINI_TUTORIAL',     // Try it yourself
                'PRO_TIP'            // Key takeaway
            ];

            for (let i = 0; i < remaining; i++) {
                sequence.push(theorySeq[i % theorySeq.length]);
            }

        } else {
            // ─── DEFAULT: Smart Mix ───
            sequence.push('HOOK');
            remaining--;

            if (remaining <= 5) {
                sequence.push(...this.getRandomMix(remaining, 'THEORY', 'MIX'));
            } else {
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

    generatePrompt(topic, slideCount = 10, mode = 'TUTORIAL', trendSignal = null) {
        const count = Math.max(5, Math.min(50, parseInt(slideCount)));
        const sequence = this.buildSlideSequence(count, mode);

        // Expanded theme map for all modes
        const themeMap = {
            'TUTORIAL': 'BLUE_TEAM', 'STORY': 'OSINT', 'TOOL': 'RED_TEAM',
            'VS': 'CYBER', 'NEWS': 'CYBER', 'THEORY': 'BLUE_TEAM',
            'SPEEDRUN': 'RED_TEAM', 'ARSENAL': 'RED_TEAM', 'INCIDENT': 'OSINT',
            'CHALLENGE': 'RED_TEAM', 'CHEATSHEET': 'BLUE_TEAM', 'MYTHBUSTER': 'CYBER',
            'TIKTOK_TREND': 'CYBER', 'VIRAL_HOOK_TEST': 'RED_TEAM',
            'EBOOK_CREATOR': 'CYBER'
        };
        const theme = themeMap[mode] || 'CYBER';

        console.log(`[ContentEngine] Topic: "${topic}" | Mode: ${mode} | Slides: ${count} | Sequence:`, sequence);

        let slideInstructions = '';

        // ─── TIKTOK INTELLIGENCE INJECTION (NEW) ───
        let tiktokContext = '';
        if (trendSignal) {
            tiktokContext = `
🚨 TIKTOK TREND SIGNAL DETECTED 🚨
You must adapt the content to match this active trend:
- HASHTAGS ACTIVOS: ${trendSignal.hashtag || 'N/A'}
- SONIDO VIRAL: ${trendSignal.sound || 'N/A'}
- VIRAL HOOK REFERENCE: "${trendSignal.viralHook || 'N/A'}"
- USER NICHE: "${trendSignal.niche || 'Cybersecurity'}"

INSTRUCCIONES DE ADAPTACIÓN:
1. Usa el "VIRAL HOOK REFERENCE" como inspiración para tu Slide 1, pero adáptalo a: ${topic}.
2. Si hay un sonido viral, sugiere en el texto cómo interactuar con el ritmo (ej: "Lee esto con el audio...").
3. Maximiza la controversia o la sorpresa (High-Dopamine Content).
4. El tono debe ser URGENTE y DIRECTO.
`;
        }

        // ── MODE-SPECIFIC GOLDEN RULES ──
        const modeRules = {
            'TIKTOK_TREND': `
REGLAS DE ORO (TIKTOK TREND):
- SLIDE 1: HOOK VISUAL OBLIGATORIO. Usa el formato de comparación o dato impactante.
- VELOCIDAD EXTREMA: Máximo 5 segundos de lectura por slide.
- PATRONES VISUALES: Usa emojis grandes como iconos (❌, ✅, ⚠️).
- CIERRE: Pregunta polarizante para generar comentarios.`,

            'VIRAL_HOOK_TEST': `
REGLAS (A/B HOOK TEST):
- Genera 3 portadas con ángulos psicológicos diferentes (Miedo, Curiosidad, Beneficio).
- El objetivo es probar cuál detiene el scroll.`,

            'TUTORIAL': `
REGLAS DE ORO (TUTORIAL):
- Slide 1: Gancho visual que prometa un RESULTADO tangible ("Después de este post, podrás...")
- Usa progresión de dificultad: empezar fácil, terminar avanzado
- Cada paso debe tener un comando REAL ejecutable
- Incluye advertencias REALES antes de comandos peligrosos
- Penúltimo slide: Muestra el ANTES vs DESPUÉS del resultado
- Último slide: CTA con pregunta directa ("¿Qué herramienta quieres dominar next?")
- TONO: Profesor paciente pero experto`,

            'STORY': `
REGLAS DE ORO (HISTORIA / CASO REAL):
- Estructura KILL CHAIN: Reconocimiento → Weaponización → Entrega → Explotación → Persistencia → Lección
- Slide 1: Gancho tipo true crime ("El día que hackearon a...")
- Usa CLIFFHANGERS entre slides ("Pero lo que no sabían era...")
- Incluye datos reales: fechas, empresas, números de registros afectados
- Slide de impacto: Estadísticas escalofriantes ($ perdidos, usuarios afectados)
- Cierre con lecciones aplicables, NO solo con la historia
- TONO: Narrador de documental, urgente y dramático`,

            'TOOL': `
REGLAS DE ORO (REVIEW DE HERRAMIENTA):
- NO vendas la herramienta, muestra su PODER con ejemplos reales
- Incluye: Qué es → Instalación → Uso básico → Uso avanzado → Errores comunes → Cheat sheet
- Cada comando debe ser COPIABLE y funcional
- Muestra errores REALES y cómo resolverlos
- Compara brevemente con alternativas
- TONO: Reviewer experto, honesto (menciona pros Y contras)`,

            'VS': `
REGLAS DE ORO (COMPARATIVA):
- Slide 1: Plantea el debate de forma POLARIZANTE ("¿Cuál es MEJOR?")
- Sé OBJETIVO: muestra pros y contras de AMBOS lados
- Incluye: Demo de A → Demo de B → Comparativa features → Datos de rendimiento → Veredicto
- Usa DATOS REALES (benchmarks, features, compatibilidad)
- El veredicto final debe ser MATIZADO ("Usa X cuando..., Usa Y cuando...")
- TONO: Juez imparcial pero con opinión fundamentada`,

            'SPEEDRUN': `
REGLAS DE ORO (SPEEDRUN):
- SIN ÍNDICE. Directo a la acción desde el Slide 2
- Cada slide = UN PASO CLARO. Sin explicaciones largas
- Títulos cortos tipo countdown: "PASO 1/5", "PASO 2/5"...
- Cada paso: 1 comando + 1 resultado. Máximo 3 líneas de texto
- Sensación de VELOCIDAD y PODER: "En 30 segundos tendrás..."
- Último paso muestra el RESULTADO FINAL impactante
- TONO: Speedrunner, directo, sin rodeos`,

            'ARSENAL': `
REGLAS DE ORO (ARSENAL / TOP HERRAMIENTAS):
- Slide 1: "Las X herramientas que todo hacker necesita"
- Cada herramienta: Nombre + 1 línea qué hace + comando de instalación + rating dificultad
- VARIEDAD: mezclar categorías (escaneo, explotación, forense, OSINT)
- Incluir herramientas REALES con repositorios GitHub reales
- Rating visual: ⭐ Dificultad, 🔥 Poder, 📊 Popularidad
- Cerrar con "¿Cuál falta? Comenta 👇"
- TONO: Curador experto, selectivo`,

            'INCIDENT': `
REGLAS DE ORO (CASO REAL / FORENSE):
- Slide 1: Titular de noticia impactante ("Así cayó [empresa]")
- Timeline cronológico del ataque con fechas reales
- Diagrama de red mostrando el vector de ataque
- Incluir CVEs reales, TTPs del framework MITRE ATT&CK si aplica
- Números de impacto: $ pérdidas, registros expuestos, tiempo de detección
- Cerrar con LECCIONES DEFENSIVAS aplicables
- TONO: Periodista investigativo + analista forense`,

            'CHALLENGE': `
REGLAS DE ORO (CHALLENGE / CTF):
- SIN ÍNDICE. El misterio empieza en el Slide 2
- Slide 1: "¿Puedes resolver esto?" con emoji 🧩
- Presenta el puzzle: un output, un código, un log sospechoso
- Cada slide siguiente da UNA PISTA más
- Pattern interrupt: un slide con pista falsa o red herring
- Penúltimo: "¿Ya lo tienes?" (pausa dramática)
- Último: Solución + explicación + nivel de dificultad
- TONO: Game master, misterioso, retador`,

            'CHEATSHEET': `
REGLAS DE ORO (CHEAT SHEET):
- Slide 1: "La guía DEFINITIVA de [tema]"
- MÁXIMA DENSIDAD de información útil por slide
- Organizar por secciones temáticas (Básico, Intermedio, Avanzado)
- Cada comando con su descripción en 1 línea
- Incluir atajos, trucos y flags poco conocidos
- Formato consistente: comando → resultado esperado
- Este post debe ser GUARDADO como referencia
- TONO: Manual de referencia, conciso y preciso`,

            'MYTHBUSTER': `
REGLAS DE ORO (DESTRUCTOR DE MITOS):
- Slide 1: "X MENTIRAS que te dijeron sobre [tema]"
- Estructura por mito: MITO ❌ → REALIDAD ✅ → PRUEBA TÉCNICA
- Cada mito debe ser algo que la MAYORÍA cree
- La prueba debe ser un comando/output/dato REAL verificable
- Usar tono de "shock": "Esto que crees es FALSO"
- Incluir estadísticas que contradigan la creencia popular
- TONO: Detectivo que desmonta conspiracies, contundente`,

            'NEWS': `
REGLAS DE ORO (NOTICIA / ACTUALIDAD):
- Slide 1: Titular URGENTE con 🚨
- Responder: ¿Qué pasó? ¿A quién afecta? ¿Qué hacer?
- Incluir datos verificables (fuentes, fechas, números)
- Contextualizar: por qué IMPORTA para el usuario
- Cerrar con acciones concretas que el usuario puede tomar HOY
- TONO: Periodista de breaking news, urgente pero riguroso`,

            'EBOOK_CREATOR': `
REGLAS DE ORO (E-BOOK VIRAL):
- PORTADA (Slide 1): Título IMPACTANTE con *palabras clave* resaltadas. Debe generar curiosidad masiva.
- ÍNDICE (Slide 2): Descripción del capítulo con contexto rico.
- PÁGINAS DE TEORÍA: Mínimo 2 PÁRRAFOS LARGOS por página separados por \\n\\n. Resalta *conceptos clave* entre asteriscos.
- PÁGINAS PRÁCTICAS: Comandos REALES y salidas de terminal realistas (MÁXIMO 4 líneas de output para no romper el diseño) junto con 2 párrafos explicativos.
- ESTADÍSTICAS: Usa datos REALES con 3 barras de progreso y un párrafo de contexto.
- CHEAT SHEET: Incluye intro + 4 comandos + tip profesional.
- CONTRAPORTADA: CTA persuasivo + frase motivacional con *keywords*.
- IMPORTANTE: Este es un E-BOOK, NO un carrusel. El contenido debe ser EXTENSO, PROFUNDO y EDUCATIVO.
- Usa *asteriscos* alrededor de 2-3 palabras clave importantes POR PÁRRAFO para resaltarlas visualmente.
- NO seas breve. Extiéndete todo lo que necesites. El lector espera VALOR profundo.
- TONO: Autoridad técnica, profesor experto que domina el tema.`,

            'THEORY': `
REGLAS DE ORO (CONCEPTO TEÓRICO):
- Slide 1: Pregunta intrigante ("¿Realmente sabes qué es un...?")
- Explicar de SIMPLE a COMPLEJO: analogía → definición → técnico
- Incluir diagramas, flujos y estructuras visuales
- Conectar teoría con práctica: "En la vida real, esto se ve así..."
- Un mini-tutorial al final para aplicar el concepto
- TONO: Profesor universitario que hace TODO interesante`
        };

        const goldenRules = modeRules[mode] || modeRules['TUTORIAL'];

        // Index instruction (only for modes that use HOOK as slide 2)
        const modesWithIndex = ['TUTORIAL', 'STORY', 'TOOL', 'ARSENAL', 'INCIDENT', 'CHEATSHEET', 'NEWS', 'THEORY'];
        const indexConfig = modesWithIndex.includes(mode) ? `
IMPORTANTE SOBRE EL ÍNDICE (SLIDE 2):
El Slide 2 es el ÍNDICE. Su campo "ITEMS" DEBE listar las secciones/pasos que aparecen en los slides posteriores.
Asegúrate de que el índice refleje EXACTAMENTE el contenido real del carrusel.` : `
NOTA: Este modo NO usa slide de índice. Empieza la acción directamente desde el Slide 2.`;

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

        return `ACTÚA COMO UN ESTRATEGA DE CONTENIDO VIRAL EXPERTO EN CIBERSEGURIDAD, HACKING ÉTICO Y KALI LINUX.
TIPO DE POST: "${mode}"
TEMA: "${topic}"
SLIDES: ${count}

OBJETIVO: Generar un carrusel tipo "${mode}" que sea ADICTIVO, EDUCATIVO y maximice retención y guardados.

${tiktokContext}

${goldenRules}

TÉCNICAS DE RETENCIÓN OBLIGATORIAS:
1. SLIDE 1: Gancho visual IMPACTANTE. Nunca empezar con texto genérico.
2. SLIDE 3-4: Usar OPEN LOOPS ("Lo que viene te va a sorprender...") 
3. SLIDE INTERMEDIO: Pattern interrupt (cambio de ritmo) para re-enganchar.
4. PENÚLTIMO SLIDE: Cliffhanger o dato bomba que motive llegar al final.
5. ÚLTIMO SLIDE: CTA persuasivo para SEGUIR LA CUENTA. NO mencionar un próximo post específico. Usar frases como "Sígueme para dominar...", "¿Quieres más contenido así? Sígueme", "No te pierdas lo que viene. ¡Sígueme!". El objetivo es FOLLOWS, no teaser.

PSICOLOGÍA POR SLIDE:
- Usa CURIOSIDAD al inicio (preguntas, datos impactantes)
- Usa MIEDO/URGENCIA en el medio (vulnerabilidades reales)
- Usa SATISFACCIÓN al final (el resultado, la solución, el poder adquirido)

${indexConfig}

ESTRUCTURA DEL OBJETO JSON SOLICITADO (NO CAMBIES EL ORDEN):
{
    "seo": {
        "description": "Descripción VIRAL para Instagram/LinkedIn/TikTok. Usa ganchos, dolor y solución. Máximo 300 caracteres.",
        "hashtags": "#Ciberseguridad #Hacking #KaliLinux #EthicalHacking #InfoSec #CyberSecurity #PenTest #RedTeam #Linux #Terminal"
    },
    "slides": [
        ${slideInstructions}
    ]
}

REGLAS:
1. Genera JSON válido y PURO (sin markdown fences).
2. Contenido 100% en Español.
3. Sé PROFUNDO y TÉCNICO. Nada superficial.
4. Usa comandos, herramientas y técnicas REALES.
5. Cada slide debe aportar VALOR. Nada de relleno.
6. Los títulos deben generar CURIOSIDAD (usa números, preguntas, negaciones).
7. BREVEDAD ADAPTATIVA: ${mode === 'EBOOK_CREATOR' ? 'Este es un E-BOOK. El contenido debe ser EXTENSO y PROFUNDO. Usa párrafos largos, explicaciones detalladas y múltiples ejemplos. NO seas breve.' : 'Hemos aumentado el tamaño de la letra para dispositivos móviles. DEBES RESUMIR TUS TEXTOS AL MÁXIMO. LÍMITES POR CAMPO: TITLE max 8 palabras, DESCRIPTION/INTRO max 30 palabras, TIP/NOTE max 16 palabras, COMMAND max 55 chars. Usa frases CORTAS y directas. El sistema TRUNCARÁ automáticamente textos que excedan los límites.'}
8. KEYWORDS RESALTADAS: Envuelve 2-3 palabras clave importantes por campo de texto entre *asteriscos* para resaltarlas visualmente con el color del tema.

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

    /**
     * Generate a prompt for the Canvas Scene Graph rendering mode.
     * The AI returns a Scene Graph JSON that the CanvasRenderer interprets directly.
     */
    generateCanvasPrompt(topic, slideCount = 10, theme = 'cyber') {

        const themeColors = {
            cyber: { primary: '#00D9FF', accent: '#A855F7', warning: '#FF9500', success: '#00FF88', danger: '#FF3366', text: '#f0f0f0', muted: '#94a3b8' },
            hacker: { primary: '#00FF41', accent: '#FF00FF', warning: '#FFD700', success: '#00FF41', danger: '#FF0040', text: '#e0ffe0', muted: '#5a8a5a' },
            minimal: { primary: '#3B82F6', accent: '#8B5CF6', warning: '#F59E0B', success: '#10B981', danger: '#EF4444', text: '#ffffff', muted: '#9ca3af' }
        };

        const colors = themeColors[theme] || themeColors.cyber;

        return `ACTÚA COMO UN DISEÑADOR GRÁFICO PROFESIONAL Y ESTRATEGA DE CONTENIDO VIRAL.
TEMA: "${topic}"
PÁGINAS: ${slideCount}
TEMA VISUAL: "${theme}"

OBJETIVO: Generar ${slideCount} páginas de contenido VISUAL PREMIUM sobre "${topic}" en formato Scene Graph JSON.
Cada página es un lienzo de 1080x1920 píxeles. TÚ decides la composición visual de CADA página.

## TIPOS DE LAYER DISPONIBLES

Cada página tiene un array de "layers" que se dibujan en orden (de atrás hacia adelante).
IMPORTANTE: Genera SOLO JSON válido. No uses comentarios, pipes ni "...". Cada ejemplo es un JSON válido que puedes copiar.

### 1. background (Fondo sólido)
{ "type": "background", "fill": "#000000" }

### 1b. background (Fondo alternativo, muy oscuro)
{ "type": "background", "fill": "#030303" }

### 1c. background (PORTADA página 1 — fondo de libro hacking)
{ "type": "background", "fill": "#000000", "isCover": true }

### 2. brand (Header con logo — incluir en CADA página)
PORTADA (página 1): { "type": "brand", "logo": "./assets/kr-clidn-logo.png", "text": "KR-CLIDN", "badge": "EDICIÓN PREMIUM", "position": "top", "isCover": true }
RESTO DE PÁGINAS: { "type": "brand", "logo": "./assets/kr-clidn-logo.png", "text": "KR-CLIDN", "badge": "EDICIÓN PREMIUM", "position": "top" }
NOTA: En la portada, el logo se muestra centrado a 200px con el nombre debajo. En el resto, el logo va al lado del nombre.

### 3. text (Título grande — MAX 50 caracteres)
{ "type": "text", "content": "TÍTULO AQUÍ", "x": 60, "y": 300, "width": 960, "font": { "family": "BlackOpsOne", "size": 88, "weight": 900 }, "color": "#ffffff", "align": "center", "effects": [{ "type": "shadow", "offsetY": 4, "blur": 8, "color": "rgba(0,0,0,0.6)" }], "highlights": [{ "text": "AQUÍ", "color": "${colors.primary}" }] }

### 3b. text (Párrafo con highlights — MAX 180 caracteres)
{ "type": "text", "content": "Texto largo del párrafo aquí con palabras clave importantes.", "x": 60, "y": 600, "width": 960, "font": { "family": "MPLUS Code Latin", "size": 42, "weight": 700 }, "color": "#f0f0f0", "align": "justify", "lineHeight": 1.6, "highlights": [{ "text": "palabras clave", "color": "${colors.accent}" }] }

### 3c. text (Label técnico con glow)
{ "type": "text", "content": "CAPÍTULO 01", "x": 60, "y": 280, "width": 960, "font": { "family": "JetBrains Mono", "size": 54, "weight": 800 }, "color": "${colors.primary}", "align": "center", "letterSpacing": 8, "effects": [{ "type": "glow", "color": "${colors.primary}", "blur": 15 }] }

### 4. terminal (Ventana de terminal — MAX 5 líneas de output, comando MAX 55 chars)
{ "type": "terminal", "x": 60, "y": 800, "width": 960, "command": "nmap -sV 192.168.1.1", "output": "PORT     STATE SERVICE\\n22/tcp   open  ssh\\n80/tcp   open  http\\n443/tcp  open  https" }

### 5. rect (Rectángulo o tarjeta — con barra de acento lateral automática)
{ "type": "rect", "x": 60, "y": 500, "width": 960, "height": 300, "fill": "#0a0a0c", "border": { "color": "${colors.primary}33", "width": 2 }, "radius": 16, "accentColor": "${colors.primary}", "title": "TÍTULO OPCIONAL DE LA TARJETA" }

### 6. statbar (Barra de estadística)
{ "type": "statbar", "x": 60, "y": 600, "width": 960, "label": "Nmap", "value": 85, "maxValue": 100, "color": "${colors.primary}", "showPercent": true }

### 7. divider (Línea divisoria)
{ "type": "divider", "x": 60, "y": 500, "width": 960, "color": "rgba(255,255,255,0.1)", "thickness": 2 }

### 7b. accent_bar (Barra de acento visual — separador premium con gradiente)
{ "type": "accent_bar", "x": 60, "y": 420, "width": 300, "height": 6, "color": "${colors.primary}" }

### 8. bulletlist (Lista con viñetas)
{ "type": "bulletlist", "x": 60, "y": 500, "width": 900, "items": ["Item uno", "Item dos", "Item tres"], "font": { "family": "MPLUS Code Latin", "size": 40, "weight": 700 }, "color": "#f0f0f0", "bulletColor": "${colors.primary}" }

### 9. swipe (Flecha de desplazamiento — incluir en TODAS las páginas EXCEPTO la última)
{ "type": "swipe", "current": 1, "total": ${slideCount} }
NOTA: NO incluir el swipe en la última página. La flecha aparece a la derecha de la imagen.

### 10. icon (Emoji decorativo grande)
{ "type": "icon", "content": "🔒", "x": 60, "y": 400, "width": 960, "size": 120, "align": "center" }

### 11. image (Imagen)
{ "type": "image", "src": "./assets/kr-clidn-logo.png", "x": 100, "y": 100, "width": 200, "height": 200, "radius": 16 }

## COLORES DEL TEMA "${theme}"
- Primary: ${colors.primary}
- Accent: ${colors.accent}
- Warning: ${colors.warning}
- Success: ${colors.success}
- Danger: ${colors.danger}
- Text: ${colors.text}
- Muted: ${colors.muted}

## FUENTES DISPONIBLES
- "BlackOpsOne" — Para TODOS los títulos principales (bold, impactante). NUNCA uses otra fuente para títulos.
- "MPLUS Code Latin" — Para TODO el resto: párrafos, descripciones, listas, tarjetas, labels. NUNCA uses "Inter" ni "MPLUS Code Latin".
- "JetBrains Mono" — Únicamente para código y ventanas de terminal.

## REGLAS DE DISEÑO OBLIGATORIAS

1. **TIPOGRAFÍA:** Usa "BlackOpsOne" para títulos (80-100px) y "MPLUS Code Latin" para subtítulos (54-64px), párrafos (42px) y notas (30px). NUNCA uses texto menor a 30px. NUNCA uses "BlackOpsOne", "MPLUS Code Latin" ni "Inter".
2. **ESPACIO Y COORDENADAS Y (CRÍTICO — PRESUPUESTO EXACTO):**
   - ZONA PROHIBIDA SUPERIOR: y < 180 (reservado para brand header + separador de línea). NUNCA coloques contenido aquí.
   - ZONA PROHIBIDA INFERIOR: y > 1710 (reservado para pagination + margen aéreo obligatorio de 80px). NUNCA coloques contenido aquí.
   - ÁREA SEGURA: y=180 a y=1710 → Tienes exactamente 1530px verticales para TODO el contenido.
   - TABLA DE ALTURA EXACTA DE CADA ELEMENTO (úsala para calcular el Y del siguiente bloque):
     | Elemento                            | Alto aproximado |
     |-------------------------------------|----------------|
     | Texto título (90px)                 | 150px          |
     | Texto subtítulo (60px, 1 línea)     | 100px          |
     | Texto párrafo (42px, 3-4 líneas)    | 280px          |
     | Texto párrafo (42px, 5-6 líneas)    | 400px          |
     | Terminal con 3-4 líneas de output   | 360px          |
     | Terminal con 6+ líneas de output    | 520px          |
     | Rect/Card (depende de su "height")  | height px      |
     | StatBar                             | 80px           |
     | Divider                             | 30px           |
     | AccentBar                           | 20px           |
     | BulletList (4 items)                | 320px          |
     | BulletList (3 items)                | 250px          |
     | Icon (120px size)                   | 150px          |
   - ENTRE cada bloque: +40px de gap.
   - MÁXIMO 4-5 bloques de contenido por página. Si necesitas más, DIVIDE en más páginas.
   - PROHIBIDO: Colocar un bloque si su Y + altura estimada > 1710.
   - EJEMPLO CORRECTO: brand(y=0) → Título(y=220, 150px) → AccentBar(y=420,20px) → Párrafo(y=480, 280px) → Divider(y=800, 30px) → BulletList(y=870, 320px) → pagination(bottom). TOTAL: 1190px ✅
3. **MÁRGENES (OBLIGATORIO):** x mínimo = 20. Ancho máximo de contenido = 1040 (1080 - 20*2). Margen superior = 40px, inferior = 40px. NUNCA uses x=0. Las tarjetas (rect) NO tienen altura fija — su altura se ajusta dinámicamente al contenido.
4. **JERARQUÍA:** Cada página debe tener una jerarquía visual clara: título dominante → contenido secundario → detalles.
5. **VARIEDAD:** NO repitas el mismo layout en páginas consecutivas. Alterna entre heavy-text, terminal, stats, lists, etc.
6. **FORMATO DE TEXTO (CRÍTICO):**
   - **Terminal:** NUNCA escribas un comando gigante en una sola línea. Divide comandos largos usando la barra invertida \`\\\` para que hagan salto de línea.
   - **Tarjetas/Cards:** Usa frases cortas, contundentes y directas (punchlines). NUNCA escribas párrafos completos dentro de una tarjeta pequena. Añade siempre el campo \"accentColor\" y opcionalmente \"title\" para el header de la tarjeta.
7. **HIGHLIGHTS (OBLIGATORIO):** En TODOS los títulos principales (BlackOpsOne) y en los párrafos, DEBES resaltar de 1 a 3 palabras clave usando el array "highlights" con el color del tema (ej. "${colors.primary}").
8. **BRANDING:** CADA página DEBE incluir el layer "brand" al inicio y "swipe" al final (EXCEPTO la última página que NO lleva swipe).
9. **FONDO:** Usa un fondo NEGRO SÓLIDO de forma obligatoria ("fill": "#000000"). Opcionalmente puedes añadir "ambientColor" y "accentColor" (hex) para los orbes atmosféricos de color. NUNCA uses el pattern de circuit.
10. **CONTENIDO:** 100% en Español. Técnico, profundo y educativo sobre ciberseguridad/hacking ético.
11. **JSON ESCAPE (CRÍTICO):** Las propiedades "content", "output" y "text" a menudo contienen texto. DEBES escapar las comillas dobles (usa \\") y los saltos de línea (usa \\n). NUNCA uses comillas dobles sin escapar dentro de un string JSON. NUNCA uses saltos de línea literales en el JSON.
12. **DENSIDAD (CRÍTICO):** El total acumulado de alturas de todos los elementos en una página NO puede superar 1530px. Si el contenido que necesitas comunicar no cabe, DIVIDE en más slides. Es mejor tener 12 slides perfectos que 10 slides apretados.

## ESTRUCTURA NARRATIVA POR PÁGINA

- Página 1: PORTADA — Usar background con "isCover": true para fondo de libro hacking. Usar brand con "isCover": true. El logo 200px aparece centrado con el nombre debajo. Debajo del brand: título GRANDE centrado (100px) en y=450, descripción debajo del título (y=650). Distancia separada entre logo, título y descripción para un look premium.
- Página 2: CAPÍTULO — Separador con número de capítulo
- Páginas 3-${slideCount - 1}: CONTENIDO — Mezcla de teoría, terminales, estadísticas, listas, tips
- Última página: CIERRE — CTA para seguir + hashtags + iconos sociales

## FORMATO DE RESPUESTA

Genera un JSON con la estructura:
{
    "seo": {
        "description": "Descripción viral de 300 chars max",
        "hashtags": "#Ciberseguridad #Hacking #KaliLinux ..."
    },
    "pages": [
        {
            "canvas": { "width": 1080, "height": 1920 },
            "theme": "${theme}",
            "layers": [ ... layers aquí ... ]
        }
    ]
}

REGLAS FINALES:
1. Genera JSON PURO (sin markdown fences, sin explicaciones).
2. Exactamente ${slideCount} objetos en el array "pages".
3. Contenido PROFUNDO y TÉCNICO. Nada superficial.
4. Cada página debe ser visualmente DISTINTA pero con branding CONSISTENTE.
5. Los títulos deben generar CURIOSIDAD.

RETORNA SOLO EL JSON.`;
    }
}

if (typeof module !== 'undefined') module.exports = ContentEngine;
else window.ContentEngine = ContentEngine;
