// ═══════════════════════════════════════════════════════════════════════════
// CYBER-CANVAS PRO - Template Engine v2.0 (Pack-based)
// Motor para cargar y renderizar templates desde la estructura de packs
// ═══════════════════════════════════════════════════════════════════════════

class TemplateEngine {
    constructor() {
        this.templates = [];
        this.renderFunctions = {}; // Cache de funciones de renderizado
        this.currentTemplate = null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CARGA DE PACKS Y TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════

    async loadFromPacks() {
        try {
            console.log("Cargando packs desde el sistema...");

            // Cargar packs via IPC (nueva estructura)
            const rawPacks = await window.cyberCanvas.loadPacks();

            this.templates = [];
            this.renderFunctions = {};

            const packsMeta = [];

            for (const pack of rawPacks) {
                const packInfo = {
                    id: pack.id,
                    name: pack.name,
                    description: pack.description,
                    icon: pack.icon,
                    templateIds: []
                };

                for (const t of pack.templates) {
                    // Agregar metadata del template
                    this.templates.push({
                        id: t.id,
                        name: t.manifest.name,
                        category: t.manifest.category,
                        description: t.manifest.description,
                        fields: t.manifest.fields || {},
                        packId: pack.id
                    });

                    packInfo.templateIds.push(t.id);

                    // Compilar y guardar la función de renderizado
                    await this.compileRenderFunction(t.id, t.code);
                }

                packsMeta.push(packInfo);
            }

            console.log(`${this.templates.length} templates cargados de ${packsMeta.length} packs.`);
            return packsMeta;
        } catch (error) {
            console.error("Error crítico cargando packs:", error);
            return [];
        }
    }

    async compileRenderFunction(id, codeString) {
        try {
            // Importar módulo dinámico desde string via Blob URL
            const blob = new Blob([codeString], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const module = await import(url);

            if (module && typeof module.render === 'function') {
                this.renderFunctions[id] = module.render;
            } else {
                console.warn(`Template ${id} no exporta una función 'render'.`);
            }

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(`Error compilando template ${id}:`, err);
        }
    }

    getTemplates() {
        return this.templates;
    }

    getTemplateById(id) {
        return this.templates.find(t => t.id === id);
    }

    getTemplatesByPack(packId) {
        return this.templates.filter(t => t.packId === packId);
    }

    selectTemplate(id) {
        this.currentTemplate = this.getTemplateById(id);
        return this.currentTemplate;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDERIZADO
    // ═══════════════════════════════════════════════════════════════════════

    renderTemplate(templateId, data) {
        const renderFn = this.renderFunctions[templateId];

        if (!renderFn) {
            console.error(`Función de renderizado no encontrada para ${templateId}`);
            return `<h1>Error: Template ${templateId} no encontrado o dañado</h1>`;
        }

        try {
            const html = renderFn(data);

            // Post-process HTML to inject professional SVGs
            if (window.IconSystem) {
                return window.IconSystem.replaceIconsInHTML(html);
            }

            return html;
        } catch (err) {
            console.error(`Error renderizando ${templateId}:`, err);
            return `<h1>Error renderizando template: ${err.message}</h1>`;
        }
    }
}

// Exportar para uso global
window.TemplateEngine = TemplateEngine;
