# Supabase Storage 配置指南 - 头像上传

## 配置步骤

### 1. 登录 Supabase Dashboard
访问: https://supabase.com/dashboard

### 2. 创建 Storage Bucket

1. 在左侧导航栏选择 **Storage**
2. 点击 **Create a new bucket**
3. 配置 Bucket:
   - **Name**: `avatars`
   - **Public**: ✅ 勾选 (允许公开访问)
   - **File size limit**: `2MB`
   - **Allowed MIME types**: `image/*`
4. 点击 **Create bucket**

### 3. 配置 Bucket 策略 (Policies)

#### 3.1 允许用户上传自己的头像

```sql
-- Policy: Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (regexp_match(name, '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1]
);
```

#### 3.2 允许用户删除自己的头像

```sql
-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (regexp_match(name, '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'))[1]
);
```

#### 3.3 允许所有人查看头像 (公开读取)

```sql
-- Policy: Anyone can view avatars
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### 4. 在 Dashboard 中配置策略 (简化方式)

1. 进入 **Storage** → **avatars** bucket
2. 点击 **Policies** 标签
3. 点击 **New Policy**
4. 选择模板或自定义策略:

**Upload Policy:**
- **Policy name**: Users can upload own avatar
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **Using expression**:
  ```sql
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'avatars'
  ```

**Delete Policy:**
- **Policy name**: Users can delete own avatar
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **Using expression**:
  ```sql
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'avatars'
  ```

**Select Policy (Public):**
- **Policy name**: Public read access
- **Allowed operation**: SELECT
- **Target roles**: public
- **Using expression**:
  ```sql
  bucket_id = 'avatars'
  ```

### 5. 验证配置

#### 5.1 测试上传
```typescript
import { supabase } from './services/supabase';

// 上传测试
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`avatars/${user.id}-test.jpg`, testFile);

console.log('Upload result:', { data, error });
```

#### 5.2 测试公开访问
```typescript
// 获取公开 URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('avatars/test.jpg');

console.log('Public URL:', data.publicUrl);
// 在浏览器中访问此 URL,应该能看到图片
```

---

## 文件命名规范

```
avatars/{userId}-{timestamp}.{ext}
```

示例:
```
avatars/123e4567-e89b-12d3-a456-426614174000-1704067200000.jpg
```

---

## 存储限制

| 项目 | 限制 |
|------|------|
| 文件大小 | 2MB |
| 文件类型 | image/jpeg, image/jpg, image/png, image/gif, image/webp |
| 命名规则 | `{userId}-{timestamp}.{ext}` |
| Bucket 名称 | `avatars` |

---

## 安全考虑

1. **文件大小验证**: 前端和后端都应验证文件大小
2. **文件类型验证**: 仅允许图片类型
3. **用户隔离**: 用户只能上传/删除自己的文件
4. **公开访问**: 所有人可以查看头像 (公开 bucket)

---

## 故障排查

### 问题 1: 上传失败 - Permission denied
**原因**: Bucket 策略未正确配置
**解决**: 
1. 检查 Bucket 是否设置为 Public
2. 确认 Policy 已创建并启用
3. 检查文件路径格式是否正确

### 问题 2: 无法访问公开 URL
**原因**: Bucket 未设置为 Public
**解决**: 
1. Storage → avatars → Settings
2. 勾选 "Public bucket"
3. 保存设置

### 问题 3: 文件上传慢
**原因**: 图片文件过大
**解决**: 
1. 前端压缩图片
2. 限制文件大小
3. 使用 WebP 格式

---

## 代码实现

已实现文件:
- `frontend/src/services/storage.ts` - Storage 服务
- `frontend/src/components/EditProfileModal.tsx` - 头像上传组件

---

## 测试清单

- [ ] 创建 avatars bucket
- [ ] 设置 bucket 为 Public
- [ ] 配置上传策略
- [ ] 配置删除策略
- [ ] 配置公开读取策略
- [ ] 测试上传功能
- [ ] 测试公开访问
- [ ] 测试删除旧文件
- [ ] 验证文件大小限制
- [ ] 验证文件类型限制

---

## 参考文档

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads/file-upload-best-practices)
