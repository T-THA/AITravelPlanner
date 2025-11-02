import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { LockOutlined, MailOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState<string>('');
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  // 如果已登录，直接跳转到仪表板
  useEffect(() => {
    // 等待初始化完成
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onFinish = async (values: { email: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      setErrorMessage('两次输入的密码不一致！请重新输入。');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setWarningMessage('');
    
    try {
      const { data, error } = await authService.signUp(values.email, values.password);
      
      console.log('Sign up response:', { data, error });
      
      if (error) {
        console.error('Sign up error:', error);
        if (error.message.includes('already') || 
            error.message.includes('registered') ||
            error.message.includes('User already registered') ||
            error.status === 422 ||
            error.message.includes('duplicate')) {
          setErrorMessage('该邮箱已被注册！请直接登录或使用其他邮箱。');
        } else {
          setErrorMessage(error.message || '注册失败，请稍后重试');
        }
        setLoading(false);
        return;
      }
      
      // Supabase 在某些配置下，即使邮箱已存在也会返回成功
      // 检查是否真的创建了新用户
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        // 邮箱已存在（Supabase 的特殊行为）
        setWarningMessage('该邮箱可能已被注册。如果您已有账号，请直接登录。');
        setLoading(false);
      } else if (data.user) {
        // 成功注册新用户
        setSuccessMessage('注册成功！请检查您的邮箱以验证账号。正在跳转到登录页...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // 未知情况
        setSuccessMessage('注册请求已提交。如果您是新用户，请检查邮箱验证链接。');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      console.error('Register exception:', error);
      setErrorMessage(error?.message || '注册过程中发生错误');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: 450, 
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)', 
        borderRadius: '12px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>创建账号</Title>
          <Text type="secondary">开启您的智能旅行规划之旅</Text>
        </div>

        {/* 错误提示 */}
        {errorMessage && (
          <Alert
            message="注册错误"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage('')}
            style={{ marginBottom: 24 }}
            icon={<CloseCircleOutlined />}
          />
        )}

        {/* 警告提示 */}
        {warningMessage && (
          <Alert
            message="提示"
            description={warningMessage}
            type="warning"
            showIcon
            closable
            onClose={() => setWarningMessage('')}
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 成功提示 */}
        {successMessage && (
          <Alert
            message="注册成功"
            description={successMessage}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        
        <Form name="register" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入您的邮箱！' },
              { type: 'email', message: '请输入有效的邮箱地址！' },
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="邮箱" 
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入您的密码！' },
              { min: 6, message: '密码长度至少为6位！' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: '密码必须包含大小写字母和数字！',
              },
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码（至少6位，包含大小写字母和数字）" 
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请确认您的密码！' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致！'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="确认密码" 
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              style={{ height: '44px', fontSize: '16px', fontWeight: 500 }}
            >
              注册
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text>
              已有账号？{' '}
              <a href="/login" style={{ color: '#667eea', fontWeight: 500 }}>
                立即登录
              </a>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
