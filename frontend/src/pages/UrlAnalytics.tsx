import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { 
  ArrowLeft, 
  Calendar, 
  MousePointerClick, 
  Globe, 
  Laptop, 
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const UrlAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await apiFetch(`/analytics/${id}`);
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics details', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Analytics not found or access denied.</p>
        <Link to="/dashboard/links" className="text-brand-500 hover:underline mt-4 inline-block">
          Return to My Links
        </Link>
      </div>
    );
  }

  // Pre-process chart data
  const dailyChartData = (data.daily_stats || []).map((item: any) => ({
    date: new Date(item.click_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    clicks: item.clicks_count,
  })).reverse(); // Sort oldest to newest

  const browserChartData = (data.browser_stats || []).map((item: any) => ({
    browser: item.browser,
    clicks: item.clicks_count,
  }));

  const countryChartData = (data.country_stats || []).map((item: any) => ({
    country: item.country,
    clicks: item.clicks_count,
  }));

  const COLORS = ['#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/links"
          className="p-1.5 rounded-lg border border-gray-250 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            Link Analytics: {data.url?.short_code}
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
            <span className="truncate max-w-sm">Target: {data.url?.long_url}</span>
            <span>&bull;</span>
            <span>Created on {new Date(data.url?.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Aggregate metrics */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Total Clicks</span>
            <span className="text-2xl font-extrabold text-gray-905 dark:text-white mt-1 block">{data.url?.clicks_count || 0}</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Top Location</span>
            <span className="text-2xl font-extrabold text-gray-905 dark:text-white mt-1 block truncate max-w-[180px]">
              {countryChartData[0]?.country || 'None'}
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-450 dark:text-gray-500 uppercase tracking-wider block">Top Device</span>
            <span className="text-2xl font-extrabold text-gray-905 dark:text-white mt-1 block truncate max-w-[180px]">
              {browserChartData[0]?.browser || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Main charts grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Daily clicks chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white font-display text-md mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            Redirection Traffic (Last 7 Days)
          </h3>
          <div className="h-72">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-450 dark:text-gray-600">
                No redirection traffic logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Browser breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white font-display text-md mb-6 flex items-center gap-2">
            <Laptop className="w-5 h-5 text-amber-500" />
            Browser Distribution
          </h3>
          <div className="h-72">
            {browserChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={browserChartData} layout="vertical">
                  <XAxis type="number" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis dataKey="browser" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar dataKey="clicks" radius={[0, 4, 4, 0]} barSize={16}>
                    {browserChartData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-450 dark:text-gray-600">
                No browser data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click logs history */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-150 dark:border-dark-border">
          <h3 className="font-bold text-gray-900 dark:text-white font-display text-md flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            Recent Redirection Logs
          </h3>
        </div>

        {data.recent_clicks && data.recent_clicks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-150 dark:border-dark-border">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4">Referrer</th>
                  <th className="px-6 py-4">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-dark-border text-sm">
                {data.recent_clicks.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                      {new Date(log.clicked_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
                        {log.country}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {log.referrer}
                    </td>
                    <td className="px-6 py-4 text-gray-400 dark:text-gray-650 max-w-xs truncate text-xs">
                      {log.user_agent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-450 dark:text-gray-600 text-sm">
            No redirection logs found for this shortened link yet.
          </div>
        )}
      </div>
    </div>
  );
};
