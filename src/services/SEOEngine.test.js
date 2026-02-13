/**
 * Test del SEO Engine
 * Ejecutar con: node src/services/SEOEngine.test.js
 */

const SEOEngine = require('./SEOEngine');
require('dotenv').config();

async function testSEOEngine() {
    console.log('🚀 Iniciando test del SEO Engine...\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ Error: GEMINI_API_KEY no encontrada en .env');
        return;
    }

    const seo = new SEOEngine(apiKey);

    try {
        // Test 1: Generar metadata completa
        console.log('📝 Test 1: Generando metadata viral para "OWASP Top 10"...\n');
        const metadata = await seo.generarMetadataViral('OWASP Top 10', 'Ciberseguridad');

        console.log('✅ RESULTADO:');
        console.log('─'.repeat(60));
        console.log(metadata.textoCompleto);
        console.log('─'.repeat(60));
        console.log('\n📊 Componentes parseados:');
        console.log('  Título:', metadata.titulo);
        console.log('  Hashtags:', metadata.hashtags);
        console.log('\n');

        // Test 2: Variaciones de título
        console.log('🔄 Test 2: Generando 3 variaciones de título...\n');
        const variaciones = await seo.generarVariacionesTitulo('Phishing con IA', 3);
        variaciones.forEach((v, i) => {
            console.log(`  ${i + 1}. ${v}`);
        });
        console.log('\n');

        // Test 3: Optimizar hashtags
        console.log('🏷️  Test 3: Optimizando hashtags para "Nmap"...\n');
        const hashtags = await seo.optimizarHashtags('Nmap', 'Colombia');
        console.log('  Hashtags:', hashtags);
        console.log('\n');

        console.log('✅ Todos los tests completados exitosamente!');
    } catch (error) {
        console.error('❌ Error en los tests:', error.message);
    }
}

// Ejecutar tests
testSEOEngine();
