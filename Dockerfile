FROM node:16-alpine

WORKDIR /usr/src/app/edgeFunctions

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY . .

CMD ["npm", "start"]