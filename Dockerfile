FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

RUN npm install -g http-server

EXPOSE 8080

CMD ["http-server", "dist/e-com-academy", "-p", "8080", "-a", "0.0.0.0"]