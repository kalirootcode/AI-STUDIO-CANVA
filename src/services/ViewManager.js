export class ViewManager {
    constructor() {
        this.views = {};
        this.currentViewId = null;
        this.container = document.getElementById('main-view-container');
    }

    register(viewId, viewInstance) {
        this.views[viewId] = viewInstance;
    }

    async navigate(viewId) {
        if (this.currentViewId === viewId) return;

        // Hide current
        if (this.currentViewId && this.views[this.currentViewId]) {
            const currentView = this.views[this.currentViewId];
            if (currentView.onLeave) await currentView.onLeave();
            currentView.hide();
        }

        // Show new
        if (this.views[viewId]) {
            const nextView = this.views[viewId];
            // Render if first time
            if (!nextView.isRendered) {
                this.container.appendChild(nextView.render());
                nextView.isRendered = true;
                if (nextView.onInit) await nextView.onInit();
            }

            nextView.show();
            if (nextView.onEnter) await nextView.onEnter();

            this.currentViewId = viewId;

            // Update Sidebar UI
            document.dispatchEvent(new CustomEvent('view-changed', { detail: { viewId } }));
        } else {
            console.error(`View ${viewId} not found`);
        }
    }
}
