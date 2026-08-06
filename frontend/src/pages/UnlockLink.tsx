import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export const UnlockLink: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const responseData = await apiFetch(`/url/resolve/${code}`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      
      if (responseData.long_url) {
        // Redirection on correct passcode match
        window.location.href = responseData.long_url;
      } else {
        setError('Verification failed. Invalid destination received.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl glass-panel shadow-2xl relative z-10 border border-amber-500/10 text-center"
      >
        <div className="mx-auto w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display">
          Password Required
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
          The link you are trying to access is encrypted. Enter the password below to decrypt and redirect.
        </p>

        {error && (
          <div className="my-5 p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5 justify-center">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="relative flex items-center">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter passcode"
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-amber-500 focus:bg-white dark:focus:bg-dark-bg focus:ring-2 focus:ring-amber-500/20 transition-all rounded-xl text-sm text-center text-gray-900 dark:text-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
          >
            {loading ? 'Decrypting...' : 'Unlock Link'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
