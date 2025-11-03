import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Tag, Alert, List, Typography, Divider, Space, Progress } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  BulbOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { BudgetAnalysis as BudgetAnalysisType } from '../types';

const { Text, Paragraph } = Typography;

interface BudgetAnalysisProps {
  analysis: BudgetAnalysisType;
}

const BudgetAnalysis: React.FC<BudgetAnalysisProps> = ({ analysis }) => {
  // 状态图标和颜色
  const statusConfig = useMemo(() => {
    switch (analysis.budget_status) {
      case 'within':
        return {
          icon: <CheckCircleOutlined />,
          color: 'success',
          text: '预算充足',
          tagColor: 'green',
        };
      case 'close':
        return {
          icon: <WarningOutlined />,
          color: 'warning',
          text: '接近预算',
          tagColor: 'orange',
        };
      case 'exceed':
        return {
          icon: <CloseCircleOutlined />,
          color: 'error',
          text: '预算超支',
          tagColor: 'red',
        };
      default:
        return {
          icon: <CheckCircleOutlined />,
          color: 'default',
          text: '未知',
          tagColor: 'default',
        };
    }
  }, [analysis.budget_status]);

  // 饼图配置
  const pieChartOption = useMemo(() => {
    const data = [
      { value: analysis.breakdown_analysis.transportation.budgeted, name: '交通' },
      { value: analysis.breakdown_analysis.accommodation.budgeted, name: '住宿' },
      { value: analysis.breakdown_analysis.food.budgeted, name: '餐饮' },
      { value: analysis.breakdown_analysis.tickets.budgeted, name: '门票' },
      { value: analysis.breakdown_analysis.shopping.budgeted, name: '购物' },
      { value: analysis.breakdown_analysis.other.budgeted, name: '其他' },
    ];

    return {
      title: {
        text: '预算分配占比',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'middle',
      },
      series: [
        {
          name: '预算分配',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: false,
          },
          data: data,
          color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'],
        },
      ],
    };
  }, [analysis.breakdown_analysis]);

  // 柱状图配置
  const barChartOption = useMemo(() => {
    const categories = ['交通', '住宿', '餐饮', '门票', '购物', '其他'];
    const values = [
      analysis.breakdown_analysis.transportation.budgeted,
      analysis.breakdown_analysis.accommodation.budgeted,
      analysis.breakdown_analysis.food.budgeted,
      analysis.breakdown_analysis.tickets.budgeted,
      analysis.breakdown_analysis.shopping.budgeted,
      analysis.breakdown_analysis.other.budgeted,
    ];

    return {
      title: {
        text: '各类别预算分布',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: '{b}: ¥{c}',
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          interval: 0,
          rotate: 0,
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
          name: '预算',
          type: 'bar',
          data: values,
          itemStyle: {
            color: function (params: any) {
              const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
              return colors[params.dataIndex];
            },
            borderRadius: [8, 8, 0, 0],
          },
          label: {
            show: true,
            position: 'top',
            formatter: '¥{c}',
          },
        },
      ],
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '20%',
      },
    };
  }, [analysis.breakdown_analysis]);

  // 类别分析状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reasonable':
        return 'success';
      case 'high':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 总体状态卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="用户预算"
              value={analysis.total_budget}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="预计费用"
              value={analysis.estimated_total}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={analysis.difference >= 0 ? '剩余预算' : '超支金额'}
              value={Math.abs(analysis.difference)}
              prefix={analysis.difference >= 0 ? '¥' : '-¥'}
              valueStyle={{ color: analysis.difference >= 0 ? '#52c41a' : '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">预算状态</Text>
              <Tag icon={statusConfig.icon} color={statusConfig.tagColor} style={{ fontSize: '16px', padding: '8px 16px' }}>
                {statusConfig.text}
              </Tag>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {analysis.difference >= 0 ? '+' : ''}{analysis.difference_percentage}%
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 警告信息 */}
      {analysis.warnings && analysis.warnings.length > 0 && (
        <Alert
          message="预算提醒"
          description={
            <List
              size="small"
              dataSource={analysis.warnings}
              renderItem={(item) => (
                <List.Item>
                  <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                  {item}
                </List.Item>
              )}
            />
          }
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 总体分析 */}
      <Card title="总体分析" style={{ marginTop: 16 }} extra={<PieChartOutlined />}>
        <Paragraph>{analysis.summary}</Paragraph>
      </Card>

      {/* 图表展示 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={pieChartOption} style={{ height: '400px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={barChartOption} style={{ height: '400px' }} />
          </Card>
        </Col>
      </Row>

      {/* 详细分类分析 */}
      <Card title="分类分析" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          {Object.entries(analysis.breakdown_analysis).map(([category, data]) => {
            const categoryNames: Record<string, string> = {
              transportation: '交通',
              accommodation: '住宿',
              food: '餐饮',
              tickets: '门票',
              shopping: '购物',
              other: '其他',
            };

            return (
              <Col xs={24} md={12} key={category}>
                <Card size="small" title={categoryNames[category]} extra={<Tag color={getStatusColor(data.status)}>{data.status}</Tag>}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>预算金额: </Text>
                      <Text>¥{data.budgeted}</Text>
                    </div>
                    <div>
                      <Text strong>占比: </Text>
                      <Text>{data.percentage.toFixed(1)}%</Text>
                      <Progress
                        percent={parseFloat(data.percentage.toFixed(1))}
                        size="small"
                        strokeColor={
                          data.status === 'reasonable' ? '#52c41a' : data.status === 'high' ? '#faad14' : '#1890ff'
                        }
                        style={{ marginTop: 8 }}
                      />
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div>
                      <Text type="secondary">{data.comment}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* 节省建议 */}
      {analysis.saving_suggestions && analysis.saving_suggestions.length > 0 && (
        <Card
          title={
            <Space>
              <BulbOutlined style={{ color: '#faad14' }} />
              <span>节省建议</span>
            </Space>
          }
          style={{ marginTop: 16 }}
        >
          <List
            dataSource={analysis.saving_suggestions}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'blue'}>
                      {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                    </Tag>
                  }
                  title={<Text strong>{item.category}</Text>}
                  description={item.suggestion}
                />
                <div>
                  <Text type="success" strong>
                    可节省 ¥{item.potential_saving}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default BudgetAnalysis;
