import { exit } from "process";
import { Client } from "./src";

const client = new Client();

(async () => {
  await client.getMetadata(encodeURIComponent("metahkg.org")).then(console.log);
  await client
    .getMetadataV2(encodeURIComponent("dev.metahkg.org"))
    .then(console.log);
  await client
    .getMetadata(encodeURIComponent("https://google.com/search?q=metahkg"))
    .then(console.log);
  await client
    .getMetadataV2(encodeURIComponent("https://google.com/search?q=Metahkg"))
    .then(console.log);
})().then(() => exit(0));
