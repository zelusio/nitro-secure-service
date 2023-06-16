FROM node:18-alpine AS builder

WORKDIR /usr/app
COPY package.json .
COPY tsconfig.json .
COPY yarn.lock .
RUN yarn install

# set up source
COPY ./src ./src
RUN yarn run build

FROM node:18-slim

WORKDIR /usr/app
RUN chown node:node .
COPY package.json .
COPY yarn.lock .
RUN yarn install --production
COPY --from=builder /usr/app/dist ./dist

# remove because it breaks evervault
# USER node
EXPOSE 3000
CMD yarn run start
