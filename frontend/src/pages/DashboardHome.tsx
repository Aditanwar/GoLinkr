import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StatsCounter } from '../components/StatsCounter';
import { apiFetch } from '../utils/api';
import { 
  Link2, 
  MousePointerClick, 
  Calendar, 
  Percent, 
  Sparkles, 
  Plus, 
  ArrowRight,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentUrls, setRecentUrls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Shortener form state
  const [longURL, setLongURL] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [password, setPassword] = useState('');
  const [daysTTL, setDaysTTL] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [shortenLoading, setShortenLoading] = useState(false);
  const [newUrl, setNewUrl] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const statsData = await apiFetch('/dashboard/summary');
      setStats(statsData);

      const urlsData = await apiFetch('/urls', { params: { limit: '5' } });
      setRecentUrls(urlsData.urls || []);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setShortenLoading(true);
    setError('');
    setNewUrl(null);

    const body: any = { long_url: longURL };
    if (customAlias) body.custom_alias = customAlias;
    if (password) body.password = password;
    if (daysTTL) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + parseInt(daysTTL, 10));
      body.expires_at = expiry.toISOString();
    }

    try {
      const data = await apiFetch('/shorten', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setNewUrl(data);
      // Reset form
      setLongURL('');
      setCustomAlias('');
      setPassword('');
      setDaysTTL('');
      setFormOpen(false);
      
      // Refresh statistics and list
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setShortenLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-indigo-700 p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold font-display">
            Accelerate your Redirections
          </h1>
          <p className="text-brand-100 text-sm max-w-md">
            Monitor caching efficiency, request latency, and programmatic API access keys in real time.
          </p>
        </div>

        <button
          onClick={() => setFormOpen(!formOpen)}
          className="relative z-10 bg-white hover:bg-brand-50 text-brand-700 font-bold px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm self-start cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          Shorten New Link
        </button>
      </div>

      {/* Expandable Shortener Form */}
      {formOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-md"
        >
          <h3 className="font-bold text-gray-900 dark:text-white font-display mb-4 text-md">
            Create Shortened URL
          </h3>
          <form onSubmit={handleShorten} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Long Destination URL *
                </label>
                <input
                  type="url"
                  required
                  value={longURL}
                  onChange={(e) => setLongURL(e.target.value)}
                  placeholder="https://example.com/very-long-path-name"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-bg focus:border-brand-500 outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Custom Alias (Optional)
                </label>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="marketing-campaign"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-bg focus:border-brand-500 outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Access Password Protection (Optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for public access"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-bg focus:border-brand-500 outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Link Expiry (Days from now - Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={daysTTL}
                  onChange={(e) => setDaysTTL(e.target.value)}
                  placeholder="Expires in N days"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white dark:focus:bg-dark-bg focus:border-brand-500 outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={shortenLoading}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold text-sm shadow-md shadow-brand-500/10 cursor-pointer"
              >
                {shortenLoading ? 'Shortening...' : 'Generate Short Link'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Successfully Shortened URL Display */}
      {newUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
        >
          <div className="space-y-1">
            <h4 className="text-emerald-700 dark:text-emerald-400 font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Link Created!
            </h4>
            <div className="text-sm font-medium text-gray-900 dark:text-white select-all">
              {`http://localhost:8080/r/${newUrl.short_code}`}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
              Points to: {newUrl.long_url}
            </p>
          </div>
          <a
            href={`http://localhost:8080/r/${newUrl.short_code}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            Test Redirection
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>
      )}

      {/* Aggregate Counters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCounter
          label="Total Shortened Links"
          value={stats?.total_urls || 0}
          icon={<Link2 className="w-5 h-5" />}
          change="+12%"
          changeType="positive"
          description="from last month"
        />

        <StatsCounter
          label="Total Redirect Clicks"
          value={stats?.total_clicks || 0}
          icon={<MousePointerClick className="w-5 h-5" />}
          change="+24%"
          changeType="positive"
          description="from last month"
        />

        <StatsCounter
          label="Clicks Recieved Today"
          value={stats?.clicks_today || 0}
          icon={<Calendar className="w-5 h-5" />}
          change="Live Traffic"
          changeType="neutral"
        />

        <StatsCounter
          label="Redirection Hit Rate"
          value={`${((stats?.cache_hit_rate || 0) * 100).toFixed(1)}%`}
          icon={<Percent className="w-5 h-5" />}
          change="Redis Layer"
          changeType="neutral"
          description="cache efficiency ratio"
        />
      </div>

      {/* Recent Links Table */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-150 dark:border-dark-border flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white font-display text-md flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            Recently Created Links
          </h3>
          <Link
            to="/dashboard/links"
            className="text-xs font-bold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1"
          >
            View all links
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentUrls.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-150 dark:border-dark-border">
                  <th className="px-6 py-4">Short Code</th>
                  <th className="px-6 py-4">Original URL</th>
                  <th className="px-6 py-4">Clicks</th>
                  <th className="px-6 py-4">Security</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-dark-border text-sm">
                {recentUrls.map((url) => (
                  <tr key={url.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white select-all">
                      {url.short_code}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-gray-500 dark:text-gray-400">
                      {url.long_url}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">
                      {url.clicks_count}
                    </td>
                    <td className="px-6 py-4">
                      {url.is_protected ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-500">
                          Password protected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          Public
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/dashboard/analytics/${url.id}`)}
                        className="text-xs font-bold text-brand-500 hover:underline cursor-pointer"
                      >
                        Analytics
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 dark:text-gray-600 text-sm">
            No shortened links created yet. Click "Shorten New Link" to begin.
          </div>
        )}
      </div>
    </div>
  );
};
