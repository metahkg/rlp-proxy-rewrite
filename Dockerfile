FROM node:alpine as puppeteer

WORKDIR /app

ARG env
ENV env $env

RUN apk add --no-cache chromium ca-certificates ffmpeg

# skip installing chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

FROM puppeteer as build

RUN apk add --no-cache python3 make g++

COPY ./package.json ./yarn.lock ./tsconfig.json ./
RUN yarn install --frozen-lockfile --timeout 1000000

COPY ./src ./src

RUN if [ "$env" = "dev" ]; then mkdir dist; else yarn build && yarn install --production --frozen-lockfile --timeout 1000000 && rm tsconfig.json; fi;

FROM puppeteer

WORKDIR /app

COPY --from=build /app/package.json* /app/tsconfig.json* ./

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

RUN chown -f node:node /app

USER node

CMD if [ "$env" = "dev" ]; then yarn dev; else yarn start; fi;
