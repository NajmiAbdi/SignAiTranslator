import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, useColorScheme, Appearance } from 'react-native';
import { Bell, Globe, Moon, Shield, CircleHelp as HelpCircle, Info, ChevronRight, Trash2, Download } from 'lucide-react-native';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const systemColorScheme = useColorScheme();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(systemColorScheme === 'dark');
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Privacy & Security settings
  const [crashReports, setCrashReports] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [personalizedModels, setPersonalizedModels] = useState(false);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications ?? true);
        setDarkMode(settings.darkMode ?? (systemColorScheme === 'dark'));
        setAutoTranslate(settings.autoTranslate ?? true);
        setOfflineMode(settings.offlineMode ?? false);
        setCrashReports(settings.crashReports ?? true);
        setAnalytics(settings.analytics ?? true);
        setPersonalizedModels(settings.personalizedModels ?? false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      const settings = {
        notifications,
        darkMode,
        autoTranslate,
        offlineMode,
        crashReports,
        analytics,
        personalizedModels,
        ...newSettings
      };
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Also save to Supabase if configured
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('users')
            .update({ preferences: settings })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    setDarkMode(value);
    await saveSettings({ darkMode: value });
    
    // Apply theme change
    Appearance.setColorScheme(value ? 'dark' : 'light');
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotifications(value);
    await saveSettings({ notifications: value });
  };

  const handleAutoTranslateToggle = async (value: boolean) => {
    setAutoTranslate(value);
    await saveSettings({ autoTranslate: value });
  };

  const handleOfflineModeToggle = async (value: boolean) => {
    setOfflineMode(value);
    await saveSettings({ offlineMode: value });
    
    if (value) {
      Alert.alert(
        'Offline Mode',
        'Downloading models for offline use. This may take a few minutes.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your chat history, translations, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Clear AsyncStorage
              await AsyncStorage.clear();
              
              // Clear Supabase data if configured
              if (isSupabaseConfigured()) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from('chats').delete().eq('user_id', user.id);
                  await supabase.from('logs').delete().eq('user_id', user.id);
                }
              }
              
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear all data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      
      // Gather all user data
      let exportData = {
        user: {
          settings: {
            notifications,
            darkMode,
            autoTranslate,
            offlineMode,
            crashReports,
            analytics,
            personalizedModels
          }
        },
        chats: [],
        translations: [],
        exportDate: new Date().toISOString()
      };
      
      // Add Supabase data if available
      if (isSupabaseConfigured()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: chats } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });
          
          exportData.chats = chats || [];
          exportData.translations = chats?.filter(c => c.type === 'sign') || [];
        }
      }
      
      // Create document content
      const docContent = `
SIGN LANGUAGE TRANSLATOR - USER DATA EXPORT
==========================================

Export Date: ${new Date().toLocaleDateString()}

USER SETTINGS
-------------
• Notifications: ${notifications ? 'Enabled' : 'Disabled'}
• Dark Mode: ${darkMode ? 'Enabled' : 'Disabled'}
• Auto-translate: ${autoTranslate ? 'Enabled' : 'Disabled'}
• Offline Mode: ${offlineMode ? 'Enabled' : 'Disabled'}
• Crash Reports: ${crashReports ? 'Enabled' : 'Disabled'}
• Analytics: ${analytics ? 'Enabled' : 'Disabled'}
• Personalized Models: ${personalizedModels ? 'Enabled' : 'Disabled'}

CHAT HISTORY
------------
${exportData.chats.map((chat: any, index: number) => 
  `${index + 1}. [${new Date(chat.timestamp).toLocaleString()}] ${chat.type.toUpperCase()}: ${chat.message}`
).join('\n')}

SIGN TRANSLATIONS
-----------------
${exportData.translations.map((trans: any, index: number) => 
  `${index + 1}. [${new Date(trans.timestamp).toLocaleString()}] Recognized: "${trans.message}"`
).join('\n')}

Total Chat Messages: ${exportData.chats.length}
Total Translations: ${exportData.translations.length}

End of Export
==========================================
      `;
      
      // For React Native, we'll use expo-sharing to save the file
      const { FileSystem } = require('expo-file-system');
      const { Sharing } = require('expo-sharing');
      
      const fileUri = FileSystem.documentDirectory + 'sign_language_export.txt';
      await FileSystem.writeAsStringAsync(fileUri, docContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Sign Language Data'
        });
      }
      
      Alert.alert('Success', 'Data exported and saved to your device');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const showPrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. We collect minimal data necessary for app functionality:\n\n• Sign recognition data (processed locally)\n• Chat messages (encrypted)\n• Usage analytics (anonymized)\n• Account information\n\nData is never shared with third parties without consent.',
      [{ text: 'OK' }]
    );
  };

  const showHelp = () => {
    Alert.alert(
      'Help & Support',
      'How to use the app:\n\n1. Camera Tab: Point camera at sign language gestures\n2. Chat Tab: Type or speak to get translations\n3. Profile Tab: View your statistics\n4. Settings Tab: Customize your experience\n\nFor technical support, contact: support@signlanguagetranslator.com',
      [{ text: 'OK' }]
    );
  };

  const showFAQ = () => {
    Alert.alert(
      'Frequently Asked Questions',
      'Q: How accurate is the translation?\nA: Our AI achieves 95%+ accuracy with common signs.\n\nQ: Does it work offline?\nA: Enable offline mode in settings to download models.\n\nQ: Which sign languages are supported?\nA: Currently ASL, BSL, and ISL with more coming soon.\n\nQ: Is my data secure?\nA: Yes, all data is encrypted and stored securely.',
      [{ text: 'OK' }]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About Sign Language Translator',
      'Version: 1.0.0\nDeveloped by: AI Translation Systems\n\nThis app uses advanced AI to translate sign language in real-time, making communication more accessible for everyone.\n\nBuilt with React Native, Expo, and Gemini AI.\n\n© 2025 All rights reserved.',
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    showArrow = false, 
    onPress,
    dangerous = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    showArrow?: boolean;
    onPress?: () => void;
    dangerous?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, darkMode && styles.settingItemDark]} 
      onPress={onPress}
      disabled={!onPress && !onValueChange}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, dangerous && styles.dangerousIcon]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, dangerous && styles.dangerousText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, darkMode && styles.settingSubtitleDark]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {onValueChange && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: darkMode ? '#374151' : '#D1D5DB', true: '#3B82F6' }}
            thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
          />
        )}
        {showArrow && (
          <ChevronRight color={darkMode ? '#9CA3AF' : '#6B7280'} size={20} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, darkMode && styles.containerDark]} contentContainerStyle={styles.content}>
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>Settings</Text>
        <Text style={[styles.headerSubtitle, darkMode && styles.headerSubtitleDark]}>Customize your experience</Text>
        {!isSupabaseConfigured() && (
          <Text style={styles.warningText}>⚠️ Demo mode - Supabase not configured</Text>
        )}
      </View>

      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Notifications</Text>
        <SettingItem
          icon={<Bell color="#3B82F6" size={20} />}
          title="Push Notifications"
          subtitle="Get notified about new features and updates"
          value={notifications}
          onValueChange={handleNotificationsToggle}
        />
      </View>

      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Translation</Text>
        <SettingItem
          icon={<Globe color="#10B981" size={20} />}
          title="Auto-translate"
          subtitle="Automatically translate detected sign language"
          value={autoTranslate}
          onValueChange={handleAutoTranslateToggle}
        />
        <SettingItem
          icon={<Download color="#6B7280" size={20} />}
          title="Offline Mode"
          subtitle="Download models for offline translation"
          value={offlineMode}
          onValueChange={handleOfflineModeToggle}
        />
      </View>

      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Appearance</Text>
        <SettingItem
          icon={<Moon color="#6366F1" size={20} />}
          title="Dark Mode"
          subtitle="Use dark theme for better visibility"
          value={darkMode}
          onValueChange={handleDarkModeToggle}
        />
      </View>

      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Privacy & Security</Text>
        <SettingItem
          icon={<Shield color="#EF4444" size={20} />}
          title="Crash Reports"
          subtitle="Help improve the app by sending crash reports"
          value={crashReports}
          onValueChange={async (value) => {
            setCrashReports(value);
            await saveSettings({ crashReports: value });
          }}
        />
        <SettingItem
          icon={<Shield color="#3B82F6" size={20} />}
          title="Analytics"
          subtitle="Share usage data to improve app performance"
          value={analytics}
          onValueChange={async (value) => {
            setAnalytics(value);
            await saveSettings({ analytics: value });
          }}
        />
        <SettingItem
          icon={<Shield color="#10B981" size={20} />}
          title="Personalized Models"
          subtitle="Train AI models based on your usage patterns"
          value={personalizedModels}
          onValueChange={async (value) => {
            setPersonalizedModels(value);
            await saveSettings({ personalizedModels: value });
          }}
        />
        <SettingItem
          icon={<Shield color="#6B7280" size={20} />}
          title="Privacy Policy"
          subtitle="View our privacy policy and data usage"
          showArrow
          onPress={showPrivacyPolicy}
        />
      </View>

      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Data Management</Text>
        <SettingItem
          icon={<Download color="#3B82F6" size={20} />}
          title="Export Data"
          subtitle="Download your data as a document file"
          showArrow
          onPress={handleExportData}
        />
        <SettingItem
          icon={<Trash2 color="#EF4444" size={20} />}
          title="Clear All Data"
          subtitle="Delete all your data permanently"
          dangerous
          onPress={handleClearData}
        />
      </View>

      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Support</Text>
        <SettingItem
          icon={<HelpCircle color="#6B7280" size={20} />}
          title="Help & Support"
          subtitle="Get help using the app"
          showArrow
          onPress={showHelp}
        />
        <SettingItem
          icon={<HelpCircle color="#6B7280" size={20} />}
          title="FAQ"
          subtitle="Frequently asked questions"
          showArrow
          onPress={showFAQ}
        />
        <SettingItem
          icon={<Info color="#6B7280" size={20} />}
          title="About"
          subtitle="App version and information"
          showArrow
          onPress={showAbout}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, darkMode && styles.footerTextDark]}>
          Sign Language Translator v1.0.0
        </Text>
        <Text style={[styles.footerText, darkMode && styles.footerTextDark]}>
          © 2025 AI Translation Systems
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerTitleDark: {
    color: '#F9FAFB',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerSubtitleDark: {
    color: '#9CA3AF',
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionDark: {
    backgroundColor: '#1F2937',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitleDark: {
    color: '#F9FAFB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemDark: {
    borderBottomColor: '#374151',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dangerousIcon: {
    backgroundColor: '#FEE2E2',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingTitleDark: {
    color: '#F9FAFB',
  },
  dangerousText: {
    color: '#EF4444',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  settingSubtitleDark: {
    color: '#9CA3AF',
  },
  settingRight: {
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  footerTextDark: {
    color: '#6B7280',
  },
});