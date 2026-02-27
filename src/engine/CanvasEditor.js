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
     * Setup the editor DOM and event listeners.
     */
    _setup() {
        // Clear container
        this.container.innerHTML = '';

        // Wrapper for canvas stacking — will be CSS-scaled to fit container
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'canvas-editor-wrapper';
        this.wrapper.style.cssText = 'position:relative;transform-origin:top left;';

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

        // Center the wrapper in the container
        const offsetX = Math.max(0, (containerRect.width - displayW) / 2);
        const offsetY = Math.max(0, (containerRect.height - displayH) / 2);
        this.wrapper.style.marginLeft = offsetX + 'px';
        this.wrapper.style.marginTop = offsetY + 'px';

        // Update scale for mouse coordinate mapping
        this.scale = 1 / this.displayScale;
    }

    /**
     * Load a scene graph and render it.
     */
    async load(sceneGraph) {
        this.sceneGraph = JSON.parse(JSON.stringify(sceneGraph)); // Deep clone
        this.selectedIdx = -1;
        this.hoveredIdx = -1;
        this._closeTextEditor();

        // Check if any layer has been user-moved (_freeMove) — skip layout to preserve positions
        const hasUserMods = this.sceneGraph.layers && this.sceneGraph.layers.some(l => l._freeMove);

        // Render (skip layout if user has modified any element positions)
        await this.renderer.render(this.sceneGraph, { skipLayout: hasUserMods });

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
                if (layer.type === 'text') box.height = (layer.font?.size || 42) * 2;
                else if (layer.type === 'divider') box.height = 10;
                else if (layer.type === 'accent_bar') box.height = layer.height || 6;
                else if (layer.type === 'icon') box.height = layer.size || 80;
                else box.height = 60;
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
            if (mx >= box.x && mx <= box.x + box.width &&
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
            'sw': 'sw-resize', 'w': 'w-resize'
        };
        return cursors[handle] || 'default';
    }

    // ═══════════════════════════════════════════
    // MOUSE EVENT HANDLERS
    // ═══════════════════════════════════════════

    _onMouseDown(e) {
        const { x, y } = this._toCanvasCoords(e);

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
            this.overlayCanvas.style.cursor = 'grabbing';
            this._drawOverlay();
        } else {
            // Deselect
            this.selectedIdx = -1;
            this._closeTextEditor();
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
            layer.x = Math.round(this.dragStartLayerX + dx);
            layer.y = Math.round(this.dragStartLayerY + dy);

            // Center-snap: if element center is near canvas center, snap to it
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

            // Horizontal resize
            if (h.includes('e')) { newW += dx; }
            if (h.includes('w')) { newX += dx; newW -= dx; }

            // Vertical resize
            if (h.includes('s')) { newH += dy; }
            if (h.includes('n')) { newY += dy; newH -= dy; }

            // Enforce minimums
            if (newW < 60) newW = 60;
            if (newH < 30) newH = 30;

            layer.x = Math.round(newX);
            layer.y = Math.round(newY);
            layer.width = Math.round(newW);
            if (layer.height !== undefined) layer.height = Math.round(newH);

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
            const box = this.editableLayers[hitIdx];
            if (box.type === 'text') {
                this._openTextEditor(hitIdx);
            }
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
            if (e.key === 'ArrowUp') layer.y -= step;
            if (e.key === 'ArrowDown') layer.y += step;
            if (e.key === 'ArrowLeft') layer.x -= step;
            if (e.key === 'ArrowRight') layer.x += step;
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
        if (!layer.content && layer.type !== 'text') return;

        this.editingIdx = editableIdx;

        // Create textarea overlay
        const ta = document.createElement('textarea');
        ta.className = 'canvas-text-editor';
        ta.value = layer.content || '';

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
        if (this.editingIdx < 0 || !this.textEditor) return;

        const box = this.editableLayers[this.editingIdx];
        const newText = this.textEditor.value;

        if (newText !== box.layer.content) {
            box.layer.content = newText;
            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
        }

        this._closeTextEditor();
    }

    _closeTextEditor() {
        if (this.textEditor && this.textEditor.parentNode) {
            this.textEditor.parentNode.removeChild(this.textEditor);
        }
        this.textEditor = null;
        this.editingIdx = -1;
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

            // Position label (X, Y)
            const posLabel = Math.round(box.x) + ', ' + Math.round(box.y);
            ctx.font = '500 18px "MPLUS Code Latin", monospace';
            const posW = ctx.measureText(posLabel).width + 12;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(box.x, box.y + box.height + 6, posW, 22);
            ctx.fillStyle = '#00D9FF';
            ctx.textBaseline = 'middle';
            ctx.fillText(posLabel, box.x + 6, box.y + box.height + 17);
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
