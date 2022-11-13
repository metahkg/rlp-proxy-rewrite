import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Type, Static } from "@sinclair/typebox";
import { cacheCl } from "../lib/mongodb";
import { APIResponse } from "../types/ApiResponse";
import metadataScraper from "../lib/scraper";
import { Cache } from "../types/cache";

export default function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  const querySchema = Type.Object({
    url: Type.RegEx(
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
    ),
  });
  fastify.get(
    "/",
    {
      schema: { querystring: querySchema },
      preValidation: function (
        req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>,
        _res,
        done
      ) {
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
        done();
      },
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

      if (cache) {
        return res.send({ metadata: cache.metadata });
      }

      try {
        const data = await metadataScraper(url);
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
        await cacheCl.insertOne({ url, createdAt: new Date(), metadata });
      } catch {
        res.send({ metadata: null });
        await cacheCl.insertOne({
          url,
          createdAt: new Date(),
          metadata: null,
        });
      }
    }
  );
  done();
}
