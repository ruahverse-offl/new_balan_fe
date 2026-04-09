FROM node:20

WORKDIR /app

# Build-time API URL (passed from docker-compose; Vite bakes this into the app)
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG VITE_API_PREFIX=/api/v1
ENV VITE_API_PREFIX=$VITE_API_PREFIX

ARG VITE_PROD_CHECK=true
ENV VITE_PROD_CHECK=$VITE_PROD_CHECK


COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Serve built app with nginx (lightweight)
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
