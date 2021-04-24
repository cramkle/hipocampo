FROM node:14-buster AS deps

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:14-buster as build-env

WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build

FROM node:14-buster

WORKDIR /app
COPY --from=build-env /app/dist ./dist
COPY --from=build-env /app/package.json ./package.json
COPY --from=build-env /app/yarn.lock ./yarn.lock
# Include only runtime dependencies
RUN yarn install --prod
# Set timezone for UTC
ENV TZ UTC

EXPOSE 5000

CMD ["yarn", "start"]
