#!/usr/bin/env bash
# Crea un nicho de video nuevo, aislado, a partir de la plantilla.
set -euo pipefail
[ $# -eq 1 ] || { echo "uso: $0 <nombre-del-nicho>"; exit 1; }
n="$1"; d="$(cd "$(dirname "$0")" && pwd)/$n"
[ -e "$d" ] && { echo "ya existe: $d"; exit 1; }
cp -r "$(dirname "$0")/plantilla" "$d"
sed -i "s/<NICHO>/$n/" "$d/CLAUDE.md"
echo "Creado: $d"
echo
echo "Para trabajar en el (con memoria propia, separado de tus otros proyectos):"
echo "  cd $d && claude"
