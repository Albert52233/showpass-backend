# ShowPass Backend

A **fresh implementation / MVP**, not a byte-for-byte recreation of the earlier screenshot project.

## Included
- Spring Boot 3 / Java 21 / Maven
- MongoDB persistence for users, venues, events, and orders
- JWT register/login (BCrypt passwords, 2-hour HS256 access tokens)
- Venue and event CRUD subset; event lifecycle and date validation
- Atomic inventory decrement when creating orders
- Mock payment confirmation and pending-order cancellation
- Redis dependency configured for future hold/queue features, **not yet used**
- Tests for event lifecycle and dates; GitHub Actions CI

## Run locally

1. Install JDK 21, Maven 3.9+, and Docker Compose.
2. `docker compose up -d`
3. Set a random secret: `export JWT_SECRET="$(openssl rand -hex 32)"`
4. `mvn spring-boot:run`
5. Check `http://localhost:3000/actuator/health`.

## Authentication
Register with `POST /api/auth/register` and JSON `{ "email":"test@example.com", "password":"password123" }`.
Use the returned token as `Authorization: Bearer <token>` for writes.

## API routes
| Method | Route | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/venues`, `/api/venues/{id}` | public |
| POST | `/api/venues` | authenticated |
| GET | `/api/events`, `/api/events/{id}` | public |
| POST | `/api/events` | authenticated |
| PATCH | `/api/events/{id}/status`, `/api/events/{id}/dates` | organizer |
| POST | `/api/orders` | authenticated |
| GET | `/api/orders`, `/api/orders/{id}` | owner |
| POST | `/api/orders/{id}/mock-pay`, `/api/orders/{id}/cancel` | owner |

Event status: `DRAFT -> PUBLISHED -> ON_SALE -> (SOLD_OUT | COMPLETED | CANCELLED)`; `SOLD_OUT` may return to `ON_SALE` or go to `COMPLETED` / `CANCELLED`.
Dates in JSON are ISO 8601 UTC strings (example `2027-01-01T19:00:00Z`).

## Important MVP limitations
**Not production ready.** Mock payment does not charge a card. Orders do not expire. Reservation and payment are not a distributed transaction; order-save failure compensation is best effort. Inventory is decremented atomically but order state transitions are not atomic, so concurrent duplicate payment/cancellation requests require idempotency/compare-and-set hardening. `GET /api/orders` uses in-memory filtering, suitable only for a demo. Mongo indexes, rate limiting, admin roles, real payment gateway, refunds, redis holds, promo codes, transfers, seat maps, observability, JWT rotation and full integration/security tests are future work.

Do not use with real money or production ticket inventory without addressing these issues.
