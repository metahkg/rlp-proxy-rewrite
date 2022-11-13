FROM node:alpine as puppeteer

RUN apk add --no-cache chromium ca-certificates ffmpeg python3 make g++

# skip installing chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

FROM puppeteer as build

COPY ./package.json ./yarn.lock ./src ./

RUN yarn install

RUN yarn build

FROM puppeteer

COPY ./package.json ./yarn.lock ./

COPY --from=build /app/dist ./dist

CMD yarn start
