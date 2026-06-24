#!/bin/bash
echo "===================================="
echo "  中世纪战争 - 一键构建脚本 (Mac/Linux)"
echo "===================================="
echo ""

# Unity 路径（请根据实际情况修改）
UNITY_PATH="/Applications/Unity/Hub/Editor/2022.3.50f1/Unity.app/Contents/MacOS/Unity"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    UNITY_PATH="~/Unity/Hub/Editor/2022.3.50f1/Editor/Unity"
fi

PROJECT_PATH="$(cd "$(dirname "$0")" && pwd)"

if [ ! -f "$UNITY_PATH" ]; then
    echo "[错误] 未找到 Unity 编辑器: $UNITY_PATH"
    echo "请修改脚本中的 UNITY_PATH 为你的 Unity 安装路径"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

echo "项目路径: $PROJECT_PATH"
echo ""
echo "请选择构建目标:"
echo "  1. Windows"
echo "  2. WebGL (浏览器直接运行，推荐)"
echo "  3. macOS"
echo "  4. Linux"
echo "  5. 仅生成场景"
echo ""
read -p "请输入选项 (1-5): " choice

generate_scenes() {
    echo ""
    echo "[1/2] 生成所有场景..."
    "$UNITY_PATH" -batchmode -quit -projectPath "$PROJECT_PATH" \
        -executeMethod MedievalWarfare.EditorTools.GameSceneGenerator.GenerateAllScenes \
        -logFile build_log.txt
    if [ $? -ne 0 ]; then
        echo "[错误] 场景生成失败，请查看 build_log.txt"
        read -p "按回车键退出..."
        exit 1
    fi
    echo "[2/2] 场景生成完成！"
}

build_webgl() {
    generate_scenes
    echo ""
    echo "[2/3] 构建 WebGL 版本..."
    "$UNITY_PATH" -batchmode -quit -projectPath "$PROJECT_PATH" \
        -buildTarget WebGL \
        -executeMethod MedievalWarfare.EditorTools.GameBuilder.BuildWebGL \
        -logFile build_log.txt
    if [ $? -ne 0 ]; then
        echo "[错误] 构建失败，请查看 build_log.txt"
        read -p "按回车键退出..."
        exit 1
    fi
    echo ""
    echo "构建完成！输出路径: Build/WebGL/"
    echo ""
    echo "运行方式:"
    echo "  cd Build/WebGL"
    echo "  python3 -m http.server 8080"
    echo "  浏览器访问 http://localhost:8080"
}

case $choice in
    1)
        generate_scenes
        echo ""
        echo "[2/3] 构建 Windows 版本..."
        "$UNITY_PATH" -batchmode -quit -projectPath "$PROJECT_PATH" \
            -buildWindows64Player "Build/Windows/MedievalWarfare.exe" \
            -logFile build_log.txt
        echo "[3/3] 构建完成！输出路径: Build/Windows/"
        ;;
    2)
        build_webgl
        ;;
    3)
        generate_scenes
        echo ""
        echo "[2/3] 构建 macOS 版本..."
        "$UNITY_PATH" -batchmode -quit -projectPath "$PROJECT_PATH" \
            -buildOSXUniversalPlayer "Build/MacOS/MedievalWarfare.app" \
            -logFile build_log.txt
        echo "[3/3] 构建完成！输出路径: Build/MacOS/"
        ;;
    4)
        generate_scenes
        echo ""
        echo "[2/3] 构建 Linux 版本..."
        "$UNITY_PATH" -batchmode -quit -projectPath "$PROJECT_PATH" \
            -buildLinux64Player "Build/Linux/MedievalWarfare" \
            -logFile build_log.txt
        echo "[3/3] 构建完成！输出路径: Build/Linux/"
        ;;
    5)
        generate_scenes
        echo ""
        echo "场景已生成在 Assets/Scenes/ 目录下"
        echo "你可以用 Unity 打开项目，点击 Play 按钮运行"
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo ""
read -p "按回车键退出..."
