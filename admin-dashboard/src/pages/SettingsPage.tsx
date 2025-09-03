import { useState } from 'react';
import { Save, Shield, Bell, Database, Key, Globe, Monitor } from 'lucide-react';
import { geminiService } from '../services/geminiService';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // API Settings
    apiRateLimit: 1000,
    apiTimeout: 30,
    enableCaching: true,
    
    // Security Settings
    requireTwoFA: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    
    // System Settings
    autoBackup: true,
    backupFrequency: 'daily',
    logRetentionDays: 30,
    
    // AI Model Settings
    defaultLanguage: 'en',
    modelQuality: 'high',
    enableOfflineMode: false,
  });

  // API Keys state
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    // Load current API key
    const currentKey = geminiService.getCurrentApiKey();
    if (currentKey) {
      setGeminiApiKey(currentKey.substring(0, 20) + '...');
      setApiKeyStatus('valid');
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const handleUpdateGeminiKey = async () => {
    if (!geminiApiKey.trim()) return;
    
    setApiKeyStatus('testing');
    
    try {
      const success = await geminiService.updateApiKey(geminiApiKey);
      
      if (success) {
        setApiKeyStatus('valid');
        alert('Gemini API key updated successfully!');
      } else {
        setApiKeyStatus('invalid');
        alert('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      setApiKeyStatus('invalid');
      alert('Failed to update API key.');
    }
  };

  const SettingSection = ({ title, icon: Icon, children }: { 
    title: string; 
    icon: any; 
    children: React.ReactNode; 
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Icon className="h-5 w-5 mr-2 text-primary-600" />
          {title}
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ 
    label, 
    description, 
    children 
  }: { 
    label: string; 
    description?: string; 
    children: React.ReactNode; 
  }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="ml-4">
        {children}
      </div>
    </div>
  );

  const Toggle = ({ 
    checked, 
    onChange 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure system preferences and security options</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* API Settings */}
      <SettingSection title="API Configuration" icon={Monitor}>
        <SettingRow
          label="Rate Limit (requests/hour)"
          description="Maximum number of API requests per hour per user"
        >
          <input
            type="number"
            value={settings.apiRateLimit}
            onChange={(e) => setSettings({ ...settings, apiRateLimit: parseInt(e.target.value) })}
            className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </SettingRow>
        
        <SettingRow
          label="API Timeout (seconds)"
          description="Maximum time to wait for API responses"
        >
          <input
            type="number"
            value={settings.apiTimeout}
            onChange={(e) => setSettings({ ...settings, apiTimeout: parseInt(e.target.value) })}
            className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </SettingRow>
        
        <SettingRow
          label="Enable Caching"
          description="Cache API responses to improve performance"
        >
          <Toggle
            checked={settings.enableCaching}
            onChange={(checked) => setSettings({ ...settings, enableCaching: checked })}
          />
        </SettingRow>
      </SettingSection>

      {/* Security Settings */}
      <SettingSection title="Security & Authentication" icon={Shield}>
        <SettingRow
          label="Require Two-Factor Authentication"
          description="Enforce 2FA for all admin users"
        >
          <Toggle
            checked={settings.requireTwoFA}
            onChange={(checked) => setSettings({ ...settings, requireTwoFA: checked })}
          />
        </SettingRow>
        
        <SettingRow
          label="Session Timeout (minutes)"
          description="Automatically log out inactive users"
        >
          <select
            value={settings.sessionTimeout}
            onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
          </select>
        </SettingRow>
        
        <SettingRow
          label="Minimum Password Length"
          description="Required length for user passwords"
        >
          <input
            type="number"
            min="6"
            max="20"
            value={settings.passwordMinLength}
            onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
            className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </SettingRow>
      </SettingSection>

      {/* Notification Settings */}
      <SettingSection title="Notifications" icon={Bell}>
        <SettingRow
          label="Email Notifications"
          description="Send email alerts for important events"
        >
          <Toggle
            checked={settings.emailNotifications}
            onChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
          />
        </SettingRow>
        
        <SettingRow
          label="Push Notifications"
          description="Browser push notifications for real-time alerts"
        >
          <Toggle
            checked={settings.pushNotifications}
            onChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
          />
        </SettingRow>
        
        <SettingRow
          label="Weekly Reports"
          description="Receive weekly usage and performance reports"
        >
          <Toggle
            checked={settings.weeklyReports}
            onChange={(checked) => setSettings({ ...settings, weeklyReports: checked })}
          />
        </SettingRow>
      </SettingSection>

      {/* System Settings */}
      <SettingSection title="System & Database" icon={Database}>
        <SettingRow
          label="Automatic Backups"
          description="Automatically backup database and user data"
        >
          <Toggle
            checked={settings.autoBackup}
            onChange={(checked) => setSettings({ ...settings, autoBackup: checked })}
          />
        </SettingRow>
        
        <SettingRow
          label="Backup Frequency"
          description="How often to create automatic backups"
        >
          <select
            value={settings.backupFrequency}
            onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={!settings.autoBackup}
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </SettingRow>
        
        <SettingRow
          label="Log Retention (days)"
          description="How long to keep system logs"
        >
          <input
            type="number"
            value={settings.logRetentionDays}
            onChange={(e) => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value) })}
            className="w-20 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </SettingRow>
      </SettingSection>

      {/* AI Model Settings */}
      <SettingSection title="AI Models & Translation" icon={Globe}>
        <SettingRow
          label="Default Language"
          description="Primary language for sign language recognition"
        >
          <select
            value={settings.defaultLanguage}
            onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="en">American Sign Language (ASL)</option>
            <option value="gb">British Sign Language (BSL)</option>
            <option value="in">Indian Sign Language (ISL)</option>
          </select>
        </SettingRow>
        
        <SettingRow
          label="Model Quality"
          description="Balance between accuracy and processing speed"
        >
          <select
            value={settings.modelQuality}
            onChange={(e) => setSettings({ ...settings, modelQuality: e.target.value })}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="fast">Fast (Lower accuracy)</option>
            <option value="balanced">Balanced</option>
            <option value="high">High Quality (Slower)</option>
          </select>
        </SettingRow>
        
        <SettingRow
          label="Enable Offline Mode"
          description="Allow translation without internet connection"
        >
          <Toggle
            checked={settings.enableOfflineMode}
            onChange={(checked) => setSettings({ ...settings, enableOfflineMode: checked })}
          />
        </SettingRow>
      </SettingSection>

      {/* API Keys Section */}
      <SettingSection title="API Keys & Integrations" icon={Key}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <div className="flex items-center mb-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                apiKeyStatus === 'valid' ? 'bg-green-100 text-green-800' :
                apiKeyStatus === 'invalid' ? 'bg-red-100 text-red-800' :
                apiKeyStatus === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {apiKeyStatus === 'valid' ? '✓ Connected' :
                 apiKeyStatus === 'invalid' ? '✗ Invalid' :
                 apiKeyStatus === 'testing' ? '⟳ Testing...' :
                 '○ Not Set'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md sm:rounded-l-md sm:rounded-r-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button 
                onClick={handleUpdateGeminiKey}
                disabled={!geminiApiKey.trim() || apiKeyStatus === 'testing'}
                className="px-4 py-2 bg-primary-600 text-white border border-primary-600 rounded-md sm:border-l-0 sm:rounded-l-none sm:rounded-r-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {apiKeyStatus === 'testing' ? 'Testing...' : 'Update'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-primary-600 hover:text-primary-700">Google AI Studio</a>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Usage Statistics
            </label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Requests Today:</span>
                  <span className="font-medium ml-2">247</span>
                </div>
                <div>
                  <span className="text-gray-600">Monthly Limit:</span>
                  <span className="font-medium ml-2">10,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}