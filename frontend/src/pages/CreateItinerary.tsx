import React, { useState, useEffect } from 'react';
import {
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
  HomeOutlined,
  ThunderboltOutlined,
  AudioOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { TripRequest, VoiceParsedData } from '../types';
import { tripService } from '../services/trip';
import VoiceInput from '../components/VoiceInput';
import dayjs from 'dayjs';

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

    // 获取当前表单值，用于智能合并
    const currentValues = form.getFieldsValue();

    // 自动填充表单（智能合并，避免覆盖已有值）
    const updates: any = {};

    // 目的地：如果解析出新目的地，追加或替换
    if (parsedData.destination) {
      if (currentValues.destination && currentValues.destination.length > 0) {
        // 如果已有目的地，追加新的（去重）
        const existingDestinations = new Set(currentValues.destination);
        existingDestinations.add(parsedData.destination);
        updates.destination = Array.from(existingDestinations);
      } else {
        updates.destination = [parsedData.destination];
      }
    }

    // 日期：优先使用 LLM 解析出的日期
    if (parsedData.start_date && parsedData.end_date) {
      updates.dateRange = [dayjs(parsedData.start_date), dayjs(parsedData.end_date)];
    } else if (parsedData.days && parsedData.days > 0) {
      // 如果没有解析出日期，但有天数，则根据天数计算日期范围(从明天开始)
      const startDate = dayjs().add(1, 'day');
      const endDate = startDate.add(parsedData.days - 1, 'day');
      updates.dateRange = [startDate, endDate];
    }

    // 预算：只在明确提到时更新
    if (parsedData.budget && parsedData.budget > 0) {
      updates.budget = parsedData.budget;
    }

    // 人数：只在大于1或表单为空时更新（避免用默认值1覆盖已有值）
    if (parsedData.travelers) {
      if (parsedData.travelers > 1 || !currentValues.travelersCount) {
        updates.travelersCount = parsedData.travelers;
      }
      // 如果解析出的是1，且表单已经有值（>1），则不覆盖
    }

    // 偏好：合并已有偏好，去重
    if (parsedData.preferences && parsedData.preferences.length > 0) {
      if (currentValues.preferences && currentValues.preferences.length > 0) {
        // 合并并去重
        const allPreferences = new Set([...currentValues.preferences, ...parsedData.preferences]);
        updates.preferences = Array.from(allPreferences);
      } else {
        updates.preferences = parsedData.preferences;
      }
    }

    // 特殊需求：追加到已有内容
    if (parsedData.special_needs) {
      if (currentValues.specialNeeds) {
        // 追加到已有内容，用分号分隔
        updates.specialNeeds = currentValues.specialNeeds + '; ' + parsedData.special_needs;
      } else {
        updates.specialNeeds = parsedData.special_needs;
      }
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
  const renderFormContent = () => (
    <>
      {/* 语音输入 */}
      <Card style={{ marginBottom: 24, background: '#f0f7ff' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>
            <AudioOutlined /> 语音输入 (快捷方式)
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            说出您的需求,系统将自动填充表单。例如:"我想去北京玩5天,预算1万元,喜欢历史文化和美食"
          </Text>
          <VoiceInput onParsed={handleVoiceInput} />
        </Space>
      </Card>

      {/* 基本信息 */}
      <Card title="📍 基本信息" style={{ marginBottom: 24 }}>
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
      </Card>

      {/* 预算与人员 */}
      <Card title="💰 预算与人员" style={{ marginBottom: 24 }}>
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
      </Card>

      {/* 偏好设置 */}
      <Card title="❤️ 偏好设置" style={{ marginBottom: 24 }}>
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
      </Card>
    </>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: 32 }}>
          <Title level={2}>
            <EnvironmentOutlined /> 创建行程需求
          </Title>
          <Paragraph type="secondary">
            请填写您的旅行需求,我们将为您生成个性化的行程方案
          </Paragraph>
        </div>

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
          {renderFormContent()}

          <div style={{ marginTop: 40, textAlign: 'center' }}>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              size="large"
              block
            >
              提交并生成行程
            </Button>
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

