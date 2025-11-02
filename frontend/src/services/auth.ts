import { supabase } from './supabase';

export const authService = {
  // 邮箱注册
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    return { data, error };
  },

  // 邮箱登录
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // 退出登录
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // 获取当前用户
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  // 获取会话
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },

  // 刷新会话
  async refreshSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();
    return { session, error };
  },

  // 重置密码 - 发送重置邮件
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  },

  // 更新密码
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  // 验证邮箱是否已注册
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-for-check',
      });
      
      // 如果错误信息包含 "Invalid login credentials"，说明用户存在但密码错误
      if (error && error.message.includes('Invalid login credentials')) {
        return true;
      }
      
      // 如果没有错误，说明登录成功（不应该发生）
      if (data.user) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  },

  // 监听认证状态变化
  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
  },

  // 创建用户 profile
  async createUserProfile(userId: string, data: { username?: string; avatar_url?: string; preferences?: any }) {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        ...data,
      })
      .select()
      .single();
    
    return { profile, error };
  },

  // 获取用户 profile
  async getUserProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { profile, error };
  },

  // 更新用户 profile
  async updateUserProfile(userId: string, data: { username?: string; avatar_url?: string; preferences?: any }) {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();
    
    return { profile, error };
  },
};
