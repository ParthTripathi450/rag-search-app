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
    if (
      !confirm(
        `Delete "${doc.file_name}"?\n\nThis will permanently remove the document and embeddings.`
      )
    )
      return;

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
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* HERO */}
      <section className="px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Documents
        </h1>
        <p className="mt-3 text-muted-foreground">
          Manage and review your uploaded documents
        </p>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowUploadModal(true)}
            className="rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Upload Document
          </button>
        </div>
      </section>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-6 pb-24">
        {/* Loading */}
        {loading && (
          <div className="py-16 text-center text-muted-foreground">
            Loading documents…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && documents.length === 0 && (
          <div className="mt-12 rounded-2xl border border-border bg-card p-16 text-center shadow-sm">
            <p className="mb-4 text-muted-foreground">
              No documents uploaded yet.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="font-medium text-primary hover:underline"
            >
              Upload your first document
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && documents.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary">
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
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {documents.map((doc) => {
                    const isPDF = doc.file_name.toLowerCase().endsWith('.pdf');

                    return (
                      <tr
                        key={doc.id}
                        className="transition hover:bg-secondary/60"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {doc.file_name}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {doc.file_type || 'unknown'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </td>

                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {doc.total_chunks}
                        </td>

                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatDate(doc.upload_date)}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-4">
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
                              className="text-primary hover:underline"
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
                                className="text-emerald-600 hover:underline"
                              >
                                Download
                              </a>
                            )}

                            <button
                              onClick={() => handleDelete(doc)}
                              disabled={deletingId === doc.id}
                              className="text-destructive hover:underline disabled:opacity-50"
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
