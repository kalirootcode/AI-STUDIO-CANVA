/**
 * CanvasEditor.js — Interactive Visual Editor for Canvas Engine AI
 * 
 * Provides Canva-like editing: select, drag, resize, and inline-edit
 * any element in a rendered Canvas slide. Uses a two-canvas stack:
 * 1. Render canvas (from CanvasRenderer) — the actual image
 * 2. Overlay canvas — transparent, shows selection handles & bounding boxes
 *
 * The Scene Graph JSON is the single source of truth. All edits modify
 * the scene graph, then trigger a full re-render.
 */

class CanvasEditor {
    constructor(container, renderer) {
        this.container = container;
        this.renderer = renderer;
        this.sceneGraph = null;
        this.editableLayers = [];  // Layers that can be interacted with

        // Selection state
        this.selectedIdx = -1;
        this.hoveredIdx = -1;

        // Interaction state
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;  // 'nw','n','ne','e','se','s','sw','w'
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartLayerX = 0;
        this.dragStartLayerY = 0;
        this.dragStartLayerW = 0;
        this.dragStartLayerH = 0;

        // Scale factor (container may be smaller than 1080x1920)
        this.scale = 1;

        // Overlay canvas
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');

        // Text editing
        this.textEditor = null;
        this.editingIdx = -1;

        // Callback for external listeners
        this.onChange = null;

        this._setup();
    }

    /**
     * Reattach the editor to a new container element.
     * Useful when the preview UI regenerates the DOM node.
     */
    attachCanvas(container) {
        if (!container) return;
        this.container = container;
        this._setup();
    }

    /**
     * Setup the editor DOM and event listeners.
     */
    _setup() {
        // Clear container
        this.container.innerHTML = '';

        // Wrapper for canvas stacking — will be CSS-scaled to fit container
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'canvas-editor-wrapper';
        // Use absolute positioning so the scaled un-transformed DOM size doesn't push Flexbox out
        this.wrapper.style.cssText = 'position:absolute;transform-origin:top left;';

        // Render canvas (from renderer) — always at native resolution
        const renderCanvas = this.renderer.getCanvas();
        renderCanvas.style.cssText = 'display:block;';
        this.wrapper.appendChild(renderCanvas);

        // Overlay canvas (stacked on top, same native resolution)
        this.overlayCanvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:auto;cursor:default;';
        this.wrapper.appendChild(this.overlayCanvas);

        this.container.appendChild(this.wrapper);

        // Mouse events on overlay
        this.overlayCanvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.overlayCanvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.overlayCanvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
        this.overlayCanvas.addEventListener('dblclick', (e) => this._onDoubleClick(e));

        // Keyboard
        document.addEventListener('keydown', (e) => this._onKeyDown(e));

        // Resize observer to update scale when container resizes (with loop guard)
        this._lastContainerWidth = 0;
        this._lastContainerHeight = 0;
        this._resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const w = Math.round(entry.contentRect.width);
            const h = Math.round(entry.contentRect.height);
            // Only refit if container actually changed size (prevents infinite loop)
            if (w !== this._lastContainerWidth || h !== this._lastContainerHeight) {
                this._lastContainerWidth = w;
                this._lastContainerHeight = h;
                this._fitToContainer();
            }
        });
        this._resizeObserver.observe(this.container);
    }

    /**
     * Fit the canvas wrapper into the container using CSS transform scale.
     * This mimics the iframe zoom behavior from StudioView.updatePreview().
     */
    _fitToContainer() {
        const containerRect = this.container.getBoundingClientRect();
        const availWidth = containerRect.width - 20;
        const availHeight = containerRect.height - 20;

        if (availWidth <= 0 || availHeight <= 0) return;

        const canvasW = this.renderer.width;
        const canvasH = this.renderer.height;
        const aspectRatio = canvasW / canvasH;

        let displayW, displayH;
        if (availWidth / availHeight > aspectRatio) {
            displayH = availHeight;
            displayW = displayH * aspectRatio;
        } else {
            displayW = availWidth;
            displayH = displayW / aspectRatio;
        }

        // CSS scale factor
        this.displayScale = displayW / canvasW;

        // Apply CSS transform to scale the wrapper
        this.wrapper.style.transform = 'scale(' + this.displayScale + ')';
        this.wrapper.style.transformOrigin = 'top left';

        // Set wrapper dimensions so container can center it
        this.wrapper.style.width = canvasW + 'px';
        this.wrapper.style.height = canvasH + 'px';

        // Center the wrapper in the container using absolute offsets
        this.container.style.position = 'relative'; // Ensure parent anchors absolute child
        const offsetX = Math.max(0, (containerRect.width - displayW) / 2);
        const offsetY = Math.max(0, (containerRect.height - displayH) / 2);
        this.wrapper.style.left = offsetX + 'px';
        this.wrapper.style.top = offsetY + 'px';

        // Clear any old margins
        this.wrapper.style.marginLeft = '0px';
        this.wrapper.style.marginTop = '0px';

        // Update scale for mouse coordinate mapping
        this.scale = 1 / this.displayScale;
    }

    /**
     * Helper to flatten complex components into base primitives for independent editing.
     * Normalizes type names and extracts nested text from ALL widget types.
     */
    _flattenSceneGraph(graph, bounds = []) {
        if (!graph || !graph.layers) return false;
        const newLayers = [];
        let flattened = false;

        for (let i = 0; i < graph.layers.length; i++) {
            const layer = graph.layers[i];

            if (!layer.id) layer.id = 'layer_' + Math.random().toString(36).substr(2, 9);
            const parentId = layer.id;
            const startLen = newLayers.length;

            newLayers.push(layer);

            // Ignore background
            if (layer.type === 'background') continue;

            // Normalize the type to lowercase for consistent matching
            const t = (layer.type || '').toLowerCase();

            const bound = bounds.find(b => b.layerIndex === i);
            const x = bound ? bound.x : (layer.x || 0);
            const y = bound ? bound.y : (layer.y || 0);
            const w = bound ? bound.width : (layer.width || 200);
            const h = bound ? bound.height : (layer.height || 60);

            // ─── RECT (Cards) ───
            if (t === 'rect' && layer.title) {
                newLayers.push({
                    type: 'text',
                    content: layer.title,
                    x: x + 24,
                    y: y + 46,
                    font: { size: 36, weight: 700, family: 'BlackOpsOne' },
                    color: layer.accentColor || '#00D9FF'
                });
                delete layer.title;
            }

            // ─── WARNINGBOX (Alerts / Tips / Danger) ───
            if (t === 'warningbox') {
                if (layer.title) {
                    newLayers.push({
                        type: 'text',
                        content: layer.title,
                        x: x + 140,
                        y: y + 30,
                        font: { size: 42, weight: 900, family: 'BlackOpsOne' },
                        color: layer.style === 'danger' ? '#FF3366' : (layer.style === 'success' ? '#00FF88' : (layer.style === 'info' ? '#00D9FF' : '#FF9500'))
                    });
                    delete layer.title;
                }
                if (layer.message) {
                    newLayers.push({
                        type: 'text',
                        content: layer.message,
                        x: x + 140,
                        y: y + 90,
                        width: w - 170,
                        font: { size: 34, weight: 700, family: 'MPLUS Code Latin' },
                        color: '#ffffff'
                    });
                    delete layer.message;
                }
            }

            // ─── BARCHART (Statistics) ───
            if (t === 'barchart' && layer.title) {
                newLayers.push({
                    type: 'text',
                    content: layer.title,
                    x: x,
                    y: y,
                    font: { size: 36, weight: 800, family: 'BlackOpsOne' },
                    color: '#ffffff'
                });
                delete layer.title;
            }

            // ─── CHECKLIST (Interactive Tasks) ───
            if (t === 'checklist' && layer.items) {
                let currentY = 0;
                const boxSize = 36;
                const gap = 24;
                for (let j = 0; j < layer.items.length; j++) {
                    const item = layer.items[j];
                    if (item.text) {
                        newLayers.push({
                            type: 'text',
                            content: item.text,
                            x: x + boxSize + gap,
                            y: y + currentY - 4,
                            font: { size: 38, weight: 700, family: 'MPLUS Code Latin' },
                            color: item.status === 'done' ? '#888888' : (item.status === 'active' ? '#ffffff' : '#cccccc')
                        });
                        delete layer.items[j].text;
                    }
                    currentY += boxSize + 30;
                }
            }

            // ─── GRIDBOX (Matrices / Pros vs Cons) ───
            if (t === 'gridbox' && layer.cells) {
                const cols = layer.columns || 2;
                const gap = 20;
                const colWidth = (w - (gap * (cols - 1))) / cols;
                const numRows = Math.ceil((layer.cells || []).length / cols);

                // Dynamic Height Calculation: find max height required across all cells
                let maxReqHeight = 150;
                const tempCtx = this.renderer ? this.renderer.ctx : document.createElement('canvas').getContext('2d');
                tempCtx.font = '600 30px "MPLUS Code Latin"';
                (layer.cells || []).forEach(cell => {
                    const words = (cell.text || '').split(' ');
                    let tLine = '';
                    let lines = 1;
                    for (let w = 0; w < words.length; w++) {
                        const testLine = tLine + words[w] + ' ';
                        const metrics = tempCtx.measureText(testLine);
                        if (metrics.width > colWidth - 40 && w > 0) {
                            lines++;
                            tLine = words[w] + ' ';
                        } else {
                            tLine = testLine;
                        }
                    }
                    const reqH = 120 + (lines * 40) + 30;
                    if (reqH > maxReqHeight) maxReqHeight = reqH;
                });

                const baseHeight = (layer._userResized && layer.height) ? Math.max(100, (layer.height - gap * (numRows - 1)) / numRows) : maxReqHeight;
                let curX = 0;
                let curY = 0;

                for (let j = 0; j < layer.cells.length; j++) {
                    if (j > 0 && j % cols === 0) { curX = 0; curY += baseHeight + gap; }
                    const cell = layer.cells[j];

                    if (cell.title) {
                        newLayers.push({
                            type: 'text', content: cell.title,
                            x: x + curX + colWidth / 2, y: y + curY + 40,
                            align: 'center',
                            width: colWidth - 40,
                            font: { size: 36, weight: 900, family: 'BlackOpsOne' },
                            color: '#ffffff'
                        });
                        delete layer.cells[j].title;
                    }
                    if (cell.text) {
                        newLayers.push({
                            type: 'text', content: cell.text,
                            x: x + curX + colWidth / 2, y: y + curY + 120,
                            width: colWidth - 40,
                            align: 'center',
                            font: { size: 30, weight: 600, family: 'MPLUS Code Latin' },
                            color: '#cccccc'
                        });
                        delete layer.cells[j].text;
                    }
                    curX += colWidth + gap;
                }
            }

            // ─── ATTACKFLOW (Kill Chain) ───
            if (t === 'attackflow' && layer.stages) {
                const boxH = 120;
                const gap = 60;
                let curY = 0;
                for (let j = 0; j < layer.stages.length; j++) {
                    const stage = layer.stages[j];
                    if (stage.title) {
                        newLayers.push({
                            type: 'text', content: stage.title,
                            x: x + 120, y: y + curY + boxH / 2 - 15,
                            font: { size: 38, weight: 800, family: 'MPLUS Code Latin' },
                            color: '#ffffff'
                        });
                        delete layer.stages[j].title;
                    }
                    if (stage.desc) {
                        newLayers.push({
                            type: 'text', content: stage.desc,
                            x: x + 120, y: y + curY + boxH / 2 + 25,
                            font: { size: 26, weight: 500, family: 'MPLUS Code Latin' },
                            color: '#999999'
                        });
                        delete layer.stages[j].desc;
                    }
                    curY += boxH;
                    if (j < layer.stages.length - 1) curY += gap;
                }
            }

            // ─── ARCHITECTUREDIAG (Stacked Servers) ───
            if (t === 'architecturediag' && layer.layers) {
                let curY = 0;
                for (let j = 0; j < layer.layers.length; j++) {
                    const ld = layer.layers[j];
                    const boxW = w - (j * 60);
                    const boxX = (w - boxW) / 2;
                    const boxH = 160;

                    if (ld.name) {
                        newLayers.push({
                            type: 'text', content: ld.name,
                            x: x + boxX + 120, y: y + curY + boxH / 2,
                            font: { size: 42, weight: 900, family: 'BlackOpsOne' },
                            color: '#ffffff'
                        });
                        delete layer.layers[j].name;
                    }
                    if (ld.tech) {
                        newLayers.push({
                            type: 'text', content: ld.tech,
                            x: x + boxX + boxW - 30, y: y + curY + boxH - 25,
                            align: 'right',
                            font: { size: 24, weight: 600, family: 'MPLUS Code Latin' },
                            color: '#888888'
                        });
                        delete layer.layers[j].tech;
                    }
                    curY += boxH + 30;
                }
            }

            // ─── TOOLGRID (Kali Arsenal) ───
            if (t === 'toolgrid' && layer.tools) {
                const cols = layer.tools.length > 4 ? 3 : 2;
                const gap = 24;
                const colWidth = (w - (gap * (cols - 1))) / cols;
                const boxH = 150;
                let curX = 0;
                let curY = 0;

                for (let j = 0; j < layer.tools.length; j++) {
                    if (j > 0 && j % cols === 0) { curX = 0; curY += boxH + gap; }
                    const tool = layer.tools[j];

                    if (tool.name) {
                        newLayers.push({
                            type: 'text', content: tool.name,
                            x: x + curX + 35, y: y + curY + 95,
                            font: { size: 38, weight: 900, family: 'BlackOpsOne' },
                            color: '#ffffff'
                        });
                        delete layer.tools[j].name;
                    }
                    if (tool.category) {
                        newLayers.push({
                            type: 'text', content: tool.category.toUpperCase(),
                            x: x + curX + 35, y: y + curY + 35,
                            font: { size: 20, weight: 600, family: 'MPLUS Code Latin' },
                            color: '#888888'
                        });
                        delete layer.tools[j].category;
                    }
                    curX += colWidth + gap;
                }
            }

            // ─── DIRECTORYTREE (File System) ───
            if (t === 'directorytree') {
                if (layer.root) {
                    newLayers.push({
                        type: 'text', content: layer.root,
                        x: x + 60, y: y + 32,
                        font: { size: 32, weight: 800, family: 'MPLUS Code Latin' },
                        color: '#00D9FF'
                    });
                    delete layer.root;
                }
                if (layer.items) {
                    let curY = 90;
                    const indentX = 40;
                    for (let j = 0; j < layer.items.length; j++) {
                        const item = layer.items[j];
                        const depth = item.depth || 1;
                        const px = depth * indentX;
                        if (item.path) {
                            newLayers.push({
                                type: 'text', content: item.path,
                                x: x + px + 55, y: y + curY + 2,
                                font: { size: 28, weight: item.isDir ? 700 : 500, family: 'MPLUS Code Latin' },
                                color: '#ffffff'
                            });
                            delete layer.items[j].path;
                        }
                        curY += 50;
                    }
                }
            }

            // ─── STATBAR (Label + Progress) ───
            if (t === 'statbar' && layer.label) {
                newLayers.push({
                    type: 'text', content: layer.label,
                    x: x, y: y,
                    font: { size: 42, weight: 700, family: 'MPLUS Code Latin' },
                    color: '#ffffff'
                });
                delete layer.label;
            }

            // ─── BULLETLIST (Bullet Items) ───
            if (t === 'bulletlist' && layer.items) {
                const font = layer.font || { size: 40, weight: 400, family: 'MPLUS Code Latin' };
                const fontSize = font.size || 40;
                const iconSize = fontSize * 0.9;
                const indent = Math.round(iconSize + 15);
                const spacing = layer.spacing || 20;
                let curY = 0;

                for (let j = 0; j < layer.items.length; j++) {
                    const item = layer.items[j];
                    if (item) {
                        const itemW = w - indent;
                        const textDef = {
                            type: 'text', content: item,
                            x: x + indent, y: y + curY,
                            width: itemW,
                            lineHeight: 1.4,
                            font: font,
                            color: layer.color || '#f0f0f0'
                        };
                        newLayers.push(textDef);

                        let itemH = fontSize * 1.5; // fallback
                        if (this.renderer && this.renderer.textEngine) {
                            itemH = this.renderer.textEngine.measureTextBlockHeight(textDef);
                        }
                        curY += itemH + spacing;
                    }
                }
                // Keep bullets but remove items text (renderer will skip text if items are empty strings)
                layer.items = layer.items.map(() => '');
            }

            // ─── NODEGRAPH (Network Topology) — EXPLOSION ───
            if (t === 'nodegraph' && layer.nodes && !layer._exploded) {
                layer._exploded = true; // Guard against re-explosion on subsequent render passes
                const nodeRadius = 45;
                const groupId = '_ng_' + Date.now() + '_' + i; // Unique group ID for this graph

                // 1. Calculate the exact same radial/grid layout as CanvasRenderer
                const cx = x + w / 2;
                const cy = y + h / 2;
                const nodeMap = {};
                const unpositionedNodes = layer.nodes.filter(n => typeof n.x === 'undefined' || typeof n.y === 'undefined');
                const totalUnpositioned = unpositionedNodes.length;
                let autoIdx = 0;

                layer.nodes.forEach((n, idx) => {
                    let px, py;
                    if (n.x === undefined || n.y === undefined) {
                        if (totalUnpositioned === 1) {
                            px = cx; py = cy;
                        } else {
                            const angle = (Math.PI * 2 * autoIdx) / totalUnpositioned - Math.PI / 2;
                            const r = Math.min(w, h) * 0.35;
                            px = cx + r * Math.cos(angle);
                            py = cy + r * Math.sin(angle);
                        }
                        autoIdx++;
                    } else {
                        px = x + n.x * w;
                        py = y + n.y * h;
                    }
                    const safeIcon = (n.icon && n.icon !== '???') ? n.icon : 'dns';
                    nodeMap[n.id] = { px, py, label: n.label, icon: safeIcon, hexId: 'hex_' + n.id + '_' + Date.now() + idx };
                });

                // 2. Explode Connections into independent primitive lines
                if (layer.connections) {
                    layer.connections.forEach(conn => {
                        const numA = nodeMap[conn.from];
                        const numB = nodeMap[conn.to];
                        if (numA && numB) {
                            newLayers.push({
                                type: 'connection_line',
                                startX: numA.px, startY: numA.py,
                                endX: numB.px, endY: numB.py,
                                label: conn.label && conn.label !== '???' ? conn.label : '',
                                color: conn.color || layer.color || undefined,
                                _freeMove: true,
                                _fromNode: numA.hexId,
                                _toNode: numB.hexId,
                                _groupId: groupId
                            });
                        }
                    });
                }

                // 3. Explode Nodes into independent primitive hexagons and text
                layer.nodes.forEach(n => {
                    const coords = nodeMap[n.id];

                    newLayers.push({
                        id: coords.hexId,
                        type: 'hexagon_node',
                        x: coords.px - nodeRadius,
                        y: coords.py - nodeRadius,
                        size: nodeRadius,
                        icon: coords.icon,
                        color: layer.color || undefined,
                        _freeMove: true,
                        _groupId: groupId
                    });

                    if (coords.label) {
                        const labelWidth = Math.max(180, coords.label.length * 14);
                        newLayers.push({
                            type: 'text', content: coords.label,
                            x: coords.px - labelWidth / 2,
                            y: coords.py + nodeRadius + 8,
                            width: labelWidth,
                            align: 'center',
                            font: { size: 20, weight: 700, family: 'MPLUS Code Latin' },
                            color: '#ffffff',
                            lineHeight: 1.2,
                            _freeMove: true,
                            _parentId: coords.hexId,
                            _groupId: groupId
                        });
                    }
                });

                layer._toDelete = true;
            }

            for (let k = startLen + 1; k < newLayers.length; k++) {
                // Only assign generic parentId to text layers that don't already have a specific parent
                if (newLayers[k].type === 'text' && !newLayers[k]._parentId) newLayers[k]._parentId = parentId;
            }
        }
        for (let j = 0; j < newLayers.length; j++) {
            // Extracted text layers won't have an ID. We set _freeMove to stop layout engine from restacking them.
            if (newLayers[j].type === 'text' && !newLayers[j].id && !newLayers[j]._freeMove) {
                newLayers[j]._freeMove = true;
                flattened = true;
            }
        }

        // Finalize scene graph, purging any monolithic objects that were exploded
        graph.layers = newLayers.filter(l => !l._toDelete);
        return flattened;
    }

    /**
     * Load a scene graph and render it.
     */
    async load(sceneGraph) {
        try {
            const fs = window.require ? window.require('fs') : null;
            if (fs) {
                // Write incoming graph purely for terminal debugging
                fs.writeFileSync('/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/last_scenegraph.json', JSON.stringify(sceneGraph, null, 2));
            }
        } catch (e) { console.log("FS error", e); }

        this.sceneGraph = JSON.parse(JSON.stringify(sceneGraph)); // Deep clone
        this.selectedIdx = -1;
        this.hoveredIdx = -1;
        this._closeTextEditor();

        // Check if any layer has been user-moved (_freeMove) — skip layout to preserve positions
        const hasUserMods = this.sceneGraph.layers && this.sceneGraph.layers.some(l => l._freeMove);

        if (!hasUserMods) {
            // Pass 1: Layout computes valid x, y, width, height for all widgets
            await this.renderer.render(this.sceneGraph, { skipLayout: false });

            // Pass 2: Flatten using precise bounds from Pass 1
            const flattened = this._flattenSceneGraph(this.sceneGraph, this.renderer.lastBounds || []);

            // Pass 3: Re-render to correctly draw the newly independent text layers
            if (flattened) {
                await this.renderer.render(this.sceneGraph, { skipLayout: true });
            }
        } else {
            // Already flattened / user-modified
            this._flattenSceneGraph(this.sceneGraph, this.renderer.lastBounds || []);
            await this.renderer.render(this.sceneGraph, { skipLayout: true });
        }

        // Sync overlay size
        this.overlayCanvas.width = this.renderer.width;
        this.overlayCanvas.height = this.renderer.height;

        // Fit to container and calculate scale
        this._fitToContainer();

        // Build editable layers list (skip background)
        this._buildEditableLayers();

        // Draw overlay
        this._drawOverlay();
    }

    /**
     * Build the list of editable layers with bounding boxes.
     */
    _buildEditableLayers() {
        this.editableLayers = [];
        if (!this.sceneGraph || !this.sceneGraph.layers) return;

        const bounds = this.renderer.lastBounds || [];

        for (let i = 0; i < this.sceneGraph.layers.length; i++) {
            const layer = this.sceneGraph.layers[i];

            // Skip non-interactive layers
            if (layer.type === 'background') continue;

            // Normalize type for matching
            const t = (layer.type || '').toLowerCase();

            // Find bounds from renderer (if available)
            const bound = bounds.find(b => b.layerIndex === i);

            // Build bounding box
            const box = {
                layerIndex: i,
                type: layer.type,
                x: bound ? bound.x : (layer.x || 0),
                y: bound ? bound.y : (layer.y || 0),
                width: bound ? bound.width : (layer.width || 200),
                height: bound ? bound.height : (layer.height || 60),
                layer: layer
            };

            // Estimate height for layers without explicit height
            if (!box.height || box.height < 20) {
                if (t === 'text') box.height = (layer.font?.size || 42) * 2;
                else if (t === 'divider') box.height = 10;
                else if (t === 'accent_bar') box.height = layer.height || 6;
                else if (t === 'icon') box.height = layer.size || 80;
                else if (t === 'terminal') box.height = 200;
                else if (t === 'rect') box.height = 120;
                else if (t === 'barchart') box.height = 400;
                else if (t === 'checklist') box.height = (layer.items?.length || 3) * 66;
                else if (t === 'gridbox') box.height = 250;
                else if (t === 'warningbox') box.height = 180;
                else if (t === 'directorytree') box.height = 60 + (layer.items?.length || 3) * 50;
                else if (t === 'toolgrid') { const cols = (layer.tools?.length || 4) > 4 ? 3 : 2; box.height = Math.ceil((layer.tools?.length || 4) / cols) * 174; }
                else if (t === 'attackflow') box.height = (layer.stages?.length || 3) * 180;
                else if (t === 'architecturediag') box.height = (layer.layers?.length || 3) * 190;
                else if (t === 'codeblock') box.height = layer.height || Math.max(250, 60 + (Math.max(10, Math.min(30, (layer.code || '').split('\n').length)) * 30));
                else if (t === 'hexdump') box.height = (layer.lines || 10) * 35;
                else if (t === 'timeline') box.height = (layer.events?.length || 3) * 120; // Approx
                else if (t === 'vs_table') box.height = 160 + (layer.rows?.length || 3) * 90;
                else if (t === 'radarchart') box.height = bound ? bound.height : (layer.height || 500);
                else if (t === 'nodegraph') box.height = bound ? bound.height : (layer.height || 500);
                else if (t === 'hexagon_node') box.height = (layer.size || 45) * 2;
                else if (t === 'connection_line') box.height = Math.abs((layer.endY || 200) - (layer.startY || 0)) + 80;
                else if (t === 'statbar') box.height = 60;
                else if (t === 'bulletlist') box.height = (layer.items?.length || 3) * 80;
                else if (t === 'image') box.height = box.width;
                else box.height = 80;
            }

            this.editableLayers.push(box);
        }
    }

    /**
     * Convert mouse event coordinates to canvas coordinates.
     */
    _toCanvasCoords(e) {
        const rect = this.wrapper.getBoundingClientRect();
        const scaleX = this.renderer.width / rect.width;
        const scaleY = this.renderer.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    /**
     * Hit test — find the topmost editable layer under the cursor.
     */
    _hitTest(mx, my) {
        // Reverse order — topmost layer first
        for (let i = this.editableLayers.length - 1; i >= 0; i--) {
            const box = this.editableLayers[i];
            if (box.type === 'connection_line') {
                const sx = box.layer.startX;
                const sy = box.layer.startY;
                const ex = box.layer.endX;
                const ey = box.layer.endY;

                // Point-to-line segment distance
                const l2 = Math.pow(sx - ex, 2) + Math.pow(sy - ey, 2);
                let dist = 1000;

                if (l2 === 0) {
                    dist = Math.sqrt(Math.pow(mx - sx, 2) + Math.pow(my - sy, 2));
                } else {
                    let t = ((mx - sx) * (ex - sx) + (my - sy) * (ey - sy)) / l2;
                    t = Math.max(0, Math.min(1, t));
                    const projX = sx + t * (ex - sx);
                    const projY = sy + t * (ey - sy);
                    dist = Math.sqrt(Math.pow(mx - projX, 2) + Math.pow(my - projY, 2));
                }

                if (dist <= 15) {
                    return i;
                }
            } else if (mx >= box.x && mx <= box.x + box.width &&
                my >= box.y && my <= box.y + box.height) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Check if cursor is on a resize handle of the selected element.
     * Returns handle name or null.
     */
    _hitTestHandle(mx, my) {
        if (this.selectedIdx < 0) return null;
        const box = this.editableLayers[this.selectedIdx];
        if (!box) return null;

        const hs = 14; // handle hit zone size
        const handles = this._getHandlePositions(box);

        for (const [name, pos] of Object.entries(handles)) {
            if (Math.abs(mx - pos.x) <= hs && Math.abs(my - pos.y) <= hs) {
                return name;
            }
        }
        return null;
    }

    /**
     * Get pixel positions of the 8 resize handles for a box.
     */
    _getHandlePositions(box) {
        if (box.type === 'connection_line') {
            return {
                'start': { x: box.layer.startX, y: box.layer.startY },
                'end': { x: box.layer.endX, y: box.layer.endY }
            };
        }

        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        return {
            'nw': { x: box.x, y: box.y },
            'n': { x: cx, y: box.y },
            'ne': { x: box.x + box.width, y: box.y },
            'e': { x: box.x + box.width, y: cy },
            'se': { x: box.x + box.width, y: box.y + box.height },
            's': { x: cx, y: box.y + box.height },
            'sw': { x: box.x, y: box.y + box.height },
            'w': { x: box.x, y: cy }
        };
    }

    /**
     * Get CSS cursor for a resize handle.
     */
    _handleCursor(handle) {
        const cursors = {
            'nw': 'nw-resize', 'n': 'n-resize', 'ne': 'ne-resize',
            'e': 'e-resize', 'se': 'se-resize', 's': 's-resize',
            'sw': 'sw-resize', 'w': 'w-resize',
            'start': 'crosshair', 'end': 'crosshair'
        };
        return cursors[handle] || 'default';
    }

    // ═══════════════════════════════════════════
    // MOUSE EVENT HANDLERS
    // ═══════════════════════════════════════════

    _onMouseDown(e) {
        const { x, y } = this._toCanvasCoords(e);

        // ── AUTO-SAVE: If text editor is open, commit and close it first ──
        if (this.textEditor && this.editingIdx >= 0) {
            this._commitTextEdit();
        }

        // Check resize handle first
        const handle = this._hitTestHandle(x, y);
        if (handle) {
            this.isResizing = true;
            this.resizeHandle = handle;
            const box = this.editableLayers[this.selectedIdx];
            this.dragStartX = x;
            this.dragStartY = y;
            this.dragStartLayerX = box.x;
            this.dragStartLayerY = box.y;
            this.dragStartLayerW = box.width;
            this.dragStartLayerH = box.height;
            e.preventDefault();
            return;
        }

        // Hit test for selection
        const hitIdx = this._hitTest(x, y);
        if (hitIdx >= 0) {
            this.selectedIdx = hitIdx;
            this.isDragging = true;
            const box = this.editableLayers[hitIdx];
            this.dragStartX = x;
            this.dragStartY = y;
            this.dragStartLayerX = box.layer.x || box.x;
            this.dragStartLayerY = box.layer.y || box.y;
            this.dragStartLayerW = box.width;
            this.dragStartLayerH = box.height;

            if (box.layer.type === 'connection_line') {
                this.dragStartLineStartX = box.layer.startX;
                this.dragStartLineStartY = box.layer.startY;
                this.dragStartLineEndX = box.layer.endX;
                this.dragStartLineEndY = box.layer.endY;
            }

            this.overlayCanvas.style.cursor = 'grabbing';
            this._drawOverlay();

            // Snapshot ALL group siblings for coordinated group-drag
            if (box.layer._groupId && this.sceneGraph && this.sceneGraph.layers) {
                this._dragGroupSnapshots = [];
                this.sceneGraph.layers.forEach(l => {
                    if (l._groupId === box.layer._groupId) {
                        this._dragGroupSnapshots.push({
                            layer: l,
                            startX: l.x || 0,
                            startY: l.y || 0,
                            startSX: l.startX,
                            startSY: l.startY,
                            startEX: l.endX,
                            startEY: l.endY
                        });
                    }
                });
            } else {
                this._dragGroupSnapshots = null;
            }

            if (box.layer.id) {
                this.editableLayers.forEach(childBox => {
                    const l = childBox.layer;
                    if (l._parentId === box.layer.id) {
                        l._dragStartX = l.x;
                        l._dragStartY = l.y;
                    }
                });
            }
        } else {
            // Deselect
            this.selectedIdx = -1;
            this._drawOverlay();
        }

        e.preventDefault();
    }

    _onMouseMove(e) {
        const { x, y } = this._toCanvasCoords(e);

        if (this.isDragging && this.selectedIdx >= 0) {
            // Move element
            const dx = x - this.dragStartX;
            const dy = y - this.dragStartY;
            const layer = this.editableLayers[this.selectedIdx].layer;

            // ═══ GROUP DRAG: Move ALL siblings together ═══
            if (layer._groupId && this._dragGroupSnapshots) {
                this._dragGroupSnapshots.forEach(snap => {
                    const l = snap.layer;
                    if (l.type === 'connection_line') {
                        l.startX = Math.round(snap.startSX + dx);
                        l.startY = Math.round(snap.startSY + dy);
                        l.endX = Math.round(snap.startEX + dx);
                        l.endY = Math.round(snap.startEY + dy);
                        l.x = Math.min(l.startX, l.endX) - 20;
                        l.y = Math.min(l.startY, l.endY) - 20;
                    } else {
                        l.x = Math.round(snap.startX + dx);
                        l.y = Math.round(snap.startY + dy);
                    }
                    l._freeMove = true;
                });
            } else if (layer.type === 'connection_line') {
                // Solo line drag (ungrouped)
                layer.startX = Math.round(this.dragStartLineStartX + dx);
                layer.startY = Math.round(this.dragStartLineStartY + dy);
                layer.endX = Math.round(this.dragStartLineEndX + dx);
                layer.endY = Math.round(this.dragStartLineEndY + dy);
                layer.x = Math.min(layer.startX, layer.endX) - 20;
                layer.y = Math.min(layer.startY, layer.endY) - 20;
            } else {
                layer.x = Math.round(this.dragStartLayerX + dx);
                layer.y = Math.round(this.dragStartLayerY + dy);
            }

            layer._freeMove = true; // Flag immediately so layout pass knows it's manual

            // Center-snap: if element center is near canvas center, snap to it
            if (layer.type !== 'connection_line') {
                const elCX = layer.x + (this.editableLayers[this.selectedIdx].width || 0) / 2;
                const elCY = layer.y + (this.editableLayers[this.selectedIdx].height || 0) / 2;
                const canvasCX = this.renderer.width / 2;
                const canvasCY = this.renderer.height / 2;
                const snapThreshold = 8;
                this._snappedX = false;
                this._snappedY = false;
                if (Math.abs(elCX - canvasCX) < snapThreshold) {
                    layer.x = canvasCX - (this.editableLayers[this.selectedIdx].width || 0) / 2;
                    this._snappedX = true;
                }
                if (Math.abs(elCY - canvasCY) < snapThreshold) {
                    layer.y = canvasCY - (this.editableLayers[this.selectedIdx].height || 0) / 2;
                    this._snappedY = true;
                }
            }

            if (layer.id) {
                this.editableLayers.forEach(childBox => {
                    const l = childBox.layer;
                    if (l._parentId === layer.id && l._dragStartX !== undefined) {
                        l.x = Math.round(l._dragStartX + (layer.x - this.dragStartLayerX));
                        l.y = Math.round(l._dragStartY + (layer.y - this.dragStartLayerY));
                        l._freeMove = true; // Prevent layout engine from resetting child text
                    }
                });
            }

            this._reRender();
        } else if (this.isResizing && this.selectedIdx >= 0) {
            // Resize element
            const dx = x - this.dragStartX;
            const dy = y - this.dragStartY;
            const layer = this.editableLayers[this.selectedIdx].layer;
            const h = this.resizeHandle;

            let newX = this.dragStartLayerX;
            let newY = this.dragStartLayerY;
            let newW = this.dragStartLayerW;
            let newH = this.dragStartLayerH;

            // Connection Line special two-point resize
            if (layer.type === 'connection_line') {
                if (h === 'start') {
                    layer.startX = Math.round(this.dragStartLineStartX + dx);
                    layer.startY = Math.round(this.dragStartLineStartY + dy);
                    layer._fromNode = null;
                } else if (h === 'end') {
                    layer.endX = Math.round(this.dragStartLineEndX + dx);
                    layer.endY = Math.round(this.dragStartLineEndY + dy);
                    layer._toNode = null;
                }
                layer.x = Math.min(layer.startX, layer.endX) - 20;
                layer.y = Math.min(layer.startY, layer.endY) - 20;
                layer.width = Math.abs(layer.endX - layer.startX) + 40;
                layer.height = Math.abs(layer.endY - layer.startY) + 40;
                layer._userResized = true;
                layer._freeMove = true;
                this._reRender();
                return;
            }

            // Maintain Aspect Ratio for Images or if Shift is held (can implement shift key tracking later)
            const keepRatio = layer.type === 'image' || layer.type === 'icon' || layer.type === 'hexagon_node';
            const ratio = this.dragStartLayerW / this.dragStartLayerH;

            if (keepRatio) {
                // Proportional resize
                const movement = Math.abs(dx) > Math.abs(dy) ? dx : dy;
                let scale = 1;

                if (h.includes('e') || h.includes('s')) scale = (this.dragStartLayerW + movement) / this.dragStartLayerW;
                else if (h.includes('w') || h.includes('n')) scale = (this.dragStartLayerW - movement) / this.dragStartLayerW;

                newW = this.dragStartLayerW * scale;
                newH = this.dragStartLayerH * scale;

                if (h.includes('w')) newX = this.dragStartLayerX - (newW - this.dragStartLayerW);
                if (h.includes('n')) newY = this.dragStartLayerY - (newH - this.dragStartLayerH);
            } else {
                // Free resize
                // Horizontal resize
                if (h.includes('e')) { newW += dx; }
                if (h.includes('w')) { newX += dx; newW -= dx; }

                // Vertical resize
                if (h.includes('s')) { newH += dy; }
                if (h.includes('n')) { newY += dy; newH -= dy; }
            }

            // Enforce minimums per layer type
            let minW = 60;
            let minH = 30;

            if (layer.type === 'terminal') { minW = 200; minH = 100; }
            else if (layer.type === 'rect') { minW = 100; minH = 80; }
            else if (layer.type === 'bar_chart') { minW = 200; minH = 150; }
            else if (layer.type === 'check_list') { minW = 150; minH = 100; }

            if (newW < minW) {
                if (h.includes('w')) newX -= (minW - newW);
                newW = minW;
            }
            if (newH < minH) {
                if (h.includes('n')) newY -= (minH - newH);
                newH = minH;
            }

            // Apply changes
            layer._userResized = true; // Flag for renderer to respect sizes
            layer._freeMove = true;    // Prevent layout engine from moving it

            layer.x = Math.round(newX);
            layer.y = Math.round(newY);
            layer.width = Math.round(newW);
            layer.height = Math.round(newH);

            // Special Case: Update Hexagon Node native radius property
            if (layer.type === 'hexagon_node') {
                layer.size = Math.max(20, Math.round(newW / 2));
            }

            // Update the cached box so the overlay redraws cleanly
            this.editableLayers[this.selectedIdx].width = layer.width;
            this.editableLayers[this.selectedIdx].height = layer.height;

            this._reRender();

        } else {
            // Hover detection
            const handle = this._hitTestHandle(x, y);
            if (handle) {
                this.overlayCanvas.style.cursor = this._handleCursor(handle);
            } else {
                const hitIdx = this._hitTest(x, y);
                this.hoveredIdx = hitIdx;
                this.overlayCanvas.style.cursor = hitIdx >= 0 ? 'grab' : 'default';
            }
        }
    }

    _onMouseUp(e) {
        if (this.isDragging || this.isResizing) {
            // Mark as free-moved so layout engine won't push it
            if (this.selectedIdx >= 0) {
                const box = this.editableLayers[this.selectedIdx];
                if (box && box.layer) {
                    box.layer._freeMove = true;
                }
            }

            this.isDragging = false;
            this.isResizing = false;
            this.resizeHandle = null;
            this.overlayCanvas.style.cursor = 'default';

            // Notify external listener
            if (this.onChange) {
                this.onChange(this.sceneGraph);
            }
        }
    }

    _onDoubleClick(e) {
        const { x, y } = this._toCanvasCoords(e);
        const hitIdx = this._hitTest(x, y);

        if (hitIdx >= 0) {
            // Universal double-click: open text editor on ANY element that has editable text
            this._openTextEditor(hitIdx);
        }
    }

    _onKeyDown(e) {
        // Delete selected element
        if ((e.key === 'Delete' || e.key === 'Backspace') &&
            this.selectedIdx >= 0 && this.editingIdx < 0) {
            const box = this.editableLayers[this.selectedIdx];
            // Don't allow deleting brand or swipe
            if (box.type !== 'brand' && box.type !== 'swipe') {
                this.sceneGraph.layers.splice(box.layerIndex, 1);
                this.selectedIdx = -1;
                this._reRender();
                if (this.onChange) this.onChange(this.sceneGraph);
            }
            e.preventDefault();
        }

        // Escape to deselect
        if (e.key === 'Escape') {
            this.selectedIdx = -1;
            this._closeTextEditor();
            this._drawOverlay();
        }

        // Arrow keys to nudge
        if (this.selectedIdx >= 0 && this.editingIdx < 0 &&
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            const layer = this.editableLayers[this.selectedIdx].layer;
            layer._freeMove = true;
            const step = e.shiftKey ? 10 : 2;
            const dx = e.key === 'ArrowLeft' ? -step : (e.key === 'ArrowRight' ? step : 0);
            const dy = e.key === 'ArrowUp' ? -step : (e.key === 'ArrowDown' ? step : 0);

            if (layer.type === 'connection_line') {
                layer.startX += dx; layer.startY += dy;
                layer.endX += dx; layer.endY += dy;
                layer.x = Math.min(layer.startX, layer.endX) - 20;
                layer.y = Math.min(layer.startY, layer.endY) - 20;
            } else {
                layer.x = (layer.x || 0) + dx;
                layer.y = (layer.y || 0) + dy;
            }

            // Update attached lines if nudging a hexagon
            if (layer.type === 'hexagon_node' && this.sceneGraph && this.sceneGraph.layers) {
                const cx = layer.x + (layer.size || 45);
                const cy = layer.y + (layer.size || 45);
                this.sceneGraph.layers.forEach(l => {
                    if (l.type === 'connection_line') {
                        if (l._fromNode === layer.id) { l.startX = cx; l.startY = cy; }
                        if (l._toNode === layer.id) { l.endX = cx; l.endY = cy; }
                    }
                });
            }

            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
            e.preventDefault();
        }

        // Layer ordering: ] = bring forward, [ = send backward
        if (this.selectedIdx >= 0 && e.key === ']') {
            if (e.shiftKey) this.bringToFront();
            else this.bringForward();
            e.preventDefault();
        }
        if (this.selectedIdx >= 0 && e.key === '[') {
            if (e.shiftKey) this.sendToBack();
            else this.sendBackward();
            e.preventDefault();
        }
    }

    // ═══════════════════════════════════════════
    // TEXT EDITING
    // ═══════════════════════════════════════════

    _openTextEditor(editableIdx) {
        this._closeTextEditor();

        const box = this.editableLayers[editableIdx];
        const layer = box.layer;

        // Find editable text property
        let textValue = '';
        let textProp = null;
        if (layer.content !== undefined) { textValue = layer.content; textProp = 'content'; }
        else if (layer.title !== undefined) { textValue = layer.title; textProp = 'title'; }
        else if (layer.label !== undefined) { textValue = layer.label; textProp = 'label'; }

        if (!textProp && layer.type !== 'text') return;

        this.editingIdx = editableIdx;
        this.editingProp = textProp || 'content'; // Store which property we are editing

        // Create textarea overlay
        const ta = document.createElement('textarea');
        ta.className = 'canvas-text-editor';
        ta.value = textValue || '';

        // Position over the element (in native canvas coordinates — CSS transform handles display scaling)
        const displayX = box.x;
        const displayY = box.y;
        const displayW = box.width;
        const displayH = Math.max(box.height, 80);

        ta.style.cssText = [
            'position:absolute',
            `left:${displayX}px`,
            `top:${displayY}px`,
            `width:${displayW}px`,
            `min-height:${displayH}px`,
            'background:rgba(0,0,0,0.85)',
            'color:#00D9FF',
            'border:2px solid #00D9FF',
            'border-radius:8px',
            'padding:12px',
            'font-family:"MPLUS Code Latin", monospace',
            'font-size:' + Math.max(28, (layer.font ? layer.font.size : 42)) + 'px',
            'resize:none',
            'outline:none',
            'z-index:100',
            'overflow-y:auto'
        ].join(';');

        ta.addEventListener('blur', () => this._commitTextEdit());
        ta.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this._closeTextEditor();
                e.stopPropagation();
            }
        });

        this.wrapper.appendChild(ta);
        this.textEditor = ta;

        // Focus and select
        requestAnimationFrame(() => {
            ta.focus();
            ta.select();
        });
    }

    _commitTextEdit() {
        // Guard against re-entry (blur fires when we remove the node below)
        if (this._isClosingEditor) return;
        if (this.editingIdx < 0 || !this.textEditor) return;

        const box = this.editableLayers[this.editingIdx];
        const newText = this.textEditor.value;
        const prop = this.editingProp || 'content';

        if (newText !== box.layer[prop]) {
            box.layer[prop] = newText;
            this._closeTextEditor();   // Close FIRST to detach blur
            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
        } else {
            this._closeTextEditor();
        }
    }

    _closeTextEditor() {
        if (this._isClosingEditor) return; // Prevent re-entry
        this._isClosingEditor = true;

        if (this.textEditor) {
            this.textEditor.onblur = null;
            try {
                if (this.textEditor.parentNode) {
                    this.textEditor.parentNode.removeChild(this.textEditor);
                }
            } catch (e) {
                // Already removed — safe to ignore
            }
        }

        // Safety sweep: remove any ghost editors that got orphaned
        if (this.wrapper) {
            const orphans = this.wrapper.querySelectorAll('.canvas-text-editor');
            orphans.forEach(el => el.remove());
        }

        this.textEditor = null;
        this.editingIdx = -1;
        this._isClosingEditor = false;
    }

    // ═══════════════════════════════════════════
    // RE-RENDER & OVERLAY
    // ═══════════════════════════════════════════

    async _reRender() {
        // Skip layout shifting during interactive edits — elements stay at their positions
        await this.renderer.render(this.sceneGraph, { skipLayout: true });
        this._buildEditableLayers();
        this._drawOverlay();
    }

    _drawOverlay() {
        const ctx = this.overlayCtx;
        const W = this.overlayCanvas.width;
        const H = this.overlayCanvas.height;
        ctx.clearRect(0, 0, W, H);

        // ── PERMANENT CENTER CROSSHAIR LINES ──
        const centerX = W / 2;
        const centerY = H / 2;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);

        // Vertical center line
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, H);
        ctx.stroke();

        // Horizontal center line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(W, centerY);
        ctx.stroke();

        // Center crosshair marker
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
        ctx.lineWidth = 2;
        const crossSize = 16;
        ctx.beginPath();
        ctx.moveTo(centerX - crossSize, centerY);
        ctx.lineTo(centerX + crossSize, centerY);
        ctx.moveTo(centerX, centerY - crossSize);
        ctx.lineTo(centerX, centerY + crossSize);
        ctx.stroke();

        // ── 300px TOP HEADER REFERENCE LINE ──
        ctx.setLineDash([10, 5]);
        ctx.strokeStyle = 'rgba(0, 255, 150, 0.7)'; // Neon green for visibility
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 300);
        ctx.lineTo(W, 300);
        ctx.stroke();

        // Reference line label
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(0, 255, 150, 0.9)';
        ctx.fillText('▼ 300px LÍMITE DE CONTENIDO', 20, 290);

        ctx.restore();

        // ── EDGE RULERS (tick marks every 100px) ──
        this._drawRulers(ctx, W, H);

        // ── HOVER HIGHLIGHT ──
        if (this.hoveredIdx >= 0 && this.hoveredIdx !== this.selectedIdx) {
            const box = this.editableLayers[this.hoveredIdx];
            if (box) {
                ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.setLineDash([]);
            }
        }

        // ── SELECTED ELEMENT ──
        if (this.selectedIdx >= 0) {
            const box = this.editableLayers[this.selectedIdx];
            if (!box) return;

            // ── ALIGNMENT GUIDES (crosshair lines when dragging/resizing) ──
            if (this.isDragging || this.isResizing) {
                this._drawAlignmentGuides(ctx, box, W, H);
            }

            // Selection border
            ctx.strokeStyle = '#00D9FF';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([]);
            ctx.strokeRect(box.x - 1, box.y - 1, box.width + 2, box.height + 2);

            // Resize handles
            const handles = this._getHandlePositions(box);
            const handleSize = 10;
            for (const [name, pos] of Object.entries(handles)) {
                ctx.fillStyle = '#000000';
                ctx.strokeStyle = '#00D9FF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.rect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
                ctx.fill();
                ctx.stroke();
            }

            // Type label badge
            const label = box.type.toUpperCase();
            ctx.font = '600 20px "MPLUS Code Latin", sans-serif';
            const labelWidth = ctx.measureText(label).width + 16;
            const labelH = 26;
            const labelX = box.x;
            const labelY = box.y - labelH - 6;

            ctx.fillStyle = '#00D9FF';
            ctx.beginPath();
            ctx.roundRect(labelX, labelY, labelWidth, labelH, 4);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, labelX + 8, labelY + labelH / 2);
            ctx.textBaseline = 'alphabetic';

            // Position label (X, Y) + Size label (W × H)
            const posLabel = Math.round(box.x) + ', ' + Math.round(box.y);
            const sizeLabel = Math.round(box.width) + ' × ' + Math.round(box.height);
            const fullLabel = posLabel + '  |  ' + sizeLabel;
            ctx.font = '500 18px "MPLUS Code Latin", monospace';
            const posW = ctx.measureText(fullLabel).width + 16;
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(box.x, box.y + box.height + 6, posW, 22);
            ctx.fillStyle = '#00D9FF';
            ctx.textBaseline = 'middle';
            ctx.fillText(fullLabel, box.x + 8, box.y + box.height + 17);
            ctx.textBaseline = 'alphabetic';
        }
    }

    /**
     * Draw alignment guide crosshair lines for the selected element.
     */
    _drawAlignmentGuides(ctx, box, W, H) {
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);

        // Vertical lines: left edge, center, right edge
        [box.x, cx, box.x + box.width].forEach(xPos => {
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, H);
            ctx.stroke();
        });

        // Horizontal lines: top edge, center, bottom edge
        [box.y, cy, box.y + box.height].forEach(yPos => {
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(W, yPos);
            ctx.stroke();
        });

        ctx.setLineDash([]);

        // Dimension labels at edges
        ctx.font = '400 16px "MPLUS Code Latin", monospace';
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';

        // Left edge X
        ctx.textAlign = 'left';
        ctx.fillText(Math.round(box.x) + 'px', box.x + 4, 18);
        // Right edge X
        ctx.fillText(Math.round(box.x + box.width) + 'px', box.x + box.width + 4, 18);
        // Top edge Y
        ctx.fillText(Math.round(box.y) + 'px', 4, box.y - 4);
        // Bottom edge Y
        ctx.fillText(Math.round(box.y + box.height) + 'px', 4, box.y + box.height - 4);

        ctx.restore();
    }

    /**
     * Draw pixel rulers along the edges of the canvas.
     */
    _drawRulers(ctx, W, H) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.font = '400 14px monospace';
        ctx.textAlign = 'center';
        ctx.lineWidth = 1;

        // Top ruler
        for (let x = 0; x <= W; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, x % 500 === 0 ? 16 : 8);
            ctx.stroke();
            if (x % 200 === 0 && x > 0) {
                ctx.fillText(x.toString(), x, 24);
            }
        }

        // Left ruler
        ctx.textAlign = 'left';
        for (let y = 0; y <= H; y += 100) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(y % 500 === 0 ? 16 : 8, y);
            ctx.stroke();
            if (y % 200 === 0 && y > 0) {
                ctx.fillText(y.toString(), 4, y + 14);
            }
        }

        ctx.restore();
    }

    // ═══════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════

    /**
     * Get the current modified scene graph for export.
     */
    getModifiedSceneGraph() {
        return this.sceneGraph;
    }

    /**
     * Apply a theme to the current scene graph and re-render.
     */
    async applyTheme(themeName) {
        if (!this.sceneGraph || !this.renderer.brandingSystem) return;
        this.sceneGraph = this.renderer.brandingSystem.applyTheme(this.sceneGraph, themeName);
        this.sceneGraph.theme = themeName;
        await this._reRender();
    }

    /**
     * Export the current state as a PNG data URL.
     */
    exportDataURL() {
        return this.renderer.exportDataURL('image/png', 1.0);
    }

    /**
     * Update scale when container resizes.
     */
    updateScale() {
        this._fitToContainer();
    }

    /**
     * Move selected element one layer up (bring forward).
     */
    bringForward() {
        if (this.selectedIdx < 0 || !this.sceneGraph) return;
        const box = this.editableLayers[this.selectedIdx];
        const idx = box.layerIndex;
        const layers = this.sceneGraph.layers;
        if (idx < layers.length - 1) {
            // Swap with next layer
            [layers[idx], layers[idx + 1]] = [layers[idx + 1], layers[idx]];
            box.layerIndex = idx + 1;
            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
        }
    }

    /**
     * Move selected element one layer down (send backward).
     */
    sendBackward() {
        if (this.selectedIdx < 0 || !this.sceneGraph) return;
        const box = this.editableLayers[this.selectedIdx];
        const idx = box.layerIndex;
        const layers = this.sceneGraph.layers;
        // Don't go below background (index 0)
        if (idx > 1) {
            [layers[idx], layers[idx - 1]] = [layers[idx - 1], layers[idx]];
            box.layerIndex = idx - 1;
            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
        }
    }

    /**
     * Bring selected element to the very top.
     */
    bringToFront() {
        if (this.selectedIdx < 0 || !this.sceneGraph) return;
        const box = this.editableLayers[this.selectedIdx];
        const idx = box.layerIndex;
        const layers = this.sceneGraph.layers;
        if (idx < layers.length - 1) {
            const layer = layers.splice(idx, 1)[0];
            layers.push(layer);
            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
        }
    }

    /**
     * Send selected element to the very bottom (above background).
     */
    sendToBack() {
        if (this.selectedIdx < 0 || !this.sceneGraph) return;
        const box = this.editableLayers[this.selectedIdx];
        const idx = box.layerIndex;
        const layers = this.sceneGraph.layers;
        if (idx > 1) {
            const layer = layers.splice(idx, 1)[0];
            layers.splice(1, 0, layer); // Insert after background
            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
        }
    }

    /**
     * Destroy the editor and clean up.
     */
    destroy() {
        if (this._resizeObserver) this._resizeObserver.disconnect();
        this.container.innerHTML = '';
        this.sceneGraph = null;
        this.editableLayers = [];
        this.selectedIdx = -1;
        this._closeTextEditor();
    }
}

if (typeof module !== 'undefined') module.exports = CanvasEditor;
else window.CanvasEditor = CanvasEditor;
