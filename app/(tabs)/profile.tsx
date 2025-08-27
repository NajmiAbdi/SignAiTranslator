import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { User, Mail, Calendar, Settings, LogOut, Activity } from 'lucide-react-native';
import { supabase, signOut, isSupabaseConfigured } from '../../lib/supabase';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  preferences: any;
}

interface UserStats {
  totalTranslations: number;
  totalChatMessages: number;
  joinedDate: string;
  lastActivity: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      loadUserProfile();
      loadUserStats();
    } else {
      // Set demo data when Supabase is not configured
      setUser({
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'user',
        created_at: new Date().toISOString(),
        preferences: {
          language: 'en',
          notifications: true,
          theme: 'light',
        },
      });
      setStats({
        totalTranslations: 42,
        totalChatMessages: 128,
        joinedDate: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      });
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        throw new Error('User not authenticated');
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        try {
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              name: authUser.user_metadata?.name || 'User',
              email: authUser.email || '',
              role: 'user',
              preferences: {
                language: 'en',
                notifications: true,
                theme: 'light',
              },
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            setUser({
              id: authUser.id,
              name: authUser.user_metadata?.name || 'User',
              email: authUser.email || '',
              role: 'user',
              created_at: new Date().toISOString(),
              preferences: {
                language: 'en',
                notifications: true,
                theme: 'light',
              },
            });
          } else {
            setUser(newProfile);
          }
        } catch (createError) {
          console.error('Failed to create user profile:', createError);
          setUser({
            id: authUser.id,
            name: 'User',
            email: authUser.email || '',
            role: 'user',
            created_at: new Date().toISOString(),
            preferences: {},
          });
        }
      } else {
        setUser(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      try {
        const { data: translations, error: translationsError } = await supabase
          .from('chats')
          .select('*', { count: 'exact' })
          .eq('user_id', authUser.id)
          .eq('type', 'sign');

        const { data: messages, error: messagesError } = await supabase
          .from('chats')
          .select('*', { count: 'exact' })
          .eq('user_id', authUser.id);

        const { data: lastActivity } = await supabase
          .from('logs')
          .select('timestamp')
          .eq('user_id', authUser.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        setStats({
          totalTranslations: translations?.length || 0,
          totalChatMessages: messages?.length || 0,
          joinedDate: user?.created_at || new Date().toISOString(),
          lastActivity: lastActivity?.timestamp || new Date().toISOString(),
        });
      } catch (statsError) {
        console.error('Error loading user stats:', statsError);
        setStats({
          totalTranslations: 0,
          totalChatMessages: 0,
          joinedDate: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await signOut();
        if (error) throw error;
      } else {
        Alert.alert('Demo Mode', 'Sign out is not available in demo mode');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isSupabaseConfigured() && (
          <Text style={styles.warningText}>⚠️ Demo mode - Supabase not configured</Text>
        )}
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User color="#3B82F6" size={40} />
          </View>
        </View>
        
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.roleContainer}>
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Activity color="#10B981" size={24} />
            <Text style={styles.statNumber}>{stats?.totalTranslations || 0}</Text>
            <Text style={styles.statLabel}>Translations</Text>
          </View>
          
          <View style={styles.statCard}>
            <Mail color="#3B82F6" size={24} />
            <Text style={styles.statNumber}>{stats?.totalChatMessages || 0}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>

        <View style={styles.dateInfo}>
          <View style={styles.dateItem}>
            <Calendar color="#6B7280" size={16} />
            <Text style={styles.dateText}>
              Joined {new Date(stats?.joinedDate || '').toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.dateItem}>
            <Activity color="#6B7280" size={16} />
            <Text style={styles.dateText}>
              Last active {new Date(stats?.lastActivity || '').toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.preferencesContainer}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Language</Text>
          <Text style={styles.preferenceValue}>
            {user.preferences?.language || 'English'}
          </Text>
        </View>
        
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Notifications</Text>
          <Text style={styles.preferenceValue}>
            {user.preferences?.notifications ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceLabel}>Theme</Text>
          <Text style={styles.preferenceValue}>
            {user.preferences?.theme || 'Light'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut color="#FFFFFF" size={20} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  },
  warningText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  roleContainer: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  dateInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  preferencesContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
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
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  preferenceValue: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
});