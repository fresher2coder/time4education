// src/layouts/GeneralLayout.jsx
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import React from "react";
import { Outlet, Link } from "react-router-dom";

const GeneralLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header / Navbar */}
      {/* <header className="bg-blue-600 text-white p-4">
        <nav className="flex justify-between">
          <Link to="/">Home</Link>
          <div className="space-x-4">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </nav>
      </header> */}
      <Header />

      {/* Main Content */}
      <main>
        <Outlet /> {/* This is where the child pages render */}
      </main>

      {/* Footer */}
      {/* <footer className="bg-gray-200 text-center p-4">
        © {new Date().getFullYear()} Time4Education
      </footer> */}
      <Footer />
    </div>
  );
};

export default GeneralLayout;
