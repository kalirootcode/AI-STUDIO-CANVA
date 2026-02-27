/**
 * Engine Index — Entry Point
 * 
 * Loads and initializes all engine components.
 * Usage: <script src="engine/index.js"></script>
 */

// Import order matters — dependencies first
// In Electron renderer, these are loaded via <script> tags
// This file just documents the load order.

/*
  Load Order:
  1. LayoutConstraints.js (no dependencies — constraint definitions)
  2. SafeZoneManager.js   (no dependencies — safe zone geometry)
  3. TextFitter.js        (depends on LayoutConstraints)
  4. TextEngine.js        (depends on TextFitter)
  5. EffectsEngine.js     (no dependencies)
  6. BrandingSystem.js    (no dependencies)
  7. CanvasRenderer.js    (depends on TextEngine, EffectsEngine, SafeZoneManager)
*/

/**
 * Create a ready-to-use CanvasRenderer with all systems wired.
 */
function createRenderer(width = 1080, height = 1920, themeName = 'cyber') {
    const renderer = new CanvasRenderer(width, height);
    renderer.brandingSystem = window.brandingInstance;
    window.brandingInstance.setTheme(themeName);
    return renderer;
}

/**
 * Quick render function — takes a scene graph JSON and returns a canvas.
 */
async function quickRender(sceneGraph) {
    const renderer = createRenderer(
        sceneGraph.canvas?.width || 1080,
        sceneGraph.canvas?.height || 1920,
        sceneGraph.theme || 'cyber'
    );

    // Apply theme tokens
    const themed = renderer.brandingSystem.applyTheme(sceneGraph, sceneGraph.theme);

    await renderer.render(themed);
    return renderer;
}

if (typeof module !== 'undefined') {
    module.exports = { createRenderer, quickRender };
} else {
    window.createRenderer = createRenderer;
    window.quickRender = quickRender;
}
