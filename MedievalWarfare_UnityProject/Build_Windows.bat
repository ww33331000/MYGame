@echo off
chcp 65001 >nul
echo ====================================
echo   中世纪战争 - 一键构建脚本 (Windows)
echo ====================================
echo.

set UNITY_PATH="C:\Program Files\Unity\Hub\Editor\2022.3.50f1\Editor\Unity.exe"
set PROJECT_PATH=%~dp0

if not exist %UNITY_PATH% (
    echo [错误] 未找到 Unity 编辑器
    echo 请修改脚本中的 UNITY_PATH 为你的 Unity 安装路径
    echo 通常在: C:\Program Files\Unity\Hub\Editor\版本号\Editor\Unity.exe
    echo.
    pause
    exit /b 1
)

echo 项目路径: %PROJECT_PATH%
echo.
echo 请选择构建目标:
echo   1. Windows (推荐)
echo   2. WebGL (浏览器直接运行)
echo   3. Linux
echo   4. 仅生成场景
echo.
set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" goto build_windows
if "%choice%"=="2" goto build_webgl
if "%choice%"=="3" goto build_linux
if "%choice%"=="4" goto generate_scenes

echo 无效选项
pause
exit /b 1

:generate_scenes
echo.
echo [1/2] 生成所有场景...
%UNITY_PATH% -batchmode -quit -projectPath "%PROJECT_PATH%" -executeMethod MedievalWarfare.EditorTools.GameSceneGenerator.GenerateAllScenes -logFile build_log.txt
if %errorlevel% neq 0 (
    echo [错误] 场景生成失败，请查看 build_log.txt
    pause
    exit /b 1
)
echo [2/2] 场景生成完成！
echo.
echo 场景已生成在 Assets/Scenes/ 目录下
echo 你可以用 Unity 打开项目，点击 Play 按钮运行
echo.
pause
exit /b 0

:build_windows
echo.
echo [1/3] 生成所有场景...
%UNITY_PATH% -batchmode -quit -projectPath "%PROJECT_PATH%" -executeMethod MedievalWarfare.EditorTools.GameSceneGenerator.GenerateAllScenes -logFile build_log.txt
if %errorlevel% neq 0 (
    echo [错误] 场景生成失败，请查看 build_log.txt
    pause
    exit /b 1
)

echo [2/3] 构建 Windows 版本...
%UNITY_PATH% -batchmode -quit -projectPath "%PROJECT_PATH%" -buildWindows64Player "Build/Windows/MedievalWarfare.exe" -logFile build_log.txt
if %errorlevel% neq 0 (
    echo [错误] 构建失败，请查看 build_log.txt
    pause
    exit /b 1
)

echo [3/3] 构建完成！
echo.
echo 输出路径: Build/Windows/MedievalWarfare.exe
echo 双击即可运行游戏
echo.
pause
exit /b 0

:build_webgl
echo.
echo [1/3] 生成所有场景...
%UNITY_PATH% -batchmode -quit -projectPath "%PROJECT_PATH%" -executeMethod MedievalWarfare.EditorTools.GameSceneGenerator.GenerateAllScenes -logFile build_log.txt
if %errorlevel% neq 0 (
    echo [错误] 场景生成失败，请查看 build_log.txt
    pause
    exit /b 1
)

echo [2/3] 构建 WebGL 版本...
%UNITY_PATH% -batchmode -quit -projectPath "%PROJECT_PATH%" -buildTarget WebGL -executeMethod MedievalWarfare.EditorTools.GameBuilder.BuildWebGL -logFile build_log.txt
if %errorlevel% neq 0 (
    echo [错误] 构建失败，请查看 build_log.txt
    pause
    exit /b 1
)

echo [3/3] 构建完成！
echo.
echo 输出路径: Build/WebGL/
echo 使用方法: 用浏览器打开 Build/WebGL/index.html
echo 注意: WebGL 需要通过本地服务器运行，不能直接双击打开
echo       可以使用: python -m http.server 8080
echo.
pause
exit /b 0

:build_linux
echo.
echo [1/3] 生成所有场景...
%UNITY_PATH% -batchmode -quit -projectPath "%PROJECT_PATH%" -executeMethod MedievalWarfare.EditorTools.GameSceneGenerator.GenerateAllScenes -logFile build_log.txt
if %errorlevel% neq 0 (
    echo [错误] 场景生成失败，请查看 build_log.txt
    pause
    exit /b 1
)

echo [2/3] 构建 Linux 版本...
%UNITY_PATH% -batchmode -quit -projectPath "%PROJECT_PATH%" -buildTarget Linux64Player "Build/Linux/MedievalWarfare" -logFile build_log.txt
if %errorlevel% neq 0 (
    echo [错误] 构建失败，请查看 build_log.txt
    pause
    exit /b 1
)

echo [3/3] 构建完成！
echo.
echo 输出路径: Build/Linux/MedievalWarfare
echo 运行: chmod +x MedievalWarfare && ./MedievalWarfare
echo.
pause
exit /b 0
