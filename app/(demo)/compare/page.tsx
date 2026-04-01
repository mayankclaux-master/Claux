'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const comparisonData = [
  {
    category: 'Team Size',
    traditional: '5-8 people (account manager, writers, SEO specialists)',
    claux: '9 AI agents working 24/7',
  },
  {
    category: 'Working Hours',
    traditional: '9 AM - 6 PM, Mon-Fri (40 hrs/week)',
    claux: '24/7/365 continuous operation',
  },
  {
    category: 'Speed to Results',
    traditional: '3-6 months for initial traction',
    claux: 'Results visible in 2-4 weeks',
  },
  {
    category: 'Monthly Cost',
    traditional: '₹40,000 - ₹80,000',
    claux: '₹7,499',
  },
  {
    category: 'Keyword Research',
    traditional: 'Manual research, 20-30 keywords/month',
    claux: 'AI-powered mapping, 100+ keywords/month',
  },
  {
    category: 'Content Output',
    traditional: '2-4 articles per month',
    claux: '8-12 optimized articles per month',
  },
  {
    category: 'Rank Tracking',
    traditional: 'Weekly manual reports',
    claux: 'Real-time tracking with instant alerts',
  },
  {
    category: 'Competitor Intelligence',
    traditional: 'Monthly competitor analysis',
    claux: 'Continuous monitoring & instant insights',
  },
  {
    category: 'Google Business Profile',
    traditional: 'Manual updates, 1-2 posts/month',
    claux: 'Automated optimization, weekly posts',
  },
  {
    category: 'Backlink Acquisition',
    traditional: '2-5 backlinks per month',
    claux: '10-15 high-quality backlinks per month',
  },
];

export default function ComparePage() {
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null);

  return (
    <div className="min-h-screen bg-claux-bg text-claux-text flex flex-col">
      <div className="flex-1 grid grid-cols-2">
        <motion.div
          className="relative bg-claux-surface/50 border-r border-claux-border flex flex-col"
          onHoverStart={() => setHoveredSide('left')}
          onHoverEnd={() => setHoveredSide(null)}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="sticky top-0 bg-claux-surface/80 backdrop-blur-sm border-b border-claux-border p-8 z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-sm text-claux-muted mb-2">Old Way</div>
              <h2 className="text-3xl font-bold text-claux-muted">Traditional SEO Agency</h2>
              <p className="text-sm text-claux-muted/70 mt-2">Human-dependent, slow, expensive</p>
            </motion.div>
          </div>

          <div className="flex-1 p-8 space-y-6">
            {comparisonData.map((item, idx) => (
              <motion.div
                key={item.category}
                className="pb-6 border-b border-claux-border/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
              >
                <div className="text-xs font-semibold text-claux-muted/50 mb-2 uppercase tracking-wider">
                  {item.category}
                </div>
                <div className="text-base text-claux-muted">{item.traditional}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="relative bg-claux-surface flex flex-col"
          onHoverStart={() => setHoveredSide('right')}
          onHoverEnd={() => setHoveredSide(null)}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(127, 119, 221, 0.3), transparent 70%)',
            }}
          />

          <div className="sticky top-0 bg-claux-surface/80 backdrop-blur-sm border-b border-claux-purple/30 p-8 z-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-sm text-claux-purple mb-2">New Way</div>
              <h2 className="text-3xl font-bold text-white">CLAUX AI Suite</h2>
              <p className="text-sm text-claux-text/70 mt-2">AI-powered, fast, affordable</p>
            </motion.div>
          </div>

          <div className="flex-1 p-8 space-y-6 relative">
            {comparisonData.map((item, idx) => (
              <motion.div
                key={item.category}
                className="pb-6 border-b border-claux-border/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.05 }}
              >
                <div className="text-xs font-semibold text-claux-purple/70 mb-2 uppercase tracking-wider">
                  {item.category}
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-claux-teal mt-0.5 flex-shrink-0">✓</div>
                  <div className="text-base text-claux-teal font-medium">{item.claux}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        className="bg-gradient-to-r from-claux-surface via-claux-purple/10 to-claux-surface border-t border-claux-border py-12"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="max-w-4xl mx-auto text-center px-8">
          <motion.h3
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
          >
            Stop paying for excuses. Start ranking.
          </motion.h3>
          <motion.p
            className="text-lg text-claux-muted mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            Why settle for outdated methods when AI can do it better, faster, and cheaper?
          </motion.p>
          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <button className="px-8 py-4 bg-claux-purple hover:bg-claux-purple/90 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-claux-purple/20">
              Get Started with CLAUX
            </button>
            <button className="px-8 py-4 bg-claux-surface border border-claux-border hover:border-claux-purple/50 text-claux-text font-semibold rounded-xl transition-all">
              View Live Demo
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
