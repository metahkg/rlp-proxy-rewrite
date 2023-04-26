import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { Type, Static } from "@sinclair/typebox";
import { cacheCl } from "../lib/mongodb";
import { APIResponse } from "../types/ApiResponse";
import metadataScraper from "../lib/scraper";
import { Cache } from "../types/cache";
import { RateLimitOptions } from "@fastify/rate-limit";
import { redis } from "../lib/redis";
import { genkey_redis } from "../lib/genkey_redis";
import { HMACSign, HMACVerify } from "../lib/hmac";
import { positiveOrZero } from "../lib/positiveOrZero";
import dns from "dns";
import isLocalhost from "is-localhost-ip";
import { config } from "../lib/config";

export default function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  const querySchema = Type.Object({
    url: Type.String({
      pattern:
        "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]{0,2000})$",
      maxLength: 1000,
    }),
    ...(config.HMAC_VERIFY &&
      config.HMAC_KEY && {
        // base64 sha256, so 44 bytes
        signature: Type.String({ maxLength: 200 }),
      }),
  });
  fastify.get(
    "/",
    {
      schema: { querystring: querySchema },
      config: {
        rateLimit: <RateLimitOptions>{
          hook: "preHandler",
          max: (
            _req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>,
            key: string
          ) => {
            if (key?.startsWith?.("new")) {
              return 5;
            } else {
              return 200;
            }
          },
          keyGenerator: async (
            req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>
          ) => {
            return req.cached ? req.ip : `new${req.ip}`;
          },
        },
      },
      preParsing: [
        (
          req: FastifyRequest<{
            Querystring: Static<typeof querySchema>;
          }> & { originalUrl: string },
          _res,
          _payload,
          done
        ) => {
          if (!req.query?.url) return done();
          try {
            req.query.url = decodeURIComponent(req.query.url);
          } catch {}
          req.originalUrl = req.query.url;
          if (
            !["https://", "http://"].some((v) => req.query.url?.startsWith(v))
          ) {
            req.query.url = `https://${req.query.url}`;
          }
          if (req.query.url?.endsWith("/")) {
            req.query.url = req.query.url?.slice(0, -1);
          }
          req.query.url = req.query.url.split("?")[0];
          done();
        },
      ],
      preHandler: [
        (
          req: FastifyRequest<{ Querystring: Static<typeof querySchema> }> & {
            originalUrl: string;
          },
          res,
          done
        ) => {
          const { signature } = req.query;
          const { originalUrl } = req;
          if (config.HMAC_VERIFY && config.HMAC_KEY) {
            if (!HMACVerify(originalUrl, signature)) {
              return res.code(403).send({
                statusCode: 403,
                error: "Forbidden",
                message: "Invalid HMAC signature.",
              });
            }
          }
          done();
        },
        async (
          req: FastifyRequest<{ Querystring: Static<typeof querySchema> }> & {
            originalUrl: string;
          },
          res: FastifyReply
        ) => {
          const { url } = req.query;
          if (!url) return;

          try {
            const ips: string[] = await new Promise((resolve, reject) => {
              dns.resolve(new URL(url).hostname, (err, ips) => {
                if (err) reject(err);
                else resolve(ips);
              });
            });

            if (
              (
                await Promise.all(ips.map(async (ip) => await isLocalhost(ip)))
              ).some(Boolean)
            ) {
              return res.code(403).send({
                statusCode: 403,
                error: "Refused to process private or local address.",
              });
            }
          } catch {
            return res
              .code(400)
              .send({ statusCode: 400, error: "Failed to resolve hostname." });
          }
        },
        async (
          req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>
        ) => {
          if (req.query?.url) {
            const cached = await redis
              .get(genkey_redis(req.query.url))
              .then((result) => Boolean(result))
              .catch(() => false);
            req.cached = cached;
          }
        },
      ],
    },
    async (
      req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>,
      res
    ) => {
      const { url } = req.query;

      const cache = (await cacheCl.findOne(
        { url },
        { projection: { _id: 0, metadata: 1 } }
      )) as unknown as Cache | null;

      const redis_key = genkey_redis(url);

      if (cache) {
        if (!req.cached) {
          redis
            .set(
              redis_key,
              1,
              "EX",
              Math.round(
                positiveOrZero(
                  new Date(cache.createdAt).getTime() +
                    1000 * 60 * 60 * 24 * 30 -
                    new Date().getTime()
                ) / 1000
              ) || 60 * 60 * 24 * 30
            )
            .catch(console.error);
        }
        return res.send({ metadata: cache.metadata });
      }

      if (req.cached && !cache) {
        redis.del(redis_key).catch(console.error);
      }

      const data = await metadataScraper(url);
      if (!data) {
        res.send({ metadata: null });
        await cacheCl
          .insertOne({
            url,
            createdAt: new Date(),
            metadata: null,
          })
          .catch(console.error);
        await redis
          .set(redis_key, 1, "EX", 60 * 60 * 24 * 1)
          .catch(console.error);
      } else {
        const metadata = {
          title: data.title ?? null,
          description: data.description ?? null,
          image: data.image ?? null,
          ...(data.image &&
            config.HMAC_SIGN &&
            config.HMAC_KEY && { image_signature: HMACSign(data.image) }),
          hostname: new URL(url).hostname ?? null,
          siteName: data.publisher ?? null,
        };
        res.send(<{ metadata: APIResponse }>{
          metadata,
        });
        await cacheCl
          .insertOne({ url, createdAt: new Date(), metadata })
          .catch(console.error);
        await redis
          .set(redis_key, 1, "EX", 60 * 60 * 24 * 30)
          .catch(console.error);
      }
    }
  );
  done();
}
