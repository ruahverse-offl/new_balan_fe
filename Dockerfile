FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

# copy env first so vite sees it
COPY .env .env

# copy remaining files
COPY . .

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host"]
