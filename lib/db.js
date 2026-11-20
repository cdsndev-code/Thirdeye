import { Pool } from "pg";
import { SCHEMA_SQL } from "./schema";

const g = globalThis;
export const pool = g._tePool || (g._tePool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 }));

// Creates all tables on first use, so the website works even before the bot has started.
function ready() {
  if (!g._teSchema) {
    g._teSchema = pool.query(SCHEMA_SQL).catch((e) => {
      g._teSchema = null; // try again on the next request
      throw e;
    });
  }
  return g._teSchema;
}

export async function query(text, params) {
  await ready();
  return pool.query(text, params);
}

export async function getClient() {
  await ready();
  return pool.connect();
}
