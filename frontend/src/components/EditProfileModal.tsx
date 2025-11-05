import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, message, Avatar, Button } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { authService } from '../services/auth';
import { storageService } from '../services/storage';
import { useAuthStore } from '../stores/authStore';

interface EditProfileModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface ProfileFormData {
  username: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  
  const user = useAuthStore(state => state.user);
  const profile = useAuthStore(state => state.profile);

  // 初始化表单数据
  useEffect(() => {
    if (open && profile) {
      form.setFieldsValue({
        username: profile.username || '',
      });
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [open, profile, form]);

  // 处理头像上传前的验证
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return Upload.LIST_IGNORE;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
      return Upload.LIST_IGNORE;
    }

    return false; // 阻止自动上传
  };

  // 处理头像文件选择
  const handleFileChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList.slice(-1)); // 只保留最新的一个文件
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const values = form.getFieldsValue() as ProfileFormData;
      let newAvatarUrl = avatarUrl;

      // 如果有新上传的头像
      if (fileList.length > 0 && fileList[0].originFileObj) {
        setUploading(true);
        
        // 删除旧头像
        if (avatarUrl) {
          const oldPath = storageService.extractPathFromUrl(avatarUrl);
          if (oldPath) {
            await storageService.deleteAvatar(oldPath);
          }
        }

        // 上传新头像
        const { data, error } = await storageService.uploadAvatar(
          fileList[0].originFileObj as File,
          user!.id
        );

        if (error) {
          message.error(error.message || '头像上传失败');
          setUploading(false);
          setLoading(false);
          return;
        }

        newAvatarUrl = data!.publicUrl;
        setUploading(false);
      }

      // 更新用户资料
      const { error } = await authService.updateUserProfile(user!.id, {
        username: values.username,
        avatar_url: newAvatarUrl,
      });

      if (error) {
        message.error('更新失败: ' + error.message);
        setLoading(false);
        return;
      }

      message.success('资料更新成功!');
      setFileList([]);
      onSuccess();
      
    } catch (error) {
      console.error('Update profile error:', error);
      message.error('更新失败,请稍后重试');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  // 关闭 Modal 时清理状态
  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setAvatarUrl(profile?.avatar_url || '');
    onCancel();
  };

  return (
    <Modal
      title="编辑个人资料"
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 24 }}
      >
        {/* 头像预览和上传 */}
        <Form.Item label="头像">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar 
              size={80} 
              icon={<UserOutlined />} 
              src={fileList.length > 0 && fileList[0].originFileObj 
                ? URL.createObjectURL(fileList[0].originFileObj)
                : avatarUrl
              }
            />
            <Upload
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleFileChange}
              maxCount={1}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? '上传中...' : '选择图片'}
              </Button>
            </Upload>
          </div>
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            支持 JPG、PNG、GIF、WebP 格式,大小不超过 2MB
          </div>
        </Form.Item>

        {/* 用户昵称 */}
        <Form.Item
          label="昵称"
          name="username"
          rules={[
            { required: true, message: '请输入昵称' },
            { min: 2, max: 20, message: '昵称长度为 2-20 个字符' },
            { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/, message: '昵称只能包含中英文、数字、下划线和横线' },
          ]}
        >
          <Input 
            placeholder="请输入昵称" 
            maxLength={20}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
