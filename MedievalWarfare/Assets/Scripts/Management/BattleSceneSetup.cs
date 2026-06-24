using UnityEngine;
using MedievalWarfare.Utils;
using MedievalWarfare.Combat;
using MedievalWarfare.Core;

namespace MedievalWarfare.Demo
{
    public class BattleSceneSetup : MonoBehaviour
    {
        [Header("地形设置")]
        [SerializeField] private float terrainSize = 100f;
        [SerializeField] private Color terrainColor = new Color(0.4f, 0.6f, 0.3f);

        [Header("玩家出生点")]
        [SerializeField] private Vector3 playerSpawnPos = new Vector3(0f, 0f, -20f);

        [Header("敌人出生点")]
        [SerializeField] private Vector3[] enemySpawnPositions = new Vector3[]
        {
            new Vector3(0f, 0f, 20f),
            new Vector3(-5f, 0f, 22f),
            new Vector3(5f, 0f, 22f),
            new Vector3(-8f, 0f, 18f),
            new Vector3(8f, 0f, 18f)
        };

        [Header("相机设置")]
        [SerializeField] private Vector3 cameraOffset = new Vector3(0f, 8f, -10f);
        [SerializeField] private Vector3 cameraRotation = new Vector3(30f, 0f, 0f);

        [Header("战斗设置")]
        [SerializeField] private int enemyCount = 3;
        [SerializeField] private float healthMultiplier = 1f;
        [SerializeField] private float damageMultiplier = 1f;

        protected virtual void Awake()
        {
            SetupTerrain();
            SetupCamera();
            SetupBattleManager();
        }

        protected virtual void Start()
        {
            GameManager.Instance?.ChangeState(GameState.Battle);

            BattleManager.Instance.StartBattle(enemyCount, healthMultiplier, damageMultiplier);
        }

        protected virtual void SetupTerrain()
        {
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.name = "Ground";
            ground.transform.localScale = new Vector3(terrainSize / 10f, 1f, terrainSize / 10f);
            Renderer groundRenderer = ground.GetComponent<Renderer>();
            if (groundRenderer != null)
            {
                groundRenderer.material.color = terrainColor;
            }

            CreateProp("Tree_1", PrimitiveType.Cylinder, new Vector3(-15f, 0f, -15f), new Vector3(1f, 3f, 1f), Color.green);
            CreateProp("Tree_2", PrimitiveType.Cylinder, new Vector3(20f, 0f, -10f), new Vector3(1f, 4f, 1f), Color.green);
            CreateProp("Rock_1", PrimitiveType.Sphere, new Vector3(-25f, 0f, 10f), new Vector3(2f, 1.5f, 2f), Color.gray);
            CreateProp("Rock_2", PrimitiveType.Sphere, new Vector3(15f, 0f, 25f), new Vector3(2.5f, 2f, 2.5f), Color.gray);
        }

        protected virtual void CreateProp(string name, PrimitiveType type, Vector3 position, Vector3 scale, Color color)
        {
            GameObject prop = GameObject.CreatePrimitive(type);
            prop.name = name;
            prop.transform.position = position;
            prop.transform.localScale = scale;
            Renderer renderer = prop.GetComponent<Renderer>();
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

            mainCam.transform.position = cameraOffset;
            mainCam.transform.rotation = Quaternion.Euler(cameraRotation);
            mainCam.orthographic = false;
            mainCam.fieldOfView = 60f;
        }

        protected virtual void SetupBattleManager()
        {
            if (BattleManager.Instance != null)
            {
                Destroy(BattleManager.Instance.gameObject);
            }

            GameObject bmObj = new GameObject("BattleManager");
            BattleManager bm = bmObj.AddComponent<BattleManager>();

            GameObject playerPrefab = DemoCharacterFactory.CreatePlayer(Vector3.zero, Quaternion.identity);
            playerPrefab.SetActive(false);
            playerPrefab.name = "PlayerPrefab_Demo";

            GameObject enemyPrefab = DemoCharacterFactory.CreateEnemy(Vector3.zero, Quaternion.identity);
            enemyPrefab.SetActive(false);
            enemyPrefab.name = "EnemyPrefab_Demo";

            System.Reflection.BindingFlags flags = System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance;

            bm.GetType().GetField("playerPrefab", flags)?.SetValue(bm, playerPrefab);
            bm.GetType().GetField("enemyPrefab", flags)?.SetValue(bm, enemyPrefab);

            GameObject playerSpawn = new GameObject("PlayerSpawn");
            playerSpawn.transform.position = playerSpawnPos;
            playerSpawn.transform.SetParent(bmObj.transform);
            bm.GetType().GetField("playerSpawnPoint", flags)?.SetValue(bm, playerSpawn.transform);

            System.Collections.Generic.List<Transform> spawnPoints = new System.Collections.Generic.List<Transform>();
            for (int i = 0; i < enemySpawnPositions.Length; i++)
            {
                GameObject spawn = new GameObject($"EnemySpawn_{i}");
                spawn.transform.position = enemySpawnPositions[i];
                spawn.transform.SetParent(bmObj.transform);
                spawnPoints.Add(spawn.transform);
            }
            bm.GetType().GetField("enemySpawnPoints", flags)?.SetValue(bm, spawnPoints.ToArray());
        }
    }
}
