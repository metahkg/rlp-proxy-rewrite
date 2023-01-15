import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Type, Static } from "@sinclair/typebox";
import { cacheCl } from "../lib/mongodb";
import { APIResponse } from "../types/ApiResponse";
import metadataScraper from "../lib/scraper";
import { Cache } from "../types/cache";
import { RateLimitOptions } from "@fastify/rate-limit";
import { redis } from "../lib/redis";
import { genkey_redis } from "../lib/genkey_redis";
import { positiveOrZero } from "../lib/positiveOrZero";

export default function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  const querySchema = Type.Object({
    url: Type.RegEx(
      /^https?:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9](\/(.+)?)?$/
    ),
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
          req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>,
          _res,
          _payload,
          done
        ) => {
          if (!req.query?.url) return done();
          try {
            req.query.url = decodeURIComponent(req.query.url);
          } catch {}
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
        async (
          req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>,
          _res,
          done
        ) => {
          if (req.query?.url) {
            const cached = await redis
              .get(genkey_redis(req.query.url))
              .then((result) => Boolean(result))
              .catch(() => false);
            req.cached = cached;
          }
          done();
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
              positiveOrZero(
                new Date(cache.createdAt).getTime() +
                  100 * 60 * 24 * 30 -
                  new Date().getTime()
              )
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
          .set(redis_key, 1, "EX", 1000 * 60 * 60 * 24 * 1)
          .catch(console.error);
      } else {
        const metadata = {
          title: data.title ?? null,
          description: data.description ?? null,
          image: data.image ?? null,
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
          .set(redis_key, 1, "EX", 1000 * 60 * 60 * 24 * 30)
          .catch(console.error);
      }
    }
  );
  done();
}
