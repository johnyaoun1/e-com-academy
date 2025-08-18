FROM node:18-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx ng build --configuration production

FROM node:18-alpine

WORKDIR /app

RUN npm install -g http-server

COPY --from=build /app/dist/e-com-academy/browser ./

EXPOSE 8080

CMD ["http-server", ".", "-p", "8080", "-a", "0.0.0.0", "--cors", "-c-1"]