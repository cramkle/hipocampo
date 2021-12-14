FROM node:16-alpine AS build-env

WORKDIR /usr/src/app

## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache --virtual .gyp python3 make g++

COPY . .

RUN yarn --frozen-lockfile

RUN yarn build

FROM node:16-alpine

WORKDIR /usr/src/app

COPY --from=build-env /usr/src/app/ .

RUN yarn --prod

ENV TZ UTC

EXPOSE 5000
CMD ["yarn", "start"]
