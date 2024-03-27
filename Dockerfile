
FROM node:21-alpine as builder
WORKDIR /app
COPY ./package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:21-alpine as backend
WORKDIR /app
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/seed/adoptaunpeludo.txt ./dist/seed/adoptaunpeludo.txt
CMD ["npm", "run", "start:prod"]