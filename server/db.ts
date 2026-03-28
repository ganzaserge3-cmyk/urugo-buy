import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export async function ensureDatabaseTables() {
  await db.execute(sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_translations text`);
  await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS name_translations text`);
  await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS description_translations text`);
  await db.execute(sql`ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS title_translations text`);
  await db.execute(sql`ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS description_translations text`);
  await db.execute(sql`ALTER TABLE content_pages ADD COLUMN IF NOT EXISTS body_translations text`);
  await db.execute(sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS title_translations text`);
  await db.execute(sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS excerpt_translations text`);
  await db.execute(sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS body_translations text`);
  await db.execute(sql`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS contact_email text`);
  await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text`);
  await db.execute(sql`ALTER TABLE order_meta ADD COLUMN IF NOT EXISTS shipping_service text`);
  await db.execute(sql`ALTER TABLE order_meta ADD COLUMN IF NOT EXISTS shipment_carrier text`);
  await db.execute(sql`ALTER TABLE order_meta ADD COLUMN IF NOT EXISTS tracking_number text`);
  await db.execute(sql`ALTER TABLE order_meta ADD COLUMN IF NOT EXISTS tracking_url text`);
  await db.execute(sql`ALTER TABLE order_meta ADD COLUMN IF NOT EXISTS shipping_note text`);
  await db.execute(sql`ALTER TABLE order_meta ADD COLUMN IF NOT EXISTS shipped_at timestamp`);
  await db.execute(sql`ALTER TABLE order_meta ADD COLUMN IF NOT EXISTS delivered_at timestamp`);
  await db.execute(sql`ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS resolution text DEFAULT 'refund'`);
  await db.execute(sql`ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS refund_amount numeric(10, 2)`);
  await db.execute(sql`ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS refund_currency text`);
  await db.execute(sql`ALTER TABLE return_requests ADD COLUMN IF NOT EXISTS admin_note text`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS saved_addresses (
      id serial PRIMARY KEY,
      user_email text NOT NULL,
      label text NOT NULL,
      recipient_name text NOT NULL,
      shipping_address text NOT NULL,
      city text NOT NULL,
      country text NOT NULL,
      is_default boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS saved_addresses_user_email_idx
    ON saved_addresses(user_email)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS payment_sessions (
      token text PRIMARY KEY,
      order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      order_number text NOT NULL,
      amount numeric(10, 2) NOT NULL,
      currency_code text NOT NULL DEFAULT 'USD',
      method text NOT NULL,
      provider text NOT NULL,
      provider_order_id text UNIQUE,
      approval_url text,
      status text NOT NULL DEFAULT 'created',
      expires_at timestamp NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS payment_sessions_order_id_idx
    ON payment_sessions(order_id)
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS payment_sessions_provider_lookup_idx
    ON payment_sessions(provider, provider_order_id)
  `);
}
