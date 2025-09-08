import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { GraduationCap } from "lucide-react";
import React from "react";
import TIME_LOGO from "../assets/TIME_Logo_2.png";
import { Link } from "react-router-dom";

// const navigationItems = [
//   { label: "Home", href: "#" },
//   { label: "Courses", href: "#" },
//   { label: "About", href: "#" },
//   { label: "Contact", href: "#" },
// ];

const Header = () => {
  return (
    <header className="w-full h-[65px] bg-[#fffffff2] border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto h-16 px-8">
        <div className="flex items-center justify-between h-full px-8">
          <Link to="/">
            <div className="flex items-center gap-2">
              <img
                src={TIME_LOGO}
                alt="Time Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
          </Link>

          {/* <div className="flex items-center gap-2">
            <div className="w-[30px] h-6 flex items-center justify-center"></div>
            <div className="[font-family:'Inter-Bold',Helvetica] font-bold text-slate-900 text-xl tracking-[0] leading-7 whitespace-nowrap">
              TIME
            </div>
          </div> */}

          {/* <NavigationMenu>
            <NavigationMenuList className="flex gap-[30px]">
              {navigationItems.map((item, index) => (
                <NavigationMenuItem key={index}>
                  <NavigationMenuLink
                    href={item.href}
                    className="[font-family:'Inter-Regular',Helvetica] font-normal text-base tracking-[0] leading-6 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu> */}

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button
                variant="ghost"
                className="[font-family:'Inter-Regular',Helvetica] font-normal text-base tracking-[0] text-gray-700 hover:text-gray-900 h-auto p-0"
              >
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-sky-500 hover:bg-sky-600 rounded-lg [font-family:'Inter-Regular',Helvetica] font-normal text-base tracking-[0] text-white h-10 px-4">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
