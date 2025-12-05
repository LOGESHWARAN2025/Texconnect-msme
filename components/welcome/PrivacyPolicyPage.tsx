import React from 'react';
import { ArrowLeft } from 'lucide-react';
import FooterComponent from './FooterComponent';

interface PrivacyPolicyPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onGetStarted?: () => void;
}

export default function PrivacyPolicyPage({ onBack, onNavigate, onGetStarted }: PrivacyPolicyPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow py-20" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 mb-6 text-white hover:opacity-80 transition"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
          )}
          <h1 className="text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white opacity-90 text-lg">Last updated: December 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-12 shadow-lg">
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>1. Introduction</h2>
              <p className="leading-relaxed">
                TexConnect ("we", "us", "our", or "Company") operates the TexConnect application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>2. Information Collection and Use</h2>
              <p className="leading-relaxed mb-4">We collect several different types of information for various purposes to provide and improve our Service to you.</p>
              <ul className="space-y-3 ml-6">
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span><strong>Personal Data:</strong> Email address, name, phone number, company details, GST information</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span><strong>Usage Data:</strong> Browser type, IP address, pages visited, time and date of visits</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span><strong>Inventory Data:</strong> Product information, stock levels, transaction records</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>3. Use of Data</h2>
              <p className="leading-relaxed mb-4">TexConnect uses the collected data for various purposes:</p>
              <ul className="space-y-2 ml-6">
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>To provide and maintain our Service</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>To notify you about changes to our Service</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>To allow you to participate in interactive features</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>To provide customer support</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>To gather analysis or valuable information to improve our Service</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>4. Security of Data</h2>
              <p className="leading-relaxed">
                The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>5. Changes to This Privacy Policy</h2>
              <p className="leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>6. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                <p className="font-semibold" style={{ color: 'rgb(79, 70, 229)' }}>📧 texconnect98@gmail.com</p>
                <p className="font-semibold" style={{ color: 'rgb(79, 70, 229)' }}>📞 +91 63745 16006</p>
              </div>
            </section>
          </div>
        </div>
      </div>
      </div>

      <FooterComponent onNavigate={onNavigate} onGetStarted={onGetStarted} />
    </div>
  );
}
