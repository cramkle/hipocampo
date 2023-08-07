FROM node:16-alpine AS build-env

WORKDIR /usr/src/app

## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache --virtual .gyp python3 make g++

COPY . .

RUN npm install

RUN npm run build

FROM node:16-alpine

WORKDIR /usr/src/app

COPY --from=build-env /usr/src/app/ .

RUN npm install --omit dev

ENV TZ UTC

EXPOSE 5000
CMD ["npm", "start"]
