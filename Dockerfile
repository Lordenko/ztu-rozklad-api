FROM node:22-alpine

WORKDIR /app

RUN rm -rf node_modules

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "start" ]