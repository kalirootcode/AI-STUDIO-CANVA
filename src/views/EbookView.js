/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  EBOOK STUDIO — Professional PDF Book Creator                  ║
 * ║  Cyber-Canvas AI Studio v2                                      ║
 * ║                                                                  ║
 * ║  Features:                                                       ║
 * ║  · IA genera libro completo desde un tema                       ║
 * ║  · 4 tipos de página: Cover, Chapter, Image, CTA               ║
 * ║  · Editor por página: texto, links, imagen de portada           ║
 * ║  · CanvasRenderer dibuja infografías, terminals, diagramas      ║
 * ║  · Export PDF con links clickeables                             ║
 * ║  · Branding KR-CLIDN integrado                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { BaseView } from './BaseView.js';
import { CanvasToPDF } from '../utils/CanvasToPDF.js';

// ─────────────────────────────────────────────────────────────────────
// EBOOK CONTENT ENGINE — Prompt maestro para Gemini
// ─────────────────────────────────────────────────────────────────────
class EbookContentEngine {

    generateBookPrompt(topic, pageCount, theme, brand, chunkIndex = 0, totalChunks = 1, chunkPageCount = pageCount) {
        const colors = this._themeColors(theme);

        let chunkContext = '';
        if (totalChunks > 1) {
            if (chunkIndex === 0) {
                chunkContext = `[ATENCIÓN: PARTE ${chunkIndex + 1} DE ${totalChunks}. Genera la PORTADA, el ÍNDICE y las primeras ${chunkPageCount} páginas introductorias. NO pongas conclusión ni páginas finales aún.]`;
            } else if (chunkIndex === totalChunks - 1) {
                chunkContext = `[ATENCIÓN: PARTE ${chunkIndex + 1} DE ${totalChunks}. Genera las últimas ${chunkPageCount} páginas de este libro, incluyendo la CONCLUSIÓN y el CTA FINAL.]`;
            } else {
                chunkContext = `[ATENCIÓN: PARTE ${chunkIndex + 1} DE ${totalChunks}. Genera ${chunkPageCount} páginas de desarrollo denso intermedio del libro. NI portada NI contraportada.]`;
            }
        }

        return `ERES EL MEJOR AUTOR DE LIBROS EDUCATIVOS DIGITALES DEL MUNDO. Tu especialidad: ciberseguridad, hacking ético y Linux.
Tu estilo mezcla la claridad de un docente con la energía de un thriller de acción. Cada página debe sentirse como si el lector está aprendiendo dentro de una película de hackers.

OBJETIVO: Crear la PARTE ${chunkIndex + 1} de ${totalChunks} de un ebook educativo sobre: "${topic}"
CANTIDAD A GENERAR AHORA: ${chunkPageCount} páginas.
FORMATO: Páginas A4 (794 × 1123 px). JSON array de Scene Graphs para CanvasRenderer.
BRANDING: ${brand.name} — Logo: "${brand.logo}" — Color primario: "${colors.primary}"

${chunkContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ FILOSOFÍA DE CONTENIDO — LEE ESTO PRIMERO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NARRA, NO ENUMERES. En vez de "El comando ls lista archivos", escribe:
   "Imagina que eres un nuevo agente infiltrado en un sistema desconocido. Lo primero que haces es mirar a tu alrededor con 'ls -la'. Cada línea te revela quién estuvo aquí antes y qué dejó."

2. DENSIDAD REAL. Los párrafos deben tener mínimo 4 oraciones con información técnica real. Sin relleno.

3. ALTERNANCIA VISUAL OBLIGATORIA: Nunca más de 2 páginas de texto seguidas.
   Intercala: terminal → barchart → nodegraph → attackflow → timeline → gridbox

4. ESTADÍSTICAS Y DATOS REALES. Cita CVEs reales, porcentajes de ataques reales, cifras de mercado.

5. EJEMPLOS PRÁCTICOS. Cada capítulo debe tener al menos 1 comando ejecutable con output realista.

6. CLIFFHANGERS. Termina las páginas de texto con una pregunta o dato sorprendente que haga querer avanzar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTRUCTURA DEL LIBRO COMPLETO (Referencia):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PORTADA: Título impactante con *palabras clave*, subtítulo que crea urgencia
2. ÍNDICE: Tabla de contenidos numerada, atractiva visualmente
3. PRÓLOGO: Por qué este libro cambiará al lector. Narrativo y emotivo.
4. CAPÍTULOS: Contenido DENSO con:
   - Mínimo 280 palabras educativas reales por página de texto puro
   - 50%+ de páginas con infografías (barchart, nodegraph, attackflow, timeline, gridbox)
   - Al menos 1 terminal por capítulo con comando real + output realista
   - Warningbox para alertas de seguridad/ética importantes
   - Datos estadísticos con barchart cuando haya números
5. CONCLUSIÓN: Resumen poderoso, roadmap de próximos pasos
6. CTA FINAL: Links clickeables a ${brand.website || 'https://kr-clidn.com'} con rect+link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANVAS: 794 × 1123 px — CONTENIDO entre y=140 y y=1040
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIPOS DE LAYER:

background (SIEMPRE primero):
{ "type":"background","fill":"#030303" }
Portada: { "type":"background","fill":"#030303","isCover":true }

brand (SIEMPRE segundo):
Portada: { "type":"brand","logo":"${brand.logo}","text":"${brand.name}","badge":"EDICIÓN PREMIUM","position":"top","isCover":true }
Resto: { "type":"brand","logo":"${brand.logo}","text":"${brand.name}","badge":"EDICIÓN PREMIUM","position":"top","compact":true }

text — TÍTULO impactante: { "type":"text","content":"TÍTULO","x":40,"y":280,"width":714,"font":{"family":"BlackOpsOne","size":68,"weight":900},"color":"#ffffff","align":"center","highlights":[{"text":"PALABRA_CLAVE","color":"${colors.primary}"}] }
text — PÁRRAFO narrativo: { "type":"text","content":"Texto largo educativo y entretenido...","x":40,"y":220,"width":714,"font":{"family":"MPLUS Code Latin","size":23,"weight":400},"color":"#e0e0e0","align":"justify","lineHeight":1.7 }
text — HEADING capítulo: { "type":"text","content":"CAP 1: NOMBRE","x":40,"y":145,"width":714,"font":{"family":"BlackOpsOne","size":36,"weight":900},"color":"${colors.primary}","align":"left" }
text — DATO IMPACTANTE: { "type":"text","content":"⚡ DATO: El 80% de brechas usan credenciales robadas","x":40,"y":500,"width":714,"font":{"family":"BlackOpsOne","size":28,"weight":700},"color":"${colors.accent}","align":"center" }

terminal (output REALISTA mínimo 5 líneas): { "type":"terminal","x":40,"y":500,"width":714,"command":"nmap -sV -O 192.168.1.0/24","output":"Starting Nmap 7.94...\\nPORT    STATE  SERVICE  VERSION\\n22/tcp  open   ssh      OpenSSH 8.9\\n80/tcp  open   http     nginx 1.22\\n443/tcp open   ssl/http nginx 1.22\\nOS detected: Linux 4.x" }
codeblock: { "type":"codeblock","x":40,"y":480,"width":714,"code":"# Código real y funcional\\nimport socket","language":"python","title":"exploit.py" }
rect (tarjeta concepto): { "type":"rect","x":40,"y":480,"width":714,"height":180,"fill":"#0a0a0c","border":{"color":"${colors.primary}44","width":1},"radius":12,"accentColor":"${colors.primary}","title":"CONCEPTO CLAVE" }
statbar: { "type":"statbar","x":40,"y":520,"width":714,"label":"Tasa de éxito del ataque","value":87,"maxValue":100,"color":"${colors.primary}" }
barchart (datos REALES): { "type":"barchart","x":40,"y":400,"width":714,"height":320,"title":"Top Vulnerabilidades 2024 (CVSS)","color":"${colors.accent}","data":[{"label":"Log4Shell","value":93},{"label":"ProxyLogon","value":88},{"label":"Follina","value":76},{"label":"EternalBlue","value":72}] }
bulletlist: { "type":"bulletlist","x":40,"y":400,"width":700,"items":["Dato técnico real 1","Dato técnico real 2","Dato técnico real 3"],"font":{"family":"MPLUS Code Latin","size":26},"color":"#e0e0e0","bulletColor":"${colors.primary}" }
timeline (historia/fases): { "type":"timeline","x":40,"y":380,"width":714,"events":[{"date":"Fase 1","title":"Reconocimiento","desc":"OSINT pasivo con Shodan y Maltego"},{"date":"Fase 2","title":"Escaneo","desc":"Nmap + Masscan para mapeo de puertos"},{"date":"Fase 3","title":"Explotación","desc":"Metasploit con CVE-2021-44228"}] }
nodegraph (topologías): { "type":"nodegraph","x":40,"y":360,"width":714,"height":380,"nodes":[{"id":"n1","label":"Atacante","icon":"computer"},{"id":"n2","label":"Firewall","icon":"security"},{"id":"n3","label":"Servidor","icon":"dns"},{"id":"n4","label":"DB","icon":"storage"}],"connections":[{"from":"n1","to":"n2","label":"SYN"},{"from":"n2","to":"n3","label":"ALLOW"},{"from":"n3","to":"n4","label":"SQL"}] }
attackflow (kill chains): { "type":"attackflow","x":40,"y":380,"width":714,"stages":[{"title":"Recon","desc":"OSINT + Shodan"},{"title":"Weaponize","desc":"CVE-2024-xxxx payload"},{"title":"Exploit","desc":"RCE sin autenticación"},{"title":"C2","desc":"Cobalt Strike beacon"}] }
gridbox (comparaciones): { "type":"gridbox","x":40,"y":400,"width":714,"columns":2,"cells":[{"title":"✅ DEFENSA","text":"Parches actualizados, MFA, logs monitorizados","color":"${colors.success}"},{"title":"⚠️ ATAQUE","text":"CVE no parcheado, credenciales débiles, sin MFA","color":"${colors.danger}"}] }
warningbox (alertas legales/éticas): { "type":"warningbox","x":40,"y":720,"width":714,"style":"danger","icon":"⚠️","title":"AVISO LEGAL","message":"Esta técnica es SOLO para entornos de laboratorio o con autorización escrita explícita del propietario del sistema." }
vs_table: { "type":"vs_table","x":40,"y":400,"width":714,"leftTitle":"OPCIÓN A","rightTitle":"OPCIÓN B","rows":[{"left":"Más rápido en redes grandes","right":"Más preciso en sistemas individuales","leftPositive":true,"rightPositive":false}] }
page_number (SIEMPRE última capa): { "type":"page_number","current":1,"total":${pageCount},"color":"${colors.primary}" }
CTA button con link (para páginas finales): { "type":"rect","x":147,"y":900,"width":500,"height":65,"fill":"${colors.primary}22","border":{"color":"${colors.primary}","width":2},"radius":32,"link":"${brand.website || 'https://kr-clidn.com'}","ctaText":"VISITAR ${brand.name} →","ctaColor":"${colors.primary}" }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLAS CRÍTICAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ENTRETENIMIENTO: Cada página inicia con un hook narrativo (anécdota, pregunta, dato sorprendente).
2. EDUCACIÓN REAL: No uses información genérica. Usa CVEs reales, herramientas reales, comandos reales.
3. VARIEDAD VISUAL OBLIGATORIA: Si llevas 2 páginas de texto consecutivas, la siguiente DEBE tener infografía.
4. LINKS: En páginas CTA final siempre incluir: link:"${brand.website || 'https://kr-clidn.com'}"
5. PAGE_NUMBER: SIEMPRE como última capa en cada página.
6. NO OVERFLOW: Ningún layer supera y=1040.
7. DATOS: Mínimo 2 estadísticas reales por capítulo (en barchart o statbar).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESPONDE SOLO CON JSON VÁLIDO, SIN TEXTO EXTRA:
{
  "title": "Título del Libro",
  "subtitle": "Subtítulo impactante",
  "pages": [
    {
      "id": "page-1",
      "type": "cover",
      "label": "Portada",
      "canvas": { "width": 794, "height": 1123 },
      "theme": "${theme}",
      "layers": [ ...layers... ]
    }
  ]
}`;
    }

    _themeColors(theme) {
        const map = {
            'cyber': { primary: '#00D9FF', accent: '#A855F7', success: '#00FF88', danger: '#FF3366' },
            'CYBER': { primary: '#00D9FF', accent: '#A855F7', success: '#00FF88', danger: '#FF3366' },
            'RED_TEAM': { primary: '#FF0000', accent: '#FF6600', success: '#FF4444', danger: '#FF0040' },
            'BLUE_TEAM': { primary: '#0088FF', accent: '#00CCFF', success: '#00FF88', danger: '#FF3366' },
            'OSINT': { primary: '#D946EF', accent: '#A855F7', success: '#10B981', danger: '#EF4444' },
            'hacker': { primary: '#00FF41', accent: '#FF00FF', success: '#00FF41', danger: '#FF0040' },
            'minimal': { primary: '#3B82F6', accent: '#8B5CF6', success: '#10B981', danger: '#EF4444' },
        };
        return map[theme] || map['cyber'];
    }
}

// ─────────────────────────────────────────────────────────────────────
// EBOOK VIEW — UI Principal
// ─────────────────────────────────────────────────────────────────────
export class EbookView {
    constructor() {
        this.id = 'ebook';
        this.element = document.createElement('div');
        this.element.className = 'view-container';
        this.element.id = 'ebook-view-root';

        this.pages = [];
        this.currentPage = 0;
        this.isGenerating = false;
        this.bookMeta = { title: '', subtitle: '', coverImage: null };
        this.activeTheme = 'cyber';
        this.brandConfig = {
            name: 'KR-CLIDN',
            logo: './assets/kr-clidn-logo.png',
            badge: 'EDICIÓN PREMIUM',
            website: 'https://kr-clidn.com'
        };

        this._contentEngine = new EbookContentEngine();
    }

    // ─── RENDER HTML ────────────────────────────────────────────────
    render() {
        this.element.innerHTML = `
        <div class="eb-layout">

            <!-- ══ PANEL CENTRAL (ÚNICO) CON CONTROLES INTEGRADOS ══ -->
            <div class="panel-center" style="flex:1;position:relative;display:flex;flex-direction:column;background:#000;">

                <!-- TOP BAR DE CONFIGURACIÓN & GENERACIÓN -->
                <div style="display:flex;align-items:center;background:linear-gradient(180deg,#0a0a0a,#050505);border-bottom:1px solid #1a1a1a;padding:10px 20px;gap:15px;z-index:60;position:relative;">
                    
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="ts-dot" style="background:#A855F7;box-shadow:0 0 6px #A855F7;"></span>
                        <span style="font-weight:900;letter-spacing:1px;font-size:11px;color:#eee;">EBOOK STUDIO</span>
                    </div>
                    
                    <div style="width:1px;height:20px;background:#222;"></div>

                    <div style="flex:1;display:flex;align-items:center;gap:15px;">
                        <input type="text" id="eb-topic" class="ts-input" style="flex:1;max-width:400px;font-size:11px;padding:6px 10px;height:auto;" placeholder="Escribe el tema para generar el libro...">
                        
                        <div style="display:flex;align-items:center;gap:6px;min-width:140px;">
                            <span style="font-size:9px;color:#888;font-weight:700;">PÁGS:</span>
                            <input type="number" id="eb-pages" class="ts-input" value="20" min="8" max="80" style="width:50px;font-size:11px;padding:4px 8px;height:auto;text-align:center;">
                        </div>

                        <select id="eb-theme" class="ts-input ts-select" style="width:140px;font-size:10px;padding:6px 10px;height:auto;">
                            <option value="cyber">⚡ Cyber</option>
                            <option value="BLUE_TEAM">🔵 Blue Team</option>
                            <option value="RED_TEAM">🔴 Red Team</option>
                            <option value="OSINT">🟣 OSINT</option>
                            <option value="hacker">🟢 Hacker Matrix</option>
                            <option value="minimal">⬜ Minimal Pro</option>
                        </select>
                    </div>

                    <button id="eb-generate-btn" class="ts-btn-primary" style="background:linear-gradient(135deg,#A855F7 0%,#6366F1 100%);padding:6px 16px;height:auto;box-shadow:0 4px 15px rgba(168,85,247,0.3);width:auto;">
                        <span class="material-icons" style="font-size:14px;">auto_awesome</span>
                        GENERAR LIBRO
                    </button>
                    <div id="eb-gen-status" class="eb-gen-status" style="display:none;align-items:center;gap:10px;width:200px;">
                        <span id="eb-gen-text" style="font-size:9px;color:#A855F7;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:80px;">Generando...</span>
                        <div style="height:4px;background:#111;border-radius:2px;flex:1;border:1px solid #222;overflow:hidden;">
                            <div id="eb-gen-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#A855F7,#00D9FF,#A855F7);background-size:200% 100%;animation:gradientMove 2s linear infinite;"></div>
                        </div>
                        <span id="eb-gen-pct" style="font-size:9px;color:#A855F7;font-weight:800;">0%</span>
                    </div>

                </div>

                <!-- HIDDEN BRANDING (Mantenemos los inputs ocultos pero existentes para que funcione JS) -->
                <div style="display:none;">
                    <input type="text" id="eb-brand-name" value="KR-CLIDN">
                    <input type="text" id="eb-brand-url" value="https://kr-clidn.com">
                    <input type="file" id="eb-cover-input" accept="image/*">
                    <div class="eb-cover-drop" id="eb-cover-drop">
                        <span id="eb-cover-label"></span>
                    </div>
                </div>

                <!-- HEADER FLOAT (HUD) -->
                <div class="canvas-header" style="position:absolute;top:10px;right:10px;z-index:50;display:flex;flex-direction:row;align-items:center;gap:6px;background:rgba(4,4,4,0.96);border:1px solid #1a1a1a;border-radius:10px;padding:5px 12px;backdrop-filter:blur(12px);box-shadow:0 0 20px rgba(168,85,247,0.06),0 4px 16px rgba(0,0,0,0.5);">

                    <!-- NAV -->
                    <div class="nav-controls" style="display:flex;align-items:center;gap:4px;">
                        <button id="eb-prev" class="nav-btn" style="padding:2px 6px;font-size:12px;">❮</button>
                        <span id="eb-counter" class="nav-counter" style="font-size:11px;min-width:52px;text-align:center;font-family:monospace;color:#555;">-- / --</span>
                        <button id="eb-next" class="nav-btn" style="padding:2px 6px;font-size:12px;">❯</button>
                    </div>

                    <div style="width:1px;height:16px;background:#1e1e1e;"></div>
                    <span id="eb-page-type-label" style="font-size:10px;color:#A855F7;letter-spacing:1px;text-transform:uppercase;font-weight:800;min-width:70px;text-align:center;">—</span>
                    <div style="width:1px;height:16px;background:#1e1e1e;"></div>

                    <!-- EXPORTS -->
                    <button id="eb-export-png" class="nav-btn" title="Exportar PNG página actual" style="padding:2px 8px;font-size:10px;display:flex;align-items:center;gap:4px;color:#888;">
                        <span class="material-icons" style="font-size:13px;">image</span> PNG
                    </button>
                    <button id="eb-export-pdf" style="background:linear-gradient(135deg,#A855F7,#6366F1);border:none;color:#fff;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:10px;font-weight:800;letter-spacing:0.5px;display:flex;align-items:center;gap:5px;box-shadow:0 2px 10px rgba(168,85,247,0.3);transition:all 0.2s;">
                        <span class="material-icons" style="font-size:13px;">picture_as_pdf</span> EXPORTAR PDF
                    </button>

                </div>

                <!-- PREVIEW SCROLLABLE CONTAINER -->
                <div id="eb-previewContainer" class="preview-container" style="position:relative;width:100%;flex:1;overflow-y:auto;overflow-x:hidden;display:flex;align-items:flex-start;justify-content:center;padding:60px 20px 80px 20px;">
                    <!-- CANVAS (CanvasEditor se ancla siempre en este nodo de id unico) -->
                    <div id="eb-mainCanvas" class="preview-frame" style="width:100%;max-width:800px;min-height:1131px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#000;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.5);margin:auto;">
                        <div class="eb-placeholder">
                            <span class="material-icons" style="font-size:64px;color:#1a1a1a;display:block;margin-bottom:16px;">menu_book</span>
                            <div style="font-size:11px;color:#222;letter-spacing:2px;text-transform:uppercase;">Escribe un tema y genera tu libro</div>
                        </div>
                    </div>
                </div>

                <!-- FOOTER -->
                <div class="studio-footer" style="position:absolute;">
                    <div class="status-left">
                        <span class="status-dot" id="eb-statusDot"></span>
                        <span id="eb-statusText">EBOOK STUDIO</span>
                    </div>
                    <div class="progress-container">
                        <div id="eb-progress" class="progress-bar"></div>
                    </div>
                    <div class="status-right"><span>v2.0.1</span></div>
                </div>

            </div>

            <!-- ══ PANEL DERECHO: LISTA DE PÁGINAS ══ -->
            <div class="eb-panel-right" style="width:220px;min-width:220px;flex-shrink:0;display:flex;flex-direction:column;border-left:1px solid #111;background:linear-gradient(180deg,#0b0b0b,#080808);">
                <div class="eb-header">
                    <span class="ts-dot" style="background:#00D9FF;box-shadow:0 0 6px #00D9FF;"></span>
                    <span>PÁGINAS</span>
                    <span id="eb-page-count" style="margin-left:auto;font-size:9px;color:#333;font-weight:700;">0</span>
                </div>
                <div class="eb-scroll">
                    <div id="eb-page-list" class="eb-page-list">
                        <div class="eb-empty-msg">
                            <span class="material-icons" style="font-size:36px;color:#1a1a1a;display:block;margin-bottom:8px;">menu_book</span>
                            Genera un libro para ver las páginas
                        </div>
                    </div>
                </div>
            </div>

        </div>`;

        return this.element;
    }

    // ─── INIT ────────────────────────────────────────────────────────
    async onEnter() {
        // ── Guardar estado del Studio para restaurarlo al salir ──────
        if (window.app) {
            this._studioSnapshot = {
                slides: window.app.slides,
                currentSlideIndex: window.app.currentSlideIndex,
                canvasEditor: window.app.canvasEditor,
                canvasRenderer: window.app.canvasRenderer,
            };
        }

        // ── Renderer propio aislado para el Ebook (794×1123 A4) ──────
        if (!this._ebRenderer && window.createRenderer) {
            this._ebRenderer = window.createRenderer(794, 1123, this.activeTheme);
        }

        this._attachListeners();

        if (this.pages.length > 0) {
            this._renderPageList();
            await this._renderCurrentPage();
        }
    }

    // ── Restaurar Studio al salir ─────────────────────────────────────
    onLeave() {
        if (window.app && this._studioSnapshot) {
            window.app.slides = this._studioSnapshot.slides;
            window.app.currentSlideIndex = this._studioSnapshot.currentSlideIndex;
            window.app.canvasEditor = this._studioSnapshot.canvasEditor;
            window.app.canvasRenderer = this._studioSnapshot.canvasRenderer;
        }

        if (this._ebToolbar) {
            this._ebToolbar.destroy();
            this._ebToolbar = null;
        }
    }

    // ─── LISTENERS ──────────────────────────────────────────────────
    _attachListeners() {
        this.element.querySelector('#eb-generate-btn').onclick = () => this._generateBook();
        this.element.querySelector('#eb-prev').onclick = () => this._navigate(-1);
        this.element.querySelector('#eb-next').onclick = () => this._navigate(1);
        this.element.querySelector('#eb-export-pdf').onclick = () => this._exportPDF();
        this.element.querySelector('#eb-export-png').onclick = () => this._exportCurrentPNG();

        const coverDrop = this.element.querySelector('#eb-cover-drop');
        const coverInput = this.element.querySelector('#eb-cover-input');
        if (coverDrop) {
            coverDrop.onclick = () => coverInput.click();
            coverDrop.ondragover = (e) => { e.preventDefault(); coverDrop.classList.add('drag-over'); };
            coverDrop.ondragleave = () => coverDrop.classList.remove('drag-over');
            coverDrop.ondrop = (e) => {
                e.preventDefault(); coverDrop.classList.remove('drag-over');
                const f = e.dataTransfer.files[0];
                if (f?.type.startsWith('image/')) this._setCoverImage(f);
            };
        }
        if (coverInput) coverInput.onchange = (e) => { if (e.target.files[0]) this._setCoverImage(e.target.files[0]); };

        this.element.querySelector('#eb-theme').onchange = (e) => {
            this.activeTheme = e.target.value;
            if (this.pages.length) this._renderCurrentPage();
        };
    }

    // ─── COVER IMAGE ────────────────────────────────────────────────
    _setCoverImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.bookMeta.coverImage = e.target.result;
            const label = this.element.querySelector('#eb-cover-label');
            const drop = this.element.querySelector('#eb-cover-drop');
            if (label) label.textContent = `✅ ${file.name}`;
            if (drop) drop.style.borderColor = '#00FF88';
            if (this.pages.length > 0) {
                this._injectCoverImage(this.pages[0], e.target.result);
                if (this.currentPage === 0) this._renderCurrentPage();
            }
        };
        reader.readAsDataURL(file);
    }

    _injectCoverImage(page, dataURL) {
        if (!page.layers) return;
        page.layers = page.layers.filter(l => !l._coverImage);
        const bgIdx = page.layers.findIndex(l => l.type === 'background');
        page.layers.splice(bgIdx + 1, 0, {
            type: 'image', _coverImage: true, src: dataURL,
            x: 0, y: 0, width: 794, height: 1123, opacity: 0.22, blend: 'overlay'
        });
    }

    // ─── GENERATE ───────────────────────────────────────────────────
    async _generateBook() {
        const topic = this.element.querySelector('#eb-topic')?.value?.trim();
        const pageCount = parseInt(this.element.querySelector('#eb-pages')?.value || 20);
        const theme = this.element.querySelector('#eb-theme')?.value || 'cyber';
        const brandName = this.element.querySelector('#eb-brand-name')?.value || 'KR-CLIDN';
        const brandUrl = this.element.querySelector('#eb-brand-url')?.value || 'https://kr-clidn.com';

        if (!topic) { this._showError('Escribe el tema del libro antes de generar.'); return; }
        if (this.isGenerating) return;

        this.isGenerating = true;
        this.activeTheme = theme;
        this.brandConfig = { ...this.brandConfig, name: brandName, website: brandUrl };

        const genBtn = this.element.querySelector('#eb-generate-btn');
        const status = this.element.querySelector('#eb-gen-status');
        const genText = this.element.querySelector('#eb-gen-text');
        if (genBtn) { genBtn.disabled = true; genBtn.style.opacity = '0.5'; }
        if (status) status.style.display = 'flex';
        this._setProgress(10);

        try {
            // --- CHUNKING LOGIC ---
            const CHUNK_SIZE = 12; // 12 páginas máximo por petición para evitar MAX_TOKENS
            const chunkCount = Math.ceil(pageCount / CHUNK_SIZE);
            let mergedPages = [];
            let mainTitle = topic;
            let mainSubtitle = '';

            for (let i = 0; i < chunkCount; i++) {
                const currentChunkSize = (i === chunkCount - 1) ? (pageCount % CHUNK_SIZE || CHUNK_SIZE) : CHUNK_SIZE;

                if (genText) genText.textContent = `Generando parte ${i + 1} de ${chunkCount} (${currentChunkSize} págs)...`;
                const progress = 20 + ((i / chunkCount) * 60);
                this._setProgress(progress);

                const prompt = this._contentEngine.generateBookPrompt(
                    topic, pageCount, theme,
                    { name: brandName, logo: './assets/kr-clidn-logo.png', website: brandUrl },
                    i, chunkCount, currentChunkSize
                );

                const response = await this._callGemini(prompt);
                const parsed = this._parseBookResponse(response);

                if (!parsed?.pages?.length) {
                    throw new Error(`La IA no devolvió páginas válidas en la parte ${i + 1}. El formato devuelto puede estar corrupto.`);
                }

                if (i === 0 && parsed.title) {
                    mainTitle = parsed.title;
                    mainSubtitle = parsed.subtitle || '';
                }

                mergedPages = mergedPages.concat(parsed.pages);
            }

            if (genText) genText.textContent = 'Procesando páginas generadas...';
            this._setProgress(85);

            this.pages = mergedPages;
            this.currentPage = 0;
            this.bookMeta.title = mainTitle;
            this.bookMeta.subtitle = mainSubtitle;

            // Reasignar IDs correctos a las páginas
            this.pages.forEach((p, idx) => {
                p.id = `page-${idx + 1}`;
                if (!p.label) p.label = `Página ${idx + 1}`;

                // Asegurar que el page_number final coincida con el real
                if (p.layers) {
                    const pbLayer = p.layers.find(l => l.type === 'page_number');
                    if (pbLayer) {
                        pbLayer.current = idx + 1;
                        pbLayer.total = this.pages.length;
                    }
                }
            });

            if (this.bookMeta.coverImage && this.pages[0]) {
                this._injectCoverImage(this.pages[0], this.bookMeta.coverImage);
            }
            if (genText) genText.textContent = 'Renderizando...';
            this._renderPageList();
            await this._renderCurrentPage();
            this._renderPageEditor(0);

            this._setProgress(100);
            setTimeout(() => this._setProgress(0), 1500);
            if (window.app?.setStatus) window.app.setStatus(`✅ Libro: "${this.bookMeta.title}" — ${this.pages.length} páginas listas`);

        } catch (err) {
            console.error('[EbookView]', err);
            this._showError(err.message);
            this._setProgress(0);
        } finally {
            this.isGenerating = false;
            if (genBtn) { genBtn.disabled = false; genBtn.style.opacity = '1'; }
            if (status) status.style.display = 'none';
        }
    }

    // ─── AI CALL — usa el bridge nativo de la app (mismo sistema que generateBtn) ──
    async _callGemini(prompt) {
        // Intentar con los proveedores disponibles en el mismo orden que app.js
        const providers = ['gemini', 'openai', 'anthropic'];
        let apiKey = null;
        let provider = null;

        for (const p of providers) {
            try {
                const k = await window.cyberCanvas.getEnvKey(p);
                if (k) { apiKey = k; provider = p; break; }
            } catch (_) { }
        }

        if (!apiKey) {
            throw new Error('No se encontró API Key. Ve a Configuración y agrega tu clave de Gemini u OpenAI.');
        }

        console.log(`[EbookView] Llamando ${provider.toUpperCase()} para generar libro...`);

        const result = await window.cyberCanvas.callAI({
            provider: provider,
            apiKey: apiKey,
            prompt: prompt
        });

        if (!result.success) {
            throw new Error(`Error de IA (${provider}): ` + (result.error || 'Error desconocido'));
        }

        return result.code || '';
    }

    // ─── PARSE RESPONSE ─────────────────────────────────────────────
    _parseBookResponse(raw) {
        try {
            const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(clean);
            if (parsed.pages) {
                parsed.pages = parsed.pages.map((p, i) => ({
                    id: p.id || `page-${i + 1}`,
                    type: p.type || 'content',
                    label: p.label || `Página ${i + 1}`,
                    canvas: p.canvas || { width: 794, height: 1123 },
                    theme: p.theme || this.activeTheme,
                    layers: p.layers || []
                }));
            }
            return parsed;
        } catch (_) {
            const m = raw.match(/\{[\s\S]*"pages"[\s\S]*\}/);
            if (m) { try { return JSON.parse(m[0]); } catch (__) { } }
            throw new Error('No se pudo parsear la respuesta de la IA: ' + raw.substring(0, 200));
        }
    }

    // ─── NAVIGATION ─────────────────────────────────────────────────
    _navigate(delta) {
        if (!this.pages.length) return;
        this.currentPage = Math.max(0, Math.min(this.pages.length - 1, this.currentPage + delta));
        this._renderCurrentPage();
        this._highlightPageInList(this.currentPage);
    }

    // ─── PAGE LIST ──────────────────────────────────────────────────
    _renderPageList() {
        const list = this.element.querySelector('#eb-page-list');
        const countEl = this.element.querySelector('#eb-page-count');
        if (!list) return;
        if (countEl) countEl.textContent = `${this.pages.length} págs`;

        list.innerHTML = this.pages.map((page, i) => `
            <div class="eb-page-item ${i === this.currentPage ? 'active' : ''}" data-idx="${i}">
                <div class="eb-page-thumb-wrap">
                    <canvas id="eb-thumb-${i}" class="eb-page-thumb" width="70" height="99"></canvas>
                </div>
                <div class="eb-page-item-info">
                    <div class="eb-page-item-num">${i + 1}</div>
                    <div class="eb-page-item-label">${page.label || 'Página ' + (i + 1)}</div>
                    <div class="eb-page-item-type">${page.type || 'content'}</div>
                </div>
                <div class="eb-page-item-actions">
                    <button class="eb-icon-btn" data-action="up"  data-idx="${i}" title="Subir">↑</button>
                    <button class="eb-icon-btn" data-action="dn"  data-idx="${i}" title="Bajar">↓</button>
                    <button class="eb-icon-btn eb-danger" data-action="del" data-idx="${i}" title="Eliminar">✕</button>
                </div>
            </div>`).join('');

        list.querySelectorAll('.eb-page-item').forEach(item => {
            item.onclick = (e) => {
                if (e.target.closest('.eb-page-item-actions')) return;
                const idx = parseInt(item.dataset.idx);
                this.currentPage = idx;
                this._renderCurrentPage();
                this._highlightPageInList(idx);
            };
        });

        list.querySelectorAll('[data-action]').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.idx);
                const act = btn.dataset.action;
                if (act === 'del') this._deletePage(idx);
                if (act === 'up') this._movePage(idx, -1);
                if (act === 'dn') this._movePage(idx, 1);
            };
        });

        this._renderThumbnails();
    }

    _highlightPageInList(idx) {
        this.element.querySelectorAll('.eb-page-item').forEach((item, i) => {
            item.classList.toggle('active', i === idx);
        });
        const active = this.element.querySelector('.eb-page-item.active');
        if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    async _renderThumbnails() {
        for (let i = 0; i < this.pages.length; i++) {
            const tc = this.element.querySelector(`#eb-thumb-${i}`);
            if (!tc || !window.createRenderer) continue;
            try {
                const page = this.pages[i];
                const r = window.createRenderer(794, 1123, page.theme || this.activeTheme);
                await r.render(page, { skipLayout: true });
                await new Promise(res => setTimeout(res, 15));
                tc.getContext('2d').drawImage(r.canvas, 0, 0, 70, 99);
                r.canvas.remove();
                r._imageCache?.clear();
            } catch (_) { }
        }
    }

    // ─── RENDER MAIN CANVAS — renderer AISLADO, no toca window.app ──
    async _renderCurrentPage() {
        try {
            const canvas = this.element.querySelector('#eb-mainCanvas');
            if (!canvas) return;

            const counterEl = this.element.querySelector('#eb-counter');
            const typeLabel = this.element.querySelector('#eb-page-type-label');
            const statusDot = this.element.querySelector('#eb-statusDot');

            if (!this.pages.length) {
                canvas.innerHTML = `<div class="eb-placeholder">
                    <span class="material-icons" style="font-size:64px;color:#1a1a1a;display:block;margin-bottom:16px;">menu_book</span>
                    <div style="font-size:11px;color:#222;letter-spacing:2px;text-transform:uppercase;">Escribe un tema y genera tu libro</div>
                </div>`;
                if (counterEl) counterEl.textContent = '-- / --';
                return;
            }

            const page = this.pages[this.currentPage];
            if (!page) return;

            if (counterEl) counterEl.textContent = `${this.currentPage + 1} / ${this.pages.length}`;
            if (typeLabel) typeLabel.textContent = page.label || page.type || '—';
            if (statusDot) statusDot.classList.add('active');

            if (!window.createRenderer) {
                canvas.innerHTML = `<div style="color:#ff6b6b;padding:30px;text-align:center;font-size:12px;">⚠️ window.createRenderer no disponible</div>`;
                return;
            }

            // ── Renderer aislado — siempre A4, nunca modifica window.app ─
            if (!this._ebRenderer) {
                this._ebRenderer = window.createRenderer(794, 1123, page.theme || this.activeTheme);
            }

            // ── CanvasEditor aislado — propio del Ebook ──────────────────
            if (!this._ebCanvasEditor || typeof this._ebCanvasEditor.attachCanvas !== 'function') {
                this._ebCanvasEditor = new window.CanvasEditor(canvas, this._ebRenderer);
                this._ebCanvasEditor.onChange = (modifiedGraph) => {
                    if (this.pages && this.pages[this.currentPage]) {
                        this.pages[this.currentPage] = modifiedGraph;
                    }
                };
            } else {
                this._ebCanvasEditor.renderer = this._ebRenderer;
                this._ebCanvasEditor.attachCanvas(canvas);
            }

            // ── Aplicar tema si existe brandingInstance ───────────────────
            let themedPage = page;
            if (window.brandingInstance?.applyTheme) {
                themedPage = window.brandingInstance.applyTheme(
                    JSON.parse(JSON.stringify(page)),
                    page.theme || this.activeTheme
                );
            }

            await this._ebCanvasEditor.load(themedPage);

            if (!this._ebToolbar) {
                // Selecciona el contenedor padre del canvas, o usa el ID esperado
                const previewContainer = this.element.querySelector('#eb-previewContainer') || canvas.parentElement;

                this._ebToolbar = new CanvasEditorToolbar(
                    previewContainer,
                    this._ebCanvasEditor,
                    {
                        mode: 'ebook',
                        onSceneChange: (graph) => {
                            if (this.pages && this.pages[this.currentPage]) {
                                this.pages[this.currentPage] = graph;
                            }
                        }
                    }
                );
            }
            this._ebToolbar.pushHistory(themedPage);

            if (statusDot) statusDot.classList.remove('active');

        } catch (err) {
            console.error('[EbookView] _renderCurrentPage error:', err);
            const canvas = this.element.querySelector('#eb-mainCanvas');
            if (canvas) canvas.innerHTML = `<div style="color:#ff6b6b;padding:20px;text-align:center;font-size:12px;">⚠️ ${err.message}</div>`;
        }
    }

    // ─── PAGE MANAGEMENT ────────────────────────────────────────────
    _deletePage(idx) {
        if (!this.pages || this.pages.length <= 1) return;
        if (!confirm(`¿Eliminar la página ${idx + 1}?`)) return;
        this.pages.splice(idx, 1);
        this.currentPage = Math.min(this.currentPage, this.pages.length - 1);
        this._renderPageList();
        this._renderCurrentPage();
    }

    _movePage(idx, delta) {
        if (!this.pages) return;
        const newIdx = idx + delta;
        if (newIdx < 0 || newIdx >= this.pages.length) return;

        const temp = this.pages[idx];
        this.pages[idx] = this.pages[newIdx];
        this.pages[newIdx] = temp;

        if (this.currentPage === idx) this.currentPage = newIdx;
        else if (this.currentPage === newIdx) this.currentPage = idx;

        this._renderPageList();
        this._renderCurrentPage();
    }

    // ─── EXPORT PDF ─────────────────────────────────────────────────
    async _exportPDF() {
        if (!this.pages.length) { alert('⚠️ Genera el libro primero.'); return; }

        const btn = this.element.querySelector('#eb-export-pdf');
        const orig = btn?.innerHTML;
        if (btn) { btn.innerHTML = '<span class="material-icons spin" style="font-size:13px;">autorenew</span> Generando PDF...'; btn.disabled = true; }

        try {
            this._setProgress(20);
            if (window.app?.setStatus) window.app.setStatus('📚 Generando PDF del ebook...', true);

            const doc = await CanvasToPDF.generate(this.pages, {
                title: this.bookMeta.title || 'Ebook',
                format: [794, 1123],
                orientation: 'portrait',
                _ebRenderer: this._ebRenderer   // pasa el renderer aislado
            });

            this._setProgress(90);
            const fileName = (this.bookMeta.title || 'ebook').replace(/[^a-zA-Z0-9_\- ]/g, '_').substring(0, 60) + '.pdf';
            doc.save(fileName);
            this._setProgress(100);
            setTimeout(() => this._setProgress(0), 1500);
            if (window.app?.setStatus) window.app.setStatus(`✅ PDF exportado: ${fileName}`);

        } catch (err) {
            alert('❌ Error exportando PDF: ' + err.message);
            this._setProgress(0);
        } finally {
            if (btn) { btn.innerHTML = orig; btn.disabled = false; }
        }
    }

    // ─── EXPORT PNG ─────────────────────────────────────────────────
    async _exportCurrentPNG() {
        if (!this.pages.length || !window.createRenderer) return;
        const page = this.pages[this.currentPage];
        const btn = this.element.querySelector('#eb-export-png');
        const orig = btn?.innerHTML;
        if (btn) { btn.innerHTML = '<span class="material-icons spin" style="font-size:13px;">autorenew</span>'; btn.disabled = true; }

        try {
            // Renderer OFSCREEN dedicado para export — no reutiliza _ebRenderer
            const r = window.createRenderer(794, 1123, page.theme || this.activeTheme);
            if (this._ebRenderer?._imageCache) {
                r._imageCache = new Map(this._ebRenderer._imageCache);
            }
            await r.render(page, { skipLayout: true });
            await new Promise(res => setTimeout(res, 60));
            const url = r.exportDataURL('image/png', 1.0);
            r.canvas.remove();

            const link = document.createElement('a');
            link.download = `ebook_p${this.currentPage + 1}.png`;
            link.href = url;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        } catch (err) { alert('❌ ' + err.message); }
        finally { if (btn) { btn.innerHTML = orig; btn.disabled = false; } }
    }

    // ─── UTILS ──────────────────────────────────────────────────────
    _setProgress(pct) {
        // Actualiza barra de progreso universal en el HUD / footer
        const bar = this.element.querySelector('#eb-progress');
        if (bar) bar.style.width = pct + '%';

        // Actualiza barra animada local en el panel lateral de generar
        const genBar = this.element.querySelector('#eb-gen-bar');
        if (genBar) genBar.style.width = pct + '%';

        // Actualiza el texto de % local en el panel lateral de generar
        const genPct = this.element.querySelector('#eb-gen-pct');
        if (genPct) genPct.textContent = Math.round(pct) + '%';
    }

    _showError(msg) {
        const c = this.element.querySelector('#eb-canvas-container');
        if (c) c.innerHTML = `<div style="color:#ff6b6b;padding:30px;text-align:center;font-size:12px;line-height:1.6;max-width:420px;margin:auto;">⚠️ ${msg}</div>`;
        if (window.app?.setStatus) window.app.setStatus('❌ ' + msg);
    }

    _toHex(color) {
        if (!color) return '#ffffff';
        if (color.startsWith('#') && color.length >= 7) return color.substring(0, 7);
        return '#00D9FF';
    }

    show() { const el = document.getElementById('ebook-view-root'); if (el) el.style.display = ''; }
    hide() { const el = document.getElementById('ebook-view-root'); if (el) el.style.display = 'none'; }
}
