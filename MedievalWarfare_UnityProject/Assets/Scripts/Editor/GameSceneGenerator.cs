#if UNITY_EDITOR
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using System.IO;
using MedievalWarfare.Character;
using MedievalWarfare.Combat;
using MedievalWarfare.Map;
using MedievalWarfare.UI;
using MedievalWarfare.Management;
using MedievalWarfare.Core;

namespace MedievalWarfare.EditorTools
{
    public static class GameSceneGenerator
    {
        private const string ScenesPath = "Assets/Scenes";
        private const string MainMenuScene = "MainMenu";
        private const string WorldMapScene = "WorldMap";
        private const string BattleScene = "BattleScene";

        [MenuItem("中世纪战争/一键生成所有场景")]
        public static void GenerateAllScenes()
        {
            if (!Directory.Exists(ScenesPath))
            {
                Directory.CreateDirectory(ScenesPath);
            }

            GenerateMainMenuScene();
            GenerateWorldMapScene();
            GenerateBattleScene();

            AddScenesToBuild();
            AssetDatabase.Refresh();

            EditorUtility.DisplayDialog("生成完成",
                "所有场景已生成！\n\n按以下顺序体验游戏：\n1. 打开 Scenes/MainMenu.unity 并点击运行\n\n" +
                "操作说明：\n战斗模式: WASD移动 | 鼠标左键攻击 | 鼠标右键防御 | ESC暂停\n" +
                "大地图模式: WASD移动视角 | 点击相邻节点旅行",
                "好的");
        }

        [MenuItem("中世纪战争/生成主菜单场景")]
        public static void GenerateMainMenuScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            CreateMainMenuCamera();
            CreateMainMenuCanvas();
            CreateGameManager();

            string scenePath = $"{ScenesPath}/{MainMenuScene}.unity";
            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log($"主菜单场景已生成: {scenePath}");
        }

        [MenuItem("中世纪战争/生成大地图场景")]
        public static void GenerateWorldMapScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            CreateWorldMapGround();
            CreateWorldMapCamera();
            CreateMapNodes();
            CreatePlayerMarker();
            CreateWorldMapUI();
            CreateWorldMapManager();
            CreateGameManager();
            CreateEventSystem();

            string scenePath = $"{ScenesPath}/{WorldMapScene}.unity";
            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log($"大地图场景已生成: {scenePath}");
        }

        [MenuItem("中世纪战争/生成战斗场景")]
        public static void GenerateBattleScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            CreateBattleGround();
            CreateBattleProps();
            CreateBattleCamera();
            CreateBattleSpawnPoints();
            CreateBattleUI();
            CreateBattleManager();
            CreateGameManager();
            CreateEventSystem();

            string scenePath = $"{ScenesPath}/{BattleScene}.unity";
            EditorSceneManager.SaveScene(scene, scenePath);
            Debug.Log($"战斗场景已生成: {scenePath}");
        }

        private static void AddScenesToBuild()
        {
            EditorBuildSettingsScene[] scenes = new EditorBuildSettingsScene[]
            {
                new EditorBuildSettingsScene($"{ScenesPath}/{MainMenuScene}.unity", true),
                new EditorBuildSettingsScene($"{ScenesPath}/{WorldMapScene}.unity", true),
                new EditorBuildSettingsScene($"{ScenesPath}/{BattleScene}.unity", true)
            };
            EditorBuildSettings.scenes = scenes;
        }

        #region 主菜单场景
        private static void CreateMainMenuCamera()
        {
            GameObject camObj = new GameObject("Main Camera");
            camObj.tag = "MainCamera";
            Camera cam = camObj.AddComponent<Camera>();
            cam.backgroundColor = new Color(0.1f, 0.1f, 0.15f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.fieldOfView = 60f;
            camObj.AddComponent<AudioListener>();
        }

        private static void CreateMainMenuCanvas()
        {
            GameObject canvasObj = new GameObject("Canvas");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 0;

            CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            canvasObj.AddComponent<GraphicRaycaster>();

            MainMenuUI menuUI = canvasObj.AddComponent<MainMenuUI>();

            GameObject mainPanel = CreateUIObject("MainPanel", canvasObj.transform);
            RectTransform panelRect = mainPanel.GetComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(0.5f, 0.5f);
            panelRect.anchorMax = new Vector2(0.5f, 0.5f);
            panelRect.pivot = new Vector2(0.5f, 0.5f);
            panelRect.sizeDelta = new Vector2(280f, 320f);

            GameObject titleObj = CreateUIObject("Title", canvasObj.transform);
            RectTransform titleRect = titleObj.GetComponent<RectTransform>();
            titleRect.anchorMin = new Vector2(0.5f, 1f);
            titleRect.anchorMax = new Vector2(0.5f, 1f);
            titleRect.pivot = new Vector2(0.5f, 1f);
            titleRect.anchoredPosition = new Vector2(0, -80f);
            titleRect.sizeDelta = new Vector2(600f, 100f);

            Text titleText = titleObj.AddComponent<Text>();
            titleText.text = "中世纪战争";
            titleText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            titleText.fontSize = 64;
            titleText.alignment = TextAnchor.MiddleCenter;
            titleText.color = Color.white;

            GameObject subtitleObj = CreateUIObject("Subtitle", titleObj.transform);
            RectTransform subRect = subtitleObj.GetComponent<RectTransform>();
            subRect.anchorMin = new Vector2(0.5f, 0f);
            subRect.anchorMax = new Vector2(0.5f, 0f);
            subRect.pivot = new Vector2(0.5f, 1f);
            subRect.anchoredPosition = new Vector2(0, -5f);
            subRect.sizeDelta = new Vector2(400f, 30f);

            Text subText = subtitleObj.AddComponent<Text>();
            subText.text = "Medieval Warfare";
            subText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            subText.fontSize = 24;
            subText.alignment = TextAnchor.MiddleCenter;
            subText.color = new Color(0.7f, 0.7f, 0.7f);

            string[] buttonNames = { "开始游戏", "继续游戏", "设置", "退出游戏" };
            string[] buttonInternalNames = { "StartButton", "ContinueButton", "OptionsButton", "QuitButton" };

            for (int i = 0; i < buttonNames.Length; i++)
            {
                GameObject btn = CreateButton(buttonInternalNames[i], mainPanel.transform,
                    buttonNames[i], new Vector2(200f, 50f),
                    new Vector2(0.5f, 1f), new Vector2(0, -(20f + i * 65f)));
            }

            GameObject footerObj = CreateUIObject("Footer", canvasObj.transform);
            RectTransform footerRect = footerObj.GetComponent<RectTransform>();
            footerRect.anchorMin = new Vector2(0f, 0f);
            footerRect.anchorMax = new Vector2(1f, 0f);
            footerRect.pivot = new Vector2(0.5f, 0f);
            footerRect.sizeDelta = new Vector2(0f, 50f);

            Text footerText = footerObj.AddComponent<Text>();
            footerText.text = "操作说明: WASD移动 | 鼠标左键攻击 | 鼠标右键防御 | ESC暂停";
            footerText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            footerText.fontSize = 16;
            footerText.alignment = TextAnchor.MiddleCenter;
            footerText.color = new Color(0.5f, 0.5f, 0.5f);

            SetPrivateField(menuUI, "mainPanel", mainPanel);
            SetPrivateField(menuUI, "startButton", mainPanel.transform.Find("StartButton").GetComponent<Button>());
            SetPrivateField(menuUI, "continueButton", mainPanel.transform.Find("ContinueButton").GetComponent<Button>());
            SetPrivateField(menuUI, "optionsButton", mainPanel.transform.Find("OptionsButton").GetComponent<Button>());
            SetPrivateField(menuUI, "quitButton", mainPanel.transform.Find("QuitButton").GetComponent<Button>());
        }

        private static void CreateEventSystem()
        {
            GameObject eventSystem = new GameObject("EventSystem");
            eventSystem.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystem.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }
        #endregion

        #region 大地图场景
        private static void CreateWorldMapGround()
        {
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "MapGround";
            ground.transform.localScale = new Vector3(20f, 1f, 15f);
            ground.transform.position = Vector3.zero;
            Renderer groundRenderer = ground.GetComponent<Renderer>();
            groundRenderer.sharedMaterial.color = new Color(0.5f, 0.55f, 0.4f);

            CreateMapProp("Mountain_1", PrimitiveType.Sphere, new Vector3(-60f, 5f, 40f), new Vector3(15f, 10f, 15f), Color.gray);
            CreateMapProp("Mountain_2", PrimitiveType.Sphere, new Vector3(50f, 4f, -50f), new Vector3(12f, 8f, 12f), Color.gray);
            CreateMapProp("Forest_1", PrimitiveType.Cube, new Vector3(-40f, 1f, -30f), new Vector3(20f, 2f, 25f), new Color(0.2f, 0.4f, 0.2f));
            CreateMapProp("Forest_2", PrimitiveType.Cube, new Vector3(30f, 1f, 30f), new Vector3(18f, 2f, 20f), new Color(0.2f, 0.4f, 0.2f));
            CreateMapProp("River", PrimitiveType.Cube, new Vector3(0f, 0.6f, 0f), new Vector3(200f, 0.5f, 8f), new Color(0.2f, 0.4f, 0.7f));
        }

        private static void CreateMapProp(string name, PrimitiveType type, Vector3 pos, Vector3 scale, Color color)
        {
            GameObject prop = GameObject.CreatePrimitive(type);
            prop.name = name;
            prop.transform.position = pos;
            prop.transform.localScale = scale;
            prop.GetComponent<Renderer>().sharedMaterial.color = color;
        }

        private static void CreateWorldMapCamera()
        {
            GameObject camObj = new GameObject("Main Camera");
            camObj.tag = "MainCamera";
            Camera cam = camObj.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 60f;
            cam.backgroundColor = new Color(0.3f, 0.35f, 0.25f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            camObj.transform.position = new Vector3(0f, 80f, 0f);
            camObj.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
            camObj.AddComponent<AudioListener>();
            camObj.AddComponent<WorldMapCamera>();
        }

        private static void CreateMapNodes()
        {
            MapNode[] nodes = new MapNode[8];

            nodes[0] = CreateMapNode("斯瓦迪亚城堡", NodeType.Castle, new Vector3(-70f, 3f, -50f), Color.blue, 3f, true, 5, 1.2f, 1.1f,
                "斯瓦迪亚王国的边境城堡，驻扎着精锐骑士部队。");
            nodes[1] = CreateMapNode("帕拉汶村", NodeType.Village, new Vector3(-30f, 2f, -40f), Color.yellow, 2f, false, 0, 1f, 1f,
                "安静的小村庄，村民们过着平和的生活。");
            nodes[2] = CreateMapNode("绿林强盗营地", NodeType.BanditLair, new Vector3(-20f, 2.5f, 10f), Color.red, 2.5f, true, 3, 0.9f, 1f,
                "盘踞在森林边缘的强盗营地，危险但战利品丰厚。");
            nodes[3] = CreateMapNode("日瓦丁镇", NodeType.Town, new Vector3(20f, 3.5f, -20f), Color.cyan, 3.5f, false, 0, 1f, 1f,
                "繁华的商业城镇，各种交易在此进行。");
            nodes[4] = CreateMapNode("库吉特前哨", NodeType.EnemyCamp, new Vector3(60f, 3f, 10f), Color.magenta, 3f, true, 4, 1.1f, 1.2f,
                "库吉特汗国的前沿哨站，骑兵机动性极强。");
            nodes[5] = CreateMapNode("罗多克要塞", NodeType.Castle, new Vector3(50f, 3f, 50f), Color.green, 3f, true, 6, 1.3f, 1f,
                "罗多克王国的山地要塞，易守难攻。");
            nodes[6] = CreateMapNode("维基亚村庄", NodeType.Village, new Vector3(0f, 2f, 60f), Color.yellow, 2f, false, 0, 1f, 1f,
                "雪原上的小村落，以狩猎为生。");
            nodes[7] = CreateMapNode("起始据点", NodeType.StartingPoint, new Vector3(-60f, 2.5f, -20f), Color.white, 2.5f, false, 0, 1f, 1f,
                "你的冒险从这里开始。");

            ConnectMapNodes(nodes, 7, 1);
            ConnectMapNodes(nodes, 7, 0);
            ConnectMapNodes(nodes, 0, 1);
            ConnectMapNodes(nodes, 1, 2);
            ConnectMapNodes(nodes, 1, 3);
            ConnectMapNodes(nodes, 2, 3);
            ConnectMapNodes(nodes, 2, 6);
            ConnectMapNodes(nodes, 3, 4);
            ConnectMapNodes(nodes, 3, 6);
            ConnectMapNodes(nodes, 4, 5);
            ConnectMapNodes(nodes, 4, 6);
            ConnectMapNodes(nodes, 5, 6);
        }

        private static MapNode CreateMapNode(string name, NodeType type, Vector3 position, Color color, float radius,
            bool hasEnemy, int enemyCount, float healthMult, float damageMult, string description)
        {
            GameObject nodeObj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            nodeObj.name = $"MapNode_{name}";
            nodeObj.transform.position = position;
            nodeObj.transform.localScale = Vector3.one * radius * 2f;
            nodeObj.GetComponent<Renderer>().sharedMaterial.color = color;

            MapNode node = nodeObj.AddComponent<MapNode>();

            SetPrivateField(node, "nodeName", name);
            SetPrivateField(node, "nodeType", type);
            SetPrivateField(node, "nodeColor", color);
            SetPrivateField(node, "nodeRadius", radius);
            SetPrivateField(node, "hasEnemy", hasEnemy);
            SetPrivateField(node, "enemyCount", enemyCount);
            SetPrivateField(node, "enemyHealthMultiplier", healthMult);
            SetPrivateField(node, "enemyDamageMultiplier", damageMult);
            SetPrivateField(node, "description", description);

            return node;
        }

        private static void ConnectMapNodes(MapNode[] nodes, int a, int b)
        {
            MapNode nodeA = nodes[a];
            MapNode nodeB = nodes[b];
            if (nodeA == null || nodeB == null) return;

            MapNode[] aConns = nodeA.ConnectedNodes ?? new MapNode[0];
            MapNode[] bConns = nodeB.ConnectedNodes ?? new MapNode[0];

            System.Array.Resize(ref aConns, aConns.Length + 1);
            System.Array.Resize(ref bConns, bConns.Length + 1);
            aConns[aConns.Length - 1] = nodeB;
            bConns[bConns.Length - 1] = nodeA;

            SetPrivateField(nodeA, "connectedNodes", aConns);
            SetPrivateField(nodeB, "connectedNodes", bConns);

            DrawConnectionLine(nodeA.transform.position, nodeB.transform.position);
        }

        private static void DrawConnectionLine(Vector3 a, Vector3 b)
        {
            GameObject lineObj = new GameObject("Connection");
            LineRenderer line = lineObj.AddComponent<LineRenderer>();
            line.material = new Material(Shader.Find("Sprites/Default"));
            line.startColor = new Color(1f, 1f, 1f, 0.5f);
            line.endColor = new Color(1f, 1f, 1f, 0.5f);
            line.startWidth = 0.5f;
            line.endWidth = 0.5f;
            line.positionCount = 2;
            line.SetPosition(0, a);
            line.SetPosition(1, b);
        }

        private static void CreatePlayerMarker()
        {
            GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            marker.name = "PlayerMarker";
            marker.transform.localScale = new Vector3(1.5f, 2f, 1.5f);
            marker.GetComponent<Renderer>().sharedMaterial.color = Color.yellow;
            Object.DestroyImmediate(marker.GetComponent<Collider>());
        }

        private static void CreateWorldMapUI()
        {
            GameObject canvasObj = new GameObject("UI_Canvas");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasObj.AddComponent<GraphicRaycaster>();

            WorldMapUI ui = canvasObj.AddComponent<WorldMapUI>();

            GameObject infoPanel = CreateUIObject("InfoPanel", canvasObj.transform);
            RectTransform panelRect = infoPanel.GetComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(1f, 1f);
            panelRect.anchorMax = new Vector2(1f, 1f);
            panelRect.pivot = new Vector2(1f, 1f);
            panelRect.anchoredPosition = new Vector2(-20f, -20f);
            panelRect.sizeDelta = new Vector2(300f, 250f);

            Image panelImg = infoPanel.AddComponent<Image>();
            panelImg.color = new Color(0.15f, 0.12f, 0.1f, 0.9f);

            Text nodeNameText = CreateUIText("NodeNameText", infoPanel.transform, "地点名称", 22, TextAnchor.UpperLeft,
                new Vector2(15f, -15f), new Vector2(270f, 30f));
            Text nodeTypeText = CreateUIText("NodeTypeText", infoPanel.transform, "类型", 16, TextAnchor.UpperLeft,
                new Vector2(15f, -50f), new Vector2(270f, 25f));
            Text nodeDescText = CreateUIText("NodeDescText", infoPanel.transform, "描述...", 14, TextAnchor.UpperLeft,
                new Vector2(15f, -80f), new Vector2(270f, 80f));
            Text nodeStatusText = CreateUIText("NodeStatusText", infoPanel.transform, "状态", 16, TextAnchor.UpperLeft,
                new Vector2(15f, -165f), new Vector2(270f, 25f));

            GameObject attackBtn = CreateButton("AttackButton", infoPanel.transform, "发起进攻",
                new Vector2(120f, 40f), new Vector2(0.5f, 0f), new Vector2(0f, 50f));
            GameObject enterBtn = CreateButton("EnterButton", infoPanel.transform, "进入",
                new Vector2(120f, 40f), new Vector2(0.5f, 0f), new Vector2(0f, 50f));
            GameObject closeBtn = CreateButton("CloseButton", infoPanel.transform, "关闭",
                new Vector2(80f, 30f), new Vector2(1f, 0f), new Vector2(-15f, 15f));

            GameObject playerInfoObj = CreateUIObject("PlayerInfoPanel", canvasObj.transform);
            RectTransform piRect = playerInfoObj.GetComponent<RectTransform>();
            piRect.anchorMin = new Vector2(0f, 1f);
            piRect.anchorMax = new Vector2(0f, 1f);
            piRect.pivot = new Vector2(0f, 1f);
            piRect.anchoredPosition = new Vector2(20f, -20f);
            piRect.sizeDelta = new Vector2(250f, 60f);

            Image piImg = playerInfoObj.AddComponent<Image>();
            piImg.color = new Color(0.15f, 0.12f, 0.1f, 0.8f);

            Text playerInfoText = CreateUIText("PlayerInfoText", playerInfoObj.transform, "当前位置: -\n状态: -", 14,
                TextAnchor.UpperLeft, new Vector2(10f, -10f), new Vector2(230f, 40f));

            GameObject messageObj = CreateUIObject("MessageText", canvasObj.transform);
            RectTransform msgRect = messageObj.GetComponent<RectTransform>();
            msgRect.anchorMin = new Vector2(0.5f, 0f);
            msgRect.anchorMax = new Vector2(0.5f, 0f);
            msgRect.pivot = new Vector2(0.5f, 0f);
            msgRect.anchoredPosition = new Vector2(0f, 100f);
            msgRect.sizeDelta = new Vector2(600f, 40f);

            Text messageText = messageObj.AddComponent<Text>();
            messageText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            messageText.fontSize = 20;
            messageText.alignment = TextAnchor.MiddleCenter;
            messageText.color = Color.yellow;

            SetPrivateField(ui, "infoPanel", infoPanel);
            SetPrivateField(ui, "nodeNameText", nodeNameText);
            SetPrivateField(ui, "nodeTypeText", nodeTypeText);
            SetPrivateField(ui, "nodeDescText", nodeDescText);
            SetPrivateField(ui, "nodeStatusText", nodeStatusText);
            SetPrivateField(ui, "attackButton", attackBtn.GetComponent<Button>());
            SetPrivateField(ui, "enterButton", enterBtn.GetComponent<Button>());
            SetPrivateField(ui, "closeButton", closeBtn.GetComponent<Button>());
            SetPrivateField(ui, "playerInfoText", playerInfoText);
            SetPrivateField(ui, "messageText", messageText);

            infoPanel.SetActive(false);
            messageObj.SetActive(false);
        }

        private static void CreateWorldMapManager()
        {
            GameObject wmmObj = new GameObject("WorldMapManager");
            WorldMapManager wmm = wmmObj.AddComponent<WorldMapManager>();

            MapNode[] allNodes = Object.FindObjectsOfType<MapNode>();
            MapNode startingNode = null;
            foreach (MapNode n in allNodes)
            {
                if (n.NodeType == NodeType.StartingPoint)
                {
                    startingNode = n;
                    break;
                }
            }

            SetPrivateField(wmm, "allNodes", allNodes);
            SetPrivateField(wmm, "startingNode", startingNode);

            GameObject playerMarker = GameObject.Find("PlayerMarker");
            if (playerMarker != null)
            {
                SetPrivateField(wmm, "playerMarker", playerMarker.transform);
            }
        }
        #endregion

        #region 战斗场景
        private static void CreateBattleGround()
        {
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Ground";
            ground.transform.localScale = new Vector3(10f, 1f, 10f);
            ground.transform.position = Vector3.zero;
            ground.GetComponent<Renderer>().sharedMaterial.color = new Color(0.4f, 0.5f, 0.3f);
        }

        private static void CreateBattleProps()
        {
            CreateBattleProp("Tree_1", PrimitiveType.Cylinder, new Vector3(-15f, 1.5f, -15f), new Vector3(1f, 3f, 1f), Color.green);
            CreateBattleProp("Tree_2", PrimitiveType.Cylinder, new Vector3(20f, 2f, -10f), new Vector3(1f, 4f, 1f), Color.green);
            CreateBattleProp("Rock_1", PrimitiveType.Sphere, new Vector3(-25f, 0.75f, 10f), new Vector3(2f, 1.5f, 2f), Color.gray);
            CreateBattleProp("Rock_2", PrimitiveType.Sphere, new Vector3(15f, 1f, 25f), new Vector3(2.5f, 2f, 2.5f), Color.gray);
        }

        private static void CreateBattleProp(string name, PrimitiveType type, Vector3 pos, Vector3 scale, Color color)
        {
            GameObject prop = GameObject.CreatePrimitive(type);
            prop.name = name;
            prop.transform.position = pos;
            prop.transform.localScale = scale;
            prop.GetComponent<Renderer>().sharedMaterial.color = color;
        }

        private static void CreateBattleCamera()
        {
            GameObject camObj = new GameObject("Main Camera");
            camObj.tag = "MainCamera";
            Camera cam = camObj.AddComponent<Camera>();
            cam.backgroundColor = new Color(0.5f, 0.6f, 0.7f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.fieldOfView = 60f;
            camObj.transform.position = new Vector3(0f, 8f, -10f);
            camObj.transform.rotation = Quaternion.Euler(30f, 0f, 0f);
            camObj.AddComponent<AudioListener>();
        }

        private static void CreateBattleSpawnPoints()
        {
            GameObject spawnsParent = new GameObject("SpawnPoints");

            GameObject playerSpawn = new GameObject("PlayerSpawn");
            playerSpawn.transform.SetParent(spawnsParent.transform);
            playerSpawn.transform.position = new Vector3(0f, 0f, -20f);

            Vector3[] enemyPositions = new Vector3[]
            {
                new Vector3(0f, 0f, 20f),
                new Vector3(-5f, 0f, 22f),
                new Vector3(5f, 0f, 22f),
                new Vector3(-8f, 0f, 18f),
                new Vector3(8f, 0f, 18f)
            };

            for (int i = 0; i < enemyPositions.Length; i++)
            {
                GameObject spawn = new GameObject($"EnemySpawn_{i}");
                spawn.transform.SetParent(spawnsParent.transform);
                spawn.transform.position = enemyPositions[i];
            }
        }

        private static void CreateBattleUI()
        {
            GameObject canvasObj = new GameObject("UI_Canvas");
            Canvas canvas = canvasObj.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            CanvasScaler scaler = canvasObj.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasObj.AddComponent<GraphicRaycaster>();

            BattleHUD hud = canvasObj.AddComponent<BattleHUD>();
            PauseMenuUI pause = canvasObj.AddComponent<PauseMenuUI>();
            BattleResultUI result = canvasObj.AddComponent<BattleResultUI>();

            GameObject healthPanel = CreateUIObject("PlayerHealthPanel", canvasObj.transform);
            RectTransform hpRect = healthPanel.GetComponent<RectTransform>();
            hpRect.anchorMin = new Vector2(0f, 1f);
            hpRect.anchorMax = new Vector2(0f, 1f);
            hpRect.pivot = new Vector2(0f, 1f);
            hpRect.anchoredPosition = new Vector2(20f, -20f);
            hpRect.sizeDelta = new Vector2(300f, 50f);

            Image hpPanelImg = healthPanel.AddComponent<Image>();
            hpPanelImg.color = new Color(0.1f, 0.1f, 0.1f, 0.7f);

            GameObject sliderObj = CreateUIObject("HealthSlider", healthPanel.transform);
            RectTransform sliderRect = sliderObj.GetComponent<RectTransform>();
            sliderRect.anchorMin = Vector2.zero;
            sliderRect.anchorMax = Vector2.one;
            sliderRect.offsetMin = new Vector2(10f, 10f);
            sliderRect.offsetMax = new Vector2(-10f, -10f);

            Slider slider = sliderObj.AddComponent<Slider>();
            slider.minValue = 0;
            slider.maxValue = 100;
            slider.value = 100;

            GameObject fillArea = CreateUIObject("Fill Area", sliderObj.transform);
            RectTransform fillAreaRect = fillArea.GetComponent<RectTransform>();
            fillAreaRect.anchorMin = Vector2.zero;
            fillAreaRect.anchorMax = Vector2.one;
            fillAreaRect.offsetMin = Vector2.zero;
            fillAreaRect.offsetMax = Vector2.zero;

            GameObject fill = CreateUIObject("Fill", fillArea.transform);
            RectTransform fillRect = fill.GetComponent<RectTransform>();
            fillRect.anchorMin = Vector2.zero;
            fillRect.anchorMax = new Vector2(1f, 1f);
            fillRect.offsetMin = Vector2.zero;
            fillRect.offsetMax = Vector2.zero;

            Image fillImg = fill.AddComponent<Image>();
            fillImg.color = Color.red;
            fillImg.type = Image.Type.Sliced;

            slider.fillRect = fillRect;

            GameObject healthTextObj = CreateUIObject("HealthText", healthPanel.transform);
            RectTransform htRect = healthTextObj.GetComponent<RectTransform>();
            htRect.anchorMin = Vector2.zero;
            htRect.anchorMax = Vector2.one;
            htRect.offsetMin = Vector2.zero;
            htRect.offsetMax = Vector2.zero;

            Text healthText = healthTextObj.AddComponent<Text>();
            healthText.text = "100 / 100";
            healthText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            healthText.fontSize = 18;
            healthText.alignment = TextAnchor.MiddleCenter;
            healthText.color = Color.white;
            healthText.fontStyle = FontStyle.Bold;

            GameObject enemyCountPanel = CreateUIObject("EnemyCountPanel", canvasObj.transform);
            RectTransform ecRect = enemyCountPanel.GetComponent<RectTransform>();
            ecRect.anchorMin = new Vector2(1f, 1f);
            ecRect.anchorMax = new Vector2(1f, 1f);
            ecRect.pivot = new Vector2(1f, 1f);
            ecRect.anchoredPosition = new Vector2(-20f, -20f);
            ecRect.sizeDelta = new Vector2(200f, 40f);

            Image ecImg = enemyCountPanel.AddComponent<Image>();
            ecImg.color = new Color(0.1f, 0.1f, 0.1f, 0.7f);

            Text enemyCountText = CreateUIText("EnemyCountText", enemyCountPanel.transform, "剩余敌人: 3", 18,
                TextAnchor.MiddleCenter, Vector2.zero, Vector2.zero);
            RectTransform ectRect = enemyCountText.GetComponent<RectTransform>();
            ectRect.anchorMin = Vector2.zero;
            ectRect.anchorMax = Vector2.one;
            ectRect.offsetMin = Vector2.zero;
            ectRect.offsetMax = Vector2.zero;

            GameObject locationObj = CreateUIObject("LocationText", canvasObj.transform);
            RectTransform locRect = locationObj.GetComponent<RectTransform>();
            locRect.anchorMin = new Vector2(0.5f, 1f);
            locRect.anchorMax = new Vector2(0.5f, 1f);
            locRect.pivot = new Vector2(0.5f, 1f);
            locRect.anchoredPosition = new Vector2(0f, -50f);
            locRect.sizeDelta = new Vector2(400f, 40f);

            Text locationText = locationObj.AddComponent<Text>();
            locationText.text = "战斗地点: 战场";
            locationText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            locationText.fontSize = 24;
            locationText.alignment = TextAnchor.MiddleCenter;
            locationText.color = Color.white;
            locationText.fontStyle = FontStyle.Bold;

            GameObject messageObj = CreateUIObject("MessageText", canvasObj.transform);
            RectTransform msgRect = messageObj.GetComponent<RectTransform>();
            msgRect.anchorMin = new Vector2(0.5f, 0f);
            msgRect.anchorMax = new Vector2(0.5f, 0f);
            msgRect.pivot = new Vector2(0.5f, 0f);
            msgRect.anchoredPosition = new Vector2(0f, 100f);
            msgRect.sizeDelta = new Vector2(600f, 40f);

            Text messageText = messageObj.AddComponent<Text>();
            messageText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            messageText.fontSize = 20;
            messageText.alignment = TextAnchor.MiddleCenter;
            messageText.color = Color.yellow;

            SetPrivateField(hud, "healthSlider", slider);
            SetPrivateField(hud, "healthText", healthText);
            SetPrivateField(hud, "playerHealthPanel", healthPanel);
            SetPrivateField(hud, "enemyCountText", enemyCountText);
            SetPrivateField(hud, "enemyCountPanel", enemyCountPanel);
            SetPrivateField(hud, "locationText", locationText);
            SetPrivateField(hud, "messageText", messageText);

            CreatePauseMenu(pause, canvasObj.transform);
            CreateBattleResultUI(result, canvasObj.transform);

            messageObj.SetActive(false);
        }

        private static void CreatePauseMenu(PauseMenuUI pause, Transform parent)
        {
            GameObject pausePanel = CreateUIObject("PausePanel", parent);
            RectTransform ppRect = pausePanel.GetComponent<RectTransform>();
            ppRect.anchorMin = Vector2.zero;
            ppRect.anchorMax = Vector2.one;
            ppRect.offsetMin = Vector2.zero;
            ppRect.offsetMax = Vector2.zero;

            Image ppImg = pausePanel.AddComponent<Image>();
            ppImg.color = new Color(0f, 0f, 0f, 0.7f);

            GameObject menuBox = CreateUIObject("MenuBox", pausePanel.transform);
            RectTransform mbRect = menuBox.GetComponent<RectTransform>();
            mbRect.anchorMin = new Vector2(0.5f, 0.5f);
            mbRect.anchorMax = new Vector2(0.5f, 0.5f);
            mbRect.pivot = new Vector2(0.5f, 0.5f);
            mbRect.sizeDelta = new Vector2(300f, 300f);

            Image mbImg = menuBox.AddComponent<Image>();
            mbImg.color = new Color(0.15f, 0.15f, 0.18f, 0.95f);

            Text titleText = CreateUIText("TitleText", menuBox.transform, "暂停", 36,
                TextAnchor.MiddleCenter, new Vector2(0f, -30f), new Vector2(200f, 50f));
            RectTransform ttRect = titleText.GetComponent<RectTransform>();
            ttRect.anchorMin = new Vector2(0.5f, 1f);
            ttRect.anchorMax = new Vector2(0.5f, 1f);

            GameObject resumeBtn = CreateButton("ResumeButton", menuBox.transform, "继续游戏",
                new Vector2(200f, 50f), new Vector2(0.5f, 0.5f), new Vector2(0f, 20f));
            GameObject optionsBtn = CreateButton("OptionsButton", menuBox.transform, "设置",
                new Vector2(200f, 50f), new Vector2(0.5f, 0.5f), new Vector2(0f, -40f));
            GameObject mainMenuBtn = CreateButton("MainMenuButton", menuBox.transform, "返回主菜单",
                new Vector2(200f, 50f), new Vector2(0.5f, 0.5f), new Vector2(0f, -100f));

            SetPrivateField(pause, "pausePanel", pausePanel);
            SetPrivateField(pause, "resumeButton", resumeBtn.GetComponent<Button>());
            SetPrivateField(pause, "optionsButton", optionsBtn.GetComponent<Button>());
            SetPrivateField(pause, "mainMenuButton", mainMenuBtn.GetComponent<Button>());
        }

        private static void CreateBattleResultUI(BattleResultUI result, Transform parent)
        {
            GameObject victoryPanel = CreateUIObject("VictoryPanel", parent);
            RectTransform vpRect = victoryPanel.GetComponent<RectTransform>();
            vpRect.anchorMin = Vector2.zero;
            vpRect.anchorMax = Vector2.one;
            vpRect.offsetMin = Vector2.zero;
            vpRect.offsetMax = Vector2.zero;

            Image vpImg = victoryPanel.AddComponent<Image>();
            vpImg.color = new Color(0f, 0.3f, 0f, 0.7f);

            Text victoryText = CreateUIText("VictoryText", victoryPanel.transform, "战斗胜利！", 48,
                TextAnchor.MiddleCenter, new Vector2(0f, 50f), new Vector2(400f, 80f));
            RectTransform vtRect = victoryText.GetComponent<RectTransform>();
            vtRect.anchorMin = new Vector2(0.5f, 0.5f);
            vtRect.anchorMax = new Vector2(0.5f, 0.5f);

            GameObject continueBtn = CreateButton("ContinueButton", victoryPanel.transform, "返回大地图",
                new Vector2(200f, 50f), new Vector2(0.5f, 0.5f), new Vector2(0f, -50f));

            GameObject defeatPanel = CreateUIObject("DefeatPanel", parent);
            RectTransform dpRect = defeatPanel.GetComponent<RectTransform>();
            dpRect.anchorMin = Vector2.zero;
            dpRect.anchorMax = Vector2.one;
            dpRect.offsetMin = Vector2.zero;
            dpRect.offsetMax = Vector2.zero;

            Image dpImg = defeatPanel.AddComponent<Image>();
            dpImg.color = new Color(0.3f, 0f, 0f, 0.7f);

            Text defeatText = CreateUIText("DefeatText", defeatPanel.transform, "战斗失败...", 48,
                TextAnchor.MiddleCenter, new Vector2(0f, 50f), new Vector2(400f, 80f));
            RectTransform dtRect = defeatText.GetComponent<RectTransform>();
            dtRect.anchorMin = new Vector2(0.5f, 0.5f);
            dtRect.anchorMax = new Vector2(0.5f, 0.5f);

            GameObject retryBtn = CreateButton("RetryButton", defeatPanel.transform, "重新挑战",
                new Vector2(200f, 50f), new Vector2(0.5f, 0.5f), new Vector2(0f, -20f));
            GameObject returnBtn = CreateButton("ReturnButton", defeatPanel.transform, "返回大地图",
                new Vector2(200f, 50f), new Vector2(0.5f, 0.5f), new Vector2(0f, -90f));

            SetPrivateField(result, "victoryPanel", victoryPanel);
            SetPrivateField(result, "defeatPanel", defeatPanel);
            SetPrivateField(result, "victoryContinueButton", continueBtn.GetComponent<Button>());
            SetPrivateField(result, "retryButton", retryBtn.GetComponent<Button>());
            SetPrivateField(result, "returnToMapButton", returnBtn.GetComponent<Button>());
            SetPrivateField(result, "victoryText", victoryText);
            SetPrivateField(result, "defeatText", defeatText);

            victoryPanel.SetActive(false);
            defeatPanel.SetActive(false);
        }

        private static void CreateBattleManager()
        {
            GameObject bmObj = new GameObject("BattleManager");
            BattleManager bm = bmObj.AddComponent<BattleManager>();

            GameObject playerPrefab = CreateDemoPlayerPrefab();
            GameObject enemyPrefab = CreateDemoEnemyPrefab();

            playerPrefab.SetActive(false);
            enemyPrefab.SetActive(false);

            GameObject playerSpawn = GameObject.Find("SpawnPoints/PlayerSpawn");

            Transform[] enemySpawns = new Transform[5];
            for (int i = 0; i < 5; i++)
            {
                GameObject spawn = GameObject.Find($"SpawnPoints/EnemySpawn_{i}");
                if (spawn != null) enemySpawns[i] = spawn.transform;
            }

            SetPrivateField(bm, "playerPrefab", playerPrefab);
            SetPrivateField(bm, "enemyPrefab", enemyPrefab);
            SetPrivateField(bm, "playerSpawnPoint", playerSpawn != null ? playerSpawn.transform : null);
            SetPrivateField(bm, "enemySpawnPoints", enemySpawns);

            bmObj.AddComponent<BattleInitializer>();
        }

        private static GameObject CreateDemoPlayerPrefab()
        {
            GameObject player = new GameObject("Player_Demo");
            player.tag = "Player";

            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            body.transform.SetParent(player.transform);
            body.transform.localPosition = Vector3.zero;
            body.GetComponent<Renderer>().sharedMaterial.color = Color.blue;

            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.transform.SetParent(player.transform);
            head.transform.localPosition = new Vector3(0f, 1.8f, 0f);
            head.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);
            head.GetComponent<Renderer>().sharedMaterial.color = Color.blue * 0.8f;

            GameObject weapon = GameObject.CreatePrimitive(PrimitiveType.Cube);
            weapon.transform.SetParent(player.transform);
            weapon.transform.localPosition = new Vector3(0.6f, 1.2f, 0.5f);
            weapon.transform.localScale = new Vector3(0.1f, 0.1f, 1.2f);
            weapon.GetComponent<Renderer>().sharedMaterial.color = Color.gray;

            CharacterController cc = player.AddComponent<CharacterController>();
            cc.height = 2f;
            cc.radius = 0.5f;
            cc.center = new Vector3(0f, 1f, 0f);

            CharacterHealth health = player.AddComponent<CharacterHealth>();
            health.Stats.maxHealth = 150f;
            health.Stats.health = 150f;
            health.Stats.attackPower = 25f;
            health.Stats.defense = 12f;
            health.Stats.moveSpeed = 5f;

            player.AddComponent<CharacterMotor>();
            player.AddComponent<CharacterCombat>();
            Animator anim = player.AddComponent<Animator>();
            player.AddComponent<Animation.CharacterAnimation>();
            player.AddComponent<PlayerController>();

            Collider[] colliders = player.GetComponentsInChildren<Collider>();
            foreach (Collider col in colliders)
            {
                if (col != cc) DestroyImmediate(col);
            }

            return player;
        }

        private static GameObject CreateDemoEnemyPrefab()
        {
            GameObject enemy = new GameObject("Enemy_Demo");

            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            body.transform.SetParent(enemy.transform);
            body.transform.localPosition = Vector3.zero;
            body.GetComponent<Renderer>().sharedMaterial.color = Color.red;

            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            head.transform.SetParent(enemy.transform);
            head.transform.localPosition = new Vector3(0f, 1.8f, 0f);
            head.transform.localScale = new Vector3(0.5f, 0.5f, 0.5f);
            head.GetComponent<Renderer>().sharedMaterial.color = Color.red * 0.8f;

            GameObject weapon = GameObject.CreatePrimitive(PrimitiveType.Cube);
            weapon.transform.SetParent(enemy.transform);
            weapon.transform.localPosition = new Vector3(0.6f, 1.2f, 0.5f);
            weapon.transform.localScale = new Vector3(0.1f, 0.1f, 1.2f);
            weapon.GetComponent<Renderer>().sharedMaterial.color = Color.gray;

            CharacterController cc = enemy.AddComponent<CharacterController>();
            cc.height = 2f;
            cc.radius = 0.5f;
            cc.center = new Vector3(0f, 1f, 0f);

            CharacterHealth health = enemy.AddComponent<CharacterHealth>();
            health.Stats.maxHealth = 80f;
            health.Stats.health = 80f;
            health.Stats.attackPower = 15f;
            health.Stats.defense = 5f;
            health.Stats.moveSpeed = 4f;

            enemy.AddComponent<CharacterMotor>();
            enemy.AddComponent<CharacterCombat>();
            Animator anim = enemy.AddComponent<Animator>();
            enemy.AddComponent<Animation.CharacterAnimation>();
            enemy.AddComponent<EnemyAI>();

            Collider[] colliders = enemy.GetComponentsInChildren<Collider>();
            foreach (Collider col in colliders)
            {
                if (col != cc) DestroyImmediate(col);
            }

            return enemy;
        }
        #endregion

        #region 通用工具
        private static void CreateGameManager()
        {
            if (GameManager.Instance != null) return;

            GameObject gmObj = new GameObject("GameManager");
            gmObj.AddComponent<GameManager>();
            gmObj.AddComponent<SceneController>();
        }

        private static GameObject CreateUIObject(string name, Transform parent)
        {
            GameObject obj = new GameObject(name, typeof(RectTransform));
            obj.transform.SetParent(parent, false);
            return obj;
        }

        private static Text CreateUIText(string name, Transform parent, string text, int fontSize,
            TextAnchor anchor, Vector2 anchoredPos, Vector2 size)
        {
            GameObject obj = CreateUIObject(name, parent);
            RectTransform rect = obj.GetComponent<RectTransform>();
            rect.anchoredPosition = anchoredPos;
            rect.sizeDelta = size;

            Text t = obj.AddComponent<Text>();
            t.text = text;
            t.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            t.fontSize = fontSize;
            t.alignment = anchor;
            t.color = Color.white;

            return t;
        }

        private static GameObject CreateButton(string name, Transform parent, string text,
            Vector2 size, Vector2 anchorPivot, Vector2 anchoredPos)
        {
            GameObject btnObj = CreateUIObject(name, parent);
            RectTransform btnRect = btnObj.GetComponent<RectTransform>();
            btnRect.anchorMin = anchorPivot;
            btnRect.anchorMax = anchorPivot;
            btnRect.pivot = anchorPivot;
            btnRect.anchoredPosition = anchoredPos;
            btnRect.sizeDelta = size;

            Image btnImg = btnObj.AddComponent<Image>();
            btnImg.color = new Color(0.3f, 0.3f, 0.35f, 0.9f);

            Button btn = btnObj.AddComponent<Button>();
            ColorBlock colors = btn.colors;
            colors.normalColor = new Color(0.35f, 0.3f, 0.25f);
            colors.highlightedColor = new Color(0.5f, 0.45f, 0.35f);
            colors.pressedColor = new Color(0.25f, 0.2f, 0.15f);
            btn.colors = colors;

            GameObject textObj = CreateUIObject("Text", btnObj.transform);
            RectTransform textRect = textObj.GetComponent<RectTransform>();
            textRect.anchorMin = Vector2.zero;
            textRect.anchorMax = Vector2.one;
            textRect.offsetMin = Vector2.zero;
            textRect.offsetMax = Vector2.zero;

            Text btnText = textObj.AddComponent<Text>();
            btnText.text = text;
            btnText.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            btnText.fontSize = 20;
            btnText.alignment = TextAnchor.MiddleCenter;
            btnText.color = new Color(0.95f, 0.9f, 0.8f);

            return btnObj;
        }

        private static void SetPrivateField(object obj, string fieldName, object value)
        {
            var field = obj.GetType().GetField(fieldName,
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(obj, value);
            }
        }
        #endregion
    }
}
#endif
