# 第三方 API 配置指南

## 文档信息

- **涉及服务**: 科大讯飞、高德地图、阿里云百炼
- **预计时间**: 40-60 分钟
- **最后更新**: 2025-01-XX

---

## 1. 科大讯飞语音识别 API

### 1.1 注册与创建应用

1. 访问 [讯飞开放平台](https://www.xfyun.cn/)
2. 注册账号并完成实名认证
3. 进入控制台 → 创建新应用
   - **应用名称**: AI旅行规划师
   - **应用平台**: WebAPI
   - **应用领域**: 选择"旅游"

4. 添加"语音听写(流式版WebAPI)"服务

### 1.2 获取凭证

在应用详情页面获取：
- **APPID**: `xxxxxxxx`
- **APISecret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **APIKey**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 1.3 更新环境变量

```bash
VITE_XUNFEI_APPID=your_appid
VITE_XUNFEI_API_SECRET=your_api_secret
VITE_XUNFEI_API_KEY=your_api_key
```

### 1.4 配额说明

免费版配额：
- 每日调用量: 500 次
- 并发数: 2

⚠️ 生产环境建议升级到付费版（¥0.003/次）

### 1.5 集成示例

参考 [语音服务实现文档](./SPEECH_SERVICE.md)

---

## 2. 高德地图 API

### 2.1 注册与创建应用

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并登录控制台
3. 进入"应用管理" → "我的应用" → "创建新应用"
   - **应用名称**: AI旅行规划师
   - **应用类型**: Web端(JS API)

### 2.2 添加 Key

1. 点击"添加Key"
2. 配置：
   - **Key名称**: Web端开发
   - **服务平台**: Web端(JS API)
   - **绑定域名**: 
     - 开发: `localhost` 或 `127.0.0.1`
     - 生产: `yourdomain.com`

### 2.3 获取凭证

复制生成的 Key 和安全密钥：

```bash
VITE_AMAP_KEY=your_amap_key
VITE_AMAP_SECRET=your_amap_secret  # 可选，用于服务端签名
```

### 2.4 配额说明

个人开发者免费配额：
- 每日调用量: 30万次
- 并发数: 300 QPS

### 2.5 集成到项目

在 `index.html` 中引入：

```html
<script type="text/javascript">
  window._AMapSecurityConfig = {
    securityJsCode: 'your_security_code',  // 可选
  }
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY&plugin=AMap.PlaceSearch,AMap.Geocoder,AMap.Driving"></script>
```

### 2.6 测试示例

参考 [地图服务实现文档](./MAP_SERVICE.md)

---

## 3. 阿里云百炼平台

### 3.1 开通服务

1. 访问 [阿里云百炼](https://bailian.console.aliyun.com/)
2. 登录阿里云账号（需完成实名认证）
3. 开通"模型服务灵积 DashScope"
4. 选择通义千问系列模型

### 3.2 获取 API Key

1. 进入控制台
2. 点击"API-KEY管理"
3. 创建新的 API Key
4. 复制保存（仅显示一次）

```bash
VITE_BAILIAN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

### 3.3 模型选择

| 模型 | 特点 | 价格 | 推荐场景 |
|------|------|------|---------|
| qwen-turbo | 快速响应 | ¥0.002/1k tokens | 开发测试 |
| qwen-plus | 平衡性能 | ¥0.004/1k tokens | 生产环境 |
| qwen-max | 最高质量 | ¥0.02/1k tokens | 复杂规划 |
| qwen-long | 长文本 | ¥0.0005/1k tokens | 大量数据处理 |

**推荐**: 生产环境使用 `qwen-plus`，开发测试使用 `qwen-turbo`

### 3.4 配额说明

按量计费，新用户赠送：
- 免费额度: 100万 tokens（约可生成 200+ 行程）
- 有效期: 3个月

### 3.5 API 调用示例

参考 [LLM 服务实现文档](./LLM_SERVICE.md) 和 [Prompt 模板文档](./PROMPTS.md)

---

## 4. API 费用预估

### 4.1 单次行程生成成本

假设生成一个5天行程：

| 服务 | 用量 | 单价 | 费用 |
|------|------|------|------|
| 百炼(行程生成) | ~5k tokens | ¥0.004/1k | ¥0.02 |
| 百炼(预算分析) | ~2k tokens | ¥0.004/1k | ¥0.008 |
| 讯飞(语音识别) | 2次 | ¥0.003/次 | ¥0.006 |
| 高德地图(POI) | 10次 | 免费 | ¥0 |
| **总计** | | | **¥0.034** |

### 4.2 月度预算估算（1000用户）

假设每用户每月创建 2 个行程：

| 项目 | 数量 | 单价 | 月费用 |
|------|------|------|--------|
| 行程生成 | 2000次 | ¥0.034 | ¥68 |
| Supabase | 1GB存储 | 免费版 | ¥0 |
| 域名+CDN | - | - | ¥50 |
| **总计** | | | **¥118** |

---

## 5. 安全最佳实践

### 5.1 API Key 保护

❌ **错误做法**:
```typescript
// 直接在前端暴露 service_role key
const key = 'sk-xxxxx'
```

✅ **正确做法**:
```typescript
// 使用环境变量
const key = import.meta.env.VITE_BAILIAN_API_KEY

// 敏感操作放在服务端
// 使用 Supabase Edge Functions
```

### 5.2 请求限流

```typescript
// 实现简单的请求限流
class RateLimiter {
  private requests: number[] = []
  private limit = 10 // 每分钟10次
  
  async checkLimit(): Promise<boolean> {
    const now = Date.now()
    this.requests = this.requests.filter(t => now - t < 60000)
    
    if (this.requests.length >= this.limit) {
      throw new Error('请求过于频繁，请稍后再试')
    }
    
    this.requests.push(now)
    return true
  }
}
```

### 5.3 错误处理

```typescript
async function callAPI() {
  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    // 记录错误
    console.error('API调用失败:', error)
    
    // 用户友好提示
    throw new Error('服务暂时不可用，请稍后重试')
  }
}
```

---

## 6. 测试检查清单

### 6.1 科大讯飞测试

- [ ] 麦克风权限正常获取
- [ ] WebSocket 连接成功
- [ ] 语音实时转文字
- [ ] 中文识别准确率 > 85%
- [ ] 英文识别准确率 > 80%
- [ ] 噪音环境下可用

### 6.2 高德地图测试

- [ ] 地图正常显示
- [ ] POI 搜索返回结果
- [ ] 地理编码正确
- [ ] 路径规划可用
- [ ] 标记点击事件触发
- [ ] 移动端手势操作正常

### 6.3 阿里云百炼测试

- [ ] API 调用成功
- [ ] 返回 JSON 格式正确
- [ ] 行程内容完整合理
- [ ] 响应时间 < 30秒
- [ ] 错误处理正确
- [ ] Token 消耗在预期范围

---

## 7. 监控与日志

### 7.1 API 调用监控

```typescript
// src/utils/apiLogger.ts
export class APILogger {
  static log(service: string, action: string, duration: number, success: boolean) {
    console.log({
      timestamp: new Date().toISOString(),
      service,
      action,
      duration,
      success
    })
    
    // 可选：发送到监控服务
    // this.sendToMonitoring(...)
  }
}

// 使用
const start = Date.now()
try {
  const result = await llmService.generate()
  APILogger.log('bailian', 'generate', Date.now() - start, true)
} catch (error) {
  APILogger.log('bailian', 'generate', Date.now() - start, false)
}
```

### 7.2 错误追踪

集成 Sentry（可选）：

```bash
npm install @sentry/react
```

```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: import.meta.env.MODE,
})
```

---

## 8. 常见问题

### 8.1 科大讯飞 WebSocket 连接失败

**原因**: 鉴权参数错误

**解决**:
1. 检查 APPID、APIKey、APISecret 是否正确
2. 确认时间戳生成正确
3. 验证签名算法

### 8.2 高德地图 Key 无效

**原因**: 域名未绑定或配额超限

**解决**:
1. 在控制台检查 Key 绑定的域名
2. 查看 API 调用量统计
3. 确认服务是否启用

### 8.3 百炼 API 超时

**原因**: 请求内容过长或网络问题

**解决**:
1. 减少 Prompt 长度
2. 设置合理的超时时间（30-60秒）
3. 添加重试机制

---

## 9. 升级计划

### 9.1 何时升级付费版

**科大讯飞**:
- 日调用量 > 400次
- 需要更高并发

**高德地图**:
- 日调用量 > 20万次
- 需要更多服务（如实时路况）

**阿里云百炼**:
- 月调用量 > 25万次（约500个行程）
- 需要更快的模型

### 9.2 成本优化建议

1. **缓存策略**: 相同请求缓存结果
2. **批量处理**: 合并多个小请求
3. **异步处理**: 非关键功能使用队列
4. **降级方案**: 高峰期降低服务质量

---

## 10. 参考文档

- [科大讯飞 WebAPI 文档](https://www.xfyun.cn/doc/asr/voicedictation/API.html)
- [高德地图 JS API](https://lbs.amap.com/api/javascript-api/summary)
- [阿里云百炼文档](https://help.aliyun.com/zh/dashscope/)

---

**文档版本**: v1.0  
**维护人**: 开发团队  
**最后更新**: 2025-01-XX
