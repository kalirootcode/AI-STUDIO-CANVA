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

                    <!-- ── API KEYS ─────────────────────────────────────── -->
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

                            ${['gemini','openai','anthropic'].map(p => `
                            <div class="form-group">
                                <label>${p === 'gemini' ? 'GEMINI API KEY (Google)' : p === 'openai' ? 'OPENAI API KEY (GPT-4)' : 'ANTHROPIC API KEY (Claude)'}</label>
                                <div class="input-with-icon">
                                    <input type="password" id="key-${p}"
                                        placeholder="${p === 'gemini' ? 'AIza...' : p === 'openai' ? 'sk-...' : 'sk-ant-...'}"
                                        class="api-input" autocomplete="new-password" spellcheck="false">
                                    <button class="toggle-visibility" data-target="key-${p}" type="button" title="Mostrar/Ocultar">
                                        <span class="material-icons">visibility</span>
                                    </button>
                                </div>
                            </div>
                            `).join('')}

                            <div class="actions">
                                <button id="saveKeysBtn" class="btn-primary" type="button">
                                    <span class="material-icons">save</span> GUARDAR KEYS
                                </button>
                                <span id="saveKeysStatus" style="font-size:10px;color:#444;font-family:monospace;margin-left:10px;"></span>
                            </div>
                        </div>
                    </div>

                    <!-- ── PREFERENCES ──────────────────────────────────── -->
                    <div class="settings-card">
                        <div class="card-header">
                            <span class="material-icons">tune</span>
                            <h2>Preferencias</h2>
                        </div>
                        <div class="card-content">
                            <div class="form-group">
                                <label>Rol del Sistema (System Prompt)</label>
                                <textarea id="systemPrompt" class="textarea-input tall"
                                    placeholder="Eres un experto en ciberseguridad..."></textarea>
                                <p class="hint">Define la personalidad base de la IA generadora.</p>
                            </div>

                            <div class="form-group">
                                <label>Tema Visual por Defecto</label>
                                <select id="uiTheme" class="select-input">
                                    <option value="cyber">⚡ Cyber (Default)</option>
                                    <option value="hacker">💚 Hacker Green</option>
                                    <option value="minimal">🔵 Minimal Blue</option>
                                    <option value="RED_TEAM">🔴 Red Team</option>
                                    <option value="BLUE_TEAM">🔵 Blue Team</option>
                                    <option value="OSINT">🟣 OSINT</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Modelo IA por Defecto</label>
                                <select id="defaultAiModel" class="select-input">
                                    <option value="gemini">✨ Google Gemini</option>
                                    <option value="openai">🧠 OpenAI GPT-4</option>
                                    <option value="anthropic">🤖 Claude (Anthropic)</option>
                                </select>
                            </div>

                            <div class="actions">
                                <button id="savePrefsBtn" class="btn-secondary" type="button">
                                    <span class="material-icons">check</span> APLICAR CAMBIOS
                                </button>
                                <span id="savePrefsStatus" style="font-size:10px;color:#444;font-family:monospace;margin-left:10px;"></span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;
        this.isRendered = true;
        return this.element;
    }

    async onEnter() {
        await this._loadKeys();
        this._loadPrefs();
        this._attachListeners();
    }

    async onLeave() {
        this._removeAllListeners();
    }

    // ─── LOAD ────────────────────────────────────────────────────────────
    async _loadKeys() {
        if (!window.cyberCanvas?.getEnvKey) return;
        try {
            for (const p of ['gemini', 'openai', 'anthropic']) {
                const key = await window.cyberCanvas.getEnvKey(p);
                if (key) {
                    const input = this._qs(`#key-${p}`);
                    if (input) input.value = key;
                }
            }
        } catch (e) {
            console.error('[SettingsView] Error loading keys:', e);
        }
    }

    _loadPrefs() {
        try {
            const prefs = JSON.parse(localStorage.getItem('cybercanvas_prefs') || '{}');
            const themeEl = this._qs('#uiTheme');
            const modelEl = this._qs('#defaultAiModel');
            const sysEl   = this._qs('#systemPrompt');
            if (themeEl && prefs.theme) themeEl.value = prefs.theme;
            if (modelEl && prefs.defaultModel) modelEl.value = prefs.defaultModel;
            if (sysEl   && prefs.systemPrompt) sysEl.value   = prefs.systemPrompt;
        } catch (_) {}
    }

    // ─── LISTENERS ───────────────────────────────────────────────────────
    _attachListeners() {
        // Toggle visibility buttons
        this._qsa('.toggle-visibility').forEach(btn => {
            this._on(btn, 'click', () => {
                const targetId = btn.dataset.target;
                const input = this._qs(`#${targetId}`);
                if (!input) return;
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                btn.querySelector('.material-icons').textContent = show ? 'visibility_off' : 'visibility';
            });
        });

        // Save API keys
        const saveBtn = this._qs('#saveKeysBtn');
        if (saveBtn) {
            this._on(saveBtn, 'click', async () => {
                saveBtn.innerHTML = '<span class="material-icons cet-spin">autorenew</span> GUARDANDO...';
                saveBtn.disabled = true;
                const statusEl = this._qs('#saveKeysStatus');

                try {
                    for (const p of ['gemini', 'openai', 'anthropic']) {
                        const val = this._qs(`#key-${p}`)?.value.trim();
                        if (val && window.cyberCanvas?.saveEnvKey) {
                            await window.cyberCanvas.saveEnvKey({ provider: p, key: val });
                        }
                    }
                    if (statusEl) statusEl.textContent = '✓ Guardado';
                    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
                } catch (e) {
                    console.error('[SettingsView] Save keys error:', e);
                    if (statusEl) statusEl.textContent = '✗ Error: ' + e.message;
                } finally {
                    saveBtn.innerHTML = '<span class="material-icons">save</span> GUARDAR KEYS';
                    saveBtn.disabled = false;
                }
            });
        }

        // Save preferences
        const prefsBtn = this._qs('#savePrefsBtn');
        if (prefsBtn) {
            this._on(prefsBtn, 'click', () => {
                const prefs = {
                    theme:        this._qs('#uiTheme')?.value      || 'cyber',
                    defaultModel: this._qs('#defaultAiModel')?.value || 'gemini',
                    systemPrompt: this._qs('#systemPrompt')?.value   || '',
                };

                try {
                    localStorage.setItem('cybercanvas_prefs', JSON.stringify(prefs));
                } catch (_) {}

                // Apply theme immediately via BrandingSystem
                if (window.brandingInstance?.setTheme) {
                    window.brandingInstance.setTheme(prefs.theme);
                }
                // Sync toolbar if active
                if (window.app?._editorToolbar?._applyTheme) {
                    window.app._editorToolbar._applyTheme(prefs.theme);
                }
                // Sync AI model selector in StudioView if present
                const modelEl = document.getElementById('aiProvider');
                if (modelEl && prefs.defaultModel) modelEl.value = prefs.defaultModel;

                const statusEl = this._qs('#savePrefsStatus');
                if (statusEl) {
                    statusEl.textContent = '✓ Aplicado';
                    setTimeout(() => { statusEl.textContent = ''; }, 3000);
                }
            });
        }
    }
}
