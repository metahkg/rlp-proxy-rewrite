import { sha1 } from "./hash";

export function genkey_redis(url: string) {
  return `cache-${sha1(url)}`;
}
