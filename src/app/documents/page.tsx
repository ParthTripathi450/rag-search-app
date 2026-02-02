'use client';

import { useEffect, useState } from 'react';



import Navigation from '@/app/components/Navigation';
import PDFViewerModal from '@/app/components/PDFViewerModal';
import UploadModal from '@/app/components/UploadModal';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  total_chunks: number;
  file_url?: string;
  file_path?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{
    url: string;
    name: string;
    id?: string;
    isPDF?: boolean;
  } | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/documents');
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch documents');
      }

      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load documents');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (value: string) => {
    const d = new Date(value);
    return isNaN(d.getTime())
      ? value
      : d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  };

  const handleDelete = async (doc: Document) => {
    const confirmed = confirm(
      `Delete "${doc.file_name}"?\n\nThis will permanently remove the document, embeddings, and stored file.`
    );

    if (!confirmed) return;

    setDeletingId(doc.id);

    try {
      const res = await fetch(`/api/documents?id=${doc.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Delete failed');
      }

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      alert(err.message || 'Unable to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="mx-auto max-w-7xl p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Documents
          </h1>
          <button
            onClick={() => setShowUploadModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Upload Document
          </button>
        </div>

        {/* States */}
        {loading && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Loading documents…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {!loading && !error && documents.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              No documents uploaded yet.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Upload your first document
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && documents.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {[
                      'File Name',
                      'Type',
                      'Size',
                      'Chunks',
                      'Upload Date',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                  {documents.map((doc) => {
                    const isPDF = doc.file_name.toLowerCase().endsWith('.pdf');

                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {doc.file_name}
                        </td>

                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {doc.file_type || 'unknown'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(doc.file_size)}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {doc.total_chunks}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(doc.upload_date)}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                const url = doc.file_url
                                  ? `${doc.file_url}?view=true`
                                  : `/api/documents?id=${doc.id}&file=true&view=true`;

                                setSelectedDoc({
                                  url,
                                  name: doc.file_name,
                                  id: doc.id,
                                  isPDF,
                                });
                                setShowViewer(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {isPDF ? 'Preview' : 'View'}
                            </button>

                            {(doc.file_url || doc.file_path) && (
                              <a
                                href={
                                  doc.file_url ||
                                  `/api/documents?id=${doc.id}&file=true`
                                }
                                download={doc.file_name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Download
                              </a>
                            )}

                            <button
                              onClick={() => handleDelete(doc)}
                              disabled={deletingId === doc.id}
                              className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                            >
                              {deletingId === doc.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        {selectedDoc && (
          <PDFViewerModal
            isOpen={showViewer}
            onClose={() => {
              setShowViewer(false);
              setSelectedDoc(null);
            }}
            fileUrl={selectedDoc.url}
            fileName={selectedDoc.name}
            documentId={selectedDoc.id}
            isPDF={selectedDoc.isPDF !== false}
          />
        )}

        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={fetchDocuments}
        />
      </main>
    </div>
  );
}
