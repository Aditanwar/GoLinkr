import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { 
  Search, 
  Trash2, 
  Edit3, 
  QrCode, 
  Lock, 
  FileText, 
  Upload, 
  Download,
  AlertTriangle,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const UrlsList: React.FC = () => {
  const navigate = useNavigate();
  const [urls, setUrls] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingUrl, setEditingUrl] = useState<any | null>(null);
  const [editLongURL, setEditLongURL] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // QR modal state
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<any | null>(null);

  // CSV bulk state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvSuccessCount, setCsvSuccessCount] = useState<number | null>(null);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/urls', {
        params: {
          limit: limit.toString(),
          offset: offset.toString(),
        },
      });
      setUrls(data.urls || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load links', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, [offset]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this shortened link? All redirection logs will be permanently deleted.')) {
      return;
    }

    try {
      await apiFetch(`/url/${id}`, { method: 'DELETE' });
      fetchUrls();
    } catch (err) {
      alert('Failed to delete URL');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUrl) return;
    setEditLoading(true);

    try {
      await apiFetch(`/url/${editingUrl.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          long_url: editLongURL,
          expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
        }),
      });
      setEditingUrl(null);
      fetchUrls();
    } catch (err: any) {
      alert(err.message || 'Failed to update URL');
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenQR = async (url: any) => {
    setQrModalUrl(url);
    try {
      const blob = await apiFetch(`/url/${url.id}/qr`);
      const blobUrl = URL.createObjectURL(blob);
      setQrBlobUrl(blobUrl);
    } catch (err) {
      alert('Failed to generate QR code');
    }
  };

  const handleCloseQR = () => {
    if (qrBlobUrl) {
      URL.revokeObjectURL(qrBlobUrl);
    }
    setQrBlobUrl(null);
    setQrModalUrl(null);
  };

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setCsvLoading(true);
    setCsvSuccessCount(null);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const responseData = await apiFetch('/urls/upload-csv', {
        method: 'POST',
        body: formData,
      });
      setCsvSuccessCount(responseData.length || 0);
      setCsvFile(null);
      fetchUrls();
    } catch (err) {
      alert('Failed to upload and parse CSV file');
    } finally {
      setCsvLoading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,url,alias,password\nhttps://google.com,google-search,secret-pass\nhttps://github.com,github-home,\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'golinkr_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter links on the fly using search state
  const filteredUrls = urls.filter((url) => 
    url.short_code.toLowerCase().includes(search.toLowerCase()) ||
    url.long_url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top action row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80 flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search short links..."
            className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm text-gray-900 dark:text-white"
          />
        </div>

        {/* CSV Import Panel */}
        <form onSubmit={handleCSVUpload} className="flex items-center gap-2.5 w-full md:w-auto bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-2 rounded-xl">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-600 dark:file:text-brand-400 hover:file:bg-brand-500/20 max-w-[180px]"
          />
          <button
            type="submit"
            disabled={csvLoading || !csvFile}
            className="p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 flex items-center gap-1 text-xs font-bold transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            {csvLoading ? 'Uploading...' : 'Import CSV'}
          </button>
          <button
            type="button"
            onClick={downloadCSVTemplate}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 flex items-center gap-1 text-xs font-bold cursor-pointer"
            title="Download CSV Template"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {csvSuccessCount !== null && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex justify-between items-center">
          <span>Successfully imported {csvSuccessCount} shortened links from CSV file.</span>
          <button onClick={() => setCsvSuccessCount(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* URLs grid / table */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-8 h-8 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : filteredUrls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-150 dark:border-dark-border">
                  <th className="px-6 py-4">Short Code</th>
                  <th className="px-6 py-4">Destination Target</th>
                  <th className="px-6 py-4">Security</th>
                  <th className="px-6 py-4">Redirection Clicks</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-dark-border text-sm">
                {filteredUrls.map((url) => {
                  const isExpired = url.expires_at && new Date(url.expires_at) < new Date();
                  return (
                    <tr key={url.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white select-all">
                        {url.short_code}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-gray-500 dark:text-gray-400">
                        <a href={url.long_url} target="_blank" rel="noreferrer" className="hover:text-brand-500 flex items-center gap-1.5">
                          {url.long_url}
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {url.is_protected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-500">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Public
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">
                        {url.clicks_count}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {url.expires_at ? (
                          isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-500">
                              <AlertTriangle className="w-3.5 h-3.5" /> Expired
                            </span>
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">
                              {new Date(url.expires_at).toLocaleDateString()}
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">Never expires</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenQR(url)}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 inline-flex items-center justify-center cursor-pointer"
                          title="Generate QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingUrl(url);
                            setEditLongURL(url.long_url);
                            setEditExpiresAt(url.expires_at ? new Date(url.expires_at).toISOString().slice(0, 16) : '');
                          }}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 inline-flex items-center justify-center cursor-pointer"
                          title="Edit Link"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/analytics/${url.id}`)}
                          className="p-1.5 rounded-lg border border-brand-500/20 bg-brand-500/5 text-brand-600 hover:bg-brand-500/10 dark:text-brand-400 inline-flex items-center justify-center cursor-pointer"
                          title="View Analytics"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(url.id)}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-55/5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 inline-flex items-center justify-center cursor-pointer"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center text-gray-400 dark:text-gray-600 text-sm">
            No shortened links matching your search criteria.
          </div>
        )}

        {/* Pagination controls */}
        {total > limit && (
          <div className="px-6 py-4 border-t border-gray-150 dark:border-dark-border flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} links
            </span>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset(prev => Math.max(0, prev - limit))}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-900 inline-flex items-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={offset + limit >= total}
                onClick={() => setOffset(prev => prev + limit)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-900 inline-flex items-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-6 rounded-2xl shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-150 dark:border-dark-border pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white font-display text-md">
                  Edit Destination Target
                </h3>
                <button onClick={() => setEditingUrl(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Long URL
                  </label>
                  <input
                    type="url"
                    required
                    value={editLongURL}
                    onChange={(e) => setEditLongURL(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm text-gray-900 dark:text-white rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Expiration Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm text-gray-900 dark:text-white rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUrl(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold text-sm cursor-pointer"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {qrModalUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-6 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-4"
            >
              <div className="w-full flex justify-between items-center border-b border-gray-150 dark:border-dark-border pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white font-display text-md">
                  QR Redirection Code
                </h3>
                <button onClick={handleCloseQR}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {qrBlobUrl ? (
                <div className="space-y-4">
                  <div className="p-3 bg-white border border-gray-100 rounded-2xl inline-block shadow-inner">
                    <img src={qrBlobUrl} alt="Short link QR code" className="w-48 h-48" />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[280px]">
                    {`http://localhost:8080/r/${qrModalUrl.short_code}`}
                  </div>
                  <a
                    href={qrBlobUrl}
                    download={`golinkr_qr_${qrModalUrl.short_code}.png`}
                    className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/10 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download QR (PNG)
                  </a>
                </div>
              ) : (
                <div className="py-12 flex justify-center w-full">
                  <div className="w-8 h-8 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
