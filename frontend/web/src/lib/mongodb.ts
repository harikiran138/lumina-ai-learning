import { MongoClient } from "mongodb";
import { attachDatabasePool } from "@vercel/functions";

const rawUri = process.env.MONGODB_URI || process.env.lumina_MONGODB_URI || "";
const isPlaceholderMongoUri =
  rawUri.includes("mongodb+srv://user:pass@cluster.mongodb.net/test") ||
  rawUri.includes("mongodb://localhost:27017/lumina_db");
const uri = isPlaceholderMongoUri ? "" : rawUri;
const options = {};
const mongoDisabledMessage =
  "MongoDB URI not configured. Database features will be disabled.";

let client: MongoClient;
let clientPromise: Promise<MongoClient | null>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    if (uri) {
      client = new MongoClient(uri, options);
      // Attach connection pool management for Vercel Functions
      attachDatabasePool(client);
      globalWithMongo._mongoClientPromise = client.connect();
    } else {
      console.warn(mongoDisabledMessage);
      globalWithMongo._mongoClientPromise = Promise.resolve(null);
    }
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  if (uri) {
    client = new MongoClient(uri, options);
    // Attach connection pool management for Vercel Functions
    attachDatabasePool(client);
    clientPromise = client.connect();
  } else {
    console.warn(mongoDisabledMessage);
    clientPromise = Promise.resolve(null);
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
