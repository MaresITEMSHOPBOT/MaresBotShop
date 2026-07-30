#!/usr/bin/env sh
# MaresFy — spustí appku na http://127.0.0.1:8080/maresfy/
# Spotify přijímá jen https nebo loopback 127.0.0.1, proto tenhle malý server.
cd "$(dirname "$0")/.." || exit 1
PORT=${PORT:-8080}
URL="http://127.0.0.1:$PORT/maresfy/"

echo "MaresFy běží na $URL"
echo "Tuhle adresu vlož ve Spotify dashboardu do Redirect URIs."
echo "Zastavíš to klávesami Ctrl+C."

( sleep 1
  if command -v open >/dev/null 2>&1; then open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
  fi ) &

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "$PORT" --bind 127.0.0.1
elif command -v npx >/dev/null 2>&1; then
  exec npx --yes http-server . -p "$PORT" -a 127.0.0.1
else
  echo "Nenašel jsem python ani npx. Nainstaluj Python 3 nebo Node.js."
  exit 1
fi
