import { createHmac } from "crypto";
import { existsSync, readFileSync } from "fs";
import { config } from "./config";

export function getHMACKey() {
  if (process.env.HMAC_KEY) {
    if (process.env.HMAC_KEY?.startsWith("@")) {
      const filename = process.env.HMAC_KEY.slice(1);
      if (!existsSync(filename)) {
        throw `HMAC_KEY file ${filename} not found`;
      }
      return readFileSync(filename, "utf-8").trim();
    }
    return process.env.HMAC_KEY;
  }
}

export function HMACSign(data: string) {
  const hmac = createHmac("sha256", config.HMAC_KEY);
  hmac.update(data);
  return hmac.digest("base64url");
}

export function HMACVerify(data: string, signature: string) {
  const hmac = createHmac("sha256", config.HMAC_KEY);
  hmac.update(data);
  return (
    hmac.digest("base64url") === signature ||
    hmac.digest("base64") === signature
  );
}
