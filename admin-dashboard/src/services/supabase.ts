import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your admin-dashboard/.env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Admin auth functions
export const signInAdmin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Check if user has admin role
  if (data.user && data.user.user_metadata?.role !== 'admin') {
    await supabase.auth.signOut();
    return {
      data: null,
      error: { message: 'Access denied. Admin privileges required.' }
    };
  }

  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Database helper functions
export const getUsers = async (limit = 50, offset = 0) => {
  const { data, error, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  return { data, error, count };
};

export const getUserStats = async () => {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total translations count
    const { count: totalTranslations, error: translationsError } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'sign');

    // Get total messages count
    const { count: totalMessages, error: messagesError } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true });

    // Return data even if some queries fail
    return {
      data: {
        totalUsers: totalUsers || 0,
        totalTranslations: totalTranslations || 0,
        totalMessages: totalMessages || 0,
      },
      error: usersError || translationsError || messagesError
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return {
      data: {
        totalUsers: 0,
        totalTranslations: 0,
        totalMessages: 0,
      },
      error: error as any
    };
  }
};

export const getDatasets = async () => {
  try {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data: data || [], error };
  } catch (error) {
    console.error('Error in getDatasets:', error);
    return { data: [], error: error as any };
  }
};

export const getAnalytics = async (period = '7d') => {
  try {
    const startDate = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 1;
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    
    return { data: data || [], error };
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    return { data: [], error: error as any };
  }
};

export const getLogs = async (limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('logs')
      .select(`
        *,
        users (name, email)
      `)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    return { data: data || [], error };
  } catch (error) {
    console.error('Error in getLogs:', error);
    return { data: [], error: error as any };
  }
};