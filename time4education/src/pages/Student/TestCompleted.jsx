// src/pages/TestCompleted.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function TestCompleted() {
  const navigate = useNavigate();
  const location = useLocation();
  const testTitle = location.state?.title || "Your Test";

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/student/tests");
    }, 5000); // 5 seconds
    return () => clearTimeout(timer); // cleanup on unmount
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white shadow-xl rounded-2xl p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          🎉 Test Completed!
        </h1>
        <p className="text-gray-700 mb-2">
          <strong>{testTitle}</strong> has been completed successfully.
        </p>
        <p className="text-gray-700 mb-6">
          Thank you for completing the test. <br />
          Your responses have been recorded successfully.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          You’ll be redirected back to the tests page shortly...
        </p>
        <button
          onClick={() => navigate("/student/tests")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Tests Now
        </button>
      </div>
    </div>
  );
}
