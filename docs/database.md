# Database

This project uses Prisma 7 with PostgreSQL for persistence.

Supabase is the intended free PostgreSQL provider for later development, but this repository must never commit production credentials.

## Environment variable

Set `DATABASE_URL` through environment variables or an untracked local file such as `.env.local`.

Prisma 7 reads the database URL from `prisma.config.ts`, not from the `datasource` block in `schema.prisma`.

Example placeholder:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/linxo_money_pools?schema=public"
```

## Useful commands

Generate the Prisma client:

```bash
npm run db:generate
```

Validate the Prisma schema:

```bash
npm run db:validate
```

Create a local development migration later when a database is available:

```bash
npm run db:migrate:dev
```

## Data handling constraints

- Store money amounts as decimal values, not cents.
- Do not store IBANs.
- Do not store birth date, birth city, or birth country.
- Store only Linxo Payments reference identifiers when needed.
