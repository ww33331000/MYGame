using UnityEngine;
using UnityEngine.UI;
using MedievalWarfare.Management;

namespace MedievalWarfare.UI
{
    public class BattleResultUI : MonoBehaviour
    {
        [Header("面板")]
        [SerializeField] private GameObject victoryPanel;
        [SerializeField] private GameObject defeatPanel;

        [Header("胜利按钮")]
        [SerializeField] private Button victoryContinueButton;
        [SerializeField] private Text victoryText;

        [Header("失败按钮")]
        [SerializeField] private Button retryButton;
        [SerializeField] private Button returnToMapButton;
        [SerializeField] private Text defeatText;

        protected virtual void Awake()
        {
            if (victoryContinueButton != null)
                victoryContinueButton.onClick.AddListener(OnVictoryContinue);
            if (retryButton != null)
                retryButton.onClick.AddListener(OnRetry);
            if (returnToMapButton != null)
                returnToMapButton.onClick.AddListener(OnReturnToMap);
        }

        protected virtual void Start()
        {
            if (victoryPanel != null)
                victoryPanel.SetActive(false);
            if (defeatPanel != null)
                defeatPanel.SetActive(false);

            Core.EventManager.Battle.OnBattleEnd += OnBattleEnd;
        }

        protected virtual void OnDestroy()
        {
            Core.EventManager.Battle.OnBattleEnd -= OnBattleEnd;

            if (victoryContinueButton != null)
                victoryContinueButton.onClick.RemoveListener(OnVictoryContinue);
            if (retryButton != null)
                retryButton.onClick.RemoveListener(OnRetry);
            if (returnToMapButton != null)
                returnToMapButton.onClick.RemoveListener(OnReturnToMap);
        }

        protected virtual void OnBattleEnd(bool victory)
        {
            if (victory)
            {
                ShowVictory();
            }
            else
            {
                ShowDefeat();
            }
        }

        public virtual void ShowVictory()
        {
            if (victoryPanel != null)
                victoryPanel.SetActive(true);
            if (defeatPanel != null)
                defeatPanel.SetActive(false);

            if (victoryText != null)
                victoryText.text = $"战斗胜利！\n地点: {BattleData.LocationName}";
        }

        public virtual void ShowDefeat()
        {
            if (victoryPanel != null)
                victoryPanel.SetActive(false);
            if (defeatPanel != null)
                defeatPanel.SetActive(true);

            if (defeatText != null)
                defeatText.text = $"战斗失败...\n地点: {BattleData.LocationName}";
        }

        protected virtual void OnVictoryContinue()
        {
            SceneController.Instance?.ReturnToWorldMap(true);
        }

        protected virtual void OnRetry()
        {
            SceneController.Instance?.RestartBattle();
        }

        protected virtual void OnReturnToMap()
        {
            SceneController.Instance?.ReturnToWorldMap(false);
        }
    }
}
