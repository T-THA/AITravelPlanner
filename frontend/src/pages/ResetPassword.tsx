import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Result } from 'antd';
import { LockOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';

const { Title, Text } = Typography;

const ResetPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 只在组件挂载时检查一次
    const checkToken = () => {
      try {
        // 检查 URL 中是否有重置令牌
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        console.log('Reset password token check:', { accessToken: !!accessToken, type });

        if (type === 'recovery' && accessToken) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setErrorMessage('重置链接无效或已过期，请重新申请密码重置。');
          setTimeout(() => navigate('/forgot-password', { replace: true }), 3000);
        }
      } catch (error) {
        console.error('Token check error:', error);
        setIsValidToken(false);
      }
    };

    checkToken();
    // 只在组件挂载时执行一次，不要依赖 location 或 navigate
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      setErrorMessage('两次输入的密码不一致！请重新输入。');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await authService.updatePassword(values.password);
      
      console.log('Update password response:', { hasError: !!error, error });
      
      if (error) {
        console.error('Update password error details:', error);
        
        // 处理 422 错误（新密码与旧密码相同）
        if (error.status === 422 || error.message.includes('same as the old password')) {
          setErrorMessage('新密码不可与旧密码一致，请输入不同的密码。');
        } else {
          setErrorMessage(error.message || '密码重置失败，请重试');
        }
        setLoading(false);
        return;
      }
      
      setResetSuccess(true);
      // 延迟跳转让用户看到成功提示
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      setErrorMessage(error?.message || '密码重置过程中发生错误');
      setLoading(false);
    }
  };

  // 正在检查令牌
  if (isValidToken === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: 450, 
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', 
          borderRadius: '12px'
        }}>
          <div style={{ padding: '40px 20px' }}>
            <Typography.Text>正在验证重置链接...</Typography.Text>
          </div>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
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
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', 
          borderRadius: '12px'
        }}>
          <Result
            status="error"
            title="无效的重置链接"
            subTitle="链接已过期或无效，请重新申请密码重置。"
            extra={
              <Button type="primary" onClick={() => navigate('/forgot-password')}>
                返回找回密码
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
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
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', 
          borderRadius: '12px'
        }}>
          <Result
            status="success"
            title="密码重置成功"
            subTitle="您的密码已成功重置，正在跳转到登录页面..."
            extra={
              <Button type="primary" onClick={() => navigate('/login')}>
                立即登录
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>重置密码</Title>
          <Text type="secondary">请输入您的新密码</Text>
        </div>

        {/* 错误提示 - 特别标注422错误 */}
        {errorMessage && (
          <Alert
            message="密码重置失败"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage('')}
            style={{ marginBottom: 24 }}
            icon={<CloseCircleOutlined />}
          />
        )}
        
        <Form name="reset-password" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入新密码！' },
              { min: 6, message: '密码长度至少为6位！' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: '密码必须包含大小写字母和数字！',
              },
            ]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="新密码（至少6位，包含大小写字母和数字）" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请确认新密码！' },
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
            <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              重置密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword;
