import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, FileText, Settings } from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/student/dashboard", Icon: Home },
  { name: "Profile", path: "/student/profile", Icon: User },
  { name: "Tests", path: "/student/tests", Icon: FileText },
  { name: "Settings", path: "/student/settings", Icon: Settings },
];

const Sidebar = ({ closeDrawer }) => {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-5 border-b flex items-center gap-3">
        {/* logo */}
        <div className="h-7 w-10 rounded-lg bg-sky-100 flex items-center justify-center">
          <span className="text-sky-600 font-bold">T</span>
        </div>
        <div className="text-lg font-semibold">Student Panel</div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeDrawer}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition
                ${active ? "bg-sky-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <item.Icon
                className={`h-5 w-5 ${active ? "text-white" : "text-gray-500"}`}
              />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t text-xs text-gray-500">
        <div>Version 1.0</div>
        <div className="mt-2">© {new Date().getFullYear()} Time4Education</div>
      </div>
    </div>
  );
};

export default Sidebar;
