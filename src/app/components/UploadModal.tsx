'use client';

import { useEffect, useRef, useState } from 'react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

type Message = {
  type: 'success' | 'error';
  text: string;
};

export default function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';

    if (!isOpen) {
      setFile(null);
      setMessage(null);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file first.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({
        type: 'success',
        text: `“${data.fileName}” uploaded successfully. ${data.chunks} chunks indexed for semantic search.`,
      });

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Give user time to read success message
      setTimeout(() => {
        onUploadSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Something went wrong during upload.',
      });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Upload Document
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* File input */}
          <div>
            <label
              htmlFor="upload-file"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Select a file (PDF, DOCX, or TXT)
            </label>
            <input
              ref={fileInputRef}
              id="upload-file"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:rounded-lg file:border-0
                file:bg-blue-50 file:px-4 file:py-2
                file:text-sm file:font-semibold file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900 dark:file:text-blue-300
                dark:hover:file:bg-blue-800"
            />
          </div>

          {/* Selected file info */}
          {file && (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <p>
                <span className="font-medium">Name:</span> {file.name}
              </p>
              <p>
                <span className="font-medium">Size:</span>{' '}
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <p>
                <span className="font-medium">Type:</span>{' '}
                {file.type || file.name.split('.').pop()}
              </p>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {uploading ? 'Uploading & Indexing…' : 'Upload Document'}
          </button>

          {/* Status message */}
          {message && (
            <div
              className={`rounded-lg p-4 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Info box */}
          <div className="rounded-lg bg-blue-50 p-4 text-sm dark:bg-blue-900/20">
            <p className="mb-1 font-medium text-blue-900 dark:text-blue-200">
              Supported formats
            </p>
            <p className="text-blue-700 dark:text-blue-400">
              PDF, DOCX, and TXT files are processed, chunked, embedded using
              Hugging Face models, and indexed for Gemini-powered RAG search.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
