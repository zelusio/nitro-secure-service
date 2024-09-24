FROM node:18.20.4-alpine AS builder

WORKDIR /usr/app
COPY tsconfig.json .
COPY package*.json ./
RUN npm install

# set up source
COPY ./src ./src
RUN npm run build

FROM node:18.20.4-slim

WORKDIR /usr/app
RUN chown node:node .
COPY --from=builder /usr/app/package*.json .
RUN npm install --production
COPY --from=builder /usr/app/dist ./dist

# remove because it breaks evervault
# USER node
EXPOSE 3000
CMD npm run start
