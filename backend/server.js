const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/alerts_db";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: "10kb" }));

app.use("/alerts", require("./routes/alertRoutes"));
app.use("/metrics", require("./routes/metricRoutes"));
app.use("/alert-events", require("./routes/eventRoutes"));

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const server = http.createServer(app);
const socketService = require("./services/socket");

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const io = socketService.init(server);
    io.on("connection", (socket) => {
      socket.on("disconnect", () => {
        // disconnect handler
      });
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});