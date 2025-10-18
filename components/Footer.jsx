import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Logo & Description */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <img className="h-7 sm:h-8 w-auto" src="/logo.png" alt="Logo" />
            <p className="text-xs sm:text-sm text-gray-400">
              Your trusted partner for premium products and services.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <a href="#" className="p-2 bg-slate-800 hover:bg-blue-600 rounded-full transition-colors">
                <Facebook size={14} className="sm:w-4 sm:h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 hover:bg-blue-600 rounded-full transition-colors">
                <Twitter size={14} className="sm:w-4 sm:h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 hover:bg-blue-600 rounded-full transition-colors">
                <Linkedin size={14} className="sm:w-4 sm:h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <h3 className="font-semibold text-white text-sm sm:text-base">Quick Links</h3>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              <li><a href="/" className="text-xs sm:text-sm text-gray-400 hover:text-blue-400 transition-colors">Home</a></li>
              <li><a href="/about-us" className="text-xs sm:text-sm text-gray-400 hover:text-blue-400 transition-colors">About Us</a></li>
              <li><a href="/contact-us" className="text-xs sm:text-sm text-gray-400 hover:text-blue-400 transition-colors">Contact</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-blue-400 transition-colors">Products</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <h3 className="font-semibold text-white text-sm sm:text-base">Support</h3>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              <li><a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-blue-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-blue-400 transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="text-xs sm:text-sm text-gray-400 hover:text-blue-400 transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <h3 className="font-semibold text-white text-sm sm:text-base">Contact Us</h3>
            <div className="flex gap-2 sm:gap-3 items-start">
              <Phone size={14} className="text-blue-400 flex-shrink-0 mt-0.5 sm:mt-1" />
              <div className="flex flex-col gap-0.5 sm:gap-1">
                <p className="text-xs sm:text-sm text-gray-400">+91 910 XXXXXXX</p>
                <p className="text-xs text-gray-500">Mon-Fri, 9AM-6PM</p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 items-start">
              <Mail size={14} className="text-blue-400 flex-shrink-0 mt-0.5 sm:mt-1" />
              <p className="text-xs sm:text-sm text-gray-400">xyz@gmail.com</p>
            </div>
            <div className="flex gap-2 sm:gap-3 items-start">
              <MapPin size={14} className="text-blue-400 flex-shrink-0 mt-0.5 sm:mt-1" />
              <p className="text-xs sm:text-sm text-gray-400">New Delhi, India</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700"></div>

        {/* Bottom Section */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            © 2024 GPS Mart. All rights reserved.
          </p>
          <div className="flex gap-2 sm:gap-4 justify-center sm:justify-end text-xs text-gray-500">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-300 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}