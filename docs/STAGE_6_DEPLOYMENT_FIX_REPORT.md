# 阶段六 - Docker部署问题修复报告

## 📅 日期
2025年11月5日

## 🎯 修复目标
解决Docker部署后预算分析API返回404错误的问题

## 🔍 问题发现过程

### 用户反馈
部署后发现两个问题:
1. ✅ 语音输入无法工作 (已快速修复 - 添加环境检查和HTTPS提示)
2. ❌ 预算分析返回404错误

### 初始错误现象
```
POST http://146.56.219.70:3000/api/dashscope/api/v1/services/aigc/text-generation/generation 404
```

### 关键矛盾
- **行程生成**: 工作正常 ✅
- **预算分析**: 返回404 ❌
- **两者都调用**: DashScope API

用户敏锐地提出: **"为什么行程生成能工作,预算分析不行?两处代码有何不同?"**

## 🕵️ 问题排查

### 第一次尝试修复 (无效)
**假设**: baseURL配置错误
- 修改: `baseURL = '/api/dashscope/api/v1'` → `baseURL = '/api/dashscope'`
- 修改: API路径添加 `/api/v1/`
- 结果: ❌ 问题依然存在

**提交**: `6d1813a` - "fix: 修复语音输入和API代理问题"

### 第二次尝试修复 (无效)
**假设**: Docker缓存问题
- 操作: `docker build --no-cache`
- 结果: ❌ 问题依然存在

**提交**: `7b3e37e` - "fix: 修正DashScope API路径配置"

### 第三次排查 - 发现真相 ✅

#### 对比分析
按照用户提示,对比两处调用:

**行程生成** (`CreateItinerary.tsx`):
```typescript
import { llmService } from '../services/llm';
await llmService.generateItinerary(request);
```

**预算分析** (`ItineraryDetail.tsx`):
```typescript
import { dashScopeService } from '../services/dashscope';
await dashScopeService.analyzeBudget({...});
```

#### 关键发现1: 不同的服务实现

**llmService** (`llm.ts`):
```typescript
const BASE_URL = import.meta.env.VITE_ALIYUN_BASE_URL; // undefined!
await fetch(`${BASE_URL}/chat/completions`, {...});
```
- 使用原生`fetch()`
- 依赖`VITE_ALIYUN_BASE_URL`环境变量
- **docker-run.sh中没有这个环境变量!**

**dashScopeService** (`dashscope.ts`):
```typescript
baseURL = '/api/dashscope'
await this.client.post('/api/v1/services/aigc/text-generation/generation', {...});
```
- 使用axios + nginx代理
- 通过`/api/dashscope`代理到阿里云

#### 关键发现2: nginx SSL握手失败

检查nginx错误日志:
```
[error] peer closed connection in SSL handshake (104: Connection reset by peer)
upstream: "https://8.141.18.184:443/api/v1/services/..."
upstream: "https://182.92.133.45:443/api/v1/services/..."
[warn] upstream server temporarily disabled
```

**根本原因**:
```nginx
# 原配置 - 使用变量会导致DNS解析为IP地址
set $dashscope_backend "dashscope.aliyuncs.com";
resolver 8.8.8.8 8.8.4.4;
proxy_pass https://$dashscope_backend;  # ❌ SSL证书不匹配IP地址
```

nginx使用变量时:
1. 通过DNS解析域名 → 得到多个IP地址
2. 尝试连接IP地址
3. HTTPS请求时SSL证书验证失败 (域名证书 vs IP连接)
4. 所有上游服务器被标记为"temporarily disabled"
5. 返回404错误

## ✅ 最终解决方案

### 1. 修复nginx SSL代理配置

**docker/nginx.conf**:
```nginx
location /api/dashscope/ {
    # 直接使用域名,不用变量 - 避免DNS解析为IP
    proxy_pass https://dashscope.aliyuncs.com;
    proxy_ssl_server_name on;  # 启用SNI支持
    proxy_set_header Host dashscope.aliyuncs.com;
    
    # 重写路径保持不变
    rewrite ^/api/dashscope/(.*)$ /$1 break;
    
    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # 禁用缓存
    proxy_buffering off;
}
```

**关键改动**:
- ❌ 移除: `set $dashscope_backend` + `resolver`
- ✅ 直接使用: `proxy_pass https://dashscope.aliyuncs.com`
- ✅ 添加: `proxy_ssl_server_name on` (确保SNI正常工作)

### 2. 统一API调用服务

**问题**: 
- `llmService`使用fetch直接调用,依赖环境变量
- `dashScopeService`使用nginx代理,配置正确

**解决**: 统一使用`dashScopeService`

**frontend/src/pages/CreateItinerary.tsx**:
```typescript
// 修改前
import { llmService } from '../services/llm';
const { data: itinerary, error } = await llmService.generateItinerary(request);

// 修改后
import { dashScopeService } from '../services/dashscope';
const itinerary = await dashScopeService.generateItinerary({
  destination: request.destination,
  days: request.days,
  budget: request.budget,
  travelers: request.travelers,
  preferences: request.preferences,
  specialNeeds: request.specialNeeds,
});
```

### 3. 更新环境变量配置

**docker-run.sh**:
```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  -e VITE_SUPABASE_URL="..." \
  -e VITE_SUPABASE_ANON_KEY="..." \
  -e VITE_DASHSCOPE_API_KEY="sk-78614a3aa9004bb3bc7a1e768add1a16" \  # 新增
  -e VITE_IFLYTEK_APP_ID="..." \
  -e VITE_IFLYTEK_API_KEY="..." \
  -e VITE_IFLYTEK_API_SECRET="..." \
  -e VITE_AMAP_KEY="..." \
  ai-travel-planner:latest
```

## 📊 修复验证

### curl测试
```bash
curl -X POST http://localhost:3000/api/dashscope/api/v1/services/aigc/text-generation/generation \
  -H "Authorization: Bearer sk-78614a3aa9004bb3bc7a1e768add1a16" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-turbo","input":{"messages":[{"role":"user","content":"你好"}]}}'
```

**结果**: ✅ 成功
```json
{
  "output": {
    "choices": [{
      "message": {
        "content": "你好！很高兴见到你。有什么我可以帮你的吗？",
        "role": "assistant"
      }
    }]
  }
}
```

### 功能测试计划
- [ ] 行程生成测试
- [ ] 预算分析测试
- [ ] 语音输入测试 (HTTPS环境)

## 🎓 经验教训

### 1. 不要盲目修改
**错误做法**: 没有找到根本原因就尝试多次修改
- ❌ 修改baseURL配置
- ❌ 修改API路径
- ❌ --no-cache重建

**正确做法**: 
- ✅ 对比成功和失败的案例
- ✅ 检查日志找到真正的错误
- ✅ 理解问题根源后再修复

### 2. nginx变量使用注意事项
当`proxy_pass`使用变量时:
- nginx会进行DNS解析
- 对于HTTPS,会导致SSL证书验证问题
- 应该直接使用域名,除非有特殊需求

### 3. 统一架构设计
**问题**: 两个服务使用不同的API调用方式
- `llmService`: fetch + 直接调用
- `dashScopeService`: axios + nginx代理

**改进**: 统一使用nginx代理方式
- ✅ 避免CORS问题
- ✅ 统一错误处理
- ✅ 便于监控和日志

### 4. 用户反馈的价值
用户的质疑非常关键:
> "为什么行程生成能工作,预算分析不行?你是否自作聪明做了很多无用功?"

这个问题促使我们:
- 重新审视问题
- 对比两处代码
- 找到真正的根源

## 📝 提交记录

1. **6d1813a** - "fix: 修复语音输入和API代理问题" (无效修复)
2. **7b3e37e** - "fix: 修正DashScope API路径配置" (无效修复)
3. **25dc076** - "fix: 修复nginx SSL代理配置,移除变量DNS解析" (✅ 根本修复)
4. **d31cf9a** - "fix: 统一使用dashScopeService生成行程" (✅ 架构改进)

## 🚀 后续优化

### 短期
- [ ] 完整测试所有功能
- [ ] 更新部署文档
- [ ] 添加nginx日志监控

### 长期
- [ ] 考虑废弃`llmService`,统一使用`dashScopeService`
- [ ] 添加API调用失败的自动重试机制
- [ ] 实现更详细的错误日志和监控

## 📖 相关文档
- [Docker部署指南](./DOCKER_DEPLOYMENT_GUIDE.md)
- [快速开始](./DOCKER_QUICK_START.md)
- [阶段五完成报告](./STAGE_5_COMPLETION_REPORT.md)

---

**报告人**: AI助手  
**日期**: 2025-11-05  
**版本**: v1.0
