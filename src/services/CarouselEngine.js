// ═══════════════════════════════════════════════════════════════════════════
// CYBER-CANVAS PRO - Carousel Engine v3.0 (Dynamic AI Selection)
// Motor inteligente: la IA selecciona y REPITE templates según el contenido
// Sin límite de slides — genera posts tipo libro
// ═══════════════════════════════════════════════════════════════════════════

class CarouselEngine {
    constructor(templateEngine) {
        this.templateEngine = templateEngine;
        this.packs = [];
    }

    setPacks(packsMeta) {
        this.packs = packsMeta;
        console.log(`CarouselEngine: ${this.packs.length} packs registrados.`);
    }

    getPacks() { return this.packs; }
    getPackById(id) { return this.packs.find(p => p.id === id); }

    // ═══════════════════════════════════════════════════════════════════════
    // CATÁLOGO COMPLETO — 20 TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════

    getTemplateCatalog() {
        return {

            // ────────────── ESTRUCTURA (Cover, TOC, Divider, Summary) ──────────────

            'kr-clidn-01': {
                purpose: 'PORTADA/COVER. Primer slide SIEMPRE. Solo Texto Elegante con Keywords Cyan.',
                when: 'Para presentar el tema principal.',
                repeatable: false,
                json_example: {
                    TITLE: "La *Guía* Definitiva de *NMAP* para *Principiantes*",
                    SUBTITLE: "Domina el escaneo de redes en minutos.",
                },
                rules: [
                    "TITLE: entre 3 y 10 palabras. IMPORTANTE: Envuelve las palabras clave en asteriscos * (ej: *Hack*) para resaltarlas en AZUL ELÉCTRICO.",
                    "SUBTITLE: máx 120 chars, hook descriptivo.",
                    "NO uses el campo ICON."
                ]
            },
            'kr-clidn-09': {
                purpose: 'CTA FINAL. Último slide SIEMPRE. Iconos sociales TikTok + texto subliminal.',
                when: 'Cerrar el carrusel y persuadir a dar like, comentar, guardar y compartir.',
                repeatable: false,
                json_example: {
                    TITLE: "¿Te fue útil?",
                    CTA_MESSAGE: "Si llegaste hasta aquí, este contenido fue para ti",
                    CLOSING_TEXT: "Esto fue solo el inicio...",
                    HASHTAGS: "#KaliLinux #CyberSecurity #HackingÉtico",
                },
                rules: [
                    "CTA_MESSAGE: persuasivo, máx 120 chars, crear conexión emocional",
                    "CLOSING_TEXT: máx 60 chars, frase FOMO que deje con ganas de más",
                    "HASHTAGS: máx 80 chars"
                ]
            },
            'kr-clidn-19': {
                purpose: 'TABLE OF CONTENTS / ÍNDICE. Para posts largos (10+ slides).',
                when: 'El post tiene 10+ slides — agregar DESPUÉS de la portada.',
                repeatable: false,
                json_example: {
                    TITLE: "Contenido",
                    SUBTITLE: "Lo que aprenderás en este post",
                    ITEMS: [
                        { NUMBER: "01", TEXT: "Navegación básica", RANGE: "03-10" },
                        { NUMBER: "02", TEXT: "Archivos y permisos", RANGE: "11-20" },
                        { NUMBER: "03", TEXT: "Red y procesos", RANGE: "21-28" },
                        { NUMBER: "04", TEXT: "Resumen", RANGE: "29-32" }
                    ],
                    TOTAL_SLIDES: "32",
                },
                rules: [
                    "ITEMS: entre 3 y 6 secciones",
                    "RANGE: formato slide-slide"
                ]
            },
            'kr-clidn-20': {
                purpose: 'CHAPTER DIVIDER. Separador de sección.',
                when: 'Separar secciones en posts largos. Usar antes de cada nueva sección.',
                repeatable: true,
                json_example: {
                    CHAPTER_NUMBER: "02",
                    CHAPTER_TITLE: "Archivos",
                    CHAPTER_SUBTITLE: "Gestión de archivos y directorios",
                    ICON: "folder",
                },
                rules: [
                    "CHAPTER_TITLE: máx 30 chars",
                    "ICON: nombre de icono Material Design (ej: 'folder', 'folder_open'). NO USES PREFIJOS."
                ]
            },

            // ────────────── CONTENIDO PRINCIPAL (Repeatable) ──────────────

            'kr-clidn-11': {
                purpose: 'COMMAND CARD. UN comando educativo completo.',
                when: 'Explicar un comando individual. REPETIR para cada comando.',
                repeatable: true,
                json_example: {
                    COMMAND_NAME: "ls",
                    COMMAND_NUMBER: "01",
                    TOTAL_COMMANDS: "30",
                    CATEGORY: "Navegación",
                    SYNTAX: "ls [opciones] [ruta]",
                    DESCRIPTION: "Lista el contenido de un directorio.",
                    EXAMPLE_CMD: "$ ls -la /home",
                    EXAMPLE_OUTPUT: "drwxr-xr-x 5 user user 4096 ...",
                    KEY_FLAGS: [
                        { FLAG: "-l", DESC: "Formato largo detallado" },
                        { FLAG: "-a", DESC: "Incluye archivos ocultos" },
                        { FLAG: "-h", DESC: "Tamaños legibles (KB, MB)" }
                    ],
                },
                rules: [
                    "COMMAND_NAME: máx 15 chars",
                    "CATEGORY: máx 20 chars",
                    "SYNTAX: máx 40 chars",
                    "DESCRIPTION: máx 80 chars",
                    "EXAMPLE_CMD: máx 50 chars, con $",
                    "KEY_FLAGS: exacto 3 flags"
                ]
            },
            'kr-clidn-02': {
                purpose: 'ANATOMÍA/SINTAXIS de un comando.',
                when: 'Explicar la estructura o componentes de algo.',
                repeatable: true,
                json_example: {
                    TITLE: "La Anatomía de nmap",
                    COMMAND_STRUCTURE: "nmap [opciones] objetivo",
                    COMPONENTS: [
                        { NUMBER: "1", NAME: "nmap", DESCRIPTION: "El binario del escáner" },
                        { NUMBER: "2", NAME: "[opciones]", DESCRIPTION: "Flags que modifican el escaneo" },
                        { NUMBER: "3", NAME: "objetivo", DESCRIPTION: "IP, rango o dominio" }
                    ],
                    TIP: "Los elementos entre [ ] son opcionales.",
                },
                rules: ["COMPONENTS: exacto 3", "TIP: máx 100 chars"]
            },
            'kr-clidn-03': {
                purpose: 'FEATURE CARDS. Opciones o flags.',
                when: 'Listar 2 opciones/flags/características.',
                repeatable: true,
                json_example: {
                    TITLE: "Opciones Esenciales",
                    INTRO_TEXT: "Las opciones más importantes.",
                    OPTIONS: [
                        { FLAG: "-sS", NAME: "SYN Scan", ICON: "bolt", DESCRIPTION: "Escaneo sigiloso half-open" },
                        { FLAG: "-sV", NAME: "Version", ICON: "info", DESCRIPTION: "Detecta versión de servicios" }
                    ],
                    TIP_TITLE: "Pro Tip",
                    TIP_CONTENT: "Combina: nmap -sS -sV -O objetivo",
                },
                rules: ["OPTIONS: exacto 2 por slide", "Si hay más de 2, usar OTRO slide kr-clidn-03"]
            },
            'kr-clidn-04': {
                purpose: 'TERMINAL OUTPUT. Salida de un comando.',
                when: 'Mostrar e interpretar output de terminal.',
                repeatable: true,
                json_example: {
                    TITLE: "Entendiendo la salida",
                    WARNING_TEXT: "Interpretar esto es clave",
                    OUTPUT_LINES: [
                        { TEXT: "PORT   STATE SERVICE", HIGHLIGHT: "STATE" },
                        { TEXT: "22/tcp open  ssh", HIGHLIGHT: "open" }
                    ],
                    BREAKDOWN_CARDS: [
                        { NUMBER: "1", TITLE: "Puerto", CONTENT_HTML: "Número de puerto" }
                    ],
                },
                rules: ["OUTPUT_LINES: exacto 2", "BREAKDOWN_CARDS: exacto 1"]
            },
            'kr-clidn-05': {
                purpose: 'GRID/COLUMNAS. Datos o items en grid.',
                when: 'Hay múltiples columnas o datos a explicar.',
                repeatable: true,
                json_example: {
                    TITLE: "Desglose de Columnas",
                    INTRO_TEXT: "Cada columna tiene significado",
                    OUTPUT_LINES: [
                        { TEXT: "PORT STATE SERVICE" },
                        { TEXT: "22/tcp open ssh" },
                        { TEXT: "80/tcp open http" }
                    ],
                    GRID_ITEMS: [
                        { NUMBER: "1", TITLE: "PORT", CONTENT: "Número de puerto" },
                        { NUMBER: "2", TITLE: "STATE", CONTENT: "open/closed" },
                        { NUMBER: "3", TITLE: "SERVICE", CONTENT: "Servicio" },
                        { NUMBER: "4", TITLE: "VERSION", CONTENT: "Versión" },
                        { NUMBER: "5", TITLE: "PROTO", CONTENT: "TCP/UDP" }
                    ],
                },
                rules: ["OUTPUT_LINES: exacto 3", "GRID_ITEMS: exacto 5"]
            },
            'kr-clidn-06': {
                purpose: 'LAB/EJERCICIO práctico básico.',
                when: 'Ejercicio práctico, nivel principiante.',
                repeatable: true,
                json_example: {
                    EXERCISE_LETTER: "A",
                    TITLE: "Escaneo básico",
                    INTRO_TEXT: "Abre tu terminal y realiza este escaneo.",
                    COMMAND: "$ nmap 192.168.1.1",
                    RESULT_TEXT: "Verás los puertos abiertos.",
                    NOTE_TITLE: "Nota",
                    NOTE_CONTENT: "Solo escanea TU red.",
                },
                rules: ["EXERCISE_LETTER: 1 letra", "COMMAND: máx 50 chars"]
            },
            'kr-clidn-07': {
                purpose: 'WARNING/ÉTICA. Advertencia de seguridad.',
                when: 'Ejercicio con riesgos legales/éticos.',
                repeatable: true,
                json_example: {
                    EXERCISE_LETTER: "B",
                    TITLE: "Escaneo agresivo",
                    INTRO_TEXT: "Este escaneo es invasivo y detectable.",
                    COMMAND: "$ nmap -A objetivo",
                    RESULT_TEXT: "Detectará OS, versiones, scripts.",
                    WARNING_TITLE: "⚠ Cuidado",
                    WARNING_CONTENT: "El flag -A es ruidoso. Solo con autorización.",
                },
                rules: ["WARNING_CONTENT: máx 120 chars, advertencia REAL"]
            },
            'kr-clidn-08': {
                purpose: 'ESTADÍSTICA. Dato numérico impactante.',
                when: 'Hay un porcentaje o estadística que resaltar.',
                repeatable: true,
                json_example: {
                    EXERCISE_LETTER: "C",
                    TITLE: "Detección de OS",
                    INTRO_TEXT: "Nmap identifica el SO remoto.",
                    COMMAND: "$ nmap -O objetivo",
                    RESULT_TEXT: "Verás el SO con % de confianza.",
                    PERCENTAGE: "95%",
                    PERCENTAGE_TEXT: "Precisión con suficientes puertos",
                    TIP_TITLE: "Recuerda",
                    TIP_CONTENT: "Necesita 1 puerto abierto y 1 cerrado.",
                },
                rules: ["PERCENTAGE: máx 5 chars (95%, 80%)"]
            },
            'kr-clidn-10': {
                purpose: 'GITHUB TOOL. Herramienta de GitHub.',
                when: 'Presentar herramienta open-source de GitHub.',
                repeatable: true,
                json_example: {
                    TOOL_NAME: "Subfinder",
                    TOOL_CATEGORY: "Recon",
                    DESCRIPTION: "Descubre subdominios usando fuentes pasivas.",
                    INSTALL_CMD: "$ go install github.com/projectdiscovery/subfinder@latest",
                    USAGE_CMD: "$ subfinder -d example.com",
                    FEATURES: [
                        { ICON: "speed", TEXT: "Rápido y concurrente" },
                        { ICON: "public", TEXT: "Múltiples fuentes" },
                        { ICON: "code", TEXT: "Open source" }
                    ],
                    GITHUB_STARS: "9.2k",
                },
                rules: ["FEATURES: exacto 3", "GITHUB_STARS: formato abreviado"]
            },
            'kr-clidn-12': {
                purpose: 'COMPARACIÓN (VS). Dos cosas lado a lado.',
                when: 'Comparar 2 herramientas, comandos o conceptos.',
                repeatable: true,
                json_example: {
                    TITLE: "nmap vs masscan",
                    LEFT_NAME: "nmap",
                    LEFT_ICON: "radar",
                    LEFT_ITEMS: [
                        { TEXT: "Preciso y detallado" },
                        { TEXT: "Scripts NSE" },
                        { TEXT: "Detección de OS" }
                    ],
                    RIGHT_NAME: "masscan",
                    RIGHT_ICON: "speed",
                    RIGHT_ITEMS: [
                        { TEXT: "Extremadamente rápido" },
                        { TEXT: "Millones de IPs/seg" },
                        { TEXT: "Formato simple" }
                    ],
                    VERDICT: "nmap para detalle, masscan para velocidad.",
                },
                rules: ["LEFT/RIGHT_ITEMS: exacto 3 cada uno", "VERDICT: máx 100 chars"]
            },
            'kr-clidn-13': {
                purpose: 'STEP BY STEP. Un paso numerado.',
                when: 'Tutorial paso a paso. REPETIR para cada paso.',
                repeatable: true,
                json_example: {
                    STEP_NUMBER: "01",
                    TOTAL_STEPS: "05",
                    TITLE: "Instalación",
                    DESCRIPTION: "Instala nmap desde los repos.",
                    COMMAND: "$ sudo apt install nmap",
                    EXPECTED_RESULT: "El paquete se instalará.",
                    NOTE: "Necesitas conexión a internet.",
                },
                rules: ["TITLE: máx 25 chars", "COMMAND: máx 60 chars"]
            },
            'kr-clidn-14': {
                purpose: 'CODE BLOCK. Script o código completo.',
                when: 'Mostrar un bloque de código con explicación.',
                repeatable: true,
                json_example: {
                    TITLE: "Script de Escaneo",
                    LANGUAGE: "bash",
                    DESCRIPTION: "Automatiza escaneos con nmap.",
                    CODE_LINES: [
                        { LINE: "#!/bin/bash", COMMENT: "" },
                        { LINE: "TARGET=$1", COMMENT: "# IP objetivo" },
                        { LINE: "nmap -sS -sV $TARGET", COMMENT: "# Escaneo" },
                        { LINE: "echo 'Completado'", COMMENT: "" }
                    ],
                    EXPLANATION: "Este script toma una IP como argumento y ejecuta un escaneo completo.",
                },
                rules: ["CODE_LINES: entre 2 y 8 líneas", "LANGUAGE: bash, python, etc."]
            },
            'kr-clidn-15': {
                purpose: 'CONCEPTO/DEFINICIÓN. Término técnico.',
                when: 'Explicar un concepto, protocolo o término.',
                repeatable: true,
                json_example: {
                    TERM: "TCP/IP",
                    CATEGORY: "Redes",
                    DEFINITION: "Conjunto de protocolos que gobierna la comunicación en Internet.",
                    KEY_POINTS: [
                        { ICON: "dns", TEXT: "Base de Internet" },
                        { ICON: "lan", TEXT: "4 capas: Enlace, Red, Transporte, App" },
                        { ICON: "router", TEXT: "IP identifica, TCP garantiza entrega" }
                    ],
                    EXAMPLE: "Cuando navegas, TCP/IP maneja cada paquete.",
                },
                rules: ["TERM: máx 20 chars", "KEY_POINTS: exacto 3"]
            },
            'kr-clidn-16': {
                purpose: 'DO vs DON\'T. Buenas vs malas prácticas.',
                when: 'Enseñar ética o buenas prácticas.',
                repeatable: true,
                json_example: {
                    TITLE: "Buenas Prácticas",
                    DO_ITEMS: [
                        { TEXT: "Pide autorización antes" },
                        { TEXT: "Documenta hallazgos" }
                    ],
                    DONT_ITEMS: [
                        { TEXT: "Escanear sin permiso" },
                        { TEXT: "Compartir vulns públicamente" }
                    ],
                    BOTTOM_TIP: "La ética diferencia a un hacker de un criminal.",
                },
                rules: ["DO_ITEMS: exacto 2", "DONT_ITEMS: exacto 2"]
            },
            'kr-clidn-17': {
                purpose: 'CHECKLIST. Requisitos o verificaciones.',
                when: 'Lista de prerrequisitos o verificaciones.',
                repeatable: false,
                json_example: {
                    TITLE: "Antes de empezar",
                    DESCRIPTION: "Verifica estos requisitos.",
                    CHECK_ITEMS: [
                        { TEXT: "Kali Linux instalado", CHECKED: true },
                        { TEXT: "Terminal abierta", CHECKED: true },
                        { TEXT: "Conexión a red", CHECKED: false },
                        { TEXT: "Permisos root", CHECKED: false }
                    ],
                    NOTE: "Todos deben completarse.",
                },
                rules: ["CHECK_ITEMS: entre 3 y 5 items", "CHECKED: true o false"]
            },
            'kr-clidn-18': {
                purpose: 'QUOTE/FACT. Cita o dato impactante.',
                when: 'Dato estadístico, cita o fact interesante.',
                repeatable: false,
                json_example: {
                    QUOTE_TEXT: "\"La seguridad no es un producto, es un proceso.\"",
                    QUOTE_AUTHOR: "Bruce Schneier",
                    CONTEXT: "Criptógrafo y experto en seguridad.",
                    EXTRA_FACT: "El 95% de brechas son por error humano.",
                },
                rules: ["QUOTE_TEXT: máx 120 chars, con comillas", "EXTRA_FACT: máx 100 chars"]
            },
            'kr-clidn-21': {
                purpose: 'PRO TERMINAL. Terminal realista con output colorizado.',
                when: 'Mostrar sesión de terminal con múltiples líneas y colores.',
                repeatable: true,
                json_example: {
                    TITLE: "Escaneo de Puertos",
                    TERMINAL_LINES: [
                        { TYPE: "prompt", TEXT: "$ nmap -sS -sV 192.168.1.1" },
                        { TYPE: "output", TEXT: "Starting Nmap 7.94" },
                        { TYPE: "highlight", TEXT: "PORT     STATE SERVICE  VERSION" },
                        { TYPE: "success", TEXT: "22/tcp   open  ssh      OpenSSH 8.9" },
                        { TYPE: "warning", TEXT: "443/tcp  open  ssl      VULNERABLE" }
                    ],
                    EXPLANATION: "Este escaneo SYN detecta puertos abiertos y versiones de servicios.",
                },
                rules: ["TERMINAL_LINES: 4-8 líneas", "TYPE: prompt/output/highlight/success/warning/error"]
            },
            'kr-clidn-22': {
                purpose: 'DIRECTORY TREE. Estructura visual de carpetas/archivos.',
                when: 'Explicar jerarquía de directorios Linux.',
                repeatable: true,
                json_example: {
                    TITLE: "Estructura de /etc",
                    ROOT_PATH: "/etc",
                    TREE_ITEMS: [
                        { DEPTH: 0, TYPE: "folder", NAME: "etc/", DETAIL: "Configuraciones del sistema" },
                        { DEPTH: 1, TYPE: "file", NAME: "passwd", DETAIL: "Usuarios del sistema" },
                        { DEPTH: 1, TYPE: "folder", NAME: "ssh/", DETAIL: "Config SSH" }
                    ],
                    DESCRIPTION: "El directorio /etc contiene todas las configuraciones del sistema.",
                },
                rules: ["TREE_ITEMS: 4-6 items", "DEPTH: 0-2", "TYPE: folder o file"]
            },
            'kr-clidn-23': {
                purpose: 'PROCESS FLOW. Flujo visual de un proceso.',
                when: 'Explicar cómo funciona algo paso a paso con flechas.',
                repeatable: true,
                json_example: {
                    TITLE: "Cómo funciona un escaneo",
                    FLOW_STEPS: [
                        { ICON: "keyboard", LABEL: "Input", DESC: "El usuario ejecuta el comando" },
                        { ICON: "memory", LABEL: "Proceso", DESC: "El kernel procesa la solicitud" },
                        { ICON: "monitor", LABEL: "Output", DESC: "El resultado aparece en pantalla" }
                    ],
                    DESCRIPTION: "Cada comando sigue este flujo de ejecución.",
                },
                rules: ["FLOW_STEPS: entre 3 y 5", "ICON: nombre de icono Material Design (ej: 'security', 'lock'). NO USES PREFIJOS."]
            },
            'kr-clidn-24': {
                purpose: 'BEFORE/AFTER. Transformación de comando.',
                when: 'Mostrar la diferencia entre básico y avanzado.',
                repeatable: true,
                json_example: {
                    TITLE: "Antes y Después",
                    BEFORE_TITLE: "ANTES",
                    BEFORE_LINES: [{ TEXT: "$ ls" }, { TEXT: "file1.txt  file2.txt" }],
                    AFTER_TITLE: "DESPUÉS",
                    AFTER_LINES: [{ TEXT: "$ ls -la --color" }, { TEXT: "drwxr-xr-x 2 user user 4096 Jan 15 ./" }],
                    COMMAND: "ls -la --color",
                    EXPLANATION: "Al agregar flags obtienes permisos, tamaño y colores.",
                },
                rules: ["BEFORE_LINES: 1-3", "AFTER_LINES: 1-4", "COMMAND: máx 50 chars"]
            },
            'kr-clidn-25': {
                purpose: 'PRO TIP. Tip profesional destacado.',
                when: 'Un consejo importante que mejora productividad.',
                repeatable: true,
                json_example: {
                    TIP_NUMBER: "01",
                    TITLE: "Usa Aliases",
                    TIP_TEXT: "Crea alias en tu .bashrc para acelerar tu flujo de trabajo.",
                    EXAMPLE_CMD: "alias ll='ls -la --color=auto'",
                    WHY_TEXT: "Los alias convierten comandos largos en atajos rápidos.",
                    CATEGORY: "Productividad",
                },
                rules: ["TIP_TEXT: máx 200 chars", "EXAMPLE_CMD: máx 60 chars"]
            },
            'kr-clidn-26': {
                purpose: 'NETWORK DIAGRAM. Topología de red visual.',
                when: 'Mostrar diagrama de red con dispositivos e IPs.',
                repeatable: true,
                json_example: {
                    TITLE: "Topología de Red",
                    NODES: [
                        { ICON: "router", NAME: "Router", IP: "192.168.1.1", STATUS: "active" },
                        { ICON: "computer", NAME: "Kali Linux", IP: "192.168.1.100", STATUS: "active" },
                        { ICON: "storage", NAME: "Target", IP: "192.168.1.50", STATUS: "target" }
                    ],
                    DESCRIPTION: "Topología típica para pruebas de penetración.",
                },
                rules: ["NODES: 3-4 nodos", "STATUS: active o target"]
            },
            'kr-clidn-27': {
                purpose: 'PERMISSION MATRIX. Permisos rwx explicados.',
                when: 'Enseñar permisos de archivos Linux visualmente.',
                repeatable: true,
                json_example: {
                    TITLE: "Permisos Linux",
                    FILE_EXAMPLE: "-rwxr-xr-- 1 root www-data 4096 script.sh",
                    PERMISSION_GROUPS: [
                        { GROUP: "Owner", PERMS: "rwx", ICON: "person", COLOR: "#00ff88", DESC: "Control total" },
                        { GROUP: "Group", PERMS: "r-x", ICON: "group", COLOR: "#00d4ff", DESC: "Leer y ejecutar" },
                        { GROUP: "Others", PERMS: "r--", ICON: "public", COLOR: "#ff9500", DESC: "Solo lectura" }
                    ],
                    EXPLANATION: "Los permisos determinan quién puede leer (r), escribir (w) o ejecutar (x).",
                },
                rules: ["PERMISSION_GROUPS: exacto 3", "PERMS: 3 chars rwx/-"]
            },
            'kr-clidn-28': {
                purpose: 'CHEAT SHEET. Grid de comandos rápidos.',
                when: 'Resumen compacto de múltiples comandos.',
                repeatable: true,
                json_example: {
                    TITLE: "Cheat Sheet",
                    CATEGORY: "Comandos Esenciales",
                    COMMANDS: [
                        { CMD: "pwd", DESC: "Directorio actual" },
                        { CMD: "ls -la", DESC: "Listar detallado" },
                        { CMD: "cd ~", DESC: "Ir al home" },
                        { CMD: "mkdir -p", DESC: "Crear directorios" },
                        { CMD: "rm -rf", DESC: "Eliminar recursivo" },
                        { CMD: "cp -r", DESC: "Copiar recursivo" }
                    ],
                    NOTE: "Guarda esta referencia rápida.",
                },
                rules: ["COMMANDS: entre 6 y 8 items", "CMD: máx 15 chars", "DESC: máx 25 chars"]
            },
            'kr-clidn-29': {
                purpose: 'ERROR/SOLUTION. Error con solución.',
                when: 'Error común que todo principiante encuentra.',
                repeatable: true,
                json_example: {
                    TITLE: "Permission Denied",
                    ERROR_CMD: "$ apt install nmap",
                    ERROR_OUTPUT: "E: Could not open lock file - Permission denied",
                    ERROR_MEANING: "No tienes permisos root para instalar paquetes.",
                    SOLUTION_CMD: "$ sudo apt install nmap",
                    SOLUTION_OUTPUT: "Reading package lists... Done.",
                    WHY_IT_WORKS: "sudo eleva privilegios temporalmente para operaciones de sistema.",
                },
                rules: ["ERROR_OUTPUT: máx 150 chars", "WHY_IT_WORKS: máx 200 chars"]
            },
            'kr-clidn-30': {
                purpose: 'MINI TUTORIAL. 3 pasos compactos.',
                when: 'Tutorial rápido que cabe en un solo slide.',
                repeatable: true,
                json_example: {
                    TITLE: "Instalar Nmap",
                    DESCRIPTION: "3 pasos para tener nmap listo.",
                    STEPS: [
                        { NUM: "1", TITLE: "Abre terminal", CMD: "$ Ctrl+Alt+T", RESULT: "Se abre la terminal" },
                        { NUM: "2", TITLE: "Actualiza", CMD: "$ sudo apt update", RESULT: "Listas actualizadas" },
                        { NUM: "3", TITLE: "Instala", CMD: "$ sudo apt install nmap", RESULT: "nmap listo" }
                    ],
                    FINAL_NOTE: "¡Listo! Ya puedes usar nmap.",
                },
                rules: ["STEPS: exacto 3", "Cada step: NUM, TITLE, CMD, RESULT"]
            },
            'kr-clidn-31': {
                purpose: 'SCRIPT EDITOR. Editor de código profesional tipo IDE.',
                when: 'Mostrar scripts completos con líneas numeradas y syntax highlighting.',
                repeatable: true,
                json_example: {
                    TITLE: "Script de Escaneo",
                    FILENAME: "scan.sh",
                    LANGUAGE: "bash",
                    DESCRIPTION: "Automatiza el escaneo de puertos en un rango de IPs.",
                    CODE_LINES: [
                        { TEXT: "#!/bin/bash", TYPE: "comment" },
                        { TEXT: "", TYPE: "blank" },
                        { TEXT: "# Variables", TYPE: "comment" },
                        { TEXT: "TARGET=$1", TYPE: "variable" },
                        { TEXT: "nmap -sS -sV $TARGET", TYPE: "command" },
                        { TEXT: 'echo "Done: $TARGET"', TYPE: "string" }
                    ],
                    EXPLANATION: "El script toma una IP como argumento y ejecuta un escaneo SYN.",
                },
                rules: ["CODE_LINES: 6-12 líneas", "TYPE: comment/variable/command/string/keyword/blank"]
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PROMPT MAESTRO v4.0 — 30 TEMPLATES, CONTENIDO EDUCATIVO PROFUNDO
    // ═══════════════════════════════════════════════════════════════════════

    buildCarouselPrompt(topic, packId) {
        const pack = this.getPackById(packId);
        if (!pack) throw new Error(`Pack ${packId} no encontrado`);

        const catalog = this.getTemplateCatalog();

        const templateDocs = Object.entries(catalog).map(([tId, entry]) => {
            return `
═══ "${tId}" — ${entry.repeatable ? '🔄 REPETIBLE' : '1️⃣ ÚNICO'} ═══
PROPÓSITO: ${entry.purpose}
CUÁNDO: ${entry.when}
REGLAS: ${entry.rules.join(' | ')}
EJEMPLO: ${JSON.stringify(entry.json_example, null, 2)}
`;
        }).join('\n');

        return `
Eres un PROFESOR EXPERTO en ciberseguridad y Linux que crea contenido educativo ULTRA-DETALLADO y VISUALMENTE IMPACTANTE.
Especialidad: carruseles tipo LIBRO DIDÁCTICO sobre cyberseguridad, Linux, hacking ético y herramientas GitHub.

TU MISIÓN: Crear contenido que ENSEÑE de verdad con PROFUNDIDAD TEÓRICA y PRECISIÓN TÉCNICA. 
El lector debe terminar ENTENDIENDO el tema completamente, no solo viendo un resumen.
CADA SLIDE DEBE ESTAR CARGADO DE VALOR. NO dejes espacios vacíos irracionales.

══════════════════════════════════════════════════════════════
TEMA: "${topic}"
══════════════════════════════════════════════════════════════

PLANTILLAS DISPONIBLES (31 templates):
${templateDocs}

══════════════════════════════════════════════════════════════
📝 CALIDAD Y DENSIDAD DEL CONTENIDO — PRIORIDAD #1
══════════════════════════════════════════════════════════════

REGLA DE ORO: Escribe como un LIBRO DE TEXTO TÉCNICO AVANZADO, no como un tweet.
Queremos "Information Density". Los slides deben sentirse LLENOS de conocimiento útil.

PARA CADA CAMPO DE TEXTO:
- DESCRIPTION / INTRO_TEXT / DEFINITION:
  ❌ MAL: "Lista archivos" (Muy corto, desperdicia espacio)
  ✅ BIEN: "El comando ls lista el contenido de un directorio, mostrando nombres de archivos, permisos, propietarios y fechas de modificación. Es fundamental para la navegación y auditoría del sistema de archivos en entornos Linux/Unix."
  (Usa todo el espacio disponible. Explica el QUÉ, el CÓMO y el POR QUÉ).

- EXAMPLE_OUTPUT / TERMINAL_LINES: Muestra output REALISTA y COMPLETO.
  ❌ MAL: "drwxr-xr-x ..."
  ✅ BIEN: "drwxr-xr-x 5 root root 4096 Jan 15 14:30 home"

- WARNING_CONTENT / NOTE: Da contexto REAL y LEGISLATIVO/TÉCNICO.
  ✅ BIEN: "El escaneo de puertos sin autorización escrita explícita es ilegal en la mayoría de jurisdicciones. Asegúrate de tener permiso del propietario de la red antes de ejecutar nmap fuera de tu laboratorio local."

══════════════════════════════════════════════════════════════
🚫 RESTRICCIONES DE USO DE TEMPLATES
══════════════════════════════════════════════════════════════

1. TERMINALES (kr-clidn-04, 06, 11, 21):
   - USAR EXCLUSIVAMENTE para COMANDOS y OUTPUTS de consola.
   - NUNCA usarlos para bloques largos de texto explicativo (usa Definition o Concept para eso).

2. TEORÍA Y TEXTO (kr-clidn-15 Definition, kr-clidn-03 Feature, kr-clidn-27 Permissions, kr-clidn-25 ProTip):
   - Estos son tus caballos de batalla para EXPLICAR conceptos.
   - Usalos para la carga teórica pesada.

3. kr-clidn-20 (Chapter Divider):
   - Úsalo SOLO si cambias drásticamente de subtema (ej: de Teoría a Práctica, o de Instalación a Uso Avanzado).

══════════════════════════════════════════════════════════════
📝 FORMATO DE TEXTOS Y TERMINAL (CRÍTICO)
══════════════════════════════════════════════════════════════
- **Terminal:** NUNCA escribas un comando gigante en una sola línea. Divide comandos largos usando la barra invertida \`\\\` para que hagan salto de línea.
- **Cards/Tarjetas:** Usa frases cortas, contundentes y directas (punchlines). NUNCA escribas párrafos completos dentro de una tarjeta pequena.
- **Imágenes AI (IMAGE_PROMPT):** DAME SÓLO EL SUJETO U OBJETO aisaldo en INGLÉS (ej: "a glowing neon lock protecting a database"). NUNCA agregues estilos como "3d render", "hyperrealistic", "cyberpunk". El sistema inyectará el estilo cinematográfico automáticamente en el backend.

══════════════════════════════════════════════════════════════
🎯 ESTRUCTURA OBLIGATORIA DEL CARRUSEL
══════════════════════════════════════════════════════════════

Debes seguir este orden ESTRICTO como un guion de película:

1. 🟢 PORTADA (Slide 1) -> SIEMPRE "kr-clidn-01". Título gancho.
2. 🟡 ÍNDICE (Slide 2) -> SIEMPRE "kr-clidn-19". NUNCA lo omitas. Debe listar 4-6 secciones del post con rangos de slides estimados.
3. 🔵 DESARROLLO (Slides 3 a N-1):
   - Mezcla VARIEDAD de templates. NO repitas el mismo 3 veces seguidas.
   - Alterna entre TEORÍA (Definition, Concept) y PRÁCTICA (Terminal, Steps).
   - Usa Diagramas (26), Flujos (23) y Tablas (28) para romper la monotonía del texto.
   - Profundiza: Si explicas un comando, usa un slide de Anatomía (02), luego uno de Uso (11), luego uno de Tips (25).
4. 🔴 CIERRE (Slide N) -> SIEMPRE "kr-clidn-09" (Follow CTA).

RANGO DE SLIDES: Mínimo 8, Máximo 20. (Calidad sobre cantidad, pero suficiente profundidad).

══════════════════════════════════════════════════════════════
🎨 DENSIDAD VISUAL — REGLA ANTI-OVERFLOW
══════════════════════════════════════════════════════════════

Cada slide HTML tiene un área visible de ~1220px de alto (safe-zone).
NO llenes más del 90% del espacio. Deja breathing room.
Si un slide tiene terminal + párrafo + cards, REDUCE la longitud de cada texto.

MÁXIMO POR CAMPO (chars Y palabras — OBLIGATORIO):
- TITLE: max 50 chars / max 8 palabras
- DESCRIPTION / INTRO_TEXT / DEFINITION: max 180 chars / max 30 palabras
- OUTPUT_LINES TEXT: max 55 chars por línea
- EXAMPLE_OUTPUT: max 70 chars / max 12 palabras
- EXPLANATION / WHY_TEXT: max 130 chars / max 20 palabras
- TIP_CONTENT / NOTE / WARNING_CONTENT: max 100 chars / max 16 palabras
- COMMAND / CMD: max 55 chars
- VERDICT / BOTTOM_TIP / FINAL_NOTE: max 90 chars / max 15 palabras
- QUOTE_TEXT: max 120 chars / max 20 palabras
- HASHTAGS: max 80 chars

Si necesitas más texto, DIVIDE en más slides. NUNCA comprimas.
Es mejor tener 12 slides claros que 8 abarrotados.

══════════════════════════════════════════════════════════════
FORMATO DE RESPUESTA
══════════════════════════════════════════════════════════════

Responde ÚNICAMENTE con un Array JSON válido.
Sin markdown, sin backticks.
Todo en una línea por string.

[
  { "templateId": "kr-clidn-01", "content": { "TITLE": "...", "SUBTITLE": "..." } },
  { "templateId": "kr-clidn-19", "content": { "TITLE": "Índice", "ITEMS": [...] } },
  ...
  { "templateId": "kr-clidn-09", "content": { ... } }
]
`.trim();
    }
}

window.CarouselEngine = CarouselEngine;

