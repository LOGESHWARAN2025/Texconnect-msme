import React, { useState } from 'react';
import { Menu, X, Package, BarChart3, Bell, Users, Globe, Smartphone, QrCode, TrendingUp, Scissors, Shirt, ArrowRight } from 'lucide-react';
import { useLocalization } from '../hooks/useLocalization';

interface LandingPageProps {
  onGetStarted: () => void;
  onBookDemo: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onBookDemo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, currentLanguage, setLanguage } = useLocalization();

  // TexConnect Logo Component
  const TexConnectLogo = () => (
    <div className="flex items-center space-x-2">
      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
      </svg>
      <span className="text-xl font-bold text-gray-900">TexConnect</span>
    </div>
  );

  const content = {
    en: {
      nav: ['Home', 'Features', 'Pricing', 'Success Stories', 'Support', 'Contact'],
      hero: {
        badge: '🇮🇳 Made for Tiruppur Textile Industry',
        title: 'Smart Inventory Management for Tiruppur Textile Industry',
        subtitle: 'Manage fabric, yarn, WIP, and finished garments digitally - Built for Tiruppur exporters and manufacturers',
        cta1: 'Start Free Trial',
        cta2: 'Book Demo'
      },
      stats: [
        { value: '850+', label: 'Textile Units' },
        { value: '₹120Cr+', label: 'Inventory Value' },
        { value: '5L+', label: 'Garments Tracked' },
        { value: '24/7', label: 'Support' }
      ],
      features: [
        { icon: Package, title: 'Complete Textile Inventory', desc: 'Track raw materials (yarn, fabric, accessories), work-in-progress, and finished garments' },
        { icon: Scissors, title: 'Production Planning', desc: 'Plan cutting, stitching, and finishing schedules based on order deadlines' },
        { icon: Bell, title: 'Smart Reorder Alerts', desc: 'Automated alerts for yarn, fabric, and accessory reordering' },
        { icon: Users, title: 'Buyer & Supplier Management', desc: 'Manage international buyers, local suppliers, and payment schedules' },
        { icon: QrCode, title: 'Barcode/QR Scanning', desc: 'Quick inventory tracking with barcode and QR code scanning' },
        { icon: Smartphone, title: 'Offline Factory Mode', desc: 'Work without internet on factory floor and auto-sync' }
      ],
      solutions: {
        title: 'Solutions for Every Textile Business',
        list: [
          { name: 'Garment Exporters', desc: 'Track bulk orders, shipping deadlines, and buyer specifications', color: 'bg-blue-500', icon: Shirt },
          { name: 'Knitwear Manufacturers', desc: 'Manage yarn inventory, dyeing schedules, and knitting production', color: 'bg-orange-500', icon: Package },
          { name: 'Job Work Units', desc: 'Track cutting, stitching, embroidery, and printing orders', color: 'bg-green-500', icon: Scissors },
          { name: 'Fabric Traders', desc: 'Manage fabric stock, color/GSM variants, and distributor orders', color: 'bg-purple-500', icon: TrendingUp }
        ]
      },
      testimonials: [
        { name: 'Rajesh Kumar', company: 'Kumar Knitwears, Tiruppur', text: 'TexConnect reduced our material wastage by 30%. Now we track every meter of fabric perfectly.' },
        { name: 'Priya Textiles', company: 'Export Unit, Tiruppur', text: 'Managing 50+ international orders was chaotic. TexConnect gives us real-time visibility.' },
        { name: 'Senthil Industries', company: 'Job Work Unit, Tiruppur', text: 'The Tamil interface helped our floor supervisors adopt it quickly. Offline mode is a game-changer!' }
      ],
      footer: {
        tagline: 'Empowering Tiruppur textile industry with smart digital inventory management solutions',
        copyright: '© 2025 TexConnect. Proudly serving Tiruppur textile industry'
      }
    },
    ta: {
      nav: ['முகப்பு', 'அம்சங்கள்', 'விலை', 'வெற்றிக் கதைகள்', 'ஆதரவு', 'தொடர்பு'],
      hero: {
        badge: '🇮🇳 திருப்பூர் ஜவுளித் தொழிலுக்காக உருவாக்கப்பட்டது',
        title: 'திருப்பூர் ஜவுளித் தொழிலுக்கான ஸ்மார்ட் சரக்கு மேலாண்மை',
        subtitle: 'துணி, நூல், WIP மற்றும் முடிக்கப்பட்ட ஆடைகளை டிஜிட்டல் முறையில் நிர்வகிக்கவும்',
        cta1: 'இலவச சோதனையைத் தொடங்குங்கள்',
        cta2: 'டெமோவைப் பதிவு செய்யுங்கள்'
      },
      stats: [
        { value: '850+', label: 'ஜவுளி அலகுகள்' },
        { value: '₹120Cr+', label: 'சரக்கு மதிப்பு' },
        { value: '5L+', label: 'ஆடைகள் கண்காணிக்கப்பட்டன' },
        { value: '24/7', label: 'ஆதரவு' }
      ],
      features: [
        { icon: Package, title: 'முழுமையான ஜவுளி சரக்கு', desc: 'பச்சை பொருட்கள், வேலை-முன்னேற்றம் மற்றும் முடிக்கப்பட்ட ஆடைகளைக் கண்காணிக்கவும்' },
        { icon: Scissors, title: 'உற்பத்தி திட்டமிடல்', desc: 'ஆர்டர் காலக்கெடு அடிப்படையில் வெட்டுதல், தையல் மற்றும் முடித்தல் திட்டமிடுங்கள்' },
        { icon: Bell, title: 'ஸ்மார்ட் மறுஆர்டர் எச்சரிக்கைகள்', desc: 'நூல், துணி மற்றும் பாகங்களை மறுஆர்டர் செய்ய தானியங்கி எச்சரிக்கைகள்' },
        { icon: Users, title: 'வாங்குபவர் & சப்ளையர் மேலாண்மை', desc: 'சர்வதேச வாங்குபவர்கள் மற்றும் உள்ளூர் சப்ளையர்களை நிர்வகிக்கவும்' },
        { icon: QrCode, title: 'பார்கோடு/QR ஸ்கேனிங்', desc: 'மொபைல் சாதனங்களில் விரைவான சரக்கு கண்காணிப்பு' },
        { icon: Smartphone, title: 'ஆஃப்லைன் ஆலை பயன்முறை', desc: 'ஆலை தளத்தில் இணையம் இல்லாமல் வேலை செய்யுங்கள்' }
      ],
      solutions: {
        title: 'ஒவ்வொரு ஜவுளி வணிகத்திற்கும் தீர்வுகள்',
        list: [
          { name: 'ஆடை ஏற்றுமதியாளர்கள்', desc: 'மொத்த ஆர்டர்கள் மற்றும் ஷிப்பிங் காலக்கெடு கண்காணிக்கவும்', color: 'bg-blue-500', icon: Shirt },
          { name: 'நெசவு உற்பத்தியாளர்கள்', desc: 'நூல் சரக்கு மற்றும் சாயமிடுதல் அட்டவணைகளை நிர்வகிக்கவும்', color: 'bg-orange-500', icon: Package },
          { name: 'வேலை அலகுகள்', desc: 'பல வாடிக்கையாளர்களிடமிருந்து ஆர்டர்களைக் கண்காணிக்கவும்', color: 'bg-green-500', icon: Scissors },
          { name: 'துணி வர்த்தகர்கள்', desc: 'துணி இருப்பு மற்றும் விநியோகஸ்தர் ஆர்டர்களை நிர்வகிக்கவும்', color: 'bg-purple-500', icon: TrendingUp }
        ]
      },
      testimonials: [
        { name: 'ராஜேஷ் குமார்', company: 'குமார் நெட்வேர்ஸ், திருப்பூர்', text: 'TexConnect எங்கள் பொருள் விரயத்தை 30% குறைத்தது.' },
        { name: 'பிரியா டெக்ஸ்டைல்ஸ்', company: 'ஏற்றுமதி அலகு, திருப்பூர்', text: 'TexConnect உண்மையான நேர உற்பத்தி நிலையைக் காட்டுகிறது.' },
        { name: 'செந்தில் இண்டஸ்ட்ரீஸ்', company: 'வேலை அலகு, திருப்பூர்', text: 'தமிழ் இடைமுகம் மற்றும் ஆஃப்லைன் பயன்முறை ஒரு கேம் சேஞ்சர்!' }
      ],
      footer: {
        tagline: 'திருப்பூர் ஜவுளித் தொழிலை ஸ்மார்ட் டிஜிட்டல் சரக்கு மேலாண்மை தீர்வுகளுடன் அதிகாரமளித்தல்',
        copyright: '© 2025 TexConnect. திருப்பூர் ஜவுளித் தொழிலுக்கு பெருமையுடன் சேவை செய்கிறது'
      }
    }
  };

  const currentContent = content[currentLanguage as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <TexConnectLogo />
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {currentContent.nav.map((item, idx) => (
                <a key={idx} href="#" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">
                  {item}
                </a>
              ))}
              <button
                onClick={() => setLanguage()}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors font-semibold"
              >
                <Globe className="h-4 w-4" />
                <span>{currentLanguage === 'en' ? 'தமிழ்' : 'EN'}</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 pt-2 pb-4 space-y-2">
              {currentContent.nav.map((item, idx) => (
                <a key={idx} href="#" className="block py-2 text-gray-700 hover:text-indigo-600 font-medium">
                  {item}
                </a>
              ))}
              <button
                onClick={() => setLanguage()}
                className="flex items-center space-x-2 w-full py-2 px-4 rounded-lg bg-indigo-50 text-indigo-600 font-semibold"
              >
                <Globe className="h-4 w-4" />
                <span>{currentLanguage === 'en' ? 'தமிழ்' : 'English'}</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-indigo-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            {currentContent.hero.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            {currentContent.hero.title}
          </h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            {currentContent.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onGetStarted}
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg flex items-center justify-center space-x-2"
            >
              <span>{currentContent.hero.cta1}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              onClick={onBookDemo}
              className="bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition-colors border-2 border-indigo-400"
            >
              {currentContent.hero.cta2}
            </button>
          </div>
          <p className="text-indigo-200 mt-4 text-sm">
            {currentLanguage === 'en' 
              ? '✓ No credit card required  ✓ Setup in 5 minutes  ✓ Free training included' 
              : '✓ கிரெடிட் கார்டு தேவையில்லை  ✓ 5 நிமிடங்களில் அமைவு  ✓ இலவச பயிற்சி'}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {currentContent.stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{stat.value}</div>
                <div className="text-gray-600 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {currentLanguage === 'en' ? 'Everything Tiruppur Textile Units Need' : 'திருப்பூர் ஜவுளி அலகுகளுக்கு தேவையான அனைத்தும்'}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {currentLanguage === 'en'
              ? 'From yarn procurement to garment shipping - manage your entire textile operation digitally'
              : 'நூல் கொள்முதல் முதல் ஆடை ஷிப்பிங் வரை - உங்கள் முழு ஜவுளி செயல்பாட்டை டிஜிட்டல் முறையில் நிர்வகிக்கவும்'}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentContent.features.map((feature, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                <feature.icon className="h-12 w-12 text-indigo-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {currentContent.solutions.title}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentContent.solutions.list.map((solution, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${solution.color} rounded-lg mb-4 flex items-center justify-center`}>
                  <solution.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{solution.name}</h3>
                <p className="text-gray-600 text-sm">{solution.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {currentLanguage === 'en' ? 'Trusted by Tiruppur Textile Leaders' : 'திருப்பூர் ஜவுளி தலைவர்களால் நம்பப்படுகிறது'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {currentContent.testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="text-indigo-600 text-4xl mb-4">"</div>
                <p className="text-gray-700 mb-4 italic">{testimonial.text}</p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-indigo-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {currentLanguage === 'en' ? 'Join 850+ Tiruppur Textile Units on TexConnect' : '850+ திருப்பூர் ஜவுளி அலகுகளுடன் TexConnect இல் சேருங்கள்'}
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            {currentLanguage === 'en' ? 'Free training sessions available at our Tiruppur office' : 'எங்கள் திருப்பூர் அலுவலகத்தில் இலவச பயிற்சி அமர்வுகள் கிடைக்கின்றன'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onGetStarted}
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              {currentLanguage === 'en' ? 'Start Free Trial' : 'இலவச சோதனையைத் தொடங்குங்கள்'}
            </button>
            <button 
              onClick={onBookDemo}
              className="bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition-colors border-2 border-indigo-400"
            >
              {currentLanguage === 'en' ? 'Schedule Demo in Tiruppur' : 'திருப்பூரில் டெமோவை திட்டமிடுங்கள்'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center">
              <Shirt className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">TexConnect</span>
          </div>
          <p className="text-gray-400 text-sm max-w-md">
            {currentContent.footer.tagline}
          </p>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>{currentContent.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
