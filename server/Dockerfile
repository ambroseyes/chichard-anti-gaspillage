# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Le serveur tourne sans privilèges.
RUN addgroup -S chichard && adduser -S chichard -G chichard
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=chichard:chichard . .
USER chichard
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/server.js"]
