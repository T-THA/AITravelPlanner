import React, { useState, useEffect } from 'react';
import {
  Steps,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Checkbox,
  Radio,
  Button,
  Card,
  Space,
  message,
  Typography,
  Tag,
} from 'antd';
import {
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  HeartOutlined,
  HomeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { TripRequest, VoiceParsedData } from '../types';
import { tripService } from '../services/trip';
import VoiceInput from '../components/VoiceInput';
import dayjs from 'dayjs';

const { Step } = Steps;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

// 旅行偏好选项
const PREFERENCE_OPTIONS = [
  { label: '美食', value: '美食' },
  { label: '购物', value: '购物' },
  { label: '文化', value: '文化' },
  { label: '自然', value: '自然' },
  { label: '亲子', value: '亲子' },
  { label: '摄影', value: '摄影' },
  { label: '历史', value: '历史' },
  { label: '休闲', value: '休闲' },
];

// 人员构成选项
const TRAVELERS_TYPE_OPTIONS = [
  { label: '成人', value: '成人' },
  { label: '儿童', value: '儿童' },
  { label: '老人', value: '老人' },
];

const CreateItinerary: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // 草稿自动保存
  useEffect(() => {
    const savedDraft = localStorage.getItem('itinerary_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        // 恢复日期字段
        if (draft.dateRange) {
          draft.dateRange = [dayjs(draft.dateRange[0]), dayjs(draft.dateRange[1])];
        }
        form.setFieldsValue(draft);
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [form]);

  // 保存草稿
  const saveDraft = () => {
    const values = form.getFieldsValue();
    // 转换日期为字符串
    if (values.dateRange) {
      values.dateRange = [
        values.dateRange[0]?.format('YYYY-MM-DD'),
        values.dateRange[1]?.format('YYYY-MM-DD'),
      ];
    }
    localStorage.setItem('itinerary_draft', JSON.stringify(values));
  };

  // 监听表单变化自动保存草稿
  const handleValuesChange = () => {
    saveDraft();
  };

  // 下一步
  const handleNext = async () => {
    try {
      // 根据当前步骤验证对应字段
      const fieldsToValidate = getFieldsByStep(currentStep);
      await form.validateFields(fieldsToValidate);
      setCurrentStep(currentStep + 1);
      saveDraft();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 上一步
  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // 获取每步需要验证的字段
  const getFieldsByStep = (step: number): string[] => {
    switch (step) {
      case 0:
        return ['destination', 'dateRange'];
      case 1:
        return ['budget', 'travelersCount', 'travelersType'];
      case 2:
        return ['preferences', 'accommodation', 'pace'];
      default:
        return [];
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const values = form.getFieldsValue();
      
      // 构造请求数据
      const request: TripRequest = {
        destination: values.destination,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        budget: values.budget,
        travelersCount: values.travelersCount,
        travelersType: values.travelersType,
        preferences: values.preferences,
        accommodation: values.accommodation,
        pace: values.pace,
        specialNeeds: values.specialNeeds || undefined,
      };

      console.log('Trip Request:', request);

      // 保存到数据库
      const { error } = await tripService.createTrip(request);
      
      if (error) {
        message.error('提交失败: ' + error.message);
        setLoading(false);
        return;
      }

      message.success('需求提交成功!正在生成行程...');
      
      // 清除草稿
      localStorage.removeItem('itinerary_draft');
      
      // 跳转到行程列表页
      setTimeout(() => {
        navigate('/itineraries');
      }, 1000);
      
    } catch (error) {
      console.error('Submit error:', error);
      message.error('提交失败,请检查表单');
      setLoading(false);
    }
  };

  // 语音输入处理
  const handleVoiceInput = (parsedData: VoiceParsedData) => {
    console.log('Parsed voice data:', parsedData);

    // 自动填充表单
    const updates: any = {};

    if (parsedData.destination) {
      updates.destination = [parsedData.destination];
    }

    if (parsedData.days && parsedData.days > 0) {
      // 根据天数计算日期范围(从明天开始)
      const startDate = dayjs().add(1, 'day');
      const endDate = startDate.add(parsedData.days - 1, 'day');
      updates.dateRange = [startDate, endDate];
    }

    if (parsedData.budget) {
      updates.budget = parsedData.budget;
    }

    if (parsedData.travelers) {
      updates.travelersCount = parsedData.travelers;
    }

    if (parsedData.preferences && parsedData.preferences.length > 0) {
      updates.preferences = parsedData.preferences;
    }

    if (parsedData.special_needs) {
      updates.specialNeeds = parsedData.special_needs;
    }

    // 更新表单
    form.setFieldsValue(updates);
    
    // 保存草稿
    saveDraft();

    message.success(
      `已自动填充 ${Object.keys(updates).length} 个字段 (置信度: ${(parsedData.confidence * 100).toFixed(0)}%)`
    );
  };

  // 步骤内容
  const steps = [
    {
      title: '基本信息',
      icon: <EnvironmentOutlined />,
      content: (
        <>
          <Form.Item
            label="目的地"
            name="destination"
            rules={[
              { required: true, message: '请选择目的地' },
              { type: 'array', min: 1, message: '至少选择一个目的地' },
            ]}
          >
            <Select
              mode="tags"
              placeholder="请输入目的地城市 (支持多个)"
              size="large"
              suffixIcon={<EnvironmentOutlined />}
              options={[
                { label: '北京', value: '北京' },
                { label: '上海', value: '上海' },
                { label: '广州', value: '广州' },
                { label: '深圳', value: '深圳' },
                { label: '成都', value: '成都' },
                { label: '西安', value: '西安' },
                { label: '杭州', value: '杭州' },
                { label: '重庆', value: '重庆' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="出行日期"
            name="dateRange"
            rules={[{ required: true, message: '请选择出行日期' }]}
          >
            <RangePicker
              size="large"
              style={{ width: '100%' }}
              placeholder={['出发日期', '返程日期']}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item label="语音输入" help="通过语音快速填写需求">
            <VoiceInput onParsed={handleVoiceInput} />
          </Form.Item>
        </>
      ),
    },
    {
      title: '预算与人员',
      icon: <TeamOutlined />,
      content: (
        <>
          <Form.Item
            label="预算金额"
            name="budget"
            rules={[
              { required: true, message: '请输入预算金额' },
              { type: 'number', min: 100, message: '预算至少100元' },
            ]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="请输入预算金额 (元)"
              prefix={<DollarOutlined />}
              formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/¥\s?|(,*)/g, '') as any}
            />
          </Form.Item>

          <Form.Item
            label="同行人数"
            name="travelersCount"
            rules={[
              { required: true, message: '请输入同行人数' },
              { type: 'number', min: 1, message: '至少1人' },
            ]}
          >
            <InputNumber
              size="large"
              style={{ width: '100%' }}
              placeholder="请输入同行人数"
              min={1}
              max={99}
            />
          </Form.Item>

          <Form.Item
            label="人员构成"
            name="travelersType"
            rules={[
              { required: true, message: '请选择人员构成' },
              { type: 'array', min: 1, message: '至少选择一项' },
            ]}
          >
            <Checkbox.Group options={TRAVELERS_TYPE_OPTIONS} />
          </Form.Item>
        </>
      ),
    },
    {
      title: '偏好设置',
      icon: <HeartOutlined />,
      content: (
        <>
          <Form.Item
            label="旅行偏好"
            name="preferences"
            rules={[
              { required: true, message: '请选择旅行偏好' },
              { type: 'array', min: 1, message: '至少选择一项' },
            ]}
          >
            <Checkbox.Group options={PREFERENCE_OPTIONS} />
          </Form.Item>

          <Form.Item
            label="住宿偏好"
            name="accommodation"
            rules={[{ required: true, message: '请选择住宿偏好' }]}
          >
            <Radio.Group size="large">
              <Radio.Button value="经济型">
                <HomeOutlined /> 经济型
              </Radio.Button>
              <Radio.Button value="舒适型">
                <HomeOutlined /> 舒适型
              </Radio.Button>
              <Radio.Button value="豪华型">
                <HomeOutlined /> 豪华型
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="行程节奏"
            name="pace"
            rules={[{ required: true, message: '请选择行程节奏' }]}
          >
            <Radio.Group size="large">
              <Radio.Button value="休闲">
                <ThunderboltOutlined /> 休闲
              </Radio.Button>
              <Radio.Button value="适中">
                <ThunderboltOutlined /> 适中
              </Radio.Button>
              <Radio.Button value="紧凑">
                <ThunderboltOutlined /> 紧凑
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="特殊需求" name="specialNeeds">
            <TextArea
              rows={4}
              placeholder="请输入其他特殊需求 (可选)"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: 32 }}>
          <Title level={2}>
            <EnvironmentOutlined /> 创建行程需求
          </Title>
          <Paragraph type="secondary">
            请填写您的旅行需求,我们将为您生成个性化的行程方案
          </Paragraph>
        </div>

        <Steps current={currentStep} style={{ marginBottom: 40 }}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          initialValues={{
            travelersCount: 1,
            travelersType: ['成人'],
            preferences: [],
            accommodation: '舒适型',
            pace: '适中',
          }}
        >
          <div style={{ minHeight: 400 }}>{steps[currentStep].content}</div>

          <div style={{ marginTop: 40, textAlign: 'right' }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrev} size="large">
                  上一步
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={handleNext} size="large">
                  下一步
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={loading}
                  size="large"
                >
                  提交并生成行程
                </Button>
              )}
            </Space>
          </div>
        </Form>

        {/* 草稿提示 */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            <Tag color="blue">提示</Tag>
            您的输入会自动保存为草稿
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default CreateItinerary;

