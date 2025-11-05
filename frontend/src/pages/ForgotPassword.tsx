import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

const { Title, Text } = Typography;

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await authService.resetPassword(values.email);
      
      if (error) {
        setErrorMessage(error.message || '发送重置邮件失败，请稍后重试');
        setLoading(false);
        return;
      }
      
      setEmail(values.email);
      setEmailSent(true);
    } catch (error: any) {
      setErrorMessage(error?.message || '发送邮件过程中发生错误');
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
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
          maxWidth: 550, 
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', 
          borderRadius: '12px' 
        }}>
          <Result
            status="success"
            title="重置邮件已发送"
            subTitle={
              <div>
                <p>我们已向 <strong>{email}</strong> 发送了密码重置链接。</p>
                <p>请检查您的邮箱（包括垃圾邮件文件夹）并点击链接重置密码。</p>
                <p style={{ color: '#999', fontSize: '12px', marginTop: '16px' }}>
                  链接将在 24 小时后失效
                </p>
              </div>
            }
            extra={[
              <Button type="primary" key="login" onClick={() => navigate('/login')}>
                返回登录
              </Button>,
              <Button key="resend" onClick={() => setEmailSent(false)}>
                重新发送
              </Button>,
            ]}
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
          <Title level={2}>找回密码</Title>
          <Text type="secondary">输入您的注册邮箱，我们将发送重置链接</Text>
        </div>

        {/* 错误提示 */}
        {errorMessage && (
          <Alert
            message="发送失败"
            description={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage('')}
            style={{ marginBottom: 24 }}
            icon={<CloseCircleOutlined />}
          />
        )}
        
        <Form name="forgot-password" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入您的邮箱！' },
              { type: 'email', message: '请输入有效的邮箱地址！' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="注册邮箱" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              发送重置链接
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <Button 
              type="link" 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/login')}
            >
              返回登录
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
