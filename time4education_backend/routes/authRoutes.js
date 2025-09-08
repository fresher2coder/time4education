import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Helper: set cookie
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS in prod
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, rollNo, email, password, role, college, batch, department } =
      req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = new User({
      name,
      rollNo,
      email,
      password, // plain; model hashes it
      role: "student", // force student role
      college,
      batch,
      department,
    });
    await user.save();

    res.status(201).json({
      message: "User registered",
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

// LOGIN (HttpOnly cookie)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email" });

    const ok = await user.matchPassword(password);
    if (!ok) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    setAuthCookie(res, token);

    res.json({
      message: "Login successful",
      token,
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

// CURRENT USER (from cookie)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // const u = await User.findById(req.user.id).select("-password");
    const u = req.user;
    if (!u) return res.status(404).json({ message: "User not found" });
    res.json(u);
  } catch (err) {
    res.status(500).json({ message: "Fetch error", error: err.message });
  }
});

// LOGOUT (clear cookie)
router.post("/logout", (_req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });
  res.json({ message: "Logged out" });
});

// Example protected route
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Welcome to your dashboard 🚀", user: req.user });
});

export default router;
