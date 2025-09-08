// src/pages/Tests.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "@/api/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Tests = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log();

        // const res = await axios.get(`/api/assignments?t=${Date.now()}`, {
        //   headers: { Authorization: `Bearer ${token}` },
        // });

        setAssignments(res.data.assignments || []);
      } catch (err) {
        console.error(
          "❌ Error fetching assignments:",
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-600">
        <p className="text-2xl font-semibold mb-2">📭 No Tests Assigned</p>
        <p className="text-sm">
          Please check back later or contact your instructor.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Available Tests</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((a) => (
          <Card
            key={a._id}
            className={`cursor-pointer hover:shadow-xl transition-shadow ${
              a.completed ? "opacity-70" : ""
            }`}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <h2 className="text-lg font-semibold">{a.test?.title}</h2>
                <p className="text-sm text-gray-600 mb-2">
                  {a.test?.description || "No description provided."}
                </p>
                <p className="text-xs text-gray-500">
                  Duration: {a.test?.duration} min
                </p>
                {a.instructions && (
                  <p className="text-xs text-blue-600 mt-1">
                    Note: {a.instructions}
                  </p>
                )}
              </div>
              <div className="mt-4">
                {a.completed ? (
                  <Button variant="outline" disabled className="w-full">
                    ✅ Completed
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate(`assignments/${a._id}`)}
                    className="w-full"
                  >
                    Start Test
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Tests;
