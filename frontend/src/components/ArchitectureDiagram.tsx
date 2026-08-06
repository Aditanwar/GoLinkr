import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, Zap, User, ArrowRight, Info } from 'lucide-react';

interface NodeProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  active: boolean;
  onHover: () => void;
  onLeave: () => void;
  color: string;
}

const Node: React.FC<NodeProps> = ({ title, icon, description, active, onHover, onLeave, color }) => {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative z-10 p-5 rounded-2xl glass-panel shadow-lg transition-all duration-300 cursor-pointer w-48 text-center flex flex-col items-center ${
        active ? `border-${color}-500/50 ring-2 ring-${color}-500/20 scale-105` : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className={`p-3 rounded-xl mb-3 bg-${color}-500/10 text-${color}-600 dark:text-${color}-400`}>
        {icon}
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 font-display">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{description}</p>
    </div>
  );
};

export const ArchitectureDiagram: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const nodeDetails: Record<string, { title: string; detail: string; flow: string }> = {
    user: {
      title: 'Client / Visitor',
      detail: 'A user types or clicks a shortened link (e.g., http://localhost:8080/r/xYz12). The browser initiates an HTTP request.',
      flow: 'Initiates request → HTTP Gateway',
    },
    gateway: {
      title: 'API Gateway (Go / Gin)',
      detail: 'Receives traffic, applies custom JSON logging, and executes the sliding-window rate limiter middleware checking if the IP has exceeded 100 requests per minute.',
      flow: 'Validates rate-limit → Check Cache',
    },
    cache: {
      title: 'In-Memory Cache (Redis)',
      detail: 'Performs Cache-Aside lookup. If the short code details exist in Redis, immediately responds. Average response time: < 1-2 milliseconds.',
      flow: 'Hit: Return URL | Miss: Query DB',
    },
    db: {
      title: 'Database (PostgreSQL)',
      detail: 'If Redis is a miss, queries Postgres. Updates click count, retrieves long destination URL, sets value back to Redis, and stores click analytics asynchronously.',
      flow: 'Return URL → Save Cache & Redirect User',
    },
  };

  return (
    <div className="w-full py-8 px-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border border-gray-200 dark:border-gray-800 shadow-inner">
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display mb-1">
          System Architecture Flow
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Hover over nodes to see request lifecycle details and metrics routing
        </p>
      </div>

      <div className="relative flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto gap-8 md:gap-4 py-8">
        {/* SVG Connection Paths */}
        <div className="absolute inset-0 pointer-events-none hidden md:block">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* User -> Gateway Path */}
            <path d="M 192 120 L 290 120" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 4" fill="none" className="dark:stroke-gray-700" />
            {/* Gateway -> Cache Path */}
            <path d="M 480 120 L 580 120" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 4" fill="none" className="dark:stroke-gray-700" />
            {/* Cache -> DB Path */}
            <path d="M 672 120 Q 720 120 720 180 T 672 240 L 580 240" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 4" fill="none" className="dark:stroke-gray-700" />

            {/* Animated particles */}
            <motion.circle
              r="4"
              fill="#8b5cf6"
              initial={{ cx: 192, cy: 120 }}
              animate={{ cx: [192, 290] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
            <motion.circle
              r="4"
              fill="#8b5cf6"
              initial={{ cx: 480, cy: 120 }}
              animate={{ cx: [480, 580] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear', delay: 0.5 }}
            />
          </svg>
        </div>

        {/* Nodes */}
        <Node
          title="1. Visitor Request"
          icon={<User className="w-6 h-6" />}
          description="Client browser initiates URL resolution request."
          active={activeNode === 'user'}
          onHover={() => setActiveNode('user')}
          onLeave={() => setActiveNode(null)}
          color="indigo"
        />

        <div className="flex md:hidden text-gray-400">
          <ArrowRight className="w-5 h-5 rotate-90" />
        </div>

        <Node
          title="2. HTTP Gateway"
          icon={<Server className="w-6 h-6" />}
          description="Gin REST Engine & sliding window rate limiter."
          active={activeNode === 'gateway'}
          onHover={() => setActiveNode('gateway')}
          onLeave={() => setActiveNode(null)}
          color="brand"
        />

        <div className="flex md:hidden text-gray-400">
          <ArrowRight className="w-5 h-5 rotate-90" />
        </div>

        <Node
          title="3. Redis Cache"
          icon={<Zap className="w-6 h-6" />}
          description="In-memory cache for ultra-fast redirect lookups."
          active={activeNode === 'cache'}
          onHover={() => setActiveNode('cache')}
          onLeave={() => setActiveNode(null)}
          color="amber"
        />

        <div className="flex md:hidden text-gray-400">
          <ArrowRight className="w-5 h-5 rotate-90" />
        </div>

        <div className="flex flex-col gap-4">
          <Node
            title="4. PostgreSQL"
            icon={<Database className="w-6 h-6" />}
            description="Persistent storage for long URLs & user logs."
            active={activeNode === 'db'}
            onHover={() => setActiveNode('db')}
            onLeave={() => setActiveNode(null)}
            color="emerald"
          />
        </div>
      </div>

      {/* Detail Panel */}
      <div className="mt-8 max-w-2xl mx-auto h-32 relative">
        <AnimatePresence mode="wait">
          {activeNode ? (
            <motion.div
              key={activeNode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-xl border border-brand-500/20 bg-brand-500/5 text-left"
            >
              <h5 className="font-semibold text-brand-600 dark:text-brand-400 mb-1 flex items-center gap-2">
                <Info className="w-4 h-4" /> {nodeDetails[activeNode].title}
              </h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                {nodeDetails[activeNode].detail}
              </p>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-500">
                Flow: {nodeDetails[activeNode].flow}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full border border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-5 text-gray-400 dark:text-gray-600 text-sm"
            >
              Hover over any architecture node to see detailed operations
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
