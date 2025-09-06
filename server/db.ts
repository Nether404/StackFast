import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Provide a safe fallback when DATABASE_URL is not configured.
// This prevents imports from throwing during development without a database.
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : (undefined as any);

export const db = process.env.DATABASE_URL
  ? drizzle({ client: pool, schema })
  : (new Proxy({}, {
      get() {
        throw new Error("DATABASE_URL must be set to use database-backed storage");
      }
    }) as any);