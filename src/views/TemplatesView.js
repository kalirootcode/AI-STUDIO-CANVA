import { BaseView } from './BaseView.js';

export class TemplatesView extends BaseView {
    constructor() {
        super('templates');
    }

    render() {
        this.element.innerHTML = `
            <div class="view-content-wrapper">
                <div class="view-header">
                    <h1>📚 Galería de Packs</h1>
                    <p>Selecciona un pack de diseño para tu próximo carrusel.</p>
                </div>
                
                <div id="packsGrid" class="packs-grid">
                    <!-- Packs injected here -->
                    <div class="loading-spinner">Cargando packs...</div>
                </div>
            </div>
        `;
        return this.element;
    }

    async onEnter() {
        console.log("TemplatesView: onEnter");
        await this.loadPacks();
    }

    async loadPacks() {
        try {
            // Access engines from App or global
            // In app.js we initialized this.templateEngine on the app instance
            // We can access it via window.app.templateEngine if we exposed it, 
            // or we can fetch packs directly via IPC if the engine isn't ready.
            // But relying on the engine is better for consistency.

            let packs = [];

            if (window.app && window.app.templateEngine) {
                // If engine loaded them
                packs = window.app.templateEngine.getTemplates();
                // Wait, getTemplates returns flat templates. We want PACKS.
                // TemplateEngine has loadFromPacks returning packsMeta, but store?
                // Looking at TemplateEngine code, it returns packsMeta from loadFromPacks.
                // But it doesn't seem to store packsMeta in a getter (only this.templates).
                // Let's re-fetch from IPC to be safe, or modify TemplateEngine.
                // For now, I'll use window.cyberCanvas.loadPacks() directly to get the meta.
                const rawPacks = await window.cyberCanvas.loadPacks();
                packs = rawPacks;
            } else {
                packs = await window.cyberCanvas.loadPacks();
            }

            this.renderPacks(packs);

        } catch (e) {
            console.error("Error loading packs:", e);
            this.container.querySelector('#packsGrid').innerHTML = `<div class="error">Error cargando packs: ${e.message}</div>`;
        }
    }

    renderPacks(packs) {
        const grid = this.element.querySelector('#packsGrid');

        if (!packs || packs.length === 0) {
            grid.innerHTML = '<div class="empty">No hay packs instalados.</div>';
            return;
        }

        grid.innerHTML = packs.map(pack => `
            <div class="pack-card" data-id="${pack.id}">
                <div class="pack-icon">
                    <span class="material-icons">${pack.icon || 'layers'}</span>
                </div>
                <div class="pack-info">
                    <h3>${pack.name}</h3>
                    <p>${pack.description || 'Sin descripción'}</p>
                    <div class="pack-meta">
                        <span class="badge">${pack.templates ? pack.templates.length : 0} Templates</span>
                    </div>
                </div>
                <button class="btn-select">USAR PACK</button>
            </div>
        `).join('');

        // Add listeners
        grid.querySelectorAll('.pack-card').forEach(card => {
            card.onclick = () => this.selectPack(card.dataset.id);
        });
    }

    selectPack(packId) {
        console.log("Selected Pack:", packId);

        if (window.app && window.app.loadPackIntoStudio) {
            window.app.loadPackIntoStudio(packId);
        } else {
            console.error("App or loadPackIntoStudio not found");
            alert("Error cargando pack. Revisa la consola.");
        }
    }
}
