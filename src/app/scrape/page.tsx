'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import Navigation from '@/app/components/Navigation';

export default function ScrapePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a valid website URL.');
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Website scraping failed.');
      }

      setMessage(
        `Website indexed successfully! (${data.chunks} chunks added)`
      );
      setUrl('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong while scraping.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-3xl px-6 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Scrape a Website
          </h1>
          <p className="mt-3 text-muted-foreground">
            Enter a website URL to extract content and add it to your knowledge
            base
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <label className="mb-2 block text-sm font-medium text-foreground">
            Website URL
          </label>

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <button
            onClick={handleScrape}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Scraping & Indexing…' : 'Scrape Website'}
          </button>

          {/* Messages */}
          {message && (
            <p className="mt-4 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </motion.div>

        {/* Helper text */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          The scraped content will be searchable from the main page.
        </p>
      </main>
    </div>
  );
}
