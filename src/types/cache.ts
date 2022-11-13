import { ObjectId } from "mongodb";
import { APIResponse } from "./ApiResponse";

export type Cache = {
  _id?: ObjectId;
  url: string;
  createdAt: Date;
  metadata: APIResponse | null;
};
