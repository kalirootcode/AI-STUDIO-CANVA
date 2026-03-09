export class CanvasToPDF {
    /**
     * @param {Array<Object>} pages - Array of Scene Graph objects
     * @param {Object} options - PDF generation options
     */
    static async generate(pages, options = {}) {
        const width = options.format ? options.format[0] : 1080;
        const height = options.format ? options.format[1] : 1920;

        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error("jsPDF library not loaded. Please ensure it is included in index.html.");
        }
        const jsPDF = window.jspdf.jsPDF;

        const doc = new jsPDF({
            orientation: options.orientation || 'portrait',
            unit: 'px',
            format: [width, height],
            compress: true
        });

        doc.setProperties({
            title: options.title || 'Cyber-Canvas Export',
            creator: 'Cyber-Canvas Studio v2'
        });

        // Use a dedicated offscreen renderer for exporting clean PNGs.
        // If an isolated renderer is passed (e.g. from EbookView), use its image cache
        // but always create a fresh offscreen renderer to avoid corrupting the live preview.
        const exportRenderer = window.createRenderer(width, height, options.theme || 'cyber');
        if (options._ebRenderer?._imageCache) {
            exportRenderer._imageCache = new Map(options._ebRenderer._imageCache);
        } else if (window.app?.canvasRenderer?._imageCache) {
            exportRenderer._imageCache = new Map(window.app.canvasRenderer._imageCache);
        }

        for (let i = 0; i < pages.length; i++) {
            if (i > 0) doc.addPage([width, height]);

            const sceneGraph = pages[i];

            // 0. Pre-load images to ensure they render on the offscreen canvas
            const preloadLayers = sceneGraph.layers || [];
            for (const layer of preloadLayers) {
                if (layer.src) await exportRenderer.loadImage(layer.src).catch(() => null);
                if (layer.imageSrc) await exportRenderer.loadImage(layer.imageSrc).catch(() => null);
            }

            // 1. Render the entire slide visually to a Data URL
            await exportRenderer.render(sceneGraph, { skipLayout: true });

            // Wait for internal paints
            await new Promise(r => setTimeout(r, 50));
            const dataURL = exportRenderer.exportDataURL('image/jpeg', 0.95);

            // 2. Stamp the flat image onto the PDF page
            doc.addImage(dataURL, 'JPEG', 0, 0, width, height);

            // 3. Scan the JSON SceneGraph for interactive layers to overlay Vector Links
            const layers = sceneGraph.layers || [];
            for (const layer of layers) {
                const linkUrl = layer.link || layer.url;
                if (linkUrl) {
                    // Default to reasonable hitboxes if size is missing (e.g. text layers)
                    const x = layer.x || 0;
                    const y = layer.y || 0;
                    const w = layer.width || 300;
                    const h = layer.height || (layer.type === 'text' ? (layer.fontSize || 40) * 1.5 : 80);

                    // doc.link draws an invisible clickable region
                    doc.link(x, y, w, h, { url: linkUrl });

                    // Optional: Draw a subtle vector underline indicating interactivity
                    // doc.setDrawColor(0, 217, 255);
                    // doc.setLineWidth(2);
                    // doc.line(x, y + h + 5, x + w, y + h + 5);
                }
            }
        }

        // Clean up
        exportRenderer.canvas.remove();
        exportRenderer._imageCache.clear();

        return doc;
    }
}
