import "fastify";

declare module "fastify" {
  export interface FastifyRequest {
    cached?: boolean;
  }
}
