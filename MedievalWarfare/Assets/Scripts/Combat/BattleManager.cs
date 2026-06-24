using UnityEngine;
using System.Collections.Generic;
using MedievalWarfare.Character;
using MedievalWarfare.Core;

namespace MedievalWarfare.Combat
{
    public class BattleManager : MonoBehaviour
    {
        public static BattleManager Instance { get; private set; }

        [Header("战斗设置")]
        [SerializeField] private GameObject playerPrefab;
        [SerializeField] private GameObject enemyPrefab;
        [SerializeField] private Transform playerSpawnPoint;
        [SerializeField] private Transform[] enemySpawnPoints;
        [SerializeField] private float battleRadius = 50f;

        [Header("当前战斗数据")]
        [SerializeField] private int enemyCount = 3;
        [SerializeField] private float enemyHealthMultiplier = 1f;
        [SerializeField] private float enemyDamageMultiplier = 1f;

        private GameObject playerInstance;
        private List<GameObject> enemies = new List<GameObject>();
        private bool battleActive = false;
        private bool battleResult = false;

        public GameObject Player => playerInstance;
        public List<GameObject> Enemies => enemies;
        public bool BattleActive => battleActive;
        public int RemainingEnemies => enemies.Count;

        public System.Action<bool> OnBattleEnd;
        public System.Action<int> OnEnemyCountChanged;

        protected virtual void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        protected virtual void OnEnable()
        {
            EventManager.Character.OnCharacterDeath += OnCharacterDeath;
        }

        protected virtual void OnDisable()
        {
            EventManager.Character.OnCharacterDeath -= OnCharacterDeath;
        }

        public virtual void StartBattle(int enemyCountValue, float healthMult, float damageMult)
        {
            enemyCount = enemyCountValue;
            enemyHealthMultiplier = healthMult;
            enemyDamageMultiplier = damageMult;

            battleActive = true;
            battleResult = false;

            SpawnPlayer();
            SpawnEnemies();

            EventManager.Battle.OnBattleStart?.Invoke();
            EventManager.Battle.OnEnemyCountChanged?.Invoke(enemies.Count);

            Debug.Log($"战斗开始！敌人数量: {enemies.Count}");
        }

        protected virtual void SpawnPlayer()
        {
            if (playerPrefab == null || playerSpawnPoint == null) return;

            playerInstance = Instantiate(playerPrefab, playerSpawnPoint.position, playerSpawnPoint.rotation);
            playerInstance.tag = "Player";

            Camera battleCamera = Camera.main;
            if (battleCamera != null)
            {
                PlayerController pc = playerInstance.GetComponent<PlayerController>();
                if (pc != null)
                {
                    pc.SetCameraTransform(battleCamera.transform);
                }
            }
        }

        protected virtual void SpawnEnemies()
        {
            enemies.Clear();

            if (enemyPrefab == null || enemySpawnPoints == null || enemySpawnPoints.Length == 0) return;

            int spawnCount = Mathf.Min(enemyCount, enemySpawnPoints.Length);

            for (int i = 0; i < spawnCount; i++)
            {
                GameObject enemy = Instantiate(
                    enemyPrefab,
                    enemySpawnPoints[i].position,
                    enemySpawnPoints[i].rotation);

                CharacterHealth health = enemy.GetComponent<CharacterHealth>();
                if (health != null)
                {
                    float newMaxHealth = health.Stats.maxHealth * enemyHealthMultiplier;
                    health.SetMaxHealth(newMaxHealth);

                    health.Stats.attackPower *= enemyDamageMultiplier;
                }

                enemies.Add(enemy);
            }
        }

        protected virtual void OnCharacterDeath(GameObject deadCharacter)
        {
            if (!battleActive) return;

            if (deadCharacter == playerInstance)
            {
                EndBattle(false);
            }
            else if (enemies.Contains(deadCharacter))
            {
                enemies.Remove(deadCharacter);
                OnEnemyCountChanged?.Invoke(enemies.Count);
                EventManager.Battle.OnEnemyCountChanged?.Invoke(enemies.Count);

                if (enemies.Count == 0)
                {
                    EndBattle(true);
                }
            }
        }

        protected virtual void EndBattle(bool victory)
        {
            battleActive = false;
            battleResult = victory;

            OnBattleEnd?.Invoke(victory);
            EventManager.Battle.OnBattleEnd?.Invoke(victory);

            if (victory)
            {
                Debug.Log("战斗胜利！");
                GameManager.Instance?.ChangeState(GameState.Victory);
            }
            else
            {
                Debug.Log("战斗失败...");
                GameManager.Instance?.ChangeState(GameState.Defeat);
            }
        }

        public virtual void CleanupBattle()
        {
            if (playerInstance != null)
            {
                Destroy(playerInstance);
                playerInstance = null;
            }

            foreach (GameObject enemy in enemies)
            {
                if (enemy != null)
                {
                    Destroy(enemy);
                }
            }
            enemies.Clear();

            battleActive = false;
        }

        protected virtual void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, battleRadius);
        }
    }
}
