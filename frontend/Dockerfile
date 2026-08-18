FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Frontend environment variables used during Vite build
ARG VITE_PORT
ARG VITE_SHORTENER_URL
ARG VITE_STATS_URL
ARG VITE_QR_URL

ENV VITE_PORT=$VITE_PORT
ENV VITE_SHORTENER_URL=$VITE_SHORTENER_URL
ENV VITE_STATS_URL=$VITE_STATS_URL
ENV VITE_QR_URL=$VITE_QR_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]