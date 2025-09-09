// AppRoutes.jsx (updated)
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import GeneralLayout from "../layouts/GeneralLayout";
import StudentLayout from "../layouts/StudentLayout";
import ProtectedRoute from "./ProtectedRoute";

import Home from "../pages/Home";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Dashboard from "../pages/Student/Dashboard";
import Profile from "../pages/Student/Profile";
import Tests from "../pages/Student/Tests";
import Settings from "../pages/Student/Settings";
import Unauthorized from "../pages/Unauthorized";
import AssignmentDetail from "@/pages/Student/AssignmentDetails";
import TestCompleted from "@/pages/Student/TestCompleted";
import { FullscreenProvider } from "@/context/FullScreenContext";
import { AuthProvider } from "@/context/AuthContext";

const AppRoutes = () => {
  return (
    <AuthProvider>
      <FullscreenProvider>
        <Router>
          <Routes>
            {/* public */}
            <Route element={<GeneralLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="unauthorized" element={<Unauthorized />} />
            </Route>

            {/* protected student area */}

            <Route
              element={
                <ProtectedRoute role="student">
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route path="student/dashboard" element={<Dashboard />} />
              <Route path="student/profile" element={<Profile />} />
              <Route path="student/tests" element={<Tests />} />
              <Route
                path="student/tests/assignments/:id"
                element={<AssignmentDetail />}
              />

              <Route path="student/settings" element={<Settings />} />
              <Route
                path="student/test/completed"
                element={<TestCompleted />}
              />
            </Route>
          </Routes>
        </Router>
      </FullscreenProvider>
    </AuthProvider>
  );
};

export default AppRoutes;
