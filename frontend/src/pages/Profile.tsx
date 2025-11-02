import React from 'react';
import { Card, Typography, Descriptions, Button, Space, Avatar } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Title } = Typography;

const Profile: React.FC = () => {
  const user = useAuthStore(state => state.user);

  return (
    <div>
      <Title level={2}>个人中心</Title>
      
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar size={100} icon={<UserOutlined />} src={user?.user_metadata?.avatar_url} />
            <Title level={4} style={{ marginTop: 16 }}>
              {user?.user_metadata?.name || user?.email?.split('@')[0] || '用户'}
            </Title>
          </div>

          <Descriptions title="基本信息" bordered column={1}>
            <Descriptions.Item label="邮箱">{user?.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ textAlign: 'center' }}>
            <Button type="primary" icon={<EditOutlined />}>
              编辑资料
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Profile;
