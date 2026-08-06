import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Sparkles, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { apiFetch } from '../utils/api';

export const LandingPage: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handlePublicShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Direct call to public shorten API (backend handles user_id as null)
      const data = await apiFetch('/shorten', {
        method: 'POST',
        body: JSON.stringify({ long_url: urlInput }),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-150 selection:bg-brand-500 selection:text-white">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto h-20 px-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-900 bg-white/70 dark:bg-dark-bg/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-xl font-display shadow-md shadow-brand-500/20">
            G
          </div>
          <span className="font-extrabold text-2xl tracking-tight font-display bg-gradient-to-r from-brand-500 to-indigo-600 bg-clip-text text-transparent">
            GoLinkr
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" /> High Performance URL Management
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight font-display text-gray-900 dark:text-white max-w-3xl leading-tight mb-6"
        >
          Shorten URLs at{' '}
          <span className="bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">
            Lightning Speed.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mb-12"
        >
          Experience enterprise-grade redirects with real-time Go metrics, ZSET sliding window rate limiting, and a cache-aside architecture.
        </motion.p>

        {/* Live Shortener Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-xl p-2 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-xl mb-16 flex flex-col md:flex-row gap-2"
        >
          <form onSubmit={handlePublicShorten} className="flex-1 flex gap-2">
            <div className="flex-1 relative flex items-center">
              <Link2 className="absolute left-4 w-5 h-5 text-gray-400" />
              <input
                type="url"
                required
                placeholder="Paste your long destination URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
            >
              {loading ? 'Processing...' : 'Shorten'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>

        {/* Results Panel */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-left mb-16 shadow-lg"
            >
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> URL Shortened Successfully!
              </h4>
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-white dark:bg-gray-950 border border-emerald-500/10">
                <span className="text-sm font-semibold select-all text-gray-800 dark:text-gray-200">
                  {`http://localhost:8080/r/${result.short_code}`}
                </span>
                <a
                  href={`http://localhost:8080/r/${result.short_code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1"
                >
                  Open link <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-xl p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-sm text-left mb-16"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Interactive System Flow Section */}
      <section className="bg-white dark:bg-gray-950 py-20 px-6 border-y border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto">
          <ArchitectureDiagram />
        </div>
      </section>

      {/* Feature Grids */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-display mb-3">
            Engineered for Concurrency and Speed
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
            Leveraging raw performance layers to create a highly optimized tracking ecosystem.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 w-fit mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 font-display">Cache-Aside Redirection</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redis caches redirect addresses with 1-hour TTLs, delivering high redirection rates that bypass disk reads entirely.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 font-display">Sliding Window Limits</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Protects API servers against bot attacks using Redis Sorted Sets, monitoring rolling limits per IP.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 font-display">System Diagnostics</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tracks active goroutines, database pool statistics, latency percentiles, and runtime memory in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-20 border-t border-gray-150 dark:border-gray-900 flex items-center justify-between px-6 max-w-7xl mx-auto text-xs text-gray-500 dark:text-gray-600">
        <div>&copy; 2026 GoLinkr URL Platform. Built with Go and React.</div>
        <div className="flex gap-4">
          <Link to="/login" className="hover:underline">Dashboard</Link>
          <a href="https://go.dev" target="_blank" rel="noreferrer" className="hover:underline">GoLang</a>
          <a href="https://redis.io" target="_blank" rel="noreferrer" className="hover:underline">Redis</a>
        </div>
      </footer>
    </div>
  );
};
