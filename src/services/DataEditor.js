
export class DataEditor {
    constructor(containerId, onChangeCallback) {
        this.container = document.getElementById(containerId);
        this.onChange = onChangeCallback;
        this.currentData = null;
    }

    /**
     * Generates input fields based on the provided data object.
     * @param {Object} data - The JSON data of the slide.
     */
    renderFields(data) {
        this.currentData = JSON.parse(JSON.stringify(data)); // Deep copy
        this.container.innerHTML = '';

        if (!data || Object.keys(data).length === 0) {
            this.container.innerHTML = '<div class="editor-empty">No data parameters available.</div>';
            return;
        }

        const form = document.createElement('div');
        form.className = 'editor-form';

        Object.keys(data).forEach(key => {
            const value = data[key];
            const field = this.createField(key, value);
            form.appendChild(field);
        });

        this.container.appendChild(form);
    }

    createField(key, value) {
        const wrapper = document.createElement('div');
        wrapper.className = 'editor-field-group';

        const label = document.createElement('label');
        label.className = 'editor-label';
        label.innerText = key.replace(/_/g, ' '); // Beautify key (e.g. FLOW_STEPS -> FLOW STEPS)
        wrapper.appendChild(label);

        let input;

        if (Array.isArray(value)) {
            // Handle Arrays (Flow Steps, Lists) - Recursive or Simplified?
            // For now, let's use a simplified JSON textarea for arrays to avoid complexity,
            // or better: a button to edit array items (future improvement).
            // Current approach: JSON string for arrays to ensure strictness, or render sub-fields?
            // "simple" approach for Arrays: 
            input = document.createElement('textarea');
            input.className = 'editor-input editor-textarea-code';
            input.value = JSON.stringify(value, null, 2);
            input.onchange = (e) => {
                try {
                    const newVal = JSON.parse(e.target.value);
                    this.updateData(key, newVal);
                    input.classList.remove('error');
                } catch (err) {
                    input.classList.add('error');
                    console.error("Invalid JSON for array field");
                }
            };
        }
        else if (key === 'ICON' || key.endsWith('_ICON')) {
            // Smart ICON field (maybe a select or just text for now)
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'editor-input';
            input.value = value || '';
            input.placeholder = 'e.g. check, material-symbols:home';
            input.oninput = (e) => this.updateData(key, e.target.value);
        }
        else if (value.length > 50 || key === 'DESCRIPTION' || key === 'SUBTITLE') {
            // Textarea for long text
            input = document.createElement('textarea');
            input.className = 'editor-input';
            input.value = value || '';
            input.rows = 3;
            input.oninput = (e) => this.updateData(key, e.target.value);
        } else {
            // Standard Text Input
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'editor-input';
            input.value = value || '';
            input.oninput = (e) => this.updateData(key, e.target.value);
        }

        // Add focus listener for "Visual Sync" (Roadmap Item 2)
        input.dataset.key = key;
        input.addEventListener('focus', () => {
            // Dispatch event to highlight in preview (future)
            window.dispatchEvent(new CustomEvent('editor-focus', { detail: { key } }));
        });

        wrapper.appendChild(input);
        return wrapper;
    }

    updateData(key, newValue) {
        this.currentData[key] = newValue;
        if (this.onChange) {
            this.onChange(this.currentData);
        }
    }

    /**
     * Tries to find a field that contains the clicked text and focus it.
     * @param {string} text - The text clicked in the preview
     */
    focusFieldByValue(text) {
        if (!text || !this.currentData) return;
        const cleanText = text.trim();
        if (cleanText.length < 2) return;

        // 1. Exact Match
        let matchKey = Object.keys(this.currentData).find(key => {
            const val = this.currentData[key];
            return typeof val === 'string' && val.includes(cleanText);
        });

        // 2. Array Match (if not found)
        if (!matchKey) {
            matchKey = Object.keys(this.currentData).find(key => {
                const val = this.currentData[key];
                if (Array.isArray(val)) {
                    return JSON.stringify(val).includes(cleanText);
                }
                return false;
            });
        }

        if (matchKey) {
            // Find input element
            const input = this.container.querySelector(`[data-key="${matchKey}"]`);
            if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Visual Highlight
                input.classList.add('highlight-flash');
                setTimeout(() => input.classList.remove('highlight-flash'), 1000);
            }
        }
    }
}
