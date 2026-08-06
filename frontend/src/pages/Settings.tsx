import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Info, Shield, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-3xl space-y-8">
      {/* Profile summary card */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-2xl font-bold font-display shrink-0">
          {user?.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">
            {user?.username}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <div className="text-xs text-gray-400 dark:text-gray-500 pt-1">
            Account registered on {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown date'}
          </div>
        </div>
      </div>

      {/* Interface preferences */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-150 dark:border-dark-border">
          <h3 className="font-bold text-gray-900 dark:text-white font-display text-md">
            Interface Preferences
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                Application Theme
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Toggle between light and dark modes according to your working environment.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer select-none"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-4 h-4 text-brand-500" />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  Light Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security summary */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-150 dark:border-dark-border flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-500" />
          <h3 className="font-bold text-gray-900 dark:text-white font-display text-md">
            Security & Authentication
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 text-xs text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <p>
              Your passwords are encrypted using Bcrypt adaptive hashing. Session API requests verify HS256-signed JSON Web Tokens (JWT) stored in local secure memory, or Developer API headers (`X-API-Key`).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-150 dark:border-dark-border">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-dark-border flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <Check className="w-4 h-4 text-emerald-500" /> HTTPS Encryption Ready
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-dark-border flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <Check className="w-4 h-4 text-emerald-500" /> Auto Token Invalidation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
