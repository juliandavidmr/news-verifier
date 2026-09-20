import { Pool } from "@neondatabase/serverless";

const [shortId, ...reasonParts] = process.argv.slice(2);
const reason = reasonParts.join(" ").trim();

if (!shortId || !/^[A-Za-z0-9_-]{6,24}$/u.test(shortId) || !reason) {
  console.error(
    'Usage: npm run report:unlist -- <short-id> "reason for removal"',
  );
  process.exitCode = 1;
} else {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");

  const pool = new Pool({ connectionString });
  try {
    const result = await pool.query(
      `UPDATE report_publications publications
       SET withdrawn_at = now(), withdrawal_reason = $2
       FROM reports
       WHERE publications.report_id = reports.id
         AND reports.short_id = $1
         AND publications.withdrawn_at IS NULL
       RETURNING reports.short_id`,
      [shortId, reason],
    );
    if (result.rowCount === 0) {
      console.error(
        "Report was not found, was never listed, or is already unlisted.",
      );
      process.exitCode = 1;
    } else {
      console.log(
        `Unlisted report ${shortId}. Its direct URL remains available.`,
      );
    }
  } finally {
    await pool.end();
  }
}
