// src/pages/Unauthorized.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react"; // nice little lock icon

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-2xl">
        <Lock className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          403 — Access Denied
        </h1>
        <p className="text-gray-500 mb-6 text-center max-w-sm">
          You don’t have permission to access this page. Please log in with the
          right account.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold shadow hover:bg-blue-700 transition"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
