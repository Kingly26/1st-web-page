# ============================================================
# Dockerfile multi-stage
# ============================================================
# Una "multi-stage build" usa più fasi (FASE 1, FASE 2, ...) nello
# stesso file: le prime fasi preparano cose (qui: buildano il sito
# React), l'ultima fase è quella che finisce davvero nell'immagine
# Docker finale. Vantaggio: l'immagine finale non contiene tutti gli
# strumenti di build di React, solo il risultato già pronto, quindi
# è più piccola e più sicura.
# ============================================================

# --- FASE 1: build del frontend React ---
FROM node:24-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build
# Al termine di questa fase, /app/client/dist contiene i file
# statici pronti (HTML/CSS/JS) del sito React.

# --- FASE 2: immagine finale con il backend + il sito già buildato ---
FROM node:24-alpine
WORKDIR /app

# Installiamo solo le dipendenze del server (più leggero).
COPY server/package*.json ./server/
RUN npm install --prefix server --omit=dev

# Copiamo il codice del backend.
COPY server/ ./server/

# Copiamo qui il risultato della FASE 1 (il sito React già buildato).
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/index.js"]
