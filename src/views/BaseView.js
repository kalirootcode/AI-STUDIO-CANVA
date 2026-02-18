export class BaseView {
    constructor(id) {
        this.id = id;
        this.element = document.createElement('div');
        this.element.className = `view-container view-${id}`;
        this.isRendered = false;
    }

    render() {
        this.element.innerHTML = `<h1>${this.id} View</h1>`;
        return this.element;
    }

    show() {
        this.element.style.display = 'block'; // or flex depending on layout
    }

    hide() {
        this.element.style.display = 'none';
    }

    async onInit() { }
    async onEnter() { }
    async onLeave() { }
}
