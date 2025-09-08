import {
  Facebook,
  GraduationCap,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import React from "react";

const Footer = () => {
  const quickLinks = [
    { label: "About Us", href: "#" },
    { label: "Courses", href: "#" },
    { label: "Instructors", href: "#" },
    { label: "Blog", href: "#" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="w-full bg-slate-900">
      <div className="max-w-7xl mx-auto px-20 py-16">
        <div className="grid grid-cols-4 gap-8 mb-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="[font-family:'Inter-Bold',Helvetica] font-bold text-white text-xl tracking-[0] leading-7">
                Time4Education
              </div>
            </div>
            <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-400 text-base tracking-[0] leading-6 max-w-[265px]">
              Empowering learners worldwide with quality education and career
              opportunities.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-white text-base tracking-[0] leading-6">
              Quick Links
            </h3>
            <div className="space-y-4">
              {quickLinks.map((link, index) => (
                <div key={index}>
                  <a
                    href={link.href}
                    className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-400 text-base tracking-[0] leading-6 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-white text-base tracking-[0] leading-6">
              Support
            </h3>
            <div className="space-y-4">
              {supportLinks.map((link, index) => (
                <div key={index}>
                  <a
                    href={link.href}
                    className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-400 text-base tracking-[0] leading-6 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="[font-family:'Inter-SemiBold',Helvetica] font-semibold text-white text-base tracking-[0] leading-6">
              Follow Us
            </h3>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="text-center">
            <p className="[font-family:'Inter-Regular',Helvetica] font-normal text-gray-400 text-base tracking-[0] leading-6">
              © 2024 Time4Education. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
