/**
 * Icon Catalog - Iconos organizados por categoría
 * Usa IconService para generar SVGs profesionales
 */

import { COLORS } from './brand.js';

/**
 * Catálogo de iconos por categoría con colores predefinidos
 */
export const ICON_CATALOG = {
    // ═══ SEGURIDAD ═══
    security: {
        shield: { name: 'shield', color: COLORS.primary, desc: 'Escudo de protección' },
        lock: { name: 'lock', color: COLORS.primary, desc: 'Candado, privacidad' },
        unlock: { name: 'unlock', color: COLORS.warning, desc: 'Desbloqueado, vulnerable' },
        key: { name: 'key', color: COLORS.accent, desc: 'Llave, autenticación' },
        fingerprint: { name: 'fingerprint', color: COLORS.purple, desc: 'Huella digital, biometría' },
        'shield-check': { name: 'shield-check', color: COLORS.success, desc: 'Protección verificada' },
        'shield-alert': { name: 'shield-alert', color: COLORS.error, desc: 'Alerta de seguridad' },
        eye: { name: 'eye', color: COLORS.primary, desc: 'Visibilidad, monitoreo' },
        'eye-off': { name: 'eye-off', color: COLORS.textMuted, desc: 'Oculto, privado' },
        scan: { name: 'scan', color: COLORS.accent, desc: 'Escaneo, análisis' },
    },

    // ═══ RED Y CONECTIVIDAD ═══
    network: {
        wifi: { name: 'wifi', color: COLORS.primary, desc: 'WiFi, conexión inalámbrica' },
        'wifi-off': { name: 'wifi-off', color: COLORS.error, desc: 'Sin conexión WiFi' },
        server: { name: 'server', color: COLORS.accent, desc: 'Servidor, backend' },
        database: { name: 'database', color: COLORS.warning, desc: 'Base de datos' },
        cloud: { name: 'cloud', color: COLORS.primaryLight, desc: 'Nube, cloud computing' },
        network: { name: 'network', color: COLORS.primary, desc: 'Red, topología' },
        globe: { name: 'globe', color: COLORS.accent, desc: 'Internet, global' },
        router: { name: 'router', color: COLORS.primary, desc: 'Router, gateway' },
        antenna: { name: 'antenna', color: COLORS.accent, desc: 'Antena, señal' },
        signal: { name: 'signal', color: COLORS.success, desc: 'Señal, intensidad' },
    },

    // ═══ COMANDOS Y CÓDIGO ═══
    commands: {
        terminal: { name: 'terminal', color: COLORS.success, desc: 'Terminal, consola' },
        code: { name: 'code', color: COLORS.primary, desc: 'Código fuente' },
        'file-code': { name: 'file-code', color: COLORS.accent, desc: 'Archivo de código' },
        brackets: { name: 'brackets', color: COLORS.primary, desc: 'Corchetes, sintaxis' },
        command: { name: 'command', color: COLORS.accent, desc: 'Comando, tecla' },
        'git-branch': { name: 'git-branch', color: COLORS.warning, desc: 'Rama de Git' },
        'git-commit': { name: 'git-commit', color: COLORS.success, desc: 'Commit de Git' },
        package: { name: 'package', color: COLORS.purple, desc: 'Paquete, librería' },
        folder: { name: 'folder', color: COLORS.warning, desc: 'Carpeta, directorio' },
        file: { name: 'file', color: COLORS.textMuted, desc: 'Archivo genérico' },
    },

    // ═══ HERRAMIENTAS ═══
    tools: {
        wrench: { name: 'wrench', color: COLORS.warning, desc: 'Llave inglesa, configuración' },
        hammer: { name: 'hammer', color: COLORS.error, desc: 'Martillo, construcción' },
        tool: { name: 'tool', color: COLORS.accent, desc: 'Herramienta genérica' },
        settings: { name: 'settings', color: COLORS.primary, desc: 'Configuración, ajustes' },
        sliders: { name: 'sliders', color: COLORS.primary, desc: 'Controles, parámetros' },
        cpu: { name: 'cpu', color: COLORS.purple, desc: 'CPU, procesador' },
        'hard-drive': { name: 'hard-drive', color: COLORS.accent, desc: 'Disco duro, almacenamiento' },
        usb: { name: 'usb', color: COLORS.primary, desc: 'USB, periférico' },
        plug: { name: 'plug', color: COLORS.warning, desc: 'Enchufe, conexión' },
    },

    // ═══ ACCIONES ═══
    actions: {
        play: { name: 'play', color: COLORS.success, desc: 'Reproducir, iniciar' },
        pause: { name: 'pause', color: COLORS.warning, desc: 'Pausar, detener' },
        stop: { name: 'stop', color: COLORS.error, desc: 'Detener, finalizar' },
        refresh: { name: 'refresh', color: COLORS.primary, desc: 'Actualizar, recargar' },
        download: { name: 'download', color: COLORS.success, desc: 'Descargar' },
        upload: { name: 'upload', color: COLORS.primary, desc: 'Subir, cargar' },
        trash: { name: 'trash', color: COLORS.error, desc: 'Eliminar, borrar' },
        edit: { name: 'edit', color: COLORS.accent, desc: 'Editar, modificar' },
        copy: { name: 'copy', color: COLORS.primary, desc: 'Copiar, duplicar' },
        check: { name: 'check', color: COLORS.success, desc: 'Verificar, correcto' },
    },
};

/**
 * Obtener todos los iconos de una categoría
 */
export function getIconsByCategory(category) {
    return ICON_CATALOG[category] || {};
}

/**
 * Obtener un icono específico por nombre
 */
export function getIconConfig(iconName) {
    for (const category in ICON_CATALOG) {
        if (ICON_CATALOG[category][iconName]) {
            return ICON_CATALOG[category][iconName];
        }
    }
    return null;
}

/**
 * Listar todos los nombres de iconos disponibles
 */
export function getAllIconNames() {
    const names = [];
    for (const category in ICON_CATALOG) {
        names.push(...Object.keys(ICON_CATALOG[category]));
    }
    return names;
}

/**
 * Buscar iconos por palabra clave
 */
export function searchIcons(keyword) {
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    for (const category in ICON_CATALOG) {
        for (const iconName in ICON_CATALOG[category]) {
            const icon = ICON_CATALOG[category][iconName];
            if (
                iconName.includes(lowerKeyword) ||
                icon.desc.toLowerCase().includes(lowerKeyword) ||
                category.toLowerCase().includes(lowerKeyword)
            ) {
                results.push({ ...icon, category });
            }
        }
    }

    return results;
}
