import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Checkbox, Alert } from 'antd';
import { UserOutlined, LockOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, isAuthenticated, isLoading } = useAuthStore();

  // 如果已登录，直接跳转到仪表板
  useEffect(() => {
    // 等待初始化完成
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const onFinish = async (values: { email: string; password: string; remember?: boolean }) => {
    setLoading(true);
    setErrorMessage(''); // 清除之前的错误
    setSuccessMessage(''); // 清除之前的成功消息
    
    try {
      const { data, error } = await authService.signIn(values.email, values.password);
      
      console.log('Login response:', { hasError: !!error, hasUser: !!data?.user, error });
      
      if (error) {
        console.error('Login error details:', error);
        
        // 根据错误类型设置不同的错误消息
        if (error.message.includes('Email not confirmed')) {
          setErrorMessage('邮箱未验证：请先验证您的邮箱！请检查邮件中的验证链接。');
        } else if (error.message.includes('Invalid login credentials') || 
                   error.message.includes('Invalid') ||
                   error.message.includes('credentials')) {
          setErrorMessage('登录失败：邮箱或密码错误，请重新输入！');
        } else if (error.message.includes('Email')) {
          setErrorMessage('登录失败：邮箱格式不正确或未注册');
        } else {
          setErrorMessage(`登录失败：${error.message || '请检查您的邮箱和密码'}`);
        }
        setLoading(false);
        return;
      }
      
      if (data.user) {
        setUser(data.user);
        setSuccessMessage('登录成功！欢迎回来，正在跳转...');
        
        // 延迟跳转,让用户看到成功消息
        setTimeout(() => {
          const from = (location.state as any)?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }, 1000);
      }
    } catch (error: any) {
      console.error('Login exception:', error);
      setErrorMessage(`登录错误：${error?.message || '登录过程中发生错误，请稍后重试'}`);
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
          <Title level={2} style={{ marginBottom: 8 }}>欢迎回来</Title>
          <Text type="secondary">登录您的 AI 旅行规划师账号</Text>
        </div>

        {/* 错误提示 */}
        {errorMessage && (
          <Alert
            message="登录错误"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage('')}
            style={{ marginBottom: 24 }}
            icon={<CloseCircleOutlined />}
          />
        )}

        {/* 成功提示 */}
        {successMessage && (
          <Alert
            message="登录成功"
            description={successMessage}
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        
        <Form 
          name="login" 
          onFinish={onFinish} 
          autoComplete="off" 
          size="large"
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入您的邮箱！' },
              { type: 'email', message: '请输入有效的邮箱地址！' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="邮箱" 
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入您的密码！' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <a href="/forgot-password" style={{ color: '#667eea' }}>
                忘记密码？
              </a>
            </div>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              style={{ height: '44px', fontSize: '16px', fontWeight: 500 }}
            >
              登录
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text>
              还没有账号？{' '}
              <a href="/register" style={{ color: '#667eea', fontWeight: 500 }}>
                立即注册
              </a>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
