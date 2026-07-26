const { Client } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const c = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const dbs = await c.query(
    "SELECT datname FROM pg_database WHERE datistemplate = false",
  );
  console.log(
    "dbs",
    dbs.rows.map((r) => r.datname),
  );
  const exists = dbs.rows.some((r) => r.datname === "socialmarka");
  if (!exists) {
    await c.query("CREATE DATABASE socialmarka");
    console.log("created socialmarka");
  } else {
    console.log("socialmarka already exists");
  }
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
