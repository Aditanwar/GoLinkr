import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { StatsCounter } from '../components/StatsCounter';
import { 
  Activity, 
  Cpu, 
  Database, 
  Layers, 
  LineChart as LineChartIcon,
  RefreshCw 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingActive, setPollingActive] = useState(true);

  const fetchMetrics = async () => {
    try {
      const data = await apiFetch('/system/metrics');
      setMetrics(data);
      
      // Update history buffer (keep last 15 points)
      setHistory(prev => {
        const timeLabel = new Date().toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          time: timeLabel,
          P50: parseFloat((data.latency_p50_ms || 0).toFixed(2)),
          P95: parseFloat((data.latency_p95_ms || 0).toFixed(2)),
          P99: parseFloat((data.latency_p99_ms || 0).toFixed(2)),
          memory: parseFloat((data.memory_alloc_mb || 0).toFixed(1)),
        };
        const nextHist = [...prev, newPoint];
        if (nextHist.length > 15) {
          return nextHist.slice(1);
        }
        return nextHist;
      });
    } catch (err) {
      console.error('Failed to load telemetry metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    let interval: any;
    if (pollingActive) {
      interval = setInterval(fetchMetrics, 3000);
    }
    return () => clearInterval(interval);
  }, [pollingActive]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Controls */}
      <div className="flex justify-between items-center bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-4 rounded-xl shadow-sm">
        <span className="text-xs text-gray-550 dark:text-gray-400 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          Live updates every 3 seconds
        </span>
        <button
          onClick={() => setPollingActive(!pollingActive)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            pollingActive 
              ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' 
              : 'bg-brand-500/10 text-brand-600 hover:bg-brand-500/20'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${pollingActive ? 'animate-spin' : ''}`} />
          {pollingActive ? 'Pause Polling' : 'Resume Polling'}
        </button>
      </div>

      {/* Stats Counters */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCounter
          label="Active Goroutines"
          value={metrics?.goroutines_count || 0}
          icon={<Cpu className="w-5 h-5" />}
          description="concurrent threads"
        />

        <StatsCounter
          label="Memory Allocated"
          value={`${metrics?.memory_alloc_mb.toFixed(1)} MB`}
          icon={<Layers className="w-5 h-5 text-indigo-500" />}
          description={`system: ${metrics?.memory_sys_mb.toFixed(1)} MB`}
        />

        <StatsCounter
          label="DB Active Connections"
          value={metrics?.db_active_conns || 0}
          icon={<Database className="w-5 h-5 text-emerald-500" />}
          description={`idle connections: ${metrics?.db_idle_conns || 0}`}
        />

        <StatsCounter
          label="DB Total Queries Run"
          value={metrics?.db_total_queries || 0}
          icon={<Database className="w-5 h-5 text-cyan-500" />}
          description="since application boot"
        />
      </div>

      {/* Latency Percentiles Charts */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Latency History */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white font-display text-md mb-6 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-brand-500" />
            Request Latency Percentiles (ms)
          </h3>
          <div className="h-72">
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: '10px' } }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="P50" stroke="#10b981" strokeWidth={2} dot={false} name="Median (P50)" />
                  <Line type="monotone" dataKey="P95" stroke="#f59e0b" strokeWidth={2} dot={false} name="P95 Latency" />
                  <Line type="monotone" dataKey="P99" stroke="#ef4444" strokeWidth={2} dot={false} name="P99 Latency" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-450 dark:text-gray-600">
                Awaiting telemetry logs...
              </div>
            )}
          </div>
        </div>

        {/* Memory History */}
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white font-display text-md mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            Memory Allocation Trend (MB)
          </h3>
          <div className="h-72">
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Line type="monotone" dataKey="memory" stroke="#6366f1" strokeWidth={2} dot={false} name="Allocated (MB)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-450 dark:text-gray-600">
                Awaiting memory stats...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
