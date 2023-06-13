FROM node:18

WORKDIR /usr/src/app
COPY . .

RUN yarn install
RUN yarn run build

EXPOSE 3000
CMD yarn run start
