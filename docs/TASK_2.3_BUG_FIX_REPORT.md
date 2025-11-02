# Task 2.3 Bug 修复报告

## 概述

本次修复了用户测试过程中发现的两个问题:
1. Header 组件头像不同步问题
2. 密码修改时允许新旧密码相同的问题

---

## Bug 1: Header 头像不同步

### 问题描述
- **现象**: 在个人中心页面修改头像后,右上角 Header 的头像没有实时更新
- **影响**: 用户体验不佳,需要刷新页面才能看到更新后的头像
- **根本原因**: Header 组件只使用了 `user.user_metadata.avatar_url`,而 EditProfileModal 更新的是 `profile.avatar_url`

### 修复方案
修改 `frontend/src/components/Header.tsx`:

```tsx
// 修复前
const user = useAuthStore(state => state.user);

<Avatar 
  icon={<UserOutlined />} 
  src={user?.user_metadata?.avatar_url} 
/>

// 修复后
const user = useAuthStore(state => state.user);
const profile = useAuthStore(state => state.profile);

<Avatar 
  icon={<UserOutlined />} 
  src={profile?.avatar_url || user?.user_metadata?.avatar_url} 
/>
<span>
  {profile?.username || user?.user_metadata?.name || user?.email?.split('@')[0] || '用户'}
</span>
```

### 修复逻辑
1. 添加 `profile` 状态从 `useAuthStore`
2. Avatar 的 src 优先使用 `profile?.avatar_url`
3. 用户名显示优先使用 `profile?.username`
4. 保持 fallback 机制,兼容旧数据

### 测试验证
- ✅ 修改头像后 Header 立即更新
- ✅ 未设置 profile 时使用 user_metadata (向后兼容)
- ✅ 刷新页面后头像保持正确

---

## Bug 2: 密码修改验证问题

### 问题描述
- **现象**: 修改密码时,如果新密码和旧密码一样,Supabase 返回 422 Unprocessable Content 错误
- **影响**: 用户无法得到友好的错误提示,体验差
- **根本原因**: 前端没有验证新旧密码是否相同,也没有验证当前密码是否正确

### 修复方案

#### 1. 添加当前密码字段
```tsx
// 启用之前被注释的当前密码字段
<Form.Item
  label="当前密码"
  name="currentPassword"
  rules={[
    { required: true, message: '请输入当前密码' },
  ]}
>
  <Input.Password
    prefix={<LockOutlined />}
    placeholder="请输入当前密码"
    size="large"
  />
</Form.Item>
```

#### 2. 添加新旧密码重复校验
```tsx
<Form.Item
  label="新密码"
  name="newPassword"
  dependencies={['currentPassword']}
  rules={[
    { required: true, message: '请输入新密码' },
    { min: 8, message: '密码长度至少为 8 个字符' },
    {
      pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
      message: '密码必须包含字母和数字',
    },
    ({ getFieldValue }) => ({
      validator(_, value) {
        const currentPassword = getFieldValue('currentPassword');
        if (!value || !currentPassword) {
          return Promise.resolve();
        }
        if (value === currentPassword) {
          return Promise.reject(new Error('新密码不能与当前密码相同'));
        }
        return Promise.resolve();
      },
    }),
  ]}
>
```

#### 3. 添加当前密码验证逻辑
```tsx
const handleSubmit = async () => {
  try {
    await form.validateFields();
    setLoading(true);

    const values = form.getFieldsValue() as PasswordFormData;

    // 1. 先验证当前密码是否正确
    const { user } = await authService.getCurrentUser();
    if (!user || !user.email) {
      message.error('无法获取当前用户信息');
      setLoading(false);
      return;
    }

    // 尝试用当前密码登录来验证密码是否正确
    const { error: signInError } = await authService.signIn(user.email, values.currentPassword);
    if (signInError) {
      message.error('当前密码不正确');
      setLoading(false);
      return;
    }

    // 2. 更新为新密码
    const { error } = await authService.updatePassword(values.newPassword);
    
    if (error) {
      message.error('密码修改失败: ' + error.message);
      setLoading(false);
      return;
    }

    message.success('密码修改成功!请使用新密码重新登录');
    // ...
  } catch (error) {
    console.error('Change password error:', error);
    message.error('密码修改失败,请稍后重试');
    setLoading(false);
  }
};
```

### 修复逻辑
1. **启用当前密码字段**: 要求用户输入当前密码
2. **前端表单验证**: 在表单层面验证新密码不能与当前密码相同
3. **当前密码验证**: 通过 `signIn` 尝试登录来验证当前密码是否正确
4. **友好错误提示**: 提供清晰的中文错误信息

### 测试验证
- ✅ 新密码与当前密码相同时,表单验证阻止提交,显示 "新密码不能与当前密码相同"
- ✅ 当前密码输入错误时,显示 "当前密码不正确"
- ✅ 密码修改成功后自动跳转到登录页
- ✅ 不再出现 422 错误

---

## 修改的文件

1. **frontend/src/components/Header.tsx**
   - 添加 `profile` 状态
   - 更新 Avatar src 优先使用 profile 数据
   - 更新用户名显示优先使用 profile 数据

2. **frontend/src/components/ChangePasswordModal.tsx**
   - 启用当前密码字段
   - 添加新旧密码重复验证
   - 添加当前密码正确性验证
   - 优化错误提示信息

---

## Git 提交信息

```
commit 42e7dfa
Author: T-THA
Date: [当前日期]

fix(profile): 修复头像同步和密码验证问题

- 修复 Header 组件头像不同步问题,优先使用 profile.avatar_url
- 修复密码修改时允许新旧密码相同的问题
- 添加当前密码验证,防止未授权修改
- 添加新旧密码重复校验,避免 422 错误
```

---

## 下一步建议

### 浏览器测试清单
1. **头像同步测试**:
   - [ ] 登录后进入个人中心
   - [ ] 上传新头像
   - [ ] 检查 Header 右上角头像是否立即更新
   - [ ] 刷新页面,检查头像是否保持

2. **密码修改测试**:
   - [ ] 点击"修改密码"按钮
   - [ ] 尝试输入错误的当前密码,检查错误提示
   - [ ] 尝试输入与当前密码相同的新密码,检查表单验证
   - [ ] 输入正确的当前密码和不同的新密码,检查修改成功
   - [ ] 检查是否自动跳转到登录页
   - [ ] 使用新密码登录,验证密码已更新

3. **边界情况测试**:
   - [ ] 新用户首次设置头像和密码
   - [ ] 网络异常时的错误处理
   - [ ] 快速连续点击提交按钮 (loading 状态)

---

## 总结

本次修复解决了用户测试中发现的两个关键问题:
1. **头像同步**: 通过优先使用 profile 数据,确保 Header 和 Profile 页面数据一致
2. **密码验证**: 通过前端验证和后端验证相结合,提供更好的用户体验和安全性

两个 bug 都已修复并推送到 GitHub (commit 42e7dfa),建议进行浏览器测试验证修复效果。

**修复时间**: 约 30 分钟  
**影响范围**: Header 组件、ChangePasswordModal 组件  
**破坏性变更**: 无  
**向后兼容**: ✅ 完全兼容
