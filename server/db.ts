import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For development mode, we can use in-memory storage if DATABASE_URL is not set
let pool: Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  console.log("DATABASE_URL not found. Using in-memory storage for development.");
  // We'll use the MemStorage implementation from storage.ts
  db = null;
}

export { pool, db };