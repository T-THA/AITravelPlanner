/**
 * 费用统计组件
 * 使用ECharts展示费用统计图表
 */

import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Empty } from 'antd';
import {
  WalletOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { ExpenseOverview, ExpenseCategory } from '../types';

interface ExpenseStatisticsProps {
  overview: ExpenseOverview | null;
  loading?: boolean;
}

// 类别配置
const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; color: string }> = {
  transportation: { label: '交通', color: '#1890ff' },
  accommodation: { label: '住宿', color: '#722ed1' },
  food: { label: '餐饮', color: '#fa8c16' },
  ticket: { label: '门票', color: '#52c41a' },
  shopping: { label: '购物', color: '#eb2f96' },
  entertainment: { label: '娱乐', color: '#13c2c2' },
  other: { label: '其他', color: '#8c8c8c' },
};

const ExpenseStatistics: React.FC<ExpenseStatisticsProps> = ({
  overview,
  loading = false,
}) => {
  // 饼图配置
  const pieChartOption = useMemo(() => {
    if (!overview || overview.by_category.length === 0) return null;

    return {
      title: {
        text: '费用分类占比',
        left: 'center',
        top: 10,
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
      },
      series: [
        {
          name: '费用',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n¥{c}',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          data: overview.by_category.map((item) => ({
            name: CATEGORY_CONFIG[item.category].label,
            value: item.total_amount,
            itemStyle: {
              color: CATEGORY_CONFIG[item.category].color,
            },
          })),
        },
      ],
    };
  }, [overview]);

  // 柱状图配置（按日期）
  const barChartOption = useMemo(() => {
    if (!overview || overview.by_date.length === 0) return null;

    return {
      title: {
        text: '每日费用趋势',
        left: 'center',
        top: 10,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>总计: ¥${data.value}`;
        },
      },
      xAxis: {
        type: 'category',
        data: overview.by_date.map((item) => item.date.slice(5)), // MM-DD
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '金额(元)',
        axisLabel: {
          formatter: '¥{value}',
        },
      },
      series: [
        {
          name: '费用',
          type: 'bar',
          data: overview.by_date.map((item) => item.total_amount),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#fa541c' },
                { offset: 1, color: '#ff7a45' },
              ],
            },
            borderRadius: [5, 5, 0, 0],
          },
          label: {
            show: true,
            position: 'top',
            formatter: '¥{c}',
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
    };
  }, [overview]);

  if (!overview) {
    return (
      <Card loading={loading}>
        <Empty description="暂无统计数据" />
      </Card>
    );
  }

  const budgetUsedPercent = overview.percentage_used;
  const isOverBudget = overview.total_amount > overview.budget;

  return (
    <div style={{ width: '100%' }}>
      {/* 概览统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总预算"
              value={overview.budget}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已花费"
              value={overview.total_amount}
              precision={2}
              valueStyle={{ color: isOverBudget ? '#cf1322' : '#faad14' }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={isOverBudget ? '超支' : '剩余'}
              value={Math.abs(overview.remaining)}
              precision={2}
              valueStyle={{ color: isOverBudget ? '#cf1322' : '#52c41a' }}
              prefix={isOverBudget ? <RiseOutlined /> : <FallOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="预算使用率"
              value={budgetUsedPercent}
              precision={1}
              suffix="%"
              valueStyle={{
                color:
                  budgetUsedPercent > 100
                    ? '#cf1322'
                    : budgetUsedPercent > 80
                    ? '#faad14'
                    : '#52c41a',
              }}
            />
            <Progress
              percent={Math.min(budgetUsedPercent, 100)}
              status={
                budgetUsedPercent > 100
                  ? 'exception'
                  : budgetUsedPercent > 80
                  ? 'active'
                  : 'normal'
              }
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={[16, 16]}>
        {/* 饼图 */}
        {pieChartOption && (
          <Col xs={24} lg={12}>
            <Card>
              <ReactECharts
                option={pieChartOption}
                style={{ height: 400 }}
                notMerge={true}
                lazyUpdate={true}
              />
            </Card>
          </Col>
        )}

        {/* 柱状图 */}
        {barChartOption && (
          <Col xs={24} lg={12}>
            <Card>
              <ReactECharts
                option={barChartOption}
                style={{ height: 400 }}
                notMerge={true}
                lazyUpdate={true}
              />
            </Card>
          </Col>
        )}
      </Row>

      {/* 类别详细统计 */}
      {overview.by_category.length > 0 && (
        <Card title="分类详情" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            {overview.by_category.map((item) => {
              const config = CATEGORY_CONFIG[item.category];
              const percent = (item.total_amount / overview.total_amount) * 100;
              return (
                <Col xs={24} sm={12} lg={8} key={item.category}>
                  <Card size="small">
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                        {config.label}
                      </span>
                      <span style={{ float: 'right', color: config.color, fontWeight: 'bold' }}>
                        ¥{item.total_amount.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      percent={Number(percent.toFixed(1))}
                      strokeColor={config.color}
                      size="small"
                    />
                    <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
                      共{item.count}笔 · 占比{item.percentage.toFixed(1)}%
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default ExpenseStatistics;
