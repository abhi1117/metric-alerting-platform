const User = require("../models/User");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production";
const JWT_EXPIRE = "7d";

/**
 * Register a new user
 * @param {object} req - Express request with username, email, password
 * @param {object} res - Express response
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validate required fields
    if (!username || !email || !password || !confirmPassword) {
      logger.warn("Registration failed: missing fields", { username, email });
      return res.status(400).json({ 
        error: "username, email, password, and confirmPassword are required" 
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      logger.warn("Registration failed: passwords do not match", { username });
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Validate password length
    if (password.length < 6) {
      logger.warn("Registration failed: password too short", { username });
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      logger.warn("Registration failed: user already exists", { username, email });
      return res.status(400).json({ 
        error: "Username or email already registered" 
      });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    logger.info("User registered successfully", { userId: user._id, username });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    logger.error("Error registering user", err);
    res.status(500).json({ 
      error: err.message || "Failed to register user",
      type: err.name
    });
  }
};

/**
 * Login user
 * @param {object} req - Express request with username and password
 * @param {object} res - Express response
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      logger.warn("Login failed: missing credentials", { username });
      return res.status(400).json({ 
        error: "username and password are required" 
      });
    }

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      logger.warn("Login failed: user not found", { username });
      return res.status(401).json({ 
        error: "Invalid username or password" 
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      logger.warn("Login failed: invalid password", { username });
      return res.status(401).json({ 
        error: "Invalid username or password" 
      });
    }

    logger.info("User logged in successfully", { userId: user._id, username });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    logger.error("Error logging in user", err);
    res.status(500).json({ 
      error: err.message || "Failed to login",
      type: err.name
    });
  }
};
