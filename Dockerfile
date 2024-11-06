# Node.js official Docker images https://hub.docker.com/_/node
FROM node:22.11.0-alpine AS builder

WORKDIR /usr/app
COPY tsconfig.json .
COPY package*.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install

# set up source
COPY ./src ./src
RUN npm run build

FROM node:22.11.0-slim

WORKDIR /usr/app
RUN chown node:node .
COPY --from=builder /usr/app/package*.json .
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install --production
COPY --from=builder /usr/app/dist ./dist

# remove because it breaks evervault
# USER node
EXPOSE 3000
CMD npm run start
