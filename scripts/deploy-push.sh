#!/usr/bin/env bash
set -e

# Passaggio alla root del repository
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "🔄 [1/4] Scarico i dati più recenti pubblicati su Render..."
node scripts/sync-render-data.js

echo "📦 [2/4] Build del frontend per la produzione..."
npm run build

echo "📝 [3/4] Preparazione del commit con i dati sincronizzati..."
git add .

COMMIT_MSG="${1:-Sync dati live Render e aggiornamento portale GMG}"
if git diff-index --quiet HEAD --; then
  echo "Nessuna nuova modifica da committare."
else
  git commit -m "$COMMIT_MSG"
fi

echo "🚀 [4/4] Push su GitHub per deploy automatico su Render..."
git push origin main

echo "🎉 Fatto! Dati e codice inviati con successo a Render senza perdita di dati."
