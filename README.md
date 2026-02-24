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

## Routing note

The frontend includes a navigation bar and a route for `/alerts` (Alert management), `/metrics` (Metric ingestion), and `/events` (Event viewer). If you see a route mismatch, ensure `frontend/src/App.js` includes the new routes and that the dev server is restarted after edits.

## Minimal API reference

- `POST /alerts` — create alert (returns 201)
- `GET /alerts` — list alerts
- `DELETE /alerts/:id` — delete alert
- `POST /metrics` — ingest metric
- `GET /alert-events` — list events with `metricName`, `page`, `limit`, `start`, `end` filters


<br>
Login

<img width="1919" height="628" alt="Screenshot 2026-02-24 091208" src="https://github.com/user-attachments/assets/5b958d5e-ddb7-481a-9247-f03bdfa4a201" />

<br><br>

Register

<img width="1919" height="793" alt="Screenshot 2026-02-24 091237" src="https://github.com/user-attachments/assets/71dde0bf-936c-4476-8ea8-3ceda373ca6e" />

<br><br>
Error Handling

<img width="1919" height="624" alt="Screenshot 2026-02-24 092732" src="https://github.com/user-attachments/assets/1c265e40-2244-4771-aeea-e79356ddb833" />

<br><br>

Error Handling

<img width="1919" height="780" alt="Screenshot 2026-02-24 091448" src="https://github.com/user-attachments/assets/3ec0dc92-b792-479a-b717-c7e6beb733c8" />

<br><br>
Alert Management

<img width="1919" height="1142" alt="Screenshot 2026-02-24 091256" src="https://github.com/user-attachments/assets/8a91c60b-bfd5-4777-8c0d-d5726feb6ae4" />

<br><br>
Comparator

<img width="1919" height="584" alt="Screenshot 2026-02-23 223141" src="https://github.com/user-attachments/assets/2fe78a14-5a21-454d-930d-d95295dfb783" />

<br><br>
Send Metric

<img width="1919" height="611" alt="Screenshot 2026-02-24 092354" src="https://github.com/user-attachments/assets/aff821da-8d4d-4bef-bb0a-1aa0ee83582d" />

<br><br>
Alert events

<img width="1919" height="1142" alt="Screenshot 2026-02-24 092509" src="https://github.com/user-attachments/assets/5897a00e-dc57-4fce-8ad3-7bbf40cffbe3" />

<br><br>
Page size 

<img width="1919" height="490" alt="Screenshot 2026-02-23 222641" src="https://github.com/user-attachments/assets/9685a648-48fd-4daf-9185-7ee2cbceff70" />

<br><br>
Start - End Date 

<img width="1919" height="741" alt="Screenshot 2026-02-23 222655" src="https://github.com/user-attachments/assets/a693b932-daca-4352-b90c-c86740e59d9a" />

<br><br>

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
- No authentication is included in the MVP; add JWT and per‑user isolation for multi‑tenant needs.

## What I'd do next

- Testing: Add Jest unit and integration tests for evaluator and controllers.
- Scalability: Introduce Redis + Bull for async processing to decouple ingestion from evaluation.
- Security: Add authentication and per‑user/organization isolation.
- Observability: Add structured logging (winston or pino) and error reporting (Sentry).
- Infrastructure: Dockerize services and provide docker‑compose for local demo.

## Verification checklist

- Start backend and frontend, create an alert, send a metric that breaches the threshold, confirm event appears in Events page and in `alertevents` collection; verify cooldown behavior.

## Where to look in the code

- Backend: [backend/server.js](backend/server.js), [backend/controllers](backend/controllers), [backend/services/evaluator.js](backend/services/evaluator.js), [backend/models](backend/models), [backend/services/socket.js](backend/services/socket.js)
- Frontend: [frontend/src/pages](frontend/src/pages), [frontend/src/services/api.js](frontend/src/services/api.js)

## Troubleshooting

- If backend fails to start with EADDRINUSE, another process is using `PORT` — stop the process or change `PORT` in `backend/.env`.
- If frontend shows stale env values, restart the dev server after changing `frontend/.env`.
- Enable debug logging by setting `DEBUG=true` in `backend/.env` and check server logs.

## Contact

For questions, open an issue with reproduction steps or contact the me via repository issues.

