// routes/authRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// === Helper to set HttpOnly cookie ===
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: true, // must be true for HTTPS
    sameSite: "none", // required for cross-site (Vercel <-> Render)
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

// === REGISTER ===
router.post("/register", async (req, res) => {
  try {
    const { name, rollNo, email, password, college, batch, department } =
      req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = new User({
      name,
      rollNo,
      email,
      password, // User model handles hashing
      role: "student", // force student role
      college,
      batch,
      department,
    });
    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        rollNo: user.rollNo,
        email: user.email,
        role: user.role,
        college: user.college,
        batch: user.batch,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Register error", error: err.message });
  }
});

// === LOGIN ===
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email" });

    const valid = await user.matchPassword(password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // set HttpOnly cookie
    setAuthCookie(res, token);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        rollNo: user.rollNo,
        email: user.email,
        role: user.role,
        college: user.college,
        batch: user.batch,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
});

// === CURRENT USER ===
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // authMiddleware already fetches and attaches user
    res.json({
      id: req.user._id,
      name: req.user.name,
      rollNo: req.user.rollNo,
      email: req.user.email,
      role: req.user.role,
      college: req.user.college,
      batch: req.user.batch,
      department: req.user.department,
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch error", error: err.message });
  }
});

// === LOGOUT ===
router.post("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ message: "Logged out" });
});

// === Example Protected Route ===
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: `Welcome ${req.user.name} 🚀`, user: req.user });
});

export default router;
