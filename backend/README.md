# Booking Management API

REST API for managing rental units and reservations. Built with Express, TypeScript, and MongoDB.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.8 |
| Framework | Express 5 |
| Database | MongoDB 8 via Mongoose 8 |
| Auth | JWT (access token + refresh token cookie) |
| File storage | AWS S3 with presigned URLs |
| Validation | class-validator + class-transformer |
| Testing | Jest + ts-jest |
| Logging | Winston + daily-rotate-file |
| API docs | Swagger UI (OpenAPI 3.0) |

## Project Structure

```
src/
├── config/          # Environment variable loading and export
├── controllers/     # Request handling, input parsing from query/params
├── dtos/            # Data transfer objects with class-validator decorators
├── exceptions/      # HttpException class
├── interfaces/      # TypeScript interfaces (routes, pagination, auth)
├── middlewares/     # Auth, error handling, validation, multer
├── models/          # Mongoose schemas and interfaces
├── routes/          # Route definitions wiring controllers + middlewares
├── services/        # Business logic, database queries
├── utils/           # S3 helpers, env validation, logger
└── test/            # Unit tests (*.test.ts)
```

## Environment Variables

Create `.env.development.local` in the project root:

```env
NODE_ENV=development
PORT=3000

# MongoDB
MONGO_URI=mongodb://localhost:27017
DB_NAME=booking_db

# AWS S3 (required for image upload)
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# JWT
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Logging
LOG_FORMAT=dev
LOG_DIR=../logs
ORIGIN=*
CREDENTIALS=true
```

Images are stored as S3 keys (not public URLs). A presigned URL (1-hour expiry) is generated on every GET request, so the S3 bucket does not need to be public.

## Running Locally

```bash
npm install
npm run dev       # starts nodemon with hot reload on port 3000
```

Requires a running MongoDB instance. You can start one with Docker:

```bash
docker run -d -p 27017:27017 mongo:8.0
```

## Docker

Start the full stack (API + MongoDB) with a single command:

```bash
docker-compose up --build
```

- API available at `http://localhost:3000`
- MongoDB exposed on host port `27018`
- Source files are volume-mounted for hot reload in dev mode

## Building for Production

```bash
npm run build     # tsc + tsc-alias (resolves path aliases in compiled output)
npm start         # node dist/server.js
```

The multi-stage production Dockerfile is at `Dockerfile.prod`.

## Testing

```bash
npm test              # run all tests
npm run test:watch    # watch mode
```

Tests use Jest with ts-jest. Mongoose models are mocked with `jest.mock()`. AWS S3 utilities are mocked to avoid real network calls.

Current coverage: 30 unit tests across auth, rental-units, and reservations services.

## API Reference

Interactive docs are served at `http://localhost:3000/api-docs` when the server is running.

### Base URL

```
http://localhost:3000/api/v1
```

---

### Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Access tokens expire after **15 minutes**. Use the refresh endpoint to get a new one. The refresh token is stored as an HTTP-only cookie (`refreshToken`, 7-day expiry).

#### Register

```
POST /auth/register
```

```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "secret123"
}
```

Response `201`:
```json
{
  "data": {
    "accessToken": "eyJ...",
    "user": { "_id": "...", "name": "Alice Smith", "email": "alice@example.com" }
  }
}
```

Sets `refreshToken` HTTP-only cookie.

#### Login

```
POST /auth/login
```

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

Response `200`: same shape as register.

#### Refresh Access Token

```
POST /auth/refresh
```

Requires the `refreshToken` cookie (set automatically by login/register). Returns a new `accessToken` in the response body.

#### Logout

```
POST /auth/logout
```

Requires `Authorization: Bearer <accessToken>`. Clears the refresh token from the database and expires the cookie.

#### Get Current User

```
GET /auth/me
```

Requires `Authorization: Bearer <accessToken>`.

Response `200`:
```json
{
  "data": { "_id": "...", "name": "Alice Smith", "email": "alice@example.com" }
}
```

---

### Rental Units

#### List rental units

```
GET /rental-units?page=1&limit=10
```

Response `200`:
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Cozy Apartment",
      "address": "123 Main St",
      "city": "Stockholm",
      "state": "Stockholm County",
      "postalCode": "111 22",
      "pricePerNight": 150,
      "propertyType": "apartment",
      "description": "A bright city-centre flat",
      "imageUrl": "https://your-bucket.s3.amazonaws.com/rental-units/abc.jpg?X-Amz-..."
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

`imageUrl` is a presigned S3 URL (1-hour expiry). It is `null` when no image has been uploaded.

#### Get rental unit by ID

```
GET /rental-units/:id
```

#### Create rental unit

```
POST /rental-units
Content-Type: multipart/form-data
```

| Field | Type | Required |
|---|---|---|
| name | string | yes |
| address | string | yes |
| city | string | yes |
| state | string | yes |
| postalCode | string | yes |
| pricePerNight | number | yes |
| propertyType | enum | yes |
| description | string | no |
| image | file (≤5 MB) | no |

`propertyType` values: `apartment`, `house`, `villa`, `studio`, `condo`, `other`

#### Update rental unit

```
PUT /rental-units/:id
Content-Type: multipart/form-data
```

All fields are optional. Sending a new `image` replaces the existing one.

#### Delete rental unit

```
DELETE /rental-units/:id
```

---

### Reservations

#### List reservations

```
GET /reservations?rentalUnitId=&startDate=&endDate=&page=1&limit=10
```

| Query param | Description |
|---|---|
| `rentalUnitId` | Filter by rental unit (MongoDB ObjectId) |
| `startDate` | ISO date string — include reservations overlapping this date onwards |
| `endDate` | ISO date string — include reservations overlapping up to this date |
| `page` | Page number (default: 1) |
| `limit` | Items per page (default: 10, max: 100) |

Date filtering uses **overlap detection**: a reservation is included if its date range intersects the query window. When both `startDate` and `endDate` are provided, the condition is `reservation.startDate < endDate AND reservation.endDate > startDate`.

Examples:
```
# All reservations for a unit
GET /reservations?rentalUnitId=507f1f77bcf86cd799439011

# Reservations overlapping July 2025
GET /reservations?startDate=2025-07-01&endDate=2025-07-31

# Combined
GET /reservations?rentalUnitId=507f1f77bcf86cd799439011&startDate=2025-07-01&endDate=2025-07-31&page=2&limit=5
```

Response `200`:
```json
{
  "data": [
    {
      "_id": "507f191e810c19729de860ea",
      "rentalUnitId": { "_id": "507f1f77bcf86cd799439011", "name": "Cozy Apartment" },
      "guestName": "Bob Jones",
      "startDate": "2025-07-10T00:00:00.000Z",
      "endDate": "2025-07-17T00:00:00.000Z"
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 10, "totalPages": 1 }
}
```

`rentalUnitId` is populated with the full rental unit object.

#### Get reservation by ID

```
GET /reservations/:id
```

#### Create reservation

```
POST /reservations
Content-Type: application/json
```

```json
{
  "rentalUnitId": "507f1f77bcf86cd799439011",
  "guestName": "Bob Jones",
  "startDate": "2025-07-10",
  "endDate": "2025-07-17"
}
```

Validates that the rental unit exists and that `startDate` is before `endDate`.

#### Update reservation

```
PUT /reservations/:id
Content-Type: application/json
```

All fields are optional.

#### Delete reservation

```
DELETE /reservations/:id
```

---

## Error Responses

All errors follow the same shape:

```json
{ "message": "Description of the error" }
```

| Status | When |
|---|---|
| 400 | Validation failure, invalid date range, invalid ObjectId |
| 401 | Missing or expired access token |
| 404 | Resource not found |
| 409 | Email already registered |
| 500 | Unexpected server error |

## Linting

```bash
npm run lint        # check
npm run lint:fix    # auto-fix
```

ESLint + Prettier rules are enforced via a Husky pre-commit hook (lint-staged).
