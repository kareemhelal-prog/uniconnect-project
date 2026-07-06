# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UniConnect is a full-stack academic social media platform. The repo is a monorepo with two independent apps:

- `client/` — React 19 + Vite frontend
- `server/` — Node.js + Express REST API backed by MySQL

There is no shared package.json at the root. Commands must be run inside `client/` or `server/` separately.

## Running the Project

**Prerequisites:** Node.js 18+, MySQL 8+ (XAMPP on Windows: start `C:\xampp\mysql\bin\mysqld.exe`).

**Database (one-time setup):**
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS uniconnect;"
mysql -u root uniconnect < server/database/uniconnect.sql
```

**Backend:**
```bash
cd server
npm install
npm run dev        # nodemon → http://localhost:5000
# or
npm start          # node server.js (no auto-restart)
```

**Frontend:**
```bash
cd client
npm install
npm run dev        # Vite → http://localhost:5173
npm run build      # production build
npm run preview    # preview production build
```

**Health check:** `GET http://localhost:5000/health`

## Environment Variables

`server/.env` is required and excluded from git. Minimum required:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=uniconnect
DB_PORT=3306

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## Architecture

### Frontend (`client/`)

- **Routing:** `src/App.jsx` — single `BrowserRouter` with all routes. `PrivateRoute` wraps protected pages, checking for a JWT in `localStorage`.
- **Auth flow:** Token is stored in `localStorage` as `token`. All API calls attach it automatically via the Axios interceptor in `src/api/axios.js`.
- **API client:** `src/api/axios.js` exports a pre-configured Axios instance with `baseURL: http://localhost:5000/api` and auto-injected `Authorization: Bearer <token>` header. Import as `import api from '../api/axios'` — never use raw `fetch` or `axios` directly.
- **Role-based pages:** There are separate home pages per role (`Home.jsx` for students/investors, `HomeDoctor.jsx` for doctors). After login the backend returns `user.role`; the frontend uses this to redirect.
- **Styles:** Each page/component has a co-located CSS file in `src/styles/`. No CSS-in-JS, no Tailwind — plain CSS Modules pattern.
- **Vite proxy:** `/api` requests are proxied to `localhost:5000` in dev (`vite.config.js`), so `api.get('/posts')` hits `http://localhost:5000/api/posts`.

### Backend (`server/`)

**Request lifecycle:** `server.js` → Express middleware (CORS, Helmet, JSON body parser) → route file → `authenticateToken` middleware (JWT verify, sets `req.user`) → optional `roleMiddleware` or `adminMiddleware` → controller → `promisePool` (MySQL).

**Auth middleware stack:**
- `middleware/authMiddleware.js` — `authenticateToken`: verifies JWT, attaches `{ id, email, role }` to `req.user`. Used on all protected routes.
- `middleware/rolemiddleware.js` — `roleMiddleware(roles[])`: checks `req.user.role` is in allowed list. Usage: `router.use(roleMiddleware('admin'))`.
- `middleware/adminMiddleware.js` — shorthand admin-only guard.

**Database access:** All DB calls use `promisePool` from `config/db.js` (mysql2 promise pool). Controllers destructure it as `const { promisePool } = require('../config/db')`. Always use parameterized queries (`?` placeholders) — never string interpolation.

**File uploads:** Multer is configured in `routes/fileRoutes.js` (not in the controller). Files land in `server/uploads/files/`. Path traversal protection is in `fileController.js` — always validate that the resolved path starts with the `uploads/files/` absolute path before serving.

**Notifications:** Written directly by controllers (e.g. `likeController`, `followController`) by inserting into the `Notifications` table. There is no notification service layer — controllers are responsible for creating notifications as a side-effect.

**Validation helpers:** `utils/validation.js` exports `validateEmail`, `validatePassword`, `validateUsername`, `validatePagination`, `sanitizeString`, `validateFileType`. Use these instead of ad-hoc checks.

### Database Schema Key Points

- `Users.role` is an ENUM: `student | admin | investor | doctor`.
- Each role has a dedicated profile table: `Profile_Studies` (students), `Doctor_Profiles`, `Investor_Profiles`. Created in a transaction during registration.
- `Users.profile_picture` stores base64 or a file path as `MEDIUMTEXT` (see `db.js` schema migration).
- `password_resets` table drives the OTP forgot-password flow — OTPs expire after 10 minutes and are marked `is_used = TRUE` after verification.
- All foreign keys use `ON DELETE CASCADE`.

## Key Patterns

**Adding a new protected API route:**
1. Create/update a route file in `server/routes/`.
2. Add `router.use(authenticateToken)` at the top of the router (or per-route).
3. Register the router in `server.js` under `/api/<name>`.

**Role-restricted endpoints:** Chain `roleMiddleware(['doctor', 'admin'])` after `authenticateToken`.

**Frontend page guard:** Wrap the `<Route>` element in `<PrivateRoute>` in `App.jsx`.

**The `name` field on Users:** The `Users` table has both `name` (display name) and `username` (unique handle). The register controller defaults `name` to `username` if the frontend doesn't send a separate `name` field — this is intentional since the register form only collects `username`.
