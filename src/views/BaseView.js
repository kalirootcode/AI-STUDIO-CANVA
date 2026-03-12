/**
 * BaseView.js — Base class for all application views.
 *
 * Provides:
 *  · Consistent DOM creation and lifecycle (render, show, hide)
 *  · onInit / onEnter / onLeave async lifecycle hooks
 *  · Simple _on / _off event helper (auto-cleanup on destroy)
 *  · Error boundary: uncaught errors in lifecycle show a friendly fallback
 *  · isActive flag so views can guard async work
 */

export class BaseView {
    constructor(id) {
        this.id      = id;
        this.element = document.createElement('div');
        this.element.className = `view-container view-${id}`;
        this.element.dataset.viewId = id;

        this.isRendered = false;
        this.isActive   = false;

        // Internal event listener registry for clean teardown
        this._listeners = [];
    }

    // ─── RENDER ──────────────────────────────────────────────────────────
    render() {
        this.element.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;
                        height:100%;color:#444;font-family:monospace;font-size:12px;">
                ${this.id.toUpperCase()} VIEW
            </div>`;
        this.isRendered = true;
        return this.element;
    }

    // ─── VISIBILITY ──────────────────────────────────────────────────────
    show() {
        this.element.style.display = '';
        this.isActive = true;
    }

    hide() {
        this.element.style.display = 'none';
        this.isActive = false;
    }

    // ─── LIFECYCLE HOOKS ─────────────────────────────────────────────────
    async onInit()    {}
    async onEnter()   {}
    async onLeave()   {}
    async onDestroy() { this._removeAllListeners(); }

    // ─── SAFE LIFECYCLE RUNNER ───────────────────────────────────────────
    async _runLifecycle(methodName) {
        try {
            await this[methodName]();
        } catch (err) {
            console.error(`[${this.id}View] Error in ${methodName}:`, err);
            this._showError(err);
        }
    }

    _showError(err) {
        const errEl = this.element.querySelector('.view-error-banner');
        if (errEl) errEl.remove();
        const banner = document.createElement('div');
        banner.className = 'view-error-banner';
        banner.style.cssText = `
            position:absolute;bottom:0;left:0;right:0;
            background:rgba(255,51,102,0.15);border-top:1px solid #FF3366;
            color:#FF3366;font-family:monospace;font-size:10px;
            padding:6px 12px;z-index:9999;pointer-events:none;`;
        banner.textContent = `\u26A0 [${this.id}] ${err.message}`;
        this.element.style.position = this.element.style.position || 'relative';
        this.element.appendChild(banner);
        setTimeout(() => banner.remove(), 5000);
    }

    // ─── DOM HELPERS ─────────────────────────────────────────────────────
    _qs(selector)  { return this.element.querySelector(selector); }
    _qsa(selector) { return this.element.querySelectorAll(selector); }

    // ─── EVENT HELPERS (auto-cleanup) ────────────────────────────────────
    _on(target, event, handler, options) {
        if (!target) return;
        target.addEventListener(event, handler, options);
        this._listeners.push({ target, event, handler, options });
    }

    _off(target, event, handler) {
        if (!target) return;
        target.removeEventListener(event, handler);
        this._listeners = this._listeners.filter(
            l => !(l.target === target && l.event === event && l.handler === handler)
        );
    }

    _removeAllListeners() {
        this._listeners.forEach(({ target, event, handler, options }) => {
            try { target.removeEventListener(event, handler, options); } catch (_) {}
        });
        this._listeners = [];
    }

    // ─── STATUS HELPER ───────────────────────────────────────────────────
    _setStatus(text, active = false) {
        if (window.app?.setStatus) window.app.setStatus(text, active);
    }
}
