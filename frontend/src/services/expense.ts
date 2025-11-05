/**
 * 费用管理服务
 * 提供费用记录的CRUD操作和统计功能
 */

import { supabase } from './supabase';
import type {
  Expense,
  AddExpenseRequest,
  UpdateExpenseRequest,
  ExpenseQueryParams,
  ExpenseStatsByCategory,
  ExpenseStatsByDate,
  ExpenseOverview,
  ExpenseCategory,
} from '../types';

/**
 * 费用服务类
 */
export class ExpenseService {
  /**
   * 添加费用记录
   */
  static async addExpense(data: AddExpenseRequest): Promise<Expense> {
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: data.trip_id,
        category: data.category,
        amount: data.amount,
        description: data.description,
        expense_date: data.expense_date,
        payment_method: data.payment_method,
        receipt_url: data.receipt_url,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('添加费用记录失败:', error);
      throw new Error(`添加费用记录失败: ${error.message}`);
    }

    return expense;
  }

  /**
   * 获取费用列表
   */
  static async getExpenses(params: ExpenseQueryParams): Promise<Expense[]> {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', params.trip_id);

    // 日期范围筛选
    if (params.start_date) {
      query = query.gte('expense_date', params.start_date);
    }
    if (params.end_date) {
      query = query.lte('expense_date', params.end_date);
    }

    // 类别筛选
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // 金额范围筛选
    if (params.min_amount !== undefined) {
      query = query.gte('amount', params.min_amount);
    }
    if (params.max_amount !== undefined) {
      query = query.lte('amount', params.max_amount);
    }

    // 排序
    const sortBy = params.sort_by || 'expense_date';
    const sortOrder = params.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) {
      console.error('获取费用列表失败:', error);
      throw new Error(`获取费用列表失败: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 根据ID获取单个费用记录
   */
  static async getExpenseById(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 记录不存在
        return null;
      }
      console.error('获取费用记录失败:', error);
      throw new Error(`获取费用记录失败: ${error.message}`);
    }

    return data;
  }

  /**
   * 更新费用记录
   */
  static async updateExpense(
    id: string,
    data: UpdateExpenseRequest
  ): Promise<Expense> {
    const { data: expense, error } = await supabase
      .from('expenses')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新费用记录失败:', error);
      throw new Error(`更新费用记录失败: ${error.message}`);
    }

    return expense;
  }

  /**
   * 删除费用记录
   */
  static async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id);

    if (error) {
      console.error('删除费用记录失败:', error);
      throw new Error(`删除费用记录失败: ${error.message}`);
    }
  }

  /**
   * 批量删除费用记录
   */
  static async deleteExpenses(ids: string[]): Promise<void> {
    const { error } = await supabase.from('expenses').delete().in('id', ids);

    if (error) {
      console.error('批量删除费用记录失败:', error);
      throw new Error(`批量删除费用记录失败: ${error.message}`);
    }
  }

  /**
   * 按类别统计费用
   */
  static async getStatsByCategory(
    tripId: string
  ): Promise<ExpenseStatsByCategory[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('trip_id', tripId);

    if (error) {
      console.error('按类别统计费用失败:', error);
      throw new Error(`按类别统计费用失败: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 计算总金额
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

    // 按类别分组统计
    const categoryMap = new Map<ExpenseCategory, { total: number; count: number }>();

    data.forEach((item) => {
      const category = item.category as ExpenseCategory;
      const existing = categoryMap.get(category) || { total: 0, count: 0 };
      categoryMap.set(category, {
        total: existing.total + item.amount,
        count: existing.count + 1,
      });
    });

    // 转换为数组并计算百分比
    const stats: ExpenseStatsByCategory[] = Array.from(categoryMap.entries()).map(
      ([category, { total, count }]) => ({
        category,
        total_amount: total,
        count,
        percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0,
      })
    );

    // 按金额降序排序
    stats.sort((a, b) => b.total_amount - a.total_amount);

    return stats;
  }

  /**
   * 按日期统计费用
   */
  static async getStatsByDate(tripId: string): Promise<ExpenseStatsByDate[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('expense_date, category, amount')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: true });

    if (error) {
      console.error('按日期统计费用失败:', error);
      throw new Error(`按日期统计费用失败: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // 按日期分组
    const dateMap = new Map<
      string,
      { total: number; count: number; categories: Map<ExpenseCategory, number> }
    >();

    data.forEach((item) => {
      const date = item.expense_date;
      const category = item.category as ExpenseCategory;
      const existing = dateMap.get(date) || {
        total: 0,
        count: 0,
        categories: new Map(),
      };

      existing.total += item.amount;
      existing.count += 1;
      existing.categories.set(
        category,
        (existing.categories.get(category) || 0) + item.amount
      );

      dateMap.set(date, existing);
    });

    // 转换为数组
    const stats: ExpenseStatsByDate[] = Array.from(dateMap.entries()).map(
      ([date, { total, count, categories }]) => ({
        date,
        total_amount: total,
        count,
        categories: Object.fromEntries(categories),
      })
    );

    return stats;
  }

  /**
   * 获取费用总览
   */
  static async getExpenseOverview(
    tripId: string,
    budget: number
  ): Promise<ExpenseOverview> {
    // 获取所有费用记录
    const expenses = await this.getExpenses({ trip_id: tripId });

    // 计算总费用
    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

    // 计算剩余预算和使用百分比
    const remaining = budget - totalAmount;
    const percentageUsed = budget > 0 ? (totalAmount / budget) * 100 : 0;

    // 获取按类别统计
    const byCategory = await this.getStatsByCategory(tripId);

    // 获取按日期统计
    const byDate = await this.getStatsByDate(tripId);

    // 获取最近的费用记录（最多10条）
    const recentExpenses = await this.getExpenses({
      trip_id: tripId,
      sort_by: 'created_at',
      sort_order: 'desc',
    });

    return {
      total_amount: totalAmount,
      budget,
      remaining,
      percentage_used: percentageUsed,
      by_category: byCategory,
      by_date: byDate,
      recent_expenses: recentExpenses.slice(0, 10),
    };
  }

  /**
   * 获取行程的总费用
   */
  static async getTotalExpense(tripId: string): Promise<number> {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('trip_id', tripId);

    if (error) {
      console.error('获取总费用失败:', error);
      throw new Error(`获取总费用失败: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return 0;
    }

    return data.reduce((sum, item) => sum + item.amount, 0);
  }

  /**
   * 获取指定类别的费用总额
   */
  static async getCategoryTotal(
    tripId: string,
    category: ExpenseCategory
  ): Promise<number> {
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('trip_id', tripId)
      .eq('category', category);

    if (error) {
      console.error('获取类别费用失败:', error);
      throw new Error(`获取类别费用失败: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return 0;
    }

    return data.reduce((sum, item) => sum + item.amount, 0);
  }

  /**
   * 检查费用是否超过预算
   */
  static async checkBudget(
    tripId: string,
    budget: number
  ): Promise<{
    isOverBudget: boolean;
    totalExpense: number;
    remaining: number;
    percentageUsed: number;
  }> {
    const totalExpense = await this.getTotalExpense(tripId);
    const remaining = budget - totalExpense;
    const percentageUsed = budget > 0 ? (totalExpense / budget) * 100 : 0;

    return {
      isOverBudget: totalExpense > budget,
      totalExpense,
      remaining,
      percentageUsed,
    };
  }
}

// 导出单例
export const expenseService = ExpenseService;
