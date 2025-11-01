import React from 'react';
import { Button, Card, Typography, Space, message, Divider } from 'antd';
import { LogoutOutlined, UserOutlined, AudioOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      message.success('已退出登录');
      navigate('/login');
    } catch (error) {
      message.error('退出登录失败');
      console.error('Logout error:', error);
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2}>控制面板</Title>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </div>
          
          <Card type="inner" title={<><UserOutlined /> 用户信息</>}>
            <Space direction="vertical">
              <Text><strong>邮箱:</strong> {user?.email}</Text>
              <Text><strong>用户 ID:</strong> {user?.id}</Text>
              <Text type="secondary">
                登录时间: {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('zh-CN') : '未知'}
              </Text>
            </Space>
          </Card>

          <Card type="inner" title="欢迎使用 AI 旅行规划师！">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Text>您已成功登录系统。</Text>
              
              <Divider />
              
              <div>
                <Text strong>功能测试：</Text>
                <div style={{ marginTop: '16px' }}>
                  <Button
                    type="primary"
                    icon={<AudioOutlined />}
                    onClick={() => navigate('/voice-test')}
                  >
                    测试语音识别
                  </Button>
                </div>
              </div>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default Dashboard;
