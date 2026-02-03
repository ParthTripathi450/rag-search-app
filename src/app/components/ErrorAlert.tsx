import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';


interface ErrorAlertProps {
  message: string;
}

export default function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-destructive">
          {message}
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}
