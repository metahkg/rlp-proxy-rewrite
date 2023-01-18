import { MongoClient } from "mongodb";

export const client = new MongoClient(
  process.env.MONGO_URI || "mongodb://localhost"
);

export const db = client.db("rlp");

export const cacheCl = db.collection("cache");
