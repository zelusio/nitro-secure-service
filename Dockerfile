FROM node:16-alpine3.16

COPY ./index.js /index.js
COPY ./package.json /package.json
COPY ./package-lock.json /package-lock.json

EXPOSE 8008

RUN npm i

ENTRYPOINT ["node", "/index.js"]