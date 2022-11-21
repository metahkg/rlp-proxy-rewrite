import fastifyCors from "@fastify/cors";
import fastifyRateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { ajv } from "./lib/ajv";
import routes from "./routes";
import dotenv from "dotenv";
import { client } from "./lib/mongodb";
import { agenda } from "./lib/agenda";

dotenv.config();

async function build() {
  await client.connect();
  await agenda.start();

  ["removeOldNullCache", "removeOldCache"].forEach(async (name) => {
    if (!(await agenda.jobs({ name })).length) {
      await agenda.every("0 0 * * *", name);
    }
  });

  const fastify = Fastify({
    logger: true,
    trustProxy: true,
  });

  fastify.setValidatorCompiler((opt) => ajv.compile(opt.schema));

  await fastify.register(fastifyCors);
  await fastify.register(fastifyRateLimit, {
    global: true,
    max: 300,
    ban: 50,
    timeWindow: 1000 * 30,
  });

  await fastify.register(routes);

  return fastify;
}

build().then((fastify) => {
  const port = Number(process.env.PORT || 3000);
  fastify.listen({ port, host: "0.0.0.0" }, () => {
    console.log(`Server listening on port ${port}.`);
  });
});
