import { motion } from 'framer-motion';
import { Search, FileUp, Sparkles } from 'lucide-react';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-12 text-center"
    >
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
          >
            <Sparkles className="h-3 w-3 text-primary-foreground" />
          </motion.div>
        </div>
      </div>
      
      <h3 className="mb-2 text-lg font-medium text-foreground">
        Ready to search your documents
      </h3>
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        Ask a question to search across your uploaded documents using Gemini-powered RAG. 
        Your queries are analyzed semantically to find the most relevant information.
      </p>

      <div className="mt-8 flex justify-center gap-6">
        {[
          { icon: FileUp, label: 'Upload PDFs' },
          { icon: Search, label: 'Ask Questions' },
          { icon: Sparkles, label: 'Get AI Answers' },
        ].map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
