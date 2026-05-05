# Booking Management System

A fullstack application for managing rental units and reservations.  
Built as part of a take-home assignment using a modern TypeScript stack.

---

# 🏗️ Architecture Overview

- **Backend**: REST API (Node.js, Express, MongoDB)
- **Frontend**: React SPA (Vite + TypeScript)
- **Auth**: JWT (access token + refresh token)
- **Storage**: AWS S3 (for images)

---

# 📦 Backend – Booking Management API

## Tech Stack

| Layer | Technology |
|------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (Access + Refresh) |
| Validation | class-validator |
| Testing | Jest |
| Docs | Swagger (OpenAPI) |
| Logging | Winston |

---

## Features

- Authentication (register, login, refresh, logout)
- CRUD for rental units
- CRUD for reservations
- Booking conflict detection
- Pagination and filtering
- File upload (AWS S3 with presigned URLs)
- Centralized error handling

---

## Project Structure


src/
├── config/
├── controllers/
├── dtos/
├── exceptions/
├── interfaces/
├── middlewares/
├── models/
├── routes/
├── services/
├── utils/
└── test/


---

## Environment Variables

Create `.env`:


PORT=3000

MONGO_URI=mongodb://localhost:27017
DB_NAME=booking_db

JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret

AWS_REGION=eu-north-1
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret


---

## Running Locally


npm install
npm run dev


---

## Docker Compose (full stack)

From the **repository root**, Compose runs the API, the Vite frontend, and MongoDB together.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2 (`docker compose`)

### Environment file

The API service loads **`backend/.env.development.local`**. Create that file (see [Environment Variables](#environment-variables) above) with at least:

- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Optional: `AWS_*` for S3 image uploads, `OPENAI_API_KEY` for rental suggestions

Compose **overrides** `MONGO_URI` to `mongodb://mongo:27017` so the API talks to the `mongo` service inside the network. You do not need to point `MONGO_URI` at `localhost` for Docker.

### Run

```bash
# From repo root
docker compose up --build
```

On older installs you may use: `docker-compose up --build`.

### URLs & ports

| Service    | URL / port |
|-----------|------------|
| API       | http://localhost:3000 — Swagger at http://localhost:3000/api-docs |
| Frontend  | http://localhost:5173 |
| MongoDB   | `localhost:27018` on the host (maps to 27017 in the container) |

The frontend container sets `VITE_API_URL=http://localhost:3000/api/v1` so the browser calls the API on your machine; Vite uses `VITE_PROXY_TARGET` to forward `/api` traffic to the `api` container during dev.

### Stop and remove containers

```bash
docker compose down
```

To also remove the named volume (MongoDB data):

```bash
docker compose down -v
```

### Backend-only Compose

Under **`backend/`**, a smaller `docker-compose.yml` runs only the API (dev image) and MongoDB for backend-focused work. Use that file’s directory as the Compose project context if you prefer not to start the frontend from the root.

---

## API Base URL


http://localhost:3000/api/v1


---

## Authentication

### Strategy

- Access Token (15 min expiry)
- Refresh Token (7 days, HTTP-only cookie)

### Endpoints


POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /auth/me


---

## Rental Units


GET /rental-units
POST /rental-units
GET /rental-units/:id
PUT /rental-units/:id
DELETE /rental-units/:id


---

## Reservations


GET /reservations
POST /reservations
GET /reservations/:id
PUT /reservations/:id
DELETE /reservations/:id


---

## Booking Conflict Logic

A reservation conflicts if:


existing.startDate < new.endDate
AND
existing.endDate > new.startDate


Returns:


409 Conflict


---

## Pagination & Filtering

Example:


GET /reservations?rentalUnitId=123&startDate=2025-01-01&endDate=2025-01-10&page=1&limit=10


Response:


{
"data": [...],
"meta": {
"page": 1,
"limit": 10,
"total": 50,
"totalPages": 5
}
}


---

## Error Format


{
"error": {
"code": "ERROR_CODE",
"message": "Description"
}
}


---

## Key Design Decisions

- **Reference-based data modeling** for scalability
- **JWT auth** for stateless architecture
- **Conflict detection at service layer**
- **Offset pagination** for simplicity
- **Centralized error handling**

---

## Trade-offs

- MongoDB chosen for speed of development (relational DB better for strict constraints)
- Offset pagination instead of cursor (simpler for assignment)
- Stateless auth (harder token revocation)

---

## Future Improvements

- DB-level locking for booking conflicts
- Cursor-based pagination
- Role-based access control
- Rate limiting

---

# 💻 Frontend – Booking Management Web App

## Tech Stack

| Layer | Technology |
|------|-----------|
| Framework | React |
| Language | TypeScript |
| Build Tool | Vite |
| State | React Query |
| Routing | React Router |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS |
| API | Axios |

---

## Features

- Authentication (login/register/logout)
- View rental units
- View reservations
- Create & edit reservations
- Filtering by date and rental unit
- Pagination
- Booking conflict handling

---

## Project Structure


src/
├── api/
├── components/
├── features/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── types/
└── utils/


---

## Environment Variables


VITE_API_URL=http://localhost:3000/api/v1


---

## Running Locally


npm install
npm run dev


---

## Authentication Flow

- Access token stored in memory
- Refresh token stored in HTTP-only cookie
- Automatic token refresh on 401

---

## API Requests


Authorization: Bearer <accessToken>


Handled via Axios interceptors.

---

## State Management

Uses React Query for:

- caching
- pagination
- background refetching

---

## Forms & Validation

- React Hook Form
- Zod schemas

---

## Booking Conflict Handling

If API returns:


409 BOOKING_CONFLICT


UI:
- Displays error message
- Prevents submission

---

## Pagination & Filtering


GET /reservations?page=1&limit=10&rentalUnitId=&startDate=&endDate=


---

## Error Handling

- 401 → refresh token
- 400 → validation errors
- 409 → conflict message
- 500 → fallback UI

---

## UI Notes

- Minimal UI for clarity
- Focus on functionality over design
- Simple forms and lists

---

## Key Design Decisions

- React Query for server state
- In-memory token storage (security)
- Backend-driven validation
- Simple component structure

---

## Trade-offs

- No global state library (kept simple)
- Minimal styling
- No optimistic updates

---

## Future Improvements

- Calendar booking UI
- Better UX feedback
- Mobile responsiveness
- Offline support

---

# 🚀 Final Notes

This project focuses on:

- clean API design
- real-world authentication strategy
- handling edge cases (booking conflicts)
- scalability considerations
- clear separation of concerns

The implementation prioritizes **clarity, correctness, and practical trade-offs** within a limited timeframe.