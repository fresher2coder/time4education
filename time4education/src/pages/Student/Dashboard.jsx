import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import {
  RadialBarChart,
  RadialBar,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

const statusColors = {
  completed: "#22c55e",
  "in-progress": "#facc15",
  "not-started": "#9ca3af",
};

const StudentDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get("/dashboard/student/me");
        setAssignments(res.data.assignments || []);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Error fetching dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        Loading dashboard...
      </div>
    );

  if (errorMsg)
    return (
      <div className="flex justify-center items-center h-64 text-red-600">
        {errorMsg}
      </div>
    );

  if (assignments.length === 0)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        No assignments available yet.
      </div>
    );

  // Top 5 assignments for chart
  const top5Assignments = assignments.slice(0, 5);
  const chartData = top5Assignments.map((a) => ({
    name: a.title || "Untitled",
    Progress: a.progressPercentage || 0,
    Score: a.score ?? 0,
  }));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* 🔹 Assignment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((a, index) => (
          <motion.div
            key={a.testId}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white shadow-xl rounded-2xl p-5 flex flex-col justify-between hover:shadow-2xl transition-shadow duration-300"
          >
            {/* Title & Description */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">{a.title}</h2>
              <p className="text-gray-500 text-sm">{a.description}</p>
            </div>

            {/* Status & Radial Progress */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-sm">Status:</p>
                <p
                  className={`font-semibold capitalize ${
                    a.status === "completed"
                      ? "text-green-600"
                      : a.status === "in-progress"
                        ? "text-yellow-600"
                        : "text-gray-400"
                  }`}
                >
                  {a.status}
                </p>
              </div>
              <div className="w-20 h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[
                      {
                        name: "progress",
                        value:
                          a.progressPercentage !== null
                            ? a.progressPercentage
                            : a.status === "completed"
                              ? 100
                              : 0,
                        fill: statusColors[a.status],
                      },
                    ]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="value"
                    />
                    <Tooltip
                      formatter={(value) => `${Math.round(value)}%`}
                      cursor={{ fill: "transparent" }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Duration & Dates */}
            <div className="border-t pt-3 text-sm text-gray-500 flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{a.duration} mins</span>
              </div>
              <div className="flex justify-between">
                <span>Start:</span>
                <span>{new Date(a.startTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>End:</span>
                <span>{new Date(a.endTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Score:</span>
                <span>
                  {a.score ?? 0}/{a.maxScore}
                </span>
              </div>
            </div>

            {/* Action Button */}
            {a.canStart && (
              <button className="mt-4 bg-sky-600 text-white py-2 rounded-xl hover:bg-sky-700 transition-colors">
                Start Test
              </button>
            )}
          </motion.div>
        ))}
      </div>
      {/* 🔹 Top 5 Bar Chart */}
      {top5Assignments.length > 0 && (
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Top 5 Assignments Overview
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Progress" fill="#facc15" barSize={20} />
              <Bar dataKey="Score" fill="#22c55e" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
