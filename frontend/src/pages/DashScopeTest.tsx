import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  Tag,
  Input,
  InputNumber,
  Select,
  message,
  Spin,
} from 'antd';
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RocketOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { dashScopeService, QwenModel } from '../services/dashscope';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const DashScopeTest: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [itineraryParams, setItineraryParams] = useState({
    destination: '北京',
    days: 5,
    budget: 10000,
    travelers: 2,
    preferences: ['历史文化', '美食', '摄影'],
  });
  const [itineraryResult, setItineraryResult] = useState<any>(null);

  const [budgetAnalyzing, setBudgetAnalyzing] = useState(false);
  const [budgetResult, setBudgetResult] = useState<any>(null);

  // 检查 API 配置
  const isConfigured = dashScopeService.isConfigured();

  // 测试连接
  const handleTestConnection = async () => {
    setIsConnecting(true);
    setConnectionResult(null);

    try {
      const result = await dashScopeService.testConnection();
      setConnectionResult(result);
      
      if (result.success) {
        message.success('连接成功！');
      } else {
        message.error('连接失败');
      }
    } catch (error: any) {
      setConnectionResult({
        success: false,
        message: error.message || '连接失败',
      });
      message.error('连接失败');
    } finally {
      setIsConnecting(false);
    }
  };

  // 测试行程生成
  const handleGenerateItinerary = async () => {
    setIsGenerating(true);
    setItineraryResult(null);

    try {
      const result = await dashScopeService.generateItinerary(itineraryParams);
      setItineraryResult(result);
      message.success('行程生成成功！');
    } catch (error: any) {
      console.error('行程生成失败:', error);
      message.error(error.message || '行程生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 测试预算分析
  const handleAnalyzeBudget = async () => {
    setBudgetAnalyzing(true);
    setBudgetResult(null);

    try {
      const result = await dashScopeService.analyzeBudget({
        destination: '北京',
        days: 5,
        currentBudget: 10000,
        expenses: [
          { category: '交通', amount: 2000 },
          { category: '住宿', amount: 2500 },
          { category: '餐饮', amount: 3000 },
          { category: '景点', amount: 1500 },
          { category: '购物', amount: 800 },
        ],
      });
      setBudgetResult(result);
      message.success('预算分析完成！');
    } catch (error: any) {
      console.error('预算分析失败:', error);
      message.error(error.message || '预算分析失败');
    } finally {
      setBudgetAnalyzing(false);
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={2}>
                <ApiOutlined /> 阿里云百炼平台 API 测试
              </Title>
              <Text type="secondary">
                Task 1.5: 测试通义千问模型的行程规划和预算分析功能
              </Text>
            </div>

            <Divider />

            {/* 环境检查 */}
            <Card type="inner" title="环境检查">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>API 配置:</Text>
                  {isConfigured ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                      已配置
                    </Tag>
                  ) : (
                    <Tag icon={<CloseCircleOutlined />} color="error">
                      未配置
                    </Tag>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>默认模型:</Text>
                  <Tag color="blue">{QwenModel.PLUS}</Tag>
                </div>
                {connectionResult && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>连接状态:</Text>
                    {connectionResult.success ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        {connectionResult.message}
                      </Tag>
                    ) : (
                      <Tag icon={<CloseCircleOutlined />} color="error">
                        {connectionResult.message}
                      </Tag>
                    )}
                  </div>
                )}
              </Space>
            </Card>

            {!isConfigured && (
              <Alert
                message="API 未配置"
                description={
                  <>
                    <p>请在 .env 文件中配置阿里云百炼 API 密钥：</p>
                    <code>VITE_DASHSCOPE_API_KEY=sk-your-api-key</code>
                    <p style={{ marginTop: '8px' }}>
                      获取方式：访问{' '}
                      <a
                        href="https://dashscope.console.aliyun.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        阿里云百炼控制台
                      </a>{' '}
                      → API-KEY 管理 → 创建新密钥
                    </p>
                  </>
                }
                type="warning"
                showIcon
              />
            )}

            {/* 测试1: 连接测试 */}
            <Card type="inner" title="1. 连接测试">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph>
                  测试 API Key 是否有效，以及与阿里云百炼服务的连接是否正常。
                </Paragraph>
                <Button
                  type="primary"
                  icon={<ApiOutlined />}
                  onClick={handleTestConnection}
                  loading={isConnecting}
                  disabled={!isConfigured}
                >
                  {isConnecting ? '测试中...' : '测试连接'}
                </Button>
              </Space>
            </Card>

            {/* 测试2: 行程生成 */}
            <Card type="inner" title="2. AI 行程生成测试">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Paragraph>
                  测试通义千问生成旅行行程的能力，包括景点推荐、餐饮建议、预算分配等。
                </Paragraph>

                <Space wrap>
                  <div>
                    <Text>目的地：</Text>
                    <Input
                      style={{ width: 120 }}
                      value={itineraryParams.destination}
                      onChange={(e) =>
                        setItineraryParams({ ...itineraryParams, destination: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Text>天数：</Text>
                    <InputNumber
                      min={1}
                      max={30}
                      value={itineraryParams.days}
                      onChange={(value) =>
                        setItineraryParams({ ...itineraryParams, days: value || 5 })
                      }
                    />
                  </div>
                  <div>
                    <Text>预算（元）：</Text>
                    <InputNumber
                      min={1000}
                      max={100000}
                      step={1000}
                      value={itineraryParams.budget}
                      onChange={(value) =>
                        setItineraryParams({ ...itineraryParams, budget: value || 10000 })
                      }
                    />
                  </div>
                  <div>
                    <Text>人数：</Text>
                    <InputNumber
                      min={1}
                      max={10}
                      value={itineraryParams.travelers}
                      onChange={(value) =>
                        setItineraryParams({ ...itineraryParams, travelers: value || 2 })
                      }
                    />
                  </div>
                </Space>

                <div>
                  <Text>旅行偏好：</Text>
                  <Select
                    mode="multiple"
                    style={{ width: '100%', marginTop: 8 }}
                    value={itineraryParams.preferences}
                    onChange={(value) =>
                      setItineraryParams({ ...itineraryParams, preferences: value })
                    }
                    options={[
                      { label: '历史文化', value: '历史文化' },
                      { label: '自然风光', value: '自然风光' },
                      { label: '美食', value: '美食' },
                      { label: '摄影', value: '摄影' },
                      { label: '购物', value: '购物' },
                      { label: '亲子', value: '亲子' },
                      { label: '休闲放松', value: '休闲放松' },
                    ]}
                  />
                </div>

                <Button
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={handleGenerateItinerary}
                  loading={isGenerating}
                  disabled={!isConfigured}
                >
                  {isGenerating ? '生成中...' : '生成行程'}
                </Button>

                {isGenerating && (
                  <Alert
                    message="正在生成行程..."
                    description="使用 AI 生成详细行程需要 20-40 秒，请耐心等待"
                    type="info"
                    showIcon
                    icon={<Spin />}
                  />
                )}

                {itineraryResult && (
                  <Card type="inner" title="生成结果">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>行程标题：</Text>
                        <Text>{itineraryResult.trip_title}</Text>
                      </div>
                      <div>
                        <Text strong>行程简介：</Text>
                        <Text>{itineraryResult.summary}</Text>
                      </div>
                      <div>
                        <Text strong>行程天数：</Text>
                        <Tag color="blue">{itineraryResult.total_days}天</Tag>
                      </div>
                      {itineraryResult.budget_breakdown && (
                        <div>
                          <Text strong>预算分配：</Text>
                          <div style={{ marginTop: 8 }}>
                            {Object.entries(itineraryResult.budget_breakdown).map(
                              ([key, value]: [string, any]) => (
                                <div key={key}>
                                  <Text>
                                    {key === 'transportation'
                                      ? '交通'
                                      : key === 'accommodation'
                                      ? '住宿'
                                      : key === 'food'
                                      ? '餐饮'
                                      : key === 'attractions'
                                      ? '景点'
                                      : key === 'shopping'
                                      ? '购物'
                                      : key === 'total'
                                      ? '总计'
                                      : key}
                                    ：¥{value}
                                  </Text>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                      <Divider />
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                          查看完整 JSON 数据
                        </summary>
                        <TextArea
                          value={JSON.stringify(itineraryResult, null, 2)}
                          rows={15}
                          readOnly
                          style={{ marginTop: 8, fontFamily: 'monospace' }}
                        />
                      </details>
                    </Space>
                  </Card>
                )}
              </Space>
            </Card>

            {/* 测试3: 预算分析 */}
            <Card type="inner" title="3. AI 预算分析测试">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Paragraph>
                  测试通义千问分析旅行预算的能力，提供预算建议和节省方案。
                </Paragraph>

                <Alert
                  message="测试场景"
                  description="北京5日游，总预算10000元，已支出9800元（包含交通、住宿、餐饮、景点、购物）"
                  type="info"
                  showIcon
                />

                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={handleAnalyzeBudget}
                  loading={budgetAnalyzing}
                  disabled={!isConfigured}
                >
                  {budgetAnalyzing ? '分析中...' : '分析预算'}
                </Button>

                {budgetAnalyzing && (
                  <Alert
                    message="正在分析预算..."
                    description="AI 正在分析您的预算使用情况，请稍候"
                    type="info"
                    showIcon
                    icon={<Spin />}
                  />
                )}

                {budgetResult && (
                  <Card type="inner" title="分析结果">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>状态：</Text>
                        <Tag
                          color={
                            budgetResult.status === '正常'
                              ? 'success'
                              : budgetResult.status === '警告'
                              ? 'warning'
                              : 'error'
                          }
                        >
                          {budgetResult.status}
                        </Tag>
                      </div>
                      <div>
                        <Text strong>整体分析：</Text>
                        <Paragraph>{budgetResult.analysis}</Paragraph>
                      </div>
                      {budgetResult.suggestions && budgetResult.suggestions.length > 0 && (
                        <div>
                          <Text strong>建议：</Text>
                          <ul>
                            {budgetResult.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Divider />
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                          查看完整 JSON 数据
                        </summary>
                        <TextArea
                          value={JSON.stringify(budgetResult, null, 2)}
                          rows={15}
                          readOnly
                          style={{ marginTop: 8, fontFamily: 'monospace' }}
                        />
                      </details>
                    </Space>
                  </Card>
                )}
              </Space>
            </Card>

            {/* 使用说明 */}
            <Card type="inner" title="测试说明">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>测试步骤：</Text>
                <ol>
                  <li>确保已在 .env 文件中配置 VITE_DASHSCOPE_API_KEY</li>
                  <li>点击"测试连接"验证 API Key 是否有效</li>
                  <li>点击"生成行程"测试 AI 行程规划功能（约20-40秒）</li>
                  <li>点击"分析预算"测试 AI 预算分析功能</li>
                  <li>查看生成结果，检查数据完整性和合理性</li>
                </ol>

                <Divider />

                <Text strong>验收标准：</Text>
                <ul>
                  <li>✅ API 调用成功，响应时间 &lt; 40 秒</li>
                  <li>✅ 返回 JSON 格式可正常解析</li>
                  <li>✅ 行程内容完整（包含所有必需字段）</li>
                  <li>✅ 预算分析合理（误差 &lt; 20%）</li>
                  <li>✅ 测试 5 个不同目的地，成功率 100%</li>
                </ul>

                <Divider />

                <Text strong>技术实现：</Text>
                <ul>
                  <li>API 端点: https://dashscope.aliyuncs.com/api/v1</li>
                  <li>默认模型: qwen-plus（平衡性能和成本）</li>
                  <li>Temperature: 0.7（控制输出随机性）</li>
                  <li>Max Tokens: 2000（限制输出长度）</li>
                  <li>超时时间: 60秒</li>
                </ul>
              </Space>
            </Card>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default DashScopeTest;
