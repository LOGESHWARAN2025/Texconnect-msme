import React from 'react';
import { ArrowLeft, BookOpen, Video, HelpCircle, Download } from 'lucide-react';

interface DocumentationPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onGetStarted?: () => void;
}

export default function DocumentationPage({ onBack, onNavigate, onGetStarted }: DocumentationPageProps) {
  const docs = [
    {
      icon: BookOpen,
      title: 'Getting Started Guide',
      description: 'Learn how to set up your TexConnect account and start managing inventory in minutes',
      link: '#'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides for all features and common tasks',
      link: '#'
    },
    {
      icon: HelpCircle,
      title: 'FAQ & Troubleshooting',
      description: 'Find answers to frequently asked questions and solutions to common issues',
      link: '#'
    },
    {
      icon: Download,
      title: 'API Documentation',
      description: 'Complete API reference for developers integrating with TexConnect',
      link: '#'
    }
  ];

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
          <h1 className="text-5xl font-bold text-white mb-4">Documentation</h1>
          <p className="text-white opacity-90 text-lg">Everything you need to know about TexConnect</p>
        </div>

        {/* Documentation Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {docs.map((doc, idx) => (
            <a
              key={idx}
              href={doc.link}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 border border-gray-100 group"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)' }}>
                <doc.icon className="h-8 w-8" style={{ color: 'rgb(79, 70, 229)' }} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:opacity-70 transition">{doc.title}</h3>
              <p className="text-gray-600 leading-relaxed">{doc.description}</p>
              <div className="mt-6 flex items-center gap-2" style={{ color: 'rgb(79, 70, 229)' }}>
                <span className="font-semibold">Learn More</span>
                <span>→</span>
              </div>
            </a>
          ))}
        </div>

        {/* Quick Links Section */}
        <div className="bg-white rounded-3xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'rgb(79, 70, 229)' }}>Quick Links</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)' }}>
              <h3 className="font-bold mb-3" style={{ color: 'rgb(79, 70, 229)' }}>Inventory Management</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Adding and tracking inventory items</li>
                <li>• Stock level monitoring</li>
                <li>• Inventory reports</li>
                <li>• Batch operations</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)' }}>
              <h3 className="font-bold mb-3" style={{ color: 'rgb(79, 70, 229)' }}>Order Management</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Creating and managing orders</li>
                <li>• Order status tracking</li>
                <li>• Delivery management</li>
                <li>• Order analytics</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)' }}>
              <h3 className="font-bold mb-3" style={{ color: 'rgb(79, 70, 229)' }}>User Management</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Adding team members</li>
                <li>• Role-based permissions</li>
                <li>• Account settings</li>
                <li>• Security features</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(79, 70, 229, 0.05)' }}>
              <h3 className="font-bold mb-3" style={{ color: 'rgb(79, 70, 229)' }}>Analytics & Reports</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Dashboard overview</li>
                <li>• Sales trends</li>
                <li>• Stock analysis</li>
                <li>• Custom reports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 bg-white rounded-3xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'rgb(79, 70, 229)' }}>Need Help?</h2>
          <p className="text-gray-600 mb-6">Can't find what you're looking for? Our support team is here to help!</p>
          <div className="flex flex-col md:flex-row gap-4">
            <a href="mailto:texconnect98@gmail.com" className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
              📧 Email Support
            </a>
            <a href="tel:+916374516006" className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
              📞 Call Us
            </a>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
