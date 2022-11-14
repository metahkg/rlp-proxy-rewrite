# RLP proxy (rewrite)

Proxy for [react-link-preview](https://github.com/dhaiwat10/react-link-preview).

Written from scratch to reimplement [rlp-proxy](https://github.com/Dhaiwat10/rlp-proxy), which is all rights reserved.

## Features

- this proxy is based on puppeteer, therefore it is able to work with most sites, including react apps such as
  [metahkg.org](https://metahkg.org).
- more sites can be accessed with [puppeteer-extra-plugin-stealth](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth).
- uses fastify (instead of express)
- caching with mongodb, also caches null metadata
- auto delete successful caches after 30 days, null caches after 1 day
- 5 seconds timeout

## Compatibility

- `/v2` is highly compatible with the original `rlp-proxy`, however it DOES NOT give an error code when the site is not found / the site gives out any errors, simply returns `{ metadata: null }`
- the querystring `url` should be UTF-8 encoded, or some urls may not be supported
- this proxy does not support v1, `/` is an alias of `/v2`

## Other information

- rate limit: 100 requests per 30 seconds
- *Warning*: slower since it uses puppeteer
- manifest support not yet available, as [metascraper-manifest](https://www.npmjs.com/package/metascraper-manifest) does not have types.

## Requirements

- mongodb

## Deployment

### Docker

```bash
cp docker/template.env docker.env
```

Then config variables in `docker/.env`, after that:

```bash
yarn docker
```

### Manually

```bash
cp template.env .env
```

Then config variables in `.env`, after that:

```bash
yarn build
yarn start
```
