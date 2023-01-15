import hash from "hash.js";

export function sha1(str: string) {
  return hash.sha1().update(str).digest("hex");
}

export function sha256(str: string) {
  return hash.sha256().update(str).digest("hex");
}

export function sha512(str: string) {
  return hash.sha512().update(str).digest("hex");
}
