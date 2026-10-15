#!/usr/bin/env bash
# Creates a new, isolated video niche from the template.
set -euo pipefail
[ $# -eq 1 ] || { echo "usage: $0 <niche-name>"; exit 1; }
n="$1"; d="$(cd "$(dirname "$0")" && pwd)/$n"
[ -e "$d" ] && { echo "already exists: $d"; exit 1; }
cp -r "$(dirname "$0")/plantilla" "$d"
sed -i "s/<NICHO>/$n/" "$d/CLAUDE.md"
echo "Created: $d"
echo
echo "To work on it (with its own memory, separate from your other projects):"
echo "  cd $d && claude"
