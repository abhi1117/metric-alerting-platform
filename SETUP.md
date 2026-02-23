# Setup & Troubleshooting Guide

## ⚡ Quick Setup (5 minutes)

### Prerequisites
- Node.js 16+ (check: `node -v`)
- npm 8+ (check: `npm -v`)  
- MongoDB running locally (check: `mongosh` or MongoDB Compass)

### Terminal 1: Start Backend

```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
[timestamp] [INFO] Starting backend server { PORT: '5000', MONGO_URI: '...' }
[timestamp] [INFO] MongoDB connected successfully
[timestamp] [INFO] Socket.IO initialized
[timestamp] [INFO] Server running successfully { port: 5000, url: 'http://localhost:5000', ... }
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm install
npm start
```

**Expected output:**
```
webpack compiled successfully
Compiled successfully!
You can now view metric-alerting-platform in the browser.
Local:            http://localhost:3000
```

Then open http://localhost:3000 in your browser.

---

## 🔧 Common Issues & Fixes

### Issue 1: "Failed to load alerts" / Blank screen on localhost:3000

**Cause:** Frontend can't connect to backend API

**Fix:**
1. Verify backend is running on port 5000: `curl http://localhost:5000/health`
   - Should return: `{"status": "ok", "timestamp": "..."}`
2. Check frontend `.env` has correct API URL:
   ```bash
   cat frontend/.env
   # Should show: REACT_APP_API_URL=http://localhost:5000
   ```
3. If you changed the backend port, update `frontend/.env`:
   ```bash
   echo "REACT_APP_API_URL=http://localhost:YOUR_PORT" > frontend/.env
   echo "REACT_APP_SOCKET_URL=http://localhost:YOUR_PORT" >> frontend/.env
   ```
4. Restart frontend: Kill the `npm start` process and run it again

---

### Issue 2: MongoDB connection error

**Error:** `MongoError: connect ECONNREFUSED 127.0.0.1:27017`

**Fix:**
1. Start MongoDB:
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Windows - MongoDB should auto-start as service
   # Or manually: net start MongoDB
   
   # Linux
   sudo systemctl start mongod
   ```
2. Verify connection: `mongosh` or check MongoDB Compass

---

### Issue 3: "Port 5000 already in use"

**Fix:** Either kill the process or use a different port
```bash
# Windows: Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in backend/.env
echo "PORT=5001" >> backend/.env
```

---

### Issue 4: "Socket: disconnected" in Events page

**Cause:** Socket.IO connection failed (usually CORS issue)

**Fix:**
1. Check backend logs for CORS errors
2. Ensure `backend/.env` has correct ALLOWED_ORIGINS:
   ```
   ALLOWED_ORIGINS=http://localhost:3000
   ```
3. Restart backend
4. Browser console (F12) should show Socket.IO connection attempts

---

## 📋 Testing Workflow

### 1. Create an Alert
- Go to http://localhost:3000/alerts
- **Metric:** `cpu`
- **Threshold:** `80`
- **Comparator:** `GT`
- **Message:** `CPU usage is high`
- **Cooldown:** `10` (seconds)
- Click "Create"

✅ Alert should appear in the list below

### 2. Send a Metric (Trigger Alert)
- Go to http://localhost:3000/metrics
- **Metric Name:** `cpu`
- **Value:** `85`
- Click "Send"

✅ Should see success message

### 3. Check Events
- Go to http://localhost:3000/events
- Should see the alert event appear in real-time
- **Socket status** should show "connected"

### 4. Test Cooldown
- Send another metric: `cpu = 90`
- Should NOT create a new event (within 10s cooldown)
- Wait 10 seconds, send again
- Now a new event should appear

---

## 🛠 Development Commands

```bash
# Backend
npm run dev        # Start with hot-reload (nodemon)
npm start          # Start normally

# Frontend
npm start          # Start dev server with hot-reload
npm run build      # Build for production
npm test           # Run tests

# Database
mongosh            # Connect to MongoDB CLI
db.alerts.find()          # View all alerts
db.alertevents.find()     # View all alert events
```

---

## 📊 Health Check

```bash
# Backend health endpoint
curl http://localhost:5000/health

# Expected response:
{"status":"ok","timestamp":"2026-02-23T16:30:00.000Z"}

# List all alerts
curl http://localhost:5000/alerts

# Send a metric
curl -X POST http://localhost:5000/metrics \
  -H "Content-Type: application/json" \
  -d '{"metricName":"cpu","value":75}'
```

---

## 📝 Logs & Debugging

### Enable Debug Logging
```bash
# Backend with debug logs
DEBUG=true npm run dev
```

### View API Request Logs
- Open browser DevTools (F12)
- Go to **Console** tab
- Create alert or send metric
- Look for log entries starting with `✓` or `✗`

### Check Backend Logs
- Check terminal where `npm run dev` is running
- Look for `[INFO]`, `[WARN]`, or `[ERROR]` lines
- Check for Socket.IO connection messages

---

## 🚀 Deployment Notes

When deploying to production:

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use a proper MongoDB Atlas connection string
   - Update `ALLOWED_ORIGINS` to your frontend domain

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   # Serve the `build` folder from backend or static host
   ```

3. **Docker** (optional)
   ```bash
   docker build -t metric-alerting-backend .
   docker run -e PORT=5000 -e MONGO_URI=... metric-alerting-backend
   ```

---

## ✅ Verification Checklist

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] MongoDB connected (check backend logs)
- [ ] `curl http://localhost:5000/health` returns `{status: ok}`
- [ ] Frontend loads without errors (F12 console)
- [ ] Can create an alert
- [ ] Can send a metric
- [ ] Socket shows "connected" in Events page
- [ ] Alert event appears in real-time
- [ ] Cooldown prevents duplicate events

If all checks pass ✅ — your setup is working!

---

## Need Help?

1. Check backend console for `[ERROR]` messages
2. Check browser DevTools console (F12)
3. Check API response in Network tab
4. Verify `.env` files exist and have correct values
5. Ensure MongoDB is running: `mongosh`
