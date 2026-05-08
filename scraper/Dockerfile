FROM apify/actor-node:20 AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --include=dev

# Patch realtime-js WebSocket check — we don't use Realtime, only the DB client.
# The check throws on Node < 22; replacing throw with a warn lets the process continue.
RUN FACTORY="node_modules/@supabase/realtime-js/dist/main/lib/websocket-factory.js" && \
    [ -f "$FACTORY" ] && \
    sed -i 's/throw new Error(errorMessage)/console.warn("[supabase] " + errorMessage)/' "$FACTORY" || true

COPY . ./
RUN npm run build

# ---- runtime image ----
FROM apify/actor-node:20

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./

CMD npm start
