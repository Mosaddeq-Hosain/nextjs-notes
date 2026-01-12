## JWT LOGIN (WITHOUT NEXTAUTH) — BIG PICTURE FIRST

### Login Process
1. User submits email & password
2. Server checks user exists in DB
3. Server checks password (bcrypt)
4. Server creates JWT
5. JWT stored (cookie or header)
6. Server verifies JWT on protected pages


### STEP 1 — Decide WHERE JWT is stored

There are two valid choices:

#### Option 1️⃣ HttpOnly Cookie (recommended for web apps)

Secure

Auto-sent by browser

Not accessible by JS

#### Option 2️⃣ Authorization Header

Used for mobile / APIs

Must manage manually


__HttpOnly Cookie is the professional choice for a web app like HRIS.__


## STEP 2 — Create the LOGIN API (NO JWT yet)

Login logic must live in an API route:

```
app/api/login/route.ts
```
We only verify email + password.

🧱 Mental Flow

Receive email & password

Fetch user from DB

Compare password with bcrypt

```
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  // 1️⃣ Find user
  const result = await db.query(
    "SELECT id, email, password, role FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const user = result.rows[0];

  // 2️⃣ Verify password
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // ✅ Password correct (JWT comes next)
  return NextResponse.json({
    message: "Login step 1 success",
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}


```


## STEP 4 — Create JWT (Token Generation)

Now we extend the login API.

📌 Goal:

After password verification

Generate a JWT

JWT contains minimal info

JWT payload should be:

✅ Minimal

✅ Non-sensitive

✅ Useful for authorization

##  STEP 5 — Create JWT in Next.js

### 1️⃣ Install JWT library
```
npm install jsonwebtoken
```

### 2️⃣ Create a strong JWT secret
❓ Should you write it randomly?

👉 YES — but securely

Use terminal:

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"


Example output:

9f3a1c7e4d9a... (long string)


Add to .env.local:

JWT_SECRET=your_generated_secret_here


⚠️ Never commit this to GitHub.

### 3️⃣ Generate JWT after login

```
import jwt from "jsonwebtoken";

const token = jwt.sign(
  {
    userId: user.id,
    role: user.role,
  },
  process.env.JWT_SECRET!,
  {
    expiresIn: "1d",
  }
);

```
## Step 4 — Store JWT (WHERE exactly?)
❓ Where should this code be written?

Answer:
👉 Immediately after JWT creation,
👉 inside the SAME server login handler

Same file. Same function.

✅ Code (written INSIDE login handler)
```
import { cookies } from "next/headers";

cookies().set("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});
```


## Create middleware file

At project root:
```
middleware.ts
```

🔐 middleware.ts (JWT protection)
```
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // Not logged in
  if (!token) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  try {
    // Verify JWT
    jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.next();
  } catch {
    // Invalid or expired token
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }
}
```

🎯 Protect only specific routes

Add matcher (recommended):
```
export const config = {
  matcher: ["/dashboard/:path*"],
};
```
🧠 Mental Flow (Lock this in)

Browser requests /dashboard

Middleware runs first

Reads JWT from cookie

Verifies JWT

✅ Allowed → page loads
❌ Denied → redirect to /login


