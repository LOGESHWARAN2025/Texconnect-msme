import React from 'react';

interface FooterComponentProps {
  onNavigate?: (page: string) => void;
  onGetStarted?: () => void;
}

export default function FooterComponent({ onNavigate, onGetStarted }: FooterComponentProps) {
  return (
    <footer className="relative overflow-hidden" style={{ backgroundColor: 'white' }}>
      <div className="py-16">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full -mr-48 -mt-48" style={{ backgroundColor: 'rgba(79, 70, 229, 0.03)' }}></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full -ml-36 -mb-36" style={{ backgroundColor: 'rgba(79, 70, 229, 0.03)' }}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Top Section - Brand & CTA */}
          <div className="grid md:grid-cols-2 gap-12 mb-12 pb-12" style={{ borderBottom: `1px solid rgba(79, 70, 229, 0.1)` }}>
            {/* Brand Section */}
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" style={{ color: 'rgb(79, 70, 229)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
                  </svg>
                </div>
                <span className="text-3xl font-bold" style={{ color: 'rgb(79, 70, 229)' }}>TexConnect</span>
              </div>
              <p className="text-gray-700 text-base leading-relaxed max-w-sm">Smart inventory management for Tiruppur textile industry. Empowering textile businesses with digital solutions.</p>
            </div>

            {/* CTA Section */}
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>Ready to Transform Your Business?</h3>
              <p className="text-gray-600 mb-6">Join 850+ textile units already using TexConnect</p>
              <button 
                onClick={onGetStarted}
                className="px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 w-fit text-white"
                style={{ backgroundColor: 'rgb(79, 70, 229)' }}
              >
                Get Started Now →
              </button>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Product */}
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: 'rgb(79, 70, 229)' }}>
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: 'rgb(79, 70, 229)' }}></div>
                Product
              </h4>
              <ul className="space-y-3">
                <li><button onClick={() => onNavigate?.('features')} className="transition font-medium hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Features</button></li>
                <li><button onClick={() => onNavigate?.('success')} className="transition font-medium hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Success Stories</button></li>
                <li><button onClick={() => onNavigate?.('support')} className="transition font-medium hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Support</button></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: 'rgb(79, 70, 229)' }}>
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: 'rgb(79, 70, 229)' }}></div>
                Company
              </h4>
              <ul className="space-y-3">
                <li><button onClick={() => onNavigate?.('contact')} className="transition font-medium hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Contact</button></li>
                <li><button onClick={() => onNavigate?.('privacy')} className="transition font-medium hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Privacy Policy</button></li>
                <li><button onClick={() => onNavigate?.('terms')} className="transition font-medium hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Terms of Service</button></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: 'rgb(79, 70, 229)' }}>
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: 'rgb(79, 70, 229)' }}></div>
                Resources
              </h4>
              <ul className="space-y-3">
                <li><button onClick={() => onNavigate?.('documentation')} className="transition font-medium hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Documentation</button></li>
                <li><button onClick={() => onNavigate?.('blog')} className="transition font-medium hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Blog</button></li>
                <li><button onClick={() => onNavigate?.('faq')} className="transition font-medium hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>FAQ</button></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: 'rgb(79, 70, 229)' }}>
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: 'rgb(79, 70, 229)' }}></div>
                Contact
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2" style={{ color: 'rgb(79, 70, 229)' }}>
                  <span>📧</span>
                  <a href="mailto:texconnect98@gmail.com" className="hover:opacity-70 transition">texconnect98@gmail.com</a>
                </li>
                <li className="flex items-center gap-2" style={{ color: 'rgb(79, 70, 229)' }}>
                  <span>📞</span>
                  <a href="tel:+916374516006" className="hover:opacity-70 transition">+91 63745 16006</a>
                </li>
                <li className="flex items-center gap-2" style={{ color: 'rgb(79, 70, 229)' }}>
                  <span>📍</span>
                  <span>Tiruppur, Tamil Nadu</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8" style={{ borderTop: `1px solid rgba(79, 70, 229, 0.1)` }}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-sm text-gray-600">© 2025 TexConnect. All rights reserved. | Crafted for Tiruppur Textile Industry</p>
              <div className="flex gap-6">
                <a href="#" className="transition font-medium text-sm hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Facebook</a>
                <a href="#" className="transition font-medium text-sm hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>Twitter</a>
                <a href="#" className="transition font-medium text-sm hover:opacity-70" style={{ color: 'rgb(79, 70, 229)' }}>LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
