/**
 * SEO Engine - Generador de Metadatos Virales para TikTok
 * Usa Gemini API para crear títulos, descripciones y hashtags optimizados
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class SEOEngine {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash', // Modelo actualizado (2.0-flash-exp retirado)
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });
    }

    /**
     * Genera metadatos virales optimizados para TikTok
     * @param {string} tema - El tema del carrusel (ej: "OWASP Top 10")
     * @param {string} nicho - El nicho específico (ej: "Ciberseguridad", "Hacking Ético")
     * @returns {Promise<Object>} - { titulo, descripcion, hashtags, textoCompleto }
     */
    async generarMetadataViral(tema, nicho = 'Ciberseguridad') {
        const prompt = `ACTÚA COMO: Un experto estratega de TikTok SEO para un canal de ${nicho} y Kali Linux en Latam.
TEMA DEL POST: ${tema}

ESTRUCTURA OBLIGATORIA:
Genera un texto listo para copiar y pegar con esta estructura exacta:

TITULO POLEMICO: (Un título corto y visual de máximo 5 palabras que genere curiosidad)

DESCRIPCION SEO:
(Línea 1: Pregunta o frase exacta que la gente busca en Google sobre este tema)
(Línea 2: Breve explicación de valor, usa emojis técnicos como 💻 🔐 📡)
(Línea 3: CTA CLARO -> "Descarga el PDF completo en mi Bio 🔗" o "Guarda este post 👇")

HASHTAGS:
(6 hashtags estratégicos: 2 de #KaliLinux/Hacking, 2 del problema específico, 1 de #Colombia/Latam, 1 de #Ciberseguridad)

REGLAS ESTRICTAS:
- NO uses palabras prohibidas como "Robar", "Carding", "Bin"
- USA términos educativos: "Auditoría", "Testeo", "Pentesting"
- El título debe ser clickbait ético (curiosidad sin mentir)
- La primera línea de descripción debe ser una Long Tail Keyword exacta
- Incluye emojis relevantes pero no abuses (máximo 3-4 en total)

FORMATO DE SALIDA:
Devuelve SOLO el texto formateado, sin explicaciones adicionales.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const textoCompleto = response.text();

            // Parsear la respuesta
            const parsed = this.parsearRespuesta(textoCompleto);

            return {
                ...parsed,
                textoCompleto,
                tema,
                nicho
            };
        } catch (error) {
            console.error('Error generando SEO:', error);
            throw new Error(`Error en SEO Engine: ${error.message}`);
        }
    }

    /**
     * Parsea la respuesta de Gemini en componentes estructurados
     */
    parsearRespuesta(texto) {
        const lineas = texto.split('\n').filter(l => l.trim());

        let titulo = '';
        let descripcion = '';
        let hashtags = '';

        // Buscar el título
        const tituloMatch = texto.match(/TITULO POLEMICO:\s*(.+)/i);
        if (tituloMatch) {
            titulo = tituloMatch[1].trim();
        }

        // Buscar descripción (todo entre DESCRIPCION SEO: y HASHTAGS:)
        const descripcionMatch = texto.match(/DESCRIPCION SEO:\s*([\s\S]+?)(?=HASHTAGS:|$)/i);
        if (descripcionMatch) {
            descripcion = descripcionMatch[1].trim();
        }

        // Buscar hashtags
        const hashtagsMatch = texto.match(/HASHTAGS:\s*(.+)/i);
        if (hashtagsMatch) {
            hashtags = hashtagsMatch[1].trim();
        }

        return { titulo, descripcion, hashtags };
    }

    /**
     * Genera variaciones del título para A/B testing
     */
    async generarVariacionesTitulo(tema, cantidad = 3) {
        const prompt = `Genera ${cantidad} títulos virales diferentes para TikTok sobre: "${tema}"

REGLAS:
- Máximo 5 palabras por título
- Usa números cuando sea posible (ej: "Top 10", "5 Secretos")
- Genera curiosidad o FOMO (miedo a perderse algo)
- Estilo clickbait ético para contenido educativo de ciberseguridad

FORMATO: Devuelve solo los títulos, uno por línea, sin numeración.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const texto = response.text();

            return texto.split('\n')
                .filter(l => l.trim())
                .map(t => t.replace(/^[-•*]\s*/, '').trim())
                .slice(0, cantidad);
        } catch (error) {
            console.error('Error generando variaciones:', error);
            return [];
        }
    }

    /**
     * Optimiza hashtags basado en tendencias
     */
    async optimizarHashtags(tema, pais = 'Colombia') {
        const prompt = `Genera hashtags optimizados para TikTok sobre: "${tema}"

ESTRATEGIA 3x3:
- 2 hashtags del nicho (#KaliLinux, #Hacking, #Pentesting)
- 2 hashtags del problema específico (relacionados con ${tema})
- 2 hashtags de localización (#${pais}, #Latam, #CiberseguridadLatam)

REGLAS:
- Total: 6 hashtags
- Mezcla hashtags grandes (100k+ posts) con nichos (10k posts)
- NO uses hashtags genéricos como #fyp o #viral
- Enfócate en hashtags educativos y profesionales

FORMATO: Devuelve solo los hashtags separados por espacios, sin explicaciones.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error('Error optimizando hashtags:', error);
            return '#KaliLinux #Ciberseguridad #HackingEtico';
        }
    }
}

module.exports = SEOEngine;
