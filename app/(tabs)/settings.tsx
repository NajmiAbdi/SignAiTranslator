import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { Bell, Globe, Moon, Shield, CircleHelp as HelpCircle, Info, ChevronRight, Trash2, Download } from 'lucide-react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your chat history, translations, and preferences. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Implement data clearing logic
            Alert.alert('Success', 'All data has been cleared');
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
          onPress: () => {
            // Implement data export logic
            Alert.alert('Success', 'Data exported successfully');
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
      style={styles.settingItem} 
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
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {onValueChange && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
            thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
          />
        )}
        {showArrow && (
          <ChevronRight color="#6B7280" size={20} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your experience</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon={<Bell color="#3B82F6" size={20} />}
          title="Push Notifications"
          subtitle="Get notified about new features and updates"
          value={notifications}
          onValueChange={setNotifications}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translation</Text>
        <SettingItem
          icon={<Globe color="#10B981" size={20} />}
          title="Auto-translate"
          subtitle="Automatically translate detected sign language"
          value={autoTranslate}
          onValueChange={setAutoTranslate}
        />
        <SettingItem
          icon={<Download color="#6B7280" size={20} />}
          title="Offline Mode"
          subtitle="Download models for offline translation"
          value={offlineMode}
          onValueChange={setOfflineMode}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <SettingItem
          icon={<Moon color="#6366F1" size={20} />}
          title="Dark Mode"
          subtitle="Use dark theme for better visibility"
          value={darkMode}
          onValueChange={setDarkMode}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <SettingItem
          icon={<Shield color="#059669" size={20} />}
          title="Privacy Settings"
          subtitle="Manage your data and privacy preferences"
          showArrow
          onPress={() => Alert.alert('Privacy Settings', 'Privacy settings will be implemented')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
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
        <Text style={styles.footerText}>
          Sign Language Translator v1.0.0
        </Text>
        <Text style={styles.footerText}>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
  dangerousText: {
    color: '#EF4444',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
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
});