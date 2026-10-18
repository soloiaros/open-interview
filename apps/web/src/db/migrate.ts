// Applies Drizzle migrations plus the full-text indexes Drizzle can't express.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL ?? "postgres://tacit:tacit@localhost:5433/tacit";

export async function runMigrations(migrationsFolder = "./drizzle") {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(sql), { migrationsFolder });
    // Built-in Postgres full-text search. No extensions, so any Postgres 15+ works (including embedded-postgres).
    await sql`CREATE INDEX IF NOT EXISTS page_fts_idx ON page USING gin (to_tsvector('english', search_text))`;
    await sql`CREATE INDEX IF NOT EXISTS chunk_fts_idx ON chunk USING gin (to_tsvector('english', text))`;
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => console.log("migrations applied"))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
