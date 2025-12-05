import React from 'react';
import { ArrowLeft, Calendar, User } from 'lucide-react';

interface BlogPageProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onGetStarted?: () => void;
}

export default function BlogPage({ onBack, onNavigate, onGetStarted }: BlogPageProps) {
  const blogPosts = [
    {
      id: 1,
      title: '5 Ways to Reduce Textile Inventory Waste',
      excerpt: 'Learn practical strategies to minimize material wastage and improve your bottom line with smart inventory management.',
      author: 'TexConnect Team',
      date: 'Dec 1, 2025',
      category: 'Inventory Management',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'Digital Transformation in Tiruppur Textile Industry',
      excerpt: 'Discover how textile manufacturers are leveraging technology to stay competitive in the global market.',
      author: 'Industry Expert',
      date: 'Nov 28, 2025',
      category: 'Industry Insights',
      readTime: '7 min read'
    },
    {
      id: 3,
      title: 'Getting Started with TexConnect: A Complete Guide',
      excerpt: 'Step-by-step guide to set up your TexConnect account and start managing inventory efficiently.',
      author: 'TexConnect Team',
      date: 'Nov 25, 2025',
      category: 'Getting Started',
      readTime: '6 min read'
    },
    {
      id: 4,
      title: 'Real-Time Analytics: Making Data-Driven Decisions',
      excerpt: 'Understand how real-time analytics can help you make better business decisions for your textile business.',
      author: 'Data Analyst',
      date: 'Nov 20, 2025',
      category: 'Analytics',
      readTime: '8 min read'
    },
    {
      id: 5,
      title: 'Export Compliance Made Easy',
      excerpt: 'Navigate export regulations and compliance requirements with TexConnect\'s built-in tools.',
      author: 'Compliance Officer',
      date: 'Nov 15, 2025',
      category: 'Compliance',
      readTime: '6 min read'
    },
    {
      id: 6,
      title: 'Success Story: How Kumar Knitwears Increased Efficiency by 40%',
      excerpt: 'Read how a local textile manufacturer transformed their business using TexConnect.',
      author: 'TexConnect Team',
      date: 'Nov 10, 2025',
      category: 'Success Stories',
      readTime: '5 min read'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow py-20" style={{ backgroundColor: 'rgb(79, 70, 229)' }}>
        <div className="max-w-6xl mx-auto px-6">
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
          <h1 className="text-5xl font-bold text-white mb-4">Blog</h1>
          <p className="text-white opacity-90 text-lg">Insights, tips, and stories from the TexConnect community</p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2 cursor-pointer group"
            >
              {/* Category Badge */}
              <div className="px-6 pt-6 pb-0">
                <span
                  className="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: 'rgb(79, 70, 229)' }}
                >
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:opacity-70 transition line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-6 line-clamp-2">
                  {post.excerpt}
                </p>

                {/* Meta Information */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" style={{ color: 'rgb(79, 70, 229)' }} />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" style={{ color: 'rgb(79, 70, 229)' }} />
                    <span>{post.author}</span>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'rgb(79, 70, 229)' }}>
                    {post.readTime}
                  </div>
                </div>

                {/* Read More Link */}
                <div className="mt-6 flex items-center gap-2 font-semibold" style={{ color: 'rgb(79, 70, 229)' }}>
                  <span>Read More</span>
                  <span className="group-hover:translate-x-1 transition">→</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="mt-16 bg-white rounded-3xl p-12 shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'rgb(79, 70, 229)' }}>Stay Updated</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter to get the latest insights, tips, and updates about textile industry and TexConnect features.
          </p>
          <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-600"
              style={{ '--tw-ring-color': 'rgb(79, 70, 229)' } as any}
            />
            <button
              className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:shadow-lg"
              style={{ backgroundColor: 'rgb(79, 70, 229)' }}
            >
              Subscribe
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
