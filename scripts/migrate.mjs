import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const sql = neon(connectionString);
const migration = await readFile(
  join(root, "db", "migrations", "0001_reports.sql"),
  "utf8",
);

const statements = migration
  .split(/;\s*(?:\n|$)/u)
  .map((statement) => statement.trim())
  .filter(Boolean);

await sql.transaction((transaction) =>
  statements.map((statement) => transaction.query(statement)),
);
console.log("Applied migration 0001_reports.sql");
