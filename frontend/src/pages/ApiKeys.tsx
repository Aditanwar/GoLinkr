import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { 
  Trash2, 
  Copy, 
  Check, 
  Plus, 
  AlertCircle,
  Clock,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ApiKeys: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Creation form state
  const [formOpen, setFormOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    try {
      const data = await apiFetch('/apikeys');
      setKeys(data || []);
    } catch (err) {
      console.error('Failed to load api keys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    const body: any = { name: keyName };
    if (expiryDays) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + parseInt(expiryDays, 10));
      body.expires_at = expiry.toISOString();
    }

    try {
      const data = await apiFetch('/apikeys', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setCreatedKey(data);
      setKeyName('');
      setExpiryDays('');
      setFormOpen(false);
      fetchKeys();
    } catch (err) {
      alert('Failed to generate API Key');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this API Key? Any application/script currently utilizing this key will receive a 401 Unauthorized error.')) {
      return;
    }

    try {
      await apiFetch(`/apikeys/${id}`, { method: 'DELETE' });
      fetchKeys();
    } catch (err) {
      alert('Failed to revoke API Key');
    }
  };

  const handleCopy = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top action row */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate programmatic keys to shorten and manage links from your apps or CLI.
          </p>
        </div>
        <button
          onClick={() => {
            setCreatedKey(null);
            setFormOpen(true);
          }}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Key
        </button>
      </div>

      {/* Created Key Panel (Show Once) */}
      {createdKey && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-4 shadow-sm"
        >
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-500 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            Make sure to copy your API key now!
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            For security reasons, we will only show this credentials token once. If you close this page, you will not be able to retrieve it.
          </p>
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-950 border border-amber-500/10 rounded-xl max-w-lg">
            <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 select-all flex-1 truncate">
              {createdKey.key}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      )}

      {/* API Keys grid / table */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex justify-center">
            <div className="w-8 h-8 border-3 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-150 dark:border-dark-border">
                  <th className="px-6 py-4">Key Name</th>
                  <th className="px-6 py-4">Token Preview</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Last Used</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-dark-border text-sm">
                {keys.map((key) => {
                  const isExpired = key.expires_at && new Date(key.expires_at) < new Date();
                  return (
                    <tr key={key.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {key.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400 select-all">
                        {`sl_****${key.key.slice(-6)}`}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(key.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                        {key.last_used_at ? (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(key.last_used_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-450 dark:text-gray-650">Never used</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">
                        {key.expires_at ? (
                          isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-500">
                              Expired
                            </span>
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">
                              {new Date(key.expires_at).toLocaleDateString()}
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600">Never expires</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(key.id)}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-55/5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 inline-flex items-center justify-center cursor-pointer"
                          title="Revoke Key"
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
            No API Keys generated yet.
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-6 rounded-2xl shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-150 dark:border-dark-border pb-3">
                <h3 className="font-bold text-gray-900 dark:text-white font-display text-md">
                  Create API Credentials
                </h3>
                <button onClick={() => setFormOpen(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Key Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="SaaS analytics script"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm text-gray-900 dark:text-white rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Expiration Duration (Days - Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    placeholder="Never expires if empty"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm text-gray-900 dark:text-white rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold text-sm cursor-pointer"
                  >
                    {createLoading ? 'Generating...' : 'Generate API Key'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
