import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import FooterComponent from './FooterComponent';

interface FAQPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onGetStarted?: () => void;
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage({ onBack, onNavigate, onGetStarted }: FAQPageProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      id: 1,
      category: 'Getting Started',
      question: 'How do I create an account on TexConnect?',
      answer: 'Visit our website and click on "Start Free Trial". Fill in your company details, email, and phone number. You\'ll receive a verification email. Click the link to verify your account and you\'re ready to go!'
    },
    {
      id: 2,
      category: 'Getting Started',
      question: 'Is there a free trial available?',
      answer: 'Yes! We offer a 30-day free trial with full access to all features. No credit card required. After the trial, you can choose a plan that suits your business needs.'
    },
    {
      id: 3,
      category: 'Inventory Management',
      question: 'How do I add inventory items?',
      answer: 'Go to the Inventory section, click "Add Item", enter the product details (name, SKU, quantity, price), and save. You can also bulk import items using CSV files.'
    },
    {
      id: 4,
      category: 'Inventory Management',
      question: 'Can I track multiple warehouses?',
      answer: 'Yes! TexConnect supports multiple warehouse locations. You can set up different warehouses and track inventory across all of them from a single dashboard.'
    },
    {
      id: 5,
      category: 'Orders',
      question: 'How do I create an order?',
      answer: 'Navigate to Orders section, click "New Order", select items from your inventory, enter quantity and customer details, and submit. The system will automatically update your stock levels.'
    },
    {
      id: 6,
      category: 'Orders',
      question: 'Can I track order status in real-time?',
      answer: 'Absolutely! Every order has a detailed status page showing creation, processing, packing, and delivery stages. You can also share tracking links with your customers.'
    },
    {
      id: 7,
      category: 'Billing & Plans',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), UPI, and bank transfers. Payments are processed securely through our payment gateway.'
    },
    {
      id: 8,
      category: 'Billing & Plans',
      question: 'Can I change my plan anytime?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll adjust your billing accordingly.'
    },
    {
      id: 9,
      category: 'Support',
      question: 'What support options are available?',
      answer: 'We offer 24/7 support via email (texconnect98@gmail.com) and phone (+91 63745 16006). Our support team responds within 2 hours for all queries.'
    },
    {
      id: 10,
      category: 'Support',
      question: 'Is there a knowledge base or documentation?',
      answer: 'Yes! We have comprehensive documentation, video tutorials, and a FAQ section. Visit our Documentation page to access all resources.'
    },
    {
      id: 11,
      category: 'Security',
      question: 'Is my data secure with TexConnect?',
      answer: 'Yes! We use bank-grade encryption, automated backups, and follow industry best practices. Your data is stored securely on encrypted servers with regular security audits.'
    },
    {
      id: 12,
      category: 'Security',
      question: 'Can I export my data?',
      answer: 'Yes! You can export your inventory, orders, and reports in CSV or PDF format anytime. We also provide data export options for account closure.'
    }
  ];

  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

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
          <h1 className="text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-white opacity-90 text-lg">Find answers to common questions about TexConnect</p>
        </div>

        {/* FAQ by Category */}
        {categories.map((category) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">{category}</h2>
            <div className="space-y-4">
              {faqs
                .filter(faq => faq.category === category)
                .map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                      className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <h3 className="text-lg font-bold text-gray-900 text-left">
                        {faq.question}
                      </h3>
                      <ChevronDown
                        className="h-6 w-6 flex-shrink-0 transition-transform"
                        style={{
                          color: 'rgb(79, 70, 229)',
                          transform: expandedId === faq.id ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                      />
                    </button>

                    {expandedId === faq.id && (
                      <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                        <p className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Contact Section */}
        <div className="mt-16 bg-white rounded-3xl p-12 shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>Still have questions?</h2>
          <p className="text-gray-600 mb-8">Can't find the answer you're looking for? Our support team is here to help.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a
              href="mailto:texconnect98@gmail.com"
              className="px-8 py-4 rounded-xl font-bold text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: 'rgb(79, 70, 229)' }}
            >
              📧 Email Us
            </a>
            <a
              href="tel:+916374516006"
              className="px-8 py-4 rounded-xl font-bold text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: 'rgb(79, 70, 229)' }}
            >
              📞 Call Us
            </a>
          </div>
        </div>
        </div>
      </div>

      <FooterComponent onNavigate={onNavigate} onGetStarted={onGetStarted} />
    </div>
  );
}
