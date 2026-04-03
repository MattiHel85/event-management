import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

export function connectToDatabase() {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    throw new Error("DATABASE_URL is missing");
  }

  if (!global.mongooseConnectionPromise) {
    global.mongooseConnectionPromise = mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
  }

  return global.mongooseConnectionPromise;
}
