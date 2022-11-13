import { FastifyInstance, FastifyPluginOptions } from "fastify";
import root from "./root";

export default function (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done: (err?: Error) => void
) {
  fastify.register(root);
  fastify.register(root, { prefix: "/v2" });
  done();
}
