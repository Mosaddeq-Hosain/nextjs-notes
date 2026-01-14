## Login Process Flow

### 1. **Frontend Login Form** (`app/login/page.tsx`)

* User enters email and password
* On submit, `handleSubmit`:

  * Prevents default form submission
  * Extracts email and password from form data
  * Sends a POST request to `/api/login` with JSON body

```ts
"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      alert("Invalid email or password");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>

      <input name="email" type="email" required />
      <input name="password" type="password" required />

      <button type="submit">Login</button>
    </form>
  );
}
```

---

### 2. **API Route Handler** (`app/api/login/route.ts`)

The POST handler processes the login:

#### **Step 1: User lookup**

* Queries the database for a user with the provided email
* If not found, returns 401 with `"Invalid email or password"`

#### **Step 2: Password verification**

* Uses `bcrypt.compare()` to check the provided password against the stored hash
* If invalid, returns 401 with `"Invalid email or password"`

#### **Step 3: Token generation**

* Creates a JWT with:

  * `userId`: user's ID
  * `role`: user's role
  * Expiration: 1 day
  * Signed with `JWT_SECRET`

#### **Step 4: Cookie setting**

* Sets an httpOnly cookie named `"token"` containing the JWT
* Security settings:

  * `httpOnly: true` (not accessible via JavaScript)
  * `secure: true` in production (HTTPS only)
  * `sameSite: 'lax'`
  * `path: '/'` (available site-wide)

#### **Step 5: Response**

* Returns JSON with success message, status 200, and user info (id, email, role)

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const result = await db.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const user = result.rows[0];
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    message: "Login successful",
    status: 200,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "1d" }
  );

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
```

---

### 3. **Frontend Response Handling** (`app/login/page.tsx`)

* If the response is OK, redirects to `/dashboard`
* Otherwise, shows an alert: `"Invalid email or password"`

---

### 4. **Route Protection** (`middleware.ts`)

* Intercepts requests to `/` and `/dashboard/*`
* Checks for the `"token"` cookie
* If missing, redirects to `/login`
* If present, allows the request to proceed

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
```

---

## Security Features

* Passwords hashed with bcrypt
* JWT tokens for stateless authentication
* HttpOnly cookies to reduce XSS risk
* Secure cookies in production
* Generic error messages to avoid user enumeration

The login flow uses JWT-based authentication with httpOnly cookies for session management.
