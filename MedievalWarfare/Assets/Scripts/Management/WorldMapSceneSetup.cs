using UnityEngine;
using MedievalWarfare.Map;
using MedievalWarfare.Core;

namespace MedievalWarfare.Demo
{
    public class WorldMapSceneSetup : MonoBehaviour
    {
        [Header("地图设置")]
        [SerializeField] private float mapWidth = 200f;
        [SerializeField] private float mapHeight = 150f;
        [SerializeField] private Color mapColor = new Color(0.5f, 0.55f, 0.4f);

        [Header("相机设置")]
        [SerializeField] private float cameraHeight = 50f;
        [SerializeField] private float cameraSize = 60f;

        [Header("节点设置")]
        [SerializeField] private int nodeCount = 8;

        private MapNode[] nodes;

        protected virtual void Awake()
        {
            SetupMapGround();
            SetupCamera();
            CreateNodes();
            SetupWorldMapManager();
            SetupPlayerMarker();
        }

        protected virtual void Start()
        {
            GameManager.Instance?.ChangeState(GameState.WorldMap);
        }

        protected virtual void SetupMapGround()
        {
            GameObject mapGround = GameObject.CreatePrimitive(PrimitiveType.Plane);
            mapGround.name = "MapGround";
            mapGround.transform.localScale = new Vector3(mapWidth / 10f, 1f, mapHeight / 10f);
            mapGround.transform.position = Vector3.zero;
            Renderer groundRenderer = mapGround.GetComponent<Renderer>();
            if (groundRenderer != null)
            {
                groundRenderer.material.color = mapColor;
            }

            CreateTerrainFeature("Mountain_1", PrimitiveType.Sphere, new Vector3(-60f, 2f, 40f), new Vector3(15f, 10f, 15f), Color.gray);
            CreateTerrainFeature("Mountain_2", PrimitiveType.Sphere, new Vector3(50f, 1.5f, -50f), new Vector3(12f, 8f, 12f), Color.gray);
            CreateTerrainFeature("Forest_1", PrimitiveType.Cube, new Vector3(-40f, 0.5f, -30f), new Vector3(20f, 2f, 25f), new Color(0.2f, 0.4f, 0.2f));
            CreateTerrainFeature("Forest_2", PrimitiveType.Cube, new Vector3(30f, 0.5f, 30f), new Vector3(18f, 2f, 20f), new Color(0.2f, 0.4f, 0.2f));
            CreateTerrainFeature("River", PrimitiveType.Cube, new Vector3(0f, 0.6f, 0f), new Vector3(mapWidth, 0.5f, 8f), new Color(0.2f, 0.4f, 0.7f));
        }

        protected virtual void CreateTerrainFeature(string name, PrimitiveType type, Vector3 position, Vector3 scale, Color color)
        {
            GameObject feature = GameObject.CreatePrimitive(type);
            feature.name = name;
            feature.transform.position = position;
            feature.transform.localScale = scale;
            Renderer renderer = feature.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.color = color;
            }
        }

        protected virtual void SetupCamera()
        {
            Camera mainCam = Camera.main;
            if (mainCam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                camObj.tag = "MainCamera";
                mainCam = camObj.AddComponent<Camera>();
            }

            mainCam.transform.position = new Vector3(0f, cameraHeight, 0f);
            mainCam.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
            mainCam.orthographic = true;
            mainCam.orthographicSize = cameraSize;

            WorldMapCamera mapCam = mainCam.gameObject.GetComponent<WorldMapCamera>();
            if (mapCam == null)
            {
                mapCam = mainCam.gameObject.AddComponent<WorldMapCamera>();
            }
        }

        protected virtual void CreateNodes()
        {
            nodes = new MapNode[nodeCount];

            nodes[0] = CreateMapNode("斯瓦迪亚城堡", NodeType.Castle, new Vector3(-70f, 1f, -50f), Color.blue, 3f, true, 5, 1.2f, 1.1f,
                "斯瓦迪亚王国的边境城堡，驻扎着精锐骑士部队。");

            nodes[1] = CreateMapNode("帕拉汶村", NodeType.Village, new Vector3(-30f, 1f, -40f), Color.yellow, 2f, false, 0, 1f, 1f,
                "安静的小村庄，村民们过着平和的生活。");

            nodes[2] = CreateMapNode("绿林强盗营地", NodeType.BanditLair, new Vector3(-20f, 1f, 10f), Color.red, 2.5f, true, 3, 0.9f, 1f,
                "盘踞在森林边缘的强盗营地，危险但战利品丰厚。");

            nodes[3] = CreateMapNode("日瓦丁镇", NodeType.Town, new Vector3(20f, 1f, -20f), Color.cyan, 3.5f, false, 0, 1f, 1f,
                "繁华的商业城镇，各种交易在此进行。");

            nodes[4] = CreateMapNode("库吉特前哨", NodeType.EnemyCamp, new Vector3(60f, 1f, 10f), Color.magenta, 3f, true, 4, 1.1f, 1.2f,
                "库吉特汗国的前沿哨站，骑兵机动性极强。");

            nodes[5] = CreateMapNode("罗多克要塞", NodeType.Castle, new Vector3(50f, 1f, 50f), Color.green, 3f, true, 6, 1.3f, 1f,
                "罗多克王国的山地要塞，易守难攻。");

            nodes[6] = CreateMapNode("维基亚村庄", NodeType.Village, new Vector3(0f, 1f, 60f), Color.yellow, 2f, false, 0, 1f, 1f,
                "雪原上的小村落，以狩猎为生。");

            nodes[7] = CreateMapNode("起始据点", NodeType.StartingPoint, new Vector3(-60f, 1f, -20f), Color.white, 2.5f, false, 0, 1f, 1f,
                "你的冒险从这里开始。");

            ConnectNodes(7, 1);
            ConnectNodes(7, 0);
            ConnectNodes(0, 1);
            ConnectNodes(1, 2);
            ConnectNodes(1, 3);
            ConnectNodes(2, 3);
            ConnectNodes(2, 6);
            ConnectNodes(3, 4);
            ConnectNodes(3, 6);
            ConnectNodes(4, 5);
            ConnectNodes(4, 6);
            ConnectNodes(5, 6);
        }

        protected virtual MapNode CreateMapNode(string name, NodeType type, Vector3 position, Color color, float radius,
            bool hasEnemy, int enemyCount, float healthMult, float damageMult, string description)
        {
            GameObject nodeObj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            nodeObj.name = $"MapNode_{name}";
            nodeObj.transform.position = position;
            nodeObj.transform.localScale = Vector3.one * radius * 2f;

            Renderer renderer = nodeObj.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.color = color;
            }

            MapNode node = nodeObj.AddComponent<MapNode>();

            System.Reflection.BindingFlags flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;
            node.GetType().GetField("nodeName", flags)?.SetValue(node, name);
            node.GetType().GetField("nodeType", flags)?.SetValue(node, type);
            node.GetType().GetField("nodeColor", flags)?.SetValue(node, color);
            node.GetType().GetField("nodeRadius", flags)?.SetValue(node, radius);
            node.GetType().GetField("hasEnemy", flags)?.SetValue(node, hasEnemy);
            node.GetType().GetField("enemyCount", flags)?.SetValue(node, enemyCount);
            node.GetType().GetField("enemyHealthMultiplier", flags)?.SetValue(node, healthMult);
            node.GetType().GetField("enemyDamageMultiplier", flags)?.SetValue(node, damageMult);
            node.GetType().GetField("description", flags)?.SetValue(node, description);

            return node;
        }

        protected virtual void ConnectNodes(int indexA, int indexB)
        {
            if (nodes[indexA] == null || nodes[indexB] == null) return;

            MapNode[] aConnections = nodes[indexA].ConnectedNodes;
            MapNode[] bConnections = nodes[indexB].ConnectedNodes;

            System.Array.Resize(ref aConnections, aConnections == null ? 1 : aConnections.Length + 1);
            System.Array.Resize(ref bConnections, bConnections == null ? 1 : bConnections.Length + 1);

            aConnections[aConnections.Length - 1] = nodes[indexB];
            bConnections[bConnections.Length - 1] = nodes[indexA];

            System.Reflection.BindingFlags flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;
            nodes[indexA].GetType().GetField("connectedNodes", flags)?.SetValue(nodes[indexA], aConnections);
            nodes[indexB].GetType().GetField("connectedNodes", flags)?.SetValue(nodes[indexB], bConnections);

            DrawConnectionLine(nodes[indexA], nodes[indexB]);
        }

        protected virtual void DrawConnectionLine(MapNode a, MapNode b)
        {
            GameObject lineObj = new GameObject($"Connection_{a.name}_{b.name}");
            LineRenderer line = lineObj.AddComponent<LineRenderer>();
            line.material = new Material(Shader.Find("Sprites/Default"));
            line.startColor = new Color(1f, 1f, 1f, 0.5f);
            line.endColor = new Color(1f, 1f, 1f, 0.5f);
            line.startWidth = 0.5f;
            line.endWidth = 0.5f;
            line.positionCount = 2;
            line.SetPosition(0, a.transform.position);
            line.SetPosition(1, b.transform.position);
        }

        protected virtual void SetupWorldMapManager()
        {
            GameObject wmmObj = new GameObject("WorldMapManager");
            WorldMapManager wmm = wmmObj.AddComponent<WorldMapManager>();

            System.Reflection.BindingFlags flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;
            wmm.GetType().GetField("allNodes", flags)?.SetValue(wmm, nodes);
            wmm.GetType().GetField("startingNode", flags)?.SetValue(wmm, nodes[7]);
        }

        protected virtual void SetupPlayerMarker()
        {
            GameObject marker = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            marker.name = "PlayerMarker";
            marker.transform.localScale = new Vector3(1.5f, 2f, 1.5f);
            Renderer markerRenderer = marker.GetComponent<Renderer>();
            if (markerRenderer != null)
            {
                markerRenderer.material.color = Color.yellow;
            }

            Collider col = marker.GetComponent<Collider>();
            if (col != null)
            {
                Destroy(col);
            }

            System.Reflection.BindingFlags flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;
            WorldMapManager.Instance.GetType().GetField("playerMarker", flags)?.SetValue(WorldMapManager.Instance, marker.transform);
        }
    }
}
