#!/bin/bash

# AI旅行规划师 - 阿里云镜像仓库推送脚本
# 使用说明: 
#   1. 替换下方的 YOUR_ALIYUN_USERNAME 和 YOUR_NAMESPACE
#   2. 运行: bash push-to-aliyun.sh

set -e

# ===== 配置区域 =====
ALIYUN_USERNAME="YOUR_ALIYUN_USERNAME"  # 替换为您的阿里云账号
NAMESPACE="YOUR_NAMESPACE"               # 替换为您的命名空间
REGION="cn-hangzhou"                     # 阿里云区域（可选：cn-beijing, cn-shanghai等）
IMAGE_NAME="ai-travel-planner"
VERSION="v1.0.0"
# ===================

REGISTRY="registry.${REGION}.aliyuncs.com"
FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}"

echo "=========================================="
echo "AI旅行规划师 - 阿里云镜像推送"
echo "=========================================="
echo ""
echo "配置信息:"
echo "  Registry: ${REGISTRY}"
echo "  Namespace: ${NAMESPACE}"
echo "  Image: ${IMAGE_NAME}"
echo "  Version: ${VERSION}"
echo ""

# 检查本地镜像是否存在
echo "1. 检查本地镜像..."
if ! docker images | grep -q "ai-travel-planner.*latest"; then
    echo "❌ 错误: 本地未找到 ai-travel-planner:latest 镜像"
    echo "请先构建镜像: docker build -t ai-travel-planner:latest ."
    exit 1
fi
echo "✅ 本地镜像已找到"
echo ""

# 登录阿里云
echo "2. 登录阿里云镜像仓库..."
echo "提示: 请输入您的阿里云密码或访问凭证"
if ! docker login --username="${ALIYUN_USERNAME}" "${REGISTRY}"; then
    echo "❌ 登录失败"
    exit 1
fi
echo "✅ 登录成功"
echo ""

# 打标签
echo "3. 为镜像打标签..."
docker tag ai-travel-planner:latest "${FULL_IMAGE}:latest"
docker tag ai-travel-planner:latest "${FULL_IMAGE}:${VERSION}"
echo "✅ 标签已创建:"
echo "   - ${FULL_IMAGE}:latest"
echo "   - ${FULL_IMAGE}:${VERSION}"
echo ""

# 推送镜像
echo "4. 推送镜像到阿里云..."
echo ""
echo "推送 latest 版本..."
docker push "${FULL_IMAGE}:latest"
echo ""
echo "推送 ${VERSION} 版本..."
docker push "${FULL_IMAGE}:${VERSION}"
echo ""
echo "✅ 镜像推送完成!"
echo ""

# 显示拉取命令
echo "=========================================="
echo "部署信息"
echo "=========================================="
echo ""
echo "助教可以使用以下命令拉取镜像："
echo ""
echo "  docker pull ${FULL_IMAGE}:latest"
echo ""
echo "或指定版本："
echo ""
echo "  docker pull ${FULL_IMAGE}:${VERSION}"
echo ""
echo "运行容器命令："
echo ""
echo "  docker run -d \\"
echo "    --name ai-travel-planner \\"
echo "    -p 3000:80 \\"
echo "    --env-file env.list \\"
echo "    ${FULL_IMAGE}:latest"
echo ""
echo "=========================================="
echo "✅ 完成!"
echo "=========================================="
