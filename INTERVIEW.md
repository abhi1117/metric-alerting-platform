# Metric Alerting Platform - Interview Overview

## Project Summary

This is a **full-stack real-time metric alerting platform** that demonstrates modern web development practices, system design thinking, and production-ready considerations. The system allows users to define alert rules on metrics, ingest metric data, evaluate alerts, and receive real-time notifications when thresholds are breached.

**Tech Stack**: Node.js/Express, MongoDB, React, Socket.IO, JWT  
**Deployment**: Runs locally; can be deployed to cloud platforms (AWS, Heroku)

---

## Problem Statement

Modern systems generate continuous metric data (CPU, memory, latency, error rates). DevOps teams need a way to:
1. Define alert rules with flexible conditions
2. Ingest metrics continuously
3. Evaluate metrics against rules in near-real-time
4. Persist alert history for audit/analysis
5. Get instant notifications when alerts trigger

This project is a simplified but production-aware solution to that problem.

---

## System Architecture

```
Frontend (React SPA)
    ↓ (HTTP + WebSocket)
Backend (Express Server)
    ↓
MongoDB Database
```

### Component Breakdown

#### **Frontend (React)**
- **LoginPage**: User authentication entry point
- **RegisterPage**: New user registration
- **AlertPage**: Create, view, delete alert rules
- **MetricPage**: Simulate/ingest metric data
- **EventPage**: View triggered alerts with filters, pagination, real-time updates
- **ProtectedRoute**: Wrapper component to enforce authentication
- **AuthService**: Centralized auth logic (JWT token management)
- **API Client**: Axios with interceptors (auto-attach token, handle 401s)

#### **Backend (Express + Node.js)**
- **User Model**: Stores username, email, hashed password (bcryptjs)
- **Alert Model**: Metric name, threshold, comparator, cooldown
- **AlertEvent Model**: Triggered alerts with metadata
- **Evaluator Service**: Core logic—compares metrics against rules, enforces cooldown
- **Auth Middleware**: Verifies JWT tokens on protected endpoints
- **Socket.IO Service**: Broadcasts real-time alert events to connected clients
- **Logger Utility**: Structured logging for debugging and monitoring

#### **Database (MongoDB)**
- **users collection**: Username, email, hashed password
- **alerts collection**: User's alert rules with indexes on `metricName`, `_id`
- **alertevents collection**: Triggered events with indexes on `timestamp`, `metricName`

---

## Key Design Decisions & Justifications

### 1. **JWT Authentication**
**Why?** Stateless, scalable, standard in modern APIs  
**Trade-off**: Tokens stored in localStorage vulnerable to XSS; in production, use httpOnly cookies  
**How**: 
- Tokens expire in 7 days
- Middleware verifies on every protected request
- 401 responses trigger auto-redirect to login

### 2. **Synchronous Metric Evaluation**
**Why?** Simple MVP, immediate feedback, no external dependencies  
**Trade-off**: At high throughput (1000+ metrics/sec), evaluator becomes bottleneck  
**Solution for scale**: Redis + Bull queue to decouple ingestion from evaluation  

### 3. **Per-Alert Cooldown (Not Per-Metric)**
**Why?** Prevents alert fatigue—users get notified once per cooldown period, even if metric stays breached  
**Example**: If threshold breached at T=0s and cooldown=60s, next alert won't fire until T=61s  
**Alternative**: Could implement smart thresholds or change detection instead

### 4. **WebSocket Real-Time (Socket.IO)**
**Why?** Instant user feedback without constant polling  
**Trade-off**: Stateful connections; harder to scale horizontally (needs sticky sessions or Redis adapter)  
**Benefit**: <100ms latency for alert notifications

### 5. **Single MongoDB Collection for Events**
**Why?** Simple for MVP; indexes on `timestamp` + `metricName` handle queries efficiently  
**Trade-off**: No time-based data retention; events grow unbounded  
**Solution for production**: TTL index (`expireAfterSeconds`) to auto-delete old events

### 6. **No User-Alert Isolation in Evaluation Loop**
**Why?** MVP scope; all users' alerts evaluated on every metric  
**Trade-off**: Not multi-tenant; all users see each other's alerts (bad practice)  
**Fix**: Modify evaluator to filter by currently-authenticated user

---

## Code Quality Highlights

### Error Handling
- Validation at controller layer (input validation)
- Try-catch blocks with detailed error logging
- Meaningful HTTP status codes (400, 401, 404, 500)
- Structured error responses with context

### Logging
```javascript
logger.info("Alert created", { alertId, userId, metricName });
logger.error("Metric evaluation failed", error);
logger.debug("Token verified", { userId, endpoint });
```
Helps with debugging, monitoring, compliance

### Separation of Concerns
- Routes handle HTTP (routing, status codes)
- Controllers handle business logic (validation, orchestration)
- Services handle core logic (evaluation, auth)
- Models define data structure (schemas)
- Middleware handles cross-cutting concerns (auth, logging)

### API Design
RESTful with clear semantics:
```
POST   /auth/register        — Create new user
POST   /auth/login           — Authenticate user
POST   /alerts               — Create alert rule
GET    /alerts               — List rules
DELETE /alerts/:id           — Delete rule
POST   /metrics              — Ingest metric, trigger evaluation
GET    /alert-events         — List triggered events (paginated, filtered)
```

---

## Challenges Overcome

### 1. **Mongoose Async/Await Hook Issue**
**Problem**: Pre-save hook using `next()` callback with `async/await` caused "next is not a function" error  
**Solution**: Removed callback parameter; relied on Promise rejection for error handling

### 2. **Real-Time Client Sync**
**Problem**: If metrics arrive faster than Socket.IO broadcasts, clients miss events  
**Current solution**: Fetch from API after connect; WebSocket for incremental updates  
**Better solution**: Event sourcing or message replay

### 3. **Cooldown Window Race Condition**
**Problem**: Multiple metrics arriving within cooldown period could trigger duplicate alerts  
**Solution**: Atomic database update of `lastTriggered`; re-check cooldown before saving event

---

## Production Readiness Checklist

| Item | Status | Notes |
|------|--------|-------|
| User authentication | Done | JWT-based, password hashed |
| Input validation | Done | Controller-level validation |
| Error handling | Done | Structured errors with context |
| Logging | Done | Structured logs for debugging |
| API documentation | Done | AUTHENTICATION.md, inline comments |
| Database indexes | Done | On `metricName`, `timestamp` |
| CORS configuration | Done | Configurable via env |
| Environment variables | Done | `.env.example` provided |
| Rate limiting | Missing | Important for `/auth/*`, `/metrics` |
| Unit tests | Missing | Would add 30-40% code coverage |
| Docker | Missing | Would help with reproducibility |
| Multi-user isolation | Missing | Evaluator doesn't filter by user |
| Refresh tokens | Missing | Tokens never refresh; stale data risk |
| Data retention policy | Missing | Events grow indefinitely |

---

## Testing Strategy (What I'd Add)

### Unit Tests
```javascript
// Evaluator logic
test('GT comparator triggers when value > threshold')
test('Cooldown prevents duplicate alerts within window')
test('Invalid comparator returns false')

// Auth
test('Register hashes password before saving')
test('Login rejects wrong password')
test('Middleware rejects missing token')
```

### Integration Tests
```javascript
// End-to-end flow
test('User registers → creates alert → sends metric → gets event')
test('Socket.IO broadcasts event to connected clients')
test('Pagination returns correct page and meta')
```

### E2E Tests (Playwright/Cypress)
```javascript
// User journey
test('User can register, login, create alert, trigger it')
test('Real-time event appears in Events page without refresh')
```

---

## Scalability Roadmap

### Current State: ~100 alerts, ~1000 metrics/minute
- Synchronous evaluation
- Adequate for small teams

### Scale to: ~5000 metrics/minute
**Changes needed:**
1. Add Redis + Bull for async metric queue
2. Move evaluator to background worker
3. Implement rate limiting on `/metrics` endpoint
4. Cache alert list in Redis (5min TTL)

### Scale to: ~50k metrics/minute
**Additional changes:**
1. Database sharding by metricName
2. Multi-process evaluators (cluster mode)
3. WebSocket scaling with Redis pub/sub
4. API Gateway with auto-scaling

### Scale to: Multi-region
1. Global database replication
2. CDN for frontend
3. Regional backend instances

---

## Security Considerations

### Current Vulnerabilities 
1. **Tokens in localStorage**: XSS attacks can steal tokens → fix: httpOnly cookies
2. **No HTTPS**: MITM attacks → fix: enforce HTTPS in production
3. **No rate limiting**: Brute force attacks on `/auth/login` → fix: add rate limiter
4. **No CSRF protection**: Cross-site request forgery → fix: CSRF tokens
5. **No input sanitization**: Injection attacks → fix: use parameterized queries (Mongoose does this)
6. **All users see all alerts**: Data leakage → fix: filter by user ID

### Mitigations Implemented 
- Password hashing (bcryptjs)
- JWT token expiration
- Secure error messages (no stack traces to clients)
- CORS restricted to known origins
- Input validation on all endpoints

---

## Interview Questions You Might Get

### Q: "How would you prevent alert fatigue?"
**Answer**: Implement cooldown windows per alert. Once triggered, don't re-fire within N seconds even if metric stays breached. This is implemented in the code.

### Q: "What happens if the evaluator hangs?"
**Answer**: Current implementation is synchronous, so the HTTP request would timeout. In production, move to async queue so ingestion never blocks. Implement timeouts explicitly.

### Q: "How do you scale this to 1M metrics/minute?"
**Answer**:
1. Move evaluation to background workers (Bull + Redis)
2. Batch metric ingestion (collect 100 metrics, evaluate, save)
3. Shard database by metricName
4. Cache hot alerts in Redis
5. Use CDN for frontend static assets

### Q: "How do you prevent duplicate alerts?"
**Answer**: Each alert has `lastTriggered` timestamp. Before creating event, check if `now - lastTriggered < cooldownSeconds`. This is atomic because MongoDB's `findByIdAndUpdate` is atomic.

### Q: "What if a user deletes an alert while events are being created?"
**Answer**: Could have orphaned events. Fix: Soft delete alerts (add `deletedAt` field), filter deleted alerts in queries, run cleanup job.

### Q: "How do you handle timezone issues?"
**Answer**: Store all timestamps as UTC in database. Let frontend handle display in user's timezone via Date.toLocaleString().

---

## Key Files to Review During Interview

**Critical (15 min read):**
1. [backend/server.js](backend/server.js) — Entry point, middleware setup
2. [backend/services/evaluator.js](backend/services/evaluator.js) — Core alert logic
3. [backend/controllers/authController.js](backend/controllers/authController.js) — Auth flow
4. [frontend/src/App.js](frontend/src/App.js) — Routing, protected routes

**Supporting (10 min read):**
1. [backend/models/User.js](backend/models/User.js) — Password hashing pre-hook
2. [frontend/src/services/authService.js](frontend/src/services/authService.js) — Token management
3. [backend/routes/alertRoutes.js](backend/routes/alertRoutes.js) — Route protection

---

## What I'd Do Differently

### If I Built This Again:
1. **TypeScript from day 1** — Catch errors earlier, better IDE autocomplete
2. **Tests alongside code** — Not after; TDD mindset
3. **API versioning** — GET `/v1/alerts` instead of `/alerts`
4. **Request IDs** — Track requests through logs with unique IDs
5. **Feature flags** — Enable/disable features without deployment
6. **Database migrations** — Schema drift is real; use migration framework
7. **GraphQL instead of REST** — If frontend had complex queries

### If This Was Team Project:
1. **Code review process** — Every PR reviewed before merge
2. **Conventional commits** — `feat:`, `fix:`, `refactor:` prefixes
3. **CI/CD pipeline** — Automated tests on every push
4. **Design docs** — Decisions documented in ADRs (Architecture Decision Records)
5. **Runbooks** — How to debug common issues

---

## Conclusion

This project demonstrates:
**Full-stack capability** — Both frontend and backend  
**System design thinking** — Trade-offs, scalability awareness  
**Production awareness** — Error handling, logging, security basics  
**Clean code** — Separation of concerns, meaningful names  
**Problem solving** — Debugged async/await hook issue, race conditions  

It's not perfect (no tests, missing rate limiting, tight coupling), but it's **solid MVP-level work** that could be productionized with a few weeks of hardening.

---

## Quick Start for Interviewer

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm start

# Browser
# Navigate to http://localhost:3000
# Register → Create alert → Send metric → See real-time event
```

Expected flow: ~30 seconds from register to seeing first alert trigger.

---

**Questions?** Feel free to ask about architecture, trade-offs, or specific code decisions!
