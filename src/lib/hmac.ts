import { createHmac } from "crypto";
import { existsSync, readFileSync } from "fs";

export function getHMACKey() {
  if (process.env.HMAC_KEY) {
    if (process.env.HMAC_KEY?.startsWith("@")) {
      const filename = process.env.HMAC_KEY.slice(1);
      if (!existsSync(filename)) {
        throw new Error(`HMAC_KEY file ${filename} not found`);
      }
      return readFileSync(filename, "utf-8").trim();
    }
    return process.env.HMAC_KEY;
  }
  return "";
}

export function HMACSign(key: string, data: string) {
  const hmac = createHmac("sha256", key);
  hmac.update(data);
  return hmac.digest("base64url");
}

export function HMACVerify(key: string, data: string, signature: string) {
  const hmac = createHmac("sha256", key);
  hmac.update(data);
  return hmac.digest("base64url") === signature;
}
