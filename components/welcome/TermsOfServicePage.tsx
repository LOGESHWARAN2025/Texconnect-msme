import React from 'react';
import { ArrowLeft } from 'lucide-react';
import FooterComponent from './FooterComponent';

interface TermsOfServicePageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onGetStarted?: () => void;
}

export default function TermsOfServicePage({ onBack, onNavigate, onGetStarted }: TermsOfServicePageProps) {
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
          <h1 className="text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-white opacity-90 text-lg">Last updated: December 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-12 shadow-lg">
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>1. Agreement to Terms</h2>
              <p className="leading-relaxed">
                By accessing and using the TexConnect application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>2. Use License</h2>
              <p className="leading-relaxed mb-4">Permission is granted to temporarily download one copy of the materials (information or software) on TexConnect for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="space-y-2 ml-6">
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>Modify or copy the materials</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>Use the materials for any commercial purpose or for any public display</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>Attempt to decompile or reverse engineer any software contained on TexConnect</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>Remove any copyright or other proprietary notations from the materials</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold" style={{ color: 'rgb(79, 70, 229)' }}>•</span>
                  <span>Transfer the materials to another person or "mirror" the materials on any other server</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>3. Disclaimer</h2>
              <p className="leading-relaxed">
                The materials on TexConnect are provided on an 'as is' basis. TexConnect makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>4. Limitations</h2>
              <p className="leading-relaxed">
                In no event shall TexConnect or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on TexConnect, even if TexConnect or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>5. Accuracy of Materials</h2>
              <p className="leading-relaxed">
                The materials appearing on TexConnect could include technical, typographical, or photographic errors. TexConnect does not warrant that any of the materials on its application are accurate, complete, or current. TexConnect may make changes to the materials contained on its application at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>6. Links</h2>
              <p className="leading-relaxed">
                TexConnect has not reviewed all of the sites linked to its application and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by TexConnect of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>7. Modifications</h2>
              <p className="leading-relaxed">
                TexConnect may revise these terms of service for its application at any time without notice. By using this application, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>8. Governing Law</h2>
              <p className="leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>9. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
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
