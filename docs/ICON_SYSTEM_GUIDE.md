# 🎨 Sistema de Iconos - Guía Completa

## Resumen

Los templates de Cyber-Canvas usan **4 fuentes de iconos** diferentes, cada una con un propósito específico:

1. **Material Icons** (Google) → Iconos técnicos y UI
2. **Emojis Unicode** → Iconos expresivos y visuales
3. **Logo Base64** → Logo de Kali embebido
4. **Material Icons personalizados** → Iconos sociales (TikTok style)

---

## 1. Material Icons (Google)

### ¿Qué es?
Librería gratuita de Google con **2,000+ iconos** diseñados para interfaces modernas.

### Cómo se carga
```html
<!-- En el <head> de cada template -->
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

### Cómo se usa
```html
<span class="material-icons">security</span>
<span class="material-icons">terminal</span>
<span class="material-icons">code</span>
```

### Iconos más usados en los templates

| Nombre | Icono | Uso |
|--------|-------|-----|
| `security` | 🛡️ | Seguridad, protección |
| `terminal` | 💻 | Terminal, consola |
| `code` | `<>` | Código fuente |
| `lock` | 🔒 | Candado, privacidad |
| `vpn_key` | 🔑 | Llaves, autenticación |
| `bug_report` | 🐛 | Bugs, errores |
| `shield` | 🛡️ | Escudo, defensa |
| `network_check` | 📡 | Red, conectividad |
| `folder` | 📁 | Carpetas, archivos |
| `description` | 📄 | Documentos |
| `settings` | ⚙️ | Configuración |
| `visibility` | 👁️ | Visibilidad |
| `warning` | ⚠️ | Advertencias |
| `check_circle` | ✅ | Éxito, completado |
| `error` | ❌ | Error, fallo |

### Estilizar Material Icons
```css
.material-icons {
    font-size: 48px;
    color: #2563EB;
    text-shadow: 0 0 20px rgba(37, 99, 235, 0.5);
}
```

### Buscar más iconos
👉 https://fonts.google.com/icons

---

## 2. Emojis Unicode

### ¿Qué son?
Caracteres Unicode que se renderizan como iconos coloridos en todos los navegadores.

### Cómo se usan
```html
<span>🔐</span>  <!-- Candado con llave -->
<span>💻</span>  <!-- Laptop -->
<span>🚀</span>  <!-- Cohete -->
<span>⚡</span>  <!-- Rayo -->
<span>🎯</span>  <!-- Diana -->
```

### Emojis más usados

| Emoji | Código | Uso |
|-------|--------|-----|
| 🔐 | `\u{1F510}` | Seguridad, encriptación |
| 💻 | `\u{1F4BB}` | Computadora, hacking |
| 🚀 | `\u{1F680}` | Lanzamiento, velocidad |
| ⚡ | `\u{26A1}` | Poder, rapidez |
| 🎯 | `\u{1F3AF}` | Objetivo, precisión |
| 🛡️ | `\u{1F6E1}` | Protección, defensa |
| 📡 | `\u{1F4E1}` | Red, comunicación |
| 🐛 | `\u{1F41B}` | Bug, error |
| 💀 | `\u{1F480}` | Peligro, hacking |
| 🔥 | `\u{1F525}` | Tendencia, viral |

### Cuándo usar emojis vs Material Icons

**Usa Emojis cuando:**
- ✅ Quieres color y expresividad
- ✅ Es para títulos o CTAs
- ✅ Necesitas llamar la atención

**Usa Material Icons cuando:**
- ✅ Necesitas consistencia visual
- ✅ Es para UI/botones
- ✅ Quieres control total del estilo

---

## 3. Logo de Kali (Base64)

### ¿Dónde está?
`src/packs/kr-edu-pack/brand.js`

```javascript
export const LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgo...';
```

### Cómo se usa en templates
```javascript
import { LOGO_BASE64 } from './brand.js';

// En el HTML
<img src="${LOGO_BASE64}" alt="KR-CLIDN" class="logo">
```

### ¿Por qué Base64?
- ✅ **No requiere archivo externo** → Más rápido
- ✅ **Funciona offline** → Sin dependencias
- ✅ **Se embebe directamente** → Un solo archivo HTML

### Cómo convertir tu propia imagen a Base64

**Opción 1: Online**
1. Ve a: https://www.base64-image.de/
2. Sube tu imagen PNG
3. Copia el código base64

**Opción 2: Terminal**
```bash
base64 -i logo.png | tr -d '\n' > logo.txt
```

**Opción 3: Node.js**
```javascript
const fs = require('fs');
const img = fs.readFileSync('logo.png');
const base64 = img.toString('base64');
console.log(`data:image/png;base64,${base64}`);
```

---

## 4. Iconos Sociales (TikTok Style)

### ¿Dónde se usan?
Template `kr-clidn-09.js` (CTA Final)

### Estructura HTML
```html
<div class="social-bar">
    <!-- Like / Heart -->
    <div class="social-item social-heart">
        <div class="social-icon">
            <i class="material-icons">favorite</i>
        </div>
        <span class="social-label">Like</span>
    </div>

    <!-- Comment -->
    <div class="social-item social-comment">
        <div class="social-icon">
            <i class="material-icons">chat_bubble</i>
        </div>
        <span class="social-label">Comenta</span>
    </div>

    <!-- Save -->
    <div class="social-item social-save">
        <div class="social-icon">
            <i class="material-icons">bookmark</i>
        </div>
        <span class="social-label">Guarda</span>
    </div>

    <!-- Share -->
    <div class="social-item social-share">
        <div class="social-icon">
            <i class="material-icons">share</i>
        </div>
        <span class="social-label">Comparte</span>
    </div>
</div>
```

### Colores TikTok
```css
/* Heart / Like */
.social-heart .social-icon {
    background: rgba(255, 44, 85, 0.12);
    border: 2px solid rgba(255, 44, 85, 0.35);
}
.social-heart .social-icon i { color: #FE2C55; }

/* Comment */
.social-comment .social-icon {
    background: rgba(37, 99, 235, 0.12);
    border: 2px solid rgba(37, 99, 235, 0.35);
}
.social-comment .social-icon i { color: #2563EB; }

/* Save */
.social-save .social-icon {
    background: rgba(255, 204, 0, 0.12);
    border: 2px solid rgba(255, 204, 0, 0.35);
}
.social-save .social-icon i { color: #FFCC00; }

/* Share */
.social-share .social-icon {
    background: rgba(76, 217, 192, 0.12);
    border: 2px solid rgba(76, 217, 192, 0.35);
}
.social-share .social-icon i { color: #4DD9C0; }
```

---

## 5. Cómo Agregar Nuevos Iconos

### Opción 1: Material Icons
1. Busca el icono en: https://fonts.google.com/icons
2. Copia el nombre (ej: `security`)
3. Úsalo: `<span class="material-icons">security</span>`

### Opción 2: Emoji
1. Busca el emoji en: https://emojipedia.org/
2. Copia el emoji directamente
3. Pégalo en tu HTML: `<span>🔐</span>`

### Opción 3: SVG Custom
```html
<svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="#2563EB"/>
</svg>
```

---

## 6. Best Practices

### ✅ DO
- Usa Material Icons para UI consistente
- Usa emojis para títulos y CTAs
- Mantén el tamaño de iconos proporcional al texto
- Usa colores de `brand.js` para consistencia

### ❌ DON'T
- No mezcles estilos de iconos en el mismo elemento
- No uses iconos muy pequeños (min 24px)
- No abuses de emojis (máx 3-4 por slide)
- No uses imágenes externas (usa base64)

---

## 7. Recursos

### Librerías de Iconos
- **Material Icons:** https://fonts.google.com/icons
- **Emojipedia:** https://emojipedia.org/
- **Heroicons:** https://heroicons.com/ (SVG)
- **Lucide:** https://lucide.dev/ (SVG)

### Herramientas
- **Base64 Converter:** https://www.base64-image.de/
- **SVG Optimizer:** https://jakearchibald.github.io/svgomg/
- **Icon Font Generator:** https://icomoon.io/app/

---

**Creado para:** Cyber-Canvas Electron  
**Última actualización:** 2026-02-10
