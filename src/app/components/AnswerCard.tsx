import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface AnswerCardProps {
  answer: string;
}

export default function AnswerCard({ answer }: AnswerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      className="rounded-xl border border-border bg-card p-6 shadow-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Answer</h2>
      </div>
      
      <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
        {answer}
      </p>
    </motion.div>
  );
}
