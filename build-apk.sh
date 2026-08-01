#!/bin/bash

# 私人电视直播 APP - APK 构建脚本
# 用法: ./build-apk.sh

set -e

echo "=========================================="
echo "私人电视直播 APP - APK 构建脚本"
echo "=========================================="

# 检查依赖
echo "检查依赖..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v java &> /dev/null; then
    echo "❌ Java 未安装"
    exit 1
fi

# 安装依赖
echo "📦 安装 npm 依赖..."
npm install

# 预构建 Android
echo "🔨 预构建 Android 项目..."
npx expo prebuild --platform android --clean --non-interactive

# 构建 APK
echo "🏗️ 构建 Release APK..."
cd android
chmod +x gradlew

# 设置 Android SDK 路径（如果需要）
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=$HOME/Android/Sdk
fi

# 构建
./gradlew assembleRelease --no-daemon

# 查找 APK 文件
APK_PATH=$(find . -name "app-release.apk" -type f | head -1)

if [ -z "$APK_PATH" ]; then
    echo "❌ APK 构建失败"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ APK 构建成功！"
echo "=========================================="
echo "APK 文件位置: $APK_PATH"
echo ""
echo "下一步："
echo "1. 将 APK 复制到安全位置"
echo "2. 上传到 GitHub Releases"
echo "3. 分享给用户下载"
echo ""
