/* ═══════════════════════════════════════════════════════════════════════════ */
/* TEMPLATE UTILS (Shared Logic) */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const TemplateUtils = {
    // 1. Generate Metadata Badge based on slide data
    // Reduced size and moved to top-right corner to avoid clash
    renderMetaBadge(data) {
        if (!data.SLIDE_INDEX || !data.TOTAL_SLIDES) return '';
        return `
            <div class="meta-badge" style="position: absolute; top: 15px; right: 15px; 
                font-family: 'JetBrains Mono'; font-size: 14px; 
                background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px; 
                border: 1px solid rgba(255,255,255,0.1); color: #888; z-index: 100;">
                <span style="color: var(--primary-color);">${data.SLIDE_INDEX}/${data.TOTAL_SLIDES}</span>
            </div>
        `;
    },

    // Returns the centered Logo + Text structure for standard templates (Standardized v2)
    renderBrandHeader() {
        return `
            <div class="brand-header-global" style="
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                width: 100%; 
                height: 150px; /* Fixed height for consistency */
                padding-top: 30px; 
                margin-bottom: 20px;
                box-sizing: border-box;
            ">
                <img src="../assets/kr-clidn-logo.png" style="width: 80px; height: 80px; margin-bottom: 12px; filter: drop-shadow(0 0 15px rgba(0,217,255,0.6)); object-fit: contain;" />
                <!-- Text -->
                <div style="
                    font-family: 'JetBrains Mono', monospace; font-weight: 800; 
                    font-size: 24px; letter-spacing: 6px; color: #fff;
                    text-shadow: 0 0 20px rgba(0,217,255,0.5);
                    text-transform: uppercase;
                ">KR-CLIDN</div>
            </div>
        `;
    },

    // 2. Escape HTML to prevent XSS in content
    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // 3. Auto-fit script (injected as string)
    getAutoFitScript() {
        return `
        <script>
            (function() {
                function fitContent() {
                    const safeZone = document.querySelector('.safe-zone');
                    if (!safeZone) return;
                    
                    // Simple logic: if overflowing, scale down base font size
                    const maxLoops = 20;
                    let loop = 0;
                    
                    while (safeZone.scrollHeight > safeZone.clientHeight && loop < maxLoops) {
                        const textElements = document.querySelectorAll('.cyber-subtitle, .term-body, .glass-panel p');
                        let resized = false;
                        
                        textElements.forEach(el => {
                            let size = parseFloat(window.getComputedStyle(el).fontSize);
                            if (size > 16) {
                                el.style.fontSize = (size - 1) + 'px';
                                resized = true;
                            }
                        });
                        
                        if (!resized) break;
                        loop++;
                    }
                }
                window.addEventListener('load', fitContent);
            })();
        </script>
        `;
    },

    // 4. Visual Editor Helper: Wraps content to be editable
    renderEditable(id, content, overrides = {}) {
        // If specific style override exists for this ID, apply it
        // Overrides format: { 'TITLE': { x: 10, y: 20, color: '#fff' } }
        let styleStr = '';
        if (overrides[id]) {
            const o = overrides[id];
            if (o.x !== undefined && o.y !== undefined) {
                // Use translate for performance
                styleStr += `transform: translate(${o.x}px, ${o.y}px);`;
            }
            if (o.color) styleStr += `color: ${o.color};`;
            if (o.fontSize) styleStr += `font-size: ${o.fontSize}px;`;
        }

        // We use display: inline-block or block depending on context? 
        // For text, usually block or inline-block. Let's default to a wrapper that doesn't break flow too much.
        // Actually, for drag & drop, positioning might need to be 'relative' or just transform.
        // We'll add a class 'editable-element'
        return `
            <div class="editable-element" 
                 data-editable-id="${id}" 
                 style="position: relative; transition: box-shadow 0.2s; ${styleStr}">
                ${content}
            </div>
        `;
    },

    // 5. Interactivity Script: Injected into IFrame to handle Select/Drag
    getInteractivityScript() {
        return `
        <style>
            .editable-element:hover {
                outline: 2px dashed rgba(0, 217, 255, 0.5);
                cursor: grab;
            }
            .editable-element.selected {
                outline: 2px solid #00d9ff;
                z-index: 1000;
            }
            .editable-element.dragging {
                cursor: grabbing;
                outline: 2px dashed #ff0055;
            }
        </style>
        <script>
            (function() {
                let selectedId = null;
                let draggedEl = null;
                let startX, startY, initialTransformX = 0, initialTransformY = 0;

                // Helper to parse translate(x, y)
                function getTranslate(el) {
                    const style = window.getComputedStyle(el);
                    const matrix = new WebKitCSSMatrix(style.transform);
                    return { x: matrix.m41, y: matrix.m42 };
                }

                document.addEventListener('mousedown', (e) => {
                    const el = e.target.closest('.editable-element');
                    if (!el) {
                        // Deselect if clicking empty space
                        if (selectedId) {
                            selectedId = null;
                            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                            window.parent.postMessage({ type: 'DESELECT' }, '*');
                        }
                        return;
                    }

                    e.preventDefault(); // Prevent text selection/dragging image
                    
                    // Select logic
                    if (selectedId !== el.dataset.editableId) {
                        document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                        el.classList.add('selected');
                        selectedId = el.dataset.editableId;
                        window.parent.postMessage({ type: 'SELECT', id: selectedId }, '*');
                    }

                    // Drag Init
                    draggedEl = el;
                    draggedEl.classList.add('dragging');
                    startX = e.clientX;
                    startY = e.clientY;
                    
                    const currentPos = getTranslate(draggedEl);
                    initialTransformX = currentPos.x;
                    initialTransformY = currentPos.y;

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                });

                function onMouseMove(e) {
                    if (!draggedEl) return;
                    
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;

                    const newX = initialTransformX + dx;
                    const newY = initialTransformY + dy;

                    draggedEl.style.transform = \`translate(\${newX}px, \${newY}px)\`;
                }

                function onMouseUp(e) {
                    if (!draggedEl) return;
                    
                    const finalPos = getTranslate(draggedEl);
                    
                    // Notify Host to save
                    window.parent.postMessage({ 
                        type: 'UPDATE_POS', 
                        id: draggedEl.dataset.editableId,
                        x: finalPos.x,
                        y: finalPos.y
                    }, '*');

                    draggedEl.classList.remove('dragging');
                    draggedEl = null;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }
            })();
        </script>
        `;
    },

    // 6. Cyber Effects Script (Matrix Rain)
    getCyberEffectsScript() {
        return `
        <script>
            window.startMatrixRain = function(containerId, useThemeColor = true) {
                const container = document.getElementById(containerId);
                if (!container) return;

                const canvas = document.createElement('canvas');
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.zIndex = '0'; // Behind content but in front of bg
                container.appendChild(canvas);

                const ctx = canvas.getContext('2d');
                let width, height;
                let drops = [];

                function resize() {
                    width = canvas.width = container.offsetWidth;
                    height = canvas.height = container.offsetHeight;
                    const fontSize = 16;
                    const columns = Math.ceil(width / fontSize);
                    drops = [];
                    for (let i = 0; i < columns; i++) {
                        drops[i] = Math.random() * -100;
                    }
                }
                
                new ResizeObserver(resize).observe(container);
                resize();

                const chars = "0123456789ABCDEF<>/{}[]*&^%$#@!qwertyuiopasdfghjklzxcvbnm";
                const fontSize = 16;
                // Cache computed style helper
                const docStyle = getComputedStyle(document.documentElement);

                function draw() {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                    ctx.fillRect(0, 0, width, height);

                    // Dynamic Color
                    let color = '#00D9FF';
                    if (useThemeColor) {
                        color = docStyle.getPropertyValue('--primary-color').trim() || '#00D9FF';
                    } else if (typeof useThemeColor === 'string') {
                         color = useThemeColor;
                    }

                    ctx.fillStyle = color;
                    ctx.font = \`\${fontSize}px monospace\`;

                    for (let i = 0; i < drops.length; i++) {
                        const text = chars.charAt(Math.floor(Math.random() * chars.length));
                        const x = i * fontSize;
                        const y = drops[i] * fontSize;

                        if (Math.random() > 0.98) {
                             ctx.fillStyle = '#fff'; // Sparkle
                        } else {
                             ctx.fillStyle = color;
                        }
                        ctx.fillText(text, x, y);

                        if (y > height && Math.random() > 0.975) drops[i] = 0;
                        drops[i]++;
                    }
                    requestAnimationFrame(draw);
                }
                draw();
            };
        </script>
        `;
    }
};

window.TemplateUtils = TemplateUtils;
