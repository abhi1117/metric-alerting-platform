# Authentication Setup Guide

## Overview

The Metric Alerting Platform now includes **JWT-based authentication** to restrict access and isolate user data. All API endpoints (except auth endpoints) require a valid JWT token.

## Backend Setup

### 1. Environment Configuration

Add the JWT secret to `backend/.env`:

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

For production, use a strong random string:
```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. API Endpoints

#### **POST /auth/register**
Register a new user.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### **POST /auth/login**
Login a user.

**Request:**
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

#### **Protected Endpoints**

All other endpoints now require the JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

Example request:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:5000/alerts
```

### 3. Error Responses

**Missing Token (401):**
```json
{ "error": "No token provided" }
```

**Invalid/Expired Token (401):**
```json
{ "error": "Invalid or expired token" }
```

---

## Frontend Setup

### 1. How Authentication Works

1. User registers or logs in on `/login` or `/register` page
2. Backend returns JWT token
3. Frontend stores token in `localStorage`
4. Token is automatically included in all API requests via axios interceptor
5. If token expires (401 response), user is redirected to login

### 2. Authentication Service

The `authService` provides easy methods:

```javascript
import authService from "../services/authService";

// Register
await authService.register(username, email, password, confirmPassword);

// Login
await authService.login(username, password);

// Logout
authService.logout();

// Check authentication
authService.isAuthenticated(); // boolean

// Get stored token
authService.getToken(); // string or null

// Get stored user
authService.getUser(); // object or null
```

### 3. Protected Routes

All routes except `/login` and `/register` are automatically protected using the `ProtectedRoute` component. Unauthenticated users are redirected to login.

```javascript
<Route 
  path="/alerts" 
  element={
    <ProtectedRoute>
      <AlertPage />
    </ProtectedRoute>
  } 
/>
```

### 4. Axios Interceptor

The API client automatically:
- Adds token to all requests
- Handles 401 errors by redirecting to login
- Removes invalid tokens from localStorage

---

## Testing Authentication

### Manual Testing

1. **Register:**
   ```bash
   curl -X POST http://localhost:5000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123",
       "confirmPassword": "password123"
     }'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:5000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "password": "password123"
     }'
   ```

3. **Use Token:**
   ```bash
   TOKEN="your-jwt-token-here"
   curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/alerts
   ```

### Frontend Testing

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm start`
3. Navigate to http://localhost:3000/login
4. Register a new account
5. You'll be automatically logged in and redirected to alerts page
6. Try logout to test session management

---

## Security Notes

⚠️ **Important for Production:**

1. **Change JWT_SECRET**: Use a strong, random secret in production
   ```bash
   export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

2. **Use HTTPS**: Always use HTTPS in production to protect tokens

3. **Token Expiration**: Tokens expire in 7 days; implement refresh tokens for long-lived sessions

4. **Rate Limiting**: Add rate limiting to `/auth/login` and `/auth/register` to prevent brute force attacks

5. **Secure Storage**: Store tokens only in `localStorage` (not cookies) unless using httpOnly cookies with CSRF protection

6. **CORS**: Verify `ALLOWED_ORIGINS` is configured correctly in production

---

## Troubleshooting

**"No token provided" error:**
- Ensure token is in Authorization header format: `Bearer <token>`
- Check that `authService.getToken()` is returning a valid token

**Token not persisting:**
- Check browser's localStorage in DevTools
- Verify token is being saved: `authService.login()` should store it

**"Invalid or expired token" error:**
- Token may have expired (reset cookies/localStorage and login again)
- JWT_SECRET mismatch between backend and frontend (if using custom secret)

**CORS errors on auth requests:**
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check CORS configuration in `server.js`

---

## Future Enhancements

1. **Refresh Tokens**: Implement refresh token flow for better security
2. **Role-Based Access**: Add admin/user roles
3. **Multi-Tenant**: Isolate alerts/events per user automatically
4. **OAuth 2.0**: Support login via GitHub, Google, etc.
5. **2FA**: Two-factor authentication for added security
