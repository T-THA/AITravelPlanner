import React, { useState, useEffect } from 'react';
import { Modal, Form, Checkbox, Radio, message, Tag, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/authStore';

interface PreferencesModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// 预定义选项
const travelStyleOptions = [
  { label: '文化探索', value: '文化探索' },
  { label: '自然风光', value: '自然风光' },
  { label: '美食之旅', value: '美食之旅' },
  { label: '冒险刺激', value: '冒险刺激' },
  { label: '休闲度假', value: '休闲度假' },
  { label: '摄影采风', value: '摄影采风' },
  { label: '购物血拼', value: '购物血拼' },
  { label: '城市漫步', value: '城市漫步' },
];

const budgetOptions = [
  { label: '经济型 (¥500以下/天)', value: 'budget' },
  { label: '舒适型 (¥500-1000/天)', value: 'comfortable' },
  { label: '豪华型 (¥1000以上/天)', value: 'luxury' },
];

const transportOptions = [
  { label: '飞机', value: '飞机' },
  { label: '高铁', value: '高铁' },
  { label: '普通火车', value: '普通火车' },
  { label: '大巴', value: '大巴' },
  { label: '自驾', value: '自驾' },
  { label: '公共交通', value: '公共交通' },
];

const accommodationOptions = [
  { label: '经济型酒店', value: '经济型酒店' },
  { label: '星级酒店', value: '星级酒店' },
  { label: '民宿/客栈', value: '民宿/客栈' },
  { label: '青年旅舍', value: '青年旅舍' },
  { label: '度假村', value: '度假村' },
  { label: '特色酒店', value: '特色酒店' },
];

const PreferencesModal: React.FC<PreferencesModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customDestinations, setCustomDestinations] = useState<string[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);

  // 初始化表单数据
  useEffect(() => {
    if (open && profile?.preferences) {
      const prefs = profile.preferences;
      form.setFieldsValue({
        favorite_destinations: prefs.favorite_destinations || [],
        travel_style: prefs.travel_style || [],
        budget_preference: prefs.budget_preference || 'comfortable',
        transport_preference: prefs.transport_preference || [],
        accommodation_preference: prefs.accommodation_preference || [],
      });
      setCustomDestinations(prefs.favorite_destinations || []);
    }
  }, [open, profile, form]);

  // 添加自定义目的地
  const handleAddDestination = () => {
    if (inputValue && !customDestinations.includes(inputValue)) {
      const newDestinations = [...customDestinations, inputValue];
      setCustomDestinations(newDestinations);
      form.setFieldsValue({ favorite_destinations: newDestinations });
      setInputValue('');
      setInputVisible(false);
    }
  };

  // 删除目的地
  const handleRemoveDestination = (removed: string) => {
    const newDestinations = customDestinations.filter(dest => dest !== removed);
    setCustomDestinations(newDestinations);
    form.setFieldsValue({ favorite_destinations: newDestinations });
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const values = form.getFieldsValue();
      
      // 构建 preferences 对象
      const preferences = {
        favorite_destinations: values.favorite_destinations || [],
        travel_style: values.travel_style || [],
        budget_preference: values.budget_preference || 'comfortable',
        transport_preference: values.transport_preference || [],
        accommodation_preference: values.accommodation_preference || [],
      };

      // 更新用户偏好
      const { error } = await authService.updateUserProfile(user!.id, {
        preferences,
      });

      if (error) {
        message.error('保存失败: ' + error.message);
        setLoading(false);
        return;
      }

      message.success('偏好设置已保存!');
      onSuccess();
      
    } catch (error) {
      console.error('Update preferences error:', error);
      message.error('保存失败,请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 关闭 Modal 时清理状态
  const handleCancel = () => {
    form.resetFields();
    setInputVisible(false);
    setInputValue('');
    onCancel();
  };

  return (
    <Modal
      title="旅行偏好设置"
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 24 }}
      >
        {/* 喜欢的目的地 */}
        <Form.Item
          label="喜欢的目的地"
          name="favorite_destinations"
          tooltip="设置您偏好的旅行目的地,系统将优先推荐这些地方"
        >
          <div>
            {customDestinations.map(dest => (
              <Tag
                key={dest}
                closable
                onClose={() => handleRemoveDestination(dest)}
                style={{ marginBottom: 8 }}
              >
                {dest}
              </Tag>
            ))}
            {inputVisible ? (
              <Input
                type="text"
                size="small"
                style={{ width: 120 }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleAddDestination}
                onPressEnter={handleAddDestination}
                placeholder="输入目的地"
                autoFocus
              />
            ) : (
              <Tag
                onClick={() => setInputVisible(true)}
                style={{ cursor: 'pointer', borderStyle: 'dashed' }}
              >
                <PlusOutlined /> 添加目的地
              </Tag>
            )}
          </div>
        </Form.Item>

        {/* 旅行风格 */}
        <Form.Item
          label="旅行风格"
          name="travel_style"
          tooltip="可以多选,系统会根据您的风格偏好推荐行程"
        >
          <Checkbox.Group options={travelStyleOptions} />
        </Form.Item>

        {/* 预算偏好 */}
        <Form.Item
          label="预算偏好"
          name="budget_preference"
          tooltip="选择您的日均预算范围"
        >
          <Radio.Group options={budgetOptions} />
        </Form.Item>

        {/* 交通偏好 */}
        <Form.Item
          label="交通偏好"
          name="transport_preference"
          tooltip="可以多选,系统会优先推荐您偏好的交通方式"
        >
          <Checkbox.Group options={transportOptions} />
        </Form.Item>

        {/* 住宿偏好 */}
        <Form.Item
          label="住宿偏好"
          name="accommodation_preference"
          tooltip="可以多选,系统会根据您的偏好推荐住宿"
        >
          <Checkbox.Group options={accommodationOptions} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PreferencesModal;
