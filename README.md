# Optima

A Next.js + PostgreSQL + Drizzle starter for the Result And More portal.

## Run locally

1. Start PostgreSQL with Docker:
   ```bash
   docker run --name optima-postgres -e POSTGRES_DB=optima -e POSTGRES_USER=optima -e POSTGRES_PASSWORD=optima123 -p 5432:5432 -d postgres:16-alpine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Drizzle commands

```bash
npx drizzle-kit generate
npx drizzle-kit push
npx drizzle-kit studio
```
