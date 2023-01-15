import { Agenda } from "agenda";
import { cacheCl, db } from "./mongodb";

export const agenda = new Agenda({ mongo: db });

agenda.define("removeOldNullCache", async () => {
  await cacheCl.deleteMany({
    createdAt: {
      // older than one day
      $lt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
    },
    metadata: null,
  });
});

agenda.define("removeOldCache", async () => {
  await cacheCl.deleteMany({
    createdAt: {
      // older than 30 days
      $lt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 30),
    },
  });
});
