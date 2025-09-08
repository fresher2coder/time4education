import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import { noCacheMiddleware } from "./middleware/noCacheMiddleware.js";

dotenv.config();

const app = express();

// Parse JSON & Cookies
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:5173",
  "https://time4education.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
      const allowed = allowedOrigins.some((url) => origin.startsWith(url));
      if (!allowed) {
        return callback(
          new Error("CORS policy does not allow: " + origin),
          false
        );
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((e) => console.error("❌ MongoDB error:", e.message));

// Routes
app.get("/", (_req, res) => res.send("Backend up ✨"));
app.use("/api", noCacheMiddleware);
app.use("/api/auth", authRoutes);

import testRoutes from "./routes/testRoutes.js";
app.use("/api/tests", testRoutes);

import questionRoutes from "./routes/questionRoutes.js";
app.use("/api/questions", questionRoutes);

import assignmentRoutes from "./routes/assignmentRoutes.js";
app.use("/api/assignments", assignmentRoutes);

import submissionRoutes from "./routes/submissionRoutes.js";
app.use("/api/submissions", submissionRoutes);

import dashboardRoutes from "./routes/dashboardRoutes.js";
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`🔥 Server running on ${PORT}`));
