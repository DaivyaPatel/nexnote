FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npx drizzle-kit generate

EXPOSE 5000

CMD ["node", "src/index.js"]
