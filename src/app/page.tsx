'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import Navigation from './components/Navigation';
import SearchBox from './components/SearchBox';
import ErrorAlert from './components/ErrorAlert';
import AnswerCard from './components/AnswerCard';
import SourcesCard from './components/SourcesCard';
import EmptyState from './components/EmptyState';

type Source = {
  content: string;
  metadata?: {
    file_name?: string;
    source?: string;
  };
};

export default function Index() {
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* HERO SECTION */}
      <section className="relative flex flex-col items-center px-6 pt-24 pb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
        >
          Search your documents
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-4 max-w-2xl text-lg text-muted-foreground"
        >
          Ask questions and get AI-powered answers from your uploaded files
        </motion.p>

        {/* SEARCH CARD */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <SearchBox
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            loading={loading}
          />
        </motion.div>
      </section>

      {/* RESULTS SECTION */}
      <main className="mx-auto max-w-3xl px-6 pb-24">
        <div className="space-y-6">
          {error && <ErrorAlert message={error} />}

          {answer && !error && <AnswerCard answer={answer} />}

          {sources.length > 0 && <SourcesCard sources={sources} />}

          {!loading && !answer && !error && <EmptyState />}
        </div>
      </main>
    </div>
  );
}
