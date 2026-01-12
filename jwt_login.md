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


