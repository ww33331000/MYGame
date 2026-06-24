using UnityEngine;
using UnityEngine.UI;
using MedievalWarfare.Character;
using MedievalWarfare.Combat;
using MedievalWarfare.Core;

namespace MedievalWarfare.UI
{
    public class BattleHUD : MonoBehaviour
    {
        [Header("玩家血条")]
        [SerializeField] private Slider healthSlider;
        [SerializeField] private Text healthText;
        [SerializeField] private GameObject playerHealthPanel;

        [Header("敌人信息")]
        [SerializeField] private Text enemyCountText;
        [SerializeField] private GameObject enemyCountPanel;

        [Header("战斗地点")]
        [SerializeField] private Text locationText;
        [SerializeField] private float locationDisplayDuration = 3f;

        [Header("消息提示")]
        [SerializeField] private Text messageText;
        [SerializeField] private float messageDuration = 2f;
        private float messageTimer = 0f;

        protected virtual void OnEnable()
        {
            EventManager.Character.OnHealthChanged += OnPlayerHealthChanged;
            EventManager.Battle.OnEnemyCountChanged += OnEnemyCountChanged;
            EventManager.UI.OnShowMessage += ShowMessage;
        }

        protected virtual void OnDisable()
        {
            EventManager.Character.OnHealthChanged -= OnPlayerHealthChanged;
            EventManager.Battle.OnEnemyCountChanged -= OnEnemyCountChanged;
            EventManager.UI.OnShowMessage -= ShowMessage;
        }

        protected virtual void Start()
        {
            UpdateEnemyCount();

            if (locationText != null)
            {
                locationText.text = $"战斗地点: {Management.BattleData.LocationName}";
                StartCoroutine(HideLocationText());
            }
        }

        protected virtual System.Collections.IEnumerator HideLocationText()
        {
            yield return new WaitForSeconds(locationDisplayDuration);
            if (locationText != null)
            {
                locationText.gameObject.SetActive(false);
            }
        }

        protected virtual void Update()
        {
            if (messageTimer > 0f)
            {
                messageTimer -= Time.deltaTime;
                if (messageTimer <= 0f && messageText != null)
                {
                    messageText.gameObject.SetActive(false);
                }
            }

            UpdatePlayerHealthFromBattleManager();
        }

        protected virtual void UpdatePlayerHealthFromBattleManager()
        {
            if (BattleManager.Instance == null || BattleManager.Instance.Player == null) return;

            CharacterHealth health = BattleManager.Instance.Player.GetComponent<CharacterHealth>();
            if (health != null)
            {
                UpdateHealthBar(health.Stats.health, health.Stats.maxHealth);
            }
        }

        protected virtual void OnPlayerHealthChanged(GameObject character, float current, float max)
        {
            if (BattleManager.Instance != null && character == BattleManager.Instance.Player)
            {
                UpdateHealthBar(current, max);
            }
        }

        protected virtual void UpdateHealthBar(float current, float max)
        {
            if (healthSlider != null)
            {
                healthSlider.maxValue = max;
                healthSlider.value = current;
            }

            if (healthText != null)
            {
                healthText.text = $"{Mathf.CeilToInt(current)} / {Mathf.CeilToInt(max)}";
            }
        }

        protected virtual void OnEnemyCountChanged(int count)
        {
            UpdateEnemyCount(count);
        }

        protected virtual void UpdateEnemyCount(int count = -1)
        {
            if (enemyCountText == null) return;

            int enemyCount = count >= 0 ? count :
                BattleManager.Instance != null ? BattleManager.Instance.RemainingEnemies : 0;

            enemyCountText.text = $"剩余敌人: {enemyCount}";
        }

        protected virtual void ShowMessage(string message)
        {
            if (messageText != null)
            {
                messageText.text = message;
                messageText.gameObject.SetActive(true);
                messageTimer = messageDuration;
            }
        }
    }
}
