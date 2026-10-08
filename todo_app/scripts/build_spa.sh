#!/usr/bin/env bash
# Build the React SPA and regenerate the Django template that serves it.
#
# Vite hashes asset filenames, so the template must be regenerated after every
# build. This rewrites the absolute /assets/... paths in dist/index.html into
# Django {% static %} tags and copies the result into events/templates/events/.
#
# Usage:  ./scripts/build_spa.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$APP_DIR/frontend"
TEMPLATE_DIR="$APP_DIR/events/templates/events"

echo "==> Building frontend"
(cd "$FRONTEND_DIR" && npm run build)

DIST="$FRONTEND_DIR/dist/index.html"
[ -f "$DIST" ] || { echo "ERROR: $DIST not found — did the build succeed?" >&2; exit 1; }

echo "==> Generating $TEMPLATE_DIR/index.html"
mkdir -p "$TEMPLATE_DIR"
{
  echo '{% load static %}'
  sed -e "s#=\"/assets/#=\"{% static 'assets/#g" \
      -e "s#\.js\"#.js' %}\"#g" \
      -e "s#\.css\"#.css' %}\"#g" \
      -e "s#=\"/favicon.svg\"#=\"{% static 'favicon.svg' %}\"#g" \
      "$DIST"
} > "$TEMPLATE_DIR/index.html"

echo "==> Verifying every referenced asset exists"
missing=0
while read -r asset; do
  if [ -f "$FRONTEND_DIR/dist/$asset" ]; then
    printf '    OK      %s\n' "$asset"
  else
    printf '    MISSING %s\n' "$asset"
    missing=1
  fi
done < <(grep -o "{% static '[^']*' %}" "$TEMPLATE_DIR/index.html" | sed "s/{% static '//; s/' %}//")

[ "$missing" -eq 0 ] || { echo "ERROR: template references files that were not built." >&2; exit 1; }

echo "==> Done. Reload the page (hard refresh) to pick up the new build."