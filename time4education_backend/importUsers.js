// importUsers.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import fs from "fs";
import csv from "csv-parser";
import User from "./models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/timeapp";

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB!");
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }
}

async function importUsersFromCSV(filePath) {
  const users = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        users.push(row);
      })
      .on("end", () => resolve(users))
      .on("error", reject);
  });
}

async function run() {
  await connectDB();

  try {
    const users = await importUsersFromCSV("./users.csv"); // <-- your csv path
    console.log(`🎉 CSV read complete. Found ${users.length} users.`);

    for (const u of users) {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(
          u.password || "default123",
          salt
        );

        await User.findOneAndUpdate(
          { email: u.email },
          {
            $set: {
              name: u.name,
              rollNo: u.rollNo,
              email: u.email,
              password: hashedPassword, // <-- hashed here
              college: u.college || "all",
              batch: u.batch || "all",
              department: u.department || "all",
              role: "student",
            },
          },
          { upsert: true, new: true }
        );

        console.log(`✅ Imported: ${u.email}`);
      } catch (err) {
        console.error(`❌ Error for ${u.email}:`, err.message);
      }
    }

    console.log("🎯 Import complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Import failed:", err.message);
    process.exit(1);
  }
}

run();
