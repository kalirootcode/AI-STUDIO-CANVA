export function getEbookHeader(customText = 'KR-CLIDN') {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid rgba(255,255,255,0.05);">
            <div style="display:flex; align-items:center; gap: 16px;">
                <img src="../assets/kr-clidn-logo.png" style="height: 48px; width: auto; border-radius: 8px; object-fit: contain;">
                <span style="font-family:var(--font-title); font-size: 30px; font-weight:800; color:#fff; letter-spacing: 2px;">${customText}</span>
            </div>
            <div class="mono" style="font-size: 30px; color: var(--text-muted); padding: 8px 16px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                EDICIÓN PREMIUM
            </div>
        </div>
    `;
}

function getEbookPagination(current, total) {
    if (!current || !total) return '';
    return `
        <div style="position: absolute; bottom: 40px; left: 0; width: 100%; display:flex; justify-content:center; align-items:center; gap: 24px; z-index: 100;">
            <div style="font-family: var(--font-mono); font-size: 30px; color: var(--text-muted);">
                PÁGINA <span style="color:var(--primary-color); font-weight:bold;">${current}</span> / ${total}
            </div>
            <div style="display:flex; gap: 8px;">
                ${Array.from({ length: parseInt(total) }).map((_, i) => `
                    <div style="width: ${i + 1 === parseInt(current) ? '32px' : '12px'}; height: 12px; background: ${i + 1 === parseInt(current) ? 'var(--primary-color)' : 'rgba(255,255,255,0.15)'}; border-radius: 6px; transition: all 0.3s ease;"></div>
                `).join('')}
            </div>
        </div>
    `;
}

export function getEbookAutoFitScript() {
    return `
    <script>
        (function() {
            // Pre-processing: Wrap images for cinematic effects
            function wrapCinematicImages() {
                const safeZone = document.querySelector('.safe-zone');
                if (!safeZone) return;
                
                const images = safeZone.querySelectorAll('img:not([src*="logo"]):not(.emoji):not(.wrapped-cinematic)');
                images.forEach(img => {
                    img.classList.add('wrapped-cinematic');
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'image-cinematic-wrapper';
                    
                    img.parentNode.insertBefore(wrapper, img);
                    wrapper.appendChild(img);
                });
            }

            function fitContent() {
                const safeZone = document.querySelector('.safe-zone');
                if (!safeZone) return;

                const maxLoops = 25;
                let loop = 0;

                // Collect all text elements with their original sizes
                const textElements = Array.from(document.querySelectorAll(
                    '.ebook-h1, .ebook-h2, .ebook-p, .term-body, .mono, ' +
                    '[style*="font-size"]'
                )).map(el => {
                    const style = window.getComputedStyle(el);
                    return {
                        el,
                        origSize: parseFloat(style.fontSize) || 16,
                        currentSize: parseFloat(style.fontSize) || 16
                    };
                });

                // Collect terminal windows for padding reduction
                const terminals = Array.from(safeZone.querySelectorAll('.terminal-window')).map(el => ({
                    el,
                    origMargin: parseFloat(window.getComputedStyle(el).marginBottom) || 24,
                    shrinkFactor: 1
                }));

                while (safeZone.scrollHeight > safeZone.clientHeight && loop < maxLoops) {
                    let resized = false;

                    // Phase 0: Remove strict heights from AI-generated boxes
                    if (loop === 0) {
                        const rawBoxes = safeZone.querySelectorAll('div[style*="height"]');
                        rawBoxes.forEach(b => {
                            b.style.height = 'auto';
                            b.style.minHeight = 'auto';
                        });
                        if (safeZone.scrollHeight <= safeZone.clientHeight) break;
                    }

                    // Phase 1: Shrink text proportionally
                    textElements.forEach(item => {
                        let minSize = 24;
                        if (item.origSize >= 80) minSize = 50;
                        else if (item.origSize >= 60) minSize = 40;
                        else if (item.origSize >= 40) minSize = 30;
                        else minSize = Math.max(20, item.origSize * 0.7);

                        if (item.currentSize > minSize) {
                            const step = item.currentSize > 50 ? 3 : 2;
                            item.currentSize = Math.max(minSize, item.currentSize - step);
                            item.el.style.fontSize = item.currentSize + 'px';
                            resized = true;
                        }
                    });

                    // Phase 2: Reduce margins between elements
                    if (loop > 3) {
                        const paragraphs = safeZone.querySelectorAll('.ebook-p, .ebook-h2, .ebook-h1');
                        paragraphs.forEach(p => {
                            const mb = parseFloat(window.getComputedStyle(p).marginBottom) || 24;
                            if (mb > 8) {
                                p.style.marginBottom = Math.max(8, mb - 4) + 'px';
                                resized = true;
                            }
                        });
                    }

                    // Phase 3: Shrink terminal boxes
                    if (loop > 6) {
                        terminals.forEach(item => {
                            if (item.shrinkFactor > 0.4) {
                                item.shrinkFactor -= 0.1;
                                const tb = item.el.querySelector('.term-body');
                                if (tb) {
                                    const pad = Math.max(12, 32 * item.shrinkFactor);
                                    tb.style.padding = pad + 'px';
                                }
                                item.el.style.marginBottom = Math.max(8, item.origMargin * item.shrinkFactor) + 'px';
                                resized = true;
                            }
                        });
                    }

                    // Phase 4: Reduce line-height
                    if (loop > 10) {
                        textElements.forEach(item => {
                            const lh = parseFloat(window.getComputedStyle(item.el).lineHeight);
                            if (lh && lh / item.currentSize > 1.3) {
                                item.el.style.lineHeight = '1.3';
                                resized = true;
                            }
                        });
                    }

                    if (!resized) break;
                    loop++;
                }
            }
            
            // Wrap images immediately on load before fitting
            window.addEventListener('load', () => {
                wrapCinematicImages();
                setTimeout(fitContent, 100);
            });
        })();
    </script>
    `;
}
