
export class DataEditor {
    constructor(containerId, onChangeCallback, onAIRefineCallback) {
        this.container = document.getElementById(containerId);
        this.onChange = onChangeCallback;
        this.onAIRefine = onAIRefineCallback;
        this.currentData = null;
    }

    /**
     * Generates input fields based on the provided data object.
     * @param {Object} data - The JSON data of the slide.
     */
    renderFields(data) {
        this.currentData = JSON.parse(JSON.stringify(data)); // Deep copy
        this.container.innerHTML = '';

        // --- AI ASSISTANT SECTION ---
        this.renderAISection();

        if (!data || Object.keys(data).length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'editor-empty';
            emptyMsg.innerText = 'Selecciona un slide para editar.';
            this.container.appendChild(emptyMsg);
            return;
        }

        const form = document.createElement('div');
        form.className = 'editor-form';
        form.style.marginTop = '20px';

        // Root rendering
        this.renderRecursive(form, this.currentData, []);
        this.container.appendChild(form);
    }

    renderAISection() {
        const aiSection = document.createElement('div');
        aiSection.className = 'ai-assistant-section';
        aiSection.innerHTML = `
            <div class="panel-header small" style="margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                <span class="material-icons" style="font-size: 16px; color: var(--accent-cyan);">auto_fix_high</span>
                <span>AI DESIGN ASSISTANT</span>
            </div>
            <div class="ai-input-group">
                <input type="text" id="aiRefineInput" class="editor-input" placeholder="Ej: 'Resumir texto', 'Corregir ortografía'..." style="margin-bottom: 8px;">
                <button id="aiRefineBtn" class="btn-primary full-width" style="height: 30px; font-size: 11px;">
                    <span class="material-icons" style="font-size: 14px;">magic_button</span> REFINAR
                </button>
            </div>
            <div id="aiLoading" style="display: none; color: #888; font-size: 11px; margin-top: 5px; text-align: center;">
                <span class="material-icons spin" style="font-size: 11px;">autorenew</span> Procesando...
            </div>
        `;
        this.container.appendChild(aiSection);

        const btn = aiSection.querySelector('#aiRefineBtn');
        const input = aiSection.querySelector('#aiRefineInput');
        const loading = aiSection.querySelector('#aiLoading');

        btn.onclick = () => {
            const instruction = input.value.trim();
            if (!instruction) return;

            if (this.onAIRefine) {
                loading.style.display = 'block';
                btn.disabled = true;
                this.onAIRefine(instruction).finally(() => {
                    loading.style.display = 'none';
                    btn.disabled = false;
                    input.value = '';
                });
            }
        };
    }

    /**
     * Recursive renderer for JSON data.
     * @param {HTMLElement} parent - Container to append to.
     * @param {Object|Array|String} data - Data to render.
     * @param {Array} path - Key path for updates.
     */
    renderRecursive(parent, data, path) {
        // 1. Handle Objects (Non-Array)
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            Object.keys(data).forEach(key => {
                const value = data[key];
                const currentPath = [...path, key];

                if (typeof value === 'object' && value !== null) {
                    // Section Header for sub-objects/arrays
                    const section = document.createElement('div');
                    section.className = 'control-group';
                    section.style.marginBottom = '15px';

                    const label = document.createElement('label');
                    label.innerText = key.replace(/_/g, ' ');
                    label.style.color = 'var(--accent-cyan)';
                    label.style.borderBottom = '1px solid #222';
                    label.style.paddingBottom = '4px';
                    label.style.marginBottom = '8px';
                    label.style.display = 'block';
                    section.appendChild(label);

                    const contentDiv = document.createElement('div');
                    contentDiv.style.paddingLeft = '10px';
                    contentDiv.style.borderLeft = '1px solid #222';

                    this.renderRecursive(contentDiv, value, currentPath);
                    section.appendChild(contentDiv);
                    parent.appendChild(section);
                } else {
                    // Simple Field
                    this.createField(parent, key, value, currentPath);
                }
            });
        }
        // 2. Handle Arrays (Lists of Objects or Strings)
        else if (Array.isArray(data)) {
            data.forEach((item, index) => {
                const currentPath = [...path, index];

                const itemCard = document.createElement('div');
                itemCard.className = 'array-item-card';
                itemCard.style.background = '#0f0f0f';
                itemCard.style.border = '1px solid #222';
                itemCard.style.borderRadius = '6px';
                itemCard.style.padding = '10px';
                itemCard.style.marginBottom = '10px';
                itemCard.style.position = 'relative';

                // Header with Delete Button
                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.marginBottom = '8px';

                const title = document.createElement('span');
                title.innerText = `#${index + 1}`;
                title.style.fontSize = '10px';
                title.style.color = '#666';
                header.appendChild(title);

                const delBtn = document.createElement('button');
                delBtn.innerHTML = '<span class="material-icons" style="font-size:14px">close</span>';
                delBtn.style.background = 'none';
                delBtn.style.border = 'none';
                delBtn.style.color = '#f44336';
                delBtn.style.cursor = 'pointer';
                delBtn.title = 'Eliminar elemento';
                delBtn.onclick = () => this.deleteItem(path, index);
                header.appendChild(delBtn);

                itemCard.appendChild(header);

                this.renderRecursive(itemCard, item, currentPath);
                parent.appendChild(itemCard);
            });

            // Add Item Button (Optional, but good UX)
            // For now, let's keep it simple as requested: just delete.
        }
    }

    createField(parent, key, value, path) {
        const wrapper = document.createElement('div');
        wrapper.className = 'control-group';
        wrapper.style.marginBottom = '10px';

        const label = document.createElement('label');
        label.innerText = key.replace(/_/g, ' ');
        // If it's an array index, don't show label, the card has #ID
        if (isNaN(key)) wrapper.appendChild(label);

        let input;

        // Input Type Logic
        if (key.includes('ICON')) {
            input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Icon name...';
        }
        else if (String(value).length > 40 || key.includes('DESCRIPTION') || key.includes('CONTENT')) {
            input = document.createElement('textarea');
            input.rows = 3;
            input.className = 'textarea-input'; // Use existing class
        } else {
            input = document.createElement('input');
            input.type = 'text';
        }

        input.className = input.tagName === 'TEXTAREA' ? 'textarea-input' : 'editor-input';
        input.value = value || '';
        input.dataset.path = JSON.stringify(path);

        input.oninput = (e) => {
            this.updateDataByPath(path, e.target.value);
        };

        // Focus Logic for Sync
        input.dataset.key = key;
        input.addEventListener('focus', () => {
            // Dispatch event for visual sync if needed
        });

        wrapper.appendChild(input);
        parent.appendChild(wrapper);
    }

    updateDataByPath(path, newValue) {
        let target = this.currentData;
        for (let i = 0; i < path.length - 1; i++) {
            target = target[path[i]];
        }
        target[path[path.length - 1]] = newValue;

        if (this.onChange) this.onChange(this.currentData);
    }

    deleteItem(path, index) {
        // path points to the Array itself
        let target = this.currentData;
        for (let i = 0; i < path.length; i++) {
            target = target[path[i]];
        }

        if (Array.isArray(target)) {
            target.splice(index, 1);
            if (this.onChange) this.onChange(this.currentData);
            // Re-render immediately to reflect deletion in UI
            this.renderFields(this.currentData);
        }
    }

    focusFieldByValue(text) {
        // Simple implementation for focus sync
        if (!text || !this.container) return;
        // Loop inputs, check values...
        // (Omitted for brevity in this fix to focus on UI structure)
    }
}
