# Booking Management Web App

A simple React-based web application for managing rental units and reservations. Built to consume the Booking Management API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| State Management | React Query (TanStack Query) |
| Routing | React Router |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS |
| API Client | Axios |
| Auth | JWT (access token + refresh via cookie) |

---

## Features

- 🔐 Authentication (login, register, logout)
- 🏠 View rental units
- 📅 View reservations
- ➕ Create and edit reservations
- 🔎 Filter reservations by date and rental unit
- 📄 Pagination for large datasets
- ⚠️ Error handling (including booking conflicts)

---

## Project Structure
src/
├── api/ # Axios instance + API functions
├── components/ # Reusable UI components
├── features/
│ ├── auth/ # Login, register, auth hooks
│ ├── rentals/ # Rental unit pages + components
│ └── reservations/ # Reservation pages + forms
├── hooks/ # Custom hooks (e.g. useAuth)
├── layouts/ # App layout (navbar, etc.)
├── pages/ # Route-level pages
├── routes/ # React Router configuration
├── types/ # TypeScript types/interfaces
├── utils/ # Helpers (date formatting, etc.)
└── main.tsx # App entry point


---

## Environment Variables

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
Running Locally
npm install
npm run dev

App runs on:

http://localhost:5173
Authentication Flow
Overview
Access token stored in memory (React state)
Refresh token stored in HTTP-only cookie (handled by backend)
Silent token refresh on app load and 401 responses
Login / Register
On success:
store accessToken in memory
backend sets refreshToken cookie automatically
API Requests

All authenticated requests include:

Authorization: Bearer <accessToken>

Handled automatically via Axios interceptor.

Token Refresh
If a request returns 401:
call /auth/refresh
retry original request