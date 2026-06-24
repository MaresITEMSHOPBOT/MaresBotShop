#!/bin/bash
# === Spustí hru jako samostatné okno (režim "aplikace") na macOS ===
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="file://$DIR/francouzstina.html"
if open -Ra "Google Chrome" >/dev/null 2>&1; then
  open -na "Google Chrome" --args --app="$URL"
elif open -Ra "Microsoft Edge" >/dev/null 2>&1; then
  open -na "Microsoft Edge" --args --app="$URL"
else
  open "$DIR/francouzstina.html"
fi
