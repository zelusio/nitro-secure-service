FROM node:16

WORKDIR /usr/src/app
COPY . .

RUN npm install yarn
RUN yarn install --verbose
RUN yarn run build

EXPOSE 3000
CMD yarn run start
