# Real‑Time Metric Alerting Platform

A concise full‑stack alerting application that lets users define alert rules, ingest metrics, evaluate rules, persist alert events, and view events in real time. Built with Node.js/Express, MongoDB, React and Socket.IO.

## Quick start

Prerequisites: Node.js 16+, npm, MongoDB (local or Atlas- I have did it on local).

### Backend

```bash
cd backend
npm install
# create .env (see .env.example or SETUP.md)
npm run dev    # or npm start
```

Recommended backend `.env` values:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/alerts_db
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Frontend

```bash
cd frontend
npm install
# optionally create frontend/.env with REACT_APP_API_URL and REACT_APP_SOCKET_URL
npm start
```

Defaults: frontend http://localhost:3000, backend http://localhost:5000

Note: If you change environment variables, restart the frontend dev server — CRA reads env at start.

## What this delivers

- Alert management: create, list, delete alerts. Fields: `metricName`, `threshold`, `comparator`, `message`, `cooldownSeconds`.
- Metric ingestion: `POST /metrics` accepts `{metricName, value, timestamp}` and runs evaluation.
- Alert evaluation: supports `GT`, `GTE`, `LT`, `LTE`, `EQ`; per‑alert cooldown prevents duplicate events.
- Alert events: persisted in MongoDB and exposed via `GET /alert-events` (pagination, filters).
- Real‑time updates: server emits `alert_event` via Socket.IO; frontend subscribes and prepends events.
- **Authentication**: JWT-based authentication with user registration and login. All API endpoints (except auth) require a valid token.

See [AUTHENTICATION.md](AUTHENTICATION.md) for detailed auth setup and API documentation.

## Routing note

The frontend includes a navigation bar and a route for `/alerts` (Alert management), `/metrics` (Metric ingestion), and `/events` (Event viewer). If you see a route mismatch, ensure `frontend/src/App.js` includes the new routes and that the dev server is restarted after edits.

## Minimal API reference

- `POST /alerts` — create alert (returns 201)
- `GET /alerts` — list alerts
- `DELETE /alerts/:id` — delete alert
- `POST /metrics` — ingest metric
- `GET /alert-events` — list events with `metricName`, `page`, `limit`, `start`, `end` filters


<img width="1919" height="628" alt="Screenshot 2026-02-24 091208" src="https://github.com/user-attachments/assets/a3023013-390e-4210-9d31-18df7ec00065" />

<img width="1919" height="793" alt="Screenshot 2026-02-24 091237" src="https://github.com/user-attachments/assets/a9536781-abb9-4ff9-b706-4ebf90d12957" />

<img width="1919" height="483" alt="Screenshot 2026-02-24 091406" src="https://github.com/user-attachments/assets/3568b803-7e93-48c0-ad66-ed1314a562b9" />

<img width="1919" height="584" alt="Screenshot 2026-02-23 223141" src="https://github.com/user-attachments/assets/8680c4b7-bf85-4cac-8794-d2e9b0873aee" />

<img width="1919" height="780" alt="Screenshot 2026-02-24 091448" src="https://github.com/user-attachments/assets/672db8b1-fc56-4a8e-a227-b495464aa6c6" />

<img width="1919" height="1142" alt="Screenshot 2026-02-24 091256" src="https://github.com/user-attachments/assets/deee3d87-ada2-4058-a742-d2c002d74ce3" />

<img width="1919" height="595" alt="Screenshot 2026-02-24 091313" src="https://github.com/user-attachments/assets/7330ed8d-3d14-482c-9be8-bf53519fca45" />

<img width="1919" height="540" alt="Screenshot 2026-02-24 091324" src="https://github.com/user-attachments/assets/f1d29bc6-6db3-4023-988a-abb1b23a4844" />

<img width="1919" height="611" alt="Screenshot 2026-02-24 092354" src="https://github.com/user-attachments/assets/584a1995-38d4-47f6-8d3a-a639b1aabace" />

<img width="1919" height="1142" alt="Screenshot 2026-02-24 092509" src="https://github.com/user-attachments/assets/cd99b4a2-2e58-4ea0-85fa-1afa73b43f4d" />

<img width="1919" height="490" alt="Screenshot 2026-02-23 222641" src="https://github.com/user-attachments/assets/93e8e9bd-d3a2-4b77-ae68-2b3c689455c4" />

<img width="1919" height="741" alt="Screenshot 2026-02-23 222655" src="https://github.com/user-attachments/assets/1e1bfab4-34b5-434a-a2a3-c93cbe47746b" />



## Architecture (summary)

Frontend (React SPA) ↔ Backend (Express + Socket.IO) ↔ MongoDB

- Frontend: AlertPage, MetricPage, EventPage; uses Axios and socket.io-client.
- Backend: routes → controllers → services; `evaluator.js` contains comparator and cooldown logic; `socket.js` manages Socket.IO.
- Database: collections `alerts` and `alertevents` with indexes on `metricName` and `timestamp`.

### Data flow (high level)
1. User creates alert → saved to MongoDB.
2. Metric POST → backend validates and calls evaluator.
3. Evaluator loads alerts for metric, applies cooldown and comparator.
4. On trigger: create AlertEvent, update alert.lastTriggered, emit `alert_event`.

## Key design assumptions

- Alerts fire on each breach but may be suppressed within a per‑alert `cooldownSeconds` window.
- Evaluation is synchronous in this implementation (simple, immediate). For high throughput, use a message queue and background workers.
- Raw metric retention is out of scope; only triggered AlertEvents are stored.
- **Authentication**: JWT-based authentication is implemented. Users must register and login. All API endpoints (except `/auth/*`) require a valid Bearer token.

## Implementation highlights

**Completed:**
- JWT-based authentication with user registration and login
- Password hashing with bcryptjs (10 salt rounds)
- Protected routes with Bearer token verification
- Comprehensive error handling and validation
- Structured logging throughout backend
- Real-time Socket.IO event broadcasts
- Pagination & filtering on alert events
- Per-alert cooldown mechanism to prevent alert fatigue

## What I'd do next

- Testing: Add Jest unit and integration tests for evaluator and controllers; integration tests for auth flow.
- Per-user isolation: Automatically filter alerts/events by authenticated user (multi-tenant).
- Scalability: Introduce Redis + Bull for async processing to decouple ingestion from evaluation.
- Rate limiting: Add rate limiting to `/auth/*` and `/metrics` endpoints.
- Observability: Add structured logging (winston), error reporting (Sentry), and metrics.
- Infrastructure: Dockerize services and provide docker-compose for local/production deployment.
- Enhanced security: Implement refresh tokens, 2FA, OAuth integrations.

## Verification checklist

- Start backend and frontend, create an alert, send a metric that breaches the threshold, confirm event appears in Events page and in `alertevents` collection; verify cooldown behavior.

## Where to look in the code

**Authentication:**
- Backend: [backend/models/User.js](backend/models/User.js), [backend/controllers/authController.js](backend/controllers/authController.js), [backend/middleware/auth.js](backend/middleware/auth.js), [backend/routes/authRoutes.js](backend/routes/authRoutes.js)
- Frontend: [frontend/src/services/authService.js](frontend/src/services/authService.js), [frontend/src/pages/LoginPage.js](frontend/src/pages/LoginPage.js), [frontend/src/pages/RegisterPage.js](frontend/src/pages/RegisterPage.js), [frontend/src/components/ProtectedRoute.js](frontend/src/components/ProtectedRoute.js)

**Core features:**
- Backend: [backend/server.js](backend/server.js), [backend/controllers](backend/controllers), [backend/services/evaluator.js](backend/services/evaluator.js), [backend/models](backend/models), [backend/services/socket.js](backend/services/socket.js)
- Frontend: [frontend/src/pages](frontend/src/pages), [frontend/src/services/api.js](frontend/src/services/api.js)

**Documentation:**
- [AUTHENTICATION.md](AUTHENTICATION.md) — Detailed authentication setup, API reference, and security notes
- [INTERVIEW.md](INTERVIEW.md) — Project overview for technical interviews and hiring discussions

## Troubleshooting

- If backend fails to start with EADDRINUSE, another process is using `PORT` — stop the process or change `PORT` in `backend/.env`.
- If frontend shows stale env values, restart the dev server after changing `frontend/.env`.
- Enable debug logging by setting `DEBUG=true` in `backend/.env` and check server logs.

## Contact

For questions, open an issue with reproduction steps or contact the me via repository issues.

