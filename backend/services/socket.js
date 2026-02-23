/**
 * Socket.IO service initialization and management
 */

let io = null;

module.exports = {
  /**
   * Initialize Socket.IO with CORS configuration
   * @param {http.Server} server - HTTP server instance
   * @returns {Server} Socket.IO server instance
   */
  init: (server) => {
    const { Server } = require("socket.io");
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");
    
    io = new Server(server, { 
      cors: { 
        origin: allowedOrigins.map(o => o.trim()),
        credentials: true,
        methods: ["GET", "POST"]
      } 
    });

    return io;
  },

  /**
   * Get the initialized Socket.IO instance
   * @returns {Server|null} Socket.IO server instance
   */
  getIO: () => io,
};
