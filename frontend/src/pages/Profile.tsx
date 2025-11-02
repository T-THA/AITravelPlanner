import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Button, Space, Avatar, Row, Col, Tag, Spin, message } from 'antd';
import { 
  UserOutlined, 
  EditOutlined, 
  LockOutlined, 
  SettingOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/auth';
import EditProfileModal from '../components/EditProfileModal';
import PreferencesModal from '../components/PreferencesModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

const { Title, Paragraph } = Typography;

const Profile: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);
  const setProfile = useAuthStore(state => state.setProfile);
  
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // 加载用户 Profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      const { profile: userProfile, error } = await authService.getUserProfile(user.id);
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 表示记录不存在,这是正常的
        message.error('加载用户信息失败');
        console.error('Load profile error:', error);
      }
      
      // 如果 profile 不存在,创建一个空的
      if (!userProfile) {
        const { profile: newProfile, error: createError } = await authService.createUserProfile(user.id, {});
        if (createError) {
          console.error('Create profile error:', createError);
        } else {
          setProfile(newProfile);
        }
      } else {
        setProfile(userProfile);
      }
      
      setLoading(false);
    };

    loadProfile();
  }, [user, setProfile]);

  // 刷新 Profile 数据
  const refreshProfile = async () => {
    if (!user) return;
    
    const { profile: updatedProfile, error } = await authService.getUserProfile(user.id);
    if (!error && updatedProfile) {
      setProfile(updatedProfile);
    }
  };

  // 处理编辑资料成功
  const handleEditSuccess = () => {
    setEditModalOpen(false);
    refreshProfile();
  };

  // 处理偏好设置成功
  const handlePreferencesSuccess = () => {
    setPreferencesModalOpen(false);
    refreshProfile();
  };

  // 处理修改密码成功
  const handlePasswordSuccess = () => {
    setPasswordModalOpen(false);
    // 修改密码后会自动跳转到登录页
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 获取旅行偏好
  const preferences = profile?.preferences || {};
  const hasPreferences = Object.keys(preferences).length > 0;

  return (
    <div>
      <Title level={2}>个人中心</Title>
      <Paragraph type="secondary">
        管理您的个人信息和旅行偏好设置
      </Paragraph>

      <Row gutter={[16, 16]}>
        {/* 左侧：基本信息 */}
        <Col xs={24} lg={12}>
          <Card title="基本信息">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 头像和昵称 */}
              <div style={{ textAlign: 'center' }}>
                <Avatar 
                  size={100} 
                  icon={<UserOutlined />} 
                  src={profile?.avatar_url}
                  style={{ marginBottom: 16 }}
                />
                <Title level={4} style={{ margin: 0 }}>
                  {profile?.username || user?.email?.split('@')[0] || '用户'}
                </Title>
                <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
                  {user?.email}
                </Paragraph>
              </div>

              {/* 账户信息 */}
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item 
                  label={<><MailOutlined /> 邮箱</>}
                >
                  {user?.email || '-'}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={<><ClockCircleOutlined /> 注册时间</>}
                >
                  {user?.created_at 
                    ? new Date(user.created_at).toLocaleString('zh-CN') 
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item 
                  label={<><ClockCircleOutlined /> 最后登录</>}
                >
                  {user?.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleString('zh-CN') 
                    : '-'}
                </Descriptions.Item>
              </Descriptions>

              {/* 操作按钮 */}
              <Space wrap style={{ width: '100%', justifyContent: 'center' }}>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => setEditModalOpen(true)}
                >
                  编辑资料
                </Button>
                <Button 
                  icon={<LockOutlined />}
                  onClick={() => setPasswordModalOpen(true)}
                >
                  修改密码
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* 右侧：旅行偏好 */}
        <Col xs={24} lg={12}>
          <Card 
            title="旅行偏好"
            extra={
              <Button 
                type="link" 
                icon={<SettingOutlined />}
                onClick={() => setPreferencesModalOpen(true)}
              >
                设置偏好
              </Button>
            }
          >
            {!hasPreferences ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <SettingOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>还没有设置旅行偏好</div>
                <Button 
                  type="primary" 
                  style={{ marginTop: 16 }}
                  onClick={() => setPreferencesModalOpen(true)}
                >
                  立即设置
                </Button>
              </div>
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {/* 喜欢的目的地 */}
                {preferences.favorite_destinations && preferences.favorite_destinations.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 'bold' }}>喜欢的目的地:</div>
                    <Space wrap>
                      {preferences.favorite_destinations.map((dest: string) => (
                        <Tag key={dest} color="blue">{dest}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 旅行风格 */}
                {preferences.travel_style && preferences.travel_style.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 'bold' }}>旅行风格:</div>
                    <Space wrap>
                      {preferences.travel_style.map((style: string) => (
                        <Tag key={style} color="green">{style}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 预算偏好 */}
                {preferences.budget_preference && (
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 'bold' }}>预算偏好:</div>
                    <Tag color="orange">
                      {preferences.budget_preference === 'budget' && '经济型'}
                      {preferences.budget_preference === 'comfortable' && '舒适型'}
                      {preferences.budget_preference === 'luxury' && '豪华型'}
                    </Tag>
                  </div>
                )}

                {/* 交通偏好 */}
                {preferences.transport_preference && preferences.transport_preference.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 'bold' }}>交通偏好:</div>
                    <Space wrap>
                      {preferences.transport_preference.map((transport: string) => (
                        <Tag key={transport} color="purple">{transport}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 住宿偏好 */}
                {preferences.accommodation_preference && preferences.accommodation_preference.length > 0 && (
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 'bold' }}>住宿偏好:</div>
                    <Space wrap>
                      {preferences.accommodation_preference.map((accommodation: string) => (
                        <Tag key={accommodation} color="cyan">{accommodation}</Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* Modals */}
      <EditProfileModal
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
      <PreferencesModal
        open={preferencesModalOpen}
        onCancel={() => setPreferencesModalOpen(false)}
        onSuccess={handlePreferencesSuccess}
      />
      <ChangePasswordModal
        open={passwordModalOpen}
        onCancel={() => setPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  );
};

export default Profile;
