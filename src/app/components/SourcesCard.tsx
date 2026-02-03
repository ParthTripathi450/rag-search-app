import { motion } from 'framer-motion';
import { FileText, ExternalLink } from 'lucide-react';

type Source = {
  content: string;
  metadata?: {
    file_name?: string;
    source?: string;
  };
};

interface SourcesCardProps {
  sources: Source[];
}

export default function SourcesCard({ sources }: SourcesCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
            <FileText className="h-4 w-4 text-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Sources</h2>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-muted-foreground">
          {sources.length} found
        </span>
      </div>

      <div className="space-y-3">
        {sources.map((source, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group cursor-pointer rounded-lg border border-border bg-secondary/50 p-4 transition-all hover:border-primary/30 hover:bg-secondary"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {source.metadata?.file_name || source.metadata?.source || 'Unknown Document'}
              </p>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {source.content}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
