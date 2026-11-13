Production backup and deployment runbook
This runbook documents the deployment procedure used for Linxo Money Pools v1.1.0 on November 13, 2026. It is intended for subsequent releases using Supabase PostgreSQL, Prisma 7, Vercel, Docker, and a Zsh/WSL terminal.
The procedure assumes a production Vercel application already connected to Supabase, with a Git push to `master` triggering a production deployment. It does not require knowing or resetting the main database password, modifying Vercel secrets, or copying production credentials into `.env.local`.
> **Production safety:** Never run destructive restoration commands against Supabase Production or the regular development database. Never commit a database dump, password, or downloaded environment file. A public-schema dump is an **application database backup**, not a full backup of Supabase Auth, Storage, roles, and platform configuration.
1. Release preflight
Before any production operation:
Confirm the release candidate has passed its tests and production build.
Identify the Git commit to deploy and the migrations pending since the previous release.
Confirm the currently deployed application will remain compatible with the expanded schema while Vercel builds the new version.
Confirm the production database connection used during Vercel builds has schema-migration privileges.
Choose a quiet deployment window and plan a brief post-deployment smoke test.
For v1.1.0, the application was validated at `27dd519`, and the deployment included the documentation commit `59adbdc`. The three pending migrations were:
```text
20261112180000_collector_reuse_provenance
20261112190000_fixed_contributions
20261112200000_permanent_pool_archive
```
2. Create a temporary backup role in Supabase
Open Supabase Production → SQL Editor. Run the following with a new strong, unique temporary password:
```sql
CREATE ROLE linxo_backup_temp
WITH LOGIN PASSWORD 'REPLACE_WITH_A_STRONG_TEMPORARY_PASSWORD';

GRANT CONNECT ON DATABASE postgres TO linxo_backup_temp;
GRANT USAGE ON SCHEMA public TO linxo_backup_temp;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO linxo_backup_temp;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO linxo_backup_temp;
```
During the v1.1.0 backup, `pg_dump` failed on the `Account` table with:
```text
query would be affected by row-level security policy for table "Account"
```
The temporary role was therefore granted `BYPASSRLS` for the duration of the backup:
```sql
ALTER ROLE linxo_backup_temp BYPASSRLS;
ALTER ROLE linxo_backup_temp
SET default_transaction_read_only = on;
```
`BYPASSRLS` is a powerful privilege: this role can read rows normally protected by row-level security wherever it has `SELECT`. Use it only for the backup and revoke/remove the role promptly afterward. The default read-only setting is an additional precaution, not a substitute for restricting privileges. The SQL Editor may retain the password in query history; clear that sensitive query according to your team's practices.
3. Configure the session-pooler connection in Zsh
In Supabase → Connect → Session pooler, obtain the host and project reference. Use port 5432. For a custom login role, the pooler username follows the form `linxo_backup_temp.<PROJECT_REF>`.
In the same Zsh terminal that will run Docker:
```zsh
export PGHOST="<SUPABASE_SESSION_POOLER_HOST>"
export PGPORT="5432"
export PGDATABASE="postgres"
export PGUSER="linxo_backup_temp.<PROJECT_REF>"
export PGSSLMODE="require"

read -rs "PGPASSWORD?Temporary backup password: "
echo
export PGPASSWORD
```
Do not use Bash's `read -p` syntax in Zsh: it produced `read: -p: no coprocess` during v1.1.0.
Test the read-only connection without printing any credentials:
```bash
docker run --rm \
  -e PGHOST -e PGPORT -e PGDATABASE \
  -e PGUSER -e PGPASSWORD -e PGSSLMODE \
  postgres:17 \
  psql -X -v ON_ERROR_STOP=1 \
  -c 'SELECT current_database(), current_user;'
```
Expected: database `postgres`, current user `linxo_backup_temp`. If either differs, stop.
4. Create a local dump using Docker
The v1.1.0 environment did not have `pg_dump` installed in WSL (`pg_dump: not found`). The Ubuntu package `postgresql-client-17` was also unavailable from the configured apt repositories. Using the official `postgres:17` image avoided installing a local client.
```bash
BACKUP_DIR="$HOME/backups/linxo-money-pools"
BACKUP_FILE="pre-vX.Y.Z.dump"  # Replace with the release being deployed

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

docker run --rm \
  --user "$(id -u):$(id -g)" \
  -e PGHOST -e PGPORT -e PGDATABASE \
  -e PGUSER -e PGPASSWORD -e PGSSLMODE \
  -v "$BACKUP_DIR:/backup" \
  postgres:17 \
  pg_dump \
    --schema=public \
    --format=custom \
    --no-owner \
    --no-acl \
    --file="/backup/$BACKUP_FILE"
```
Only continue if `pg_dump` exits successfully. An incomplete file may remain after an error, notably an RLS error.
```bash
chmod 600 "$BACKUP_DIR/$BACKUP_FILE"
ls -lh "$BACKUP_DIR/$BACKUP_FILE"

docker run --rm \
  -v "$BACKUP_DIR:/backup:ro" \
  postgres:17 \
  pg_restore --list "/backup/$BACKUP_FILE"
```
Check that the archive lists `TABLE DATA` entries for `Pool`, `Contribution`, other application tables, and `_prisma_migrations`. This only checks the archive catalogue; it does not prove that restoration works.
The dump may contain names, email addresses, payment information, and OAuth tokens. Store it securely outside the repository and follow the applicable retention policy.
5. Restore the dump into a disposable PostgreSQL 17 container
Start a dedicated container without exposing a port or touching the existing development database:
```bash
docker run -d --rm \
  --name linxo-restore-test \
  -e POSTGRES_PASSWORD=restore_test_only \
  -e POSTGRES_DB=linxo_restore \
  postgres:17

until docker exec linxo-restore-test \
  pg_isready -h 127.0.0.1 -U postgres -d linxo_restore -q; do
  sleep 1
done
```
The explicit TCP readiness check matters: an earlier attempt connecting to `127.0.0.1:5432` failed with `Connection refused` even though a socket-based readiness check had passed.
A fresh PostgreSQL database already contains the `public` schema, while our archive includes `CREATE SCHEMA public`. The first v1.1.0 restore consequently failed with `schema "public" already exists`.
On this disposable restore container only, remove the empty schema before restoring:
```bash
docker exec linxo-restore-test \
  psql -U postgres -d linxo_restore -v ON_ERROR_STOP=1 \
  -c 'DROP SCHEMA public CASCADE;'
```
> **Never run `DROP SCHEMA public CASCADE` on Supabase Production or the normal local development database.** Verify the container name and database first.
Restore from stdin; do not copy the backup file inside the container:
```bash
docker exec -i linxo-restore-test \
  pg_restore \
    -U postgres \
    -d linxo_restore \
    --no-owner \
    --no-acl \
    --exit-on-error \
  < "$BACKUP_DIR/$BACKUP_FILE"
```
A successful exit is required. If a restore partially fails, reset only this disposable test database before trying again.
6. Verify the restored data
```bash
docker exec linxo-restore-test \
  psql -U postgres -d linxo_restore -v ON_ERROR_STOP=1 \
  -c '
    SELECT
      (SELECT COUNT(*) FROM public."Pool") AS pools,
      (SELECT COUNT(*) FROM public."Contribution") AS contributions,
      (SELECT COUNT(*) FROM public."_prisma_migrations") AS migrations;
  '
```
Inspect the pre-release migration history:
```bash
docker exec linxo-restore-test \
  psql -U postgres -d linxo_restore -v ON_ERROR_STOP=1 \
  -c '
    SELECT migration_name, finished_at
    FROM public."_prisma_migrations"
    ORDER BY started_at;
  '
```
For v1.1.0, the restored backup contained:
Item	Restored count
Pools	35
Contributions	348
Applied Prisma migrations	2
The restored migrations were `20260625210551_initial_schema` and `20260628120000_track_payment_handoff`. These counts are historical, not expected values for later releases. Compare future restore counts with the corresponding production snapshot.
A successful restore plus readable data is substantially stronger evidence than a dump file existing or `pg_restore --list` succeeding.
Optional: rehearse the next migrations against the restored data
For a non-production rehearsal, pending `migration.sql` files can be applied in order to the disposable database:
```bash
for migration in \
  20261112180000_collector_reuse_provenance \
  20261112190000_fixed_contributions \
  20261112200000_permanent_pool_archive
do
  echo "Testing $migration"
  docker exec -i linxo-restore-test \
    psql -U postgres -d linxo_restore -v ON_ERROR_STOP=1 \
    < "prisma/migrations/$migration/migration.sql" || break
done
```
Replace the filenames for the next release. This is a SQL compatibility rehearsal only: executing SQL directly does not register migrations in `_prisma_migrations`. For production, use `prisma migrate deploy`. The v1.1.0 readiness checks had already rehearsed the three migrations against a separate disposable database; do not describe this optional restored-data rehearsal as completed unless actually run.
7. Temporarily enable migrations during the Vercel build
For v1.1.0, the release was executed via the Vercel dashboard rather than local production database credentials:
Open Vercel → Project → Settings → Build and Deployment → Framework Settings.
Enable Override for Build Command.
Save the following command:
```bash
npx prisma migrate deploy && npm run build
```
`migrate deploy` applies pending migrations and updates Prisma's own history. The `&&` prevents `next build` from running if migrations fail. It does not roll back migrations if a later build or deployment step fails.
Before pushing, confirm that the existing Vercel Production environment supplies the proper Supabase database connection and that the Prisma configuration does not accidentally load `.env.local` during the build. The schema changes must remain compatible with the currently serving application while Vercel prepares the replacement.
Do not use `prisma migrate dev`, `prisma db push`, or database reset commands in production.
8. Push and inspect Vercel logs
```bash
git status --short
git log -1 --oneline
git push origin master
```
The Git push triggers the configured production deployment. An SSH key passphrase may be requested locally; never include it in the documentation or logs.
Inspect Vercel → Deployments → latest production deployment → Build Logs. Confirm:
The expected Git commit was checked out.
Prisma loaded `prisma.config.ts` and targeted the expected Supabase Production hostname/database.
Pending migrations were discovered and each was applied successfully.
The log explicitly reports `All migrations have been successfully applied.`
`next build` compiled successfully.
Vercel reports `Deployment completed`.
For v1.1.0, Vercel deployed `59adbdc` and successfully applied all three migrations listed above before building Next.js.
If the migration step fails, stop and investigate before retrying. Do not edit `_prisma_migrations` by hand or assume a failed build means the database was unchanged.
9. Production smoke tests
A successful Vercel deployment is not the same as a functionally accepted release. Check:
[ ] Homepage, FAQ, and Google authentication.
[ ] Existing pools and historical contribution amounts.
[ ] Creating a pool and configuring/reusing an eligible collector.
[ ] FREE and FIXED contribution modes.
[ ] Public contribution visibility and privacy choices.
[ ] Closing, reopening, and archive behavior.
[ ] Favorite banks in the Linxo payment flow.
[ ] An explicitly authorized, controlled low-value Production payment and its return/status, when appropriate.
All eight production smoke-test categories were reported as passed for v1.1.0.
10. Cleanup after acceptance
Restore the usual Vercel build
In Settings → Build and Deployment → Framework Settings, disable the temporary Build Command Override (or restore the previously configured build command), then save. The migration history remains in PostgreSQL; this does not reverse schema changes.
Remove the temporary Supabase backup role
In Supabase Production → SQL Editor, after the backup is complete:
```sql
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public
FROM linxo_backup_temp;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
FROM linxo_backup_temp;

REVOKE USAGE ON SCHEMA public FROM linxo_backup_temp;
REVOKE CONNECT ON DATABASE postgres FROM linxo_backup_temp;

ALTER ROLE linxo_backup_temp NOBYPASSRLS;
DROP ROLE linxo_backup_temp;
```
If `DROP ROLE` reports dependent privileges or objects, examine the dependencies and revoke them explicitly. Do not blindly use `DROP OWNED BY` on production: it can remove objects owned by the role, not just privileges. If cleanup cannot be completed immediately, at least disable login and `BYPASSRLS` while investigating:
```sql
ALTER ROLE linxo_backup_temp NOLOGIN NOBYPASSRLS;
```
Clean the terminal and Docker
```bash
unset PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD PGSSLMODE

docker stop linxo-restore-test
```
The container was created with `--rm`, so stopping it removes the disposable test database. Keep the validated backup separately, encrypted or otherwise access-restricted as appropriate.
11. Version the accepted release
Only after the production smoke tests succeed, create and push an annotated tag pointing at the exact deployed commit:
```bash
git tag -a vX.Y.Z <DEPLOYED_COMMIT_SHA> -m "Linxo Money Pools vX.Y.Z"
git push origin vX.Y.Z
```
For v1.1.0, the commands actually run were:
```bash
git tag -a v1.1.0 59adbdc -m "Linxo Money Pools v1.1.0"
git push origin v1.1.0
```
The remote confirmed creation of `v1.1.0`. Do not move a published tag silently. A tag records a version; it does not by itself trigger the deployment used here.
12. Lessons from the v1.1.0 deployment
Issue encountered	Resolution
`pg_dump: not found` in WSL	Use `postgres:17` in Docker.
`postgresql-client-17` unavailable through apt	No host installation required with Docker.
Zsh rejects `read -p`	Use `read -rs "PGPASSWORD?Prompt: "`.
`vercel env run` unexpectedly loaded `.env.local`	Verify the actual DB target; do not assume that command exposes Production secrets.
Production `DATABASE_URL` unavailable in exported environment	Use a dedicated temporary Supabase login instead of resetting the primary password.
RLS blocked `pg_dump` on `Account`	Temporarily grant the backup role `BYPASSRLS`, then revoke it/delete the role afterward.
First restore connection refused	Wait for TCP readiness, or restore from inside the target container.
`schema "public" already exists`	Remove `public` only inside the isolated disposable restore database.
Archive catalogue was readable	Also perform an actual restore and query the restored rows.
What this procedure does not cover
This `--schema=public` dump is not a complete Supabase disaster-recovery backup. It does not automatically include managed platform configuration, non-public schemas, Storage files, or every externally managed secret. Nor is reverting a Vercel deployment equivalent to reverting already-applied database migrations. Assess those risks separately for any future destructive or incompatible migration.