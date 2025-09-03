import { useEffect, useState } from 'react';
import { Users, Activity, MessageSquare, Database, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../services/supabase'; // ✅ soo dhoofinta saxda ah
import LoadingSpinner from '../components/LoadingSpinner';

interface StatsData {
  totalUsers: number;
  totalTranslations: number;
  totalMessages: number;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  trend?: string;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {trend && (
          <p className="text-sm text-green-600 mt-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const ActivityItem = ({
  action,
  user,
  time
}: {
  action: string;
  user: string;
  time: string;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <div>
      <p className="text-sm font-medium text-gray-900">{action}</p>
      <p className="text-xs text-gray-500">{user}</p>
    </div>
    <span className="text-xs text-gray-400">{time}</span>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [
        usersResult,
        translationsResult,
        messagesResult,
        activityResult
      ] = await Promise.all([
        supabase.from('users').select('id'),
        supabase.from('translations').select('id'),
        supabase.from('chats').select('id, message'),
        supabase
          .from('activity_logs')
          .select('action,user,timestamp')
          .order('timestamp', { ascending: false })
          .limit(10)
      ]);

      setStats({
        totalUsers: usersResult.data?.length || 0,
        totalTranslations: translationsResult.data?.length || 0,
        totalMessages: messagesResult.data?.length || 0
      });

      setRecentActivity(activityResult.data || []);

      // Example system status check (can be adjusted to your tables)
      setSystemStatus([
        { name: 'API Service', status: 'Online' },
        { name: 'Database', status: usersResult.error ? 'Disconnected' : 'Connected' },
        { name: 'AI Models', status: 'Training in progress' }
      ]);
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load dashboard');
      setStats({
        totalUsers: 0,
        totalTranslations: 0,
        totalMessages: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your sign language translator system</p>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2" />
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="bg-primary-600"
          trend="+12% from last month"
        />
        <StatCard
          title="Translations"
          value={stats?.totalTranslations || 0}
          icon={Activity}
          color="bg-secondary-600"
          trend="+8% from last week"
        />
        <StatCard
          title="Chat Messages"
          value={stats?.totalMessages || 0}
          icon={MessageSquare}
          color="bg-purple-600"
          trend="+15% from last week"
        />
        <StatCard
          title="Active Models"
          value={3}
          icon={Database}
          color="bg-orange-600"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Usage Chart (placeholder for real chart integration) */}
        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Trends</h3>
          <div className="h-48 lg:h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-1">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, idx) => (
                <ActivityItem
                  key={idx}
                  action={act.action}
                  user={act.user}
                  time={new Date(act.timestamp).toLocaleString()}
                />
              ))
            ) : (
              <p className="text-gray-500">No recent activity found</p>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemStatus.map((s, idx) => (
            <div key={idx} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${
                  s.status === 'Online' || s.status === 'Connected'
                    ? 'bg-green-400'
                    : s.status.includes('progress')
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                }`}
              ></div>
              <div>
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500">{s.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
