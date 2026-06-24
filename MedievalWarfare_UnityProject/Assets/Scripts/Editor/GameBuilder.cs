#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace MedievalWarfare.EditorTools
{
    public static class GameBuilder
    {
        [MenuItem("中世纪战争/构建/Linux版本")]
        public static void BuildLinux()
        {
            string outputPath = "Build/Linux/MedievalWarfare";
            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = GetScenePaths(),
                locationPathName = outputPath,
                target = BuildTarget.StandaloneLinux64,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"构建成功！输出路径: {outputPath}");
                EditorUtility.DisplayDialog("构建成功",
                    $"Linux版本构建完成！\n输出路径: {outputPath}",
                    "好的");
            }
            else
            {
                Debug.LogError($"构建失败: {summary.result}");
            }
        }

        [MenuItem("中世纪战争/构建/Windows版本")]
        public static void BuildWindows()
        {
            string outputPath = "Build/Windows/MedievalWarfare.exe";
            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = GetScenePaths(),
                locationPathName = outputPath,
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"构建成功！输出路径: {outputPath}");
                EditorUtility.DisplayDialog("构建成功",
                    $"Windows版本构建完成！\n输出路径: {outputPath}",
                    "好的");
            }
            else
            {
                Debug.LogError($"构建失败: {summary.result}");
            }
        }

        [MenuItem("中世纪战争/构建/macOS版本")]
        public static void BuildMacOS()
        {
            string outputPath = "Build/macOS/MedievalWarfare.app";
            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = GetScenePaths(),
                locationPathName = outputPath,
                target = BuildTarget.StandaloneOSX,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"构建成功！输出路径: {outputPath}");
                EditorUtility.DisplayDialog("构建成功",
                    $"macOS版本构建完成！\n输出路径: {outputPath}",
                    "好的");
            }
            else
            {
                Debug.LogError($"构建失败: {summary.result}");
            }
        }

        private static string[] GetScenePaths()
        {
            return new string[]
            {
                "Assets/Scenes/MainMenu.unity",
                "Assets/Scenes/WorldMap.unity",
                "Assets/Scenes/BattleScene.unity"
            };
        }

        public static void BuildLinuxHeadless()
        {
            BuildLinux();
        }
    }
}
#endif
