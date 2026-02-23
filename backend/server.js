const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/alerts_db";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");

logger.info("Starting backend server", { PORT, MONGO_URI });

// Middleware
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: "10kb" }));

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(req.method + " " + req.path, { 
    query: req.query, 
    bodySize: JSON.stringify(req.body).length 
  });
  next();
});

// Routes
app.use("/alerts", require("./routes/alertRoutes"));
app.use("/metrics", require("./routes/metricRoutes"));
app.use("/alert-events", require("./routes/eventRoutes"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  logger.warn("Route not found", { method: req.method, path: req.path });
  res.status(404).json({ 
    error: "Not found",
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error in request handler", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({ 
    error: err.message || "Internal server error",
    type: err.name,
    ...(process.env.DEBUG && { stack: err.stack })
  });
});

const server = http.createServer(app);
const socketService = require("./services/socket");

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info("MongoDB connected successfully");

    // Initialize Socket.IO
    const io = socketService.init(server);
    logger.info("Socket.IO initialized");

    io.on("connection", (socket) => {
      logger.info("Client connected via Socket.IO", { socketId: socket.id });

      socket.on("disconnect", () => {
        logger.info("Client disconnected from Socket.IO", { socketId: socket.id });
      });

      socket.on("error", (err) => {
        logger.error("Socket.IO error", { socketId: socket.id, error: err });
      });
    });

    server.listen(PORT, () => {
      logger.info("Server running successfully", { 
        port: PORT, 
        url: "http://localhost:" + PORT,
        env: process.env.NODE_ENV || "development"
      });
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection failed", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, closing server gracefully");
  server.close(() => {
    logger.info("Server closed");
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, closing server gracefully");
  server.close(() => {
    logger.info("Server closed");
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", err);
  process.exit(1);
});
