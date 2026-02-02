'use client';

import { useState } from 'react';
import Navigation from './components/Navigation';

type Source = {
  content: string;
  metadata?: {
    file_name?: string;
    source?: string;
  };
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setAnswer('');
    setSources([]);
    setError(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Search failed');
      }

      setAnswer(data.answer || 'No answer could be generated.');
      setSources(data.sources || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while searching.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-4xl p-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
          RAG Search
        </h1>

        {/* Search Box */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <textarea
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your uploaded documents…"
            className="w-full resize-none rounded-lg border border-gray-300 bg-white p-4 text-gray-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="mt-4 rounded-lg bg-blue-600 px-8 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Press <span className="font-medium">Cmd / Ctrl + Enter</span> to search
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Answer */}
        {answer && !error && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Answer
            </h2>
            <p className="whitespace-pre-wrap leading-relaxed text-gray-800 dark:text-gray-200">
              {answer}
            </p>
          </div>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Sources ({sources.length})
            </h2>

            <div className="space-y-3">
              {sources.map((source, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Document:</span>{' '}
                    {source.metadata?.file_name ||
                      source.metadata?.source ||
                      'Unknown'}
                  </p>
                  <p className="line-clamp-3 text-sm text-gray-800 dark:text-gray-200">
                    {source.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !answer && !error && (
          <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Ask a question to search across your uploaded documents using
            Gemini-powered RAG.
          </div>
        )}
      </main>
    </div>
  );
}
