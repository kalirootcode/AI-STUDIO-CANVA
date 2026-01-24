#!/bin/bash
# Desactivar warnings de GTK
export GTK_MODULES=""
export NO_AT_BRIDGE=1

# Ejecutar Electron
npx electron .
