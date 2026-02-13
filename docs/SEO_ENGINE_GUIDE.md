# SEO Viral Engine - Guía de Uso

## ¿Qué es?

El **SEO Viral Engine** es un módulo de automatización que genera metadatos optimizados para TikTok usando IA (Gemini). Aplica ingeniería inversa al algoritmo de TikTok para maximizar la viralidad de tu contenido educativo.

## Características

✅ **Títulos Polémicos**: Genera títulos de máximo 5 palabras que generan curiosidad  
✅ **Descripciones SEO**: Primera línea optimizada para búsquedas (Long Tail Keywords)  
✅ **Hashtags Estratégicos**: Regla 3x3 (nicho + problema + localización)  
✅ **CTA Automatizado**: Llamadas a la acción para vender PDFs o dirigir al Bio  
✅ **Copy to Clipboard**: Copia todo con un clic

## Cómo Usar

### 1. Generar Carrusel
1. Selecciona un pack de templates (ej: `kr-edu-pack`)
2. Ingresa el tema en el campo **TEMA** (ej: "OWASP Top 10")
3. Click en **🤖 GENERAR CON IA**

### 2. Generar SEO
1. Con el mismo tema, click en **✨ GENERAR SEO**
2. Espera 5-10 segundos mientras Gemini genera el contenido
3. El resultado aparecerá en el cuadro de texto

### 3. Copiar y Publicar
1. Click en **📋 COPIAR**
2. Pega directamente en TikTok al subir tu carrusel
3. ¡Listo para viralizar!

## Ejemplo de Salida

Para el tema **"Phishing con IA"**, el engine genera:

```
TITULO POLEMICO: 💀 IA Crea Emails Imposibles de Detectar

DESCRIPCION SEO:
¿Cómo funciona el phishing con inteligencia artificial? 🤖
Aprende a identificar y defenderte de ataques de phishing potenciados por IA. La nueva amenaza que todo profesional debe conocer. 🛡️💻

📥 Descarga la guía completa de defensa en el enlace de mi perfil.

HASHTAGS:
#PhishingIA #Ciberseguridad #KaliLinux #SeguridadInformatica #ColombiaTech #HackingEtico
```

## Configuración Avanzada

### Cambiar el Nicho
Por defecto usa `"Ciberseguridad"`. Para cambiarlo, edita `seo-frontend.js` línea 23:

```javascript
nicho: 'Marketing Digital' // o 'Programación', 'DevOps', etc.
```

### Personalizar el Prompt
El prompt maestro está en `src/services/SEOEngine.js`. Puedes ajustar:
- Número de hashtags
- Estilo del título
- Estructura de la descripción
- País de localización

## Troubleshooting

### "GEMINI_API_KEY no configurada"
- Asegúrate de tener un archivo `.env` en la raíz del proyecto
- Debe contener: `GEMINI_API_KEY=tu_api_key_aqui`

### "Error generando SEO"
- Verifica tu conexión a internet
- Revisa que la API key sea válida
- Chequea la consola de Electron (F12) para más detalles

### El botón "COPIAR" no funciona
- Algunos navegadores requieren HTTPS para clipboard API
- En Electron debería funcionar sin problemas
- Verifica que el textarea tenga contenido

## Integración con Python (Opcional)

Si quieres usar el SEO Engine desde Python:

```python
import subprocess
import json

def generar_seo_desde_python(tema):
    cmd = f'node src/services/SEOEngine.test.js "{tema}"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout

# Uso
metadata = generar_seo_desde_python("Nmap Avanzado")
print(metadata)
```

## Roadmap

- [ ] Variaciones A/B de títulos
- [ ] Análisis de tendencias en tiempo real
- [ ] Optimización por país/idioma
- [ ] Integración con analytics de TikTok
- [ ] Generación de guiones de video

---

**Desarrollado para Cyber-Canvas Electron**  
Potenciado por Google Gemini AI
