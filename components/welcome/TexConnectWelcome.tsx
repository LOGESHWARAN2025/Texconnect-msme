import React, { useState } from 'react';
import { Check, Star, Users, TrendingUp, Phone, Mail, MapPin, Send, Package, Shield, Zap, Clock, Award, ChevronDown, Menu, X, Shirt } from 'lucide-react';

interface TexConnectWelcomeProps {
  onGetStarted?: () => void;
  onBookDemo?: () => void;
}

export default function TexConnectWelcome({ onGetStarted, onBookDemo }: TexConnectWelcomeProps) {
  const [currentPage, setCurrentPage] = useState('features');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState('en');

  const translations = {
    en: {
      features: 'Features',
      pricing: 'Pricing',
      successStories: 'Success Stories',
      support: 'Support',
      contact: 'Contact',
      getStarted: 'Get Started',
      learnMore: 'Learn More',
      
      // Features
      featuresTitle: 'Powerful Features for Tiruppur Textile Industry',
      featuresSubtitle: 'Everything you need to manage your textile inventory efficiently',
      
      // Pricing
      pricingTitle: 'Simple, Transparent Pricing',
      pricingSubtitle: 'Choose the perfect plan for your business',
      perMonth: '/month',
      choosePlan: 'Choose Plan',
      
      // Success Stories
      successTitle: 'Success Stories from Tiruppur',
      successSubtitle: 'See how TexConnect transformed textile businesses',
      
      // Support
      supportTitle: '24/7 Support & Help Center',
      supportSubtitle: 'We\'re here to help you succeed',
      
      // Contact
      contactTitle: 'Get in Touch',
      contactSubtitle: 'Have questions? We\'d love to hear from you',
      sendMessage: 'Send Message'
    },
    ta: {
      features: 'அம்சங்கள்',
      pricing: 'விலை',
      successStories: 'வெற்றிக் கதைகள்',
      support: 'ஆதரவு',
      contact: 'தொடர்பு',
      getStarted: 'தொடங்குங்கள்',
      learnMore: 'மேலும் அறிக',
      
      featuresTitle: 'திருப்பூர் ஜவுளித் தொழிலுக்கான சக்திவாய்ந்த அம்சங்கள்',
      featuresSubtitle: 'உங்கள் ஜவுளி சரக்குகளை திறம்பட நிர்வகிக்க தேவையான அனைத்தும்',
      
      pricingTitle: 'எளிய, வெளிப்படையான விலை',
      pricingSubtitle: 'உங்கள் வணிகத்திற்கு சரியான திட்டத்தைத் தேர்ந்தெடுக்கவும்',
      perMonth: '/மாதம்',
      choosePlan: 'திட்டத்தைத் தேர்வு செய்யவும்',
      
      successTitle: 'திருப்பூரின் வெற்றிக் கதைகள்',
      successSubtitle: 'TexConnect எவ்வாறு ஜவுளி வணிகங்களை மாற்றியது என்பதைப் பார்க்கவும்',
      
      supportTitle: '24/7 ஆதரவு & உதவி மையம்',
      supportSubtitle: 'நீங்கள் வெற்றி பெற நாங்கள் இங்கே இருக்கிறோம்',
      
      contactTitle: 'தொடர்பு கொள்ளுங்கள்',
      contactSubtitle: 'கேள்விகள் உள்ளதா? உங்களிடமிருந்து கேட்க விரும்புகிறோம்',
      sendMessage: 'செய்தி அனுப்பு'
    }
  };

  const t = translations[language as keyof typeof translations];

  const features = [
    {
      icon: Package,
      title: 'Complete Inventory Tracking',
      description: 'Track yarn, fabric, accessories, and finished goods with real-time updates',
      titleTa: 'முழுமையான சரக்கு கண்காணிப்பு',
      descriptionTa: 'நூல், துணி, துணைப்பொருட்கள் மற்றும் முடிக்கப்பட்ட பொருட்களை நிகழ்நேர புதுப்பிப்புகளுடன் கண்காணிக்கவும்'
    },
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      description: 'Get insights on sales trends, stock levels, and production efficiency',
      titleTa: 'ஸ்மார்ட் பகுப்பாய்வு',
      descriptionTa: 'விற்பனை போக்குகள், சரக்கு நிலைகள் மற்றும் உற்பத்தி திறன் பற்றிய நுண்ணறிவுகளைப் பெறுங்கள்'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Bank-grade security with automated backups and data encryption',
      titleTa: 'பாதுகாப்பான மற்றும் நம்பகமான',
      descriptionTa: 'தானியங்கு காப்புப்பிரதிகள் மற்றும் தரவு குறியாக்கத்துடன் வங்கி-தர பாதுகாப்பு'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Quick loading times and instant updates across all devices',
      titleTa: 'மின்னல் வேகம்',
      descriptionTa: 'அனைத்து சாதனங்களிலும் விரைவான ஏற்றும் நேரம் மற்றும் உடனடி புதுப்பிப்புகள்'
    },
    {
      icon: Users,
      title: 'Multi-User Access',
      description: 'Collaborate with your team with role-based permissions',
      titleTa: 'பல பயனர் அணுகல்',
      descriptionTa: 'பங்கு அடிப்படையிலான அனுமதிகளுடன் உங்கள் குழுவுடன் ஒத்துழைக்கவும்'
    },
    {
      icon: Clock,
      title: 'Offline Mode',
      description: 'Work without internet and sync automatically when connected',
      titleTa: 'ஆஃப்லைன் பயன்முறை',
      descriptionTa: 'இணையம் இல்லாமல் வேலை செய்து இணைக்கப்படும்போது தானாக ஒத்திசைக்கவும்'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      nameTa: 'தொடக்கம்',
      price: 'Free',
      priceTa: 'இலவசம்',
      features: [
        '5 users',
        '50 products',
        'Basic inventory',
        'Mobile app',
        'Email support'
      ],
      featuresTa: [
        '5 பயனர்கள்',
        '50 தயாரிப்புகள்',
        'அடிப்படை சரக்கு',
        'மொபைல் ஆப்',
        'மின்னஞ்சல் ஆதரவு'
      ],
      popular: false
    },
    {
      name: 'Professional',
      nameTa: 'தொழில்முறை',
      price: '₹999',
      priceTa: '₹999',
      features: [
        '20 users',
        '500 products',
        'Advanced analytics',
        'GST integration',
        'Priority support',
        'Offline sync'
      ],
      featuresTa: [
        '20 பயனர்கள்',
        '500 தயாரிப்புகள்',
        'மேம்பட்ட பகுப்பாய்வு',
        'GST ஒருங்கிணைப்பு',
        'முன்னுரிமை ஆதரவு',
        'ஆஃப்லைன் ஒத்திசைவு'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      nameTa: 'நிறுவனம்',
      price: 'Custom',
      priceTa: 'தனிப்பயன்',
      features: [
        'Unlimited users',
        'Unlimited products',
        'Custom workflows',
        'API access',
        'Dedicated manager',
        'On-site training'
      ],
      featuresTa: [
        'வரம்பற்ற பயனர்கள்',
        'வரம்பற்ற தயாரிப்புகள்',
        'தனிப்பயன் பணிப்பாய்வுகள்',
        'API அணுகல்',
        'அர்ப்பணிப்பு மேலாளர்',
        'தளத்தில் பயிற்சி'
      ],
      popular: false
    }
  ];

  const successStories = [
    {
      company: 'Kumar Knitwears',
      companyTa: 'குமார் நெட்வேர்ஸ்',
      location: 'Tiruppur',
      testimonial: 'TexConnect reduced our material wastage by 30%. Real-time inventory tracking helped us match orders perfectly with available stock.',
      testimonialTa: 'TexConnect எங்கள் பொருள் விரயத்தை 30% குறைத்தது. நிகழ்நேர சரக்கு கண்காணிப்பு ஆர்டர்களை கிடைக்கும் சரக்குடன் சரியாகப் பொருத்த உதவியது.',
      impact: '30% reduction in wastage',
      impactTa: '30% விரயம் குறைப்பு',
      revenue: '₹2Cr annual revenue',
      revenueTa: '₹2Cr வருடாந்திர வருவாய்'
    },
    {
      company: 'Priya Textiles',
      companyTa: 'பிரியா டெக்ஸ்டைல்ஸ்',
      location: 'Tiruppur',
      testimonial: 'Managing 50+ international orders was chaotic. TexConnect gave us real-time visibility of production status and improved our delivery times.',
      testimonialTa: '50+ சர்வதேச ஆர்டர்களை நிர்வகிப்பது குழப்பமாக இருந்தது. TexConnect உற்பத்தி நிலையின் நிகழ்நேர பார்வையை வழங்கியது.',
      impact: '40% faster delivery',
      impactTa: '40% வேகமான விநியோகம்',
      revenue: '₹5Cr annual revenue',
      revenueTa: '₹5Cr வருடாந்திர வருவாய்'
    },
    {
      company: 'Senthil Industries',
      companyTa: 'செந்தில் இண்டஸ்ட்ரீஸ்',
      location: 'Tiruppur',
      testimonial: 'The Tamil interface helped our floor supervisors adopt it quickly. Offline mode is a game-changer for our production floor.',
      testimonialTa: 'தமிழ் இடைமுகம் எங்கள் மேற்பார்வையாளர்கள் விரைவாக ஏற்றுக்கொள்ள உதவியது. ஆஃப்லைன் பயன்முறை எங்கள் உற்பத்தி தளத்திற்கு ஒரு கேம் சேஞ்சர்.',
      impact: '50% time saved',
      impactTa: '50% நேரம் சேமிப்பு',
      revenue: '₹3.5Cr annual revenue',
      revenueTa: '₹3.5Cr வருடாந்திர வருவாய்'
    }
  ];

  const supportOptions = [
    {
      icon: Phone,
      title: 'Phone Support',
      titleTa: 'தொலைபேசி ஆதரவு',
      description: '24/7 phone support in Tamil and English',
      descriptionTa: 'தமிழ் மற்றும் ஆங்கிலத்தில் 24/7 தொலைபேசி ஆதரவு',
      contact: '+91 98765 43210'
    },
    {
      icon: Mail,
      title: 'Email Support',
      titleTa: 'மின்னஞ்சல் ஆதரவு',
      description: 'Get responses within 2 hours',
      descriptionTa: '2 மணி நேரத்திற்குள் பதில்களைப் பெறுங்கள்',
      contact: 'support@texconnect.in'
    },
    {
      icon: Users,
      title: 'Training Sessions',
      titleTa: 'பயிற்சி அமர்வுகள்',
      description: 'Free on-site training in Tiruppur',
      descriptionTa: 'திருப்பூரில் இலவச தளத்தில் பயிற்சி',
      contact: 'Schedule Now'
    }
  ];

  const renderFeatures = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {language === 'en' ? t.featuresTitle : translations.ta.featuresTitle}
          </h1>
          <p className="text-xl text-gray-600">
            {language === 'en' ? t.featuresSubtitle : translations.ta.featuresSubtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100">
              <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="h-8 w-8 text-indigo-600" />
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

        <div className="mt-16 text-center">
          <button onClick={onGetStarted} className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg">
            {t.getStarted}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.pricingTitle}</h1>
          <p className="text-xl text-gray-600">{t.pricingSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, idx) => (
            <div key={idx} className={`bg-white rounded-3xl p-8 shadow-lg ${plan.popular ? 'border-4 border-indigo-600 transform scale-105' : 'border border-gray-200'} relative`}>
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    POPULAR
                  </span>
                </div>
              )}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {language === 'en' ? plan.name : plan.nameTa}
                </h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {language === 'en' ? plan.price : plan.priceTa}
                  </span>
                  {plan.price !== 'Free' && plan.price !== 'Custom' && (
                    <span className="text-gray-600 ml-2">{t.perMonth}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {(language === 'en' ? plan.features : plan.featuresTa).map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button onClick={onGetStarted} className={`w-full py-4 rounded-xl font-semibold transition-colors ${
                plan.popular 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}>
                {t.choosePlan}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSuccessStories = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.successTitle}</h1>
          <p className="text-xl text-gray-600">{t.successSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-1 gap-8">
          {successStories.map((story, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all border border-gray-100">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Award className="h-10 w-10 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {language === 'en' ? story.company : story.companyTa}
                  </h3>
                  <p className="text-indigo-600 font-medium mb-4">📍 {story.location}</p>
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    "{language === 'en' ? story.testimonial : story.testimonialTa}"
                  </p>
                  <div className="flex gap-6">
                    <div className="bg-green-50 px-6 py-3 rounded-xl">
                      <p className="text-green-700 font-bold">
                        {language === 'en' ? story.impact : story.impactTa}
                      </p>
                    </div>
                    <div className="bg-indigo-50 px-6 py-3 rounded-xl">
                      <p className="text-indigo-700 font-bold">
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

  const renderSupport = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.supportTitle}</h1>
          <p className="text-xl text-gray-600">{t.supportSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {supportOptions.map((option, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <option.icon className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {language === 'en' ? option.title : option.titleTa}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'en' ? option.description : option.descriptionTa}
              </p>
              <p className="text-indigo-600 font-bold text-lg">{option.contact}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              { q: 'How do I get started?', a: 'Simply sign up for a free account and our team will guide you through the setup process.' },
              { q: 'Is training included?', a: 'Yes! We provide free on-site training in Tiruppur for all Professional and Enterprise plans.' },
              { q: 'Can I use it offline?', a: 'Absolutely! Our offline mode lets you work without internet and syncs automatically when connected.' },
              { q: 'What languages are supported?', a: 'Currently we support English and Tamil, with more languages coming soon.' }
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">{faq.q}</h4>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.contactTitle}</h1>
          <p className="text-xl text-gray-600">{t.contactSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Office Location</h3>
                  <p className="text-gray-600">Kumaran Road, Tiruppur - 641601<br />Tamil Nadu, India</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Phone</h3>
                  <p className="text-gray-600">+91 98765 43210<br />Mon-Sat: 9 AM - 7 PM</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600">support@texconnect.in<br />sales@texconnect.in</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-10 shadow-lg border border-gray-100">
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your phone"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Send className="h-5 w-5" />
                {t.sendMessage}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shirt className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">TexConnect</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => setCurrentPage('features')} className={`font-medium transition-colors ${currentPage === 'features' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}>
                {t.features}
              </button>
              <button onClick={() => setCurrentPage('pricing')} className={`font-medium transition-colors ${currentPage === 'pricing' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}>
                {t.pricing}
              </button>
              <button onClick={() => setCurrentPage('success')} className={`font-medium transition-colors ${currentPage === 'success' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}>
                {t.successStories}
              </button>
              <button onClick={() => setCurrentPage('support')} className={`font-medium transition-colors ${currentPage === 'support' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}>
                {t.support}
              </button>
              <button onClick={() => setCurrentPage('contact')} className={`font-medium transition-colors ${currentPage === 'contact' ? 'text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}>
                {t.contact}
              </button>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en">English</option>
                <option value="ta">தமிழ்</option>
              </select>
              <button onClick={onGetStarted} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                {t.getStarted}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              <button onClick={() => { setCurrentPage('features'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700 hover:text-indigo-600">
                {t.features}
              </button>
              <button onClick={() => { setCurrentPage('pricing'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700 hover:text-indigo-600">
                {t.pricing}
              </button>
              <button onClick={() => { setCurrentPage('success'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700 hover:text-indigo-600">
                {t.successStories}
              </button>
              <button onClick={() => { setCurrentPage('support'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700 hover:text-indigo-600">
                {t.support}
              </button>
              <button onClick={() => { setCurrentPage('contact'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-gray-700 hover:text-indigo-600">
                {t.contact}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      {currentPage === 'features' && renderFeatures()}
      {currentPage === 'pricing' && renderPricing()}
      {currentPage === 'success' && renderSuccessStories()}
      {currentPage === 'support' && renderSupport()}
      {currentPage === 'contact' && renderContact()}
    </div>
  );
}
