import { supabase } from './supabase';
import type { TripRequest, GeneratedItinerary } from '../types';

export const tripService = {
  /**
   * 创建新的旅行计划
   */
  async createTrip(request: TripRequest) {
    try {
      // 获取当前用户
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { data: null, error: new Error('用户未登录') };
      }

      // 计算旅行天数
      const days = Math.ceil(
        (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      // 构造数据库记录
      const tripData = {
        user_id: user.id,
        title: `${request.destination.join('、')} ${days}日游`,
        destination: request.destination.join('、'),
        start_date: request.startDate,
        end_date: request.endDate,
        budget: request.budget,
        travelers_count: request.travelersCount,
        travelers_type: request.travelersType,
        preferences: request.preferences,
        accommodation_preference: request.accommodation,
        pace: request.pace,
        special_needs: request.specialNeeds || null,
        status: 'draft',
      };

      // 插入数据库
      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select()
        .single();

      if (error) {
        console.error('Create trip error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Create trip exception:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * 获取用户的所有旅行计划
   */
  async getUserTrips(status?: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { data: null, error: new Error('用户未登录') };
      }

      let query = supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get user trips error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get user trips exception:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * 获取单个旅行计划详情
   */
  async getTripById(tripId: string) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) {
        console.error('Get trip error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get trip exception:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * 更新旅行计划
   */
  async updateTrip(tripId: string, updates: Partial<TripRequest>) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)
        .select()
        .single();

      if (error) {
        console.error('Update trip error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Update trip exception:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * 更新旅行计划状态
   */
  async updateTripStatus(tripId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)
        .select()
        .single();

      if (error) {
        console.error('Update trip status error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Update trip status exception:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * 删除旅行计划
   */
  async deleteTrip(tripId: string) {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) {
        console.error('Delete trip error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Delete trip exception:', error);
      return { error: error as Error };
    }
  },

  /**
   * 更新旅行计划的 AI 生成行程
   * @param tripId 旅行计划 ID
   * @param itinerary 生成的行程数据
   */
  async updateTripItinerary(tripId: string, itinerary: GeneratedItinerary) {
    try {
      // 更新行程数据和状态
      const { data, error } = await supabase
        .from('trips')
        .update({
          itinerary: itinerary as any, // JSONB 类型
          status: 'generated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', tripId)
        .select()
        .single();

      if (error) {
        console.error('Update trip itinerary error:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Update trip itinerary exception:', error);
      return { data: null, error: error as Error };
    }
  },

  /**
   * 复制行程
   */
  async copyTrip(tripId: string) {
    try {
      // 获取当前用户
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { data: null, error: new Error('用户未登录') };
      }

      // 获取原行程
      const { data: originalTrip, error: getTripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (getTripError || !originalTrip) {
        return { data: null, error: getTripError || new Error('行程不存在') };
      }

      // 创建新行程（复制数据）
      const { id, created_at, updated_at, ...tripData } = originalTrip;
      const newTripData = {
        ...tripData,
        user_id: user.id,
        title: `${originalTrip.title} (副本)`,
        status: 'draft',
      };

      const { data: newTrip, error: createError } = await supabase
        .from('trips')
        .insert([newTripData])
        .select()
        .single();

      if (createError) {
        return { data: null, error: createError };
      }

      // 复制行程项
      if (originalTrip.itinerary) {
        const { error: updateError } = await supabase
          .from('trips')
          .update({ itinerary: originalTrip.itinerary })
          .eq('id', newTrip.id);

        if (updateError) {
          console.error('Copy itinerary items error:', updateError);
        }
      }

      return { data: newTrip, error: null };
    } catch (error) {
      console.error('Copy trip exception:', error);
      return { data: null, error: error as Error };
    }
  },
};
