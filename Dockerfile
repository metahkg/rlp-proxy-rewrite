FROM node:alpine as puppeteer

RUN apk add --no-cache chromium ca-certificates ffmpeg

# skip installing chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

FROM puppeteer as build

RUN apk add --no-cache python3 make g++

COPY ./package.json ./yarn.lock ./tsconfig.json ./
COPY ./src ./src

RUN yarn install

RUN yarn build

RUN yarn install --production

FROM puppeteer

WORKDIR /app

COPY ./package.json ./yarn.lock ./

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules

CMD yarn start
