import { randomBytes, scryptSync } from "crypto";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const ACCOUNT = {
  loginAccount: "admin@test.com",
  email: "admin@test.com",
  name: "Local Admin",
  role: "admin",
  status: "Active",
};

const TOOL_IDS = [
  "youtube_speech_link_collector",
  "talent-lead-parser",
  "lark-table-helper",
  "resource-matcher",
];

const DATABASE_URL_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
];

function assertLocalSeedMode() {
  if (process.env.BLACKDOG_LOCAL_SEED !== "1") {
    throw new Error("Refusing to seed without BLACKDOG_LOCAL_SEED=1.");
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production" || process.env.VERCEL === "1") {
    throw new Error("Refusing to seed in production or Vercel environment.");
  }
}

function getDatabaseUrl() {
  const databaseUrl = DATABASE_URL_ENV_KEYS.map((key) => process.env[key]).find(Boolean);
  if (!databaseUrl) throw new Error("Database connection string is not configured.");
  const normalized = databaseUrl.toLowerCase();
  if (normalized.includes("production") || normalized.includes("prod")) {
    throw new Error("Refusing to seed a database URL that looks like production.");
  }
  return databaseUrl;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

async function main() {
  assertLocalSeedMode();

  const password = process.env.LOCAL_ADMIN_PASSWORD;
  if (!password) {
    throw new Error("Set LOCAL_ADMIN_PASSWORD before running this seed.");
  }

  const sql = neon(getDatabaseUrl());
  const passwordHash = hashPassword(password);

  const existing = await sql`
    select id
    from blackdog_accounts
    where lower(email) = ${ACCOUNT.email} or lower(login_account) = ${ACCOUNT.loginAccount}
    limit 1
  `;

  const accountId = existing[0]?.id;
  const [account] = accountId
    ? await sql`
        update blackdog_accounts
        set
          login_account = ${ACCOUNT.loginAccount},
          email = ${ACCOUNT.email},
          name = ${ACCOUNT.name},
          role = ${ACCOUNT.role},
          status = ${ACCOUNT.status},
          password_hash = ${passwordHash},
          password_updated_at = now(),
          updated_at = now()
        where id = ${accountId}
        returning id, email, login_account, role, status
      `
    : await sql`
        insert into blackdog_accounts (
          login_account,
          email,
          name,
          role,
          status,
          password_hash,
          password_updated_at
        )
        values (
          ${ACCOUNT.loginAccount},
          ${ACCOUNT.email},
          ${ACCOUNT.name},
          ${ACCOUNT.role},
          ${ACCOUNT.status},
          ${passwordHash},
          now()
        )
        returning id, email, login_account, role, status
      `;

  for (const toolId of TOOL_IDS) {
    await sql`
      insert into blackdog_tool_permissions (account_id, tool_id, granted, granted_by)
      values (${account.id}, ${toolId}, true, 'local-seed')
      on conflict (account_id, tool_id)
      do update set granted = true, granted_by = 'local-seed', updated_at = now()
    `;
  }

  await sql`
    insert into blackdog_audit_logs (action, actor_id, actor_email, target_account_id, target_email, before, after)
    values (
      ${accountId ? "account_updated" : "account_created"},
      'local-seed',
      'local-seed',
      ${account.id},
      ${account.email},
      ${accountId ? JSON.stringify({ seeded: true }) : null}::jsonb,
      ${JSON.stringify({ role: account.role, status: account.status, toolsGranted: TOOL_IDS.length })}::jsonb
    )
  `;

  console.log(`Seeded local admin account: ${account.login_account || account.email}`);
  console.log(`Role: ${account.role}`);
  console.log(`Status: ${account.status}`);
  console.log(`Granted tools: ${TOOL_IDS.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Local admin seed failed.");
  process.exit(1);
});
