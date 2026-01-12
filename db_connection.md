# Database Connection (PostgreSQL – Neon) in Next.js

## 1. Purpose
This document explains how the application connects to a PostgreSQL database
using **Neon** and the **pg** library in a **Next.js (App Router)** project.

The connection is:
- Server-side only
- Secure (using environment variables)
- Reusable across the application

---

## 2. Technology Used
- **Database:** PostgreSQL (Neon)
- **Driver:** pg
- **Framework:** Next.js (App Router)

---

## 3. Install Dependency

```bash
npm install pg
 ```

## 4. Environment Variables
Create a file named .env.local
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require


## Database Connection File
Create the file:
lib/db.ts

```
import { Pool } from "pg";

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

## Why use Pool?

Reuses database connections

Prevents too many open connections

Faster and production-safe

## 6. Using the Database

Example: SELECT
```
const result = await db.query(
  "SELECT id, email, role FROM users WHERE email = $1",
  [email]
);

const user = result.rows[0];
```
Example: INSERT
```
await db.query(
  "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
  [email, hashedPassword, role]
);
```

Example: UPDATE
```
await db.query(
  "UPDATE users SET role = $1 WHERE id = $2",
  [role, id]
);
```

Example: DELETE
```
await db.query(
  "DELETE FROM users WHERE id = $1",
  [id]
);
```


## 8. Server-Only Rule (Important)

Database queries must run in:

Server Components

Server Actions

API Routes

NextAuth authorize()

❌ Never run database queries in Client Components.





