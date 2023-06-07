FROM ghcr.io/puppeteer/puppeteer:latest as build

ARG env
ENV env $env

WORKDIR /app

COPY ./package.json ./yarn.lock ./tsconfig.json ./
RUN yarn install --frozen-lockfile --timeout 1000000

COPY ./src ./src

RUN if [ "$env" = "dev" ]; then mkdir dist; else yarn build && rm tsconfig.json; fi;

FROM ghcr.io/puppeteer/puppeteer:latest

ARG env
ENV env $env

WORKDIR /app

COPY --from=build /app/package.json* /app/tsconfig.json* /app/yarn.lock ./

COPY --from=build /app/dist ./dist

RUN if [ "$env" = "dev" ]; then yarn install; else yarn install --production --frozen-lockfile --timeout 1000000; fi; yarn cache clean;

RUN chown -f pptruser:pptruser /app

USER pptruser

CMD if [ "$env" = "dev" ]; then yarn dev; else yarn start; fi;
