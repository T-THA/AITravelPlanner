/**
 * 费用列表组件
 * 展示费用记录，支持按日期/类别分组，编辑和删除操作
 */

import React, { useState } from 'react';
import {
  List,
  Card,
  Tag,
  Button,
  Space,
  Popconfirm,
  Empty,
  Typography,
  Divider,
  Segmented,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Expense, ExpenseCategory } from '../types';

const { Text } = Typography;

interface ExpenseListProps {
  expenses: Expense[];
  loading?: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

// 类别配置
const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  transportation: { label: '交通', icon: '🚗', color: 'blue' },
  accommodation: { label: '住宿', icon: '🏨', color: 'purple' },
  food: { label: '餐饮', icon: '🍽️', color: 'orange' },
  ticket: { label: '门票', icon: '🎫', color: 'green' },
  shopping: { label: '购物', icon: '🛍️', color: 'magenta' },
  entertainment: { label: '娱乐', icon: '🎮', color: 'cyan' },
  other: { label: '其他', icon: '📦', color: 'default' },
};

type GroupBy = 'date' | 'category' | 'none';

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  loading = false,
  onEdit,
  onDelete,
}) => {
  const [groupBy, setGroupBy] = useState<GroupBy>('date');

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  // 按日期分组
  const groupByDate = (expenses: Expense[]) => {
    const grouped = new Map<string, Expense[]>();
    expenses.forEach((expense) => {
      const date = expense.expense_date;
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(expense);
    });
    return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  };

  // 按类别分组
  const groupByCategory = (expenses: Expense[]) => {
    const grouped = new Map<ExpenseCategory, Expense[]>();
    expenses.forEach((expense) => {
      const category = expense.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(expense);
    });
    return Array.from(grouped.entries());
  };

  // 渲染单个费用项
  const renderExpenseItem = (expense: Expense) => (
    <List.Item
      key={expense.id}
      actions={[
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(expense)}
        >
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定删除这条费用记录吗？"
          onConfirm={() => onDelete(expense.id)}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>,
      ]}
    >
      <List.Item.Meta
        avatar={
          <div style={{ fontSize: 24 }}>
            {CATEGORY_CONFIG[expense.category].icon}
          </div>
        }
        title={
          <Space>
            <Text strong>{formatAmount(expense.amount)}</Text>
            <Tag color={CATEGORY_CONFIG[expense.category].color}>
              {CATEGORY_CONFIG[expense.category].label}
            </Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size={0}>
            {expense.description && <Text>{expense.description}</Text>}
            <Text type="secondary" style={{ fontSize: 12 }}>
              <CalendarOutlined /> {dayjs(expense.expense_date).format('YYYY-MM-DD')}
              {expense.payment_method && (
                <>
                  {' | '}
                  <WalletOutlined />{' '}
                  {expense.payment_method === 'cash' && '现金'}
                  {expense.payment_method === 'credit_card' && '信用卡'}
                  {expense.payment_method === 'debit_card' && '借记卡'}
                  {expense.payment_method === 'mobile_payment' && '移动支付'}
                  {expense.payment_method === 'other' && '其他'}
                </>
              )}
            </Text>
            {expense.notes && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                备注: {expense.notes}
              </Text>
            )}
          </Space>
        }
      />
    </List.Item>
  );

  // 渲染按日期分组的列表
  const renderDateGrouped = () => {
    const grouped = groupByDate(expenses);
    if (grouped.length === 0) {
      return <Empty description="暂无费用记录" />;
    }

    return grouped.map(([date, items]) => {
      const dayTotal = items.reduce((sum, item) => sum + item.amount, 0);
      return (
        <Card
          key={date}
          size="small"
          style={{ marginBottom: 16 }}
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <CalendarOutlined />
                  <Text strong>{dayjs(date).format('YYYY年MM月DD日')}</Text>
                  <Text type="secondary">
                    ({dayjs(date).format('dddd')})
                  </Text>
                </Space>
              </Col>
              <Col>
                <Text type="danger" strong>
                  {formatAmount(dayTotal)}
                </Text>
              </Col>
            </Row>
          }
        >
          <List
            dataSource={items}
            renderItem={renderExpenseItem}
            size="small"
          />
        </Card>
      );
    });
  };

  // 渲染按类别分组的列表
  const renderCategoryGrouped = () => {
    const grouped = groupByCategory(expenses);
    if (grouped.length === 0) {
      return <Empty description="暂无费用记录" />;
    }

    return grouped.map(([category, items]) => {
      const categoryTotal = items.reduce((sum, item) => sum + item.amount, 0);
      const config = CATEGORY_CONFIG[category];
      return (
        <Card
          key={category}
          size="small"
          style={{ marginBottom: 16 }}
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <span style={{ fontSize: 20 }}>{config.icon}</span>
                  <Text strong>{config.label}</Text>
                  <Tag color={config.color}>{items.length}笔</Tag>
                </Space>
              </Col>
              <Col>
                <Text type="danger" strong>
                  {formatAmount(categoryTotal)}
                </Text>
              </Col>
            </Row>
          }
        >
          <List
            dataSource={items}
            renderItem={renderExpenseItem}
            size="small"
          />
        </Card>
      );
    });
  };

  // 渲染不分组的列表
  const renderUngrouped = () => {
    if (expenses.length === 0) {
      return <Empty description="暂无费用记录" />;
    }

    return (
      <List
        dataSource={expenses}
        renderItem={renderExpenseItem}
        loading={loading}
      />
    );
  };

  return (
    <div>
      {/* 分组方式选择 */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Segmented
          value={groupBy}
          onChange={(value) => setGroupBy(value as GroupBy)}
          options={[
            { label: '按日期', value: 'date', icon: <CalendarOutlined /> },
            { label: '按类别', value: 'category', icon: <WalletOutlined /> },
            { label: '不分组', value: 'none' },
          ]}
        />
      </div>

      <Divider />

      {/* 费用列表 */}
      {loading ? (
        <List loading={loading} />
      ) : (
        <>
          {groupBy === 'date' && renderDateGrouped()}
          {groupBy === 'category' && renderCategoryGrouped()}
          {groupBy === 'none' && renderUngrouped()}
        </>
      )}
    </div>
  );
};

export default ExpenseList;
