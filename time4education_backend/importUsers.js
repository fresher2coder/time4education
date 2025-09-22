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
      .on("data", (row) => users.push(row))
      .on("end", () => resolve(users))
      .on("error", reject);
  });
}

async function run() {
  await connectDB();

  try {
    const users = await importUsersFromCSV("./users.csv"); // <-- path to your CSV
    console.log(`🎉 CSV read complete. Found ${users.length} users.`);

    for (const u of users) {
      try {
        // check if user already exists
        const existingUser = await User.findOne({ email: u.email });

        let hashedPassword;
        if (u.password) {
          const salt = await bcrypt.genSalt(10);
          hashedPassword = await bcrypt.hash(u.password, salt);
        }

        if (existingUser) {
          // ✅ Update existing user
          existingUser.name = u.name || existingUser.name;
          existingUser.rollNo = u.rollNo || existingUser.rollNo;
          existingUser.college = u.college || existingUser.college || "all";
          existingUser.batch = u.batch || existingUser.batch || "all";
          existingUser.department =
            u.department || existingUser.department || "all";

          if (hashedPassword) {
            existingUser.password = hashedPassword;
          }

          await existingUser.save();
          console.log(`🔄 Updated: ${u.email}`);
        } else {
          // ✅ Create new user
          const salt = await bcrypt.genSalt(10);
          const newUser = new User({
            name: u.name,
            rollNo: u.rollNo,
            email: u.email,
            password: hashedPassword || (await bcrypt.hash("default123", salt)),
            college: u.college || "all",
            batch: u.batch || "all",
            department: u.department || "all",
            role: "student",
          });

          await newUser.save();
          console.log(`✅ Created: ${u.email}`);
        }
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
