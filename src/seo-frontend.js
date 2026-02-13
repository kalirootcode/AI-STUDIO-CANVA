// ═══════════════════════════════════════════════════════════════════════════
// SEO VIRAL ENGINE - Auto-Generation (Integrated with Carousel)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genera SEO automáticamente después de generar el carousel
 * Usa la misma API key que el usuario ingresó manualmente
 */
async function autoGenerateSEO(tema, apiKey) {
    const seoOutput = document.getElementById('seoOutput');

    if (!tema || !apiKey) {
        seoOutput.value = '⚠️ Genera un carousel primero para obtener SEO automático';
        return;
    }

    seoOutput.value = '⏳ Generando metadata viral para TikTok...';

    try {
        const result = await window.cyberCanvas.generateSEO({
            tema: tema,
            nicho: 'Ciberseguridad',
            apiKey: apiKey // Usar la misma API key del usuario
        });

        if (result.success) {
            seoOutput.value = result.data.textoCompleto;
            console.log('✅ SEO generado automáticamente');
        } else {
            seoOutput.value = `❌ Error: ${result.error}\n\nTip: Verifica que tu API key de Gemini sea válida`;
        }
    } catch (error) {
        console.error('Error en autoGenerateSEO:', error);
        seoOutput.value = `❌ Error: ${error.message}`;
    }
}

// Exponer función globalmente para que renderer.js pueda llamarla
window.autoGenerateSEO = autoGenerateSEO;

// ═══════════════════════════════════════════════════════════════════════════
// BOTONES MANUALES (Opcional - por si el usuario quiere regenerar)
// ═══════════════════════════════════════════════════════════════════════════

document.getElementById('generateSEOBtn').addEventListener('click', async () => {
    const themeInput = document.getElementById('themeInput').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const generateSEOBtn = document.getElementById('generateSEOBtn');

    if (!themeInput) {
        showNotification('⚠️ Ingresa un tema primero', 'warning');
        return;
    }

    if (!apiKey) {
        showNotification('⚠️ Ingresa tu API key de Gemini primero', 'warning');
        return;
    }

    // Deshabilitar botón mientras genera
    generateSEOBtn.disabled = true;
    generateSEOBtn.innerHTML = '<span>⏳</span> GENERANDO...';

    await autoGenerateSEO(themeInput, apiKey);

    // Restaurar botón
    generateSEOBtn.disabled = false;
    generateSEOBtn.innerHTML = '<span>✨</span> GENERAR SEO';
});

document.getElementById('copySEOBtn').addEventListener('click', async () => {
    const seoOutput = document.getElementById('seoOutput');
    const copySEOBtn = document.getElementById('copySEOBtn');

    if (!seoOutput.value || seoOutput.value.includes('Error:') || seoOutput.value.includes('⚠️')) {
        showNotification('⚠️ No hay contenido para copiar', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(seoOutput.value);

        // Feedback visual
        const originalHTML = copySEOBtn.innerHTML;
        copySEOBtn.innerHTML = '<span>✅</span> COPIADO';
        copySEOBtn.classList.add('btn-success');

        showNotification('📋 Copiado al portapapeles', 'success');

        setTimeout(() => {
            copySEOBtn.innerHTML = originalHTML;
            copySEOBtn.classList.remove('btn-success');
        }, 2000);
    } catch (error) {
        console.error('Error copiando:', error);
        showNotification('❌ Error al copiar', 'error');
    }
});
