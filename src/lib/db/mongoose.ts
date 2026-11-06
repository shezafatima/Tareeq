import "server-only";
import mongoose from "mongoose";
import * as z from "zod/mini";
import { readEnv } from "@/lib/env";

// One connection per server instance, reused across warm invocations and dev hot reloads
// (specs/006-lead-capture/research.md R8). Fails within 5 s instead of queueing.

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongoose = globalThis as unknown as { __tareeqMongoose?: Cache };
const cache: Cache = (globalForMongoose.__tareeqMongoose ??= { conn: null, promise: null });

const schema = z.object({ MONGODB_URI: z.string().check(z.startsWith("mongodb")) });

let uri: string | null = null;

function getMongoUri(): string {
  uri ??= readEnv(schema, { MONGODB_URI: process.env.MONGODB_URI?.trim() }).MONGODB_URI;
  return uri;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 5,
    });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
