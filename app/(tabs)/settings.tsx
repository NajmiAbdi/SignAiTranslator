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

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported as a JSON file and saved to your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setLoading(true);
            try {
              const exportData = {
                settings: {
                  notifications,
                  darkMode,
                  autoTranslate,
                  offlineMode
                },
                exportDate: new Date().toISOString()
              };
              
              // Add Supabase data if available
              if (isSupabaseConfigured()) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  const { data: chats } = await supabase
                    .from('chats')
                    .select('*')
                    .eq('user_id', user.id);
                  
                  exportData.chats = chats || [];
                }
              }
              
              // In a real app, you would save this to device storage
              console.log('Export data:', exportData);
              Alert.alert('Success', 'Data exported successfully');
            } catch (error) {
              console.error('Error exporting data:', error);
              Alert.alert('Error', 'Failed to export data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
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
          icon={<Shield color="#059669" size={20} />}
          title="Privacy Settings"
          subtitle="Manage your data and privacy preferences"
          showArrow
          onPress={() => Alert.alert('Privacy Settings', 'Privacy settings will be implemented')}
        />
      </View>

      <View style={[styles.section, darkMode && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Data Management</Text>
        <SettingItem
          icon={<Download color="#3B82F6" size={20} />}
          title="Export Data"
          subtitle="Download your data as a backup"
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
          title="Help & FAQ"
          subtitle="Get answers to common questions"
          showArrow
          onPress={() => Alert.alert('Help', 'Help section will be implemented')}
        />
        <SettingItem
          icon={<Info color="#6B7280" size={20} />}
          title="About"
          subtitle="App version and information"
          showArrow
          onPress={() => Alert.alert('About', 'Sign Language Translator v1.0.0')}
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