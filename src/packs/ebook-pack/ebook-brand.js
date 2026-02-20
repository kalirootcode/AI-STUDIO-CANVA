export function getEbookHeader(customText = 'KR-CLIDN') {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid rgba(255,255,255,0.05);">
            <div style="display:flex; align-items:center; gap: 16px;">
                <img src="../assets/kr-clidn-logo.png" style="height: 48px; width: auto; border-radius: 8px; object-fit: contain;">
                <span style="font-family:var(--font-title); font-size:42px; font-weight:800; color:#fff; letter-spacing: 2px;">${customText}</span>
            </div>
            <div class="mono" style="font-size: 34px; color: var(--text-muted); padding: 8px 16px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                EDICIÓN PREMIUM
            </div>
        </div>
    `;
}

function getEbookPagination(current, total) {
    if (!current || !total) return '';
    return `
        <div style="position: absolute; bottom: -80px; left: 0; width: 100%; display:flex; justify-content:center; align-items:center; gap: 24px; z-index: 100;">
            <div style="font-family: var(--font-mono); font-size: 38px; color: var(--text-muted);">
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
