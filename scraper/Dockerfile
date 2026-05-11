FROM apify/actor-node:20 AS builder

WORKDIR /usr/src/app

COPY . ./
RUN npm install --include=dev && npm run build

# ---- runtime image ----
FROM apify/actor-node:20

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./

CMD npm start
