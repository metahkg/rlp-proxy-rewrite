import { Agenda } from "agenda";
import { Cache } from "../types/cache";
import { sha1 } from "./hash";
import { cacheCl, db } from "./mongodb";
import { redis } from "./redis";

export const agenda = new Agenda({ mongo: db });

agenda.define("removeOldNullCache", async () => {
  const caches = (await cacheCl
    .find({
      createdAt: {
        // older than one day
        $lt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
      },
      metadata: null,
    })
    .toArray()) as Cache[];
  caches.forEach((cache) => {
    redis.del(`cache-${sha1(cache.url)}`).catch(() => {});
    cacheCl.deleteOne({
      _id: cache._id,
    });
  });
});

agenda.define("removeOldCache", async () => {
  const caches = await cacheCl
    .find({
      createdAt: {
        // older than 30 days
        $lt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30),
      },
    })
    .toArray();
  caches.forEach((cache) => {
    redis.del(`cache-${sha1(cache.url)}`).catch(() => {});
    cacheCl.deleteOne({
      _id: cache._id,
    });
  });
});
