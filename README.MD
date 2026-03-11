## QuickQueue (IT342) — How to Run

This repo has three parts:

- **backend/**: Spring Boot (Java) REST API
- **web/**: React + Vite frontend
- **mobile/**: Android (Jetpack Compose) app (currently a template screen)

---

## Prerequisites

### Backend

- **Java 17** (JDK 17)
- (Optional) **Maven** — not required if using the Maven Wrapper (`mvnw.cmd`)
- A **Supabase** project (PostgreSQL database — hosted, no local DB needed)

Backend database config is in `backend/src/main/resources/application.properties`:

- URL: `jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres` (connection pooler — required because the direct host is IPv6-only)
- User: `postgres.wrgbhmgpqzcbejtqqbxf`
- Password: your Supabase database password
- API Port: `8080`

> **Important:** Replace `[YOUR-PASSWORD]` in `application.properties` with your actual Supabase database password before running.

### Web

- **Node.js 18+** (20+ is fine)
- npm (comes with Node)

### Mobile

- **Android Studio** + Android SDK

---

## 1) Configure the Database (Supabase)

No local database setup is required. The backend connects to a hosted **Supabase PostgreSQL** instance.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project → **Settings** → **Database**
3. Under **Connection string**, select **JDBC** and switch mode to **Session**
4. Copy the pooler JDBC URL (the direct `db.<ref>.supabase.co` host is IPv6-only and may not work on all networks)
5. Paste it into `backend/src/main/resources/application.properties` as `spring.datasource.url`
6. Set `spring.datasource.username` to `postgres.<your-project-ref>`
7. Set `spring.datasource.password` to your database password

Tables are created/updated automatically on startup (`spring.jpa.hibernate.ddl-auto=update`).

---

## 2) Run the Backend (Spring Boot)

### Option A — Use the provided script (Windows)

From the repo root:

`run-backend.bat`

Notes:

- `run-backend.bat` hard-codes `JAVA_HOME` and an absolute path to your machine. If it fails on another PC, update `JAVA_HOME` and/or the `cd` path.

### Option B — Run via Maven Wrapper (recommended)

From the repo root (PowerShell):

```powershell
cd backend
./mvnw.cmd spring-boot:run
```

Backend should come up on:

- `http://localhost:8080`

The web app calls auth endpoints at:

- `http://localhost:8080/api/auth`

---

## 3) Run the Web App (React + Vite)

From the repo root (PowerShell):

```powershell
cd web
npm install
npm run dev
```

Vite typically serves at:

- `http://localhost:5173`

If the port differs, use whatever URL Vite prints in the terminal.

Important:

- The frontend currently points to `http://localhost:8080` in `web/src/services/authService.js`. Ensure the backend is running first.

---

## 4) Run the Mobile App (Android)

### Android Studio (recommended)

1. Open Android Studio
2. Open the `mobile/` folder as a project
3. Let Gradle sync
4. Run the `app` configuration on an emulator or a connected device

### Command line (Windows)

```powershell
cd mobile
./gradlew.bat assembleDebug
```

---

## Troubleshooting

- **Backend won't start / DB connection error**: confirm you have replaced `[YOUR-PASSWORD]` in `backend/src/main/resources/application.properties` with your actual Supabase database password and that your Supabase project is active.
- **Port already in use**: change `server.port` in `backend/src/main/resources/application.properties` or stop the process using that port.
- **Web login/register fails**: confirm backend is running on `http://localhost:8080` and you can reach `/api/auth/*` endpoints.