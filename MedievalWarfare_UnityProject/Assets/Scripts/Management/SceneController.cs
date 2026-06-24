using UnityEngine;
using UnityEngine.SceneManagement;
using MedievalWarfare.Core;
using MedievalWarfare.Map;
using MedievalWarfare.Combat;

namespace MedievalWarfare.Management
{
    public class SceneController : MonoBehaviour
    {
        public static SceneController Instance { get; private set; }

        [Header("场景名称")]
        [SerializeField] private string mainMenuScene = "MainMenu";
        [SerializeField] private string worldMapScene = "WorldMap";
        [SerializeField] private string battleScene = "BattleScene";

        [Header("过渡设置")]
        [SerializeField] private float fadeDuration = 1f;

        private bool isTransitioning = false;
        private AsyncOperation asyncOperation;

        public bool IsTransitioning => isTransitioning;

        public System.Action OnTransitionStart;
        public System.Action OnTransitionComplete;

        protected virtual void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public virtual void LoadMainMenu()
        {
            StartCoroutine(LoadSceneCoroutine(mainMenuScene, GameState.MainMenu));
        }

        public virtual void LoadWorldMap()
        {
            StartCoroutine(LoadSceneCoroutine(worldMapScene, GameState.WorldMap));
        }

        public virtual void LoadBattle()
        {
            StartCoroutine(LoadSceneCoroutine(battleScene, GameState.Battle));
        }

        protected virtual System.Collections.IEnumerator LoadSceneCoroutine(string sceneName, GameState targetState)
        {
            if (isTransitioning) yield break;

            isTransitioning = true;
            OnTransitionStart?.Invoke();

            asyncOperation = SceneManager.LoadSceneAsync(sceneName);
            asyncOperation.allowSceneActivation = false;

            float timer = 0f;
            while (timer < fadeDuration)
            {
                timer += Time.deltaTime;
                yield return null;
            }

            while (asyncOperation.progress < 0.9f)
            {
                yield return null;
            }

            asyncOperation.allowSceneActivation = true;

            while (!asyncOperation.isDone)
            {
                yield return null;
            }

            GameManager.Instance?.ChangeState(targetState);

            isTransitioning = false;
            OnTransitionComplete?.Invoke();

            Debug.Log($"场景加载完成: {sceneName}");
        }

        public virtual void StartBattleFromMap()
        {
            if (WorldMapManager.Instance == null) return;

            MapNode currentNode = WorldMapManager.Instance.CurrentNode;
            if (currentNode == null || !currentNode.HasEnemy || currentNode.IsDefeated) return;

            BattleData.EnemyCount = currentNode.EnemyCount;
            BattleData.HealthMultiplier = currentNode.EnemyHealthMultiplier;
            BattleData.DamageMultiplier = currentNode.EnemyDamageMultiplier;
            BattleData.LocationName = currentNode.NodeName;

            LoadBattle();
        }

        public virtual void ReturnToWorldMap(bool victory)
        {
            if (victory && WorldMapManager.Instance != null)
            {
                WorldMapManager.Instance.DefeatCurrentNodeEnemies();
            }

            LoadWorldMap();
        }

        public virtual void RestartBattle()
        {
            LoadBattle();
        }
    }

    public static class BattleData
    {
        public static int EnemyCount = 3;
        public static float HealthMultiplier = 1f;
        public static float DamageMultiplier = 1f;
        public static string LocationName = "未知地点";
    }
}
