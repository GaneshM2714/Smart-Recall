const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_123";

module.exports = (req, res, next) => {
  // 1. Get the token from the header
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).json({ error: "Access Denied: No Token Provided" });

  // 2. Clean the token (Remove "Bearer " if present)
  const token = authHeader.replace("Bearer ", "");

  try {
    // 3. Verify the token
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Attach user info (id, email) to the request
    next(); // Pass control to the next function
  } catch (error) {
    res.status(400).json({ error: "Invalid Token" });
  }
};