import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#4caf50", "#f44336", "#ff9800", "#9e9e9e"];

export default function StudentAnalysis() {
  const { assignmentId } = useParams();
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await axios.get(`/submissions/analysis/${assignmentId}`, {
          withCredentials: true,
        });
        setAnalysis(res.data);
      } catch (err) {
        console.error("Error fetching analysis:", err);
      }
    };
    fetchAnalysis();
  }, [assignmentId]);

  if (!analysis) {
    return (
      <div className="p-6 text-center text-gray-500">Loading analysis…</div>
    );
  }

  const summaryData = [
    { name: "Correct", value: analysis.correct },
    { name: "Incorrect", value: analysis.incorrect },
    { name: "Unattempted", value: analysis.unattempted },
  ];

  const topicData = Object.entries(analysis.topicStats).map(
    ([topic, stats]) => ({
      topic,
      correct: stats.correct,
      total: stats.total,
    })
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">
        Analysis: {analysis.testTitle}
      </h1>
      <p className="text-gray-500 text-sm">
        Submitted at: {new Date(analysis.submittedAt).toLocaleString()}
      </p>

      <Card>
        <CardContent className="flex flex-col md:flex-row items-center justify-around">
          <PieChart width={250} height={250}>
            <Pie
              data={summaryData}
              cx="50%"
              cy="50%"
              label
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {summaryData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
          <div className="mt-4 md:mt-0">
            <ul className="space-y-2 text-gray-700">
              <li>✅ Correct: {analysis.correct}</li>
              <li>❌ Incorrect: {analysis.incorrect}</li>
              <li>🕗 Unattempted: {analysis.unattempted}</li>
              <li>📋 Total Questions: {analysis.total}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Topic-wise Performance</h2>
          <BarChart width={500} height={300} data={topicData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="topic" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="correct" fill="#4caf50" name="Correct" />
            <Bar dataKey="total" fill="#9e9e9e" name="Total" />
          </BarChart>
        </CardContent>
      </Card>
    </div>
  );
}
