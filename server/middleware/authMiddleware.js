require("dotenv").config();
const jwt = require("jsonwebtoken");

// =======================
// AUTH MIDDLEWARE
// =======================
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1️⃣ Check if Authorization header exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  // 2️⃣ Extract token
  const token = authHeader.split(" ")[1];

  // 3️⃣ Check JWT secret
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "Server configuration error"
    });
  }

  try {
    // 4️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5️⃣ Attach user to request
    req.user = decoded;

    // 6️⃣ Continue
    next();

  } catch (error) {

    // Token expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired"
      });
    }

    // Invalid token
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};