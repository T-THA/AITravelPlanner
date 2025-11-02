import React, { useState } from 'react';
import { Modal, Form, Input, message, Progress } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { authService } from '../services/auth';

interface ChangePasswordModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // 计算密码强度
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    
    // 长度检查
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    
    // 包含数字
    if (/\d/.test(password)) strength += 20;
    
    // 包含小写字母
    if (/[a-z]/.test(password)) strength += 10;
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) strength += 10;
    
    // 包含特殊字符
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
    
    return Math.min(strength, 100);
  };

  // 获取密码强度颜色和文本
  const getPasswordStrengthStatus = (strength: number) => {
    if (strength < 40) return { status: 'exception' as const, text: '弱' };
    if (strength < 70) return { status: 'normal' as const, text: '中等' };
    return { status: 'success' as const, text: '强' };
  };

  // 处理新密码输入
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const values = form.getFieldsValue() as PasswordFormData;

      // 注意: Supabase Auth 的 updatePassword 不需要验证当前密码
      // 如果需要验证当前密码,需要先用当前密码尝试登录
      const { error } = await authService.updatePassword(values.newPassword);

      if (error) {
        message.error('密码修改失败: ' + error.message);
        setLoading(false);
        return;
      }

      message.success('密码修改成功!请使用新密码重新登录');
      form.resetFields();
      setPasswordStrength(0);
      
      // 延迟跳转到登录页
      setTimeout(() => {
        onSuccess();
        window.location.href = '/login';
      }, 1500);
      
    } catch (error) {
      console.error('Change password error:', error);
      message.error('密码修改失败,请稍后重试');
      setLoading(false);
    }
  };

  // 关闭 Modal 时清理状态
  const handleCancel = () => {
    form.resetFields();
    setPasswordStrength(0);
    onCancel();
  };

  const strengthStatus = getPasswordStrengthStatus(passwordStrength);

  return (
    <Modal
      title="修改密码"
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="确认修改"
      cancelText="取消"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 24 }}
      >
        {/* 当前密码 - 可选,Supabase 不需要 */}
        {/* <Form.Item
          label="当前密码"
          name="currentPassword"
          rules={[
            { required: true, message: '请输入当前密码' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入当前密码"
            size="large"
          />
        </Form.Item> */}

        {/* 新密码 */}
        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码长度至少为 8 个字符' },
            {
              pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
              message: '密码必须包含字母和数字',
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入新密码"
            size="large"
            onChange={handleNewPasswordChange}
          />
        </Form.Item>

        {/* 密码强度指示器 */}
        {passwordStrength > 0 && (
          <Form.Item>
            <div style={{ marginTop: -16 }}>
              <Progress
                percent={passwordStrength}
                status={strengthStatus.status}
                size="small"
                format={() => `强度: ${strengthStatus.text}`}
              />
            </div>
          </Form.Item>
        )}

        {/* 确认新密码 */}
        <Form.Item
          label="确认新密码"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入新密码"
            size="large"
          />
        </Form.Item>

        {/* 密码要求提示 */}
        <div style={{ fontSize: 12, color: '#999', marginTop: -8 }}>
          <div>密码要求:</div>
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            <li>长度至少 8 个字符</li>
            <li>必须包含字母和数字</li>
            <li>建议包含大小写字母和特殊字符以提高安全性</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
