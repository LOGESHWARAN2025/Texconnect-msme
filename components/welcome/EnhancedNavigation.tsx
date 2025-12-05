import React, { useState } from 'react';
import { Menu, X, Globe, Shirt } from 'lucide-react';

interface EnhancedNavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onGetStarted?: () => void;
  onBookDemo?: () => void;
}

export default function EnhancedNavigation({
  currentPage,
  onPageChange,
  language,
  onLanguageChange,
  onGetStarted
}: EnhancedNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', labelTa: 'முகப்பு' },
    { id: 'features', label: 'Features', labelTa: 'அம்சங்கள்' },
    { id: 'success', label: 'Success Stories', labelTa: 'வெற்றிக் கதைகள்' },
    { id: 'support', label: 'Support', labelTa: 'ஆதரவு' },
    { id: 'contact', label: 'Contact', labelTa: 'தொடர்பு' }
  ];

  const handleNavClick = (pageId: string) => {
    onPageChange(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">TexConnect</span>
              <span className="text-xs text-gray-600">MSME Dashboard</span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`transition-colors font-medium ${
                  currentPage === item.id
                    ? 'text-gray-700 hover:text-gray-900'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                style={currentPage === item.id ? { color: 'rgb(79, 70, 229)' } : {}}
              >
                {language === 'en' ? item.label : item.labelTa}
              </button>
            ))}

            {/* Language Selector */}
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'ta' : 'en')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-semibold"
              style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'rgb(79, 70, 229)' }}
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'ta' : 'en')}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm font-semibold"
              style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'rgb(79, 70, 229)' }}
            >
              <Globe className="h-4 w-4" />
              <span>{language === 'en' ? 'தமிழ்' : 'EN'}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900"
              style={mobileMenuOpen ? { color: 'rgb(79, 70, 229)' } : {}}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-gray-200 pt-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`block w-full text-left py-2 px-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={currentPage === item.id ? { backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'rgb(79, 70, 229)' } : {}}
              >
                {language === 'en' ? item.label : item.labelTa}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
