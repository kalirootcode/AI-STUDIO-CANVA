/**
 * CanvasEditor.js — Interactive Visual Editor for Cyber-Canvas Engine
 * ─────────────────────────────────────────────────────────────────────
 * Canva-like editing: select, drag, resize, rotate, multi-select,
 * inline-edit, snap-to-edges, and layer ordering.
 *
 * Two-canvas stack:
 *   1. Render canvas  (from CanvasRenderer) — the actual image
 *   2. Overlay canvas — transparent, shows handles & guides
 *
 * The Scene Graph JSON is the single source of truth.
 * All edits modify the scene graph then trigger a full re-render.
 */

class CanvasEditor {

    constructor(container, renderer) {
        this.container  = container;
        this.renderer   = renderer;
        this.sceneGraph = null;

        /** @type {Array<{layerIndex:number,type:string,x:number,y:number,width:number,height:number,layer:object}>} */
        this.editableLayers = [];

        // ── Selection ────────────────────────────────────────────────
        this.selectedIdx    = -1;   // primary selected editable-layer index
        this.selectedIdxs   = [];   // multi-select indices
        this.hoveredIdx     = -1;

        // ── Drag / Resize ────────────────────────────────────────────
        this.isDragging    = false;
        this.isResizing    = false;
        this.isRotating    = false;
        this.resizeHandle  = null;
        this.dragStartX    = 0;
        this.dragStartY    = 0;
        this.dragStartLayerX  = 0;
        this.dragStartLayerY  = 0;
        this.dragStartLayerW  = 0;
        this.dragStartLayerH  = 0;
        this._dragGroupSnapshots = null;

        // ── Multi-select marquee ─────────────────────────────────────
        this._marquee      = null;  // {x,y,w,h} while rubber-band selecting
        this._marqueeStart = null;

        // ── Scale ────────────────────────────────────────────────────
        this.scale        = 1;
        this.displayScale = 1;

        // ── Overlay canvas ───────────────────────────────────────────
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCtx    = this.overlayCanvas.getContext('2d');

        // ── Text editing ─────────────────────────────────────────────
        this.textEditor   = null;
        this.editingIdx   = -1;
        this.editingProp  = null;
        this._isClosingEditor = false;

        // ── Nudge throttle ───────────────────────────────────────────
        this._nudgeThrottle = null;

        // ── Callbacks ────────────────────────────────────────────────
        this.onChange = null;

        this._setup();
    }

    // ═══════════════════════════════════════════════════════════════
    // SETUP
    // ═══════════════════════════════════════════════════════════════

    /**
     * Reattach the editor to a new container element.
     */
    attachCanvas(container) {
        if (!container) return;
        this.destroy();
        this.container = container;
        this._setup();
    }

    _setup() {
        this.container.innerHTML = '';

        // Wrapper — CSS-scaled to fit container
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'canvas-editor-wrapper';
        this.wrapper.style.cssText = 'position:absolute;transform-origin:top left;';

        // Render canvas (from renderer) — always at native resolution
        const renderCanvas = this.renderer.getCanvas();
        renderCanvas.style.cssText = 'display:block;';
        this.wrapper.appendChild(renderCanvas);

        // Overlay canvas (stacked on top)
        this.overlayCanvas.style.cssText =
            'position:absolute;top:0;left:0;pointer-events:auto;cursor:default;';
        this.wrapper.appendChild(this.overlayCanvas);

        this.container.appendChild(this.wrapper);

        // ── Event listeners (bound references so we can remove them) ──
        this._bound = {
            mousedown:  (e) => this._onMouseDown(e),
            mousemove:  (e) => this._onMouseMove(e),
            mouseup:    (e) => this._onMouseUp(e),
            dblclick:   (e) => this._onDoubleClick(e),
            contextmenu:(e) => this._onContextMenu(e),
            keydown:    (e) => this._onKeyDown(e),
        };
        this.overlayCanvas.addEventListener('mousedown',   this._bound.mousedown);
        this.overlayCanvas.addEventListener('mousemove',   this._bound.mousemove);
        this.overlayCanvas.addEventListener('mouseup',     this._bound.mouseup);
        this.overlayCanvas.addEventListener('dblclick',    this._bound.dblclick);
        this.overlayCanvas.addEventListener('contextmenu', this._bound.contextmenu);
        document.addEventListener('keydown', this._bound.keydown);

        // ResizeObserver to fit canvas to container (with loop guard)
        this._lastContainerW = 0;
        this._lastContainerH = 0;
        this._resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            const w = Math.round(entry.contentRect.width);
            const h = Math.round(entry.contentRect.height);
            if (w !== this._lastContainerW || h !== this._lastContainerH) {
                this._lastContainerW = w;
                this._lastContainerH = h;
                this._fitToContainer();
            }
        });
        this._resizeObserver.observe(this.container);
    }

    /**
     * Fit the canvas wrapper into the container using CSS transform scale.
     */
    _fitToContainer() {
        const rect      = this.container.getBoundingClientRect();
        const availW    = rect.width  - 20;
        const availH    = rect.height - 20;
        if (availW <= 0 || availH <= 0) return;

        const cW     = this.renderer.width;
        const cH     = this.renderer.height;
        const aspect = cW / cH;

        let displayW, displayH;
        if (availW / availH > aspect) {
            displayH = availH;
            displayW = displayH * aspect;
        } else {
            displayW = availW;
            displayH = displayW / aspect;
        }

        this.displayScale = displayW / cW;

        this.wrapper.style.transform       = `scale(${this.displayScale})`;
        this.wrapper.style.transformOrigin = 'top left';
        this.wrapper.style.width           = cW + 'px';
        this.wrapper.style.height          = cH + 'px';

        this.container.style.position = 'relative';
        const offsetX = Math.max(0, (rect.width  - displayW) / 2);
        const offsetY = Math.max(0, (rect.height - displayH) / 2);
        this.wrapper.style.left       = offsetX + 'px';
        this.wrapper.style.top        = offsetY + 'px';
        this.wrapper.style.marginLeft = '0';
        this.wrapper.style.marginTop  = '0';

        this.scale = 1 / this.displayScale;
    }

    // ═══════════════════════════════════════════════════════════════
    // SCENE GRAPH FLATTENING
    // ═══════════════════════════════════════════════════════════════

    _flattenSceneGraph(graph, bounds = []) {
        if (!graph || !graph.layers) return false;
        const newLayers = [];
        let flattened   = false;

        for (let i = 0; i < graph.layers.length; i++) {
            const layer = graph.layers[i];
            if (!layer.id) layer.id = 'layer_' + Math.random().toString(36).substr(2, 9);
            const parentId = layer.id;
            const startLen = newLayers.length;
            newLayers.push(layer);

            if (layer.type === 'background') continue;

            const t     = (layer.type || '').toLowerCase();
            const bound = bounds.find(b => b.layerIndex === i);
            const x     = bound ? bound.x      : (layer.x || 0);
            const y     = bound ? bound.y      : (layer.y || 0);
            const w     = bound ? bound.width  : (layer.width  || 200);
            const h     = bound ? bound.height : (layer.height || 60);

            // ── RECT (Cards) ──────────────────────────────────────
            if (t === 'rect' && layer.title) {
                newLayers.push({
                    type:'text', content:layer.title,
                    x:x+24, y:y+46,
                    font:{size:36,weight:700,family:'BlackOpsOne'},
                    color:layer.accentColor||'#00D9FF'
                });
                delete layer.title;
            }

            // ── WARNINGBOX ────────────────────────────────────────
            if (t === 'warningbox') {
                const styleColor = { danger:'#FF3366', success:'#00FF88', info:'#00D9FF' };
                const col = styleColor[layer.style] || '#FF9500';
                if (layer.title) {
                    newLayers.push({ type:'text', content:layer.title, x:x+140, y:y+30,
                        font:{size:42,weight:900,family:'BlackOpsOne'}, color:col });
                    delete layer.title;
                }
                if (layer.message) {
                    newLayers.push({ type:'text', content:layer.message, x:x+140, y:y+90,
                        width:w-170, font:{size:34,weight:700,family:'MPLUS Code Latin'}, color:'#ffffff' });
                    delete layer.message;
                }
            }

            // ── BARCHART ──────────────────────────────────────────
            if (t === 'barchart' && layer.title) {
                newLayers.push({ type:'text', content:layer.title, x, y,
                    font:{size:36,weight:800,family:'BlackOpsOne'}, color:'#ffffff' });
                delete layer.title;
            }

            // ── CHECKLIST ─────────────────────────────────────────
            if (t === 'checklist' && layer.items) {
                let curY = 0;
                const boxSize=36, gap=24;
                layer.items.forEach((item, j) => {
                    if (!item.text) return;
                    const col = item.status==='done' ? '#888888' : (item.status==='active' ? '#ffffff' : '#cccccc');
                    newLayers.push({ type:'text', content:item.text,
                        x:x+boxSize+gap, y:y+curY-4,
                        font:{size:38,weight:700,family:'MPLUS Code Latin'}, color:col });
                    delete layer.items[j].text;
                    curY += boxSize+30;
                });
            }

            // ── GRIDBOX ───────────────────────────────────────────
            if (t === 'gridbox' && layer.cells) {
                const cols     = layer.columns||2;
                const gapG     = 20;
                const colWidth = (w-(gapG*(cols-1)))/cols;
                const tempCtx  = this.renderer?.ctx || document.createElement('canvas').getContext('2d');
                tempCtx.font   = '600 30px "MPLUS Code Latin"';

                let maxH = 150;
                layer.cells.forEach(cell => {
                    const words = (cell.text||'').split(' ');
                    let line='', lines=1;
                    words.forEach(word => {
                        const test = line+word+' ';
                        if (tempCtx.measureText(test).width > colWidth-40 && line) { lines++; line=word+' '; }
                        else line=test;
                    });
                    const req = 120+(lines*40)+30;
                    if (req>maxH) maxH=req;
                });

                const baseH = (layer._userResized&&layer.height)
                    ? Math.max(100,(layer.height-gapG*(Math.ceil(layer.cells.length/cols)-1))/Math.ceil(layer.cells.length/cols))
                    : maxH;
                let curX=0, curY=0;

                layer.cells.forEach((cell, j) => {
                    if (j>0 && j%cols===0) { curX=0; curY+=baseH+gapG; }
                    if (cell.title) {
                        newLayers.push({ type:'text', content:cell.title,
                            x:x+curX+colWidth/2, y:y+curY+40, align:'center', width:colWidth-40,
                            font:{size:36,weight:900,family:'BlackOpsOne'}, color:'#ffffff' });
                        delete layer.cells[j].title;
                    }
                    if (cell.text) {
                        newLayers.push({ type:'text', content:cell.text,
                            x:x+curX+colWidth/2, y:y+curY+120, width:colWidth-40, align:'center',
                            font:{size:30,weight:600,family:'MPLUS Code Latin'}, color:'#cccccc' });
                        delete layer.cells[j].text;
                    }
                    curX += colWidth+gapG;
                });
            }

            // ── ATTACKFLOW ────────────────────────────────────────
            if (t === 'attackflow' && layer.stages) {
                const boxH=120, gapA=60;
                let curY=0;
                layer.stages.forEach((stage, j) => {
                    if (stage.title) {
                        newLayers.push({ type:'text', content:stage.title,
                            x:x+120, y:y+curY+boxH/2-15,
                            font:{size:38,weight:800,family:'MPLUS Code Latin'}, color:'#ffffff' });
                        delete layer.stages[j].title;
                    }
                    if (stage.desc) {
                        newLayers.push({ type:'text', content:stage.desc,
                            x:x+120, y:y+curY+boxH/2+25,
                            font:{size:26,weight:500,family:'MPLUS Code Latin'}, color:'#999999' });
                        delete layer.stages[j].desc;
                    }
                    curY += boxH + (j<layer.stages.length-1 ? gapA : 0);
                });
            }

            // ── ARCHITECTUREDIAG ──────────────────────────────────
            if (t === 'architecturediag' && layer.layers) {
                let curY=0;
                layer.layers.forEach((ld, j) => {
                    const boxW2=w-(j*60), boxX=(w-boxW2)/2, boxH=160;
                    if (ld.name) {
                        newLayers.push({ type:'text', content:ld.name,
                            x:x+boxX+120, y:y+curY+boxH/2,
                            font:{size:42,weight:900,family:'BlackOpsOne'}, color:'#ffffff' });
                        delete layer.layers[j].name;
                    }
                    if (ld.tech) {
                        newLayers.push({ type:'text', content:ld.tech,
                            x:x+boxX+boxW2-30, y:y+curY+boxH-25, align:'right',
                            font:{size:24,weight:600,family:'MPLUS Code Latin'}, color:'#888888' });
                        delete layer.layers[j].tech;
                    }
                    curY += boxH+30;
                });
            }

            // ── TOOLGRID ──────────────────────────────────────────
            if (t === 'toolgrid' && layer.tools) {
                const cols = layer.tools.length>4 ? 3 : 2;
                const gapT = 24;
                const colW = (w-(gapT*(cols-1)))/cols;
                const boxH = 150;
                let curX=0, curY=0;
                layer.tools.forEach((tool, j) => {
                    if (j>0 && j%cols===0) { curX=0; curY+=boxH+gapT; }
                    if (tool.name) {
                        newLayers.push({ type:'text', content:tool.name,
                            x:x+curX+35, y:y+curY+95,
                            font:{size:38,weight:900,family:'BlackOpsOne'}, color:'#ffffff' });
                        delete layer.tools[j].name;
                    }
                    if (tool.category) {
                        newLayers.push({ type:'text', content:tool.category.toUpperCase(),
                            x:x+curX+35, y:y+curY+35,
                            font:{size:20,weight:600,family:'MPLUS Code Latin'}, color:'#888888' });
                        delete layer.tools[j].category;
                    }
                    curX += colW+gapT;
                });
            }

            // ── DIRECTORYTREE ─────────────────────────────────────
            if (t === 'directorytree') {
                if (layer.root) {
                    newLayers.push({ type:'text', content:layer.root,
                        x:x+60, y:y+32,
                        font:{size:32,weight:800,family:'MPLUS Code Latin'}, color:'#00D9FF' });
                    delete layer.root;
                }
                if (layer.items) {
                    let curY=90;
                    layer.items.forEach((item, j) => {
                        const depth=item.depth||1, px=depth*40;
                        if (item.path) {
                            newLayers.push({ type:'text', content:item.path,
                                x:x+px+55, y:y+curY+2,
                                font:{size:28,weight:item.isDir?700:500,family:'MPLUS Code Latin'}, color:'#ffffff' });
                            delete layer.items[j].path;
                        }
                        curY+=50;
                    });
                }
            }

            // ── STATBAR ───────────────────────────────────────────
            if (t === 'statbar' && layer.label) {
                newLayers.push({ type:'text', content:layer.label, x, y,
                    font:{size:42,weight:700,family:'MPLUS Code Latin'}, color:'#ffffff' });
                delete layer.label;
            }

            // ── BULLETLIST ────────────────────────────────────────
            if (t === 'bulletlist' && layer.items) {
                const font     = layer.font||{size:40,weight:400,family:'MPLUS Code Latin'};
                const fontSize = font.size||40;
                const indent   = Math.round(fontSize*0.9+15);
                const spacing  = layer.spacing||20;
                let curY=0;
                layer.items.forEach((item, j) => {
                    if (!item) return;
                    const textDef = {
                        type:'text', content:item,
                        x:x+indent, y:y+curY,
                        width:w-indent, lineHeight:1.4,
                        font, color:layer.color||'#f0f0f0'
                    };
                    newLayers.push(textDef);
                    let itemH = fontSize*1.5;
                    if (this.renderer?.textEngine)
                        itemH = this.renderer.textEngine.measureTextBlockHeight(textDef);
                    curY += itemH+spacing;
                });
                layer.items = layer.items.map(() => '');
            }

            // ── NODEGRAPH (explosion) ─────────────────────────────
            if (t === 'nodegraph' && layer.nodes && !layer._exploded) {
                layer._exploded = true;
                const nodeRadius = 45;
                const groupId    = '_ng_'+Date.now()+'_'+i;
                const cx=x+w/2, cy=y+h/2;
                const nodeMap={};
                const unpos = layer.nodes.filter(n => n.x===undefined||n.y===undefined);
                let autoIdx=0;

                layer.nodes.forEach((n, idx) => {
                    let px, py;
                    if (n.x===undefined || n.y===undefined) {
                        if (unpos.length===1) { px=cx; py=cy; }
                        else {
                            const angle = (Math.PI*2*autoIdx)/unpos.length - Math.PI/2;
                            const r = Math.min(w,h)*0.35;
                            px=cx+r*Math.cos(angle); py=cy+r*Math.sin(angle);
                        }
                        autoIdx++;
                    } else { px=x+n.x*w; py=y+n.y*h; }
                    const icon = (n.icon && n.icon!=='???') ? n.icon : 'dns';
                    nodeMap[n.id] = { px, py, label:n.label, icon, hexId:'hex_'+n.id+'_'+Date.now()+idx };
                });

                (layer.connections||[]).forEach(conn => {
                    const nA=nodeMap[conn.from], nB=nodeMap[conn.to];
                    if (nA && nB) newLayers.push({
                        type:'connection_line',
                        startX:nA.px, startY:nA.py, endX:nB.px, endY:nB.py,
                        label:conn.label&&conn.label!=='???' ? conn.label : '',
                        color:conn.color||layer.color||undefined,
                        _freeMove:true, _fromNode:nA.hexId, _toNode:nB.hexId, _groupId:groupId
                    });
                });

                layer.nodes.forEach(n => {
                    const coords = nodeMap[n.id];
                    newLayers.push({
                        id:coords.hexId, type:'hexagon_node',
                        x:coords.px-nodeRadius, y:coords.py-nodeRadius,
                        size:nodeRadius, icon:coords.icon,
                        color:layer.color||undefined,
                        _freeMove:true, _groupId:groupId
                    });
                    if (coords.label) {
                        const lw = Math.max(180, coords.label.length*14);
                        newLayers.push({
                            type:'text', content:coords.label,
                            x:coords.px-lw/2, y:coords.py+nodeRadius+8,
                            width:lw, align:'center', lineHeight:1.2,
                            font:{size:20,weight:700,family:'MPLUS Code Latin'}, color:'#ffffff',
                            _freeMove:true, _parentId:coords.hexId, _groupId:groupId
                        });
                    }
                });

                layer._toDelete = true;
            }

            // Assign parentId to newly pushed text layers
            for (let k=startLen+1; k<newLayers.length; k++) {
                if (newLayers[k].type==='text' && !newLayers[k]._parentId)
                    newLayers[k]._parentId = parentId;
            }
        }

        // Mark free-move text layers
        newLayers.forEach(l => {
            if (l.type==='text' && !l.id && !l._freeMove) {
                l._freeMove = true;
                flattened   = true;
            }
        });

        graph.layers = newLayers.filter(l => !l._toDelete);
        return flattened;
    }

    // ═══════════════════════════════════════════════════════════════
    // LOAD
    // ═══════════════════════════════════════════════════════════════

    async load(sceneGraph) {
        // Deep clone — never mutate external input
        this.sceneGraph = JSON.parse(JSON.stringify(sceneGraph));
        this.selectedIdx  = -1;
        this.selectedIdxs = [];
        this.hoveredIdx   = -1;
        this._closeTextEditor();

        const hasUserMods = this.sceneGraph.layers?.some(l => l._freeMove);

        if (!hasUserMods) {
            // Pass 1: compute layout bounds
            await this.renderer.render(this.sceneGraph, { skipLayout:false });
            // Pass 2: flatten using precise bounds
            const flattened = this._flattenSceneGraph(this.sceneGraph, this.renderer.lastBounds||[]);
            // Pass 3: re-render newly independent layers
            if (flattened) await this.renderer.render(this.sceneGraph, { skipLayout:true });
        } else {
            this._flattenSceneGraph(this.sceneGraph, this.renderer.lastBounds||[]);
            await this.renderer.render(this.sceneGraph, { skipLayout:true });
        }

        this.overlayCanvas.width  = this.renderer.width;
        this.overlayCanvas.height = this.renderer.height;
        this._fitToContainer();
        this._buildEditableLayers();
        this._drawOverlay();
    }

    // ═══════════════════════════════════════════════════════════════
    // EDITABLE LAYERS
    // ═══════════════════════════════════════════════════════════════

    _buildEditableLayers() {
        this.editableLayers = [];
        if (!this.sceneGraph?.layers) return;
        const bounds = this.renderer.lastBounds||[];

        this.sceneGraph.layers.forEach((layer, i) => {
            if (layer.type==='background') return;
            const t     = (layer.type||'').toLowerCase();
            const bound = bounds.find(b => b.layerIndex===i);

            const box = {
                layerIndex: i,
                type:   layer.type,
                x:      bound ? bound.x      : (layer.x||0),
                y:      bound ? bound.y      : (layer.y||0),
                width:  bound ? bound.width  : (layer.width||200),
                height: bound ? bound.height : (layer.height||60),
                layer,
                locked:  layer._locked||false,
                hidden:  layer._hidden||false,
            };

            // Fix connection_line bounding box
            if (t==='connection_line') {
                box.x      = Math.min(layer.startX||0, layer.endX||0) - 20;
                box.y      = Math.min(layer.startY||0, layer.endY||0) - 20;
                box.width  = Math.abs((layer.endX||0)-(layer.startX||0))+40;
                box.height = Math.abs((layer.endY||0)-(layer.startY||0))+40;
            }

            // Fallback heights
            if (!box.height || box.height < 20) {
                const H = {
                    text:         (layer.font?.size||42)*2,
                    divider:      10,
                    accent_bar:   layer.height||6,
                    icon:         layer.size||80,
                    terminal:     200,
                    rect:         120,
                    barchart:     400,
                    checklist:    (layer.items?.length||3)*66,
                    gridbox:      250,
                    warningbox:   180,
                    directorytree:60+(layer.items?.length||3)*50,
                    toolgrid:     Math.ceil((layer.tools?.length||4)/(layer.tools?.length>4?3:2))*174,
                    attackflow:   (layer.stages?.length||3)*180,
                    architecturediag:(layer.layers?.length||3)*190,
                    codeblock:    layer.height||Math.max(250,60+(Math.min(30,(layer.code||'').split('\n').length)*30)),
                    hexdump:      (layer.lines||10)*35,
                    timeline:     (layer.events?.length||3)*120,
                    vs_table:     160+(layer.rows?.length||3)*90,
                    radarchart:   layer.height||500,
                    nodegraph:    layer.height||500,
                    hexagon_node: (layer.size||45)*2,
                    statbar:      60,
                    bulletlist:   (layer.items?.length||3)*80,
                    image:        box.width,
                };
                box.height = H[t] || 80;
            }

            this.editableLayers.push(box);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // COORDINATE HELPERS
    // ═══════════════════════════════════════════════════════════════

    _toCanvasCoords(e) {
        const rect  = this.wrapper.getBoundingClientRect();
        const scaleX = this.renderer.width  / rect.width;
        const scaleY = this.renderer.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top)  * scaleY
        };
    }

    _hitTest(mx, my) {
        for (let i=this.editableLayers.length-1; i>=0; i--) {
            const box = this.editableLayers[i];
            if (box.hidden) continue;
            if (box.type==='connection_line') {
                const { startX:sx, startY:sy, endX:ex, endY:ey } = box.layer;
                const l2 = (sx-ex)**2+(sy-ey)**2;
                let dist = 1e9;
                if (l2===0) {
                    dist = Math.hypot(mx-sx, my-sy);
                } else {
                    const t = Math.max(0,Math.min(1,((mx-sx)*(ex-sx)+(my-sy)*(ey-sy))/l2));
                    dist = Math.hypot(mx-(sx+t*(ex-sx)), my-(sy+t*(ey-sy)));
                }
                if (dist<=15) return i;
            } else if (mx>=box.x && mx<=box.x+box.width && my>=box.y && my<=box.y+box.height) {
                return i;
            }
        }
        return -1;
    }

    _hitTestHandle(mx, my) {
        if (this.selectedIdx<0) return null;
        const box = this.editableLayers[this.selectedIdx];
        if (!box) return null;
        const hs  = 14;
        for (const [name,pos] of Object.entries(this._getHandlePositions(box))) {
            if (Math.abs(mx-pos.x)<=hs && Math.abs(my-pos.y)<=hs) return name;
        }
        return null;
    }

    _hitTestRotateHandle(mx, my) {
        if (this.selectedIdx<0) return false;
        const box = this.editableLayers[this.selectedIdx];
        if (!box || box.type==='connection_line') return false;
        const cx = box.x + box.width/2;
        const rotY = box.y - 36;
        return Math.hypot(mx-cx, my-rotY) <= 12;
    }

    _getHandlePositions(box) {
        if (box.type==='connection_line') {
            return {
                start:{ x:box.layer.startX, y:box.layer.startY },
                end:  { x:box.layer.endX,   y:box.layer.endY   },
            };
        }
        const cx=box.x+box.width/2, cy=box.y+box.height/2;
        return {
            nw:{ x:box.x,             y:box.y              },
            n: { x:cx,                y:box.y              },
            ne:{ x:box.x+box.width,   y:box.y              },
            e: { x:box.x+box.width,   y:cy                 },
            se:{ x:box.x+box.width,   y:box.y+box.height   },
            s: { x:cx,                y:box.y+box.height   },
            sw:{ x:box.x,             y:box.y+box.height   },
            w: { x:box.x,             y:cy                 },
        };
    }

    _handleCursor(handle) {
        const map = {
            nw:'nw-resize', n:'n-resize', ne:'ne-resize',
            e:'e-resize', se:'se-resize', s:'s-resize',
            sw:'sw-resize', w:'w-resize',
            start:'crosshair', end:'crosshair'
        };
        return map[handle]||'default';
    }

    // ═══════════════════════════════════════════════════════════════
    // MOUSE EVENTS
    // ═══════════════════════════════════════════════════════════════

    _onMouseDown(e) {
        const { x, y } = this._toCanvasCoords(e);

        // Commit open text editor
        if (this.textEditor && this.editingIdx>=0) this._commitTextEdit();

        // ── Rotate handle ─────────────────────────────────────────
        if (this._hitTestRotateHandle(x, y)) {
            this.isRotating = true;
            const box = this.editableLayers[this.selectedIdx];
            this._rotateOriginX = box.x + box.width/2;
            this._rotateOriginY = box.y + box.height/2;
            this._rotateStartAngle = Math.atan2(y-this._rotateOriginY, x-this._rotateOriginX);
            this._rotateStartLayerAngle = box.layer._rotation||0;
            e.preventDefault(); return;
        }

        // ── Resize handle ─────────────────────────────────────────
        const handle = this._hitTestHandle(x, y);
        if (handle) {
            this.isResizing   = true;
            this.resizeHandle = handle;
            const box = this.editableLayers[this.selectedIdx];
            this.dragStartX = x; this.dragStartY = y;
            this.dragStartLayerX = box.x;   this.dragStartLayerY = box.y;
            this.dragStartLayerW = box.width; this.dragStartLayerH = box.height;
            if (box.type==='connection_line') {
                this.dragStartLineStartX = box.layer.startX;
                this.dragStartLineStartY = box.layer.startY;
                this.dragStartLineEndX   = box.layer.endX;
                this.dragStartLineEndY   = box.layer.endY;
            }
            e.preventDefault(); return;
        }

        // ── Marquee / selection ───────────────────────────────────
        const hitIdx = this._hitTest(x, y);

        if (hitIdx >= 0) {
            const box = this.editableLayers[hitIdx];
            if (box.locked) { e.preventDefault(); return; }

            if (e.shiftKey) {
                // Multi-select toggle
                const pos = this.selectedIdxs.indexOf(hitIdx);
                if (pos>=0) this.selectedIdxs.splice(pos,1);
                else        this.selectedIdxs.push(hitIdx);
                this.selectedIdx = hitIdx;
            } else {
                // Single select
                if (!this.selectedIdxs.includes(hitIdx)) this.selectedIdxs = [];
                this.selectedIdx = hitIdx;
            }

            this.isDragging   = true;
            this.dragStartX   = x; this.dragStartY = y;
            this.dragStartLayerX = box.layer.x||box.x;
            this.dragStartLayerY = box.layer.y||box.y;
            this.dragStartLayerW = box.width;
            this.dragStartLayerH = box.height;
            if (box.layer.type==='connection_line') {
                this.dragStartLineStartX = box.layer.startX;
                this.dragStartLineStartY = box.layer.startY;
                this.dragStartLineEndX   = box.layer.endX;
                this.dragStartLineEndY   = box.layer.endY;
            }
            this.overlayCanvas.style.cursor = 'grabbing';

            // Snapshot group siblings
            if (box.layer._groupId && this.sceneGraph?.layers) {
                this._dragGroupSnapshots = this.sceneGraph.layers
                    .filter(l => l._groupId===box.layer._groupId)
                    .map(l => ({
                        layer:l, startX:l.x||0, startY:l.y||0,
                        startSX:l.startX, startSY:l.startY, startEX:l.endX, startEY:l.endY
                    }));
            } else { this._dragGroupSnapshots = null; }

            // Snapshot multi-select siblings
            this._multiDragSnapshots = this.selectedIdxs.map(idx => {
                const b = this.editableLayers[idx];
                return { box:b, startX:b.layer.x||b.x, startY:b.layer.y||b.y };
            });

            // Snapshot parent-attached children
            if (box.layer.id) {
                this.editableLayers.forEach(cb => {
                    const l = cb.layer;
                    if (l._parentId===box.layer.id) { l._dragStartX=l.x; l._dragStartY=l.y; }
                });
            }
        } else {
            // Start marquee
            this.selectedIdx  = -1;
            this.selectedIdxs = [];
            this._marquee      = { x, y, w:0, h:0 };
            this._marqueeStart = { x, y };
        }

        this._drawOverlay();
        e.preventDefault();
    }

    _onMouseMove(e) {
        const { x, y } = this._toCanvasCoords(e);

        // ── Rotate ────────────────────────────────────────────────
        if (this.isRotating && this.selectedIdx>=0) {
            const angle = Math.atan2(y-this._rotateOriginY, x-this._rotateOriginX);
            const delta = angle - this._rotateStartAngle;
            const layer = this.editableLayers[this.selectedIdx].layer;
            layer._rotation = this._rotateStartLayerAngle + delta*(180/Math.PI);
            layer._freeMove = true;
            this._reRender();
            return;
        }

        // ── Drag ──────────────────────────────────────────────────
        if (this.isDragging && this.selectedIdx>=0) {
            const dx = x-this.dragStartX, dy = y-this.dragStartY;
            const box = this.editableLayers[this.selectedIdx];
            const layer = box.layer;

            if (layer._groupId && this._dragGroupSnapshots) {
                this._dragGroupSnapshots.forEach(snap => {
                    const l = snap.layer;
                    if (l.type==='connection_line') {
                        l.startX=Math.round(snap.startSX+dx); l.startY=Math.round(snap.startSY+dy);
                        l.endX  =Math.round(snap.startEX+dx); l.endY  =Math.round(snap.startEY+dy);
                        l.x=Math.min(l.startX,l.endX)-20; l.y=Math.min(l.startY,l.endY)-20;
                    } else {
                        l.x=Math.round(snap.startX+dx); l.y=Math.round(snap.startY+dy);
                    }
                    l._freeMove=true;
                });
            } else if (this.selectedIdxs.length>1 && this._multiDragSnapshots) {
                // Move all selected elements together
                this._multiDragSnapshots.forEach(snap => {
                    snap.box.layer.x = Math.round(snap.startX+dx);
                    snap.box.layer.y = Math.round(snap.startY+dy);
                    snap.box.layer._freeMove = true;
                });
            } else if (layer.type==='connection_line') {
                layer.startX=Math.round(this.dragStartLineStartX+dx); layer.startY=Math.round(this.dragStartLineStartY+dy);
                layer.endX  =Math.round(this.dragStartLineEndX+dx);   layer.endY  =Math.round(this.dragStartLineEndY+dy);
                layer.x=Math.min(layer.startX,layer.endX)-20; layer.y=Math.min(layer.startY,layer.endY)-20;
            } else {
                layer.x = Math.round(this.dragStartLayerX+dx);
                layer.y = Math.round(this.dragStartLayerY+dy);
            }

            layer._freeMove = true;

            // Center snap (single selection only)
            if (layer.type!=='connection_line' && this.selectedIdxs.length<=1) {
                const elCX = layer.x + (box.width||0)/2;
                const elCY = layer.y + (box.height||0)/2;
                const cCX  = this.renderer.width/2;
                const cCY  = this.renderer.height/2;
                const snap = 8;
                this._snappedX = false; this._snappedY = false;
                if (Math.abs(elCX-cCX)<snap) { layer.x=cCX-(box.width||0)/2; this._snappedX=true; }
                if (Math.abs(elCY-cCY)<snap) { layer.y=cCY-(box.height||0)/2; this._snappedY=true; }
            }

            // Drag parent-attached children
            if (layer.id) {
                this.editableLayers.forEach(cb => {
                    const l = cb.layer;
                    if (l._parentId===layer.id && l._dragStartX!==undefined) {
                        l.x = Math.round(l._dragStartX+(layer.x-this.dragStartLayerX));
                        l.y = Math.round(l._dragStartY+(layer.y-this.dragStartLayerY));
                        l._freeMove=true;
                    }
                });
            }

            this._reRender();

        } else if (this.isResizing && this.selectedIdx>=0) {
            const dx=x-this.dragStartX, dy=y-this.dragStartY;
            const layer=this.editableLayers[this.selectedIdx].layer;
            const h=this.resizeHandle;

            if (layer.type==='connection_line') {
                if (h==='start') { layer.startX=Math.round(this.dragStartLineStartX+dx); layer.startY=Math.round(this.dragStartLineStartY+dy); layer._fromNode=null; }
                else if (h==='end') { layer.endX=Math.round(this.dragStartLineEndX+dx); layer.endY=Math.round(this.dragStartLineEndY+dy); layer._toNode=null; }
                layer.x=Math.min(layer.startX,layer.endX)-20; layer.y=Math.min(layer.startY,layer.endY)-20;
                layer.width=Math.abs(layer.endX-layer.startX)+40; layer.height=Math.abs(layer.endY-layer.startY)+40;
                layer._userResized=true; layer._freeMove=true;
                this._reRender(); return;
            }

            let newX=this.dragStartLayerX, newY=this.dragStartLayerY;
            let newW=this.dragStartLayerW, newH=this.dragStartLayerH;

            // Aspect ratio: images/icons always, Shift for others
            const keepRatio = layer.type==='image'||layer.type==='icon'||layer.type==='hexagon_node'||(e.shiftKey&&layer.type!=='text');
            const ratio = this.dragStartLayerW / (this.dragStartLayerH||1);

            if (keepRatio) {
                const movement = Math.abs(dx)>Math.abs(dy) ? dx : dy;
                const dir = (h.includes('e')||h.includes('s')) ? 1 : -1;
                const scale = (this.dragStartLayerW + dir*movement) / this.dragStartLayerW;
                newW = this.dragStartLayerW*scale; newH = this.dragStartLayerH*scale;
                if (h.includes('w')) newX = this.dragStartLayerX-(newW-this.dragStartLayerW);
                if (h.includes('n')) newY = this.dragStartLayerY-(newH-this.dragStartLayerH);
            } else {
                if (h.includes('e')) newW+=dx;
                if (h.includes('w')) { newX+=dx; newW-=dx; }
                if (h.includes('s')) newH+=dy;
                if (h.includes('n')) { newY+=dy; newH-=dy; }
            }

            // Minimums
            const mins = { terminal:[200,100], rect:[100,80], bar_chart:[200,150], check_list:[150,100] };
            const [minW,minH] = mins[layer.type]||[60,30];
            if (newW<minW) { if(h.includes('w')) newX-=(minW-newW); newW=minW; }
            if (newH<minH) { if(h.includes('n')) newY-=(minH-newH); newH=minH; }

            layer._userResized=true; layer._freeMove=true;
            layer.x=Math.round(newX); layer.y=Math.round(newY);
            layer.width=Math.round(newW); layer.height=Math.round(newH);
            if (layer.type==='hexagon_node') layer.size=Math.max(20,Math.round(newW/2));

            this.editableLayers[this.selectedIdx].width  = layer.width;
            this.editableLayers[this.selectedIdx].height = layer.height;
            this._reRender();

        } else if (this._marquee && this._marqueeStart) {
            // Update marquee selection
            this._marquee = {
                x: Math.min(x, this._marqueeStart.x),
                y: Math.min(y, this._marqueeStart.y),
                w: Math.abs(x-this._marqueeStart.x),
                h: Math.abs(y-this._marqueeStart.y),
            };
            this._drawOverlay();

        } else {
            // Hover detection + cursor feedback
            if (this._hitTestRotateHandle(x, y)) {
                this.overlayCanvas.style.cursor = 'crosshair'; return;
            }
            const handle = this._hitTestHandle(x, y);
            if (handle) { this.overlayCanvas.style.cursor = this._handleCursor(handle); return; }
            const hitIdx = this._hitTest(x, y);
            this.hoveredIdx = hitIdx;
            this.overlayCanvas.style.cursor = hitIdx>=0 ? (this.editableLayers[hitIdx].locked ? 'not-allowed' : 'grab') : 'default';
        }
    }

    _onMouseUp(e) {
        if (this._marquee && this._marqueeStart) {
            // Finalize marquee — select all elements whose center is inside
            const m = this._marquee;
            this.selectedIdxs = [];
            this.editableLayers.forEach((box, i) => {
                if (box.hidden || box.locked) return;
                const cx=box.x+box.width/2, cy=box.y+box.height/2;
                if (cx>=m.x && cx<=m.x+m.w && cy>=m.y && cy<=m.y+m.h)
                    this.selectedIdxs.push(i);
            });
            if (this.selectedIdxs.length===1) this.selectedIdx=this.selectedIdxs[0];
            else if (this.selectedIdxs.length>1) this.selectedIdx=this.selectedIdxs[0];
            this._marquee=null; this._marqueeStart=null;
            this._drawOverlay(); return;
        }

        if (this.isDragging || this.isResizing || this.isRotating) {
            if (this.selectedIdx>=0) {
                const box = this.editableLayers[this.selectedIdx];
                if (box?.layer) box.layer._freeMove=true;
            }
            this.isDragging=false; this.isResizing=false; this.isRotating=false;
            this.resizeHandle=null;
            this.overlayCanvas.style.cursor='default';
            // Notify — toolbar/view will pick this up
            if (this.onChange) this.onChange(this.sceneGraph);
        }
    }

    _onDoubleClick(e) {
        const { x, y } = this._toCanvasCoords(e);
        const hitIdx = this._hitTest(x, y);
        if (hitIdx>=0) this._openTextEditor(hitIdx);
    }

    _onContextMenu(e) {
        e.preventDefault();
        // Dispatch custom event so toolbar/view can show a context menu
        const { x, y } = this._toCanvasCoords(e);
        const hitIdx = this._hitTest(x, y);
        const detail = {
            clientX:e.clientX, clientY:e.clientY,
            canvasX:x, canvasY:y,
            layerIdx: hitIdx,
            layer: hitIdx>=0 ? this.editableLayers[hitIdx].layer : null,
        };
        this.container.dispatchEvent(new CustomEvent('editor-contextmenu', { bubbles:true, detail }));
    }

    _onKeyDown(e) {
        const tag = document.activeElement?.tagName?.toLowerCase();
        const inInput = tag==='input'||tag==='textarea'||tag==='select';
        const inTextEditor = document.activeElement?.classList?.contains('canvas-text-editor');
        if (inInput && !inTextEditor) return;

        const ctrl = e.ctrlKey||e.metaKey;

        // Ctrl+A — select all
        if (ctrl && e.key==='a') {
            e.preventDefault();
            this.selectedIdxs = this.editableLayers
                .map((_,i)=>i)
                .filter(i => !this.editableLayers[i].locked && !this.editableLayers[i].hidden);
            this.selectedIdx = this.selectedIdxs[0]??-1;
            this._drawOverlay(); return;
        }

        // Delete / Backspace
        if ((e.key==='Delete'||e.key==='Backspace') && this.selectedIdx>=0 && this.editingIdx<0) {
            const box = this.editableLayers[this.selectedIdx];
            if (box.type!=='brand'&&box.type!=='swipe'&&box.type!=='page_number'&&!box.locked) {
                this.sceneGraph.layers.splice(box.layerIndex, 1);
                this.selectedIdx=-1; this.selectedIdxs=[];
                this._reRender();
                if (this.onChange) this.onChange(this.sceneGraph);
            }
            e.preventDefault(); return;
        }

        // Escape
        if (e.key==='Escape') {
            this.selectedIdx=-1; this.selectedIdxs=[];
            this._closeTextEditor();
            this._drawOverlay(); return;
        }

        // Arrow nudge (throttled)
        if (this.selectedIdx>=0 && this.editingIdx<0 &&
            ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
            e.preventDefault();
            if (this._nudgeThrottle) return;
            this._nudgeThrottle = setTimeout(()=>{ this._nudgeThrottle=null; }, 32);

            const layer = this.editableLayers[this.selectedIdx].layer;
            layer._freeMove = true;
            const step = e.shiftKey ? 10 : 2;
            const dx = e.key==='ArrowLeft' ? -step : e.key==='ArrowRight' ? step : 0;
            const dy = e.key==='ArrowUp'   ? -step : e.key==='ArrowDown'  ? step : 0;

            if (layer.type==='connection_line') {
                layer.startX+=dx; layer.startY+=dy;
                layer.endX+=dx;   layer.endY+=dy;
                layer.x=Math.min(layer.startX,layer.endX)-20;
                layer.y=Math.min(layer.startY,layer.endY)-20;
            } else {
                layer.x=(layer.x||0)+dx; layer.y=(layer.y||0)+dy;
            }

            // Update attached lines if nudging a hexagon
            if (layer.type==='hexagon_node' && this.sceneGraph?.layers) {
                const cx=layer.x+(layer.size||45), cy=layer.y+(layer.size||45);
                this.sceneGraph.layers.forEach(l => {
                    if (l.type==='connection_line') {
                        if (l._fromNode===layer.id) { l.startX=cx; l.startY=cy; }
                        if (l._toNode  ===layer.id) { l.endX=cx;   l.endY=cy;   }
                    }
                });
            }

            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
            return;
        }

        // Layer ordering: ] / [
        if (this.selectedIdx>=0) {
            if (e.key===']') { e.preventDefault(); e.shiftKey ? this.bringToFront() : this.bringForward(); }
            if (e.key==='[') { e.preventDefault(); e.shiftKey ? this.sendToBack()   : this.sendBackward(); }
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // TEXT EDITING
    // ═══════════════════════════════════════════════════════════════

    _openTextEditor(idx) {
        this._closeTextEditor();
        const box   = this.editableLayers[idx];
        const layer = box.layer;
        if (box.locked) return;

        let textValue='', textProp=null;
        if (layer.content!==undefined) { textValue=layer.content; textProp='content'; }
        else if (layer.title!==undefined)  { textValue=layer.title;   textProp='title'; }
        else if (layer.label!==undefined)  { textValue=layer.label;   textProp='label'; }
        if (!textProp && layer.type!=='text') return;

        this.editingIdx  = idx;
        this.editingProp = textProp||'content';

        const ta = document.createElement('textarea');
        ta.className = 'canvas-text-editor';
        ta.value     = textValue||'';
        ta.style.cssText = [
            'position:absolute',
            `left:${box.x}px`, `top:${box.y}px`,
            `width:${box.width}px`, `min-height:${Math.max(box.height,80)}px`,
            'background:rgba(0,0,0,0.88)', 'color:#00D9FF',
            'border:2px solid #00D9FF', 'border-radius:8px',
            'padding:12px',
            'font-family:"MPLUS Code Latin",monospace',
            'font-size:'+Math.max(28, layer.font?.size||42)+'px',
            'resize:none', 'outline:none', 'z-index:100', 'overflow-y:auto',
            'line-height:1.3',
        ].join(';');

        ta.addEventListener('blur', ()=> this._commitTextEdit());
        ta.addEventListener('keydown', (ev)=>{
            if (ev.key==='Escape') { this._closeTextEditor(); ev.stopPropagation(); }
            // Ctrl+Enter commits
            if (ev.key==='Enter' && (ev.ctrlKey||ev.metaKey)) { this._commitTextEdit(); ev.stopPropagation(); }
        });

        this.wrapper.appendChild(ta);
        this.textEditor = ta;
        requestAnimationFrame(()=>{ ta.focus(); ta.select(); });
    }

    _commitTextEdit() {
        if (this._isClosingEditor || this.editingIdx<0 || !this.textEditor) return;
        const box     = this.editableLayers[this.editingIdx];
        const newText = this.textEditor.value;
        const prop    = this.editingProp||'content';
        if (newText !== box.layer[prop]) {
            box.layer[prop] = newText;
            this._closeTextEditor();
            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
        } else {
            this._closeTextEditor();
        }
    }

    _closeTextEditor() {
        if (this._isClosingEditor) return;
        this._isClosingEditor = true;
        if (this.textEditor) {
            this.textEditor.onblur = null;
            try { this.textEditor.parentNode?.removeChild(this.textEditor); } catch(_) {}
        }
        this.wrapper?.querySelectorAll('.canvas-text-editor').forEach(el=>el.remove());
        this.textEditor = null;
        this.editingIdx = -1;
        this._isClosingEditor = false;
    }

    // ═══════════════════════════════════════════════════════════════
    // RE-RENDER & OVERLAY
    // ═══════════════════════════════════════════════════════════════

    async _reRender() {
        await this.renderer.render(this.sceneGraph, { skipLayout:true });
        this._buildEditableLayers();
        this._drawOverlay();
    }

    _drawOverlay() {
        const ctx = this.overlayCtx;
        const W   = this.overlayCanvas.width;
        const H   = this.overlayCanvas.height;
        ctx.clearRect(0, 0, W, H);

        // ── Rulers ───────────────────────────────────────────────
        this._drawRulers(ctx, W, H);

        // ── Center crosshair ─────────────────────────────────────
        const cx = W/2, cy = H/2;
        ctx.save();
        ctx.strokeStyle = 'rgba(0,217,255,0.5)'; ctx.lineWidth=1.5; ctx.setLineDash([8,6]);
        ctx.beginPath(); ctx.moveTo(cx,0); ctx.lineTo(cx,H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();
        ctx.setLineDash([]); ctx.strokeStyle='rgba(0,217,255,0.9)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(cx-20,cy); ctx.lineTo(cx+20,cy); ctx.moveTo(cx,cy-20); ctx.lineTo(cx,cy+20); ctx.stroke();
        ctx.restore();

        // ── 300px content limit line ──────────────────────────────
        ctx.save();
        ctx.setLineDash([10,5]); ctx.strokeStyle='rgba(0,255,150,0.55)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(0,300); ctx.lineTo(W,300); ctx.stroke();
        ctx.setLineDash([]); ctx.font='12px monospace'; ctx.fillStyle='rgba(0,255,150,0.7)';
        ctx.fillText('▼ 300px', 20, 294);
        ctx.restore();

        // ── Hover highlight ───────────────────────────────────────
        if (this.hoveredIdx>=0 && !this.selectedIdxs.includes(this.hoveredIdx) && this.hoveredIdx!==this.selectedIdx) {
            const box = this.editableLayers[this.hoveredIdx];
            if (box && !box.hidden) {
                ctx.strokeStyle='rgba(0,217,255,0.25)'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.setLineDash([]);
            }
        }

        // ── Multi-select highlight ────────────────────────────────
        if (this.selectedIdxs.length > 1) {
            this.selectedIdxs.forEach(idx => {
                if (idx===this.selectedIdx) return;
                const box = this.editableLayers[idx];
                if (!box||box.hidden) return;
                ctx.strokeStyle='rgba(168,85,247,0.7)'; ctx.lineWidth=1.5; ctx.setLineDash([4,4]);
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                ctx.setLineDash([]);
            });
        }

        // ── Marquee ───────────────────────────────────────────────
        if (this._marquee) {
            const m = this._marquee;
            ctx.fillStyle='rgba(0,217,255,0.06)';
            ctx.fillRect(m.x, m.y, m.w, m.h);
            ctx.strokeStyle='rgba(0,217,255,0.5)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
            ctx.strokeRect(m.x, m.y, m.w, m.h);
            ctx.setLineDash([]);
        }

        // ── Selected element ──────────────────────────────────────
        if (this.selectedIdx>=0) {
            const box = this.editableLayers[this.selectedIdx];
            if (!box||box.hidden) return;

            // Alignment guides while dragging
            if (this.isDragging||this.isResizing) this._drawAlignmentGuides(ctx, box, W, H);

            // Lock indicator
            if (box.locked) {
                ctx.strokeStyle='rgba(255,165,0,0.7)'; ctx.lineWidth=2; ctx.setLineDash([6,3]);
                ctx.strokeRect(box.x-1, box.y-1, box.width+2, box.height+2);
                ctx.setLineDash([]);
                return; // No handles for locked elements
            }

            // Selection border
            ctx.strokeStyle='#00D9FF'; ctx.lineWidth=2; ctx.setLineDash([]);
            ctx.strokeRect(box.x-1, box.y-1, box.width+2, box.height+2);

            // Resize handles
            const handles = this._getHandlePositions(box);
            const hs = 10;
            for (const [,pos] of Object.entries(handles)) {
                ctx.fillStyle='#000'; ctx.strokeStyle='#00D9FF'; ctx.lineWidth=1.5;
                ctx.beginPath(); ctx.rect(pos.x-hs/2, pos.y-hs/2, hs, hs); ctx.fill(); ctx.stroke();
            }

            // Rotate handle (circle above center top, not for connection_line)
            if (box.type!=='connection_line') {
                const rcx=box.x+box.width/2, rcy=box.y-36;
                // Connecting stem
                ctx.strokeStyle='rgba(0,217,255,0.4)'; ctx.lineWidth=1;
                ctx.beginPath(); ctx.moveTo(rcx,box.y); ctx.lineTo(rcx,rcy+10); ctx.stroke();
                // Circle
                ctx.fillStyle='#000'; ctx.strokeStyle='#00D9FF'; ctx.lineWidth=1.5;
                ctx.beginPath(); ctx.arc(rcx, rcy, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
                // Rotate icon hint
                ctx.strokeStyle='#00D9FF'; ctx.lineWidth=1.5;
                ctx.beginPath(); ctx.arc(rcx, rcy, 4, -Math.PI*0.7, Math.PI*0.7); ctx.stroke();
            }

            // Type badge
            this._drawTypeBadge(ctx, box);

            // Position/size label
            const info = `${Math.round(box.x)},${Math.round(box.y)}  ${Math.round(box.width)}×${Math.round(box.height)}`;
            ctx.font='500 15px "MPLUS Code Latin",monospace';
            const infoW = ctx.measureText(info).width+14;
            ctx.fillStyle='rgba(0,0,0,0.8)';
            ctx.fillRect(box.x, box.y+box.height+5, infoW, 20);
            ctx.fillStyle='#00D9FF'; ctx.textBaseline='middle';
            ctx.fillText(info, box.x+7, box.y+box.height+15);
            ctx.textBaseline='alphabetic';
        }
    }

    _drawTypeBadge(ctx, box) {
        const label = box.type.toUpperCase();
        ctx.font = '700 17px "MPLUS Code Latin",sans-serif';
        const lw = ctx.measureText(label).width+14, lh=24;
        const lx = box.x, ly = box.y-lh-5;
        if (ly < 0) return;
        ctx.fillStyle='#00D9FF';
        ctx.beginPath(); ctx.roundRect(lx, ly, lw, lh, 4); ctx.fill();
        ctx.fillStyle='#000'; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.fillText(label, lx+7, ly+lh/2);
        ctx.textBaseline='alphabetic';
    }

    _drawAlignmentGuides(ctx, box, W, H) {
        const bx = box.x, by=box.y, bw=box.width, bh=box.height;
        ctx.save();
        ctx.strokeStyle='rgba(255,80,80,0.45)'; ctx.lineWidth=1; ctx.setLineDash([4,6]);
        [bx, bx+bw/2, bx+bw].forEach(xp => {
            ctx.beginPath(); ctx.moveTo(xp,0); ctx.lineTo(xp,H); ctx.stroke();
        });
        [by, by+bh/2, by+bh].forEach(yp => {
            ctx.beginPath(); ctx.moveTo(0,yp); ctx.lineTo(W,yp); ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.font='400 13px monospace'; ctx.fillStyle='rgba(255,120,120,0.75)';
        ctx.textAlign='left';
        ctx.fillText(Math.round(bx)+'px', bx+4, 16);
        ctx.fillText(Math.round(bx+bw)+'px', bx+bw+4, 16);
        ctx.fillText(Math.round(by)+'px', 4, by-3);
        ctx.fillText(Math.round(by+bh)+'px', 4, by+bh-3);
        ctx.restore();
    }

    _drawRulers(ctx, W, H) {
        ctx.save();
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.strokeStyle='rgba(255,255,255,0.08)';
        ctx.font='400 11px monospace'; ctx.lineWidth=1;
        ctx.textAlign='center';
        for (let x=0; x<=W; x+=100) {
            ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x, x%500===0?14:7); ctx.stroke();
            if (x%200===0&&x>0) ctx.fillText(x,x,22);
        }
        ctx.textAlign='left';
        for (let y=0; y<=H; y+=100) {
            ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(y%500===0?14:7,y); ctx.stroke();
            if (y%200===0&&y>0) ctx.fillText(y,4,y+12);
        }
        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER ORDER
    // ═══════════════════════════════════════════════════════════════

    _swapLayers(idxA, idxB) {
        const layers = this.sceneGraph.layers;
        [layers[idxA], layers[idxB]] = [layers[idxB], layers[idxA]];
        // Update editable layer indices
        const boxA = this.editableLayers.find(b=>b.layerIndex===idxA);
        const boxB = this.editableLayers.find(b=>b.layerIndex===idxB);
        if (boxA) boxA.layerIndex=idxB;
        if (boxB) boxB.layerIndex=idxA;
        this._reRender();
        if (this.onChange) this.onChange(this.sceneGraph);
    }

    bringForward() {
        if (this.selectedIdx<0||!this.sceneGraph) return;
        const box=this.editableLayers[this.selectedIdx];
        if (box.layerIndex < this.sceneGraph.layers.length-1)
            this._swapLayers(box.layerIndex, box.layerIndex+1);
    }

    sendBackward() {
        if (this.selectedIdx<0||!this.sceneGraph) return;
        const box=this.editableLayers[this.selectedIdx];
        if (box.layerIndex > 1) this._swapLayers(box.layerIndex, box.layerIndex-1);
    }

    bringToFront() {
        if (this.selectedIdx<0||!this.sceneGraph) return;
        const box=this.editableLayers[this.selectedIdx];
        const layers=this.sceneGraph.layers;
        if (box.layerIndex < layers.length-1) {
            const layer=layers.splice(box.layerIndex,1)[0];
            layers.push(layer);
            this._buildEditableLayers();
            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
        }
    }

    sendToBack() {
        if (this.selectedIdx<0||!this.sceneGraph) return;
        const box=this.editableLayers[this.selectedIdx];
        const layers=this.sceneGraph.layers;
        if (box.layerIndex > 1) {
            const layer=layers.splice(box.layerIndex,1)[0];
            layers.splice(1,0,layer); // After background
            this._buildEditableLayers();
            this._reRender();
            if (this.onChange) this.onChange(this.sceneGraph);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    getModifiedSceneGraph() { return this.sceneGraph; }

    async applyTheme(themeName) {
        if (!this.sceneGraph||!this.renderer.brandingSystem) return;
        this.sceneGraph = this.renderer.brandingSystem.applyTheme(this.sceneGraph, themeName);
        this.sceneGraph.theme = themeName;
        await this._reRender();
    }

    exportDataURL() { return this.renderer.exportDataURL('image/png', 1.0); }

    updateScale() { this._fitToContainer(); }

    /** Lock/unlock a layer by editableLayers index */
    toggleLock(idx) {
        if (idx===undefined) idx=this.selectedIdx;
        if (idx<0) return;
        const layer = this.editableLayers[idx]?.layer;
        if (!layer) return;
        layer._locked = !layer._locked;
        this._buildEditableLayers();
        this._drawOverlay();
    }

    /** Show/hide a layer by editableLayers index */
    toggleVisible(idx) {
        if (idx===undefined) idx=this.selectedIdx;
        if (idx<0) return;
        const layer = this.editableLayers[idx]?.layer;
        if (!layer) return;
        layer._hidden = !layer._hidden;
        this._reRender();
    }

    /** Align selected elements relative to canvas or each other */
    alignLayers(alignment) {
        const idxs = this.selectedIdxs.length>1 ? this.selectedIdxs : (this.selectedIdx>=0 ? [this.selectedIdx] : []);
        if (!idxs.length) return;
        const W=this.renderer.width, H=this.renderer.height;
        idxs.forEach(i => {
            const box=this.editableLayers[i], l=box.layer;
            l._freeMove=true;
            switch(alignment) {
                case 'left':   l.x=0; break;
                case 'right':  l.x=W-box.width; break;
                case 'center': l.x=Math.round((W-box.width)/2); break;
                case 'top':    l.y=0; break;
                case 'bottom': l.y=H-box.height; break;
                case 'middle': l.y=Math.round((H-box.height)/2); break;
            }
        });
        this._reRender();
        if (this.onChange) this.onChange(this.sceneGraph);
    }

    destroy() {
        if (this._resizeObserver) this._resizeObserver.disconnect();
        if (this._bound) {
            this.overlayCanvas?.removeEventListener('mousedown',   this._bound.mousedown);
            this.overlayCanvas?.removeEventListener('mousemove',   this._bound.mousemove);
            this.overlayCanvas?.removeEventListener('mouseup',     this._bound.mouseup);
            this.overlayCanvas?.removeEventListener('dblclick',    this._bound.dblclick);
            this.overlayCanvas?.removeEventListener('contextmenu', this._bound.contextmenu);
            document.removeEventListener('keydown', this._bound.keydown);
        }
        clearTimeout(this._nudgeThrottle);
        this._closeTextEditor();
        if (this.container) this.container.innerHTML='';
        this.sceneGraph=null; this.editableLayers=[]; this.selectedIdx=-1;
    }
}

if (typeof module!=='undefined') module.exports = CanvasEditor;
else window.CanvasEditor = CanvasEditor;
