import { useEffect, useState } from 'react';
import { TrendingUp, Users, Activity, MessageSquare, Calendar, Download } from 'lucide-react';
import { getAnalytics } from '../services/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface AnalyticsData {
  metric_id: string;
  type: string;
  value: number;
  period: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      const { data, error } = await getAnalytics(selectedPeriod);
      
      if (error) {
        console.error('Error loading analytics:', error);
        setError(error.message || 'Failed to load analytics');
        setAnalytics([]);
      } else {
        setAnalytics(data || []);
      }
    } catch (err: any) {
      console.error('Analytics page error:', err);
      setError(err.message || 'Failed to load analytics');
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon,
    color 
  }: { 
    title: string; 
    value: string; 
    change: string; 
    icon: any; 
    color: string;
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">{change}</span>
            <span className="text-sm text-gray-500 ml-1">vs last period</span>
          </div>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ChartPlaceholder = ({ title, height = "300" }: { title: string; height?: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className={`h-${height} flex items-center justify-center bg-gray-50 rounded-lg`}>
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Chart will be implemented with real data</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track usage patterns and system performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <MetricCard
          title="Active Users"
          value="1,234"
          change="+12%"
          icon={Users}
          color="bg-primary-600"
        />
        <MetricCard
          title="Total Translations"
          value="45,678"
          change="+8%"
          icon={Activity}
          color="bg-secondary-600"
        />
        <MetricCard
          title="Chat Messages"
          value="89,012"
          change="+15%"
          icon={MessageSquare}
          color="bg-purple-600"
        />
        <MetricCard
          title="Success Rate"
          value="98.5%"
          change="+2%"
          icon={TrendingUp}
          color="bg-green-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <ChartPlaceholder title="Usage Over Time" />
        <ChartPlaceholder title="Translation Accuracy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <ChartPlaceholder title="Popular Sign Categories" height="64" />
        <ChartPlaceholder title="User Demographics" height="64" />
        <ChartPlaceholder title="Device Usage" height="64" />
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">Error loading analytics: {error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Mock data rows */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date().toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Sign Translation
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    user@example.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    "Hello" → Text
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Success
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(Date.now() - 300000).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Chat Message
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    user2@example.com
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Real-time chat
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Success
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(Date.now() - 600000).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Model Training
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    system
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ASL Dataset v2.1
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      In Progress
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm font-medium text-gray-900">245ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Translation Accuracy</span>
              <span className="text-sm font-medium text-gray-900">98.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-gray-900">99.9%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium text-gray-900">0.05%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">CPU Usage</span>
                <span className="font-medium">65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-medium">42%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-secondary-600 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Storage Usage</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}