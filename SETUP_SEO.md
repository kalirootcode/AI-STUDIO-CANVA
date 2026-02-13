# Configuración Rápida del SEO Engine

## Problema Actual
❌ Dependencia `@google/generative-ai` no instalada  
❌ Archivo `.env` no existe

## Solución (2 pasos)

### 1. Instalar Dependencia
```bash
cd /home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON
npm install @google/generative-ai
```

### 2. Crear Archivo .env
Crea el archivo `.env` en la raíz del proyecto:

```bash
nano .env
```

Pega esto (reemplaza con tu API key real):
```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**¿Dónde conseguir la API key?**
1. Ve a: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copia la key y pégala en el `.env`

### 3. Reiniciar la App
```bash
npm start
```

## Verificar que Funciona
1. Ingresa un tema (ej: "Nmap")
2. Click "✨ GENERAR SEO"
3. Debería aparecer el resultado en 5-10 segundos

## Si Sigue Fallando
Abre la consola de Electron (F12) y mira qué error aparece. Copia el mensaje completo.
