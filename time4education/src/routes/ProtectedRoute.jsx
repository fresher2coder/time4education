// src/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "@/api/axios";

const ProtectedRoute = ({ children, role }) => {
  const [status, setStatus] = useState({
    loading: true,
    allowed: false,
  });

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const res = await axios.get("/auth/me", { withCredentials: true });
        if (isMounted) {
          if (role && res.data.role !== role) {
            setStatus({ loading: false, allowed: false });
          } else {
            setStatus({ loading: false, allowed: true });
          }
        }
      } catch (err) {
        if (isMounted) setStatus({ loading: false, allowed: false });
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [role]);

  if (status.loading) return <div className="p-4">Loading...</div>;

  if (!status.allowed) return <Navigate to="/unauthorized" replace />;

  return children;
};

export default ProtectedRoute;
