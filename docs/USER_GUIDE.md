# AI旅行规划师 - 用户使用手册

> 本手册面向助教和最终用户,详细说明如何从Docker Hub下载镜像并成功运行应用

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
- [功能使用指南](#功能使用指南)
- [故障排除](#故障排除)
- [API配额说明](#api配额说明)

---

## 🖥️ 系统要求

### 必需环境
- **Docker**: 版本 20.10 或更高
- **操作系统**: Windows 10/11, macOS, Linux
- **内存**: 至少 2GB 可用内存
- **磁盘空间**: 至少 1GB 可用空间
- **网络**: 需要互联网连接访问第三方API

### 检查Docker安装
```bash
docker --version
# 应显示: Docker version 20.10.x 或更高

---
## 🚀 快速开始
一键运行命令
```bash
docker run -d \
  --name ai-travel-planner \
  -p 3000:80 \
  -e VITE_DASHSCOPE_API_KEY=sk-你的通义千问Key \
  -e VITE_IFLYTEK_APP_ID=你的讯飞AppID \
  -e VITE_IFLYTEK_API_KEY=你的讯飞APIKey \
  -e VITE_IFLYTEK_API_SECRET=你的讯飞APISecret \
  -e VITE_AMAP_KEY=你的高德地图Key \
  -e VITE_SUPABASE_URL=你的SupabaseURL \
  -e VITE_SUPABASE_ANON_KEY=你的SupabaseAnonKey \
  ttha/ai-travel-planner:latest
```