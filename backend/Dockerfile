FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./
RUN npm ci --omit=dev
COPY backend/server.js ./
COPY lib/data/products.json /lib/data/products.json
ENV PORT=4000
EXPOSE 4000
CMD ["node", "server.js"]
