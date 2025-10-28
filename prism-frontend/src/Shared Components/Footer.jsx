import React from 'react';
import { ChevronUp, Mail, User } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-800 text-white relative">
      {/* Background Animation Dots */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-4 h-4 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-3 h-3 bg-white/10 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-10 left-1/4 w-2 h-2 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-white/10 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/10 rounded-full animate-pulse delay-300"></div>
      </div>

      {/* Footer Content */}
      <div className="relative z-10 px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
            {/* Left Section - Got Queries? */}
            <div>
              <h3 className="text-2xl font-bold mb-6">Got Queries?</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-200" />
                  <a 
                    href="mailto:prism@samsung.com" 
                    className="text-blue-100 hover:text-white transition-colors duration-200"
                  >
                    prism@samsung.com
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-200" />
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        // Add delete account logic here
                        ;
                      }
                    }}
                    className="text-blue-100 hover:text-white transition-colors duration-200"
                  >
                    Delete user account
                  </button>
                </div>
              </div>
            </div>

            {/* Right Section - Information */}
            <div>
              <h3 className="text-2xl font-bold mb-6">Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <a 
                  href="/about" 
                  className="text-blue-100 hover:text-white transition-colors duration-200"
                >
                  About Us
                </a>
                <a 
                  href="/contact" 
                  className="text-blue-100 hover:text-white transition-colors duration-200"
                >
                  Contact Us
                </a>
                <a 
                  href="/privacy" 
                  className="text-blue-100 hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </a>
                <a 
                  href="/terms" 
                  className="text-blue-100 hover:text-white transition-colors duration-200"
                >
                  Terms & Conditions
                </a>
                <a 
                  href="/faqs" 
                  className="text-blue-100 hover:text-white transition-colors duration-200"
                >
                  FAQs
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/20">
            {/* Copyright */}
            <div className="text-blue-100 text-sm mb-4 md:mb-0">
              Copyright PRISM
            </div>

            {/* Back to Top Button */}
            <button
              onClick={scrollToTop}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-sm font-medium">BACK TO TOP</span>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <ChevronUp className="w-4 h-4 text-blue-600" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;