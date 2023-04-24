import { createHmac } from "crypto";
import { existsSync, readFileSync } from "fs";

export function getHMACKey() {
  if (!existsSync("certs/hmac.key")) {
    return "";
  }
  return readFileSync("certs/hmac.key", "utf-8").trim();
}

export function HMACSign(data: string) {
  const hmac = createHmac("sha256", getHMACKey());
  hmac.update(data);
  return hmac.digest("base64url");
}
