import { motion } from 'framer-motion';
import { Search, Loader2, Command } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';

interface SearchBoxProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
}

export default function SearchBox({ query, onQueryChange, onSearch, loading }: SearchBoxProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onSearch();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="relative">
        <Textarea
          rows={4}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your uploaded documents…"
          className="min-h-[120px] resize-none rounded-lg border-border bg-secondary pr-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium">
            <Command className="h-3 w-3" />
            Enter
          </span>
          <span>to search</span>
        </p>

        <Button
          onClick={onSearch}
          disabled={loading || !query.trim()}
          className="min-w-[120px] gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
