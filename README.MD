
# QuickQueue (IT342)

QuickQueue is a multi-platform project with:

- **Backend**: Spring Boot (Java 17) REST API with Spring Web + JPA + MySQL
- **Web**: React + Vite frontend
- **Mobile**: Android (Kotlin) app using Jetpack Compose

## Repository Structure

- `backend/` Spring Boot API (`mvnw` wrapper included)
- `web/` React + Vite app
- `mobile/` Android Studio project
- `docs/` project documentation

## Prerequisites

- **Backend**: Java 17, a running **MySQL** server
- **Web**: Node.js (LTS recommended) + npm
- **Mobile**: Android Studio (Android SDK installed)

## Backend (Spring Boot)

### Configure Database

Backend config is in `backend/src/main/resources/application.properties`.

Default settings (as currently committed):

- JDBC URL: `jdbc:mysql://localhost:3307/it342_auth...`
- Username: `root`
- Password: empty

If your MySQL uses a different port/credentials, update the properties file accordingly.

### Run

From the repository root:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows (CMD/PowerShell) you can also use:

```bat
cd backend
mvnw.cmd spring-boot:run
```

The app will start on Spring Boot’s default port (typically `8080`) unless configured otherwise.

## Web (React + Vite)

From the repository root:

```bash
cd web
npm install
npm run dev
```

Vite will print the local dev URL in the terminal (typically `http://localhost:5173`).

## Mobile (Android / Jetpack Compose)

1. Open the `mobile/` folder in **Android Studio**.
2. Let Gradle sync.
3. Run the `app` configuration on an emulator or connected device.

## Notes

- The backend includes JWT-related properties (`jwt.secret`, `jwt.expiration`) in `application.properties`.
- If you’re running all modules together, ensure the web/mobile apps point to the correct backend base URL.

