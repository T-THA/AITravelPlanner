/**
 * 费用管理页面
 * 提供完整的费用记录、查看、统计功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tabs,
  Select,
  message,
  Spin,
  Empty,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  BarChartOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { expenseService } from '../services/expense';
import {
  exportExpensesToExcel,
  exportExpensesToCSV,
  exportExpenseReportToExcel,
} from '../services/export';
import AddExpenseModal from '../components/AddExpenseModal';
import ExpenseList from '../components/ExpenseList';
import ExpenseStatistics from '../components/ExpenseStatistics';
import type { Expense, ExpenseOverview } from '../types';

const { Title } = Typography;
const { Option } = Select;

const ExpenseManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [overview, setOverview] = useState<ExpenseOverview | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');

  // 加载用户的行程列表
  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 加载选中行程的费用数据
  useEffect(() => {
    if (selectedTripId && trips.length > 0) {
      loadExpenseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTripId, trips]);

  // 加载行程列表
  const loadTrips = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // 导入 supabase 服务
      const { supabase } = await import('../services/supabase');
      const { data, error } = await supabase
        .from('trips')
        .select('id, destination, start_date, end_date, budget')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTrips(data || []);
      
      // 自动选择第一个行程
      if (data && data.length > 0 && !selectedTripId) {
        setSelectedTripId(data[0].id);
      }
    } catch (error: any) {
      console.error('加载行程列表失败:', error);
      message.error('加载行程列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载费用数据
  const loadExpenseData = async () => {
    if (!selectedTripId) return;
    
    try {
      setLoading(true);
      
      // 获取当前行程的预算
      const currentTrip = trips.find((t) => t.id === selectedTripId);
      if (!currentTrip) {
        console.error('未找到选中的行程');
        return;
      }
      
      const budget = currentTrip.budget || 0;

      // 加载费用列表
      const expenseList = await expenseService.getExpenses({
        trip_id: selectedTripId,
        sort_by: 'expense_date',
        sort_order: 'desc',
      });
      setExpenses(expenseList);

      // 加载费用统计
      const expenseOverview = await expenseService.getExpenseOverview(
        selectedTripId,
        budget
      );
      setOverview(expenseOverview);
    } catch (error: any) {
      console.error('加载费用数据失败:', error);
      message.error('加载费用数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理添加费用成功
  const handleAddSuccess = () => {
    setAddModalVisible(false);
    setEditingExpense(null);
    loadExpenseData();
  };

  // 处理编辑费用
  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setAddModalVisible(true);
  };

  // 处理删除费用
  const handleDelete = async (id: string) => {
    try {
      await expenseService.deleteExpense(id);
      message.success('费用记录已删除');
      loadExpenseData();
    } catch (error: any) {
      console.error('删除费用记录失败:', error);
      message.error('删除费用记录失败');
    }
  };

  // 处理刷新
  const handleRefresh = () => {
    if (selectedTripId) {
      loadExpenseData();
    }
  };

  // 处理导出
  const handleExport = (type: 'excel' | 'csv' | 'report') => {
    if (!selectedTripId || expenses.length === 0) {
      message.warning('没有可导出的费用记录');
      return;
    }

    const currentTrip = trips.find((t) => t.id === selectedTripId);
    if (!currentTrip) return;

    const tripName = currentTrip.destination;
    const totalAmount = overview?.total_amount || 0;
    const budget = currentTrip.budget || 0;

    try {
      if (type === 'excel') {
        exportExpensesToExcel(expenses, tripName, totalAmount, budget);
        message.success('Excel文件已导出');
      } else if (type === 'csv') {
        exportExpensesToCSV(expenses, tripName, totalAmount, budget);
        message.success('CSV文件已导出');
      } else if (type === 'report') {
        const categoryStats = overview?.by_category.map((item) => ({
          category: item.category,
          amount: item.total_amount,
          count: item.count,
          percentage: item.percentage,
        })) || [];
        exportExpenseReportToExcel(expenses, tripName, totalAmount, budget, categoryStats);
        message.success('费用报告已导出');
      }
    } catch (error: any) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };

  // 导出菜单项
  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'excel',
      label: '导出为Excel',
      onClick: () => handleExport('excel'),
    },
    {
      key: 'csv',
      label: '导出为CSV',
      onClick: () => handleExport('csv'),
    },
    {
      key: 'report',
      label: '导出统计报告',
      onClick: () => handleExport('report'),
    },
  ];

  // 如果没有登录
  if (!user) {
    return (
      <div>
        <Title level={2}>费用管理</Title>
        <Card>
          <Empty description="请先登录" />
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* 页面标题和操作栏 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={2} style={{ margin: 0 }}>费用管理</Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            <Dropdown menu={{ items: exportMenuItems }} disabled={!selectedTripId || expenses.length === 0}>
              <Button icon={<DownloadOutlined />}>
                导出
              </Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalVisible(true)}
              disabled={!selectedTripId}
            >
              添加费用
            </Button>
          </Space>
        </div>

        {/* 行程选择 */}
        <Select
          style={{ width: '100%', maxWidth: 400 }}
          placeholder="选择行程"
          value={selectedTripId || undefined}
          onChange={setSelectedTripId}
          loading={loading}
          size="large"
        >
          {trips.map((trip) => (
            <Option key={trip.id} value={trip.id}>
              {trip.destination} ({trip.start_date} 至 {trip.end_date})
            </Option>
          ))}
        </Select>
      </div>

      {/* 主内容区 */}
      {!selectedTripId ? (
        <Card>
          <Empty description="请选择一个行程" />
        </Card>
      ) : (
        <Spin spinning={loading}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'list',
                label: (
                  <span>
                    <UnorderedListOutlined />
                    费用列表
                  </span>
                ),
                children: (
                  <Card>
                    {expenses.length === 0 ? (
                      <Empty
                        description="暂无费用记录"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setAddModalVisible(true)}
                        >
                          添加第一笔费用
                        </Button>
                      </Empty>
                    ) : (
                      <ExpenseList
                        expenses={expenses}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    )}
                  </Card>
                ),
              },
              {
                key: 'statistics',
                label: (
                  <span>
                    <BarChartOutlined />
                    统计分析
                  </span>
                ),
                children: (
                  <ExpenseStatistics overview={overview} loading={loading} />
                ),
              },
            ]}
          />
        </Spin>
      )}

      {/* 添加/编辑费用Modal */}
      {selectedTripId && (
        <AddExpenseModal
          visible={addModalVisible}
          tripId={selectedTripId}
          expense={editingExpense}
          onSuccess={handleAddSuccess}
          onCancel={() => {
            setAddModalVisible(false);
            setEditingExpense(null);
          }}
        />
      )}
    </div>
  );
};

export default ExpenseManagement;
