import { BaseView } from './BaseView.js';

export class SettingsView extends BaseView {
    constructor() {
        super('settings');
    }

    render() {
        this.element.innerHTML = `
            <div class="view-content-wrapper">
                <div class="view-header">
                    <h1>⚙️ Configuración</h1>
                    <p>Gestiona tus claves de API y preferencias del sistema.</p>
                </div>
                
                <div class="settings-grid">
                    <!-- API KEYS SECTION -->
                    <div class="settings-card">
                        <div class="card-header">
                            <span class="material-icons">key</span>
                            <h2>API Keys</h2>
                        </div>
                        <div class="card-content">
                            <p class="description">
                                Estas claves se almacenan localmente en tu archivo <code>.env</code>.
                                Nunca se comparten con terceros.
                            </p>
                            
                            <div class="form-group">
                                <label>GEMINI API KEY (Google)</label>
                                <div class="input-with-icon">
                                    <input type="password" id="key-gemini" placeholder="AIwaSy..." class="api-input">
                                    <button class="toggle-visibility" data-target="key-gemini">
                                        <span class="material-icons">visibility</span>
                                    </button>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>OPENAI API KEY (GPT-4)</label>
                                <div class="input-with-icon">
                                    <input type="password" id="key-openai" placeholder="sk-..." class="api-input">
                                    <button class="toggle-visibility" data-target="key-openai">
                                        <span class="material-icons">visibility</span>
                                    </button>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>ANTHROPIC API KEY (Claude)</label>
                                <div class="input-with-icon">
                                    <input type="password" id="key-anthropic" placeholder="sk-ant-..." class="api-input">
                                    <button class="toggle-visibility" data-target="key-anthropic">
                                        <span class="material-icons">visibility</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="actions">
                                <button id="saveKeysBtn" class="btn-primary">
                                    <span class="material-icons">save</span> GUARDAR KEYS
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- SYSTEM PREFERENCES SECTION -->
                    <div class="settings-card">
                        <div class="card-header">
                            <span class="material-icons">tune</span>
                            <h2>Preferencias</h2>
                        </div>
                        <div class="card-content">
                             <div class="form-group">
                                <label>Rol del Sistema (System Prompt)</label>
                                <textarea id="systemPrompt" class="textarea-input tall" placeholder="Eres un experto en ciberseguridad..."></textarea>
                                <p class="hint">Define la personalidad base de la IA generadora.</p>
                            </div>
                            
                             <div class="form-group">
                                <label>Tema de Interfaz</label>
                                <select id="uiTheme" class="select-input">
                                    <option value="cyber">Cyber (Default)</option>
                                    <option value="minimal">Minimal White</option>
                                    <option value="hacker">Hacker Green</option>
                                </select>
                            </div>
                            
                            <div class="actions">
                                <button id="savePrefsBtn" class="btn-secondary">
                                    <span class="material-icons">check</span> APLICAR CAMBIOS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return this.element;
    }

    async onEnter() {
        console.log("SettingsView: onEnter");
        this.loadKeys();
        this.attachListeners();
    }

    async loadKeys() {
        // Load keys from .env via IPC
        try {
            const providers = ['gemini', 'openai', 'anthropic'];
            for (const p of providers) {
                const key = await window.cyberCanvas.getEnvKey(p);
                if (key) {
                    const input = this.element.querySelector(`#key-${p}`);
                    if (input) input.value = key;
                }
            }
        } catch (e) {
            console.error("Error loading keys:", e);
        }
    }

    attachListeners() {
        // Toggle Visibility
        this.element.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.onclick = () => {
                const targetId = btn.dataset.target;
                const input = this.element.querySelector(`#${targetId}`);
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.innerHTML = '<span class="material-icons">visibility_off</span>';
                } else {
                    input.type = 'password';
                    btn.innerHTML = '<span class="material-icons">visibility</span>';
                }
            };
        });

        // Save Keys
        const saveBtn = this.element.querySelector('#saveKeysBtn');
        if (saveBtn) {
            saveBtn.onclick = async () => {
                saveBtn.innerHTML = '<span class="material-icons spin">autorenew</span> GUARDANDO...';
                saveBtn.disabled = true;

                try {
                    const providers = ['gemini', 'openai', 'anthropic'];
                    for (const p of providers) {
                        const val = this.element.querySelector(`#key-${p}`).value.trim();
                        if (val) {
                            await window.cyberCanvas.saveEnvKey({ provider: p, key: val });
                        }
                    }
                    setTimeout(() => {
                        saveBtn.innerHTML = '<span class="material-icons">check</span> GUARDADO';
                        saveBtn.disabled = false;
                        setTimeout(() => {
                            saveBtn.innerHTML = '<span class="material-icons">save</span> GUARDAR KEYS';
                        }, 2000);
                    }, 500);
                } catch (e) {
                    console.error(e);
                    alert("Error guardando keys: " + e.message);
                    saveBtn.disabled = false;
                }
            };
        }

        // Save Prefs
        // TODO: Implement preferences storage (maybe electron-store)
    }
}
