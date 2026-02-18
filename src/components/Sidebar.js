export class Sidebar {
    constructor(viewManager) {
        this.viewManager = viewManager;
        this.element = document.createElement('aside');
        this.element.className = 'app-sidebar';
        this.items = [
            { id: 'studio', icon: 'palette', label: 'Studio' },
            { id: 'templates', icon: 'grid_view', label: 'Templates' },
            { id: 'settings', icon: 'settings', label: 'Settings' }
        ];

        // Listen for external navigation changes
        document.addEventListener('view-changed', (e) => this.setActive(e.detail.viewId));
    }

    render() {
        this.element.innerHTML = `
            <div class="sidebar-logo">
                <img src="../assets/logo.png" alt="KR" />
            </div>
            <nav class="sidebar-nav">
                ${this.items.map(item => `
                    <div class="nav-item" data-id="${item.id}" title="${item.label}">
                        <span class="material-icons">${item.icon}</span>
                    </div>
                `).join('')}
            </nav>
            <div class="sidebar-footer">
                <div class="nav-item" id="user-profile">
                    <span class="material-icons">account_circle</span>
                </div>
            </div>
        `;

        // Bind events
        this.element.querySelectorAll('.nav-item').forEach(el => {
            const id = el.dataset.id;
            if (id) {
                el.addEventListener('click', () => {
                    this.viewManager.navigate(id);
                    this.setActive(id); // Optimistic update
                });
            }
        });

        return this.element;
    }

    setActive(viewId) {
        this.element.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === viewId);
        });
    }
}
