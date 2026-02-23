# Real-Time Metric Alerting Platform

A concise full-stack alerting application that lets users define alert rules, ingest metrics, evaluate rules, persist alert events, and view events in real time. Built with Node.js/Express, MongoDB, React and Socket.IO.

## Quick start

Prerequisites: Node.js 16+, npm, MongoDB (local or Atlas).

### 1. Backend

```bash
cd backend
npm install
# create .env (see .env.example)
npm run dev    # or npm start
```

Recommended backend .env values:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/alerts_db
ALLOWED_ORIGINS=http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
# optional: create .env with REACT_APP_API_URL
npm start
```

Frontend default: http://localhost:3000 | Backend default: http://localhost:5000

## What this delivers

- **Alert management**: create, list, delete alerts. Fields: `metricName`, `threshold`, `comparator`, `message`, `cooldownSeconds`.
- **Metric ingestion**: `POST /metrics` accepts `{metricName, value, timestamp}` and runs evaluation.
- **Alert evaluation**: supports `GT`, `GTE`, `LT`, `LTE`, `EQ`; per-alert cooldown prevents duplicate events.
- **Alert events**: persisted in MongoDB and exposed via `GET /alert-events` (pagination, filters).
- **Real-time updates**: server emits `alert_event` via Socket.IO; frontend subscribes and prepends events.

## Minimal API reference

- `POST /alerts` — create alert (returns 201)
- `GET /alerts` — list alerts
- `DELETE /alerts/:id` — delete alert
- `POST /metrics` — ingest metric
- `GET /alert-events` — list events with `metricName`, `page`, `limit`, `start`, `end` filters

## Architecture (summary)

Frontend (React SPA) ↔ Backend (Express + Socket.IO) ↔ MongoDB

- **Frontend**: AlertPage, MetricPage, EventPage; uses Axios and socket.io-client.
- **Backend**: routes → controllers → services; `evaluator.js` contains comparator and cooldown logic; `socket.js` manages Socket.IO.
- **Database**: collections `alerts` and `alertevents` with indexes on `metricName` and `timestamp`.

### Data flow (high level)
1. User creates alert → saved to MongoDB.
2. Metric POST → backend validates and calls evaluator.
3. Evaluator loads alerts for metric, applies cooldown and comparator.
4. On trigger: create AlertEvent, update alert.lastTriggered, emit `alert_event`.

## Key design assumptions

- Alerts fire on each breach but may be suppressed within a per-alert `cooldownSeconds` window.
- Evaluation is synchronous in this implementation (simple, immediate). For high throughput, use a message queue and background workers.
- Raw metric retention is out of scope; only triggered AlertEvents are stored.
- No authentication is included in the MVP; add JWT and per-user isolation for multi-tenant needs.

## What I'd do next

Priority items to harden and scale the project:
- **Testing**: Add Jest unit and integration tests for evaluator and controllers.
- **Scalability**: Introduce Redis + Bull for async processing to decouple ingestion from evaluation.
- **Security**: Implement Jest/JWT auth and per-user/organization isolation.
- **Observability**: Add structured logging (winston or pino) and error reporting (Sentry).
- **Infrastructure**: Dockerize services and provide docker-compose for local demo.
- **High availability**: For multi-instance Socket.IO, add Redis adapter for event broadcasting.

## Verification checklist

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm start`
3. Create an alert with metricName="cpu", threshold=80, comparator="GT"
4. Send metric: `curl -X POST http://localhost:5000/metrics -H "Content-Type: application/json" -d '{"metricName":"cpu","value":85}'`
5. Verify alert event appears in Events page and in MongoDB `alertevents` collection
6. Verify cooldown: send another metric within cooldown window and confirm no duplicate event

## Code structure

- **Backend**: [server.js](backend/server.js), [controllers/](backend/controllers/), [services/evaluator.js](backend/services/evaluator.js), [models/](backend/models/), [services/socket.js](backend/services/socket.js)
- **Frontend**: [pages/](frontend/src/pages/), [services/api.js](frontend/src/services/api.js)
- **Database**: MongoDB with indexes on metricName and timestamp for query performance

## Contact & Support

For questions or issues, please open a GitHub issue with steps to reproduce.
