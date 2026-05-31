import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
] as const;

export function getDatabaseUrl() {
  const databaseUrl = DATABASE_URL_ENV_KEYS.map((key) => process.env[key]).find(Boolean);

  if (!databaseUrl) {
    throw new Error("Database connection string is not configured.");
  }

  return databaseUrl;
}

const sql = neon(getDatabaseUrl());

export const db = drizzle(sql, { schema });

