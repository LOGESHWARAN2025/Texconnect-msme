import React, { useState } from 'react';
import { Check, Star, Users, TrendingUp, Phone, Mail, MapPin, Send, Package, Shield, Zap, Clock, Award, ArrowRight, Shirt } from 'lucide-react';
import EnhancedNavigation from './EnhancedNavigation';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import TermsOfServicePage from './TermsOfServicePage';
import DocumentationPage from './DocumentationPage';
import BlogPage from './BlogPage';
import FAQPage from './FAQPage';
import { submitContactForm } from '../../src/services/contactService';

interface TexConnectWelcomeEnhancedProps {
  onGetStarted?: () => void;
  onBookDemo?: () => void;
  onSignup?: () => void;
}

export default function TexConnectWelcomeEnhanced({ onGetStarted, onBookDemo, onSignup }: TexConnectWelcomeEnhancedProps) {
  const [currentPage, setCurrentPage] = useState('home');
  const [language, setLanguage] = useState('en');
  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactMessage, setContactMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const translations = {
    en: {
      // Home Page
      homeTitle: 'Smart Inventory Management for Tiruppur Textile Industry',
      homeSubtitle: 'Manage fabric, yarn, WIP, and finished garments digitally - Built for Tiruppur exporters and manufacturers',
      homeCtaStart: 'Start Free Trial',
      homeCtaDemo: 'Get Started',
      
      // Features
      featuresTitle: 'Powerful Features for Tiruppur Textile Industry',
      featuresSubtitle: 'Everything you need to manage your textile inventory efficiently',
      
      // Success Stories
      successTitle: 'Success Stories from Tiruppur',
      successSubtitle: 'See how TexConnect transformed textile businesses',
      
      // Support
      supportTitle: '24/7 Support & Help Center',
      supportSubtitle: 'We\'re here to help you succeed',
      
      // Contact
      contactTitle: 'Get in Touch',
      contactSubtitle: 'Have questions? We\'d love to hear from you',
      sendMessage: 'Send Message',
      
      // Stats
      stat1Value: '850+',
      stat1Label: 'Textile Units',
      stat2Value: '₹120Cr+',
      stat2Label: 'Inventory Value',
      stat3Value: '5L+',
      stat3Label: 'Garments Tracked',
      stat4Value: '24/7',
      stat4Label: 'Support'
    },
    ta: {
      // Home Page
      homeTitle: 'திருப்பூர் ஜவுளித் தொழிலுக்கான ஸ்மார்ட் சரக்கு மேலாண்மை',
      homeSubtitle: 'துணி, நூல், WIP மற்றும் முடிக்கப்பட்ட ஆடைகளை டிஜிட்டல் முறையில் நிர்வகிக்கவும்',
      homeCtaStart: 'இலவச சோதனை தொடங்குங்கள்',
      homeCtaDemo: 'தொடங்குங்கள்',
      
      // Features
      featuresTitle: 'திருப்பூர் ஜவுளித் தொழிலுக்கான சக்திவாய்ந்த அம்சங்கள்',
      featuresSubtitle: 'உங்கள் ஜவுளி சரக்குகளை திறம்பட நிர்வகிக்க தேவையான அனைத்தும்',
      
      // Success Stories
      successTitle: 'திருப்பூரின் வெற்றிக் கதைகள்',
      successSubtitle: 'TexConnect எவ்வாறு ஜவுளி வணிகங்களை மாற்றியது என்பதைப் பார்க்கவும்',
      
      // Support
      supportTitle: '24/7 ஆதரவு & உதவி மையம்',
      supportSubtitle: 'நீங்கள் வெற்றி பெற நாங்கள் இங்கே இருக்கிறோம்',
      
      // Contact
      contactTitle: 'தொடர்பு கொள்ளுங்கள்',
      contactSubtitle: 'கேள்விகள் உள்ளதா? உங்களிடமிருந்து கேட்க விரும்புகிறோம்',
      sendMessage: 'செய்தி அனுப்பு',
      
      // Stats
      stat1Value: '850+',
      stat1Label: 'ஜவுளி அலகுகள்',
      stat2Value: '₹120Cr+',
      stat2Label: 'சரக்கு மதிப்பு',
      stat3Value: '5L+',
      stat3Label: 'ஆடைகள் கண்காணிக்கப்பட்டன',
      stat4Value: '24/7',
      stat4Label: 'ஆதரவு'
    }
  };

  const t = translations[language as keyof typeof translations];

  const features = [
    {
      icon: Package,
      title: 'Complete Inventory Tracking',
      titleTa: 'முழுமையான சரக்கு கண்காணிப்பு',
      description: 'Track yarn, fabric, accessories, and finished goods with real-time updates',
      descriptionTa: 'நூல், துணி, துணைப்பொருட்கள் மற்றும் முடிக்கப்பட்ட பொருட்களை நிகழ்நேர புதுப்பிப்புகளுடன் கண்காணிக்கவும்'
    },
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      titleTa: 'ஸ்மார்ட் பகுப்பாய்வு',
      description: 'Get insights on sales trends, stock levels, and production efficiency',
      descriptionTa: 'விற்பனை போக்குகள், சரக்கு நிலைகள் மற்றும் உற்பத்தி திறன் பற்றிய நுண்ணறிவுகளைப் பெறுங்கள்'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      titleTa: 'பாதுகாப்பான மற்றும் நம்பகமான',
      description: 'Bank-grade security with automated backups and data encryption',
      descriptionTa: 'தானியங்கு காப்புப்பிரதிகள் மற்றும் தரவு குறியாக்கத்துடன் வங்கி-தர பாதுகாப்பு'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      titleTa: 'மின்னல் வேகம்',
      description: 'Quick loading times and instant updates across all devices',
      descriptionTa: 'அனைத்து சாதனங்களிலும் விரைவான ஏற்றும் நேரம் மற்றும் உடனடி புதுப்பிப்புகள்'
    },
    {
      icon: Users,
      title: 'Multi-User Access',
      titleTa: 'பல பயனர் அணுகல்',
      description: 'Collaborate with your team with role-based permissions',
      descriptionTa: 'பங்கு அடிப்படையிலான அனுமதிகளுடன் உங்கள் குழுவுடன் ஒத்துழைக்கவும்'
    },
    {
      icon: Clock,
      title: 'Offline Mode',
      titleTa: 'ஆஃப்லைன் பயன்முறை',
      description: 'Work without internet and sync automatically when connected',
      descriptionTa: 'இணையம் இல்லாமல் வேலை செய்து இணைக்கப்படும்போது தானாக ஒத்திசைக்கவும்'
    }
  ];

  const successStories = [
    {
      company: 'Kumar Knitwears',
      companyTa: 'குமார் நெட்வேர்ஸ்',
      location: 'Tiruppur',
      testimonial: 'TexConnect reduced our material wastage by 30%. Real-time inventory tracking helped us match orders perfectly with available stock.',
      testimonialTa: 'TexConnect எங்கள் பொருள் விரயத்தை 30% குறைத்தது.',
      impact: '30% reduction in wastage',
      impactTa: '30% விரயம் குறைப்பு',
      revenue: '₹2Cr annual revenue',
      revenueTa: '₹2Cr வருடாந்திர வருவாய்'
    },
    {
      company: 'Priya Textiles',
      companyTa: 'பிரியா டெக்ஸ்டைல்ஸ்',
      location: 'Tiruppur',
      testimonial: 'Managing 50+ international orders was chaotic. TexConnect gave us real-time visibility of production status.',
      testimonialTa: '50+ சர்வதேச ஆர்டர்களை நிர்வகிப்பது குழப்பமாக இருந்தது.',
      impact: '40% faster delivery',
      impactTa: '40% வேகமான விநியோகம்',
      revenue: '₹5Cr annual revenue',
      revenueTa: '₹5Cr வருடாந்திர வருவாய்'
    },
    {
      company: 'Senthil Industries',
      companyTa: 'செந்தில் இண்டஸ்ட்ரீஸ்',
      location: 'Tiruppur',
      testimonial: 'The Tamil interface helped our floor supervisors adopt it quickly. Offline mode is a game-changer!',
      testimonialTa: 'தமிழ் இடைமுகம் எங்கள் மேற்பார்வையாளர்கள் விரைவாக ஏற்றுக்கொள்ள உதவியது.',
      impact: '50% time saved',
      impactTa: '50% நேரம் சேமிப்பு',
      revenue: '₹3.5Cr annual revenue',
      revenueTa: '₹3.5Cr வருடாந்திர வருவாய்'
    }
  ];

  // Render Home Page
  const renderHome = () => (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="w-full py-20" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-6 px-4 py-2 rounded-full border" style={{ backgroundColor: 'rgba(79, 70, 229, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
              <span className="text-white font-semibold">🇮🇳 Made for Tiruppur Textile Industry</span>
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
              {t.homeTitle}
            </h1>
            <p className="text-xl text-white mb-12 max-w-3xl mx-auto opacity-90">
              {t.homeSubtitle}
            </p>
            <div className="flex gap-6 justify-center flex-wrap">
              <button
                onClick={onSignup}
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {t.homeCtaStart}
              </button>
              <button
                onClick={onGetStarted}
                className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl text-lg font-semibold hover:bg-white hover:text-indigo-600 transition-all shadow-lg"
              >
                {t.homeCtaDemo}
              </button>
            </div>
            <p className="text-white text-sm mt-6 opacity-80">✓ No credit card required ✓ Setup in 5 minutes ✓ Free training included</p>
          </div>
        </div>
      </div>

      {/* Stats Section with White Background */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: t.stat1Value, label: t.stat1Label },
              { value: t.stat2Value, label: t.stat2Label },
              { value: t.stat3Value, label: t.stat3Label },
              { value: t.stat4Value, label: t.stat4Label }
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border-2" style={{ borderColor: 'rgba(79, 70, 229, 0.2)' }}>
                <div className="text-4xl font-bold mb-2" style={{ color: 'rgb(79, 70, 229)' }}>{stat.value}</div>
                <div className="text-gray-700 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Features Page
  const renderFeatures = () => (
    <div className="min-h-screen py-20" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">{t.featuresTitle}</h1>
          <p className="text-xl text-white opacity-90">{t.featuresSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                <feature.icon className="h-8 w-8" style={{ color: 'rgb(79, 70, 229)' }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {language === 'en' ? feature.title : feature.titleTa}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {language === 'en' ? feature.description : feature.descriptionTa}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Success Stories Page
  const renderSuccess = () => (
    <div className="min-h-screen py-20" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">{t.successTitle}</h1>
          <p className="text-xl text-white opacity-90">{t.successSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-1 gap-8">
          {successStories.map((story, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all border border-gray-100">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                  <Award className="h-10 w-10" style={{ color: 'rgb(79, 70, 229)' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {language === 'en' ? story.company : story.companyTa}
                  </h3>
                  <p className="font-medium mb-4" style={{ color: 'rgb(79, 70, 229)' }}>📍 {story.location}</p>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    "{language === 'en' ? story.testimonial : story.testimonialTa}"
                  </p>
                  <div className="flex gap-6">
                    <div className="bg-green-50 px-6 py-3 rounded-xl">
                      <p className="text-green-700 font-bold">
                        {language === 'en' ? story.impact : story.impactTa}
                      </p>
                    </div>
                    <div className="px-6 py-3 rounded-xl" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                      <p className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>
                        {language === 'en' ? story.revenue : story.revenueTa}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Support Page
  const renderSupport = () => (
    <div className="min-h-screen py-20" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">{t.supportTitle}</h1>
          <p className="text-xl text-white opacity-90">{t.supportSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {[
            { icon: Phone, title: 'Phone Support', titleTa: 'தொலைபேசி ஆதரவு', desc: '24/7 support in Tamil and English', descTa: 'தமிழ் மற்றும் ஆங்கிலத்தில் 24/7 ஆதரவு', contact: '+91 63745 16006' },
            { icon: Mail, title: 'Email Support', titleTa: 'மின்னஞ்சல் ஆதரவு', desc: 'Get responses within 2 hours', descTa: '2 மணி நேரத்திற்குள் பதில்களைப் பெறுங்கள்', contact: 'texconnect98@gmail.com' }
          ].map((option, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                <option.icon className="h-10 w-10" style={{ color: 'rgb(79, 70, 229)' }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {language === 'en' ? option.title : option.titleTa}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'en' ? option.desc : option.descTa}
              </p>
              <p className="font-bold text-lg" style={{ color: 'rgb(79, 70, 229)' }}>{option.contact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Contact Page
  const renderContact = () => (
    <div className="min-h-screen py-20" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">{t.contactTitle}</h1>
          <p className="text-xl text-white opacity-90">{t.contactSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            {[
              { icon: MapPin, title: 'Office Location', desc: 'Kumaran Road, Tiruppur - 641601\nTamil Nadu, India' },
              { icon: Phone, title: 'Phone', desc: '+91 63745 16006\nMon-Sat: 9 AM - 7 PM' },
              { icon: Mail, title: 'Email', desc: 'texconnect98@gmail.com' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                    <item.icon className="h-6 w-6" style={{ color: 'rgb(79, 70, 229)' }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 whitespace-pre-line">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-lg border border-gray-100">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setContactSubmitting(true);
                setContactMessage(null);

                try {
                  const result = await submitContactForm(contactForm);
                  if (result) {
                    setContactMessage({
                      type: 'success',
                      text: 'Thank you! Your message has been sent successfully. We will get back to you soon.'
                    });
                    setContactForm({ fullName: '', email: '', phone: '', message: '' });
                  } else {
                    setContactMessage({
                      type: 'error',
                      text: 'Failed to send message. Please try again or contact us directly.'
                    });
                  }
                } catch (error) {
                  setContactMessage({
                    type: 'error',
                    text: 'An error occurred. Please try again later.'
                  });
                } finally {
                  setContactSubmitting(false);
                }
              }}
              className="space-y-6"
            >
              {contactMessage && (
                <div
                  className={`p-4 rounded-xl ${
                    contactMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {contactMessage.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={contactForm.fullName}
                  onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgb(79, 70, 229)' } as any}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgb(79, 70, 229)' } as any}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgb(79, 70, 229)' } as any}
                  placeholder="Enter your phone"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'rgb(79, 70, 229)' } as any}
                  placeholder="How can we help you?"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={contactSubmitting}
                className="w-full text-white px-6 py-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                style={{ backgroundColor: 'rgb(79, 70, 229)' }}
              >
                <Send className="h-5 w-5" />
                {contactSubmitting ? 'Sending...' : t.sendMessage}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Footer
  const renderFooter = () => {
    const isHomePage = currentPage === 'home';
    const footerBgColor = isHomePage ? 'rgb(79, 70, 229)' : 'white';
    const textColor = isHomePage ? 'white' : 'rgb(79, 70, 229)';
    const descriptionTextColor = isHomePage ? 'rgba(255, 255, 255, 0.9)' : 'rgb(79, 70, 229)';
    const ctaTextColor = isHomePage ? 'rgb(79, 70, 229)' : 'white';
    const borderColor = isHomePage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(79, 70, 229, 0.1)';
    const copyrightTextColor = isHomePage ? 'rgba(255, 255, 255, 0.8)' : 'rgb(79, 70, 229)';

    return (
      <footer className="relative overflow-hidden" style={{ backgroundColor: footerBgColor }}>
        <div className="py-16">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full -mr-48 -mt-48" style={{ backgroundColor: isHomePage ? 'rgba(255, 255, 255, 0.05)' : 'rgba(79, 70, 229, 0.03)' }}></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full -ml-36 -mb-36" style={{ backgroundColor: isHomePage ? 'rgba(255, 255, 255, 0.05)' : 'rgba(79, 70, 229, 0.03)' }}></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            {/* Top Section - Brand & CTA */}
            <div className="grid md:grid-cols-2 gap-12 mb-12 pb-12" style={{ borderBottom: `1px solid ${borderColor}` }}>
              {/* Brand Section */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: isHomePage ? 'rgba(255, 255, 255, 0.2)' : 'rgba(79, 70, 229, 0.1)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" style={{ color: textColor }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
                    </svg>
                  </div>
                  <span className="text-3xl font-bold" style={{ color: textColor }}>TexConnect</span>
                </div>
                <p className="text-base leading-relaxed max-w-sm" style={{ color: descriptionTextColor }}>Smart inventory management for Tiruppur textile industry. Empowering textile businesses with digital solutions.</p>
              </div>

              {/* CTA Section */}
              <div className="flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-4" style={{ color: textColor }}>Ready to Transform Your Business?</h3>
                <p className="mb-6" style={{ color: descriptionTextColor }}>Join 850+ textile units already using TexConnect</p>
                <button 
                  onClick={onGetStarted}
                  className="px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 w-fit"
                  style={{ backgroundColor: isHomePage ? 'white' : 'rgb(79, 70, 229)', color: ctaTextColor }}
                >
                  Get Started Now →
                </button>
              </div>
            </div>

            {/* Main Footer Content */}
            <div className="grid md:grid-cols-4 gap-10 mb-12">
              {/* Product */}
              <div>
                <h4 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: textColor }}>
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: textColor }}></div>
                  Product
                </h4>
                <ul className="space-y-3">
                  <li><button onClick={() => setCurrentPage('features')} className="transition font-medium hover:opacity-70" style={{ color: textColor }}>Features</button></li>
                  <li><button onClick={() => setCurrentPage('success')} className="transition font-medium hover:opacity-70" style={{ color: textColor }}>Success Stories</button></li>
                  <li><button onClick={() => setCurrentPage('support')} className="transition font-medium hover:opacity-70" style={{ color: textColor }}>Support</button></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: textColor }}>
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: textColor }}></div>
                  Company
                </h4>
                <ul className="space-y-3">
                  <li><button onClick={() => setCurrentPage('contact')} className="transition font-medium hover:opacity-70" style={{ color: textColor }}>Contact</button></li>
                  <li><button onClick={() => setCurrentPage('privacy')} className="transition font-medium hover:opacity-70" style={{ color: textColor }}>Privacy Policy</button></li>
                  <li><button onClick={() => setCurrentPage('terms')} className="transition font-medium hover:opacity-70" style={{ color: textColor }}>Terms of Service</button></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: textColor }}>
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: textColor }}></div>
                  Resources
                </h4>
                <ul className="space-y-3">
                  <li><button onClick={() => setCurrentPage('documentation')} className="transition font-medium hover:opacity-70" style={{ color: textColor }}>Documentation</button></li>
                  <li><button onClick={() => setCurrentPage('blog')} className="transition font-medium hover:opacity-70" style={{ color: textColor }}>Blog</button></li>
                  <li><button onClick={() => setCurrentPage('faq')} className="transition font-medium hover:opacity-70" style={{ color: textColor }}>FAQ</button></li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: textColor }}>
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: textColor }}></div>
                  Contact
                </h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2" style={{ color: textColor }}>
                    <span>📧</span>
                    <a href="mailto:texconnect98@gmail.com" className="hover:opacity-70 transition" style={{ color: textColor }}>texconnect98@gmail.com</a>
                  </li>
                  <li className="flex items-center gap-2" style={{ color: textColor }}>
                    <span>📞</span>
                    <a href="tel:+916374516006" className="hover:opacity-70 transition" style={{ color: textColor }}>+91 63745 16006</a>
                  </li>
                  <li className="flex items-center gap-2" style={{ color: textColor }}>
                    <span>📍</span>
                    <span>Tiruppur, Tamil Nadu</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="pt-8" style={{ borderTop: `1px solid ${borderColor}` }}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-sm" style={{ color: copyrightTextColor }}>© 2025 TexConnect. All rights reserved. | Crafted for Tiruppur Textile Industry</p>
                <div className="flex gap-6">
                  <a href="#" className="transition font-medium text-sm hover:opacity-70" style={{ color: textColor }}>Facebook</a>
                  <a href="#" className="transition font-medium text-sm hover:opacity-70" style={{ color: textColor }}>Twitter</a>
                  <a href="#" className="transition font-medium text-sm hover:opacity-70" style={{ color: textColor }}>LinkedIn</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <EnhancedNavigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        language={language}
        onLanguageChange={setLanguage}
        onGetStarted={onGetStarted}
      />

      <div className="flex-grow">
        {currentPage === 'home' && renderHome()}
        {currentPage === 'features' && renderFeatures()}
        {currentPage === 'success' && renderSuccess()}
        {currentPage === 'support' && renderSupport()}
        {currentPage === 'contact' && renderContact()}
        {currentPage === 'privacy' && <PrivacyPolicyPage onBack={() => setCurrentPage('home')} onNavigate={setCurrentPage} onGetStarted={onGetStarted} />}
        {currentPage === 'terms' && <TermsOfServicePage onBack={() => setCurrentPage('home')} onNavigate={setCurrentPage} onGetStarted={onGetStarted} />}
        {currentPage === 'documentation' && <DocumentationPage onBack={() => setCurrentPage('home')} onNavigate={setCurrentPage} onGetStarted={onGetStarted} />}
        {currentPage === 'blog' && <BlogPage onBack={() => setCurrentPage('home')} onNavigate={setCurrentPage} onGetStarted={onGetStarted} />}
        {currentPage === 'faq' && <FAQPage onBack={() => setCurrentPage('home')} onNavigate={setCurrentPage} onGetStarted={onGetStarted} />}
      </div>

      {renderFooter()}
    </div>
  );
}
