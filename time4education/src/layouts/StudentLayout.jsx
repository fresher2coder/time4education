import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useFullscreen } from "@/context/FullScreenContext";

const StudentLayout = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { hideSidebar } = useFullscreen();

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  // Close drawer on route change
  useEffect(() => close(), [location.pathname]);

  // ESC to close drawer
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {!hideSidebar && open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      {!hideSidebar && (
        <aside
          className={`
            fixed top-0 left-0 z-30 h-screen w-64 bg-white shadow-lg
            transform transition-transform duration-300
            ${open ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 
          `}
        >
          <Sidebar closeDrawer={close} />
        </aside>
      )}

      {/* Main area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          hideSidebar ? "ml-0" : "lg:ml-64"
        }`}
      >
        {!hideSidebar && <Topbar toggleDrawer={toggle} />}
        <main
          className={`flex-1 overflow-auto transition-all duration-300 ${
            hideSidebar ? "p-0" : "p-6"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
