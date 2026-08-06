import React from 'react';
import { motion } from 'framer-motion';

interface StatsCounterProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export const StatsCounter: React.FC<StatsCounterProps> = ({
  label,
  value,
  icon,
  description,
  change,
  changeType = 'neutral',
}) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl glass-panel p-6 shadow-sm flex flex-col justify-between"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-brand-500/10 blur-xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-500">
          {icon}
        </div>
      </div>

      <div>
        <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {value}
        </h3>
        
        {change && (
          <div className="flex items-center mt-2 text-xs font-semibold">
            <span
              className={`px-2 py-0.5 rounded-full ${
                changeType === 'positive'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                  : changeType === 'negative'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-500'
                  : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
              }`}
            >
              {change}
            </span>
            {description && (
              <span className="ml-2 text-gray-500 dark:text-gray-400">{description}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
