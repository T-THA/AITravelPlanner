/**
 * 添加/编辑费用Modal组件
 * 支持手动输入和语音输入
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Space,
  Button,
} from 'antd';
import { AudioOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type {
  Expense,
  AddExpenseRequest,
  UpdateExpenseRequest,
  ExpenseCategory,
  PaymentMethod,
} from '../types';
import { expenseService } from '../services/expense';
import { dashScopeService } from '../services/dashscope';
import VoiceInput from './VoiceInput';

const { TextArea } = Input;
const { Option } = Select;

interface AddExpenseModalProps {
  visible: boolean;
  tripId: string;
  expense?: Expense | null;  // 编辑模式时传入
  onSuccess: () => void;
  onCancel: () => void;
}

// 费用类别选项
const CATEGORY_OPTIONS: Array<{ value: ExpenseCategory; label: string; icon: string }> = [
  { value: 'transportation', label: '交通', icon: '🚗' },
  { value: 'accommodation', label: '住宿', icon: '🏨' },
  { value: 'food', label: '餐饮', icon: '🍽️' },
  { value: 'ticket', label: '门票', icon: '🎫' },
  { value: 'shopping', label: '购物', icon: '🛍️' },
  { value: 'entertainment', label: '娱乐', icon: '🎮' },
  { value: 'other', label: '其他', icon: '📦' },
];

// 支付方式选项
const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: '现金' },
  { value: 'credit_card', label: '信用卡' },
  { value: 'debit_card', label: '借记卡' },
  { value: 'mobile_payment', label: '移动支付' },
  { value: 'other', label: '其他' },
];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  tripId,
  expense,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [voiceInputVisible, setVoiceInputVisible] = useState(false);
  const [parsing, setParsing] = useState(false);

  const isEditMode = !!expense;

  // 初始化表单
  useEffect(() => {
    if (visible) {
      if (isEditMode && expense) {
        form.setFieldsValue({
          category: expense.category,
          amount: expense.amount,
          description: expense.description || '',
          expense_date: dayjs(expense.expense_date),
          payment_method: expense.payment_method || undefined,
          notes: expense.notes || '',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          expense_date: dayjs(),  // 默认今天
        });
      }
    }
  }, [visible, isEditMode, expense, form]);

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const expenseData = {
        category: values.category,
        amount: values.amount,
        description: values.description,
        expense_date: (values.expense_date as Dayjs).format('YYYY-MM-DD'),
        payment_method: values.payment_method,
        notes: values.notes,
      };

      if (isEditMode && expense) {
        // 更新费用
        await expenseService.updateExpense(expense.id, expenseData as UpdateExpenseRequest);
        message.success('费用记录已更新');
      } else {
        // 添加费用
        await expenseService.addExpense({
          ...expenseData,
          trip_id: tripId,
        } as AddExpenseRequest);
        message.success('费用记录已添加');
      }

      form.resetFields();
      onSuccess();
    } catch (error: any) {
      console.error('保存费用记录失败:', error);
      message.error(error.message || '保存费用记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理语音输入结果
  const handleVoiceResult = async (text: string) => {
    console.log('语音输入结果:', text);
    setParsing(true);
    
    try {
      // 使用LLM解析语音内容为结构化数据
      const parsed = await dashScopeService.parseExpense(text);
      
      // 自动填充表单
      form.setFieldsValue({
        category: parsed.category,
        amount: parsed.amount,
        description: parsed.description,
        expense_date: dayjs(parsed.expense_date),
        payment_method: parsed.payment_method,
      });
      
      setVoiceInputVisible(false);
      message.success('语音已识别并自动填充，请确认信息');
    } catch (error: any) {
      console.error('解析失败:', error);
      // 解析失败时，将原始文本填入描述
      form.setFieldsValue({
        description: text,
      });
      message.warning(error.message || '语音解析失败，请手动填写');
    } finally {
      setParsing(false);
    }
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <span>{isEditMode ? '编辑费用记录' : '添加费用记录'}</span>
            <Button
              type="primary"
              size="small"
              icon={<AudioOutlined />}
              onClick={() => setVoiceInputVisible(true)}
              style={{ marginLeft: 'auto' }}
            >
              语音填充表单
            </Button>
          </Space>
        }
        open={visible}
        onOk={handleSubmit}
        onCancel={onCancel}
        confirmLoading={loading}
        width={600}
        okText={isEditMode ? '更新' : '添加'}
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="费用类别"
            name="category"
            rules={[{ required: true, message: '请选择费用类别' }]}
          >
            <Select
              placeholder="选择费用类别"
              size="large"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="金额 (元)"
            name="amount"
            rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={0}
              precision={2}
              placeholder="请输入金额"
              addonBefore="¥"
            />
          </Form.Item>

          <Form.Item
            label="消费日期"
            name="expense_date"
            rules={[{ required: true, message: '请选择消费日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              size="large"
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input
              size="large"
              placeholder="例如：打车去机场"
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            label="支付方式"
            name="payment_method"
          >
            <Select
              placeholder="选择支付方式（可选）"
              size="large"
              allowClear
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="备注"
            name="notes"
          >
            <TextArea
              placeholder="其他补充信息（可选）"
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 语音输入弹窗 */}
      <VoiceInput
        visible={voiceInputVisible}
        onResult={handleVoiceResult}
        onCancel={() => setVoiceInputVisible(false)}
        loading={parsing}
        placeholder="请说出您的费用信息，例如：今天打车去机场花了50元，用支付宝支付的"
      />
    </>
  );
};

export default AddExpenseModal;
