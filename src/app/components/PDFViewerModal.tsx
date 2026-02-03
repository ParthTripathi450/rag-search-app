'use client';

import { useEffect, useState } from 'react';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  documentId?: string;
  isPDF?: boolean;
}

export default function PDFViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  documentId,
  isPDF = true,
}: PDFViewerModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'content'>(
    isPDF ? 'preview' : 'content'
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState('');
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';

    if (isOpen) {
      setError(null);
      setLoading(true);
      setText('');
      setTextError(null);
      setActiveTab(isPDF ? 'preview' : 'content');
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isPDF]);

  // Check PDF availability
  useEffect(() => {
    if (!isOpen || !isPDF || !fileUrl) return;

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load PDF (${res.status})`);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'PDF preview not available');
        setLoading(false);
      });
  }, [isOpen, fileUrl, isPDF]);

  // Fetch extracted document text (RAG chunks combined)
  useEffect(() => {
    if (
      !isOpen ||
      !documentId ||
      activeTab !== 'content' ||
      text ||
      textLoading ||
      textError
    ) {
      return;
    }

    const fetchText = async () => {
      setTextLoading(true);
      setTextError(null);

      try {
        const res = await fetch(`/api/documents?id=${documentId}`);
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to fetch document text');
        }

        setText(data.fullText || 'No extracted text available.');
      } catch (err: any) {
        setTextError(err.message || 'Unable to load document text');
      } finally {
        setTextLoading(false);
      }
    };

    fetchText();
  }, [isOpen, documentId, activeTab, text, textLoading, textError]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4">
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
              {fileName}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          {isPDF && (
            <div className="flex border-t border-gray-200 dark:border-gray-800">
              {(['preview', 'content'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300'
                  }`}
                >
                  {tab === 'preview' ? 'Preview' : 'Extracted Text'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* PDF Preview */}
          {isPDF && activeTab === 'preview' && (
            <div className="h-full">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading PDF preview…
                  </p>
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center p-6">
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center dark:border-yellow-800 dark:bg-yellow-900/20">
                    <p className="mb-4 text-yellow-800 dark:text-yellow-200">
                      {error}
                    </p>
                    {documentId && (
                      <button
                        onClick={() => setActiveTab('content')}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                      >
                        View Extracted Text
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <iframe
                  src={`${fileUrl}?view=true`}
                  className="h-full w-full border-0"
                  title={fileName}
                />
              )}
            </div>
          )}

          {/* Extracted Text */}
          {(!isPDF || activeTab === 'content') && (
            <div className="h-full overflow-auto p-6">
              {textLoading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading extracted text…
                  </p>
                </div>
              ) : textError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-red-800 dark:text-red-200">
                    {textError}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This text was extracted, chunked, and indexed for
                    Gemini-powered RAG search. Formatting may differ from the
                    original document.
                  </p>
                  <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                    {text || 'No extracted text available.'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}