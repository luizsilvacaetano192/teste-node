FROM node:18-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache python3 make g++ git

COPY package*.json ./
COPY yarn.lock ./

RUN npm install --production=false

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist

RUN apk add --no-cache tini && \
    chown -R node:node /usr/src/app

USER node

ENV NODE_ENV=production
ENV PORT=3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "dist/main.js"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
