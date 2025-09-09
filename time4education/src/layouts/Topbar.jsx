import React, { useEffect, useState, useRef } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "@/api/axios";
import TIME_LOGO from "@/assets/TIME_Logo_2.png";

const Topbar = ({ toggleDrawer }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { user, logout } = useAuth();

  // Fetch user
  // useEffect(() => {
  //   const fetchUser = async () => {
  //     try {
  //       const res = await axios.get("/auth/me");
  //       setUser(res.data);
  //     } catch {
  //       setUser(null);
  //     }
  //   };
  //   fetchUser();
  // }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      // await axios.post("/auth/logout");
      await logout();
    } catch {}
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between bg-white border-b px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDrawer}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
        <div className="hidden md:flex items-center">
          <img
            src={TIME_LOGO}
            alt="Time Logo"
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 relative" ref={menuRef}>
            <div className="text-right mr-2">
              <div className="text-sm font-medium text-gray-800">
                {user.name}
              </div>
              <div className="text-xs text-gray-500">
                {user.college || "College"}
              </div>
            </div>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full px-3 py-1 hover:bg-gray-100"
            >
              <div className="h-9 w-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white shadow-md rounded-md overflow-hidden z-40">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/student/profile");
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
