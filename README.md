# RLP proxy (rewrite)

Proxy for [react-link-preview](https://github.com/dhaiwat10/react-link-preview).

Written from scratch to reimplement [rlp-proxy](https://github.com/Dhaiwat10/rlp-proxy), which is all rights reserved.

## Features

- this proxy is based on puppeteer, therefore it is able to work with most urls, including react apps such as
  [metahkg.org](https://metahkg.org).
- more sites can be accessed with [puppeteer-extra-plugin-stealth](https://www.npmjs.com/package/puppeteer-extra-plugin-stealth).
- 5 seconds timeout

## Other information

- *Warning*: A bit slower
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
