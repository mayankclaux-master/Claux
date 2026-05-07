'use client';

import { useState } from 'react';

export default function CompleteProfileCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionAttempts, setSubmissionAttempts] = useState(0);
  const [showFailsafe, setShowFailsafe] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    category: '',
    phone: '',
    address: '',
    website_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          retry_count: submissionAttempts,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete profile');
      }

      // Emit custom event for dashboard to refresh
      window.dispatchEvent(new CustomEvent('onboarding-complete'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('[CompleteProfileCard] Submission error:', errorMessage);
      setError(errorMessage);
      setSubmissionAttempts(prev => prev + 1);

      // Show failsafe UI after 3 failed attempts
      if (submissionAttempts >= 2) {
        setShowFailsafe(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setSubmissionAttempts(0);
    setShowFailsafe(false);
    setError(null);
  };

  if (showFailsafe) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-semibold mb-4 text-red-600 dark:text-red-400">
              We couldn't complete your setup
            </h1>
            <p className="text-muted-foreground mb-6">
              Something went wrong while activating your workspace. Please try again or contact our support team.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
              <a
                href="mailto:support@claux.com"
                className="block w-full text-center border border-border px-4 py-2 rounded hover:bg-accent transition-colors"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-semibold mb-6">Complete your setup</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website URL</label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Activating...' : 'Activate AI Agents'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
