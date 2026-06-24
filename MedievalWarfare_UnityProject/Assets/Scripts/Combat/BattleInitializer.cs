using UnityEngine;
using MedievalWarfare.Combat;
using MedievalWarfare.Management;
using MedievalWarfare.Core;

namespace MedievalWarfare.Combat
{
    public class BattleInitializer : MonoBehaviour
    {
        [SerializeField] private BattleManager battleManager;

        [Header("玩家预设")]
        [SerializeField] private GameObject playerPrefab;
        [SerializeField] private Transform playerSpawnPoint;

        [Header("敌人预设")]
        [SerializeField] private GameObject enemyPrefab;
        [SerializeField] private Transform[] enemySpawnPoints;

        protected virtual void Start()
        {
            InitializeBattle();
        }

        protected virtual void InitializeBattle()
        {
            if (battleManager == null)
            {
                battleManager = BattleManager.Instance;
            }

            if (battleManager == null)
            {
                GameObject bmObj = new GameObject("BattleManager");
                battleManager = bmObj.AddComponent<BattleManager>();
            }

            SetupBattleManager();

            int enemyCount = BattleData.EnemyCount > 0 ? BattleData.EnemyCount : 3;
            float healthMult = BattleData.HealthMultiplier > 0 ? BattleData.HealthMultiplier : 1f;
            float damageMult = BattleData.DamageMultiplier > 0 ? BattleData.DamageMultiplier : 1f;

            battleManager.StartBattle(enemyCount, healthMult, damageMult);
        }

        protected virtual void SetupBattleManager()
        {
            if (playerPrefab != null)
            {
                SetPrivateField(battleManager, "playerPrefab", playerPrefab);
            }
            if (enemyPrefab != null)
            {
                SetPrivateField(battleManager, "enemyPrefab", enemyPrefab);
            }
            if (playerSpawnPoint != null)
            {
                SetPrivateField(battleManager, "playerSpawnPoint", playerSpawnPoint);
            }
            if (enemySpawnPoints != null && enemySpawnPoints.Length > 0)
            {
                SetPrivateField(battleManager, "enemySpawnPoints", enemySpawnPoints);
            }
        }

        private void SetPrivateField(object obj, string fieldName, object value)
        {
            var field = obj.GetType().GetField(fieldName,
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(obj, value);
            }
        }
    }
}
