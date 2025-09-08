// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // <-- make sure the path is correct

const authMiddleware = async (req, res, next) => {
  try {
    // You can support both cookie or header-based tokens:
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the full user profile for filtering
    const user = await User.findById(decoded.id).select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // ✅ now req.user contains college, batch, department, role, etc.
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
