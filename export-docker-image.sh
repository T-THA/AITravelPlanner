#!/bin/bash

# AI旅行规划师 - Docker镜像导出脚本
# 用于导出镜像文件并上传到GitHub Release

set -e

VERSION="v1.0.0"
IMAGE_NAME="ai-travel-planner"
TAR_FILE="${IMAGE_NAME}-${VERSION}.tar"
GZ_FILE="${TAR_FILE}.gz"

echo "=========================================="
echo "AI旅行规划师 - 镜像导出工具"
echo "=========================================="
echo ""

# 检查本地镜像
echo "1. 检查本地镜像..."
if ! docker images | grep -q "ai-travel-planner.*latest"; then
    echo "❌ 错误: 本地未找到 ai-travel-planner:latest 镜像"
    echo "请先构建镜像: docker build -t ai-travel-planner:latest ."
    exit 1
fi
echo "✅ 本地镜像已找到"
echo ""

# 导出镜像
echo "2. 导出Docker镜像..."
echo "这可能需要几分钟，请耐心等待..."
docker save ai-travel-planner:latest -o "${TAR_FILE}"
TAR_SIZE=$(du -h "${TAR_FILE}" | cut -f1)
echo "✅ 导出完成: ${TAR_FILE} (${TAR_SIZE})"
echo ""

# 压缩文件
echo "3. 压缩镜像文件..."
echo "使用gzip最高压缩率压缩..."
if [ -f "${GZ_FILE}" ]; then
    echo "警告: ${GZ_FILE} 已存在，将被覆盖"
    rm "${GZ_FILE}"
fi
gzip -9 "${TAR_FILE}"
GZ_SIZE=$(du -h "${GZ_FILE}" | cut -f1)
echo "✅ 压缩完成: ${GZ_FILE} (${GZ_SIZE})"
echo ""

# 计算校验和
echo "4. 计算SHA256校验和..."
if command -v sha256sum &> /dev/null; then
    CHECKSUM=$(sha256sum "${GZ_FILE}" | cut -d' ' -f1)
    echo "✅ SHA256: ${CHECKSUM}"
elif command -v shasum &> /dev/null; then
    CHECKSUM=$(shasum -a 256 "${GZ_FILE}" | cut -d' ' -f1)
    echo "✅ SHA256: ${CHECKSUM}"
else
    echo "⚠️  警告: 未找到sha256sum或shasum命令，无法计算校验和"
    echo "   Windows用户可以使用PowerShell:"
    echo "   Get-FileHash ${GZ_FILE} -Algorithm SHA256"
    CHECKSUM="请手动计算"
fi
echo ""

# 显示文件信息
echo "=========================================="
echo "导出完成!"
echo "=========================================="
echo ""
echo "文件信息:"
echo "  文件名: ${GZ_FILE}"
echo "  大小: ${GZ_SIZE}"
echo "  SHA256: ${CHECKSUM}"
echo ""
echo "下一步操作:"
echo "  1. 在GitHub仓库创建新的Release (${VERSION})"
echo "  2. 上传文件: ${GZ_FILE}"
echo "  3. 在Release描述中添加SHA256校验和"
echo "  4. 参考 RELEASE_NOTES.md 填写Release说明"
echo ""
echo "验证文件完整性命令:"
echo "  echo \"${CHECKSUM}  ${GZ_FILE}\" | sha256sum -c"
echo ""
echo "助教使用步骤:"
echo "  1. 下载: ${GZ_FILE}"
echo "  2. 解压: gunzip ${GZ_FILE}"
echo "  3. 加载: docker load -i ${TAR_FILE}"
echo "  4. 运行: docker run -d --name ai-travel-planner -p 3000:80 --env-file env.list ai-travel-planner:latest"
echo ""
echo "=========================================="
