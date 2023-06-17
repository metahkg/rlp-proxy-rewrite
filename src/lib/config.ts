import dotenv from "dotenv";
import { getHMACKey } from "./hmac";

dotenv.config();

export const config = {
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017",
  NO_HEADLESS: JSON.parse(process.env.NO_HEADLESS || "false") || false,
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  HMAC_KEY: getHMACKey(),
  HMAC_SIGN: JSON.parse(process.env.HMAC_SIGN || "false") || false,
  HMAC_VERIFY: JSON.parse(process.env.HMAC_VERIFY || "false") || false,
};
