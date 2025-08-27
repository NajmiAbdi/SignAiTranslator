import { useState } from 'react';
import { Save, Shield, Bell, Database, Key, Globe, Monitor } from 'lucide-react';

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

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              AI Service API Key
            </label>
            <div className="flex">
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors">
                Update
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speech Service API Key
            </label>
            <div className="flex">
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors">
                Update
              </button>
            </div>
          </div>
        </div>
      </SettingSection>
    </div>
  );
}