# 🏆 Titan Sports Authentication & Row-Level Authorization System

A production-grade sports authentication, identity, and authorization platform built with **Node.js, Express, and SQLite**, implementing state-of-the-art security patterns:

1. **User Identification**: Unique UUIDs, normalized credentials, and official sports license badges (`ATH-2026-XXXX`, `COA-2026-XXXX`, `REF-2026-XXXX`, `ADM-2026-XXXX`).
2. **Salt & Pepper Password Security**: Per-user dynamic cryptographic salts (256-bit CSPRNG) combined with a secret server-side pepper via HMAC-SHA256, derived with memory-hard Scrypt (`N=16384, r=8, p=1`).
3. **Two-Factor Authentication (2FA)**: RFC 6238 TOTP compliant (30-second window, clock drift compensation, inline QR code generation for Google Authenticator / Authy).
4. **Auth Backup & Emergency Recovery**: 8 single-use cryptographically random recovery codes (`XXXX-XXXX`) hashed with individual salts before database storage. Includes one-click account security snapshot backup export.
5. **Row-Level Authorization / Security (RLS)**: Fine-grained row-level security engine (`RowPolicyEngine`) enforcing data boundaries across sports entities (Medical Records, Tactical Training Drills, Match Fixtures, Facility Bookings).

---

## 🚀 Quick Start

### 1. Installation & Setup
```bash
# Clone or navigate to the directory
cd "c:\Users\DELL\Desktop\Larry the preacher"

# Install dependencies
npm install

# Seed the database with sports entities & test personas
npm run seed

# Run automated cryptographic and RLS tests
npm test

# Start the server (default port: 3500)
npm start
```

Open your browser to: **[http://localhost:3500](http://localhost:3500)**

---

## 👥 Seed Identities for Testing

| Role | Username | License ID | Password | Team | Sample Backup Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Club Admin** | `admin_sarah` | `ADM-2026-1001` | `Password@123` | All Sports | `TITAN-9001` |
| **Head Coach** | `coach_phil` | `COA-2026-2002` | `Password@123` | Apex Titans | `TITAN-9001` |
| **Athlete (Player)** | `athlete_lebron` | `ATH-2026-3003` | `Password@123` | Apex Titans | `TITAN-9001` |
| **Athlete (Player)** | `athlete_serena` | `ATH-2026-4004` | `Password@123` | Thunderbolts | `TITAN-9001` |
| **League Referee** | `referee_mike` | `REF-2026-5005` | `Password@123` | Official Ref | `TITAN-9001` |

> *Tip: The web interface includes a **1-Click Quick Identity Switcher** in the left sidebar to immediately toggle between personas and inspect their row-level permissions.*

---

## 🛡️ Security Architecture & Implementation Details

### 1. User Identification
- **Member Badge ID**: Formatted by role and registration year (`ATH-2026-3003`, `COA-2026-2002`, `REF-2026-5005`, `ADM-2026-1001`).
- **Flexible Sign-in**: Users can identify themselves via their **username**, **official email**, or **sports license ID**.
- **Sanitized Profiles**: Internal database records strictly sanitize `password_hash`, `password_salt`, and `two_factor_secret` before passing profiles to the API or frontend sessions.

### 2. Cryptographic Salt & Pepper Architecture
Traditional password hashing is vulnerable if a database dump is leaked. Titan implements a multi-layer defense in depth:

$$\text{Pre-Hash} = \text{HMAC-SHA256}(\text{Password}, \text{ServerPepperSecret})$$
$$\text{FinalHash} = \text{Scrypt}(\text{Pre-Hash}, \text{DynamicUserSalt}, \text{keylen}=64, N=16384, r=8, p=1)$$

- **Dynamic Salt**: 256 bits of CSPRNG entropy (`crypto.randomBytes(32).toString('hex')`) generated per user. Prevents precomputed rainbow table attacks and guarantees distinct hashes for identical passwords.
- **Server Pepper**: A secret 256-bit cryptographic key stored strictly in server environment configuration (`process.env.PEPPER_SECRET`), **never** stored in the database. Even with full database access (SQL injection or backup leak), an adversary cannot verify or crack passwords without the server pepper.
- **Constant-Time Verification**: Verification uses `crypto.timingSafeEqual` to eliminate timing side-channel attacks.

### 3. Two-Factor Authentication (RFC 6238 TOTP)
- **Secret Key**: 160-bit Base32 secret (`crypto.randomBytes(20)`).
- **Time Step**: 30 seconds with $\pm 1$ step drift allowance for desynchronized clocks.
- **QR Code Provisioning**: Emits high-contrast data URL QR codes scanned directly by Google Authenticator, Authy, Apple Passwords, or 1Password.

### 4. Auth Backup & Emergency Recovery
- **8 Single-Use Recovery Codes**: Formatted as `XXXX-XXXX` (e.g., `8K2P-9M4Q`).
- **Salted Hash Storage**: Each recovery code is hashed with SHA-256 and the user's salt before insertion (`auth_backup_codes`). Plaintext codes are never stored.
- **Single-Use Invalidation**: When a backup code is verified during sign-in, its record is marked `used_at = CURRENT_TIMESTAMP` and cannot be reused.
- **Account Security Snapshot**: Authenticated users can export an official JSON auth backup report containing their identification badges, active security specs, remaining backup code counts, and recent audit trails.

### 5. Row-Level Authorization / Security (RLS)
Unlike simple Role-Based Access Control (RBAC) that only gates whole endpoints, **Row-Level Security (RLS)** gates individual rows of data:

```
┌───────────────────────────────────────────────┐
│              RowPolicyEngine                  │
│                                               │
│ User Context        Operation     Target Row  │
│ {id, role, team} + {SELECT/EDIT} + {row data} │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
       [ALLOWED] ─── or ─── [DENIED + REASON]
```

- **`athletes_medical_fitness`**:
  - **Athlete**: Can **only** read and update their **own** medical row (`row.user_id === user.id`).
  - **Coach**: Can **only** read medical records for athletes on **their team** (`row.team_id === user.team_id`). Cross-team access is blocked.
  - **Referee**: Forbidden from viewing medical records (`0` rows returned).
  - **Club Admin**: Full access.
- **`match_fixtures`**:
  - **Read**: Open to all sports members.
  - **Score Updating (Write)**: **Only** the assigned referee (`row.referee_id === user.id`) or Club Admin can modify match scores and official reports. Coaches and athletes are strictly blocked to prevent conflicts of interest.
- **`facility_bookings`**:
  - Only the user who created the reservation row (`row.booked_by_user_id === user.id`) or Admin can cancel it.

---

## 🧪 Automated Test Suite

Run the built-in test suite:
```bash
npm test
```

Verified test coverage:
- **Suite 1**: User Identification & Member ID Generation
- **Suite 2**: Salt & Pepper Cryptography (verifies that without server pepper, authentication fails)
- **Suite 3**: RFC 6238 TOTP generation, validation, and drift compensation
- **Suite 4**: Auth Backup codes salted storage, single-use consumption, and reuse rejection
- **Suite 5**: Row-Level Authorization boundaries across all 4 sports entities
- **Suite 6**: Full End-to-End flow (Register $\to$ 2FA $\to$ Login with Salt & Pepper $\to$ Recover via Backup Code)

---

## 📂 Project Architecture

```
├── .env                       # Server-side Pepper and JWT configuration
├── .env.example               # Configuration template
├── package.json               # Dependencies and scripts
├── server.js                  # Express application and HTTP server
├── sports_auth.db             # Persistent SQLite database (node:sqlite)
├── src/
│   ├── config.js              # Environment and pepper configuration loader
│   ├── db.js                  # SQLite database engine, schema initialization, and indexes
│   ├── seed.js                # Database seeder with realistic sports personas
│   ├── crypto/
│   │   ├── hasher.js          # Salt & Pepper Scrypt + HMAC-SHA256 password hashing
│   │   ├── totp.js            # RFC 6238 TOTP 2FA engine (Base32, HMAC-SHA1)
│   │   └── backupCodes.js     # Single-use emergency backup code generator and verifier
│   ├── auth/
│   │   ├── identification.js  # Member ID badges, validation, profile sanitization
│   │   ├── authService.js     # Register, Login, 2FA challenge, Backup code recovery
│   │   └── middleware.js      # JWT authentication and role authorization
│   ├── rls/
│   │   └── rowPolicyEngine.js # Row-Level Authorization engine and policy evaluator
│   └── routes/
│       ├── authRoutes.js      # API endpoints for authentication, 2FA, and backup codes
│       ├── sportsRoutes.js    # API endpoints for sports data with RLS enforcement
│       └── rlsRoutes.js       # Endpoints for real-time RLS inspection and simulation
├── public/
│   ├── index.html             # Responsive sports authentication SPA
│   ├── css/
│   │   └── styles.css         # Modern athletic UI stylesheet with glassmorphism
│   └── js/
│       └── app.js             # Client controller for auth, 2FA, and RLS Inspector
└── tests/
    └── auth.test.js           # Automated test suite
```
