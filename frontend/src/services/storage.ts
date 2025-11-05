import { supabase } from './supabase';

/**
 * Storage 服务 - 处理文件上传和管理
 */
export const storageService = {
  /**
   * 上传用户头像
   * @param file 图片文件
   * @param userId 用户 ID
   * @returns 上传结果和公开 URL
   */
  async uploadAvatar(file: File, userId: string) {
    try {
      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return { 
          data: null, 
          error: { message: '仅支持 JPG, PNG, GIF, WebP 格式的图片' } 
        };
      }

      // 验证文件大小 (最大 2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        return { 
          data: null, 
          error: { message: '图片大小不能超过 2MB' } 
        };
      }

      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 上传文件到 Supabase Storage
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // 不覆盖已有文件
        });

      if (error) {
        return { data: null, error };
      }

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { 
        data: { 
          path: filePath, 
          publicUrl 
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { 
        data: null, 
        error: { message: '上传失败,请稍后重试' } 
      };
    }
  },

  /**
   * 删除头像文件
   * @param path 文件路径
   */
  async deleteAvatar(path: string) {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([path]);

      return { error };
    } catch (error) {
      console.error('Delete avatar error:', error);
      return { error: { message: '删除失败' } };
    }
  },

  /**
   * 获取文件的公开 URL
   * @param path 文件路径
   */
  getPublicUrl(path: string) {
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);
    
    return publicUrl;
  },

  /**
   * 从 URL 中提取文件路径
   * @param url 完整的文件 URL
   */
  extractPathFromUrl(url: string): string | null {
    try {
      const match = url.match(/avatars\/(.+)$/);
      return match ? `avatars/${match[1]}` : null;
    } catch {
      return null;
    }
  },
};
